/**
 * CampaignService
 * Manages DPA campaigns - CRUD, status, metrics
 */

import { v4 as uuidv4 } from 'uuid';
import { DPACampaignModel, IDPACampaign } from '../models';
import { feedService } from './FeedService';
import type {
  CreateCampaignRequest,
  UpdateCampaignInput,
  CampaignMetrics,
  TargetingRules,
  UserTargeting,
} from '../types';
import logger from '../utils/logger';

export class CampaignService {
  /**
   * Create a new DPA campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<IDPACampaign> {
    const campaignId = `dpa-${uuidv4().slice(0, 12)}`;

    // Verify feed exists
    const feed = await feedService.getFeed(data.feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${data.feedId}`);
    }

    const campaign = new DPACampaignModel({
      campaignId,
      advertiserId: data.advertiserId,
      name: data.name,
      description: data.description,
      feedId: data.feedId,
      template: data.template,
      rules: data.rules || {},
      targeting: data.targeting || {},
      status: 'draft',
      budget: data.budget ? { ...data.budget, spent: 0 } : undefined,
      schedule: data.schedule,
    });

    await campaign.save();
    logger.info('Campaign created', { campaignId, advertiserId: data.advertiserId, feedId: data.feedId });

    return campaign;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId: string, data: UpdateCampaignInput): Promise<IDPACampaign | null> {
    const campaign = await DPACampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    // Update allowed fields
    if (data.name !== undefined) campaign.name = data.name;
    if (data.template !== undefined) campaign.template = data.template;
    if (data.rules !== undefined) campaign.rules = data.rules;
    if (data.targeting !== undefined) campaign.targeting = data.targeting;
    if (data.budget !== undefined) {
      campaign.budget = { ...campaign.budget, ...data.budget };
    }
    if (data.schedule !== undefined) campaign.schedule = data.schedule;
    if (data.status !== undefined) campaign.status = data.status;

    await campaign.save();
    logger.info('Campaign updated', { campaignId, updatedFields: Object.keys(data) });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<IDPACampaign | null> {
    return DPACampaignModel.findOne({ campaignId });
  }

  /**
   * List campaigns with pagination
   */
  async listCampaigns(params: {
    advertiserId?: string;
    status?: string;
    feedId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ campaigns: IDPACampaign[]; total: number; page: number; limit: number; pages: number }> {
    const {
      advertiserId,
      status,
      feedId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: Record<string, unknown> = {};
    if (advertiserId) query.advertiserId = advertiserId;
    if (status) query.status = status;
    if (feedId) query.feedId = feedId;

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      DPACampaignModel.find(query).sort(sort).skip(skip).limit(limit),
      DPACampaignModel.countDocuments(query),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await DPACampaignModel.deleteOne({ campaignId });
    if (result.deletedCount > 0) {
      logger.info('Campaign deleted', { campaignId });
      return true;
    }
    return false;
  }

  /**
   * Activate a campaign (set status to active)
   */
  async activateCampaign(campaignId: string): Promise<IDPACampaign | null> {
    const campaign = await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      { status: 'active' },
      { new: true }
    );

    if (campaign) {
      logger.info('Campaign activated', { campaignId });
    }

    return campaign;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<IDPACampaign | null> {
    const campaign = await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      { status: 'paused' },
      { new: true }
    );

    if (campaign) {
      logger.info('Campaign paused', { campaignId });
    }

    return campaign;
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: string): Promise<IDPACampaign | null> {
    const campaign = await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      { status: 'completed' },
      { new: true }
    );

    if (campaign) {
      logger.info('Campaign completed', { campaignId });
    }

    return campaign;
  }

