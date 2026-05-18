// ── Types ─────────────────────────────────────────────────────

export type FodmapPhase = 'elimination' | 'reintroduction' | 'stabilization';
export type TestResult  = 'ok' | 'moderate' | 'severe' | 'pending';

export interface TestedFood {
  id: string;
  foodName: string;
  foodId?: string;
  fodmapType?: string;   // canonical FODMAP type (e.g. "Fructanes")
  portionTested?: string;
  result: TestResult;
  testedAt: string;      // ISO date YYYY-MM-DD
  notes?: string;
  phase: FodmapPhase;
}

export interface ReactionEntry {
  id: string;
  date: string;          // ISO date YYYY-MM-DD
  severity: 1 | 2 | 3;  // 1=léger 2=modéré 3=sévère
  symptoms: string[];
  foodName?: string;
  testedFoodId?: string;
  notes?: string;
  phase: FodmapPhase;
}

export interface FodmapProtocol {
  active: boolean;
  phase: FodmapPhase;
  startDate: string;       // début du protocole global
  phaseStartDate: string;  // début de la phase actuelle
  testedFoods: TestedFood[];
  reactions: ReactionEntry[];
}

// ── Phase configuration ───────────────────────────────────────

export const PHASE_CONFIG: Record<FodmapPhase, {
  label: string;
  emoji: string;
  durationDays: number | null;
  rule: string;
  tip: string;
  color: string;
  bgColor: string;
}> = {
  elimination: {
    label:       'Élimination',
    emoji:       '🔴',
    durationDays: 28,
    rule:        'Supprimer tous les aliments FODMAP élevés pendant 2 à 4 semaines.',
    tip:         'C\'est la phase la plus stricte — elle établit votre ligne de base.',
    color:       '#8B3A2E',
    bgColor:     'rgba(139,58,46,0.07)',
  },
  reintroduction: {
    label:       'Réintroduction',
    emoji:       '🟡',
    durationDays: 42,
    rule:        'Tester un groupe FODMAP à la fois — 3 jours de test, 3 jours de repos.',
    tip:         'Notez chaque réaction même légère. La précision ici détermine vos tolérances.',
    color:       '#6B5A2E',
    bgColor:     'rgba(107,90,46,0.07)',
  },
  stabilization: {
    label:       'Stabilisation',
    emoji:       '🟢',
    durationDays: null,
    rule:        'Construire une alimentation personnalisée basée sur vos seuils de tolérance.',
    tip:         'Continuez à tester de nouveaux aliments à votre rythme.',
    color:       '#3F5A3A',
    bgColor:     'rgba(63,90,58,0.07)',
  },
};

// ── FODMAP type taxonomy ───────────────────────────────────────

export interface FodmapTypeEntry {
  name: string;
  abbr: string;
  examples: string;
}

export const FODMAP_TYPES: FodmapTypeEntry[] = [
  { name: 'Fructanes',            abbr: 'F',  examples: 'Blé, oignon, ail, poireau' },
  { name: 'GOS',                  abbr: 'G',  examples: 'Légumineuses, choux, noix de cajou' },
  { name: 'Lactose',              abbr: 'L',  examples: 'Lait, yaourt, fromage frais' },
  { name: 'Fructose',             abbr: 'Fr', examples: 'Miel, pomme, mangue, sirop de maïs' },
  { name: 'Sorbitol',             abbr: 'So', examples: 'Pomme, poire, abricot, pêche' },
  { name: 'Mannitol',             abbr: 'Ma', examples: 'Champignons, chou-fleur, céleri' },
  { name: 'Polyols (autres)',     abbr: 'Po', examples: 'Édulcorants en -ol (xylitol, maltitol…)' },
];

// ── Symptom options ───────────────────────────────────────────

export const SYMPTOM_OPTIONS = [
  'Ballonnements',
  'Douleurs abdominales',
  'Diarrhée',
  'Constipation',
  'Nausées',
  'Crampes',
  'Gaz excessifs',
  'Fatigue',
  'Maux de tête',
];

// ── Result config ─────────────────────────────────────────────

export const RESULT_CONFIG: Record<TestResult, { label: string; icon: string; color: string; bg: string }> = {
  ok:       { label: 'Toléré',      icon: '✓', color: '#3F5A3A', bg: 'rgba(63,90,58,0.10)'  },
  moderate: { label: 'Modéré',      icon: '▲', color: '#6B5A2E', bg: 'rgba(107,90,46,0.10)' },
  severe:   { label: 'Non toléré',  icon: '✕', color: '#8B3A2E', bg: 'rgba(139,58,46,0.10)' },
  pending:  { label: 'En cours',    icon: '⟳', color: '#8A8270', bg: 'rgba(138,130,112,0.10)' },
};

// ── Helpers ───────────────────────────────────────────────────

export function daysSince(isoDate: string): number {
  const start = new Date(isoDate);
  const now   = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long',
  });
}

/** Aggregate tolerance per FODMAP type from tested foods */
export function buildToleranceMap(testedFoods: TestedFood[]): Record<string, TestResult> {
  const map: Record<string, TestResult> = {};
  for (const tf of testedFoods) {
    if (!tf.fodmapType) continue;
    const current = map[tf.fodmapType];
    // Worst result wins
    if (!current) { map[tf.fodmapType] = tf.result; continue; }
    const rank: Record<TestResult, number> = { severe: 3, moderate: 2, pending: 1, ok: 0 };
    if (rank[tf.result] > rank[current]) map[tf.fodmapType] = tf.result;
  }
  return map;
}

// ── Default protocol ──────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

export const DEFAULT_FODMAP_PROTOCOL: FodmapProtocol = {
  active:         true,
  phase:          'elimination',
  startDate:      TODAY,
  phaseStartDate: TODAY,
  testedFoods:    [],
  reactions:      [],
};
