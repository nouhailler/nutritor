import { Meal } from '../types';
import { UserProfile } from '../data/user';
import {
  AutoTimelineEvent,
  AutoEventKind,
  EventCategory,
  EventIntensity,
  MiniMetric,
  DaySummaryLine,
} from '../types/timeline';

// ── Time helpers ────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function addMinutes(hhmm: string, delta: number): string {
  const total = parseTime(hhmm) + delta;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Food keyword detection ──────────────────────────────────────

const CAFFEINE_KW   = ['café', 'cafe', 'espresso', 'thé', 'the vert', 'matcha', 'yerba', 'cola', 'energie', 'guarana', 'redbull', 'red bull', 'nespresso'];
const HIGH_CARB_KW  = ['pain', 'pâtes', 'pates', 'riz', 'pomme de terre', 'céréale', 'baguette', 'brioche', 'croissant', 'jus', 'soda', 'sucre', 'miel', 'confiture', 'sirop', 'gâteau', 'gateau', 'farine', 'avoine', 'granola', 'muesli'];
const HIGH_FAT_KW   = ['beurre', 'huile', 'fromage', 'crème', 'creme', 'lard', 'bacon', 'avocat', 'noix', 'amande', 'cajou', 'cacahuète', 'chocolat', 'saumon', 'sardine'];
const FRUCTANE_KW   = ['ail', 'oignon', 'échalote', 'poireau', 'artichaut', 'asperge', 'blé', 'seigle', 'poireau', 'fenouil'];
const GOS_KW        = ['lentille', 'pois chiche', 'haricot', 'fève', 'soja', 'pois'];
const LACTOSE_KW    = ['lait', 'yaourt', 'yogourt', 'crème fraîche', 'fromage blanc', 'ricotta', 'mozzarella', 'latte'];
const FRUCTOSE_KW   = ['pomme', 'poire', 'mangue', 'cerise', 'pastèque', 'miel', 'sirop d\'agave', 'sirop de maïs'];
const POLYOL_KW     = ['champignon', 'chou-fleur', 'abricot', 'nectarine', 'prune', 'sorbitol', 'xylitol', 'mannitol'];
const PROTEIN_KW    = ['poulet', 'poisson', 'viande', 'bœuf', 'veau', 'porc', 'thon', 'saumon', 'crevette', 'oeuf', 'œuf', 'tofu', 'tempeh', 'fromage', 'yaourt'];

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

type FodmapType = { detected: boolean; label: string; intensity: EventIntensity };

function detectFodmapType(items: Meal['items']): FodmapType {
  const allNames = items.map((i) => i.name).join(' ');
  if (matchesAny(allNames, FRUCTANE_KW)) return { detected: true, label: 'Charge fructanes élevée', intensity: 'high' };
  if (matchesAny(allNames, GOS_KW))      return { detected: true, label: 'Charge GOS — légumineuses', intensity: 'mid' };
  if (matchesAny(allNames, LACTOSE_KW))  return { detected: true, label: 'Charge lactose', intensity: 'mid' };
  if (matchesAny(allNames, FRUCTOSE_KW)) return { detected: true, label: 'Excès fructose', intensity: 'mid' };
  if (matchesAny(allNames, POLYOL_KW))   return { detected: true, label: 'Polyols détectés', intensity: 'low' };
  return { detected: false, label: '', intensity: 'low' };
}

function getMealEmoji(meal: Meal): string {
  const n = meal.name.toLowerCase();
  if (n.includes('café') || n.includes('café') || n.includes('petit-déj') || n.includes('matin')) return '🌅';
  if (n.includes('déjeuner') || n.includes('midi')) return '🍽️';
  if (n.includes('dîner') || n.includes('soir')) return '🌙';
  if (n.includes('collation') || n.includes('goûter') || n.includes('snack')) return '🍎';
  return '🍴';
}

