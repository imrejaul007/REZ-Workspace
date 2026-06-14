import { ROASRecord, BusinessOutcome, OutcomeCampaign } from '../models/outcomeModels.js';
import { campaignService } from './campaignService.js';
import logger from 'utils/logger.js';
import { startTimer, dbOperationDuration } from '../utils/metrics.js';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

export interface ROASCalculationInput {
  campaignId: string;
  advertiserId: string;
  revenue: number;
  costs: {
    media: number;
    creative?: number;
    platform?: number;
  };
  conversions?: number;
  metrics?: {
    impressions?: number;
    clicks?: number;
  };
  periodType?: 'daily' | 'weekly' | 'monthly';
}

export interface ROASResult {
  recordId: string;
  campaignId: string;
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  revenue: {
    total: number;
    attributed: number;
  };
  costs: {
    total: number;
    breakdown: {
      media: number;
      creative: number;
      platform: number;
    };
  };
  roas: number;
  cpa: number;
  cpm: number;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversionRate: number;
  };
  calculatedAt: Date;
}

/**
 * ROAS (Return on Ad Spend) Service
 * Calculates and tracks advertising ROI
 */
export class ROASService {
  /**
   * Calculate ROAS for a campaign period
   */
  async calculateROAS(input: ROASCalculationInput): Promise<ROASResult> {
    const endTimer = startTimer();
    const recordId = generateId('roas');

    logger.info('Calculating ROAS', {
      recordId,
      campaignId: input.campaignId,
      revenue: input.revenue,
      costs: input.costs
    });

    try {
      const now = new Date();
      const periodStart = new Date(now);
      const periodEnd = new Date(now);

      // Set period based on type
      switch (input.periodType || 'daily') {
        case 'daily':
          periodStart.setHours(0, 0, 0, 0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          periodStart.setDate(now.getDate() - 7);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart.setMonth(now.getMonth() - 1);
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);
          break;
      }

      // Calculate costs
      const totalCost = input.costs.media +
        (input.costs.creative || 0) +
        (input.costs.platform || 0);

      // Calculate ROAS
      const roas = totalCost > 0 ? input.revenue / totalCost : 0;

      // Calculate CPA (Cost Per Acquisition)
      const cpa = (input.conversions || 0) > 0
        ? totalCost / input.conversions
        : 0;

      // Calculate CPM (Cost Per Mille)
      const impressions = input.metrics?.impressions || 0;
      const cpm = impressions > 0
        ? (totalCost / impressions) * 1000
        : 0;

      // Calculate CTR and conversion rate
      const clicks = input.metrics?.clicks || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0
        ? ((input.conversions || 0) / clicks) * 100
        : 0;

      // Get attributed revenue
      const attributedRevenue = await this.calculateAttributedRevenue(
        input.campaignId,
        periodStart,
        periodEnd
      );

      // Create ROAS record
      await ROASRecord.create({
        recordId,
        campaignId: input.campaignId,
        advertiserId: input.advertiserId,
        periodStart,
        periodEnd,
        periodType: input.periodType || 'daily',
        revenue: {
          total: input.revenue,
          attributed: attributedRevenue,
          direct: input.revenue - attributedRevenue,
          organic: 0,
        },
        costs: {
          total: totalCost,
          media: input.costs.media,
          creative: input.costs.creative || 0,
          platform: input.costs.platform || 0,
        },
        roas,
        cpa,
        cpm,
        conversions: {
          total: input.conversions || 0,
          attributed: 0, // Would be calculated from attribution data
        },
        metrics: {
          impressions,
          clicks,
          ctr,
          conversionRate,
        },
      });

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'roas_records' }, duration);

      logger.info('ROAS calculated', {
        recordId,
        campaignId: input.campaignId,
        roas,
        cpa,
        duration
      });

