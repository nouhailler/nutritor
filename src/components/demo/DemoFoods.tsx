import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const QUERY = 'poivron';
const CIQUAL_RESULTS = [
  {
    name: 'Poivron, vert, jaune ou rouge, cru',
    kcal: 26,
    carbs: '6.0g', protein: '1.0g', fat: '0.2g',
  },
  {
    name: 'Poivron rouge confit',
    kcal: 48,
    carbs: '9.1g', protein: '1.2g', fat: '0.3g',
  },
];
const FAKE_FOODS_INITIAL = [
  { icon: '🥚', name: 'Œuf entier',       kcal: 155 },
  { icon: '🍌', name: 'Banane',            kcal: 89  },
  { icon: '🌾', name: 'Farine de blé T55', kcal: 364 },
];
const POIVRON = { icon: '🫑', name: 'Poivron, vert, jaune ou rouge, cru', kcal: 26 };
const MEAL_NAMES = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'];

const PHASES = ['list', 'search', 'ciqual', 'detail', 'add-meal'] as const;
type Phase = typeof PHASES[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoFoods({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, timersRef, cursorRef, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,         setPhase]         = useState<Phase>('list');
  const [typed,         setTyped]         = useState('');
  const [cursor,        setCursor]        = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [showActions,   setShowActions]   = useState(false);
  const [poivronAdded,  setPoivronAdded]  = useState(false);
  const [portion,       setPortion]       = useState(100);
  const [mealSelected,  setMealSelected]  = useState(false);
  const [caption,       setCaption]       = useState('');

  const ciqualSlide  = useRef(new Animated.Value(SH)).current;
  const detailSlide  = useRef(new Animated.Value(SH)).current;
  const mealSlide    = useRef(new Animated.Value(SH)).current;
  const bannerAnim   = useRef(new Animated.Value(80)).current;
  const scrollOffset = useRef(new Animated.Value(0)).current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }

    isRunning.current = true;

    const startCursor = () => {
      if (cursorRef.current) clearInterval(cursorRef.current);
      cursorRef.current = setInterval(() => setCursor(v => !v), 530);
    };
    const stopCursor = () => {
      if (cursorRef.current) { clearInterval(cursorRef.current); cursorRef.current = null; }
      setCursor(false);
    };

    const slideShow = (av: Animated.Value, top: number) =>
      Animated.timing(av, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const slideHide = (av: Animated.Value) =>
      Animated.timing(av, { toValue: SH, duration: 300, useNativeDriver: true }).start();

    const run = () => {
      clearAll();
      setPhase('list'); setTyped(''); setCursor(false);
      setShowNoResults(false); setShowActions(false);
      setPoivronAdded(false); setPortion(100); setMealSelected(false);
      stopCursor(); setCaption('');

      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26); engine.fingerY.setValue(SH * 0.3 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      ciqualSlide.setValue(SH); detailSlide.setValue(SH); mealSlide.setValue(SH);
      bannerAnim.setValue(80); scrollOffset.setValue(0);

      // t=0.1s : fade in liste
      at(100, fadeIn);

      // t=1.0s : doigt apparaît vers la barre de recherche
      at(1000, () => { engine.fOpacity.setValue(1); move(SW * 0.5, SH * 0.26, 400); });

      // t=1.7s : tap sur la barre de recherche
      at(1700, () => { tap(); setPhase('search'); startCursor(); setCaption('Recherche un aliment dans ta bibliothèque'); });

      // t=2.1s : frappe "poivron" (7 chars × 130ms = 910ms)
      const T0 = 2100;
      at(T0, () => {
        setCaption('Tape le nom de l\'aliment à rechercher');
        QUERY.split('').forEach((_, i) => {
          timersRef.current.push(setTimeout(() => setTyped(QUERY.slice(0, i + 1)), i * 130));
        });
      });
      const afterType = T0 + QUERY.length * 130;

      // aucun résultat + boutons d'action
      at(afterType + 350, () => { stopCursor(); setShowNoResults(true); setCaption('Absent de ta liste ? Importe-le !'); });
      at(afterType + 700, () => setShowActions(true));

      // t~4.5s : doigt vers le bouton CIQUAL
      at(afterType + 1200, () => move(SW * 0.25, SH * 0.58, 500));

      // t~5.2s : tap CIQUAL → écran CIQUAL slide-up
      at(afterType + 1850, tap);
      at(afterType + 2000, () => {
        setPhase('ciqual');
        setCaption('CIQUAL : base officielle française de nutrition');
        slideShow(ciqualSlide, SH * 0.07);
      });

      // t~6.3s : doigt vers "+" sur le premier résultat
      at(afterType + 3100, () => move(SW * 0.88, SH * 0.44, 500));

      // t~6.9s : tap "+" → bannière IA apparaît
      at(afterType + 3750, tap);
      at(afterType + 3900, () => {
        setCaption('L\'IA enrichit la fiche en arrière-plan');
        Animated.timing(bannerAnim, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });

      // t~7.8s : doigt vers la bannière
      at(afterType + 4650, () => move(SW * 0.5, SH * 0.88, 500));

      // t~8.4s : tap bannière → disparaît
      at(afterType + 5300, tap);
      at(afterType + 5450, () => {
        Animated.timing(bannerAnim, { toValue: 80, duration: 300, useNativeDriver: true }).start();
      });

      // t~9.0s : doigt vers ← retour
      at(afterType + 5900, () => move(SW * 0.12, SH * 0.12, 400));

      // t~9.6s : tap retour → CIQUAL se ferme
      at(afterType + 6500, tap);
      at(afterType + 6650, () => {
        slideHide(ciqualSlide);
        setCaption('Le poivron est maintenant dans ta liste');
        setTimeout(() => {
          setPhase('list'); setTyped(''); setShowNoResults(false); setShowActions(false);
          setPoivronAdded(true);
        }, 320);
      });

      // t~10.7s : doigt vers le poivron dans la liste
      at(afterType + 7700, () => move(SW * 0.5, SH * 0.40, 500));

      // t~11.4s : tap poivron → fiche détail
      at(afterType + 8350, tap);
      at(afterType + 8500, () => {
        setPhase('detail');
        setCaption('Ajuste la portion avant d\'ajouter au repas');
        slideShow(detailSlide, SH * 0.20);
      });

      // t~12.5s : scroll vers le bas (infos nutritionnelles)
      at(afterType + 9400, () => {
        Animated.timing(scrollOffset, { toValue: -90, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
      });

      // t~13.8s : doigt vers le bouton "-" de la portion
      at(afterType + 10600, () => move(SW * 0.28, SH * 0.65, 400));

      // t~14.4–16.0s : 4 taps "-" : 100 → 90 → 80 → 70 → 60
      [90, 80, 70, 60].forEach((val, i) => {
        at(afterType + 11100 + i * 550, () => {
          tap(); setPortion(val);
          if (i === 0) setCaption('Réduis la portion avec le bouton −');
        });
      });

      // t~16.5s : doigt vers "Ajouter au repas"
      at(afterType + 13400, () => move(SW * 0.5, SH * 0.77, 500));

      // t~17.2s : tap "Ajouter" → sélecteur de repas
      at(afterType + 14050, tap);
      at(afterType + 14200, () => {
        setCaption('Sélectionne le repas pour l\'ajout');
        slideShow(mealSlide, SH * 0.45);
      });

      // t~17.9s : doigt vers "Déjeuner"
      at(afterType + 14900, () => move(SW * 0.5, SH * 0.60, 400));

      // t~18.5s : tap "Déjeuner" → succès
      at(afterType + 15500, tap);
      at(afterType + 15650, () => { setMealSelected(true); setCaption('Ajouté au journal du jour !'); });

      // t~20.5s : boucle
      at(afterType + 17500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const foods = poivronAdded
    ? [POIVRON, ...FAKE_FOODS_INITIAL]
    : FAKE_FOODS_INITIAL;

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>

      {/* ── LISTE ALIMENTS ──────────────────────────── */}
      <View style={s.screen}>

        <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>

        {/* Topbar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.eyebrow}>Ma bibliothèque</Text>
            <Text style={s.screenTitle}>Aliments</Text>
          </View>
          <View style={s.countBadge}>
            <Text style={s.countBadgeTxt}>{poivronAdded ? '43' : '42'}</Text>
          </View>
        </View>

        {/* Barre de recherche */}
        <View style={[s.searchBar, (phase === 'search') && s.searchBarFocused]}>
          <Text style={s.searchIcon}>🔍</Text>
          <Text style={[s.searchBarTxt, !typed && s.searchBarPlaceholder]}>
            {typed || 'Rechercher un aliment…'}
            {typed ? <Text style={[s.searchCursor, { opacity: cursor ? 1 : 0 }]}>|</Text> : null}
          </Text>
        </View>

        {/* Aucun résultat */}
        {showNoResults && (
          <View style={s.noResults}>
            <Text style={s.noResultsTxt}>Aucun résultat pour « {typed} »</Text>
            {showActions && (
              <View style={s.actionRow}>
                <View style={[s.actionBtn, s.actionBtnPrimary]}>
                  <Text style={s.actionBtnPrimaryTxt}>CIQUAL</Text>
                </View>
                <View style={s.actionBtn}>
                  <Text style={s.actionBtnTxt}>IA ✨</Text>
                </View>
                <View style={s.actionBtn}>
                  <Text style={s.actionBtnTxt}>Scanner</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Liste des aliments */}
        {phase !== 'search' && !showNoResults && (
          <View style={s.foodList}>
            {poivronAdded && (
              <Text style={s.sectionLabel}>Récemment ajoutés</Text>
            )}
            {foods.map((f, i) => (
              <View key={i} style={[s.foodRow, i === 0 && poivronAdded && s.foodRowHighlight]}>
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
      </View>

      {/* ── ÉCRAN CIQUAL ──────────────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.07, transform: [{ translateY: ciqualSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.sheetNav}>
          <Text style={s.backBtn}>← CIQUAL · Base officielle</Text>
        </View>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <Text style={s.searchBarTxt}>{typed || 'poivron'}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          {CIQUAL_RESULTS.map((r, i) => (
            <View key={i} style={[s.ciqualRow, i === 0 && s.ciqualRowFirst]}>
              <View style={s.ciqualInfo}>
                <Text style={s.ciqualName} numberOfLines={2}>{r.name}</Text>
                <Text style={s.ciqualMeta}>
                  {r.kcal} kcal · G {r.carbs}  P {r.protein}  L {r.fat}
                </Text>
              </View>
              <View style={[s.addBtn, i === 0 && s.addBtnHighlight]}>
                <Text style={[s.addBtnTxt, i === 0 && s.addBtnTxtHighlight]}>+</Text>
              </View>
            </View>
          ))}
        </View>
        {/* Bannière IA */}
        <Animated.View style={[s.aiBanner, { transform: [{ translateY: bannerAnim }] }]}>
          <Text style={s.aiBannerIcon}>✨</Text>
          <View style={s.aiBannerText}>
            <Text style={s.aiBannerTitle}>Enrichissement IA en cours…</Text>
            <Text style={s.aiBannerSub} numberOfLines={1}>{CIQUAL_RESULTS[0].name}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── FICHE DÉTAIL POIVRON ───────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.20, transform: [{ translateY: detailSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.handle} />
        <Animated.View style={{ transform: [{ translateY: scrollOffset }] }}>
          <Text style={s.dName}>🫑 Poivron</Text>
          <Text style={s.dSubname}>vert, jaune ou rouge, cru</Text>
          <Text style={s.dKcal}>26 kcal · 100g</Text>
          <View style={s.dMacros}>
            {[
              { l: 'Glucides',   v: '6.0g', p: 24, c: Colors.signal },
              { l: 'Protéines',  v: '1.0g', p: 8,  c: Colors.ok     },
              { l: 'Lipides',    v: '0.2g', p: 2,  c: Colors.muted  },
              { l: 'Fibres',     v: '2.1g', p: 14, c: Colors.ink    },
            ].map(m => (
              <View key={m.l} style={s.dMacroRow}>
                <Text style={s.dMacroL}>{m.l}</Text>
                <View style={s.dMacroBar}><View style={[s.dMacroFill, { width: `${m.p}%`, backgroundColor: m.c }]} /></View>
                <Text style={s.dMacroV}>{m.v}</Text>
              </View>
            ))}
          </View>
          <View style={s.portionRow}>
            <View style={s.portionBtn}><Text style={s.portionBtnTxt}>−</Text></View>
            <Text style={s.portionVal}>{portion}g</Text>
            <View style={s.portionBtn}><Text style={s.portionBtnTxt}>+</Text></View>
          </View>
          <View style={[s.dBtn, mealSelected && s.dBtnSuccess]}>
            <Text style={s.dBtnTxt}>
              {mealSelected ? '✓ Ajouté au Déjeuner' : '+ Ajouter au repas'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── SÉLECTEUR DE REPAS ─────────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.45, transform: [{ translateY: mealSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.handle} />
        <Text style={s.mealPickerTitle}>Ajouter à un repas · {portion}g</Text>
        {MEAL_NAMES.map((name, i) => (
          <View key={i} style={[s.mealPickerRow, i === 1 && s.mealPickerRowSelected]}>
            <Text style={[s.mealPickerName, i === 1 && s.mealPickerNameSelected]}>{name}</Text>
            {i === 1 && <Text style={s.mealPickerCheck}>✓</Text>}
          </View>
        ))}
      </Animated.View>

    </DemoShell>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 54, paddingHorizontal: 20 },
  badge:  { position: 'absolute', top: 14, right: 20, backgroundColor: Colors.signal + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.signal + '55' },
  badgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 9, color: Colors.signal, letterSpacing: 1.2 },

  topbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  eyebrow:      { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  screenTitle:  { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink },
  countBadge:   { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.hairline },
  countBadgeTxt:{ fontFamily: Fonts.monoMedium, fontSize: 13, color: Colors.ink },

  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, gap: 8, marginBottom: 16, borderWidth: 1, borderColor: Colors.hairline },
  searchBarFocused: { borderColor: Colors.ink + '40' },
  searchIcon:     { fontSize: 14 },
  searchBarTxt:   { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink, flex: 1 },
  searchBarPlaceholder: { color: Colors.muted2 },
  searchCursor:   { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },

  noResults:    { alignItems: 'center', paddingTop: 24 },
  noResultsTxt: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted, marginBottom: 20 },
  actionRow:    { flexDirection: 'row', gap: 10 },
  actionBtn:    { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.hairline },
  actionBtnPrimary: { backgroundColor: Colors.ink },
  actionBtnTxt: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.muted },
  actionBtnPrimaryTxt: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.paper },

  sectionLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  foodList:     { gap: 2 },
  foodRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.hairline, gap: 12 },
  foodRowHighlight: { backgroundColor: Colors.ok + '12', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 0 },
  foodIcon:     { fontSize: 20 },
  foodInfo:     { flex: 1 },
  foodName:     { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  foodKcal:     { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, marginTop: 1 },
  foodChev:     { fontFamily: Fonts.sans, fontSize: 20, color: Colors.muted2 },

  sheet:        { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.11, shadowRadius: 18, elevation: 20, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 20 },
  handle:       { width: 40, height: 4, backgroundColor: Colors.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetNav:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:      { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },

  ciqualRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.hairline, gap: 12 },
  ciqualRowFirst: { backgroundColor: Colors.ok + '10' },
  ciqualInfo:   { flex: 1 },
  ciqualName:   { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  ciqualMeta:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, marginTop: 3 },
  addBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline, alignItems: 'center', justifyContent: 'center' },
  addBtnHighlight: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  addBtnTxt:       { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.muted },
  addBtnTxtHighlight: { color: Colors.paper },

  aiBanner:     { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  aiBannerIcon: { fontSize: 18 },
  aiBannerText: { flex: 1 },
  aiBannerTitle:{ fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.paper },
  aiBannerSub:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.paper + 'aa', marginTop: 2 },

  dName:    { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, marginBottom: 2 },
  dSubname: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginBottom: 4 },
  dKcal:    { fontFamily: Fonts.mono, fontSize: 13, color: Colors.muted, marginBottom: 18 },
  dMacros:  { gap: 10, marginBottom: 22 },
  dMacroRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  dMacroL:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, width: 72 },
  dMacroBar:{ flex: 1, height: 5, backgroundColor: Colors.hairline, borderRadius: 3 },
  dMacroFill:{ height: 5, borderRadius: 3 },
  dMacroV:  { fontFamily: Fonts.monoMedium, fontSize: 11, color: Colors.ink, width: 34, textAlign: 'right' },

  portionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 },
  portionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline, alignItems: 'center', justifyContent: 'center' },
  portionBtnTxt: { fontFamily: Fonts.sansSemiBold, fontSize: 20, color: Colors.ink },
  portionVal:    { fontFamily: Fonts.monoMedium, fontSize: 20, color: Colors.ink, width: 60, textAlign: 'center' },

  dBtn:       { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  dBtnSuccess:{ backgroundColor: Colors.ok },
  dBtnTxt:    { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper },

  mealPickerTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.muted, marginBottom: 12 },
  mealPickerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.hairline },
  mealPickerRowSelected: { backgroundColor: Colors.ok + '12', marginHorizontal: -20, paddingHorizontal: 20 },
  mealPickerName:  { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },
  mealPickerNameSelected: { fontFamily: Fonts.sansSemiBold, color: Colors.ok },
  mealPickerCheck: { fontFamily: Fonts.sans, fontSize: 16, color: Colors.ok },
});
