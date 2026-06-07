/**
 * importJournal.ts — Import d'un journal journalier depuis un fichier JSON
 * généré par Claude Chat ou un autre outil externe.
 */
import { Meal, MealItem } from '../types';
import { JournalEntry, EMPTY_DAY_MEALS } from '../data/weeklyStats';
import { SymptomEntry, SymptomScores, UNSET_SCORES, SymptomKey } from '../types/symptoms';
import { UserTimelineEvent, QuickSymptomKey } from '../types/timeline';
import { searchCIQUAL, ciqualToFood } from '../services/ciqual';

// ── Types JSON d'entrée ─────────────────────────────────────────

interface ImportAliment {
  nom: string;
  quantite: number;
  unite: string;
  source: 'ciqual' | 'generique' | string;
}

interface ImportRepas {
  moment: string;
  heure?: string;
  aliments: ImportAliment[];
}

interface ImportSymptome {
  heure: string;
  type: string;
  intensite: number;
  note?: string;
}

interface ImportBienEtre {
  energie?: number;
  humeur?: number;
  stress?: number;
  sommeil_h?: number;
  note?: string;
}

interface ImportActivite {
  type: string;
  duree_min?: number;
  heure?: string;
  intensite?: string;
}

export interface ImportJournalFile {
  nutritor_import: true;
  version: '1.0';
  date: string;
  repas?: ImportRepas[];
  symptomes?: ImportSymptome[];
  bien_etre?: ImportBienEtre;
  activite?: ImportActivite[];
}

export interface ImportJournalResult {
  importes: number;
  non_trouves: string[];
  erreurs: string[];
  date: string;
  repasCount: number;
}

// ── Mapping moment → id de repas ───────────────────────────────

const MOMENT_TO_MEAL_ID: Record<string, string> = {
  'petit-déjeuner':    'm-brk',
  'petit dejeuner':    'm-brk',
  'petitdéjeuner':     'm-brk',
  'breakfast':         'm-brk',
  'encas matin':       'm-sn1',
  'collation matin':   'm-sn1',
  'snack matin':       'm-sn1',
  'déjeuner':          'm-lun',
  'dejeuner':          'm-lun',
  'lunch':             'm-lun',
  'encas après-midi':  'm-sn2',
  'encas apres-midi':  'm-sn2',
  'collation':         'm-sn2',
  'goûter':            'm-sn2',
  'gouter':            'm-sn2',
  'dîner':             'm-din',
  'diner':             'm-din',
  'souper':            'm-din',
  'dinner':            'm-din',
};

function resolveRepasId(moment: string): string {
  const key = moment.toLowerCase().trim();
  return MOMENT_TO_MEAL_ID[key] ?? 'm-lun';
}

// ── Mapping type symptôme → QuickSymptomKey ────────────────────

const SYMPTOM_TYPE_MAP: Record<string, QuickSymptomKey> = {
  'ballonnements':            'bloating',
  'ballonnement':             'bloating',
  'nausée':                   'nausea',
  'nausées':                  'nausea',
  'nausee':                   'nausea',
  'douleur':                  'pain',
  'douleurs':                 'pain',
  'douleurs abdominales':     'pain',
  'crampes':                  'pain',
  'fatigue':                  'fatigue',
  'énergie':                  'energy',
  'energie':                  'energy',
  'bien':                     'good',
  'bien-être':                'good',
  'bien-etre':                'good',
  'soif':                     'thirst',
  'chaleur':                  'heat',
  'transit':                  'transit',
};

function resolveSymptomKey(type: string): QuickSymptomKey {
  const key = type.toLowerCase().trim();
  return SYMPTOM_TYPE_MAP[key] ?? 'pain';
}

// ── Mapping bien_etre → SymptomScores ──────────────────────────

function mapBienEtreToScores(be: ImportBienEtre): Partial<Record<SymptomKey, number>> {
  const scores: Partial<Record<SymptomKey, number>> = {};

  // energie 1–5 → energy 0–4
  if (be.energie !== undefined) {
    scores.energy = Math.min(4, Math.max(0, Math.round(be.energie - 1)));
  }
  // stress 1–5 → inflammation 0–4 (inverse : stress élevé = inflammation perçue élevée)
  if (be.stress !== undefined) {
    scores.inflammation = Math.min(4, Math.max(0, Math.round(be.stress - 1)));
  }

  return scores;
}

// ── Création d'un MealItem générique ───────────────────────────

function buildGenericMealItem(alim: ImportAliment): MealItem {
  return {
    name: alim.nom,
    qty: `${alim.quantite} ${alim.unite}`,
    kcal: 0,
    macros: { protein: 0, carbs: 0, fat: 0 },
  };
}

// ── Création d'un MealItem depuis CIQUAL ───────────────────────

function buildCiqualMealItem(alim: ImportAliment): { item: MealItem; found: boolean } {
  const results = searchCIQUAL(alim.nom, 1);
  if (results.length === 0) {
    return { item: buildGenericMealItem(alim), found: false };
  }
  const entry = results[0];
  const food = ciqualToFood(entry);

  // Calcul macros pour la quantité donnée (supposée en grammes si unite = g)
  const isGrams = ['g', 'gr', 'grammes', 'gramme'].includes(alim.unite.toLowerCase());
  const ratio = isGrams ? alim.quantite / 100 : 1;

  return {
    item: {
      name: alim.nom,
      qty: `${alim.quantite} ${alim.unite}`,
      kcal: Math.round(food.per100.kcal * ratio),
      macros: {
        protein: Math.round(food.per100.protein * ratio * 10) / 10,
        carbs:   Math.round(food.per100.carbs   * ratio * 10) / 10,
        fat:     Math.round(food.per100.fat     * ratio * 10) / 10,
      },
      foodId: food.id,
      portionNum: alim.quantite,
      unit: alim.unite,
    },
    found: true,
  };
}

