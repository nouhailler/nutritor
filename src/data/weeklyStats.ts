import { Meal } from '../types/index';
import { UserProfile } from './user';

// ── Journal entry (persisted) ─────────────────────────────────

export interface JournalEntry {
  date: string;    // 'YYYY-MM-DD'
  meals: Meal[];
}

// Empty meal structure for unlogged days
export const EMPTY_DAY_MEALS: Meal[] = [
  { id: 'm-brk', name: 'Petit-déjeuner',   time: '08:00', items: [] },
  { id: 'm-sn1', name: 'Encas matin',       time: '10:30', items: [] },
  { id: 'm-lun', name: 'Déjeuner',          time: '13:00', items: [] },
  { id: 'm-sn2', name: 'Encas après-midi',  time: '16:30', items: [] },
  { id: 'm-din', name: 'Dîner',             time: '20:00', items: [] },
];

// ── DayLog ────────────────────────────────────────────────────

export interface DayLog {
  date: string;        // 'YYYY-MM-DD'
  kcal: number;
  p: number;           // protein g
  c: number;           // carbs g
  f: number;           // fat g
  foodNames: string[]; // all item names this day (for diversity)
  mealsFilled: number; // how many slots had items
  mealSlots: string[]; // which meal names had items
}

export function computeDayLog(meals: Meal[], date: string): DayLog {
  const kcal = meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.kcal, 0), 0);
  const p    = meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.macros.protein, 0), 0);
  const c    = meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.macros.carbs, 0), 0);
  const f    = meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.macros.fat, 0), 0);
  const allNames = meals.flatMap((m) => m.items.map((i) => i.name));
  const foodNames = [...new Set(allNames)];
  const mealSlots = meals.filter((m) => m.items.length > 0).map((m) => m.name);
  return {
    date,
    kcal: Math.round(kcal),
    p: Math.round(p * 10) / 10,
    c: Math.round(c * 10) / 10,
    f: Math.round(f * 10) / 10,
    foodNames,
    mealsFilled: mealSlots.length,
    mealSlots,
  };
}

// ── Week computation ──────────────────────────────────────────

export interface WeekDayData {
  date: string;
  dayLabel: string;   // 'Lun'
  dayNum: string;     // '12'
  log: DayLog | null;
  isToday: boolean;
  isFuture: boolean;
  score: number;      // 0–1 composite
}

export interface WeekStats {
  weekLabel: string;
  weekOffset: number;
  days: WeekDayData[];
  avgKcal: number;
  avgP: number;
  avgC: number;
  avgF: number;
  loggedDays: number;
  daysOnKcalTarget: number;
  currentStreak: number;
  uniqueFoodsWeek: number;
  weekScore: number;              // 0–100
  prevWeekAvgKcal: number | null;
  kcalDeltaPct: number | null;
  insights: { label: string; trend: string; tone: 'good' | 'warn' | 'mid' }[];
}

// ── Helpers ───────────────────────────────────────────────────

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const MONTH_SHORT = [
  'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
  'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
];

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMondayOfWeek(now: Date, offset: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon + offset * 7);
  return d;
}

function computeScore(log: DayLog, profile: UserProfile): number {
  if (log.kcal === 0 && log.mealsFilled === 0) return 0;
  const kcalRatio = Math.abs(log.kcal - profile.kcalTarget) / Math.max(profile.kcalTarget, 1);
  const kcalScore = Math.max(0, 1 - kcalRatio * 2);
  const pTarget = profile.macroTargets.protein || 130;
  const cTarget = profile.macroTargets.carbs   || 220;
  const fTarget = profile.macroTargets.fat     || 70;
  const pScore = Math.min(1, log.p / pTarget);
  const cScore = Math.max(0, 1 - Math.abs(log.c - cTarget) / cTarget);
  const fScore = Math.max(0, 1 - Math.abs(log.f - fTarget) / fTarget);
  return kcalScore * 0.4 + pScore * 0.3 + cScore * 0.2 + fScore * 0.1;
}

