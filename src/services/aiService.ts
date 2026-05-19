import { AppSettings } from '../types/settings';
import { Allergen, CompatItem, Food } from '../types';
import { UserProfile } from '../data/user';
import { FodmapPhase } from '../data/fodmapProtocol';
import { GeneratedMeal, MealGeneratorResult } from '../types/mealGenerator';

const FOOD_SCHEMA = `{
  "id": "slug-unique-001",
  "category": "Catégorie · Sous-catégorie",
  "name": "Nom complet",
  "subtitle": "Description courte (1-2 phrases évocatrices)",
  "brand": "Marque ou Générique",
  "origin": "Pays · Région (optionnel)",
  "defaultPortion": 100,
  "unit": "g",
  "per100": {
    "kcal": 0, "fat": 0, "fatSat": 0,
    "carbs": 0, "sugars": 0, "fiber": 0,
    "protein": 0, "salt": 0
  },
  "minerals": [{ "name": "Magnésium", "qty": "197 mg", "anr": "52 %", "role": "..." }],
  "vitamins": [{ "name": "Vitamine B1", "qty": "0.36 mg", "anr": "33 %", "role": "..." }],
  "trace": [{ "name": "Fer", "qty": "4.6 mg", "anr": "33 %", "role": "..." }],
  "fodmap": {
    "overall": "low",
    "types": [{ "name": "Fructanes", "present": "oui", "level": "faible" }],
    "elimination": { "portion": "80", "status": "safe", "note": "..." },
    "reintroduction": { "portion": "150", "status": "safe", "note": "..." },
    "absoluteLimit": { "portion": "250", "status": "warn", "note": "..." },
    "alternatives": [{ "name": "Riz basmati", "why": "Zéro FODMAP" }]
  },
  "bioactives": [{ "name": "Quercétine", "qty": "36 mg", "role": "..." }],
  "metabolic": [{ "axis": "Glycémie", "tone": "low", "text": "..." }],
  "sensory": { "taste": [], "texture": [], "aroma": [], "pairings": [] },
  "allergens": [
    { "name": "Gluten", "status": "absent" },
    { "name": "Lactose", "status": "absent" },
    { "name": "Œufs", "status": "absent" },
    { "name": "Arachides", "status": "absent" },
    { "name": "Fruits à coque", "status": "absent" },
    { "name": "Soja", "status": "absent" },
    { "name": "Poisson", "status": "absent" },
    { "name": "Crustacés", "status": "absent" },
    { "name": "Sésame", "status": "absent" },
    { "name": "Moutarde", "status": "absent" },
    { "name": "Céleri", "status": "absent" },
    { "name": "Sulfites", "status": "absent" },
    { "name": "Mollusques", "status": "absent" },
    { "name": "Lupin", "status": "absent" }
  ],
  "compat": [{ "label": "Sans gluten", "kind": "ok" }],
  "ingredients": "Liste des ingrédients..."
}`;

const SYSTEM_PROMPT = `Tu es un diététicien-nutritionniste expert. Tu génères des données nutritionnelles précises et complètes pour un aliment donné, en JSON strict.

Règles :
- Réponds UNIQUEMENT avec le JSON brut, sans balises markdown, sans texte avant ni après
- Utilise des valeurs nutritionnelles réelles issues des bases officielles (CIQUAL, USDA)
- Le statut FODMAP doit être basé sur les données Monash University
- Les allergènes : inclure les 14 standards, status = "contains" | "trace" | "absent"
- L'id doit être un slug unique : mots-clés-du-nom + "-001"
- tone dans metabolic : "high" (bénéfique), "mid" (neutre), "low" (à surveiller)

Format JSON attendu :
${FOOD_SCHEMA}`;

function buildUserPrompt(foodName: string, brand?: string, context?: string): string {
  let msg = `Génère les données nutritionnelles complètes pour : ${foodName}`;
  if (brand) msg += `\nMarque : ${brand}`;
  if (context) msg += `\nContexte : ${context}`;
  return msg;
}

