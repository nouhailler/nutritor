import { AppSettings } from '../types/settings';
import { Food } from '../types';

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
