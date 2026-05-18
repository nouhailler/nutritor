import { Food, Allergen, CompatItem } from '../types';

// ── Types OFF ──────────────────────────────────────────────────

export interface OFFProduct {
  id: string;
  code: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_fr?: string;
  quantity?: string;
  serving_size?: string;
  image_url?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy_100g'?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  allergens_tags?: string[];
  traces_tags?: string[];
}

export interface OFFSearchResult {
  count: number;
  products: OFFProduct[];
}

// ── Allergen mapping ───────────────────────────────────────────

const ALLERGEN_TAG_MAP: Record<string, string> = {
  'en:gluten':          'Gluten',
  'en:wheat':           'Gluten',
  'en:rye':             'Gluten',
  'en:barley':          'Gluten',
  'en:oats':            'Gluten',
  'en:milk':            'Lactose',
  'en:lactose':         'Lactose',
  'en:eggs':            'Œufs',
  'en:egg':             'Œufs',
  'en:peanuts':         'Arachides',
  'en:peanut':          'Arachides',
  'en:nuts':            'Fruits à coque',
  'en:tree-nuts':       'Fruits à coque',
  'en:almonds':         'Fruits à coque',
  'en:cashews':         'Fruits à coque',
  'en:walnuts':         'Fruits à coque',
  'en:hazelnuts':       'Fruits à coque',
  'en:soybeans':        'Soja',
  'en:soy':             'Soja',
  'en:fish':            'Poisson',
  'en:crustaceans':     'Crustacés',
  'en:shellfish':       'Crustacés',
  'en:sesame':          'Sésame',
  'en:sesame-seeds':    'Sésame',
  'en:mustard':         'Moutarde',
  'en:celery':          'Céleri',
  'en:sulphur-dioxide': 'Sulfites',
  'en:sulphites':       'Sulfites',
  'en:molluscs':        'Mollusques',
  'en:lupin':           'Lupin',
};

const STANDARD_ALLERGENS = [
  'Gluten', 'Lactose', 'Œufs', 'Arachides', 'Fruits à coque',
  'Soja', 'Poisson', 'Crustacés', 'Sésame', 'Moutarde',
  'Céleri', 'Sulfites', 'Mollusques', 'Lupin',
];

function buildAllergens(containsTags: string[], tracesTags: string[]): Allergen[] {
  const contains = new Set<string>();
  const traces = new Set<string>();

  for (const tag of containsTags) {
    const name = ALLERGEN_TAG_MAP[tag];
    if (name) contains.add(name);
  }
  for (const tag of tracesTags) {
    const name = ALLERGEN_TAG_MAP[tag];
    if (name && !contains.has(name)) traces.add(name);
  }

  return STANDARD_ALLERGENS.map((name) => ({
    name,
    status: contains.has(name) ? 'contains' : traces.has(name) ? 'trace' : 'absent',
  }));
}

function buildCompat(allergens: Allergen[]): CompatItem[] {
  const compat: CompatItem[] = [];
  const map = Object.fromEntries(allergens.map((a) => [a.name, a.status]));

  if (map['Gluten'] === 'absent') compat.push({ label: 'Sans gluten', kind: 'ok' });
  else if (map['Gluten'] === 'contains') compat.push({ label: 'Contient gluten', kind: 'warn' });

  if (map['Lactose'] === 'absent') compat.push({ label: 'Sans lactose', kind: 'ok' });
  else if (map['Lactose'] === 'contains') compat.push({ label: 'Contient lactose', kind: 'warn' });

  if (map['Œufs'] === 'absent' && map['Lactose'] === 'absent' && map['Poisson'] === 'absent' && map['Crustacés'] === 'absent')
    compat.push({ label: 'Vegan', kind: 'ok' });

  const traceAllergens = allergens.filter((a) => a.status === 'trace').map((a) => a.name);
  for (const t of traceAllergens) compat.push({ label: `Traces ${t.toLowerCase()}`, kind: 'warn' });

  return compat;
}

function extractCategory(tags: string[]): string {
  const fr = tags.filter((t) => t.startsWith('fr:')).map((t) => t.slice(3));
  const en = tags.filter((t) => t.startsWith('en:')).map((t) =>
    t.slice(3).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const candidates = [...fr, ...en];
  if (candidates.length === 0) return 'Aliment';
  // Take 2 most specific (last) tags
  const picks = candidates.slice(-2).reverse();
  return picks.join(' · ');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

// ── Mapper OFF → Food ──────────────────────────────────────────

export function offProductToFood(p: OFFProduct): Food {
  const n = p.nutriments ?? {};
  const kcal = n['energy-kcal_100g'] ?? Math.round((n['energy_100g'] ?? 0) / 4.184);

  const allergens = buildAllergens(p.allergens_tags ?? [], p.traces_tags ?? []);
  const compat = buildCompat(allergens);

  const name = (p.product_name_fr || p.product_name || 'Produit inconnu').trim();
  const brand = (p.brands ?? 'Générique').split(',')[0].trim();
  const ingredients = (p.ingredients_text_fr || p.ingredients_text || '').trim();

  return {
    id: `off-${p.code || p.id}-001`,
    category: extractCategory(p.categories_tags ?? []),
    name,
    subtitle: `Importé depuis Open Food Facts.${ingredients ? ' ' + ingredients.slice(0, 80) + '…' : ''}`,
    brand,
    defaultPortion: 100,
    unit: 'g',
    per100: {
      kcal,
      fat:     Math.round((n.fat_100g ?? 0) * 10) / 10,
      fatSat:  Math.round((n['saturated-fat_100g'] ?? 0) * 10) / 10,
      carbs:   Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      sugars:  Math.round((n.sugars_100g ?? 0) * 10) / 10,
      fiber:   Math.round((n.fiber_100g ?? 0) * 10) / 10,
      protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      salt:    Math.round((n.salt_100g ?? n.sodium_100g ?? 0) * 1000) / 1000,
    },
    allergens,
    compat,
    ingredients,
  };
}

// ── API calls ──────────────────────────────────────────────────

const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'id,code,product_name,product_name_fr,brands,categories_tags,ingredients_text,ingredients_text_fr,nutriments,allergens_tags,traces_tags,quantity';

export async function searchOFF(query: string, page = 1): Promise<OFFSearchResult> {
  const params = new URLSearchParams({
    search_terms: query,
    page: String(page),
    page_size: '20',
    fields: FIELDS,
    lc: 'fr',
    cc: 'fr',
  });
  const res = await fetch(`${BASE}/api/v2/search?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  return res.json();
}

export async function searchOFFByCategory(categoryTag: string, page = 1): Promise<OFFSearchResult> {
  const params = new URLSearchParams({
    categories_tags: categoryTag,
    page: String(page),
    page_size: '20',
    fields: FIELDS,
    lc: 'fr',
    cc: 'fr',
  });
  const res = await fetch(`${BASE}/api/v2/search?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  return res.json();
}

export async function getOFFByBarcode(barcode: string): Promise<OFFProduct | null> {
  const res = await fetch(`${BASE}/api/v2/product/${barcode}.json?fields=${FIELDS}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.status === 1 ? json.product : null;
}
