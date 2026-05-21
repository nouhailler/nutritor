import {
  DigestiveSensitivity,
  DigestiveTolerances,
  DEFAULT_SENSITIVITIES,
  DEFAULT_TOLERANCES,
} from '../types/shopping';

export type { DigestiveSensitivity, DigestiveTolerances };

export interface Vitamin {
  name: string;
  short: string;
  unit: string;
  rda: number;
  today: number;
  role: string;
}

export interface Diet {
  id: string;
  label: string;
  on: boolean;
  rule: string;
}

export type AllergenLevel = 'sévère' | 'modéré' | 'trace' | 'aucun';

export interface AllergenEntry {
  name: string;
  level: AllergenLevel;
  note: string;
}

export interface UserProfile {
  name: string;
  initial: string;
  kcalTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  vitamins: Vitamin[];
  age: number;
  weight: number;
  height: number;
  goal: string;
  activity: string;
  diets: Diet[];
  allergens: AllergenEntry[];
  // Shopping assistant — optional for backward compat with persisted data
  digestiveSensitivities?: DigestiveSensitivity[];
  objectives?: string[];
  digestiveTolerances?: DigestiveTolerances;
  pathologies?: string[];
}

export function getDigestiveSensitivities(profile: UserProfile): DigestiveSensitivity[] {
  return profile.digestiveSensitivities ?? DEFAULT_SENSITIVITIES;
}

export function getDigestiveTolerances(profile: UserProfile): DigestiveTolerances {
  return profile.digestiveTolerances ?? DEFAULT_TOLERANCES;
}

/** Compute diet summary string from active diets */
export function computeDietLabel(diets: Diet[]): string {
  const active = diets.filter((d) => d.on).map((d) => d.label);
  return active.length > 0 ? active.join(' · ') : 'Aucun régime actif';
}

/** Compute initial letter from name */
export function computeInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Élise',
  initial: 'É',
  kcalTarget: 2100,
  macroTargets: { protein: 130, carbs: 220, fat: 70 },

  vitamins: [
    { name: 'Vitamine A',   short: 'A',   unit: 'µg', rda: 800,  today: 245,  role: 'Vision, immunité, peau' },
    { name: 'Vitamine B1',  short: 'B1',  unit: 'mg', rda: 1.1,  today: 0.42, role: 'Métabolisme des glucides' },
    { name: 'Vitamine B2',  short: 'B2',  unit: 'mg', rda: 1.4,  today: 0.38, role: "Production d'énergie" },
    { name: 'Vitamine B3',  short: 'B3',  unit: 'mg', rda: 16,   today: 4.2,  role: 'Métabolisme cellulaire' },
    { name: 'Vitamine B5',  short: 'B5',  unit: 'mg', rda: 6,    today: 1.6,  role: 'Synthèse coenzyme A' },
    { name: 'Vitamine B6',  short: 'B6',  unit: 'mg', rda: 1.4,  today: 0.62, role: 'Neurotransmetteurs' },
    { name: 'Vitamine B8',  short: 'B8',  unit: 'µg', rda: 50,   today: 12,   role: 'Biotine · cheveux, peau' },
    { name: 'Vitamine B9',  short: 'B9',  unit: 'µg', rda: 200,  today: 152,  role: 'Synthèse ADN, folates' },
    { name: 'Vitamine B12', short: 'B12', unit: 'µg', rda: 2.5,  today: 0.4,  role: 'Globules rouges, nerfs' },
    { name: 'Vitamine C',   short: 'C',   unit: 'mg', rda: 80,   today: 36,   role: 'Anti-oxydant, absorption fer' },
    { name: 'Vitamine D',   short: 'D',   unit: 'µg', rda: 5,    today: 0.8,  role: 'Os, immunité' },
    { name: 'Vitamine E',   short: 'E',   unit: 'mg', rda: 12,   today: 5.8,  role: 'Anti-oxydant, membranes' },
    { name: 'Vitamine K',   short: 'K',   unit: 'µg', rda: 75,   today: 22,   role: 'Coagulation, os' },
  ],

  age: 32,
  weight: 64,
  height: 168,
  goal: 'Maintien · digestion sereine',
  activity: 'Modérée · 3 séances / semaine',

  diets: [
    { id: 'gf',  label: 'Sans gluten',   on: true,  rule: 'Strict' },
    { id: 'lf',  label: 'Sans lactose',  on: true,  rule: 'Strict' },
    { id: 'low', label: 'Low FODMAP',    on: true,  rule: 'Phase réintroduction' },
    { id: 'veg', label: 'Végétarien',    on: false, rule: '—' },
    { id: 'vgn', label: 'Vegan',         on: false, rule: '—' },
    { id: 'kt',  label: 'Cétogène',      on: false, rule: '—' },
  ],

  digestiveSensitivities: [
    { id: 'fructans',   level: 'strong'   },
    { id: 'polyols',    level: 'moderate' },
    { id: 'lactose',    level: 'moderate' },
    { id: 'histamine',  level: 'none'     },
    { id: 'gluten',     level: 'strong'   },
    { id: 'caffeine',   level: 'none'     },
    { id: 'sweeteners', level: 'mild'     },
    { id: 'fattyFoods', level: 'none'     },
  ],
  objectives: ['digestion'],
  digestiveTolerances: {
    legumes:     'low',
    fruits:      'medium',
    cruciferous: 'medium',
    alliums:     'low',
    cereals:     'medium',
  },
  pathologies: ['ibs'],

  allergens: [
    { name: 'Gluten',           level: 'sévère',  note: 'Maladie cœliaque diagnostiquée 2019' },
    { name: 'Lactose',          level: 'modéré',  note: 'Inconfort > 4 g / repas' },
    { name: 'Fruits à coque',   level: 'trace',   note: 'Surveillance · anaphylaxie familiale' },
    { name: 'Arachides',        level: 'aucun',   note: '' },
    { name: 'Œufs',             level: 'aucun',   note: '' },
    { name: 'Poisson',          level: 'aucun',   note: '' },
    { name: 'Crustacés',        level: 'aucun',   note: '' },
    { name: 'Soja',             level: 'aucun',   note: '' },
    { name: 'Sésame',           level: 'aucun',   note: '' },
    { name: 'Moutarde',         level: 'aucun',   note: '' },
    { name: 'Céleri',           level: 'aucun',   note: '' },
    { name: 'Sulfites',         level: 'aucun',   note: '' },
    { name: 'Mollusques',       level: 'aucun',   note: '' },
    { name: 'Lupin',            level: 'aucun',   note: '' },
  ],
};

// Keep backward-compat export for DrawerMenu / HomeScreen
export const USER_PROFILE = DEFAULT_PROFILE;
