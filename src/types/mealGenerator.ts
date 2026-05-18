export interface GeneratedMealIngredient {
  name: string;
  amount: string;
  fodmapNote?: string;
}

export interface GeneratedMeal {
  name: string;
  emoji: string;
  description: string;
  mealType: string;
  prepTime: number;
  cookTime?: number;
  servings: number;
  ingredients: GeneratedMealIngredient[];
  per_serving: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  micronutrients?: Array<{ name: string; amount: string; pct_anr?: string }>;
  tags: string[];
  fodmapCompatibility?: string;
  antiInflammatoryScore?: number;
  whyGood?: string;
}

export interface MealGeneratorResult {
  meals: GeneratedMeal[];
  contextNote?: string;
}
