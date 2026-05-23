// ── Catégories de plats ───────────────────────────────────────

export type PlateCategory =
  | 'salads' | 'soups' | 'pasta' | 'stews' | 'meats'
  | 'vegetarian' | 'fastfood' | 'sandwiches' | 'pizzas'
  | 'worldcuisine' | 'bowls' | 'sides' | 'dairy'
  | 'desserts' | 'fruits' | 'snacks' | 'breakfast' | 'drinks' | 'other';

export interface PlateCategoryMeta {
  id: PlateCategory;
  emoji: string;
  label: string;
}

export const PLATE_CATEGORIES: PlateCategoryMeta[] = [
  { id: 'salads',       emoji: '🥗', label: 'Salades' },
  { id: 'soups',        emoji: '🍲', label: 'Soupes & potages' },
  { id: 'pasta',        emoji: '🍝', label: 'Pâtes & féculents' },
  { id: 'stews',        emoji: '🍛', label: 'Plats mijotés' },
  { id: 'meats',        emoji: '🍗', label: 'Viandes & protéines' },
  { id: 'vegetarian',   emoji: '🌱', label: 'Végétarien / Vegan' },
  { id: 'fastfood',     emoji: '🍔', label: 'Fast-food & street food' },
  { id: 'sandwiches',   emoji: '🥪', label: 'Sandwichs & wraps' },
  { id: 'pizzas',       emoji: '🍕', label: 'Pizzas & tartes salées' },
  { id: 'worldcuisine', emoji: '🥘', label: 'Cuisine du monde' },
  { id: 'bowls',        emoji: '🍚', label: 'Bowls & repas composés' },
  { id: 'sides',        emoji: '🍟', label: 'Accompagnements' },
  { id: 'dairy',        emoji: '🧀', label: 'Produits laitiers' },
  { id: 'desserts',     emoji: '🍰', label: 'Desserts' },
  { id: 'fruits',       emoji: '🍉', label: 'Fruits & snacks légers' },
  { id: 'snacks',       emoji: '🥜', label: 'Snacks & grignotage' },
  { id: 'breakfast',    emoji: '☕', label: 'Petit-déjeuner' },
  { id: 'drinks',       emoji: '🧃', label: 'Boissons' },
  { id: 'other',        emoji: '📦', label: 'Autre' },
];

