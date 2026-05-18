import { Food } from '../types';
import { SearchFilterId } from './search';

// ── Synonymes alimentaires ────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  // Céréales & pains
  pain: ['baguette', 'toast', 'tartine', 'miche', 'brioche', 'focaccia', 'galette'],
  blé: ['froment', 'épeautre', 'farro', 'triticale', 'wheat'],
  avoine: ['flocons', 'porridge', 'gruau', 'muesli', 'oat'],
  quinoa: ['quinoa rouge', 'quinoa blanc', 'pseudo-céréale'],
  riz: ['basmati', 'jasmin', 'sauvage', 'complet', 'risotto'],
  maïs: ['corn', 'polenta', 'maïzena', 'fécule de maïs'],
  sarrasin: ['buckwheat', 'blé noir'],
  millet: ['sorgho', 'teff'],

  // Protéines animales
  poulet: ['volaille', 'blanc de poulet', 'escalope'],
  bœuf: ['viande rouge', 'steak', 'haché', 'filet', 'bifteck'],
  porc: ['cochon', 'jambon', 'lardons', 'bacon'],
  saumon: ['poisson gras', 'fish'],
  thon: ['poisson', 'fish', 'thon albacore'],
  oeuf: ['œuf', 'œufs', 'omelette', 'brouillés', 'coque'],
  crevette: ['crustacé', 'gambas'],

  // Protéines végétales
  lentilles: ['légumineuses', 'légumes secs', 'beluga', 'corail'],
  'pois chiche': ['houmous', 'falafel', 'légumineuses', 'chickpea'],
  tofu: ['soja', 'protéines végétales'],
  tempeh: ['soja fermenté', 'protéines végétales'],
  haricots: ['beans', 'légumineuses', 'flageolets'],
  edamame: ['soja', 'fèves de soja'],

  // Légumes
  épinard: ['épinards', 'spinach'],
  brocoli: ['chou-fleur', 'crucifère'],
  courgette: ['zucchini', 'courge'],
  tomate: ['cherry', 'cœur de bœuf', 'tomato'],

  // Fruits
  avocat: ['avocado'],
  banane: ['banana'],
  pomme: ['apple', 'gala', 'granny'],
  baie: ['myrtille', 'framboise', 'fraise', 'mûre', 'berry'],

  // Produits laitiers
  fromage: ['gruyère', 'comté', 'cheddar', 'brie', 'feta', 'parmesan', 'cheese'],
  yaourt: ['yogourt', 'yoghurt'],
  skyr: ['yaourt islandais'],
  lait: ['lactose', 'crème', 'beurre'],

  // Oléagineux
  amande: ['fruits à coque', 'noix', 'almond'],
  noix: ['fruits à coque', 'cajou', 'pistache', 'noisette', 'cashew'],
  graine: ['sésame', 'chia', 'lin', 'courge', 'tournesol', 'chanvre'],

  // Huiles & graisses
  huile: ['olive', 'colza', 'coco', 'oil'],

  // Termes génériques
  protéines: ['protéique', 'riche en protéines', 'protein'],
  glucides: ['sucres', 'féculents', 'amidon', 'carbs'],
  fibres: ['fiber', 'fibre'],
  snack: ['encas', 'collation', 'grignotage'],
  repas: ['plat', 'déjeuner', 'dîner'],
};

// ── Levenshtein distance ──────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Synonym expansion ─────────────────────────────────────────

function getTermVariants(token: string): string[] {
  const t = token.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const variants = new Set<string>([t]);
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    const normKey = key.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const normSyns = syns.map((s) => s.normalize('NFD').replace(/[̀-ͯ]/g, ''));
    if (normKey === t || normSyns.includes(t)) {
      variants.add(normKey);
      for (const s of normSyns) variants.add(s);
    }
  }
  return Array.from(variants);
}

// ── Token match score ─────────────────────────────────────────

function tokenScore(token: string, searchableNorm: string): number {
  const t = token.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (t.length < 2) return 0;

  // Direct substring match
  if (searchableNorm.includes(t)) return 1.0;

  // Synonym expansion
  const variants = getTermVariants(t);
  for (const v of variants) {
    if (v !== t && searchableNorm.includes(v)) return 0.85;
  }

  // Fuzzy match (only for tokens ≥ 5 chars to avoid noise)
  if (t.length >= 5) {
    const words = searchableNorm.split(/\s+/);
    const maxDist = Math.floor(t.length / 4);
    for (const w of words) {
      if (Math.abs(w.length - t.length) <= maxDist) {
        const dist = levenshtein(t, w);
        if (dist <= maxDist) return 1.0 - dist * 0.15;
      }
    }
  }

  return 0;
}

// ── NLP parsing ───────────────────────────────────────────────

export interface NLPIntent {
  impliedFilters: SearchFilterId[];
  minProteinG?: number;
  maxKcalPortion?: number;
  lowFodmap?: boolean;
  highFiber?: boolean;
  cleanTerms: string[];
}

interface NLPRule {
  pattern: RegExp;
  apply: (i: NLPIntent) => void;
}

