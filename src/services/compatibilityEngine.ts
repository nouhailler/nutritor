// ── Compatibility Engine ───────────────────────────────────────
// Analyses an OFFProduct against a UserProfile and returns
// a personalised compatibility score (0–100).
// Builds on top of labelAnalysis.ts (FODMAP / additive rules)
// and adds sensitivity-weighted scoring + allergen checks.

import { OFFProduct } from './openFoodFacts';
import { UserProfile, getDigestiveSensitivities } from '../data/user';
import { analyzeLabel, IngredientFlag } from '../data/labelAnalysis';
import { CompatibilityIssue, CompatibilityResult, SensitivityLevel } from '../types/shopping';

// ── Sensitivity → FODMAP concern mapping ─────────────────────

const SENSITIVITY_TO_CONCERN: Record<string, string[]> = {
  fructans:   ['Fructanes', 'Fructanes (chicorée)', 'Fructanes élevés'],
  polyols:    ['Polyol élevé', 'Polyol modéré'],
  lactose:    ['Lactose', 'Lactose (trace)', 'Lactose probable'],
  fructose:   ['Fructose en excès', 'Fructose'],
  sweeteners: ['Édulcorant controversé'],
};

// ── Allergen tag → profile allergen name ─────────────────────

const ALLERGEN_TAG_TO_NAME: Record<string, string> = {
  'en:gluten':      'Gluten',
  'en:wheat':       'Gluten',
  'en:rye':         'Gluten',
  'en:barley':      'Gluten',
  'en:milk':        'Lactose',
  'en:lactose':     'Lactose',
  'en:nuts':        'Fruits à coque',
  'en:peanuts':     'Arachides',
  'en:eggs':        'Œufs',
  'en:fish':        'Poisson',
  'en:crustaceans': 'Crustacés',
  'en:soybeans':    'Soja',
  'en:sesame-seeds':'Sésame',
  'en:mustard':     'Moutarde',
  'en:celery':      'Céleri',
  'en:sulphites':   'Sulfites',
  'en:molluscs':    'Mollusques',
  'en:lupin':       'Lupin',
};

// ── Ultra-processed detection ─────────────────────────────────

const ULTRA_PROCESSED_MARKERS = [
  /huile\s+hydrog[eé]n[eé]e/i,
  /sirop\s+de\s+(ma[iï]s|glucose.fructose|fructose)/i,
  /maltodextrine/i,
  /amidon\s+modifi[eé]/i,
  /prot[eé]ine\s+(de\s+)?v[eé]g[eé]tale\s+textur[eé]e/i,
  /ar[oô]me\s+(artificiel|synth[eé]tique)/i,
];

function detectUltraProcessed(ingredients: string): boolean {
  if (!ingredients) return false;
  for (const marker of ULTRA_PROCESSED_MARKERS) {
    if (marker.test(ingredients)) return true;
  }
  // Count distinct E-numbers — NOVA 4 heuristic
  const eNumbers = ingredients.match(/\bE\s?\d{3}[a-z]?\b/gi) ?? [];
  const distinct = new Set(eNumbers.map((e) => e.replace(/\s/g, '').toUpperCase()));
  return distinct.size >= 5;
}

// ── Severity multiplier per sensitivity level ─────────────────

function sensitivityMultiplier(level: SensitivityLevel): number {
  switch (level) {
    case 'strong':   return 1.0;
    case 'moderate': return 0.6;
    case 'mild':     return 0.3;
    case 'none':     return 0.05;
  }
}

// ── Main entry point ──────────────────────────────────────────