      return {
        recordId,
        campaignId: input.campaignId,
        period: {
          start: periodStart,
          end: periodEnd,
          type: input.periodType || 'daily',
        },
        revenue: {
          total: input.revenue,
          attributed: attributedRevenue,
        },
        costs: {
          total: totalCost,
          breakdown: {
            media: input.costs.media,
            creative: input.costs.creative || 0,
            platform: input.costs.platform || 0,
          },
        },
        roas,
        cpa,
        cpm,
        metrics: {
          impressions,
          clicks,
          ctr,
          conversionRate,
        },
        calculatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to calculate ROAS', error);
      throw error;
    }
  }

  /**
   * Calculate attributed revenue for a period
   */
  private async calculateAttributedRevenue(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const outcomes = await BusinessOutcome.find({
      campaignId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Sum up attributed revenue
    return outcomes.reduce((sum, outcome) => {
      return sum + (outcome.attributedRevenue || outcome.value);
    }, 0);
  }

  /**
   * Get ROAS trend for a campaign
   */
  async getROASTrend(
    campaignId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 30
  ): Promise<Array<{
    period: string;
    startDate: Date;
    endDate: Date;
    revenue: number;
    costs: number;
    roas: number;
    cpa: number;
  }>> {
    const records = await ROASRecord.find({ campaignId })
      .sort({ periodStart: -1 })
      .limit(limit)
      .lean();

    return records.map(record => ({
      period: record.periodStart.toISOString().split('T')[0],
      startDate: record.periodStart,
      endDate: record.periodEnd,
      revenue: record.revenue.total,
      costs: record.costs.total,
      roas: record.roas,
      cpa: record.cpa,
    })).reverse();
  }

  /**
   * Get ROAS comparison between campaigns
   */
  async compareCampaignsROAS(advertiserId: string): Promise<Array<{
    campaignId: string;
    campaignName: string;
    currentROAS: number;
    targetROAS: number;
    roasStatus: 'above_target' | 'at_target' | 'below_target';
    trend: 'improving' | 'stable' | 'declining';
    budgetUtilization: number;
  }>> {
    // Get all campaigns for advertiser
    const campaigns = await OutcomeCampaign.find({ advertiserId }).lean();

    const comparisons: Array<{
      campaignId: string;
      campaignName: string;
      currentROAS: number;
      targetROAS: number;
      roasStatus: 'above_target' | 'at_target' | 'below_target';
      trend: 'improving' | 'stable' | 'declining';
      budgetUtilization: number;
    }> = [];

    for (const campaign of campaigns) {
      // Get latest ROAS record
      const latestRecord = await ROASRecord.findOne({ campaignId })
        .sort({ periodEnd: -1 })
        .lean();

      // Get trend (compare last 2 records)
      const records = await ROASRecord.find({ campaignId })
        .sort({ periodEnd: -1 })
        .limit(2)
        .lean();

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (records.length >= 2) {
        const diff = records[0].roas - records[1].roas;
        if (diff > 0.1) trend = 'improving';
        else if (diff < -0.1) trend = 'declining';
      }

      // Determine status
      let roasStatus: 'above_target' | 'at_target' | 'below_target' = 'at_target';
      const targetROAS = 3.0; // Default target
      if (latestRecord && latestRecord.roas > targetROAS * 1.1) {
        roasStatus = 'above_target';
      } else if (latestRecord && latestRecord.roas < targetROAS * 0.9) {
        roasStatus = 'below_target';
      }

      // Calculate budget utilization
      const budgetUtilization = campaign.budget.total > 0
        ? (campaign.budget.spent / campaign.budget.total) * 100
        : 0;

      comparisons.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        currentROAS: latestRecord?.roas || 0,
        targetROAS,
        roasStatus,
        trend,
        budgetUtilization,
      });
    }

    // Sort by ROAS
    comparisons.sort((a, b) => b.currentROAS - a.currentROAS);

    return comparisons;
  }

  /**
   * Get ROAS summary for advertiser
   */
  async getROASSummary(advertiserId: string): Promise<{
    totalRevenue: number;
    totalCosts: number;
    overallROAS: number;
    averageCPA: number;
    campaigns: {
      aboveTarget: number;
      atTarget: number;
      belowTarget: number;
    };
    topPerformingCampaign: string | null;
    worstPerformingCampaign: string | null;
  }> {
    const records = await ROASRecord.find({ advertiserId })
      .sort({ periodEnd: -1 })
      .lean();

    if (records.length === 0) {
      return {
        totalRevenue: 0,
        totalCosts: 0,
        overallROAS: 0,
        averageCPA: 0,
        campaigns: { aboveTarget: 0, atTarget: 0, belowTarget: 0 },
        topPerformingCampaign: null,
        worstPerformingCampaign: null,
      };
    }

    // Calculate totals
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue.total, 0);
    const totalCosts = records.reduce((sum, r) => sum + r.costs.total, 0);
    const overallROAS = totalCosts > 0 ? totalRevenue / totalCosts : 0;

    // Calculate average CPA
    const totalConversions = records.reduce((sum, r) => sum + r.conversions.total, 0);
    const averageCPA = totalConversions > 0 ? totalCosts / totalConversions : 0;

    // Get campaign performance
    const comparisons = await this.compareCampaignsROAS(advertiserId);

    const campaigns = {
      aboveTarget: comparisons.filter(c => c.roasStatus === 'above_target').length,
      atTarget: comparisons.filter(c => c.roasStatus === 'at_target').length,
      belowTarget: comparisons.filter(c => c.roasStatus === 'below_target').length,
    };

    const topCampaign = comparisons[0];
    const worstCampaign = comparisons[comparisons.length - 1];

    return {
      totalRevenue,
      totalCosts,
      overallROAS,
      averageCPA,
      campaigns,
      topPerformingCampaign: topCampaign?.campaignId || null,
      worstPerformingCampaign: worstCampaign?.campaignId || null,
    };
  }

  /**
   * Identify ROAS optimization opportunities
   */
  async getROASOptimizationSuggestions(campaignId: string): Promise<Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    currentValue: number;
    targetValue: number;
    potentialImprovement: number;
    actions: string[];
  }>> {
    const latestRecord = await ROASRecord.findOne({ campaignId })
      .sort({ periodEnd: -1 })
      .lean();

    if (!latestRecord) return [];

    const suggestions: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      currentValue: number;
      targetValue: number;
      potentialImprovement: number;
      actions: string[];
    }> = [];

    // ROAS below target
    if (latestRecord.roas < 2.0) {
      suggestions.push({
        type: 'roas_improvement',
        priority: 'high',
        currentValue: latestRecord.roas,
        targetValue: 3.0,
        potentialImprovement: ((3.0 - latestRecord.roas) / latestRecord.roas) * 100,
        actions: [
          'Review targeting to improve audience quality',
          'Optimize bids for best performing hours',
          'Pause underperforming ad groups',
          'Increase budget for top converting channels',
        ],
      });
    }

    // High CPA
    if (latestRecord.cpa > 50) {
      suggestions.push({
        type: 'cpa_reduction',
        priority: 'medium',
        currentValue: latestRecord.cpa,
        targetValue: 30,
        potentialImprovement: ((50 - 30) / 50) * 100,
        actions: [
          'Refine audience targeting',
          'Improve landing page experience',
          'Test new ad creatives',
          'Implement conversion tracking optimization',
        ],
      });
    }

    // Low CTR
    if (latestRecord.metrics.ctr < 1) {
      suggestions.push({
        type: 'ctr_improvement',
        priority: 'medium',
        currentValue: latestRecord.metrics.ctr,
        targetValue: 2.0,
        potentialImprovement: ((2.0 - latestRecord.metrics.ctr) / latestRecord.metrics.ctr) * 100,
        actions: [
          'Test new headlines and descriptions',
          'Add extensions and structured snippets',
          'Review ad relevance scores',
          'A/B test different formats',
        ],
      });
    }

    // Low conversion rate
    if (latestRecord.metrics.conversionRate < 2) {
      suggestions.push({
        type: 'conversion_rate',
        priority: 'high',
        currentValue: latestRecord.metrics.conversionRate,
        targetValue: 4.0,
        potentialImprovement: ((4.0 - latestRecord.metrics.conversionRate) / latestRecord.metrics.conversionRate) * 100,
        actions: [
          'Optimize landing page load speed',
          'Improve form design and UX',
          'Add trust signals and social proof',
          'Test different offers and CTAs',
        ],
      });
    }

    return suggestions;
  }

  /**
   * Calculate ROAS for multiple channels
   */
  async getChannelROAS(campaignId: string): Promise<Array<{
    channel: string;
    revenue: number;
    costs: number;
    roas: number;
    conversions: number;
    cpa: number;
  }>> {
    const outcomes = await BusinessOutcome.find({ campaignId }).lean();

    // Aggregate by channel
    const channelData: Record<string, { revenue: number; conversions: number }> = {};

    for (const outcome of outcomes) {
      const channel = outcome.conversionData.channel;
      if (!channelData[channel]) {
        channelData[channel] = { revenue: 0, conversions: 0 };
      }
      channelData[channel].revenue += outcome.value;
      channelData[channel].conversions++;
    }

    // Get campaign budget for cost allocation
    const campaign = await OutcomeCampaign.findOne({ campaignId }).lean();
    const channelCount = Object.keys(channelData).length;
    const avgCostPerChannel = campaign && channelCount > 0
      ? campaign.budget.spent / channelCount
      : 0;

    return Object.entries(channelData).map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      costs: avgCostPerChannel,
      roas: avgCostPerChannel > 0 ? data.revenue / avgCostPerChannel : 0,
      conversions: data.conversions,
      cpa: data.conversions > 0 ? avgCostPerChannel / data.conversions : 0,
    }));
  }
}

// Export singleton instance
export const roasService = new ROASService();
export default roasService;