export interface SavedPlateItem {
  name: string;
  qty: string;
  kcal: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface PlateNutrition {
  minerals?: string[];
  vitamins?: string[];
  trace?: string[];
  bioactives?: string[];
  allergens?: string[];
  metabolic?: {
    glycemicImpact?: string;
    satiety?: string;
    inflammation?: string;
    digestive?: string;
    recovery?: string;
  };
}

export interface SavedPlate {
  id: string;
  name: string;
  kcal: number;
  time: string;
  timeMin: number;
  tags: string[];
  items: number;
  last: string;
  macros: { protein: number; carbs: number; fat: number };
  recipe: SavedPlateItem[];
  note?: string;
  photo?: string;
  pairedWith?: string[];
  nutrition?: PlateNutrition;
  aiComment?: string;
  category?: PlateCategory;
}

export const SAVED_PLATES: SavedPlate[] = [
  {
    id: 'sv-1', name: 'Bowl quinoa & saumon', kcal: 642, time: '15 min', timeMin: 15,
    tags: ['Sans gluten', 'Low FODMAP'], items: 6, last: 'Il y a 2 jours',
    macros: { protein: 35, carbs: 55, fat: 28 },
    recipe: [
      { name: 'Quinoa rouge bio',   qty: '80 g',  kcal: 294, macros: { protein: 11, carbs: 51, fat: 5 } },
      { name: 'Saumon fumé',        qty: '60 g',  kcal: 119, macros: { protein: 15, carbs: 0,  fat: 7 } },
      { name: 'Avocat Hass',        qty: '80 g',  kcal: 129, macros: { protein: 2,  carbs: 7,  fat: 12 } },
      { name: 'Roquette',           qty: '30 g',  kcal: 8,   macros: { protein: 1,  carbs: 1,  fat: 0 } },
      { name: 'Huile d\'olive',     qty: '10 g',  kcal: 90,  macros: { protein: 0,  carbs: 0,  fat: 10 } },
      { name: 'Citron (jus)',       qty: '15 ml', kcal: 4,   macros: { protein: 0,  carbs: 1,  fat: 0 } },
    ],
  },
  {
    id: 'sv-2', name: 'Tartine sarrasin-avocat', kcal: 318, time: '5 min', timeMin: 5,
    tags: ['Sans gluten', 'Vegan'], items: 4, last: 'Hier',
    macros: { protein: 10, carbs: 40, fat: 17 },
    recipe: [
      { name: 'Pain de sarrasin',       qty: '2 tranches (80 g)', kcal: 176, macros: { protein: 6, carbs: 33, fat: 3 } },
      { name: 'Avocat Hass',            qty: '70 g',              kcal: 113, macros: { protein: 1, carbs: 6,  fat: 10 } },
      { name: 'Graines de chanvre',     qty: '10 g',              kcal: 55,  macros: { protein: 3, carbs: 1,  fat: 4 } },
      { name: 'Fleur de sel & poivre',  qty: 'QS',               kcal: 0,   macros: { protein: 0, carbs: 0,  fat: 0 } },
    ],
  },
  {
    id: 'sv-3', name: 'Smoothie vert chia-banane', kcal: 287, time: '3 min', timeMin: 3,
    tags: ['Sans lactose'], items: 5, last: 'Il y a 1 semaine',
    macros: { protein: 5, carbs: 44, fat: 9 },
    recipe: [
      { name: 'Banane',           qty: '120 g', kcal: 110, macros: { protein: 1, carbs: 28, fat: 0 } },
      { name: 'Épinards frais',   qty: '50 g',  kcal: 11,  macros: { protein: 1, carbs: 1,  fat: 0 } },
      { name: 'Lait d\'amande',   qty: '200 ml',kcal: 52,  macros: { protein: 1, carbs: 3,  fat: 4 } },
      { name: 'Graines de chia',  qty: '15 g',  kcal: 72,  macros: { protein: 2, carbs: 5,  fat: 4 } },
      { name: 'Miel',             qty: '10 g',  kcal: 30,  macros: { protein: 0, carbs: 8,  fat: 0 } },
    ],
  },
  {
    id: 'sv-4', name: 'Curry rouge tofu & riz', kcal: 524, time: '25 min', timeMin: 25,
    tags: ['Sans gluten', 'Vegan'], items: 8, last: 'Il y a 3 jours',
    macros: { protein: 18, carbs: 60, fat: 22 },
    recipe: [
      { name: 'Riz basmati cuit',    qty: '150 g', kcal: 195, macros: { protein: 4,  carbs: 42, fat: 0 } },
      { name: 'Tofu ferme',          qty: '120 g', kcal: 95,  macros: { protein: 10, carbs: 2,  fat: 5 } },
      { name: 'Lait de coco',        qty: '80 ml', kcal: 122, macros: { protein: 1,  carbs: 4,  fat: 12 } },
      { name: 'Pâte curry rouge',    qty: '20 g',  kcal: 40,  macros: { protein: 1,  carbs: 6,  fat: 1 } },
      { name: 'Légumes mélange',     qty: '100 g', kcal: 35,  macros: { protein: 2,  carbs: 6,  fat: 0 } },
      { name: 'Huile de coco',       qty: '5 g',   kcal: 45,  macros: { protein: 0,  carbs: 0,  fat: 5 } },
      { name: 'Citron vert (jus)',   qty: '10 ml', kcal: 3,   macros: { protein: 0,  carbs: 1,  fat: 0 } },
      { name: 'Coriandre fraîche',   qty: '5 g',   kcal: 1,   macros: { protein: 0,  carbs: 0,  fat: 0 } },
    ],
  },
  {
    id: 'sv-5', name: 'Salade pois chiches-feta', kcal: 412, time: '10 min', timeMin: 10,
    tags: ['Sans gluten', 'Vegan'], items: 7, last: 'Il y a 5 jours',
    macros: { protein: 14, carbs: 38, fat: 21 },
    recipe: [
      { name: 'Pois chiches cuits',     qty: '120 g', kcal: 176, macros: { protein: 11, carbs: 27, fat: 3 } },
      { name: 'Feta végane (soja)',      qty: '40 g',  kcal: 90,  macros: { protein: 5,  carbs: 1,  fat: 7 } },
      { name: 'Tomates cerises',        qty: '80 g',  kcal: 14,  macros: { protein: 1,  carbs: 3,  fat: 0 } },
      { name: 'Concombre',              qty: '60 g',  kcal: 9,   macros: { protein: 0,  carbs: 2,  fat: 0 } },
      { name: 'Olives noires',          qty: '30 g',  kcal: 53,  macros: { protein: 0,  carbs: 1,  fat: 5 } },
      { name: 'Huile d\'olive',         qty: '8 g',   kcal: 72,  macros: { protein: 0,  carbs: 0,  fat: 8 } },
      { name: 'Herbes & citron',        qty: 'QS',   kcal: 4,   macros: { protein: 0,  carbs: 1,  fat: 0 } },
    ],
  },
  {
    id: 'sv-6', name: 'Poêlée légumes & œuf', kcal: 376, time: '12 min', timeMin: 12,
    tags: ['Sans gluten', 'Sans lactose'], items: 5, last: "Aujourd'hui",
    macros: { protein: 19, carbs: 21, fat: 21 },
    recipe: [
      { name: 'Œufs entiers',         qty: '2 (110 g)', kcal: 157, macros: { protein: 14, carbs: 1,  fat: 11 } },
      { name: 'Courgette',            qty: '100 g',    kcal: 17,  macros: { protein: 1,  carbs: 3,  fat: 0 } },
      { name: 'Poivron rouge',        qty: '80 g',     kcal: 20,  macros: { protein: 1,  carbs: 5,  fat: 0 } },
      { name: 'Pommes de terre',      qty: '100 g',    kcal: 80,  macros: { protein: 2,  carbs: 18, fat: 0 } },
      { name: 'Huile d\'olive',       qty: '11 g',     kcal: 99,  macros: { protein: 0,  carbs: 0,  fat: 11 } },
    ],
  },
];

export type FilterId = 'all' | 'gf' | 'vegan' | 'fast' | 'light' | 'fodmap';

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',    label: 'Tous' },
  { id: 'gf',    label: 'Sans gluten' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'fast',  label: '< 15 min' },
  { id: 'light', label: '< 400 kcal' },
  { id: 'fodmap',label: 'Low FODMAP' },
];

export function applyFilter(plates: SavedPlate[], filter: FilterId): SavedPlate[] {
  switch (filter) {
    case 'all':    return plates;
    case 'gf':    return plates.filter((p) => p.tags.includes('Sans gluten'));
    case 'vegan': return plates.filter((p) => p.tags.includes('Vegan'));
    case 'fast':  return plates.filter((p) => p.timeMin < 15);
    case 'light': return plates.filter((p) => p.kcal < 400);
    case 'fodmap':return plates.filter((p) => p.tags.includes('Low FODMAP'));
    default:      return plates;
  }
}
