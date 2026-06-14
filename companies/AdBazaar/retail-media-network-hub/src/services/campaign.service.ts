import { v4 as uuidv4 } from 'uuid';
import { RetailMediaCampaign, IRetailMediaCampaign } from '../models/index.js';
import { CreateCampaignRequest, UpdateCampaignRequest, CampaignType, CampaignStatus } from '../types/index.js';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../config/redis.js';
import { campaignCreatedTotal, activeCampaignsGauge, dbQueryDuration } from '../config/metrics.js';

export class CampaignService {
  private cacheTTL = 300; // 5 minutes

  async createCampaign(
    merchantId: string,
    data: CreateCampaignRequest
  ): Promise<IRetailMediaCampaign> {
    const startTime = Date.now();

    const campaignId = `RMN-${uuidv4().substring(0, 8).toUpperCase()}`;

    const campaign = new RetailMediaCampaign({
      campaignId,
      merchantId,
      name: data.name,
      type: data.type,
      products: data.products || [],
      targeting: data.targeting,
      budget: {
        total: data.budget.total,
        spent: 0,
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
        acos: 0,
      },
      status: 'active',
    });

    await campaign.save();

    // Update metrics
    campaignCreatedTotal.inc({ type: data.type, status: 'active' });
    activeCampaignsGauge.inc({ type: data.type });

    // Invalidate cache
    await cacheDeletePattern(`campaigns:${merchantId}:*`);

    dbQueryDuration.observe({ operation: 'insert', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return campaign;
  }

  async getCampaigns(
    merchantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: CampaignStatus;
      type?: CampaignType;
 } = {}
  ): Promise<{
    campaigns: IRetailMediaCampaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const startTime = Date.now();
    const { page = 1, limit = 20, status, type } = options;

    const cacheKey = `campaigns:${merchantId}:${page}:${limit}:${status || 'all'}:${type || 'all'}`;

    // Try cache first
    const cached = await cacheGet<{
      campaigns: IRetailMediaCampaign[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const query: Record<string, unknown> = { merchantId };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      RetailMediaCampaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RetailMediaCampaign.countDocuments(query),
    ]);

    const result = {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cacheSet(cacheKey, result, this.cacheTTL);

    dbQueryDuration.observe({ operation: 'find', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return result;
  }

  async getCampaignById(campaignId: string): Promise<IRetailMediaCampaign | null> {
    const startTime = Date.now();

    const cacheKey = `campaign:${campaignId}`;
    const cached = await cacheGet<IRetailMediaCampaign>(cacheKey);
    if (cached) {
      return cached;
    }

    const campaign = await RetailMediaCampaign.findOne({ campaignId }).lean();

    if (campaign) {
      await cacheSet(cacheKey, campaign, this.cacheTTL);
    }

    dbQueryDuration.observe({ operation: 'findOne', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    merchantId: string,
    data: UpdateCampaignRequest
  ): Promise<IRetailMediaCampaign | null> {
    const startTime = Date.now();

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.products) updateData.products = data.products;
    if (data.targeting) updateData.targeting = data.targeting;
    if (data.status) updateData.status = data.status;
    if (data.budget) updateData.budget = data.budget;

    const campaign = await RetailMediaCampaign.findOneAndUpdate(
      { campaignId, merchantId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (campaign) {
      // Invalidate cache
      await cacheDelete(`campaign:${campaignId}`);
      await cacheDeletePattern(`campaigns:${merchantId}:*`);

      // Update metrics
      if (data.status === 'paused' || data.status === 'completed') {
        activeCampaignsGauge.dec({ type: campaign.type });
      } else if (data.status === 'active') {
        activeCampaignsGauge.inc({ type: campaign.type });
      }
    }

    dbQueryDuration.observe({ operation: 'updateOne', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return campaign;
  }

  async deleteCampaign(campaignId: string, merchantId: string): Promise<boolean> {
    const startTime = Date.now();

    const campaign = await RetailMediaCampaign.findOneAndDelete({ campaignId, merchantId });

    if (campaign) {
      // Update metrics
      activeCampaignsGauge.dec({ type: campaign.type });

      // Invalidate cache
      await cacheDelete(`campaign:${campaignId}`);
      await cacheDeletePattern(`campaigns:${merchantId}:*`);
    }

    dbQueryDuration.observe({ operation: 'deleteOne', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return !!campaign;
  }

  async updateCampaignMetrics(
    campaignId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      orders?: number;
      revenue?: number;
      spend?: number;
    }
  ): Promise<IRetailMediaCampaign | null> {
    const updateOps: Record<string, unknown> = {};

    if (metrics.impressions) updateOps['metrics.impressions'] = metrics.impressions;
    if (metrics.clicks) updateOps['metrics.clicks'] = metrics.clicks;
    if (metrics.orders) updateOps['metrics.orders'] = metrics.orders;
    if (metrics.revenue) updateOps['metrics.revenue'] = metrics.revenue;
    if (metrics.spend) updateOps['budget.spent'] = metrics.spend;

    // Calculate ACOS
    const campaign = await RetailMediaCampaign.findOne({ campaignId });
    if (campaign && metrics.spend) {
      const newSpent = campaign.budget.spent + metrics.spend;
      updateOps['budget.spent'] = newSpent;

      if (campaign.metrics.revenue + (metrics.revenue || 0) > 0) {
        const acos = (newSpent / (campaign.metrics.revenue + (metrics.revenue || 0))) * 100;
        updateOps['metrics.acos'] = acos;
      }
    }

    const updated = await RetailMediaCampaign.findOneAndUpdate(
      { campaignId },
      { $inc: updateOps },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      await cacheDelete(`campaign:${campaignId}`);
    }

    return updated;
  }

  async getCampaignStats(merchantId: string): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpent: number;
    totalRevenue: number;
    averageACOS: number;
  }> {
    const startTime = Date.now();

    const stats = await RetailMediaCampaign.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          totalSpent: { $sum: '$budget.spent' },
          totalRevenue: { $sum: '$metrics.revenue' },
        },
      },
    ]);

    const result = stats[0] || {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalSpent: 0,
      totalRevenue: 0,
    };

    const averageACOS =
      result.totalRevenue > 0
        ? (result.totalSpent / result.totalRevenue) * 100
        : 0;

    dbQueryDuration.observe({ operation: 'aggregate', collection: 'retail_media_campaigns' }, (Date.now() - startTime) / 1000);

    return {
      totalCampaigns: result.totalCampaigns,
      activeCampaigns: result.activeCampaigns,
      totalSpent: result.totalSpent,
      totalRevenue: result.totalRevenue,
      averageACOS,
    };
  }
}

export const campaignService = new CampaignService();
