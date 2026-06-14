import { HealthBenefit, IHealthBenefit } from '../models';
import { HealthBenefit as HealthBenefitType } from '../types';

export class HealthBenefitService {
  /**
   * Get all health benefits
   */
  async getAllBenefits(options?: {
    coverageType?: string;
    status?: string;
    minCoverage?: number;
    maxCoverage?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ benefits: IHealthBenefit[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (options?.coverageType) filter.coverageType = options.coverageType;
    if (options?.status) filter.status = options.status;
    if (options?.minCoverage || options?.maxCoverage) {
      filter.coverageAmount = {};
      if (options?.minCoverage) (filter.coverageAmount as Record<string, number>).$gte = options.minCoverage;
      if (options?.maxCoverage) (filter.coverageAmount as Record<string, number>).$lte = options.maxCoverage;
    }

    const [benefits, total] = await Promise.all([
      HealthBenefit.find(filter)
        .skip(options?.offset || 0)
        .limit(options?.limit || 50)
        .sort({ coverageAmount: -1 }),
      HealthBenefit.countDocuments(filter),
    ]);

    return { benefits, total };
  }

  /**
   * Get benefit by ID
   */
  async getBenefit(benefitId: string): Promise<IHealthBenefit | null> {
    return HealthBenefit.findOne({ benefitId });
  }

  /**
   * Create or update benefit
   */
  async upsertBenefit(data: HealthBenefitType): Promise<IHealthBenefit> {
    const existing = await HealthBenefit.findOne({ benefitId: data.benefitId });

    if (existing) {
      Object.assign(existing, {
        name: data.name,
        description: data.description,
        coverageType: data.coverageType,
        coverageAmount: data.coverageAmount,
        deductible: data.deductible,
        premium: data.premium,
        provider: data.provider,
        features: data.features,
        waitingPeriod: data.waitingPeriod,
        exclusions: data.exclusions || [],
        status: data.status,
      });
      await existing.save();
      return existing;
    }

    const benefit = new HealthBenefit(data);
    await benefit.save();
    return benefit;
  }

  /**
   * Update benefit status
   */
  async updateStatus(
    benefitId: string,
    status: IHealthBenefit['status']
  ): Promise<IHealthBenefit | null> {
    return HealthBenefit.findOneAndUpdate(
      { benefitId },
      { status },
      { new: true }
    );
  }

  /**
   * Get benefits by provider
   */
  async getByProvider(provider: string): Promise<IHealthBenefit[]> {
    return HealthBenefit.find({ provider, status: 'active' }).sort({ premium: 1 });
  }

  /**
   * Get benefit statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
    averagePremium: number;
    totalCoverage: number;
  }> {
    const [benefits, typeStats] = await Promise.all([
      HealthBenefit.find({ status: 'active' }),
      HealthBenefit.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$coverageType', count: { $sum: 1 } } },
      ]),
    ]);

    const premiumSum = benefits.reduce((sum, b) => sum + b.premium, 0);
    const coverageSum = benefits.reduce((sum, b) => sum + b.coverageAmount, 0);

    return {
      total: benefits.length,
      active: benefits.filter((b) => b.status === 'active').length,
      byType: typeStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>),
      averagePremium: benefits.length > 0 ? premiumSum / benefits.length : 0,
      totalCoverage: coverageSum,
    };
  }
}

export const healthBenefitService = new HealthBenefitService();
