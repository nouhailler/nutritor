import { JournalEntry } from './weeklyStats';
import { SymptomEntry, SymptomKey, SYMPTOM_KEYS, SYMPTOM_CONFIG } from '../types/symptoms';
import { Food } from '../types';

// ── Food profile for one day ──────────────────────────────────

export interface DayFoodProfile {
  date: string;
  kcal: number;
  fat: number;       // g
  protein: number;   // g
  carbs: number;     // g
  // allergens detected via name-match with foodList (best-effort)
  lactose: boolean;
  gluten: boolean;
  eggs: boolean;
  fish: boolean;
  // FODMAP high (food.fodmap.overall === 'high')
  highFodmap: boolean;
  // Simple category heuristics when allergen data unavailable
  dairyLikely: boolean;
  cerealLikely: boolean;
  legumeLikely: boolean;
}

const DAIRY_KEYWORDS  = ['lait', 'yaourt', 'fromage', 'crème', 'beurre', 'lacto', 'dairy', 'milk', 'cream', 'cheese', 'yogurt'];
const CEREAL_KEYWORDS = ['pain', 'blé', 'farine', 'pâtes', 'riz', 'céréale', 'wheat', 'bread', 'pasta', 'oat', 'avoine', 'seigle'];
const LEGUME_KEYWORDS = ['haricot', 'lentille', 'pois', 'fève', 'soja', 'bean', 'lentil', 'chickpea', 'pois chiche', 'tofu'];

