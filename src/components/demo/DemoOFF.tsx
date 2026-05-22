import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const CATEGORIES = [
  { icon: '🍎', label: 'Fruits' },
  { icon: '🥦', label: 'Légumes' },
  { icon: '🥛', label: 'Laitiers' },
  { icon: '🥩', label: 'Viandes' },
  { icon: '🌾', label: 'Céréales' },
];

const OFF_RESULTS = [
  { icon: '🍅', name: 'Tomates pelées',  kcal: 21, score: 94 },
  { icon: '🥒', name: 'Courgette',        kcal: 17, score: 98 },
  { icon: '🌶', name: 'Poivron rouge',    kcal: 26, score: 92 },
  { icon: '🥕', name: 'Carotte',          kcal: 41, score: 95 },
];

const CAROTTE_POSITIVES = [
  'Riche en bêta-carotène',
  'Légume peu transformé',
  'FODMAP friendly',
];

const FOODS_WITH_CARROT = [
  { icon: '🥕', name: 'Carotte',                            kcal: 41  },
  { icon: '🫑', name: 'Poivron, vert, jaune ou rouge, cru', kcal: 26  },
  { icon: '🥚', name: 'Œuf entier',                         kcal: 155 },
];

const PHASES = ['off', 'results', 'detail', 'foods-list', 'food-detail', 'edit'] as const;
type Phase = typeof PHASES[number];

