import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['may', 'april'] as const;
type Phase = typeof PHASES[number];

// ── Grid builder ───────────────────────────────────────────────

function buildRows(startOffset: number, daysInMonth: number): (number | null)[][] {
  const flat: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (flat.length % 7 !== 0) flat.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
  return rows;
}

// ── Fake data ──────────────────────────────────────────────────

// May 2026 : 1er mai = vendredi → getDay()=5 → startOffset=4
const MAY_ROWS   = buildRows(4, 31);
const MAY_MARKED = new Set([5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
const MAY_TODAY  = 23;

// April 2026 : 1er avril = mercredi → getDay()=3 → startOffset=2
const APR_ROWS   = buildRows(2, 30);
const APR_MARKED = new Set([7, 8, 9, 10, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 27, 28]);

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// ── Coordinate helpers ─────────────────────────────────────────
// Sheet paddingHorizontal=20, grid rows are 50px each.
// Grid starts at ~145px from top (handle + monthNav + dayHeaders + sep).
// Col center x(c) ≈ 20 + c*(SW-40)/7 + (SW-40)/14
// Row center y(r) ≈ 0.175*SH + r*50px

function colX(c: number) { return 20 + (c + 0.5) * (SW - 40) / 7; }
function rowY(r: number) { return SH * 0.185 + r * 50; }

// May cells
// Day 23 (today) : index=4+23-1=26 → row=3, col=5
// Day 19 (marked): index=4+19-1=22 → row=3, col=1
// Day 14 (marked): index=4+14-1=17 → row=2, col=3
// April cells
// Day 22 (marked): index=2+22-1=23 → row=3, col=2
// Day 15 (marked): index=2+15-1=16 → row=2, col=2

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoCalendar({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,       setPhase]       = useState<Phase>('may');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [caption,     setCaption]     = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const NAV_Y = SH * 0.093;  // centre du monthNav
    const R3_Y  = rowY(3);     // centre des lignes de la row 3
    const R2_Y  = rowY(2);     // centre des lignes de la row 2

    const run = () => {
      clearAll();
      setPhase('may');
      setSelectedDay(null);
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(colX(5) - 26);
      engine.fingerY.setValue(R3_Y - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → aujourd'hui (23, row 3, col 5)
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(colX(5), R3_Y, 400);
        setCaption('Navigue dans tout ton historique nutritionnel');
      });

      // t=2.6s : doigt → jour marqué 19 (row 3, col 1)
      at(2600, () => {
        move(colX(1), R3_Y, 500);
        setCaption('• = repas enregistrés ce jour-là');
      });

      // t=4.1s : doigt → jour marqué 14 (row 2, col 3)
      at(4100, () => {
        move(colX(3), R2_Y, 500);
        setCaption('');
      });

      // t=5.3s : doigt → flèche gauche
      at(5300, () => move(colX(0) * 0.55, NAV_Y, 500));

      // t=6.1s : tap → avril
      at(6100, () => {
        tap();
        setPhase('april');
        setSelectedDay(null);
        setCaption('Remonte aussi loin que tu veux dans l\'historique');
      });

      // t=7.5s : doigt → jour 22 avril (row 3, col 2)
      at(7500, () => {
        move(colX(2), R3_Y, 500);
        setCaption('');
      });

      // t=8.8s : tap → sélection du 22
      at(8800, () => {
        tap();
        setSelectedDay(22);
        setCaption('Sélectionne un jour pour consulter ses repas');
      });

      // t=10.4s : doigt → flèche droite
      at(10400, () => {
        move(SW - colX(0) * 0.55, NAV_Y, 600);
        setCaption('');
      });

      // t=11.2s : tap → retour mai
      at(11200, () => {
        tap();
        setPhase('may');
        setSelectedDay(null);
      });

      // t=12.4s : doigt → bouton Aujourd'hui
      at(12400, () => {
        move(SW * 0.28, SH * 0.875, 600);
        setCaption('Retour immédiat à aujourd\'hui');
      });

      // t=13.6s : tap
      at(13600, () => tap());

      // t=14.8s : boucle
      at(14800, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const rows    = phase === 'may' ? MAY_ROWS : APR_ROWS;
  const marked  = phase === 'may' ? MAY_MARKED : APR_MARKED;
  const isMay   = phase === 'may';

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.sheet}>

        {/* Handle */}
        <View style={s.handle} />

        {/* Navigation mois */}
        <View style={s.monthNav}>
          <View style={s.navBtn}>
            <Text style={s.navChev}>‹</Text>
          </View>
          <Text style={s.monthLabel}>{isMay ? 'Mai 2026' : 'Avril 2026'}</Text>
          <View style={s.navBtn}>
            <Text style={s.navChev}>›</Text>
          </View>
        </View>

        {/* En-têtes jours */}
        <View style={s.dayHeaders}>
          {DAY_HEADERS.map((d, i) => (
            <Text key={i} style={s.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Séparateur */}
        <View style={s.sep} />

        {/* Grille */}
        <View style={s.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.gridRow}>
              {row.map((day, ci) => {
                if (!day) return <View key={ci} style={s.cell} />;

                const isToday    = isMay && day === MAY_TODAY;
                const isSelected = !isToday && day === selectedDay;
                const hasData    = marked.has(day);
                const isFuture   = isMay && day > MAY_TODAY;

                return (
                  <View key={ci} style={s.cell}>
                    <View style={[
                      s.dayCircle,
                      isToday && s.dayCircleToday,
                      isSelected && s.dayCircleSel,
                    ]}>
                      <Text style={[
                        s.dayNum,
                        isToday && s.dayNumToday,
                        isSelected && s.dayNumSel,
                        isFuture && s.dayNumFuture,
                      ]}>
                        {day}
                      </Text>
                    </View>
                    {hasData && <View style={[s.dot, isToday && s.dotToday]} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.todayBtn}>
            <View style={s.homeIcon} />
            <Text style={s.todayBtnText}>Aujourd'hui</Text>
          </View>
          <View style={s.closeBtn}>
            <Text style={s.closeBtnText}>Fermer</Text>
          </View>
        </View>

      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const CELL_SIZE = 42;

const s = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: Colors.paper,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center', marginBottom: 20,
  },

  monthNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  navChev: {
    fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink,
    lineHeight: 28, letterSpacing: -1,
  },
  monthLabel: {
    fontFamily: Fonts.serif, fontSize: 22,
    letterSpacing: -0.4, color: Colors.ink,
  },

  dayHeaders: { flexDirection: 'row', paddingHorizontal: 2, marginBottom: 6 },
  dayHeader:  {
    flex: 1, textAlign: 'center',
    fontFamily: Fonts.mono, fontSize: 10,
    letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted,
  },

  sep: { height: 1, backgroundColor: Colors.hairline2, marginBottom: 8 },

  grid: { paddingHorizontal: 2 },
  gridRow: { flexDirection: 'row' },

  cell: {
    flex: 1, height: CELL_SIZE + 8,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, gap: 3,
  },
  dayCircle: {
    width: CELL_SIZE - 6, height: CELL_SIZE - 6,
    borderRadius: (CELL_SIZE - 6) / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleToday: { backgroundColor: Colors.ink },
  dayCircleSel:   { borderWidth: 1.5, borderColor: Colors.ink },
  dayNum:         { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },
  dayNumToday:    { fontFamily: Fonts.sansSemiBold, color: Colors.paper2 },
  dayNumSel:      { fontFamily: Fonts.sansSemiBold, color: Colors.ink },
  dayNumFuture:   { color: Colors.muted2 },

  dot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: Colors.signal,
  },
  dotToday: { backgroundColor: Colors.paper2 },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingTop: 16, marginTop: 'auto',
    borderTopWidth: 1, borderTopColor: Colors.hairline2,
    paddingBottom: 34,
  },
  todayBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.hairline, borderRadius: 100,
  },
  homeIcon: {
    width: 14, height: 14, borderRadius: 3,
    backgroundColor: Colors.muted2 + '60',
  },
  todayBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  closeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, backgroundColor: Colors.ink, borderRadius: 100,
  },
  closeBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2 },
});
