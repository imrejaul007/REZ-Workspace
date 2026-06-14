import mongoose from 'mongoose';
import {
  BonusPlan,
  BonusPlanDocument,
  BonusEligibility,
  BonusEligibilityDocument,
  CompensationPackage,
} from '../models/index.js';
import { CreateBonusPlanInput, CalculateBonusInput } from '../validators/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export class BonusService {
  async createPlan(data: CreateBonusPlanInput): Promise<BonusPlanDocument> {
    logger.info('Creating bonus plan', { name: data.name, type: data.type });

    const plan = new BonusPlan({
      ...data,
      payoutDate: new Date(data.payoutDate),
      status: 'active',
    });

    await plan.save();

    logger.info('Bonus plan created', { id: plan._id });
    return plan;
  }

  async findAllPlans(
    filters?: { type?: string; status?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ plans: BonusPlanDocument[]; total: number }> {
    const query: Record<string, any> = {};

    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      BonusPlan.find(query).sort({ payoutDate: -1 }).skip(skip).limit(limit),
      BonusPlan.countDocuments(query),
    ]);

    return { plans, total };
  }

  async findPlanById(id: string): Promise<BonusPlanDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Bonus plan not found');
    }

    const plan = await BonusPlan.findById(id);
    if (!plan) {
      throw new NotFoundError('Bonus plan not found');
    }

    return plan;
  }

  async calculateEligibility(data: CalculateBonusInput): Promise<{
    eligible: boolean;
    calculatedAmount: number;
    breakdown: {
      baseSalary: number;
      percentage: number;
      tier?: string;
      reason?: string;
    };
  }> {
    const plan = await this.findPlanById(data.planId);
    const { criteria } = plan;

    // Check eligibility based on criteria
    let eligible = true;
    let percentage = 0;
    let tier: string | undefined;
    let reason: string | undefined;

    if (criteria.eligibilityType === 'performance_based' && criteria.minPerformanceRating) {
      if (!data.performanceRating || data.performanceRating < criteria.minPerformanceRating) {
        eligible = false;
        reason = `Performance rating ${data.performanceRating || 'not provided'} below minimum ${criteria.minPerformanceRating}`;
      }
    }

    if (criteria.minTenureMonths && data.tenureMonths !== undefined) {
      if (data.tenureMonths < criteria.minTenureMonths) {
        eligible = false;
        reason = `Tenure ${data.tenureMonths} months below minimum ${criteria.minTenureMonths} months`;
      }
    }

    if (criteria.eligibilityType === 'tiered' && criteria.tiers) {
      if (!data.performanceRating) {
        eligible = false;
        reason = 'Performance rating required for tiered bonus calculation';
      } else {
        const matchingTier = criteria.tiers.find(
          (t) => data.performanceRating! >= t.minRating && data.performanceRating! <= t.maxRating
        );
        if (matchingTier) {
          percentage = matchingTier.percentage;
          tier = `${matchingTier.minRating}-${matchingTier.maxRating}`;
        } else {
          eligible = false;
          reason = `Performance rating ${data.performanceRating} not in any bonus tier`;
        }
      }
    } else {
      // Default percentage based on plan type
      switch (plan.type) {
        case 'annual':
          percentage = 10;
          break;
        case 'quarterly':
          percentage = 5;
          break;
        case 'performance':
          percentage = data.performanceRating ? data.performanceRating * 5 : 0;
          break;
        case 'signing':
          percentage = 0;
          break;
        case 'retention':
          percentage = 15;
          break;
      }
    }

    const calculatedAmount = eligible ? Math.round((data.baseSalary * percentage) / 100) : 0;

    return {
      eligible,
      calculatedAmount,
      breakdown: {
        baseSalary: data.baseSalary,
        percentage,
        tier,
        reason: eligible ? undefined : reason,
      },
    };
  }

  async getOrCreateEligibility(
    employeeId: string,
    planId: string,
    performanceRating?: number,
    tenureMonths?: number
  ): Promise<BonusEligibilityDocument> {
    // Get employee's current compensation
    const compensation = await CompensationPackage.findOne({ employeeId }).sort({
      effectiveDate: -1,
    });

    if (!compensation) {
      throw new NotFoundError('Employee compensation not found');
    }

    // Check existing eligibility
    let eligibility = await BonusEligibility.findOne({ employeeId, planId });

    if (eligibility) {
      return eligibility;
    }

    // Calculate eligibility
    const calculation = await this.calculateEligibility({
      employeeId,
      planId,
      baseSalary: compensation.salary,
      performanceRating,
      tenureMonths,
    });

    // Create eligibility record
    eligibility = new BonusEligibility({
      employeeId,
      planId,
      calculatedAmount: calculation.calculatedAmount,
      status: calculation.eligible ? 'eligible' : 'not_eligible',
    });

    await eligibility.save();

    logger.info('Bonus eligibility created', {
      id: eligibility._id,
      employeeId,
      planId,
      amount: calculation.calculatedAmount,
    });

    return eligibility;
  }

  async findEligibilityByEmployeeId(employeeId: string): Promise<BonusEligibilityDocument[]> {
    return BonusEligibility.find({ employeeId }).populate('planId').sort({ createdAt: -1 });
  }

  async findEligibilityByPlanId(planId: string): Promise<BonusEligibilityDocument[]> {
    return BonusEligibility.find({ planId }).sort({ calculatedAmount: -1 });
  }

  async markAsPaid(eligibilityId: string, paidBy: string): Promise<BonusEligibilityDocument> {
    const eligibility = await BonusEligibility.findById(eligibilityId);

    if (!eligibility) {
      throw new NotFoundError('Bonus eligibility not found');
    }

    if (eligibility.status === 'paid') {
      throw new ConflictError('Bonus already paid');
    }

    eligibility.status = 'paid';
    eligibility.paidAt = new Date();
    eligibility.paidBy = paidBy;

    await eligibility.save();

    logger.info('Bonus marked as paid', { id: eligibility._id, paidBy });
    return eligibility;
  }

  async getEmployeeBonusSummary(employeeId: string): Promise<{
    totalEligible: number;
    totalPending: number;
    totalPaid: number;
    eligibilities: BonusEligibilityDocument[];
  }> {
    const eligibilities = await this.findEligibilityByEmployeeId(employeeId);

    const summary = eligibilities.reduce(
      (acc, el) => {
        switch (el.status) {
          case 'eligible':
            acc.totalEligible += el.calculatedAmount;
            break;
          case 'pending':
            acc.totalPending += el.calculatedAmount;
            break;
          case 'paid':
            acc.totalPaid += el.calculatedAmount;
            break;
        }
        return acc;
      },
      { totalEligible: 0, totalPending: 0, totalPaid: 0 }
    );

    return {
      ...summary,
      eligibilities,
    };
  }
}

export const bonusService = new BonusService();