function extractJSON(raw: string): string {
  // Strip markdown code blocks if present
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) s = fenced[1].trim();
  // Find first { to last }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return s;
}

function validateFood(obj: unknown): obj is Food {
  if (typeof obj !== 'object' || obj === null) return false;
  const f = obj as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.per100 === 'object' &&
    Array.isArray(f.allergens) &&
    Array.isArray(f.compat)
  );
}

async function callOpenRouter(
  settings: AppSettings['openrouter'],
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

async function callOllama(
  settings: AppSettings['ollama'],
  messages: { role: string; content: string }[],
): Promise<string> {
  const url = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  const json = await res.json();
  return json.message?.content ?? '';
}

export async function generateFoodWithAI(
  foodName: string,
  brand: string,
  context: string,
  appSettings: AppSettings,
): Promise<Food> {
  const { aiProvider, ollama, openrouter } = appSettings;

  if (aiProvider === 'openrouter' && !openrouter.apiKey) {
    throw new Error('Clé API OpenRouter manquante. Configure-la dans les Paramètres.');
  }
  if (aiProvider === 'openrouter' && !openrouter.model) {
    throw new Error('Aucun modèle OpenRouter sélectionné. Actualise la liste dans les Paramètres.');
  }
  if (aiProvider === 'ollama' && !ollama.model) {
    throw new Error('Aucun modèle Ollama configuré. Teste la connexion dans les Paramètres.');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(foodName, brand, context) },
  ];

  const raw =
    aiProvider === 'openrouter'
      ? await callOpenRouter(openrouter, messages)
      : await callOllama(ollama, messages);

  if (!raw) throw new Error('L\'IA n\'a retourné aucune réponse.');

  const json = extractJSON(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('La réponse de l\'IA n\'est pas un JSON valide. Réessaie.');
  }

  if (!validateFood(parsed)) {
    throw new Error('Le JSON retourné ne correspond pas au format attendu. Réessaie.');
  }

  return parsed as Food;
}

// ── AI readiness check ────────────────────────────────────────

export function isAIReady(settings: AppSettings): boolean {
  if (settings.aiProvider === 'openrouter') {
    return !!(settings.openrouter.apiKey && settings.openrouter.model);
  }
  return !!(settings.ollama.model);
}

// ── Enrichment schema ─────────────────────────────────────────

const ENRICH_SCHEMA = `{
  "subtitle": "1-2 phrases évocatrices de l'aliment",
  "origin": "Pays · Région ou null",
  "proteinDetail": {
    "totalG": 0, "complete": false, "bcaaG": 0, "pdcaas": 0,
    "amino": [{"name":"Leucine","qty":"800 mg","role":"Synthèse musculaire","essential":true}]
  },
  "carbDetail": {
    "totalG": 0, "starchG": 0, "sugarsG": 0, "fiberG": 0,
    "fiberSolubleG": 0, "fiberInsolubleG": 0, "glycemicIndex": 0, "glycemicLoad": 0,
    "notes": "Commentaire sur le profil glucidique"
  },
  "lipidDetail": {
    "totalG": 0,
    "fa": [{"name":"Acides gras saturés","qty":"x g","pct":"x %","role":"..."}],
    "ratioOmega": "x:1 (ω6/ω3)"
  },
  "minerals": [{"name":"Calcium","qty":"x mg","anr":"x %","role":"..."}],
  "vitamins": [{"name":"Vitamine C","qty":"x mg","anr":"x %","role":"..."}],
  "trace": [{"name":"Fer","qty":"x mg","anr":"x %","role":"..."}],
  "fodmap": {
    "overall": "low",
    "types": [{"name":"Fructanes","present":"oui","level":"faible"}],
    "elimination": {"portion":"80","status":"safe","note":"..."},
    "reintroduction": {"portion":"150","status":"safe","note":"..."},
    "absoluteLimit": {"portion":"250","status":"warn","note":"..."},
    "alternatives": [{"name":"Riz basmati","why":"Zéro FODMAP"}]
  },
  "bioactives": [{"name":"Quercétine","qty":"36 mg","role":"Flavonoïde, anti-oxydant"}],
  "metabolic": [
    {"axis":"Glycémie","tone":"low","text":"..."},
    {"axis":"Satiété","tone":"high","text":"..."},
    {"axis":"Inflammation","tone":"low","text":"..."},
    {"axis":"Charge digestive","tone":"mid","text":"..."},
    {"axis":"Récupération","tone":"high","text":"..."}
  ],
  "sensory": {
    "taste": ["sucré"], "texture": ["croquant"],
    "aroma": ["fruité"], "pairings": ["Yaourt"]
  },
  "allergens": [
    {"name":"Gluten","status":"absent"},{"name":"Lactose","status":"absent"},
    {"name":"Œufs","status":"absent"},{"name":"Arachides","status":"absent"},
    {"name":"Fruits à coque","status":"absent"},{"name":"Soja","status":"absent"},
    {"name":"Poisson","status":"absent"},{"name":"Crustacés","status":"absent"},
    {"name":"Sésame","status":"absent"},{"name":"Moutarde","status":"absent"},
    {"name":"Céleri","status":"absent"},{"name":"Sulfites","status":"absent"},
    {"name":"Mollusques","status":"absent"},{"name":"Lupin","status":"absent"}
  ]
}`;

