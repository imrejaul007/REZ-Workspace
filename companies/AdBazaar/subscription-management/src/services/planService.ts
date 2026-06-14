import { Plan } from '../models/index.js';
import { IPlan, PlanType, BillingCycle, PlanSchema, ApiResponse } from '../types/index.js';
import logger from 'utils/logger.js';

export class PlanService {
  /**
   * Create a new plan
   */
  async createPlan(data: z.infer<typeof PlanSchema>): Promise<ApiResponse<IPlan>> {
    try {
      logger.info('Creating plan', { name: data.name, type: data.type });

      const plan = new Plan({
        ...data,
        billingCycles: data.billingCycles || [BillingCycle.MONTHLY]
      });

      await plan.save();

      logger.info('Plan created successfully', { planId: plan._id });
      return { success: true, data: plan.toObject() };
    } catch (error: any) {
      if (error.code === 11000) {
        return { success: false, error: 'Plan with this name already exists' };
      }
      logger.error('Failed to create plan', { error, data });
      return { success: false, error: 'Failed to create plan' };
    }
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string): Promise<IPlan | null> {
    try {
      const plan = await Plan.findById(id).lean();
      return plan as IPlan | null;
    } catch (error) {
      logger.error('Failed to get plan', { error, id });
      return null;
    }
  }

  /**
   * Get plan by type
   */
  async getPlanByType(type: PlanType): Promise<IPlan | null> {
    try {
      const plan = await Plan.findOne({ type, isActive: true }).lean();
      return plan as IPlan | null;
    } catch (error) {
      logger.error('Failed to get plan by type', { error, type });
      return null;
    }
  }

  /**
   * List all active plans
   */
  async listPlans(filters?: {
    type?: PlanType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ plans: IPlan[]; total: number }>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filters?.type) query.type = filters.type;
      if (filters?.isActive !== undefined) query.isActive = filters.isActive;

      const [plans, total] = await Promise.all([
        Plan.find(query).sort({ price: 1 }).skip(skip).limit(limit).lean(),
        Plan.countDocuments(query)
      ]);

      return {
        success: true,
        data: { plans: plans as IPlan[], total }
      };
    } catch (error) {
      logger.error('Failed to list plans', { error, filters });
      return { success: false, error: 'Failed to list plans' };
    }
  }

  /**
   * Update plan
   */
  async updatePlan(
    id: string,
    data: Partial<IPlan>
  ): Promise<ApiResponse<IPlan>> {
    try {
      const plan = await Plan.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      logger.info('Plan updated', { planId: id });
      return { success: true, data: plan as IPlan };
    } catch (error: any) {
      if (error.code === 11000) {
        return { success: false, error: 'Plan with this name already exists' };
      }
      logger.error('Failed to update plan', { error, id, data });
      return { success: false, error: 'Failed to update plan' };
    }
  }

  /**
   * Deactivate plan
   */
  async deactivatePlan(id: string): Promise<ApiResponse<IPlan>> {
    try {
      const plan = await Plan.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).lean();

      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      logger.info('Plan deactivated', { planId: id });
      return { success: true, data: plan as IPlan };
    } catch (error) {
      logger.error('Failed to deactivate plan', { error, id });
      return { success: false, error: 'Failed to deactivate plan' };
    }
  }

  /**
   * Get plan pricing for different billing cycles
   */
  async getPlanPricing(planId: string): Promise<ApiResponse<{
    planId: string;
    pricing: {
      monthly: number;
      quarterly: number;
      yearly: number;
      quarterlyDiscount: number;
      yearlyDiscount: number;
    };
  }>> {
    try {
      const plan = await Plan.findById(planId).lean();
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const basePrice = plan.price;
      return {
        success: true,
        data: {
          planId: plan._id.toString(),
          pricing: {
            monthly: basePrice,
            quarterly: Math.round(basePrice * 3 * 0.95 * 100) / 100,
            yearly: Math.round(basePrice * 12 * 0.80 * 100) / 100,
            quarterlyDiscount: 5,
            yearlyDiscount: 20
          }
        }
      };
    } catch (error) {
      logger.error('Failed to get plan pricing', { error, planId });
      return { success: false, error: 'Failed to get pricing' };
    }
  }

  /**
   * Initialize default plans
   */
  async initializeDefaultPlans(): Promise<void> {
    try {
      const count = await Plan.countDocuments();
      if (count === 0) {
        await Plan.getDefaultPlans();
        logger.info('Default plans initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize default plans', { error });
    }
  }

  /**
   * Compare plans
   */
  async comparePlans(planIds: string[]): Promise<ApiResponse<{
    plans: IPlan[];
    comparison: {
      planId: string;
      price: number;
      limits: IPlan['limits'];
      features: string[];
    }[];
  }>> {
    try {
      const plans = await Plan.find({ _id: { $in: planIds }, isActive: true }).lean();

      if (plans.length !== planIds.length) {
        return { success: false, error: 'One or more plans not found' };
      }

      const comparison = plans.map((plan) => ({
        planId: plan._id.toString(),
        price: plan.price,
        limits: plan.limits,
        features: plan.features
      }));

      return {
        success: true,
        data: {
          plans: plans as IPlan[],
          comparison
        }
      };
    } catch (error) {
      logger.error('Failed to compare plans', { error, planIds });
      return { success: false, error: 'Failed to compare plans' };
    }
  }
}

import { z } from 'zod';

export const planService = new PlanService();