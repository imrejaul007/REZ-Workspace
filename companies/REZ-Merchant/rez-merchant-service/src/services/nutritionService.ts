import mongoose, { Types } from 'mongoose';
import { NutritionPlan, MemberNutrition, MealLog, INutritionPlan } from '../models/NutritionPlan';

/**
 * Input types for nutrition operations
 */
export interface NutritionInput {
  storeId: string;
  name: string;
  description?: string;
  type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  meals?: {
    name: string;
    time?: string;
    calories: number;
    items: { name: string; portion: string; calories: number }[];
  }[];
  duration: number;
  createdBy: string;
}

export interface MealInput {
  name: string;
  calories: number;
  date: Date;
}

/**
 * NutritionService - Handles all nutrition plan operations for fitness/gym members.
 * Manages plan creation, member assignment, meal logging, and tracking.
 */
export class NutritionService {
  /**
   * Create a new nutrition plan for a store.
   */
  async createPlan(data: NutritionInput): Promise<INutritionPlan> {
    const plan = await NutritionPlan.create({
      storeId: new Types.ObjectId(data.storeId),
      name: data.name,
      description: data.description || '',
      type: data.type,
      dailyCalories: data.dailyCalories,
      proteinGrams: data.proteinGrams,
      carbsGrams: data.carbsGrams,
      fatGrams: data.fatGrams,
      meals: data.meals || [],
      duration: data.duration,
      createdBy: new Types.ObjectId(data.createdBy),
      isActive: true,
    });

    return plan;
  }

  /**
   * Get all nutrition plans for a store.
   */
  async getPlans(storeId: string): Promise<INutritionPlan[]> {
    return NutritionPlan.find({
      storeId: new Types.ObjectId(storeId),
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get a specific plan by ID.
   */
  async getPlanById(planId: string): Promise<INutritionPlan | null> {
    return NutritionPlan.findById(planId).lean();
  }

  /**
   * Assign a nutrition plan to a member.
   * Deactivates unknown existing assignment for this member.
   */
  async assignToMember(planId: string, memberId: string, assignedBy: string): Promise<void> {
    const storeId = await this.getStoreIdFromPlan(planId);

    // Deactivate existing assignments for this member
    await MemberNutrition.updateMany(
      { memberId: new Types.ObjectId(memberId), isActive: true },
      { $set: { isActive: false } },
    );

    // Create new assignment
    await MemberNutrition.create({
      memberId: new Types.ObjectId(memberId),
      storeId,
      planId: new Types.ObjectId(planId),
      assignedBy: new Types.ObjectId(assignedBy),
      isActive: true,
    });
  }

  /**
   * Get the active nutrition plan for a member.
   */
  async getMemberPlan(memberId: string): Promise<INutritionPlan | null> {
    const assignment = await MemberNutrition.findOne({
      memberId: new Types.ObjectId(memberId),
      isActive: true,
    }).lean();

    if (!assignment) {
      return null;
    }

    return NutritionPlan.findById(assignment.planId).lean();
  }

  /**
   * Log a meal for a member.
   */
  async logMeal(
    memberId: string,
    meal: MealInput,
    storeId: string,
  ): Promise<void> {
    // Try to get the member's active plan
    const assignment = await MemberNutrition.findOne({
      memberId: new Types.ObjectId(memberId),
      isActive: true,
    }).lean();

    await MealLog.create({
      memberId: new Types.ObjectId(memberId),
      storeId: new Types.ObjectId(storeId),
      planId: assignment?.planId,
      name: meal.name,
      calories: meal.calories,
      date: meal.date,
    });
  }

  /**
   * Get meal logs for a member on a specific date.
   */
  async getMealLogs(memberId: string, date: Date): Promise<unknown[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return MealLog.find({
      memberId: new Types.ObjectId(memberId),
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ loggedAt: -1 })
      .lean();
  }

  /**
   * Get daily calorie summary for a member.
   */
  async getDailySummary(memberId: string, date: Date): Promise<{
    totalCalories: number;
    mealCount: number;
    planCalories: number;
    adherence: number;
  }> {
    const logs = await this.getMealLogs(memberId, date);
    const plan = await this.getMemberPlan(memberId);

    const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
    const planCalories = plan?.dailyCalories || 0;
    const adherence = planCalories > 0
      ? Math.round((totalCalories / planCalories) * 100)
      : 0;

    return {
      totalCalories,
      mealCount: logs.length,
      planCalories,
      adherence,
    };
  }

  /**
   * Update an existing nutrition plan.
   */
  async updatePlan(planId: string, updates: Partial<NutritionInput>): Promise<INutritionPlan | null> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.dailyCalories !== undefined) updateData.dailyCalories = updates.dailyCalories;
    if (updates.proteinGrams !== undefined) updateData.proteinGrams = updates.proteinGrams;
    if (updates.carbsGrams !== undefined) updateData.carbsGrams = updates.carbsGrams;
    if (updates.fatGrams !== undefined) updateData.fatGrams = updates.fatGrams;
    if (updates.meals !== undefined) updateData.meals = updates.meals;
    if (updates.duration !== undefined) updateData.duration = updates.duration;

    return NutritionPlan.findByIdAndUpdate(
      planId,
      { $set: updateData },
      { new: true },
    ).lean();
  }

  /**
   * Deactivate a nutrition plan (soft delete).
   */
  async deactivatePlan(planId: string): Promise<void> {
    await NutritionPlan.findByIdAndUpdate(planId, { $set: { isActive: false } });

    // Deactivate all member assignments for this plan
    await MemberNutrition.updateMany(
      { planId: new Types.ObjectId(planId), isActive: true },
      { $set: { isActive: false } },
    );
  }

  /**
   * Helper: Get store ID from a plan ID.
   */
  private async getStoreIdFromPlan(planId: string): Promise<Types.ObjectId> {
    const plan = await NutritionPlan.findById(planId).select('storeId').lean();
    if (!plan) {
      throw new Error(`Nutrition plan not found: ${planId}`);
    }
    return plan.storeId as Types.ObjectId;
  }
}

export const nutritionService = new NutritionService();
