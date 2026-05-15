import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { WEEK, WEEK_SUMMARY, WeekDay } from '../data/stats';
import { Colors, Fonts } from '../theme/tokens';

// ── Design constants ──────────────────────────────────────────

const BAR_HEIGHT = 130;
const SPARKLINE_H = 28;
const MACRO_COLORS = {
  protein: '#3a352b',
  carbs:   '#6b5a2e',
  fat:     '#a89569',
} as const;

// ── Chart card wrapper ────────────────────────────────────────

function ChartCard({
  title,
  sub,
  legend,
  children,
}: {
  title: string;
  sub: string;
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSub}>{sub}</Text>
        </View>
        <Text style={styles.chartLegend}>{legend}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Kcal bar chart ────────────────────────────────────────────

function KcalBars({ data }: { data: WeekDay[] }) {
  const [containerWidth, setContainerWidth] = useState(0);

  const max = Math.max(...data.map((d) => Math.max(d.kcal, d.target))) * 1.05;
  const targetY = ((max - data[0].target) / max) * BAR_HEIGHT;

  return (
    <View
      style={styles.barsWrap}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Dashed target line via SVG overlay */}
      {containerWidth > 0 && (
        <Svg
          width={containerWidth}
          height={BAR_HEIGHT}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Line
            x1={0}
            y1={targetY}
            x2={containerWidth}
            y2={targetY}
            stroke={Colors.muted2}
            strokeWidth={1}
            strokeDasharray="5,3"
          />
        </Svg>
      )}

      {/* Bars */}
      {data.map((d) => {
        const barH = d.today ? 14 : Math.max(2, (d.kcal / max) * BAR_HEIGHT);
        const over = !d.today && d.kcal > d.target;
        return (
          <View key={d.d} style={styles.barCol}>
            <View
              style={[
                styles.bar,
                { height: barH },
                d.today && styles.barToday,
                over && styles.barOver,
              ]}
            />
            <Text style={[styles.barDay, d.today && styles.barDayToday]}>{d.d}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Sparkline ─────────────────────────────────────────────────

function Sparkline({
  values,
  color,
  max,
  gradientId,
}: {
  values: number[];
  color: string;
  max: number;
  gradientId: string;
}) {
  const [width, setWidth] = useState(0);
  const H = SPARKLINE_H;

  const points =
    width > 0
      ? values.map((v, i) => ({
          x: (i / (values.length - 1)) * width,
          y: H - (v / max) * (H - 4) - 2,
        }))
      : [];

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';

  const areaPath =
    points.length > 1
      ? `${linePath} L ${width} ${H} L 0 ${H} Z`
      : '';

  return (
    <View
      style={{ flex: 1, height: H }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && points.length > 1 && (
        <Svg width={width} height={H}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
          ))}
        </Svg>
      )}
    </View>
  );
}

// ── Macro sparklines section ──────────────────────────────────

function MacroSparklines({ data }: { data: WeekDay[] }) {
  const pValues = data.map((d) => d.p);
  const cValues = data.map((d) => d.c);
  const fValues = data.map((d) => d.f);

  const maxP = Math.max(...pValues) * 1.2 || 100;
  const maxC = Math.max(...cValues) * 1.2 || 100;
  const maxF = Math.max(...fValues) * 1.2 || 100;

  const rows: { label: string; values: number[]; color: string; max: number; avg: number; id: string }[] = [
    { label: 'Protéines', values: pValues, color: MACRO_COLORS.protein, max: maxP, avg: WEEK_SUMMARY.avgP, id: 'grad-p' },
    { label: 'Glucides',  values: cValues, color: MACRO_COLORS.carbs,   max: maxC, avg: WEEK_SUMMARY.avgC, id: 'grad-c' },
    { label: 'Lipides',   values: fValues, color: MACRO_COLORS.fat,     max: maxF, avg: WEEK_SUMMARY.avgF, id: 'grad-f' },
  ];

  return (
    <View style={styles.macroMini}>
      {rows.map((row) => (
        <View key={row.label} style={styles.macroRow}>
          <Text style={styles.macroLabel}>{row.label}</Text>
          <Sparkline values={row.values} color={row.color} max={row.max} gradientId={row.id} />
          <Text style={styles.macroVal}>{row.avg} g</Text>
        </View>
      ))}
    </View>
  );
}

// ── Heat strip (compliance) ────────────────────────────────────

function HeatStrip({ data }: { data: WeekDay[] }) {
  return (
    <View style={styles.heatStrip}>
      {data.map((d) => {
        const alpha = d.today ? 0 : 0.18 + d.compliance * 0.82;
        return (
          <View
            key={d.d}
            style={[
              styles.heatCell,
              d.today
                ? styles.heatCellToday
                : { backgroundColor: `rgba(26,24,20,${alpha.toFixed(2)})` },
            ]}
          >
            <Text style={[styles.heatDay, !d.today && d.compliance > 0.5 && styles.heatDayLight]}>
              {d.d}
            </Text>
            {!d.today && (
              <Text style={[styles.heatPct, d.compliance > 0.5 && styles.heatPctLight]}>
                {Math.round(d.compliance * 100)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Stats Screen ──────────────────────────────────────────────

export function StatsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topbar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.topbarEyebrow}>Semaine du 5 — 11 mai</Text>
            <Text style={styles.topbarTitle}>Statistiques</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Moyenne kcal</Text>
            <Text style={styles.summaryBig}>
              {WEEK_SUMMARY.avgKcal}
              <Text style={styles.summaryUnit}>/ 2100</Text>
            </Text>
            <Text style={styles.summarySub}>
              {WEEK_SUMMARY.daysOnTarget} jours sur 7 dans la cible
            </Text>
          </View>
          <View style={[styles.summaryCell, styles.summaryCellRight]}>
            <Text style={styles.summaryLabel}>Série en cours</Text>
            <Text style={styles.summaryBig}>
              {WEEK_SUMMARY.longestStreak}
              <Text style={styles.summaryUnit}> jours</Text>
            </Text>
            <Text style={styles.summarySub}>{WEEK_SUMMARY.topAllergen}</Text>
          </View>
        </View>

        {/* Kcal bar chart */}
        <ChartCard
          title="Apport calorique"
          sub="Kcal · 7 derniers jours"
          legend="— · — objectif"
        >
          <KcalBars data={WEEK} />
        </ChartCard>

        {/* Macro sparklines */}
        <ChartCard
          title="Macronutriments"
          sub="Moyennes · g/jour"
          legend={`${WEEK_SUMMARY.avgP}P · ${WEEK_SUMMARY.avgC}C · ${WEEK_SUMMARY.avgF}L`}
        >
          <MacroSparklines data={WEEK} />
        </ChartCard>

        {/* Compliance heat strip */}
        <ChartCard
          title="Conformité régime"
          sub="% objectifs atteints"
          legend="●●●●●●○"
        >
          <HeatStrip data={WEEK} />
        </ChartCard>

        {/* Notable */}
        <View style={styles.notableHead}>
          <Text style={styles.notableTitle}>À noter</Text>
          <Text style={styles.notableMeta}>7 j vs 30 j</Text>
        </View>
        <View style={styles.notableList}>
          {WEEK_SUMMARY.noteworthy.map((n) => (
            <View key={n.label} style={styles.notableRow}>
              <Text style={styles.notableLabel}>{n.label}</Text>
              <Text
                style={[
                  styles.notableTrend,
                  n.tone === 'good' && styles.trendGood,
                  n.tone === 'warn' && styles.trendWarn,
                  n.tone === 'mid' && styles.trendMid,
                ]}
              >
                {n.trend}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Topbar
  topbar: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 20,
  },
  topbarEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 2,
  },
  topbarTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  // Summary
  summary: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    marginBottom: 14,
  },
  summaryCell: {
    flex: 1,
    paddingBottom: 18,
    paddingRight: 12,
  },
  summaryCellRight: {
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: Colors.hairline2,
    paddingRight: 0,
  },
  summaryLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },
  summaryBig: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  summaryUnit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '400',
  },
  summarySub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
    lineHeight: 17,
  },

  // Chart card
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 18,
    padding: 18,
    paddingBottom: 14,
  },
  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  chartTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  chartSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 3,
  },
  chartLegend: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted,
    textAlign: 'right',
    maxWidth: 100,
  },

  // Bar chart
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_HEIGHT + 22,
    gap: 6,
    paddingHorizontal: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_HEIGHT + 22,
    gap: 6,
  },
  bar: {
    width: 22,
    backgroundColor: Colors.ink,
    borderRadius: 4,
  },
  barToday: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.muted,
    borderRadius: 4,
  },
  barOver: {
    backgroundColor: Colors.warn,
  },
  barDay: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  barDayToday: {
    color: Colors.ink,
    fontWeight: '500',
  },

  // Sparklines
  macroMini: { gap: 10 },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  macroLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.muted,
    width: 60,
  },
  macroVal: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.ink,
    width: 42,
    textAlign: 'right',
  },

  // Heat strip
  heatStrip: {
    flexDirection: 'row',
    gap: 4,
  },
  heatCell: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  heatCellToday: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.muted,
    borderRadius: 10,
  },
  heatDay: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heatDayLight: { color: Colors.paper2 },
  heatPct: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  heatPctLight: { color: Colors.paper2 },

  // Notable
  notableHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
  },
  notableTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  notableMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  notableList: {
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  notableRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  notableLabel: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  notableTrend: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.4,
  },
  trendGood: { color: Colors.ok },
  trendWarn: { color: Colors.warn },
  trendMid:  { color: Colors.signal },
});
