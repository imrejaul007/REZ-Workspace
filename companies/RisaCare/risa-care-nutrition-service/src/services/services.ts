import { v4 as uuidv4 } from 'uuid';
import { db, Meal, MealLog, NutritionSummary, FoodItem, Recipe, DietPlan, DietGoal, WeeklyTrends, DailyNutritionData, MacroBreakdown, GoalProgress, MealSuggestion, AIRecommendation } from '../models/nutrition';

// ==================== MEAL LOG SERVICE ====================

const getDateKey = (userId: string, date: string): string => `${userId}:${date}`;

export const logMeal = (userId: string, date: string, meal: Omit<Meal, 'id'>): MealLog => {
  const dateKey = getDateKey(userId, date);
  let mealLog = db.mealLogs.get(dateKey);
  const newMeal: Meal = { ...meal, id: uuidv4() };
  if (!mealLog) {
    mealLog = { id: uuidv4(), userId, date, meals: [newMeal], totalNutrition: { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber }, hydration: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } else {
    mealLog.meals.push(newMeal);
    mealLog.totalNutrition = { calories: mealLog.totalNutrition.calories + meal.calories, protein: mealLog.totalNutrition.protein + meal.protein, carbs: mealLog.totalNutrition.carbs + meal.carbs, fat: mealLog.totalNutrition.fat + meal.fat, fiber: mealLog.totalNutrition.fiber + meal.fiber };
    mealLog.updatedAt = new Date().toISOString();
  }
  db.mealLogs.set(dateKey, mealLog);
  return mealLog;
};

export const getDailyLog = (userId: string, date: string): MealLog | null => db.mealLogs.get(getDateKey(userId, date)) || null;

export const getWeeklyLog = (userId: string, startDate: string): MealLog[] => {
  const logs: MealLog[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const log = getDailyLog(userId, d.toISOString().split('T')[0]); if (log) logs.push(log); }
  return logs;
};

export const getNutritionSummary = (userId: string, date: string, goals?: { calories: number; protein: number; carbs: number; fat: number }): NutritionSummary | null => {
  const mealLog = getDailyLog(userId, date);
  if (!mealLog) return null;
  const g = goals || { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  return { date, totalCalories: mealLog.totalNutrition.calories, totalProtein: mealLog.totalNutrition.protein, totalCarbs: mealLog.totalNutrition.carbs, totalFat: mealLog.totalNutrition.fat, totalFiber: mealLog.totalNutrition.fiber, mealsLogged: mealLog.meals.length, hydration: mealLog.hydration, calorieGoal: g.calories, proteinGoal: g.protein, carbsGoal: g.carbs, fatGoal: g.fat, caloriesRemaining: g.calories - mealLog.totalNutrition.calories, proteinRemaining: g.protein - mealLog.totalNutrition.protein, carbsRemaining: g.carbs - mealLog.totalNutrition.carbs, fatRemaining: g.fat - mealLog.totalNutrition.fat };
};

export const getMealHistory = (userId: string, days: number = 30): MealLog[] => {
  const logs: MealLog[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) { const d = new Date(today); d.setDate(today.getDate() - i); const log = getDailyLog(userId, d.toISOString().split('T')[0]); if (log) logs.push(log); }
  return logs;
};

export const getCaloriesByTime = (userId: string, date: string): { time: string; calories: number }[] => {
  const mealLog = getDailyLog(userId, date);
  return mealLog ? mealLog.meals.map(m => ({ time: m.time, calories: m.calories })) : [];
};

// ==================== FOOD DATABASE SERVICE ====================

export const searchFoods = (query: string, limit: number = 20): FoodItem[] => {
  const q = query.toLowerCase();
  return Array.from(db.foodItems.values()).filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)).slice(0, limit);
};

export const getFoodDetails = (foodId: string): FoodItem | null => db.foodItems.get(foodId) || null;

export const addCustomFood = (food: Omit<FoodItem, 'id' | 'isCustom'>): FoodItem => {
  const newFood: FoodItem = { ...food, id: `custom-${uuidv4()}`, isCustom: true };
  db.foodItems.set(newFood.id, newFood);
  return newFood;
};

export const getNutritionalInfo = (foodId: string, servingMultiplier: number = 1): FoodItem | null => {
  const food = db.foodItems.get(foodId);
  if (!food) return null;
  return { ...food, calories: food.calories * servingMultiplier, protein: food.protein * servingMultiplier, carbs: food.carbs * servingMultiplier, fat: food.fat * servingMultiplier, fiber: food.fiber * servingMultiplier };
};