// ── Main export ───────────────────────────────────────────────

export function computeWeekStats(
  journal: JournalEntry[],
  todayMeals: Meal[],
  profile: UserProfile,
  weekOffset: number,
): WeekStats {
  const now = new Date();
  const todayStr = dateToStr(now);
  const todayLog = computeDayLog(todayMeals, todayStr);

  const monday = getMondayOfWeek(now, weekOffset);

  const days: WeekDayData[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = dateToStr(d);
    const isToday = dateStr === todayStr;
    const isFuture = d > now && !isToday;
    let log: DayLog | null = null;
    if (isToday) {
      log = todayLog;
    } else if (!isFuture) {
      const entry = journal.find((j) => j.date === dateStr);
      // Guard against old DayLog-format data (no meals field)
      log = (entry && Array.isArray(entry.meals))
        ? computeDayLog(entry.meals, dateStr)
        : null;
    }
    days.push({
      date: dateStr,
      dayLabel: DAY_LABELS[d.getDay()],
      dayNum: String(d.getDate()),
      log,
      isToday,
      isFuture,
      score: log ? computeScore(log, profile) : 0,
    });
  }

  // Week label
  const s = new Date(days[0].date);
  const e = new Date(days[6].date);
  const weekLabel =
    s.getMonth() === e.getMonth()
      ? `du ${s.getDate()} au ${e.getDate()} ${MONTH_SHORT[e.getMonth()]}`
      : `${s.getDate()} ${MONTH_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTH_SHORT[e.getMonth()]}`;

  // Aggregates
  const logged = days.filter(
    (d) => d.log && (d.log.kcal > 0 || d.log.mealsFilled > 0),
  );
  const loggedDays = logged.length;
  const avg = (fn: (l: DayLog) => number) =>
    loggedDays > 0
      ? Math.round((logged.reduce((s, d) => s + fn(d.log!), 0) / loggedDays) * 10) / 10
      : 0;
  const avgKcal = Math.round(avg((l) => l.kcal));
  const avgP    = avg((l) => l.p);
  const avgC    = avg((l) => l.c);
  const avgF    = avg((l) => l.f);

  const daysOnKcalTarget = logged.filter(
    (d) => Math.abs(d.log!.kcal - profile.kcalTarget) / profile.kcalTarget <= 0.1,
  ).length;

  // Unique foods this week
  const allFoods = new Set(logged.flatMap((d) => d.log!.foodNames));
  const uniqueFoodsWeek = allFoods.size;

  // Current streak (consecutive logged days up to today)
  let currentStreak = 0;
  {
    const hasToday = todayLog.kcal > 0 || todayLog.mealsFilled > 0;
    if (hasToday) currentStreak = 1;
    let checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const ds = dateToStr(checkDate);
      const entry = journal.find((j) => j.date === ds);
      if (entry && Array.isArray(entry.meals)) {
        const dl = computeDayLog(entry.meals, ds);
        if (dl.kcal > 0 || dl.mealsFilled > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // Week score
  const weekScore =
    loggedDays > 0
      ? Math.round((logged.reduce((s, d) => s + d.score, 0) / loggedDays) * 100)
      : 0;

  // Previous week comparison (only for current week)
  let prevWeekAvgKcal: number | null = null;
  let kcalDeltaPct: number | null = null;
  if (weekOffset === 0) {
    const prevMonday = getMondayOfWeek(now, -1);
    const prevDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + i);
      return dateToStr(d);
    });
    const prevLogs = journal
      .filter((j) => prevDates.includes(j.date) && Array.isArray(j.meals))
      .map((j) => computeDayLog(j.meals, j.date))
      .filter((l) => l.kcal > 0 || l.mealsFilled > 0);
    if (prevLogs.length > 0) {
      prevWeekAvgKcal = Math.round(
        prevLogs.reduce((s, l: DayLog) => s + l.kcal, 0) / prevLogs.length,
      );
      if (avgKcal > 0) {
        kcalDeltaPct = Math.round(
          ((avgKcal - prevWeekAvgKcal) / prevWeekAvgKcal) * 100,
        );
      }
    }
  }

  // Auto-insights
  const insights: WeekStats['insights'] = [];
  const pTarget = profile.macroTargets.protein || 130;
  const cTarget = profile.macroTargets.carbs   || 220;

  if (loggedDays === 0) {
    insights.push({ label: 'Aucun repas enregistré', trend: 'Commencez à logger', tone: 'mid' });
  } else {
    // Protein compliance
    const pPct = Math.round((avgP / pTarget) * 100);
    if (pPct >= 90) insights.push({ label: 'Protéines', trend: `${pPct} % de l'objectif`, tone: 'good' });
    else if (pPct < 70) insights.push({ label: 'Protéines insuffisantes', trend: `${pPct} % de l'objectif`, tone: 'warn' });
    else insights.push({ label: 'Protéines', trend: `${pPct} % de l'objectif`, tone: 'mid' });

    // Kcal compliance
    if (daysOnKcalTarget >= 5)
      insights.push({ label: 'Calories dans la cible', trend: `${daysOnKcalTarget}/7 jours`, tone: 'good' });
    else if (daysOnKcalTarget >= 3)
      insights.push({ label: 'Calories dans la cible', trend: `${daysOnKcalTarget}/${loggedDays} jours`, tone: 'mid' });
    else if (loggedDays >= 3)
      insights.push({ label: 'Calories hors cible', trend: `${daysOnKcalTarget}/${loggedDays} jours`, tone: 'warn' });

    // Food diversity
    const avgFoods = Math.round(logged.reduce((s, d) => s + d.log!.foodNames.length, 0) / loggedDays);
    if (avgFoods >= 8) insights.push({ label: 'Diversité alimentaire', trend: `~${avgFoods} aliments/j`, tone: 'good' });
    else if (avgFoods >= 4) insights.push({ label: 'Diversité alimentaire', trend: `~${avgFoods} aliments/j`, tone: 'mid' });
    else if (loggedDays >= 2) insights.push({ label: 'Diversité faible', trend: `~${avgFoods} aliments/j`, tone: 'warn' });

    // Meal regularity
    const avgMeals = logged.reduce((s, d) => s + d.log!.mealsFilled, 0) / loggedDays;
    if (avgMeals >= 3.5)
      insights.push({ label: 'Régularité des repas', trend: `${avgMeals.toFixed(1)} repas/j`, tone: 'good' });
    else if (avgMeals < 2 && loggedDays >= 3)
      insights.push({ label: 'Repas irréguliers', trend: `${avgMeals.toFixed(1)} repas/j`, tone: 'warn' });
    else
      insights.push({ label: 'Régularité des repas', trend: `${avgMeals.toFixed(1)} repas/j`, tone: 'mid' });

    // Carbs balance
    if (avgC > cTarget * 1.2)
      insights.push({ label: 'Glucides élevés', trend: `+${Math.round(avgC - cTarget)} g vs objectif`, tone: 'warn' });
    else if (avgC < cTarget * 0.7)
      insights.push({ label: 'Glucides bas', trend: `${Math.round(avgC - cTarget)} g vs objectif`, tone: 'mid' });

    // Week trend vs previous week
    if (kcalDeltaPct !== null) {
      if (Math.abs(kcalDeltaPct) <= 5)
        insights.push({ label: 'vs semaine précédente', trend: 'Stable (±5 %)', tone: 'good' });
      else if (kcalDeltaPct > 10)
        insights.push({ label: 'vs semaine précédente', trend: `+${kcalDeltaPct} % calories`, tone: 'warn' });
      else if (kcalDeltaPct < -10)
        insights.push({ label: 'vs semaine précédente', trend: `${kcalDeltaPct} % calories`, tone: 'mid' });
    }
  }

  return {
    weekLabel,
    weekOffset,
    days,
    avgKcal,
    avgP,
    avgC,
    avgF,
    loggedDays,
    daysOnKcalTarget,
    currentStreak,
    uniqueFoodsWeek,
    weekScore,
    prevWeekAvgKcal,
    kcalDeltaPct,
    insights,
  };
}

