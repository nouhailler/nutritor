/**
 * Moteur de corrélation aliment → symptômes.
 * Analyse les 30 derniers jours : pour chaque facteur alimentaire (type FODMAP,
 * macros élevés, présence d'allergènes courants), calcule si les symptômes sont
 * significativement différents les jours avec vs sans ce facteur.
 */

import { JournalEntry } from '../data/weeklyStats';
import { SymptomEntry, SYMPTOM_CONFIG, SymptomKey } from '../types/symptoms';

// ── Types ─────────────────────────────────────────────────────

export interface CorrelationResult {
  factor: string;           // "Polyols", "Lactose", "Aliments gras"
  symptomKey: SymptomKey;
  symptomLabel: string;     // "Ballonnements"
  direction: 'increases' | 'decreases';  // le symptôme augmente ou diminue avec le facteur
  strength: 'faible' | 'modérée' | 'forte';
  label: string;            // phrase lisible
  daysWithFactor: number;
  avgWith: number;
  avgWithout: number;
}

// ── Keyword lists per food factor ─────────────────────────────

const FACTOR_KEYWORDS: Record<string, string[]> = {
  'Polyols': [
    'sorbitol', 'mannitol', 'xylitol', 'champignon', 'chou-fleur', 'avoca',
    'pomme', 'poire', 'prune', 'cerise', 'abricot', 'pastèque', 'polyol',
  ],
  'Fructanes': [
    'blé', 'pain', 'pâtes', 'spaghetti', 'pizza', 'couscous',
    'oignon', 'ail', 'poireau', 'asperge', 'artichaut', 'seigle', 'orge',
    'biscuit', 'gâteau', 'farine',
  ],
  'Lactose': [
    'lait', 'yaourt', 'fromage frais', 'petit-suisse', 'crème fraîche',
    'glace', 'lactose', 'laitier', 'ricotta', 'mascarpone',
  ],
  'Fructose en excès': [
    'miel', 'fructose', 'mangue', 'pomme', 'poire', 'sirop d\'agave',
    'jus de fruit', 'sirop',
  ],
  'GOS (légumineuses)': [
    'lentille', 'pois chiche', 'haricot', 'légumineuse', 'soja',
    'fève', 'edamame', 'tempeh',
  ],
  'Gluten': [
    'blé', 'pain', 'pâtes', 'spaghetti', 'pizza', 'seigle', 'orge',
    'farine', 'biscuit', 'gâteau', 'brioche', 'croissant',
  ],
  'Histamine': [
    'fromage affiné', 'charcuterie', 'vin', 'bière', 'thon',
    'sardine', 'maquereau', 'saumon fumé', 'tomate', 'épinard',
    'aubergine', 'fraise', 'chocolat', 'sauce soja', 'vinaigre',
  ],
  'Aliments gras': [
    'friture', 'frites', 'beurre', 'crème', 'fromage',
    'charcuterie', 'saucisse', 'bacon', 'pizza', 'hamburger',
  ],
  'Caféine': [
    'café', 'espresso', 'cappuccino', 'latte', 'thé noir', 'thé vert',
    'cola', 'energy drink', 'caféine',
  ],
  'Alcool': [
    'vin', 'bière', 'whisky', 'rhum', 'vodka', 'champagne',
    'alcool', 'apéritif', 'cocktail',
  ],
};

// ── Helpers ───────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function dayHasFactor(entry: JournalEntry, keywords: string[]): boolean {
  const text = entry.meals
    .flatMap((m) => m.items.map((i) => i.name))
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const normalizedKw = keywords.map((kw) =>
    kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  );
  return normalizedKw.some((kw) => text.includes(kw));
}

// Effective "badness" score for a symptom (0 = perfect, 4 = worst)
function badnessScore(key: SymptomKey, score: number): number {
  const cfg = SYMPTOM_CONFIG[key];
  if (score < 0) return -1;
  if (cfg.inverse === null) return Math.abs(score - 2); // transit: 0 = ok, 2 = bad
  if (cfg.inverse) return score;                        // abdominal, bloating, inflammation
  return 4 - score;                                     // energy, sleep: inverse
}

