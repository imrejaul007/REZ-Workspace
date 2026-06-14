import axios from 'axios';
import { ICampaignDocument } from '../models/campaign.model.js';
import { campaignService } from './campaign.service.js';
import { getRedisClient, setCache, getCache } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';
import {
  AgentDecisionContext,
  AgentActionType,
  CurrentStatus
} from '../types/index.js';
import {
  agentActionsTotal,
  agentDecisionDuration,
  externalServiceCalls,
  externalServiceDuration,
  campaignProgress
} from '../utils/metrics.js';

interface AgentDecision {
  action: AgentActionType;
  details: Record<string, unknown>;
  reasoning: string;
  confidence: number;
}

export class AgentService {
  private decisionLoops: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: Map<string, boolean> = new Map();

  /**
   * Start the agent decision loop for a campaign
   */
  async startAgent(campaignId: string): Promise<void> {
    if (this.isRunning.get(campaignId)) {
      logger.warn('Agent already running for campaign', { campaignId });
      return;
    }

    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Update status to running
    await campaignService.updateStatus(campaignId, 'running');

    // Perform initial audience discovery
    await this.performInitialDiscovery(campaign);

    this.isRunning.set(campaignId, true);

    // Start decision loop
    const interval = setInterval(
      () => this.decisionCycle(campaignId),
      config.agent.decisionLoopIntervalMs
    );

    this.decisionLoops.set(campaignId, interval);

    logger.info('Agent started for campaign', {
      campaignId,
      agentId: campaign.agentId
    });
  }

  /**
   * Stop the agent decision loop
   */
  async stopAgent(campaignId: string): Promise<void> {
    this.isRunning.set(campaignId, false);

    const interval = this.decisionLoops.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.decisionLoops.delete(campaignId);
    }

    await campaignService.updateStatus(campaignId, 'paused');