const ENRICH_SYSTEM_PROMPT = `Tu es un diététicien-nutritionniste expert. Un aliment t'est fourni avec des données partielles issues d'une base officielle (CIQUAL ou Open Food Facts). Tu dois générer UNIQUEMENT les zones manquantes demandées.

Règles absolues :
- Réponds UNIQUEMENT avec un objet JSON brut, sans markdown ni texte autour
- Ne retourne QUE les clés listées dans la demande (pas l'objet Food complet)
- N'invente jamais les données per100 — utilise uniquement celles fournies
- Base tes réponses sur CIQUAL, USDA et Monash University (FODMAP)
- tone dans metabolic : "high" (bénéfique), "mid" (neutre), "low" (à surveiller)
- Pour les allergens : évalue selon le nom, catégorie et ingrédients de l'aliment`;

// Rebuild compat from full food (allergens + nutrition)
function buildCompatFull(food: Food): CompatItem[] {
  const compat: CompatItem[] = [];

  if (food.per100.salt < 0.3)   compat.push({ label: 'Pauvre en sel', kind: 'ok' });
  if (food.per100.sugars < 5)   compat.push({ label: 'Pauvre en sucres', kind: 'ok' });
  if (food.per100.fat < 3)      compat.push({ label: 'Pauvre en graisses', kind: 'ok' });
  if (food.per100.fiber > 5)    compat.push({ label: 'Riche en fibres', kind: 'ok' });
  if (food.per100.protein > 15) compat.push({ label: 'Riche en protéines', kind: 'ok' });
  if (food.per100.salt > 1.5)   compat.push({ label: 'Riche en sel', kind: 'warn' });
  if (food.per100.sugars > 15)  compat.push({ label: 'Riche en sucres', kind: 'warn' });

  const map = Object.fromEntries(food.allergens.map((a) => [a.name, a.status]));
  if (map['Gluten'] === 'absent') compat.push({ label: 'Sans gluten', kind: 'ok' });
  else if (map['Gluten'] === 'contains') compat.push({ label: 'Contient gluten', kind: 'warn' });
  if (map['Lactose'] === 'absent') compat.push({ label: 'Sans lactose', kind: 'ok' });
  else if (map['Lactose'] === 'contains') compat.push({ label: 'Contient lactose', kind: 'warn' });

  const animalFoods = ['Œufs', 'Lactose', 'Poisson', 'Crustacés', 'Mollusques'];
  if (animalFoods.every((n) => map[n] === 'absent')) {
    compat.push({ label: 'Vegan', kind: 'ok' });
  }

  if (food.fodmap) {
    if (food.fodmap.overall === 'low') {
      compat.push({ label: `Low FODMAP (≤${food.fodmap.reintroduction?.portion ?? '?'}g)`, kind: 'ok' });
    } else if (food.fodmap.overall === 'high') {
      compat.push({ label: 'FODMAP élevé', kind: 'warn' });
    }
  }

  for (const a of food.allergens.filter((a) => a.status === 'trace')) {
    compat.push({ label: `Traces ${a.name.toLowerCase()}`, kind: 'warn' });
  }

  return compat;
}

