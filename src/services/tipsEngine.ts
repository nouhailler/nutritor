import { Meal } from '../types';
import { UserProfile } from '../data/user';
import { JournalEntry } from '../data/weeklyStats';
import { SymptomEntry } from '../types/symptoms';
import { DayTip, TipLevel } from '../types/tips';
import { EDUCATIONAL_TIPS, TipTag } from '../data/tipsLibrary';
import { computeAutoEvents } from './timelineService';

// ── Helpers ─────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function tip(
  id: string,
  kind: DayTip['kind'],
  level: TipLevel,
  emoji: string,
  message: string,
): DayTip {
  return { id, kind, level, emoji, message };
}

// ── Day-of-year seed (for stable educational rotation) ──────────

function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

// ── 1. Contextual tips from today's meals ───────────────────────

function getContextualTips(meals: Meal[], profile: UserProfile): DayTip[] {
  const tips: DayTip[] = [];
  if (meals.every((m) => m.items.length === 0)) return tips;

  const autoEvents = computeAutoEvents(meals, profile);

  const fodmapEvts     = autoEvents.filter((e) => e.type === 'fermentation');
  const glycemicEvts   = autoEvents.filter((e) => e.type === 'glycemic');
  const digestionEvts  = autoEvents.filter((e) => e.type === 'digestion');
  const postprandEvts  = autoEvents.filter((e) => e.type === 'postprandial');

  const totalKcal    = meals.flatMap((m) => m.items).reduce((s, i) => s + i.kcal, 0);
  const totalProtein = meals.flatMap((m) => m.items).reduce((s, i) => s + (i.macros?.protein ?? 0), 0);
  const totalCarbs   = meals.flatMap((m) => m.items).reduce((s, i) => s + (i.macros?.carbs ?? 0), 0);
  const filledMeals  = meals.filter((m) => m.items.length > 0).length;

  // FODMAP charge élevée
  if (fodmapEvts.some((e) => e.intensity === 'high')) {
    tips.push(tip(
      'ctx_fodmap_high', 'contextual', 'caution', '⚠️',
      'Charge FODMAP élevée détectée aujourd\'hui — des inconforts digestifs sont possibles 2 à 4h après les repas concernés.',
    ));
  } else if (fodmapEvts.length >= 2 || fodmapEvts.some((e) => e.intensity === 'mid')) {
    tips.push(tip(
      'ctx_fodmap_mod', 'contextual', 'info', '💡',
      'Charge FODMAP modérée aujourd\'hui. Les aliments fermentescibles s\'accumulent — rester attentif en soirée.',
    ));
  }

  // Repas riche en lipides → digestion lente
  if (digestionEvts.some((e) => e.intensity === 'high')) {
    tips.push(tip(
      'ctx_fat_high', 'contextual', 'info', '💡',
      'Repas riche en lipides — la digestion gastrique pourrait rester active 3 à 5h. Une marche légère peut aider.',
    ));
  }

  // Charge glycémique élevée (≥2 repas avec pic glycémique)
  const highGlycemic = glycemicEvts.filter((e) => e.intensity === 'high' || e.intensity === 'mid');
  if (highGlycemic.length >= 2) {
    tips.push(tip(
      'ctx_glycemic', 'contextual', 'caution', '⚠️',
      'Charge glycémique élevée sur plusieurs repas aujourd\'hui. Associer fibres et protéines aide à modérer les pics.',
    ));
  } else if (highGlycemic.length === 1 && glycemicEvts.some((e) => e.intensity === 'high')) {
    tips.push(tip(
      'ctx_glycemic_single', 'contextual', 'info', '💡',
      'Pic glycémique probable après ce repas glucidique. Débuter par les légumes au prochain repas peut réduire l\'effet.',
    ));
  }

  // Creux post-prandial probable
  if (postprandEvts.some((e) => e.intensity === 'high')) {
    tips.push(tip(
      'ctx_postprandial', 'behavioral', 'info', '💡',
      'Creux d\'énergie probable en début d\'après-midi. Une marche légère ou une collation protéinée peut atténuer cet effet.',
    ));
  }

  // Repas tardif
  const lateMeal = meals.find((m) => {
    const [h] = m.time.split(':').map(Number);
    const kcal = m.items.reduce((s, i) => s + i.kcal, 0);
    return h >= 21 && kcal >= 350;
  });
  if (lateMeal) {
    tips.push(tip(
      'ctx_late_meal', 'behavioral', 'info', '💡',
      `Repas tardif (${lateMeal.time}) — la digestion sera ralentie et la fenêtre de jeûne nocturne repoussée.`,
    ));
  }

  // Apport calorique élevé
  const kcalTarget = profile.kcalTarget ?? 2000;
  if (totalKcal > kcalTarget * 1.25 && filledMeals >= 3) {
    tips.push(tip(
      'ctx_kcal_high', 'contextual', 'info', '💡',
      `Apport calorique élevé aujourd'hui (${Math.round(totalKcal)} kcal). La prochaine journée peut naturellement compenser.`,
    ));
  }

  // Protéines faibles (< 70% cible, ≥3 repas enregistrés)
  const proteinTarget = profile.macroTargets?.protein ?? 60;
  if (totalProtein < proteinTarget * 0.7 && filledMeals >= 3) {
    tips.push(tip(
      'ctx_low_protein', 'contextual', 'info', '💡',
      `Apport en protéines limité aujourd'hui (${Math.round(totalProtein)} g). Légumineuses, œufs ou yaourt peuvent compléter facilement.`,
    ));
  }

  // Glucides élevés sans protéines suffisantes (ratio déséquilibré)
  if (totalCarbs > 200 && totalProtein < 40 && filledMeals >= 2) {
    tips.push(tip(
      'ctx_carb_protein_ratio', 'behavioral', 'info', '💡',
      'Beaucoup de glucides pour peu de protéines aujourd\'hui. Ajouter une source protéinée module les pics glycémiques.',
    ));
  }

  // Journée bien équilibrée (positive tip)
  const noHighEvents = !fodmapEvts.some((e) => e.intensity === 'high') &&
                       !glycemicEvts.some((e) => e.intensity === 'high') &&
                       !digestionEvts.some((e) => e.intensity === 'high');
  const macroOk = totalKcal > kcalTarget * 0.8 && totalKcal < kcalTarget * 1.1 &&
                  totalProtein >= proteinTarget * 0.85;
  if (noHighEvents && macroOk && filledMeals >= 3) {
    tips.push(tip(
      'ctx_balanced', 'contextual', 'positive', '✅',
      'Journée bien équilibrée : apports dans les cibles et charge digestive modérée.',
    ));
  }

  return tips;
}

