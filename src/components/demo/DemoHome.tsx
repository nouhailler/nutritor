import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const QUERY = 'Banane';
const RESULTS = [
  { name: 'Banane',           kcal: 89,  unit: '100g' },
  { name: 'Banane plantain',  kcal: 122, unit: '100g' },
  { name: 'Banane séchée',    kcal: 346, unit: '100g' },
];
const EVENTS = [
  { time: '12:30', icon: '🍽', label: 'Déjeuner · 89 kcal',    color: Colors.ink    },
  { time: '14:00', icon: '⚡', label: 'Pic glycémique prédit',  color: Colors.signal },
  { time: '15:30', icon: '🫃', label: 'Digestion active',       color: Colors.ok     },
  { time: '17:00', icon: '🌬', label: 'Fermentation légère',    color: Colors.muted  },
];
const INSIGHT =
  "Les glucides rapides de la banane produisent un pic glycémique 1–2h après le repas, souvent suivi d'une baisse d'énergie en fin d'après-midi.";

const PHASES = ['journal', 'search', 'detail', 'timeline'] as const;
type Phase = typeof PHASES[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoHome({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, timersRef, cursorRef, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,       setPhase]       = useState<Phase>('journal');
  const [typed,       setTyped]       = useState('');
  const [showResults, setShowResults] = useState(false);
  const [foodAdded,   setFoodAdded]   = useState(false);
  const [evtCount,    setEvtCount]    = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  const [cursor,      setCursor]      = useState(false);
  const [caption,     setCaption]     = useState('');

  const sSlide   = useRef(new Animated.Value(SH)).current;
  const dSlide   = useRef(new Animated.Value(SH)).current;
  const tOpacity = useRef(new Animated.Value(0)).current;
  const iSlide   = useRef(new Animated.Value(150)).current;

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

    const run = () => {
      clearAll();
      setPhase('journal'); setTyped(''); setShowResults(false);
      setFoodAdded(false); setEvtCount(0); setShowInsight(false);
      setCursor(false); stopCursor(); setCaption('');

      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.85 - 26);
      engine.fingerY.setValue(SH * 0.75 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      sSlide.setValue(SH); dSlide.setValue(SH);
      tOpacity.setValue(0); iSlide.setValue(150);

      at(100, fadeIn);
      at(1100, () => { engine.fOpacity.setValue(1); move(SW * 0.84, SH * 0.80, 420); setCaption('Tape + pour ajouter un aliment au repas'); });
      at(1900, tap);
      at(2060, () => {
        setPhase('search');
        setCaption('Recherche dans ta bibliothèque d\'aliments');
        Animated.timing(sSlide, { toValue: 0, duration: 390, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      at(2800, () => move(SW * 0.5, SH * 0.24, 560));
      at(3500, () => { tap(); startCursor(); setCaption('Tape le nom de l\'aliment'); });

      const T0 = 3850;
      at(T0, () => {
        QUERY.split('').forEach((_, i) => {
          timersRef.current.push(setTimeout(() => setTyped(QUERY.slice(0, i + 1)), i * 130));
        });
      });

      const afterType = T0 + QUERY.length * 130;
      at(afterType + 460, () => { stopCursor(); setShowResults(true); setCaption('Sélectionne un résultat pour voir sa fiche'); });
      at(afterType + 1000, () => move(SW * 0.5, SH * 0.47, 500));
      at(afterType + 1660, tap);
      at(afterType + 1820, () => {
        setPhase('detail');
        setCaption('Fiche nutritionnelle avec macros pour 100g');
        Animated.timing(dSlide, { toValue: 0, duration: 390, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      at(afterType + 3100, () => move(SW * 0.5, SH * 0.73, 520));
      at(afterType + 3760, tap);
      at(afterType + 3960, () => { setFoodAdded(true); setCaption('Banane ajoutée au Déjeuner !'); });
      at(afterType + 4660, () => {
        setPhase('timeline');
        setCaption('Timeline digestive prédite sur 24h');
        Animated.parallel([
          Animated.timing(sSlide,   { toValue: SH, duration: 300, useNativeDriver: true }),
          Animated.timing(dSlide,   { toValue: SH, duration: 300, useNativeDriver: true }),
          Animated.timing(engine.fOpacity, { toValue: 0, duration: 360, useNativeDriver: true }),
        ]).start();
      });
      at(afterType + 5300, () =>
        Animated.timing(tOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start()
      );
      EVENTS.forEach((_, i) => {
        at(afterType + 5800 + i * 700, () => setEvtCount(i + 1));
      });

      const insightAt = afterType + 5800 + EVENTS.length * 700 + 320;
      at(insightAt, () => {
        setShowInsight(true);
        setCaption('L\'IA analyse l\'impact sur ta digestion');
        Animated.timing(iSlide, { toValue: 0, duration: 440, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start();
      });
      at(insightAt + 4400, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>

      {/* ── JOURNAL ─────────────────────────────────── */}
      <View style={s.journal}>
        <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>
        <View style={s.jHead}>
          <Text style={s.jTitle}>Journal du jour</Text>
          <Text style={s.jSub}>jeudi 22 mai 2026</Text>
        </View>

        <View style={s.calorieCard}>
          <View style={s.ring}>
            <Text style={s.ringN}>{foodAdded ? '289' : '200'}</Text>
            <Text style={s.ringU}>kcal</Text>
          </View>
          <View style={s.macros}>
            {[
              { l: 'Protéines', v: foodAdded ? '14g' : '12g', p: foodAdded ? 28 : 24 },
              { l: 'Glucides',  v: foodAdded ? '45g' : '22g', p: foodAdded ? 42 : 20 },
              { l: 'Lipides',   v: '8g', p: 18 },
            ].map(m => (
              <View key={m.l} style={s.macroRow}>
                <Text style={s.macroL}>{m.l}</Text>
                <View style={s.macroBar}><View style={[s.macroFill, { width: `${m.p}%` }]} /></View>
                <Text style={s.macroV}>{m.v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.mealCard}>
          <View style={s.mealHead}>
            <Text style={s.mealName}>🌿 Déjeuner</Text>
            <Text style={s.mealTime}>12:30</Text>
          </View>
          {foodAdded
            ? <View style={s.mealFood}><Text style={s.mealFoodN}>🍌 Banane</Text><Text style={s.mealFoodM}>100g · 89 kcal</Text></View>
            : <Text style={s.mealEmpty}>Aucun aliment ajouté</Text>
          }
        </View>

        {phase === 'timeline' && (
          <Animated.View style={[s.tlSection, { opacity: tOpacity }]}>
            <Text style={s.tlTitle}>Physiologie du repas</Text>
            {EVENTS.slice(0, evtCount).map((e, i) => (
              <View key={i} style={s.tlRow}>
                <Text style={s.tlTime}>{e.time}</Text>
                <View style={[s.tlDot, { backgroundColor: e.color }]} />
                <Text style={[s.tlLabel, { color: e.color }]}>{e.icon} {e.label}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {showInsight && (
          <Animated.View style={[s.insight, { transform: [{ translateY: iSlide }] }]}>
            <Text style={s.insightIcon}>💡</Text>
            <Text style={s.insightTxt}>{INSIGHT}</Text>
          </Animated.View>
        )}
      </View>

      {/* ── RECHERCHE ───────────────────────────────── */}
      <Animated.View style={[s.sheet, { top: SH * 0.07, transform: [{ translateY: sSlide }] }]} pointerEvents="none">
        <View style={s.handle} />
        <Text style={s.sheetTitle}>Rechercher un aliment</Text>
        <View style={s.searchBox}>
          <Text style={s.searchTxt}>
            {typed}<Text style={[s.searchCursor, { opacity: cursor ? 1 : 0 }]}>|</Text>
          </Text>
        </View>
        {showResults && RESULTS.map((r, i) => (
          <View key={i} style={[s.result, i === 0 && s.resultFirst]}>
            <View>
              <Text style={s.resultN}>{r.name}</Text>
              <Text style={s.resultK}>{r.kcal} kcal / {r.unit}</Text>
            </View>
            <Text style={s.resultChev}>›</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── FICHE ALIMENT ───────────────────────────── */}
      <Animated.View style={[s.sheet, { top: SH * 0.28, transform: [{ translateY: dSlide }] }]} pointerEvents="none">
        <View style={s.handle} />
        <Text style={s.dName}>🍌 Banane</Text>
        <Text style={s.dKcal}>89 kcal · 100g</Text>
        <View style={s.dMacros}>
          {[
            { l: 'Glucides',  v: '23g',  p: 52, c: Colors.signal },
            { l: 'Protéines', v: '1g',   p: 8,  c: Colors.ok     },
            { l: 'Lipides',   v: '0.3g', p: 3,  c: Colors.muted  },
          ].map(m => (
            <View key={m.l} style={s.dMacroRow}>
              <Text style={s.dMacroL}>{m.l}</Text>
              <View style={s.dMacroBar}><View style={[s.dMacroFill, { width: `${m.p}%`, backgroundColor: m.c }]} /></View>
              <Text style={s.dMacroV}>{m.v}</Text>
            </View>
          ))}
        </View>
        <View style={s.dBtn}><Text style={s.dBtnTxt}>+ Ajouter au Déjeuner</Text></View>
      </Animated.View>

    </DemoShell>
  );
}

const s = StyleSheet.create({
  journal: { flex: 1, paddingTop: 56, paddingHorizontal: 20 },
  badge: { position: 'absolute', top: 16, right: 20, backgroundColor: Colors.signal + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.signal + '55' },
  badgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 9, color: Colors.signal, letterSpacing: 1.2 },
  jHead:  { marginBottom: 18 },
  jTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, marginBottom: 3 },
  jSub:   { fontFamily: Fonts.sans,  fontSize: 12, color: Colors.muted },
  calorieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 18, padding: 16, marginBottom: 12, gap: 16 },
  ring: { width: 78, height: 78, borderRadius: 39, borderWidth: 7, borderColor: Colors.hairline, justifyContent: 'center', alignItems: 'center' },
  ringN: { fontFamily: Fonts.monoMedium, fontSize: 16, color: Colors.ink },
  ringU: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.muted },
  macros: { flex: 1, gap: 7 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroL:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, width: 64 },
  macroBar: { flex: 1, height: 4, backgroundColor: Colors.hairline, borderRadius: 2 },
  macroFill:{ height: 4, borderRadius: 2, backgroundColor: Colors.ink },
  macroV:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.ink, width: 28, textAlign: 'right' },
  mealCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealName: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  mealTime: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },
  mealFood: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealFoodN:{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink },
  mealFoodM:{ fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },
  mealEmpty:{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted2, fontStyle: 'italic' },
  tlSection:{ backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  tlTitle:  { fontFamily: Fonts.sansSemiBold, fontSize: 10, color: Colors.muted, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  tlRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  tlTime:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, width: 38 },
  tlDot:    { width: 8, height: 8, borderRadius: 4 },
  tlLabel:  { fontFamily: Fonts.sans, fontSize: 13, flex: 1 },
  insight:  { backgroundColor: Colors.card, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderLeftWidth: 3, borderLeftColor: Colors.signal },
  insightIcon: { fontSize: 18 },
  insightTxt:  { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink, flex: 1, lineHeight: 19 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.11, shadowRadius: 18, elevation: 20, paddingTop: 12, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, backgroundColor: Colors.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, marginBottom: 14 },
  searchBox: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, borderWidth: 1.5, borderColor: Colors.hairline },
  searchTxt: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, minHeight: 22 },
  searchCursor: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink },
  result:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.hairline },
  resultFirst: { backgroundColor: Colors.ok + '14' },
  resultN:   { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
  resultK:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, marginTop: 2 },
  resultChev:{ fontFamily: Fonts.sans, fontSize: 22, color: Colors.muted2 },
  dName:  { fontFamily: Fonts.serif, fontSize: 26, color: Colors.ink, marginBottom: 4 },
  dKcal:  { fontFamily: Fonts.mono, fontSize: 13, color: Colors.muted, marginBottom: 22 },
  dMacros:{ gap: 12, marginBottom: 30 },
  dMacroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dMacroL:   { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, width: 72 },
  dMacroBar: { flex: 1, height: 6, backgroundColor: Colors.hairline, borderRadius: 3 },
  dMacroFill:{ height: 6, borderRadius: 3 },
  dMacroV:   { fontFamily: Fonts.monoMedium, fontSize: 12, color: Colors.ink, width: 34, textAlign: 'right' },
  dBtn:    { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  dBtnTxt: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper },
});
