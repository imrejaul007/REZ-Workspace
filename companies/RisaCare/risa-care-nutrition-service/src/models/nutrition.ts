import { z } from 'zod';

// =====================
// ENUMS & CONSTANTS
// =====================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'midnight_snack';

export type DietGoal =
  | 'weight_loss'
  | 'weight_gain'
  | 'maintenance'
  | 'muscle_building'
  | 'diabetic'
  | 'heart_healthy';

export type ServingUnit = 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'slice' | 'serving';

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'proteins'
  | 'dairy'
  | 'fats'
  | 'beverages'
  | 'snacks'
  | 'sweets'
  | 'fast_food'
  | 'custom';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// =====================
// ZOD SCHEMAS
// =====================

export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  servingSize: z.number().min(0),
  servingUnit: z.string() as z.ZodType<ServingUnit>,
  glycemicIndex: z.number().optional(),
  allergens: z.array(z.string()).default([]),
  category: z.string() as z.ZodType<FoodCategory>,
  isCustom: z.boolean().default(false),
  createdBy: z.string().optional(),
});

export const MealSchema = z.object({
  id: z.string(),
  type: z.string() as z.ZodType<MealType>,
  foods: z.array(FoodItemSchema),
  calories: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  time: z.string(),
  notes: z.string().optional(),
});

export const MealLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  meals: z.array(MealSchema).default([]),
  totalNutrition: z.object({
    calories: z.number().default(0),
    protein: z.number().default(0),
    carbs: z.number().default(0),
    fat: z.number().default(0),
    fiber: z.number().default(0),
  }),
  hydration: z.number().min(0).default(0),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DietPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  goal: z.string() as z.ZodType<DietGoal>,
  targetCalories: z.number().min(0),
  macros: z.object({
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  }),
  meals: z.array(MealSchema).default([]),
  restrictions: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean().default(true),
});

export const NutritionGoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetCalories: z.number().min(0),
  targetProtein: z.number().min(0),
  targetCarbs: z.number().min(0),
  targetFat: z.number().min(0),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  startDate: z.string(),
  endDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const IngredientSchema = z.object({
  foodItem: FoodItemSchema,
  quantity: z.number().min(0),
  unit: z.string(),
});

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(z.string()),
  nutritionPerServing: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0),
  }),
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
  servings: z.number().min(1),
  difficulty: z.string() as z.ZodType<DifficultyLevel>,
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// =====================
// TYPESCRIPT INTERFACES
// =====================

export interface FoodItem extends z.infer<typeof FoodItemSchema> {}

export interface Meal extends z.infer<typeof MealSchema> {}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealLog extends z.infer<typeof MealLogSchema> {}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlan extends z.infer<typeof DietPlanSchema> {}

export interface NutritionGoal extends z.infer<typeof NutritionGoalSchema> {}

export interface Ingredient extends z.infer<typeof IngredientSchema> {}

export interface Recipe extends z.infer<typeof RecipeSchema> {}

export interface RecipeSearchParams {
  query?: string;
  goal?: DietGoal;
  maxCalories?: number;
  maxPrepTime?: number;
  tags?: string[];
  difficulty?: DifficultyLevel;
}

export interface NutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  mealsLogged: number;
  hydration: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  caloriesRemaining: number;
  proteinRemaining: number;
  carbsRemaining: number;
  fatRemaining: number;
}

export interface WeeklyTrends {
  startDate: string;
  endDate: string;
  dailyData: DailyNutritionData[];
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  totalMeals: number;
}

export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealsLogged: number;
}

export interface MacroBreakdown {
  protein: { grams: number; percentage: number; calories: number };
  carbs: { grams: number; percentage: number; calories: number };
  fat: { grams: number; percentage: number; calories: number };
}

export interface GoalProgress {
  currentCalories: number;
  targetCalories: number;
  progress: number;
  currentProtein: number;
  targetProtein: number;
  proteinProgress: number;
  currentCarbs: number;
  targetCarbs: number;
  carbsProgress: number;
  currentFat: number;
  targetFat: number;
  fatProgress: number;
  streak: number;
  status: 'on_track' | 'ahead' | 'behind';
}

export interface MealSuggestion {
  mealType: MealType;
  time: string;
  suggestedFoods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  reason: string;
}

export interface AIRecommendation {
  type: 'meal' | 'substitution' | 'timing' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  potentialImpact: string;
}

// =====================
// IN-MEMORY DATABASE
// =====================

export interface InMemoryDB {
  mealLogs: Map<string, MealLog>;
  dietPlans: Map<string, DietPlan>;
  nutritionGoals: Map<string, NutritionGoal>;
  foodItems: Map<string, FoodItem>;
  recipes: Map<string, Recipe>;
}

export const db: InMemoryDB = {
  mealLogs: new Map(),
  dietPlans: new Map(),
  nutritionGoals: new Map(),
  foodItems: new Map(),
  recipes: new Map(),
};
