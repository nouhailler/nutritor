import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const CUTOUT   = 240;
const OVERLAY  = 'rgba(0,0,0,0.65)';
const CORNER_S = 26;
const CORNER_W = 3;

// Barres d'un faux code EAN-13
const BARS = [3,1,2,3,1,2,1,3,2,1,2,3,1,2,1,3,1,2,3,1,2];

const PRODUCT = {
  letter:   'F',
  category: 'Céréales · Open Food Facts',
  name:     "Flocons d'avoine bio",
  brand:    'Markal',
  kcal: 360, protein: 12, carbs: 60, fat: 7,
};

const PHASES = ['scanning', 'loading', 'found'] as const;
type Phase = typeof PHASES[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DemoScanner({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn, cursorRef } = engine;

  const [phase,     setPhase]     = useState<Phase>('scanning');
  const [barcode,   setBarcode]   = useState(false);
  const [scanPulse, setScanPulse] = useState(true);
  const [added,     setAdded]     = useState(false);
  const [caption,   setCaption]   = useState('');

  const barcodeA   = useRef(new Animated.Value(0)).current;
  const sheetSlide = useRef(new Animated.Value(SH)).current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }

    isRunning.current = true;

    const startScanPulse = () => {
      if (cursorRef.current) clearInterval(cursorRef.current);
      cursorRef.current = setInterval(() => setScanPulse(v => !v), 700);
    };
    const stopScanPulse = () => {
      if (cursorRef.current) { clearInterval(cursorRef.current); cursorRef.current = null; }
      setScanPulse(false);
    };

    const run = () => {
      clearAll();
      setPhase('scanning'); setBarcode(false); setAdded(false);
      setCaption(''); setScanPulse(true); startScanPulse();

      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26);
      engine.fingerY.setValue(SH * 0.44 - 26);
      engine.fOpacity.setValue(0); engine.fScale.setValue(1);
      engine.ripS.setValue(0);    engine.ripO.setValue(0);
      barcodeA.setValue(0); sheetSlide.setValue(SH);

      at(100, fadeIn);

      // t=1.0s : doigt vers le cadre de scan
      at(1000, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.5, SH * 0.44, 400);
        setCaption('Pointe vers un code-barres EAN-13');
      });

      // t=1.8s : le code-barres apparaît dans le cadre
      at(1800, () => {
        setBarcode(true);
        Animated.timing(barcodeA, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });

      // t=2.6s : tap → scan détecté, chargement
      at(2600, () => {
        tap();
        Animated.timing(barcodeA, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      });
      at(2800, () => {
        setPhase('loading');
        stopScanPulse();
        setCaption('Récupération sur Open Food Facts…');
      });

      // t=4.6s : produit trouvé, fiche slide-up
      at(4600, () => {
        setPhase('found');
        setCaption('Produit trouvé !');
        Animated.timing(sheetSlide, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });

      // t=5.8s : doigt vers "Ajouter à ma liste"
      at(5800, () => move(SW * 0.65, SH * 0.88, 480));

      // t=6.6s : tap → ajouté
      at(6600, () => { tap(); setAdded(true); setCaption('Ajouté à ta bibliothèque !'); });

      // t=8.4s : doigt vers "Scanner à nouveau"
      at(8400, () => move(SW * 0.22, SH * 0.88, 480));

      // t=9.2s : tap → retour scanning
      at(9200, () => {
        tap();
        Animated.timing(sheetSlide, { toValue: SH, duration: 300, useNativeDriver: true }).start();
      });
      at(9520, () => {
        setPhase('scanning');
        setAdded(false);
        setBarcode(false);
        setCaption('Prêt pour le prochain scan');
        startScanPulse();
      });

      // t=13.5s : boucle
      at(13500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>

      {/* ── FOND CAMÉRA ───────────────────────────────── */}
      <View style={s.bg}>

        {/* Overlay scan frame */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Bande haute */}
          <View style={{ flex: 1, backgroundColor: OVERLAY }} />
          {/* Rangée centrale : bande | cadre | bande */}
          <View style={{ flexDirection: 'row', height: CUTOUT }}>
            <View style={{ flex: 1, backgroundColor: OVERLAY }} />
            {/* Cadre de scan */}
            <View style={s.cutout}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
              {/* Ligne de scan */}
              {phase === 'scanning' && (
                <View style={[s.scanLine, { opacity: scanPulse ? 0.75 : 0.15 }]} />
              )}
              {/* Faux code-barres */}
              {barcode && (
                <Animated.View style={[s.barcodeWrap, { opacity: barcodeA }]}>
                  <View style={s.barcodeInner}>
                    {BARS.map((w, i) => (
                      <View key={i} style={{ width: w * 5, height: 72, backgroundColor: i % 2 === 0 ? '#111' : '#fafafa' }} />
                    ))}
                  </View>
                  <Text style={s.barcodeNum}>3 01299 200002 0</Text>
                </Animated.View>
              )}
            </View>
            <View style={{ flex: 1, backgroundColor: OVERLAY }} />
          </View>
          {/* Bande basse */}
          <View style={{ flex: 1.4, backgroundColor: OVERLAY }} />
        </View>

        {/* Topbar */}
        <View style={s.topbar}>
          <View style={s.topBtn}><Text style={s.topBtnTxt}>←</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.topTitle}>Scanner un code-barres</Text>
            <Text style={s.topSub}>OPEN FOOD FACTS</Text>
          </View>
        </View>

        {/* Badge DÉMO */}
        <View style={s.badge}><Text style={s.badgeTxt}>DÉMO</Text></View>

        {/* Hint en mode scanning */}
        {phase === 'scanning' && (
          <View style={s.hint}>
            <Text style={s.hintTxt}>Pointe la caméra vers un code-barres EAN-13</Text>
          </View>
        )}

        {/* Spinner de chargement */}
        {phase === 'loading' && (
          <View style={s.loadingBox}>
            <View style={s.spinner} />
            <Text style={s.loadingTxt}>Recherche sur Open Food Facts…</Text>
          </View>
        )}
      </View>

      {/* ── FICHE RÉSULTAT ──────────────────────────────── */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetSlide }] }]} pointerEvents="none">
        <View style={s.handle} />
        <View style={s.sheetHeader}>
          <View style={s.glyph}><Text style={s.glyphTxt}>{PRODUCT.letter}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.sheetCategory}>{PRODUCT.category}</Text>
            <Text style={s.sheetName}>{PRODUCT.name}</Text>
            <Text style={s.sheetBrand}>{PRODUCT.brand}</Text>
          </View>
        </View>
        <View style={s.macros}>
          {[
            { label: 'Kcal',  value: PRODUCT.kcal,    unit: '' },
            { label: 'Prot.', value: PRODUCT.protein,  unit: 'g' },
            { label: 'Gluc.', value: PRODUCT.carbs,    unit: 'g' },
            { label: 'Lip.',  value: PRODUCT.fat,      unit: 'g' },
          ].map(m => (
            <View key={m.label} style={s.macroItem}>
              <Text style={s.macroVal}>{m.value}<Text style={s.macroUnit}>{m.unit}</Text></Text>
              <Text style={s.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
        <View style={s.actions}>
          <View style={s.retryBtn}>
            <Text style={s.retryTxt}>↩  Scanner à nouveau</Text>
          </View>
          <View style={[s.addBtn, added && s.addBtnDone]}>
            <Text style={s.addTxt}>{added ? '✓  Déjà dans ta liste' : '+  Ajouter à ma liste'}</Text>
          </View>
        </View>
      </Animated.View>

    </DemoShell>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0f0f0f' },

  cutout: { width: CUTOUT, height: CUTOUT, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CORNER_S, height: CORNER_S, borderColor: Colors.paper2 },
  tl: { top: 0,    left: 0,    borderTopWidth: CORNER_W,    borderLeftWidth: CORNER_W,  borderTopLeftRadius:     5 },
  tr: { top: 0,    right: 0,   borderTopWidth: CORNER_W,    borderRightWidth: CORNER_W, borderTopRightRadius:    5 },
  bl: { bottom: 0, left: 0,    borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W,  borderBottomLeftRadius:  5 },
  br: { bottom: 0, right: 0,   borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 5 },

  scanLine: {
    position: 'absolute',
    left: 12, right: 12, top: '50%',
    height: 2, backgroundColor: Colors.paper2, borderRadius: 1,
  },

  barcodeWrap:  { alignItems: 'center', gap: 8 },
  barcodeInner: { flexDirection: 'row', height: 72 },
  barcodeNum:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.paper2, letterSpacing: 1.5 },

  topbar: {
    position: 'absolute', top: 48, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16,
  },
  topBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  topBtnTxt: { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.paper2 },
  topTitle:  { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.paper2 },
  topSub:    { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' },

  badge:    { position: 'absolute', top: 48, right: 20, backgroundColor: Colors.signal + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.signal + '55' },
  badgeTxt: { fontFamily: Fonts.monoMedium, fontSize: 9, color: Colors.signal, letterSpacing: 1.2 },

  hint:    { position: 'absolute', bottom: 180, left: 0, right: 0, alignItems: 'center' },
  hintTxt: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 100 },

  loadingBox: { position: 'absolute', bottom: 140, left: 0, right: 0, alignItems: 'center', gap: 14 },
  spinner:    { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)', borderTopColor: Colors.paper2 },
  loadingTxt: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.paper2 },

  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, gap: 16 },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.hairline, alignSelf: 'center', marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  glyph:       { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glyphTxt:    { fontFamily: Fonts.serif, fontSize: 24, color: Colors.paper2 },
  sheetCategory: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginBottom: 2 },
  sheetName:   { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, letterSpacing: -0.3, lineHeight: 22 },
  sheetBrand:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 2 },
  macros:      { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.hairline2, paddingVertical: 12 },
  macroItem:   { alignItems: 'center', gap: 3 },
  macroVal:    { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  macroUnit:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  macroLabel:  { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted },
  actions:     { flexDirection: 'row', gap: 10 },
  retryBtn:    { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  retryTxt:    { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  addBtn:      { flex: 1, paddingVertical: 14, borderRadius: 100, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  addBtnDone:  { backgroundColor: Colors.ok },
  addTxt:      { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2 },
});