function matchesKeywords(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function buildDayProfile(
  meals: JournalEntry['meals'],
  foodList: Food[],
): Omit<DayFoodProfile, 'date'> {
  let kcal = 0, fat = 0, protein = 0, carbs = 0;
  let lactose = false, gluten = false, eggs = false, fish = false;
  let highFodmap = false;
  let dairyLikely = false, cerealLikely = false, legumeLikely = false;

  const foodMap = new Map<string, Food>(
    foodList.map((f) => [f.name.toLowerCase().trim(), f]),
  );

  for (const meal of meals) {
    for (const item of meal.items) {
      kcal    += item.kcal;
      fat     += item.macros?.fat     ?? 0;
      protein += item.macros?.protein ?? 0;
      carbs   += item.macros?.carbs   ?? 0;

      const food = foodMap.get(item.name.toLowerCase().trim());
      if (food) {
        const allergenMap = Object.fromEntries(food.allergens.map((a) => [a.name, a.status]));
        if (allergenMap['Lactose'] === 'contains') lactose = true;
        if (allergenMap['Gluten']  === 'contains') gluten  = true;
        if (allergenMap['Œufs']    === 'contains') eggs    = true;
        if (allergenMap['Poisson'] === 'contains') fish    = true;
        if (food.fodmap?.overall === 'high')        highFodmap = true;
      } else {
        // Fallback: keyword heuristics on item name
        if (matchesKeywords(item.name, DAIRY_KEYWORDS))  { dairyLikely = true; lactose = true; }
        if (matchesKeywords(item.name, CEREAL_KEYWORDS)) { cerealLikely = true; gluten = true; }
        if (matchesKeywords(item.name, LEGUME_KEYWORDS)) legumeLikely = true;
      }

      // Category heuristics always applied
      if (matchesKeywords(item.name, DAIRY_KEYWORDS))  dairyLikely  = true;
      if (matchesKeywords(item.name, CEREAL_KEYWORDS)) cerealLikely = true;
      if (matchesKeywords(item.name, LEGUME_KEYWORDS)) legumeLikely = true;
    }
  }

  return {
    kcal:         Math.round(kcal),
    fat:          Math.round(fat  * 10) / 10,
    protein:      Math.round(protein * 10) / 10,
    carbs:        Math.round(carbs * 10) / 10,
    lactose, gluten, eggs, fish, highFodmap,
    dairyLikely, cerealLikely, legumeLikely,
  };
}

// ── "Bad day" threshold per symptom ──────────────────────────

function isBadDay(key: SymptomKey, score: number): boolean {
  const cfg = SYMPTOM_CONFIG[key];
  if (cfg.inverse === null) return score <= 0 || score >= 4;   // transit
  if (cfg.inverse)          return score >= 3;                  // pain, bloating, inflam.
  return score <= 1;                                            // energy, sleep
}

function isGoodDay(key: SymptomKey, score: number): boolean {
  const cfg = SYMPTOM_CONFIG[key];
  if (cfg.inverse === null) return score === 2;
  if (cfg.inverse)          return score <= 1;
  return score >= 3;
}

// ── Correlation insight ───────────────────────────────────────

export interface CorrelationInsight {
  symptom: SymptomKey;
  component: string;        // 'lactose', 'graisses élevées', …
  message: string;          // insight lisible
  tone: 'warn' | 'mid';
  daysAnalyzed: number;
  confidence: 'faible' | 'modérée' | 'élevée';
}

const MIN_DAYS = 7;          // min jours conjoints pour calculer
const MIN_SPLIT = 3;         // min jours dans chaque groupe (bon/mauvais)

// ── Main computation ──────────────────────────────────────────

export interface WellnessStats {
  daysWithSymptoms: number;
  daysWithBoth: number;
  recentSymptoms: { date: string; scores: SymptomEntry['scores'] }[];
  insights: CorrelationInsight[];
  needsMoreData: boolean;    // true si < MIN_DAYS jours conjoints
  daysUntilCorrelations: number;
}

export function computeWellnessStats(
  symptoms: SymptomEntry[],
  journal: JournalEntry[],
  foodList: Food[],
): WellnessStats {
  const today = new Date().toISOString().slice(0, 10);

  // Last 60 days (for correlations with sufficient history)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentSymptoms = [...symptoms]
    .filter((e) => e.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // Build joint dataset: days with both symptom & food data
  interface JointDay {
    date: string;
    scores: SymptomEntry['scores'];
    food: Omit<DayFoodProfile, 'date'>;
  }

  const journalMap = new Map<string, JournalEntry['meals']>(
    journal.map((e) => [e.date, e.meals]),
  );

  const jointDays: JointDay[] = [];
  for (const entry of symptoms) {
    if (entry.date < cutoffStr) continue;
    const meals = journalMap.get(entry.date);
    if (!meals) continue;
    const hasFood = meals.some((m) => m.items.length > 0);
    if (!hasFood) continue;
    // Only count symptom entries with at least 2 scores filled
    const filled = SYMPTOM_KEYS.filter((k) => entry.scores[k] >= 0).length;
    if (filled < 2) continue;
    jointDays.push({
      date:   entry.date,
      scores: entry.scores,
      food:   buildDayProfile(meals, foodList),
    });
  }

  const daysWithBoth = jointDays.length;
  const needsMoreData = daysWithBoth < MIN_DAYS;

  const insights: CorrelationInsight[] = [];

  if (!needsMoreData) {
    // Binary components to correlate
    const binaryComponents: { key: keyof Omit<DayFoodProfile, 'date' | 'kcal' | 'fat' | 'protein' | 'carbs'>; label: string }[] = [
      { key: 'lactose',      label: 'lactose' },
      { key: 'gluten',       label: 'gluten' },
      { key: 'eggs',         label: 'œufs' },
      { key: 'fish',         label: 'poisson' },
      { key: 'highFodmap',   label: 'aliments FODMAP élevés' },
      { key: 'dairyLikely',  label: 'produits laitiers' },
      { key: 'cerealLikely', label: 'céréales / pain' },
      { key: 'legumeLikely', label: 'légumineuses' },
    ];

    // Numeric thresholds
    const numericComponents: { key: 'fat' | 'protein' | 'carbs' | 'kcal'; label: string; highThreshold: number }[] = [
      { key: 'fat',     label: 'graisses élevées',  highThreshold: 60 },
      { key: 'carbs',   label: 'glucides élevés',   highThreshold: 250 },
      { key: 'protein', label: 'protéines élevées', highThreshold: 120 },
      { key: 'kcal',    label: 'apport calorique élevé', highThreshold: 2400 },
    ];

    for (const symptomKey of SYMPTOM_KEYS) {
      const badDays  = jointDays.filter((d) => d.scores[symptomKey] >= 0 && isBadDay(symptomKey, d.scores[symptomKey]));
      const goodDays = jointDays.filter((d) => d.scores[symptomKey] >= 0 && isGoodDay(symptomKey, d.scores[symptomKey]));

      if (badDays.length < MIN_SPLIT || goodDays.length < MIN_SPLIT) continue;

      const cfg = SYMPTOM_CONFIG[symptomKey];
      const symptomLabel = cfg.shortLabel.toLowerCase();

      // Binary correlations
      for (const comp of binaryComponents) {
        const pctBad  = badDays.filter((d)  => d.food[comp.key]).length / badDays.length;
        const pctGood = goodDays.filter((d) => d.food[comp.key]).length / goodDays.length;

        // Component appears significantly more on bad days → possible aggravant
        if (pctBad >= 0.55 && pctBad - pctGood >= 0.25) {
          const confidence: CorrelationInsight['confidence'] =
            pctBad - pctGood >= 0.5 ? 'élevée' : pctBad - pctGood >= 0.35 ? 'modérée' : 'faible';

          let message: string;
          if (cfg.inverse === false) {
            // positive symptom worsened (low energy) when component present
            message = `${cfg.label.toLowerCase()} réduite les jours avec ${comp.label}`;
          } else if (cfg.inverse === null) {
            message = `transit perturbé les jours avec ${comp.label}`;
          } else {
            message = `${symptomLabel} accrus après consommation de ${comp.label}`;
          }

          insights.push({
            symptom:       symptomKey,
            component:     comp.label,
            message,
            tone:          'warn',
            daysAnalyzed:  badDays.length + goodDays.length,
            confidence,
          });
        }
      }

      // Numeric correlations
      for (const comp of numericComponents) {
        const avgBad  = badDays.reduce((s, d) => s + d.food[comp.key], 0) / badDays.length;
        const avgGood = goodDays.reduce((s, d) => s + d.food[comp.key], 0) / goodDays.length;

        // Significantly higher on bad days
        if (avgBad > comp.highThreshold && avgGood > 0 && avgBad / avgGood >= 1.35) {
          const confidence: CorrelationInsight['confidence'] =
            avgBad / avgGood >= 1.6 ? 'élevée' : avgBad / avgGood >= 1.45 ? 'modérée' : 'faible';

          let message: string;
          if (cfg.inverse === false) {
            message = `${cfg.label.toLowerCase()} réduite lors des apports élevés en ${comp.label.replace(' élevés', '').replace(' élevée', '')}`;
          } else if (cfg.inverse === null) {
            message = `transit perturbé lors des apports élevés en ${comp.label.replace(' élevés', '').replace(' élevée', '')}`;
          } else {
            message = `${symptomLabel} plus importants lors des journées avec ${comp.label}`;
          }

          insights.push({
            symptom:      symptomKey,
            component:    comp.label,
            message,
            tone:         'mid',
            daysAnalyzed: badDays.length + goodDays.length,
            confidence,
          });
        }
      }
    }

    // Deduplicate: keep strongest per (symptom, component)
    const seen = new Set<string>();
    const deduped: CorrelationInsight[] = [];
    const order = { élevée: 0, modérée: 1, faible: 2 };
    insights.sort((a, b) => order[a.confidence] - order[b.confidence]);
    for (const ins of insights) {
      const key = `${ins.symptom}:${ins.component}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(ins); }
    }
    insights.length = 0;
    insights.push(...deduped.slice(0, 8)); // max 8 insights
  }

  return {
    daysWithSymptoms:       symptoms.filter((e) => e.date <= today).length,
    daysWithBoth,
    recentSymptoms:         recentSymptoms.slice(-14),
    insights,
    needsMoreData,
    daysUntilCorrelations:  Math.max(0, MIN_DAYS - daysWithBoth),
  };
}
