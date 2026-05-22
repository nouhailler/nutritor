import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const QUERY = 'tomate';

const RESULTS = [
  { name: 'Tomate, crue',           group: 'Légume',             kcal: 18, protein: '0.9g', fiber: '1.2g' },
  { name: 'Tomate cerise, crue',    group: 'Légume',             kcal: 21, protein: '1.0g', fiber: '1.5g' },
  { name: 'Tomate, concentrée',     group: 'Légume transformé',  kcal: 82, protein: '4.1g', fiber: '2.5g' },
  { name: 'Tomate pelée en boîte',  group: 'Légume transformé',  kcal: 16, protein: '0.9g', fiber: '0.9g' },
];

const FOODS_WITH_TOMATE = [
  { name: 'Tomate, crue',                           kcal: 18 },
  { name: 'Poivron, vert, jaune ou rouge, cru',     kcal: 26 },
  { name: 'Banane',                                  kcal: 89 },
];

const PHASES = ['ciqual', 'results', 'foods-list', 'food-detail'] as const;
type Phase = typeof PHASES[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoCIQUAL({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, timersRef, cursorRef, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,       setPhase]       = useState<Phase>('ciqual');
  const [typed,       setTyped]       = useState('');
  const [cursor,      setCursor]      = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [imported,    setImported]    = useState(false);
  const [caption,     setCaption]     = useState('');

  const bannerAnim  = useRef(new Animated.Value(80)).current;
  const detailSlide = useRef(new Animated.Value(SH)).current;
  const scrollAnim  = useRef(new Animated.Value(0)).current;

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
      setPhase('ciqual'); setTyped(''); setCursor(false);
      setShowResults(false); setImported(false); setCaption('');
      stopCursor();

      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26); engine.fingerY.setValue(SH * 0.3 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      bannerAnim.setValue(80); detailSlide.setValue(SH); scrollAnim.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt apparaît vers la barre de recherche
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.5, SH * 0.20, 450);
        setCaption('3 167 aliments de référence · CIQUAL ANSES');
      });

      // t=2.4s : tap barre de recherche → curseur
      at(2400, () => { tap(); startCursor(); setCaption('Tape le nom de l\'aliment'); });

      // t=2.8s : frappe "tomate" (6 chars × 130ms = 780ms)
      const T0 = 2800;
      at(T0, () => {
        QUERY.split('').forEach((_, i) => {
          timersRef.current.push(setTimeout(() => setTyped(QUERY.slice(0, i + 1)), i * 130));
        });
      });
      const afterType = T0 + QUERY.length * 130;

      // résultats
      at(afterType + 400, () => {
        stopCursor();
        setShowResults(true);
        setPhase('results');
        setCaption('Données nutritionnelles officielles ANSES');
      });

      // t~6.2s : doigt vers le "+" du premier résultat
      at(afterType + 1600, () => move(SW * 0.88, SH * 0.32, 480));

      // t~6.9s : tap "+" → importé + bannière IA
      at(afterType + 2300, () => {
        tap();
        setImported(true);
        setCaption('Importé — enrichissement IA lancé');
        Animated.timing(bannerAnim, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });

      // t~8.1s : doigt vers ← retour
      at(afterType + 3500, () => move(SW * 0.12, SH * 0.10, 400));

      // t~8.7s : tap retour → liste aliments
      at(afterType + 4100, () => {
        tap();
        Animated.timing(bannerAnim, { toValue: 80, duration: 200, useNativeDriver: true }).start();
      });
      at(afterType + 4250, () => { setPhase('foods-list'); setCaption('Tomate ajoutée à ta bibliothèque'); });

      // t~9.5s : doigt vers "Tomate" dans la liste
      at(afterType + 5050, () => move(SW * 0.5, SH * 0.35, 480));

      // t~10.1s : tap → fiche détail
      at(afterType + 5700, () => {
        tap();
        setPhase('food-detail');
        setCaption('Fiche complète pour 100g · source CIQUAL');
        Animated.timing(detailSlide, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });

      // t~11.4s : scroll fiche vers le bas
      at(afterType + 6900, () => {
        Animated.timing(scrollAnim, { toValue: -70, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
      });

      // t~14.5s : boucle
      at(afterType + 10300, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const isListPhase = phase === 'foods-list' || phase === 'food-detail';

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>

      {!isListPhase ? (

        /* ── ÉCRAN CIQUAL ───────────────────────────── */
        <View style={s.screen}>
          <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>

          <View style={s.topbar}>
            <Text style={s.backBtn}>←</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>Base officielle française</Text>
              <Text style={s.screenTitle}>CIQUAL — ANSES</Text>
            </View>
          </View>

          <View style={[s.searchBar, showResults && s.searchBarActive]}>
            <Text style={s.searchIcon}>🔍</Text>
            {typed ? (
              <Text style={s.searchTxt}>
                {typed}<Text style={[s.cursor, { opacity: cursor ? 1 : 0 }]}>|</Text>
              </Text>
            ) : (
              <Text style={s.searchPlaceholder}>
                Rechercher parmi 3 167 aliments…
                <Text style={[s.cursor, { opacity: cursor ? 1 : 0 }]}>|</Text>
              </Text>
            )}
          </View>

          {!showResults ? (
            <View style={s.intro}>
              <Text style={s.introIcon}>🗂</Text>
              <Text style={s.introTitle}>3 167 aliments officiels</Text>
              <Text style={s.introDesc}>
                Table CIQUAL 2020 de l'ANSES — composition nutritionnelle de référence pour les aliments consommés en France
              </Text>
            </View>
          ) : (
            <View>
              <View style={s.resultHeader}>
                <Text style={s.resultCount}>4 résultats</Text>
                <Text style={s.resultSource}>CIQUAL 2020 · ANSES</Text>
              </View>
              {RESULTS.map((r, i) => (
                <View key={i} style={s.row}>
                  <View style={s.glyph}><Text style={s.glyphTxt}>{r.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={s.rowBody}>
                    <Text style={s.rowName} numberOfLines={1}>{r.name}</Text>
                    <Text style={s.rowGroup}>{r.group}</Text>
                    <View style={s.pills}>
                      <View style={s.pill}><Text style={s.pillTxt}>{r.kcal} kcal</Text></View>
                      <View style={s.pill}><Text style={s.pillTxt}>{r.protein} prot.</Text></View>
                      <View style={s.pill}><Text style={s.pillTxt}>{r.fiber} fibres</Text></View>
                    </View>
                  </View>
                  <View style={[s.importBtn, i === 0 && imported && s.importBtnDone]}>
                    <Text style={[s.importBtnTxt, i === 0 && imported && s.importBtnDoneTxt]}>
                      {i === 0 && imported ? '✓' : '+'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bannière IA */}
          <Animated.View style={[s.aiBanner, { transform: [{ translateY: bannerAnim }] }]}>
            <Text style={s.aiBannerIcon}>✨</Text>
            <View style={s.aiBannerText}>
              <Text style={s.aiBannerTitle}>Enrichissement IA en cours…</Text>
              <Text style={s.aiBannerSub} numberOfLines={1}>Tomate, crue</Text>
            </View>
          </Animated.View>
        </View>

      ) : (

        /* ── LISTE ALIMENTS ─────────────────────────── */
        <View style={s.screen}>
          <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>
          <View style={s.topbar}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>Ma bibliothèque</Text>
              <Text style={s.screenTitle}>Aliments</Text>
            </View>
            <View style={s.countBadge}><Text style={s.countBadgeTxt}>45</Text></View>
          </View>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchPlaceholder}>Rechercher un aliment…</Text>
          </View>
          <Text style={s.sectionLabel}>Récemment ajoutés</Text>
          {FOODS_WITH_TOMATE.map((f, i) => (
            <View key={i} style={[s.foodRow, i === 0 && s.foodRowNew]}>
              <View style={[s.glyph, s.glyphList]}>
                <Text style={s.glyphTxt}>{f.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowName} numberOfLines={1}>{f.name}</Text>
                <Text style={s.rowGroup}>{f.kcal} kcal / 100g</Text>
              </View>
              <Text style={s.foodChev}>›</Text>
            </View>
          ))}
        </View>

      )}

      {/* ── FICHE DÉTAIL TOMATE ───────────────────── */}
      <Animated.View
        style={[s.sheet, { top: SH * 0.20, transform: [{ translateY: detailSlide }] }]}
        pointerEvents="none"
      >
        <View style={s.handle} />
        <View style={s.detailTopbar}>
          <Text style={s.detailBack}>←</Text>
          <Text style={s.detailTitle}>Tomate, crue</Text>
        </View>
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          <Text style={s.dName}>Tomate, crue</Text>
          <Text style={s.dKcal}>18 kcal · 100g</Text>
          <View style={s.dMacros}>
            {[
              { l: 'Glucides',   v: '3.5g',  p: 14, c: Colors.signal },
              { l: 'Protéines',  v: '0.9g',  p: 6,  c: Colors.ok     },
              { l: 'Lipides',    v: '0.2g',  p: 2,  c: Colors.muted  },
              { l: 'Fibres',     v: '1.2g',  p: 9,  c: Colors.ink    },
              { l: 'Vitamine C', v: '19mg',  p: 28, c: Colors.ok     },
              { l: 'Eau',        v: '94.5g', p: 90, c: Colors.muted2 },
            ].map(m => (
              <View key={m.l} style={s.dMacroRow}>
                <Text style={s.dMacroL}>{m.l}</Text>
                <View style={s.dMacroBar}><View style={[s.dMacroFill, { width: `${m.p}%`, backgroundColor: m.c }]} /></View>
                <Text style={s.dMacroV}>{m.v}</Text>
              </View>
            ))}
          </View>
          <View style={s.sourceRow}>
            <Text style={s.sourceTxt}>Source · CIQUAL 2020 · ANSES</Text>
          </View>
          <View style={s.dBtn}>
            <Text style={s.dBtnTxt}>+ Ajouter au repas</Text>
          </View>
        </Animated.View>
      </Animated.View>

    </DemoShell>
  );
}

const s = StyleSheet.create({
  screen:   { flex: 1, paddingTop: 54, paddingHorizontal: 20 },
  badge:    { position: 'absolute', top: 14, right: 20, backgroundColor: Colors.signal + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.signal + '55', zIndex: 10 },
  badgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 9, color: Colors.signal, letterSpacing: 1.2 },

  topbar:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn:     { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.ink, paddingRight: 4 },
  eyebrow:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  screenTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink },
  countBadge:  { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.hairline },
  countBadgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 13, color: Colors.ink },

  searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 10, marginBottom: 14, borderWidth: 1, borderColor: Colors.hairline },
  searchBarActive: { borderColor: Colors.signal + '60' },
  searchIcon:      { fontSize: 14 },
  searchTxt:       { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink, flex: 1 },
  searchPlaceholder: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted2, flex: 1 },
  cursor:          { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },

  intro:      { alignItems: 'center', paddingTop: 36, gap: 12 },
  introIcon:  { fontSize: 32 },
  introTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink },
  introDesc:  { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 19, maxWidth: 270 },

  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resultCount:  { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  resultSource: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted2 },

  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.hairline2, padding: 12, marginBottom: 8 },
  glyph:   { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.signal, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glyphList: { backgroundColor: Colors.ink },
  glyphTxt:  { fontFamily: Fonts.serif, fontSize: 20, color: Colors.paper2 },
  rowBody:   { flex: 1, gap: 3 },
  rowName:   { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, lineHeight: 18 },
  rowGroup:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  pills:     { flexDirection: 'row', gap: 4, marginTop: 3 },
  pill:      { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 100, backgroundColor: Colors.paper2, borderWidth: 1, borderColor: Colors.hairline },
  pillTxt:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, color: Colors.muted },

  importBtn:       { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.paper2, alignItems: 'center', justifyContent: 'center' },
  importBtnDone:   { borderColor: 'rgba(63,90,58,0.3)', backgroundColor: 'rgba(63,90,58,0.06)' },
  importBtnTxt:    { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.muted },
  importBtnDoneTxt:{ color: Colors.ok, fontSize: 16 },

  aiBanner:      { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  aiBannerIcon:  { fontSize: 18 },
  aiBannerText:  { flex: 1 },
  aiBannerTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.paper },
  aiBannerSub:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.paper + 'aa', marginTop: 2 },

  sectionLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  foodRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.hairline, gap: 12 },
  foodRowNew:   { backgroundColor: Colors.ok + '12', marginHorizontal: -20, paddingHorizontal: 20 },
  foodChev:     { fontFamily: Fonts.sans, fontSize: 20, color: Colors.muted2 },

  sheet:      { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.11, shadowRadius: 18, elevation: 20, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24 },
  handle:     { width: 40, height: 4, backgroundColor: Colors.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  detailTopbar:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  detailBack:    { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.ink, marginRight: 8 },
  detailTitle:   { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink, flex: 1 },

  dName:     { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, marginBottom: 4 },
  dKcal:     { fontFamily: Fonts.mono,  fontSize: 13, color: Colors.muted, marginBottom: 18 },
  dMacros:   { gap: 9, marginBottom: 16 },
  dMacroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dMacroL:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, width: 78 },
  dMacroBar: { flex: 1, height: 5, backgroundColor: Colors.hairline, borderRadius: 3 },
  dMacroFill:{ height: 5, borderRadius: 3 },
  dMacroV:   { fontFamily: Fonts.monoMedium, fontSize: 11, color: Colors.ink, width: 40, textAlign: 'right' },
  sourceRow: { paddingTop: 8, marginBottom: 18 },
  sourceTxt: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2 },

  dBtn:    { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  dBtnTxt: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper },
});
