/**
 * MealGeneratorScreen — stack 'mealGenerator'
 * Générateur de repas IA (OpenRouter / Ollama) tenant compte du profil complet :
 * allergènes, régimes actifs, phase FODMAP, objectifs caloriques et macros.
 * Résultats expandables : macros, ingrédients, micronutriments, score anti-inflammatoire.
 */
import React, { useMemo, useState } from 'react';
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
import { Food } from '../types';

// ── Suggestion categories ─────────────────────────────────────

type ExType = 'direct' | 'food-select' | 'profile';

interface SuggestionEx {
  id: string;
  text: string;
  type: ExType;
  template?: string;
  buildQuery?: (profile: UserProfile, fodmap: FodmapProtocol) => string;
}

interface SuggestionCat {
  id: string;
  emoji: string;
  label: string;
  examples: SuggestionEx[];
}

const SENS_LABELS: Record<string, string> = {
  fructans: 'Fructanes', polyols: 'Polyols', lactose: 'Lactose',
  histamine: 'Histamine', gluten: 'Gluten', caffeine: 'Caféine',
  sweeteners: 'Édulcorants', fattyFoods: 'Aliments gras',
};
const PHASE_FR: Record<string, string> = {
  elimination: 'élimination', reintroduction: 'réintroduction', stabilization: 'stabilisation',
};
const PATHO_LABELS: Record<string, string> = {
  ibs: 'SII', reflux: 'Reflux gastrique', crohn: 'Maladie de Crohn',
  uc: 'RCH', foodMigraine: 'Migraine alimentaire',
};

function buildProfileSummary(profile: UserProfile, fodmap: FodmapProtocol): string {
  const parts: string[] = [];
  const severe = profile.allergens.filter((a) => a.level === 'sévère').map((a) => a.name);
  const moderate = profile.allergens.filter((a) => a.level === 'modéré').map((a) => a.name);
  const diets = profile.diets.filter((d) => d.on).map((d) => d.label);
  const activeSens = (profile.digestiveSensitivities ?? [])
    .filter((s) => s.level && s.level !== 'none')
    .map((s) => SENS_LABELS[s.id] ?? s.id);
  const pathos = (profile.pathologies ?? []).map((p) => PATHO_LABELS[p] ?? p);
  if (severe.length)   parts.push(`Allergies sévères : ${severe.join(', ')}`);
  if (moderate.length) parts.push(`Intolérances : ${moderate.join(', ')}`);
  if (diets.length)    parts.push(`Régimes : ${diets.join(', ')}`);
  if (activeSens.length) parts.push(`Sensibilités : ${activeSens.join(', ')}`);
  if (pathos.length)   parts.push(`Pathologies : ${pathos.join(', ')}`);
  if (fodmap.active)   parts.push(`Phase FODMAP : ${PHASE_FR[fodmap.phase] ?? fodmap.phase}`);
  return parts.join('. ');
}

