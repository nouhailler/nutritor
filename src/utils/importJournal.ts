/**
 * importJournal.ts — Import d'un journal journalier depuis un fichier JSON
 * généré par Claude Chat ou un autre outil externe.
 *
 * Chaîne de priorité pour chaque aliment :
 *  1. Aliment existant dans la bibliothèque Nutritor (matching par nom)
 *  2. Valeurs per100 embarquées dans le JSON → crée la fiche aliment
 *  3. Valeurs par portion legacy (kcal, proteines…) → crée une fiche minimale
 *  4. Recherche CIQUAL → crée la fiche aliment
 *  5. Générique 0 kcal
 */
import { Food, Meal, MealItem } from '../types';
import { JournalEntry, EMPTY_DAY_MEALS } from '../data/weeklyStats';
import { SymptomEntry, SymptomScores, UNSET_SCORES, SymptomKey } from '../types/symptoms';
import { UserTimelineEvent, QuickSymptomKey } from '../types/timeline';
import { searchCIQUAL, ciqualToFood } from '../services/ciqual';

// ── Types JSON d'entrée ─────────────────────────────────────────

interface ImportPer100 {
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres?: number;
}

interface ImportAliment {
  nom: string;
  quantite: number;
  unite: string;
  source: 'ciqual' | 'generique' | 'claude' | string;
  // Per-100g (format préféré — permet de créer la fiche aliment)
  per100?: ImportPer100;
  // Poids total en grammes de la quantité indiquée (utile pour les unités non-grammes)
  poids_g?: number;
  // Valeurs par portion (format legacy, encore supporté)
  kcal?: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
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
  if (be.energie !== undefined) {
    scores.energy = Math.min(4, Math.max(0, Math.round(be.energie - 1)));
  }
  if (be.stress !== undefined) {
    scores.inflammation = Math.min(4, Math.max(0, Math.round(be.stress - 1)));
  }
  return scores;
}

// ── Création d'une fiche Food depuis des données per100 ─────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function buildFoodFromPer100(alim: ImportAliment, per100: ImportPer100): Food {
  const isGrams = ['g', 'gr', 'grammes', 'gramme'].includes(alim.unite.toLowerCase());
  return {
    id: `import-${slugify(alim.nom)}`,
    category: 'Importé',
    name: alim.nom,
    subtitle: 'Importé depuis Claude',
    brand: 'Claude IA',
    defaultPortion: isGrams ? 100 : alim.quantite,
    unit: isGrams ? 'g' : alim.unite,
    per100: {
      kcal:    per100.kcal,
      protein: per100.proteines,
      carbs:   per100.glucides,
      fat:     per100.lipides,
      fatSat:  0,
      sugars:  0,
      fiber:   per100.fibres ?? 0,
      salt:    0,
    },
    allergens: [],
    compat: [],
    ingredients: alim.nom,
  };
}

// ── Résolution d'un aliment (chaîne de priorité) ───────────────

