import { VideoCampaign, IVideoCampaignDocument } from '../models';
import { CreateCampaignRequest, SetTargetingRequest, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { recordCampaignCreated, campaignBudgetSpent } from '../utils/metrics';
import { config } from '../config';

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<IVideoCampaignDocument> {
    logger.info('Creating campaign', { name: data.name, advertiserId: data.advertiserId });

    // Validate budget
    if (data.budget.total < config.campaign.minBudget) {
      const error = new Error(`Budget must be at least ${config.campaign.minBudget}`);
      (error as any).code = 'BUDGET_TOO_LOW';
      throw error;
    }

    if (data.budget.total > config.campaign.maxBudget) {
      const error = new Error(`Budget cannot exceed ${config.campaign.maxBudget}`);
      (error as any).code = 'BUDGET_TOO_HIGH';
      throw error;
    }

    const campaign = new VideoCampaign({
      name: data.name,
      advertiserId: data.advertiserId,
      videoId: data.videoId,
      targeting: data.targeting || {},
      budget: {
        total: data.budget.total,
        spent: 0,
        daily: data.budget.daily,
        currency: data.budget.currency || 'INR',
      },
      schedule: data.schedule || {
        startDate: new Date(),
      },
      status: 'draft',
      priority: data.priority || config.campaign.defaultPriority,
    });

    await campaign.save();
    recordCampaignCreated('draft');

    logger.info('Campaign created successfully', { campaignId: campaign._id });
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<IVideoCampaignDocument | null> {
    return VideoCampaign.findById(id);
  }

  /**
   * Get campaign or throw error
   */
  async getCampaignOrFail(id: string): Promise<IVideoCampaignDocument> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      const error = new Error(`Campaign not found: ${id}`);
      (error as any).code = 'CAMPAIGN_NOT_FOUND';
      throw error;
    }
    return campaign;
  }

  /**
   * List campaigns
   */
  async listCampaigns(params: {
    page?: number;
    limit?: number;
    status?: string;
    advertiserId?: string;
    videoId?: string;
  }): Promise<PaginatedResponse<IVideoCampaignDocument>> {
    const { page = 1, limit = 20, status, advertiserId, videoId } = params;

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (advertiserId) query.advertiserId = advertiserId;
    if (videoId) query.videoId = videoId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      VideoCampaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VideoCampaign.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    id: string,
    data: Partial<{
      name: string;
      targeting: any;
      budget: { total?: number; daily?: number };
      schedule: { startDate?: Date; endDate?: Date };
      status: string;
      priority: number;
    }>
  ): Promise<IVideoCampaignDocument> {
    logger.info('Updating campaign', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);

    // Update allowed fields
    if (data.name) campaign.name = data.name;
    if (data.targeting) campaign.targeting = { ...campaign.targeting, ...data.targeting };
    if (data.budget) {
      if (data.budget.total) campaign.budget.total = data.budget.total;
      if (data.budget.daily !== undefined) campaign.budget.daily = data.budget.daily;
    }
    if (data.schedule) {
      if (data.schedule.startDate) campaign.schedule.startDate = data.schedule.startDate;
      if (data.schedule.endDate !== undefined) campaign.schedule.endDate = data.schedule.endDate;
    }
    if (data.status) campaign.status = data.status as any;
    if (data.priority) campaign.priority = data.priority;

    await campaign.save();

    logger.info('Campaign updated successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Activate campaign
   */
  async activateCampaign(id: string): Promise<IVideoCampaignDocument> {
    logger.info('Activating campaign', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);

    if (campaign.budget.spent >= campaign.budget.total) {
      const error = new Error('Cannot activate campaign with exhausted budget');
      (error as any).code = 'BUDGET_EXHAUSTED';
      throw error;
    }

    campaign.status = 'active';
    await campaign.save();
    recordCampaignCreated('active');

    logger.info('Campaign activated successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string): Promise<IVideoCampaignDocument> {
    logger.info('Pausing campaign', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);
    campaign.status = 'paused';
    await campaign.save();

    logger.info('Campaign paused successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Complete campaign
   */
  async completeCampaign(id: string): Promise<IVideoCampaignDocument> {
    logger.info('Completing campaign', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);
    campaign.status = 'completed';
    await campaign.save();

    logger.info('Campaign completed successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Delete campaign (archive)
   */
  async deleteCampaign(id: string): Promise<IVideoCampaignDocument> {
    logger.info('Archiving campaign', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);
    campaign.status = 'archived';
    await campaign.save();

    logger.info('Campaign archived successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Set targeting
   */
  async setTargeting(id: string, targeting: SetTargetingRequest): Promise<IVideoCampaignDocument> {
    logger.info('Setting campaign targeting', { campaignId: id });

    const campaign = await this.getCampaignOrFail(id);
    campaign.targeting = {
      demographics: targeting.demographics || campaign.targeting.demographics,
      devices: targeting.devices || campaign.targeting.devices,
      platforms: targeting.platforms || campaign.targeting.platforms,
      timeSlots: targeting.timeSlots || campaign.targeting.timeSlots,
      customRules: targeting.customRules || campaign.targeting.customRules,
    };
    await campaign.save();

    logger.info('Campaign targeting updated successfully', { campaignId: id });
    return campaign;
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(id: string): Promise<{
    budget: { total: number; spent: number; remaining: number; utilization: number };
    schedule: { startDate: Date; endDate?: Date; isActive: boolean };
    status: string;
    priority: number;
  }> {
    const campaign = await this.getCampaignOrFail(id);

    return {
      budget: {
        total: campaign.budget.total,
        spent: campaign.budget.spent,
        remaining: campaign.budget.total - campaign.budget.spent,
        utilization: campaign.budget.total > 0
          ? (campaign.budget.spent / campaign.budget.total) * 100
          : 0,
      },
      schedule: {
        startDate: campaign.schedule.startDate,
        endDate: campaign.schedule.endDate,
        isActive: campaign.isActive,
      },
      status: campaign.status,
      priority: campaign.priority,
    };
  }

  /**
   * Add spending to campaign
   */
  async addSpending(id: string, amount: number): Promise<void> {
    logger.info('Adding spending to campaign', { campaignId: id, amount });

    const campaign = await this.getCampaignOrFail(id);

    if (campaign.budget.spent + amount > campaign.budget.total) {
      const error = new Error('Spending would exceed budget');
      (error as any).code = 'BUDGET_EXCEEDED';
      throw error;
    }

    campaign.budget.spent += amount;
    await campaign.save();

    campaignBudgetSpent.inc({ advertiserId: campaign.advertiserId }, amount);

    // Auto-pause if budget exhausted
    if (campaign.budget.spent >= campaign.budget.total) {
      campaign.status = 'paused';
      await campaign.save();
      logger.info('Campaign auto-paused due to budget exhaustion', { campaignId: id });
    }
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<IVideoCampaignDocument[]> {
    return VideoCampaign.findActive();
  }

  /**
   * Get campaigns by advertiser
   */
  async getCampaignsByAdvertiser(advertiserId: string): Promise<IVideoCampaignDocument[]> {
    return VideoCampaign.find({ advertiserId }).sort({ createdAt: -1 });
  }

  /**
   * Get campaigns by video
   */
  async getCampaignsByVideo(videoId: string): Promise<IVideoCampaignDocument[]> {
    return VideoCampaign.find({ videoId }).sort({ createdAt: -1 });
  }

  /**
   * Get active campaigns count
   */
  async getActiveCampaignsCount(): Promise<number> {
    return VideoCampaign.countDocuments({ status: 'active' });
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(id: string, newName?: string): Promise<IVideoCampaignDocument> {
    logger.info('Duplicating campaign', { campaignId: id });

    const original = await this.getCampaignOrFail(id);

    const duplicate = new VideoCampaign({
      name: newName || `${original.name} (Copy)`,
      advertiserId: original.advertiserId,
      videoId: original.videoId,
      targeting: { ...original.targeting },
      budget: {
        total: original.budget.total,
        spent: 0,
        daily: original.budget.daily,
        currency: original.budget.currency,
      },
      schedule: {
        startDate: new Date(),
        endDate: undefined,
      },
      status: 'draft',
      priority: original.priority,
    });

    await duplicate.save();
    recordCampaignCreated('draft');

    logger.info('Campaign duplicated successfully', {
      originalId: id,
      newId: duplicate._id,
    });
    return duplicate;
  }
}

export const campaignService = new CampaignService();
export default campaignService;