const SUGGESTION_CATEGORIES: SuggestionCat[] = [
  {
    id: 'basics', emoji: '🥗', label: 'Basiques',
    examples: [
      { id: 'b1', type: 'food-select', text: 'Crée un repas avec mes ingrédients…', template: 'Crée un repas équilibré et savoureux avec les ingrédients suivants : {foods}.' },
      { id: 'b2', type: 'direct', text: 'Que puis-je cuisiner avec des œufs et des épinards ?' },
      { id: 'b3', type: 'food-select', text: 'Dîner rapide avec ce que j\'ai dans le frigo…', template: 'Propose un dîner rapide et digeste avec les ingrédients suivants : {foods}.' },
    ],
  },
  {
    id: 'energy', emoji: '⚡', label: 'Énergie',
    examples: [
      { id: 'e1', type: 'direct', text: 'Génère un déjeuner pour éviter le coup de fatigue de l\'après-midi.' },
      { id: 'e2', type: 'direct', text: 'Je veux un petit-déjeuner avec une énergie stable toute la matinée.' },
      { id: 'e3', type: 'direct', text: 'Prépare un repas énergétique avant une séance de sport.' },
    ],
  },
  {
    id: 'digestion', emoji: '🫃', label: 'Digestion',
    examples: [
      { id: 'd1', type: 'direct', text: 'Crée un repas facile à digérer pour ce soir.' },
      { id: 'd2', type: 'direct', text: 'Je veux un repas faible en FODMAP.' },
      { id: 'd3', type: 'direct', text: 'Propose une recette sans aliments fermentescibles.' },
      { id: 'd4', type: 'direct', text: 'Génère un repas qui limite les ballonnements.' },
    ],
  },
  {
    id: 'moment', emoji: '🌙', label: 'Selon le moment',
    examples: [
      { id: 'm1', type: 'direct', text: 'Crée un dîner léger pour favoriser un meilleur sommeil.' },
      { id: 'm2', type: 'direct', text: 'Je veux un déjeuner rassasiant mais pas lourd.' },
      { id: 'm3', type: 'direct', text: 'Propose un snack digestif pour la fin d\'après-midi.' },
    ],
  },
  {
    id: 'personal', emoji: '🧬', label: 'Personnalisés',
    examples: [
      {
        id: 'p1', type: 'profile', text: 'Adapté à mon profil digestif complet',
        buildQuery: (p, f) => { const ctx = buildProfileSummary(p, f); return `Crée un repas adapté à mon profil digestif complet.${ctx ? ' ' + ctx + '.' : ''}`; },
      },
      {
        id: 'p2', type: 'profile', text: 'Compatible avec ma sensibilité au lactose',
        buildQuery: (p) => {
          const entry = p.allergens.find((a) => a.name.toLowerCase().includes('lactose'));
          const sens = p.digestiveSensitivities?.find((s) => s.id === 'lactose');
          const has = entry || (sens && sens.level !== 'none');
          return has
            ? `Propose une recette sans lactose adaptée à une intolérance de niveau ${entry?.level ?? 'modéré'}.`
            : 'Propose une recette légère en lactose et digeste.';
        },
      },
      {
        id: 'p3', type: 'profile', text: 'Compatible avec mes sensibilités FODMAP',
        buildQuery: (p, f) => {
          const phase = f.active ? (PHASE_FR[f.phase] ?? f.phase) : 'non définie';
          const activeSens = (p.digestiveSensitivities ?? []).filter((s) => s.level && s.level !== 'none').map((s) => SENS_LABELS[s.id] ?? s.id);
          const ctx = activeSens.length ? ` Sensibilités actives : ${activeSens.join(', ')}.` : '';
          return `Propose un repas compatible avec mes sensibilités FODMAP (phase : ${phase}).${ctx}`;
        },
      },
    ],
  },
  {
    id: 'compensation', emoji: '🍔', label: 'Compensation',
    examples: [
      { id: 'c1', type: 'direct', text: 'J\'ai beaucoup mangé ce midi, propose un dîner léger et digeste.' },
      { id: 'c2', type: 'direct', text: 'Après une journée riche en sucre, que devrais-je manger ce soir ?' },
    ],
  },
  {
    id: 'physio', emoji: '🧠', label: 'Physiologiques',
    examples: [
      { id: 'ph1', type: 'direct', text: 'Crée un repas à digestion lente et énergie stable.' },
      { id: 'ph2', type: 'direct', text: 'Je veux un repas qui minimise les pics glycémiques.' },
      { id: 'ph3', type: 'direct', text: 'Propose une recette anti-inflammatoire.' },
      { id: 'ph4', type: 'direct', text: 'Génère un repas riche en fibres mais facile à tolérer.' },
    ],
  },
  {
    id: 'world', emoji: '🥘', label: 'Cuisine du monde',
    examples: [
      { id: 'w1', type: 'direct', text: 'Crée un curry faible en FODMAP.' },
      { id: 'w2', type: 'direct', text: 'Je veux un bowl asiatique riche en protéines.' },
      { id: 'w3', type: 'direct', text: 'Propose une recette méditerranéenne légère et anti-inflammatoire.' },
    ],
  },
  {
    id: 'constraints', emoji: '⏱️', label: 'Contraintes',
    examples: [
      { id: 'co1', type: 'direct', text: 'Crée un repas en moins de 15 minutes.' },
      { id: 'co2', type: 'direct', text: 'Je veux une recette avec seulement 5 ingrédients.' },
      { id: 'co3', type: 'direct', text: 'Propose un repas économique et digeste.' },
    ],
  },
  {
    id: 'shopping', emoji: '🛒', label: 'Courses',
    examples: [
      { id: 's1', type: 'food-select', text: 'Cuisiner avec les produits scannés…', template: 'Que puis-je cuisiner avec ces produits : {foods} ?' },
      {
        id: 's2', type: 'profile', text: 'Repas compatible avec mon profil',
        buildQuery: (p, f) => { const ctx = buildProfileSummary(p, f); return `Génère un repas avec des aliments compatibles avec mon profil.${ctx ? ' ' + ctx + '.' : ''}`; },
      },
      { id: 's3', type: 'food-select', text: 'Utiliser les aliments bientôt périmés…', template: 'Crée un repas digeste avec les aliments suivants à utiliser rapidement : {foods}.' },
    ],
  },
  {
    id: 'ai', emoji: '🤖', label: 'Assistant IA',
    examples: [
      {
        id: 'ai1', type: 'profile', text: 'Repas le mieux toléré pour moi ce soir',
        buildQuery: (p, f) => { const ctx = buildProfileSummary(p, f); return `Quel repas semble le mieux toléré pour moi ce soir ?${ctx ? ' Mon profil : ' + ctx + '.' : ''}`; },
      },
      {
        id: 'ai2', type: 'profile', text: 'Basé sur mes bonnes tolérances',
        buildQuery: (p, f) => { const ctx = buildProfileSummary(p, f); return `Propose un repas basé sur mes bonnes tolérances alimentaires.${ctx ? ' Mon profil : ' + ctx + '.' : ''}`; },
      },
      {
        id: 'ai3', type: 'profile', text: 'Éviter les ingrédients de mes symptômes',
        buildQuery: (p, f) => { const ctx = buildProfileSummary(p, f); return `Propose un repas en évitant les ingrédients associés à mes symptômes digestifs.${ctx ? ' ' + ctx + '.' : ''}`; },
      },
    ],
  },
  {
    id: 'goals', emoji: '📊', label: 'Objectifs',
    examples: [
      { id: 'g1', type: 'direct', text: 'Crée un repas riche en protéines.' },
      { id: 'g2', type: 'direct', text: 'Je veux un repas rassasiant avec peu de sucres rapides.' },
      { id: 'g3', type: 'direct', text: 'Propose un repas pour la récupération sportive.' },
    ],
  },
  {
    id: 'future', emoji: '🔥', label: 'Futuristes',
    examples: [
      { id: 'f1', type: 'direct', text: 'Génère un repas qui produira une énergie stable pendant 4 heures.' },
      { id: 'f2', type: 'direct', text: 'Je veux minimiser les risques de fermentation cet après-midi.' },
      { id: 'f3', type: 'direct', text: 'Crée un dîner optimisé pour favoriser la digestion et le sommeil.' },
    ],
  },
];