// ── Enrich a partial Food with AI (CIQUAL / OFF import) ──────

export async function enrichFoodWithAI(food: Food, settings: AppSettings): Promise<Food> {
  const allAllergenAbsent = food.allergens.every((a) => a.status === 'absent');

  const missing: string[] = [];
  if (!food.proteinDetail) missing.push('proteinDetail');
  if (!food.carbDetail) missing.push('carbDetail');
  if (!food.lipidDetail) missing.push('lipidDetail');
  if (!food.minerals || food.minerals.length === 0) missing.push('minerals');
  if (!food.vitamins || food.vitamins.length === 0) missing.push('vitamins');
  if (!food.trace || food.trace.length === 0) missing.push('trace');
  if (!food.fodmap) missing.push('fodmap');
  if (!food.bioactives) missing.push('bioactives');
  if (!food.metabolic) missing.push('metabolic');
  if (!food.sensory) missing.push('sensory');
  if (allAllergenAbsent) missing.push('allergens');
  const genericSubtitle = !food.subtitle
    || food.subtitle.startsWith('Base CIQUAL')
    || food.subtitle.startsWith('Importé depuis');
  if (genericSubtitle) missing.push('subtitle');
  if (!food.origin) missing.push('origin');

  if (missing.length === 0) return food;

  const knownData: Record<string, unknown> = { per100: food.per100 };
  if (!allAllergenAbsent) knownData.allergens = food.allergens;
  if (food.minerals && food.minerals.length > 0) knownData.minerals = food.minerals;
  if (food.vitamins && food.vitamins.length > 0) knownData.vitamins = food.vitamins;
  if (food.trace && food.trace.length > 0) knownData.trace = food.trace;
  if (food.ingredients) knownData.ingredients = food.ingredients;

  const userPrompt = `Aliment : "${food.name}" (${food.category})${
    food.brand && food.brand !== 'CIQUAL — ANSES' ? `\nMarque : ${food.brand}` : ''
  }

Données vérifiées à conserver telles quelles :
${JSON.stringify(knownData, null, 2)}

Zones à générer (UNIQUEMENT ces clés) : ${missing.join(', ')}

Schéma de référence :
${ENRICH_SCHEMA}`;

  const messages = [
    { role: 'system', content: ENRICH_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const raw =
    settings.aiProvider === 'openrouter'
      ? await callOpenRouter(settings.openrouter, messages)
      : await callOllama(settings.ollama, messages);

  if (!raw) throw new Error('Réponse IA vide lors de l\'enrichissement.');

  let enriched: Record<string, unknown>;
  try {
    enriched = JSON.parse(extractJSON(raw));
  } catch {
    throw new Error('JSON d\'enrichissement invalide.');
  }

  const enrichedAllergens = (enriched.allergens as Allergen[] | undefined);
  const finalAllergens: Allergen[] = allAllergenAbsent && enrichedAllergens?.length
    ? enrichedAllergens
    : food.allergens;

  const merged: Food = {
    ...food,
    subtitle: genericSubtitle ? (enriched.subtitle as string ?? food.subtitle) : food.subtitle,
    origin: food.origin ?? (enriched.origin as string | undefined),
    proteinDetail: food.proteinDetail ?? (enriched.proteinDetail as Food['proteinDetail']),
    carbDetail: food.carbDetail ?? (enriched.carbDetail as Food['carbDetail']),
    lipidDetail: food.lipidDetail ?? (enriched.lipidDetail as Food['lipidDetail']),
    minerals: food.minerals?.length ? food.minerals : (enriched.minerals as Food['minerals']),
    vitamins: food.vitamins?.length ? food.vitamins : (enriched.vitamins as Food['vitamins']),
    trace: food.trace?.length ? food.trace : (enriched.trace as Food['trace']),
    fodmap: food.fodmap ?? (enriched.fodmap as Food['fodmap']),
    bioactives: food.bioactives ?? (enriched.bioactives as Food['bioactives']),
    metabolic: food.metabolic ?? (enriched.metabolic as Food['metabolic']),
    sensory: food.sensory ?? (enriched.sensory as Food['sensory']),
    allergens: finalAllergens,
  };

  merged.compat = buildCompatFull(merged);

  return merged;
}

// ── Meal Generator ────────────────────────────────────────────

const MEAL_SCHEMA = `[
  {
    "name": "Nom du repas",
    "emoji": "🥗",
    "description": "Description appétissante en 1-2 phrases",
    "mealType": "Déjeuner",
    "prepTime": 15,
    "cookTime": 20,
    "servings": 2,
    "ingredients": [
      { "name": "Quinoa", "amount": "80 g (cru)", "fodmapNote": "Safe jusqu'à 155 g cuit" }
    ],
    "per_serving": { "kcal": 480, "protein": 28, "carbs": 52, "fat": 14, "fiber": 7 },
    "micronutrients": [
      { "name": "Fer", "amount": "4.2 mg", "pct_anr": "30 %" }
    ],
    "tags": ["low-fodmap", "sans-gluten", "végétarien"],
    "fodmapCompatibility": "Compatible élimination — tous les ingrédients respectent les seuils Monash",
    "antiInflammatoryScore": 78,
    "whyGood": "Riche en oméga-3, faible en fructanes, apporte magnésium et zinc"
  }
]`;

const MEAL_SYSTEM_PROMPT = `Tu es un diététicien-nutritionniste spécialisé en FODMAP, micronutriments et alimentation thérapeutique. Tu génères des recettes personnalisées en JSON strict.

Règles absolues :
- Réponds UNIQUEMENT avec un tableau JSON brut (un array), sans markdown, sans texte autour
- Génère exactement 3 repas différents adaptés à la demande
- Valeurs nutritionnelles précises (par portion, pas pour 100g)
- FODMAP : base-toi sur les données Monash University avec portions exactes
- Si le profil a "Low FODMAP" actif : chaque ingrédient doit être dans les limites Monash
- Respecte les allergènes "sévère" et "modéré" comme des interdits absolus
- Respecte les allergènes "trace" en mentionnant le risque si pertinent
- antiInflammatoryScore : 0-100, basé sur oméga-3/6, polyphénols, index glycémique
- whyGood : explique en 1-2 phrases pourquoi ce repas est adapté AU profil fourni`;

function buildMealPrompt(
  query: string,
  profile: UserProfile,
  fodmapPhase?: FodmapPhase,
): string {
  const activeDiets = profile.diets.filter((d) => d.on).map((d) => d.label);
  const activeAllergens = profile.allergens.filter((a) => a.level !== 'aucun');
  const isLowFodmap = profile.diets.some((d) => d.id === 'low' && d.on);

  let prompt = `Demande : ${query}\n\nProfil :\n`;
  prompt += `- Objectif calorique : ${profile.kcalTarget} kcal/jour\n`;
  prompt += `- Objectifs macros : ${profile.macroTargets.protein}g protéines, ${profile.macroTargets.carbs}g glucides, ${profile.macroTargets.fat}g lipides\n`;

  if (activeDiets.length > 0) {
    prompt += `- Régimes actifs : ${activeDiets.join(', ')}\n`;
  }
  if (activeAllergens.length > 0) {
    prompt += `- Allergènes/intolérances :\n`;
    for (const a of activeAllergens) {
      prompt += `  • ${a.name} — niveau ${a.level}${a.note ? ` (${a.note})` : ''}\n`;
    }
  }
  if (isLowFodmap && fodmapPhase) {
    const phaseLabels: Record<FodmapPhase, string> = {
      elimination: 'Élimination (phase stricte)',
      reintroduction: 'Réintroduction (tester un groupe à la fois)',
      stabilization: 'Stabilisation (personnalisation des seuils)',
    };
    prompt += `- Phase FODMAP : ${phaseLabels[fodmapPhase]}\n`;
  }

  prompt += `\nSchéma attendu pour chaque repas :\n${MEAL_SCHEMA}`;
  return prompt;
}

// ── Day nutritional advice ────────────────────────────────────

const DAY_ADVICE_SYSTEM = `Tu es nutritionniste. Analyse l'équilibre nutritionnel d'une journée alimentaire et donne un commentaire concis en 2-3 phrases en français.

Évalue :
- L'équilibre P/G/L selon les recommandations (15-20 % protéines, 45-55 % glucides, 30-35 % lipides)
- L'atteinte de l'objectif calorique
- Si la journée est équilibrée, trop glucidique, trop lipidique, pauvre en protéines, etc.
- Un conseil pratique si pertinent

Réponds UNIQUEMENT avec le commentaire en texte brut, sans titre, sans liste, sans markdown.`;

export async function generateDayAdvice(
  totals: { kcal: number; protein: number; carbs: number; fat: number },
  profile: UserProfile,
  settings: AppSettings,
): Promise<string> {
  const energyTotal = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9 || 1;
  const pctP = Math.round((totals.protein * 4 / energyTotal) * 100);
  const pctC = Math.round((totals.carbs   * 4 / energyTotal) * 100);
  const pctF = Math.round((totals.fat     * 9 / energyTotal) * 100);

  const userMsg = `Journée alimentaire :
Énergie : ${Math.round(totals.kcal)} kcal / objectif ${profile.kcalTarget} kcal (${Math.round(totals.kcal / profile.kcalTarget * 100)} %)
Protéines : ${Math.round(totals.protein)} g (${pctP} % de l'énergie) / objectif ${profile.macroTargets.protein} g
Glucides : ${Math.round(totals.carbs)} g (${pctC} %) / objectif ${profile.macroTargets.carbs} g
Lipides : ${Math.round(totals.fat)} g (${pctF} %) / objectif ${profile.macroTargets.fat} g`;

  const messages = [
    { role: 'system', content: DAY_ADVICE_SYSTEM },
    { role: 'user', content: userMsg },
  ];

  const raw =
    settings.aiProvider === 'openrouter'
      ? await callOpenRouter(settings.openrouter, messages)
      : await callOllama(settings.ollama, messages);

  if (!raw) throw new Error('Réponse IA vide.');
  return raw.trim();
}

// ── Plate macro estimation ────────────────────────────────────

const PLATE_MACRO_SYSTEM = `Tu es nutritionniste expert. Pour chaque ingrédient fourni avec sa quantité, estime les macronutriments (kcal, protéines g, glucides g, lipides g) en te basant sur CIQUAL et USDA.

Règles :
- Réponds UNIQUEMENT avec un tableau JSON brut, sans markdown, dans le même ordre que l'entrée
- Arrondis les valeurs à 1 décimale
- Si la quantité est "QS" ou non mesurable, mets 0 pour tout

Schéma par élément :
{"name":"...","qty":"...","kcal":0,"macros":{"protein":0,"carbs":0,"fat":0}}`;

// ── Plate nutritional comment ─────────────────────────────────

const PLATE_COMMENT_SYSTEM = `Tu es nutritionniste. Analyse l'équilibre nutritionnel d'un plat et donne un commentaire concis en 2-3 phrases en français.

Évalue :
- L'équilibre P/G/L selon les recommandations (15-20% protéines, 45-55% glucides, 30-35% lipides)
- Si le plat est équilibré, trop glucidique, trop lipidique, pauvre en protéines, etc.
- La densité calorique et un conseil pratique si pertinent

Réponds UNIQUEMENT avec le commentaire en texte brut, sans titre, sans liste, sans markdown.`;

export async function generatePlateComment(
  plate: { name: string; kcal: number; macros: { protein: number; carbs: number; fat: number }; recipe: Array<{ name: string; qty: string }> },
  settings: AppSettings,
): Promise<string> {
  const total = plate.macros.protein * 4 + plate.macros.carbs * 4 + plate.macros.fat * 9 || 1;
  const pctP = Math.round((plate.macros.protein * 4 / total) * 100);
  const pctC = Math.round((plate.macros.carbs   * 4 / total) * 100);
  const pctF = Math.round((plate.macros.fat      * 9 / total) * 100);

  const userMsg = `Plat : ${plate.name}
Énergie : ${plate.kcal} kcal
Protéines : ${plate.macros.protein} g (${pctP} % de l'énergie)
Glucides : ${plate.macros.carbs} g (${pctC} %)
Lipides : ${plate.macros.fat} g (${pctF} %)
Ingrédients : ${plate.recipe.map((r) => `${r.name} ${r.qty}`).join(', ')}`;

  const messages = [
    { role: 'system', content: PLATE_COMMENT_SYSTEM },
    { role: 'user', content: userMsg },
  ];

  const raw =
    settings.aiProvider === 'openrouter'
      ? await callOpenRouter(settings.openrouter, messages)
      : await callOllama(settings.ollama, messages);

  if (!raw) throw new Error('Réponse IA vide.');
  return raw.trim();
}

export async function estimatePlateMacros(
  recipe: Array<{ name: string; qty: string }>,
  settings: AppSettings,
): Promise<Array<{ name: string; qty: string; kcal: number; macros: { protein: number; carbs: number; fat: number } }>> {
  const userMsg = `Ingrédients :\n${recipe.map((r, i) => `${i + 1}. ${r.name} — ${r.qty}`).join('\n')}`;
  const messages = [
    { role: 'system', content: PLATE_MACRO_SYSTEM },
    { role: 'user', content: userMsg },
  ];

  const raw =
    settings.aiProvider === 'openrouter'
      ? await callOpenRouter(settings.openrouter, messages)
      : await callOllama(settings.ollama, messages);

  if (!raw) throw new Error('Réponse IA vide.');

  const jsonStr = extractJSONArray(raw);
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('Format inattendu.');
  return parsed as Array<{ name: string; qty: string; kcal: number; macros: { protein: number; carbs: number; fat: number } }>;
}

function extractJSONArray(raw: string): string {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start !== -1 && end !== -1) return s.slice(start, end + 1);
  // Fallback: maybe wrapped in object
  const objStart = s.indexOf('{');
  if (objStart !== -1) {
    try {
      const parsed = JSON.parse(s.slice(objStart, s.lastIndexOf('}') + 1)) as Record<string, unknown>;
      if (parsed.meals && Array.isArray(parsed.meals)) return JSON.stringify(parsed.meals);
    } catch { /* ignore */ }
  }
  return s;
}

export async function generateMeals(
  query: string,
  profile: UserProfile,
  fodmapPhase: FodmapPhase | undefined,
  appSettings: AppSettings,
): Promise<MealGeneratorResult> {
  if (appSettings.aiProvider === 'openrouter' && !appSettings.openrouter.apiKey) {
    throw new Error('Clé API OpenRouter manquante. Configure-la dans les Paramètres.');
  }
  if (appSettings.aiProvider === 'openrouter' && !appSettings.openrouter.model) {
    throw new Error('Aucun modèle OpenRouter sélectionné. Actualise la liste dans les Paramètres.');
  }
  if (appSettings.aiProvider === 'ollama' && !appSettings.ollama.model) {
    throw new Error('Aucun modèle Ollama configuré. Teste la connexion dans les Paramètres.');
  }

  const messages = [
    { role: 'system', content: MEAL_SYSTEM_PROMPT },
    { role: 'user', content: buildMealPrompt(query, profile, fodmapPhase) },
  ];

  const raw =
    appSettings.aiProvider === 'openrouter'
      ? await callOpenRouter(appSettings.openrouter, messages)
      : await callOllama(appSettings.ollama, messages);

  if (!raw) throw new Error('L\'IA n\'a retourné aucune réponse.');

  const jsonStr = extractJSONArray(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('La réponse de l\'IA n\'est pas un JSON valide. Réessaie.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Format inattendu — aucun repas retourné. Réessaie.');
  }

  const meals = parsed as GeneratedMeal[];
  return { meals };
}
