import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { AppSettings } from '../types/settings';
import { generateFoodWithAI } from '../services/aiService';

type Phase = 'input' | 'loading' | 'preview' | 'error';

// ── Preview card ───────────────────────────────────────────────

function MacroBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={previewStyles.macroItem}>
      <Text style={previewStyles.macroValue}>{value}<Text style={previewStyles.macroUnit}>g</Text></Text>
      <View style={[previewStyles.macroDot, { backgroundColor: color }]} />
      <Text style={previewStyles.macroLabel}>{label}</Text>
    </View>
  );
}

function FoodPreviewCard({ food }: { food: Food }) {
  return (
    <View style={previewStyles.card}>
      {/* Header */}
      <View style={previewStyles.header}>
        <View style={previewStyles.glyph}>
          <Text style={previewStyles.glyphText}>{food.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={previewStyles.headerText}>
          <Text style={previewStyles.category}>{food.category}</Text>
          <Text style={previewStyles.name}>{food.name}</Text>
          <Text style={previewStyles.brand}>{food.brand}</Text>
        </View>
      </View>

      <View style={previewStyles.divider} />

      {/* Kcal */}
      <View style={previewStyles.kcalRow}>
        <Text style={previewStyles.kcalValue}>{food.per100.kcal}</Text>
        <Text style={previewStyles.kcalLabel}> kcal / 100 g</Text>
      </View>

      {/* Macros */}
      <View style={previewStyles.macros}>
        <MacroBar label="Protéines" value={food.per100.protein} color={Colors.ok} />
        <MacroBar label="Glucides" value={food.per100.carbs} color={Colors.signal} />
        <MacroBar label="Lipides" value={food.per100.fat} color={Colors.warn} />
        <MacroBar label="Fibres" value={food.per100.fiber} color={Colors.muted} />
      </View>

      <View style={previewStyles.divider} />

      {/* Compat tags */}
      <View style={previewStyles.compat}>
        {food.compat.map((c, i) => (
          <View key={i} style={[previewStyles.tag, c.kind === 'ok' ? previewStyles.tagOk : previewStyles.tagWarn]}>
            <Text style={[previewStyles.tagText, c.kind === 'ok' ? previewStyles.tagTextOk : previewStyles.tagTextWarn]}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Subtitle */}
      {food.subtitle ? (
        <Text style={previewStyles.subtitle}>{food.subtitle}</Text>
      ) : null}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    padding: 18,
    gap: 14,
  },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  glyph: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: { fontFamily: Fonts.serif, fontSize: 26, color: Colors.paper2 },
  headerText: { flex: 1 },
  category: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginBottom: 2 },
  name: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3, lineHeight: 24 },
  brand: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.hairline2 },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline' },
  kcalValue: { fontFamily: Fonts.serif, fontSize: 32, color: Colors.ink, letterSpacing: -0.5 },
  kcalLabel: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center', gap: 4 },
  macroValue: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink },
  macroUnit: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted },
  compat: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1 },
  tagOk: { backgroundColor: 'rgba(63,90,58,0.08)', borderColor: 'rgba(63,90,58,0.25)' },
  tagWarn: { backgroundColor: 'rgba(139,58,46,0.08)', borderColor: 'rgba(139,58,46,0.25)' },
  tagText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1 },
  tagTextOk: { color: Colors.ok },
  tagTextWarn: { color: Colors.warn },
  subtitle: { fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.muted, lineHeight: 19 },
});

// ── Main screen ────────────────────────────────────────────────

interface Props {
  settings: AppSettings;
  onAdd: (food: Food) => void;
  onBack: () => void;
}

