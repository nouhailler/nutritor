/**
 * ShoppingScannerScreen — stack 'shoppingScanner'
 * Scanne un code-barres EAN, interroge Open Food Facts,
 * et affiche immédiatement une analyse de compatibilité personnalisée.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { UserProfile } from '../data/user';
import { getOFFByBarcode, OFFProduct } from '../services/openFoodFacts';
import {
  analyzeCompatibility,
  verdictColor,
  verdictLabel,
  severityColor,
} from '../services/compatibilityEngine';
import { CompatibilityResult, ScanHistoryEntry } from '../types/shopping';

// ── Scan overlay (reused from BarcodeScannerScreen) ──────────

const CUTOUT = 260;
const OVERLAY = 'rgba(0,0,0,0.62)';
const CORNER_SIZE = 28;
const CORNER_W = 3;

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
  }, [active, pulse]);

  const cornerColor = active ? Colors.paper2 : Colors.muted;
  return (
    <View style={frame.wrap}>
      <View style={frame.sideTop} />
      <View style={frame.middle}>
        <View style={frame.sideLeft} />
        <View style={frame.cutout}>
          <View style={[frame.corner, frame.tl, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.tr, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.bl, { borderColor: cornerColor }]} />
          <View style={[frame.corner, frame.br, { borderColor: cornerColor }]} />
          {active && <Animated.View style={[frame.scanLine, { opacity: pulse }]} />}
        </View>
        <View style={frame.sideRight} />
      </View>
      <View style={frame.sideBottom} />
    </View>
  );
}

const frame = StyleSheet.create({
  wrap:       { ...StyleSheet.absoluteFillObject as object },
  sideTop:    { width: '100%', flex: 1, backgroundColor: OVERLAY },
  middle:     { flexDirection: 'row', height: CUTOUT },
  sideLeft:   { flex: 1, backgroundColor: OVERLAY },
  sideRight:  { flex: 1, backgroundColor: OVERLAY },
  sideBottom: { width: '100%', flex: 1.2, backgroundColor: OVERLAY },
  cutout:     { width: CUTOUT, height: CUTOUT },
  corner:     { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  tl:         { top: 0, left: 0,  borderTopWidth: CORNER_W,    borderLeftWidth: CORNER_W,  borderTopLeftRadius: 6 },
  tr:         { top: 0, right: 0, borderTopWidth: CORNER_W,    borderRightWidth: CORNER_W, borderTopRightRadius: 6 },
  bl:         { bottom: 0, left: 0,  borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W,  borderBottomLeftRadius: 6 },
  br:         { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 6 },
  scanLine: {
    position: 'absolute', left: 12, right: 12, top: '50%',
    height: 2, backgroundColor: Colors.paper2, borderRadius: 1,
  },
});

// ── Score circle ──────────────────────────────────────────────

function ScoreCircle({ score, verdict }: { score: number; verdict: CompatibilityResult['verdict'] }) {
  const color = verdictColor(verdict);
  return (
    <View style={[scoreStyle.wrap, { borderColor: color }]}>
      <Text style={[scoreStyle.number, { color }]}>{score}</Text>
      <Text style={scoreStyle.label}>/100</Text>
    </View>
  );
}

const scoreStyle = StyleSheet.create({
  wrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.paper,
  },
  number: { fontFamily: Fonts.serif, fontSize: 32, letterSpacing: -1 },
  label:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5, marginTop: -2 },
});

// ── Result sheet ──────────────────────────────────────────────

function ResultSheet({
  product,
  result,
  onScanAgain,
  onClose,
}: {
  product: OFFProduct;
  result: CompatibilityResult;
  onScanAgain: () => void;
  onClose: () => void;
}) {
  const name = product.product_name_fr || product.product_name || 'Produit inconnu';
  const brand = product.brands?.split(',')[0]?.trim() ?? '';
  const vColor = verdictColor(result.verdict);
  const vLabel = verdictLabel(result.verdict);

  return (
    <View style={rs.wrap}>
      <View style={rs.handle} />

      {/* Header */}
      <View style={rs.header}>
        <ScoreCircle score={result.score} verdict={result.verdict} />
        <View style={rs.headerText}>
          <View style={[rs.verdictBadge, { backgroundColor: vColor + '18', borderColor: vColor + '44' }]}>
            <Text style={[rs.verdictLabel, { color: vColor }]}>{vLabel}</Text>
          </View>
          <Text style={rs.productName} numberOfLines={2}>{name}</Text>
          {brand ? <Text style={rs.brand} numberOfLines={1}>{brand}</Text> : null}
        </View>
      </View>

      <ScrollView style={rs.scroll} showsVerticalScrollIndicator={false}>
        {/* Ultra-processed badge */}
        {result.ultraProcessed && (
          <View style={rs.ultraBadge}>
            <Icon name="alert-triangle" size={13} color="#c47d0a" />
            <Text style={rs.ultraText}>Produit ultra-transformé (NOVA 4)</Text>
          </View>
        )}

        {/* Issues */}
        {result.issues.length > 0 && (
          <View style={rs.section}>
            <Text style={rs.sectionTitle}>Problèmes détectés</Text>
            {result.issues.map((issue, i) => (
              <View key={i} style={rs.issueRow}>
                <View style={[rs.severityDot, { backgroundColor: severityColor(issue.severity) }]} />
                <View style={rs.issueText}>
                  <Text style={rs.issueLabel}>{issue.label}</Text>
                  <Text style={rs.issueDetail}>{issue.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Positives */}
        {result.positives.length > 0 && (
          <View style={rs.section}>
            <Text style={rs.sectionTitle}>Points positifs</Text>
            {result.positives.map((p, i) => (
              <View key={i} style={rs.positiveRow}>
                <Icon name="check" size={13} color="#2d8a4e" />
                <Text style={rs.positiveText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Actions */}
      <View style={rs.actions}>
        <TouchableOpacity style={rs.retryBtn} onPress={onScanAgain} activeOpacity={0.7}>
          <Icon name="scan" size={15} color={Colors.muted} />
          <Text style={rs.retryText}>Rescanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rs.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={rs.closeBtnText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 8,
    maxHeight: '78%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.hairline, alignSelf: 'center', marginBottom: 16,
  },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  headerText: { flex: 1, gap: 6 },
  verdictBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  verdictLabel: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  productName: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, letterSpacing: -0.3, lineHeight: 22 },
  brand: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },
  scroll: { flexGrow: 0 },
  ultraBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(196,125,10,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(196,125,10,0.25)',
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  ultraText: { fontFamily: Fonts.sans, fontSize: 12, color: '#c47d0a', flex: 1 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 8,
  },
  issueRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  issueText: { flex: 1 },
  issueLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  issueDetail: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 1, lineHeight: 16 },
  positiveRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  positiveText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink, flex: 1 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 8 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card,
  },
  retryText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  closeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.ink, borderRadius: 100, paddingVertical: 14,
  },
  closeBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2 },
});

// ── Main screen ────────────────────────────────────────────────

type Phase = 'scanning' | 'loading' | 'result' | 'not_found' | 'permission_denied';

interface Props {
  profile: UserProfile;
  onBack: () => void;
  onScanComplete: (entry: ScanHistoryEntry, barcode: string) => void;
}

export function ShoppingScannerScreen({ profile, onBack, onScanComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [product, setProduct] = useState<OFFProduct | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const scanLocked = useRef(false);
  const lastBarcode = useRef('');

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanLocked.current || phase !== 'scanning') return;
    scanLocked.current = true;
    lastBarcode.current = data;
    setPhase('loading');

    try {
      const p = await getOFFByBarcode(data);
      if (!p) {
        setPhase('not_found');
        return;
      }
      const r = analyzeCompatibility(p, profile);
      setProduct(p);
      setResult(r);
      setPhase('result');

      const name = p.product_name_fr || p.product_name || 'Produit inconnu';
      const brand = p.brands?.split(',')[0]?.trim() ?? '';
      onScanComplete(
        {
          id: `scan-${Date.now()}`,
          ts: Date.now(),
          productName: name,
          brand,
          score: r.score,
          verdict: r.verdict,
          barcode: data,
        },
        data,
      );
    } catch {
      setPhase('not_found');
    }
  };

  const handleScanAgain = () => {
    setPhase('scanning');
    setProduct(null);
    setResult(null);
    scanLocked.current = false;
  };

  if (!permission) return <View style={styles.bg} />;

  if (!permission.granted) {
    return (
      <View style={[styles.bg, styles.center, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAbs} onPress={onBack} activeOpacity={0.7}>
          <Icon name="close" size={20} color={Colors.paper2} />
        </TouchableOpacity>
        <Icon name="scan" size={40} color={Colors.muted2} />
        <Text style={styles.permTitle}>Accès à la caméra requis</Text>
        <Text style={styles.permDesc}>Nutritor a besoin de la caméra pour scanner les codes-barres.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={phase === 'scanning' ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
      />

      <ScanFrame active={phase === 'scanning'} />

      {/* Topbar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.paper2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Assistant courses</Text>
          <Text style={styles.topSub}>Analyse personnalisée</Text>
        </View>
      </View>

      {phase === 'scanning' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Pointe la caméra vers un code-barres EAN</Text>
        </View>
      )}

      {phase === 'loading' && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.paper2} size="large" />
          <Text style={styles.loadingText}>Analyse en cours…</Text>
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

      {phase === 'result' && product && result && (
        <ResultSheet
          product={product}
          result={result}
          onScanAgain={handleScanAgain}
          onClose={onBack}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg:     { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },

  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.paper2 },
  topSub:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },

  hint: { position: 'absolute', bottom: 180, left: 0, right: 0, alignItems: 'center' },
  hintText: {
    fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100,
  },
  loadingBox: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center', gap: 12 },
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