const scoreColor = (s: number) => s >= 90 ? Colors.ok : s >= 70 ? Colors.signal : Colors.warn;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoOFF({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,        setPhase]        = useState<Phase>('off');
  const [activeChip,   setActiveChip]   = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [imported,     setImported]     = useState(false);
  const [caption,      setCaption]      = useState('');

  const scrollOffset   = useRef(new Animated.Value(0)).current;
  const foodDetailSlide = useRef(new Animated.Value(SH)).current;
  const editSlide       = useRef(new Animated.Value(SH)).current;
  const detailScroll    = useRef(new Animated.Value(0)).current;

  const slideIn  = (av: Animated.Value) =>
    Animated.timing(av, { toValue: 0,  duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  const slideOut = (av: Animated.Value) =>
    Animated.timing(av, { toValue: SH, duration: 300, easing: Easing.in(Easing.quad),   useNativeDriver: true }).start();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }

    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('off'); setActiveChip(null); setLoading(false);
      setCardExpanded(false); setImported(false); setCaption('');

      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26); engine.fingerY.setValue(SH * 0.3 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      scrollOffset.setValue(0); foodDetailSlide.setValue(SH);
      editSlide.setValue(SH);   detailScroll.setValue(0);

      // t=0.1s : fade in écran OFF
      at(100, fadeIn);

      // t=1.0s : doigt vers le chip "Légumes"
      at(1000, () => { engine.fOpacity.setValue(1); move(SW * 0.38, SH * 0.29, 450); setCaption('Explore Open Food Facts par catégorie'); });

      // t=1.8s : tap "Légumes" → chargement
      at(1800, () => { tap(); setActiveChip('Légumes'); setLoading(true); setCaption('Recherche dans 3 millions de produits…'); });

      // t=3.0s : résultats apparaissent
      at(3000, () => { setLoading(false); setPhase('results'); setCaption('Résultats avec score digestif personnalisé'); });

      // t=3.8s : scroll vers le bas pour révéler la Carotte
      at(3800, () => {
        Animated.timing(scrollOffset, {
          toValue: -90,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      });

      // t=4.9s : doigt vers le bouton score de Carotte
      at(4900, () => move(SW * 0.88, SH * 0.55, 480));

      // t=5.6s : tap score → carte s'expand
      at(5600, () => { tap(); setCardExpanded(true); setCaption('Score basé sur ton profil alimentaire'); });

      // t=6.7s : doigt vers "+ Importer"
      at(6700, () => move(SW * 0.5, SH * 0.68, 480));

      // t=7.3s : tap "+ Importer" → imported
      at(7300, () => { tap(); setImported(true); setCaption('Carotte importée dans ta bibliothèque !'); });

      // t=8.0s : doigt vers ← retour
      at(8000, () => move(SW * 0.10, SH * 0.10, 400));

      // t=8.6s : tap retour → retour liste aliments
      at(8600, () => { tap(); });
      at(8750, () => { setPhase('foods-list'); setCaption('L\'aliment apparaît dans ta liste'); });

      // t=9.5s : doigt vers "Carotte" dans la liste
      at(9500, () => move(SW * 0.5, SH * 0.36, 500));

      // t=10.1s : tap → fiche détail
      at(10100, () => { tap(); slideIn(foodDetailSlide); setPhase('food-detail'); setCaption('Fiche nutritionnelle complète en 6 entrées'); });

      // t=11.2s : scroll dans la fiche détail
      at(11200, () => {
        Animated.timing(detailScroll, {
          toValue: -80,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      });

      // t=12.4s : doigt vers le crayon en haut à droite
      at(12400, () => { move(SW * 0.88, SH * 0.23, 450); setCaption('Modifie la fiche avec le bouton crayon'); });

      // t=13.0s : tap crayon → écran édition
      at(13000, () => { tap(); slideIn(editSlide); setPhase('edit'); });

      // t=14.2s : doigt vers "Enregistrer"
      at(14200, () => move(SW * 0.5, SH * 0.72, 500));

      // t=14.9s : tap Enregistrer → retour fiche
      at(14900, () => { tap(); slideOut(editSlide); setPhase('food-detail'); setCaption('Modifications sauvegardées localement'); });

      // t=17.0s : boucle
      at(17000, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const isOffPhase = (['off', 'results', 'detail'] as Phase[]).includes(phase);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>

      {/* ── BADGE ─────────────────────────────────── */}

      {/* ── CONTEXTE : ÉCRAN OFF OU LISTE ALIMENTS ── */}
      {isOffPhase ? (

        <View style={s.screen}>
          <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>

          {/* Topbar OFF */}
          <View style={s.topbar}>
            <Text style={s.backBtn}>←</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>Base de données mondiale</Text>
              <Text style={s.screenTitle}>Open Food Facts</Text>
            </View>
          </View>

          {/* Barre de recherche */}
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchBarPlaceholder}>Rechercher un produit, une marque…</Text>
          </View>

          {/* Catégories */}
          <View style={s.categoryStrip}>
            {CATEGORIES.map(c => (
              <View key={c.label} style={[s.chip, activeChip === c.label && s.chipActive]}>
                <Text style={[s.chipTxt, activeChip === c.label && s.chipTxtActive]}>
                  {c.icon} {c.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Chargement */}
          {loading && (
            <View style={s.loadingRow}>
              <Text style={s.loadingTxt}>Recherche dans la base OFF…</Text>
            </View>
          )}

          {/* Résultats */}
          {!loading && phase !== 'off' && (
            <Animated.View style={{ transform: [{ translateY: scrollOffset }] }}>
              <Text style={s.resultsCount}>4 résultats · Légumes</Text>
              {OFF_RESULTS.map((r, i) => {
                const isCarotte = r.name === 'Carotte';
                const sc = scoreColor(r.score);
                return (
                  <View key={i} style={s.offRow}>
                    <Text style={s.offIcon}>{r.icon}</Text>
                    <View style={s.offInfo}>
                      <Text style={s.offName}>{r.name}</Text>
                      <Text style={s.offKcal}>{r.kcal} kcal / 100g</Text>
                    </View>
                    <View style={[s.scorePill, { borderColor: sc }]}>
                      <Text style={[s.scoreNum, { color: sc }]}>{r.score}</Text>
                      <Text style={[s.scoreSlash, { color: sc }]}>/100</Text>
                    </View>

                    {/* Carte étendue de la Carotte */}
                    {isCarotte && cardExpanded && (
                      <View style={s.expandedCard}>
                        <View style={s.expandedHeader}>
                          <Text style={[s.expandedScore, { color: sc }]}>Score digestif · {r.score}/100</Text>
                          <View style={[s.scorebar]}><View style={[s.scorebarFill, { width: `${r.score}%`, backgroundColor: sc }]} /></View>
                        </View>
                        <View style={s.positives}>
                          {CAROTTE_POSITIVES.map((p, j) => (
                            <View key={j} style={s.positiveRow}>
                              <Text style={s.positiveCheck}>✅</Text>
                              <Text style={s.positiveTxt}>{p}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={[s.importBtn, imported && s.importBtnDone]}>
                          <Text style={[s.importBtnTxt, imported && s.importBtnDoneTxt]}>
                            {imported ? '✓  Ajouté' : '+  Importer'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          )}
        </View>

      ) : (

        /* ── LISTE ALIMENTS (après retour) ───────── */
        <View style={s.screen}>
          <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>
          <View style={s.topbar}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>Ma bibliothèque</Text>
              <Text style={s.screenTitle}>Aliments</Text>
            </View>
            <View style={s.countBadge}><Text style={s.countBadgeTxt}>44</Text></View>
          </View>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchBarPlaceholder}>Rechercher un aliment…</Text>
          </View>
          <Text style={s.sectionLabel}>Récemment ajoutés</Text>
          {FOODS_WITH_CARROT.map((f, i) => (
            <View key={i} style={[s.foodRow, i === 0 && s.foodRowNew]}>
              <Text style={s.foodIcon}>{f.icon}</Text>
              <View style={s.foodInfo}>
                <Text style={s.foodName} numberOfLines={1}>{f.name}</Text>
                <Text style={s.foodKcal}>{f.kcal} kcal / 100g</Text>
              </View>
              <Text style={s.foodChev}>›</Text>
            </View>
          ))}
        </View>

      )}

      {/* ── FICHE DÉTAIL CAROTTE ──────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.18, transform: [{ translateY: foodDetailSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.handle} />
        {/* Mini topbar avec bouton édition */}
        <View style={s.detailTopbar}>
          <Text style={s.detailBackBtn}>←</Text>
          <Text style={s.detailTopbarTitle}>Carotte</Text>
          <View style={s.editBtn}><Text style={s.editBtnTxt}>✏</Text></View>
        </View>
        <Animated.View style={{ transform: [{ translateY: detailScroll }] }}>
          <Text style={s.dName}>🥕 Carotte</Text>
          <Text style={s.dKcal}>41 kcal · 100g</Text>
          <View style={s.dMacros}>
            {[
              { l: 'Glucides',  v: '9.6g', p: 38, c: Colors.signal },
              { l: 'Protéines', v: '0.9g', p: 6,  c: Colors.ok     },
              { l: 'Lipides',   v: '0.2g', p: 2,  c: Colors.muted  },
              { l: 'Fibres',    v: '2.9g', p: 18, c: Colors.ink    },
              { l: 'Vitamine A', v: '835µg', p: 93, c: Colors.ok   },
              { l: 'Potassium', v: '320mg', p: 14, c: Colors.signal },
            ].map(m => (
              <View key={m.l} style={s.dMacroRow}>
                <Text style={s.dMacroL}>{m.l}</Text>
                <View style={s.dMacroBar}><View style={[s.dMacroFill, { width: `${m.p}%`, backgroundColor: m.c }]} /></View>
                <Text style={s.dMacroV}>{m.v}</Text>
              </View>
            ))}
          </View>
          <View style={s.sourceRow}>
            <Text style={s.sourceTxt}>Source · Open Food Facts</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── ÉCRAN ÉDITION ─────────────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.12, transform: [{ translateY: editSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.handle} />
        <View style={s.editTopbar}>
          <Text style={s.editTopbarTitle}>Modifier l'aliment</Text>
        </View>
        {[
          { label: 'Nom',          value: 'Carotte' },
          { label: 'Kcal / 100g',  value: '41' },
          { label: 'Glucides (g)', value: '9.6' },
          { label: 'Protéines (g)',value: '0.9' },
          { label: 'Lipides (g)',  value: '0.2' },
          { label: 'Fibres (g)',   value: '2.9' },
        ].map(f => (
          <View key={f.label} style={s.formRow}>
            <Text style={s.formLabel}>{f.label}</Text>
            <View style={s.formInput}>
              <Text style={s.formValue}>{f.value}</Text>
            </View>
          </View>
        ))}
        <View style={s.saveBtn}>
          <Text style={s.saveBtnTxt}>Enregistrer</Text>
        </View>
      </Animated.View>

    </DemoShell>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 54, paddingHorizontal: 20 },
  badge:  { position: 'absolute', top: 14, right: 20, backgroundColor: Colors.signal + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.signal + '55', zIndex: 10 },
  badgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 9, color: Colors.signal, letterSpacing: 1.2 },

  topbar:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn:     { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.ink, paddingRight: 4 },
  eyebrow:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  screenTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink },
  countBadge:  { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.hairline },
  countBadgeTxt:{ fontFamily: Fonts.monoMedium, fontSize: 13, color: Colors.ink },

  searchBar:            { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, gap: 8, marginBottom: 14, borderWidth: 1, borderColor: Colors.hairline },
  searchIcon:           { fontSize: 14 },
  searchBarPlaceholder: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted2, flex: 1 },

  categoryStrip: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'nowrap', overflow: 'hidden' },
  chip:          { backgroundColor: Colors.card, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.hairline },
  chipActive:    { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipTxt:       { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },
  chipTxtActive: { color: Colors.paper },

  loadingRow: { alignItems: 'center', paddingTop: 30 },
  loadingTxt: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, fontStyle: 'italic' },

  resultsCount: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, marginBottom: 8, letterSpacing: 0.5 },

  offRow:   { marginBottom: 4 },
  offIcon:  { fontSize: 20, marginBottom: 0 },
  offInfo:  { flex: 1 },
  offName:  { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  offKcal:  { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, marginTop: 1 },

  scorePill:  { flexDirection: 'row', alignItems: 'baseline', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  scoreNum:   { fontFamily: Fonts.monoMedium, fontSize: 14 },
  scoreSlash: { fontFamily: Fonts.mono, fontSize: 10 },

  expandedCard:   { marginTop: 8, marginBottom: 8, backgroundColor: Colors.card, borderRadius: 12, padding: 14 },
  expandedHeader: { marginBottom: 10 },
  expandedScore:  { fontFamily: Fonts.sansSemiBold, fontSize: 12, marginBottom: 6 },
  scorebar:       { height: 4, backgroundColor: Colors.hairline, borderRadius: 2 },
  scorebarFill:   { height: 4, borderRadius: 2 },
  positives:      { gap: 6, marginBottom: 14 },
  positiveRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  positiveCheck:  { fontSize: 14 },
  positiveTxt:    { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink },
  importBtn:      { backgroundColor: Colors.card, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.hairline },
  importBtnDone:  { backgroundColor: Colors.ok + '18', borderColor: Colors.ok },
  importBtnTxt:   { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
  importBtnDoneTxt: { color: Colors.ok },

  // Foods list
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  foodRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.hairline, gap: 12 },
  foodRowNew:   { backgroundColor: Colors.ok + '12', marginHorizontal: -20, paddingHorizontal: 20 },
  foodIcon:     { fontSize: 20 },
  foodInfo:     { flex: 1 },
  foodName:     { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  foodKcal:     { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, marginTop: 1 },
  foodChev:     { fontFamily: Fonts.sans, fontSize: 20, color: Colors.muted2 },

  // Sheets
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.11, shadowRadius: 18, elevation: 20, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24 },
  handle: { width: 40, height: 4, backgroundColor: Colors.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },

  // Detail topbar
  detailTopbar:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  detailBackBtn:    { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.ink, marginRight: 8 },
  detailTopbarTitle:{ fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink, flex: 1 },
  editBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline, alignItems: 'center', justifyContent: 'center' },
  editBtnTxt:       { fontSize: 15 },

  // Food detail content
  dName:     { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, marginBottom: 4 },
  dKcal:     { fontFamily: Fonts.mono,  fontSize: 13, color: Colors.muted, marginBottom: 18 },
  dMacros:   { gap: 9, marginBottom: 16 },
  dMacroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dMacroL:   { fontFamily: Fonts.sans,       fontSize: 11, color: Colors.muted, width: 78 },
  dMacroBar: { flex: 1, height: 5, backgroundColor: Colors.hairline, borderRadius: 3 },
  dMacroFill:{ height: 5, borderRadius: 3 },
  dMacroV:   { fontFamily: Fonts.monoMedium, fontSize: 11, color: Colors.ink, width: 40, textAlign: 'right' },
  sourceRow: { paddingTop: 8 },
  sourceTxt: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2 },

  // Edit screen
  editTopbar:      { marginBottom: 16 },
  editTopbarTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink },
  formRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.hairline },
  formLabel: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  formInput: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.hairline },
  formValue: { fontFamily: Fonts.mono, fontSize: 13, color: Colors.ink },
  saveBtn:   { marginTop: 20, backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt:{ fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper },
});
