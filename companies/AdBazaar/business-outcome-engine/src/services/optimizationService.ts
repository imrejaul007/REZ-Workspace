import { OutcomeCampaign, BusinessOutcome, ROASRecord } from '../models/outcomeModels.js';
import { campaignService } from './campaignService.js';
import logger from 'utils/logger.js';
import { startTimer } from '../utils/metrics.js';

export interface OptimizationRecommendation {
  type: 'budget_reallocation' | 'bid_adjustment' | 'audience_refinement' | 'creative_optimization' | 'channel_shift';
  priority: 'high' | 'medium' | 'low';
  confidence: number;

  // Recommendation details
  recommendation: string;
  expectedImpact: number;
  currentValue: number;
  projectedValue: number;

  // Implementation
  actions: Array<{
    step: number;
    action: string;
    parameters?: Record<string, any>;
  }>;

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  potentialDownside?: number;
}

export interface OptimizationResult {
  campaignId: string;
  timestamp: Date;
  currentROAS: number;
  targetROAS: number;
  recommendations: OptimizationRecommendation[];
  overallExpectedImprovement: number;
  automatedActions: string[];
}

/**
 * AI-driven Optimization Service
 * Analyzes campaign performance and recommends optimizations
 */
export class OptimizationService {
  /**
   * Generate optimization recommendations for a campaign
   */
  async getRecommendations(campaignId: string): Promise<OptimizationResult> {
    const endTimer = startTimer();
    logger.info('Generating optimization recommendations', { campaignId });

    try {
      // Get campaign details
      const campaign = await campaignService.getCampaign(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Get performance metrics
      const performance = await campaignService.getCampaignPerformance(campaignId);
      if (!performance) {
        throw new Error(`Performance data not available for: ${campaignId}`);
      }

      const currentROAS = performance.roas;
      const targetROAS = 3.0; // Default target, could be from campaign settings

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze budget efficiency
      if (performance.budgetUtilization > 90 && performance.kpiProgress < 80) {
        recommendations.push(this.createBudgetReallocationRecommendation(campaign, performance));
      }

      // Analyze KPI progress
      if (performance.kpiProgress < 50) {
        recommendations.push(this.createAudienceRefinementRecommendation(campaign, performance));
        recommendations.push(this.createBidAdjustmentRecommendation(campaign, performance));
      }

      // Analyze channel performance
      const channelAnalysis = await this.analyzeChannelPerformance(campaignId);
      if (channelAnalysis.underperforming.length > 0) {
        recommendations.push(this.createChannelShiftRecommendation(channelAnalysis));
      }

      // Analyze creative performance
      const creativeAnalysis = await this.analyzeCreativePerformance(campaignId);
      if (creativeAnalysis.lowPerformers.length > 0) {
        recommendations.push(this.createCreativeOptimizationRecommendation(creativeAnalysis));
      }

      // Sort by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Calculate overall expected improvement
      const overallExpectedImprovement = recommendations.reduce(
        (sum, r) => sum + r.expectedImpact,
        0
      );

      // Identify automated actions (low risk, high confidence)
      const automatedActions = recommendations
        .filter(r => r.riskLevel === 'low' && r.confidence > 0.8)
        .map(r => r.recommendation);

      const result: OptimizationResult = {
        campaignId,
        timestamp: new Date(),
        currentROAS,
        targetROAS,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        overallExpectedImprovement,
        automatedActions,
      };

      logger.info('Optimization recommendations generated', {
        campaignId,
        recommendationCount: result.recommendations.length,
        expectedImprovement: overallExpectedImprovement,
        duration: endTimer()
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate optimization recommendations', error);
      throw error;
    }
  }

  /**
   * Create budget reallocation recommendation
   */
  private createBudgetReallocationRecommendation(
    campaign: any,
    performance: any
  ): OptimizationRecommendation {
    const underspend = campaign.budget.total - performance.totalSpend;
    const underspendPercent = (underspend / campaign.budget.total) * 100;

    return {
      type: 'budget_reallocation',
      priority: 'high',
      confidence: 0.85,

      recommendation: `Reallocate ${underspendPercent.toFixed(0)}% budget to high-performing channels`,
      expectedImpact: underspend * 0.3,
      currentValue: performance.totalSpend,
      projectedValue: performance.totalSpend + (underspend * 0.3),

      actions: [
        { step: 1, action: 'Identify top 2 performing channels from attribution data' },
        { step: 2, action: 'Increase daily budget limit for high-performing channels by 25%' },
        { step: 3, action: 'Reduce budget allocation to underperforming channels by 15%' },
        { step: 4, action: 'Monitor performance for 48 hours and adjust' },
      ],

      riskLevel: 'medium',
      potentialDownside: -0.1,
    };
  }

  /**
   * Create audience refinement recommendation
   */
  private createAudienceRefinementRecommendation(
    campaign: any,
    performance: any
  ): OptimizationRecommendation {
    const gap = campaign.kpis.target - campaign.kpis.current;
    const requiredGrowth = (gap / campaign.kpis.current) * 100;

    return {
      type: 'audience_refinement',
      priority: 'high',
      confidence: 0.75,

      recommendation: `Refine audience targeting to improve conversion rate by ${Math.min(50, requiredGrowth).toFixed(0)}%`,
      expectedImpact: campaign.kpis.current * 0.2,
      currentValue: campaign.kpis.current,
      projectedValue: campaign.kpis.current * 1.2,

      actions: [
        { step: 1, action: 'Analyze current audience segments with lowest conversion rates' },
        { step: 2, action: 'Create lookalike audiences based on best customers' },
        { step: 3, action: 'Exclude low-intent audiences (high bounce rate, no engagement)' },
        { step: 4, action: 'Test new audience segments with 10% of budget' },
      ],

      riskLevel: 'low',
      potentialDownside: -0.05,
    };
  }

  /**
   * Create bid adjustment recommendation
   */
  private createBidAdjustmentRecommendation(
    campaign: any,
    performance: any
  ): OptimizationRecommendation {
    return {
      type: 'bid_adjustment',
      priority: 'medium',
      confidence: 0.7,

      recommendation: 'Adjust bids based on time-of-day and device performance',
      expectedImpact: campaign.kpis.current * 0.15,
      currentValue: campaign.kpis.current,
      projectedValue: campaign.kpis.current * 1.15,

      actions: [
        { step: 1, action: 'Analyze conversion rates by time of day' },
        { step: 2, action: 'Increase bids by 15% during peak conversion hours' },
        { step: 3, action: 'Decrease bids by 10% during low-performance hours' },
        { step: 4, action: 'Optimize bids for mobile vs desktop based on CPA' },
      ],

      riskLevel: 'low',
      potentialDownside: -0.03,
    };
  }

  /**
   * Create channel shift recommendation
   */
  private createChannelShiftRecommendation(channelAnalysis: {
    topPerformers: Array<{ channel: string; roas: number }>;
    underperforming: Array<{ channel: string; roas: number }>;
  }): OptimizationRecommendation {
    const shiftPercent = 20;

    return {
      type: 'channel_shift',
      priority: 'medium',
      confidence: 0.8,

      recommendation: `Shift ${shiftPercent}% of budget from underperforming to top-performing channels`,
      expectedImpact: channelAnalysis.topPerformers[0]?.roas * 0.25 || 0.5,
      currentValue: 1.5,
      projectedValue: 2.0,

      actions: [
        {
          step: 1,
          action: `Reduce budget for ${channelAnalysis.underperforming[0]?.channel} by ${shiftPercent}%`,
          parameters: { channel: channelAnalysis.underperforming[0]?.channel }
        },
        {
          step: 2,
          action: `Increase budget for ${channelAnalysis.topPerformers[0]?.channel} by ${shiftPercent}%`,
          parameters: { channel: channelAnalysis.topPerformers[0]?.channel }
        },
        { step: 3, action: 'Test new channel combinations' },
        { step: 4, action: 'Measure incremental impact over 7 days' },
      ],

      riskLevel: 'medium',
      potentialDownside: -0.08,
    };
  }

  /**
   * Create creative optimization recommendation
   */
  private createCreativeOptimizationRecommendation(creativeAnalysis: {
    lowPerformers: Array<{ creativeId: string; ctr: number; conversionRate: number }>;
    highPerformers: Array<{ creativeId: string; ctr: number; conversionRate: number }>;
  }): OptimizationRecommendation {
    return {
      type: 'creative_optimization',
      priority: 'medium',
      confidence: 0.75,

      recommendation: 'Replace low-performing creatives with variations of top performers',
      expectedImpact: 0.18,
      currentValue: 0.05,
      projectedValue: 0.06,

      actions: [
        { step: 1, action: 'Pause creatives with CTR below 0.5%' },
        { step: 2, action: 'Duplicate top 3 performing creatives' },
        { step: 3, action: 'Test variations with different headlines' },
        { step: 4, action: 'Implement auto-optimization rules' },
      ],

      riskLevel: 'low',
      potentialDownside: -0.02,
    };
  }

  /**
   * Analyze channel performance
   */
  private async analyzeChannelPerformance(campaignId: string): Promise<{
    topPerformers: Array<{ channel: string; roas: number }>;
    underperforming: Array<{ channel: string; roas: number }>;
  }> {
    // Get outcomes by channel
    const outcomes = await BusinessOutcome.find({ campaignId }).lean();

    const channelStats: Record<string, { spend: number; revenue: number }> = {};
    for (const outcome of outcomes) {
      const channel = outcome.conversionData.channel;
      if (!channelStats[channel]) {
        channelStats[channel] = { spend: 0, revenue: 0 };
      }
      channelStats[channel].revenue += outcome.value;
    }

    // Get campaign budget for spend calculation
    const campaign = await OutcomeCampaign.findOne({ campaignId }).lean();
    if (campaign) {
      const channelCount = Object.keys(channelStats).length || 1;
      const avgSpend = campaign.budget.spent / channelCount;
      for (const channel of Object.keys(channelStats)) {
        channelStats[channel].spend = avgSpend;
      }
    }

    // Calculate ROAS per channel
    const channelROAS = Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      roas: stats.spend > 0 ? stats.revenue / stats.spend : 0,
    }));

    // Sort by ROAS
    channelROAS.sort((a, b) => b.roas - a.roas);

    const threshold = 0.5; // ROAS threshold
    return {
      topPerformers: channelROAS.filter(c => c.roas >= threshold).slice(0, 3),
      underperforming: channelROAS.filter(c => c.roas < threshold).slice(0, 3),
    };
  }

