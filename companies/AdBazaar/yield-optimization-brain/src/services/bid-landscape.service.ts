import {
  BidLandscapeRequest,
  BidLandscapeResponse,
  BidDistribution,
} from '../types/index.js';
import { BidLandscape as BidLandscapeModel, YieldDecision } from '../models/index.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

export class BidLandscapeService {
  /**
   * Analyze bid landscape for inventory types
   */
  async analyzeBidLandscape(request: BidLandscapeRequest): Promise<BidLandscapeResponse> {
    const { inventoryType = 'all', context = 'all', timeRange = '24h' } = request;

    logger.info('Analyzing bid landscape', { inventoryType, context, timeRange });

    try {
      // Get time window based on range
      const windowMs = this.getTimeWindow(timeRange);
      const startDate = new Date(Date.now() - windowMs);

      // Get bid data from decisions
      const bids = await this.getBidData(inventoryType, context, startDate);

      // Calculate distribution
      const distribution = this.calculateDistribution(bids);

      // Calculate statistics
      const statistics = this.calculateStatistics(bids);

      // Calculate trends
      const trends = await this.calculateTrends(inventoryType, context, timeRange);

      // Generate insights
      const insights = this.generateInsights(distribution, statistics, trends);

      // Persist landscape data
      await this.persistLandscapeData(inventoryType, context, timeRange, distribution, statistics);

      logger.info('Bid landscape analysis complete', {
        inventoryType,
        bidCount: bids.length,
        median: statistics.median,
        mean: statistics.mean,
      });

      return {
        timeRange,
        inventoryType,
        context,
        distribution,
        statistics,
        trends,
        insights,
      };
    } catch (error) {
      logger.error('Error analyzing bid landscape', {
        inventoryType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get time window in milliseconds
   */
  private getTimeWindow(timeRange: string): number {
    const windows: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return windows[timeRange] || windows['24h'];
  }

  /**
   * Get bid data from recent decisions
   */
  private async getBidData(
    inventoryType: string,
    context: string,
    startDate: Date
  ): Promise<number[]> {
    const query: Record<string, unknown> = {
      timestamp: { $gte: startDate },
    };

    if (inventoryType !== 'all') {
      query.inventoryType = inventoryType;
    }

    const decisions = await YieldDecision.find(query)
      .select('bid floorPrice expectedRevenue expectedCTR')
      .lean();

    return decisions.map(d => d.bid);
  }

  /**
   * Calculate bid distribution
   */
  private calculateDistribution(bids: number[]): BidDistribution[] {
    if (bids.length === 0) {
      return [];
    }

    // Define bid buckets
    const buckets = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 7.5, 10.0, 15.0, 20.0, 50.0];
    const distribution: BidDistribution[] = [];

    let cumulativeCount = 0;
    const total = bids.length;

    for (let i = 0; i < buckets.length; i++) {
      const upperBound = buckets[i];
      const lowerBound = i === 0 ? 0 : buckets[i - 1];

      const count = bids.filter(b => b >= lowerBound && b < upperBound).length;
      cumulativeCount += count;

      distribution.push({
        bid: upperBound,
        count,
        percentage: (count / total) * 100,
        cumulativePercentage: (cumulativeCount / total) * 100,
      });
    }

    // Add final bucket for bids >= 50
    const finalCount = bids.filter(b => b >= 50).length;
    cumulativeCount += finalCount;

    distribution.push({
      bid: 100,
      count: finalCount,
      percentage: (finalCount / total) * 100,
      cumulativePercentage: (cumulativeCount / total) * 100,
    });

    return distribution;
  }

  /**
   * Calculate statistics from bids
   */
  private calculateStatistics(bids: number[]): BidLandscapeResponse['statistics'] {
    if (bids.length === 0) {
      return {
        min: 0,
        max: 0,
        median: 0,
        mean: 0,
        p25: 0,
        p75: 0,
        p90: 0,
        p95: 0,
      };
    }

    // Sort bids for percentile calculations
    const sorted = [...bids].sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number): number => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: getPercentile(sorted, 50),
      mean: bids.reduce((a, b) => a + b, 0) / bids.length,
      p25: getPercentile(sorted, 25),
      p75: getPercentile(sorted, 75),
      p90: getPercentile(sorted, 90),
      p95: getPercentile(sorted, 95),
    };
  }

  /**
   * Calculate bid trends over time
   */
  private async calculateTrends(
    inventoryType: string,
    context: string,
    timeRange: string
  ): Promise<BidLandscapeResponse['trends']> {
    // Get current period data
    const currentWindow = this.getTimeWindow(timeRange);
    const currentStart = new Date(Date.now() - currentWindow);
    const currentBids = await this.getBidData(inventoryType, context, currentStart);
    const currentMean = currentBids.length > 0
      ? currentBids.reduce((a, b) => a + b, 0) / currentBids.length
      : 0;

    // Get previous period data
    const previousWindow = currentWindow * 2;
    const previousStart = new Date(Date.now() - previousWindow);
    const previousEnd = new Date(Date.now() - currentWindow);
    const previousBids = await this.getBidData(inventoryType, context, previousStart);
    const previousMean = previousBids.length > 0
      ? previousBids.reduce((a, b) => a + b, 0) / previousBids.length
      : 0;

    // Calculate change
    let changePercent = 0;
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let velocity = 0;

    if (previousMean > 0) {
      changePercent = ((currentMean - previousMean) / previousMean) * 100;

      if (changePercent > 5) {
        direction = 'up';
      } else if (changePercent < -5) {
        direction = 'down';
      }

      // Calculate velocity (rate of change)
      velocity = changePercent / (currentWindow / (60 * 60 * 1000)); // per hour
    }

    return {
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      velocity: Math.round(velocity * 100) / 100,
    };
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    distribution: BidDistribution[],
    statistics: BidLandscapeResponse['statistics'],
    trends: BidLandscapeResponse['trends']
  ): string[] {
    const insights: string[] = [];

    // Analyze distribution
    const highValueBids = distribution.filter(d => d.cumulativePercentage > 70);
    if (highValueBids.length > 0) {
      insights.push(`${highValueBids[0].bid}% of bids are at or above $${highValueBids[0].bid}`);
    }

    // Analyze trends
    if (trends.direction === 'up') {
      insights.push(`Bid prices are trending up (${trends.changePercent}% increase)`);
    } else if (trends.direction === 'down') {
      insights.push(`Bid prices are trending down (${trends.changePercent}% decrease)`);
    }

    // Analyze variance
    const variance = statistics.max - statistics.min;
    if (variance > 5) {
      insights.push('High variance in bids - consider segmenting by value');
    }

    // Analyze median vs mean
    if (statistics.median < statistics.mean * 0.8) {
      insights.push('Mean is higher than median - skewness indicates premium inventory opportunities');
    }

    // Analyze percentiles
    if (statistics.p90 > statistics.p75 * 1.5) {
      insights.push('Top 10% of bids are significantly higher - premium inventory available');
    }

    return insights;
  }

  /**
   * Persist landscape data to database
   */
  private async persistLandscapeData(
    inventoryType: string,
    context: string,
    timeRange: string,
    distribution: BidDistribution[],
    statistics: BidLandscapeResponse['statistics']
  ): Promise<void> {
    try {
      const doc = new BidLandscapeModel({
        inventoryType,
        context,
        timeRange,
        distribution,
        statistics,
        timestamp: new Date(),
      });

      await doc.save();
    } catch (error) {
      logger.error('Failed to persist landscape data', {
        inventoryType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get historical landscape data
   */
  async getHistoricalLandscape(
    inventoryType: string,
    timeRange: string,
    limit = 30
  ): Promise<BidLandscapeResponse[]> {
    const docs = await BidLandscapeModel
      .find({
        inventoryType,
        timeRange,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.map(doc => ({
      timeRange: doc.timeRange,
      inventoryType: doc.inventoryType,
      context: doc.context,
      distribution: doc.distribution,
      statistics: doc.statistics,
      trends: { direction: 'stable' as const, changePercent: 0, velocity: 0 },
      insights: [],
    }));
  }

  /**
   * Compare bid landscapes between inventory types
   */
  async compareLandscapes(inventoryTypes: string[], timeRange: string): Promise<{
    comparison: {
      inventoryType: string;
      median: number;
      mean: number;
      p75: number;
      totalBids: number;
    }[];
    insights: string[];
  }> {
    const comparison = [];

    for (const inventoryType of inventoryTypes) {
      const windowMs = this.getTimeWindow(timeRange);
      const startDate = new Date(Date.now() - windowMs);
      const bids = await this.getBidData(inventoryType, 'all', startDate);

      if (bids.length > 0) {
        const sorted = [...bids].sort((a, b) => a - b);
        const getPercentile = (arr: number[], p: number): number => {
          const index = Math.ceil((p / 100) * arr.length) - 1;
          return arr[Math.max(0, index)];
        };

        comparison.push({
          inventoryType,
          median: getPercentile(sorted, 50),
          mean: bids.reduce((a, b) => a + b, 0) / bids.length,
          p75: getPercentile(sorted, 75),
          totalBids: bids.length,
        });
      }
    }

    // Generate comparison insights
    const insights: string[] = [];
    if (comparison.length >= 2) {
      comparison.sort((a, b) => b.median - a.median);
      const highest = comparison[0];
      const lowest = comparison[comparison.length - 1];
      const premium = ((highest.median - lowest.median) / lowest.median * 100).toFixed(1);

      insights.push(`${highest.inventoryType} commands ${premium}% premium over ${lowest.inventoryType}`);
    }

    return { comparison, insights };
  }
}

export const bidLandscapeService = new BidLandscapeService();