/**
 * Génère un rapport HTML professionnel partageable pour nutritionnistes,
 * gastro-entérologues et diététiciens.
 */

import { UserProfile } from '../data/user';
import { JournalEntry, computeDayLog } from '../data/weeklyStats';
import { Meal } from '../types/index';
import { FodmapProtocol, PHASE_CONFIG, RESULT_CONFIG } from '../data/fodmapProtocol';
import {
  PATHOLOGY_DEFINITIONS,
  SENSITIVITY_DEFINITIONS,
  TOLERANCE_DEFINITIONS,
  OBJECTIVE_DEFINITIONS,
} from '../types/shopping';
import { SymptomEntry, SYMPTOM_KEYS, SYMPTOM_CONFIG } from '../types/symptoms';
import { computeCorrelations } from './symptomCorrelation';

// ── Helpers ───────────────────────────────────────────────────

function isoToFR(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function bmi(weight: number, height: number): string {
  if (!weight || !height) return '—';
  const val = weight / ((height / 100) ** 2);
  return val.toFixed(1);
}

function bmiLabel(weight: number, height: number): string {
  const v = weight / ((height / 100) ** 2);
  if (v < 18.5) return 'Insuffisance pondérale';
  if (v < 25)   return 'Poids normal';
  if (v < 30)   return 'Surpoids';
  return 'Obésité';
}

// Compute 30-day stats from journal + today's meals
function computeMonthStats(journal: JournalEntry[], todayMeals: Meal[]) {
  const today = todayISO();
  const logs = [];

  // Last 30 days (including today)
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr === today) {
      const log = computeDayLog(todayMeals, dateStr);
      if (log.kcal > 0) logs.push(log);
    } else {
      const entry = journal.find((j) => j.date === dateStr);
      if (entry && Array.isArray(entry.meals)) {
        const log = computeDayLog(entry.meals, dateStr);
        if (log.kcal > 0) logs.push(log);
      }
    }
  }

  if (logs.length === 0) return null;

  const avgKcal = Math.round(logs.reduce((s, l) => s + l.kcal, 0) / logs.length);
  const avgP    = Math.round(logs.reduce((s, l) => s + l.p,    0) / logs.length * 10) / 10;
  const avgC    = Math.round(logs.reduce((s, l) => s + l.c,    0) / logs.length * 10) / 10;
  const avgF    = Math.round(logs.reduce((s, l) => s + l.f,    0) / logs.length * 10) / 10;

  // Food diversity
  const allFoods = logs.flatMap((l) => l.foodNames);
  const uniqueFoods = [...new Set(allFoods)];

  // Top 10 most eaten foods
  const freq: Record<string, number> = {};
  allFoods.forEach((n) => { freq[n] = (freq[n] ?? 0) + 1; });
  const topFoods = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return { loggedDays: logs.length, avgKcal, avgP, avgC, avgF, uniqueFoods: uniqueFoods.length, topFoods };
}

// ── Symptom stats (30 days) ───────────────────────────────────