export function AddFoodScreen({ settings, onAdd, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('input');
  const [foodName, setFoodName] = useState('');
  const [brand, setBrand] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<Food | null>(null);
  const [error, setError] = useState('');

  const providerLabel = settings.aiProvider === 'openrouter'
    ? `OpenRouter · ${settings.openrouter.model || '—'}`
    : `Ollama · ${settings.ollama.model || '—'}`;

  const handleGenerate = async () => {
    if (!foodName.trim()) return;
    setPhase('loading');
    setError('');
    try {
      const food = await generateFoodWithAI(foodName.trim(), brand.trim(), context.trim(), settings);
      setResult(food);
      setPhase('preview');
    } catch (e: unknown) {
      setError((e as Error).message);
      setPhase('error');
    }
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd(result);
  };

  const handleRetry = () => {
    setPhase('input');
    setResult(null);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Étape 1 sur 3</Text>
            <Text style={styles.title}>Ajouter avec l'IA</Text>
          </View>
          <View style={styles.providerBadge}>
            <Icon name="sparkle" size={11} color={Colors.signal} />
            <Text style={styles.providerText} numberOfLines={1}>
              {settings.aiProvider === 'openrouter' ? 'OpenRouter' : 'Ollama'}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          {/* ── INPUT PHASE ─────────────────────────────────── */}
          {(phase === 'input' || phase === 'error') && (
            <>
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom de l'aliment *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ex. Lentilles vertes du Puy"
                    placeholderTextColor={Colors.muted2}
                    value={foodName}
                    onChangeText={setFoodName}
                    autoCapitalize="words"
                    autoFocus
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.inputDivider} />
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Marque (optionnel)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ex. Intermarché Bio, Maison Bertin…"
                    placeholderTextColor={Colors.muted2}
                    value={brand}
                    onChangeText={setBrand}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.inputDivider} />
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contexte (optionnel)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ex. cuit, cru, en conserve, bio…"
                    placeholderTextColor={Colors.muted2}
                    value={context}
                    onChangeText={setContext}
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {phase === 'error' && (
                <View style={styles.errorBox}>
                  <Icon name="alert" size={16} color={Colors.warn} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.modelHint}>{providerLabel}</Text>

              <TouchableOpacity
                style={[styles.generateBtn, !foodName.trim() && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                activeOpacity={0.8}
                disabled={!foodName.trim()}
              >
                <Icon name="sparkle" size={18} color={Colors.paper2} />
                <Text style={styles.generateBtnText}>
                  {phase === 'error' ? 'Réessayer' : 'Générer avec l\'IA'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── LOADING PHASE ───────────────────────────────── */}
          {phase === 'loading' && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.ink} />
              <Text style={styles.loadingTitle}>Analyse en cours…</Text>
              <Text style={styles.loadingDesc}>
                L'IA recherche les données nutritionnelles{'\n'}pour « {foodName} »
              </Text>
            </View>
          )}

          {/* ── PREVIEW PHASE ───────────────────────────────── */}
          {phase === 'preview' && result && (
            <>
              <View style={styles.previewHeader}>
                <Icon name="check" size={16} color={Colors.ok} />
                <Text style={styles.previewHeaderText}>Données générées — vérifie avant d'ajouter</Text>
              </View>

              <FoodPreviewCard food={result} />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRetry}
                  activeOpacity={0.7}
                >
                  <Icon name="refresh" size={16} color={Colors.muted} />
                  <Text style={styles.retryBtnText}>Réessayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAdd}
                  activeOpacity={0.8}
                >
                  <Icon name="plus" size={18} color={Colors.paper2} />
                  <Text style={styles.addBtnText}>Ajouter à ma liste</Text>
                </TouchableOpacity>
              </View>

              {result.minerals && result.minerals.length > 0 && (
                <View style={styles.detailHint}>
                  <Icon name="leaf" size={13} color={Colors.muted} />
                  <Text style={styles.detailHintText}>
                    {result.minerals.length} minéraux · {result.vitamins?.length ?? 0} vitamines · données FODMAP incluses
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.4 },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    maxWidth: 110,
  },
  providerText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.signal,
  },

  content: { paddingHorizontal: 16, gap: 12 },

  // Form
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    overflow: 'hidden',
    marginTop: 4,
  },
  inputGroup: { paddingHorizontal: 16, paddingVertical: 14 },
  inputLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 0,
  },
  inputDivider: { height: 1, backgroundColor: Colors.hairline2 },

  // Error
  errorBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(139,58,46,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.2)',
    padding: 14,
    alignItems: 'flex-start',
  },
  errorText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: Colors.warn, lineHeight: 18 },

  modelHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted2,
    textAlign: 'center',
  },

  // Generate button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.paper2,
    letterSpacing: 0.2,
  },

  // Loading
  loadingBox: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  loadingTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, letterSpacing: -0.3 },
  loadingDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Preview
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  previewHeaderText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.ok,
  },

  actions: { flexDirection: 'row', gap: 10 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  retryBtnText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 14,
  },
  addBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2 },

  detailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  detailHintText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },
});
