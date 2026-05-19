import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';
import {
  AutoTimelineEvent,
  AutoEventKind,
  UserTimelineEvent,
  MiniMetric,
  DaySummaryLine,
  QUICK_SYMPTOMS,
  QuickSymptomKey,
  EventCategory,
  EventIntensity,
} from '../types/timeline';
import { addMinutes } from '../services/timelineService';

// ── Category color palette ─────────────────────────────────────

const CATEGORY_COLOR: Record<EventCategory, string> = {
  meal:        Colors.ink,
  cognitive:   '#9B7340',   // warm amber — caféine, vigilance
  metabolic:   '#3A5A8B',   // slate blue — glycémie, satiété
  digestive:   '#3F5A3A',   // forest green — FODMAP, digestion
  nutritional: '#5A3A8B',   // plum — protéines
};

const LEVEL_COLOR = { ok: Colors.ok, mid: Colors.signal, warn: Colors.warn };

// ── Helpers ────────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function intensityToDotSize(intensity: EventIntensity): number {
  return intensity === 'high' ? 12 : intensity === 'mid' ? 10 : 8;
}

function intensityToOpacity(intensity: EventIntensity): number {
  return intensity === 'low' ? 0.55 : 1.0;
}

// ── Mini metrics strip ─────────────────────────────────────────