function computeSymptomStats(symptoms: SymptomEntry[], windowDays = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = symptoms.filter((s) => s.date >= cutoffStr);
  if (recent.length === 0) return null;

  const avgs: Partial<Record<string, number>> = {};
  for (const key of SYMPTOM_KEYS) {
    const vals = recent.map((s) => s.scores[key]).filter((v) => v >= 0);
    if (vals.length > 0) {
      avgs[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }
  }
  return { trackedDays: recent.length, avgs };
}

// ── HTML builder ──────────────────────────────────────────────

export function generateProfessionalReport(
  profile: UserProfile,
  journal: JournalEntry[],
  todayMeals: Meal[],
  fodmapProtocol: FodmapProtocol,
  symptoms: SymptomEntry[] = [],
): string {
  const generatedOn = isoToFR(todayISO());
  const imc = bmi(profile.weight, profile.height);
  const imcLabel = bmiLabel(profile.weight, profile.height);
  const stats       = computeMonthStats(journal, todayMeals);
  const symptomStats = computeSymptomStats(symptoms);
  const correlations = computeCorrelations(journal, symptoms, 30);

  // Active diets
  const activeDiets = profile.diets.filter((d) => d.on);

  // Active allergens (not 'aucun')
  const activeAllergens = profile.allergens.filter((a) => a.level !== 'aucun');

  // Active sensitivities
  const activeSens = (profile.digestiveSensitivities ?? []).filter((s) => s.level !== 'none');

  // Pathology labels
  const pathoLabels = (profile.pathologies ?? []).map((id) => {
    const def = PATHOLOGY_DEFINITIONS.find((d) => d.id === id);
    return def?.label ?? id;
  });

  // Objective labels
  const objLabels = (profile.objectives ?? []).map((id) => {
    const def = OBJECTIVE_DEFINITIONS.find((d) => d.id === id);
    return def?.label ?? id;
  });

  // Sensitivity label map
  const sensLevelLabels: Record<string, string> = {
    mild: 'Légère', moderate: 'Modérée', strong: 'Forte',
  };

  // Tolerances
  const toleranceLabels: Record<string, string> = {
    low: 'Faible', medium: 'Modérée', good: 'Bonne',
  };
  const toleranceColors: Record<string, string> = {
    low: '#8B3A2E', medium: '#6B5A2E', good: '#3F5A3A',
  };

  // FODMAP data
  const testedFoods = fodmapProtocol.testedFoods ?? [];
  const reactions   = fodmapProtocol.reactions ?? [];

  // FODMAP correlations: food → reactions
  const fodmapCorrelations: { food: string; reactions: string[] }[] = [];
  testedFoods
    .filter((f) => f.result === 'severe' || f.result === 'moderate')
    .forEach((tf) => {
      const linked = reactions.filter((r) => r.testedFoodId === tf.id);
      if (linked.length > 0) {
        fodmapCorrelations.push({
          food: tf.foodName,
          reactions: linked.flatMap((r) => r.symptoms),
        });
      }
    });

  // ── CSS ───────────────────────────────────────────────────────

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      background: #F7F2E7;
      color: #1A1814;
      font-size: 13px;
      line-height: 1.5;
      padding: 0;
    }
    .page { max-width: 800px; margin: 0 auto; background: #fff; }
    /* Header */
    .header {
      background: #1A1814;
      color: #F2EDE2;
      padding: 32px 40px 28px;
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .header-label {
      font-size: 10px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #8A8270;
      margin-bottom: 6px;
    }
    .header-name {
      font-size: 26px;
      font-weight: 300;
      letter-spacing: -0.5px;
      color: #F2EDE2;
    }
    .header-goal {
      font-size: 13px;
      color: #B5AC95;
      margin-top: 4px;
    }
    .header-meta {
      text-align: right;
      color: #8A8270;
      font-size: 11px;
      line-height: 1.8;
    }
    .header-meta strong { color: #F2EDE2; }
    /* Stats bar */
    .stats-bar {
      display: flex;
      border-top: 1px solid #2C2822;
      margin-top: 24px;
    }
    .stat-cell {
      flex: 1;
      padding: 14px 0 0;
      border-right: 1px solid #2C2822;
    }
    .stat-cell:last-child { border-right: none; }
    .stat-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A8270; }
    .stat-val { font-size: 20px; font-weight: 300; color: #F2EDE2; margin-top: 2px; }
    .stat-unit { font-size: 11px; color: #8A8270; }
    .stat-sub { font-size: 10px; color: #8A8270; margin-top: 2px; }
    /* Sections */
    .section { padding: 28px 40px; border-bottom: 1px solid #EDE6D3; }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8A8270;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #EDE6D3;
    }
    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      text-align: left;
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #8A8270;
      padding: 0 12px 8px 0;
      font-weight: 500;
    }
    td { padding: 9px 12px 9px 0; border-top: 1px solid #EDE6D3; vertical-align: top; }
    tr:first-child td { border-top: none; }
    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    .badge-ok     { background: rgba(63,90,58,0.12);  color: #3F5A3A; }
    .badge-warn   { background: rgba(139,58,46,0.12); color: #8B3A2E; }
    .badge-mid    { background: rgba(107,90,46,0.12); color: #6B5A2E; }
    .badge-muted  { background: #F2EDE2; color: #8A8270; }
    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .card {
      background: #F7F2E7;
      border: 1px solid #EDE6D3;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .card-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A8270; }
    .card-val { font-size: 22px; font-weight: 300; color: #1A1814; margin-top: 4px; }
    .card-unit { font-size: 11px; color: #8A8270; }
    .card-sub { font-size: 10px; color: #8A8270; margin-top: 3px; }
    /* Row KV */
    .kv-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDE6D3; }
    .kv-row:last-child { border-bottom: none; }
    .kv-key { color: #8A8270; }
    .kv-val { font-weight: 500; text-align: right; max-width: 60%; }
    /* FODMAP phases */
    .phase-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    /* Pills */
    .pill-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      border: 1px solid #EDE6D3;
      font-size: 11px;
      color: #1A1814;
      background: #F7F2E7;
    }
    /* Footer */
    .footer {
      background: #F7F2E7;
      border-top: 1px solid #EDE6D3;
      padding: 20px 40px;
      font-size: 10px;
      color: #B5AC95;
      display: flex;
      justify-content: space-between;
    }
    .disclaimer {
      background: rgba(107,90,46,0.07);
      border: 1px solid rgba(107,90,46,0.2);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 11px;
      color: #6B5A2E;
      margin-top: 0;
    }
    @media print {
      body { background: #fff; }
      .page { max-width: none; box-shadow: none; }
    }
  `;

  // ── Sections HTML ─────────────────────────────────────────────

  // 1. Anthropométrie
  const sectAnthropo = `
    <div class="section">
      <div class="section-title">Anthropométrie &amp; Objectifs</div>
      <div class="grid-4">
        <div class="card">
          <div class="card-label">Âge</div>
          <div class="card-val">${profile.age}<span class="card-unit"> ans</span></div>
        </div>
        <div class="card">
          <div class="card-label">Poids</div>
          <div class="card-val">${profile.weight}<span class="card-unit"> kg</span></div>
        </div>
        <div class="card">
          <div class="card-label">Taille</div>
          <div class="card-val">${profile.height}<span class="card-unit"> cm</span></div>
        </div>
        <div class="card">
          <div class="card-label">IMC</div>
          <div class="card-val">${imc}</div>
          <div class="card-sub">${imcLabel}</div>
        </div>
      </div>
      <div style="margin-top:16px;">
        <div class="kv-row"><span class="kv-key">Objectif déclaré</span><span class="kv-val">${profile.goal || '—'}</span></div>
        <div class="kv-row"><span class="kv-key">Activité physique</span><span class="kv-val">${profile.activity || '—'}</span></div>
        <div class="kv-row"><span class="kv-key">Cible calorique</span><span class="kv-val">${profile.kcalTarget} kcal/j</span></div>
        <div class="kv-row"><span class="kv-key">Macros cibles</span><span class="kv-val">P&nbsp;${profile.macroTargets.protein}g &nbsp;·&nbsp; G&nbsp;${profile.macroTargets.carbs}g &nbsp;·&nbsp; L&nbsp;${profile.macroTargets.fat}g</span></div>
        ${objLabels.length > 0 ? `<div class="kv-row"><span class="kv-key">Objectifs santé</span><span class="kv-val">${objLabels.join(', ')}</span></div>` : ''}
        ${activeDiets.length > 0 ? `<div class="kv-row"><span class="kv-key">Régimes actifs</span><span class="kv-val">${activeDiets.map((d) => d.label).join(', ')}</span></div>` : ''}
      </div>
    </div>
  `;

  // 2. Allergènes & Intolérances
  const allergenLevelBadge: Record<string, string> = {
    'sévère':  '<span class="badge badge-warn">Sévère</span>',
    'modéré':  '<span class="badge badge-mid">Modéré</span>',
    'trace':   '<span class="badge badge-muted">Trace</span>',
  };

  const sectAllergens = `
    <div class="section">
      <div class="section-title">Allergènes &amp; Intolérances</div>
      ${activeAllergens.length === 0
        ? '<p style="color:#8A8270;font-size:12px;">Aucun allergène ou intolérance déclaré.</p>'
        : `<table>
            <thead>
              <tr>
                <th>Allergène</th>
                <th>Sévérité</th>
                <th>Note clinique</th>
              </tr>
            </thead>
            <tbody>
              ${activeAllergens.map((a) => `
                <tr>
                  <td><strong>${a.name}</strong></td>
                  <td>${allergenLevelBadge[a.level] ?? a.level}</td>
                  <td style="color:#8A8270">${a.note || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
      }
    </div>
  `;

  // 3. Pathologies & Sensibilités
  const sensLevelBadge: Record<string, string> = {
    mild:     '<span class="badge badge-muted">Légère</span>',
    moderate: '<span class="badge badge-mid">Modérée</span>',
    strong:   '<span class="badge badge-warn">Forte</span>',
  };

  const sectDigestive = `
    <div class="section">
      <div class="section-title">Pathologies &amp; Sensibilités digestives</div>
      ${pathoLabels.length > 0 ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">Pathologies déclarées</div>
          <div class="pill-list">
            ${pathoLabels.map((p) => `<span class="pill" style="background:rgba(139,58,46,0.08);border-color:rgba(139,58,46,0.2);color:#8B3A2E;">${p}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">Sensibilités digestives actives</div>
      ${activeSens.length === 0
        ? '<p style="color:#8A8270;font-size:12px;">Aucune sensibilité significative déclarée.</p>'
        : `<table>
            <thead><tr><th>Substance</th><th>Niveau</th></tr></thead>
            <tbody>
              ${activeSens.map((s) => {
                const def = SENSITIVITY_DEFINITIONS.find((d) => d.id === s.id);
                return `<tr>
                  <td><strong>${def?.label ?? s.id}</strong></td>
                  <td>${sensLevelBadge[s.level] ?? s.level}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`
      }
      ${profile.digestiveTolerances ? `
        <div style="margin-top:20px;">
          <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">Tolérances alimentaires</div>
          <div class="grid-3" style="gap:8px;">
            ${TOLERANCE_DEFINITIONS.map((def) => {
              const tols = profile.digestiveTolerances as unknown as Record<string, string>;
              const level = tols[def.id] ?? 'medium';
              const color = toleranceColors[level] ?? '#8A8270';
              const label = toleranceLabels[level] ?? level;
              return `
                <div style="background:#F7F2E7;border:1px solid #EDE6D3;border-radius:8px;padding:10px 12px;">
                  <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;">${def.label}</div>
                  <div style="font-size:13px;font-weight:500;color:${color};margin-top:3px;">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // 4. Stats nutritionnelles 30j
  const sectStats = stats ? `
    <div class="section">
      <div class="section-title">Bilan nutritionnel — 30 derniers jours (${stats.loggedDays} jours enregistrés)</div>
      <div class="grid-4" style="margin-bottom:20px;">
        <div class="card">
          <div class="card-label">Kcal moy.</div>
          <div class="card-val">${stats.avgKcal}<span class="card-unit"> kcal</span></div>
          <div class="card-sub">Cible : ${profile.kcalTarget} kcal</div>
        </div>
        <div class="card">
          <div class="card-label">Protéines moy.</div>
          <div class="card-val">${stats.avgP}<span class="card-unit"> g</span></div>
          <div class="card-sub">Cible : ${profile.macroTargets.protein} g</div>
        </div>
        <div class="card">
          <div class="card-label">Glucides moy.</div>
          <div class="card-val">${stats.avgC}<span class="card-unit"> g</span></div>
          <div class="card-sub">Cible : ${profile.macroTargets.carbs} g</div>
        </div>
        <div class="card">
          <div class="card-label">Lipides moy.</div>
          <div class="card-val">${stats.avgF}<span class="card-unit"> g</span></div>
          <div class="card-sub">Cible : ${profile.macroTargets.fat} g</div>
        </div>
      </div>
      <div class="kv-row"><span class="kv-key">Diversité alimentaire (30j)</span><span class="kv-val">${stats.uniqueFoods} aliments distincts</span></div>
      ${stats.topFoods.length > 0 ? `
        <div style="margin-top:16px;">
          <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">Aliments les plus consommés</div>
          <div class="pill-list">
            ${stats.topFoods.map((f) => `<span class="pill">${f.name} <span style="color:#8A8270">(×${f.count})</span></span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  ` : `
    <div class="section">
      <div class="section-title">Bilan nutritionnel</div>
      <p style="color:#8A8270;font-size:12px;">Aucune donnée journalière enregistrée sur les 30 derniers jours.</p>
    </div>
  `;

  // 5. Protocole FODMAP
  const sectFodmap = fodmapProtocol.active || testedFoods.length > 0 ? (() => {
    const phaseConf = PHASE_CONFIG[fodmapProtocol.phase];

    const testedRows = testedFoods.map((tf) => {
      const conf = RESULT_CONFIG[tf.result];
      const badge = tf.result === 'ok'
        ? '<span class="badge badge-ok">Toléré</span>'
        : tf.result === 'moderate'
          ? '<span class="badge badge-mid">Modéré</span>'
          : tf.result === 'severe'
            ? '<span class="badge badge-warn">Non toléré</span>'
            : '<span class="badge badge-muted">En cours</span>';
      return `<tr>
        <td><strong>${tf.foodName}</strong></td>
        <td style="color:#8A8270">${tf.fodmapType || '—'}</td>
        <td>${tf.portionTested || '—'}</td>
        <td>${badge}</td>
        <td style="color:#8A8270">${isoToFR(tf.testedAt)}</td>
        <td style="color:#8A8270;font-size:11px;">${tf.notes || '—'}</td>
      </tr>`;
    }).join('');

    const reactionRows = reactions.map((r) => {
      const sevLabel = r.severity === 1 ? '<span class="badge badge-muted">Légère</span>'
        : r.severity === 2 ? '<span class="badge badge-mid">Modérée</span>'
        : '<span class="badge badge-warn">Sévère</span>';
      return `<tr>
        <td>${isoToFR(r.date)}</td>
        <td>${sevLabel}</td>
        <td>${r.symptoms.join(', ') || '—'}</td>
        <td style="color:#8A8270">${r.foodName || '—'}</td>
        <td style="color:#8A8270;font-size:11px;">${r.notes || '—'}</td>
      </tr>`;
    }).join('');

    return `
      <div class="section">
        <div class="section-title">Protocole Low FODMAP</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
          <div class="card" style="flex:1;min-width:160px;">
            <div class="card-label">Statut</div>
            <div style="font-size:14px;font-weight:500;margin-top:4px;color:${fodmapProtocol.active ? '#3F5A3A' : '#8A8270'}">
              ${fodmapProtocol.active ? 'Protocole actif' : 'Protocole terminé / inactif'}
            </div>
          </div>
          <div class="card" style="flex:1;min-width:160px;">
            <div class="card-label">Phase actuelle</div>
            <div style="font-size:14px;font-weight:500;margin-top:4px;">${phaseConf.label}</div>
          </div>
          <div class="card" style="flex:1;min-width:160px;">
            <div class="card-label">Début protocole</div>
            <div style="font-size:14px;font-weight:500;margin-top:4px;">${isoToFR(fodmapProtocol.startDate)}</div>
          </div>
          <div class="card" style="flex:1;min-width:160px;">
            <div class="card-label">Début phase</div>
            <div style="font-size:14px;font-weight:500;margin-top:4px;">${isoToFR(fodmapProtocol.phaseStartDate)}</div>
          </div>
        </div>
        ${testedFoods.length > 0 ? `
          <div style="margin-bottom:20px;">
            <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">
              Aliments testés (${testedFoods.length})
            </div>
            <table>
              <thead>
                <tr>
                  <th>Aliment</th><th>Type FODMAP</th><th>Portion</th>
                  <th>Résultat</th><th>Date</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>${testedRows}</tbody>
            </table>
          </div>
        ` : ''}
        ${reactions.length > 0 ? `
          <div style="margin-bottom:20px;">
            <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">
              Journal de réactions (${reactions.length})
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Sévérité</th><th>Symptômes</th>
                  <th>Aliment déclencheur</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>${reactionRows}</tbody>
            </table>
          </div>
        ` : ''}
        ${fodmapCorrelations.length > 0 ? `
          <div>
            <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8A8270;margin-bottom:8px;">
              Corrélations identifiées
            </div>
            <table>
              <thead><tr><th>Aliment non toléré</th><th>Symptômes observés</th></tr></thead>
              <tbody>
                ${fodmapCorrelations.map((c) => `
                  <tr>
                    <td><strong>${c.food}</strong></td>
                    <td>${[...new Set(c.reactions)].join(', ')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  })() : '';

  // 6. Symptômes 30 jours
  const symptomScoreBar = (avg: number, key: string) => {
    const cfg = SYMPTOM_CONFIG[key as keyof typeof SYMPTOM_CONFIG];
    // Normalize to a "badness" percentage for visual bar
    let pct: number;
    if (cfg.inverse === null) pct = (Math.abs(avg - 2) / 2) * 100;
    else if (cfg.inverse) pct = (avg / 4) * 100;
    else pct = ((4 - avg) / 4) * 100;
    const color = pct < 30 ? '#3F5A3A' : pct < 60 ? '#6B5A2E' : '#8B3A2E';
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:11px;">${cfg.label}</span>
          <span style="font-size:11px;color:#8A8270;">${avg}/4 — ${cfg.lowLabel} → ${cfg.highLabel}</span>
        </div>
        <div style="background:#EDE6D3;border-radius:4px;height:6px;overflow:hidden;">
          <div style="width:${Math.round(pct)}%;height:100%;background:${color};border-radius:4px;"></div>
        </div>
      </div>
    `;
  };

  const sectSymptoms = symptomStats ? `
    <div class="section">
      <div class="section-title">Bien-être &amp; Symptômes — 30 derniers jours (${symptomStats.trackedDays} jours renseignés)</div>
      <div style="max-width:480px;">
        ${Object.entries(symptomStats.avgs).map(([k, v]) => symptomScoreBar(v!, k)).join('')}
      </div>
    </div>
  ` : '';

  // 7. Corrélations aliment → symptômes
  const corrStrengthBadge = (s: string) =>
    s === 'forte'   ? '<span class="badge badge-warn">Forte</span>' :
    s === 'modérée' ? '<span class="badge badge-mid">Modérée</span>' :
                     '<span class="badge badge-muted">Faible</span>';

  const sectCorrelations = correlations.length > 0 ? `
    <div class="section">
      <div class="section-title">Corrélations aliment – symptômes (30 jours)</div>
      <p style="font-size:11px;color:#8A8270;margin-bottom:14px;">
        Détectées par comparaison des scores de symptômes les jours avec vs sans chaque facteur alimentaire (incluant le lendemain pour les effets différés). Minimum 3 jours par groupe.
      </p>
      <table>
        <thead><tr><th>Facteur alimentaire</th><th>Symptôme</th><th>Effet</th><th>Force</th><th>Score moy. avec / sans</th></tr></thead>
        <tbody>
          ${correlations.map((c) => `
            <tr>
              <td><strong>${c.factor}</strong></td>
              <td>${c.symptomLabel}</td>
              <td style="color:${c.direction === 'increases' ? '#8B3A2E' : '#3F5A3A'}">
                ${c.direction === 'increases' ? '↑ Aggravé' : '↓ Amélioré'}
              </td>
              <td>${corrStrengthBadge(c.strength)}</td>
              <td style="color:#8A8270;font-size:11px;">
                ${c.avgWith} / ${c.avgWithout} (sur 4)
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // 8. Résultats biologiques
  const bioResults = profile.bioResults ?? [];
  const statusBadge = (s?: string) =>
    s === 'low'  ? '<span class="badge badge-warn">Bas</span>' :
    s === 'high' ? '<span class="badge badge-mid">Élevé</span>' :
    s === 'normal' ? '<span class="badge badge-ok">Normal</span>' : '';

  const sectBio = bioResults.length > 0 ? `
    <div class="section">
      <div class="section-title">Résultats biologiques</div>
      <table>
        <thead><tr><th>Marqueur</th><th>Valeur</th><th>Statut</th><th>Date</th><th>Note</th></tr></thead>
        <tbody>
          ${bioResults.map((r) => `
            <tr>
              <td><strong>${r.name}</strong></td>
              <td>${r.value} <span style="color:#8A8270">${r.unit}</span></td>
              <td>${statusBadge(r.status)}</td>
              <td style="color:#8A8270">${r.date ? isoToFR(r.date) : '—'}</td>
              <td style="color:#8A8270;font-size:11px;">${r.note || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // 9. Médicaments
  const medications = profile.medications ?? [];
  const sectMedications = medications.length > 0 ? `
    <div class="section">
      <div class="section-title">Médicaments en cours</div>
      <div class="pill-list">
        ${medications.map((m) => `<span class="pill">${m}</span>`).join('')}
      </div>
    </div>
  ` : '';

  // 10. Disclaimer
  const sectDisclaimer = `
    <div class="section">
      <div class="disclaimer">
        Ce rapport est généré automatiquement par l'application Nutritor à partir des données saisies par le patient.
        Les informations présentées ne constituent pas un diagnostic médical. Elles sont destinées à faciliter
        la consultation et doivent être interprétées par un professionnel de santé qualifié.
        Les données nutritionnelles sont des moyennes calculées sur les jours enregistrés par le patient.
      </div>
    </div>
  `;

  // ── Assemble ──────────────────────────────────────────────────

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport professionnel — ${profile.name}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="header-label">Rapport nutritionnel &amp; digestif</div>
          <div class="header-name">${profile.name}</div>
          <div class="header-goal">${profile.goal || ''}</div>
        </div>
        <div class="header-meta">
          <div>Généré le <strong>${generatedOn}</strong></div>
          <div>via Nutritor</div>
        </div>
      </div>
      <div class="stats-bar">
        <div class="stat-cell" style="padding-right:24px;">
          <div class="stat-label">IMC</div>
          <div class="stat-val">${imc}</div>
          <div class="stat-sub">${imcLabel}</div>
        </div>
        <div class="stat-cell" style="padding-left:24px;padding-right:24px;">
          <div class="stat-label">Cible kcal</div>
          <div class="stat-val">${profile.kcalTarget}<span class="stat-unit"> kcal</span></div>
        </div>
        <div class="stat-cell" style="padding-left:24px;padding-right:24px;">
          <div class="stat-label">Régimes actifs</div>
          <div class="stat-val" style="font-size:14px;">${activeDiets.length > 0 ? activeDiets.map((d) => d.label).join(', ') : '—'}</div>
        </div>
        <div class="stat-cell" style="padding-left:24px;">
          <div class="stat-label">Protocole FODMAP</div>
          <div class="stat-val" style="font-size:14px;">${fodmapProtocol.active ? PHASE_CONFIG[fodmapProtocol.phase].label : '—'}</div>
        </div>
      </div>
    </div>

    ${sectAnthropo}
    ${sectAllergens}
    ${sectDigestive}
    ${sectStats}
    ${sectSymptoms}
    ${sectCorrelations}
    ${sectBio}
    ${sectMedications}
    ${sectFodmap}
    ${sectDisclaimer}

    <!-- Footer -->
    <div class="footer">
      <span>Nutritor — Rapport professionnel confidentiel</span>
      <span>${profile.name} · ${generatedOn}</span>
    </div>
  </div>
</body>
</html>`;
}
