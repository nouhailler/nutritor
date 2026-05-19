import { Meal } from '../types';
import { UserProfile } from '../data/user';
import { AutoTimelineEvent, AutoEventKind } from '../types/timeline';

// ── Time helpers ────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function addMinutes(hhmm: string, delta: number): string {
  const total = parseTime(hhmm) + delta;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Food keyword detection ──────────────────────────────────────

const CAFFEINE_KW = ['café', 'cafe', 'espresso', 'thé', 'the', 'matcha', 'yerba', 'cola', 'energie', 'énergie', 'guarana', 'redbull', 'red bull'];
const HIGH_CARB_KW = ['pain', 'pâtes', 'pates', 'riz', 'pomme de terre', 'céréale', 'cereale', 'baguette', 'brioche', 'croissant', 'jus', 'soda', 'sucre', 'miel', 'confiture', 'sirop', 'gâteau', 'gateau'];
const HIGH_FAT_KW = ['beurre', 'huile', 'fromage', 'crème', 'creme', 'lard', 'bacon', 'avocat', 'noix', 'amande', 'cacahuète', 'cacahuete', 'chocolat'];
const FRUCTANE_KW = ['ail', 'oignon', 'échalote', 'echalote', 'poireau', 'artichaut', 'asperge', 'blé', 'ble', 'seigle'];
const GOS_KW = ['lentille', 'pois chiche', 'haricot', 'fève', 'feve', 'soja'];
const LACTOSE_KW = ['lait', 'yaourt', 'yogourt', 'crème fraîche', 'fromage blanc', 'ricotta', 'mozzarella'];
const FRUCTOSE_KW = ['pomme', 'poire', 'mangue', 'cerise', 'pastèque', 'pasteque', 'miel', 'sirop de maïs', 'sirop d\'agave'];
const POLYOL_KW = ['avocat', 'champignon', 'chou-fleur', 'abricot', 'nectarine', 'prune', 'sorbitol', 'xylitol', 'mannitol'];

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function getMealEmoji(meal: Meal): string {
  const n = meal.name.toLowerCase();
  if (n.includes('café') || n.includes('petit-déj') || n.includes('matin')) return '🌅';
  if (n.includes('déjeuner') || n.includes('midi')) return '🍽️';
  if (n.includes('dîner') || n.includes('soir')) return '🌙';
  if (n.includes('collation') || n.includes('goûter') || n.includes('snack')) return '🍎';
  return '🍴';
}

function detectFodmapType(items: Meal['items']): { detected: boolean; label: string } {
  const allNames = items.map((i) => i.name).join(' ');
  if (matchesAny(allNames, FRUCTANE_KW)) return { detected: true, label: 'Charge fructanes élevée' };
  if (matchesAny(allNames, GOS_KW))      return { detected: true, label: 'Charge GOS élevée' };
  if (matchesAny(allNames, LACTOSE_KW))  return { detected: true, label: 'Charge lactose' };
  if (matchesAny(allNames, FRUCTOSE_KW)) return { detected: true, label: 'Excès fructose' };
  if (matchesAny(allNames, POLYOL_KW))   return { detected: true, label: 'Polyols détectés' };
  return { detected: false, label: '' };
}

// ── Main computation ────────────────────────────────────────────

export function computeAutoEvents(
  meals: Meal[],
  _profile: UserProfile,
): AutoTimelineEvent[] {
  const events: AutoTimelineEvent[] = [];

  for (const meal of meals) {
    if (meal.items.length === 0) continue;

    const time = meal.time || '12:00';
    const kcal = meal.items.reduce((s, i) => s + i.kcal, 0);
    const protein = meal.items.reduce((s, i) => s + (i.macros?.protein ?? 0), 0);
    const carbs = meal.items.reduce((s, i) => s + (i.macros?.carbs ?? 0), 0);
    const fat = meal.items.reduce((s, i) => s + (i.macros?.fat ?? 0), 0);
    const allNames = meal.items.map((i) => i.name).join(' ');

    // Meal event
    events.push({
      kind: 'auto',
      type: 'meal' as AutoEventKind,
      time,
      emoji: getMealEmoji(meal),
      label: meal.name,
      mealId: meal.id,
    });

    // Caffeine peak +35 min
    if (matchesAny(allNames, CAFFEINE_KW)) {
      events.push({
        kind: 'auto',
        type: 'caffeine' as AutoEventKind,
        time: addMinutes(time, 35),
        emoji: '⚡',
        label: 'Pic caféine',
      });
    }

    // Glycemic spike +45 min
    if (carbs > 35 || matchesAny(allNames, HIGH_CARB_KW)) {
      events.push({
        kind: 'auto',
        type: 'glycemic' as AutoEventKind,
        time: addMinutes(time, 45),
        emoji: '📈',
        label: 'Pic glycémique',
      });
    }

    // Post-prandial dip +110 min
    if (kcal > 550 || carbs > 50) {
      events.push({
        kind: 'auto',
        type: 'postprandial' as AutoEventKind,
        time: addMinutes(time, 110),
        emoji: '😴',
        label: 'Creux post-prandial',
      });
    }

    // Anabolic window +90 min
    if (protein > 15) {
      events.push({
        kind: 'auto',
        type: 'anabolic' as AutoEventKind,
        time: addMinutes(time, 90),
        emoji: '🧬',
        label: 'Fenêtre anabolique',
      });
    }

    // FODMAP fermentation +150 min
    const fodmap = detectFodmapType(meal.items);
    if (fodmap.detected) {
      events.push({
        kind: 'auto',
        type: 'fermentation' as AutoEventKind,
        time: addMinutes(time, 150),
        emoji: '🫃',
        label: fodmap.label,
      });
    }

    // Slow digestion +180 min
    if (fat > 22 || matchesAny(allNames, HIGH_FAT_KW)) {
      events.push({
        kind: 'auto',
        type: 'digestion' as AutoEventKind,
        time: addMinutes(time, 180),
        emoji: '🐌',
        label: 'Digestion ralentie',
      });
    }
  }

  // Sort by time
  events.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  return events;
}
