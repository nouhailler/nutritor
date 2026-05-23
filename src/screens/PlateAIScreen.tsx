import React, { useRef, useState } from 'react';
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
import { AppSettings } from '../types/settings';
import { Food } from '../types';
import { SavedPlate } from '../data/saved';
import { SmartRecipe, SmartRecipeQuery, QueryMode } from '../types/smartRecipe';
import { generateSmartRecipes } from '../services/aiService';

// ── Types ────────────────────────────────────────────────────

type Phase = 'query' | 'generating' | 'results' | 'detail';

interface Props {
  profile: UserProfile;
  settings: AppSettings;
  foodList: Food[];
  savedPlates: SavedPlate[];
  onSavePlate: (plate: SavedPlate) => void;
  onBack: () => void;
  onOpenMenu: () => void;
}

// ── Constants ────────────────────────────────────────────────

const QUICK_INGREDIENTS = [
  'Poulet', 'Riz', 'Courgette', 'Tomate', 'Saumon', 'Lentilles',
  'Quinoa', 'Épinards', 'Patate douce', 'Pois chiches', 'Avocat', 'Œuf',
];

const MEAL_TYPES = ['Déjeuner', 'Dîner', 'Snack', 'Petit-déjeuner'];

const PROFILE_CRITERIA = [
  'Énergie stable', 'Digestion légère', 'Riche en protéines',
  'Anti-inflammatoire', 'Faible glycémie', 'Riche en fibres',
];

const NUTRITIONAL_CRITERIA = [
  'Faible glycémie', 'Digestion légère', 'Riche en protéines',
  'Énergie rapide', 'Anti-inflammatoire', 'Riche en fibres',
  'Sans lactose', 'Sans gluten', 'Low FODMAP', 'Vegan', 'Végétarien',
];

const VARIANT_TYPES = [
  'Plus digeste', 'Plus protéiné', 'Low FODMAP',
  'Faible glycémie', 'Version végétarienne', 'Cuisson plus légère',
];

const RESULT_VARIANT_CHIPS = ['Plus digeste', 'Plus protéiné', 'Low FODMAP'];

const DETAIL_VARIANT_CHIPS = [
  'Plus digeste', 'Plus protéiné', 'Low FODMAP', 'Faible glycémie', 'Version végétarienne',
];

// ── Helpers ──────────────────────────────────────────────────

function loadColor(load: 'low' | 'moderate' | 'high') {
  if (load === 'low') return Colors.ok;
  if (load === 'high') return Colors.warn;
  return Colors.signal;
}

function loadLabel(load: 'low' | 'moderate' | 'high') {
  if (load === 'low') return 'Faible';
  if (load === 'high') return 'Élevé';
  return 'Modéré';
}

function digestionAccentColor(profile: 'light' | 'moderate' | 'heavy') {
  if (profile === 'light') return Colors.ok;
  if (profile === 'heavy') return Colors.warn;
  return Colors.signal;
}

function smartRecipeToPlate(recipe: SmartRecipe): SavedPlate {
  const totalTime = recipe.prepTime + recipe.cookTime;
  return {
    id: `ai-${Date.now()}`,
    name: recipe.name,
    kcal: recipe.per_serving.kcal,
    time: totalTime > 0 ? `${totalTime} min` : '—',
    timeMin: totalTime,
    tags: recipe.tags.map((t) => t.replace(/-/g, ' ')),
    items: recipe.ingredients.length,
    last: "Aujourd'hui",
    macros: {
      protein: recipe.per_serving.protein,
      carbs: recipe.per_serving.carbs,
      fat: recipe.per_serving.fat,
    },
    recipe: recipe.ingredients.map((ing) => ({
      name: ing.name,
      qty: ing.amount,
      kcal: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
    })),
    note: recipe.steps.join('\n'),
    aiComment: recipe.whyGoodForProfile,
  };
}

// ── Mode cards ───────────────────────────────────────────────

