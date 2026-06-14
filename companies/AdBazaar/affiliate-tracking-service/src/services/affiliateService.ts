import { v4 as uuidv4 } from 'uuid';
import { Affiliate, IAffiliate } from '../models/Affiliate';
import logger from '../utils/logger';

export interface CreateAffiliateInput {
  userId: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  niche: string;
  commissionStructure?: {
    cpa: number;
    revShare: number;
    cookieDuration: number;
  };
  payoutSettings?: {
    minPayoutThreshold: number;
    payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
    autoPayout: boolean;
    paymentMethod: 'bank_transfer' | 'paypal' | 'upi';
  };
}

export interface AffiliateAnalytics {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  avgOrderValue: number;
  topCampaigns: Array<{
    campaignId: string;
    conversions: number;
    revenue: number;
  }>;
  trends: {
    clicksTrend: number;
    conversionsTrend: number;
    revenueTrend: number;
  };
}

class AffiliateService {
  /**
   * Create a new affiliate
   */
  async createAffiliate(input: CreateAffiliateInput): Promise<IAffiliate> {
    const affiliateId = `aff-${uuidv4().slice(0, 8)}`;

    const affiliate = new Affiliate({
      affiliateId,
      userId: input.userId,
      businessName: input.businessName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      website: input.website,
      niche: input.niche,
      commissionStructure: input.commissionStructure || {
        cpa: 0,
        revShare: 10,
        cookieDuration: 30,
      },
      payoutSettings: input.payoutSettings || {
        minPayoutThreshold: 1000,
        payoutFrequency: 'monthly',
        autoPayout: false,
        paymentMethod: 'bank_transfer',
      },
      status: 'pending',
      stats: {
        totalClicks: 0,
        totalConversions: 0,
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0,
        avgConversionRate: 0,
      },
    });

    await affiliate.save();
    logger.info('Affiliate created', { affiliateId, businessName: input.businessName });

    return affiliate;
  }

  /**
   * Get affiliate by ID
   */
  async getAffiliate(affiliateId: string): Promise<IAffiliate | null> {
    return Affiliate.findOne({ affiliateId });
  }

  /**
   * Get affiliate by user ID
   */
  async getAffiliateByUserId(userId: string): Promise<IAffiliate | null> {
    return Affiliate.findOne({ userId });
  }

  /**
   * Update affiliate
   */
  async updateAffiliate(
    affiliateId: string,
    updates: Partial<CreateAffiliateInput>
  ): Promise<IAffiliate | null> {
    const affiliate = await Affiliate.findOneAndUpdate(
      { affiliateId },
      { $set: updates },
      { new: true }
    );

    if (affiliate) {
      logger.info('Affiliate updated', { affiliateId });
    }

    return affiliate;
  }

  /**
   * Update affiliate status
   */
  async updateAffiliateStatus(
    affiliateId: string,
    status: IAffiliate['status']
  ): Promise<IAffiliate | null> {
    const affiliate = await Affiliate.findOneAndUpdate(
      { affiliateId },
      { $set: { status } },
      { new: true }
    );

    if (affiliate) {
      logger.info('Affiliate status updated', { affiliateId, status });
    }

    return affiliate;
  }

  /**
   * Get all affiliates with pagination
   */
  async getAllAffiliates(options: {
    page?: number;
    limit?: number;
    status?: IAffiliate['status'];
    niche?: string;
  }): Promise<{ affiliates: IAffiliate[]; total: number }> {
    const { page = 1, limit = 20, status, niche } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (niche) query.niche = niche;

    const [affiliates, total] = await Promise.all([
      Affiliate.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Affiliate.countDocuments(query),
    ]);

    return { affiliates, total };
  }

  /**
   * Get affiliate analytics
   */
  async getAffiliateAnalytics(affiliateId: string): Promise<AffiliateAnalytics | null> {
    const affiliate = await Affiliate.findOne({ affiliateId });
    if (!affiliate) return null;

    const { stats } = affiliate;

    return {
      totalClicks: stats.totalClicks,
      totalConversions: stats.totalConversions,
      conversionRate: stats.avgConversionRate,
      totalRevenue: stats.totalCommission,
      totalCommission: stats.totalCommission,
      pendingCommission: stats.pendingCommission,
      paidCommission: stats.paidCommission,
      avgOrderValue: stats.totalConversions > 0
        ? stats.totalCommission / stats.totalConversions
        : 0,
      topCampaigns: [],
      trends: {
        clicksTrend: 0,
        conversionsTrend: 0,
        revenueTrend: 0,
      },
    };
  }

  /**
   * Update affiliate stats
   */
  async updateAffiliateStats(
    affiliateId: string,
    updates: Partial<IAffiliate['stats']>
  ): Promise<void> {
    await Affiliate.findOneAndUpdate(
      { affiliateId },
      { $inc: Object.fromEntries(Object.entries(updates).map(([k, v]) => [`stats.${k}`, v])) }
    );
  }
}

export const affiliateService = new AffiliateService();
export default affiliateService;