export const calculateMealNutrition = (foods: Array<{ foodId: string; quantity: number }>): { calories: number; protein: number; carbs: number; fat: number; fiber: number } => {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
  for (const item of foods) { const food = db.foodItems.get(item.foodId); if (food) { calories += food.calories * item.quantity; protein += food.protein * item.quantity; carbs += food.carbs * item.quantity; fat += food.fat * item.quantity; fiber += food.fiber * item.quantity; } }
  return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), fiber: Math.round(fiber) };
};

// ==================== CALORIE TRACKING SERVICE ====================

export const trackCalories = (userId: string, date: string, calories: number): MealLog | null => {
  const mealLog = getDailyLog(userId, date);
  if (!mealLog) return null;
  mealLog.totalNutrition.calories += calories;
  db.mealLogs.set(getDateKey(userId, date), mealLog);
  return mealLog;
};

export const getDailyCalories = (userId: string, date: string): number => {
  const mealLog = getDailyLog(userId, date);
  return mealLog ? mealLog.totalNutrition.calories : 0;
};

export const getWeeklyTrends = (userId: string, startDate: string): WeeklyTrends => {
  const dailyData: DailyNutritionData[] = [];
  const start = new Date(startDate);
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalMeals = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const log = getDailyLog(userId, dateStr);
    if (log) {
      dailyData.push({ date: dateStr, calories: log.totalNutrition.calories, protein: log.totalNutrition.protein, carbs: log.totalNutrition.carbs, fat: log.totalNutrition.fat, fiber: log.totalNutrition.fiber, mealsLogged: log.meals.length });
      totalCalories += log.totalNutrition.calories;
      totalProtein += log.totalNutrition.protein;
      totalCarbs += log.totalNutrition.carbs;
      totalFat += log.totalNutrition.fat;
      totalMeals += log.meals.length;
    }
  }
  const daysWithData = dailyData.length || 1;
  return { startDate, endDate: new Date(new Date(startDate).setDate(start.getDate() + 6)).toISOString().split('T')[0], dailyData, averageCalories: Math.round(totalCalories / daysWithData), averageProtein: Math.round(totalProtein / daysWithData), averageCarbs: Math.round(totalCarbs / daysWithData), averageFat: Math.round(totalFat / daysWithData), totalMeals };
};

export const getMacroBreakdown = (userId: string, date: string): MacroBreakdown => {
  const mealLog = getDailyLog(userId, date);
  const protein = mealLog ? mealLog.totalNutrition.protein : 0;
  const carbs = mealLog ? mealLog.totalNutrition.carbs : 0;
  const fat = mealLog ? mealLog.totalNutrition.fat : 0;
  const totalCal = protein * 4 + carbs * 4 + fat * 9 || 1;
  const proteinCals = protein * 4, carbsCals = carbs * 4, fatCals = fat * 9;
  return { protein: { grams: Math.round(protein), percentage: Math.round((proteinCals / totalCal) * 100), calories: Math.round(proteinCals) }, carbs: { grams: Math.round(carbs), percentage: Math.round((carbsCals / totalCal) * 100), calories: Math.round(carbsCals) }, fat: { grams: Math.round(fat), percentage: Math.round((fatCals / totalCal) * 100), calories: Math.round(fatCals) } };
};

export const getGoalProgress = (userId: string, date: string, targets: { calories: number; protein: number; carbs: number; fat: number }): GoalProgress => {
  const mealLog = getDailyLog(userId, date);
  const current = { calories: mealLog?.totalNutrition.calories || 0, protein: mealLog?.totalNutrition.protein || 0, carbs: mealLog?.totalNutrition.carbs || 0, fat: mealLog?.totalNutrition.fat || 0 };
  const calcProgress = (cur: number, tgt: number) => tgt > 0 ? Math.min(Math.round((cur / tgt) * 100), 100) : 0;
  return { currentCalories: current.calories, targetCalories: targets.calories, progress: calcProgress(current.calories, targets.calories), currentProtein: current.protein, targetProtein: targets.protein, proteinProgress: calcProgress(current.protein, targets.protein), currentCarbs: current.carbs, targetCarbs: targets.carbs, carbsProgress: calcProgress(current.carbs, targets.carbs), currentFat: current.fat, targetFat: targets.fat, fatProgress: calcProgress(current.fat, targets.fat), streak: 0, status: current.calories <= targets.calories ? 'on_track' : 'ahead' };
};

// ==================== RECIPE SERVICE ====================

