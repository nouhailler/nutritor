export const SYMPTOM_KEYS = [
  'abdominal',
  'bloating',
  'energy',
  'transit',
  'sleep',
  'inflammation',
] as const;

export type SymptomKey = typeof SYMPTOM_KEYS[number];

// 0–4 scale ; -1 = non renseigné
export type SymptomScores = Record<SymptomKey, number>;

export const UNSET_SCORES: SymptomScores = {
  abdominal:    -1,
  bloating:     -1,
  energy:       -1,
  transit:      -1,
  sleep:        -1,
  inflammation: -1,
};

export interface SymptomEntry {
  date: string;           // 'YYYY-MM-DD'
  scores: SymptomScores;
}

export interface SymptomConfig {
  label: string;
  shortLabel: string;
  lowLabel: string;       // label pour score 0
  highLabel: string;      // label pour score 4
  // true  = score élevé → mauvais signe (douleur, ballonnements)
  // false = score élevé → bon signe  (énergie, sommeil)
  // null  = score médian optimal     (transit : 2 = normal)
  inverse: boolean | null;
}

export const SYMPTOM_CONFIG: Record<SymptomKey, SymptomConfig> = {
  abdominal: {
    label:      'Douleurs abdominales',
    shortLabel: 'Douleurs',
    lowLabel:   'Aucune',
    highLabel:  'Fortes',
    inverse:    true,
  },
  bloating: {
    label:      'Ballonnements',
    shortLabel: 'Ballonnem.',
    lowLabel:   'Aucun',
    highLabel:  'Forts',
    inverse:    true,
  },
  energy: {
    label:      'Énergie',
    shortLabel: 'Énergie',
    lowLabel:   'Épuisé',
    highLabel:  'Pleine forme',
    inverse:    false,
  },
  transit: {
    label:      'Transit',
    shortLabel: 'Transit',
    lowLabel:   'Très lent',
    highLabel:  'Très rapide',
    inverse:    null,   // 2 = normal, 0 et 4 = extrêmes
  },
  sleep: {
    label:      'Sommeil',
    shortLabel: 'Sommeil',
    lowLabel:   'Mauvais',
    highLabel:  'Excellent',
    inverse:    false,
  },
  inflammation: {
    label:      'Inflammation perçue',
    shortLabel: 'Inflam.',
    lowLabel:   'Nulle',
    highLabel:  'Forte',
    inverse:    true,
  },
};

// Retourne la couleur sémantique d'un score pour un symptôme donné
export function symptomScoreColor(key: SymptomKey, score: number): 'ok' | 'mid' | 'warn' | 'neutral' {
  if (score < 0) return 'neutral';
  const cfg = SYMPTOM_CONFIG[key];
  if (cfg.inverse === null) {
    // transit : 2 = ok, 1/3 = mid, 0/4 = warn
    const dist = Math.abs(score - 2);
    if (dist === 0) return 'ok';
    if (dist === 1) return 'mid';
    return 'warn';
  }
  const effective = cfg.inverse ? score : 4 - score;
  if (effective <= 1) return 'ok';
  if (effective === 2) return 'mid';
  return 'warn';
}

// Score agrégé du jour (0–100, 100 = parfait)
export function aggregateDayScore(scores: SymptomScores): number | null {
  const filled = SYMPTOM_KEYS.filter((k) => scores[k] >= 0);
  if (filled.length === 0) return null;
  const total = filled.reduce((sum, k) => {
    const cfg = SYMPTOM_CONFIG[k];
    const s = scores[k];
    let normalized: number;
    if (cfg.inverse === null) {
      // transit: 2 = parfait (100), 0/4 = mauvais (0)
      normalized = 1 - Math.abs(s - 2) / 2;
    } else if (cfg.inverse) {
      normalized = 1 - s / 4;
    } else {
      normalized = s / 4;
    }
    return sum + normalized;
  }, 0);
  return Math.round((total / filled.length) * 100);
}
