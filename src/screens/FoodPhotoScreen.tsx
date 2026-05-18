import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { AppSettings } from '../types/settings';
import {
  analyzeFoodPhoto,
  isVisionCapableModel,
  visionItemToFood,
  VisionFoodItem,
  VisionAnalysisResult,
} from '../services/foodVisionService';

// ── Helpers ───────────────────────────────────────────────────

function confidenceColor(c: VisionFoodItem['confidence']): string {
  if (c === 'high')   return Colors.ok;
  if (c === 'medium') return Colors.signal;
  return Colors.warn;
}

function confidenceLabel(c: VisionFoodItem['confidence']): string {
  if (c === 'high')   return 'Confiance élevée';
  if (c === 'medium') return 'Confiance moyenne';
  return 'Confiance faible';
}

// ── Food result card ──────────────────────────────────────────

function FoodResultCard({
  item,
  alreadyImported,
  onImport,
}: {
  item: VisionFoodItem;
  alreadyImported: boolean;
  onImport: () => void;
}) {
  const color = confidenceColor(item.confidence);
  const allergens = (item.allergens_likely ?? []);

  return (
    <View style={styles.resultCard}>
      {/* Header */}
      <View style={styles.resultCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultCardCategory}>{item.category}</Text>
          <Text style={styles.resultCardName}>{item.name}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: color + '22' }]}>
          <View style={[styles.confidenceDot, { backgroundColor: color }]} />
          <Text style={[styles.confidenceText, { color }]}>{confidenceLabel(item.confidence)}</Text>
        </View>
      </View>

      {/* Portion + kcal */}
      <View style={styles.resultMacroRow}>
        <View style={styles.resultMacroItem}>
          <Text style={styles.resultMacroValue}>~{Math.round(item.estimated_weight_g)}</Text>
          <Text style={styles.resultMacroUnit}>g estimés</Text>
        </View>
        <View style={styles.resultMacroDivider} />
        <View style={styles.resultMacroItem}>
          <Text style={styles.resultMacroValue}>{Math.round(item.kcal_total)}</Text>
          <Text style={styles.resultMacroUnit}>kcal</Text>
        </View>
        <View style={styles.resultMacroDivider} />
        <View style={styles.resultMacroItem}>
          <Text style={styles.resultMacroValue}>{item.protein_g.toFixed(1)}</Text>
          <Text style={styles.resultMacroUnit}>P (g)</Text>
        </View>
        <View style={styles.resultMacroDivider} />
        <View style={styles.resultMacroItem}>
          <Text style={styles.resultMacroValue}>{item.carbs_g.toFixed(1)}</Text>
          <Text style={styles.resultMacroUnit}>G (g)</Text>
        </View>
        <View style={styles.resultMacroDivider} />
        <View style={styles.resultMacroItem}>
          <Text style={styles.resultMacroValue}>{item.fat_g.toFixed(1)}</Text>
          <Text style={styles.resultMacroUnit}>L (g)</Text>
        </View>
      </View>

      {/* Allergens */}
      {allergens.length > 0 && (
        <View style={styles.allergenRow}>
          <Icon name="alert-triangle" size={11} color={Colors.warn} />
          <Text style={styles.allergenText}>{allergens.join(' · ')}</Text>
        </View>
      )}

      {/* FODMAP note */}
      {!!item.fodmap_note && (
        <View style={styles.fodmapRow}>
          <Icon name="info" size={11} color={Colors.signal} />
          <Text style={styles.fodmapText}>{item.fodmap_note}</Text>
        </View>
      )}

      {/* Import button */}
      <TouchableOpacity
        style={[styles.importBtn, alreadyImported && styles.importBtnDone]}
        onPress={onImport}
        disabled={alreadyImported}
        activeOpacity={0.75}
      >
        <Icon
          name={alreadyImported ? 'check' : 'plus'}
          size={14}
          color={alreadyImported ? Colors.ok : Colors.paper}
        />
        <Text style={[styles.importBtnText, alreadyImported && styles.importBtnTextDone]}>
          {alreadyImported ? 'Importé' : 'Ajouter à ma liste'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Compatibility banner ──────────────────────────────────────

function IncompatibleBanner({ reason }: { reason: string }) {
  return (
    <View style={styles.incompatBanner}>
      <Icon name="camera-off" size={18} color={Colors.signal} />
      <Text style={styles.incompatText}>{reason}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

interface Props {
  existingIds: Set<string>;
  settings: AppSettings;
  onImport: (food: Food) => void;
  onBack: () => void;
}

export function FoodPhotoScreen({ existingIds, settings, onImport, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedNames, setImportedNames] = useState<Set<string>>(new Set());

  // Compatibility check
  const isOllama = settings.aiProvider === 'ollama';
  const modelId = settings.openrouter.model ?? '';
  const modelIncompatible = !isOllama && !!modelId && !isVisionCapableModel(modelId);
  const isBlocked = isOllama || modelIncompatible;

  let incompatReason = '';
  if (isOllama) {
    incompatReason = 'La reconnaissance photo nécessite OpenRouter.\nPasse en mode OpenRouter dans les Paramètres.';
  } else if (modelIncompatible) {
    incompatReason = `Le modèle « ${modelId} » ne supporte pas les images.\nModèles compatibles : claude-3.5-sonnet, gpt-4o, gemini-1.5-flash, llama-3.2-vision…`;
  }

  async function pickFromGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  }

  async function pickFromCamera() {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  }

  async function analyze() {
    if (!photoUri) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const r = await analyzeFoodPhoto(photoUri, settings);
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleImport(item: VisionFoodItem) {
    const food = visionItemToFood(item);
    onImport(food);
    setImportedNames((s) => new Set(s).add(item.name));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.eyebrow}>Reconnaissance</Text>
          <Text style={styles.title}>Photo IA</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Compatibility warning */}
        {isBlocked && <IncompatibleBanner reason={incompatReason} />}

        {/* Photo picker — always shown */}
        {!photoUri && (
          <View style={styles.pickerSection}>
            <Text style={styles.pickerInstruction}>
              Prends une photo de ton repas ou sélectionne une image depuis ta galerie.
            </Text>
            <Text style={styles.pickerSub}>
              L'IA identifiera les aliments, estimera les portions et détectera les allergènes visibles.
            </Text>
            <View style={styles.pickerBtns}>
              <TouchableOpacity
                style={[styles.pickerBtn, isBlocked && styles.pickerBtnDisabled]}
                onPress={pickFromCamera}
                disabled={isBlocked}
                activeOpacity={0.8}
              >
                <Icon name="camera" size={26} color={isBlocked ? Colors.muted2 : Colors.ink} />
                <Text style={[styles.pickerBtnLabel, isBlocked && { color: Colors.muted2 }]}>
                  Appareil photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerBtn, isBlocked && styles.pickerBtnDisabled]}
                onPress={pickFromGallery}
                disabled={isBlocked}
                activeOpacity={0.8}
              >
                <Icon name="image" size={26} color={isBlocked ? Colors.muted2 : Colors.ink} />
                <Text style={[styles.pickerBtnLabel, isBlocked && { color: Colors.muted2 }]}>
                  Galerie
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.disclaimer}>
              <Icon name="info" size={13} color={Colors.muted} />
              <Text style={styles.disclaimerText}>
                Les estimations sont approximatives (±30%). Vérifie toujours les valeurs avant d'enregistrer.
              </Text>
            </View>
          </View>
        )}

        {/* Photo preview */}
        {photoUri && !isAnalyzing && (
          <View style={styles.previewSection}>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <View style={styles.previewActions}>
              <TouchableOpacity onPress={() => { setPhotoUri(null); setResult(null); setError(null); }} activeOpacity={0.7}>
                <Text style={styles.changePhotoLink}>Changer de photo</Text>
              </TouchableOpacity>
              {!result && (
                <TouchableOpacity
                  style={[styles.analyzeBtn, isBlocked && styles.analyzeBtnDisabled]}
                  onPress={analyze}
                  disabled={isBlocked}
                  activeOpacity={0.8}
                >
                  <Text style={styles.analyzeBtnText}>Analyser avec l'IA</Text>
                  <Icon name="arrow-right" size={16} color={Colors.paper} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Loading */}
        {isAnalyzing && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={Colors.ink} />
            <Text style={styles.loadingText}>Analyse en cours…</Text>
            <Text style={styles.loadingSub}>Identification des aliments et estimation des portions</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={16} color={Colors.warn} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {result && !isAnalyzing && (
          <View style={styles.resultsSection}>
            {/* Scene description */}
            <View style={styles.sceneRow}>
              <Icon name="eye" size={14} color={Colors.muted} />
              <Text style={styles.sceneText}>{result.scene_description}</Text>
            </View>

            {/* Global warnings */}
            {result.global_warnings?.map((w, i) => (
              <View key={i} style={styles.globalWarning}>
                <Icon name="alert-triangle" size={13} color={Colors.signal} />
                <Text style={styles.globalWarningText}>{w}</Text>
              </View>
            ))}

            {/* Food cards */}
            {result.foods.map((item, i) => (
              <FoodResultCard
                key={i}
                item={item}
                alreadyImported={importedNames.has(item.name)}
                onImport={() => handleImport(item)}
              />
            ))}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total estimé</Text>
              <Text style={styles.totalValue}>{result.total_kcal_estimate} kcal</Text>
            </View>

            {/* Retry with new photo */}
            <TouchableOpacity
              style={styles.newPhotoBtn}
              onPress={() => { setPhotoUri(null); setResult(null); setError(null); }}
              activeOpacity={0.7}
            >
              <Icon name="camera" size={15} color={Colors.ink} />
              <Text style={styles.newPhotoBtnText}>Analyser une autre photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll:    { paddingBottom: 48 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarCenter: { flex: 1, paddingHorizontal: 12 },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 26,
  },

  // Incompatibility
  incompatBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.signal + '18',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.signal + '44',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  incompatText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    lineHeight: 19,
  },

  // Picker
  pickerSection: {
    margin: 16,
    gap: 14,
  },
  pickerInstruction: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 8,
  },
  pickerSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  pickerBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  pickerBtnDisabled: {
    opacity: 0.4,
  },
  pickerBtnLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    color: Colors.muted2,
    letterSpacing: 0.2,
    lineHeight: 14,
  },

  // Preview
  previewSection: {
    margin: 16,
    gap: 12,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.card,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changePhotoLink: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  analyzeBtnDisabled: {
    opacity: 0.4,
  },
  analyzeBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.paper,
    letterSpacing: -0.2,
  },

  // Loading
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 14,
  },
  loadingText: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  loadingSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Error
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: Colors.warn + '18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warn + '44',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.warn,
    lineHeight: 18,
  },

  // Results
  resultsSection: {
    margin: 16,
    gap: 12,
  },
  sceneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  sceneText: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.ink2,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  globalWarning: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  globalWarningText: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.signal,
    letterSpacing: 0.3,
    lineHeight: 15,
  },

  // Result card
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    padding: 16,
    gap: 10,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  resultCardCategory: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 2,
  },
  resultCardName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    letterSpacing: 0.3,
  },
  resultMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  resultMacroItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  resultMacroValue: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  resultMacroUnit: {
    fontFamily: Fonts.mono,
    fontSize: 7.5,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultMacroDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.hairline2,
  },
  allergenRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  allergenText: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.warn,
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  fodmapRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  fodmapText: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.signal,
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ok,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 4,
  },
  importBtnDone: {
    backgroundColor: Colors.ok + '22',
    borderWidth: 1,
    borderColor: Colors.ok + '55',
  },
  importBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.paper,
    letterSpacing: -0.1,
  },
  importBtnTextDone: {
    color: Colors.ok,
  },

  // Total + retry
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  totalLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  totalValue: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  newPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    marginTop: 4,
  },
  newPhotoBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
});
