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

function buildAllergens(): Allergen[] {
  // CIQUAL ne fournit pas les allergènes — on initialise tout à "absent"
  return [
    'Gluten','Lactose','Œufs','Arachides','Fruits à coque',
    'Soja','Poisson','Crustacés','Sésame','Moutarde',
    'Céleri','Sulfites','Mollusques','Lupin',
  ].map((name) => ({ name, status: 'absent' as const }));
}

function buildMinerals(e: CIQUALEntry) {
  const items = [];
  if (e.ca  != null) items.push({ name: 'Calcium',    qty: `${e.ca} mg`,   anr: `${Math.round(e.ca/1000*100)}%`,  role: 'Os, dents, contraction musculaire' });
  if (e.fe  != null) items.push({ name: 'Fer',         qty: `${e.fe} mg`,   anr: `${Math.round(e.fe/14*100)}%`,   role: 'Transport oxygène, enzymes' });
  if (e.mg  != null) items.push({ name: 'Magnésium',   qty: `${e.mg} mg`,   anr: `${Math.round(e.mg/375*100)}%`,  role: 'Métabolisme énergétique, muscles' });
  if (e.p   != null) items.push({ name: 'Phosphore',   qty: `${e.p} mg`,    anr: `${Math.round(e.p/700*100)}%`,   role: 'Os, membranes, énergie' });
  if (e.k   != null) items.push({ name: 'Potassium',   qty: `${e.k} mg`,    anr: `${Math.round(e.k/2000*100)}%`,  role: 'Équilibre hydrique, tension artérielle' });
  if (e.zn  != null) items.push({ name: 'Zinc',        qty: `${e.zn} mg`,   anr: `${Math.round(e.zn/10*100)}%`,   role: 'Immunité, synthèse protéique' });
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

function buildCompat(e: CIQUALEntry): CompatItem[] {
  const compat: CompatItem[] = [];
  if (e.salt < 0.3) compat.push({ label: 'Pauvre en sel', kind: 'ok' });
  if (e.sugars < 5) compat.push({ label: 'Pauvre en sucres', kind: 'ok' });
  if (e.fat < 3)    compat.push({ label: 'Pauvre en graisses', kind: 'ok' });
  if (e.fiber > 5)  compat.push({ label: 'Riche en fibres', kind: 'ok' });
  if (e.protein > 15) compat.push({ label: 'Riche en protéines', kind: 'ok' });
  if (e.salt > 1.5) compat.push({ label: 'Riche en sel', kind: 'warn' });
  if (e.sugars > 15) compat.push({ label: 'Riche en sucres', kind: 'warn' });
  return compat;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 35);
}

export function ciqualToFood(e: CIQUALEntry): Food {
  const category = e.sub ? `${e.group} · ${e.sub}` : e.group;

  return {
    id: `ciqual-${e.id}`,
    category: category || 'Aliment',
    name: e.name,
    subtitle: `Base CIQUAL 2020 · ANSES. ${category ? category + '.' : ''}`,
    brand: 'CIQUAL — ANSES',
    defaultPortion: 100,
    unit: 'g',
    per100: {
      kcal:   e.kcal,
      fat:    e.fat,
      fatSat: e.fatSat,
      carbs:  e.carbs,
      sugars: e.sugars,
      fiber:  e.fiber,
      protein:e.protein,
      salt:   e.salt,
    },
    minerals: buildMinerals(e),
    vitamins:  buildVitamins(e),
    allergens: buildAllergens(),
    compat: buildCompat(e),
    ingredients: e.name,
  };
}