// ── 2. Pattern tips from 7–14 day history ───────────────────────

const FODMAP_KEYWORDS = [
  'ail', 'oignon', 'échalote', 'poireau', 'artichaut', 'blé', 'seigle', 'fructane',
  'lentille', 'pois chiche', 'haricot', 'fève', 'soja', 'gos',
  'lait', 'yaourt', 'lactose', 'crème fraîche',
  'pomme', 'poire', 'mangue', 'cerise', 'pastèque', 'miel', 'fructose',
  'champignon', 'chou-fleur', 'abricot', 'polyol', 'sorbitol', 'mannitol',
];

function dayHasFodmap(entry: JournalEntry): boolean {
  const names = entry.meals.flatMap((m) => m.items.map((i) => i.name)).join(' ').toLowerCase();
  return FODMAP_KEYWORDS.some((kw) => names.includes(kw));
}

function getPatternTips(
  journal: JournalEntry[],
  symptoms: SymptomEntry[],
  today: string,
): DayTip[] {
  const tips: DayTip[] = [];
  const recent = journal
    .filter((e) => e.date < today)
    .slice(-14);

  if (recent.length < 4) return tips; // not enough data

  // Symptom averages over last 7 days
  const recentSymptoms = symptoms
    .filter((s) => s.date < today)
    .slice(-7);

  const bloatingScores = recentSymptoms
    .map((s) => s.scores.bloating)
    .filter((v) => v >= 0);
  const abdominalScores = recentSymptoms
    .map((s) => s.scores.abdominal)
    .filter((v) => v >= 0);
  const energyScores = recentSymptoms
    .map((s) => s.scores.energy)
    .filter((v) => v >= 0);
  const sleepScores = recentSymptoms
    .map((s) => s.scores.sleep)
    .filter((v) => v >= 0);

  // Bloating élevé (inverse=true → high score = bad)
  if (bloatingScores.length >= 4 && avg(bloatingScores) > 2.3) {
    tips.push(tip(
      'pat_bloating', 'pattern', 'info', '💡',
      'Ballonnements fréquents cette semaine. Réduire les aliments fermentescibles (oignon, blé, légumineuses) pourrait alléger l\'inconfort.',
    ));
  }

  // Douleurs abdominales récurrentes
  if (abdominalScores.length >= 4 && avg(abdominalScores) > 2.5) {
    tips.push(tip(
      'pat_abdominal', 'pattern', 'caution', '⚠️',
      'Douleurs abdominales récurrentes cette semaine. Si cela persiste, un avis médical peut être utile.',
    ));
  }

  // Énergie faible (inverse=false → high score = good)
  if (energyScores.length >= 4 && avg(energyScores) < 1.5) {
    tips.push(tip(
      'pat_low_energy', 'pattern', 'info', '💡',
      'Énergie plus faible que la normale cette semaine. Les apports en protéines et glucides complexes au déjeuner peuvent stabiliser l\'énergie de l\'après-midi.',
    ));
  }

  // Sommeil difficile
  if (sleepScores.length >= 4 && avg(sleepScores) < 1.5) {
    tips.push(tip(
      'pat_poor_sleep', 'pattern', 'info', '💡',
      'Qualité de sommeil réduite cette semaine. Les repas lourds ou tardifs (après 20h) peuvent perturber la récupération nocturne.',
    ));
  }

  // Énergie stable et bonne (positive)
  if (energyScores.length >= 5 && avg(energyScores) > 3.0 &&
      bloatingScores.length >= 3 && avg(bloatingScores) < 1.5) {
    tips.push(tip(
      'pat_good_week', 'pattern', 'positive', '✅',
      'Énergie stable et peu d\'inconforts cette semaine — votre alimentation semble bien adaptée à votre profil.',
    ));
  }

  // Insight FODMAP–ballonnements (corrélation)
  const insight = detectFodmapBloatingInsight(recent, symptoms, today);
  if (insight) tips.push(insight);

  return tips;
}

