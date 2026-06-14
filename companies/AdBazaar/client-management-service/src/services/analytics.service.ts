import { v4 as uuidv4 } from 'uuid';
import { SpendAnalytics, Client, ClientCampaign } from '../models';
import { logger, cacheGet, cacheSet } from '../utils';
import { SpendAnalytics as SpendAnalyticsType, SpendQuery } from '../types';

export class AnalyticsService {
  /**
   * Get spend analytics for a client
   */
  async getSpendAnalytics(
    clientId: string,
    query: SpendQuery
  ): Promise<SpendAnalyticsType | null> {
    const cacheKey = `spend:${clientId}:${query.period}`;

    // Try cache first
    const cached = await cacheGet<SpendAnalyticsType>(cacheKey);
    if (cached) {
      logger.debug('Spend analytics cache hit', { clientId });
      return cached;
    }

    try {
      // Get client
      const client = await Client.findOne({ clientId });
      if (!client) {
        logger.warn('Client not found for analytics', { clientId });
        return null;
      }

      // Calculate date range
      const { start, end } = this.calculateDateRange(query.period, query.startDate, query.endDate);

      // Get campaigns for the period
      const campaigns = await ClientCampaign.find({
        clientId,
        'dates.start': { $lte: end },
        $or: [
          { 'dates.end': { $gte: start } },
          { 'dates.end': null },
        ],
      });

      // Calculate spend
      const totalSpend = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);
      const byChannel: Record<string, number> = {};
      const byCampaign: Record<string, number> = {};
      const daily: number[] = new Array(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))).fill(0);

      campaigns.forEach(c => {
        byCampaign[c.campaignId] = c.budget.spent;
        // In a real system, channel would come from campaign data
        byChannel['digital'] = (byChannel['digital'] || 0) + c.budget.spent;
      });

      // Calculate daily averages for the period
      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const dailySpend = totalSpend / daysInPeriod;
      for (let i = 0; i < daysInPeriod; i++) {
        daily[i] = dailySpend;
      }

      // Calculate projections
      const daysPassed = Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = daysInPeriod - daysPassed;
      const projectedTotal = totalSpend + (dailySpend * daysRemaining);
      const confidence = daysPassed > 0 ? Math.min(90, daysPassed * 5) : 50;

      // Determine trend
      const trend = this.calculateTrend(campaigns);

      // Get or create analytics record
      let analytics = await SpendAnalytics.findOne({
        clientId,
        'period.start': start,
        'period.type': query.period,
      });

      if (!analytics) {
        analytics = new SpendAnalytics({
          analyticsId: `analytics_${uuidv4()}`,
          clientId,
          period: {
            start,
            end,
            type: query.period,
          },
          budget: {
            allocated: client.budget.monthly,
            spent: totalSpend,
            remaining: client.budget.monthly - totalSpend,
            utilizationRate: client.budget.monthly > 0 ? (totalSpend / client.budget.monthly) * 100 : 0,
          },
          spend: {
            total: totalSpend,
            byChannel,
            byCampaign,
            daily,
          },
          projections: {
            endOfPeriod: projectedTotal,
            confidence,
            trend,
          },
          benchmarks: {
            industryAverage: 50000, // Would come from benchmark data
            clientVsBenchmark: totalSpend - 50000,
            percentile: this.calculatePercentile(totalSpend, 50000),
          },
        });

        await analytics.save();
      }

      const result = this.formatAnalytics(analytics);

      // Cache for 5 minutes
      await cacheSet(cacheKey, result, 300);

      logger.info('Spend analytics generated', { clientId, period: query.period });
      return result;
    } catch (error) {
      logger.error('Failed to get spend analytics', { error, clientId, query });
      throw error;
    }
  }

  /**
   * Get performance analytics for a client
   */
  async getPerformanceAnalytics(
    clientId: string,
    options?: { period?: 'week' | 'month' | 'quarter' | 'year' }
  ): Promise<any> {
    const cacheKey = `performance:${clientId}:${options?.period || 'month'}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await Client.findOne({ clientId });
      if (!client) {
        return null;
      }

      const campaigns = await ClientCampaign.find({ clientId });

      // Aggregate performance
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.performance.impressions, 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + c.performance.clicks, 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + c.performance.conversions, 0);
      const totalSpend = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);

      const result = {
        summary: {
          totalImpressions,
          totalClicks,
          totalConversions,
          totalSpend,
          avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
          conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        },
        byCampaign: campaigns.map(c => ({
          campaignId: c.campaignId,
          name: c.name,
          status: c.status,
          impressions: c.performance.impressions,
          clicks: c.performance.clicks,
          conversions: c.performance.conversions,
          spend: c.budget.spent,
          ctr: c.performance.ctr,
          cpc: c.performance.cpc,
          roas: c.performance.roas,
        })),
        trends: this.calculatePerformanceTrends(campaigns),
        clientId,
        generatedAt: new Date(),
      };

      await cacheSet(cacheKey, result, 300);
      return result;
    } catch (error) {
      logger.error('Failed to get performance analytics', { error, clientId });
      throw error;
    }
  }

  /**
   * Get budget utilization report
   */
  async getBudgetUtilization(clientId: string): Promise<any> {
    try {
      const client = await Client.findOne({ clientId });
      if (!client) {
        return null;
      }

      const campaigns = await ClientCampaign.find({ clientId, status: 'active' });

      const totalAllocated = campaigns.reduce((sum, c) => sum + c.budget.allocated, 0);
      const totalSpent = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);
      const totalRemaining = campaigns.reduce((sum, c) => sum + c.budget.remaining, 0);

      const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

      return {
        clientId,
        monthly: {
          allocated: client.budget.monthly,
          spent: client.spending.currentMonth,
          remaining: client.budget.monthly - client.spending.currentMonth,
          utilizationRate: client.budget.monthly > 0
            ? (client.spending.currentMonth / client.budget.monthly) * 100
            : 0,
        },
        quarterly: {
          allocated: client.budget.quarterly,
          spent: client.spending.currentMonth * 3,
          remaining: client.budget.quarterly - (client.spending.currentMonth * 3),
          utilizationRate: client.budget.quarterly > 0
            ? ((client.spending.currentMonth * 3) / client.budget.quarterly) * 100
            : 0,
        },
        yearly: {
          allocated: client.budget.yearly,
          spent: client.spending.ytd,
          remaining: client.budget.yearly - client.spending.ytd,
          utilizationRate: client.budget.yearly > 0
            ? (client.spending.ytd / client.budget.yearly) * 100
            : 0,
        },
        byCampaign: campaigns.map(c => ({
          campaignId: c.campaignId,
          name: c.name,
          allocated: c.budget.allocated,
          spent: c.budget.spent,
          remaining: c.budget.remaining,
          utilizationRate: c.budget.allocated > 0 ? (c.budget.spent / c.budget.allocated) * 100 : 0,
        })),
        alerts: this.generateBudgetAlerts(client, campaigns, utilizationRate),
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get budget utilization', { error, clientId });
      throw error;
    }
  }

  /**
   * Get ROI analysis
   */
  async getROIAnalysis(clientId: string): Promise<any> {
    try {
      const campaigns = await ClientCampaign.find({ clientId });

      const totalSpend = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + c.performance.conversions, 0);

      // Assume average conversion value (in real system, would come from data)
      const avgConversionValue = 1000;
      const totalRevenue = totalConversions * avgConversionValue;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      const byCampaign = campaigns.map(c => {
        const spend = c.budget.spent;
        const conversions = c.performance.conversions;
        const revenue = conversions * avgConversionValue;
        const campaignRoi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

        return {
          campaignId: c.campaignId,
          name: c.name,
          spend,
          conversions,
          revenue,
          roi: campaignRoi,
          breakEvenConversions: spend / avgConversionValue,
        };
      });

      return {
        summary: {
          totalSpend,
          totalConversions,
          totalRevenue,
          overallROI: roi,
          avgCostPerConversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
        },
        byCampaign,
        recommendations: this.generateROIRecommendations(byCampaign),
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get ROI analysis', { error, clientId });
      throw error;
    }
  }

  /**
   * Calculate date range based on period type
   */
  private calculateDateRange(
    period: string,
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const now = new Date();

    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }

    switch (period) {
      case 'daily':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        };
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      case 'monthly':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), quarter * 3 + 3, 1),
        };
      case 'yearly':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear() + 1, 0, 1),
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }
  }

  /**
   * Calculate spend trend
   */
  private calculateTrend(campaigns: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (campaigns.length < 2) return 'stable';

    const sorted = campaigns.sort((a, b) =>
      new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
    );

    const midPoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, c) => sum + c.budget.spent, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, c) => sum + c.budget.spent, 0) / secondHalf.length;

    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(value: number, median: number): number {
    if (value >= median * 1.5) return 90;
    if (value >= median * 1.2) return 75;
    if (value >= median) return 50;
    if (value >= median * 0.8) return 25;
    return 10;
  }

  /**
   * Calculate performance trends
   */
  private calculatePerformanceTrends(campaigns: any[]): any {
    if (campaigns.length === 0) {
      return { impressions: 'stable', clicks: 'stable', conversions: 'stable' };
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const totalImpressions = activeCampaigns.reduce((sum, c) => sum + c.performance.impressions, 0);
    const totalClicks = activeCampaigns.reduce((sum, c) => sum + c.performance.clicks, 0);
    const totalConversions = activeCampaigns.reduce((sum, c) => sum + c.performance.conversions, 0);

    return {
      impressions: totalImpressions > 10000 ? 'increasing' : totalImpressions > 5000 ? 'stable' : 'decreasing',
      clicks: totalClicks > 1000 ? 'increasing' : totalClicks > 500 ? 'stable' : 'decreasing',
      conversions: totalConversions > 100 ? 'increasing' : totalConversions > 50 ? 'stable' : 'decreasing',
    };
  }

  /**
   * Generate budget alerts
   */
  private generateBudgetAlerts(client: any, campaigns: any[], utilizationRate: number): any[] {
    const alerts = [];

    if (utilizationRate > 90) {
      alerts.push({
        type: 'budget',
        severity: 'high',
        message: `Budget utilization is at ${utilizationRate.toFixed(1)}% - consider increasing budget`,
      });
    } else if (utilizationRate > 75) {
      alerts.push({
        type: 'budget',
        severity: 'medium',
        message: `Budget utilization is at ${utilizationRate.toFixed(1)}%`,
      });
    }

    const underperforming = campaigns.filter(c =>
      c.budget.allocated > 0 &&
      (c.budget.spent / c.budget.allocated) < 0.3 &&
      c.status === 'active'
    );

    if (underperforming.length > 0) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `${underperforming.length} campaigns are underutilizing their budget`,
        campaigns: underperforming.map(c => c.name),
      });
    }

    return alerts;
  }

  /**
   * Generate ROI recommendations
   */
  private generateROIRecommendations(byCampaign: any[]): string[] {
    const recommendations = [];

    const lowRoi = byCampaign.filter(c => c.roi < 0);
    if (lowRoi.length > 0) {
      recommendations.push(
        `Consider pausing or optimizing ${lowRoi.length} campaigns with negative ROI`
      );
    }

    const highRoi = byCampaign.filter(c => c.roi > 100);
    if (highRoi.length > 0) {
      recommendations.push(
        `${highRoi.length} campaigns are performing well - consider scaling them up`
      );
    }

    const underperforming = byCampaign.filter(c => c.spend > 10000 && c.roi < 50);
    if (underperforming.length > 0) {
      recommendations.push(
        `Review targeting and creative for ${underperforming.length} high-spend, low-ROI campaigns`
      );
    }

    return recommendations;
  }

  /**
   * Format analytics document
   */
  private formatAnalytics(analytics: any): SpendAnalyticsType {
    return {
      analyticsId: analytics.analyticsId,
      clientId: analytics.clientId,
      period: analytics.period,
      budget: analytics.budget,
      spend: {
        total: analytics.spend.total,
        byChannel: analytics.spend.byChannel instanceof Map
          ? Object.fromEntries(analytics.spend.byChannel)
          : analytics.spend.byChannel,
        byCampaign: analytics.spend.byCampaign instanceof Map
          ? Object.fromEntries(analytics.spend.byCampaign)
          : analytics.spend.byCampaign,
        daily: analytics.spend.daily,
      },
      projections: analytics.projections,
      benchmarks: analytics.benchmarks,
      createdAt: analytics.createdAt,
      updatedAt: analytics.updatedAt,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;