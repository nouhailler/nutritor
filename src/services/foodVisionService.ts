import * as FileSystem from 'expo-file-system/legacy';
import { AppSettings } from '../types/settings';
import { Food, Allergen, CompatItem } from '../types';

// ── Vision model detection ────────────────────────────────────

const VISION_PATTERNS = [
  'claude-3', 'claude-4',
  'gpt-4o', 'gpt-4-vision', 'gpt-4-turbo',
  'gemini',
  'pixtral',
  'llava',
  'moondream',
  'qwen-vl', 'qwen2-vl',
  'vision',          // catches llama-3.2-*-vision, etc.
];

export function isVisionCapableModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return VISION_PATTERNS.some((p) => id.includes(p));
}

// ── Result types ──────────────────────────────────────────────

export interface VisionFoodItem {
  name: string;
  category: string;
  estimated_weight_g: number;
  kcal_per_100g: number;
  kcal_total: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  allergens_likely: string[];
  fodmap_note: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface VisionAnalysisResult {
  scene_description: string;
  foods: VisionFoodItem[];
  global_warnings: string[];
  total_kcal_estimate: number;
}

// ── Prompt ────────────────────────────────────────────────────

const VISION_PROMPT = `Tu es un nutritionniste expert en alimentation française. Analyse cette photo et identifie tous les aliments visibles.

Consignes :
- Estime les portions en grammes (assiette standard ≈ 26cm, verre = 200ml)
- Valeurs nutritionnelles pour 100g depuis CIQUAL / USDA
- Allergènes parmi : Gluten, Lactose, Œufs, Arachides, Fruits à coque, Soja, Poisson, Crustacés, Sésame, Moutarde, Céleri, Sulfites
- FODMAP : mentionne seulement si présents (fructanes, fructose, lactose, GOS, polyols)
- confidence "low" si l'aliment est difficile à identifier avec certitude

Réponds UNIQUEMENT avec ce JSON brut, sans markdown ni texte autour :
{
  "scene_description": "description en 1 phrase",
  "foods": [
    {
      "name": "Nom français",
      "category": "Catégorie",
      "estimated_weight_g": 150,
      "kcal_per_100g": 130,
      "kcal_total": 195,
      "protein_g": 8.5,
      "carbs_g": 22.0,
      "fat_g": 3.2,
      "allergens_likely": [],
      "fodmap_note": "",
      "confidence": "high"
    }
  ],
  "global_warnings": [],
  "total_kcal_estimate": 350
}`;

// ── API call ──────────────────────────────────────────────────

function extractJSON(raw: string): string {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return s;
}

export async function analyzeFoodPhoto(
  imageUri: string,
  settings: AppSettings,
): Promise<VisionAnalysisResult> {
  if (settings.aiProvider === 'ollama') {
    throw new Error(
      'La reconnaissance photo nécessite OpenRouter.\n\nPasse en mode OpenRouter dans les Paramètres.',
    );
  }

  const { apiKey, model } = settings.openrouter;
  if (!apiKey) throw new Error('Clé API OpenRouter manquante. Configure-la dans les Paramètres.');
  if (!model) throw new Error('Aucun modèle OpenRouter sélectionné.');

  if (!isVisionCapableModel(model)) {
    throw new Error(
      `Le modèle « ${model} » ne supporte pas l'analyse d'images.\n\nModèles compatibles : claude-3.5-sonnet, gpt-4o, gemini-1.5-flash, llama-3.2-vision…`,
    );
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const raw: string = json.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error("L'IA n'a retourné aucune réponse.");

  let parsed: VisionAnalysisResult;
  try {
    parsed = JSON.parse(extractJSON(raw));
  } catch {
    throw new Error("La réponse de l'IA n'est pas un JSON valide. Réessaie.");
  }

  if (!Array.isArray(parsed.foods)) {
    throw new Error('Format de réponse inattendu.');
  }

  return parsed;
}

// ── Convert VisionFoodItem → Food ─────────────────────────────

const ALLERGEN_NAMES = [
  'Gluten', 'Lactose', 'Œufs', 'Arachides', 'Fruits à coque',
  'Soja', 'Poisson', 'Crustacés', 'Sésame', 'Moutarde',
  'Céleri', 'Sulfites', 'Mollusques', 'Lupin',
];

export function visionItemToFood(item: VisionFoodItem): Food {
  const slug = item.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  const id = `photo-${slug}-${Date.now()}`;

  const likely = item.allergens_likely ?? [];
  const allergens: Allergen[] = ALLERGEN_NAMES.map((name) => ({
    name,
    status: likely.includes(name) ? 'contains' : 'absent',
  }));

  const compat: CompatItem[] = [];
  if (item.fat_g < 3)      compat.push({ label: 'Pauvre en graisses', kind: 'ok' });
  if (item.protein_g > 15) compat.push({ label: 'Riche en protéines', kind: 'ok' });
  if (likely.includes('Gluten'))  compat.push({ label: 'Contient gluten',  kind: 'warn' });
  if (likely.includes('Lactose')) compat.push({ label: 'Contient lactose', kind: 'warn' });
  if (item.fodmap_note)           compat.push({ label: 'FODMAP — voir note', kind: 'warn' });

  return {
    id,
    name: item.name,
    brand: 'Analyse photo IA',
    category: item.category || 'Non classé',
    unit: 'g',
    defaultPortion: Math.max(1, Math.round(item.estimated_weight_g || 100)),
    subtitle: 'Estimé par analyse photo — vérifier les valeurs',
    ingredients: '',
    per100: {
      kcal:    item.kcal_per_100g,
      fat:     item.fat_g,
      fatSat:  0,
      carbs:   item.carbs_g,
      sugars:  0,
      fiber:   0,
      protein: item.protein_g,
      salt:    0,
    },
    allergens,
    compat,
  };
}
