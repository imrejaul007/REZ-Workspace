import { BusinessOutcome, IBusinessOutcome } from '../models/outcomeModels.js';
import { attributionService } from './attributionService.js';
import { roasService } from './roasService.js';
import { campaignService } from './campaignService.js';
import logger from 'utils/logger.js';
import { startTimer } from '../utils/metrics.js';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

export interface TrackOutcomeInput {
  campaignId: string;
  advertiserId: string;
  type: 'conversion' | 'purchase' | 'signup' | 'lead' | 'engagement' | 'impression' | 'click';
  value: number;
  currency?: string;
  customerId?: string;
  sessionId?: string;
  device?: string;
  location?: string;
  conversionData: {
    channel: string;
    source?: string;
    medium?: string;
    campaign?: string;
    keyword?: string;
    adId?: string;
    creativeId?: string;
  };
  timestamp?: Date;
}

export interface OutcomeWithAttribution {
  outcomeId: string;
  campaignId: string;
  type: string;
  value: number;
  attributedRevenue: number;
  attributionConfidence: number;
  touchpoints: Array<{
    channel: string;
    credit: number;
    weight: number;
  }>;
  timestamp: Date;
}

/**
 * Outcome Service
 * Core service for tracking and attributing business outcomes
 */
export class OutcomeService {
  /**
   * Track a business outcome with automatic attribution
   */
  async trackOutcome(input: TrackOutcomeInput): Promise<OutcomeWithAttribution> {
    const endTimer = startTimer();
    const outcomeId = generateId('out');

    logger.info('Tracking business outcome', {
      outcomeId,
      campaignId: input.campaignId,
      type: input.type,
      value: input.value
    });

    try {
      // Record the outcome
      const createdOutcome = await attributionService.recordOutcome({
        campaignId: input.campaignId,
        advertiserId: input.advertiserId,
        type: input.type,
        value: input.value,
        currency: input.currency,
        customerId: input.customerId,
        sessionId: input.sessionId,
        device: input.device,
        location: input.location,
        conversionData: input.conversionData,
        timestamp: input.timestamp,
      });

      // Calculate attribution
      const attribution = await attributionService.calculateAttribution(
        outcomeId,
        'linear',
        30
      );

      // Update campaign KPIs
      await campaignService.updateCampaignKPIs(input.campaignId, input.value);

      const result: OutcomeWithAttribution = {
        outcomeId,
        campaignId: input.campaignId,
        type: input.type,
        value: input.value,
        attributedRevenue: attribution?.attributedRevenue || input.value,
        attributionConfidence: attribution?.totalCredit || 1,
        touchpoints: attribution?.touchpoints || [],
        timestamp: input.timestamp || new Date(),
      };

      logger.info('Outcome tracked with attribution', {
        outcomeId,
        attributedRevenue: result.attributedRevenue,
        touchpointCount: result.touchpoints.length,
        duration: endTimer()
      });

      return result;
    } catch (error) {
      logger.error('Failed to track outcome', error);
      throw error;
    }
  }

