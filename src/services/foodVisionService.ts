import { Platform } from 'react-native';
import { AppSettings } from '../types/settings';
import { Food, Allergen, CompatItem } from '../types';

// ── Image → base64 (cross-platform) ──────────────────────────

async function readImageAsBase64(uri: string): Promise<string> {
  // data: URI already carries base64 (expo-image-picker on web)
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }

  if (Platform.OS === 'web') {
    // blob: URL on web
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native: use expo-file-system
  const FS = await import('expo-file-system/legacy');
  return FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
}

// ── Vision model detection ────────────────────────────────────

const VISION_PATTERNS = [
  'claude-3', 'claude-4',
  'gpt-4o', 'gpt-4-vision', 'gpt-4-turbo',
  'gemini',
  'gemma-4',         // google/gemma-4-* — multimodal nativement
  'pixtral',
  'llava',
  'moondream',
  'qwen-vl', 'qwen2-vl',
  'nemotron',        // nvidia/nemotron-* omni + vl
  '-vl',             // suffixe vision-language (ex: nemotron-nano-12b-v2-vl)
  'omni',            // modèles omni-modaux (texte, image, audio)
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

const VISION_PROMPT = `Identifie les aliments visibles dans cette photo. Réponds en JSON avec cette structure exacte :

{
  "scene_description": "Une phrase décrivant la photo",
  "foods": [
    {
      "name": "Nom de l'aliment en français",
      "category": "Catégorie (ex: Céréales, Fruits, Viandes...)",
      "estimated_weight_g": 100,
      "kcal_per_100g": 250,
      "kcal_total": 250,
      "protein_g": 8.0,
      "carbs_g": 50.0,
      "fat_g": 2.0,
      "allergens_likely": ["Gluten"],
      "fodmap_note": "",
      "confidence": "high"
    }
  ],
  "global_warnings": [],
  "total_kcal_estimate": 250
}

Règles : portions estimées en grammes, valeurs nutritionnelles pour 100g (CIQUAL/USDA), allergènes parmi [Gluten, Lactose, Œufs, Arachides, Fruits à coque, Soja, Poisson, Crustacés], confidence = "high"/"medium"/"low".`;

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
      `Le modèle « ${model} » ne supporte pas l'analyse d'images.\n\nModèles gratuits compatibles (OpenRouter) :\n• google/gemma-4-26b-a4b-it:free\n• nvidia/nemotron-nano-12b-v2-vl:free\n• llama-3.2-*-vision, gemini-1.5-flash…`,
    );
  }

  const base64 = await readImageAsBase64(imageUri);

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
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = await res.json();
  const raw: string = json.choices?.[0]?.message?.content ?? '';

  if (!raw) {
    const reason = json.choices?.[0]?.finish_reason ?? 'inconnu';
    throw new Error(
      `L'IA n'a retourné aucune réponse (finish_reason: ${reason}).\n\nLes modèles gratuits peuvent être temporairement surchargés. Réessaie dans quelques secondes.`,
    );
  }

  let parsed: VisionAnalysisResult;
  try {
    parsed = JSON.parse(extractJSON(raw));
  } catch {
    throw new Error(
      `L'IA n'a pas respecté le format JSON.\n\nRéponse reçue :\n${raw.slice(0, 300)}`,
    );
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
