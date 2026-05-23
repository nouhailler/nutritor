export type QueryMode = 'ingredients' | 'profile' | 'criteria' | 'variant';

export interface SmartIngredient {
  name: string;
  amount: string;
  note?: string | null;
  substitution?: string | null;
}

export interface SmartRecipe {
  name: string;
  emoji: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: SmartIngredient[];
  steps: string[];
  per_serving: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  fodmapLoad: 'low' | 'moderate' | 'high';
  glycemicLoad: 'low' | 'moderate' | 'high';
  digestionProfile: 'light' | 'moderate' | 'heavy';
  satiety: 'low' | 'moderate' | 'high';
  warnings: string[];
  physiologicalTimeline: string;
  tags: string[];
  whyGoodForProfile: string;
  energyProfile: string;
}

export interface SmartRecipeQuery {
  mode: QueryMode;
  ingredients?: string[];
  criteria?: string[];
  mealType?: string;
  variantOf?: string;
  variantType?: string;
}
