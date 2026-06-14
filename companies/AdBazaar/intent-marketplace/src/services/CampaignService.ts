import { v4 as uuidv4 } from 'uuid';
import { MarketplaceCampaign, SegmentListing } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../config/redis.js';
import { logger } from '../config/logger.js';
import type { IMarketplaceCampaign, CreateCampaignRequest, CampaignStatus } from '../types.js';

const CAMPAIGN_CACHE_TTL = 120; // 2 minutes

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(
    advertiserId: string,
    data: CreateCampaignRequest
  ): Promise<IMarketplaceCampaign> {
    const campaignId = uuidv4();
    const currency = process.env.DEFAULT_CURRENCY || 'INR';

    // Validate segments exist
    const segmentIds = data.segments.map((s) => s.segmentId);
    const segments = await SegmentListing.find({ segmentId: { $in: segmentIds }, status: 'active' }).lean();

    if (segments.length !== segmentIds.length) {
      const missing = segmentIds.filter(
        (id) => !segments.find((s) => s.segmentId === id)
      );
      throw new Error(`Invalid segments: ${missing.join(', ')}`);
    }

    const campaign = new MarketplaceCampaign({
      campaignId,
      advertiserId,
      name: data.name,
      description: data.description || '',
      status: 'draft',
      segments: data.segments.map((s) => ({
        segmentId: s.segmentId,
        bidAmount: s.bidAmount,
        budget: s.budget,
        spent: 0,
      })),
      totalBudget: data.totalBudget,
      totalSpent: 0,
      currency,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      targeting: data.targeting,
      deliveryMetrics: {
        impressions: 0,
        uniqueUsersReached: 0,
        ctr: 0,
        conversions: 0,
        attributedRevenue: 0,
        roi: 0,
      },
    });

    await campaign.save();
    logger.info('Campaign created', { campaignId, advertiserId, name: data.name });

    return campaign.toObject();
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<IMarketplaceCampaign | null> {
    const cacheKey = `campaign:${campaignId}`;
    const cached = await cacheGet<IMarketplaceCampaign>(cacheKey);
    if (cached) return cached;

    const campaign = await MarketplaceCampaign.findOne({ campaignId }).lean();
    if (campaign) {
      await cacheSet(cacheKey, campaign as IMarketplaceCampaign, CAMPAIGN_CACHE_TTL);
    }

    return campaign as IMarketplaceCampaign | null;
  }

  /**
   * List campaigns for an advertiser
   */
  async listCampaigns(
    advertiserId: string,
    options: {
      status?: CampaignStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ campaigns: IMarketplaceCampaign[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { advertiserId };
    if (status) filter.status = status;

    const [campaigns, total] = await Promise.all([
      MarketplaceCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceCampaign.countDocuments(filter),
    ]);

    return {
      campaigns: campaigns as IMarketplaceCampaign[],
      total,
    };
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignRequest>
  ): Promise<IMarketplaceCampaign | null> {
    const updateData: Record<string, unknown> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.totalBudget) updateData.totalBudget = updates.totalBudget;
    if (updates.startDate) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate) updateData.endDate = new Date(updates.endDate);
    if (updates.segments) {
      updateData.segments = updates.segments.map((s) => ({
        segmentId: s.segmentId,
        bidAmount: s.bidAmount,
        budget: s.budget,
        spent: 0,
      }));
    }
    if (updates.targeting) updateData.targeting = updates.targeting;

    const campaign = await MarketplaceCampaign.findOneAndUpdate(
      { campaignId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (campaign) {
      await cacheDelete(`campaign:${campaignId}`);
      logger.info('Campaign updated', { campaignId });
    }

    return campaign as IMarketplaceCampaign | null;
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus
  ): Promise<IMarketplaceCampaign | null> {
    const campaign = await MarketplaceCampaign.findOneAndUpdate(
      { campaignId },
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (campaign) {
      await cacheDelete(`campaign:${campaignId}`);
      logger.info('Campaign status updated', { campaignId, status });
    }

    return campaign as IMarketplaceCampaign | null;
  }

  /**
   * Activate campaign
   */
  async activateCampaign(campaignId: string): Promise<IMarketplaceCampaign | null> {
    return this.updateCampaignStatus(campaignId, 'active');
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<IMarketplaceCampaign | null> {
    return this.updateCampaignStatus(campaignId, 'paused');
  }

  /**
   * Complete campaign
   */
  async completeCampaign(campaignId: string): Promise<IMarketplaceCampaign | null> {
    return this.updateCampaignStatus(campaignId, 'completed');
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await MarketplaceCampaign.deleteOne({ campaignId });
    if (result.deletedCount > 0) {
      await cacheDelete(`campaign:${campaignId}`);
      logger.info('Campaign deleted', { campaignId });
      return true;
    }
    return false;
  }

  /**
   * Get campaign summary
   */
  async getCampaignSummary(campaignId: string): Promise<{
    campaign: IMarketplaceCampaign;
    segments: Array<{
      segmentId: string;
      name: string;
      budget: number;
      spent: number;
      performance: string;
    }>;
    budgetUtilization: number;
    timeRemaining: number;
  } | null> {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) return null;

    const segmentIds = campaign.segments.map((s) => s.segmentId);
    const segments = await SegmentListing.find({
      segmentId: { $in: segmentIds },
    }).lean();

    const segmentMap = new Map(segments.map((s) => [s.segmentId, s]));
    const budgetUtilization = campaign.totalBudget > 0
      ? (campaign.totalSpent / campaign.totalBudget) * 100
      : 0;

    const timeRemaining = Math.max(
      0,
      campaign.endDate.getTime() - Date.now()
    );

    return {
      campaign,
      segments: campaign.segments.map((s) => {
        const seg = segmentMap.get(s.segmentId);
        const spent = campaign.deliveryMetrics?.impressions
          ? (campaign.deliveryMetrics.impressions / campaign.totalSpent) * s.spent
          : s.spent;
        return {
          segmentId: s.segmentId,
          name: seg?.name || 'Unknown',
          budget: s.budget,
          spent: s.spent,
          performance: seg?.qualityScore
            ? seg.qualityScore > 90
              ? 'Excellent'
              : seg.qualityScore > 75
              ? 'Good'
              : 'Average'
            : 'Unknown',
        };
      }),
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      timeRemaining,
    };
  }

  /**
   * Check and complete expired campaigns
   */
  async checkExpiredCampaigns(): Promise<number> {
    const result = await MarketplaceCampaign.updateMany(
      {
        status: 'active',
        endDate: { $lt: new Date() },
      },
      { $set: { status: 'completed' } }
    );

    if (result.modifiedCount > 0) {
      logger.info('Expired campaigns completed', { count: result.modifiedCount });
      await cacheDeletePattern('campaign:*');
    }

    return result.modifiedCount;
  }

  /**
   * Get campaign budget allocation
   */
  async getBudgetAllocation(campaignId: string): Promise<{
    campaignId: string;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    segments: Array<{
      segmentId: string;
      budget: number;
      spent: number;
      remaining: number;
      utilizationPercent: number;
    }>;
  } | null> {
    const campaign = await MarketplaceCampaign.findOne({ campaignId }).lean();
    if (!campaign) return null;

    return {
      campaignId,
      totalBudget: campaign.totalBudget,
      totalSpent: campaign.totalSpent,
      remaining: campaign.totalBudget - campaign.totalSpent,
      segments: campaign.segments.map((s) => ({
        segmentId: s.segmentId,
        budget: s.budget,
        spent: s.spent,
        remaining: s.budget - s.spent,
        utilizationPercent: s.budget > 0 ? (s.spent / s.budget) * 100 : 0,
      })),
    };
  }
}

export const campaignService = new CampaignService();