function MetricChip({ metric, onPress }: { metric: MiniMetric; onPress: () => void }) {
  const col = LEVEL_COLOR[metric.level];
  return (
    <TouchableOpacity
      style={[s.metricChip, { borderColor: col + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={s.metricEmoji}>{metric.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.metricLabel}>{metric.label}</Text>
        <Text style={[s.metricValue, { color: col }]}>{metric.value}</Text>
      </View>
      <Icon name="info" size={11} color={col + '99'} />
    </TouchableOpacity>
  );
}

// ── Metric detail modal ────────────────────────────────────────

const METRIC_EXPL: Record<string, string> = {
  'Énergie':   'Calculé à partir des pics de caféine, de la taille des repas et des creux post-prandiaux détectés sur la journée.',
  'Digestion': 'Évalue la charge fermentative (FODMAP) et la vitesse de digestion des lipides au fil de la journée.',
  'FODMAP':    'Les FODMAP sont des sucres peu absorbés qui fermentent dans le côlon. En cas de syndrome de l\'intestin irritable (SII), ils peuvent provoquer ballonnements, crampes et diarrhée.',
  'Glycémie':  'Un pic glycémique survient après un repas riche en glucides. Il déclenche l\'insuline et peut provoquer un creux d\'énergie 1–2 h plus tard.',
};

const METRIC_ADVICE: Record<string, Partial<Record<'ok' | 'mid' | 'warn', string>>> = {
  'Énergie': {
    mid:  'Énergie variable — la caféine ou un repas copieux peut provoquer un creux en milieu d\'après-midi.',
    warn: 'Plusieurs creux post-prandiaux — privilégier des repas plus légers ou une sieste courte de 10–20 min.',
  },
  'Digestion': {
    mid:  'Digestion modérée — une marche après le repas aide à accélérer le transit.',
    warn: 'Digestion chargée — éviter l\'effort physique intense dans les 2 h suivant le repas.',
  },
  'FODMAP': {
    mid:  'Charge modérée — généralement bien toléré sauf en cas de SII actif.',
    warn: 'Charge élevée — si tu souffres du SII, des symptômes digestifs sont probables cet après-midi.',
  },
  'Glycémie': {
    mid:  'Élévation modérée — normale pour un repas mixte. L\'activité physique post-repas aide à utiliser le glucose.',
    warn: 'Charge glycémique élevée — associer fibres, protéines et lipides aux glucides pour amortir les pics.',
  },
};

function MetricDetailModal({
  visible,
  metric,
  events,
  onClose,
}: {
  visible: boolean;
  metric: MiniMetric | null;
  events: AutoTimelineEvent[];
  onClose: () => void;
}) {
  if (!metric) return null;
  const col  = LEVEL_COLOR[metric.level];
  const expl = METRIC_EXPL[metric.label] ?? '';
  const tip  = METRIC_ADVICE[metric.label]?.[metric.level] ?? null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <View style={s.detailHeaderLeft}>
              <Text style={s.detailEmoji}>{metric.emoji}</Text>
              <Text style={s.modalTitle}>{metric.label}</Text>
              <View style={[s.levelBadge, { backgroundColor: col + '22', borderColor: col + '55' }]}>
                <Text style={[s.levelBadgeText, { color: col }]}>{metric.value}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={s.detailExpl}>{expl}</Text>

          {events.length > 0 ? (
            <>
              <Text style={s.detailSectionLabel}>Événements détectés</Text>
              {events.map((ev, i) => {
                const dotColor = CATEGORY_COLOR[ev.category];
                const endTime  = ev.durationMin ? addMinutes(ev.time, ev.durationMin) : null;
                return (
                  <View key={i} style={s.detailEvent}>
                    <Text style={s.detailEventEmoji}>{ev.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailEventLabel}>{ev.label}</Text>
                      {ev.sublabel && <Text style={s.detailEventSub}>{ev.sublabel}</Text>}
                      <Text style={s.detailEventTime}>
                        {ev.time}{endTime ? ` → ${endTime}` : ''}
                      </Text>
                    </View>
                    <View style={[s.intensityPill, { backgroundColor: dotColor + '22', borderColor: dotColor + '44' }]}>
                      <Text style={[s.intensityPillText, { color: dotColor }]}>
                        {ev.intensity === 'high' ? 'fort' : ev.intensity === 'mid' ? 'modéré' : 'faible'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={s.detailNoEvent}>Aucun événement significatif détecté pour cette métrique aujourd'hui.</Text>
          )}

          {tip && (
            <View style={[s.detailTip, { borderLeftColor: col }]}>
              <Text style={s.detailTipText}>{tip}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Day summary card ───────────────────────────────────────────

function DaySummaryCard({ lines }: { lines: DaySummaryLine[] }) {
  if (lines.length === 0) return null;
  return (
    <View style={s.summaryCard}>
      <View style={s.summaryHeader}>
        <Icon name="activity" size={13} color={Colors.muted} />
        <Text style={s.summaryTitle}>Lecture de la journée</Text>
      </View>
      {lines.map((line, i) => (
        <View key={i} style={s.summaryRow}>
          <View style={[s.summaryDot, { backgroundColor: LEVEL_COLOR[line.kind] }]} />
          <Text style={s.summaryText}>{line.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Severity dots ──────────────────────────────────────────────

function SeverityDots({ value, onPress }: { value: number; onPress?: (v: number) => void }) {
  return (
    <View style={s.severityRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          style={[s.severityDot, n <= value && s.severityDotFilled]}
          onPress={onPress ? () => onPress(n) : undefined}
          activeOpacity={onPress ? 0.7 : 1}
          disabled={!onPress}
        />
      ))}
    </View>
  );
}

// ── Quick-add modal ────────────────────────────────────────────

const SYMPTOM_KEYS = Object.keys(QUICK_SYMPTOMS) as QuickSymptomKey[];

function QuickAddModal({
  visible,
  date,
  onAdd,
  onClose,
}: {
  visible: boolean;
  date: string;
  onAdd: (event: Omit<UserTimelineEvent, 'id' | 'kind'>) => void;
  onClose: () => void;
}) {
  const [time, setTime] = useState(nowHHMM);
  const [symptom, setSymptom] = useState<QuickSymptomKey>('bloating');
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState('');

  const handleOpen = () => {
    setTime(nowHHMM());
    setNote('');
    setSeverity(3);
  };

  const handleAdd = () => {
    const t = time.trim().match(/^\d{1,2}:\d{2}$/) ? time.trim() : nowHHMM();
    onAdd({ date, time: t, symptom, severity, note: note.trim() || undefined });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleOpen}
      onRequestClose={onClose}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Ajouter un ressenti</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={s.modalLabel}>Heure</Text>
          <TextInput
            style={s.timeInput}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            placeholderTextColor={Colors.muted2}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          <Text style={s.modalLabel}>Type</Text>
          <View style={s.chipGrid}>
            {SYMPTOM_KEYS.map((key) => {
              const sym = QUICK_SYMPTOMS[key];
              const active = symptom === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSymptom(key)}
                  activeOpacity={0.7}
                >
                  <Text style={s.chipEmoji}>{sym.emoji}</Text>
                  <Text style={[s.chipLabel, active && s.chipLabelActive]}>{sym.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.modalLabel}>Intensité</Text>
          <View style={s.severityPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.severityBtn, n === severity && s.severityBtnActive]}
                onPress={() => setSeverity(n)}
                activeOpacity={0.7}
              >
                <Text style={[s.severityBtnText, n === severity && s.severityBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Note courte (optionnel)…"
            placeholderTextColor={Colors.muted2}
            maxLength={120}
          />

          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={s.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Auto event row ─────────────────────────────────────────────

function AutoRow({ event }: { event: AutoTimelineEvent }) {
  const isMeal   = event.type === 'meal';
  const dotSize  = intensityToDotSize(event.intensity);
  const opacity  = intensityToOpacity(event.intensity);
  const dotColor = CATEGORY_COLOR[event.category];
  const endTime  = event.durationMin ? addMinutes(event.time, event.durationMin) : null;

  return (
    <View style={[s.row, { opacity }]}>
      {/* Time column */}
      <View style={s.timeCol}>
        <Text style={[s.timeText, isMeal && s.timeTextMeal]}>{event.time}</Text>
        {endTime && <Text style={s.timeEndText}>↓ {endTime}</Text>}
      </View>

      {/* Line + dot column */}
      <View style={s.lineCol}>
        <View style={[
          s.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          isMeal
            ? { backgroundColor: dotColor }
            : event.intensity === 'low'
              ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: dotColor }
              : { backgroundColor: dotColor },
        ]} />
      </View>

      {/* Label column */}
      <View style={s.labelCol}>
        <View style={s.labelInner}>
          <Text style={s.autoEmoji}>{event.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[
              s.autoLabel,
              isMeal && s.autoLabelMeal,
              event.intensity === 'high' && s.autoLabelStrong,
              event.intensity === 'low'  && s.autoLabelMuted,
            ]}>
              {event.label}
            </Text>
            {event.sublabel && (
              <Text style={s.sublabel}>{event.sublabel}</Text>
            )}
          </View>
          {event.intensity === 'high' && (
            <View style={[s.intensityBadge, { backgroundColor: dotColor + '22', borderColor: dotColor + '44' }]}>
              <Text style={[s.intensityBadgeText, { color: dotColor }]}>fort</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── User event row ─────────────────────────────────────────────

function UserRow({
  event,
  onDelete,
}: {
  event: UserTimelineEvent;
  onDelete?: () => void;
}) {
  const sym = QUICK_SYMPTOMS[event.symptom];
  return (
    <View style={s.row}>
      <View style={s.timeCol}>
        <Text style={[s.timeText, s.timeTextUser]}>{event.time}</Text>
      </View>
      <View style={s.lineCol}>
        <View style={s.dotUser} />
      </View>
      <View style={s.labelCol}>
        <View style={s.userBadge}>
          <Text style={s.userBadgeEmoji}>{sym.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.userLabelText}>{sym.label}</Text>
            {event.note ? <Text style={s.userNote}>{event.note}</Text> : null}
          </View>
          <SeverityDots value={event.severity} />
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={s.deleteBtn} activeOpacity={0.7}>
              <Icon name="close" size={10} color={Colors.muted2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Now marker ─────────────────────────────────────────────────

function NowMarker({ time }: { time: string }) {
  return (
    <View style={s.nowRow}>
      <View style={s.timeCol}>
        <Text style={s.nowTimeText}>{time}</Text>
      </View>
      <View style={s.lineCol}>
        <View style={s.nowDot} />
      </View>
      <View style={s.labelCol}>
        <View style={s.nowLine} />
        <Text style={s.nowLabel}>Maintenant</Text>
      </View>
    </View>
  );
}

// ── Connector line ─────────────────────────────────────────────

function ConnectorLine({ color }: { color?: string }) {
  return (
    <View style={s.connectorRow}>
      <View style={s.timeCol} />
      <View style={s.lineCol}>
        <View style={[s.connector, { backgroundColor: color ?? Colors.hairline }]} />
      </View>
      <View style={s.labelCol} />
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────

interface PhysioTimelineProps {
  autoEvents: AutoTimelineEvent[];
  userEvents: UserTimelineEvent[];
  miniMetrics: MiniMetric[];
  daySummary: DaySummaryLine[];
  date: string;
  isToday: boolean;
  onAddEvent: (event: Omit<UserTimelineEvent, 'id' | 'kind'>) => void;
  onDeleteEvent: (id: string) => void;
}

const METRIC_EVENT_TYPES: Record<string, AutoEventKind[]> = {
  'Énergie':   ['caffeine', 'vigilance', 'postprandial', 'satiety'],
  'Digestion': ['fermentation', 'digestion'],
  'FODMAP':    ['fermentation'],
  'Glycémie':  ['glycemic', 'postprandial'],
};

export function PhysioTimeline({
  autoEvents,
  userEvents,
  miniMetrics,
  daySummary,
  date,
  isToday,
  onAddEvent,
  onDeleteEvent,
}: PhysioTimelineProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailMetric, setDetailMetric] = useState<{
    metric: MiniMetric;
    events: AutoTimelineEvent[];
  } | null>(null);

  const currentHHMM = useMemo(() => nowHHMM(), []);

  const combined: Array<AutoTimelineEvent | UserTimelineEvent | { kind: 'now'; time: string }> =
    useMemo(() => {
      const all: Array<AutoTimelineEvent | UserTimelineEvent | { kind: 'now'; time: string }> = [
        ...autoEvents,
        ...userEvents,
      ];
      if (isToday) {
        all.push({ kind: 'now', time: currentHHMM });
      }
      all.sort((a, b) => parseTime(a.time) - parseTime(b.time));
      return all;
    }, [autoEvents, userEvents, isToday, currentHHMM]);

  const hasContent = combined.length > 0;

  return (
    <View style={s.container}>

      {/* Mini metrics strip */}
      {miniMetrics.length > 0 && (
        <View style={s.metricsStrip}>
          {miniMetrics.map((m) => (
            <MetricChip
              key={m.label}
              metric={m}
              onPress={() => setDetailMetric({
                metric: m,
                events: autoEvents.filter((e) => METRIC_EVENT_TYPES[m.label]?.includes(e.type) ?? false),
              })}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {!hasContent && isToday && (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>Ajoutez des repas pour voir la timeline physiologique</Text>
        </View>
      )}

      {/* Timeline rows */}
      {combined.map((event, idx) => {
        const isLast = idx === combined.length - 1;

        let row: React.ReactNode;
        let connectorColor: string = Colors.hairline;

        if (event.kind === 'now') {
          row = <NowMarker key="now" time={(event as { kind: 'now'; time: string }).time} />;
          connectorColor = Colors.signal + '60';
        } else if (event.kind === 'auto') {
          const ae = event as AutoTimelineEvent;
          row = <AutoRow key={`${ae.type}-${ae.time}-${ae.mealId}`} event={ae} />;
          connectorColor = ae.durationMin
            ? CATEGORY_COLOR[ae.category] + '40'
            : Colors.hairline;
        } else {
          const ue = event as UserTimelineEvent;
          row = (
            <UserRow
              key={ue.id}
              event={ue}
              onDelete={isToday ? () => onDeleteEvent(ue.id) : undefined}
            />
          );
        }

        return (
          <React.Fragment key={idx}>
            {row}
            {!isLast && <ConnectorLine color={connectorColor} />}
          </React.Fragment>
        );
      })}

      {/* Add button — today only */}
      {isToday && (
        <TouchableOpacity
          style={s.addEventBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={12} color={Colors.ink} />
          <Text style={s.addEventBtnText}>Ajouter un ressenti</Text>
        </TouchableOpacity>
      )}

      {/* Day summary */}
      {daySummary.length > 0 && (
        <DaySummaryCard lines={daySummary} />
      )}

      <MetricDetailModal
        visible={detailMetric !== null}
        metric={detailMetric?.metric ?? null}
        events={detailMetric?.events ?? []}
        onClose={() => setDetailMetric(null)}
      />

      <QuickAddModal
        visible={modalVisible}
        date={date}
        onAdd={onAddEvent}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const TIME_COL_W = 52;
const LINE_COL_W = 24;

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 4 },

  // Metrics strip
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.card,
    minWidth: '45%',
    flex: 1,
  },
  metricEmoji: { fontSize: 16 },
  metricLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  metricValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ink,
    letterSpacing: -0.1,
    marginTop: 1,
  },

  // Metric detail modal
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailEmoji: { fontSize: 20 },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  detailExpl: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
  },
  detailSectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: Colors.muted,
    marginTop: 4,
  },
  detailEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  detailEventEmoji: { fontSize: 15 },
  detailEventLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
  },
  detailEventSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  detailEventTime: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  intensityPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'center' as const,
  },
  intensityPillText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  detailNoEvent: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted2,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  detailTip: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  detailTipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink,
    lineHeight: 18,
  },

  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 26,
  },
  connectorRow: {
    flexDirection: 'row',
    height: 14,
  },
  timeCol: {
    width: TIME_COL_W,
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingTop: 2,
  },
  lineCol: {
    width: LINE_COL_W,
    alignItems: 'center',
    paddingTop: 4,
  },
  labelCol: {
    flex: 1,
    paddingBottom: 4,
  },
  labelInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flex: 1,
  },

  // Connector
  connector: {
    width: 1.5,
    flex: 1 as number,
  },

  // Time
  timeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.2,
  },
  timeTextMeal: {
    color: Colors.muted,
    fontFamily: Fonts.monoMedium,
  },
  timeTextUser: {
    color: Colors.muted,
    fontFamily: Fonts.monoMedium,
  },
  timeEndText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.1,
    marginTop: 2,
    opacity: 0.7,
  },

  // Dot (base — overridden inline)
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Auto event label
  autoEmoji: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 1,
  },
  autoLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
  },
  autoLabelMeal: {
    color: Colors.ink,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  autoLabelStrong: {
    color: Colors.ink,
    fontFamily: Fonts.sansMedium,
  },
  autoLabelMuted: {
    color: Colors.muted2,
  },
  sublabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.3,
    color: Colors.muted2,
    marginTop: 2,
  },
  intensityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  intensityBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },

  // User event
  dotUser: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.ok,
    marginTop: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flex: 1,
  },
  userBadgeEmoji: { fontSize: 15 },
  userLabelText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
  },
  userNote: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  deleteBtn: { padding: 4 },

  // Severity display dots
  severityRow: { flexDirection: 'row', gap: 3 },
  severityDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.hairline,
    borderWidth: 1, borderColor: Colors.muted2,
  },
  severityDotFilled: {
    backgroundColor: Colors.ok,
    borderColor: Colors.ok,
  },

  // Now marker
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  nowTimeText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: Colors.signal,
    letterSpacing: 0.3,
  },
  nowDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.signal,
  },
  nowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.signal,
    opacity: 0.35,
  },
  nowLabel: {
    position: 'absolute',
    right: 0,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.signal,
  },

  // Empty
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted2,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Add event button
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginLeft: TIME_COL_W + LINE_COL_W,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  addEventBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ink,
  },

  // Day summary card
  summaryCard: {
    marginTop: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  summaryTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: -0.1,
    color: Colors.muted,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  summaryText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  modalLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: -6,
  },
  timeInput: {
    fontFamily: Fonts.monoMedium,
    fontSize: 20,
    color: Colors.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.hairline,
    paddingVertical: 4,
    letterSpacing: 2,
    width: 80,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.muted,
  },
  chipLabelActive: { color: Colors.paper },
  severityPicker: {
    flexDirection: 'row',
    gap: 10,
  },
  severityBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  severityBtnActive: {
    borderColor: Colors.ink, backgroundColor: Colors.ink,
  },
  severityBtnText: {
    fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.muted,
  },
  severityBtnTextActive: { color: Colors.paper },
  noteInput: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.card,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1, height: 46, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.hairline,
  },
  cancelBtnText: {
    fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.muted,
  },
  addBtn: {
    flex: 2, height: 46, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.ink,
  },
  addBtnText: {
    fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.paper,
  },
});