export const searchRecipes = (query: string, goal?: DietGoal): Recipe[] => {
  const q = query.toLowerCase();
  let recipes = Array.from(db.recipes.values());
  if (q) recipes = recipes.filter(r => r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q)));
  if (goal) {
    const goalTags: Record<DietGoal, string[]> = { weight_loss: ['low-carb', 'high-fiber', 'vegetarian'], weight_gain: ['high-protein', 'calorie-dense'], maintenance: ['balanced'], muscle_building: ['high-protein'], diabetic: ['low-gi', 'high-fiber'], heart_healthy: ['heart-healthy', 'low-fat'] };
    recipes = recipes.filter(r => r.tags.some(t => goalTags[goal]?.includes(t.toLowerCase())));
  }
  return recipes;
};

export const getRecipe = (recipeId: string): Recipe | null => db.recipes.get(recipeId) || null;

export const getRecipesByGoal = (goal: DietGoal, limit: number = 10): Recipe[] => {
  const goalTags: Record<DietGoal, string[]> = { weight_loss: ['low-carb', 'high-fiber', 'vegetarian', 'vegan'], weight_gain: ['high-protein', 'calorie-dense'], maintenance: ['balanced', 'healthy'], muscle_building: ['high-protein', 'post-workout'], diabetic: ['low-gi', 'high-fiber', 'vegetarian'], heart_healthy: ['heart-healthy', 'low-fat', 'omega-3'] };
  const tags = goalTags[goal] || [];
  return Array.from(db.recipes.values()).filter(r => r.tags.some(t => tags.includes(t.toLowerCase()))).slice(0, limit);
};

export const getHealthyAlternatives = (recipeId: string): Recipe[] => {
  const recipe = db.recipes.get(recipeId);
  if (!recipe) return [];
  return Array.from(db.recipes.values()).filter(r => r.id !== recipeId && r.nutritionPerServing.calories <= recipe.nutritionPerServing.calories * 1.2 && r.nutritionPerServing.protein >= recipe.nutritionPerServing.protein * 0.8).slice(0, 3);
};

export const calculateRecipeNutrition = (recipeId: string, servings: number = 1): Recipe | null => {
  const recipe = db.recipes.get(recipeId);
  if (!recipe) return null;
  const factor = servings / recipe.servings;
  return { ...recipe, servings, nutritionPerServing: { calories: Math.round(recipe.nutritionPerServing.calories * factor), protein: Math.round(recipe.nutritionPerServing.protein * factor), carbs: Math.round(recipe.nutritionPerServing.carbs * factor), fat: Math.round(recipe.nutritionPerServing.fat * factor), fiber: Math.round(recipe.nutritionPerServing.fiber * factor) } };
};

// ==================== DIET PLAN SERVICE ====================

export const createDietPlan = (userId: string, goal: DietGoal, targetCalories: number, macros: { protein: number; carbs: number; fat: number }, restrictions: string[] = []): DietPlan => {
  const plan: DietPlan = { id: uuidv4(), userId, goal, targetCalories, macros, meals: [], restrictions, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isActive: true };
  db.dietPlans.set(plan.id, plan);
  return plan;
};

export const getDietPlan = (planId: string): DietPlan | null => db.dietPlans.get(planId) || null;

export const getUserActiveDietPlan = (userId: string): DietPlan | null => {
  for (const plan of db.dietPlans.values()) { if (plan.userId === userId && plan.isActive) return plan; }
  return null;
};

export const updateDietPlan = (planId: string, updates: Partial<Pick<DietPlan, 'meals' | 'restrictions' | 'isActive' | 'targetCalories' | 'macros'>>): DietPlan | null => {
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

const getMacroTargets = (goal: DietGoal, targetCalories: number): { protein: number; carbs: number; fat: number } => {
  const ratios: Record<DietGoal, { protein: number; carbs: number; fat: number }> = { weight_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 }, weight_gain: { protein: 0.25, carbs: 0.50, fat: 0.25 }, maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 }, muscle_building: { protein: 0.40, carbs: 0.40, fat: 0.20 }, diabetic: { protein: 0.30, carbs: 0.35, fat: 0.35 }, heart_healthy: { protein: 0.25, carbs: 0.50, fat: 0.25 } };
  const r = ratios[goal] || ratios.maintenance;
  return { protein: Math.round((targetCalories * r.protein) / 4), carbs: Math.round((targetCalories * r.carbs) / 4), fat: Math.round((targetCalories * r.fat) / 9) };
};

