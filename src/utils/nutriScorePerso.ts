import { Food } from '../types';
import { UserProfile } from '../data/user';
import { computeCompatibilityScore } from '../data/compatibilityScore';

export type NutriGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NutriScoreResult {
  score: number;          // 0-100
  grade: NutriGrade;
  blockers: string[];     // penalty reasons (short labels)
  positives: string[];    // positive reasons (short labels)
  explanation: string;    // one-sentence summary
}

export const GRADE_COLORS: Record<NutriGrade, string> = {
  A: '#3F5A3A',   // Colors.ok
  B: '#5a7a50',   // ok lighter
  C: '#6B5A2E',   // Colors.signal
  D: '#7a5030',   // warn darker
  E: '#8B3A2E',   // Colors.warn
};

export const GRADE_BG: Record<NutriGrade, string> = {
  A: 'rgba(63,90,58,0.10)',
  B: 'rgba(90,122,80,0.10)',
  C: 'rgba(107,90,46,0.10)',
  D: 'rgba(122,80,48,0.10)',
  E: 'rgba(139,58,46,0.10)',
};

function scoreToGrade(score: number): NutriGrade {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'E';
}

function buildExplanation(grade: NutriGrade, blockers: string[], positives: string[]): string {
  if (blockers.length > 0) {
    const main = blockers[0];
    if (grade === 'E') return `Déconseillé pour vous — ${main.toLowerCase()}.`;
    if (grade === 'D') return `À éviter — ${main.toLowerCase()}.`;
    if (grade === 'C') return `Risque modéré — ${main.toLowerCase()}.`;
  }
  if (positives.length > 0) {
    if (grade === 'A') return `Excellent choix — ${positives[0].toLowerCase()}.`;
    if (grade === 'B') return `Bon choix pour votre profil — ${positives[0].toLowerCase()}.`;
  }
  if (grade === 'A') return 'Aucun problème détecté selon votre profil.';
  if (grade === 'B') return 'Globalement adapté à votre profil.';
  return 'Vérifiez la compatibilité avec vos objectifs.';
}

export function calculateNutriScorePerso(food: Food, profile: UserProfile): NutriScoreResult {
  const compat = computeCompatibilityScore(food, profile);
  const grade = scoreToGrade(compat.score);
  const blockers = compat.reasons.map((r) => r.label);
  const positives = compat.positives.map((p) => p.label);
  const explanation = buildExplanation(grade, blockers, positives);
  return { score: compat.score, grade, blockers, positives, explanation };
}
