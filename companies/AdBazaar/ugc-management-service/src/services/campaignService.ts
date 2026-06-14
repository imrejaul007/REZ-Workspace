import { UGCCampaign, IUGCCampaign, UGCContent } from '../models';
import { logger } from '../config/logger';

interface CreateCampaignInput {
  name: string;
  brandId: string;
  hashtags: string[];
  mentions?: string[];
  startDate: Date;
  endDate: Date;
  autoModeration?: boolean;
  approvalRequired?: boolean;
  moderationRules?: {
    minFollowers?: number;
    maxFollowers?: number;
    excludeHashtags?: string[];
    requireHashtags?: string[];
    sentimentThreshold?: number;
    excludeAccounts?: string[];
  };
  displaySettings?: {
    autoDisplay?: boolean;
    displayDuration?: number;
    rotationSpeed?: number;
  };
}

interface UpdateCampaignInput {
  name?: string;
  hashtags?: string[];
  mentions?: string[];
  startDate?: Date;
  endDate?: Date;
  autoModeration?: boolean;
  approvalRequired?: boolean;
  moderationRules?: any;
  displaySettings?: any;
}

class CampaignService {
  /**
   * Create a new UGC campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<IUGCCampaign> {
    const campaign = await UGCCampaign.create({
      name: input.name,
      brandId: input.brandId,
      hashtags: input.hashtags,
      mentions: input.mentions || [],
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'active',
      autoModeration: input.autoModeration ?? true,
      approvalRequired: input.approvalRequired ?? true,
      moderationRules: input.moderationRules || {},
      displaySettings: {
        autoDisplay: input.displaySettings?.autoDisplay ?? false,
        displayDuration: input.displaySettings?.displayDuration ?? 5000,
        rotationSpeed: input.displaySettings?.rotationSpeed ?? 3000
      },
      stats: {
        collected: 0,
        approved: 0,
        displayed: 0,
        rightsGranted: 0
      }
    });

    logger.info(`Campaign created: ${campaign._id}`, { name: campaign.name, brandId: campaign.brandId });

    return campaign;
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<IUGCCampaign> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (input.name) campaign.name = input.name;
    if (input.hashtags) campaign.hashtags = input.hashtags;
    if (input.mentions) campaign.mentions = input.mentions;
    if (input.startDate) campaign.startDate = input.startDate;
    if (input.endDate) campaign.endDate = input.endDate;
    if (input.autoModeration !== undefined) campaign.autoModeration = input.autoModeration;
    if (input.approvalRequired !== undefined) campaign.approvalRequired = input.approvalRequired;
    if (input.moderationRules) campaign.moderationRules = { ...campaign.moderationRules, ...input.moderationRules };
    if (input.displaySettings) campaign.displaySettings = { ...campaign.displaySettings, ...input.displaySettings };

    await campaign.save();

    logger.info(`Campaign updated: ${campaignId}`);
    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<IUGCCampaign> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = 'paused';
    await campaign.save();

    logger.info(`Campaign paused: ${campaignId}`);
    return campaign;
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<IUGCCampaign> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'paused') {
      throw new Error('Can only resume paused campaigns');
    }

    campaign.status = 'active';
    await campaign.save();

    logger.info(`Campaign resumed: ${campaignId}`);
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<IUGCCampaign | null> {
    return UGCCampaign.findById(campaignId);
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(filters: {
    brandId?: string;
    status?: 'active' | 'paused' | 'completed';
    limit?: number;
    offset?: number;
  }): Promise<{ campaigns: IUGCCampaign[]; total: number }> {
    const query: any = {};

    if (filters.brandId) {
      query.brandId = filters.brandId;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const [campaigns, total] = await Promise.all([
      UGCCampaign.find(query)
        .sort({ createdAt: -1 })
        .skip(filters.offset || 0)
        .limit(filters.limit || 50),
      UGCCampaign.countDocuments(query)
    ]);

    return { campaigns, total };
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(campaignId: string): Promise<{
    campaign: IUGCCampaign;
    contentByStatus: Record<string, number>;
    contentByPlatform: Record<string, number>;
    totalEngagement: { likes: number; comments: number; shares: number };
    topContent: any[];
  }> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get content stats
    const contentStats = await UGCContent.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$engagement.likes' },
          totalComments: { $sum: '$engagement.comments' },
          totalShares: { $sum: '$engagement.shares' }
        }
      }
    ]);

    // Get content by status
    const contentByStatus = await UGCContent.aggregate([
      { $match: { campaignId: campaign._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get content by platform
    const contentByPlatform = await UGCContent.aggregate([
      { $match: { campaignId: campaign._id } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    // Get top content by engagement
    const topContent = await UGCContent.find({ campaignId: campaign._id })
      .sort({ 'engagement.likes': -1 })
      .limit(10)
      .select('caption mediaUrl platform engagement author.displayName');

    const stats = {
      campaign,
      contentByStatus: Object.fromEntries(contentByStatus.map(s => [s._id, s.count])),
      contentByPlatform: Object.fromEntries(contentByPlatform.map(p => [p._id, p.count])),
      totalEngagement: contentStats[0] || { likes: 0, comments: 0, shares: 0 },
      topContent
    };

    logger.info(`Campaign stats retrieved: ${campaignId}`);
    return stats;
  }

  /**
   * Mark content as displayed
   */
  async markContentDisplayed(ugcId: string, displayLocation: string): Promise<void> {
    const content = await UGCContent.findById(ugcId);
    if (!content) {
      throw new Error('Content not found');
    }

    if (!content.displayedOn.includes(displayLocation)) {
      content.displayedOn.push(displayLocation);
      content.status = 'displayed';
      await content.save();

      // Update campaign stats
      if (content.campaignId) {
        await UGCCampaign.findByIdAndUpdate(content.campaignId, {
          $inc: { 'stats.displayed': 1 }
        });
      }
    }
  }

  /**
   * Complete campaign
   */
  async completeCampaign(campaignId: string): Promise<IUGCCampaign> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = 'completed';
    await campaign.save();

    logger.info(`Campaign completed: ${campaignId}`);
    return campaign;
  }

  /**
   * Delete campaign (soft delete by marking as completed)
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Unlink all content from this campaign
    await UGCContent.updateMany(
      { campaignId: campaign._id },
      { $unset: { campaignId: 1 } }
    );

    await UGCCampaign.findByIdAndDelete(campaignId);

    logger.info(`Campaign deleted: ${campaignId}`);
  }
}

export const campaignService = new CampaignService();