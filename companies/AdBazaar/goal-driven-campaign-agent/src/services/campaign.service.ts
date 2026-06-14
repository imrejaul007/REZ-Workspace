import { v4 as uuidv4 } from 'uuid';
import { CampaignModel, ICampaignDocument } from '../models/campaign.model.js';
import { setCache, getCache, deleteCache } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import {
  CreateCampaignRequest,
  GoalType,
  CampaignStatus,
  Goal
} from '../types/index.js';
import {
  campaignsCreated,
  campaignsByStatus,
  campaignBudget,
  campaignConversions
} from '../utils/metrics.js';

export class CampaignService {
  /**
   * Create a new goal-driven campaign
   */
  async createCampaign(
    request: CreateCampaignRequest
  ): Promise<ICampaignDocument> {
    logger.info('Creating new goal-driven campaign', {
      advertiserId: request.advertiserId,
      name: request.name,
      goalType: request.goal.type
    });

    const campaign = new CampaignModel({
      campaignId: `camp_${uuidv4()}`,
      agentId: `agent_${uuidv4()}`,
      advertiserId: request.advertiserId,
      name: request.name,
      goal: request.goal,
      currentStatus: {
        achieved: 0,
        progress: 0,
        spend: 0,
        cpa: 0,
        roas: 0
      },
      agentActions: [],
      decisions: {
        audienceTargeted: [],
        creativesUsed: [],
        channelsActive: [],
        bidStrategy: 'auto'
      },
      status: 'planning',
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Campaign created',
          context: { goal: request.goal }
        }
      ]
    });

    await campaign.save();

    // Update metrics
    campaignsCreated.inc();
    campaignsByStatus.inc('planning');
    campaignBudget.inc({ goal_type: request.goal.type }, request.goal.budget);

    // Cache the campaign
    await this.cacheCampaign(campaign);

    logger.info('Campaign created successfully', {
      campaignId: campaign.campaignId,
      agentId: campaign.agentId
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<ICampaignDocument | null> {
    // Try cache first
    const cached = await getCache<ICampaignDocument>(`campaign:${campaignId}`);
    if (cached) {
      return cached;
    }

    const campaign = await CampaignModel.findOne({ campaignId });
    if (campaign) {
      await this.cacheCampaign(campaign);
    }

    return campaign;
  }

  /**
   * Get campaign by ID with cache check
   */
  async getCampaignById(campaignId: string): Promise<ICampaignDocument | null> {
    return this.getCampaign(campaignId);
  }

  /**
   * Update campaign goal
   */
  async updateGoal(
    campaignId: string,
    updates: Partial<Goal>
  ): Promise<ICampaignDocument | null> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    // Update goal fields
    if (updates.type) campaign.goal.type = updates.type;
    if (updates.target) campaign.goal.target = updates.target;
    if (updates.budget) campaign.goal.budget = updates.budget;
    if (updates.deadline) campaign.goal.deadline = updates.deadline;

    // Recalculate progress
    campaign.currentStatus.progress = Math.min(
      100,
      (campaign.currentStatus.achieved / campaign.goal.target) * 100
    );

    campaign.addLog('info', 'Goal updated', { updates });

    await campaign.save();
    await this.cacheCampaign(campaign);

    logger.info('Campaign goal updated', {
      campaignId,
      updates
    });

    return campaign;
  }

  /**
   * Update campaign status
   */
  async updateStatus(
    campaignId: string,
    status: CampaignStatus
  ): Promise<ICampaignDocument | null> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    const previousStatus = campaign.status;
    campaign.status = status;

    campaign.addLog('info', `Status changed from ${previousStatus} to ${status}`, {
      previousStatus,
      newStatus: status
    });

    await campaign.save();

    // Update metrics
    campaignsByStatus.dec({ status: previousStatus });
    campaignsByStatus.inc({ status });

    await this.cacheCampaign(campaign);

    logger.info('Campaign status updated', {
      campaignId,
      previousStatus,
      newStatus: status
    });

    return campaign;
  }

  /**
   * Add agent action to campaign
   */
  async addAgentAction(
    campaignId: string,
    action: string,
    details: Record<string, unknown>,
    result?: Record<string, unknown>
  ): Promise<ICampaignDocument | null> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    campaign.addAction(action, details, result);
    campaign.addLog('info', `Agent action: ${action}`, { details, result });

    await campaign.save();
    await this.cacheCampaign(campaign);

    return campaign;
  }

  /**
   * Update campaign metrics
   */
  async updateMetrics(
    campaignId: string,
    metrics: {
      achieved?: number;
      spend?: number;
      revenue?: number;
    }
  ): Promise<ICampaignDocument | null> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    if (metrics.achieved !== undefined) {
      campaign.currentStatus.achieved = metrics.achieved;
      campaign.currentStatus.progress = Math.min(
        100,
        (metrics.achieved / campaign.goal.target) * 100
      );

      // Update conversions metric
      campaignConversions.set(
        { goal_type: campaign.goal.type },
        campaign.currentStatus.achieved
      );
    }

    if (metrics.spend !== undefined) {
      campaign.currentStatus.spend = metrics.spend;

      // Recalculate CPA
      if (campaign.currentStatus.achieved > 0) {
        campaign.currentStatus.cpa =
          metrics.spend / campaign.currentStatus.achieved;
      }
    }

    if (metrics.revenue !== undefined && metrics.spend !== undefined) {
      // Calculate ROAS
      if (metrics.spend > 0) {
        campaign.currentStatus.roas = metrics.revenue / metrics.spend;
      }
    }

    await campaign.save();
    await this.cacheCampaign(campaign);

    return campaign;
  }

  /**
   * Update campaign decisions
   */
  async updateDecisions(
    campaignId: string,
    decisions: {
      audienceTargeted?: string[];
      creativesUsed?: string[];
      channelsActive?: string[];
      bidStrategy?: string;
    }
  ): Promise<ICampaignDocument | null> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    if (decisions.audienceTargeted) {
      campaign.decisions.audienceTargeted = decisions.audienceTargeted;
    }
    if (decisions.creativesUsed) {
      campaign.decisions.creativesUsed = decisions.creativesUsed;
    }
    if (decisions.channelsActive) {
      campaign.decisions.channelsActive = decisions.channelsActive;
    }
    if (decisions.bidStrategy) {
      campaign.decisions.bidStrategy = decisions.bidStrategy;
    }

    campaign.addLog('info', 'Decisions updated', { decisions });

    await campaign.save();
    await this.cacheCampaign(campaign);

    return campaign;
  }

  /**
   * Get agent actions for campaign
   */
  async getAgentActions(
    campaignId: string,
    limit = 50,
    offset = 0
  ): Promise<{ actions: any[]; total: number }> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return { actions: [], total: 0 };
    }

    const actions = campaign.agentActions.slice(offset, offset + limit);
    return {
      actions,
      total: campaign.agentActions.length
    };
  }

  /**
   * Get logs for campaign
   */
  async getLogs(
    campaignId: string,
    limit = 100,
    offset = 0
  ): Promise<{ logs: any[]; total: number }> {
    const campaign = await CampaignModel.findOne({ campaignId });
    if (!campaign) {
      return { logs: [], total: 0 };
    }

    const logs = campaign.logs.slice(offset, offset + limit);
    return {
      logs,
      total: campaign.logs.length
    };
  }

  /**
   * Get campaigns by advertiser
   */
  async getCampaignsByAdvertiser(
    advertiserId: string,
    limit = 50
  ): Promise<ICampaignDocument[]> {
    return CampaignModel.find({ advertiserId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<ICampaignDocument[]> {
    return CampaignModel.find({ status: 'running' });
  }

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(status: CampaignStatus): Promise<ICampaignDocument[]> {
    return CampaignModel.find({ status });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await CampaignModel.deleteOne({ campaignId });
    if (result.deletedCount > 0) {
      await deleteCache(`campaign:${campaignId}`);
      return true;
    }
    return false;
  }

  /**
   * Cache campaign
   */
  private async cacheCampaign(campaign: ICampaignDocument): Promise<void> {
    try {
      await setCache(`campaign:${campaign.campaignId}`, campaign.toObject(), 300);
    } catch (error) {
      logger.warn('Failed to cache campaign', { error });
    }
  }
}

export const campaignService = new CampaignService();
export default campaignService;