export function analyzeCompatibility(
  product: OFFProduct,
  profile: UserProfile,
): CompatibilityResult {
  const label = analyzeLabel(product, profile);
  const sensitivities = getDigestiveSensitivities(profile);
  const ingredients = (product.ingredients_text_fr || product.ingredients_text || '').trim();

  let score = 100;
  const issues: CompatibilityIssue[] = [];
  const positives: string[] = [...label.positives];

  // ── 1. FODMAP / additive flags (sensitivity-weighted) ─────

  const sensitivityMap = Object.fromEntries(sensitivities.map((s) => [s.id, s.level]));

  for (const flag of label.flags) {
    if (flag.category === 'fodmap') {
      // Find which sensitivity applies
      let matchedLevel: SensitivityLevel = 'none';
      for (const [sensitivityId, concerns] of Object.entries(SENSITIVITY_TO_CONCERN)) {
        if (concerns.some((c) => flag.concern.startsWith(c))) {
          matchedLevel = (sensitivityMap[sensitivityId] as SensitivityLevel) ?? 'none';
          break;
        }
      }
      const mult = sensitivityMultiplier(matchedLevel);
      const base = flag.level === 'high' ? 28 : flag.level === 'medium' ? 14 : 5;
      const deduction = Math.round(base * mult);
      score -= deduction;

      if (deduction >= 5) {
        issues.push({
          label: flag.concern,
          severity: matchedLevel === 'strong' ? 'critical'
            : matchedLevel === 'moderate' ? 'strong'
            : matchedLevel === 'mild' ? 'medium' : 'low',
          detail: flag.detail,
        });
      }
    } else {
      // Additive — flat deduction
      const deduction = flag.level === 'high' ? 18 : flag.level === 'medium' ? 10 : 4;
      score -= deduction;
      issues.push({
        label: flag.concern,
        severity: flag.level === 'high' ? 'strong' : flag.level === 'medium' ? 'medium' : 'low',
        detail: flag.detail,
      });
    }
  }

  // ── 2. Allergen check ─────────────────────────────────────

  const allergenTags = new Set([
    ...(product.allergens_tags ?? []),
    ...(product.traces_tags ?? []),
  ]);

  for (const tag of allergenTags) {
    const allergenName = ALLERGEN_TAG_TO_NAME[tag];
    if (!allergenName) continue;
    const entry = profile.allergens.find((a) => a.name === allergenName);
    if (!entry || entry.level === 'aucun') continue;

    const deduction = entry.level === 'sévère' ? 40
      : entry.level === 'modéré' ? 22
      : 10; // trace
    score -= deduction;

    issues.push({
      label: `Allergène : ${allergenName}`,
      severity: entry.level === 'sévère' ? 'critical'
        : entry.level === 'modéré' ? 'strong' : 'medium',
      detail: entry.note
        ? `${entry.level} — ${entry.note}`
        : `Niveau ${entry.level} dans votre profil`,
    });
  }

  // ── 3. Ultra-processed ────────────────────────────────────

  const ultraProcessed = detectUltraProcessed(ingredients);
  if (ultraProcessed) {
    score -= 15;
    issues.push({
      label: 'Produit ultra-transformé',
      severity: 'medium',
      detail: 'Présence de marqueurs NOVA 4 : additifs multiples, huile hydrogénée, sirop de glucose-fructose…',
    });
  }

  // ── 4. Positives complement ───────────────────────────────

  if (issues.length === 0 && !ultraProcessed) {
    positives.push('Aucun problème détecté pour votre profil');
  }

  // ── 5. Sort issues by severity ────────────────────────────

  const SEVERITY_RANK: Record<string, number> = { critical: 4, strong: 3, medium: 2, low: 1 };
  issues.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict: CompatibilityResult['verdict'] =
    score >= 70 ? 'good' : score >= 40 ? 'caution' : 'bad';

  return {
    score,
    verdict,
    issues,
    positives: [...new Set(positives)],
    ultraProcessed,
    additiveFlagCount: label.additivesCount,
    fodmapFlagCount:   label.fodmapCount,
  };
}

// ── Helpers for UI ────────────────────────────────────────────

export function verdictColor(verdict: CompatibilityResult['verdict']): string {
  switch (verdict) {
    case 'good':    return '#2d8a4e';
    case 'caution': return '#c47d0a';
    case 'bad':     return '#c0392b';
  }
}

export function verdictLabel(verdict: CompatibilityResult['verdict']): string {
  switch (verdict) {
    case 'good':    return 'Compatible';
    case 'caution': return 'À vérifier';
    case 'bad':     return 'Déconseillé';
  }
}

export function severityColor(severity: CompatibilityIssue['severity']): string {
  switch (severity) {
    case 'critical': return '#c0392b';
    case 'strong':   return '#e67e22';
    case 'medium':   return '#c47d0a';
    case 'low':      return '#7f8c8d';
  }
}

export type { IngredientFlag };