  /**
   * Get outcomes for a campaign
   */
  async getCampaignOutcomes(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      limit?: number;
    }
  ): Promise<IBusinessOutcome[]> {
    const query: Record<string, any> = { campaignId };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }
    if (options?.type) {
      query.type = options.type;
    }

    return BusinessOutcome.find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 100)
      .lean();
  }

  /**
   * Get outcome statistics for a campaign
   */
  async getOutcomeStats(campaignId: string): Promise<{
    totalOutcomes: number;
    totalValue: number;
    byType: Record<string, { count: number; value: number }>;
    byChannel: Record<string, { count: number; value: number }>;
    recentTrend: 'up' | 'down' | 'stable';
    averageValue: number;
  }> {
    const outcomes = await BusinessOutcome.find({ campaignId }).lean();

    if (outcomes.length === 0) {
      return {
        totalOutcomes: 0,
        totalValue: 0,
        byType: {},
        byChannel: {},
        recentTrend: 'stable',
        averageValue: 0,
      };
    }

    // Aggregate by type
    const byType: Record<string, { count: number; value: number }> = {};
    for (const outcome of outcomes) {
      if (!byType[outcome.type]) {
        byType[outcome.type] = { count: 0, value: 0 };
      }
      byType[outcome.type].count++;
      byType[outcome.type].value += outcome.value;
    }

    // Aggregate by channel
    const byChannel: Record<string, { count: number; value: number }> = {};
    for (const outcome of outcomes) {
      const channel = outcome.conversionData.channel;
      if (!byChannel[channel]) {
        byChannel[channel] = { count: 0, value: 0 };
      }
      byChannel[channel].count++;
      byChannel[channel].value += outcome.value;
    }

    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentOutcomes = outcomes.filter(o => o.timestamp >= weekAgo);
    const olderOutcomes = outcomes.filter(
      o => o.timestamp >= twoWeeksAgo && o.timestamp < weekAgo
    );

    const recentValue = recentOutcomes.reduce((sum, o) => sum + o.value, 0);
    const olderValue = olderOutcomes.reduce((sum, o) => sum + o.value, 0);

    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentValue > olderValue * 1.1) recentTrend = 'up';
    else if (recentValue < olderValue * 0.9) recentTrend = 'down';

    const totalValue = outcomes.reduce((sum, o) => sum + o.value, 0);

    return {
      totalOutcomes: outcomes.length,
      totalValue,
      byType,
      byChannel,
      recentTrend,
      averageValue: outcomes.length > 0 ? totalValue / outcomes.length : 0,
    };
  }

  /**
   * Get performance analytics for a campaign
   */
  async getPerformanceAnalytics(
    campaignId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 30
  ): Promise<{
    summary: {
      totalOutcomes: number;
      totalValue: number;
      averageValue: number;
      conversionRate: number;
    };
    timeline: Array<{
      period: string;
      outcomes: number;
      value: number;
      cpa: number;
    }>;
    topChannels: Array<{
      channel: string;
      outcomes: number;
      value: number;
      percentage: number;
    }>;
    roasTrend: Array<{
      period: string;
      roas: number;
    }>;
  }> {
    // Get outcome stats
    const stats = await this.getOutcomeStats(campaignId);

    // Get ROAS trend
    const roasTrend = await roasService.getROASTrend(campaignId, periodType, limit);

    // Get top channels
    const topChannels = Object.entries(stats.byChannel)
      .map(([channel, data]) => ({
        channel,
        outcomes: data.count,
        value: data.value,
        percentage: stats.totalValue > 0 ? (data.value / stats.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Generate timeline
    const timeline: Array<{
      period: string;
      outcomes: number;
      value: number;
      cpa: number;
    }> = [];

    // Group outcomes by period
    const now = new Date();
    for (let i = limit - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodEnd: Date;
      let periodLabel: string;

      switch (periodType) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
          periodLabel = periodStart.toISOString().split('T')[0];
          break;
        case 'weekly':
          periodStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          periodLabel = `Week ${limit - i}`;
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          periodLabel = periodStart.toLocaleString('default', { month: 'short', year: '2-digit' });
          break;
      }

      // Filter outcomes for this period
      const periodOutcomes = stats.totalOutcomes > 0
        ? [] // Would need to re-query for accurate counts
        : [];

      timeline.push({
        period: periodLabel,
        outcomes: periodOutcomes.length,
        value: 0, // Would need to re-query for accurate values
        cpa: 0,
      });
    }

    return {
      summary: {
        totalOutcomes: stats.totalOutcomes,
        totalValue: stats.totalValue,
        averageValue: stats.averageValue,
        conversionRate: 0, // Would need impressions data
      },
      timeline,
      topChannels,
      roasTrend: roasTrend.map(r => ({
        period: r.period,
        roas: r.roas,
      })),
    };
  }

  /**
   * Get outcome dashboard data for an advertiser
   */
  async getAdvertiserDashboard(advertiserId: string): Promise<{
    totalOutcomes: number;
    totalValue: number;
    byCampaign: Array<{
      campaignId: string;
      campaignName: string;
      outcomes: number;
      value: number;
      roas: number;
      status: string;
    }>;
    byChannel: Record<string, { count: number; value: number }>;
    topPerformingCampaign: string | null;
    recentOutcomes: Array<{
      outcomeId: string;
      campaignId: string;
      type: string;
      value: number;
      timestamp: Date;
    }>;
  }> {
    // Get all outcomes for advertiser
    const outcomes = await BusinessOutcome.find({ advertiserId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Aggregate by campaign
    const byCampaign: Record<string, { campaignName: string; outcomes: number; value: number; roas: number; status: string }> = {};

    for (const outcome of outcomes) {
      if (!byCampaign[outcome.campaignId]) {
        byCampaign[outcome.campaignId] = {
          campaignName: outcome.campaignId,
          outcomes: 0,
          value: 0,
          roas: 0,
          status: 'unknown'
        };
      }
      byCampaign[outcome.campaignId].outcomes++;
      byCampaign[outcome.campaignId].value += outcome.value;
    }

    // Get campaign details
    const campaigns = await campaignService.getAdvertiserCampaigns(advertiserId);
    for (const campaign of campaigns) {
      if (byCampaign[campaign.campaignId]) {
        byCampaign[campaign.campaignId].campaignName = campaign.name;
        byCampaign[campaign.campaignId].status = campaign.status;
      }
    }

    // Aggregate by channel
    const byChannel: Record<string, { count: number; value: number }> = {};
    for (const outcome of outcomes) {
      const channel = outcome.conversionData.channel;
      if (!byChannel[channel]) {
        byChannel[channel] = { count: 0, value: 0 };
      }
      byChannel[channel].count++;
      byChannel[channel].value += outcome.value;
    }

    // Find top performing campaign
    const campaignValues = Object.entries(byCampaign)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.value - a.value);
    const topPerforming = campaignValues[0]?.id || null;

    return {
      totalOutcomes: outcomes.length,
      totalValue: outcomes.reduce((sum, o) => sum + o.value, 0),
      byCampaign: Object.entries(byCampaign).map(([campaignId, data]) => ({
        campaignId,
        campaignName: data.campaignName,
        outcomes: data.outcomes,
        value: data.value,
        roas: data.roas,
        status: data.status,
      })),
      byChannel,
      topPerformingCampaign: topPerforming,
      recentOutcomes: outcomes.slice(0, 10).map(o => ({
        outcomeId: o.outcomeId,
        campaignId: o.campaignId,
        type: o.type,
        value: o.value,
        timestamp: o.timestamp,
      })),
    };
  }
}

// Export singleton instance
export const outcomeService = new OutcomeService();
export default outcomeService;