    logger.info('Agent stopped for campaign', { campaignId });
  }

  /**
   * Pause the agent (exposed via API)
   */
  async pauseAgent(campaignId: string): Promise<void> {
    await this.stopAgent(campaignId);
  }

  /**
   * Main decision cycle
   */
  private async decisionCycle(campaignId: string): Promise<void> {
    if (!this.isRunning.get(campaignId)) {
      return;
    }

    const startTime = Date.now();
    const campaign = await campaignService.getCampaign(campaignId);

    if (!campaign || campaign.status !== 'running') {
      return;
    }

    // Check if goal is achieved
    if (campaign.currentStatus.progress >= 100) {
      await campaignService.updateStatus(campaignId, 'completed');
      this.isRunning.set(campaignId, false);
      logger.info('Campaign goal achieved', { campaignId });
      return;
    }

    // Check if deadline passed
    if (campaign.goal.deadline && new Date() > campaign.goal.deadline) {
      await campaignService.updateStatus(campaignId, 'completed');
      this.isRunning.set(campaignId, false);
      logger.info('Campaign deadline reached', { campaignId });
      return;
    }

    try {
      const context = this.buildDecisionContext(campaign);
      const decisions = await this.makeDecisions(context);

      // Execute up to maxActionsPerCycle actions
      const actionsToExecute = decisions.slice(
        0,
        config.agent.maxActionsPerCycle
      );

      for (const decision of actionsToExecute) {
        await this.executeDecision(campaignId, decision);
      }

      // Sync with external services
      await this.syncWithAdsService(campaign);

      // Update progress metric
      campaignProgress.set(
        { goal_type: campaign.goal.type },
        campaign.currentStatus.progress
      );

      const duration = (Date.now() - startTime) / 1000;
      agentDecisionDuration.observe({ decision_type: 'cycle' }, duration);

      logger.info('Decision cycle completed', {
        campaignId,
        decisionsExecuted: actionsToExecute.length,
        duration
      });
    } catch (error) {
      logger.error('Error in decision cycle', { campaignId, error });
      agentActionsTotal.inc({ action_type: 'error' });
    }
  }

  /**
   * Build decision context for AI
   */
  private buildDecisionContext(campaign: ICampaignDocument): AgentDecisionContext {
    return {
      campaignId: campaign.campaignId,
      currentMetrics: campaign.currentStatus,
      historicalActions: campaign.agentActions.slice(-10),
      budgetRemaining: campaign.goal.budget - campaign.currentStatus.spend,
      timeRemaining: campaign.goal.deadline
        ? campaign.goal.deadline.getTime() - Date.now()
        : undefined,
      competitorData: undefined
    };
  }

  /**
   * Make AI-driven decisions
   */
  private async makeDecisions(
    context: AgentDecisionContext
  ): Promise<AgentDecision[]> {
    const decisions: AgentDecision[] = [];

    // Decision rules engine
    const { currentMetrics, budgetRemaining } = context;

    // Check if we need more conversions
    if (currentMetrics.progress < 50 && budgetRemaining > config.agent.minBudgetThreshold) {
      // Check if audience is targeted
      if (currentMetrics.achieved === 0 || currentMetrics.cpa > currentMetrics.spend * 0.3) {
        decisions.push({
          action: 'audience_targeting',
          details: { strategy: 'expand' },
          reasoning: 'Need more reach to achieve conversion goals',
          confidence: 0.85
        });
      }

      // Check if we need better creatives
      if (currentMetrics.cpa > currentMetrics.spend * 0.2) {
        decisions.push({
          action: 'creative_testing',
          details: { focus: 'performance' },
          reasoning: 'Current creatives underperforming',
          confidence: 0.75
        });
      }
    }

    // Bid optimization
    if (currentMetrics.cpa > 0) {
      const targetCpa = currentMetrics.spend / (currentMetrics.achieved || 1) * 1.1;
      decisions.push({
        action: 'bid_optimization',
        details: {
          currentCpa: currentMetrics.cpa,
          targetCpa,
          adjustment: currentMetrics.cpa > targetCpa ? 'decrease' : 'increase'
        },
        reasoning: 'Optimize bids based on current CPA performance',
        confidence: 0.8
      });
    }

    // Budget reallocation based on performance
    if (currentMetrics.progress > 20 && budgetRemaining < currentMetrics.spend * 0.5) {
      decisions.push({
        action: 'budget_reallocation',
        details: { preserve: true },
        reasoning: 'Conserve remaining budget for high-performing channels',
        confidence: 0.7
      });
    }

    return decisions;
  }

  /**
   * Execute a decision
   */
  private async executeDecision(
    campaignId: string,
    decision: AgentDecision
  ): Promise<void> {
    logger.info('Executing agent decision', {
      campaignId,
      action: decision.action,
      reasoning: decision.reasoning
    });

    switch (decision.action) {
      case 'audience_targeting':
        await this.executeAudienceTargeting(campaignId, decision.details);
        break;
      case 'creative_testing':
        await this.executeCreativeTesting(campaignId, decision.details);
        break;
      case 'bid_optimization':
        await this.executeBidOptimization(campaignId, decision.details);
        break;
      case 'budget_reallocation':
        await this.executeBudgetReallocation(campaignId, decision.details);
        break;
      case 'channel_activation':
        await this.executeChannelActivation(campaignId, decision.details);
        break;
      case 'channel_deactivation':
        await this.executeChannelDeactivation(campaignId, decision.details);
        break;
      default:
        logger.warn('Unknown decision action', { action: decision.action });
    }

    // Record the action
    await campaignService.addAgentAction(campaignId, decision.action, {
      ...decision.details,
      reasoning: decision.reasoning,
      confidence: decision.confidence
    });

    agentActionsTotal.inc({ action_type: decision.action });
  }

  /**
   * Execute audience targeting decision
   */
  private async executeAudienceTargeting(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const strategy = details.strategy as string;

    // Simulate audience discovery (in production, call AI service)
    const audiences = strategy === 'expand'
      ? ['age_25_35', 'interest_technology', 'behavior_purchasers']
      : ['age_30_40', 'interest_business', 'behavior_repeat'];

    await campaignService.updateDecisions(campaignId, {
      audienceTargeted: audiences
    });
  }

  /**
   * Execute creative testing decision
   */
  private async executeCreativeTesting(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const focus = details.focus as string;

    // Simulate creative generation (in production, call AI service)
    const creatives = focus === 'performance'
      ? ['creative_v1_perf', 'creative_v2_perf']
      : ['creative_v1_brand', 'creative_v2_brand'];

    const current = await campaignService.getCampaign(campaignId);
    const existingCreatives = current?.decisions.creativesUsed || [];

    await campaignService.updateDecisions(campaignId, {
      creativesUsed: [...new Set([...existingCreatives, ...creatives])]
    });
  }

  /**
   * Execute bid optimization
   */
  private async executeBidOptimization(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const adjustment = details.adjustment as string;
    const currentCpa = details.currentCpa as number;
    const targetCpa = details.targetCpa as number;

    const bidMultiplier = adjustment === 'decrease' ? 0.9 : 1.1;
    const newTargetBid = currentCpa * bidMultiplier;

    await campaignService.updateDecisions(campaignId, {
      bidStrategy: `adjusted_${adjustment}`
    });

    await campaignService.addAgentAction(campaignId, 'bid_optimization', {
      adjustment,
      currentCpa,
      targetCpa,
      newTargetBid,
      reason: `CPA ${adjustment}: ${currentCpa.toFixed(2)} -> ${targetCpa.toFixed(2)}`
    });
  }

  /**
   * Execute budget reallocation
   */
  private async executeBudgetReallocation(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const preserve = details.preserve as boolean;

    if (preserve) {
      // Reduce daily spend to conserve budget
      await campaignService.addAgentAction(campaignId, 'budget_reallocation', {
        action: 'conservation',
        reason: 'Preserving budget for end-of-campaign push'
      });
    }
  }

  /**
   * Execute channel activation
   */
  private async executeChannelActivation(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const channel = details.channel as string;
    const current = await campaignService.getCampaign(campaignId);
    const activeChannels = current?.decisions.channelsActive || [];

    if (!activeChannels.includes(channel)) {
      await campaignService.updateDecisions(campaignId, {
        channelsActive: [...activeChannels, channel]
      });
    }
  }

  /**
   * Execute channel deactivation
   */
  private async executeChannelDeactivation(
    campaignId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const channel = details.channel as string;
    const current = await campaignService.getCampaign(campaignId);
    const activeChannels = current?.decisions.channelsActive || [];

    await campaignService.updateDecisions(campaignId, {
      channelsActive: activeChannels.filter((c) => c !== channel)
    });
  }

  /**
   * Perform initial audience and creative discovery
   */
  private async performInitialDiscovery(campaign: ICampaignDocument): Promise<void> {
    const goalType = campaign.goal.type;

    // Default audience segments based on goal type
    const audiencesByGoal: Record<string, string[]> = {
      leads: ['age_25_45', 'interest_business', 'behavior_decision_makers'],
      sales: ['age_25_55', 'interest_shopping', 'behavior_purchasers'],
      bookings: ['age_20_50', 'interest_travel', 'behavior_bookers'],
      app_installs: ['age_18_35', 'interest_tech', 'behavior_early_adopters'],
      engagement: ['age_18_40', 'interest_social', 'behavior_active_users']
    };

    // Default channels based on goal type
    const channelsByGoal: Record<string, string[]> = {
      leads: ['facebook', 'linkedin', 'google'],
      sales: ['facebook', 'instagram', 'google'],
      bookings: ['google', 'meta', 'display'],
      app_installs: ['google', 'facebook', 'apple_search'],
      engagement: ['facebook', 'instagram', 'tiktok']
    };

    const audiences = audiencesByGoal[goalType] || ['general'];
    const channels = channelsByGoal[goalType] || ['facebook'];

    await campaignService.updateDecisions(campaign.campaignId, {
      audienceTargeted: audiences,
      channelsActive: channels,
      bidStrategy: 'auto'
    });

    await campaignService.addAgentAction(campaign.campaignId, 'audience_research', {
      goalType,
      discoveredAudiences: audiences,
      recommendedChannels: channels
    });
  }

  /**
   * Sync with external ads service
   */
  private async syncWithAdsService(campaign: ICampaignDocument): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await axios.get(
        `${config.services.adsServiceUrl}/api/campaigns/${campaign.campaignId}/metrics`,
        {
          timeout: 5000
        }
      );

      const externalMetrics = response.data;

      if (externalMetrics) {
        await campaignService.updateMetrics(campaign.campaignId, {
          achieved: externalMetrics.conversions || campaign.currentStatus.achieved,
          spend: externalMetrics.spend || campaign.currentStatus.spend,
          revenue: externalMetrics.revenue
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      externalServiceDuration.observe(
        { service: 'ads', endpoint: 'metrics' },
        duration
      );
      externalServiceCalls.inc({
        service: 'ads',
        endpoint: 'metrics',
        status: 'success'
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      externalServiceDuration.observe(
        { service: 'ads', endpoint: 'metrics' },
        duration
      );
      externalServiceCalls.inc({
        service: 'ads',
        endpoint: 'metrics',
        status: 'error'
      });

      logger.warn('Failed to sync with ads service', {
        campaignId: campaign.campaignId,
        error
      });
    }
  }

  /**
   * Get agent status for a campaign
   */
  isAgentRunning(campaignId: string): boolean {
    return this.isRunning.get(campaignId) || false;
  }

  /**
   * Get all running agents
   */
  getRunningAgents(): string[] {
    return Array.from(this.decisionLoops.keys()).filter((id) =>
      this.isRunning.get(id)
    );
  }

  /**
   * Stop all agents
   */
  async stopAllAgents(): Promise<void> {
    for (const campaignId of this.decisionLoops.keys()) {
      await this.stopAgent(campaignId);
    }
  }
}

export const agentService = new AgentService();
export default agentService;