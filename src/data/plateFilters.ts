import { SavedPlate, PlateCategory } from './saved';

// ── Types ──────────────────────────────────────────────────────

export type SortBy =
  | 'name'
  | 'kcal_asc'
  | 'kcal_desc'
  | 'protein_desc'
  | 'time_asc'
  | 'recent';

export type MetabolicKey = 'glycemicImpact' | 'satiety' | 'inflammation' | 'digestive' | 'recovery';
export type MetabolicLevel = 'favorable' | 'moderate' | 'high' | 'low' | 'light' | 'heavy';

export interface PlateFilterState {
  sortBy: SortBy;

  // ── Temps ─────────────────────────────────────
  maxTimeMin: number | null;

  // ── Macros (totaux du plat) ───────────────────
  minProtein: number | null;
  maxCarbs: number | null;
  maxFat: number | null;
  minKcal: number | null;
  maxKcal: number | null;

  // ── Étiquettes & allergènes ───────────────────
  requireTags: string[];
  excludeAllergens: string[];

  // ── Nutrition avancée (filtre si données disponibles) ──
  requireMinerals: string[];
  requireVitamins: string[];
  requireTrace: string[];
  requireBioactives: string[];
  metabolic: Partial<Record<MetabolicKey, MetabolicLevel[]>>;

  // ── Catégories ────────────────────────────────────
  categories: PlateCategory[];

  // ── Pairing ───────────────────────────────────
  pairedWithId: string | null;
}

export const DEFAULT_FILTER: PlateFilterState = {
  sortBy: 'name',
  maxTimeMin: null,
  minProtein: null,
  maxCarbs: null,
  maxFat: null,
  minKcal: null,
  maxKcal: null,
  requireTags: [],
  excludeAllergens: [],
  requireMinerals: [],
  requireVitamins: [],
  requireTrace: [],
  requireBioactives: [],
  metabolic: {},
  categories: [],
  pairedWithId: null,
};

// ── Reference data ─────────────────────────────────────────────

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'name',         label: 'Nom (A → Z)' },
  { value: 'protein_desc', label: '+ protéines en premier' },
  { value: 'kcal_asc',    label: 'Calories ↑' },
  { value: 'kcal_desc',   label: 'Calories ↓' },
  { value: 'time_asc',    label: 'Temps ↑' },
  { value: 'recent',      label: 'Plus récents' },
];

export const TIME_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Tous',  value: null },
  { label: '≤ 5 min',  value: 5 },
  { label: '≤ 15 min', value: 15 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 1 h',   value: 60 },
];

export const ALL_PLATE_TAGS = [
  'Sans gluten',
  'Vegan',
  'Végétarien',
  'Sans lactose',
  'Low FODMAP',
  'Riche en protéines',
  'Sans sucre',
];

export const ALLERGEN_OPTIONS = [
  { name: 'Gluten',          safeTag: 'Sans gluten' },
  { name: 'Lactose',         safeTag: 'Sans lactose' },
  { name: 'Œufs',            safeTag: null },
  { name: 'Arachides',       safeTag: null },
  { name: 'Fruits à coque',  safeTag: null },
  { name: 'Soja',            safeTag: null },
  { name: 'Poisson',         safeTag: null },
  { name: 'Crustacés',       safeTag: null },
  { name: 'Sésame',          safeTag: null },
];

export const MINERAL_OPTIONS = [
  'Calcium', 'Magnésium', 'Phosphore', 'Potassium', 'Fer', 'Zinc',
];

export const VITAMIN_OPTIONS = [
  'Vitamine C', 'Vitamine D', 'Vitamine E',
  'Vitamine B1', 'Vitamine B2', 'Vitamine B3',
  'Vitamine B6', 'Vitamine B9 (Folates)', 'Vitamine B12',
];

export const TRACE_OPTIONS = [
  'Fer', 'Zinc', 'Sélénium', 'Cuivre', 'Manganèse', 'Iode',
];

export const BIOACTIVE_OPTIONS = [
  'Polyphénols', 'Flavonoïdes', 'Caroténoïdes', 'Lycopène',
  'Oméga-3', 'Probiotiques', 'Prébiotiques', 'Glutathion', 'Resvératrol',
  'Sulforaphane', 'Quercétine',
];

export const METABOLIC_CATEGORIES: {
  key: MetabolicKey;
  label: string;
  levels: { value: MetabolicLevel; label: string }[];
}[] = [
  {
    key: 'glycemicImpact',
    label: 'Impact glycémique',
    levels: [
      { value: 'favorable', label: 'Favorable' },
      { value: 'moderate',  label: 'Modéré' },
      { value: 'high',      label: 'Élevé' },
    ],
  },
  {
    key: 'satiety',
    label: 'Satiété',
    levels: [
      { value: 'favorable', label: 'Élevée' },
      { value: 'moderate',  label: 'Modérée' },
      { value: 'low',       label: 'Faible' },
    ],
  },
  {
    key: 'inflammation',
    label: 'Inflammation',
    levels: [
      { value: 'favorable', label: 'Anti-inflammatoire' },
      { value: 'moderate',  label: 'Neutre' },
      { value: 'high',      label: 'Pro-inflammatoire' },
    ],
  },
  {
    key: 'digestive',
    label: 'Charge digestive',
    levels: [
      { value: 'light',    label: 'Légère' },
      { value: 'moderate', label: 'Modérée' },
      { value: 'heavy',    label: 'Lourde' },
    ],
  },
  {
    key: 'recovery',
    label: 'Récupération',
    levels: [
      { value: 'favorable', label: 'Favorable' },
      { value: 'moderate',  label: 'Modérée' },
      { value: 'low',       label: 'Faible' },
    ],
  },
];

