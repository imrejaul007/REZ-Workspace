import { v4 as uuidv4 } from 'uuid';
import { Campaign, ScheduleEvent, AIMarketingManager } from '../models';
import { CampaignType, CampaignStatus, CampaignPerformance } from '../types';
import logger from 'utils/logger.js';

export interface CreateCampaignParams {
  merchantId: string;
  managerId: string;
  type: CampaignType;
  name: string;
  headline: string;
  body: string;
  imageUrl?: string;
  callToAction?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  platform?: string;
}

export interface CampaignExecutionResult {
  success: boolean;
  campaignId?: string;
  scheduledEvents?: string[];
  message: string;
  metrics?: CampaignPerformance;
}

export class CampaignService {
  /**
   * Create and execute a new marketing campaign
   */
  async executeCampaign(params: CreateCampaignParams): Promise<CampaignExecutionResult> {
    logger.info(`Executing campaign for merchant: ${params.merchantId}`);

    const campaignId = `CAMP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const scheduledEvents: string[] = [];

    try {
      // Create campaign
      const campaign = new Campaign({
        campaignId,
        merchantId: params.merchantId,
        managerId: params.managerId,
        type: params.type,
        status: params.startDate ? 'scheduled' : 'active',
        name: params.name,
        content: {
          headline: params.headline,
          body: params.body,
          imageUrl: params.imageUrl,
          callToAction: params.callToAction,
        },
        budget: params.budget,
        schedule: {
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString(),
          frequency: params.frequency,
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          reach: 0,
          engagement: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
        },
      });

      await campaign.save();

      // Schedule recurring posts if frequency is set
      if (params.frequency && params.frequency !== 'once' && params.startDate) {
        const events = await this.scheduleRecurringContent(params, campaignId);
        scheduledEvents.push(...events);
      }

      // Update manager's active campaigns
      const manager = await AIMarketingManager.findOne({ merchantId: params.merchantId });
      if (manager) {
        manager.activeCampaigns.push({
          campaignId,
          type: params.type,
          status: params.startDate ? 'scheduled' : 'active',
          name: params.name,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString(),
          budget: params.budget,
          performance: campaign.performance,
          content: {
            headline: params.headline,
            body: params.body,
            imageUrl: params.imageUrl,
            callToAction: params.callToAction,
          },
        });
        await manager.save();
      }

      logger.info(`Campaign created: ${campaignId}`);

      return {
        success: true,
        campaignId,
        scheduledEvents,
        message: 'Campaign created and scheduled successfully',
        metrics: campaign.performance,
      };
    } catch (error) {
      logger.error(`Failed to execute campaign: ${error}`);
      return {
        success: false,
        message: `Campaign execution failed: ${error}`,
      };
    }
  }

  /**
   * Schedule recurring content for a campaign
   */
  private async scheduleRecurringContent(
    params: CreateCampaignParams,
    campaignId: string
  ): Promise<string[]> {
    const eventIds: string[] = [];
    const { frequency, startDate, endDate } = params;

    if (!startDate || !frequency) {
      return eventIds;
    }

    const now = new Date();
    const end = endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    let nextDate = new Date(startDate);
    let iterations = 0;
    const maxIterations = frequency === 'daily' ? 30 : frequency === 'weekly' ? 12 : 4;

    while (nextDate <= end && iterations < maxIterations) {
      if (nextDate >= now) {
        const eventId = `EVT-${uuidv4().substring(0, 8).toUpperCase()}`;
        eventIds.push(eventId);

        const event = new ScheduleEvent({
          eventId,
          merchantId: params.merchantId,
          managerId: params.managerId,
          campaignId,
          type: 'post',
          content: params.body,
          scheduledFor: nextDate,
          platform: params.platform,
          status: 'pending',
        });

        await event.save();
      }

      // Calculate next date based on frequency
      switch (frequency) {
        case 'daily':
          nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextDate = new Date(nextDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }

      iterations++;
    }

    return eventIds;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return false;
    }

    campaign.status = 'paused';
    await campaign.save();

    // Update manager
    const manager = await AIMarketingManager.findOne({ merchantId: campaign.merchantId });
    if (manager) {
      const idx = manager.activeCampaigns.findIndex(c => c.campaignId === campaignId);
      if (idx !== -1) {
        manager.activeCampaigns[idx].status = 'paused';
        await manager.save();
      }
    }

    // Cancel pending scheduled events
    await ScheduleEvent.updateMany(
      { campaignId, status: 'pending' },
      { status: 'cancelled' }
    );

    return true;
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<boolean> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign || campaign.status !== 'paused') {
      return false;
    }

    campaign.status = 'active';
    await campaign.save();

    // Update manager
    const manager = await AIMarketingManager.findOne({ merchantId: campaign.merchantId });
    if (manager) {
      const idx = manager.activeCampaigns.findIndex(c => c.campaignId === campaignId);
      if (idx !== -1) {
        manager.activeCampaigns[idx].status = 'active';
        await manager.save();
      }
    }

    return true;
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: string): Promise<boolean> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return false;
    }

    campaign.status = 'completed';
    await campaign.save();

    // Update manager
    const manager = await AIMarketingManager.findOne({ merchantId: campaign.merchantId });
    if (manager) {
      const idx = manager.activeCampaigns.findIndex(c => c.campaignId === campaignId);
      if (idx !== -1) {
        manager.activeCampaigns[idx].status = 'completed';
        await manager.save();
      }
    }

    return true;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    const scheduledEvents = await ScheduleEvent.find({ campaignId });

    return {
      campaign: {
        campaignId: campaign.campaignId,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget,
        createdAt: campaign.createdAt,
      },
      performance: campaign.performance,
      schedule: {
        startDate: campaign.schedule?.startDate,
        endDate: campaign.schedule?.endDate,
        frequency: campaign.schedule?.frequency,
      },
      events: {
        total: scheduledEvents.length,
        pending: scheduledEvents.filter(e => e.status === 'pending').length,
        sent: scheduledEvents.filter(e => e.status === 'sent').length,
        failed: scheduledEvents.filter(e => e.status === 'failed').length,
      },
    };
  }

  /**
   * Optimize campaign based on performance
   */
  async optimizeCampaign(campaignId: string, optimizationType: string): Promise<any> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    const recommendations: string[] = [];

    // Analyze performance and provide recommendations
    const { performance } = campaign;

    if (performance.impressions > 0) {
      const ctr = (performance.clicks / performance.impressions) * 100;

      if (ctr < 1) {
        recommendations.push('Consider improving ad creative and headline to increase click-through rate');
      }

      if (performance.clicks > 0) {
        const cpc = performance.spend / performance.clicks;
        if (cpc > 5) {
          recommendations.push('High cost-per-click detected. Consider refining targeting or ad copy');
        }
      }

      if (performance.conversions > 0) {
        const conversionRate = (performance.conversions / performance.clicks) * 100;
        if (conversionRate < 2) {
          recommendations.push('Low conversion rate. Review landing page and call-to-action');
        }
      }
    }

    // Generate optimizations based on type
    switch (optimizationType) {
      case 'creative':
        recommendations.push('Test multiple ad variations to identify best performing creative');
        recommendations.push('Use high-contrast images and clear value proposition');
        break;
      case 'targeting':
        recommendations.push('Review audience demographics and adjust targeting');
        recommendations.push('Exclude low-performing locations and times');
        break;
      case 'budget':
        recommendations.push('Consider increasing budget for high-performing time periods');
        recommendations.push('Pause lowest performing days/hours to improve efficiency');
        break;
    }

    return {
      campaignId,
      currentPerformance: performance,
      recommendations,
      optimizationType,
    };
  }
}

export const campaignService = new CampaignService();
export default campaignService;