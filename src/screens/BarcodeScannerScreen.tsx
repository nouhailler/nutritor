/**
 * BarcodeScannerScreen — stack 'scanner'
 * Scan code-barres EAN-13/8 et UPC via expo-camera.
 * Interroge Open Food Facts au scan, importe la fiche aliment si trouvée.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { getOFFByBarcode, offProductToFood } from '../services/openFoodFacts';
import { OnboardingTip } from '../components/OnboardingTip';
import { TIPS } from '../data/onboarding';

type Phase = 'scanning' | 'loading' | 'found' | 'not_found' | 'permission_denied';

// ── Scan overlay ───────────────────────────────────────────────

function ScanFrame({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  const cornerColor = active ? Colors.paper2 : Colors.muted;

  return (
    <View style={frame.wrap}>
      {/* Dark overlay sides */}
      <View style={frame.sideTop} />
      <View style={frame.middle}>
        <View style={frame.sideLeft} />
        <View style={frame.cutout}>
          {/* Corner brackets */}
          <View style={[frame.corner, frame.tl, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.tr, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.bl, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.br, { borderColor: cornerColor }]} />
          {/* Scan line */}
          {active && (
            <Animated.View style={[frame.scanLine, { opacity: pulse }]} />
          )}
        </View>
        <View style={frame.sideRight} />
      </View>
      <View style={frame.sideBottom} />
    </View>
  );
}

const CUTOUT = 260;
const OVERLAY = 'rgba(0,0,0,0.62)';
const CORNER_SIZE = 28;
const CORNER_W = 3;

const frame = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject as object },
  sideTop:    { width: '100%', flex: 1, backgroundColor: OVERLAY },
  middle:     { flexDirection: 'row', height: CUTOUT },
  sideLeft:   { flex: 1, backgroundColor: OVERLAY },
  sideRight:  { flex: 1, backgroundColor: OVERLAY },
  sideBottom: { width: '100%', flex: 1.2, backgroundColor: OVERLAY },
  cutout:     { width: CUTOUT, height: CUTOUT },

  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: Colors.paper2 },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 6 },

  scanLine: {
    position: 'absolute',
    left: 12, right: 12,
    top: '50%',
    height: 2,
    backgroundColor: Colors.paper2,
    borderRadius: 1,
  },
});

// ── Result sheet ───────────────────────────────────────────────

function ResultSheet({
  food,
  alreadyAdded,
  onAdd,
  onScanAgain,
}: {
  food: Food;
  alreadyAdded: boolean;
  onAdd: () => void;
  onScanAgain: () => void;
}) {
  return (
    <View style={sheet.wrap}>
      <View style={sheet.handle} />
      <View style={sheet.header}>
        <View style={sheet.glyph}>
          <Text style={sheet.glyphText}>{food.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={sheet.headerText}>
          <Text style={sheet.category} numberOfLines={1}>{food.category}</Text>
          <Text style={sheet.name} numberOfLines={2}>{food.name}</Text>
          <Text style={sheet.brand} numberOfLines={1}>{food.brand}</Text>
        </View>
      </View>
      <View style={sheet.macros}>
        {[
          { label: 'Kcal', value: food.per100.kcal, unit: '' },
          { label: 'Prot.', value: food.per100.protein, unit: 'g' },
          { label: 'Gluc.', value: food.per100.carbs, unit: 'g' },
          { label: 'Lip.', value: food.per100.fat, unit: 'g' },
        ].map((m) => (
          <View key={m.label} style={sheet.macroItem}>
            <Text style={sheet.macroVal}>{m.value}<Text style={sheet.macroUnit}>{m.unit}</Text></Text>
            <Text style={sheet.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={sheet.actions}>
        <TouchableOpacity style={sheet.retryBtn} onPress={onScanAgain} activeOpacity={0.7}>
          <Icon name="scan" size={16} color={Colors.muted} />
          <Text style={sheet.retryText}>Scanner à nouveau</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sheet.addBtn, alreadyAdded && sheet.addBtnDone]}
          onPress={onAdd}
          activeOpacity={0.8}
          disabled={alreadyAdded}
        >
          {alreadyAdded
            ? <><Icon name="check" size={18} color={Colors.paper2} /><Text style={sheet.addText}>Déjà dans ta liste</Text></>
            : <><Icon name="plus"  size={18} color={Colors.paper2} /><Text style={sheet.addText}>Ajouter à ma liste</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sheet = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
    gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.hairline, alignSelf: 'center', marginBottom: 4,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  glyph: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  glyphText: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.paper2 },
  headerText: { flex: 1 },
  category: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginBottom: 2 },
  name: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, letterSpacing: -0.3, lineHeight: 22 },
  brand: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 2 },
  macros: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.hairline2, paddingVertical: 12,
  },
  macroItem: { alignItems: 'center', gap: 3 },
  macroVal: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  macroUnit: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  macroLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted },
  actions: { flexDirection: 'row', gap: 10 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card,
  },
  retryText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.ink, borderRadius: 100, paddingVertical: 14,
  },
  addBtnDone: { backgroundColor: Colors.ok },
  addText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2 },
});

