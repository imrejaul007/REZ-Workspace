import { ShelfCampaign, IShelfCampaignDocument, IGeoTargeting } from '../models/ShelfCampaign.js';
import { Shelf } from '../models/Shelf.js';
import { Store } from '../models/Store.js';
import { createChildLogger } from 'utils/logger.js';
import { activeCampaigns, campaignBudget } from '../utils/metrics.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createChildLogger('campaignService');

// Validation schemas
export const CreateCampaignSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  shelves: z.array(z.string()).optional().default([]),
  storeIds: z.array(z.string()).optional().default([]),
  targeting: z.object({
    geo: z.object({
      type: z.enum(['city', 'state', 'zone', 'radius']),
      values: z.array(z.string()),
      radius: z.object({
        center: z.object({
          lat: z.number(),
          lng: z.number()
        }),
        km: z.number()
      }).optional()
    }),
    categories: z.array(z.string()).optional().default([]),
    storeTiers: z.array(z.enum(['premium', 'standard', 'economy'])).optional().default([]),
    storeSizes: z.array(z.enum(['small', 'medium', 'large'])).optional().default([]),
    minFootfall: z.number().min(0).optional()
  }),
  budget: z.object({
    total: z.number().min(0),
    daily: z.number().min(0).optional(),
    currency: z.string().optional().default('INR')
  }),
  dates: z.object({
    start: z.string().datetime().or(z.date()),
    end: z.string().datetime().or(z.date())
  }),
  creative: z.object({
    type: z.enum(['image', 'video', 'digital']).optional().default('image'),
    url: z.string().url(),
    copy: z.string().optional()
  }),
  bidStrategy: z.object({
    type: z.enum(['auto', 'manual']).optional().default('manual'),
    maxBid: z.number().min(0).optional(),
    targetCpm: z.number().min(0).optional()
  }).optional(),
  optimization: z.object({
    enabled: z.boolean().optional().default(false),
    goals: z.array(z.enum(['impressions', 'clicks', 'conversions', 'sales_lift'])).optional().default([]),
    weights: z.record(z.string(), z.number()).optional().default({})
  }).optional()
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial();

export const GeoTargetingSchema = z.object({
  type: z.enum(['city', 'state', 'zone', 'radius']),
  values: z.array(z.string()),
  radius: z.object({
    center: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    km: z.number()
  }).optional()
});

export const ListCampaignsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  advertiserId: z.string().optional(),
  category: z.string().optional()
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
export type GeoTargetingInput = z.infer<typeof GeoTargetingSchema>;
export type ListCampaignsQuery = z.infer<typeof ListCampaignsQuerySchema>;

export class CampaignService {
  /**
   * Create campaign
   */
  async createCampaign(data: CreateCampaignInput): Promise<IShelfCampaignDocument> {
    logger.info('Creating shelf campaign', { name: data.name, advertiserId: data.advertiserId });

    const campaign = new ShelfCampaign({
      ...data,
      shelves: data.shelves.map(s => new mongoose.Types.ObjectId(s)),
      storeIds: data.storeIds.map(s => new mongoose.Types.ObjectId(s)),
      status: 'draft',
      performance: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0
      }
    });

