import { v4 as uuidv4 } from 'uuid';
import { CTVCampaignModel, CTVCampaignDocument } from '../models/index.js';
import { redisService } from './redis.service.js';
import { CTVCampaign, PaginationParams, PaginatedResponse } from '../types/index.js';

class CampaignService {
  async create(data: Partial<CTVCampaign>): Promise<CTVCampaignDocument> {
    const campaignId = uuidv4();

    const campaign = new CTVCampaignModel({
      ...data,
      campaignId,
      metrics: {
        impressions: 0,
        views: 0,
        completions: 0,
        clicks: 0,
        skips: 0,
        revenue: 0,
        ...data.metrics,
      },
      'budget.spent': 0,
    });

    return campaign.save();
  }

  async findById(campaignId: string): Promise<CTVCampaignDocument | null> {
    return CTVCampaignModel.findOne({ campaignId });
  }

  async findByAdvertiser(advertiserId: string, pagination?: PaginationParams): Promise<PaginatedResponse<CTVCampaignDocument>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [campaigns, total] = await Promise.all([
      CTVCampaignModel.find({ advertiserId }).sort(sort).skip(skip).limit(limit),
      CTVCampaignModel.countDocuments({ advertiserId }),
    ]);

    return {
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async findActiveCampaigns(filters: {
    format?: string;
    geo?: string;
    deviceType?: string;
    appId?: string;
    contentCategory?: string;
  }): Promise<CTVCampaignDocument[]> {
    const now = new Date();

    const query: Record<string, unknown> = {
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    };

    if (filters.format) {
      query.format = filters.format;
    }

    if (filters.geo) {
      query['targeting.geo'] = { $exists: false };
    }

    if (filters.deviceType) {
      query.$and = [
        {
          $or: [
            { 'targeting.deviceTypes': { $exists: false } },
            { 'targeting.deviceTypes': { $size: 0 } },
            { 'targeting.deviceTypes': filters.deviceType },
          ],
        },
      ];
    }

    // Filter by budget availability
    query['budget.spent'] = { $lt: '$budget.total' };

    return CTVCampaignModel.find(query)
      .sort({ 'bid.amount': -1, 'metrics.impressions': 1 })
      .limit(100);
  }

  async update(campaignId: string, data: Partial<CTVCampaign>): Promise<CTVCampaignDocument | null> {
    return CTVCampaignModel.findOneAndUpdate(
      { campaignId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async updateStatus(campaignId: string, status: 'active' | 'paused' | 'completed' | 'draft'): Promise<CTVCampaignDocument | null> {
    return CTVCampaignModel.findOneAndUpdate(
      { campaignId },
      { $set: { status } },
      { new: true }
    );
  }

  async delete(campaignId: string): Promise<boolean> {
    const result = await CTVCampaignModel.deleteOne({ campaignId });
    return result.deletedCount > 0;
  }

  async incrementMetrics(campaignId: string, metric: keyof CTVCampaign['metrics'], value: number = 1): Promise<void> {
    const update: Record<string, unknown> = {};
    update[`metrics.${metric}`] = value;

    await CTVCampaignModel.findOneAndUpdate(
      { campaignId },
      { $inc: update }
    );
  }

  async trackImpression(campaignId: string, revenue: number): Promise<void> {
    await Promise.all([
      this.incrementMetrics(campaignId, 'impressions'),
      redisService.trackSpend(campaignId, revenue),
      CTVCampaignModel.findOneAndUpdate(
        { campaignId },
        { $inc: { 'budget.spent': revenue } }
      ),
    ]);
  }

  async trackView(campaignId: string): Promise<void> {
    await this.incrementMetrics(campaignId, 'views');
  }

  async trackCompletion(campaignId: string): Promise<void> {
    await this.incrementMetrics(campaignId, 'completions');
  }

  async trackClick(campaignId: string): Promise<void> {
    await this.incrementMetrics(campaignId, 'clicks');
  }

  async trackSkip(campaignId: string): Promise<void> {
    await this.incrementMetrics(campaignId, 'skips');
  }

  async checkFrequencyCap(deviceId: string, campaignId: string): Promise<boolean> {
    const campaign = await this.findById(campaignId);
    if (!campaign) {
      return false;
    }

    const currentCount = await redisService.getFrequency(deviceId, campaignId);
    return currentCount < campaign.frequency.maxImpressions;
  }

  async incrementFrequency(deviceId: string, campaignId: string): Promise<number> {
    const campaign = await this.findById(campaignId);
    if (!campaign) {
      return 0;
    }

    return redisService.incrementFrequency(deviceId, campaignId, campaign.frequency.windowHours);
  }

  async getDailySpend(campaignId: string): Promise<number> {
    return redisService.getDailySpend(campaignId);
  }

  async getCampaignStats(campaignId: string): Promise<CTVCampaignDocument | null> {
    return CTVCampaignModel.findOne({ campaignId });
  }
}

export const campaignService = new CampaignService();