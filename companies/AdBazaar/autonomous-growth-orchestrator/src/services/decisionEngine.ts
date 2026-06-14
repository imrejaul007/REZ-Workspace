import { Decision, IAutonomousCampaign } from '../models';
import { campaignMetrics } from '../utils/metrics';
import logger from '../utils/logger';
import axios from 'axios';

interface DecisionContext {
  campaign: IAutonomousCampaign;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  marketConditions?: {
    competition: 'low' | 'medium' | 'high';
    demand: 'low' | 'medium' | 'high';
    trends: string[];
  };
}

interface AIDecision {
  type: string;
  action: {
    type: string;
    target: string;
    currentValue: any;
    proposedValue: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  reasoning: {
    analysis: string;
    data: Record<string, any>;
    confidence: number;
    alternatives: string[];
  };
  impact: {
    expectedChange: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTimeToImpact: string;
  };
}

export class DecisionEngine {
  private hojaiUrl: string;
  private autoApproveThreshold: number;

  constructor() {
    this.hojaiUrl = process.env.HOJAI_URL || 'http://localhost:4800';
    this.autoApproveThreshold = 0.85; // Auto-approve decisions with 85%+ confidence
  }

  /**
   * Analyze campaign and generate AI decisions
   */
  async analyzeAndDecide(context: DecisionContext): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];
    const startTime = Date.now();

    logger.info('Analyzing campaign for AI decisions', {
      campaignId: context.campaign._id,
      currentROAS: context.performance.roas
    });

    // Budget optimization
    const budgetDecision = await this.analyzeBudgetOptimization(context);
    if (budgetDecision) decisions.push(budgetDecision);

    // Bid optimization
    const bidDecision = await this.analyzeBidOptimization(context);
    if (bidDecision) decisions.push(bidDecision);

    // Audience optimization
    const audienceDecision = await this.analyzeAudienceOptimization(context);
    if (audienceDecision) decisions.push(audienceDecision);

    // Creative optimization
    const creativeDecision = await this.analyzeCreativeOptimization(context);
    if (creativeDecision) decisions.push(creativeDecision);

    // Frequency optimization
    const frequencyDecision = await this.analyzeFrequencyOptimization(context);
    if (frequencyDecision) decisions.push(frequencyDecision);

    // Record decision latency
    campaignMetrics.decisionLatency.observe((Date.now() - startTime) / 1000);

    logger.info('AI decision analysis complete', {
      campaignId: context.campaign._id,
      decisionsCount: decisions.length,
      latencyMs: Date.now() - startTime
    });