// ── Main screen ────────────────────────────────────────────────

interface Props {
  existingIds: Set<string>;
  onImport: (food: Food) => void;
  onBack: () => void;
  onOpenMenu: () => void;
}

export function BarcodeScannerScreen({ existingIds, onImport, onBack, onOpenMenu }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [foundFood, setFoundFood] = useState<Food | null>(null);
  const [added, setAdded] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const scanLocked = useRef(false);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanLocked.current || phase !== 'scanning') return;
    scanLocked.current = true;
    setPhase('loading');

    try {
      const product = await getOFFByBarcode(data);
      if (!product) {
        setPhase('not_found');
      } else {
        setFoundFood(offProductToFood(product));
        setPhase('found');
      }
    } catch {
      setPhase('not_found');
    }
  };

  const handleAdd = () => {
    if (!foundFood) return;
    if (!existingIds.has(foundFood.id)) onImport(foundFood);
    setAdded(true);
  };

  const handleScanAgain = () => {
    setPhase('scanning');
    setFoundFood(null);
    setAdded(false);
    scanLocked.current = false;
  };

  // Permission not yet determined
  if (!permission) return <View style={styles.bg} />;

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.bg, styles.center, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAbs} onPress={onBack} activeOpacity={0.7}>
          <Icon name="close" size={20} color={Colors.paper2} />
        </TouchableOpacity>
        <Icon name="scan" size={40} color={Colors.muted2} />
        <Text style={styles.permTitle}>Accès à la caméra requis</Text>
        <Text style={styles.permDesc}>
          Nutritor a besoin de la caméra pour scanner les codes-barres.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <OnboardingTip
        tipKey={TIPS.scanner.key}
        title={TIPS.scanner.title}
        message={TIPS.scanner.message}
        delay={600}
      />
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={phase === 'scanning' ? handleBarcode : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
      />

      {/* Overlay */}
      <ScanFrame active={phase === 'scanning'} />

      {/* Topbar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.paper2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Scanner un code-barres</Text>
          <Text style={styles.topSub}>Open Food Facts</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.paper2} />
        </TouchableOpacity>
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.scanner} onClose={() => setHelpVisible(false)} />

      {/* Status / loading */}
      {phase === 'scanning' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Pointe la caméra vers un code-barres EAN-13</Text>
        </View>
      )}

      {phase === 'loading' && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.paper2} size="large" />
          <Text style={styles.loadingText}>Recherche sur Open Food Facts…</Text>
        </View>
      )}

      {phase === 'not_found' && (
        <View style={styles.notFoundBox}>
          <Icon name="alert" size={20} color={Colors.warn} />
          <Text style={styles.notFoundText}>Produit introuvable sur Open Food Facts</Text>
          <TouchableOpacity style={styles.retrySmall} onPress={handleScanAgain} activeOpacity={0.7}>
            <Text style={styles.retrySmallText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result sheet */}
      {phase === 'found' && foundFood && (
        <ResultSheet
          food={foundFood}
          alreadyAdded={added || existingIds.has(foundFood.id)}
          onAdd={handleAdd}
          onScanAgain={handleScanAgain}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },

  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.paper2 },
  topSub:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },

  hint: {
    position: 'absolute', bottom: 180, left: 0, right: 0, alignItems: 'center',
  },
  hintText: {
    fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100,
  },

  loadingBox: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    alignItems: 'center', gap: 12,
  },
  loadingText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.paper2 },

  notFoundBox: {
    position: 'absolute', bottom: 100, left: 24, right: 24,
    backgroundColor: Colors.paper, borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 10,
  },
  notFoundText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink, textAlign: 'center' },
  retrySmall: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card,
  },
  retrySmallText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },

  // Permission
  backBtnAbs: {
    position: 'absolute', top: 60, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  permTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.paper2, letterSpacing: -0.3, textAlign: 'center' },
  permDesc:  { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  permBtn:   { marginTop: 8, backgroundColor: Colors.paper2, borderRadius: 100, paddingVertical: 14, paddingHorizontal: 28 },
  permBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
});