// ── Food picker modal ─────────────────────────────────────────

const pickerSt = StyleSheet.create({
  overlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  backdrop:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.paper2, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '78%' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.hairline, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  title:      { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3, paddingHorizontal: 20, paddingBottom: 10 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card },
  searchInput:{ flex: 1, fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink, paddingVertical: 0 },
  list:       { maxHeight: 300 },
  empty:      { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, textAlign: 'center', padding: 24 },
  foodRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.hairline2, gap: 14 },
  checkbox:   { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: Colors.hairline, backgroundColor: Colors.paper2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  foodInfo:   { flex: 1 },
  foodName:   { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },
  foodBrand:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.2, marginTop: 1 },
  confirmBtn: { margin: 16, backgroundColor: Colors.ink, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmOff: { opacity: 0.35 },
  confirmTxt: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2 },
});

function FoodPickerModal({
  foodList, onConfirm, onClose, bottomInset,
}: {
  foodList: Food[];
  onConfirm: (foods: Food[]) => void;
  onClose: () => void;
  bottomInset: number;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return foodList.slice(0, 60);
    const q = search.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return foodList.filter((f) => {
      const n = f.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const b = (f.brand ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return n.includes(q) || b.includes(q);
    }).slice(0, 60);
  }, [search, foodList]);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  const handleConfirm = () => {
    onConfirm(foodList.filter((f) => selected.has(f.id)));
    setSelected(new Set()); setSearch('');
  };

  return (
    <View style={pickerSt.overlay}>
      <TouchableOpacity style={pickerSt.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[pickerSt.sheet, { paddingBottom: bottomInset + 8 }]}>
        <View style={pickerSt.handle} />
        <Text style={pickerSt.title}>Sélectionner des aliments</Text>
        <View style={pickerSt.searchRow}>
          <Icon name="search" size={15} color={Colors.muted} />
          <TextInput
            style={pickerSt.searchInput}
            placeholder="Rechercher dans ma bibliothèque…"
            placeholderTextColor={Colors.muted2}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Icon name="close" size={14} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={pickerSt.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {filtered.length === 0
            ? <Text style={pickerSt.empty}>Aucun aliment trouvé dans ta bibliothèque</Text>
            : filtered.map((food) => (
              <TouchableOpacity key={food.id} style={pickerSt.foodRow} onPress={() => toggle(food.id)} activeOpacity={0.7}>
                <View style={[pickerSt.checkbox, selected.has(food.id) && pickerSt.checkboxOn]}>
                  {selected.has(food.id) && <Icon name="check" size={11} color={Colors.paper2} />}
                </View>
                <View style={pickerSt.foodInfo}>
                  <Text style={pickerSt.foodName} numberOfLines={1}>{food.name}</Text>
                  {food.brand ? <Text style={pickerSt.foodBrand} numberOfLines={1}>{food.brand}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
        <TouchableOpacity
          style={[pickerSt.confirmBtn, selected.size === 0 && pickerSt.confirmOff]}
          onPress={handleConfirm}
          disabled={selected.size === 0}
          activeOpacity={0.8}
        >
          <Text style={pickerSt.confirmTxt}>
            {selected.size > 0 ? `Utiliser ${selected.size} aliment${selected.size > 1 ? 's' : ''}` : 'Sélectionner des aliments'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Suggestion categories section ─────────────────────────────

function SuggestionCategoriesSection({
  profile, fodmapProtocol, onSelectExample, onSelectFoodExample, disabled,
}: {
  profile: UserProfile;
  fodmapProtocol: FodmapProtocol;
  onSelectExample: (query: string) => void;
  onSelectFoodExample: (template: string) => void;
  disabled: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = SUGGESTION_CATEGORIES.find((c) => c.id === activeId);

  const handleExTap = (ex: SuggestionEx) => {
    if (disabled) return;
    if (ex.type === 'food-select') {
      onSelectFoodExample(ex.template ?? '');
    } else if (ex.type === 'profile') {
      onSelectExample(ex.buildQuery?.(profile, fodmapProtocol) ?? ex.text);
    } else {
      onSelectExample(ex.text);
    }
  };

  return (
    <View style={styles.catSection}>
      <Text style={styles.catLabel}>Exemples de requêtes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
        {SUGGESTION_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, activeId === cat.id && styles.catChipActive]}
            onPress={() => setActiveId(activeId === cat.id ? null : cat.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catChipLabel, activeId === cat.id && styles.catChipLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {active && (
        <View style={styles.examplesCard}>
          {active.examples.map((ex, i) => (
            <TouchableOpacity
              key={ex.id}
              style={[styles.exRow, i === active.examples.length - 1 && styles.exRowLast]}
              onPress={() => handleExTap(ex)}
              activeOpacity={0.75}
              disabled={disabled}
            >
              <View style={styles.exRowLeft}>
                {ex.type === 'food-select' && <View style={styles.exBadge}><Text style={styles.exBadgeText}>🥬</Text></View>}
                {ex.type === 'profile' && <View style={[styles.exBadge, styles.exBadgeProfile]}><Text style={styles.exBadgeText}>👤</Text></View>}
                <Text style={[styles.exText, disabled && styles.exTextMuted]}>{ex.text}</Text>
              </View>
              <Icon name="arrow-right" size={14} color={Colors.muted2} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
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

function MealCard({
  meal, onSave, saved,
}: {
  meal: GeneratedMeal;
  onSave?: (meal: GeneratedMeal) => void;
  saved?: boolean;
}) {
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
              style={[styles.saveBtn, saved && styles.saveBtnSaved]}
              onPress={() => !saved && onSave(meal)}
              activeOpacity={saved ? 1 : 0.8}
            >
              <Icon name={saved ? 'check' : 'bookmark'} size={14} color={saved ? Colors.ok : Colors.paper2} />
              <Text style={[styles.saveBtnText, saved && styles.saveBtnTextSaved]}>
                {saved ? 'Sauvegardé' : 'Sauvegarder ce repas'}
              </Text>
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
  foodList: Food[];
  externalResult?: MealGeneratorResult | null;
  onGenerateInBackground?: (query: string) => void;
  onSaveMeal?: (meal: GeneratedMeal) => void;
  onClearResult?: () => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onStartDemo?: () => void;
}

export function MealGeneratorScreen({
  profile,
  fodmapProtocol,
  settings,
  foodList,
  externalResult,
  onGenerateInBackground,
  onSaveMeal,
  onClearResult,
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
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [pickerTemplate, setPickerTemplate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const aiReady = isAIReady(settings);

  // Show externally generated result when it arrives
  const displayResult = externalResult ?? result;

  const handleSaveMeal = (meal: GeneratedMeal, index: number) => {
    onSaveMeal?.(meal);
    setSavedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      if (displayResult && next.size >= displayResult.meals.length) {
        setTimeout(() => {
          setResult(null);
          setSavedIndices(new Set());
          onClearResult?.();
        }, 900);
      }
      return next;
    });
  };

  const handleGenerate = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setError(null);
    setResult(null);
    setSentToBackground(false);
    setSavedIndices(new Set());

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

  const handleFoodExample = (template: string) => {
    setPickerTemplate(template);
    setPickerVisible(true);
  };

  const handlePickerConfirm = (foods: Food[]) => {
    setPickerVisible(false);
    if (foods.length === 0) return;
    const names = foods.map((f) => f.name).join(', ');
    handleGenerate(pickerTemplate.replace('{foods}', names));
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

        {/* Suggestion categories */}
        {!displayResult && !loading && (
          <SuggestionCategoriesSection
            profile={profile}
            fodmapProtocol={fodmapProtocol}
            onSelectExample={(q) => handleGenerate(q)}
            onSelectFoodExample={handleFoodExample}
            disabled={loading || !aiReady}
          />
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
              <MealCard
                key={i}
                meal={meal}
                saved={savedIndices.has(i)}
                onSave={(m) => handleSaveMeal(m, i)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {pickerVisible && (
        <FoodPickerModal
          foodList={foodList}
          onConfirm={handlePickerConfirm}
          onClose={() => setPickerVisible(false)}
          bottomInset={insets.bottom}
        />
      )}
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

  // Suggestion categories
  catSection:          { marginTop: 24 },
  catLabel:            { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted, marginBottom: 12 },
  catScrollContent:    { paddingRight: 8, gap: 8 },
  catChip:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card, flexShrink: 0 },
  catChipActive:       { backgroundColor: Colors.ink, borderColor: Colors.ink },
  catEmoji:            { fontSize: 14 },
  catChipLabel:        { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.ink2 },
  catChipLabelActive:  { color: Colors.paper2 },
  examplesCard:        { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: Colors.hairline2, backgroundColor: Colors.card, overflow: 'hidden' },
  exRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.hairline2, gap: 10 },
  exRowLast:           { borderBottomWidth: 0 },
  exRowLeft:           { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  exBadge:             { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(63,90,58,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exBadgeProfile:      { backgroundColor: 'rgba(107,90,46,0.12)' },
  exBadgeText:         { fontSize: 11 },
  exText:              { flex: 1, fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.ink2, lineHeight: 19 },
  exTextMuted:         { color: Colors.muted2 },

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
  saveBtnSaved: {
    backgroundColor: 'rgba(63,90,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.3)',
  },
  saveBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.paper2,
  },
  saveBtnTextSaved: {
    color: Colors.ok,
  },
});