// ── Filter application ─────────────────────────────────────────

export function countActiveFilters(f: PlateFilterState): number {
  let n = 0;
  if (f.maxTimeMin !== null) n++;
  if (f.minProtein !== null) n++;
  if (f.maxCarbs !== null) n++;
  if (f.maxFat !== null) n++;
  if (f.minKcal !== null || f.maxKcal !== null) n++;
  n += f.requireTags.length;
  n += f.excludeAllergens.length;
  n += f.requireMinerals.length;
  n += f.requireVitamins.length;
  n += f.requireTrace.length;
  n += f.requireBioactives.length;
  n += Object.keys(f.metabolic).length;
  n += (f.categories ?? []).length;
  if (f.pairedWithId !== null) n++;
  return n;
}

export function applyPlateFilters(plates: SavedPlate[], f: PlateFilterState): SavedPlate[] {
  let result = plates.filter((p) => {
    // Temps
    if (f.maxTimeMin !== null && p.timeMin > 0 && p.timeMin > f.maxTimeMin) return false;

    // Macros
    if (f.minProtein !== null && p.macros.protein < f.minProtein) return false;
    if (f.maxCarbs !== null && p.macros.carbs > f.maxCarbs) return false;
    if (f.maxFat !== null && p.macros.fat > f.maxFat) return false;
    if (f.minKcal !== null && p.kcal < f.minKcal) return false;
    if (f.maxKcal !== null && p.kcal > f.maxKcal) return false;

    // Catégories (le plat doit appartenir à l'une des catégories sélectionnées)
    if ((f.categories ?? []).length > 0 && !f.categories.includes(p.category as PlateCategory)) return false;

    // Tags requis (le plat doit avoir TOUS)
    if (f.requireTags.some((t) => !p.tags.includes(t))) return false;

    // Allergènes à exclure : si le tag "Sans X" existe et que le plat ne l'a pas → exclu
    for (const allergen of f.excludeAllergens) {
      const opt = ALLERGEN_OPTIONS.find((a) => a.name === allergen);
      if (opt?.safeTag && !p.tags.includes(opt.safeTag)) return false;
      // Si pas de safeTag → on vérifie le nutrition.allergens si disponible
      if (!opt?.safeTag && p.nutrition?.allergens) {
        if (p.nutrition.allergens.includes(allergen)) return false;
      }
    }

    // Minéraux (filtre si données disponibles)
    if (f.requireMinerals.length > 0 && p.nutrition?.minerals) {
      if (f.requireMinerals.some((m) => !p.nutrition!.minerals!.includes(m))) return false;
    }

    // Vitamines
    if (f.requireVitamins.length > 0 && p.nutrition?.vitamins) {
      if (f.requireVitamins.some((v) => !p.nutrition!.vitamins!.includes(v))) return false;
    }

    // Oligo-éléments
    if (f.requireTrace.length > 0 && p.nutrition?.trace) {
      if (f.requireTrace.some((t) => !p.nutrition!.trace!.includes(t))) return false;
    }

    // Bioactifs
    if (f.requireBioactives.length > 0 && p.nutrition?.bioactives) {
      if (f.requireBioactives.some((b) => !p.nutrition!.bioactives!.includes(b))) return false;
    }

    // Effets métaboliques
    if (p.nutrition?.metabolic) {
      for (const [key, levels] of Object.entries(f.metabolic) as [MetabolicKey, MetabolicLevel[]][]) {
        const plateVal = p.nutrition.metabolic[key];
        if (plateVal && levels.length > 0 && !levels.includes(plateVal as MetabolicLevel)) return false;
      }
    }

    // Pairing
    if (f.pairedWithId !== null) {
      if (!(p.pairedWith ?? []).includes(f.pairedWithId)) return false;
    }

    return true;
  });

  // Tri
  result = [...result].sort((a, b) => {
    switch (f.sortBy) {
      case 'name':         return a.name.localeCompare(b.name, 'fr');
      case 'kcal_asc':    return a.kcal - b.kcal;
      case 'kcal_desc':   return b.kcal - a.kcal;
      case 'protein_desc': return b.macros.protein - a.macros.protein;
      case 'time_asc':    return (a.timeMin || 999) - (b.timeMin || 999);
      case 'recent':      return 0;
      default:            return 0;
    }
  });

  return result;
}
