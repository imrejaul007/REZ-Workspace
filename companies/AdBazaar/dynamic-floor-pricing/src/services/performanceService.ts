import { FloorPerformance, FloorPrice, IFloorPerformance } from '../models';
import { createLogger } from 'utils/logger.js';
import { floorPricingMetrics } from '../utils/metrics';

const logger = createLogger('PerformanceService');

interface PerformanceQuery {
  floorId?: string;
  inventoryId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface PerformanceSummary {
  totalImpressions: number;
  totalRevenue: number;
  averageEcpm: number;
  averageWinRate: number;
  averageFillRate: number;
  priceEfficiency: number;
  floorUtilization: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface PerformanceComparison {
  current: PerformanceSummary;
  previous: PerformanceSummary;
  changes: {
    impressions: number;
    revenue: number;
    ecpm: number;
    winRate: number;
    fillRate: number;
  };
  verdict: string;
}

export class PerformanceService {
  /**
   * Get performance data for a floor
   */
  async getPerformance(query: PerformanceQuery): Promise<{
    performance: IFloorPerformance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { floorId, inventoryId, startDate, endDate, page = 1, limit = 30 } = query;

    const filter: Record<string, unknown> = {};
    if (floorId) filter.floorId = floorId;
    if (inventoryId) filter.inventoryId = inventoryId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) (filter.date as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.date as Record<string, Date>).$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [performance, total] = await Promise.all([
      FloorPerformance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      FloorPerformance.countDocuments(filter)
    ]);

    logger.debug('Retrieved performance data', { total, page, limit });
    return { performance, total, page, limit };
  }

  /**
   * Get performance summary for a floor
   */
  async getPerformanceSummary(floorId: string, days: number = 30): Promise<PerformanceSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await FloorPerformance.find({
      floorId,
      date: { $gte: startDate }
    });

    if (performance.length === 0) {
      return {
        totalImpressions: 0,
        totalRevenue: 0,
        averageEcpm: 0,
        averageWinRate: 0,
        averageFillRate: 0,
        priceEfficiency: 0,
        floorUtilization: 0,
        trend: 'stable'
      };
    }

    const totalImpressions = performance.reduce((sum, p) => sum + p.metrics.impressions, 0);
    const totalRevenue = performance.reduce((sum, p) => sum + p.metrics.revenue, 0);
    const averageEcpm = performance.reduce((sum, p) => sum + p.metrics.ecpm, 0) / performance.length;
    const averageWinRate = performance.reduce((sum, p) => sum + p.metrics.winRate, 0) / performance.length;
    const averageFillRate = performance.reduce((sum, p) => sum + p.metrics.fillRate, 0) / performance.length;
    const priceEfficiency = performance.reduce((sum, p) => sum + p.efficiency.priceEfficiency, 0) / performance.length;
    const floorUtilization = performance.reduce((sum, p) => sum + p.efficiency.floorUtilization, 0) / performance.length;

    // Determine trend by comparing first half vs second half
    const midpoint = Math.floor(performance.length / 2);
    const firstHalf = performance.slice(0, midpoint);
    const secondHalf = performance.slice(midpoint);

    const firstHalfRevenue = firstHalf.reduce((sum, p) => sum + p.metrics.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, p) => sum + p.metrics.revenue, 0);

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfRevenue > firstHalfRevenue * 1.05) trend = 'improving';
    else if (secondHalfRevenue < firstHalfRevenue * 0.95) trend = 'declining';

    return {
      totalImpressions,
      totalRevenue,
      averageEcpm: Math.round(averageEcpm * 100) / 100,
      averageWinRate: Math.round(averageWinRate * 1000) / 1000,
      averageFillRate: Math.round(averageFillRate * 1000) / 1000,
      priceEfficiency: Math.round(priceEfficiency * 100) / 100,
      floorUtilization: Math.round(floorUtilization * 100) / 100,
      trend
    };
  }

  /**
   * Compare performance between two periods
   */
  async comparePerformance(
    floorId: string,
    currentDays: number = 7,
    previousDays: number = 7
  ): Promise<PerformanceComparison> {
    const now = new Date();

    // Current period
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - currentDays);

    // Previous period
    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - currentDays - previousDays);
    const previousEnd = new Date(currentStart);

    const [currentPerformance, previousPerformance] = await Promise.all([
      FloorPerformance.find({
        floorId,
        date: { $gte: currentStart }
      }),
      FloorPerformance.find({
        floorId,
        date: { $gte: previousStart, $lt: previousEnd }
      })
    ]);

    const current = this.calculateSummary(currentPerformance);
    const previous = this.calculateSummary(previousPerformance);

    const changes = {
      impressions: previous.totalImpressions > 0
        ? ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions) * 100
        : 0,
      revenue: previous.totalRevenue > 0
        ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
        : 0,
      ecpm: previous.averageEcpm > 0
        ? ((current.averageEcpm - previous.averageEcpm) / previous.averageEcpm) * 100
        : 0,
      winRate: previous.averageWinRate > 0
        ? ((current.averageWinRate - previous.averageWinRate) / previous.averageWinRate) * 100
        : 0,
      fillRate: previous.averageFillRate > 0
        ? ((current.averageFillRate - previous.averageFillRate) / previous.averageFillRate) * 100
        : 0
    };

    // Generate verdict
    let verdict = 'Performance is stable.';
    if (changes.revenue > 10 && changes.ecpm > 5) {
      verdict = 'Strong performance improvement. Revenue and eCPM both up significantly.';
    } else if (changes.revenue > 5) {
      verdict = 'Revenue is improving. Monitor eCPM for sustainability.';
    } else if (changes.revenue < -10) {
      verdict = 'Performance decline detected. Consider reviewing floor pricing strategy.';
    } else if (changes.winRate < -20) {
      verdict = 'Win rate has dropped significantly. Floor may be too high.';
    } else if (changes.ecpm > 10) {
      verdict = 'eCPM improving but watch for impact on win rate.';
    }

    return { current, previous, changes, verdict };
  }

  /**
   * Calculate summary from performance data
   */
  private calculateSummary(performance: IFloorPerformance[]): PerformanceSummary {
    if (performance.length === 0) {
      return {
        totalImpressions: 0,
        totalRevenue: 0,
        averageEcpm: 0,
        averageWinRate: 0,
        averageFillRate: 0,
        priceEfficiency: 0,
        floorUtilization: 0,
        trend: 'stable'
      };
    }

    const totalImpressions = performance.reduce((sum, p) => sum + p.metrics.impressions, 0);
    const totalRevenue = performance.reduce((sum, p) => sum + p.metrics.revenue, 0);
    const averageEcpm = performance.reduce((sum, p) => sum + p.metrics.ecpm, 0) / performance.length;
    const averageWinRate = performance.reduce((sum, p) => sum + p.metrics.winRate, 0) / performance.length;
    const averageFillRate = performance.reduce((sum, p) => sum + p.metrics.fillRate, 0) / performance.length;
    const priceEfficiency = performance.reduce((sum, p) => sum + p.efficiency.priceEfficiency, 0) / performance.length;
    const floorUtilization = performance.reduce((sum, p) => sum + p.efficiency.floorUtilization, 0) / performance.length;

    return {
      totalImpressions,
      totalRevenue,
      averageEcpm: Math.round(averageEcpm * 100) / 100,
      averageWinRate: Math.round(averageWinRate * 1000) / 1000,
      averageFillRate: Math.round(averageFillRate * 1000) / 1000,
      priceEfficiency: Math.round(priceEfficiency * 100) / 100,
      floorUtilization: Math.round(floorUtilization * 100) / 100,
      trend: 'stable' as const
    };
  }

  /**
   * Record performance data for a floor
   */
  async recordPerformance(data: {
    floorId: string;
    inventoryId: string;
    date: Date;
    impressions: number;
    revenue: number;
    ecpm: number;
    fillRate: number;
    winRate: number;
    bids: number;
    bidsWon: number;
    averageWinningBid: number;
    totalRequests: number;
  }): Promise<IFloorPerformance> {
    logger.info('Recording performance data', { floorId: data.floorId, date: data.date });

    // Get floor for comparison
    const floor = await FloorPrice.findById(data.floorId);
    const floorPrice = floor?.price || 0;

    // Calculate efficiency metrics
    const revenueAboveFloor = Math.max(0, data.revenue - (data.impressions * floorPrice / 1000));
    const ecpmAboveFloor = floorPrice > 0 ? (data.ecpm - floorPrice) :0;
    const priceEfficiency = floorPrice > 0 ? (data.ecpm / floorPrice) : 0;
    const floorUtilization = data.bids > 0 ? (data.bidsWon / data.bids) : 0;
    const demandCapture = data.totalRequests > 0 ? (data.bids / data.totalRequests) : 0;

    // Upsert performance record
    const performance = await FloorPerformance.findOneAndUpdate(
      {
        floorId: data.floorId,
        date: data.date
      },
      {
        $set: {
          inventoryId: data.inventoryId,
          metrics: {
            impressions: data.impressions,
            revenue: data.revenue,
            ecpm: data.ecpm,
            fillRate: data.fillRate,
            winRate: data.winRate,
            bids: data.bids,
            bidsWon: data.bidsWon,
            averageWinningBid: data.averageWinningBid,
            totalRequests: data.totalRequests
          },
          comparison: {
            vsPreviousPeriod: {
              revenueChange: 0, // Will be calculated if previous day exists
              ecpmChange: 0,
              impressionsChange: 0
            },
            vsFloor: {
              revenueAboveFloor,
              ecpmAboveFloor
            }
          },
          efficiency: {
            priceEfficiency,
            demandCapture,
            floorUtilization
          }
        }
      },
      { upsert: true, new: true }
    );

    // Update previous day comparison
    const previousDay = new Date(data.date);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousPerformance = await FloorPerformance.findOne({
      floorId: data.floorId,
      date: previousDay
    });

    if (previousPerformance) {
      performance.comparison.vsPreviousPeriod = {
        revenueChange: previousPerformance.metrics.revenue > 0
          ? ((data.revenue - previousPerformance.metrics.revenue) / previousPerformance.metrics.revenue) * 100
          : 0,
        ecpmChange: previousPerformance.metrics.ecpm > 0
          ? ((data.ecpm - previousPerformance.metrics.ecpm) / previousPerformance.metrics.ecpm) * 100
          : 0,
        impressionsChange: previousPerformance.metrics.impressions > 0
          ? ((data.impressions - previousPerformance.metrics.impressions) / previousPerformance.metrics.impressions) * 100
          : 0
      };
      await performance.save();
    }

    // Update metrics
    floorPricingMetrics.revenueImpactTotal.inc(
      { inventory_type: floor?.type || 'unknown' },
      data.revenue
    );

    logger.info('Performance data recorded', { floorId: data.floorId, revenue: data.revenue });
    return performance;
  }

  /**
   * Get top performing floors
   */
  async getTopPerformingFloors(days: number = 7, limit: number = 10): Promise<Array<{
    floorId: string;
    inventoryId: string;
    revenue: number;
    ecpm: number;
    winRate: number;
    floorPrice: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await FloorPerformance.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$floorId',
          inventoryId: { $first: '$inventoryId' },
          totalRevenue: { $sum: '$metrics.revenue' },
          avgEcpm: { $avg: '$metrics.ecpm' },
          avgWinRate: { $avg: '$metrics.winRate' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Get floor prices
    const floorIds = performance.map(p => p._id);
    const floors = await FloorPrice.find({ _id: { $in: floorIds } });
    const floorMap = new Map(floors.map(f => [f._id.toString(), f.price]));

    return performance.map(p => ({
      floorId: p._id,
      inventoryId: p.inventoryId,
      revenue: p.totalRevenue,
      ecpm: Math.round(p.avgEcpm * 100) / 100,
      winRate: Math.round(p.avgWinRate * 1000) / 1000,
      floorPrice: floorMap.get(p._id) || 0
    }));
  }

  /**
   * Get performance alerts for a floor
   */
  async getPerformanceAlerts(floorId: string): Promise<Array<{
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>> {
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }> = [];

    // Get last 7 days performance
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const performance = await FloorPerformance.find({
      floorId,
      date: { $gte: sevenDaysAgo }
    });

    if (performance.length === 0) {
      return alerts;
    }

    const avgWinRate = performance.reduce((sum, p) => sum + p.metrics.winRate, 0) / performance.length;
    const avgFillRate = performance.reduce((sum, p) => sum + p.metrics.fillRate, 0) / performance.length;
    const avgEcpm = performance.reduce((sum, p) => sum + p.metrics.ecpm, 0) / performance.length;

    // Check win rate
    if (avgWinRate < 0.2) {
      alerts.push({
        type: 'critical',
        message: `Win rate critically low at ${(avgWinRate * 100).toFixed(1)}%. Floor may be too high.`,
        metric: 'winRate',
        value: avgWinRate,
        threshold: 0.2
      });
    } else if (avgWinRate < 0.4) {
      alerts.push({
        type: 'warning',
        message: `Win rate below target at ${(avgWinRate * 100).toFixed(1)}%. Consider lowering floor.`,
        metric: 'winRate',
        value: avgWinRate,
        threshold: 0.4
      });
    }

    // Check fill rate
    if (avgFillRate < 0.5) {
      alerts.push({
        type: 'warning',
        message: `Fill rate low at ${(avgFillRate * 100).toFixed(1)}%. Check demand and pricing.`,
        metric: 'fillRate',
        value: avgFillRate,
        threshold: 0.5
      });
    }

    // Check eCPM consistency
    const ecpmVariance = this.calculateVariance(performance.map(p => p.metrics.ecpm));
    if (ecpmVariance > 0.5) {
      alerts.push({
        type: 'warning',
        message: 'High eCPM variance detected. Price stability may be an issue.',
        metric: 'ecpmVariance',
        value: ecpmVariance,
        threshold: 0.5
      });
    }

    return alerts;
  }

  /**
   * Calculate variance of values
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
}

export const performanceService = new PerformanceService();