function makeEvent(
  type: AutoEventKind,
  category: EventCategory,
  time: string,
  emoji: string,
  label: string,
  intensity: EventIntensity,
  opts: { durationMin?: number; sublabel?: string; mealId?: string } = {},
): AutoTimelineEvent {
  return { kind: 'auto', type, category, time, emoji, label, intensity, ...opts };
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
    const kcal    = meal.items.reduce((s, i) => s + i.kcal, 0);
    const protein = meal.items.reduce((s, i) => s + (i.macros?.protein ?? 0), 0);
    const carbs   = meal.items.reduce((s, i) => s + (i.macros?.carbs ?? 0), 0);
    const fat     = meal.items.reduce((s, i) => s + (i.macros?.fat ?? 0), 0);
    const allNames = meal.items.map((i) => i.name).join(' ');
    const mealId = meal.id;

    const mealIntensity: EventIntensity = kcal > 600 ? 'high' : kcal > 280 ? 'mid' : 'low';

    // 1 — Meal
    events.push(makeEvent('meal', 'meal', time, getMealEmoji(meal), meal.name, mealIntensity, {
      sublabel: `${Math.round(kcal)} kcal · P${Math.round(protein)}g G${Math.round(carbs)}g L${Math.round(fat)}g`,
      mealId,
    }));

    // 2 — Satiety (kcal > 300)
    if (kcal > 300) {
      const satDuration = Math.min(240, Math.round(90 + protein * 2.5));
      const satIntensity: EventIntensity = kcal > 600 ? 'high' : kcal > 420 ? 'mid' : 'low';
      events.push(makeEvent('satiety', 'metabolic', addMinutes(time, 25),
        '😌', 'Satiété', satIntensity,
        { durationMin: satDuration, sublabel: `durée ~${Math.round(satDuration / 60 * 2) / 2} h`, mealId }));
    }

    // 3 — Caffeine peak + vigilance
    if (matchesAny(allNames, CAFFEINE_KW)) {
      events.push(makeEvent('caffeine', 'cognitive', addMinutes(time, 35),
        '⚡', 'Pic caféine', 'high', { durationMin: 45, mealId }));
      events.push(makeEvent('vigilance', 'cognitive', addMinutes(time, 65),
        '🧠', 'Vigilance élevée', 'mid', { durationMin: 120, mealId }));
    }

    // 4 — Glycemic rise (carbs > 25g)
    if (carbs > 25 || matchesAny(allNames, HIGH_CARB_KW)) {
      const glyIntensity: EventIntensity = carbs > 65 ? 'high' : carbs > 40 ? 'mid' : 'low';
      const glyLabel = glyIntensity === 'high' ? 'Pic glycémique' : 'Élévation glycémique';
      events.push(makeEvent('glycemic', 'metabolic', addMinutes(time, 45),
        '📈', glyLabel, glyIntensity,
        { durationMin: 90, sublabel: glyIntensity === 'high' ? 'insuline sollicitée' : undefined, mealId }));
    }

    // 5 — Post-prandial dip (large meal)
    if (kcal > 550 || carbs > 65) {
      const ppIntensity: EventIntensity = (kcal > 750 || carbs > 90) ? 'mid' : 'low';
      events.push(makeEvent('postprandial', 'metabolic', addMinutes(time, 115),
        '😴', 'Creux post-prandial', ppIntensity, { durationMin: 30, mealId }));
    }

    // 6 — Anabolic window (protein > 15g)
    if (protein > 15) {
      const anaIntensity: EventIntensity = protein > 35 ? 'high' : protein > 22 ? 'mid' : 'low';
      events.push(makeEvent('anabolic', 'nutritional', addMinutes(time, 90),
        '🧬', 'Fenêtre anabolique', anaIntensity,
        { durationMin: 120, sublabel: `${Math.round(protein)} g protéines`, mealId }));
    }

    // 7 — FODMAP fermentation
    const fodmap = detectFodmapType(meal.items);
    if (fodmap.detected) {
      events.push(makeEvent('fermentation', 'digestive', addMinutes(time, 150),
        '🫃', fodmap.label, fodmap.intensity,
        { durationMin: fodmap.intensity === 'high' ? 210 : 150, mealId }));
    }

    // 8 — Slow lipid digestion (fat > 22g or high-fat keywords)
    if (fat > 22 || matchesAny(allNames, HIGH_FAT_KW)) {
      const digIntensity: EventIntensity = fat > 40 ? 'high' : fat > 28 ? 'mid' : 'low';
      events.push(makeEvent('digestion', 'digestive', addMinutes(time, 180),
        '🐌', 'Digestion lipidique lente', digIntensity,
        { durationMin: fat > 35 ? 240 : 180, mealId }));
    }
  }

  events.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  return events;
}

// ── Mini metrics ────────────────────────────────────────────────

