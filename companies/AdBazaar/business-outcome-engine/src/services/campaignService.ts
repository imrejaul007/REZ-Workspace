import { OutcomeCampaign, IOutcomeCampaign, CampaignObjective, CampaignStatus } from '../models/outcomeModels.js';
import logger from 'utils/logger.js';
import { startTimer, dbOperationDuration } from '../utils/metrics.js';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

export interface CreateCampaignInput {
  advertiserId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  startDate: Date;
  endDate?: Date;
  budget: {
    total: number;
    currency?: string;
    dailyLimit?: number;
  };
  kpis: {
    target: number;
    metric: string;
    unit?: 'currency' | 'count' | 'percentage';
  };
  attribution?: {
    model?: string;
    lookbackWindow?: number;
    touchpointWeight?: Record<string, number>;
  };
  targeting?: {
    channels?: string[];
    audiences?: string[];
    geographies?: string[];
    demographics?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface CampaignResponse {
  campaignId: string;
  status: string;
  campaign: IOutcomeCampaign;
}

export interface PerformanceMetrics {
  totalSpend: number;
  budgetUtilization: number;
  kpiProgress: number;
  daysRemaining: number;
  projectedEndValue: number;
  roas: number;
}

/**
 * Campaign Service
 * Manages outcome-based campaigns
 */
export class CampaignService {
  /**
   * Create a new outcome campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<CampaignResponse> {
    const endTimer = startTimer();
    const campaignId = generateId('camp');

    logger.info('Creating outcome campaign', { advertiserId: input.advertiserId, name: input.name });

    try {
      const campaign = await OutcomeCampaign.create({
        campaignId,
        advertiserId: input.advertiserId,
        name: input.name,
        description: input.description,
        objective: input.objective,
        status: CampaignStatus.DRAFT,
        startDate: input.startDate,
        endDate: input.endDate,
        budget: {
          total: input.budget.total,
          spent: 0,
          currency: input.budget.currency || 'INR',
          dailyLimit: input.budget.dailyLimit,
        },
        kpis: {
          target: input.kpis.target,
          current: 0,
          metric: input.kpis.metric,
          unit: input.kpis.unit || 'count',
        },
        attribution: {
          model: input.attribution?.model || 'linear',
          lookbackWindow: input.attribution?.lookbackWindow || 30,
          touchpointWeight: input.attribution?.touchpointWeight,
        },
        targeting: input.targeting,
        metadata: input.metadata,
      });

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'outcome_campaigns' }, duration);

      logger.info('Campaign created', { campaignId, advertiserId: input.advertiserId, duration });

      return {
        campaignId,
        status: 'created',
        campaign,
      };
    } catch (error) {
      logger.error('Failed to create campaign', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<IOutcomeCampaign | null> {
    return OutcomeCampaign.findOne({ campaignId }).lean();
  }

  /**
   * Get campaigns by advertiser
   */
  async getAdvertiserCampaigns(
    advertiserId: string,
    options?: {
      status?: CampaignStatus;
      objective?: CampaignObjective;
      limit?: number;
    }
  ): Promise<IOutcomeCampaign[]> {
    const query: Record<string, any> = { advertiserId };

    if (options?.status) {
      query.status = options.status;
    }
    if (options?.objective) {
      query.objective = options.objective;
    }

    return OutcomeCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .lean();
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus
  ): Promise<IOutcomeCampaign | null> {
    const campaign = await OutcomeCampaign.findOneAndUpdate(
      { campaignId },
      { status },
      { new: true }
    ).lean();

    if (campaign) {
      logger.info('Campaign status updated', { campaignId, status });
    }

    return campaign;
  }

  /**
   * Update campaign KPIs
   */
  async updateCampaignKPIs(
    campaignId: string,
    currentValue: number
  ): Promise<IOutcomeCampaign | null> {
    const campaign = await OutcomeCampaign.findOneAndUpdate(
      { campaignId },
      { 'kpis.current': currentValue },
      { new: true }
    ).lean();

    return campaign;
  }

  /**
   * Update campaign spend
   */
  async updateCampaignSpend(
    campaignId: string,
    amount: number
  ): Promise<IOutcomeCampaign | null> {
    const campaign = await OutcomeCampaign.findOneAndUpdate(
      { campaignId },
      { $inc: { 'budget.spent': amount } },
      { new: true }
    ).lean();

    return campaign;
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<PerformanceMetrics | null> {
    const campaign = await OutcomeCampaign.findOne({ campaignId }).lean();
    if (!campaign) return null;

    const now = new Date();
    const totalDays = campaign.endDate
      ? Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const elapsedDays = Math.ceil((now.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - elapsedDays);

    // Calculate budget utilization
    const budgetUtilization = campaign.budget.total > 0
      ? (campaign.budget.spent / campaign.budget.total) * 100
      : 0;

    // Calculate KPI progress
    const kpiProgress = campaign.kpis.target > 0
      ? (campaign.kpis.current / campaign.kpis.target) * 100
      : 0;

    // Project end value based on current trajectory
    const dailyProgress = elapsedDays > 0 ? campaign.kpis.current / elapsedDays : 0;
    const projectedEndValue = campaign.kpis.current + (dailyProgress * daysRemaining);

    // Calculate ROAS (revenue / spend)
    const roas = campaign.budget.spent > 0
      ? campaign.kpis.current / campaign.budget.spent
      : 0;

    return {
      totalSpend: campaign.budget.spent,
      budgetUtilization,
      kpiProgress,
      daysRemaining,
      projectedEndValue,
      roas,
    };
  }

  /**
   * Activate a campaign
   */
  async activateCampaign(campaignId: string): Promise<IOutcomeCampaign | null> {
    return this.updateCampaignStatus(campaignId, CampaignStatus.ACTIVE);
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<IOutcomeCampaign | null> {
    return this.updateCampaignStatus(campaignId, CampaignStatus.PAUSED);
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: string): Promise<IOutcomeCampaign | null> {
    return this.updateCampaignStatus(campaignId, CampaignStatus.COMPLETED);
  }

  /**
   * Get campaign summary for dashboard
   */
  async getCampaignSummary(advertiserId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    totalBudget: number;
    totalSpent: number;
    totalKPIProgress: number;
  }> {
    const campaigns = await OutcomeCampaign.find({ advertiserId }).lean();

    const summary = {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length,
      completed: campaigns.filter(c => c.status === CampaignStatus.COMPLETED).length,
      totalBudget: campaigns.reduce((sum, c) => sum + c.budget.total, 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.budget.spent, 0),
      totalKPIProgress: campaigns.length > 0
        ? campaigns.reduce((sum, c) => {
            const progress = c.kpis.target > 0 ? (c.kpis.current / c.kpis.target) * 100 : 0;
            return sum + progress;
          }, 0) / campaigns.length
        : 0,
    };

    return summary;
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
export default campaignService;