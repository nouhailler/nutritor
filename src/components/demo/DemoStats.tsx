import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['week', 'month', 'wellness'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const MC = { p: '#3a352b', c: '#6b5a2e', f: '#a89569' } as const;
const BAR_H = 80;
const MAX_KCAL = 2270;

type WDay = { label: string; kcal: number; p: number; c: number; f: number; today?: boolean };
const WEEK_DAYS: WDay[] = [
  { label: 'L', kcal: 1850, p: 95,  c: 195, f: 58  },
  { label: 'M', kcal: 2100, p: 110, c: 220, f: 68  },
  { label: 'M', kcal: 1920, p: 88,  c: 200, f: 65  },
  { label: 'J', kcal: 1750, p: 92,  c: 180, f: 55  },
  { label: 'V', kcal: 2050, p: 105, c: 215, f: 62  },
  { label: 'S', kcal: 1680, p: 80,  c: 175, f: 50  },
  { label: 'D', kcal: 0,    p: 0,   c: 0,   f: 0, today: true },
];

type MCell = { d: number; c: 'ok' | 'signal' | 'warn' | 'today' | 'future' } | null;
const MONTH_ROWS: MCell[][] = [
  [null, null, null, {d:1,c:'ok'}, {d:2,c:'ok'}, {d:3,c:'signal'}, {d:4,c:'ok'}],
  [{d:5,c:'ok'}, {d:6,c:'warn'}, {d:7,c:'ok'}, {d:8,c:'ok'}, {d:9,c:'signal'}, {d:10,c:'ok'}, {d:11,c:'ok'}],
  [{d:12,c:'ok'}, {d:13,c:'signal'}, {d:14,c:'ok'}, {d:15,c:'ok'}, {d:16,c:'warn'}, {d:17,c:'ok'}, {d:18,c:'ok'}],
  [{d:19,c:'ok'}, {d:20,c:'ok'}, {d:21,c:'signal'}, {d:22,c:'today'}, {d:23,c:'future'}, {d:24,c:'future'}, {d:25,c:'future'}],
  [{d:26,c:'future'}, {d:27,c:'future'}, {d:28,c:'future'}, {d:29,c:'future'}, {d:30,c:'future'}, {d:31,c:'future'}, null],
];

const SPARKS = [
  { label: 'Digestion', bars: [3,3,2,3,2,3,3], color: Colors.ok,     last: '3/4' },
  { label: 'Énergie',   bars: [3,2,3,2,3,3,2], color: Colors.signal, last: '2/4' },
  { label: 'Humeur',    bars: [4,3,3,4,3,4,3], color: Colors.ok,     last: '3/4' },
  { label: 'Douleur',   bars: [1,2,1,2,1,1,2], color: Colors.ok,     last: '2/4' },
];

const INSIGHTS = [
  { tone: Colors.ok,   msg: 'Légumineuses les jours suivis ↑ digestion (+0.8 pts)',   meta: 'Digestion · 12 j · confiance forte' },
  { tone: Colors.warn, msg: 'Glucides simples le soir ↓ énergie matinale',            meta: 'Énergie · 10 j · confiance modérée' },
];

// ── Helper: cell bg ────────────────────────────────────────────

function cellBg(c: NonNullable<MCell>['c']): string {
  if (c === 'ok')     return Colors.ok + '28';
  if (c === 'signal') return Colors.signal + '28';
  if (c === 'warn')   return Colors.warn + '28';
  if (c === 'today')  return Colors.ink + '15';
  return 'transparent';
}
function cellTextColor(c: NonNullable<MCell>['c']): string {
  if (c === 'ok')     return Colors.ok;
  if (c === 'signal') return Colors.signal;
  if (c === 'warn')   return Colors.warn;
  if (c === 'today')  return Colors.ink;
  return Colors.hairline;
}

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoStats({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,   setPhase]   = useState<Phase>('week');
  const [caption, setCaption] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('week');
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.18 - 26);
      engine.fingerY.setValue(SH * 0.28 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → score ring
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.18, SH * 0.285, 400);
        setCaption('Score semaine calculé sur ta cible kcal');
      });

      // t=2.6s : doigt → barre "Mardi" (pic)
      at(2600, () => {
        move(SW * 0.27, SH * 0.46, 600);
        setCaption('Kcal et macros empilées sur 7 jours');
      });

      // t=4.5s : doigt → bouton "Mois"
      at(4500, () => {
        move(SW * 0.50, SH * 0.148, 500);
        setCaption('');
      });

      // t=5.2s : tap → vue Mois
      at(5200, () => {
        tap();
        setPhase('month');
        setCaption('Heatmap mensuelle — vert = dans la cible');
      });

      // t=6.0s : doigt → cases calendrier (milieu)
      at(6000, () => move(SW * 0.5, SH * 0.52, 700));

      // t=7.5s : doigt → bouton "Bien-être"
      at(7500, () => {
        move(SW * 0.79, SH * 0.148, 500);
        setCaption('');
      });

      // t=8.2s : tap → vue Bien-être
      at(8200, () => {
        tap();
        setPhase('wellness');
        setCaption('Corrélations alimentation / symptômes');
      });

      // t=9.2s : doigt → première corrélation
      at(9200, () => move(SW * 0.5, SH * 0.635, 500));

      // t=11.0s : doigt → deuxième corrélation
      at(11000, () => {
        move(SW * 0.5, SH * 0.70, 400);
        setCaption('Détecte tes patterns nutritionnels');
      });

      // t=12.5s : doigt → bouton "Semaine"
      at(12500, () => {
        move(SW * 0.21, SH * 0.148, 500);
        setCaption('');
      });

      // t=13.2s : tap → retour semaine
      at(13200, () => {
        tap();
        setPhase('week');
        setCaption('Semaine · macros · tendances 4 semaines');
      });

      // t=15.5s : boucle
      at(15500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>Analyse</Text>
            <Text style={s.title}>Statistiques</Text>
          </View>
          <View style={s.iconBtnSignal} />
        </View>

        {/* ── VIEW TOGGLE ── */}
        <View style={s.toggleWrap}>
          <View style={s.toggle}>
            {(['week', 'month', 'wellness'] as Phase[]).map((p, i) => (
              <View key={p} style={[s.toggleBtn, phase === p && s.toggleBtnActive]}>
                <Text style={[s.toggleLabel, phase === p && s.toggleLabelActive]}>
                  {(['Semaine', 'Mois', 'Bien-être'] as const)[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── WEEK VIEW ── */}
        {phase === 'week' && (
          <View style={s.content}>

            {/* Score ring + KPIs */}
            <View style={s.scoreRow}>
              <View style={s.scoreBlock}>
                <View style={s.ring}>
                  <Text style={s.ringNum}>74</Text>
                  <Text style={s.ringDen}>/100</Text>
                </View>
                <Text style={s.ringLabel}>Score semaine</Text>
                <Text style={s.ringSub}>6 jours enregistrés</Text>
              </View>
              <View style={s.kpiGrid}>
                {[
                  { label: 'Moy. kcal', value: '1 892', sub: '/ 2 000' },
                  { label: 'Cible kcal', value: '4 / 7',  sub: 'jours' },
                  { label: 'Série',      value: '5',       sub: 'j consécutifs' },
                  { label: 'Aliments',   value: '18',      sub: 'uniques' },
                ].map((k) => (
                  <View key={k.label} style={s.kpiCell}>
                    <Text style={s.kpiLabel}>{k.label}</Text>
                    <Text style={s.kpiValue}>{k.value}</Text>
                    <Text style={s.kpiSub}>{k.sub}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bar chart */}
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Kcal<Text style={s.cardSub}>  ·  7 jours</Text></Text>
              <View style={s.barsWrap}>
                {WEEK_DAYS.map((d, i) => {
                  const barH = d.today
                    ? 10
                    : d.kcal === 0 ? 3
                    : Math.max(3, (d.kcal / MAX_KCAL) * BAR_H);
                  const macro = d.p * 4 + d.c * 4 + d.f * 9;
                  const stacked = !d.today && d.kcal > 0 && macro > 0;
                  return (
                    <View key={i} style={s.barCol}>
                      <View style={s.barArea}>
                        {stacked ? (
                          <View style={[s.barStacked, { height: barH }]}>
                            <View style={{ flex: Math.max(0.001, d.p * 4), backgroundColor: MC.p }} />
                            <View style={{ flex: Math.max(0.001, d.c * 4), backgroundColor: MC.c }} />
                            <View style={{ flex: Math.max(0.001, d.f * 9), backgroundColor: MC.f }} />
                          </View>
                        ) : (
                          <View style={[s.bar, { height: barH }, d.today && s.barToday]} />
                        )}
                      </View>
                      <Text style={[s.barLabel, d.today && s.barLabelToday]}>{d.label}</Text>
                      {!d.today && d.kcal > 0 && (
                        <Text style={s.barKcal}>{d.kcal}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={s.barLegend}>
                {[{ label: 'Prot.', color: MC.p }, { label: 'Gluc.', color: MC.c }, { label: 'Lip.', color: MC.f }].map(l => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color }]} />
                    <Text style={s.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Macro rings */}
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Macros<Text style={s.cardSub}>  ·  moyennes / objectifs</Text></Text>
              <View style={s.ringsRow}>
                {[
                  { label: 'Protéines', avg: 95,  target: 100, unit: 'g', color: MC.p,  pct: 95  },
                  { label: 'Glucides',  avg: 198, target: 220, unit: 'g', color: MC.c,  pct: 90  },
                  { label: 'Lipides',   avg: 60,  target: 70,  unit: 'g', color: MC.f,  pct: 86  },
                ].map(r => (
                  <View key={r.label} style={s.macroRing}>
                    <View style={[s.miniRing, { borderColor: r.color }]}>
                      <Text style={[s.miniRingPct, { color: r.color }]}>{r.pct}</Text>
                      <Text style={s.miniRingSign}>%</Text>
                    </View>
                    <Text style={s.macroRingAvg}>{r.avg}{r.unit}</Text>
                    <Text style={s.macroRingLabel}>{r.label}</Text>
                    <Text style={s.macroRingTarget}>obj. {r.target}{r.unit}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        )}

        {/* ── MONTH VIEW ── */}
        {phase === 'month' && (
          <View style={s.content}>
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Mai 2026<Text style={s.cardSub}>  ·  conformité kcal</Text></Text>
              <View style={s.calGrid}>
                {/* Headers */}
                <View style={s.calRow}>
                  {['L','M','M','J','V','S','D'].map((h, i) => (
                    <Text key={i} style={s.calHeader}>{h}</Text>
                  ))}
                </View>
                {MONTH_ROWS.map((row, ri) => (
                  <View key={ri} style={s.calRow}>
                    {row.map((cell, ci) =>
                      cell ? (
                        <View key={ci} style={[s.calCell, { backgroundColor: cellBg(cell.c) }, cell.c === 'today' && s.calCellToday]}>
                          <Text style={[s.calDay, { color: cellTextColor(cell.c) }]}>{cell.d}</Text>
                        </View>
                      ) : (
                        <View key={ci} style={s.calCell} />
                      )
                    )}
                  </View>
                ))}
              </View>
              <View style={s.calLegend}>
                {[{ color: Colors.ok, label: 'Dans la cible' }, { color: Colors.signal, label: '±25%' }, { color: Colors.warn, label: 'Hors cible' }].map(l => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color + '55' }]} />
                    <Text style={s.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── WELLNESS VIEW ── */}
        {phase === 'wellness' && (
          <View style={s.content}>

            {/* KPI strip */}
            <View style={s.wellKpis}>
              {[
                { label: 'Jours saisis',  value: '12', sub: 'total' },
                { label: 'Avec repas',    value: '10', sub: 'corrélables' },
                { label: 'Min. requis',   value: '0',  sub: 'jours restants' },
              ].map((k, i) => (
                <React.Fragment key={k.label}>
                  {i > 0 && <View style={s.kpiDivider} />}
                  <View style={s.wellKpiCell}>
                    <Text style={s.kpiLabel}>{k.label}</Text>
                    <Text style={s.kpiValue}>{k.value}</Text>
                    <Text style={s.kpiSub}>{k.sub}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* Sparklines */}
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Symptômes<Text style={s.cardSub}>  ·  7 derniers jours</Text></Text>
              {SPARKS.map(sp => (
                <View key={sp.label} style={s.sparkRow}>
                  <Text style={s.sparkLabel}>{sp.label}</Text>
                  <View style={s.sparkBars}>
                    {sp.bars.map((v, i) => (
                      <View key={i} style={s.sparkBarWrap}>
                        <View style={[s.sparkBar, { height: Math.max(2, (v / 4) * 24), backgroundColor: sp.color }]} />
                      </View>
                    ))}
                  </View>
                  <Text style={[s.sparkVal, { color: sp.color }]}>{sp.last}</Text>
                </View>
              ))}
            </View>

            {/* Correlations */}
            <View style={s.insightsHead}>
              <Text style={s.insightsTitle}>Corrélations</Text>
              <Text style={s.insightsMeta}>10 j de données</Text>
            </View>
            {INSIGHTS.map((ins, i) => (
              <View key={i} style={s.insightRow}>
                <View style={[s.insightDot, { backgroundColor: ins.tone }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.insightMsg}>{ins.msg}</Text>
                  <Text style={s.insightMeta}>{ins.meta}</Text>
                </View>
              </View>
            ))}

          </View>
        )}

      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const H_PAD = 20;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  // Topbar
  topbar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: H_PAD, paddingTop: 48, paddingBottom: 6,
  },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: Colors.muted },
  title:   { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 28, letterSpacing: -0.5, color: Colors.ink, marginTop: 2 },
  iconBtnSignal: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.signal + '55', backgroundColor: Colors.signal + '12' },

  // Toggle
  toggleWrap: { paddingHorizontal: H_PAD, paddingBottom: 10 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 100 },
  toggleBtnActive: { backgroundColor: Colors.paper },
  toggleLabel: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.muted, letterSpacing: -0.1 },
  toggleLabelActive: { color: Colors.ink },

  // Content scroll area
  content: { flex: 1, paddingHorizontal: H_PAD, gap: 12 },

  // Score + KPIs row
  scoreRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreBlock: { alignItems: 'center', gap: 3 },
  ring: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 6, borderColor: Colors.signal,
    alignItems: 'center', justifyContent: 'center',
  },
  ringNum:   { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 24, letterSpacing: -0.5, color: Colors.signal },
  ringDen:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.3 },
  ringLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.ink2, letterSpacing: -0.1 },
  ringSub:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.3 },

  kpiGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCell: { width: '46%', gap: 2 },
  kpiLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.muted },
  kpiValue: { fontFamily: Fonts.serif, fontSize: 18, letterSpacing: -0.4, color: Colors.ink, lineHeight: 20 },
  kpiSub:   { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.3, color: Colors.muted2 },
  kpiDivider: { width: 1, backgroundColor: Colors.hairline2, alignSelf: 'stretch' },

  // Bar chart
  chartCard: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 16, padding: 14, gap: 10,
  },
  cardTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, letterSpacing: -0.1 },
  cardSub:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.3 },

  barsWrap: { flexDirection: 'row', gap: 6 },
  barCol:   { flex: 1, alignItems: 'center', gap: 3 },
  barArea:  { height: BAR_H, justifyContent: 'flex-end', width: '100%' },
  barStacked: { width: '100%', borderRadius: 3, overflow: 'hidden', flexDirection: 'column' },
  bar: {
    width: '100%', backgroundColor: Colors.muted2 + '55',
    borderRadius: 3,
  },
  barToday: { backgroundColor: Colors.ink + '30', height: 10, borderRadius: 3 },
  barLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted2, letterSpacing: 0.3 },
  barLabelToday: { color: Colors.ink, fontFamily: Fonts.sansMedium },
  barKcal:  { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted2, letterSpacing: 0.2 },
  barLegend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.3 },

  // Macro rings
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroRing: { alignItems: 'center', gap: 3 },
  miniRing: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
  },
  miniRingPct:  { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 18, letterSpacing: -0.4 },
  miniRingSign: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted },
  macroRingAvg:    { fontFamily: Fonts.serif, fontSize: 13, letterSpacing: -0.2, color: Colors.ink },
  macroRingLabel:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  macroRingTarget: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted2, letterSpacing: 0.3 },

  // Month calendar
  calGrid: { gap: 2 },
  calRow:  { flexDirection: 'row', gap: 2 },
  calHeader: { flex: 1, fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted2, textAlign: 'center', letterSpacing: 0.5, paddingBottom: 4 },
  calCell: { flex: 1, aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  calCellToday: { borderWidth: 1.5, borderColor: Colors.ink + '40' },
  calDay: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.2 },
  calLegend: { flexDirection: 'row', gap: 14, paddingTop: 4 },

  // Wellness
  wellKpis: {
    flexDirection: 'row',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
  },
  wellKpiCell: { flex: 1, alignItems: 'center', gap: 2 },

  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  sparkLabel: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 0.5, color: Colors.muted, width: 62 },
  sparkBars:  { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 26, gap: 3 },
  sparkBarWrap: { flex: 1, height: 26, justifyContent: 'flex-end' },
  sparkBar:   { borderRadius: 2 },
  sparkVal:   { fontFamily: Fonts.serif, fontSize: 13, letterSpacing: -0.2, width: 30, textAlign: 'right' },

  insightsHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 2, paddingBottom: 4,
  },
  insightsTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink2, letterSpacing: -0.1 },
  insightsMeta:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted2, letterSpacing: 0.3 },
  insightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 12, padding: 12,
  },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  insightMsg:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink, lineHeight: 17, letterSpacing: -0.1 },
  insightMeta: { fontFamily: Fonts.mono, fontSize: 8.5, color: Colors.muted2, letterSpacing: 0.3, marginTop: 3 },
});