// ── Main export ───────────────────────────────────────────────

export function computeCorrelations(
  journal: JournalEntry[],
  symptoms: SymptomEntry[],
  windowDays = 30,
): CorrelationResult[] {
  const today = new Date().toISOString().slice(0, 10);

  // Build window: last N days (excluding today for completeness)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentJournal = journal.filter(
    (e) => e.date >= cutoffStr && e.date < today,
  );

  if (recentJournal.length < 6) return [];

  const results: CorrelationResult[] = [];

  for (const [factorName, keywords] of Object.entries(FACTOR_KEYWORDS)) {
    const withFactor: JournalEntry[] = [];
    const withoutFactor: JournalEntry[] = [];

    for (const entry of recentJournal) {
      if (dayHasFactor(entry, keywords)) {
        withFactor.push(entry);
      } else {
        withoutFactor.push(entry);
      }
    }

    // Need enough contrast in both groups
    if (withFactor.length < 3 || withoutFactor.length < 3) continue;

    for (const symKey of ['abdominal', 'bloating', 'energy', 'transit', 'sleep', 'inflammation'] as SymptomKey[]) {
      // Collect badness scores, including same-day AND next-day (lag effect)
      const scoresWithFactor: number[] = [];
      const scoresWithout: number[] = [];

      for (const entry of withFactor) {
        // Same-day symptoms
        const sameDaySym = symptoms.find((s) => s.date === entry.date);
        if (sameDaySym && sameDaySym.scores[symKey] >= 0) {
          scoresWithFactor.push(badnessScore(symKey, sameDaySym.scores[symKey]));
        }
        // Next-day symptoms (lag)
        const nextDate = new Date(entry.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextStr = nextDate.toISOString().slice(0, 10);
        const nextSym = symptoms.find((s) => s.date === nextStr);
        if (nextSym && nextSym.scores[symKey] >= 0) {
          scoresWithFactor.push(badnessScore(symKey, nextSym.scores[symKey]));
        }
      }

      for (const entry of withoutFactor) {
        const sym = symptoms.find((s) => s.date === entry.date);
        if (sym && sym.scores[symKey] >= 0) {
          scoresWithout.push(badnessScore(symKey, sym.scores[symKey]));
        }
      }

      if (scoresWithFactor.length < 3 || scoresWithout.length < 3) continue;

      const avgWith    = avg(scoresWithFactor);
      const avgWithout = avg(scoresWithout);
      const diff       = avgWith - avgWithout;
      const absDiff    = Math.abs(diff);

      // Minimum threshold to avoid noise
      const minAbsDiff = symKey === 'transit' ? 0.5 : 0.7;
      if (absDiff < minAbsDiff) continue;
      // Also require the "with factor" score to be non-trivial
      if (avgWith < 0.5 && diff > 0) continue;

      const strength: CorrelationResult['strength'] =
        absDiff >= 1.8 ? 'forte' : absDiff >= 1.1 ? 'modérée' : 'faible';
      const direction: CorrelationResult['direction'] = diff > 0 ? 'increases' : 'decreases';
      const symLabel = SYMPTOM_CONFIG[symKey].label;

      let label: string;
      if (direction === 'increases') {
        label = `${symLabel} aggravés les jours avec ${factorName.toLowerCase()}`;
      } else {
        label = `${symLabel} améliorés les jours avec ${factorName.toLowerCase()}`;
      }

      results.push({
        factor: factorName,
        symptomKey: symKey,
        symptomLabel: symLabel,
        direction,
        strength,
        label,
        daysWithFactor: withFactor.length,
        avgWith: Math.round(avgWith * 10) / 10,
        avgWithout: Math.round(avgWithout * 10) / 10,
      });
    }
  }

  // Sort: forte first, then modérée, deduplicate same symptom/direction
  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = `${r.symptomKey}-${r.factor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const order = { forte: 0, modérée: 1, faible: 2 };
      return order[a.strength] - order[b.strength];
    })
    .slice(0, 10); // top 10 correlations max
}