// ── All meal slot names (for grid) ────────────────────────────
export const MEAL_SLOT_NAMES = [
  'Petit-déjeuner',
  'Encas matin',
  'Déjeuner',
  'Encas après-midi',
  'Dîner',
];

export const MEAL_SLOT_SHORT = ['P-dèj', 'Encas↑', 'Déj', 'Encas↓', 'Dîner'];

// ── Multi-week trends ─────────────────────────────────────────

export interface WeekTrendPoint {
  weekLabel: string;
  weekOffset: number;
  avgKcal: number;
  avgP: number;
  avgC: number;
  avgF: number;
  weekScore: number;
  loggedDays: number;
}

export function computeMultiWeekTrends(
  journal: JournalEntry[],
  todayMeals: Meal[],
  profile: UserProfile,
  numWeeks: number = 4,
): WeekTrendPoint[] {
  const results: WeekTrendPoint[] = [];
  for (let offset = -(numWeeks - 1); offset <= 0; offset++) {
    const s = computeWeekStats(journal, todayMeals, profile, offset);
    results.push({
      weekLabel: s.weekLabel,
      weekOffset: offset,
      avgKcal: s.avgKcal,
      avgP: s.avgP,
      avgC: s.avgC,
      avgF: s.avgF,
      weekScore: s.weekScore,
      loggedDays: s.loggedDays,
    });
  }
  return results;
}

