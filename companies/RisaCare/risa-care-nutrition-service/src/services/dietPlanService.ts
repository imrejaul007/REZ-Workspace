import { v4 as uuidv4 } from 'uuid';
import { db, DietGoal, DietPlan, FoodItem, Meal, MealSuggestion, AIRecommendation } from '../models/nutrition';

export const createPlan = (
  userId: string,
  goal: DietGoal,
  targetCalories: number,
  macros: { protein: number; carbs: number; fat: number },
  restrictions: string[] = []
): DietPlan => {
  const plan: DietPlan = {
    id: uuidv4(),
    userId,
    goal,
    targetCalories,
    macros,
    meals: [],
    restrictions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  db.dietPlans.set(plan.id, plan);
  return plan;
};

export const getPlan = (planId: string): DietPlan | null => {
  return db.dietPlans.get(planId) || null;
};

export const getUserActivePlan = (userId: string): DietPlan | null => {
  for (const plan of db.dietPlans.values()) {
    if (plan.userId === userId && plan.isActive) {
      return plan;
    }
  }
  return null;
};

export const updatePlan = (
  planId: string,
  updates: Partial<Pick<DietPlan, 'meals' | 'restrictions' | 'isActive' | 'targetCalories' | 'macros'>>
): DietPlan | null => {
  const plan = db.dietPlans.get(planId);
  if (!plan) return null;

  if (updates.meals !== undefined) plan.meals = updates.meals;
  if (updates.restrictions !== undefined) plan.restrictions = updates.restrictions;
  if (updates.isActive !== undefined) plan.isActive = updates.isActive;
  if (updates.targetCalories !== undefined) plan.targetCalories = updates.targetCalories;
  if (updates.macros !== undefined) plan.macros = updates.macros;
  plan.updatedAt = new Date().toISOString();

  db.dietPlans.set(planId, plan);
  return plan;
};

const generateMealByType = (
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetCalories: number,
  goal: DietGoal
): { foods: FoodItem[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number } => {
  const foods: FoodItem[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const allFoods = Array.from(db.foodItems.values());

  const mealConfigs: Record<string, { count: number; calorieRatio: number; proteinBias: boolean }> = {
    breakfast: { count: 3, calorieRatio: 0.25, proteinBias: true },
    lunch: { count: 4, calorieRatio: 0.35, proteinBias: true },
    dinner: { count: 4, calorieRatio: 0.30, proteinBias: true },
    snack: { count: 2, calorieRatio: 0.10, proteinBias: false },
  };

  const config = mealConfigs[mealType];
  const targetMealCalories = targetCalories * config.calorieRatio;

  const categories = mealType === 'breakfast'
    ? ['grains', 'dairy', 'fruits', 'beverages']
    : mealType === 'lunch' || mealType === 'dinner'
    ? ['proteins', 'grains', 'vegetables', 'fats']
    : ['fruits', 'dairy', 'fats', 'snacks'];

  for (let i = 0; i < config.count && totalCalories < targetMealCalories * 0.9; i++) {
    const categoryFoods = allFoods.filter(f => categories.includes(f.category));
    if (categoryFoods.length === 0) continue;

    const food = categoryFoods[Math.floor(Math.random() * categoryFoods.length)];
    const remainingCalories = targetMealCalories - totalCalories;
    const servingRatio = Math.min(remainingCalories / food.calories, 2);

    foods.push(food);
    totalCalories += food.calories * servingRatio;
    totalProtein += food.protein * servingRatio;
    totalCarbs += food.carbs * servingRatio;
    totalFat += food.fat * servingRatio;
  }

  return { foods, totalCalories, totalProtein, totalCarbs, totalFat };
};

export const generateAIMealPlan = (
  userId: string,
  goal: DietGoal,
  targetCalories: number,
  restrictions: string[] = []
): DietPlan => {
  const existingPlan = getUserActivePlan(userId);
  if (existingPlan) {
    existingPlan.isActive = false;
    db.dietPlans.set(existingPlan.id, existingPlan);
  }

  const macroTargets = getMacroTargets(goal, targetCalories);
  const meals: Meal[] = [];

  const mealTimes: Record<string, string> = {
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '19:00',
    snack: '16:00',
  };

  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

  for (const mealType of mealTypes) {
    const mealData = generateMealByType(mealType, targetCalories, goal);
    meals.push({
      id: uuidv4(),
      type: mealType,
      foods: mealData.foods,
      calories: Math.round(mealData.totalCalories),
      protein: Math.round(mealData.totalProtein),
      carbs: Math.round(mealData.totalCarbs),
      fat: Math.round(mealData.totalFat),
      fiber: 0,
      time: mealTimes[mealType],
      notes: '',
    });
  }

  const plan: DietPlan = {
    id: uuidv4(),
    userId,
    goal,
    targetCalories,
    macros: macroTargets,
    meals,
    restrictions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  db.dietPlans.set(plan.id, plan);
  return plan;
};

const getMacroTargets = (
  goal: DietGoal,
  targetCalories: number
): { protein: number; carbs: number; fat: number } => {
  const ratios: Record<DietGoal, { protein: number; carbs: number; fat: number }> = {
    weight_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
    weight_gain: { protein: 0.25, carbs: 0.50, fat: 0.25 },
    maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    muscle_building: { protein: 0.40, carbs: 0.40, fat: 0.20 },
    diabetic: { protein: 0.30, carbs: 0.35, fat: 0.35 },
    heart_healthy: { protein: 0.25, carbs: 0.50, fat: 0.25 },
  };

  const ratio = ratios[goal] || ratios.maintenance;
  const proteinCals = targetCalories * ratio.protein;
  const carbsCals = targetCalories * ratio.carbs;
  const fatCals = targetCalories * ratio.fat;

  return {
    protein: Math.round(proteinCals / 4),
    carbs: Math.round(carbsCals / 4),
    fat: Math.round(fatCals / 9),
  };
};

export const getRecommendations = (userId: string): AIRecommendation[] => {
  const plan = getUserActivePlan(userId);
  const recommendations: AIRecommendation[] = [];

  if (!plan) {
    return [{
      type: 'general',
      priority: 'high',
      title: 'Create a Diet Plan',
      description: 'You don\'t have an active diet plan. Start one to track your nutrition effectively.',
      action: 'Create a personalized diet plan based on your goals',
      potentialImpact: 'Improved health outcomes and goal achievement',
    }];
  }

  const totalPlanCalories = plan.meals.reduce((sum, m) => sum + m.calories, 0);
  const avgCaloriesPerMeal = plan.meals.length > 0 ? totalPlanCalories / plan.meals.length : 0;

  recommendations.push({
    type: 'timing',
    priority: 'medium',
    title: 'Meal Timing Optimization',
    description: 'Consistent meal timing helps regulate metabolism and improves nutrient absorption.',
    action: 'Try to eat meals at consistent times each day (8AM, 1PM, 7PM)',
    potentialImpact: 'Better metabolic efficiency and energy levels',
  });

  if (plan.goal === 'muscle_building') {
    recommendations.push({
      type: 'meal',
      priority: 'high',
      title: 'Increase Protein Intake',
      description: 'For muscle building, aim for 1.6-2.2g of protein per kg of body weight.',
      action: 'Add protein-rich foods to each meal or consider a protein supplement',
      potentialImpact: 'Enhanced muscle protein synthesis and recovery',
    });
  }

  if (plan.goal === 'diabetic') {
    recommendations.push({
      type: 'substitution',
      priority: 'high',
      title: 'Low GI Foods',
      description: 'Choose foods with low glycemic index to maintain stable blood sugar levels.',
      action: 'Replace white rice with brown rice, choose whole grains over refined carbs',
      potentialImpact: 'Stable blood glucose levels and reduced insulin spikes',
    });
  }

  recommendations.push({
    type: 'general',
    priority: 'low',
    title: 'Stay Hydrated',
    description: 'Drink at least 8 glasses of water daily for optimal body function.',
    action: 'Track your water intake and aim for 2-3 liters per day',
    potentialImpact: 'Improved digestion, skin health, and cognitive function',
  });

  return recommendations;
};

export const getMealSuggestions = (
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetCalories: number,
  goal: DietGoal,
  count: number = 5
): MealSuggestion[] => {
  const suggestions: MealSuggestion[] = [];

  for (let i = 0; i < count; i++) {
    const mealData = generateMealByType(mealType, targetCalories, goal);
    const allFoods = Array.from(db.foodItems.values());
    const availableFoods = allFoods
      .filter(f => f.calories <= targetCalories * 0.4)
      .slice(0, count)
      .map(f => ({ ...f }));

    suggestions.push({
      mealType,
      time: mealType === 'breakfast' ? '08:00' : mealType === 'lunch' ? '13:00' : mealType === 'dinner' ? '19:00' : '16:00',
      suggestedFoods: availableFoods,
      totalCalories: Math.round(mealData.totalCalories),
      totalProtein: Math.round(mealData.totalProtein),
      totalCarbs: Math.round(mealData.totalCarbs),
      totalFat: Math.round(mealData.totalFat),
      reason: `Perfect for ${goal.replace('_', ' ')} with balanced macros`,
    });
  }

  return suggestions;
};
