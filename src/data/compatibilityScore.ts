import { Food } from '../types';
import { UserProfile } from './user';

// ── Types ─────────────────────────────────────────────────────

export type CompatLevel = 'compatible' | 'moderate' | 'avoid';

export interface CompatReason {
  label: string;
  detail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface CompatPositive {
  label: string;
  detail?: string;
}

export interface CompatibilityResult {
  score: number;            // 0–100
  level: CompatLevel;
  reasons: CompatReason[];  // penalty factors
  positives: CompatPositive[];
}

// ── Constants ─────────────────────────────────────────────────

export const COMPAT_COLORS: Record<CompatLevel, string> = {
  compatible: '#3F5A3A',   // Colors.ok
  moderate:   '#6B5A2E',   // Colors.signal
  avoid:      '#8B3A2E',   // Colors.warn
};

export const COMPAT_BG: Record<CompatLevel, string> = {
  compatible: 'rgba(63,90,58,0.08)',
  moderate:   'rgba(107,90,46,0.08)',
  avoid:      'rgba(139,58,46,0.08)',
};

export const COMPAT_BORDER: Record<CompatLevel, string> = {
  compatible: 'rgba(63,90,58,0.25)',
  moderate:   'rgba(107,90,46,0.25)',
  avoid:      'rgba(139,58,46,0.25)',
};

export const COMPAT_LABELS: Record<CompatLevel, string> = {
  compatible: 'Compatible',
  moderate:   'Risque modéré',
  avoid:      'Déconseillé',
};

// ── Score engine ──────────────────────────────────────────────

export function computeCompatibilityScore(
  food: Food,
  profile: UserProfile,
): CompatibilityResult {
  let penalty = 0;
  const reasons: CompatReason[] = [];
  const positives: CompatPositive[] = [];
  const penalizedKeys = new Set<string>();

  // Normalize food allergen map
  const foodMap: Record<string, 'contains' | 'trace' | 'absent'> = {};
  for (const a of food.allergens) {
    foodMap[a.name.toLowerCase()] = a.status;
  }

  // ── 1. User allergen profile ───────────────────────────────
  for (const ua of profile.allergens) {
    if (ua.level === 'aucun') continue;
    const key = ua.name.toLowerCase();
    const status = foodMap[key] ?? 'absent';
    if (status === 'absent') continue;

    penalizedKeys.add(key);

    if (status === 'contains') {
      const p = ua.level === 'sévère' ? 80 : ua.level === 'modéré' ? 48 : 22;
      penalty += p;
      reasons.push({
        label: `Contient : ${ua.name}`,
        detail:
          ua.level === 'sévère'
            ? `Allergie sévère${ua.note ? ' — ' + ua.note : ' — contre-indiqué'}`
            : ua.level === 'modéré'
            ? `Sensibilité modérée${ua.note ? ' — ' + ua.note : ''}`
            : `Sensibilité légère${ua.note ? ' — ' + ua.note : ''}`,
        severity:
          ua.level === 'sévère' ? 'critical'
          : ua.level === 'modéré' ? 'high'
          : 'medium',
      });
    } else {
      // 'trace'
      const p = ua.level === 'sévère' ? 42 : ua.level === 'modéré' ? 18 : 8;
      penalty += p;
      reasons.push({
        label: `Traces de : ${ua.name}`,
        detail:
          ua.level === 'sévère'
            ? 'Contamination croisée — risque élevé'
            : 'Contamination croisée possible',
        severity: ua.level === 'sévère' ? 'high' : 'medium',
      });
    }
  }

  // ── 2. Active diet restrictions ────────────────────────────
  const activeDiets = new Set(profile.diets.filter((d) => d.on).map((d) => d.id));

  // Gluten-free (only if allergen didn't already capture it)
  if (activeDiets.has('gf') && !penalizedKeys.has('gluten')) {
    const s = foodMap['gluten'];
    if (s === 'contains') {
      penalty += 55;
      penalizedKeys.add('gluten');
      reasons.push({
        label: 'Contient du gluten',
        detail: 'Régime sans gluten actif',
        severity: 'high',
      });
    } else if (s === 'trace') {
      penalty += 18;
      reasons.push({
        label: 'Traces de gluten',
        detail: 'Contamination croisée possible',
        severity: 'medium',
      });
    }
  }

  // Lactose-free
  if (activeDiets.has('lf') && !penalizedKeys.has('lactose')) {
    const s = foodMap['lactose'];
    if (s === 'contains') {
      penalty += 42;
      penalizedKeys.add('lactose');
      reasons.push({
        label: 'Contient du lactose',
        detail: 'Régime sans lactose actif',
        severity: 'high',
      });
    } else if (s === 'trace') {
      penalty += 10;
      reasons.push({
        label: 'Traces de lactose',
        detail: 'Contamination croisée possible',
        severity: 'low',
      });
    }
  }

  // Low FODMAP
  if (activeDiets.has('low') && food.fodmap) {
    if (food.fodmap.overall === 'high') {
      penalty += 35;
      reasons.push({
        label: 'FODMAP élevé',
        detail: 'Risque d\'inconfort digestif élevé',
        severity: 'high',
      });
    } else if (food.fodmap.overall === 'moderate') {
      penalty += 14;
      reasons.push({
        label: 'FODMAP modéré',
        detail: 'Surveiller la portion — voir seuil FODMAP',
        severity: 'medium',
      });
    } else if (food.fodmap.overall === 'low') {
      const rawPortion = food.fodmap.elimination?.portion;
      const portion = rawPortion !== undefined ? String(rawPortion) : undefined;
      const lowTypes = (food.fodmap.types ?? [])
        .filter((t) => t.level === 'low' || t.level === 'faible')
        .map((t) => t.name);
      positives.push({
        label: portion
          ? `Low FODMAP · sûr jusqu'à ${portion}${portion.match(/\d/) && !portion.includes('g') ? ' g' : ''}`
          : 'Low FODMAP',
        detail: lowTypes.length > 0 ? `${lowTypes.join(', ')} en quantité faible` : food.fodmap.elimination?.note,
      });
    }
  }

  // Cétogène
  if (activeDiets.has('kt')) {
    const portionCarbs = (food.per100.carbs * food.defaultPortion) / 100;
    if (portionCarbs > 10) {
      const p = Math.min(30, Math.round((portionCarbs - 10) * 1.5));
      penalty += p;
      reasons.push({
        label: `${Math.round(portionCarbs)} g glucides / portion`,
        detail: 'Régime cétogène — seuil conseillé < 10 g',
        severity: portionCarbs > 25 ? 'high' : 'medium',
      });
    }
  }

  // Végétarien / Vegan
  if (activeDiets.has('veg') || activeDiets.has('vgn')) {
    const fishStatus = foodMap['poisson'];
    const crustStatus = foodMap['crustacés'];
    const molStatus = foodMap['mollusques'];
    const hasSeafood =
      fishStatus === 'contains' || crustStatus === 'contains' || molStatus === 'contains';
    if (hasSeafood) {
      penalty += 35;
      reasons.push({
        label: 'Contient des produits de la mer',
        detail: 'Régime végétarien / vegan actif',
        severity: 'medium',
      });
    }
  }

  // ── 3. Positive signals ────────────────────────────────────
  const portionProtein = (food.per100.protein * food.defaultPortion) / 100;
  const portionKcal = (food.per100.kcal * food.defaultPortion) / 100;

  if (portionProtein >= 20) {
    positives.push({
      label: `Riche en protéines — ${Math.round(portionProtein)} g/portion`,
      detail: food.proteinDetail?.complete ? 'Protéines complètes (tous acides aminés essentiels)' : undefined,
    });
  } else if (portionKcal > 0 && portionProtein / portionKcal >= 0.1) {
    positives.push({
      label: `Bonne densité protéique — ${Math.round(portionProtein)} g/portion`,
    });
  }

  if (!activeDiets.has('low') && food.fodmap?.overall === 'low') {
    const rawPortion = food.fodmap.elimination?.portion;
    const portion = rawPortion !== undefined ? String(rawPortion) : undefined;
    const lowTypes = (food.fodmap.types ?? [])
      .filter((t) => t.level === 'low' || t.level === 'faible')
      .map((t) => t.name);
    positives.push({
      label: portion
        ? `Low FODMAP · sûr jusqu'à ${portion}${portion.match(/\d/) && !portion.includes('g') ? ' g' : ''}`
        : 'Low FODMAP',
      detail: lowTypes.length > 0 ? `${lowTypes.join(', ')} en quantité faible` : food.fodmap.elimination?.note,
    });
  }

  // Per-allergen absence (active diets)
  if (activeDiets.has('lf') && (foodMap['lactose'] === 'absent' || !foodMap['lactose'])) {
    positives.push({ label: 'Sans lactose', detail: 'Absent des ingrédients déclarés' });
  }
  if (activeDiets.has('gf') && (foodMap['gluten'] === 'absent' || !foodMap['gluten'])) {
    positives.push({ label: 'Sans gluten', detail: 'Absent des ingrédients déclarés' });
  }

  // All severe/moderate allergens absent
  const top = profile.allergens.filter(
    (a) => a.level === 'sévère' || a.level === 'modéré',
  );
  if (
    top.length > 0 &&
    top.every((a) => {
      const s = foodMap[a.name.toLowerCase()];
      return !s || s === 'absent';
    })
  ) {
    positives.push({
      label: 'Aucun allergène prioritaire détecté',
      detail: top.map((a) => a.name).join(', ') + ' — absents',
    });
  }

  // ── 4. Final ───────────────────────────────────────────────
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const level: CompatLevel =
    score >= 80 ? 'compatible' : score >= 50 ? 'moderate' : 'avoid';

  return { score, level, reasons, positives };
}