// ── Fonction principale ─────────────────────────────────────────

export function importJournalJSON(
  fileContent: string,
  existingJournal: JournalEntry[],
  existingSymptoms: SymptomEntry[],
  existingTimelineEvents: Record<string, UserTimelineEvent[]>,
): {
  result: ImportJournalResult;
  journalUpdate: JournalEntry;
  symptomUpdate: SymptomEntry | null;
  timelineUpdate: UserTimelineEvent[];
  conflictExists: boolean;
} {
  // Supprime les marqueurs markdown (```json ... ```) si l'utilisateur copie depuis Claude
  const cleaned = fileContent.trim().replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('JSON invalide — impossible de parser le contenu.');
  }

  const data = parsed as Partial<ImportJournalFile>;

  if (data.nutritor_import !== true) {
    throw new Error('Ce fichier n\'est pas un export Nutritor valide (nutritor_import: true manquant).');
  }
  if (data.version !== '1.0') {
    throw new Error(`Version non supportée : "${data.version}". Seule la version "1.0" est supportée.`);
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('Champ "date" manquant ou invalide (format attendu : YYYY-MM-DD).');
  }

  const date = data.date;
  const non_trouves: string[] = [];
  const erreurs: string[] = [];
  let importes = 0;

  // ── Repas ───────────────────────────────────────────────────
  const baseMeals: Meal[] = EMPTY_DAY_MEALS.map((m) => ({ ...m, items: [] }));
  const mealMap = new Map(baseMeals.map((m) => [m.id, m]));

  for (const repas of data.repas ?? []) {
    const mealId = resolveRepasId(repas.moment);
    const meal = mealMap.get(mealId);
    if (!meal) continue;

    if (repas.heure) meal.time = repas.heure;

    for (const alim of repas.aliments ?? []) {
      try {
        if (alim.source === 'ciqual') {
          const { item, found } = buildCiqualMealItem(alim);
          if (!found) non_trouves.push(alim.nom);
          meal.items.push(item);
          importes++;
        } else {
          meal.items.push(buildGenericMealItem(alim));
          importes++;
        }
      } catch {
        erreurs.push(alim.nom);
      }
    }
  }

  const journalUpdate: JournalEntry = {
    date,
    meals: [...mealMap.values()],
  };

  // ── Symptômes ───────────────────────────────────────────────
  let symptomUpdate: SymptomEntry | null = null;
  const existingSymptom = existingSymptoms.find((e) => e.date === date);
  const baseScores: SymptomScores = { ...(existingSymptom?.scores ?? UNSET_SCORES) };

  if (data.bien_etre) {
    const mapped = mapBienEtreToScores(data.bien_etre);
    for (const [k, v] of Object.entries(mapped) as [SymptomKey, number][]) {
      baseScores[k] = v;
    }
    const entry: SymptomEntry = { date, scores: baseScores };
    if (data.bien_etre.sommeil_h !== undefined) {
      entry.sleepDuration = Math.min(12, Math.max(4, data.bien_etre.sommeil_h));
    }
    symptomUpdate = entry;
  }

  // ── Timeline events pour symptômes ponctuels ────────────────
  const newTimelineEvents: UserTimelineEvent[] = [];
  for (const symp of data.symptomes ?? []) {
    const symptomKey = resolveSymptomKey(symp.type);
    const id = `ute-import-${date}-${symp.heure}-${symptomKey}`;
    newTimelineEvents.push({
      kind: 'user',
      id,
      date,
      time: symp.heure,
      symptom: symptomKey,
      severity: Math.min(5, Math.max(1, symp.intensite)),
      note: symp.note,
    });
  }

  // Activités → timeline events (emoji 🏃)
  for (const act of data.activite ?? []) {
    if (!act.heure) continue;
    const id = `ute-import-act-${date}-${act.heure}-${act.type}`;
    const label = act.duree_min
      ? `${act.type} · ${act.duree_min} min`
      : act.type;
    newTimelineEvents.push({
      kind: 'user',
      id,
      date,
      time: act.heure,
      symptom: 'energy',
      severity: 4,
      note: label,
    });
  }

  const conflictExists = existingJournal.some(
    (e) => e.date === date && e.meals.some((m) => m.items.length > 0),
  );

  const repasCount = (data.repas ?? []).length;

  return {
    result: { importes, non_trouves, erreurs, date, repasCount },
    journalUpdate,
    symptomUpdate,
    timelineUpdate: newTimelineEvents,
    conflictExists,
  };
}

/**
 * Fusionne un JournalEntry importé avec l'existant (ajoute les items sans écraser).
 */
export function mergeJournalEntries(
  existing: JournalEntry,
  imported: JournalEntry,
): JournalEntry {
  const merged = existing.meals.map((meal) => {
    const importedMeal = imported.meals.find((m) => m.id === meal.id);
    if (!importedMeal || importedMeal.items.length === 0) return meal;
    return { ...meal, items: [...meal.items, ...importedMeal.items] };
  });
  return { date: existing.date, meals: merged };
}
