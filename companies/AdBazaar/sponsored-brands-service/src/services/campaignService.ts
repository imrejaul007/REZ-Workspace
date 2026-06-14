import { v4 as uuidv4 } from 'uuid';
import { BrandCampaign, IBrandCampaign } from '../models';
import { logger, campaignCounter, activeCampaignsGauge } from '../utils';
import { z } from 'zod';

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  advertiserId: z.string().min(1),
  brandId: z.string().min(1),
  brandName: z.string().min(1),
  keywords: z.array(z.string()).optional().default([]),
  matchTypes: z.array(z.enum(['broad', 'phrase', 'exact'])).optional().default(['broad']),
  budget: z.object({
    daily: z.number().min(0).optional().default(0),
    lifetime: z.number().min(0).optional().default(0)
  }).optional(),
  targeting: z.object({
    categories: z.array(z.string()).optional().default([]),
    products: z.array(z.string()).optional().default([]),
    audiences: z.array(z.string()).optional().default([]),
    ageGroups: z.array(z.string()).optional().default([]),
    gender: z.array(z.string()).optional().default([])
  }).optional(),
  bidStrategy: z.object({
    type: z.enum(['manual', 'auto', 'enhanced']).optional().default('manual'),
    defaultBid: z.number().min(0.01).optional().default(0.5),
    maxBid: z.number().min(0.01).optional().default(10)
  }).optional(),
  schedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional()
  }),
  creativeAssets: z.object({
    headlines: z.array(z.string()).optional().default([]),
    descriptions: z.array(z.string()).optional().default([]),
    logoUrl: z.string().url().optional(),
    bannerUrls: z.array(z.string().url()).optional().default([])
  }).optional()
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  budget: z.object({
    daily: z.number().min(0).optional(),
    lifetime: z.number().min(0).optional()
  }).optional(),
  bidStrategy: z.object({
    type: z.enum(['manual', 'auto', 'enhanced']).optional(),
    defaultBid: z.number().min(0.01).optional(),
    maxBid: z.number().min(0.01).optional()
  }).optional(),
  targeting: z.object({
    categories: z.array(z.string()).optional(),
    products: z.array(z.string()).optional(),
    audiences: z.array(z.string()).optional(),
    ageGroups: z.array(z.string()).optional(),
    gender: z.array(z.string()).optional()
  }).optional(),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable()
  }).optional()
});

export interface CampaignFilters {
  advertiserId?: string;
  brandId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class CampaignService {
  async create(data: z.infer<typeof CreateCampaignSchema>): Promise<IBrandCampaign> {
    try {
      const campaignId = `sb_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

      const campaign = new BrandCampaign({
        campaignId,
        ...data,
        budget: {
          daily: data.budget?.daily || 0,
          lifetime: data.budget?.lifetime || 0,
          spent: 0
        },
        targeting: data.targeting || {
          categories: [],
          products: [],
          audiences: [],
          ageGroups: [],
          gender: []
        },
        bidStrategy: data.bidStrategy || {
          type: 'manual',
          defaultBid: 0.5,
          maxBid: 10
        },
        schedule: {
          startDate: new Date(data.schedule.startDate),
          endDate: data.schedule.endDate ? new Date(data.schedule.endDate) : undefined
        },
        creativeAssets: data.creativeAssets || {
          headlines: [],
          descriptions: [],
          bannerUrls: []
        },
        performance: {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          roas: 0
        },
        settings: {
          allowVideoAds: true,
          allowDisplayAds: true,
          allowSearchAds: true
        },
        status: 'draft'
      });

      await campaign.save();

      campaignCounter.inc({ status: 'created', advertiser_id: data.advertiserId });
      logger.info('Campaign created', { campaignId, advertiserId: data.advertiserId });

      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign', { error, data });
      throw error;
    }
  }

  async getById(campaignId: string): Promise<IBrandCampaign | null> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        logger.warn('Campaign not found', { campaignId });
      }
      return campaign;
    } catch (error) {
      logger.error('Failed to get campaign', { error, campaignId });
      throw error;
    }
  }

  async list(filters: CampaignFilters): Promise<{ campaigns: IBrandCampaign[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};
      if (filters.advertiserId) query.advertiserId = filters.advertiserId;
      if (filters.brandId) query.brandId = filters.brandId;
      if (filters.status) query.status = filters.status;

      const [campaigns, total] = await Promise.all([
        BrandCampaign.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        BrandCampaign.countDocuments(query)
      ]);

      return { campaigns, total };
    } catch (error) {
      logger.error('Failed to list campaigns', { error, filters });
      throw error;
    }
  }

  async update(campaignId: string, data: Partial<z.infer<typeof UpdateCampaignSchema>>): Promise<IBrandCampaign | null> {
    try {
      const updateData: Record<string, unknown> = { ...data };

      if (data.schedule) {
        updateData.schedule = {
          startDate: data.schedule.startDate ? new Date(data.schedule.startDate) : undefined,
          endDate: data.schedule.endDate !== undefined
            ? (data.schedule.endDate === null ? null : new Date(data.schedule.endDate))
            : undefined
        };
      }

      const campaign = await BrandCampaign.findOneAndUpdate(
        { campaignId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (campaign) {
        logger.info('Campaign updated', { campaignId, updates: Object.keys(data) });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to update campaign', { error, campaignId });
      throw error;
    }
  }

  async updatePerformance(campaignId: string, metrics: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    conversions?: number;
    roas?: number;
  }): Promise<IBrandCampaign | null> {
    try {
      const campaign = await BrandCampaign.findOneAndUpdate(
        { campaignId },
        {
          $inc: {
            'performance.impressions': metrics.impressions || 0,
            'performance.clicks': metrics.clicks || 0,
            'performance.spend': metrics.spend || 0,
            'performance.conversions': metrics.conversions || 0
          },
          $set: {
            'performance.roas': metrics.roas || 0
          }
        },
        { new: true }
      );

      if (campaign) {
        impressionsGauge.set({ campaign_id: campaignId }, campaign.performance.impressions);
        clicksGauge.set({ campaign_id: campaignId }, campaign.performance.clicks);
        spendGauge.set({ campaign_id: campaignId }, campaign.performance.spend);
        roasGauge.set({ campaign_id: campaignId }, campaign.performance.roas);
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to update campaign performance', { error, campaignId });
      throw error;
    }
  }

  async changeStatus(campaignId: string, status: 'draft' | 'active' | 'paused' | 'archived'): Promise<IBrandCampaign | null> {
    try {
      const campaign = await BrandCampaign.findOneAndUpdate(
        { campaignId },
        { $set: { status } },
        { new: true }
      );

      if (campaign) {
        campaignCounter.inc({ status, advertiser_id: campaign.advertiserId });
        activeCampaignsGauge.set({ advertiser_id: campaign.advertiserId },
          await BrandCampaign.countDocuments({ advertiserId: campaign.advertiserId, status: 'active' })
        );
        logger.info('Campaign status changed', { campaignId, status });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to change campaign status', { error, campaignId, status });
      throw error;
    }
  }

  async delete(campaignId: string): Promise<boolean> {
    try {
      const result = await BrandCampaign.deleteOne({ campaignId });
      if (result.deletedCount > 0) {
        logger.info('Campaign deleted', { campaignId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete campaign', { error, campaignId });
      throw error;
    }
  }
}

export const campaignService = new CampaignService();