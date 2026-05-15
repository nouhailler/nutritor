export interface WeekDay {
  d: string;
  date: string;
  kcal: number;
  target: number;
  p: number;
  c: number;
  f: number;
  compliance: number;
  today?: boolean;
}

export interface WeekSummary {
  avgKcal: number;
  avgP: number;
  avgC: number;
  avgF: number;
  daysOnTarget: number;
  longestStreak: number;
  topAllergen: string;
  noteworthy: { label: string; trend: string; tone: 'good' | 'warn' | 'mid' }[];
}

export const WEEK: WeekDay[] = [
  { d: 'Lun', date: '5',  kcal: 1980, target: 2100, p: 122, c: 215, f: 68, compliance: 0.94 },
  { d: 'Mar', date: '6',  kcal: 2065, target: 2100, p: 135, c: 198, f: 71, compliance: 0.98 },
  { d: 'Mer', date: '7',  kcal: 1820, target: 2100, p: 105, c: 190, f: 60, compliance: 0.87 },
  { d: 'Jeu', date: '8',  kcal: 2210, target: 2100, p: 142, c: 240, f: 75, compliance: 1.00 },
  { d: 'Ven', date: '9',  kcal: 1995, target: 2100, p: 128, c: 210, f: 66, compliance: 0.95 },
  { d: 'Sam', date: '10', kcal: 2380, target: 2100, p: 118, c: 280, f: 90, compliance: 0.82 },
  { d: 'Dim', date: '11', kcal: 0,    target: 2100, p: 0,   c: 0,   f: 0,  compliance: 0,    today: true },
];

export const WEEK_SUMMARY: WeekSummary = {
  avgKcal: 2074,
  avgP: 125,
  avgC: 222,
  avgF: 71,
  daysOnTarget: 5,
  longestStreak: 12,
  topAllergen: 'Gluten · 0 exposition',
  noteworthy: [
    { label: 'Apport en fer',  trend: '+12 %',   tone: 'good' },
    { label: 'Ratio ω6/ω3',   trend: '7:1',      tone: 'warn' },
    { label: 'Hydratation',    trend: '1.6 L/j',  tone: 'mid' },
  ],
};
