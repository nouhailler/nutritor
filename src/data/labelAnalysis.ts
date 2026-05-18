import { OFFProduct } from '../services/openFoodFacts';
import { UserProfile } from './user';

// ── Types ─────────────────────────────────────────────────────

export interface IngredientFlag {
  matchedText: string;            // texte exact trouvé dans la liste d'ingrédients
  category: 'fodmap' | 'additive' | 'allergen';
  concern: string;                // titre court : "Polyol élevé"
  detail: string;                 // explication : "Effet laxatif dose-dépendant"
  level: 'high' | 'medium' | 'low';
}

export interface TextSegment {
  text: string;
  flag?: IngredientFlag;          // présent si ce segment est surligné
}

export interface LabelAnalysis {
  digestiveScore: number;         // 0–100
  digestiveLevel: 'good' | 'caution' | 'bad';
  flags: IngredientFlag[];        // triées par sévérité décroissante
  positives: string[];            // "Sans gluten", "Sans lactose", "Peu d'additifs"
  segments: TextSegment[];        // texte des ingrédients segmenté pour le surlignage
  additivesCount: number;
  fodmapCount: number;
}

// ── Règles d'analyse ──────────────────────────────────────────

interface FlagRule {
  pattern: RegExp;
  category: 'fodmap' | 'additive';
  concern: string;
  detail: string;
  level: 'high' | 'medium' | 'low';
  fodmapType?: string;
}