  /**
   * Analyze creative performance
   */
  private async analyzeCreativePerformance(campaignId: string): Promise<{
    highPerformers: Array<{ creativeId: string; ctr: number; conversionRate: number }>;
    lowPerformers: Array<{ creativeId: string; ctr: number; conversionRate: number }>;
  }> {
    // Simplified - in production, this would query creative analytics
    return {
      highPerformers: [
        { creativeId: 'high_1', ctr: 0.08, conversionRate: 0.12 },
        { creativeId: 'high_2', ctr: 0.07, conversionRate: 0.10 },
      ],
      lowPerformers: [
        { creativeId: 'low_1', ctr: 0.01, conversionRate: 0.02 },
      ],
    };
  }

  /**
   * Apply automated optimizations
   */
  async applyAutomatedOptimizations(campaignId: string): Promise<{
    applied: boolean;
    actions: string[];
    estimatedImpact: number;
  }> {
    logger.info('Applying automated optimizations', { campaignId });

    const recommendations = await this.getRecommendations(campaignId);
    const appliedActions: string[] = [];

    for (const recommendation of recommendations.recommendations) {
      // Only apply low-risk, high-confidence recommendations automatically
      if (recommendation.riskLevel === 'low' && recommendation.confidence > 0.8) {
        // In production, this would call campaign management APIs
        appliedActions.push(recommendation.recommendation);
      }
    }

    return {
      applied: appliedActions.length > 0,
      actions: appliedActions,
      estimatedImpact: recommendations.overallExpectedImprovement,
    };
  }

  /**
   * Get A/B test recommendations
   */
  async getABTestRecommendations(campaignId: string): Promise<Array<{
    testName: string;
    hypothesis: string;
    variantA: string;
    variantB: string;
    successMetric: string;
    sampleSize: number;
    confidence: number;
  }>> {
    // Get campaign data for analysis
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) return [];

    return [
      {
        testName: 'Audience Segment Test',
        hypothesis: 'Refined audience will have higher conversion rate',
        variantA: 'Current targeting',
        variantB: 'Lookalike audience based on best customers',
        successMetric: 'Conversion Rate',
        sampleSize: 10000,
        confidence: 0.75,
      },
      {
        testName: 'Bid Strategy Test',
        hypothesis: 'Target ROAS bidding will improve overall ROAS',
        variantA: 'Manual bidding',
        variantB: 'Target ROAS (3.0x)',
        successMetric: 'ROAS',
        sampleSize: 5000,
        confidence: 0.8,
      },
    ];
  }
}

// Export singleton instance
export const optimizationService = new OptimizationService();
export default optimizationService;