import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import {
  DayLog,
  WeekStats,
  WeekDayData,
  MEAL_SLOT_NAMES,
  MEAL_SLOT_SHORT,
  computeWeekStats,
} from '../data/weeklyStats';
import { UserProfile } from '../data/user';
import { Meal } from '../types/index';
import { Colors, Fonts } from '../theme/tokens';

// ── Design tokens ─────────────────────────────────────────────

const BAR_H    = 120;
const SPARK_H  = 28;
const RING_R   = 26;
const RING_S   = 5.5;
const RING_SIZE = 72;  // viewBox / container
const BIG_RING_R = 44;
const BIG_RING_S = 7;
const BIG_RING_SIZE = 110;

const MACRO_COLORS = {
  p: '#3a352b',
  c: '#6b5a2e',
  f: '#a89569',
} as const;

const SCORE_COLOR = (s: number) =>
  s >= 80 ? Colors.ok : s >= 55 ? Colors.signal : Colors.warn;

// ── Helpers ───────────────────────────────────────────────────

function arcPath(r: number, pct: number, cx = 50, cy = 50): string {
  const clamped = Math.min(0.9999, Math.max(0, pct));
  const angle = clamped * 2 * Math.PI;
  const x1 = cx + r * Math.cos(-Math.PI / 2);
  const y1 = cy + r * Math.sin(-Math.PI / 2);
  const x2 = cx + r * Math.cos(-Math.PI / 2 + angle);
  const y2 = cy + r * Math.sin(-Math.PI / 2 + angle);
  const large = angle > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// ── ChartCard wrapper ─────────────────────────────────────────

function ChartCard({
  title,
  sub,
  legend,
  children,
}: {
  title: string;
  sub: string;
  legend?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{sub}</Text>
        </View>
        {legend ? <Text style={styles.cardLegend}>{legend}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// ── Score ring ────────────────────────────────────────────────

function ScoreRing({ score, loggedDays }: { score: number; loggedDays: number }) {
  const pct = score / 100;
  const cx = BIG_RING_SIZE / 2;
  const cy = BIG_RING_SIZE / 2;
  const color = SCORE_COLOR(score);

  return (
    <View style={styles.scoreWrap}>
      {/* Ring */}
      <View style={styles.scoreRingContainer}>
        <Svg width={BIG_RING_SIZE} height={BIG_RING_SIZE}>
          {/* Background track */}
          <Circle
            cx={cx} cy={cy} r={BIG_RING_R}
            fill="none"
            stroke={Colors.hairline2}
            strokeWidth={BIG_RING_S}
          />
          {/* Progress */}
          {pct > 0 && (
            <Path
              d={arcPath(BIG_RING_R, pct, cx, cy)}
              fill="none"
              stroke={color}
              strokeWidth={BIG_RING_S}
              strokeLinecap="round"
            />
          )}
        </Svg>
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color }]}>{score}</Text>
          <Text style={styles.scoreUnit}>/100</Text>
        </View>
      </View>
      {/* Label */}
      <View style={styles.scoreLabel}>
        <Text style={styles.scoreLabelTitle}>Score semaine</Text>
        <Text style={styles.scoreLabelSub}>{loggedDays} jour{loggedDays > 1 ? 's' : ''} enregistré{loggedDays > 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

// ── KPI strip ─────────────────────────────────────────────────

function KpiStrip({ stats, profile }: { stats: WeekStats; profile: UserProfile }) {
  const items = [
    {
      label: 'Moy. kcal',
      value: stats.loggedDays > 0 ? `${stats.avgKcal}` : '—',
      sub: `/ ${profile.kcalTarget}`,
    },
    {
      label: 'Cible kcal',
      value: `${stats.daysOnKcalTarget}/7`,
      sub: 'jours',
    },
    {
      label: 'Série',
      value: `${stats.currentStreak}`,
      sub: 'j consécutifs',
    },
    {
      label: 'Aliments',
      value: `${stats.uniqueFoodsWeek}`,
      sub: 'uniques / sem.',
    },
  ];

  return (
    <View style={styles.kpiStrip}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={styles.kpiDivider} />}
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>
            <Text style={styles.kpiSub}>{item.sub}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Kcal bar chart ────────────────────────────────────────────

function KcalBars({ days, target }: { days: WeekDayData[]; target: number }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const maxKcal = Math.max(...days.map((d) => d.log?.kcal ?? 0), target) * 1.08;
  const targetY = maxKcal > 0 ? ((maxKcal - target) / maxKcal) * BAR_H : 0;

  return (
    <View
      style={styles.barsWrap}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Svg
          width={containerWidth}
          height={BAR_H}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Line
            x1={0} y1={targetY}
            x2={containerWidth} y2={targetY}
            stroke={Colors.muted2}
            strokeWidth={1}
            strokeDasharray="5,3"
          />
        </Svg>
      )}
      {days.map((d) => {
        const kcal = d.log?.kcal ?? 0;
        const barH = d.isToday
          ? 12
          : d.isFuture
          ? 0
          : !d.log
          ? 3
          : Math.max(3, (kcal / maxKcal) * BAR_H);
        const over = !d.isToday && !d.isFuture && kcal > target * 1.1;
        const empty = !d.log || kcal === 0;

        return (
          <View key={d.date} style={styles.barCol}>
            {!d.isFuture && (
              <View
                style={[
                  styles.bar,
                  { height: barH },
                  d.isToday && styles.barToday,
                  over && styles.barOver,
                  empty && !d.isToday && styles.barEmpty,
                ]}
              />
            )}
            {d.isFuture && <View style={{ height: BAR_H }} />}
            <Text style={[styles.barDayLabel, d.isToday && styles.barDayToday]}>
              {d.dayLabel}
            </Text>
            {!d.isToday && !d.isFuture && d.log && d.log.kcal > 0 && (
              <Text style={styles.barKcal}>{d.log.kcal}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Macro ring ────────────────────────────────────────────────

function MacroRing({
  label,
  avg,
  target,
  unit,
  color,
}: {
  label: string;
  avg: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(1, avg / target) : 0;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <View style={styles.macroRingWrap}>
      <View style={styles.macroRingContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={cx} cy={cy} r={RING_R}
            fill="none"
            stroke={Colors.hairline2}
            strokeWidth={RING_S}
          />
          {pct > 0 && (
            <Path
              d={arcPath(RING_R, pct, cx, cy)}
              fill="none"
              stroke={color}
              strokeWidth={RING_S}
              strokeLinecap="round"
            />
          )}
        </Svg>
        <View style={styles.macroRingCenter}>
          <Text style={[styles.macroRingPct, { color }]}>{Math.round(pct * 100)}</Text>
          <Text style={styles.macroRingPctSign}>%</Text>
        </View>
      </View>
      <Text style={styles.macroRingAvg}>{avg}{unit}</Text>
      <Text style={styles.macroRingLabel}>{label}</Text>
      <Text style={styles.macroRingTarget}>obj. {target}{unit}</Text>
    </View>
  );
}

// ── Macro sparklines ──────────────────────────────────────────

function MacroSparkline({
  values,
  color,
  max,
  gradId,
}: {
  values: number[];
  color: string;
  max: number;
  gradId: string;
}) {
  const [width, setWidth] = useState(0);
  const H = SPARK_H;
  const pts = width > 0
    ? values.map((v, i) => ({
        x: values.length > 1 ? (i / (values.length - 1)) * width : width / 2,
        y: H - (max > 0 ? (v / max) * (H - 4) : 0) - 2,
      }))
    : [];
  const line = pts.length > 1
    ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';
  const area = pts.length > 1 ? `${line} L ${width} ${H} L 0 ${H} Z` : '';

  return (
    <View style={{ flex: 1, height: H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && pts.length > 1 && (
        <Svg width={width} height={H}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.28" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gradId})`} />
          <Path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />)}
        </Svg>
      )}
    </View>
  );
}

function MacroSparklines({ days }: { days: WeekDayData[] }) {
  const p = days.map((d) => d.log?.p ?? 0);
  const c = days.map((d) => d.log?.c ?? 0);
  const f = days.map((d) => d.log?.f ?? 0);

  const rows = [
    { label: 'Protéines', values: p, color: MACRO_COLORS.p, max: Math.max(...p, 1) * 1.2, id: 'sg-p' },
    { label: 'Glucides',  values: c, color: MACRO_COLORS.c, max: Math.max(...c, 1) * 1.2, id: 'sg-c' },
    { label: 'Lipides',   values: f, color: MACRO_COLORS.f, max: Math.max(...f, 1) * 1.2, id: 'sg-f' },
  ];

  return (
    <View style={styles.sparkRows}>
      {rows.map((row) => (
        <View key={row.label} style={styles.sparkRow}>
          <Text style={styles.sparkLabel}>{row.label}</Text>
          <MacroSparkline values={row.values} color={row.color} max={row.max} gradId={row.id} />
          <Text style={styles.sparkVal}>{Math.round(row.values.filter((v) => v > 0).reduce((a, b) => a + b, 0) / Math.max(1, row.values.filter((v) => v > 0).length))} g</Text>
        </View>
      ))}
    </View>
  );
}

// ── Meal adherence grid ───────────────────────────────────────

function MealGrid({ days }: { days: WeekDayData[] }) {
  return (
    <View style={styles.gridWrap}>
      {/* Header row: day labels */}
      <View style={styles.gridRow}>
        <View style={styles.gridSlotLabel} />
        {days.map((d) => (
          <View key={d.date} style={styles.gridDayCell}>
            <Text style={[styles.gridDayLabel, d.isToday && styles.gridDayToday]}>
              {d.dayLabel}
            </Text>
            <Text style={[styles.gridDayNum, d.isToday && styles.gridDayNumToday]}>
              {d.dayNum}
            </Text>
          </View>
        ))}
      </View>

      {/* Slot rows */}
      {MEAL_SLOT_NAMES.map((slot, si) => (
        <View key={slot} style={styles.gridRow}>
          <View style={styles.gridSlotLabel}>
            <Text style={styles.gridSlotText}>{MEAL_SLOT_SHORT[si]}</Text>
          </View>
          {days.map((d) => {
            const logged  = d.log?.mealSlots.includes(slot) ?? false;
            const future  = d.isFuture;
            const noData  = !d.log && !d.isFuture;
            return (
              <View key={d.date} style={styles.gridDotCell}>
                <View
                  style={[
                    styles.gridDot,
                    logged  && styles.gridDotFilled,
                    future  && styles.gridDotFuture,
                    noData  && styles.gridDotNoData,
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Insights list ─────────────────────────────────────────────

function InsightsList({ insights }: { insights: WeekStats['insights'] }) {
  return (
    <View style={styles.insightsList}>
      {insights.map((item, i) => (
        <View key={i} style={styles.insightRow}>
          <Text style={styles.insightLabel}>{item.label}</Text>
          <Text
            style={[
              styles.insightTrend,
              item.tone === 'good' && styles.toneGood,
              item.tone === 'warn' && styles.toneWarn,
              item.tone === 'mid'  && styles.toneMid,
            ]}
          >
            {item.trend}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Stats Screen ──────────────────────────────────────────────

interface Props {
  journal: DayLog[];
  todayMeals: Meal[];
  profile: UserProfile;
}

export function StatsScreen({ journal, todayMeals, profile }: Props) {
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);

  const stats = computeWeekStats(journal, todayMeals, profile, weekOffset);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Topbar ────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <Text style={styles.eyebrow}>Semaine {stats.weekLabel}</Text>
            <Text style={styles.title}>Statistiques</Text>
          </View>
          <HelpButton onPress={() => setHelpVisible(true)} />
        </View>
        <HelpModal visible={helpVisible} content={HELP.stats} onClose={() => setHelpVisible(false)} />

        {/* ── Week navigation ───────────────────────────────── */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setWeekOffset((o) => o - 1)}
            activeOpacity={0.7}
          >
            <Icon name="back" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.weekNavLabel}>{stats.weekLabel}</Text>
          <TouchableOpacity
            style={[styles.navBtn, weekOffset >= 0 && styles.navBtnDisabled]}
            onPress={() => weekOffset < 0 && setWeekOffset((o) => o + 1)}
            activeOpacity={weekOffset < 0 ? 0.7 : 1}
          >
            <Icon name="arrow-right" size={16} color={weekOffset < 0 ? Colors.ink : Colors.muted2} />
          </TouchableOpacity>
        </View>

        {/* ── Score + KPIs ──────────────────────────────────── */}
        <View style={styles.scoreSection}>
          <ScoreRing score={stats.weekScore} loggedDays={stats.loggedDays} />
          <View style={styles.scoreDivider} />
          <View style={styles.streakBlock}>
            <Text style={styles.streakValue}>{stats.currentStreak}</Text>
            <Text style={styles.streakLabel}>jours{'\n'}consécutifs</Text>
          </View>
        </View>

        <KpiStrip stats={stats} profile={profile} />

        {/* ── Apport calorique ─────────────────────────────── */}
        <ChartCard
          title="Apport calorique"
          sub="kcal · 7 jours"
          legend={`Objectif : ${profile.kcalTarget} kcal`}
        >
          <KcalBars days={stats.days} target={profile.kcalTarget} />
        </ChartCard>

        {/* ── Objectifs macros ──────────────────────────────── */}
        <ChartCard
          title="Objectifs macros"
          sub="Moyenne semaine vs cibles"
        >
          <View style={styles.macroRingsRow}>
            <MacroRing
              label="Protéines"
              avg={stats.avgP}
              target={profile.macroTargets.protein}
              unit="g"
              color={MACRO_COLORS.p}
            />
            <MacroRing
              label="Glucides"
              avg={stats.avgC}
              target={profile.macroTargets.carbs}
              unit="g"
              color={MACRO_COLORS.c}
            />
            <MacroRing
              label="Lipides"
              avg={stats.avgF}
              target={profile.macroTargets.fat}
              unit="g"
              color={MACRO_COLORS.f}
            />
          </View>
          <View style={styles.sparkSep} />
          <MacroSparklines days={stats.days} />
        </ChartCard>

        {/* ── Adhérence repas ──────────────────────────────── */}
        <ChartCard
          title="Adhérence repas"
          sub="Créneaux remplis par jour"
        >
          <MealGrid days={stats.days} />
          <View style={styles.gridLegend}>
            <View style={[styles.gridDot, styles.gridDotFilled]} />
            <Text style={styles.gridLegendText}>Enregistré</Text>
            <View style={[styles.gridDot, styles.gridDotNoData, { marginLeft: 12 }]} />
            <Text style={styles.gridLegendText}>Non rempli</Text>
            <View style={[styles.gridDot, styles.gridDotFuture, { marginLeft: 12 }]} />
            <Text style={styles.gridLegendText}>À venir</Text>
          </View>
        </ChartCard>

        {/* ── À noter ──────────────────────────────────────── */}
        <View style={styles.insightsHead}>
          <Text style={styles.insightsTitle}>À noter</Text>
          {stats.prevWeekAvgKcal !== null && stats.kcalDeltaPct !== null && (
            <Text style={styles.insightsMeta}>
              vs semaine préc. {stats.kcalDeltaPct > 0 ? '+' : ''}{stats.kcalDeltaPct}%
            </Text>
          )}
        </View>
        <InsightsList insights={stats.insights} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll:    { paddingBottom: 48 },

  // Topbar
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 4,
  },
  topbarLeft: { flex: 1 },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  // Week navigation
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    marginBottom: 0,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    borderColor: Colors.hairline2,
    backgroundColor: 'transparent',
  },
  weekNavLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink2,
    letterSpacing: -0.1,
  },

  // Score section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  scoreRingContainer: {
    width: BIG_RING_SIZE,
    height: BIG_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  scoreValue: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    letterSpacing: -1,
    lineHeight: 32,
  },
  scoreUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.3,
    marginTop: 10,
    marginLeft: 1,
  },
  scoreLabel: { gap: 2 },
  scoreLabelTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  scoreLabelSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.hairline2,
    marginHorizontal: 20,
  },
  streakBlock: { alignItems: 'center', gap: 2 },
  streakValue: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    letterSpacing: -1.5,
    color: Colors.ink,
    lineHeight: 38,
  },
  streakLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 13,
  },

  // KPI strip
  kpiStrip: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    marginBottom: 14,
  },
  kpiCell: { flex: 1, alignItems: 'center', gap: 2 },
  kpiDivider: { width: 1, backgroundColor: Colors.hairline2, marginVertical: 4 },
  kpiLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  kpiValue: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    letterSpacing: -0.5,
    color: Colors.ink,
    lineHeight: 22,
  },
  kpiSub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    color: Colors.muted2,
  },

  // Chart card
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 18,
    padding: 18,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 3,
  },
  cardLegend: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
    textAlign: 'right',
    maxWidth: 120,
    marginTop: 2,
  },

  // Bar chart
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_H + 36,
    gap: 5,
    paddingHorizontal: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_H + 36,
    gap: 4,
  },
  bar: {
    width: '100%',
    maxWidth: 26,
    backgroundColor: Colors.ink,
    borderRadius: 4,
  },
  barToday: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.muted,
    borderRadius: 4,
  },
  barOver: { backgroundColor: Colors.warn },
  barEmpty: { backgroundColor: Colors.hairline2 },
  barDayLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  barDayToday: { color: Colors.ink, fontFamily: Fonts.monoMedium },
  barKcal: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },

  // Macro rings
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  macroRingWrap: { alignItems: 'center', gap: 4 },
  macroRingContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingCenter: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  macroRingPct: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: 20,
  },
  macroRingPctSign: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    marginBottom: 2,
  },
  macroRingAvg: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  macroRingLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  macroRingTarget: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },
  sparkSep: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginVertical: 16,
  },
  sparkRows: { gap: 10 },
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sparkLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Colors.muted,
    width: 58,
  },
  sparkVal: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.ink,
    width: 38,
    textAlign: 'right',
  },

  // Meal grid
  gridWrap: { gap: 6 },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridSlotLabel: { width: 46 },
  gridSlotText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    color: Colors.muted,
    textAlign: 'right',
  },
  gridDayCell: { flex: 1, alignItems: 'center', gap: 1 },
  gridDayLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  gridDayToday: { color: Colors.ink, fontFamily: Fonts.monoMedium },
  gridDayNum: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
  },
  gridDayNumToday: { color: Colors.ink, fontFamily: Fonts.monoMedium },
  gridDotCell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 26 },
  gridDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.hairline2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  gridDotFilled: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  gridDotFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.muted2,
  },
  gridDotNoData: {
    backgroundColor: Colors.hairline2,
    borderColor: Colors.hairline2,
  },
  gridLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  gridLegendText: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },

  // Insights
  insightsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
  },
  insightsTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  insightsMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  insightsList: {
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    marginBottom: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  insightLabel: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
    flex: 1,
  },
  insightTrend: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.4,
    textAlign: 'right',
  },
  toneGood: { color: Colors.ok },
  toneWarn: { color: Colors.warn },
  toneMid:  { color: Colors.signal },
});