  /**
   * Record an impression for the campaign
   */
  async recordImpression(campaignId: string): Promise<void> {
    await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      { $inc: { 'metrics.impressions': 1 } }
    );
  }

  /**
   * Record a click for the campaign
   */
  async recordClick(campaignId: string): Promise<void> {
    const campaign = await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      { $inc: { 'metrics.clicks': 1 } }
    );

    if (campaign) {
      // Recalculate CTR
      const ctr = campaign.metrics.impressions > 0
        ? (campaign.metrics.clicks / campaign.metrics.impressions) * 100
        : 0;

      await DPACampaignModel.updateOne(
        { campaignId },
        { $set: { 'metrics.ctr': ctr } }
      );
    }
  }

  /**
   * Record a conversion for the campaign
   */
  async recordConversion(campaignId: string, revenue: number): Promise<void> {
    const campaign = await DPACampaignModel.findOneAndUpdate(
      { campaignId },
      {
        $inc: {
          'metrics.orders': 1,
          'metrics.revenue': revenue,
        },
      },
      { new: true }
    );

    if (campaign) {
      // Recalculate conversion rate and ROAS
      const conversionRate = campaign.metrics.clicks > 0
        ? (campaign.metrics.orders / campaign.metrics.clicks) * 100
        : 0;

      await DPACampaignModel.updateOne(
        { campaignId },
        {
          $set: {
            'metrics.conversionRate': conversionRate,
            'metrics.roas': campaign.metrics.revenue,
          },
        }
      );
    }
  }

  /**
   * Get campaigns by advertiser
   */
  async getCampaignsByAdvertiser(advertiserId: string): Promise<IDPACampaign[]> {
    return DPACampaignModel.find({ advertiserId }).sort({ createdAt: -1 });
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<IDPACampaign[]> {
    return DPACampaignModel.find({ status: 'active' });
  }

  /**
   * Get campaigns by feed
   */
  async getCampaignsByFeed(feedId: string): Promise<IDPACampaign[]> {
    return DPACampaignModel.find({ feedId });
  }

  /**
   * Get top performing campaigns
   */
  async getTopPerformingCampaigns(limit: number = 10): Promise<IDPACampaign[]> {
    return DPACampaignModel.find({ status: 'active' })
      .sort({ 'metrics.ctr': -1 })
      .limit(limit);
  }

  /**
   * Get campaign metrics summary
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    const campaign = await DPACampaignModel.findOne({ campaignId });
    return campaign?.metrics || null;
  }

  /**
   * Get aggregate metrics for an advertiser
   */
  async getAdvertiserMetrics(advertiserId: string): Promise<CampaignMetrics> {
    const campaigns = await DPACampaignModel.find({ advertiserId });

    const metrics: CampaignMetrics = {
      impressions: 0,
      clicks: 0,
      orders: 0,
      revenue: 0,
      ctr: 0,
      conversionRate: 0,
      costPerClick: 0,
      costPerOrder: 0,
      roas: 0,
    };

    for (const campaign of campaigns) {
      metrics.impressions += campaign.metrics.impressions;
      metrics.clicks += campaign.metrics.clicks;
      metrics.orders += campaign.metrics.orders;
      metrics.revenue += campaign.metrics.revenue;
    }

    // Calculate aggregate rates
    if (metrics.impressions > 0) {
      metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
    }
    if (metrics.clicks > 0) {
      metrics.conversionRate = (metrics.orders / metrics.clicks) * 100;
    }
    metrics.roas = metrics.revenue;

    return metrics;
  }

  /**
   * Apply rules to filter products
   */
  async getFilteredProducts(campaignId: string): Promise<any[]> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return [];
    }

    const filters: any = {};

    if (campaign.rules.categories && campaign.rules.categories.length > 0) {
      filters.categories = campaign.rules.categories;
    }
    if (campaign.rules.minPrice !== undefined) {
      filters.minPrice = campaign.rules.minPrice;
    }
    if (campaign.rules.maxPrice !== undefined) {
      filters.maxPrice = campaign.rules.maxPrice;
    }
    if (campaign.rules.inStockOnly) {
      filters.inStockOnly = true;
    }
    if (campaign.rules.brandWhitelist && campaign.rules.brandWhitelist.length > 0) {
      filters.brands = campaign.rules.brandWhitelist;
    }
    if (campaign.rules.excludeProducts && campaign.rules.excludeProducts.length > 0) {
      filters.excludeProducts = campaign.rules.excludeProducts;
    }

    return feedService.getProducts(campaign.feedId, filters);
  }
}

export const campaignService = new CampaignService();

export default campaignService;