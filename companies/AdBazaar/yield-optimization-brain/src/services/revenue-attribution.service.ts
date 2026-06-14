import {
  RevenueAttributionRequest,
  RevenueAttributionResponse,
  RevenueAttribution,
} from '../types/index.js';
import { RevenueAttribution as RevenueAttributionModel, YieldDecision } from '../models/index.js';
import logger from '../config/logger.js';

export class RevenueAttributionService {
  /**
   * Attribute revenue across dimensions
   */
  async attributeRevenue(request: RevenueAttributionRequest): Promise<RevenueAttributionResponse> {
    const {
      startDate,
      endDate,
      granularity = 'day',
      groupBy = 'advertiser',
      filters = {},
    } = request;

    logger.info('Attributing revenue', {
      startDate,
      endDate,
      groupBy,
      granularity,
    });

    try {
      // Build query
      const query: Record<string, unknown> = {
        timestamp: { $gte: startDate, $lte: endDate },
      };

      if (filters.advertiserId) {
        query.advertiserId = filters.advertiserId;
      }
      if (filters.placementId) {
        query.inventorySlotId = filters.placementId;
      }
      if (filters.format) {
        query.inventoryType = filters.format;
      }

      // Aggregate revenue data
      const rawData = await YieldDecision.find(query).lean();

      // Group by dimension
      const grouped = this.groupByDimension(rawData, groupBy, granularity);

      // Calculate attribution metrics
      const attribution = this.calculateAttribution(grouped, groupBy);

      // Calculate summary
      const summary = this.calculateSummary(attribution);

      // Find top performers
      const topPerformers = this.findTopPerformers(attribution);

      // Generate insights
      const insights = this.generateInsights(attribution, summary);

      // Persist attribution data
      await this.persistAttributionData(request, summary, attribution);

      logger.info('Revenue attribution complete', {
        totalImpressions: summary.totalImpressions,
        totalRevenue: summary.totalRevenue,
        dimensions: attribution.length,
      });

      return {
        request,
        summary,
        attribution,
        topPerformers,
        insights,
      };
    } catch (error) {
      logger.error('Error attributing revenue', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Group data by dimension
   */
  private groupByDimension(
    data: {
      inventorySlotId: string;
      advertiserId: string;
      inventoryType: string;
      expectedRevenue: number;
      expectedCTR: number;
      expectedCVR: number;
      timestamp: Date;
    }[],
    groupBy: string,
    granularity: string
  ): Map<string, {
    impressions: number;
    revenue: number;
    ctrSum: number;
    cvrSum: number;
    conversions: number;
  }> {
    const grouped = new Map<string, {
      impressions: number;
      revenue: number;
      ctrSum: number;
      cvrSum: number;
      conversions: number;
      count: number;
    }>();

    for (const record of data) {
      let key: string;

      switch (groupBy) {
        case 'ad':
          key = record.inventorySlotId;
          break;
        case 'advertiser':
          key = record.advertiserId;
          break;
        case 'placement':
          key = record.inventorySlotId;
          break;
        case 'format':
          key = record.inventoryType;
          break;
        case 'segment':
          key = 'segment'; // Would need user context parsing
          break;
        default:
          key = 'unknown';
      }

      const existing = grouped.get(key) || {
        impressions: 0,
        revenue: 0,
        ctrSum: 0,
        cvrSum: 0,
        conversions: 0,
        count: 0,
      };

      existing.impressions += 1;
      existing.revenue += record.expectedRevenue;
      existing.ctrSum += record.expectedCTR || 0;
      existing.cvrSum += record.expectedCVR || 0;
      existing.conversions += Math.round((record.expectedCVR || 0) * 100); // Simulated conversions
      existing.count += 1;

      grouped.set(key, existing);
    }

    // Convert to simple map
    const result = new Map<string, {
      impressions: number;
      revenue: number;
      ctrSum: number;
      cvrSum: number;
      conversions: number;
    }>();

    for (const [key, value] of grouped) {
      result.set(key, {
        impressions: value.impressions,
        revenue: value.revenue,
        ctrSum: value.ctrSum,
        cvrSum: value.cvrSum,
        conversions: value.conversions,
      });
    }

    return result;
  }

  /**
   * Calculate attribution metrics
   */
  private calculateAttribution(
    grouped: Map<string, {
      impressions: number;
      revenue: number;
      ctrSum: number;
      cvrSum: number;
      conversions: number;
    }>,
    groupBy: string
  ): RevenueAttribution[] {
    const attribution: RevenueAttribution[] = [];
    let totalImpressions = 0;
    let totalRevenue = 0;

    // First pass to get totals
    for (const [, metrics] of grouped) {
      totalImpressions += metrics.impressions;
      totalRevenue += metrics.revenue;
    }

    // Second pass to calculate attribution
    for (const [dimensionValue, metrics] of grouped) {
      const avgCTR = metrics.count > 0 ? metrics.ctrSum / metrics.count : 0;
      const avgCVR = metrics.count > 0 ? metrics.cvrSum / metrics.count : 0;
      const rpm = metrics.impressions > 0 ? (metrics.revenue / metrics.impressions) * 1000 : 0;

      attribution.push({
        dimension: groupBy as RevenueAttribution['dimension'],
        dimensionValue,
        impressions: metrics.impressions,
        revenue: metrics.revenue,
        rpm,
        ctr: avgCTR,
        conversions: metrics.conversions,
        conversionRate: avgCVR,
        ltv: this.calculateLTV(metrics.revenue, metrics.conversions),
        attributes: {
          impressions: metrics.impressions,
          revenue: metrics.revenue,
          percentage: totalRevenue > 0 ? (metrics.revenue / totalRevenue) * 100 : 0,
        },
      });
    }

    // Sort by revenue descending
    attribution.sort((a, b) => b.revenue - a.revenue);

    return attribution;
  }

  /**
   * Calculate LTV (Lifetime Value) from revenue and conversions
   */
  private calculateLTV(revenue: number, conversions: number): number {
    if (conversions === 0) return 0;

    // Simplified LTV: revenue per conversion with assumed repeat rate
    const avgOrderValue = revenue / conversions;
    const assumedRepeatPurchases = 3; // Conservative estimate
    const assumedMargin = 0.3; // 30% margin

    return avgOrderValue * assumedRepeatPurchases * assumedMargin;
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(attribution: RevenueAttribution[]): RevenueAttributionResponse['summary'] {
    const totalImpressions = attribution.reduce((sum, a) => sum + a.impressions, 0);
    const totalRevenue = attribution.reduce((sum, a) => sum + a.revenue, 0);
    const totalConversions = attribution.reduce((sum, a) => sum + a.conversions, 0);

    const avgRPM = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0;
    const avgCVR = totalImpressions > 0 ? totalConversions / totalImpressions : 0;

    return {
      totalImpressions,
      totalRevenue,
      averageRPM: Math.round(avgRPM * 1000) / 1000,
      totalConversions,
      averageCVR: Math.round(avgCVR * 10000) / 10000,
    };
  }

  /**
   * Find top performers
   */
  private findTopPerformers(attribution: RevenueAttribution[]): RevenueAttributionResponse['topPerformers'] {
    const topPerformers: RevenueAttributionResponse['topPerformers'] = [];

    // Top by revenue
    if (attribution.length > 0) {
      topPerformers.push({
        dimension: attribution[0].dimension,
        value: attribution[0].revenue,
        metric: 'revenue',
      });
    }

    // Top by CTR
    const sortedByCTR = [...attribution].sort((a, b) => b.ctr - a.ctr);
    if (sortedByCTR.length > 0) {
      topPerformers.push({
        dimension: sortedByCTR[0].dimension,
        value: sortedByCTR[0].ctr,
        metric: 'ctr',
      });
    }

    // Top by conversions
    const sortedByConversions = [...attribution].sort((a, b) => b.conversions - a.conversions);
    if (sortedByConversions.length > 0) {
      topPerformers.push({
        dimension: sortedByConversions[0].dimension,
        value: sortedByConversions[0].conversions,
        metric: 'conversions',
      });
    }

    // Top by RPM
    const sortedByRPM = [...attribution].sort((a, b) => b.rpm - a.rpm);
    if (sortedByRPM.length > 0) {
      topPerformers.push({
        dimension: sortedByRPM[0].dimension,
        value: sortedByRPM[0].rpm,
        metric: 'rpm',
      });
    }

    return topPerformers;
  }

  /**
   * Generate insights from attribution data
   */
  private generateInsights(
    attribution: RevenueAttribution[],
    summary: RevenueAttributionResponse['summary']
  ): string[] {
    const insights: string[] = [];

    // Analyze concentration
    const top3Revenue = attribution.slice(0, 3).reduce((sum, a) => sum + a.revenue, 0);
    const concentration = (top3Revenue / summary.totalRevenue) * 100;

    if (concentration > 70) {
      insights.push(`High revenue concentration: Top 3 accounts for ${concentration.toFixed(0)}% of revenue`);
    } else if (concentration < 40) {
      insights.push('Diversified revenue: No single account dominates');
    }

    // Analyze RPM variance
    const rpms = attribution.map(a => a.rpm).filter(r => r > 0);
    if (rpms.length > 1) {
      const avgRPM = rpms.reduce((a, b) => a + b, 0) / rpms.length;
      const maxRPM = Math.max(...rpms);
      const minRPM = Math.min(...rpms);

      if (maxRPM / minRPM > 3) {
        insights.push(`High RPM variance (${minRPM.toFixed(2)} to ${maxRPM.toFixed(2)}) - opportunity to optimize underperformers`);
      }
    }

    // Analyze conversion rates
    const avgCVR = attribution.reduce((sum, a) => sum + a.conversionRate, 0) / attribution.length;
    if (avgCVR < 0.01) {
      insights.push('Low average conversion rate - consider audience targeting improvements');
    } else if (avgCVR > 0.05) {
      insights.push('Strong conversion performance across inventory');
    }

    // Analyze LTV
    const topLTV = [...attribution].sort((a, b) => b.ltv - a.ltv)[0];
    if (topLTV && topLTV.ltv > 0) {
      insights.push(`Highest LTV: ${topLTV.dimensionValue} at $${topLTV.ltv.toFixed(2)} per conversion`);
    }

    return insights;
  }

  /**
   * Persist attribution data to database
   */
  private async persistAttributionData(
    request: RevenueAttributionRequest,
    summary: RevenueAttributionResponse['summary'],
    attribution: RevenueAttribution[]
  ): Promise<void> {
    try {
      // Persist each attribution record
      for (const attr of attribution) {
        const doc = new RevenueAttributionModel({
          dimension: attr.dimension,
          dimensionValue: attr.dimensionValue,
          impressions: attr.impressions,
          revenue: attr.revenue,
          rpm: attr.rpm,
          ctr: attr.ctr,
          conversions: attr.conversions,
          conversionRate: attr.conversionRate,
          ltv: attr.ltv,
          periodStart: request.startDate,
          periodEnd: request.endDate,
          timestamp: new Date(),
        });

        await doc.save();
      }
    } catch (error) {
      logger.error('Failed to persist attribution data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get time series revenue data
   */
  async getTimeSeriesRevenue(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    timestamp: Date;
    revenue: number;
    impressions: number;
    rpm: number;
  }[]> {
    const query = {
      timestamp: { $gte: startDate, $lte: endDate },
    };

    const decisions = await YieldDecision.find(query).lean();

    // Group by time bucket
    const grouped = new Map<string, { revenue: number; impressions: number }>();

    for (const decision of decisions) {
      const bucket = this.getTimeBucket(decision.timestamp, granularity);
      const existing = grouped.get(bucket) || { revenue: 0, impressions: 0 };

      existing.revenue += decision.expectedRevenue;
      existing.impressions += 1;

      grouped.set(bucket, existing);
    }

    // Convert to array
    const timeSeries = Array.from(grouped.entries())
      .map(([timestamp, metrics]) => ({
        timestamp: new Date(timestamp),
        revenue: metrics.revenue,
        impressions: metrics.impressions,
        rpm: metrics.impressions > 0 ? (metrics.revenue / metrics.impressions) * 1000 : 0,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timeSeries;
  }

  /**
   * Get time bucket for grouping
   */
  private getTimeBucket(date: Date, granularity: string): string {
    const d = new Date(date);

    switch (granularity) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }

    return d.toISOString();
  }
}

export const revenueAttributionService = new RevenueAttributionService();