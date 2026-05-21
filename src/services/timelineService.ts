import { Meal } from '../types';
import { UserProfile, getDigestiveSensitivities } from '../data/user';
import {
  AutoTimelineEvent,
  AutoEventKind,
  EventCategory,
  EventIntensity,
  MiniMetric,
  DaySummaryLine,
  EventDetailData,
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

// ── Event detail builder ────────────────────────────────────────

const CONFIDENCE: Record<EventIntensity, EventDetailData['confidence']> = {
  high: 'élevée', mid: 'modérée', low: 'faible',
};

function catColor(type: AutoEventKind): string {
  if (type === 'caffeine' || type === 'vigilance') return '#9B7340';
  if (type === 'glycemic' || type === 'postprandial' || type === 'satiety') return '#3A5A8B';
  if (type === 'fermentation' || type === 'digestion') return '#3F5A3A';
  if (type === 'anabolic') return '#5A3A8B';
  return '#444444';
}

export function buildEventDetail(
  event: AutoTimelineEvent,
  meals: Meal[],
  profile: UserProfile,
): EventDetailData {
  const meal = meals.find((m) => m.id === event.mealId) ?? null;
  const items = meal?.items ?? [];
  const allNames = items.map((i) => i.name).join(' ');
  const kcal    = items.reduce((s, i) => s + i.kcal, 0);
  const protein = items.reduce((s, i) => s + (i.macros?.protein ?? 0), 0);
  const carbs   = items.reduce((s, i) => s + (i.macros?.carbs ?? 0), 0);
  const fat     = items.reduce((s, i) => s + (i.macros?.fat ?? 0), 0);

  const endTime = event.durationMin ? addMinutes(event.time, event.durationMin) : null;
  const timeWindow = endTime ? `${event.time} → ${endTime}` : event.time;
  const intensityLabel = event.intensity === 'high' ? 'Élevée' : event.intensity === 'mid' ? 'Modérée' : 'Faible';
  const color = catColor(event.type);

  const sensitivities = getDigestiveSensitivities(profile);
  const pathologies = profile.pathologies ?? [];
  const objectives  = profile.objectives ?? [];

  const getSens = (id: string) => sensitivities.find((s) => s.id === id)?.level ?? 'none';

  switch (event.type) {

    case 'meal': {
      const dataPoints = [
        kcal > 0    ? `${Math.round(kcal)} kcal`    : null,
        protein > 0 ? `${Math.round(protein)}g protéines` : null,
        carbs > 0   ? `${Math.round(carbs)}g glucides`    : null,
        fat > 0     ? `${Math.round(fat)}g lipides`       : null,
      ].filter(Boolean) as string[];
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: items.map((i) => i.name),
        mechanism: 'Apport calorique et nutritionnel enregistré.',
        duration: '', impacts: [],
        personalizedNote: null, educationalNote: '',
        dataPoints, whyPoints: [],
        simulation: null, recommendation: '',
      };
    }

    case 'glycemic': {
      const carbFoods = items.filter((i) => matchesAny(i.name, HIGH_CARB_KW)).map((i) => i.name);
      const whyPoints = [
        carbs > 0 ? `${Math.round(carbs)}g glucides${carbs > 65 ? ' — charge élevée' : ''}` : null,
        matchesAny(allNames, HIGH_CARB_KW) ? 'Aliments à index glycémique élevé détectés' : null,
        protein < 10 && protein > 0 ? 'Faible apport protéique — frein naturel absent' : null,
        fat < 5 && kcal > 0 ? 'Repas pauvre en lipides — absorption glucidique rapide' : null,
      ].filter(Boolean) as string[];
      const impacts = event.intensity === 'high'
        ? ['Énergie rapide mais brève', 'Réponse insulinique importante', 'Creux possible 1–2h après', 'Fatigue secondaire éventuelle']
        : ['Légère élévation glycémique', 'Réponse insulinique modérée', 'Énergie globalement stable'];
      let personalizedNote: string | null = null;
      if (objectives.includes('glycemia')) {
        personalizedNote = 'Objectif glycémie stable : ce repas sollicite davantage votre pancréas — envisager des sources glucidiques à IG plus faible.';
      }
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: carbFoods.length ? carbFoods : items.map((i) => i.name).slice(0, 3),
        triggerNote: `Charge glucidique estimée : ${event.intensity === 'high' ? 'élevée' : 'modérée'}`,
        mechanism: 'Les glucides sont absorbés rapidement dans le sang, provoquant une élévation de la glycémie. L\'insuline est sécrétée pour ramener le taux à la normale.',
        duration: event.durationMin ? `~${event.durationMin} min` : '45–90 min',
        impacts, personalizedNote,
        educationalNote: 'Un pic glycémique est normal après un repas riche en glucides. Son amplitude dépend de la composition : fibres, protéines et lipides ralentissent l\'absorption.',
        dataPoints: [
          carbs > 0   ? `${Math.round(carbs)}g glucides`    : null,
          kcal > 0    ? `${Math.round(kcal)} kcal`          : null,
          protein > 0 ? `${Math.round(protein)}g protéines` : null,
        ].filter(Boolean) as string[],
        whyPoints,
        simulation: event.intensity === 'high' ? 'Avec plus de fibres ou protéines → pic réduit de 20–30 % estimé' : null,
        recommendation: event.intensity === 'high'
          ? 'Associer fibres, protéines et lipides aux glucides pour amortir le pic. Une marche de 10 min post-repas aide également.'
          : 'Pic modéré — une activité légère post-repas favorise l\'utilisation du glucose.',
      };
    }

    case 'postprandial': {
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: items.map((i) => i.name).slice(0, 4),
        triggerNote: `Repas ${kcal > 750 ? 'très copieux' : 'copieux'} — ${Math.round(kcal)} kcal`,
        mechanism: 'Un repas copieux détourne le flux sanguin vers le système digestif. La sécrétion d\'insuline et de mélatonine contribue à la somnolence transitoire.',
        duration: event.durationMin ? `~${event.durationMin} min` : '20–40 min',
        impacts: ['Somnolence transitoire', 'Baisse de concentration', 'Ralentissement cognitif', 'Lourdeur digestive'],
        personalizedNote: null,
        educationalNote: 'Le creux post-prandial est un phénomène physiologique normal. Il est amplifié par les repas riches en glucides et les gros volumes alimentaires.',
        dataPoints: [
          kcal > 0  ? `${Math.round(kcal)} kcal`    : null,
          carbs > 0 ? `${Math.round(carbs)}g glucides` : null,
        ].filter(Boolean) as string[],
        whyPoints: [
          kcal > 600  ? `${Math.round(kcal)} kcal — repas volumineux`                  : null,
          carbs > 65  ? `${Math.round(carbs)}g glucides — réponse insulinique marquée` : null,
        ].filter(Boolean) as string[],
        simulation: 'Avec un repas plus léger (< 500 kcal) → creux réduit ou absent',
        recommendation: 'Une marche de 10–15 min ou une micro-sieste de 20 min aide à traverser ce creux.',
      };
    }

    case 'satiety': {
      const proteinFoods = items.filter((i) => matchesAny(i.name, PROTEIN_KW)).map((i) => i.name);
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: 'élevée',
        triggers: proteinFoods.length ? proteinFoods : items.map((i) => i.name).slice(0, 3),
        triggerNote: `${Math.round(protein)}g protéines · ${Math.round(kcal)} kcal`,
        mechanism: 'Les protéines et la distension gastrique stimulent GLP-1 et PYY, hormones de satiété qui signalent la plénitude au cerveau.',
        duration: event.durationMin ? `~${Math.round(event.durationMin / 60 * 10) / 10}h` : '2–3 h',
        impacts: ['Sensation de rassasiement', 'Réduction de l\'appétit', 'Stabilisation de l\'énergie'],
        personalizedNote: null,
        educationalNote: 'Les protéines sont les macronutriments les plus rassasiants. Elles maintiennent la satiété 2–4× plus longtemps que les glucides simples.',
        dataPoints: [
          `${Math.round(protein)}g protéines`,
          kcal > 0 ? `${Math.round(kcal)} kcal` : null,
        ].filter(Boolean) as string[],
        whyPoints: [
          protein > 0 ? `${Math.round(protein)}g protéines — satiété prolongée` : null,
          kcal > 400  ? 'Repas calorique — distension gastrique notable' : null,
        ].filter(Boolean) as string[],
        simulation: null,
        recommendation: 'Maintenir 20–30g de protéines par repas principal aide à contrôler les fringales tout au long de la journée.',
      };
    }

    case 'caffeine': {
      const caffFoods = items.filter((i) => matchesAny(i.name, CAFFEINE_KW)).map((i) => i.name);
      const cafLevel = getSens('caffeine');
      const parts: string[] = [];
      if (cafLevel === 'strong' || cafLevel === 'moderate') {
        parts.push('Votre profil indique une sensibilité à la caféine — effets potentiellement plus marqués (nervosité, palpitations).');
      }
      if (pathologies.includes('foodMigraine')) {
        parts.push('Migraine alimentaire dans votre profil : la caféine peut être un déclencheur, surtout en cas de sevrage.');
      }
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: 'élevée',
        triggers: caffFoods.length ? caffFoods : items.map((i) => i.name).slice(0, 2),
        triggerNote: 'Source de caféine détectée',
        mechanism: 'La caféine bloque les récepteurs à l\'adénosine, une molécule qui favorise la somnolence, maintenant ainsi l\'éveil et la vigilance.',
        duration: '45–60 min de pic',
        impacts: ['Éveil accru', 'Concentration améliorée', 'Légère accélération cardiaque', 'Possible anxiété si dose élevée'],
        personalizedNote: parts.length ? parts.join(' ') : null,
        educationalNote: 'La demi-vie de la caféine est de 5–6 heures. Une consommation après 14h peut retarder l\'endormissement de 1 à 2 heures.',
        dataPoints: ['Source de caféine confirmée', 'Pic attendu 30–45 min après ingestion'],
        whyPoints: caffFoods.map((f) => `${f} — source de caféine`),
        simulation: 'Consommée avant 13h → impact minimal sur le sommeil nocturne',
        recommendation: 'Éviter la caféine après 14h pour préserver la qualité du sommeil.',
      };
    }

    case 'vigilance': {
      const caffFoods = items.filter((i) => matchesAny(i.name, CAFFEINE_KW)).map((i) => i.name);
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: 'modérée',
        triggers: caffFoods.length ? caffFoods : items.map((i) => i.name).slice(0, 2),
        triggerNote: 'Phase stabilisée après pic caféine',
        mechanism: 'Après le pic initial, la caféine maintient un niveau de vigilance soutenu en continuant à bloquer les récepteurs à l\'adénosine.',
        duration: event.durationMin ? `~${event.durationMin} min` : '1–2 h',
        impacts: ['Concentration soutenue', 'Temps de réaction amélioré', 'Mémoire de travail optimisée'],
        personalizedNote: null,
        educationalNote: 'La phase de vigilance correspond au plateau de la caféine. C\'est la fenêtre idéale pour les tâches cognitives exigeantes.',
        dataPoints: ['Phase post-pic caféine estimée'],
        whyPoints: ['Phase naturelle suivant le pic de caféine'],
        simulation: null,
        recommendation: 'Profiter de cette fenêtre de vigilance pour les tâches nécessitant concentration et mémorisation.',
      };
    }

    case 'fermentation': {
      const allFodmapKW = [...FRUCTANE_KW, ...GOS_KW, ...LACTOSE_KW, ...FRUCTOSE_KW, ...POLYOL_KW];
      const fodmapFoods = items.filter((i) => matchesAny(i.name, allFodmapKW)).map((i) => i.name);
      const hasSII      = pathologies.includes('ibs');
      const fructanLv   = getSens('fructans');
      const polyolLv    = getSens('polyols');
      const lactoseLv   = getSens('lactose');
      let personalizedNote: string | null = null;
      if (hasSII) {
        personalizedNote = 'Syndrome de l\'intestin irritable dans votre profil — la fermentation FODMAP est souvent amplifiée avec des symptômes plus marqués.';
      } else if ([fructanLv, polyolLv, lactoseLv].some((l) => l === 'strong')) {
        personalizedNote = 'Forte sensibilité FODMAP dans votre profil — des symptômes digestifs sont probables après ce repas.';
      } else if ([fructanLv, polyolLv, lactoseLv].some((l) => l === 'moderate')) {
        personalizedNote = 'Sensibilité FODMAP modérée — les symptômes dépendront des quantités consommées.';
      }
      const durationH = event.durationMin ? `${Math.round(event.durationMin / 60)}–${Math.round(event.durationMin / 60) + 1}h` : '2–4 h';
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: fodmapFoods.length ? fodmapFoods : items.map((i) => i.name).slice(0, 3),
        triggerNote: `Charge FODMAP : ${event.intensity === 'high' ? 'élevée' : event.intensity === 'mid' ? 'modérée' : 'faible'}`,
        mechanism: 'Les FODMAP atteignent le côlon non digérés et fermentent sous l\'action des bactéries intestinales, produisant des gaz (H₂, CO₂) et des acides gras courts.',
        duration: durationH,
        impacts: ['Ballonnements', 'Gaz et distension abdominale', 'Crampes possibles', 'Modification du transit'],
        personalizedNote,
        educationalNote: 'Les FODMAP sont des glucides fermentescibles (Oligosaccharides, Disaccharides, Monosaccharides And Polyols). Leur fermentation est normale mais peut causer des inconforts digestifs chez les personnes sensibles.',
        dataPoints: [
          fodmapFoods.length ? `${fodmapFoods.length} aliment(s) FODMAP détecté(s)` : 'Aliments FODMAP détectés par analyse',
          event.intensity === 'high' ? 'Charge fermentative élevée' : 'Charge fermentative modérée',
        ],
        whyPoints: fodmapFoods.map((f) => `${f} — source FODMAP`),
        simulation: 'Sans les aliments FODMAP → fermentation réduite ou absente',
        recommendation: event.intensity === 'high'
          ? 'Si sensible : réduire les portions de ces aliments ou les étaler sur plusieurs repas pour limiter la charge.'
          : 'Quantités modérées généralement bien tolérées — observer vos réactions personnelles.',
      };
    }

    case 'digestion': {
      const fatFoods = items.filter((i) => matchesAny(i.name, HIGH_FAT_KW)).map((i) => i.name);
      const fatLv     = getSens('fattyFoods');
      const hasReflux = pathologies.includes('reflux');
      const parts: string[] = [];
      if (fatLv === 'strong' || fatLv === 'moderate') {
        parts.push('Votre profil indique une sensibilité aux aliments gras — la digestion peut être plus inconfortable.');
      }
      if (hasReflux) {
        parts.push('Reflux gastrique dans votre profil : éviter de vous allonger dans les 2–3h après ce repas.');
      }
      const durationH = event.durationMin ? `${Math.round(event.durationMin / 60)}–${Math.round(event.durationMin / 60) + 1}h` : '3–4 h';
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: fatFoods.length ? fatFoods : items.map((i) => i.name).slice(0, 3),
        triggerNote: fat > 0 ? `${Math.round(fat)}g lipides — charge ${event.intensity === 'high' ? 'élevée' : 'modérée'}` : undefined,
        mechanism: 'Les lipides stimulent la libération de cholécystokinine (CCK), ralentissant la vidange gastrique et prolongeant le processus digestif.',
        duration: durationH,
        impacts: [
          'Lourdeur post-repas',
          'Digestion lente',
          'Énergie mobilisée pour la digestion',
          hasReflux ? 'Risque de reflux si couché trop tôt' : 'Reflux possible si position allongée rapidement',
        ],
        personalizedNote: parts.length ? parts.join(' ') : null,
        educationalNote: 'La digestion des lipides est naturellement lente car elle nécessite l\'émulsification par la bile et les lipases pancréatiques — c\'est physiologiquement normal.',
        dataPoints: [
          fat > 0  ? `${Math.round(fat)}g lipides`       : null,
          kcal > 0 ? `${Math.round(kcal)} kcal`          : null,
          fatFoods.length ? `${fatFoods.length} source(s) lipidique(s) détectée(s)` : null,
        ].filter(Boolean) as string[],
        whyPoints: [
          fat > 0 ? `${Math.round(fat)}g lipides${fat > 40 ? ' — charge très élevée' : ''}` : null,
          ...fatFoods.slice(0, 2).map((f) => `${f} — aliment gras`),
        ].filter(Boolean) as string[],
        simulation: 'Avec moitié moins de lipides → durée de digestion réduite de 1–2h estimée',
        recommendation: 'Rester assis ou en légère activité après ce repas. Éviter de s\'allonger dans les 2h suivantes.',
      };
    }

    case 'anabolic': {
      const proteinFoods = items.filter((i) => matchesAny(i.name, PROTEIN_KW)).map((i) => i.name);
      let personalizedNote: string | null = null;
      if (objectives.includes('sport')) {
        personalizedNote = 'Objectif performance sportive : excellent timing protéique, surtout si pris dans les 2h post-effort.';
      }
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: proteinFoods.length ? proteinFoods : items.map((i) => i.name).slice(0, 3),
        triggerNote: `${Math.round(protein)}g protéines — synthèse active`,
        mechanism: 'Les acides aminés absorbés activent la voie mTOR, déclenchant la synthèse protéique musculaire et la réparation tissulaire.',
        duration: event.durationMin ? `~${Math.round(event.durationMin / 60)}h` : '2–3 h',
        impacts: ['Synthèse protéique musculaire', 'Récupération tissulaire', 'Réparation musculaire', 'Soutien immunitaire'],
        personalizedNote,
        educationalNote: 'La fenêtre anabolique est maximale dans les 2h après un effort physique. 20–40g de protéines de qualité suffisent à saturer la synthèse protéique par session.',
        dataPoints: [
          `${Math.round(protein)}g protéines`,
          protein > 35 ? 'Apport optimal pour la synthèse musculaire' : 'Apport suffisant pour initier la synthèse',
        ],
        whyPoints: [
          protein > 0 ? `${Math.round(protein)}g protéines — seuil anabolique atteint` : null,
          ...proteinFoods.slice(0, 2).map((f) => `${f} — source de protéines`),
        ].filter(Boolean) as string[],
        simulation: objectives.includes('sport') ? 'Associé à un effort physique dans les 2h → gains musculaires maximisés' : null,
        recommendation: protein > 35
          ? 'Excellente prise protéique — idéalement associée à un effort physique dans les 2h suivantes.'
          : 'Bonne fenêtre anabolique — un effort physique optimise l\'utilisation de ces protéines.',
      };
    }

    default: {
      return {
        emoji: event.emoji, title: event.label, timeWindow,
        intensityLabel, intensityColor: color, confidence: CONFIDENCE[event.intensity],
        triggers: [], mechanism: '', duration: '', impacts: [],
        personalizedNote: null, educationalNote: '', dataPoints: [], whyPoints: [],
        simulation: null, recommendation: '',
      };
    }
  }
}
