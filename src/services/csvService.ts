import { Food, Meal, MealItem } from '../types';
import { JournalEntry } from '../data/weeklyStats';
import { SymptomEntry } from '../types/symptoms';

// ── CSV helpers ───────────────────────────────────────────────

const SEP = ';';
const BOM = '﻿';
const CRLF = '\r\n';

function esc(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  // wrap in quotes if contains separator, quote or newline
  if (s.includes(SEP) || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cols: (string | number | undefined | null)[]): string {
  return cols.map(esc).join(SEP) + CRLF;
}

// ── Export journal ────────────────────────────────────────────

export function exportJournalCSV(journal: JournalEntry[]): string {
  const header = row('date', 'repas', 'aliment', 'quantite_g', 'kcal', 'proteines_g', 'glucides_g', 'lipides_g', 'fibres_g');
  const lines: string[] = [BOM + header];

  for (const entry of journal) {
    for (const meal of entry.meals) {
      for (const item of meal.items) {
        lines.push(row(
          entry.date,
          meal.name,
          item.name,
          item.portionNum ?? '',
          Math.round(item.kcal),
          item.macros.protein.toFixed(1),
          item.macros.carbs.toFixed(1),
          item.macros.fat.toFixed(1),
          '',
        ));
      }
    }
  }

  return lines.join('');
}

// ── Export symptoms ───────────────────────────────────────────

export function exportSymptomsCSV(symptoms: SymptomEntry[]): string {
  const header = row(
    'date',
    'douleurs_abdominales',
    'ballonnements',
    'energie',
    'transit',
    'sommeil_qualite',
    'inflammation',
    'sommeil_duree_h',
  );
  const lines: string[] = [BOM + header];

  for (const entry of symptoms) {
    const s = entry.scores;
    lines.push(row(
      entry.date,
      s.abdominal >= 0 ? s.abdominal : '',
      s.bloating >= 0 ? s.bloating : '',
      s.energy >= 0 ? s.energy : '',
      s.transit >= 0 ? s.transit : '',
      s.sleep >= 0 ? s.sleep : '',
      s.inflammation >= 0 ? s.inflammation : '',
      entry.sleepDuration ?? '',
    ));
  }

  return lines.join('');
}

// ── Export foods ──────────────────────────────────────────────

export function exportFoodsCSV(foods: Food[]): string {
  const header = row('nom', 'kcal_100g', 'proteines_g', 'glucides_g', 'lipides_g', 'fibres_g', 'fodmap_niveau', 'allergenes', 'source');
  const lines: string[] = [BOM + header];

  for (const food of foods) {
    const allergenList = food.allergens
      .filter((a) => a.status === 'contains' || a.status === 'trace')
      .map((a) => `${a.name}${a.status === 'trace' ? '(traces)' : ''}`)
      .join('|');

    const source = food.id.startsWith('ciqual-')
      ? 'CIQUAL'
      : food.id.startsWith('off-')
      ? 'OpenFoodFacts'
      : food.id.startsWith('gen-') || food.id.startsWith('ai-')
      ? 'IA'
      : 'Manuel';

    lines.push(row(
      food.name,
      Math.round(food.per100.kcal),
      food.per100.protein.toFixed(1),
      food.per100.carbs.toFixed(1),
      food.per100.fat.toFixed(1),
      (food.per100.fiber ?? 0).toFixed(1),
      food.fodmap?.overall ?? '',
      allergenList,
      source,
    ));
  }

  return lines.join('');
}

// ── Import journal ────────────────────────────────────────────

export interface ImportJournalResult {
  entries: JournalEntry[];
  importedCount: number;
  createdFoodsCount: number;
  ignoredCount: number;
}

function parseCsvRows(csv: string): string[][] {
  // Remove BOM
  const content = csv.startsWith(BOM) ? csv.slice(1) : csv;
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === SEP && !inQuotes) {
        cells.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  });
}

export function importJournalCSV(
  csv: string,
  existingFoods: Food[],
): ImportJournalResult {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return { entries: [], importedCount: 0, createdFoodsCount: 0, ignoredCount: 0 };

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const idxDate    = header.indexOf('date');
  const idxRepas   = header.indexOf('repas');
  const idxAliment = header.indexOf('aliment');
  const idxQty     = header.indexOf('quantite_g');
  const idxKcal    = header.indexOf('kcal');
  const idxProt    = header.indexOf('proteines_g');
  const idxGluc    = header.indexOf('glucides_g');
  const idxLip     = header.indexOf('lipides_g');

  if (idxDate < 0 || idxRepas < 0 || idxAliment < 0) {
    return { entries: [], importedCount: 0, createdFoodsCount: 0, ignoredCount: rows.length - 1 };
  }

  const foodByName = new Map(existingFoods.map((f) => [f.name.toLowerCase(), f]));
  const entriesMap = new Map<string, JournalEntry>();
  let importedCount = 0;
  let ignoredCount = 0;
  const createdFoodNames = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const date    = cols[idxDate]?.trim();
    const repas   = cols[idxRepas]?.trim();
    const aliment = cols[idxAliment]?.trim();

    if (!date || !repas || !aliment) { ignoredCount++; continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { ignoredCount++; continue; }

    const qty     = parseFloat(cols[idxQty] ?? '') || undefined;
    const kcal    = parseFloat(cols[idxKcal] ?? '') || 0;
    const protein = parseFloat(cols[idxProt] ?? '') || 0;
    const carbs   = parseFloat(cols[idxGluc] ?? '') || 0;
    const fat     = parseFloat(cols[idxLip] ?? '') || 0;

    const foodRef = foodByName.get(aliment.toLowerCase());
    if (!foodRef) createdFoodNames.add(aliment);

    const item: MealItem = {
      name: aliment,
      qty: qty ? `${qty} g` : '1 portion',
      kcal,
      macros: { protein, carbs, fat },
      foodId: foodRef?.id,
      portionNum: qty,
    };

    if (!entriesMap.has(date)) {
      entriesMap.set(date, {
        date,
        meals: [
          { id: 'breakfast', name: 'Petit-déjeuner', time: '07:30', items: [] },
          { id: 'lunch',     name: 'Déjeuner',       time: '12:30', items: [] },
          { id: 'dinner',    name: 'Dîner',           time: '19:30', items: [] },
          { id: 'snack',     name: 'Collation',       time: '10:00', items: [] },
        ],
      });
    }

    const entry = entriesMap.get(date)!;
    const mealId = repas.toLowerCase().includes('déjeuner') && repas.toLowerCase().includes('petit')
      ? 'breakfast'
      : repas.toLowerCase().includes('déjeuner')
      ? 'lunch'
      : repas.toLowerCase().includes('dîner') || repas.toLowerCase().includes('diner') || repas.toLowerCase().includes('souper')
      ? 'dinner'
      : 'snack';

    const meal = entry.meals.find((m) => m.id === mealId);
    if (meal) { meal.items.push(item); importedCount++; }
    else { ignoredCount++; }
  }

  return {
    entries: [...entriesMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    importedCount,
    createdFoodsCount: createdFoodNames.size,
    ignoredCount,
  };
}