    return decisions;
  }

  /**
   * Analyze budget reallocation opportunities
   */
  private async analyzeBudgetOptimization(context: DecisionContext): Promise<AIDecision | null> {
    const { campaign, performance } = context;
    const targetObjective = campaign.objectives.find(o => o.type === 'roas' || o.type === 'conversions');

    if (!targetObjective) return null;

    // Check if ROAS is below target
    if (performance.roas < (targetObjective.minTarget || targetObjective.target * 0.8)) {
      const underperforming = performance.spend > 0 &&
        (performance.conversions / performance.spend) < (targetObjective.target / campaign.budget.total);

      if (underperforming) {
        return {
          type: 'budget_reallocation',
          action: {
            type: 'reduce_budget',
            target: 'daily_budget',
            currentValue: campaign.budget.daily || campaign.budget.total / 30,
            proposedValue: (campaign.budget.daily || campaign.budget.total / 30) * 0.8,
            priority: 'high'
          },
          reasoning: {
            analysis: `ROAS (${performance.roas.toFixed(2)}) is below target (${targetObjective.target}). Reducing budget to minimize losses while optimizing strategy.`,
            data: {
              currentROAS: performance.roas,
              targetROAS: targetObjective.target,
              currentSpend: performance.spend,
              conversions: performance.conversions
            },
            confidence: 0.82,
            alternatives: [
              'Pause campaign temporarily',
              'Shift budget to better performing ad sets',
              'Adjust targeting parameters'
            ]
          },
          impact: {
            expectedChange: -15,
            riskLevel: 'medium',
            estimatedTimeToImpact: '24h'
          }
        };
      }
    }

    // Check for budget increase opportunity
    if (performance.roas > targetObjective.target * 1.2 && performance.spend > 0) {
      return {
        type: 'budget_reallocation',
        action: {
          type: 'increase_budget',
          target: 'daily_budget',
          currentValue: campaign.budget.daily || campaign.budget.total / 30,
          proposedValue: (campaign.budget.daily || campaign.budget.total / 30) * 1.3,
          priority: 'medium'
        },
        reasoning: {
          analysis: `ROAS (${performance.roas.toFixed(2)}) significantly exceeds target (${targetObjective.target}). Increasing budget to capitalize on performance.`,
          data: {
            currentROAS: performance.roas,
            targetROAS: targetObjective.target,
            currentSpend: performance.spend,
            conversionRate: performance.conversions / performance.clicks
          },
          confidence: 0.78,
          alternatives: [
            'Maintain current budget',
            'Expand to new audiences',
            'Test new creative variations'
          ]
        },
        impact: {
          expectedChange: 25,
          riskLevel: 'low',
          estimatedTimeToImpact: '48h'
        }
      };
    }

    return null;
  }

  /**
   * Analyze bid optimization
   */
  private async analyzeBidOptimization(context: DecisionContext): Promise<AIDecision | null> {
    const { campaign, performance } = context;

    // High CPC with low conversions
    if (performance.cpc > 50 && performance.ctr > 0.02 && performance.conversions < 10) {
      return {
        type: 'bid_adjustment',
        action: {
          type: 'decrease_bid',
          target: 'max_cpc',
          currentValue: performance.cpc,
          proposedValue: performance.cpc * 0.85,
          priority: 'high'
        },
        reasoning: {
          analysis: `High CPC (${performance.cpc.toFixed(2)}) with low conversion rate. Decreasing bid to improve efficiency.`,
          data: {
            currentCPC: performance.cpc,
            ctr: performance.ctr,
            conversions: performance.conversions,
            spend: performance.spend
          },
          confidence: 0.75,
          alternatives: [
            'Improve landing page',
            'Refine audience targeting',
            'Test different ad creative'
          ]
        },
        impact: {
          expectedChange: -10,
          riskLevel: 'low',
          estimatedTimeToImpact: '12h'
        }
      };
    }

    // Low bid causing low impressions
    if (performance.impressions < 1000 && performance.spend < campaign.budget.total * 0.3) {
      return {
        type: 'bid_adjustment',
        action: {
          type: 'increase_bid',
          target: 'max_cpc',
          currentValue: performance.cpc || 10,
          proposedValue: (performance.cpc || 10) * 1.2,
          priority: 'medium'
        },
        reasoning: {
          analysis: `Low impression volume. Increasing bid to improve auction win rate.`,
          data: {
            impressions: performance.impressions,
            spend: performance.spend,
            budgetUsed: performance.spend / campaign.budget.total
          },
          confidence: 0.68,
          alternatives: [
            'Expand audience targeting',
            'Adjust scheduling',
            'Test different ad placements'
          ]
        },
        impact: {
          expectedChange: 30,
          riskLevel: 'medium',
          estimatedTimeToImpact: '24h'
        }
      };
    }

    return null;
  }

  /**
   * Analyze audience optimization
   */
  private async analyzeAudienceOptimization(context: DecisionContext): Promise<AIDecision | null> {
    const { campaign, performance } = context;

    // Low CTR indicates potential audience mismatch
    if (performance.ctr < 0.01 && performance.impressions > 5000) {
      return {
        type: 'audience_expansion',
        action: {
          type: 'expand_audience',
          target: 'targeting_parameters',
          currentValue: 'narrow',
          proposedValue: 'expanded',
          priority: 'high'
        },
        reasoning: {
          analysis: `Very low CTR (${(performance.ctr * 100).toFixed(2)}%) suggests audience targeting may be too narrow.`,
          data: {
            ctr: performance.ctr,
            impressions: performance.impressions,
            clicks: performance.clicks
          },
          confidence: 0.72,
          alternatives: [
            'Test lookalike audiences',
            'Broaden interest targeting',
            'Include similar customer segments'
          ]
        },
        impact: {
          expectedChange: 20,
          riskLevel: 'medium',
          estimatedTimeToImpact: '48h'
        }
      };
    }

    return null;
  }

  /**
   * Analyze creative optimization
   */
  private async analyzeCreativeOptimization(context: DecisionContext): Promise<AIDecision | null> {
    const { performance } = context;

    // Low engagement with high impressions
    if (performance.impressions > 10000 && performance.ctr < 0.015) {
      return {
        type: 'creative_rotation',
        action: {
          type: 'test_new_creative',
          target: 'ad_creative',
          currentValue: 'existing',
          proposedValue: 'variation_test',
          priority: 'medium'
        },
        reasoning: {
          analysis: `High impressions but low CTR suggests creative fatigue. Testing new variations.`,
          data: {
            impressions: performance.impressions,
            ctr: performance.ctr,
            spend: performance.spend
          },
          confidence: 0.65,
          alternatives: [
            'Refresh existing creative',
            'Test different messaging',
            'Update call-to-action'
          ]
        },
        impact: {
          expectedChange: 15,
          riskLevel: 'low',
          estimatedTimeToImpact: '72h'
        }
      };
    }

    return null;
  }

  /**
   * Analyze frequency optimization
   */
  private async analyzeFrequencyOptimization(context: DecisionContext): Promise<AIDecision | null> {
    const { performance } = context;

    // High frequency with low conversion
    const frequency = performance.impressions > 0 ? performance.clicks / performance.impressions : 0;
    if (frequency > 0.1 && performance.conversions < 5) {
      return {
        type: 'frequency_capping',
        action: {
          type: 'reduce_frequency',
          target: 'impression_frequency',
          currentValue: 'unlimited',
          proposedValue: 3,
          priority: 'low'
        },
        reasoning: {
          analysis: `High click rate but low conversions suggests ad fatigue. Capping frequency.`,
          data: {
            ctr: performance.ctr,
            conversions: performance.conversions,
            impressions: performance.impressions
          },
          confidence: 0.60,
          alternatives: [
            'Refresh creative messaging',
            'Test new audience segments',
            'Adjust bidding strategy'
          ]
        },
        impact: {
          expectedChange: 5,
          riskLevel: 'low',
          estimatedTimeToImpact: '24h'
        }
      };
    }

    return null;
  }

  /**
   * Store and return decisions
   */
  async createDecisions(
    campaignId: string,
    decisions: AIDecision[]
  ): Promise<Decision[]> {
    const createdDecisions: Decision[] = [];

    for (const decision of decisions) {
      const doc = new Decision({
        campaignId,
        type: decision.type as any,
        action: decision.action,
        reasoning: decision.reasoning,
        impact: decision.impact,
        approved: decision.reasoning.confidence >= this.autoApproveThreshold,
        autoApproved: decision.reasoning.confidence >= this.autoApproveThreshold,
        executed: false
      });

      await doc.save();
      createdDecisions.push(doc);

      campaignMetrics.decisionsMade.inc({
        type: decision.type,
        approved: doc.approved ? 'true' : 'false'
      });

      if (!doc.approved) {
        campaignMetrics.humanApprovalsRequired.inc();
      }
    }

    return createdDecisions;
  }

  /**
   * Get decisions for a campaign
   */
  async getDecisions(
    campaignId: string,
    options: { approved?: boolean; executed?: boolean; limit?: number } = {}
  ): Promise<Decision[]> {
    const query: Record<string, any> = { campaignId };

    if (options.approved !== undefined) query.approved = options.approved;
    if (options.executed !== undefined) query.executed = options.executed;

    return Decision.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50);
  }

  /**
   * Approve a decision
   */
  async approveDecision(
    decisionId: string,
    approvedBy: string
  ): Promise<Decision | null> {
    const decision = await Decision.findByIdAndUpdate(
      decisionId,
      {
        approved: true,
        approvedBy,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (decision) {
      campaignMetrics.humanApprovalsGiven.inc({ approved: 'true' });
    }

    return decision;
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(campaignId?: string): Promise<Decision[]> {
    const query: Record<string, any> = {
      approved: false,
      executed: false
    };

    if (campaignId) query.campaignId = campaignId;

    return Decision.find(query)
      .populate('campaignId', 'name advertiserId')
      .sort({ createdAt: -1 });
  }
}

export const decisionEngine = new DecisionEngine();
export default decisionEngine;