const RULES: FlagRule[] = [
  // ── Polyols ────────────────────────────────────────────────
  {
    pattern: /\bmaltitol\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Maltitol → fermentescible et laxatif dès 10 g',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\bsorbitol\b|\be\s?420\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Sorbitol (E420) → mal absorbé, ballonnements et diarrhées',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\bmannitol\b|\be\s?421\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Mannitol (E421) → très faible absorption intestinale',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\bxylitol\b|\be\s?967\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Xylitol (E967) → effet laxatif marqué',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\bisomalt\b|\be\s?953\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Isomalt (E953) → fermentescible en quantité',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\blactitol\b|\be\s?966\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Polyol élevé',
    detail: 'Lactitol (E966) → laxatif osmotique',
    fodmapType: 'Polyols',
  },
  {
    pattern: /\bérythritol\b|\berythritol\b|\be\s?968\b/i,
    category: 'fodmap', level: 'medium',
    concern: 'Polyol modéré',
    detail: 'Érythritol (E968) → mieux toléré que les autres polyols',
    fodmapType: 'Polyols',
  },

  // ── Fructanes ──────────────────────────────────────────────
  {
    pattern: /\binuline\b|\binulin\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Fructanes',
    detail: 'Inuline → fructanes fermentescibles, gaz et ballonnements',
    fodmapType: 'Fructanes',
  },
  {
    pattern: /fructo.?oligosaccharide|\bfos\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Fructanes',
    detail: 'FOS → prébiotiques fermentescibles, déconseillés Low FODMAP',
    fodmapType: 'Fructanes',
  },
  {
    pattern: /\bchicor[eé]e?\b|\bchicory\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Fructanes (chicorée)',
    detail: 'Chicorée → source naturelle d\'inuline',
    fodmapType: 'Fructanes',
  },
  {
    pattern: /\btopinambour\b|\bjerusalem artichoke\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Fructanes élevés',
    detail: 'Topinambour → très riche en fructanes',
    fodmapType: 'Fructanes',
  },

  // ── Lactose ────────────────────────────────────────────────
  {
    pattern: /\blactose\b/i,
    category: 'fodmap', level: 'high',
    concern: 'Lactose',
    detail: 'Lactose → sucre du lait, intolérance fréquente',
    fodmapType: 'Lactose',
  },
  {
    pattern: /laitos[eé]rum|lactos[eé]rum|\bwhey\b/i,
    category: 'fodmap', level: 'medium',
    concern: 'Lactose (trace)',
    detail: 'Lactosérum/whey → peut contenir du lactose résiduel',
    fodmapType: 'Lactose',
  },
  {
    pattern: /poudre de lait|lait en poudre|milk powder/i,
    category: 'fodmap', level: 'medium',
    concern: 'Lactose probable',
    detail: 'Poudre de lait → contient généralement du lactose',
    fodmapType: 'Lactose',
  },

  // ── Fructose ───────────────────────────────────────────────
  {
    pattern: /sirop de (maïs|mais)|high.fructose|sirop de fructose/i,
    category: 'fodmap', level: 'high',
    concern: 'Fructose en excès',
    detail: 'Sirop de fructose → fructose en excès du glucose, mal absorbé',
    fodmapType: 'Fructose',
  },
  {
    pattern: /\bfructose\b/i,
    category: 'fodmap', level: 'medium',
    concern: 'Fructose',
    detail: 'Fructose ajouté → à surveiller selon la quantité',
    fodmapType: 'Fructose',
  },

  // ── Additifs à impact digestif ────────────────────────────
  {
    pattern: /carraghénane|carrageenan|\be\s?407\b/i,
    category: 'additive', level: 'high',
    concern: 'Épaississant controversé',
    detail: 'Carraghénane (E407) → inflammation intestinale chez certains individus',
  },
  {
    pattern: /\be\s?250\b|nitrite de sodium/i,
    category: 'additive', level: 'high',
    concern: 'Nitrite',
    detail: 'Nitrite (E250) → conservateur viandes transformées, classé cancérigène probable',
  },
  {
    pattern: /\be\s?171\b|dioxyde de titane|titanium dioxide/i,
    category: 'additive', level: 'high',
    concern: 'Colorant interdit',
    detail: 'Dioxyde de titane (E171) → interdit en France depuis 2020',
  },
  {
    pattern: /\baspartame\b|\be\s?951\b/i,
    category: 'additive', level: 'medium',
    concern: 'Édulcorant controversé',
    detail: 'Aspartame (E951) → données contradictoires, éviter si intolérance',
  },
  {
    pattern: /gomme guar|\be\s?412\b/i,
    category: 'additive', level: 'medium',
    concern: 'Fibre fermentescible',
    detail: 'Gomme guar (E412) → fermentescible en grande quantité',
  },
  {
    pattern: /gomme xanthan[e]?|xanthan gum|\be\s?415\b/i,
    category: 'additive', level: 'low',
    concern: 'Épaississant',
    detail: 'Gomme xanthane (E415) → bien toléré aux doses alimentaires habituelles',
  },
  {
    pattern: /\bglutamate\b|\bmsg\b|\be\s?621\b/i,
    category: 'additive', level: 'medium',
    concern: 'Exhausteur de goût',
    detail: 'Glutamate (E621) → sensibilité variable, généralement sans effet aux doses normales',
  },
  {
    pattern: /\btartrazine\b|\be\s?102\b/i,
    category: 'additive', level: 'medium',
    concern: 'Colorant azoïque',
    detail: 'Tartrazine (E102) → lié à l\'hyperactivité chez les enfants sensibles',
  },
  {
    pattern: /benzoate de sodium|\be\s?211\b/i,
    category: 'additive', level: 'medium',
    concern: 'Conservateur',
    detail: 'Benzoate (E211) → potentiellement problématique combiné à certains colorants',
  },
  {
    pattern: /\bbha\b|\be\s?320\b/i,
    category: 'additive', level: 'medium',
    concern: 'Antioxydant controversé',
    detail: 'BHA (E320) → classé cancérigène possible (IARC groupe 2B)',
  },
  {
    pattern: /huile (de palme|palm)/i,
    category: 'additive', level: 'low',
    concern: 'Huile de palme',
    detail: 'Huile de palme → riche en acides gras saturés, impact environnemental',
  },
];

// ── Segmentation du texte pour surlignage ──────────────────────

function segmentIngredients(text: string, flags: IngredientFlag[]): TextSegment[] {
  if (!text.trim() || flags.length === 0) return [{ text }];

  interface Match { start: number; end: number; flag: IngredientFlag }
  const matches: Match[] = [];

  for (const flag of flags) {
    // Escape special regex chars in matchedText, then search for it
    const escaped = flag.matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end   = start + m[0].length;
      // Skip overlaps
      if (!matches.some((x) => x.start < end && x.end > start)) {
        matches.push({ start, end, flag });
        break; // highlight only first occurrence
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (cursor < m.start) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), flag: m.flag });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments.length > 0 ? segments : [{ text }];
}