const MODE_CARDS: { mode: QueryMode; emoji: string; title: string; subtitle: string }[] = [
  { mode: 'ingredients', emoji: '🥬', title: 'Ingrédients disponibles', subtitle: 'Que puis-je cuisiner avec…' },
  { mode: 'profile',     emoji: '👤', title: 'Adapté à mon profil',     subtitle: 'Recettes personnalisées' },
  { mode: 'criteria',    emoji: '⚡', title: 'Critères nutritionnels',  subtitle: 'Je veux un repas…' },
  { mode: 'variant',     emoji: '🔄', title: "Variante d'un plat",      subtitle: 'Adapter une recette' },
];

// ── Main screen ──────────────────────────────────────────────

export function PlateAIScreen({
  profile,
  settings,
  foodList,
  savedPlates,
  onSavePlate,
  onBack,
  onOpenMenu,
}: Props) {
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('query');
  const [selectedMode, setSelectedMode] = useState<QueryMode | null>(null);

  // ingredients mode
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // shared
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

  // variant mode
  const [selectedPlateForVariant, setSelectedPlateForVariant] = useState<SavedPlate | null>(null);
  const [selectedVariantType, setSelectedVariantType] = useState<string | null>(null);

  // generation
  const [stepText, setStepText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // results
  const [recipes, setRecipes] = useState<SmartRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  // detail
  const [detailRecipe, setDetailRecipe] = useState<SmartRecipe | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantStep, setVariantStep] = useState('');

  // ── Input validation ─────────────────────────────────────

  const canGenerate = (() => {
    if (!selectedMode) return false;
    if (selectedMode === 'ingredients') return selectedIngredients.length > 0;
    if (selectedMode === 'profile') return true;
    if (selectedMode === 'criteria') return selectedCriteria.length > 0;
    if (selectedMode === 'variant') return !!selectedPlateForVariant && !!selectedVariantType;
    return false;
  })();

  // ── Generate ─────────────────────────────────────────────

  const handleGenerate = async (overrideQuery?: SmartRecipeQuery) => {
    const query: SmartRecipeQuery = overrideQuery ?? {
      mode: selectedMode!,
      ingredients: selectedMode === 'ingredients' ? selectedIngredients : undefined,
      criteria: selectedMode === 'profile' || selectedMode === 'criteria' ? selectedCriteria : undefined,
      mealType: selectedMealType ?? undefined,
      variantOf: selectedMode === 'variant' ? selectedPlateForVariant?.name : undefined,
      variantType: selectedMode === 'variant' ? selectedVariantType ?? undefined : undefined,
    };

    setError(null);
    setPhase('generating');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const results = await generateSmartRecipes(query, profile, settings, controller.signal, setStepText);
      setRecipes(results);
      setPhase('results');
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') {
        setPhase('query');
      } else {
        setError((e as Error).message ?? 'Erreur inconnue.');
        setPhase('results');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleResultVariant = (chip: string) => {
    const base = recipes[0];
    if (!base) return;
    handleGenerate({
      mode: 'variant',
      variantOf: base.name,
      variantType: chip,
    });
  };

  const handleDetailVariant = async (chip: string) => {
    if (!detailRecipe) return;
    setVariantLoading(true);
    setVariantStep('');
    const controller = new AbortController();
    try {
      const results = await generateSmartRecipes(
        { mode: 'variant', variantOf: detailRecipe.name, variantType: chip },
        profile,
        settings,
        controller.signal,
        setVariantStep,
      );
      if (results.length > 0) setDetailRecipe(results[0]);
    } catch {
      // silently ignore
    } finally {
      setVariantLoading(false);
    }
  };

  const handleOpenDetail = (recipe: SmartRecipe) => {
    setDetailRecipe(recipe);
    setPhase('detail');
  };

  const handleSave = () => {
    if (!detailRecipe) return;
    onSavePlate(smartRecipeToPlate(detailRecipe));
  };

  const handleNewSearch = () => {
    setPhase('query');
    setSelectedMode(null);
    setSelectedIngredients([]);
    setIngredientSearch('');
    setSelectedMealType(null);
    setSelectedCriteria([]);
    setSelectedPlateForVariant(null);
    setSelectedVariantType(null);
    setRecipes([]);
    setError(null);
  };

  // ── Ingredient helpers ────────────────────────────────────

  const addIngredient = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedIngredients.includes(trimmed)) return;
    setSelectedIngredients((p) => [...p, trimmed]);
    setIngredientSearch('');
    setShowSuggestions(false);
  };

  const removeIngredient = (name: string) => {
    setSelectedIngredients((p) => p.filter((x) => x !== name));
  };

  const toggleCriteria = (c: string) => {
    setSelectedCriteria((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  };

  const foodSuggestions = ingredientSearch.trim().length > 0
    ? foodList
        .filter((f) => f.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
        .slice(0, 5)
    : [];

  // ── Back navigation ───────────────────────────────────────

  const handleBack = () => {
    if (phase === 'detail') {
      setPhase('results');
      return;
    }
    if (phase === 'results') {
      setPhase('query');
      return;
    }
    onBack();
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Cuisine IA</Text>
          <Text style={styles.topbarSub}>Générateur de recettes intelligent</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Phases */}
      {phase === 'query' && (
        <QueryPhase
          selectedMode={selectedMode}
          onSelectMode={(m) => { setSelectedMode(m); setSelectedCriteria([]); }}
          ingredientSearch={ingredientSearch}
          onIngredientSearchChange={(t) => { setIngredientSearch(t); setShowSuggestions(t.length > 0); }}
          showSuggestions={showSuggestions}
          foodSuggestions={foodSuggestions}
          selectedIngredients={selectedIngredients}
          onAddIngredient={addIngredient}
          onRemoveIngredient={removeIngredient}
          selectedMealType={selectedMealType}
          onSelectMealType={(t) => setSelectedMealType(selectedMealType === t ? null : t)}
          selectedCriteria={selectedCriteria}
          onToggleCriteria={toggleCriteria}
          selectedPlateForVariant={selectedPlateForVariant}
          onSelectPlateForVariant={setSelectedPlateForVariant}
          savedPlates={savedPlates}
          selectedVariantType={selectedVariantType}
          onSelectVariantType={(t) => setSelectedVariantType(selectedVariantType === t ? null : t)}
          profile={profile}
          canGenerate={canGenerate}
          onGenerate={() => handleGenerate()}
          insets={insets}
        />
      )}

      {phase === 'generating' && (
        <GeneratingPhase stepText={stepText} onCancel={handleCancel} insets={insets} />
      )}

      {phase === 'results' && (
        <ResultsPhase
          recipes={recipes}
          error={error}
          onOpenDetail={handleOpenDetail}
          onNewSearch={handleNewSearch}
          onVariant={handleResultVariant}
          insets={insets}
        />
      )}

      {phase === 'detail' && detailRecipe && (
        <DetailPhase
          recipe={detailRecipe}
          variantLoading={variantLoading}
          variantStep={variantStep}
          onVariant={handleDetailVariant}
          onSave={handleSave}
          insets={insets}
        />
      )}
    </View>
  );
}

// ── Query Phase ──────────────────────────────────────────────

function QueryPhase({
  selectedMode, onSelectMode,
  ingredientSearch, onIngredientSearchChange,
  showSuggestions, foodSuggestions,
  selectedIngredients, onAddIngredient, onRemoveIngredient,
  selectedMealType, onSelectMealType,
  selectedCriteria, onToggleCriteria,
  selectedPlateForVariant, onSelectPlateForVariant,
  savedPlates,
  selectedVariantType, onSelectVariantType,
  profile,
  canGenerate, onGenerate,
  insets,
}: {
  selectedMode: QueryMode | null;
  onSelectMode: (m: QueryMode) => void;
  ingredientSearch: string;
  onIngredientSearchChange: (t: string) => void;
  showSuggestions: boolean;
  foodSuggestions: Food[];
  selectedIngredients: string[];
  onAddIngredient: (n: string) => void;
  onRemoveIngredient: (n: string) => void;
  selectedMealType: string | null;
  onSelectMealType: (t: string) => void;
  selectedCriteria: string[];
  onToggleCriteria: (c: string) => void;
  selectedPlateForVariant: SavedPlate | null;
  onSelectPlateForVariant: (p: SavedPlate) => void;
  savedPlates: SavedPlate[];
  selectedVariantType: string | null;
  onSelectVariantType: (t: string) => void;
  profile: UserProfile;
  canGenerate: boolean;
  onGenerate: () => void;
  insets: { bottom: number };
}) {
  const activeDiets = profile.diets.filter((d) => d.on).map((d) => d.label);
  const activeAllergenCount = profile.allergens.filter((a) => a.level !== 'aucun').length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>Mode de génération</Text>

      {/* Mode cards 2×2 */}
      <View style={styles.modeGrid}>
        {MODE_CARDS.map((card) => (
          <TouchableOpacity
            key={card.mode}
            style={[styles.modeCard, selectedMode === card.mode && styles.modeCardActive]}
            onPress={() => onSelectMode(card.mode)}
            activeOpacity={0.75}
          >
            <Text style={styles.modeEmoji}>{card.emoji}</Text>
            <Text style={[styles.modeTitle, selectedMode === card.mode && styles.modeTextActive]}>
              {card.title}
            </Text>
            <Text style={[styles.modeSub, selectedMode === card.mode && styles.modeSubActive]}>
              {card.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode-specific inputs */}
      {selectedMode === 'ingredients' && (
        <View style={styles.modeSection}>
          <Text style={styles.sectionLabel}>Ingrédients disponibles</Text>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              value={ingredientSearch}
              onChangeText={onIngredientSearchChange}
              placeholder="Rechercher un ingrédient…"
              placeholderTextColor={Colors.muted2}
            />
            {ingredientSearch.length > 0 && (
              <TouchableOpacity onPress={() => { onIngredientSearchChange(''); }} activeOpacity={0.7}>
                <Icon name="close" size={14} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown suggestions */}
          {showSuggestions && foodSuggestions.length > 0 && (
            <View style={styles.dropdown}>
              {foodSuggestions.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.dropdownItem}
                  onPress={() => onAddIngredient(f.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick suggestions */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Suggestions rapides</Text>
          <View style={styles.chipsWrap}>
            {QUICK_INGREDIENTS.map((ing) => (
              <TouchableOpacity
                key={ing}
                style={[
                  styles.chip,
                  selectedIngredients.includes(ing) && styles.chipActive,
                ]}
                onPress={() => selectedIngredients.includes(ing) ? onRemoveIngredient(ing) : onAddIngredient(ing)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedIngredients.includes(ing) && styles.chipTextActive]}>
                  {ing}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected ingredients */}
          {selectedIngredients.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                Sélectionnés ({selectedIngredients.length})
              </Text>
              <View style={styles.chipsWrap}>
                {selectedIngredients.map((ing) => (
                  <TouchableOpacity
                    key={ing}
                    style={styles.chipSelected}
                    onPress={() => onRemoveIngredient(ing)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipSelectedText}>{ing}</Text>
                    <Icon name="close" size={10} color={Colors.paper2} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <MealTypeSelector selected={selectedMealType} onSelect={onSelectMealType} />
        </View>
      )}

      {selectedMode === 'profile' && (
        <View style={styles.modeSection}>
          {/* Profile summary card */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardRow}>
              <Text style={styles.profileCardName}>{profile.name}</Text>
              <Text style={styles.profileCardGoal}>{profile.goal}</Text>
            </View>
            <View style={styles.profileCardChips}>
              {activeDiets.map((d) => (
                <View key={d} style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>{d}</Text>
                </View>
              ))}
              {activeAllergenCount > 0 && (
                <View style={[styles.profileBadge, styles.profileBadgeWarn]}>
                  <Text style={[styles.profileBadgeText, { color: Colors.warn }]}>
                    {activeAllergenCount} allergène{activeAllergenCount > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.profileKcal}>{profile.kcalTarget} kcal/jour</Text>
          </View>

          <Text style={styles.sectionLabel}>Critères supplémentaires</Text>
          <View style={styles.chipsWrap}>
            {PROFILE_CRITERIA.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selectedCriteria.includes(c) && styles.chipActive]}
                onPress={() => onToggleCriteria(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedCriteria.includes(c) && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <MealTypeSelector selected={selectedMealType} onSelect={onSelectMealType} />
        </View>
      )}

      {selectedMode === 'criteria' && (
        <View style={styles.modeSection}>
          <Text style={styles.sectionLabel}>Critères nutritionnels</Text>
          <View style={styles.chipsWrap}>
            {NUTRITIONAL_CRITERIA.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selectedCriteria.includes(c) && styles.chipActive]}
                onPress={() => onToggleCriteria(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedCriteria.includes(c) && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <MealTypeSelector selected={selectedMealType} onSelect={onSelectMealType} />
        </View>
      )}

      {selectedMode === 'variant' && (
        <View style={styles.modeSection}>
          <Text style={styles.sectionLabel}>Choisir un plat à adapter</Text>
          {savedPlates.length === 0 ? (
            <View style={styles.emptyVariant}>
              <Text style={styles.emptyVariantText}>Aucun plat sauvegardé.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal={false}
              style={styles.variantPlateList}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {savedPlates.map((plate) => (
                <TouchableOpacity
                  key={plate.id}
                  style={[
                    styles.variantPlateRow,
                    selectedPlateForVariant?.id === plate.id && styles.variantPlateRowActive,
                  ]}
                  onPress={() => onSelectPlateForVariant(plate)}
                  activeOpacity={0.75}
                >
                  <View style={styles.variantPlateInfo}>
                    <Text style={styles.variantPlateName}>{plate.name}</Text>
                    <Text style={styles.variantPlateMeta}>{plate.kcal} kcal · {plate.time}</Text>
                  </View>
                  {selectedPlateForVariant?.id === plate.id && (
                    <Icon name="check" size={16} color={Colors.ok} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Type de variante</Text>
          <View style={styles.chipsWrap}>
            {VARIANT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedVariantType === t && styles.chipActive]}
                onPress={() => onSelectVariantType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedVariantType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
        onPress={onGenerate}
        activeOpacity={0.85}
        disabled={!canGenerate}
      >
        <Text style={styles.generateBtnText}>✨ Générer les recettes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Meal type selector (shared) ───────────────────────────────

function MealTypeSelector({
  selected, onSelect,
}: {
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  return (
    <>
      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Type de repas (optionnel)</Text>
      <View style={styles.chipsWrap}>
        {MEAL_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, selected === t && styles.chipActive]}
            onPress={() => onSelect(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selected === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ── Generating Phase ──────────────────────────────────────────

function GeneratingPhase({
  stepText, onCancel, insets,
}: {
  stepText: string;
  onCancel: () => void;
  insets: { bottom: number };
}) {
  return (
    <View style={[styles.generatingWrap, { paddingBottom: insets.bottom + 40 }]}>
      <Text style={styles.generatingEmoji}>✨</Text>
      <ActivityIndicator color={Colors.ink} size="large" style={{ marginTop: 24 }} />
      <Text style={styles.generatingTitle}>Composition des recettes…</Text>
      <Text style={styles.generatingStep}>{stepText}</Text>
      <TouchableOpacity style={styles.cancelLink} onPress={onCancel} activeOpacity={0.7}>
        <Text style={styles.cancelLinkText}>Annulation…</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Results Phase ─────────────────────────────────────────────

function ResultsPhase({
  recipes, error, onOpenDetail, onNewSearch, onVariant, insets,
}: {
  recipes: SmartRecipe[];
  error: string | null;
  onOpenDetail: (r: SmartRecipe) => void;
  onNewSearch: () => void;
  onVariant: (chip: string) => void;
  insets: { bottom: number };
}) {
  if (error) {
    return (
      <View style={[styles.errorWrap, { paddingBottom: insets.bottom + 40 }]}>
        <Icon name="alert-circle" size={24} color={Colors.warn} />
        <Text style={styles.errorTitle}>Génération échouée</Text>
        <Text style={styles.errorDesc}>{error}</Text>
        <TouchableOpacity style={styles.newSearchBtn} onPress={onNewSearch} activeOpacity={0.8}>
          <Text style={styles.newSearchBtnText}>Nouvelle recherche</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{recipes.length} recette{recipes.length > 1 ? 's' : ''} générée{recipes.length > 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.newSearchBtn} onPress={onNewSearch} activeOpacity={0.8}>
          <Text style={styles.newSearchBtnText}>Nouvelle recherche</Text>
        </TouchableOpacity>
      </View>

      {recipes.map((recipe, idx) => (
        <RecipeCard key={idx} recipe={recipe} onOpen={() => onOpenDetail(recipe)} />
      ))}

      {/* Quick variant row */}
      {recipes.length > 0 && (
        <View style={styles.variantRow}>
          <Text style={styles.variantRowLabel}>Variante de la 1re recette :</Text>
          <View style={styles.chipsWrap}>
            {RESULT_VARIANT_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.chip}
                onPress={() => onVariant(chip)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Recipe card ───────────────────────────────────────────────

function RecipeCard({ recipe, onOpen }: { recipe: SmartRecipe; onOpen: () => void }) {
  const accentColor = digestionAccentColor(recipe.digestionProfile);
  return (
    <View style={styles.recipeCard}>
      <View style={[styles.recipeAccent, { backgroundColor: accentColor }]} />
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeCardHeader}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.recipeStats}>
              {recipe.per_serving.kcal} kcal · P{recipe.per_serving.protein}g · ⏱ {recipe.prepTime + recipe.cookTime} min
            </Text>
          </View>
          <TouchableOpacity style={styles.seeBtn} onPress={onOpen} activeOpacity={0.75}>
            <Text style={styles.seeBtnText}>Voir</Text>
            <Icon name="arrow-right" size={12} color={Colors.paper2} />
          </TouchableOpacity>
        </View>

        <View style={styles.recipeBadgesRow}>
          <View style={[styles.badge, { backgroundColor: loadColor(recipe.fodmapLoad) + '20', borderColor: loadColor(recipe.fodmapLoad) + '40' }]}>
            <Text style={[styles.badgeText, { color: loadColor(recipe.fodmapLoad) }]}>
              FODMAP {loadLabel(recipe.fodmapLoad)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {recipe.digestionProfile === 'light' ? 'Digestion légère' : recipe.digestionProfile === 'heavy' ? 'Digestion lourde' : 'Digestion modérée'}
            </Text>
          </View>
        </View>

        <Text style={styles.recipeWhy} numberOfLines={2}>{recipe.whyGoodForProfile}</Text>
      </View>
    </View>
  );
}

// ── Detail Phase ──────────────────────────────────────────────

function DetailPhase({
  recipe, variantLoading, variantStep, onVariant, onSave, insets,
}: {
  recipe: SmartRecipe;
  variantLoading: boolean;
  variantStep: string;
  onVariant: (chip: string) => void;
  onSave: () => void;
  insets: { bottom: number };
}) {
  const fodmapColor = loadColor(recipe.fodmapLoad);
  const glycColor = loadColor(recipe.glycemicLoad);
  const digColor = digestionAccentColor(recipe.digestionProfile);
  const satColor = recipe.satiety === 'high' ? Colors.ok : recipe.satiety === 'low' ? Colors.warn : Colors.signal;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.detailHeader}>
        <Text style={styles.detailEmoji}>{recipe.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailName}>{recipe.name}</Text>
          <Text style={styles.detailDesc}>{recipe.description}</Text>
        </View>
      </View>

      {/* Analysis card */}
      <View style={styles.analysisCard}>
        <Text style={styles.analysisCardTitle}>Analyse Nutritor</Text>

        <View style={styles.indicatorGrid}>
          <IndicatorCell label="FODMAP" value={loadLabel(recipe.fodmapLoad)} color={fodmapColor} />
          <IndicatorCell label="Glycémie" value={loadLabel(recipe.glycemicLoad)} color={glycColor} />
          <IndicatorCell
            label="Digestion"
            value={recipe.digestionProfile === 'light' ? 'Légère' : recipe.digestionProfile === 'heavy' ? 'Lourde' : 'Modérée'}
            color={digColor}
          />
          <IndicatorCell
            label="Satiété"
            value={recipe.satiety === 'high' ? 'Élevée' : recipe.satiety === 'low' ? 'Faible' : 'Modérée'}
            color={satColor}
          />
        </View>

        <Text style={styles.timelineText}>{recipe.physiologicalTimeline}</Text>
        <Text style={styles.energyText}>{recipe.energyProfile}</Text>
      </View>

      {/* Warnings */}
      {recipe.warnings.length > 0 && (
        <View style={styles.warningsCard}>
          {recipe.warnings.map((w, i) => (
            <View key={i} style={styles.warningRow}>
              <Icon name="alert-triangle" size={14} color={Colors.signal} />
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Macros row */}
      <View style={styles.macrosRow}>
        <MacroBox label="Kcal" value={String(recipe.per_serving.kcal)} color={Colors.ink} />
        <MacroBox label="Prot." value={`${recipe.per_serving.protein}g`} color={Colors.ok} />
        <MacroBox label="Gluc." value={`${recipe.per_serving.carbs}g`} color={Colors.signal} />
        <MacroBox label="Lip." value={`${recipe.per_serving.fat}g`} color={Colors.muted} />
        <MacroBox label="Fibres" value={`${recipe.per_serving.fiber}g`} color={Colors.ink2} />
      </View>

      {/* Ingredients */}
      <Text style={styles.sectionTitle}>
        Ingrédients{' '}
        <Text style={styles.sectionTitleMeta}>{recipe.servings} pers.</Text>
      </Text>
      <View style={styles.ingredientsList}>
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.ingredientDot} />
            <View style={{ flex: 1 }}>
              <View style={styles.ingredientNameRow}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{ing.amount}</Text>
              </View>
              {ing.note && <Text style={styles.ingredientNote}>{ing.note}</Text>}
              {ing.substitution && (
                <Text style={styles.ingredientSub}>↔ {ing.substitution}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Steps */}
      <Text style={styles.sectionTitle}>Préparation</Text>
      <View style={styles.stepsList}>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Why good */}
      <View style={styles.whyCard}>
        <Text style={styles.whyLabel}>Pourquoi adapté à votre profil</Text>
        <Text style={styles.whyText}>{recipe.whyGoodForProfile}</Text>
      </View>

      {/* Variants */}
      <Text style={styles.sectionTitle}>Générer une variante</Text>
      {variantLoading ? (
        <View style={styles.variantLoadingRow}>
          <ActivityIndicator color={Colors.ink} size="small" />
          <Text style={styles.variantLoadingText}>{variantStep || 'Génération…'}</Text>
        </View>
      ) : (
        <View style={styles.chipsWrap}>
          {DETAIL_VARIANT_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => onVariant(chip)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.85}>
        <Icon name="bookmark" size={16} color={Colors.paper2} />
        <Text style={styles.saveBtnText}>Sauvegarder ce plat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Small sub-components ──────────────────────────────────────

function IndicatorCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.indicatorCell}>
      <View style={[styles.indicatorDot, { backgroundColor: color }]} />
      <Text style={styles.indicatorLabel}>{label}</Text>
      <Text style={[styles.indicatorValue, { color }]}>{value}</Text>
    </View>
  );
}

function MacroBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroBoxValue, { color }]}>{value}</Text>
      <Text style={styles.macroBoxLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

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

  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 10,
    marginTop: 20,
  },

  // Mode grid
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  modeCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  modeCardActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  modeEmoji: { fontSize: 22 },
  modeTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ink,
    lineHeight: 17,
  },
  modeTextActive: { color: Colors.paper2 },
  modeSub: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
  modeSubActive: { color: Colors.muted2 },

  modeSection: { marginTop: 4 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },

  // Dropdown
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  dropdownItemText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: Colors.card,
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  chipTextActive: { color: Colors.paper2 },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.ok,
  },
  chipSelectedText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.paper2,
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 4,
  },
  profileCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileCardName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  profileCardGoal: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  profileCardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  profileBadge: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: Colors.paper2,
  },
  profileBadgeWarn: {
    borderColor: Colors.warn + '40',
    backgroundColor: Colors.warn + '10',
  },
  profileBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  profileKcal: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.3,
  },

  // Variant plate list
  variantPlateList: { maxHeight: 240 },
  variantPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: 8,
  },
  variantPlateRowActive: {
    borderColor: Colors.ok,
    backgroundColor: Colors.ok + '12',
  },
  variantPlateInfo: { flex: 1 },
  variantPlateName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },
  variantPlateMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  emptyVariant: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyVariantText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
  },

  // Generate button
  generateBtn: {
    marginTop: 28,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnDisabled: { opacity: 0.35 },
  generateBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.paper2,
    letterSpacing: -0.1,
  },

  // Generating phase
  generatingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  generatingEmoji: { fontSize: 48 },
  generatingTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  generatingStep: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.muted,
    textAlign: 'center',
  },
  cancelLink: { marginTop: 16, padding: 8 },
  cancelLinkText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },

  // Results header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  resultsTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  newSearchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  newSearchBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
  },

  // Recipe card
  recipeCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 18,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  recipeAccent: { width: 4 },
  recipeCardContent: { flex: 1, padding: 14, gap: 8 },
  recipeCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recipeEmoji: { fontSize: 36, lineHeight: 42 },
  recipeName: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 21,
    flex: 1,
  },
  recipeStats: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
    marginTop: 3,
  },
  seeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 100,
    backgroundColor: Colors.ink,
    flexShrink: 0,
  },
  seeBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.paper2,
  },
  recipeBadgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  recipeWhy: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },

  // Variant row (results)
  variantRow: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 14,
    backgroundColor: Colors.card,
    gap: 10,
  },
  variantRowLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  // Error
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
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

  // Detail
  detailHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  detailEmoji: { fontSize: 48, lineHeight: 56 },
  detailName: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.4,
    lineHeight: 26,
    marginTop: 4,
  },
  detailDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
    marginTop: 4,
  },

  // Analysis card
  analysisCard: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 18,
    backgroundColor: Colors.card,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  analysisCardTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  indicatorCell: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 10,
    backgroundColor: Colors.paper2,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  indicatorLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    flex: 1,
  },
  indicatorValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    flexShrink: 0,
  },
  timelineText: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.ink2,
    lineHeight: 18,
  },
  energyText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
    lineHeight: 15,
  },

  // Warnings
  warningsCard: {
    borderWidth: 1,
    borderColor: Colors.signal + '35',
    borderRadius: 14,
    backgroundColor: Colors.signal + '08',
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.signal,
    lineHeight: 18,
  },

  // Macros row
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    backgroundColor: Colors.card,
    gap: 2,
  },
  macroBoxValue: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  macroBoxLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },

  // Section title (detail)
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitleMeta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.muted,
  },

  // Ingredients
  ingredientsList: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  ingredientDot: {
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: Colors.ink,
    marginTop: 7,
    flexShrink: 0,
  },
  ingredientNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ingredientName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    flex: 1,
  },
  ingredientAmount: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.3,
    flexShrink: 0,
    marginLeft: 8,
  },
  ingredientNote: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  ingredientSub: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.signal,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Steps
  stepsList: { gap: 10 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.paper2,
  },
  stepText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 21,
  },

  // Why card
  whyCard: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 14,
    backgroundColor: Colors.card,
    gap: 6,
  },
  whyLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  whyText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    lineHeight: 19,
  },

  // Variant loading
  variantLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  variantLoadingText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.muted,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingVertical: 16,
    backgroundColor: Colors.ink,
    borderRadius: 14,
  },
  saveBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.paper2,
  },
});