const NLP_RULES: NLPRule[] = [
  // Gluten-free
  { pattern: /sans[\s-]gluten/i, apply: (i) => { if (!i.impliedFilters.includes('gf')) i.impliedFilters.push('gf'); } },
  { pattern: /gluten[\s-]free/i, apply: (i) => { if (!i.impliedFilters.includes('gf')) i.impliedFilters.push('gf'); } },
  // Lactose-free
  { pattern: /sans[\s-]lactose/i, apply: (i) => { if (!i.impliedFilters.includes('lf')) i.impliedFilters.push('lf'); } },
  { pattern: /sans[\s-]lait/i,   apply: (i) => { if (!i.impliedFilters.includes('lf')) i.impliedFilters.push('lf'); } },
  // Vegetarian / Vegan
  { pattern: /vég[eé]tarien/i, apply: (i) => { if (!i.impliedFilters.includes('vg')) i.impliedFilters.push('vg'); } },
  { pattern: /végane?|vegan/i, apply: (i) => { if (!i.impliedFilters.includes('vgn')) i.impliedFilters.push('vgn'); } },
  // Nut-free
  { pattern: /sans (fruits à coque|noix|amandes?)/i, apply: (i) => { if (!i.impliedFilters.includes('nf')) i.impliedFilters.push('nf'); } },
  // High protein
  { pattern: /riche[s]? en prot[eé]ines?/i, apply: (i) => { i.minProteinG = 15; } },
  { pattern: /hyper\s?prot[eé][ií]n[eé]/i, apply: (i) => { i.minProteinG = 20; } },
  { pattern: /prot[eé]in[eé]/i,             apply: (i) => { if (!i.minProteinG) i.minProteinG = 12; } },
  // Low calorie
  { pattern: /pauvre en (calories|kcal)|hypocalorique/i, apply: (i) => { i.maxKcalPortion = 200; } },
  { pattern: /l[eé]ger[eè]?|light/i, apply: (i) => { if (!i.maxKcalPortion) i.maxKcalPortion = 250; } },
  // Low FODMAP
  { pattern: /pauvre en fodmap|low[\s-]fodmap|bas[\s-]fodmap|fodmap/i, apply: (i) => { i.lowFodmap = true; } },
  // High fiber
  { pattern: /riche[s]? en fibres?/i, apply: (i) => { i.highFiber = true; } },
];

const NLP_STRIP_PATTERNS = [
  /sans[\s-]gluten/gi, /gluten[\s-]free/gi,
  /sans[\s-]lactose/gi, /sans[\s-]lait/gi,
  /vég[eé]tarien(ne)?s?/gi, /végane?s?/gi, /vegans?/gi,
  /sans (fruits à coque|noix|amandes?)/gi,
  /riche[s]? en prot[eé]ines?/gi, /hyper\s?prot[eé][ií]n[eé]/gi, /prot[eé]in[eé]/gi,
  /pauvre en (calories|kcal)/gi, /hypocalorique/gi, /light/gi, /l[eé]ger[eè]?s?/gi,
  /pauvre en fodmap/gi, /low[\s-]fodmap/gi, /bas[\s-]fodmap/gi, /fodmap/gi,
  /riche[s]? en fibres?/gi,
  /rapide[s]?|vite|instant[eé]?/gi,
  /encas|collation|snacks?|grignotage/gi,
  /repas|plats?|d[eé]jeuner|d[iî]ner|petit[\s-]d[eé]jeuner/gi,
];

export function parseNLPQuery(rawQuery: string): NLPIntent {
  const intent: NLPIntent = { impliedFilters: [], cleanTerms: [] };

  for (const rule of NLP_RULES) {
    if (rule.pattern.test(rawQuery)) rule.apply(intent);
  }

  let cleaned = rawQuery;
  for (const pat of NLP_STRIP_PATTERNS) cleaned = cleaned.replace(pat, ' ');

  intent.cleanTerms = cleaned
    .split(/\s+/)
    .map((t) => t.trim().replace(/[^\p{L}\p{N}'-]/gu, ''))
    .filter((t) => t.length >= 2);

  return intent;
}

// ── Smart search ──────────────────────────────────────────────

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function smartSearch(
  foods: Food[],
  rawQuery: string,
  intent: NLPIntent,
): Food[] {
  if (!rawQuery.trim()) return foods;

  const terms = intent.cleanTerms.length > 0 ? intent.cleanTerms : [rawQuery.trim()];

  const scored: Array<{ food: Food; score: number }> = [];

  for (const food of foods) {
    const searchable = normalizeText(
      [food.name, food.brand, food.category, food.subtitle, food.origin ?? ''].join(' '),
    );

    let total = 0;
    let matched = 0;

    for (const term of terms) {
      if (term.length < 2) continue;
      const s = tokenScore(term, searchable);
      if (s > 0) { total += s; matched++; }
    }

    if (matched === 0) continue;

    const matchRatio = matched / Math.max(1, terms.length);
    const score = (total / Math.max(1, terms.length)) * matchRatio;
    if (score > 0.08) scored.push({ food, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((r) => r.food);
}

// ── NLP nutrition criteria ────────────────────────────────────

export function passesNLPCriteria(food: Food, intent: NLPIntent): boolean {
  if (intent.minProteinG !== undefined) {
    const portionProtein = (food.per100.protein * food.defaultPortion) / 100;
    if (portionProtein < intent.minProteinG) return false;
  }
  if (intent.maxKcalPortion !== undefined) {
    const portionKcal = (food.per100.kcal * food.defaultPortion) / 100;
    if (portionKcal > intent.maxKcalPortion) return false;
  }
  if (intent.lowFodmap) {
    if (!food.fodmap || food.fodmap.overall === 'high') return false;
  }
  if (intent.highFiber) {
    if (food.per100.fiber < 5) return false;
  }
  return true;
}

// ── NLP intent labels for display ─────────────────────────────

export const NLP_FILTER_LABELS: Record<SearchFilterId, string> = {
  gf:  'Sans gluten',
  lf:  'Sans lactose',
  vg:  'Végétarien',
  vgn: 'Vegan',
  nf:  'Sans fruits à coque',
  low: '< 200 kcal',
};
