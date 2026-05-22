import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['grid', 'detail'] as const;
type Phase = typeof PHASES[number];

const PLATE_1 = {
  name: 'Buddha Bowl',
  kcal: 520, time: '15 min',
  tags: ['Végétarien', 'Midi'],
  macros: { protein: 22, carbs: 55, fat: 18 },
  recipe: [
    { name: 'Quinoa cuit',      qty: '150 g', kcal: 174 },
    { name: 'Avocat',           qty: '½ fruit', kcal: 120 },
    { name: 'Pois chiches rôtis', qty: '80 g', kcal: 160 },
  ],
  items: 4, last: '22 mai 2026',
};

const PLATE_2 = {
  name: 'Pasta Bolognese',
  kcal: 680, time: '30 min',
  tags: ['Classique', 'Soir'],
  macros: { protein: 32, carbs: 82, fat: 15 },
  items: 5, last: '20 mai 2026',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoSaved({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,   setPhase]   = useState<Phase>('grid');
  const [added,   setAdded]   = useState(false);
  const [caption, setCaption] = useState('');

  const detailSlide = useRef(new Animated.Value(SH)).current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('grid'); setAdded(false); setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.27 - 26);
      engine.fingerY.setValue(SH * 0.40 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      detailSlide.setValue(SH);

      at(100, fadeIn);

      // t=1.0 : doigt → carte Buddha Bowl
      at(1000, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.27, SH * 0.40, 400);
        setCaption('Explore ta bibliothèque de plats');
      });

      // t=2.0 : tap → fiche détail
      at(2000, () => {
        tap();
        setPhase('detail');
        Animated.timing(detailSlide, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      at(2400, () => setCaption('Recette complète avec macros détaillées'));

      // t=5.2 : doigt → "Ajouter au journal"
      at(5200, () => move(SW * 0.5, SH * 0.77, 480));

      // t=6.0 : tap → ajouté
      at(6000, () => {
        tap();
        setAdded(true);
        setCaption('Plat ajouté au repas du midi !');
      });

      // t=7.8 : doigt → bouton retour
      at(7800, () => move(SW * 0.08, SH * 0.08, 480));

      // t=8.6 : tap → retour grille
      at(8600, () => {
        tap();
        Animated.timing(detailSlide, { toValue: SH, duration: 300, useNativeDriver: true }).start();
      });
      at(8950, () => {
        setPhase('grid');
        setAdded(false);
        setCaption('Crée un nouveau plat');
      });

      // t=9.6 : doigt → bouton + créer
      at(9600, () => move(SW * 0.78, SH * 0.09, 400));

      // t=11.0 : doigt → carte Pasta (survol)
      at(11000, () => {
        move(SW * 0.73, SH * 0.40, 500);
        setCaption('Tes plats toujours à portée de main');
      });

      // t=13.5 : boucle
      at(13500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const p1total = PLATE_1.macros.protein + PLATE_1.macros.carbs + PLATE_1.macros.fat;
  const p2total = PLATE_2.macros.protein + PLATE_2.macros.carbs + PLATE_2.macros.fat;

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR GRILLE ── */}
        <View style={s.topbar}>
          <View style={s.menuBtn} />
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>Bibliothèque</Text>
            <Text style={s.title}>Plats sauvegardés</Text>
          </View>
          <View style={s.iconBtn} />
          <View style={s.iconBtnSignal} />
          <View style={s.iconBtn} />
        </View>

        {/* ── FILTER BAR ── */}
        <View style={s.filterBar}>
          <View style={s.filterBtn}>
            <Text style={s.filterBtnText}>Filtres</Text>
          </View>
          <Text style={s.filterInfo}>2/2 · A–Z</Text>
        </View>

        {/* ── GRILLE 2 COLONNES ── */}
        <View style={s.grid}>
          <View style={s.row}>
            {/* Carte 1 */}
            <View style={s.card}>
              <View style={s.thumb}>
                <Text style={s.kcalBadge}>{PLATE_1.kcal}<Text style={s.kcalUnit}> kcal</Text></Text>
              </View>
              <Text style={s.cardName}>{PLATE_1.name}</Text>
              <View style={s.tags}>
                {PLATE_1.tags.map(t => (
                  <View key={t} style={s.tagPill}><Text style={s.tagText}>{t}</Text></View>
                ))}
              </View>
              <View style={s.cardMacros}>
                <View style={s.cardMacroBar}>
                  <View style={[s.segP, { flex: PLATE_1.macros.protein / p1total }]} />
                  <View style={[s.segC, { flex: PLATE_1.macros.carbs / p1total }]} />
                  <View style={[s.segF, { flex: PLATE_1.macros.fat / p1total }]} />
                </View>
                <Text style={s.cardMacroText}>P {PLATE_1.macros.protein}g · G {PLATE_1.macros.carbs}g · L {PLATE_1.macros.fat}g</Text>
              </View>
              <Text style={s.lastText}>{PLATE_1.items} aliments · {PLATE_1.last}</Text>
            </View>

            {/* Carte 2 */}
            <View style={s.card}>
              <View style={s.thumb}>
                <Text style={s.kcalBadge}>{PLATE_2.kcal}<Text style={s.kcalUnit}> kcal</Text></Text>
              </View>
              <Text style={s.cardName}>{PLATE_2.name}</Text>
              <View style={s.tags}>
                {PLATE_2.tags.map(t => (
                  <View key={t} style={s.tagPill}><Text style={s.tagText}>{t}</Text></View>
                ))}
              </View>
              <View style={s.cardMacros}>
                <View style={s.cardMacroBar}>
                  <View style={[s.segP, { flex: PLATE_2.macros.protein / p2total }]} />
                  <View style={[s.segC, { flex: PLATE_2.macros.carbs / p2total }]} />
                  <View style={[s.segF, { flex: PLATE_2.macros.fat / p2total }]} />
                </View>
                <Text style={s.cardMacroText}>P {PLATE_2.macros.protein}g · G {PLATE_2.macros.carbs}g · L {PLATE_2.macros.fat}g</Text>
              </View>
              <Text style={s.lastText}>{PLATE_2.items} aliments · {PLATE_2.last}</Text>
            </View>
          </View>
        </View>

        {/* ── PANNEAU DÉTAIL (slide up) ── */}
        <Animated.View style={[s.detailPanel, { transform: [{ translateY: detailSlide }] }]} pointerEvents="none">

          {/* Topbar détail */}
          <View style={s.detailTopbar}>
            <View style={s.iconBtn} />
            <View style={s.detailTopbarCenter}>
              <Text style={s.eyebrow}>Plat sauvegardé</Text>
              <Text style={s.detailTitle} numberOfLines={1}>{PLATE_1.name}</Text>
            </View>
            <View style={s.iconBtn} />
            <View style={s.iconBtn} />
          </View>

          {/* Hero strié */}
          <View style={s.hero}>
            <View style={s.heroBadges}>
              <View style={s.heroKcalBadge}>
                <Text style={s.heroKcalVal}>{PLATE_1.kcal}</Text>
                <Text style={s.heroKcalUnit}> kcal</Text>
              </View>
              <View style={s.heroTimeBadge}>
                <Text style={s.heroTimeText}>{PLATE_1.time}</Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          <View style={s.detailTags}>
            {PLATE_1.tags.map(t => (
              <View key={t} style={s.tagPill}><Text style={s.tagText}>{t}</Text></View>
            ))}
            <Text style={s.lastText}>{PLATE_1.last}</Text>
          </View>
          <View style={s.divider} />

          {/* Macros */}
          <View style={s.macrosSection}>
            <Text style={s.sectionTitle}>Macronutriments</Text>
            {[
              { label: 'Protéines', value: PLATE_1.macros.protein, unit: 'g', color: Colors.ok, pct: (PLATE_1.macros.protein / p1total) * 100 },
              { label: 'Glucides',  value: PLATE_1.macros.carbs,   unit: 'g', color: Colors.signal, pct: (PLATE_1.macros.carbs / p1total) * 100 },
              { label: 'Lipides',   value: PLATE_1.macros.fat,     unit: 'g', color: Colors.ink2, pct: (PLATE_1.macros.fat / p1total) * 100 },
            ].map(m => (
              <View key={m.label} style={s.macroRow}>
                <Text style={s.macroLabel}>{m.label}</Text>
                <Text style={s.macroValue}>{m.value}<Text style={s.macroUnit}>{m.unit}</Text></Text>
                <View style={s.macroTrack}>
                  <View style={[s.macroFill, { width: `${Math.round(m.pct)}%` as any, backgroundColor: m.color }]} />
                </View>
              </View>
            ))}
          </View>
          <View style={s.divider} />

          {/* Recette */}
          <View style={s.recipeSection}>
            <Text style={s.sectionTitle}>Recette</Text>
            {PLATE_1.recipe.map((r, i) => (
              <View key={i} style={s.ingredientRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.ingredientName}>{r.name}</Text>
                  <View style={s.qtyRow}>
                    <View style={s.qtyPill}><Text style={s.qtyText}>{r.qty}</Text></View>
                  </View>
                </View>
                <Text style={s.ingredientKcal}>{r.kcal} kcal</Text>
              </View>
            ))}
          </View>

          {/* Bouton ajouter */}
          <View style={[s.addBtn, added && s.addBtnDone]}>
            <Text style={[s.addBtnText, added && s.addBtnTextDone]}>
              {added ? '✓  Ajouté au journal' : '+  Ajouter au journal'}
            </Text>
          </View>

        </Animated.View>
      </View>
    </DemoShell>
  );
}

const CARD_GAP = 14;
const H_PAD   = 20;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  // ── Grille ─────────────────────────────────────────────────
  topbar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4,
    paddingHorizontal: H_PAD, paddingTop: 48, paddingBottom: 4,
  },
  menuBtn:      { width: 40, height: 40, borderRadius: 20, marginRight: 4, marginBottom: 4 },
  iconBtn:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.hairline, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconBtnSignal:{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.signal + '55', backgroundColor: Colors.signal + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: Colors.muted },
  title: { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 28, letterSpacing: -0.5, color: Colors.ink, marginTop: 2 },

  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: H_PAD, paddingTop: 14, paddingBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline,
  },
  filterBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  filterInfo: { flex: 1, fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5, color: Colors.muted2, textAlign: 'right' },

  grid: { paddingHorizontal: H_PAD },
  row:  { flexDirection: 'row', gap: CARD_GAP },
  card: {
    flex: 1, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 18, padding: 14, gap: 8,
  },
  thumb: {
    aspectRatio: 4 / 3, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.hairline2,
    backgroundColor: Colors.paper2, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'flex-end', padding: 8,
  },
  kcalBadge: {
    fontFamily: Fonts.serif, fontSize: 16, letterSpacing: -0.2, color: Colors.ink,
    backgroundColor: Colors.paper, paddingVertical: 1, paddingHorizontal: 7,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, overflow: 'hidden',
  },
  kcalUnit: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.muted },
  cardName: { fontFamily: Fonts.serif, fontSize: 15, lineHeight: 18, letterSpacing: -0.15, color: Colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tagPill: { borderWidth: 1, borderColor: Colors.hairline, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 6 },
  tagText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.muted },
  cardMacros: { gap: 3 },
  cardMacroBar: { height: 3, flexDirection: 'row', borderRadius: 2, overflow: 'hidden', backgroundColor: Colors.hairline2 },
  segP: { backgroundColor: Colors.ok },
  segC: { backgroundColor: Colors.signal },
  segF: { backgroundColor: Colors.ink2 },
  cardMacroText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.3, color: Colors.muted2 },
  lastText: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 0.6, color: Colors.muted2 },

  // ── Panneau détail ──────────────────────────────────────────
  detailPanel: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.paper,
  },
  detailTopbar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4,
    paddingHorizontal: H_PAD, paddingTop: 48, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  detailTopbarCenter: { flex: 1, paddingHorizontal: 8 },
  detailTitle: { fontFamily: Fonts.serif, fontSize: 20, letterSpacing: -0.4, color: Colors.ink, marginTop: 2 },

  hero: {
    height: 130, backgroundColor: Colors.paper2,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  heroBadges:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroKcalBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: Colors.paper, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.hairline },
  heroKcalVal:   { fontFamily: Fonts.serif, fontSize: 20, letterSpacing: -0.3, color: Colors.ink },
  heroKcalUnit:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  heroTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.paper, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.hairline },
  heroTimeText:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },

  detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  divider:    { height: 1, backgroundColor: Colors.hairline2, marginHorizontal: 20 },

  macrosSection:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 8 },
  sectionTitle:   { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink2, letterSpacing: -0.1 },
  macroRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroLabel:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, color: Colors.muted, width: 68 },
  macroValue:     { fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink, letterSpacing: -0.3, width: 40 },
  macroUnit:      { fontFamily: Fonts.sans, fontSize: 10, color: Colors.muted },
  macroTrack:     { flex: 1, height: 5, backgroundColor: Colors.hairline2, borderRadius: 3, overflow: 'hidden' },
  macroFill:      { height: '100%', borderRadius: 3 },

  recipeSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientName: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink, letterSpacing: -0.1 },
  qtyRow:        { flexDirection: 'row', marginTop: 3 },
  qtyPill:       { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2, borderRadius: 100, paddingVertical: 1, paddingHorizontal: 8 },
  qtyText:       { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  ingredientKcal:{ fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink2, letterSpacing: -0.3 },

  addBtn: {
    marginHorizontal: 20, marginTop: 16,
    paddingVertical: 16, borderRadius: 100,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  addBtnDone:     { backgroundColor: Colors.ok },
  addBtnText:     { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2, letterSpacing: -0.2 },
  addBtnTextDone: { color: Colors.paper2 },
});
