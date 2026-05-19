export interface AminoAcid {
  name: string;
  qty: string;
  role: string;
  essential: boolean;
}

export interface ProteinDetail {
  totalG: number;
  complete: boolean;
  bcaaG: number;
  pdcaas: number;
  amino: AminoAcid[];
}

export interface CarbDetail {
  totalG: number;
  starchG: number;
  sugarsG: number;
  fiberG: number;
  fiberSolubleG: number;
  fiberInsolubleG: number;
  glycemicIndex: number;
  glycemicLoad: number;
  notes: string;
}

export interface FattyAcid {
  name: string;
  qty: string;
  pct: string;
  role: string;
}

export interface LipidDetail {
  totalG: number;
  fa: FattyAcid[];
  ratioOmega: string;
}

export interface NutriItem {
  name: string;
  qty: string;
  anr?: string;
  role: string;
}

export interface FodmapType {
  name: string;
  present: string;
  level: string;
}

export interface FodmapThreshold {
  portion: string;
  status: string;
  note: string;
}

export interface FodmapAlternative {
  name: string;
  why: string;
}

export interface Fodmap {
  overall: 'low' | 'moderate' | 'high';
  types: FodmapType[];
  elimination: FodmapThreshold;
  reintroduction: FodmapThreshold;
  absoluteLimit: FodmapThreshold;
  alternatives: FodmapAlternative[];
}

export interface Bioactive {
  name: string;
  qty: string;
  role: string;
}

export interface MetabolicItem {
  axis: string;
  tone: 'high' | 'mid' | 'low';
  text: string;
}

export interface Sensory {
  taste: string[];
  texture: string[];
  aroma: string[];
  pairings: string[];
}

export interface Allergen {
  name: string;
  status: 'contains' | 'trace' | 'absent';
}

export interface CompatItem {
  label: string;
  kind: 'ok' | 'warn';
}

export interface Food {
  id: string;
  category: string;
  name: string;
  subtitle: string;
  brand: string;
  origin?: string;
  defaultPortion: number;
  unit: string;
  per100: {
    kcal: number;
    fat: number;
    fatSat: number;
    carbs: number;
    sugars: number;
    fiber: number;
    protein: number;
    salt: number;
  };
  proteinDetail?: ProteinDetail;
  carbDetail?: CarbDetail;
  lipidDetail?: LipidDetail;
  minerals?: NutriItem[];
  vitamins?: NutriItem[];
  trace?: NutriItem[];
  fodmap?: Fodmap;
  bioactives?: Bioactive[];
  metabolic?: MetabolicItem[];
  sensory?: Sensory;
  allergens: Allergen[];
  compat: CompatItem[];
  ingredients: string;
  ingredientsHighlights?: string[];
}

export interface MealItem {
  name: string;
  qty: string;
  kcal: number;
  macros: { protein: number; carbs: number; fat: number };
  foodId?: string;
  portionNum?: number;
  unit?: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
}