// ── Monthly stats ─────────────────────────────────────────────

export interface MonthDayData {
  date: string;
  dayNum: number;
  weekday: number;   // 0=Sun … 6=Sat
  log: DayLog | null;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthStats {
  monthLabel: string;
  year: number;
  month: number;
  days: MonthDayData[];
  avgKcal: number;
  avgP: number;
  avgC: number;
  avgF: number;
  loggedDays: number;
  totalPastDays: number;
  startWeekday: number;  // weekday of day 1 (0=Sun)
}

export function computeMonthStats(
  journal: JournalEntry[],
  todayMeals: Meal[],
  profile: UserProfile,
  monthOffset: number = 0,
): MonthStats {
  const now = new Date();
  const todayStr = dateToStr(now);
  const todayLog = computeDayLog(todayMeals, todayStr);

  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: MonthDayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = dateToStr(date);
    const isToday = dateStr === todayStr;
    const isFuture = date > now && !isToday;

    let log: DayLog | null = null;
    if (isToday) {
      log = todayLog;
    } else if (!isFuture) {
      const entry = journal.find((j) => j.date === dateStr);
      log = entry && Array.isArray(entry.meals)
        ? computeDayLog(entry.meals, dateStr)
        : null;
    }

    days.push({ date: dateStr, dayNum: d, weekday: date.getDay(), log, isToday, isFuture });
  }

  const logged = days.filter((d) => d.log && (d.log.kcal > 0 || d.log.mealsFilled > 0));
  const loggedDays = logged.length;
  const avg = (fn: (l: DayLog) => number) =>
    loggedDays > 0
      ? Math.round((logged.reduce((s, d) => s + fn(d.log!), 0) / loggedDays) * 10) / 10
      : 0;

  const label = MONTH_SHORT[month];
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);

  return {
    monthLabel: `${capitalized} ${year}`,
    year,
    month,
    days,
    avgKcal: Math.round(avg((l) => l.kcal)),
    avgP: avg((l) => l.p),
    avgC: avg((l) => l.c),
    avgF: avg((l) => l.f),
    loggedDays,
    totalPastDays: days.filter((d) => !d.isFuture).length,
    startWeekday: first.getDay(),
  };
}
