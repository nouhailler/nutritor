/**
 * MealGeneratorScreen — stack 'mealGenerator'
 * Générateur de repas IA (OpenRouter / Ollama) tenant compte du profil complet :
 * allergènes, régimes actifs, phase FODMAP, objectifs caloriques et macros.
 * Résultats expandables : macros, ingrédients, micronutriments, score anti-inflammatoire.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { UserProfile } from '../data/user';
import { FodmapProtocol } from '../data/fodmapProtocol';
import { AppSettings } from '../types/settings';
import { GeneratedMeal, MealGeneratorResult } from '../types/mealGenerator';
import { generateMeals, isAIReady } from '../services/aiService';

// ── Suggestion chips ──────────────────────────────────────────

function buildSuggestions(profile: UserProfile): string[] {
  const chips: string[] = [];
  const isLowFodmap = profile.diets.some((d) => d.id === 'low' && d.on);
  const isVegan = profile.diets.some((d) => d.id === 'vg' && d.on);
  const isVegetarian = profile.diets.some((d) => d.id === 'veg' && d.on);
  const noLactose = profile.allergens.some(
    (a) => a.name === 'Lactose' && (a.level === 'sévère' || a.level === 'modéré'),
  );
  const noGluten = profile.allergens.some(
    (a) => a.name === 'Gluten' && (a.level === 'sévère' || a.level === 'modéré'),
  );
  const highProtein = profile.macroTargets.protein >= 120;

  if (isLowFodmap) {
    chips.push('3 repas low FODMAP pour la semaine');
    chips.push('Petit déjeuner low FODMAP riche en fibres');
  }
  if (noLactose) chips.push('Dîner sans lactose léger');
  if (noGluten) chips.push('Déjeuner sans gluten équilibré');
  if (isVegan || isVegetarian) chips.push('Repas végétarien riche en protéines');
  if (highProtein) chips.push('Dîner riche en protéines post-entraînement');

  chips.push('Déjeuner anti-inflammatoire');
  chips.push('Petit déjeuner rassasiant rapide');
  chips.push('Repas léger digeste pour le soir');

  return chips.slice(0, 6);
}

// ── Macro pill ────────────────────────────────────────────────

function MacroPill({ label, value, unit, color }: {
  label: string; value: number; unit: string; color: string
}) {
  return (
    <View style={styles.macroPill}>
      <Text style={[styles.macroPillVal, { color }]}>{value}</Text>
      <Text style={styles.macroPillUnit}>{unit}</Text>
      <Text style={styles.macroPillLabel}>{label}</Text>
    </View>
  );
}

// ── Meal card ─────────────────────────────────────────────────

function MealCard({ meal, onSave }: { meal: GeneratedMeal; onSave?: (meal: GeneratedMeal) => void }) {
  const [expanded, setExpanded] = useState(false);

  const totalTime = (meal.prepTime ?? 0) + (meal.cookTime ?? 0);
  const hasFodmap = !!meal.fodmapCompatibility;

  return (
    <View style={styles.mealCard}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.mealHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.mealEmojiWrap}>
          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
        </View>
        <View style={styles.mealHeaderText}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealType}>{meal.mealType}</Text>
        </View>
        <View style={styles.mealHeaderRight}>
          <Text style={styles.mealKcal}>{meal.per_serving.kcal}</Text>
          <Text style={styles.mealKcalUnit}>kcal</Text>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.muted}
          />
        </View>
      </TouchableOpacity>

      {/* Compact info row */}
      <View style={styles.mealMeta}>
        {totalTime > 0 && (
          <View style={styles.metaChip}>
            <Icon name="clock" size={11} color={Colors.muted} />
            <Text style={styles.metaChipText}>{totalTime} min</Text>
          </View>
        )}
        {meal.servings > 1 && (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{meal.servings} pers.</Text>
          </View>
        )}
        {hasFodmap && (
          <View style={[styles.metaChip, styles.metaChipFodmap]}>
            <Text style={[styles.metaChipText, { color: Colors.ok }]}>Low FODMAP</Text>
          </View>
        )}
        {meal.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagChipText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.mealDesc}>{meal.description}</Text>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.mealExpanded}>
          <View style={styles.expandDivider} />

          {/* Macros */}
          <View style={styles.macroRow}>
            <MacroPill label="Prot." value={meal.per_serving.protein} unit="g" color={Colors.ok} />
            <MacroPill label="Gluc." value={meal.per_serving.carbs} unit="g" color={Colors.signal} />
            <MacroPill label="Lip." value={meal.per_serving.fat} unit="g" color={Colors.muted} />
            {meal.per_serving.fiber != null && (
              <MacroPill label="Fibres" value={meal.per_serving.fiber} unit="g" color={Colors.ink2} />
            )}
          </View>

          {/* Ingredients */}
          <Text style={styles.expandLabel}>Ingrédients</Text>
          {meal.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.ingredientDot} />
              <View style={styles.ingredientText}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{ing.amount}</Text>
              </View>
              {ing.fodmapNote && (
                <Text style={styles.fodmapNote}>{ing.fodmapNote}</Text>
              )}
            </View>
          ))}

          {/* Micronutrients */}
          {meal.micronutrients && meal.micronutrients.length > 0 && (
            <>
              <Text style={[styles.expandLabel, { marginTop: 16 }]}>Micronutriments clés</Text>
              <View style={styles.microGrid}>
                {meal.micronutrients.map((m, i) => (
                  <View key={i} style={styles.microItem}>
                    <Text style={styles.microName}>{m.name}</Text>
                    <Text style={styles.microAmount}>{m.amount}</Text>
                    {m.pct_anr && <Text style={styles.microAnr}>{m.pct_anr} AJR</Text>}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Anti-inflammatory score */}
          {meal.antiInflammatoryScore != null && (
            <View style={styles.scoreRow}>
              <Icon name="zap" size={13} color={Colors.signal} />
              <Text style={styles.scoreLabel}>Score anti-inflammatoire</Text>
              <View style={styles.scoreBarWrap}>
                <View
                  style={[
                    styles.scoreBar,
                    { width: `${meal.antiInflammatoryScore}%` as unknown as number },
                  ]}
                />
              </View>
              <Text style={styles.scoreVal}>{meal.antiInflammatoryScore}/100</Text>
            </View>
          )}

          {/* FODMAP note */}
          {meal.fodmapCompatibility && (
            <View style={styles.fodmapBlock}>
              <Icon name="activity" size={13} color={Colors.ok} />
              <Text style={styles.fodmapBlockText}>{meal.fodmapCompatibility}</Text>
            </View>
          )}

          {/* Why good */}
          {meal.whyGood && (
            <View style={styles.whyGoodBlock}>
              <Text style={styles.whyGoodLabel}>Pourquoi c'est adapté</Text>
              <Text style={styles.whyGoodText}>{meal.whyGood}</Text>
            </View>
          )}

          {/* Save button */}
          {onSave && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => onSave(meal)}
              activeOpacity={0.8}
            >
              <Icon name="bookmark" size={14} color={Colors.paper2} />
              <Text style={styles.saveBtnText}>Sauvegarder ce repas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

interface MealGeneratorScreenProps {
  profile: UserProfile;
  fodmapProtocol: FodmapProtocol;
  settings: AppSettings;
  externalResult?: MealGeneratorResult | null;
  onGenerateInBackground?: (query: string) => void;
  onSaveMeal?: (meal: GeneratedMeal) => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onStartDemo?: () => void;
}

export function MealGeneratorScreen({
  profile,
  fodmapProtocol,
  settings,
  externalResult,
  onGenerateInBackground,
  onSaveMeal,
  onBack,
  onOpenMenu,
  onStartDemo,
}: MealGeneratorScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealGeneratorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentToBackground, setSentToBackground] = useState(false);
  const aiReady = isAIReady(settings);
  const suggestions = buildSuggestions(profile);

  // Show externally generated result when it arrives
  const displayResult = externalResult ?? result;

  const handleGenerate = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setError(null);
    setResult(null);
    setSentToBackground(false);

    if (onGenerateInBackground) {
      // Launch in background and let user navigate freely
      onGenerateInBackground(trimmed);
      setSentToBackground(true);
      return;
    }

    // Fallback: inline generation (no background handler)
    setLoading(true);
    try {
      const fodmapPhase = fodmapProtocol.active ? fodmapProtocol.phase : undefined;
      const res = await generateMeals(trimmed, profile, fodmapPhase, settings);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Générateur de repas</Text>
          <Text style={styles.topbarSub}>IA nutritionniste personnalisée</Text>
        </View>
        {onStartDemo && (
          <TouchableOpacity style={styles.iconBtnSignal} onPress={onStartDemo} activeOpacity={0.7}>
            <Icon name="activity" size={18} color={Colors.signal} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Input area */}
        <View style={styles.inputSection}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="3 repas low FODMAP végétariens, petit déj riche en protéines…"
              placeholderTextColor={Colors.muted2}
              multiline
              returnKeyType="done"
              blurOnSubmit
            />
          </View>

          {!aiReady && (
            <View style={styles.aiWarning}>
              <Icon name="alert" size={14} color={Colors.signal} />
              <Text style={styles.aiWarningText}>
                Configure OpenRouter ou Ollama dans les Paramètres pour activer l'IA.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.generateBtn, (!query.trim() || loading || !aiReady) && styles.generateBtnDisabled]}
            onPress={() => handleGenerate(query)}
            activeOpacity={0.85}
            disabled={!query.trim() || loading || !aiReady}
          >
            {loading ? (
              <ActivityIndicator color={Colors.paper2} size="small" />
            ) : (
              <Icon name="sparkle" size={16} color={Colors.paper2} />
            )}
            <Text style={styles.generateBtnText}>
              {loading ? 'Génération en cours…' : 'Générer 3 repas'}
            </Text>
          </TouchableOpacity>

          {sentToBackground && !displayResult && (
            <View style={styles.bgNotice}>
              <Icon name="sparkle" size={13} color={Colors.ok} />
              <Text style={styles.bgNoticeText}>
                Génération en cours en arrière-plan. L'icône ✦ en haut à droite deviendra verte quand c'est prêt.
              </Text>
            </View>
          )}
        </View>

        {/* Suggestion chips */}
        {!displayResult && !loading && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsLabel}>Suggestions pour ton profil</Text>
            <View style={styles.chipsWrap}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleGenerate(s)}
                  activeOpacity={0.75}
                  disabled={loading || !aiReady}
                >
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={Colors.ink} size="large" />
            <Text style={styles.loadingTitle}>L'IA compose vos repas…</Text>
            <Text style={styles.loadingDesc}>
              Analyse du profil · Équilibre FODMAP · Calcul macros
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorBlock}>
            <Icon name="alert-circle" size={20} color={Colors.warn} />
            <Text style={styles.errorTitle}>Génération échouée</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => handleGenerate(query)}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={14} color={Colors.ink} />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {displayResult && !loading && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>{displayResult.meals.length} repas générés</Text>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={() => handleGenerate(query)}
                activeOpacity={0.8}
              >
                <Icon name="refresh" size={13} color={Colors.muted} />
                <Text style={styles.regenerateBtnText}>Régénérer</Text>
              </TouchableOpacity>
            </View>
            {displayResult.contextNote && (
              <Text style={styles.contextNote}>{displayResult.contextNote}</Text>
            )}
            {displayResult.meals.map((meal, i) => (
              <MealCard key={i} meal={meal} onSave={onSaveMeal} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Topbar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSignal: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  topbarSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 1,
  },

  // Input
  inputSection: { paddingTop: 8, gap: 12 },
  inputWrap: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 22,
  },

  aiWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(107,90,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(107,90,46,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  aiWarningText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.signal,
    lineHeight: 18,
  },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.paper2,
    letterSpacing: -0.1,
  },

  // Suggestions
  suggestionsSection: { marginTop: 28 },
  suggestionsLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 12,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },
  suggestionChipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },

  // Loading
  loadingBlock: {
    marginTop: 48,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  loadingDesc: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Error
  errorBlock: {
    marginTop: 32,
    alignItems: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: 'rgba(139,58,46,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.2)',
    borderRadius: 20,
  },
  errorTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.warn,
    letterSpacing: -0.3,
  },
  errorDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  bgNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(63,90,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.2)',
  },
  bgNoticeText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ok,
    lineHeight: 18,
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    backgroundColor: Colors.card,
  },
  retryBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink,
  },

  // Results
  resultsSection: { marginTop: 24, gap: 16 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultsTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  regenerateBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
  },
  contextNote: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Meal card
  mealCard: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 20,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 10,
  },
  mealEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mealEmoji: { fontSize: 26 },
  mealHeaderText: { flex: 1 },
  mealName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  mealType: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 2,
  },
  mealHeaderRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  mealKcal: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  mealKcalUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.muted,
  },

  // Meta row
  mealMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    backgroundColor: Colors.paper2,
  },
  metaChipFodmap: {
    borderColor: 'rgba(63,90,58,0.3)',
    backgroundColor: 'rgba(63,90,58,0.06)',
  },
  metaChipText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    color: Colors.muted,
  },
  tagChip: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline2,
  },
  tagChipText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },

  // Description
  mealDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  // Expanded
  mealExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 0,
  },
  expandDivider: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginBottom: 16,
  },

  // Macros
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    backgroundColor: Colors.paper2,
    gap: 1,
  },
  macroPillVal: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  macroPillUnit: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  macroPillLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginTop: 1,
  },

  // Ingredients
  expandLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  ingredientDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.ink,
    marginTop: 7,
    flexShrink: 0,
  },
  ingredientText: { flex: 1 },
  ingredientName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },
  ingredientAmount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  fodmapNote: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.ok,
    letterSpacing: 0.2,
    flexShrink: 0,
    maxWidth: 110,
    textAlign: 'right',
    lineHeight: 13,
    paddingTop: 2,
  },

  // Micronutrients
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    backgroundColor: Colors.paper2,
    minWidth: 90,
    alignItems: 'center',
  },
  microName: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  microAmount: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: Colors.ink,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  microAnr: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.ok,
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Anti-inflammatory score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  scoreLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  scoreBarWrap: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.hairline2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBar: {
    height: 4,
    backgroundColor: Colors.signal,
    borderRadius: 2,
  },
  scoreVal: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.signal,
    letterSpacing: 0.3,
    flexShrink: 0,
  },

  // FODMAP block
  fodmapBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(63,90,58,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.25)',
    borderRadius: 12,
  },
  fodmapBlockText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.ok,
    lineHeight: 18,
  },

  // Why good
  whyGoodBlock: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.paper2,
    borderRadius: 12,
    gap: 4,
  },
  whyGoodLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  whyGoodText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    lineHeight: 19,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    backgroundColor: Colors.ink,
    borderRadius: 12,
  },
  saveBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.paper2,
  },
});
