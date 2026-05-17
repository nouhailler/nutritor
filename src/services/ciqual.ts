import ciqualRaw from '../data/ciqual.json';
import { Food, Allergen, CompatItem } from '../types';

// ── Type CIQUAL ────────────────────────────────────────────────

export interface CIQUALEntry {
  id: string;
  name: string;
  group: string;
  sub?: string;
  kcal: number;
  protein: number;
  fat: number;
  fatSat: number;
  carbs: number;
  sugars: number;
  fiber: number;
  salt: number;
  // Minéraux mg/100g
  ca?: number; fe?: number; mg?: number; p?: number; k?: number; zn?: number;
  // Vitamines
  vd?: number; ve?: number; vc?: number;
  vb1?: number; vb2?: number; vb3?: number; vb6?: number; vb9?: number; vb12?: number;
}

export const CIQUAL_DATA = ciqualRaw as CIQUALEntry[];

// ── Recherche ──────────────────────────────────────────────────

export function searchCIQUAL(query: string, limit = 30): CIQUALEntry[] {
  if (!query.trim()) return [];
  const terms = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const scored: { entry: CIQUALEntry; score: number }[] = [];

  for (const entry of CIQUAL_DATA) {
    const n = normalize(entry.name);
    let score = 0;
    for (const t of terms) {
      if (n.startsWith(t)) score += 3;
      else if (n.includes(t)) score += 1;
    }
    if (score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

// ── Mapper CIQUAL → Food ───────────────────────────────────────

const ALLERGEN_NAMES = [
  'Gluten', 'Lactose', 'Œufs', 'Arachides', 'Fruits à coque',
  'Soja', 'Poisson', 'Crustacés', 'Sésame', 'Moutarde',
  'Céleri', 'Sulfites', 'Mollusques', 'Lupin',
];

// Infer allergens from CIQUAL group/subgroup/name (best-effort heuristic)
function buildAllergens(e: CIQUALEntry): Allergen[] {
  const g = (e.group + ' ' + (e.sub ?? '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const n = e.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const contains = new Set<string>();

  // Gluten — céréales panifiables et dérivés
  // Note: 'céréaliers' normalise en 'cerealiers', donc on teste 'cereal' (préfixe commun)
  if (
    g.includes('cereal') || g.includes('farine') || g.includes('pain') ||
    g.includes('pate') || g.includes('semoule') || g.includes('biscotte') ||
    g.includes('viennoiserie') || g.includes('biscuit') || g.includes('gateau') ||
    g.includes('pizza') || g.includes('quiche') || g.includes('crepe') ||
    n.includes('ble') || n.includes('seigle') || n.includes('orge') ||
    n.includes('avoine') || n.includes('epeautre') || n.includes('kamut') ||
    n.includes('gluten') || n.includes('couscous') || n.includes('boulgour') ||
    n.includes('chapelure') || n.includes('panure')
  ) contains.add('Gluten');

  // Lactose — produits laitiers
  if (
    g.includes('lait') || g.includes('fromage') || g.includes('yaourt') ||
    g.includes('creme') || g.includes('beurre') || g.includes('laitier') ||
    g.includes('dessert lactee') || g.includes('glace') ||
    n.includes('lait') || n.includes('fromage') || n.includes('yaourt') ||
    n.includes('creme fraiche') || n.includes('beurre') || n.includes('lactose') ||
    n.includes('lactosérum') || n.includes('lactoserum') || n.includes('ricotta') ||
    n.includes('mozzarella') || n.includes('parmesan') || n.includes('camembert') ||
    n.includes('brie') || n.includes('roquefort') || n.includes('emmental')
  ) contains.add('Lactose');

  // Œufs
  if (
    g.includes('oeuf') || n.includes('oeuf') ||
    n.includes('omelette') || n.includes('meringue')
  ) contains.add('Œufs');

  // Poisson
  if (
    g.includes('poisson') ||
    n.includes('poisson') || n.includes('thon') || n.includes('saumon') ||
    n.includes('truite') || n.includes('sardine') || n.includes('maquereau') ||
    n.includes('hareng') || n.includes('anchois') || n.includes('cabillaud') ||
    n.includes('lieu') || n.includes('merlan') || n.includes('sole') ||
    n.includes('dorade') || n.includes('bar ') || n.includes('brochet') ||
    n.includes('perche') || n.includes('pangasius') || n.includes('tilapia')
  ) contains.add('Poisson');

  // Crustacés
  if (
    g.includes('crustace') ||
    n.includes('crevette') || n.includes('homard') || n.includes('crabe') ||
    n.includes('langoustine') || n.includes('ecrevisse') || n.includes('langouste')
  ) contains.add('Crustacés');

  // Mollusques
  if (
    g.includes('mollusque') || g.includes('coquillage') ||
    n.includes('huitre') || n.includes('moule') || n.includes('coquille') ||
    n.includes('palourde') || n.includes('poulpe') || n.includes('seiche') ||
    n.includes('calmar') || n.includes('escargot')
  ) contains.add('Mollusques');

  // Arachides
  if (n.includes('arachide') || n.includes('cacahuete') || n.includes('cacahuète'))
    contains.add('Arachides');

  // Fruits à coque (groupe CIQUAL : "fruits a coque et graines oleagineuses")
  if (
    g.includes('coque') ||
    n.includes('amande') || n.includes('noisette') ||
    (n.includes('noix') && !n.includes('noix de coco')) ||
    n.includes('cajou') || n.includes('pistache') ||
    n.includes('pecan') || n.includes('macadamia') || n.includes('pignon')
  ) contains.add('Fruits à coque');

  // Soja
  if (n.includes('soja') || n.includes('tofu') || n.includes('miso') ||
      n.includes('tempeh') || n.includes('edamame'))
    contains.add('Soja');

  // Sésame
  if (n.includes('sesame') || n.includes('tahini') || n.includes('tahina'))
    contains.add('Sésame');

  // Moutarde
  if (n.includes('moutarde')) contains.add('Moutarde');

  // Céleri
  if (n.includes('celeri')) contains.add('Céleri');

  return ALLERGEN_NAMES.map((name) => ({
    name,
    status: contains.has(name) ? 'contains' as const : 'absent' as const,
  }));
}

function buildMinerals(e: CIQUALEntry) {
  const items = [];
  if (e.ca != null) items.push({ name: 'Calcium',    qty: `${e.ca} mg`,  anr: `${Math.round(e.ca / 800 * 100)} %`,  role: 'Os, dents, contraction musculaire' });
  if (e.mg != null) items.push({ name: 'Magnésium',  qty: `${e.mg} mg`,  anr: `${Math.round(e.mg / 375 * 100)} %`, role: 'Métabolisme énergétique, détente musculaire' });
  if (e.p  != null) items.push({ name: 'Phosphore',  qty: `${e.p} mg`,   anr: `${Math.round(e.p / 700 * 100)} %`,  role: 'Os, membranes, énergie (ATP)' });
  if (e.k  != null) items.push({ name: 'Potassium',  qty: `${e.k} mg`,   anr: `${Math.round(e.k / 2000 * 100)} %`, role: 'Équilibre hydrique, tension artérielle' });
  return items.length ? items : undefined;
}

function buildTrace(e: CIQUALEntry) {
  const items = [];
  if (e.fe != null) items.push({ name: 'Fer',  qty: `${e.fe} mg`, anr: `${Math.round(e.fe / 14 * 100)} %`, role: 'Transport oxygène (hémoglobine), enzymes' });
  if (e.zn != null) items.push({ name: 'Zinc', qty: `${e.zn} mg`, anr: `${Math.round(e.zn / 10 * 100)} %`, role: 'Immunité, synthèse protéique, cicatrisation' });
  return items.length ? items : undefined;
}

function buildVitamins(e: CIQUALEntry) {
  const items = [];
  if (e.vc  != null && e.vc  > 0) items.push({ name: 'Vitamine C',          qty: `${e.vc} mg`,  anr: `${Math.round(e.vc/80*100)}%`,   role: 'Anti-oxydant, immunité' });
  if (e.vd  != null && e.vd  > 0) items.push({ name: 'Vitamine D',          qty: `${e.vd} µg`,  anr: `${Math.round(e.vd/5*100)}%`,    role: 'Os, immunité' });
  if (e.ve  != null && e.ve  > 0) items.push({ name: 'Vitamine E',          qty: `${e.ve} mg`,  anr: `${Math.round(e.ve/12*100)}%`,   role: 'Anti-oxydant, membranes' });
  if (e.vb1 != null && e.vb1 > 0) items.push({ name: 'Vitamine B1 — Thiamine', qty: `${e.vb1} mg`, anr: `${Math.round(e.vb1/1.1*100)}%`, role: 'Métabolisme glucides' });
  if (e.vb2 != null && e.vb2 > 0) items.push({ name: 'Vitamine B2 — Riboflavine', qty: `${e.vb2} mg`, anr: `${Math.round(e.vb2/1.4*100)}%`, role: "Production d'énergie" });
  if (e.vb3 != null && e.vb3 > 0) items.push({ name: 'Vitamine B3 — Niacine', qty: `${e.vb3} mg`, anr: `${Math.round(e.vb3/16*100)}%`,  role: 'Métabolisme cellulaire' });
  if (e.vb6 != null && e.vb6 > 0) items.push({ name: 'Vitamine B6',         qty: `${e.vb6} mg`, anr: `${Math.round(e.vb6/1.4*100)}%`, role: 'Neurotransmetteurs, immunité' });
  if (e.vb9 != null && e.vb9 > 0) items.push({ name: 'Vitamine B9 — Folates', qty: `${e.vb9} µg`, anr: `${Math.round(e.vb9/200*100)}%`, role: 'Synthèse ADN' });
  if (e.vb12!= null && e.vb12> 0) items.push({ name: 'Vitamine B12',        qty: `${e.vb12} µg`,anr: `${Math.round(e.vb12/2.5*100)}%`,role: 'Globules rouges, nerfs' });
  return items.length ? items : undefined;
}

function buildCompat(e: CIQUALEntry, allergens: Allergen[]): CompatItem[] {
  const compat: CompatItem[] = [];
  const am = Object.fromEntries(allergens.map((a) => [a.name, a.status]));

  // Nutrition
  if (e.salt < 0.3)     compat.push({ label: 'Pauvre en sel', kind: 'ok' });
  if (e.sugars < 5)     compat.push({ label: 'Pauvre en sucres', kind: 'ok' });
  if (e.fat < 3)        compat.push({ label: 'Pauvre en graisses', kind: 'ok' });
  if (e.fiber > 5)      compat.push({ label: 'Riche en fibres', kind: 'ok' });
  if (e.protein > 15)   compat.push({ label: 'Riche en protéines', kind: 'ok' });
  if (e.salt > 1.5)     compat.push({ label: 'Riche en sel', kind: 'warn' });
  if (e.sugars > 15)    compat.push({ label: 'Riche en sucres', kind: 'warn' });

  // Allergènes inférés
  if (am['Gluten'] === 'absent')   compat.push({ label: 'Sans gluten', kind: 'ok' });
  else                              compat.push({ label: 'Contient gluten', kind: 'warn' });

  if (am['Lactose'] === 'absent')  compat.push({ label: 'Sans lactose', kind: 'ok' });
  else                              compat.push({ label: 'Contient lactose', kind: 'warn' });

  const animalKeys = ['Œufs', 'Lactose', 'Poisson', 'Crustacés', 'Mollusques'];
  if (animalKeys.every((k) => am[k] === 'absent'))
    compat.push({ label: 'Vegan', kind: 'ok' });

  return compat;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 35);
}

// Refresh allergens + compat for a stored CIQUAL food without touching other zones.
export function refreshCiqualAllergens(food: import('../types').Food): import('../types').Food {
  const ciqualId = food.id.replace('ciqual-', '');
  const entry = CIQUAL_DATA.find((e) => e.id === ciqualId);
  if (!entry) return food;
  const allergens = buildAllergens(entry);
  const compat = buildCompat(entry, allergens);
  return { ...food, allergens, compat };
}

export function ciqualToFood(e: CIQUALEntry): Food {
  const category = e.sub ? `${e.group} · ${e.sub}` : e.group;
  const allergens = buildAllergens(e);

  return {
    id: `ciqual-${e.id}`,
    category: category || 'Aliment',
    name: e.name,
    subtitle: `Base CIQUAL 2020 · ANSES. ${category ? category + '.' : ''}`,
    brand: 'CIQUAL — ANSES',
    defaultPortion: 100,
    unit: 'g',
    per100: {
      kcal:    e.kcal,
      fat:     e.fat,
      fatSat:  e.fatSat,
      carbs:   e.carbs,
      sugars:  e.sugars,
      fiber:   e.fiber,
      protein: e.protein,
      salt:    e.salt,
    },
    minerals:  buildMinerals(e),
    vitamins:  buildVitamins(e),
    trace:     buildTrace(e),
    allergens,
    compat:    buildCompat(e, allergens),
    ingredients: e.name,
  };
}
