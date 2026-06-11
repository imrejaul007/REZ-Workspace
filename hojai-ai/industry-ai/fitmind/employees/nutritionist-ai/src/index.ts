/**
 * Nutritionist AI - Diet Plans & Macros Agent
 * Part of FITMIND - Fitness AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  prepTime?: number;
  isJain?: boolean;
  isVegetarian?: boolean;
}

export interface Meal {
  name: string;
  time: string;
  items: MealItem[];
  totalCalories: number;
  totalMacros: Macros;
  tips?: string[];
}

export interface NutritionPlan {
  id: string;
  memberId: string;
  memberName: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'toning';
  calorieTarget: number;
  macros: Macros;
  meals: Meal[];
  dietaryRestrictions: string[];
  preferences: string[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'paused';
}

export interface NutritionRequest {
  memberId: string;
  memberName: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'toning';
  dietaryRestrictions: string[];
  preferences: string[];
  allergies?: string[];
  calorieTarget?: number;
}

export interface BodyMetrics {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  bodyFat?: number;
}

export class NutritionistAI {
  private foodDatabase: Map<string, MealItem> = new Map();
  private nutritionPlans: Map<string, NutritionPlan> = new Map();

  constructor() {
    this.initializeFoodDatabase();
  }

  private initializeFoodDatabase(): void {
    const foods: MealItem[] = [
      // Proteins
      { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: '100g' },
      { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, portion: '100g' },
      { name: 'Egg Whites', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, portion: '100g' },
      { name: 'Whole Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, portion: '2 large' },
      { name: 'Paneer', calories: 265, protein: 18, carbs: 3.6, fat: 20, portion: '100g' },
      { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, portion: '170g' },
      { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, portion: '100g' },
      { name: 'Soya Chunks', calories: 345, protein: 52, carbs: 33, fat: 1.4, portion: '100g' },
      { name: 'Prawns', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, portion: '100g' },
      // Carbs
      { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, portion: '100g cooked' },
      { name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, portion: '100g cooked' },
      { name: 'Whole Wheat Roti', calories: 120, protein: 4, carbs: 20, fat: 3, portion: '1 medium' },
      { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, portion: '100g' },
      { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, portion: '100g cooked' },
      { name: 'Upma', calories: 180, protein: 5, carbs: 25, fat: 7, portion: '1 cup' },
      { name: 'Idli', calories: 58, protein: 2, carbs: 12, fat: 0.4, portion: '1 piece' },
      // Vegetables
      { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, portion: '100g' },
      { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, portion: '100g' },
      { name: 'Mixed Salad', calories: 20, protein: 1, carbs: 4, fat: 0.2, portion: '100g' },
      { name: 'Capsicum', calories: 31, protein: 1, carbs: 6, fat: 0.3, portion: '100g' },
      { name: 'Paneer Bhurji', calories: 280, protein: 16, carbs: 8, fat: 20, portion: '100g' },
      // Fats
      { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, portion: '28g' },
      { name: 'Walnuts', calories: 185, protein: 4.3, carbs: 3.9, fat: 18, portion: '28g' },
      { name: 'Peanut Butter', calories: 188, protein: 8, carbs: 6, fat: 16, portion: '2 tbsp' },
      { name: 'Coconut Oil', calories: 120, protein: 0, carbs: 0, fat: 13.5, portion: '1 tbsp' },
      // Fruits
      { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: '1 medium' },
      { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: '1 medium' },
      { name: 'Berries Mix', calories: 70, protein: 1, carbs: 17, fat: 0.5, portion: '100g' },
      { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, portion: '100g' },
      // Beverages
      { name: 'Protein Shake', calories: 120, protein: 24, carbs: 3, fat: 1, portion: '1 scoop' },
      { name: 'Green Tea', calories: 2, protein: 0, carbs: 0, fat: 0, portion: '1 cup' },
      { name: 'Buttermilk', calories: 40, protein: 2, carbs: 5, fat: 1, portion: '1 glass' },
      // Vegetarian Indian Meals
      { name: 'Dal Tadka', calories: 220, protein: 12, carbs: 30, fat: 6, portion: '1 cup' },
      { name: 'Vegetable Sabzi', calories: 150, protein: 4, carbs: 15, fat: 8, portion: '1 cup' },
      { name: 'Khichdi', calories: 250, protein: 10, carbs: 40, fat: 5, portion: '1 cup' },
      { name: 'Rajma', calories: 230, protein: 12, carbs: 30, fat: 6, portion: '1 cup' },
      { name: 'Chole', calories: 260, protein: 10, carbs: 35, fat: 8, portion: '1 cup' },
      // Supplements
      { name: 'Whey Protein', calories: 120, protein: 24, carbs: 3, fat: 1, portion: '1 scoop' },
      { name: 'BCAA', calories: 10, protein: 5, carbs: 0, fat: 0, portion: '1 serving' },
    ];

    foods.forEach(food => {
      this.foodDatabase.set(food.name.toLowerCase().replace(/\s+/g, '-'), food);
    });
  }

  /**
   * Calculate daily calorie and macro needs
   */
  async calculateMacros(metrics: BodyMetrics, goal: string): Promise<{
    bmr: number;
    tdee: number;
    calorieTarget: number;
    macros: Macros;
  }> {
    const { height, weight, age, gender, activityLevel } = metrics;

    // Mifflin-St Jeor Equation for BMR
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    // Goal adjustments
    const goalAdjustments: Record<string, number> = {
      'weight-loss': -500,
      'muscle-gain': 300,
      'maintenance': 0,
      'toning': -250
    };

    const calorieTarget = Math.round(tdee + (goalAdjustments[goal] || 0));

    // Macro split based on goal
    const macroSplits: Record<string, { protein: number; carbs: number; fat: number }> = {
      'weight-loss': { protein: 0.35, carbs: 0.35, fat: 0.30 },
      'muscle-gain': { protein: 0.30, carbs: 0.45, fat: 0.25 },
      'maintenance': { protein: 0.30, carbs: 0.40, fat: 0.30 },
      'toning': { protein: 0.35, carbs: 0.40, fat: 0.25 }
    };

    const split = macroSplits[goal] || macroSplits.maintenance;

    const macros: Macros = {
      protein: Math.round((calorieTarget * split.protein) / 4),
      carbs: Math.round((calorieTarget * split.carbs) / 4),
      fat: Math.round((calorieTarget * split.fat) / 9),
      fiber: Math.round(weight * 0.3) // 0.3g per kg body weight
    };

    return { bmr: Math.round(bmr), tdee: Math.round(tdee), calorieTarget, macros };
  }

  /**
   * Create a personalized nutrition plan
   */
  async createNutritionPlan(request: NutritionRequest): Promise<NutritionPlan> {
    const { memberId, memberName, goal, dietaryRestrictions, preferences, allergies, calorieTarget } = request;

    let targetCalories = calorieTarget;
    if (!targetCalories) {
      targetCalories = this.getDefaultCalories(goal);
    }

    const macros = this.calculateMacroTargets(targetCalories, goal);
    const meals = this.generateMeals(targetCalories, goal, dietaryRestrictions, preferences);

    const plan: NutritionPlan = {
      id: uuidv4(),
      memberId,
      memberName,
      goal,
      calorieTarget: targetCalories,
      macros,
      meals,
      dietaryRestrictions,
      preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    this.nutritionPlans.set(plan.id, plan);
    return plan;
  }

  private getDefaultCalories(goal: string): number {
    const defaults: Record<string, number> = {
      'weight-loss': 1500,
      'muscle-gain': 2500,
      'maintenance': 2000,
      'toning': 1800
    };
    return defaults[goal] || 2000;
  }

  private calculateMacroTargets(calories: number, goal: string): Macros {
    const splits: Record<string, { protein: number; carbs: number; fat: number }> = {
      'weight-loss': { protein: 0.35, carbs: 0.35, fat: 0.30 },
      'muscle-gain': { protein: 0.30, carbs: 0.45, fat: 0.25 },
      'maintenance': { protein: 0.30, carbs: 0.40, fat: 0.30 },
      'toning': { protein: 0.35, carbs: 0.40, fat: 0.25 }
    };

    const split = splits[goal] || splits.maintenance;

    return {
      protein: Math.round((calories * split.protein) / 4),
      carbs: Math.round((calories * split.carbs) / 4),
      fat: Math.round((calories * split.fat) / 9),
      fiber: 25
    };
  }

  private generateMeals(
    calorieTarget: number,
    goal: string,
    restrictions: string[],
    preferences: string[]
  ): Meal[] {
    const isJain = restrictions.includes('jain');
    const isVeg = isJain || restrictions.includes('vegetarian');
    const isVegan = restrictions.includes('vegan');
    const hasAllergy = (allergy: string) => restrictions.includes(allergy);

    const meals: Meal[] = [
      this.createBreakfast(calorieTarget, isVeg, isVegan, isJain),
      this.createMidMorningSnack(calorieTarget, isVeg, hasAllergy('dairy')),
      this.createLunch(calorieTarget, isVeg, isJain),
      this.createAfternoonSnack(calorieTarget, isVeg),
      this.createDinner(calorieTarget, isVeg, isJain)
    ];

    return meals;
  }

  private createBreakfast(
    calorieBudget: number,
    isVeg: boolean,
    isVegan: boolean,
    isJain: boolean
  ): Meal {
    const calories = Math.round(calorieBudget * 0.25);

    let items: MealItem[];
    let mealName = 'Breakfast';
    let time = '7:00 AM';

    if (isJain) {
      items = [
        { name: 'Sabudana Khichdi', calories: 280, protein: 5, carbs: 50, fat: 7, portion: '1 cup', isJain: true },
        { name: 'Mixed Fruit Bowl', calories: 120, protein: 2, carbs: 30, fat: 0.5, portion: '1 bowl', isJain: true }
      ];
    } else if (isVegan) {
      items = [
        { name: 'Oatmeal with Almond Milk', calories: 220, protein: 8, carbs: 40, fat: 5, portion: '1 bowl' },
        { name: 'Berries Mix', calories: 80, protein: 1, carbs: 20, fat: 0.5, portion: '100g' }
      ];
    } else if (isVeg) {
      items = [
        { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, portion: '1 bowl' },
        { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, portion: '170g', isVegetarian: true },
        { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: '1 medium' }
      ];
    } else {
      items = [
        { name: 'Whole Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, portion: '2 large' },
        { name: 'Brown Rice', calories: 165, protein: 4, carbs: 35, fat: 1.5, portion: '1 cup cooked' },
        { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: '1 medium' }
      ];
    }

    const totalMacros = this.sumMacros(items);

    return {
      name: mealName,
      time,
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalMacros,
      tips: ['Eat within 30 minutes of waking', 'Stay hydrated with warm water and lemon']
    };
  }

  private createMidMorningSnack(
    calorieBudget: number,
    isVeg: boolean,
    hasDairyAllergy: boolean
  ): Meal {
    const calories = Math.round(calorieBudget * 0.1);

    const items: MealItem[] = hasDairyAllergy
      ? [
          { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, portion: '28g' },
          { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: '1 medium' }
        ]
      : [
          { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, portion: '170g', isVegetarian: true },
          { name: 'Almonds', calories: 82, protein: 3, carbs: 3, fat: 7, portion: '14g' }
        ];

    return {
      name: 'Mid-Morning Snack',
      time: '10:30 AM',
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalMacros: this.sumMacros(items),
      tips: ['Keep protein intake steady', 'Stay hydrated']
    };
  }

  private createLunch(calorieBudget: number, isVeg: boolean, isJain: boolean): Meal {
    const calories = Math.round(calorieBudget * 0.35);

    let items: MealItem[];

    if (isJain) {
      items = [
        { name: 'Paneer Bhurji', calories: 280, protein: 16, carbs: 8, fat: 20, portion: '100g', isJain: true },
        { name: 'Whole Wheat Roti', calories: 180, protein: 6, carbs: 30, fat: 4.5, portion: '2 medium', isJain: true },
        { name: 'Cucumber Salad', calories: 15, protein: 0.5, carbs: 3, fat: 0.1, portion: '1 cup', isJain: true }
      ];
    } else if (isVeg) {
      items = [
        { name: 'Dal Tadka', calories: 220, protein: 12, carbs: 30, fat: 6, portion: '1 cup', isVegetarian: true },
        { name: 'Brown Rice', calories: 220, protein: 5, carbs: 46, fat: 1.8, portion: '1 cup cooked' },
        { name: 'Vegetable Sabzi', calories: 150, protein: 4, carbs: 15, fat: 8, portion: '1 cup' },
        { name: 'Buttermilk', calories: 40, protein: 2, carbs: 5, fat: 1, portion: '1 glass', isVegetarian: true }
      ];
    } else {
      items = [
        { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: '100g' },
        { name: 'Brown Rice', calories: 220, protein: 5, carbs: 46, fat: 1.8, portion: '1 cup cooked' },
        { name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0.6, portion: '100g' },
        { name: 'Salad', calories: 30, protein: 1, carbs: 6, fat: 0.3, portion: '1 bowl' }
      ];
    }

    return {
      name: 'Lunch',
      time: '1:00 PM',
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalMacros: this.sumMacros(items),
      tips: ['Include protein with every meal', 'Eat slowly and mindfully']
    };
  }

  private createAfternoonSnack(calorieBudget: number, isVeg: boolean): Meal {
    const calories = Math.round(calorieBudget * 0.1);

    const items: MealItem[] = isVeg
      ? [
          { name: 'Protein Shake', calories: 120, protein: 24, carbs: 3, fat: 1, portion: '1 scoop', isVegetarian: true },
          { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: '1 medium' }
        ]
      : [
          { name: 'Protein Shake', calories: 120, protein: 24, carbs: 3, fat: 1, portion: '1 scoop' },
          { name: 'Walnuts', calories: 93, protein: 2, carbs: 2, fat: 9, portion: '14g' }
        ];

    return {
      name: 'Post-Workout Snack',
      time: '4:30 PM',
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalMacros: this.sumMacros(items),
      tips: ['Consume within 30-60 min post workout', 'Quick absorbing protein ideal']
    };
  }

  private createDinner(calorieBudget: number, isVeg: boolean, isJain: boolean): Meal {
    const calories = Math.round(calorieBudget * 0.20);

    let items: MealItem[];

    if (isJain) {
      items = [
        { name: 'Khichdi', calories: 250, protein: 10, carbs: 40, fat: 5, portion: '1 cup', isJain: true },
        { name: 'Coconut Oil', calories: 60, protein: 0, carbs: 0, fat: 6.8, portion: '1 tsp', isJain: true }
      ];
    } else if (isVeg) {
      items = [
        { name: 'Grilled Paneer', calories: 265, protein: 18, carbs: 3.6, fat: 20, portion: '100g', isVegetarian: true },
        { name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0.6, portion: '100g' },
        { name: 'Sweet Potato', calories: 100, protein: 2, carbs: 23, fat: 0.1, portion: '1 medium' }
      ];
    } else {
      items = [
        { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, portion: '100g' },
        { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, portion: '100g' },
        { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, portion: '100g cooked' }
      ];
    }

    return {
      name: 'Dinner',
      time: '8:00 PM',
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalMacros: this.sumMacros(items),
      tips: ['Eat at least 2-3 hours before sleep', 'Light dinner recommended for weight loss']
    };
  }

  private sumMacros(items: MealItem[]): Macros {
    return items.reduce(
      (sum, item) => ({
        protein: sum.protein + item.protein,
        carbs: sum.carbs + item.carbs,
        fat: sum.fat + item.fat,
        fiber: 0
      }),
      { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }

  /**
   * Get meal suggestions for a specific calorie range
   */
  async getMealSuggestions(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    calorieRange: { min: number; max: number },
    restrictions: string[]
  ): Promise<MealItem[]> {
    const suggestions: MealItem[] = [];
    const calories = (calorieRange.min + calorieRange.max) / 2;

    this.foodDatabase.forEach(food => {
      if (food.calories >= calorieRange.min && food.calories <= calorieRange.max) {
        if (restrictions.includes('vegetarian') && !food.isVegetarian && !food.name.includes('Paneer') && !food.name.includes('Yogurt')) {
          return;
        }
        if (restrictions.includes('jain') && !food.isJain) {
          return;
        }
        suggestions.push(food);
      }
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Track daily intake
   */
  async trackIntake(
    memberId: string,
    foodItems: { name: string; portion: string }[]
  ): Promise<{
    totalCalories: number;
    totalMacros: Macros;
    remainingCalories: number;
    remainingMacros: Macros;
    status: 'on-track' | 'over' | 'under';
  }> {
    const plan = Array.from(this.nutritionPlans.values()).find(p => p.memberId === memberId && p.status === 'active');

    const targetCalories = plan?.calorieTarget || 2000;
    const targetMacros = plan?.macros || { protein: 150, carbs: 200, fat: 65, fiber: 25 };

    let totalCalories = 0;
    const totalMacros: Macros = { protein: 0, carbs: 0, fat: 0, fiber: 0 };

    foodItems.forEach(item => {
      const food = this.foodDatabase.get(item.name.toLowerCase().replace(/\s+/g, '-'));
      if (food) {
        totalCalories += food.calories;
        totalMacros.protein += food.protein;
        totalMacros.carbs += food.carbs;
        totalMacros.fat += food.fat;
      }
    });

    const remainingCalories = targetCalories - totalCalories;
    const remainingMacros = {
      protein: targetMacros.protein - totalMacros.protein,
      carbs: targetMacros.carbs - totalMacros.carbs,
      fat: targetMacros.fat - totalMacros.fat,
      fiber: targetMacros.fiber - totalMacros.fiber
    };

    let status: 'on-track' | 'over' | 'under' = 'on-track';
    if (remainingCalories < -200) status = 'over';
    else if (remainingCalories > 300) status = 'under';

    return {
      totalCalories,
      totalMacros,
      remainingCalories,
      remainingMacros,
      status
    };
  }

  /**
   * Generate hydration reminder
   */
  async getHydrationReminder(bodyWeight: number): Promise<{
    dailyWaterGoal: number;
    intervals: { time: string; amount: number; message: string }[];
  }> {
    const dailyWaterGoal = Math.round(bodyWeight * 35); // ml per kg

    return {
      dailyWaterGoal,
      intervals: [
        { time: '7:00 AM', amount: Math.round(dailyWaterGoal * 0.2), message: 'Start your day with warm water and lemon' },
        { time: '9:00 AM', amount: Math.round(dailyWaterGoal * 0.15), message: 'Mid-morning hydration boost' },
        { time: '11:00 AM', amount: Math.round(dailyWaterGoal * 0.15), message: 'Before your workout if training' },
        { time: '1:00 PM', amount: Math.round(dailyWaterGoal * 0.15), message: 'With lunch to aid digestion' },
        { time: '3:00 PM', amount: Math.round(dailyWaterGoal * 0.1), message: 'Afternoon pick-me-up' },
        { time: '6:00 PM', amount: Math.round(dailyWaterGoal * 0.1), message: 'Pre/post workout hydration' },
        { time: '8:00 PM', amount: Math.round(dailyWaterGoal * 0.15), message: 'Evening hydration' }
      ]
    };
  }
}

export default NutritionistAI;