const generateMealByType = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', targetCalories: number, goal: DietGoal): { foods: FoodItem[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number } => {
  const foods: FoodItem[] = [];
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  const allFoods = Array.from(db.foodItems.values());
  const configs: Record<string, { count: number; calorieRatio: number }> = { breakfast: { count: 3, calorieRatio: 0.25 }, lunch: { count: 4, calorieRatio: 0.35 }, dinner: { count: 4, calorieRatio: 0.30 }, snack: { count: 2, calorieRatio: 0.10 } };
  const config = configs[mealType];
  const targetMealCalories = targetCalories * config.calorieRatio;
  const categories = mealType === 'breakfast' ? ['grains', 'dairy', 'fruits', 'beverages'] : mealType === 'lunch' || mealType === 'dinner' ? ['proteins', 'grains', 'vegetables', 'fats'] : ['fruits', 'dairy', 'fats', 'snacks'];
  for (let i = 0; i < config.count && totalCalories < targetMealCalories * 0.9; i++) {
    const categoryFoods = allFoods.filter(f => categories.includes(f.category));
    if (!categoryFoods.length) continue;
    const food = categoryFoods[Math.floor(Math.random() * categoryFoods.length)];
    const servingRatio = Math.min((targetMealCalories - totalCalories) / food.calories, 2);
    foods.push(food);
    totalCalories += food.calories * servingRatio;
    totalProtein += food.protein * servingRatio;
    totalCarbs += food.carbs * servingRatio;
    totalFat += food.fat * servingRatio;
  }
  return { foods, totalCalories: Math.round(totalCalories), totalProtein: Math.round(totalProtein), totalCarbs: Math.round(totalCarbs), totalFat: Math.round(totalFat) };
};

export const generateAIMealPlan = (userId: string, goal: DietGoal, targetCalories: number, restrictions: string[] = []): DietPlan => {
  const existing = getUserActiveDietPlan(userId);
  if (existing) { existing.isActive = false; db.dietPlans.set(existing.id, existing); }
  const macros = getMacroTargets(goal, targetCalories);
  const mealTimes = { breakfast: '08:00', lunch: '13:00', dinner: '19:00', snack: '16:00' };
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];
  const meals: Meal[] = mealTypes.map(type => {
    const data = generateMealByType(type, targetCalories, goal);
    return { id: uuidv4(), type, foods: data.foods, calories: data.totalCalories, protein: data.totalProtein, carbs: data.totalCarbs, fat: data.totalFat, fiber: 0, time: mealTimes[type], notes: '' };
  });
  const plan: DietPlan = { id: uuidv4(), userId, goal, targetCalories, macros, meals, restrictions, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isActive: true };
  db.dietPlans.set(plan.id, plan);
  return plan;
};

export const getDietRecommendations = (userId: string): AIRecommendation[] => {
  const plan = getUserActiveDietPlan(userId);
  if (!plan) return [{ type: 'general', priority: 'high', title: 'Create a Diet Plan', description: 'You don\'t have an active diet plan.', action: 'Create a personalized diet plan', potentialImpact: 'Improved health outcomes' }];
  const recs: AIRecommendation[] = [{ type: 'timing', priority: 'medium', title: 'Meal Timing Optimization', description: 'Consistent meal timing helps regulate metabolism.', action: 'Eat meals at consistent times (8AM, 1PM, 7PM)', potentialImpact: 'Better metabolic efficiency' }];
  if (plan.goal === 'muscle_building') recs.push({ type: 'meal', priority: 'high', title: 'Increase Protein Intake', description: 'For muscle building, aim for 1.6-2.2g protein per kg body weight.', action: 'Add protein to each meal', potentialImpact: 'Enhanced muscle protein synthesis' });
  if (plan.goal === 'diabetic') recs.push({ type: 'substitution', priority: 'high', title: 'Low GI Foods', description: 'Choose foods with low glycemic index.', action: 'Replace white rice with brown rice, whole grains over refined carbs', potentialImpact: 'Stable blood glucose levels' });
  recs.push({ type: 'general', priority: 'low', title: 'Stay Hydrated', description: 'Drink at least 8 glasses of water daily.', action: 'Track water intake, aim for 2-3 liters per day', potentialImpact: 'Improved digestion and cognitive function' });
  return recs;
};

export const getDietMealSuggestions = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', targetCalories: number, goal: DietGoal, count: number = 5): MealSuggestion[] => {
  const suggestions: MealSuggestion[] = [];
  const mealTimes = { breakfast: '08:00', lunch: '13:00', dinner: '19:00', snack: '16:00' };
  const allFoods = Array.from(db.foodItems.values()).filter(f => f.calories <= targetCalories * 0.4);
  for (let i = 0; i < count; i++) {
    const data = generateMealByType(mealType, targetCalories, goal);
    suggestions.push({ mealType, time: mealTimes[mealType], suggestedFoods: allFoods.slice(0, count), totalCalories: data.totalCalories, totalProtein: data.totalProtein, totalCarbs: data.totalCarbs, totalFat: data.totalFat, reason: `Perfect for ${goal.replace('_', ' ')} with balanced macros` });
  }
  return suggestions;
};