    await campaign.save();
    logger.info('Campaign created', { campaignId: campaign._id });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return ShelfCampaign.findById(id)
      .populate('shelves', 'name position storeId')
      .populate('storeIds', 'name location');
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignInput): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.shelves) {
      updateData.shelves = data.shelves.map(s => new mongoose.Types.ObjectId(s));
    }
    if (data.storeIds) {
      updateData.storeIds = data.storeIds.map(s => new mongoose.Types.ObjectId(s));
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('shelves');

    if (campaign) {
      logger.info('Campaign updated', { campaignId: id });
    }

    return campaign;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await ShelfCampaign.findByIdAndDelete(id);
    if (result) {
      logger.info('Campaign deleted', { campaignId: id });
      return true;
    }
    return false;
  }

  /**
   * List campaigns
   */
  async listCampaigns(query: ListCampaignsQuery): Promise<{
    campaigns: IShelfCampaignDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, advertiserId, category } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (advertiserId) filter.advertiserId = advertiserId;
    if (category) filter['targeting.categories'] = { $in: [category] };

    const [campaigns, total] = await Promise.all([
      ShelfCampaign.find(filter)
        .populate('shelves', 'name position')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ShelfCampaign.countDocuments(filter)
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Activate campaign
   */
  async activateCampaign(id: string): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: { status: 'active' } },
      { new: true }
    );

    if (campaign) {
      activeCampaigns.inc();
      logger.info('Campaign activated', { campaignId: id });
    }

    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: { status: 'paused' } },
      { new: true }
    );

    if (campaign) {
      activeCampaigns.dec();
      logger.info('Campaign paused', { campaignId: id });
    }

    return campaign;
  }

  /**
   * Complete campaign
   */
  async completeCampaign(id: string): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: { status: 'completed' } },
      { new: true }
    );

    if (campaign) {
      activeCampaigns.dec();
      logger.info('Campaign completed', { campaignId: id });
    }

    return campaign;
  }

  /**
   * Update geo targeting
   */
  async updateGeoTargeting(id: string, geo: IGeoTargeting): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: { 'targeting.geo': geo } },
      { new: true }
    );

    if (campaign) {
      logger.info('Campaign geo targeting updated', { campaignId: id, geoType: geo.type });
    }

    return campaign;
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(id: string): Promise<{
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    salesLift?: number;
    roas?: number;
    budgetUtilization: number;
    dailyMetrics: Array<{
      date: string;
      impressions: number;
      clicks: number;
      spend: number;
    }>;
  } | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findById(id);
    if (!campaign) {
      return null;
    }

    const budgetUtilization = campaign.budget.total > 0
      ? (campaign.budget.spent / campaign.budget.total) * 100
      : 0;

    return {
      impressions: campaign.performance.impressions,
      clicks: campaign.performance.clicks,
      ctr: campaign.performance.ctr,
      conversions: campaign.performance.conversions,
      salesLift: campaign.performance.salesLift,
      roas: campaign.performance.roas,
      budgetUtilization,
      dailyMetrics: [] // Would be populated from ShelfAd aggregation
    };
  }

  /**
   * Update campaign performance metrics
   */
  async updateCampaignPerformance(id: string, metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    salesLift?: number;
    roas?: number;
  }): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findById(id);
    if (!campaign) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (metrics.impressions !== undefined) {
      updateData['performance.impressions'] = metrics.impressions;
    }
    if (metrics.clicks !== undefined) {
      updateData['performance.clicks'] = metrics.clicks;
      // Calculate CTR
      if (campaign.performance.impressions > 0) {
        updateData['performance.ctr'] = (metrics.clicks / campaign.performance.impressions) * 100;
      }
    }
    if (metrics.conversions !== undefined) {
      updateData['performance.conversions'] = metrics.conversions;
    }
    if (metrics.salesLift !== undefined) {
      updateData['performance.salesLift'] = metrics.salesLift;
    }
    if (metrics.roas !== undefined) {
      updateData['performance.roas'] = metrics.roas;
    }

    const updated = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (updated) {
      logger.info('Campaign performance updated', { campaignId: id, metrics });
    }

    return updated;
  }

  /**
   * Update campaign budget spent
   */
  async updateBudgetSpent(id: string, amount: number): Promise<IShelfCampaignDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await ShelfCampaign.findByIdAndUpdate(
      id,
      { $inc: { 'budget.spent': amount } },
      { new: true }
    );

    if (campaign) {
      campaignBudget.set({ campaign_id: id }, campaign.budget.spent);
    }

    return campaign;
  }

  /**
   * Get campaigns by advertiser
   */
  async getCampaignsByAdvertiser(advertiserId: string): Promise<IShelfCampaignDocument[]> {
    return ShelfCampaign.find({ advertiserId })
      .populate('shelves', 'name position')
      .sort({ createdAt: -1 });
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<IShelfCampaignDocument[]> {
    return ShelfCampaign.find({ status: 'active' })
      .populate('shelves', 'name position storeId')
      .populate('storeIds', 'name location');
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<{
    total: number;
    active: number;
    paused: number;
    completed: number;
    draft: number;
    totalBudget: number;
    totalSpent: number;
    avgSalesLift: number;
  }> {
    const [campaigns, active, paused, completed, draft] = await Promise.all([
      ShelfCampaign.countDocuments(),
      ShelfCampaign.countDocuments({ status: 'active' }),
      ShelfCampaign.countDocuments({ status: 'paused' }),
      ShelfCampaign.countDocuments({ status: 'completed' }),
      ShelfCampaign.countDocuments({ status: 'draft' })
    ]);

    const budgetStats = await ShelfCampaign.aggregate([
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget.total' },
          totalSpent: { $sum: '$budget.spent' },
          avgSalesLift: { $avg: '$performance.salesLift' }
        }
      }
    ]);

    return {
      total: campaigns,
      active,
      paused,
      completed,
      draft,
      totalBudget: budgetStats[0]?.totalBudget || 0,
      totalSpent: budgetStats[0]?.totalSpent || 0,
      avgSalesLift: budgetStats[0]?.avgSalesLift || 0
    };
  }
}

export const campaignService = new CampaignService();
export default campaignService;