// ── Score digestif ─────────────────────────────────────────────

function computeDigestiveScore(flags: IngredientFlag[], profile: UserProfile): number {
  const hasFodmapDiet = profile.diets.some((d) => d.id === 'low' && d.on);
  let score = 100;

  for (const f of flags) {
    if (f.category === 'fodmap') {
      if (f.level === 'high')   score -= hasFodmapDiet ? 22 : 10;
      if (f.level === 'medium') score -= hasFodmapDiet ? 12 : 5;
      if (f.level === 'low')    score -= 3;
    } else {
      if (f.level === 'high')   score -= 14;
      if (f.level === 'medium') score -= 7;
      if (f.level === 'low')    score -= 2;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Signaux positifs ───────────────────────────────────────────

function buildPositives(product: OFFProduct, flags: IngredientFlag[], profile: UserProfile): string[] {
  const positives: string[] = [];
  const allergenTags  = new Set(product.allergens_tags ?? []);
  const traceTags     = new Set(product.traces_tags ?? []);

  const noGluten  = !allergenTags.has('en:gluten') && !allergenTags.has('en:wheat') &&
                    !traceTags.has('en:gluten') && !traceTags.has('en:wheat');
  const noLactose = !allergenTags.has('en:milk') && !allergenTags.has('en:lactose') &&
                    !traceTags.has('en:milk') && !traceTags.has('en:lactose');
  const noEggs    = !allergenTags.has('en:eggs') && !traceTags.has('en:eggs');

  if (noGluten)  positives.push('Sans gluten');
  if (noLactose) positives.push('Sans lactose');
  if (noEggs && noLactose && !allergenTags.has('en:fish') && !allergenTags.has('en:crustaceans'))
    positives.push('Compatible vegan');

  // Low sugar
  const sugars = product.nutriments?.sugars_100g ?? null;
  if (sugars !== null && sugars < 1) positives.push('Sans sucres ajoutés');

  // Low additives
  const additiveFlagsCount = flags.filter((f) => f.category === 'additive').length;
  if (additiveFlagsCount === 0) positives.push('Aucun additif suspect');

  // Low FODMAP all-clear
  const fodmapFlagsCount = flags.filter((f) => f.category === 'fodmap').length;
  if (fodmapFlagsCount === 0 && profile.diets.some((d) => d.id === 'low' && d.on))
    positives.push('Aucun ingrédient FODMAP détecté');

  return positives;
}

// ── Point d'entrée ─────────────────────────────────────────────

export function analyzeLabel(product: OFFProduct, profile: UserProfile): LabelAnalysis {
  const ingredientsText = (product.ingredients_text_fr || product.ingredients_text || '').trim();

  // Run rules against ingredients text
  const rawFlags: IngredientFlag[] = [];
  const seen = new Set<string>(); // deduplicate by (pattern concern + matched)

  for (const rule of RULES) {
    const m = rule.pattern.exec(ingredientsText);
    if (!m) continue;
    const key = `${rule.concern}::${m[0].toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rawFlags.push({
      matchedText: m[0],
      category:   rule.category,
      concern:    rule.concern,
      detail:     rule.detail,
      level:      rule.level,
    });
  }

  // Sort: high → medium → low
  const LEVEL_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const flags = [...rawFlags].sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);

  const score          = computeDigestiveScore(flags, profile);
  const digestiveLevel = score >= 80 ? 'good' : score >= 50 ? 'caution' : 'bad';
  const positives      = buildPositives(product, flags, profile);
  const segments       = segmentIngredients(ingredientsText, flags);
  const additivesCount = flags.filter((f) => f.category === 'additive').length;
  const fodmapCount    = flags.filter((f) => f.category === 'fodmap').length;

  return { digestiveScore: score, digestiveLevel, flags, positives, segments, additivesCount, fodmapCount };
}
