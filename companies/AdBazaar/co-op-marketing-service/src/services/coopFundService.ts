import { v4 as uuidv4 } from 'uuid';
import { CoopFund, ICoopFund, CoopFundStatus, CoopFundType } from '../models/CoopFund';
import logger from '../utils/logger';

export interface CreateCoopFundInput {
  advertiserId: string;
  name: string;
  type: CoopFundType;
  totalBudget: number;
  rules: {
    minSpend: number;
    maxContribution: number;
    contributionPercent: number;
    eligibleCategories?: string[];
    excludedProducts?: string[];
    startDate: Date;
    endDate: Date;
  };
  partnerEligibility?: {
    tiers?: string[];
    minimumPerformance?: number;
    approvedPartners?: string[];
  };
}

class CoopFundService {
  /**
   * Create a new co-op fund
   */
  async createCoopFund(input: CreateCoopFundInput): Promise<ICoopFund> {
    const fundId = `coop-${uuidv4().slice(0, 12)}`;

    const fund = new CoopFund({
      fundId,
      advertiserId: input.advertiserId,
      name: input.name,
      type: input.type,
      status: 'active',
      totalBudget: input.totalBudget,
      allocatedBudget: 0,
      spentBudget: 0,
      availableBudget: input.totalBudget,
      currency: 'INR',
      rules: {
        minSpend: input.rules.minSpend,
        maxContribution: input.rules.maxContribution,
        contributionPercent: input.rules.contributionPercent,
        eligibleCategories: input.rules.eligibleCategories || [],
        excludedProducts: input.rules.excludedProducts || [],
        startDate: input.rules.startDate,
        endDate: input.rules.endDate,
      },
      partnerEligibility: {
        tiers: input.partnerEligibility?.tiers || ['bronze', 'silver', 'gold', 'platinum'],
        minimumPerformance: input.partnerEligibility?.minimumPerformance || 0,
        approvedPartners: input.partnerEligibility?.approvedPartners || [],
      },
      tracking: {
        totalClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        totalSpent: 0,
        avgClaimValue: 0,
      },
    });

    await fund.save();
    logger.info('Co-op fund created', { fundId, advertiserId: input.advertiserId, budget: input.totalBudget });

    return fund;
  }

  /**
   * Get co-op fund by ID
   */
  async getCoopFund(fundId: string): Promise<ICoopFund | null> {
    return CoopFund.findOne({ fundId });
  }

  /**
   * Get co-op funds by advertiser
   */
  async getCoopFundsByAdvertiser(
    advertiserId: string,
    options: { status?: CoopFundStatus } = {}
  ): Promise<ICoopFund[]> {
    const query: Record<string, unknown> = { advertiserId };
    if (options.status) query.status = options.status;

    return CoopFund.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update co-op fund
   */
  async updateCoopFund(
    fundId: string,
    updates: Partial<CreateCoopFundInput>
  ): Promise<ICoopFund | null> {
    const fund = await CoopFund.findOneAndUpdate(
      { fundId },
      { $set: updates },
      { new: true }
    );

    if (fund) {
      logger.info('Co-op fund updated', { fundId });
    }

    return fund;
  }

  /**
   * Update fund status
   */
  async updateFundStatus(fundId: string, status: CoopFundStatus): Promise<ICoopFund | null> {
    const fund = await CoopFund.findOneAndUpdate(
      { fundId },
      { $set: { status } },
      { new: true }
    );

    if (fund) {
      logger.info('Co-op fund status updated', { fundId, status });
    }

    return fund;
  }

  /**
   * Allocate budget to fund
   */
  async allocateBudget(fundId: string, amount: number): Promise<ICoopFund | null> {
    const fund = await CoopFund.findOne({ fundId });
    if (!fund || fund.availableBudget < amount) {
      return null;
    }

    fund.allocatedBudget += amount;
    fund.availableBudget -= amount;
    await fund.save();

    logger.info('Budget allocated', { fundId, amount, availableBudget: fund.availableBudget });

    return fund;
  }

  /**
   * Record spending
   */
  async recordSpending(fundId: string, amount: number): Promise<ICoopFund | null> {
    const fund = await CoopFund.findOne({ fundId });
    if (!fund || fund.availableBudget < amount) {
      return null;
    }

    fund.spentBudget += amount;
    fund.availableBudget -= amount;
    fund.tracking.totalSpent += amount;
    await fund.save();

    logger.info('Spending recorded', { fundId, amount, totalSpent: fund.spentBudget });

    return fund;
  }

  /**
   * Check fund eligibility for partner
   */
  async checkEligibility(
    fundId: string,
    partnerId: string,
    partnerTier: string,
    partnerPerformance: number
  ): Promise<{ eligible: boolean; reason?: string }> {
    const fund = await CoopFund.findOne({ fundId });
    if (!fund) {
      return { eligible: false, reason: 'Fund not found' };
    }

    if (fund.status !== 'active') {
      return { eligible: false, reason: 'Fund is not active' };
    }

    if (new Date() < fund.rules.startDate || new Date() > fund.rules.endDate) {
      return { eligible: false, reason: 'Fund is not within valid period' };
    }

    if (fund.availableBudget <= 0) {
      return { eligible: false, reason: 'Fund has no available budget' };
    }

    if (!fund.partnerEligibility.tiers.includes(partnerTier)) {
      return { eligible: false, reason: `Partner tier ${partnerTier} is not eligible` };
    }

    if (partnerPerformance < fund.partnerEligibility.minimumPerformance) {
      return { eligible: false, reason: 'Partner performance below minimum threshold' };
    }

    if (fund.partnerEligibility.approvedPartners.length > 0 &&
        !fund.partnerEligibility.approvedPartners.includes(partnerId)) {
      return { eligible: false, reason: 'Partner not on approved list' };
    }

    return { eligible: true };
  }

  /**
   * Get fund analytics
   */
  async getFundAnalytics(fundId: string): Promise<{
    totalBudget: number;
    allocated: number;
    spent: number;
    available: number;
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    avgClaimValue: number;
    utilizationPercent: number;
  } | null> {
    const fund = await CoopFund.findOne({ fundId });
    if (!fund) return null;

    return {
      totalBudget: fund.totalBudget,
      allocated: fund.allocatedBudget,
      spent: fund.spentBudget,
      available: fund.availableBudget,
      totalClaims: fund.tracking.totalClaims,
      approvedClaims: fund.tracking.approvedClaims,
      rejectedClaims: fund.tracking.rejectedClaims,
      avgClaimValue: fund.tracking.avgClaimValue,
      utilizationPercent: fund.totalBudget > 0 ? (fund.spentBudget / fund.totalBudget) * 100 : 0,
    };
  }
}

export const coopFundService = new CoopFundService();
export default coopFundService;