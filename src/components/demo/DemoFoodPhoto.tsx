import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['picker', 'preview', 'analyzing', 'results'] as const;
type Phase = typeof PHASES[number];

const FOODS = [
  {
    name: 'Riz basmati cuit',
    category: 'Céréales · Vision IA',
    weight: 180, kcal: 234, protein: 4.3, carbs: 51.6, fat: 0.4,
  },
  {
    name: 'Poulet grillé',
    category: 'Viandes · Vision IA',
    weight: 150, kcal: 248, protein: 37.5, carbs: 0.0, fat: 9.8,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoFoodPhoto({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,    setPhase]    = useState<Phase>('picker');
  const [imported, setImported] = useState([false, false]);
  const [caption,  setCaption]  = useState('');

  const analyzeA    = useRef(new Animated.Value(0)).current;
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) {
      isRunning.current = false;
      clearAll();
      spinLoopRef.current?.stop();
      return;
    }
    isRunning.current = true;

    const run = () => {
      clearAll();
      spinLoopRef.current?.stop();
      spinLoopRef.current = null;

      setPhase('picker'); setImported([false, false]); setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.25 - 26);
      engine.fingerY.setValue(SH * 0.40 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      analyzeA.setValue(0); spinAnim.setValue(0);

      at(100, fadeIn);

      // t=1.0 : doigt → bouton caméra
      at(1000, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.25, SH * 0.40, 400);
        setCaption('Prends une photo de ton repas');
      });

      // t=2.0 : tap → prévisualisation
      at(2000, () => tap());
      at(2250, () => {
        setPhase('preview');
        Animated.timing(analyzeA, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        setCaption("Photo prise — lance l'analyse IA");
      });

      // t=3.8 : doigt → bouton "Analyser avec l'IA"
      at(3800, () => move(SW * 0.7, SH * 0.43, 460));

      // t=4.6 : tap → analyse en cours
      at(4600, () => {
        tap();
        setPhase('analyzing');
        setCaption("L'IA identifie les aliments…");
        spinAnim.setValue(0);
        spinLoopRef.current = Animated.loop(
          Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear }),
        );
        spinLoopRef.current.start();
      });

      // t=6.8 : résultats
      at(6800, () => {
        spinLoopRef.current?.stop();
        spinLoopRef.current = null;
        setPhase('results');
        setCaption('2 aliments identifiés !');
      });

      // t=8.0 : doigt → import aliment 1
      at(8000, () => move(SW * 0.5, SH * 0.40, 450));
      at(8800, () => {
        tap();
        setImported([true, false]);
        setCaption('Aliment ajouté à ta liste');
      });

      // t=10.0 : doigt → import aliment 2
      at(10000, () => move(SW * 0.5, SH * 0.61, 450));
      at(10800, () => {
        tap();
        setImported([true, true]);
        setCaption('Les deux aliments importés !');
      });

      // t=11.8 : doigt → "Analyser une autre photo"
      at(11800, () => setCaption(''));
      at(12200, () => move(SW * 0.5, SH * 0.76, 450));
      at(13000, () => tap());
      at(13300, () => {
        setPhase('picker');
        setImported([false, false]);
        analyzeA.setValue(0);
        setCaption('Prêt pour une nouvelle photo');
      });

      // t=15.8 : boucle
      at(15800, () => { if (isRunning.current) run(); });
    };

    run();
    return () => {
      isRunning.current = false;
      clearAll();
      spinLoopRef.current?.stop();
    };
  }, [visible]);

  const spinRotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View style={s.iconBtn} />
          <View style={s.topbarCenter}>
            <Text style={s.eyebrow}>Reconnaissance</Text>
            <Text style={s.title}>Photo IA</Text>
          </View>
          <View style={s.iconBtn} />
        </View>
        <View style={s.divider} />

        {/* ── PICKER ── */}
        {phase === 'picker' && (
          <View style={s.pickerSection}>
            <Text style={s.pickerInstruction}>
              Prends une photo de ton repas ou sélectionne une image.
            </Text>
            <Text style={s.pickerSub}>
              L'IA identifiera les aliments, estimera les portions et détectera les allergènes.
            </Text>
            <View style={s.pickerBtns}>
              <View style={s.pickerBtn}>
                <Text style={s.pickerBtnIcon}>📷</Text>
                <Text style={s.pickerBtnLabel}>Appareil photo</Text>
              </View>
              <View style={s.pickerBtn}>
                <Text style={s.pickerBtnIcon}>🖼</Text>
                <Text style={s.pickerBtnLabel}>Galerie</Text>
              </View>
            </View>
            <Text style={s.disclaimer}>
              Estimations approximatives (±30%). Toujours vérifier avant d'enregistrer.
            </Text>
          </View>
        )}

        {/* ── PREVIEW ── */}
        {phase === 'preview' && (
          <View style={s.previewSection}>
            <View style={s.fakePhoto}>
              <View style={s.plateBg}>
                <View style={s.plateRice} />
                <View style={s.plateChicken} />
              </View>
            </View>
            <View style={s.previewActions}>
              <Text style={s.changeLink}>Changer de photo</Text>
              <Animated.View style={[s.analyzeBtn, { opacity: analyzeA }]}>
                <Text style={s.analyzeBtnText}>Analyser avec l'IA  →</Text>
              </Animated.View>
            </View>
          </View>
        )}

        {/* ── ANALYZING ── */}
        {phase === 'analyzing' && (
          <View style={s.loadingSection}>
            <Animated.View style={[s.spinner, { transform: [{ rotate: spinRotate }] }]} />
            <Text style={s.loadingText}>Analyse en cours…</Text>
            <Text style={s.loadingSub}>Identification des aliments et estimation des portions</Text>
          </View>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <View style={s.resultsSection}>
            <View style={s.sceneRow}>
              <Text style={s.sceneText}>Riz basmati et poulet grillé : repas complet et équilibré</Text>
            </View>
            {FOODS.map((food, i) => (
              <View key={i} style={s.resultCard}>
                <View style={s.resultCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultCardCategory}>{food.category}</Text>
                    <Text style={s.resultCardName}>{food.name}</Text>
                  </View>
                  <View style={s.confBadge}>
                    <View style={s.confDot} />
                    <Text style={s.confText}>Confiance élevée</Text>
                  </View>
                </View>
                <View style={s.macroRow}>
                  {[
                    { v: `~${food.weight}`, u: 'g' },
                    { v: String(food.kcal), u: 'kcal' },
                    { v: food.protein.toFixed(1), u: 'P (g)' },
                    { v: food.carbs.toFixed(1), u: 'G (g)' },
                    { v: food.fat.toFixed(1), u: 'L (g)' },
                  ].map((m, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <View style={s.macroDivider} />}
                      <View style={s.macroItem}>
                        <Text style={s.macroVal}>{m.v}</Text>
                        <Text style={s.macroUnit}>{m.u}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
                <View style={[s.importBtn, imported[i] && s.importBtnDone]}>
                  <Text style={[s.importBtnText, imported[i] && s.importBtnTextDone]}>
                    {imported[i] ? '✓  Importé' : '+  Ajouter à ma liste'}
                  </Text>
                </View>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total estimé</Text>
              <Text style={s.totalValue}>482 kcal</Text>
            </View>
            <View style={s.newPhotoBtn}>
              <Text style={s.newPhotoBtnText}>📷  Analyser une autre photo</Text>
            </View>
          </View>
        )}

      </View>
    </DemoShell>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 10,
  },
  divider:     { height: 1, backgroundColor: Colors.hairline2 },
  iconBtn:     { width: 40, height: 40 },
  topbarCenter:{ flex: 1, paddingHorizontal: 12 },
  eyebrow: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2.2,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.5, lineHeight: 26,
  },

  // ── PICKER ─────────────────────────────────────────────────
  pickerSection: { padding: 16, gap: 14 },
  pickerInstruction: {
    fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink,
    letterSpacing: -0.3, lineHeight: 24, marginTop: 8,
  },
  pickerSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, lineHeight: 18 },
  pickerBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pickerBtn: {
    flex: 1, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 16, paddingVertical: 22, alignItems: 'center', gap: 10,
  },
  pickerBtnIcon:  { fontSize: 26 },
  pickerBtnLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, letterSpacing: -0.1 },
  disclaimer: {
    fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.muted2, letterSpacing: 0.2, lineHeight: 14,
  },

  // ── PREVIEW ────────────────────────────────────────────────
  previewSection: { padding: 16, gap: 12 },
  fakePhoto: {
    width: '100%', height: 180, borderRadius: 16,
    backgroundColor: '#e6ddd0', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  plateBg: {
    width: 136, height: 136, borderRadius: 68,
    backgroundColor: '#f5efe6', borderWidth: 3, borderColor: '#d4c8b8',
    flexDirection: 'row', overflow: 'hidden',
  },
  plateRice:    { flex: 1, backgroundColor: '#f0e4a0' },
  plateChicken: { flex: 1, backgroundColor: '#c07840' },
  previewActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  changeLink: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted,
    letterSpacing: 0.5, textDecorationLine: 'underline',
  },
  analyzeBtn: {
    backgroundColor: Colors.ink, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  analyzeBtnText: {
    fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.paper2, letterSpacing: -0.2,
  },

  // ── ANALYZING ──────────────────────────────────────────────
  loadingSection: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  spinner: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 3, borderColor: 'rgba(0,0,0,0.1)', borderTopColor: Colors.ink,
  },
  loadingText: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  loadingSub: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 32,
  },

  // ── RESULTS ────────────────────────────────────────────────
  resultsSection: { padding: 16, gap: 12 },
  sceneRow:  { paddingBottom: 4, paddingHorizontal: 2 },
  sceneText: {
    fontFamily: Fonts.serif, fontSize: 14, color: Colors.ink2, letterSpacing: -0.2, lineHeight: 20,
  },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.hairline2,
    padding: 14, gap: 8,
  },
  resultCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  resultCardCategory: {
    fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 2,
  },
  resultCardName: {
    fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink, letterSpacing: -0.3, lineHeight: 20,
  },
  confBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
    backgroundColor: Colors.ok + '22',
  },
  confDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.ok },
  confText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.3, color: Colors.ok },
  macroRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.paper2, borderRadius: 9,
    paddingVertical: 8, paddingHorizontal: 6,
  },
  macroItem: { flex: 1, alignItems: 'center', gap: 2 },
  macroVal:  { fontFamily: Fonts.serif, fontSize: 14, color: Colors.ink, letterSpacing: -0.3 },
  macroUnit: {
    fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  macroDivider: { width: 1, height: 24, backgroundColor: Colors.hairline2 },
  importBtn: {
    backgroundColor: Colors.ok, borderRadius: 9, paddingVertical: 10,
    alignItems: 'center', marginTop: 2,
  },
  importBtnDone: { backgroundColor: Colors.ok + '22', borderWidth: 1, borderColor: Colors.ok + '55' },
  importBtnText:     { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.paper2, letterSpacing: -0.1 },
  importBtnTextDone: { color: Colors.ok },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 4, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: Colors.hairline2,
  },
  totalLabel: {
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1.5,
    textTransform: 'uppercase', color: Colors.muted,
  },
  totalValue: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, letterSpacing: -0.5 },
  newPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card, marginTop: 4,
  },
  newPhotoBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, letterSpacing: -0.1 },
});
