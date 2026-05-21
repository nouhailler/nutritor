// ── Shopping assistant types ───────────────────────────────────

export type SensitivityLevel = 'none' | 'mild' | 'moderate' | 'strong';
export type DigestiveTolerance = 'low' | 'medium' | 'good';

export interface SensitivityDefinition {
  id: string;
  label: string;
  impact: 'critical' | 'strong' | 'medium';
}

export const SENSITIVITY_DEFINITIONS: SensitivityDefinition[] = [
  { id: 'fructans',   label: 'Fructanes',      impact: 'critical' },
  { id: 'polyols',    label: 'Polyols',         impact: 'critical' },
  { id: 'lactose',    label: 'Lactose',         impact: 'critical' },
  { id: 'histamine',  label: 'Histamine',       impact: 'strong'   },
  { id: 'gluten',     label: 'Gluten',          impact: 'strong'   },
  { id: 'caffeine',   label: 'Caféine',         impact: 'medium'   },
  { id: 'sweeteners', label: 'Édulcorants',     impact: 'strong'   },
  { id: 'fattyFoods', label: 'Aliments gras',   impact: 'strong'   },
];

export interface ObjectiveDefinition {
  id: string;
  label: string;
}

export const OBJECTIVE_DEFINITIONS: ObjectiveDefinition[] = [
  { id: 'digestion',        label: 'Digestion' },
  { id: 'energy',           label: 'Énergie' },
  { id: 'glycemia',         label: 'Glycémie stable' },
  { id: 'sport',            label: 'Performance sportive' },
  { id: 'antiInflammatory', label: 'Anti-inflammatoire' },
];

export interface ToleranceDefinition {
  id: keyof DigestiveTolerances;
  label: string;
}

export const TOLERANCE_DEFINITIONS: ToleranceDefinition[] = [
  { id: 'legumes',     label: 'Légumineuses' },
  { id: 'fruits',      label: 'Fruits' },
  { id: 'cruciferous', label: 'Crucifères (choux…)' },
  { id: 'alliums',     label: 'Alliacées (ail, oignon…)' },
  { id: 'cereals',     label: 'Céréales' },
];

export interface PathologyDefinition {
  id: string;
  label: string;
}

export const PATHOLOGY_DEFINITIONS: PathologyDefinition[] = [
  { id: 'ibs',          label: 'SII — syndrome de l\'intestin irritable' },
  { id: 'reflux',       label: 'Reflux gastrique' },
  { id: 'crohn',        label: 'Maladie de Crohn' },
  { id: 'uc',           label: 'RCH — rectocolite hémorragique' },
  { id: 'foodMigraine', label: 'Migraine alimentaire' },
];

export interface DigestiveSensitivity {
  id: string;
  level: SensitivityLevel;
}

export interface DigestiveTolerances {
  legumes:     DigestiveTolerance;
  fruits:      DigestiveTolerance;
  cruciferous: DigestiveTolerance;
  alliums:     DigestiveTolerance;
  cereals:     DigestiveTolerance;
}

export const DEFAULT_SENSITIVITIES: DigestiveSensitivity[] = SENSITIVITY_DEFINITIONS.map((d) => ({
  id: d.id,
  level: 'none' as SensitivityLevel,
}));

export const DEFAULT_TOLERANCES: DigestiveTolerances = {
  legumes:     'medium',
  fruits:      'good',
  cruciferous: 'medium',
  alliums:     'medium',
  cereals:     'good',
};

export interface CompatibilityIssue {
  label: string;
  severity: 'critical' | 'strong' | 'medium' | 'low';
  detail: string;
}

export interface CompatibilityResult {
  score: number;
  verdict: 'good' | 'caution' | 'bad';
  issues: CompatibilityIssue[];
  positives: string[];
  ultraProcessed: boolean;
  additiveFlagCount: number;
  fodmapFlagCount: number;
}

export interface ScanHistoryEntry {
  id: string;
  ts: number;
  productName: string;
  brand: string;
  score: number;
  verdict: 'good' | 'caution' | 'bad';
  barcode: string;
  issues: CompatibilityIssue[];
  positives: string[];
  ultraProcessed: boolean;
}

export interface ShoppingListItem {
  id: string;
  ts: number;
  productName: string;
  brand: string;
  barcode: string;
  score: number;
  verdict: 'good' | 'caution' | 'bad';
  addedToNutritor: boolean;
}
