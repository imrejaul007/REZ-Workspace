import { Performance, IPerformance } from '../models/Performance';
import { ROI, IROI } from '../models/ROI';
import { Attribution } from '../models/Attribution';
import { logger } from '../utils/logger';
import { performanceRecords, roiCalculations } from '../utils/metrics';

export class PerformanceService {
  /**
   * Record performance metrics
   */
  async recordPerformance(data: Partial<IPerformance>): Promise<IPerformance> {
    try {
      // Calculate engagement rate if not provided
      if (data.metrics) {
        const { views, likes, comments, shares, saves } = data.metrics;
        if (views && (likes || comments || shares || saves)) {
          const engagement = (likes || 0) + (comments || 0) + (shares || 0) + (saves || 0);
          data.metrics.engagementRate = (engagement / views) * 100;
        }

        // Calculate CTR
        if (data.metrics.clicks && data.metrics.impressions) {
          data.metrics.ctr = (data.metrics.clicks / data.metrics.impressions) * 100;
        }
      }

      const performance = new Performance(data);
      await performance.save();
      performanceRecords.inc();
      logger.info('Performance recorded', { performanceId: performance._id });
      return performance;
    } catch (error) {
      logger.error('Failed to record performance', { error, data });
      throw error;
    }
  }

  /**
   * Get influencer performance
   */
  async getInfluencerPerformance(
    influencerId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      platform?: string;
      contentType?: string;
      period?: string;
    } = {}
  ): Promise<any> {
    const query: any = { influencerId };

    if (options.startDate || options.endDate) {
      query.recordedAt = {};
      if (options.startDate) query.recordedAt.$gte = options.startDate;
      if (options.endDate) query.recordedAt.$lte = options.endDate;
    }
    if (options.platform) query.platform = options.platform;
    if (options.contentType) query.contentType = options.contentType;
    if (options.period) query.period = options.period;

    const performances = await Performance.find(query).sort({ recordedAt: -1 }).exec();

    // Aggregate metrics
    const aggregated = this.aggregateMetrics(performances);

    // Calculate trend
    const trend = this.calculateTrend(performances);

    return {
      influencerId,
      summary: aggregated,
      trend,
      byPlatform: this.groupByPlatform(performances),
      byContentType: this.groupByContentType(performances),
      recentRecords: performances.slice(0, 10)
    };
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const performances = await Performance.find({ campaignId }).sort({ recordedAt: -1 }).exec();

    const aggregated = this.aggregateMetrics(performances);

    return {
      campaignId,
      summary: aggregated,
      byInfluencer: await this.groupByInfluencer(campaignId),
      byPlatform: this.groupByPlatform(performances),
      byContentType: this.groupByContentType(performances),
      timeline: this.getTimeline(performances)
    };
  }

  /**
   * Get performance dashboard
   */
  async getDashboard(filters: {
    brandId?: string;
    campaignIds?: string[];
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    const query: any = {};

    if (filters.campaignIds?.length) {
      query.campaignId = { $in: filters.campaignIds };
    }
    if (filters.startDate || filters.endDate) {
      query.recordedAt = {};
      if (filters.startDate) query.recordedAt.$gte = filters.startDate;
      if (filters.endDate) query.recordedAt.$lte = filters.endDate;
    }

    const performances = await Performance.find(query).exec();
    const aggregated = this.aggregateMetrics(performances);

    // Get top performers
    const topInfluencers = await this.getTopPerformers(performances);

    // Calculate overall ROI
    const overallROI = await this.calculateOverallROI(query);

    return {
      summary: aggregated,
      topInfluencers,
      byPlatform: this.groupByPlatform(performances),
      byContentType: this.groupByContentType(performances),
      timeline: this.getTimeline(performances),
      overallROI
    };
  }

  /**
   * Calculate ROI
   */
  async calculateROI(
    influencerId: string,
    campaignId: string,
    investment: {
      fee: number;
      productCost?: number;
      otherCosts?: number;
    }
  ): Promise<IROI> {
    const totalInvestment = investment.fee + (investment.productCost || 0) + (investment.otherCosts || 0);

    // Get performance data
    const performances = await Performance.find({
      influencerId,
      campaignId
    }).exec();

    const totalConversions = performances.reduce((sum, p) =>
      sum + (p.attribution?.conversions || 0), 0
    );
    const totalRevenue = performances.reduce((sum, p) =>
      sum + (p.attribution?.revenue || 0), 0
    );
    const totalEngagement = performances.reduce((sum, p) => {
      const m = p.metrics;
      return sum + (m?.likes || 0) + (m?.comments || 0) + (m?.shares || 0) + (m?.saves || 0);
    }, 0);
    const totalImpressions = performances.reduce((sum, p) =>
      sum + (p.metrics?.impressions || 0) + (p.metrics?.views || 0), 0
    );
    const totalClicks = performances.reduce((sum, p) =>
      sum + (p.metrics?.clicks || 0), 0
    );

    // Calculate ROI
    const roi = totalRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (roi / totalInvestment) * 100 : 0;

    // Calculate cost metrics
    const roiRecord = await ROI.create({
      influencerId,
      campaignId,
      investment: {
        total: totalInvestment,
        fee: investment.fee,
        productCost: investment.productCost,
        otherCosts: investment.otherCosts
      },
      returns: {
        conversions: totalConversions,
        revenue: totalRevenue,
        engagement: totalEngagement,
        impressions: totalImpressions
      },
      calculatedROI: roi,
      roiPercentage,
      costPerEngagement: totalEngagement > 0 ? totalInvestment / totalEngagement : 0,
      costPerClick: totalClicks > 0 ? totalInvestment / totalClicks : 0,
      costPerConversion: totalConversions > 0 ? totalInvestment / totalConversions : 0,
      costPerThousand: totalImpressions > 0 ? (totalInvestment / totalImpressions) * 1000 : 0,
      calculatedAt: new Date()
    });

    roiCalculations.inc();
    logger.info('ROI calculated', { roiId: roiRecord._id, roiPercentage });

    return roiRecord;
  }

  /**
   * Get ROI report
   */
  async getROIReport(
    influencerId?: string,
    campaignId?: string
  ): Promise<any> {
    const query: any = {};
    if (influencerId) query.influencerId = influencerId;
    if (campaignId) query.campaignId = campaignId;

    const roiRecords = await ROI.find(query).sort({ calculatedAt: -1 }).exec();

    const totalInvestment = roiRecords.reduce((sum, r) => sum + r.investment.total, 0);
    const totalRevenue = roiRecords.reduce((sum, r) => sum + (r.returns.revenue || 0), 0);
    const totalConversions = roiRecords.reduce((sum, r) => sum + (r.returns.conversions || 0), 0);

    return {
      totalInvestment,
      totalRevenue,
      totalROI: totalRevenue - totalInvestment,
      overallROIPercentage: totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0,
      totalConversions,
      avgCostPerConversion: totalConversions > 0 ? totalInvestment / totalConversions : 0,
      records: roiRecords.slice(0, 50)
    };
  }

  // Helper methods
  private aggregateMetrics(performances: any[]): any {
    const result = {
      totalViews: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgEngagementRate: 0,
      avgCTR: 0
    };

    performances.forEach(p => {
      result.totalViews += p.metrics?.views || 0;
      result.totalImpressions += p.metrics?.impressions || 0;
      result.totalLikes += p.metrics?.likes || 0;
      result.totalComments += p.metrics?.comments || 0;
      result.totalShares += p.metrics?.shares || 0;
      result.totalSaves += p.metrics?.saves || 0;
      result.totalClicks += p.metrics?.clicks || 0;
      result.totalConversions += p.attribution?.conversions || 0;
      result.totalRevenue += p.attribution?.revenue || 0;
    });

    const totalEngagement = result.totalLikes + result.totalComments + result.totalShares + result.totalSaves;
    const totalReach = result.totalViews || result.totalImpressions;

    result.avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
    result.avgCTR = result.totalImpressions > 0 ? (result.totalClicks / result.totalImpressions) * 100 : 0;

    return result;
  }

  private calculateTrend(performances: any[]): any {
    if (performances.length < 2) return { direction: 'stable', change: 0 };

    const half = Math.floor(performances.length / 2);
    const recent = performances.slice(0, half);
    const older = performances.slice(half);

    const recentViews = recent.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
    const olderViews = older.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);

    const change = olderViews > 0 ? ((recentViews - olderViews) / olderViews) * 100 : 0;

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.round(change * 100) / 100,
      recentPeriodViews: recentViews,
      olderPeriodViews: olderViews
    };
  }

  private groupByPlatform(performances: any[]): any {
    const groups: any = {};
    performances.forEach(p => {
      if (!groups[p.platform]) {
        groups[p.platform] = { views: 0, engagement: 0, conversions: 0 };
      }
      groups[p.platform].views += p.metrics?.views || 0;
      groups[p.platform].engagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0);
      groups[p.platform].conversions += p.attribution?.conversions || 0;
    });
    return groups;
  }

  private groupByContentType(performances: any[]): any {
    const groups: any = {};
    performances.forEach(p => {
      if (!groups[p.contentType]) {
        groups[p.contentType] = { count: 0, views: 0, engagement: 0 };
      }
      groups[p.contentType].count++;
      groups[p.contentType].views += p.metrics?.views || 0;
      groups[p.contentType].engagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0);
    });
    return groups;
  }

  private async groupByInfluencer(campaignId: string): Promise<any> {
    const performances = await Performance.find({ campaignId }).exec();
    const groups: any = {};

    performances.forEach(p => {
      const infId = p.influencerId.toString();
      if (!groups[infId]) {
        groups[infId] = { views: 0, engagement: 0, conversions: 0, contentCount: 0 };
      }
      groups[infId].views += p.metrics?.views || 0;
      groups[infId].engagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0);
      groups[infId].conversions += p.attribution?.conversions || 0;
      groups[infId].contentCount++;
    });

    return groups;
  }

  private getTimeline(performances: any[]): any[] {
    const timeline: any = {};

    performances.forEach(p => {
      const date = p.recordedAt.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { views: 0, engagement: 0, conversions: 0 };
      }
      timeline[date].views += p.metrics?.views || 0;
      timeline[date].engagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0);
      timeline[date].conversions += p.attribution?.conversions || 0;
    });

    return Object.entries(timeline)
      .map(([date, data]) => ({ date, ...data as any }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getTopPerformers(performances: any[]): Promise<any[]> {
    const influencerMetrics: any = {};

    performances.forEach(p => {
      const infId = p.influencerId.toString();
      if (!influencerMetrics[infId]) {
        influencerMetrics[infId] = { views: 0, engagement: 0, conversions: 0 };
      }
      influencerMetrics[infId].views += p.metrics?.views || 0;
      influencerMetrics[infId].engagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0);
      influencerMetrics[infId].conversions += p.attribution?.conversions || 0;
    });

    return Object.entries(influencerMetrics)
      .map(([id, metrics]) => ({ influencerId: id, ...metrics as any }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private async calculateOverallROI(query: any): Promise<any> {
    const roiRecords = await ROI.find(query).exec();

    const totalInvestment = roiRecords.reduce((sum, r) => sum + r.investment.total, 0);
    const totalRevenue = roiRecords.reduce((sum, r) => sum + (r.returns.revenue || 0), 0);

    return {
      totalInvestment,
      totalRevenue,
      totalROI: totalRevenue - totalInvestment,
      roiPercentage: totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0
    };
  }
}

export const performanceService = new PerformanceService();