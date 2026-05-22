import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['input', 'result', 'detail'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const SUGGESTIONS = [
  'Dîner sans lactose léger',
  'Déjeuner anti-inflammatoire',
  'Petit déjeuner rassasiant rapide',
  'Repas végétarien riche en protéines',
];

const MEAL_1 = {
  emoji: '🥗',
  name: 'Buddha Bowl Quinoa',
  type: 'Déjeuner',
  kcal: 485,
  time: 25,
  fodmap: true,
  tags: ['Végétarien', 'Anti-inflam.'],
  desc: 'Bol complet à base de quinoa, légumes rôtis et sauce tahini légère',
  macros: { protein: 22, carbs: 58, fat: 16, fiber: 8 },
  ingredients: [
    { name: 'Quinoa cuit',       amount: '150 g',  note: '✓' },
    { name: 'Épinards frais',    amount: '80 g',   note: '✓' },
    { name: 'Tomates cerises',   amount: '100 g',  note: '✓' },
    { name: 'Pois chiches rôtis',amount: '70 g',   note: '⚠ max 42 g' },
  ],
  micros: [
    { name: 'Fer',        amount: '4.2 mg', anr: '30%' },
    { name: 'Magnésium',  amount: '88 mg',  anr: '22%' },
    { name: 'Vitamine C', amount: '45 mg',  anr: '50%' },
  ],
  antiInflam: 78,
  whyGood: 'Élimine le lactose et le gluten. Le quinoa apporte tous les acides aminés essentiels tout en restant bas en FODMAP.',
};

const MEALS_COLLAPSED = [
  MEAL_1,
  { emoji: '🐟', name: 'Saumon citron aneth',     type: 'Dîner',           kcal: 420, tags: ['Sans lactose', 'Oméga-3'],   desc: 'Filet de saumon vapeur, légumes racines et sauce légère', fodmap: false },
  { emoji: '🌾', name: 'Porridge avoine & fruits', type: 'Petit déjeuner', kcal: 340, tags: ['Rassasiant', 'Fibres'],      desc: 'Porridge chaud, fruits rouges, chia et miel d\'acacia',   fodmap: false },
];

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoMealGenerator({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,       setPhase]       = useState<Phase>('input');
  const [chipActive,  setChipActive]  = useState<number | null>(null);
  const [queryText,   setQueryText]   = useState('');
  const [saved,       setSaved]       = useState(false);
  const [caption,     setCaption]     = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('input');
      setChipActive(null);
      setQueryText('');
      setSaved(false);
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26);
      engine.fingerY.setValue(SH * 0.175 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=1.0s : doigt → champ de saisie
      at(1000, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.5, SH * 0.175, 400);
        setCaption('Décris ce que tu veux manger');
      });

      // t=2.5s : doigt → chip 0 "Dîner sans lactose léger"
      at(2500, () => {
        move(SW * 0.29, SH * 0.385, 600);
        setCaption('Ou clique sur une suggestion personnalisée');
      });

      // t=3.8s : tap → chip sélectionnée
      at(3800, () => {
        tap();
        setChipActive(0);
        setQueryText('Dîner sans lactose léger');
      });

      // t=4.8s : doigt → bouton Générer
      at(4800, () => {
        move(SW * 0.5, SH * 0.258, 500);
        setCaption('');
      });

      // t=5.6s : tap → switch 'result'
      at(5600, () => {
        tap();
        setPhase('result');
        setChipActive(null);
        setCaption('3 repas générés selon ton profil');
      });

      // t=7.2s : doigt → carte 1 (Buddha Bowl)
      at(7200, () => {
        move(SW * 0.5, SH * 0.215, 600);
        setCaption('Repas équilibrés et adaptés à tes sensibilités');
      });

      // t=8.5s : doigt → carte 2 (Saumon)
      at(8500, () => move(SW * 0.5, SH * 0.370, 500));

      // t=9.5s : tap → switch 'detail' (déplie carte 1)
      at(9500, () => {
        move(SW * 0.5, SH * 0.215, 400);
        tap();
        setPhase('detail');
        setCaption('Détail nutritionnel complet');
      });

      // t=10.8s : doigt → macro pills
      at(10800, () => {
        move(SW * 0.5, SH * 0.330, 500);
        setCaption('Macros par portion · fibres incluses');
      });

      // t=12.0s : doigt → ingrédients (pois chiches avec note FODMAP)
      at(12000, () => {
        move(SW * 0.5, SH * 0.465, 500);
        setCaption('Notes FODMAP par ingrédient');
      });

      // t=13.5s : doigt → score anti-inflammatoire
      at(13500, () => {
        move(SW * 0.5, SH * 0.565, 500);
        setCaption('');
      });

      // t=14.5s : doigt → bouton Sauvegarder
      at(14500, () => {
        move(SW * 0.5, SH * 0.665, 500);
        setCaption('Sauvegarde ce repas dans ta bibliothèque');
      });

      // t=15.4s : tap → sauvegardé
      at(15400, () => {
        tap();
        setSaved(true);
        setCaption('Repas ajouté à tes plats sauvegardés !');
      });

      // t=17.0s : retour input
      at(17000, () => {
        setPhase('input');
        setSaved(false);
        setQueryText('');
        setCaption('');
      });

      // t=18.5s : boucle
      at(18500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View style={s.iconBtn} />
          <View style={s.topbarCenter}>
            <Text style={s.topbarTitle}>Générateur de repas</Text>
            <Text style={s.topbarSub}>IA nutritionniste personnalisée</Text>
          </View>
          <View style={s.iconBtnSignal} />
          <View style={s.iconBtn} />
        </View>

        {/* ══ INPUT ═════════════════════════════════════════════ */}
        {phase === 'input' && (
          <View style={s.content}>

            {/* Champ de saisie */}
            <View style={s.inputWrap}>
              {queryText ? (
                <Text style={s.inputText}>{queryText}</Text>
              ) : (
                <Text style={s.inputPlaceholder}>
                  3 repas low FODMAP végétariens, petit déj riche en protéines…
                </Text>
              )}
            </View>

            {/* Bouton générer */}
            <View style={[s.genBtn, !queryText && s.genBtnDisabled]}>
              <View style={s.sparkleSmall} />
              <Text style={s.genBtnText}>Générer 3 repas</Text>
            </View>

            {/* Chips de suggestion */}
            <View style={s.suggestSection}>
              <Text style={s.suggestLabel}>Suggestions pour ton profil</Text>
              <View style={s.chipsWrap}>
                {SUGGESTIONS.map((sugg, i) => (
                  <View key={i} style={[s.chip, chipActive === i && s.chipActive]}>
                    <Text style={[s.chipText, chipActive === i && s.chipTextActive]}>
                      {sugg}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        )}

        {/* ══ RESULT (3 cartes fermées) ══════════════════════════ */}
        {phase === 'result' && (
          <View style={s.content}>

            <View style={s.resultsHeader}>
              <Text style={s.resultsTitle}>3 repas générés</Text>
              <View style={s.regenBtn}>
                <Text style={s.regenBtnText}>Régénérer</Text>
              </View>
            </View>

            <Text style={s.contextNote}>
              Repas sans lactose, sans gluten, faible charge FODMAP · adaptés à 1 950 kcal/j
            </Text>

            {MEALS_COLLAPSED.map((meal, i) => (
              <View key={i} style={s.mealCard}>
                <View style={s.mealHeader}>
                  <View style={s.mealEmojiWrap}>
                    <Text style={s.mealEmoji}>{meal.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mealName}>{meal.name}</Text>
                    <Text style={s.mealType}>{meal.type}</Text>
                  </View>
                  <View style={s.mealHeaderRight}>
                    <Text style={s.mealKcal}>{meal.kcal}</Text>
                    <Text style={s.mealKcalUnit}>kcal</Text>
                  </View>
                </View>
                <View style={s.mealMeta}>
                  {'time' in meal && (
                    <View style={s.metaChip}><Text style={s.metaChipText}>{(meal as typeof MEAL_1).time} min</Text></View>
                  )}
                  {meal.fodmap && (
                    <View style={[s.metaChip, s.metaChipFodmap]}>
                      <Text style={[s.metaChipText, { color: Colors.ok }]}>Low FODMAP</Text>
                    </View>
                  )}
                  {meal.tags.map(t => (
                    <View key={t} style={s.tagChip}><Text style={s.tagChipText}>{t}</Text></View>
                  ))}
                </View>
                <Text style={s.mealDesc}>{meal.desc}</Text>
              </View>
            ))}

          </View>
        )}

        {/* ══ DETAIL (carte 1 dépliée) ══════════════════════════ */}
        {phase === 'detail' && (
          <View style={s.content}>

            {/* Carte 1 dépliée */}
            <View style={s.mealCard}>
              <View style={s.mealHeader}>
                <View style={s.mealEmojiWrap}>
                  <Text style={s.mealEmoji}>{MEAL_1.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealName}>{MEAL_1.name}</Text>
                  <Text style={s.mealType}>{MEAL_1.type}</Text>
                </View>
                <View style={s.mealHeaderRight}>
                  <Text style={s.mealKcal}>{MEAL_1.kcal}</Text>
                  <Text style={s.mealKcalUnit}>kcal</Text>
                </View>
              </View>
              <View style={s.mealMeta}>
                <View style={s.metaChip}><Text style={s.metaChipText}>{MEAL_1.time} min</Text></View>
                <View style={[s.metaChip, s.metaChipFodmap]}>
                  <Text style={[s.metaChipText, { color: Colors.ok }]}>Low FODMAP</Text>
                </View>
              </View>

              {/* Expanded content */}
              <View style={s.expandedContent}>
                <View style={s.expandDivider} />

                {/* Macros */}
                <View style={s.macroRow}>
                  {[
                    { label: 'Prot.', value: MEAL_1.macros.protein, unit: 'g', color: Colors.ok },
                    { label: 'Gluc.', value: MEAL_1.macros.carbs,   unit: 'g', color: Colors.signal },
                    { label: 'Lip.',  value: MEAL_1.macros.fat,     unit: 'g', color: Colors.muted },
                    { label: 'Fibres',value: MEAL_1.macros.fiber,   unit: 'g', color: Colors.ink2 },
                  ].map(m => (
                    <View key={m.label} style={s.macroPill}>
                      <Text style={[s.macroPillVal, { color: m.color }]}>{m.value}</Text>
                      <Text style={s.macroPillUnit}>{m.unit}</Text>
                      <Text style={s.macroPillLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Ingrédients */}
                <Text style={s.expandLabel}>Ingrédients</Text>
                {MEAL_1.ingredients.map((ing, i) => (
                  <View key={i} style={s.ingredRow}>
                    <View style={s.ingredDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.ingredName}>{ing.name}</Text>
                      <Text style={s.ingredAmount}>{ing.amount}</Text>
                    </View>
                    <Text style={[s.fodmapNote, ing.note.startsWith('⚠') && { color: Colors.signal }]}>
                      {ing.note}
                    </Text>
                  </View>
                ))}

                {/* Micronutriments */}
                <Text style={[s.expandLabel, { marginTop: 12 }]}>Micronutriments clés</Text>
                <View style={s.microGrid}>
                  {MEAL_1.micros.map((m, i) => (
                    <View key={i} style={s.microItem}>
                      <Text style={s.microName}>{m.name}</Text>
                      <Text style={s.microAmount}>{m.amount}</Text>
                      <Text style={s.microAnr}>{m.anr} AJR</Text>
                    </View>
                  ))}
                </View>

                {/* Score anti-inflammatoire */}
                <View style={s.antiInflamRow}>
                  <Text style={s.antiInflamLabel}>Score anti-inflammatoire</Text>
                  <View style={s.antiInflamBarWrap}>
                    <View style={[s.antiInflamBar, { width: `${MEAL_1.antiInflam}%` as any }]} />
                  </View>
                  <Text style={s.antiInflamVal}>{MEAL_1.antiInflam}/100</Text>
                </View>

                {/* Pourquoi adapté */}
                <View style={s.whyGoodBlock}>
                  <Text style={s.whyGoodLabel}>Pourquoi c'est adapté</Text>
                  <Text style={s.whyGoodText}>{MEAL_1.whyGood}</Text>
                </View>

                {/* Bouton sauvegarder */}
                <View style={[s.saveBtn, saved && s.saveBtnDone]}>
                  <Text style={[s.saveBtnText, saved && s.saveBtnTextDone]}>
                    {saved ? '✓  Repas sauvegardé' : '⊕  Sauvegarder ce repas'}
                  </Text>
                </View>

              </View>
            </View>

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

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 10,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20 },
  iconBtnSignal: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
  },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  topbarSub:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginTop: 1 },

  content: { flex: 1, paddingHorizontal: H_PAD, gap: 10 },

  // ── Input ───────────────────────────────────────────────────
  inputWrap: {
    borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 16, backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 72,
    justifyContent: 'center',
  },
  inputText:        { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, lineHeight: 22 },
  inputPlaceholder: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.muted2, lineHeight: 22 },

  genBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 16,
  },
  genBtnDisabled: { opacity: 0.4 },
  sparkleSmall: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.paper + '80' },
  genBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2, letterSpacing: -0.1 },

  suggestSection: { marginTop: 18, gap: 10 },
  suggestLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },
  chipActive:     { borderColor: Colors.ink, backgroundColor: Colors.ink + '0d' },
  chipText:       { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink2 },
  chipTextActive: { color: Colors.ink, fontFamily: Fonts.sansMedium },

  // ── Result ──────────────────────────────────────────────────
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  resultsTitle:  { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  regenBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline },
  regenBtnText:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },
  contextNote: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted2,
    lineHeight: 17, marginBottom: 2,
  },

  // ── Meal card (shared) ──────────────────────────────────────
  mealCard: {
    backgroundColor: Colors.card, borderWidth: 1,
    borderColor: Colors.hairline2, borderRadius: 16, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8,
  },
  mealEmojiWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.paper2, borderWidth: 1, borderColor: Colors.hairline2,
    alignItems: 'center', justifyContent: 'center',
  },
  mealEmoji: { fontSize: 22 },
  mealName:  { fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink, letterSpacing: -0.3, lineHeight: 19 },
  mealType:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  mealHeaderRight: { alignItems: 'flex-end', gap: 0 },
  mealKcal:     { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.4 },
  mealKcalUnit: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.3 },

  mealMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 14, paddingBottom: 8,
  },
  metaChip:      { borderWidth: 1, borderColor: Colors.hairline, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9, backgroundColor: Colors.paper2 },
  metaChipFodmap:{ borderColor: Colors.ok + '44', backgroundColor: Colors.ok + '0d' },
  metaChipText:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.4 },
  tagChip:     { borderWidth: 1, borderColor: Colors.hairline2, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  tagChipText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted2, letterSpacing: 0.4 },
  mealDesc: {
    fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.muted,
    lineHeight: 18, paddingHorizontal: 14, paddingBottom: 14,
  },

  // ── Expanded content ────────────────────────────────────────
  expandedContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  expandDivider:   { height: 1, backgroundColor: Colors.hairline2, marginBottom: 4 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  macroPill:      { alignItems: 'center', gap: 1 },
  macroPillVal:   { fontFamily: Fonts.serif, fontSize: 20, letterSpacing: -0.4, lineHeight: 22 },
  macroPillUnit:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.3 },
  macroPillLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted2, letterSpacing: 0.5, textTransform: 'uppercase' },

  expandLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginTop: 4 },

  ingredRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.hairline2 },
  ingredDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.muted2, flexShrink: 0 },
  ingredName:   { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  ingredAmount: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.3, marginTop: 1 },
  fodmapNote: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.ok, letterSpacing: 0.2 },

  microGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  microItem: {
    flex: 1, minWidth: 80,
    backgroundColor: Colors.paper2, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 10, padding: 8, gap: 1,
  },
  microName:   { fontFamily: Fonts.mono, fontSize: 8.5, color: Colors.muted, letterSpacing: 0.4 },
  microAmount: { fontFamily: Fonts.serif, fontSize: 14, color: Colors.ink, letterSpacing: -0.2 },
  microAnr:    { fontFamily: Fonts.mono, fontSize: 8, color: Colors.ok, letterSpacing: 0.3 },

  antiInflamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  antiInflamLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5, flex: 1 },
  antiInflamBarWrap: { flex: 1, height: 5, backgroundColor: Colors.hairline2, borderRadius: 3, overflow: 'hidden' },
  antiInflamBar: { height: '100%', backgroundColor: Colors.ok, borderRadius: 3 },
  antiInflamVal: { fontFamily: Fonts.serif, fontSize: 14, color: Colors.ok, letterSpacing: -0.2, width: 50, textAlign: 'right' },

  whyGoodBlock: {
    backgroundColor: Colors.paper2, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 10, padding: 10, gap: 3,
  },
  whyGoodLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted },
  whyGoodText:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink2, lineHeight: 17 },

  saveBtn: {
    marginTop: 4, paddingVertical: 14, borderRadius: 100,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  saveBtnDone:     { backgroundColor: Colors.ok },
  saveBtnText:     { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2, letterSpacing: -0.1 },
  saveBtnTextDone: { color: Colors.paper2 },
});
