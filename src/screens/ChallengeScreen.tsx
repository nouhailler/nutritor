import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { Challenge, DailyCheckIn, ProtocolId } from '../types/challenge';
import {
  PROTOCOLS,
  ProtocolDef,
  createChallenge,
  getCompletionPct,
  getDayNumber,
  getStreak,
  getTodayCheckIn,
} from '../data/challenge';

// ── Progress ring ─────────────────────────────────────────────

function ProgressRing({ pct, color, day, total }: { pct: number; color: string; day: number; total: number }) {
  const r = 52;
  const size = 120;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(1, pct));
  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.hairline} strokeWidth={7} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={7} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringDay, { color }]}>{day}</Text>
        <Text style={styles.ringOf}>/{total}</Text>
      </View>
    </View>
  );
}

// ── Objective row ─────────────────────────────────────────────

function ObjectiveRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.objRow, checked && styles.objRowDone]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.objCheck, checked && styles.objCheckDone]}>
        {checked && <Icon name="check" size={13} color={Colors.paper2} />}
      </View>
      <Text style={[styles.objLabel, checked && styles.objLabelDone]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Mini calendar ─────────────────────────────────────────────

function MiniCalendar({ challenge, todayStr }: { challenge: Challenge; todayStr: string }) {
  const { t } = useTranslation();
  const checkInMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const ci of challenge.checkIns) {
      m[ci.date] = ci.completedObjectiveIds.length > 0;
    }
    return m;
  }, [challenge.checkIns]);

  const cells = useMemo(() => {
    const result: { date: string; status: 'done' | 'partial' | 'missed' | 'future' | 'today' }[] = [];
    const start = new Date(challenge.startDate + 'T12:00:00');
    for (let i = 0; i < challenge.durationDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr > todayStr) {
        result.push({ date: dateStr, status: 'future' });
      } else if (dateStr === todayStr) {
        result.push({ date: dateStr, status: 'today' });
      } else {
        result.push({ date: dateStr, status: checkInMap[dateStr] ? 'done' : 'missed' });
      }
    }
    return result;
  }, [challenge, todayStr, checkInMap]);

  return (
    <View style={styles.calCard}>
      <Text style={styles.calTitle}>{t('challenge.history')}</Text>
      <View style={styles.calGrid}>
        {cells.map((cell, i) => (
          <View
            key={cell.date}
            style={[
              styles.calDot,
              cell.status === 'done'    && styles.calDotDone,
              cell.status === 'missed'  && styles.calDotMissed,
              cell.status === 'today'   && styles.calDotToday,
              cell.status === 'future'  && styles.calDotFuture,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Protocol picker card ──────────────────────────────────────

function ProtocolCard({ def, onStart }: { def: ProtocolDef; onStart: () => void }) {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language !== 'en';
  const name = t(`challenge.protocols.${def.id}.label`);
  const desc = t(`challenge.protocols.${def.id}.desc`);
  return (
    <TouchableOpacity style={[styles.protoCard, { borderColor: def.color }]} onPress={onStart} activeOpacity={0.8}>
      <View style={styles.protoHeader}>
        <Text style={styles.protoEmoji}>{def.emoji}</Text>
        <View style={styles.protoMeta}>
          <Text style={[styles.protoName, { color: def.color }]}>{name}</Text>
          <Text style={styles.protoDuration}>{t('challenge.days', { count: def.durationDays })}</Text>
        </View>
      </View>
      <Text style={styles.protoDesc}>{desc}</Text>
      <View style={[styles.protoBtn, { backgroundColor: def.color }]}>
        <Text style={styles.protoBtnText}>{t('challenge.start')}</Text>
        <Icon name="arrow-right" size={14} color={Colors.paper2} />
      </View>
    </TouchableOpacity>
  );
}

// ── Challenge Screen ──────────────────────────────────────────

interface ChallengeScreenProps {
  challenge: Challenge | null;
  onSaveChallenge: (c: Challenge) => void;
  onAbandon: () => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenFodmap: () => void;
}

export function ChallengeScreen({
  challenge,
  onSaveChallenge,
  onAbandon,
  onBack,
  onOpenMenu,
  onOpenFodmap,
}: ChallengeScreenProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFr = i18n.language !== 'en';

  const handleStart = (protocolId: ProtocolId) => {
    const newChallenge = createChallenge(protocolId);
    if (protocolId === 'fodmap-elimination') {
      onSaveChallenge(newChallenge);
      onOpenFodmap();
    } else {
      onSaveChallenge(newChallenge);
    }
  };

  const [confirmingAbandon, setConfirmingAbandon] = useState(false);

  const handleToggleObjective = (objId: string) => {
    if (!challenge) return;
    const existing = getTodayCheckIn(challenge, todayStr);
    let completed: string[];
    if (existing) {
      if (existing.completedObjectiveIds.includes(objId)) {
        completed = existing.completedObjectiveIds.filter((id) => id !== objId);
      } else {
        completed = [...existing.completedObjectiveIds, objId];
      }
    } else {
      completed = [objId];
    }
    const newCheckIn: DailyCheckIn = {
      date: todayStr,
      completedObjectiveIds: completed,
    };
    const updatedChallenge: Challenge = {
      ...challenge,
      checkIns: [
        ...challenge.checkIns.filter((c) => c.date !== todayStr),
        newCheckIn,
      ],
    };
    onSaveChallenge(updatedChallenge);
  };

  // ── No active challenge — picker ──────────────────────────────
  if (!challenge || !challenge.active) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={22} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>{t('challenge.subtitle')}</Text>
          <Text style={styles.pageTitle}>{t('challenge.noChallengeTitle')}</Text>
          <Text style={styles.pageDesc}>{t('challenge.noChallengeDesc')}</Text>
          <View style={styles.protoList}>
            {PROTOCOLS.map((def) => (
              <ProtocolCard key={def.id} def={def} onStart={() => handleStart(def.id)} />
            ))}
          </View>
          {/* FODMAP quick-link */}
          <TouchableOpacity style={styles.fodmapLink} onPress={onOpenFodmap} activeOpacity={0.7}>
            <Icon name="shield" size={16} color={Colors.muted} />
            <Text style={styles.fodmapLinkText}>{t('challenge.openFodmap')}</Text>
            <Icon name="chevron-right" size={14} color={Colors.muted2} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Active challenge — dashboard ──────────────────────────────
  const dayNumber = getDayNumber(challenge);
  const pct = getCompletionPct(challenge);
  const streak = getStreak(challenge);
  const todayCheckIn = getTodayCheckIn(challenge, todayStr);
  const completedIds = todayCheckIn?.completedObjectiveIds ?? [];
  const allDone = completedIds.length === challenge.objectives.length;
  const protocol = PROTOCOLS.find((p) => p.id === challenge.protocolId) ?? PROTOCOLS[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text style={styles.eyebrow}>{t('challenge.subtitle')}</Text>
        <Text style={styles.pageTitle}>
          {protocol.emoji} {t(`challenge.protocols.${challenge.protocolId}.label`)}
        </Text>

        {/* Progress card */}
        <View style={[styles.heroCard, { borderColor: protocol.color + '40' }]}>
          <ProgressRing
            pct={pct}
            color={protocol.color}
            day={dayNumber}
            total={challenge.durationDays}
          />
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaLabel}>{t('challenge.dayLabel')}</Text>
            <Text style={[styles.heroMetaBig, { color: protocol.color }]}>
              {t('challenge.dayOf', { day: dayNumber, total: challenge.durationDays })}
            </Text>
            <View style={styles.streakRow}>
              <Icon name="zap" size={13} color={Colors.signal} />
              <Text style={styles.streakText}>
                {t('challenge.streak', { count: streak, s: streak !== 1 ? 's' : '' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Today's objectives */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('challenge.objectives')}</Text>
          <Text style={styles.sectionSub}>
            {t('challenge.objectivesDone', { done: completedIds.length, total: challenge.objectives.length })}
          </Text>
        </View>

        {allDone && (
          <View style={styles.allDoneBanner}>
            <Icon name="award" size={16} color={Colors.ok} />
            <Text style={styles.allDoneText}>{t('challenge.dayDone')}</Text>
          </View>
        )}

        <View style={styles.objList}>
          {challenge.objectives.map((obj) => (
            <ObjectiveRow
              key={obj.id}
              label={isFr ? obj.label : obj.labelEn}
              checked={completedIds.includes(obj.id)}
              onToggle={() => handleToggleObjective(obj.id)}
            />
          ))}
        </View>

        {/* Category legend */}
        <View style={styles.legendRow}>
          {(['food', 'habit', 'tracking'] as const).map((cat) => {
            const count = challenge.objectives.filter((o) => o.category === cat).length;
            if (count === 0) return null;
            return (
              <View key={cat} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CAT_COLORS[cat] }]} />
                <Text style={styles.legendText}>{t(`challenge.categories.${cat}`)}</Text>
              </View>
            );
          })}
        </View>

        {/* Mini calendar */}
        <MiniCalendar challenge={challenge} todayStr={todayStr} />

        {/* FODMAP link for FODMAP protocol */}
        {challenge.protocolId === 'fodmap-elimination' && (
          <TouchableOpacity style={styles.fodmapLink} onPress={onOpenFodmap} activeOpacity={0.7}>
            <Icon name="shield" size={16} color={Colors.muted} />
            <Text style={styles.fodmapLinkText}>{t('challenge.openFodmap')}</Text>
            <Icon name="chevron-right" size={14} color={Colors.muted2} />
          </TouchableOpacity>
        )}

        {/* Abandon */}
        {confirmingAbandon ? (
          <View style={styles.abandonConfirm}>
            <Text style={styles.abandonConfirmText}>{t('challenge.abandonConfirm')}</Text>
            <View style={styles.abandonConfirmRow}>
              <TouchableOpacity style={styles.abandonCancelBtn} onPress={() => setConfirmingAbandon(false)} activeOpacity={0.7}>
                <Text style={styles.abandonCancelText}>{t('challenge.abandonCancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.abandonOkBtn} onPress={onAbandon} activeOpacity={0.7}>
                <Text style={styles.abandonOkText}>{t('challenge.abandonOk')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.abandonBtn} onPress={() => setConfirmingAbandon(true)} activeOpacity={0.7}>
            <Icon name="x-circle" size={15} color={Colors.warn} />
            <Text style={styles.abandonText}>{t('challenge.abandon')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const CAT_COLORS: Record<string, string> = {
  food:     Colors.ok,
  habit:    Colors.signal,
  tracking: '#2E5A8B',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 48 },

  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginTop: 22,
    marginBottom: 6,
  },
  pageTitle: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Protocol picker
  protoList: { gap: 14 },
  protoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 12,
  },
  protoHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  protoEmoji: { fontSize: 32 },
  protoMeta: { flex: 1 },
  protoName: { fontFamily: Fonts.serif, fontSize: 20, letterSpacing: -0.3 },
  protoDuration: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1.5, color: Colors.muted, marginTop: 2 },
  protoDesc: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.muted, lineHeight: 19 },
  protoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  protoBtnText: { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: Colors.paper2 },

  // FODMAP link
  fodmapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
  },
  fodmapLinkText: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted },

  // Dashboard hero
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginTop: 14,
    marginBottom: 24,
  },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDay: { fontFamily: Fonts.serif, fontSize: 30, letterSpacing: -1 },
  ringOf: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, marginTop: -4 },

  heroMeta: { flex: 1, gap: 4 },
  heroMetaLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted2 },
  heroMetaBig: { fontFamily: Fonts.serif, fontSize: 22, letterSpacing: -0.3 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  streakText: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.signal },

  // Objectives
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  sectionSub: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },

  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(63,90,58,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  allDoneText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.ok },

  objList: { gap: 8 },
  objRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  objRowDone: { borderColor: Colors.ok + '50', backgroundColor: 'rgba(63,90,58,0.06)' },
  objCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  objCheckDone: { backgroundColor: Colors.ok, borderColor: Colors.ok },
  objLabel: { flex: 1, fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.ink2, lineHeight: 19 },
  objLabelDone: { color: Colors.muted, textDecorationLine: 'line-through' },

  // Legend
  legendRow: { flexDirection: 'row', gap: 14, marginTop: 10, marginBottom: 24, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },

  // Calendar
  calCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    padding: 18,
    marginBottom: 16,
  },
  calTitle: { fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink, marginBottom: 14 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.hairline2,
  },
  calDotDone:   { backgroundColor: Colors.ok },
  calDotMissed: { backgroundColor: Colors.warn + '60' },
  calDotToday:  { backgroundColor: Colors.signal, borderWidth: 2, borderColor: Colors.signal },
  calDotFuture: { backgroundColor: Colors.hairline2, opacity: 0.5 },

  // Abandon
  abandonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  abandonText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.warn },

  abandonConfirm: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warn + '40',
    padding: 16,
    gap: 12,
  },
  abandonConfirmText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.ink2,
    textAlign: 'center',
  },
  abandonConfirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  abandonCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.hairline2,
    alignItems: 'center',
  },
  abandonCancelText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.ink2, fontWeight: '500' },
  abandonOkBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.warn + '18',
    borderWidth: 1,
    borderColor: Colors.warn + '60',
    alignItems: 'center',
  },
  abandonOkText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.warn, fontWeight: '600' },
});
