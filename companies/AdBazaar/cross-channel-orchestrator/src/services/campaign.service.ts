import { v4 as uuidv4 } from 'uuid';
import { CrossChannelCampaignModel, CrossChannelCampaignDocument } from '../models';
import { ChannelDispatcher } from './channel-dispatcher.service';
import { MetricsService } from './metrics.service';
import { redisService } from './redis.service';
import { logger } from './logger.service';
import {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignStatistics,
  CrossChannelCampaign,
  CampaignStatus,
  Channel,
  CampaignMetrics,
} from '../types';
import { config } from '../config';

export class CampaignService {
  private channelDispatcher: ChannelDispatcher;
  private metricsService: MetricsService;

  constructor() {
    this.channelDispatcher = new ChannelDispatcher();
    this.metricsService = new MetricsService();
  }

  /**
   * Create a new cross-channel campaign
   */
  async createCampaign(
    advertiserId: string,
    request: CreateCampaignRequest
  ): Promise<CrossChannelCampaignDocument> {
    logger.info('Creating cross-channel campaign', { advertiserId, name: request.name });

    // Generate campaign ID
    const campaignId = `CCO-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Allocate budget by channel
    const budgetByChannel = this.allocateBudgetByChannel(request.channels, request.budget.total, request.budget.byChannel);

    // Create campaign document
    const campaign = new CrossChannelCampaignModel({
      campaignId,
      advertiserId,
      name: request.name,
      description: request.description,
      objective: request.objective,
      channels: request.channels,
      budget: {
        total: request.budget.total,
        byChannel: budgetByChannel,
        spent: 0,
        currency: 'INR',
      },
      targeting: request.targeting,
      content: request.content,
      scheduling: {
        startDate: new Date(request.scheduling.startDate),
        endDate: new Date(request.scheduling.endDate),
        frequency: request.scheduling.frequency,
        optimalTime: request.scheduling.optimalTime,
        timezone: request.scheduling.timezone || 'Asia/Kolkata',
        dayOfWeek: request.scheduling.dayOfWeek,
      },
      status: 'draft',
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0,
        unsubscribed: 0,
        bounced: 0,
        failed: 0,
        byChannel: {},
      },
      abTest: request.abTest?.enabled
        ? {
            enabled: true,
            variants: request.abTest.variants.map((v) => ({
              id: uuidv4(),
              name: v.name,
              content: v.content,
              percentage: v.percentage,
            })),
          }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await campaign.save();
    logger.info('Campaign created successfully', { campaignId, advertiserId });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string, advertiserId?: string): Promise<CrossChannelCampaignDocument | null> {
    const query: Record<string, string> = { campaignId };
    if (advertiserId) {
      query.advertiserId = advertiserId;
    }
    return CrossChannelCampaignModel.findOne(query);
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    advertiserId: string,
    updates: UpdateCampaignRequest
  ): Promise<CrossChannelCampaignDocument | null> {
    // Acquire lock to prevent concurrent updates
    const lockAcquired = await redisService.acquireCampaignLock(campaignId, 30);
    if (!lockAcquired) {
      throw new Error('Campaign is being updated by another process');
    }

    try {
      const campaign = await CrossChannelCampaignModel.findOne({ campaignId, advertiserId });
      if (!campaign) {
        return null;
      }

      // Cannot update active or completed campaigns
      if (campaign.status === 'active' || campaign.status === 'completed') {
        throw new Error(`Cannot update campaign with status: ${campaign.status}`);
      }

      // Apply updates
      if (updates.name !== undefined) campaign.name = updates.name;
      if (updates.description !== undefined) campaign.description = updates.description;
      if (updates.objective !== undefined) campaign.objective = updates.objective;
      if (updates.channels !== undefined) campaign.channels = updates.channels;
      if (updates.budget !== undefined) {
        if (updates.budget.total !== undefined) campaign.budget.total = updates.budget.total;
        if (updates.budget.byChannel !== undefined) {
          campaign.budget.byChannel = {
            ...campaign.budget.byChannel,
            ...updates.budget.byChannel,
          };
        }
      }
      if (updates.targeting !== undefined) campaign.targeting = updates.targeting;
      if (updates.content !== undefined) campaign.content = updates.content;
      if (updates.scheduling !== undefined) {
        campaign.scheduling = {
          ...campaign.scheduling,
          ...updates.scheduling,
        };
      }

      campaign.updatedAt = new Date();
      await campaign.save();

      logger.info('Campaign updated', { campaignId });
      return campaign;
    } finally {
      await redisService.releaseCampaignLock(campaignId);
    }
  }

  /**
   * Launch campaign
   */
  async launchCampaign(campaignId: string, advertiserId: string): Promise<CrossChannelCampaignDocument | null> {
    // Acquire lock
    const lockAcquired = await redisService.acquireCampaignLock(campaignId, 300);
    if (!lockAcquired) {
      throw new Error('Campaign launch in progress by another process');
    }

    try {
      const campaign = await CrossChannelCampaignModel.findOne({ campaignId, advertiserId });
      if (!campaign) {
        return null;
      }

      // Check if can launch
      const canLaunch = campaign.canLaunch();
      if (!canLaunch.canLaunch) {
        throw new Error(canLaunch.reason);
      }

      // Determine initial status
      const now = new Date();
      const startDate = new Date(campaign.scheduling.startDate);

      if (startDate > now) {
        campaign.status = 'scheduled';
      } else {
        campaign.status = 'active';
        campaign.launchedAt = now;
      }

      campaign.updatedAt = now;
      await campaign.save();

      // If active, start sending immediately
      if (campaign.status === 'active') {
        await this.startCampaignExecution(campaign);
      }

      logger.info('Campaign launched', { campaignId, status: campaign.status });
      return campaign;
    } finally {
      await redisService.releaseCampaignLock(campaignId);
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string, advertiserId: string): Promise<CrossChannelCampaignDocument | null> {
    const campaign = await CrossChannelCampaignModel.findOne({ campaignId, advertiserId });
    if (!campaign) {
      return null;
    }

    if (campaign.status !== 'active') {
      throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
    }

    campaign.status = 'paused';
    campaign.pausedAt = new Date();
    campaign.updatedAt = new Date();
    await campaign.save();

    logger.info('Campaign paused', { campaignId });
    return campaign;
  }

  /**
   * Resume paused campaign
   */
  async resumeCampaign(campaignId: string, advertiserId: string): Promise<CrossChannelCampaignDocument | null> {
    const campaign = await CrossChannelCampaignModel.findOne({ campaignId, advertiserId });
    if (!campaign) {
      return null;
    }

    if (campaign.status !== 'paused') {
      throw new Error(`Cannot resume campaign with status: ${campaign.status}`);
    }

    campaign.status = 'active';
    campaign.pausedAt = undefined;
    campaign.updatedAt = new Date();
    await campaign.save();

    logger.info('Campaign resumed', { campaignId });
    return campaign;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStatistics(campaignId: string, advertiserId?: string): Promise<CampaignStatistics | null> {
    const campaign = await this.getCampaign(campaignId, advertiserId);
    if (!campaign) {
      return null;
    }

    const metrics = campaign.metrics;
    const now = new Date();
    const startDate = new Date(campaign.scheduling.startDate);
    const endDate = new Date(campaign.scheduling.endDate);

    // Calculate performance metrics
    const deliveryRate = metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0;
    const openRate = metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0;
    const clickRate = metrics.delivered > 0 ? (metrics.clicked / metrics.delivered) * 100 : 0;
    const conversionRate = metrics.delivered > 0 ? (metrics.converted / metrics.delivered) * 100 : 0;
    const roi = campaign.budget.spent > 0 ? ((metrics.revenue - campaign.budget.spent) / campaign.budget.spent) * 100 : 0;
    const ctr = metrics.clicked > 0 ? (metrics.clicked / metrics.sent) * 100 : 0;

    // Channel breakdown
    const channelBreakdown = campaign.channels.map((channel) => {
      const channelMetrics = metrics.byChannel?.[channel] || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      };
      const channelConfig = config.channels[channel];
      const cost = channelMetrics.sent * channelConfig.costPerMessage;

      return {
        channel,
        sent: channelMetrics.sent || 0,
        delivered: channelMetrics.delivered || 0,
        opened: channelMetrics.opened || 0,
        clicked: channelMetrics.clicked || 0,
        converted: channelMetrics.converted || 0,
        cost,
      };
    });

    return {
      campaignId: campaign.campaignId,
      status: campaign.status,
      metrics,
      performance: {
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
        roi,
        ctr,
      },
      budget: {
        total: campaign.budget.total,
        spent: campaign.budget.spent,
        remaining: campaign.budget.total - campaign.budget.spent,
        byChannel: campaign.budget.byChannel,
      },
      timeline: {
        startDate,
        endDate,
        duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        daysRemaining: Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
      },
      channelBreakdown,
    };
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
  ): Promise<{ campaigns: CrossChannelCampaignDocument[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = { advertiserId };
    if (status) {
      query.status = status;
    }

    const [campaigns, total] = await Promise.all([
      CrossChannelCampaignModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CrossChannelCampaignModel.countDocuments(query),
    ]);

    return { campaigns, total };
  }

  /**
   * Start campaign execution
   */
  private async startCampaignExecution(campaign: CrossChannelCampaignDocument): Promise<void> {
    logger.info('Starting campaign execution', { campaignId: campaign.campaignId });

    // Get target recipients
    const recipients = await this.getTargetRecipients(campaign);

    // Send to each channel
    for (const channel of campaign.channels) {
      const content = campaign.content[channel];
      if (!content) continue;

      try {
        // Determine which content variant to use (A/B test)
        const channelContent = this.selectABTestVariant(campaign, channel, content);

        // Send messages in batches
        const batchSize = config.campaign.maxRecipientsPerBatch;
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize);
          await this.channelDispatcher.send(channel, {
            campaignId: campaign.campaignId,
            recipients: batch,
            content: channelContent,
            budget: campaign.budget.byChannel[channel] || 0,
          });

          // Update metrics
          await this.updateCampaignMetrics(campaign.campaignId, channel, {
            sent: batch.length,
          });
        }
      } catch (error) {
        logger.error(`Failed to send to channel ${channel}`, { campaignId: campaign.campaignId, error });
      }
    }
  }

  /**
   * Get target recipients based on campaign targeting
   */
  private async getTargetRecipients(campaign: CrossChannelCampaignDocument): Promise<string[]> {
    // In a real implementation, this would call audience service
    // For now, return empty array - would be populated from:
    // - campaign.targeting.audienceIds
    // - campaign.targeting.segments
    // - campaign.targeting.customAudience
    logger.info('Getting target recipients', {
      campaignId: campaign.campaignId,
      audienceIds: campaign.targeting.audienceIds?.length || 0,
      segments: campaign.targeting.segments?.length || 0,
    });
    return [];
  }

  /**
   * Select A/B test variant
   */
  private selectABTestVariant(
    campaign: CrossChannelCampaignDocument,
    channel: Channel,
    defaultContent: CrossChannelCampaign['content'][typeof channel]
  ): typeof defaultContent {
    if (!campaign.abTest?.enabled || !campaign.abTest.variants.length) {
      return defaultContent;
    }

    // Random selection based on percentages
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of campaign.abTest.variants) {
      cumulative += variant.percentage;
      if (random <= cumulative) {
        return variant.content[channel] || defaultContent;
      }
    }

    return defaultContent;
  }

  /**
   * Update campaign metrics
   */
  private async updateCampaignMetrics(
    campaignId: string,
    channel: Channel,
    update: Partial<CampaignMetrics>
  ): Promise<void> {
    try {
      const updateObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(update)) {
        updateObj[`metrics.${key}`] = value;
        updateObj[`metrics.byChannel.${channel}.${key}`] = value;
      }

      await CrossChannelCampaignModel.updateOne({ campaignId }, { $inc: updateObj });
    } catch (error) {
      logger.error('Failed to update campaign metrics', { campaignId, channel, error });
    }
  }

  /**
   * Allocate budget by channel
   */
  private allocateBudgetByChannel(
    channels: Channel[],
    totalBudget: number,
    specifiedBudgets?: Record<string, number>
  ): Record<string, number> {
    const byChannel: Record<string, number> = {};

    if (specifiedBudgets) {
      // Use specified budgets
      for (const channel of channels) {
        byChannel[channel] = specifiedBudgets[channel] || 0;
      }
    } else {
      // Split equally
      const perChannel = totalBudget / channels.length;
      for (const channel of channels) {
        byChannel[channel] = perChannel;
      }
    }

    return byChannel;
  }

  /**
   * Process scheduled campaigns
   */
  async processScheduledCampaigns(): Promise<void> {
    const now = new Date();
    const campaigns = await CrossChannelCampaignModel.find({
      status: 'scheduled',
      'scheduling.startDate': { $lte: now },
    });

    for (const campaign of campaigns) {
      try {
        await this.launchCampaign(campaign.campaignId, campaign.advertiserId);
      } catch (error) {
        logger.error('Failed to process scheduled campaign', { campaignId: campaign.campaignId, error });
      }
    }
  }

  /**
   * Complete expired campaigns
   */
  async completeExpiredCampaigns(): Promise<void> {
    const now = new Date();
    const campaigns = await CrossChannelCampaignModel.find({
      status: 'active',
      'scheduling.endDate': { $lte: now },
    });

    for (const campaign of campaigns) {
      try {
        campaign.status = 'completed';
        campaign.completedAt = now;
        campaign.updatedAt = now;
        await campaign.save();
        logger.info('Campaign completed', { campaignId: campaign.campaignId });
      } catch (error) {
        logger.error('Failed to complete campaign', { campaignId: campaign.campaignId, error });
      }
    }
  }
}

export const campaignService = new CampaignService();
export default campaignService;