function resolveAliment(
  alim: ImportAliment,
  existingFoods: Food[],
): { item: MealItem; found: boolean; foodToAdd?: Food } {
  const normName = alim.nom.toLowerCase().trim();
  const isGrams = ['g', 'gr', 'grammes', 'gramme'].includes(alim.unite.toLowerCase());

  // Ratio de base pour les unités en grammes
  const gramsRatio = (poids: number) => poids / 100;

  // ── Priorité 1 : aliment existant dans Nutritor ────────────────
  const existing = existingFoods.find((f) => f.name.toLowerCase().trim() === normName);
  if (existing) {
    const totalGrams = alim.poids_g ?? (isGrams ? alim.quantite : null);
    const ratio = totalGrams !== null ? gramsRatio(totalGrams) : 1;
    return {
      item: {
        name: alim.nom,
        qty: `${alim.quantite} ${alim.unite}`,
        kcal: Math.round(existing.per100.kcal * ratio),
        macros: {
          protein: Math.round(existing.per100.protein * ratio * 10) / 10,
          carbs:   Math.round(existing.per100.carbs   * ratio * 10) / 10,
          fat:     Math.round(existing.per100.fat     * ratio * 10) / 10,
        },
        foodId: existing.id,
        portionNum: alim.quantite,
        unit: alim.unite,
      },
      found: true,
    };
  }

  // ── Priorité 2 : per100 embarqué dans le JSON ──────────────────
  if (alim.per100) {
    const totalGrams = alim.poids_g ?? (isGrams ? alim.quantite : null);
    const ratio = totalGrams !== null ? gramsRatio(totalGrams) : 1;
    const food = buildFoodFromPer100(alim, alim.per100);
    return {
      item: {
        name: alim.nom,
        qty: `${alim.quantite} ${alim.unite}`,
        kcal: Math.round(alim.per100.kcal * ratio),
        macros: {
          protein: Math.round(alim.per100.proteines * ratio * 10) / 10,
          carbs:   Math.round(alim.per100.glucides  * ratio * 10) / 10,
          fat:     Math.round(alim.per100.lipides   * ratio * 10) / 10,
        },
        foodId: food.id,
        portionNum: alim.quantite,
        unit: alim.unite,
      },
      found: true,
      foodToAdd: food,
    };
  }

  // ── Priorité 3 : valeurs par portion legacy ────────────────────
  if (alim.kcal !== undefined) {
    return {
      item: {
        name: alim.nom,
        qty: `${alim.quantite} ${alim.unite}`,
        kcal: Math.round(alim.kcal),
        macros: {
          protein: Math.round((alim.proteines ?? 0) * 10) / 10,
          carbs:   Math.round((alim.glucides  ?? 0) * 10) / 10,
          fat:     Math.round((alim.lipides   ?? 0) * 10) / 10,
        },
        portionNum: alim.quantite,
        unit: alim.unite,
      },
      found: true,
    };
  }

  // ── Priorité 4 : recherche CIQUAL ─────────────────────────────
  const results = searchCIQUAL(alim.nom, 1);
  if (results.length > 0) {
    const food = ciqualToFood(results[0]);
    const totalGrams = alim.poids_g ?? (isGrams ? alim.quantite : null);
    const ratio = totalGrams !== null ? gramsRatio(totalGrams) : 1;
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
      foodToAdd: food,
    };
  }

  // ── Priorité 5 : générique 0 kcal ─────────────────────────────
  return {
    item: {
      name: alim.nom,
      qty: `${alim.quantite} ${alim.unite}`,
      kcal: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
    },
    found: false,
  };
}

// ── Fonction principale ─────────────────────────────────────────

export function importJournalJSON(
  fileContent: string,
  existingJournal: JournalEntry[],
  existingSymptoms: SymptomEntry[],
  existingTimelineEvents: Record<string, UserTimelineEvent[]>,
  existingFoodList: Food[] = [],
): {
  result: ImportJournalResult;
  journalUpdate: JournalEntry;
  symptomUpdate: SymptomEntry | null;
  timelineUpdate: UserTimelineEvent[];
  newFoods: Food[];
  conflictExists: boolean;
} {
  // Supprime les marqueurs markdown (```json ... ```) si copiés depuis Claude
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
  const newFoodsMap = new Map<string, Food>(); // dédoublonnage par id

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
        const { item, found, foodToAdd } = resolveAliment(alim, existingFoodList);
        meal.items.push(item);
        importes++;
        if (!found) non_trouves.push(alim.nom);
        if (foodToAdd && !newFoodsMap.has(foodToAdd.id)) {
          // N'ajoute que si l'aliment n'est pas déjà dans la bibliothèque
          const alreadyExists = existingFoodList.some((f) => f.id === foodToAdd.id);
          if (!alreadyExists) newFoodsMap.set(foodToAdd.id, foodToAdd);
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

  // ── Timeline events ────────────────────────────────────────
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

  for (const act of data.activite ?? []) {
    if (!act.heure) continue;
    const id = `ute-import-act-${date}-${act.heure}-${act.type}`;
    const label = act.duree_min ? `${act.type} · ${act.duree_min} min` : act.type;
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
    newFoods: [...newFoodsMap.values()],
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