// ── 3. Insight : corrélation FODMAP ↔ ballonnements ─────────────

function detectFodmapBloatingInsight(
  journal: JournalEntry[],
  symptoms: SymptomEntry[],
  today: string,
): DayTip | null {
  const pairs: { hasFodmap: boolean; bloating: number }[] = [];

  for (const entry of journal.filter((e) => e.date < today).slice(-14)) {
    const sym = symptoms.find((s) => s.date === entry.date);
    if (!sym || sym.scores.bloating < 0) continue;
    pairs.push({ hasFodmap: dayHasFodmap(entry), bloating: sym.scores.bloating });
  }

  if (pairs.length < 6) return null;

  const fodmapDays = pairs.filter((p) => p.hasFodmap);
  const cleanDays  = pairs.filter((p) => !p.hasFodmap);

  if (fodmapDays.length < 3 || cleanDays.length < 2) return null;

  const avgFodmap = avg(fodmapDays.map((p) => p.bloating));
  const avgClean  = avg(cleanDays.map((p) => p.bloating));

  if (avgFodmap - avgClean > 0.9 && avgFodmap > 1.8) {
    return tip(
      'insight_fodmap_bloating', 'insight', 'info', '🧠',
      `Pattern détecté : les journées avec aliments fermentescibles semblent associées à plus de ballonnements (${avgFodmap.toFixed(1)} vs ${avgClean.toFixed(1)}/4 en moyenne).`,
    );
  }
  return null;
}

// ── 4. Educational tip (daily rotation) ─────────────────────────

function getEducationalTip(
  date: string,
  contextualTips: DayTip[],
  patternTips: DayTip[],
): DayTip {
  // Avoid repeating the same topic as a contextual/pattern tip
  const usedTags = new Set<TipTag>();
  if (contextualTips.some((t) => t.id.includes('fodmap'))) usedTags.add('fodmap');
  if (contextualTips.some((t) => t.id.includes('glycemic'))) usedTags.add('glycemia');
  if (contextualTips.some((t) => t.id.includes('fat'))) usedTags.add('digestion');
  if (patternTips.some((t) => t.id.includes('bloat') || t.id.includes('fodmap'))) usedTags.add('fodmap');
  if (patternTips.some((t) => t.id.includes('energy'))) usedTags.add('protein');

  const seed = dayOfYear(date);
  const pool = usedTags.size > 0
    ? EDUCATIONAL_TIPS.filter((t) => !usedTags.has(t.tag))
    : EDUCATIONAL_TIPS;

  const selected = pool.length > 0 ? pool : EDUCATIONAL_TIPS;
  const edu = selected[seed % selected.length];

  return {
    id: edu.id,
    kind: 'educational',
    level: 'info',
    emoji: edu.emoji,
    message: edu.message,
  };
}

// ── Main export ─────────────────────────────────────────────────

export function computeDayTips({
  meals,
  journal,
  symptoms,
  profile,
  date,
}: {
  meals: Meal[];
  journal: JournalEntry[];
  symptoms: SymptomEntry[];
  profile: UserProfile;
  date: string;
}): DayTip[] {
  const contextual = getContextualTips(meals, profile);
  const patterns   = getPatternTips(journal, symptoms, date);
  const educational = getEducationalTip(date, contextual, patterns);

  // Priority: caution > pattern insight > info contextual > positive > educational
  const caution  = [...contextual, ...patterns].filter((t) => t.level === 'caution');
  const insights = patterns.filter((t) => t.kind === 'insight');
  const infos    = [...contextual, ...patterns].filter((t) => t.level === 'info' && t.kind !== 'insight');
  const positive = [...contextual, ...patterns].filter((t) => t.level === 'positive');

  const selected: DayTip[] = [];

  // 1 caution max
  if (caution.length > 0) selected.push(caution[0]);

  // 1 insight or pattern tip if room
  const nextPriority = [...insights, ...infos];
  const alreadyIds = new Set(selected.map((t) => t.id));
  for (const t of nextPriority) {
    if (selected.length >= 2) break;
    if (!alreadyIds.has(t.id)) { selected.push(t); alreadyIds.add(t.id); }
  }

  // 1 positive if room and no caution
  if (selected.length < 2 && positive.length > 0 && caution.length === 0) {
    selected.push(positive[0]);
  }

  // Fill with educational tip (always at least 1 tip per day)
  if (selected.length < 3 && !alreadyIds.has(educational.id)) {
    selected.push(educational);
  }

  // Guarantee at least the educational tip on days with no contextual signals
  if (selected.length === 0) selected.push(educational);

  return selected.slice(0, 3);
}