export function computeMiniMetrics(events: AutoTimelineEvent[]): MiniMetric[] {
  if (events.length === 0) return [];

  // Énergie
  const caffeineEvents   = events.filter((e) => e.type === 'caffeine');
  const postprandialEvts = events.filter((e) => e.type === 'postprandial');
  let energyLevel: 'ok' | 'mid' | 'warn' = 'ok';
  let energyValue = 'stable';
  if (caffeineEvents.length > 0 && postprandialEvts.length === 0) {
    energyLevel = 'ok'; energyValue = 'stimulée';
  } else if (postprandialEvts.some((e) => e.intensity === 'mid')) {
    energyLevel = 'mid'; energyValue = 'variable';
  } else if (postprandialEvts.length > 1) {
    energyLevel = 'warn'; energyValue = 'basse';
  } else if (caffeineEvents.length > 1) {
    energyLevel = 'mid'; energyValue = 'caféine ×2';
  }

  // Digestion
  const fodmapEvts = events.filter((e) => e.type === 'fermentation');
  const slowEvts   = events.filter((e) => e.type === 'digestion');
  let digLevel: 'ok' | 'mid' | 'warn' = 'ok';
  let digValue = 'légère';
  if (fodmapEvts.some((e) => e.intensity === 'high') || (fodmapEvts.length > 0 && slowEvts.length > 0)) {
    digLevel = 'warn'; digValue = 'chargée';
  } else if (fodmapEvts.length > 0 || slowEvts.length > 0) {
    digLevel = 'mid'; digValue = 'modérée';
  }

  // FODMAP
  let fodmapLevel: 'ok' | 'mid' | 'warn' = 'ok';
  let fodmapValue = 'faible';
  if (fodmapEvts.some((e) => e.intensity === 'high')) {
    fodmapLevel = 'warn'; fodmapValue = 'élevé';
  } else if (fodmapEvts.length >= 2 || fodmapEvts.some((e) => e.intensity === 'mid')) {
    fodmapLevel = 'mid'; fodmapValue = 'modéré';
  }

  // Glycémie
  const glycEvts = events.filter((e) => e.type === 'glycemic');
  let glycLevel: 'ok' | 'mid' | 'warn' = 'ok';
  let glycValue = 'stable';
  if (glycEvts.some((e) => e.intensity === 'high')) {
    glycLevel = 'warn'; glycValue = 'haute';
  } else if (glycEvts.length >= 2) {
    glycLevel = 'mid'; glycValue = 'modérée';
  } else if (glycEvts.length === 1) {
    glycLevel = 'mid'; glycValue = 'légère';
  }

  return [
    { emoji: '⚡', label: 'Énergie',    value: energyValue, level: energyLevel },
    { emoji: '🫃', label: 'Digestion', value: digValue,     level: digLevel },
    { emoji: '🌾', label: 'FODMAP',    value: fodmapValue,  level: fodmapLevel },
    { emoji: '🍬', label: 'Glycémie',  value: glycValue,    level: glycLevel },
  ];
}

// ── Day summary ─────────────────────────────────────────────────

export function computeDaySummary(events: AutoTimelineEvent[]): DaySummaryLine[] {
  if (events.filter((e) => e.type === 'meal').length === 0) return [];

  const lines: DaySummaryLine[] = [];

  // Glycemic load
  const highGlyc = events.filter((e) => e.type === 'glycemic' && e.intensity === 'high').length;
  const midGlyc  = events.filter((e) => e.type === 'glycemic').length;
  if (highGlyc >= 2) {
    lines.push({ text: 'Charge glucidique importante — pics insuliniques répétés sur la journée', kind: 'warn' });
  } else if (highGlyc === 1 || midGlyc >= 3) {
    lines.push({ text: 'Charge glucidique modérée — surveiller les creux d\'énergie post-repas', kind: 'mid' });
  }

  // FODMAP
  const highFodmap = events.filter((e) => e.type === 'fermentation' && e.intensity === 'high').length;
  const allFodmap  = events.filter((e) => e.type === 'fermentation').length;
  if (highFodmap >= 1) {
    lines.push({ text: 'FODMAP élevés détectés — fermentation colique probable cet après-midi', kind: 'warn' });
  } else if (allFodmap >= 2) {
    lines.push({ text: 'FODMAP cumulés sur la journée — symptômes digestifs possibles', kind: 'mid' });
  }

  // Protein / anabolic
  const highAnab = events.filter((e) => e.type === 'anabolic' && e.intensity === 'high').length;
  const allAnab  = events.filter((e) => e.type === 'anabolic').length;
  if (highAnab >= 2) {
    lines.push({ text: 'Excellente couverture protéique — synthèse musculaire bien soutenue', kind: 'ok' });
  } else if (allAnab >= 1) {
    lines.push({ text: 'Fenêtre anabolique active — bonne assimilation des protéines', kind: 'ok' });
  } else {
    lines.push({ text: 'Apport protéique faible — envisager une source de protéines complètes', kind: 'mid' });
  }

  // Caffeine load
  const cafCount = events.filter((e) => e.type === 'caffeine').length;
  if (cafCount >= 2) {
    lines.push({ text: 'Consommation de caféine multiple — impacts possibles sur le sommeil', kind: 'mid' });
  }

  // Heavy digestion
  const slowCount = events.filter((e) => e.type === 'digestion').length;
  if (slowCount >= 2) {
    lines.push({ text: 'Charge lipidique soutenue — digestion engagée sur une longue plage', kind: 'mid' });
  }

  // Positive default
  if (lines.length === 0) {
    const isBalanced =
      allAnab >= 1 &&
      highFodmap === 0 &&
      highGlyc === 0 &&
      events.filter((e) => e.type === 'meal').length >= 2;
    lines.push(isBalanced
      ? { text: 'Journée bien équilibrée — digestif et métabolisme en harmonie', kind: 'ok' }
      : { text: 'Profil digestif calme — aucune surcharge identifiée', kind: 'ok' },
    );
  }

  return lines.slice(0, 4);
}
