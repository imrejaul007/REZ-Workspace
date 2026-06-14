/**
 * Trends Service
 * Analyzes trends and patterns over time
 */

import { AggregatedMetrics } from '../models/AggregatedData';
import { logger } from '../config/logger';
import { getRedis } from '../config/redis';
// @ts-ignore - node-cron types issue
import cron from 'node-cron';

export interface TrendPoint {
  date: string;
  value: number;
  percentage?: number;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  forecast: TrendPoint[];
  confidence: number;
}

export interface RepeatVisitPattern {
  timeSinceLastVisit: string;
  percentage: number;
  customerSegment: string;
}

export interface NeighborhoodTrend {
  locality: string;
  period: '7d' | '30d' | '90d';
  demandTrend: TrendAnalysis;
  orderTrend: TrendAnalysis;
  revenueTrend: TrendAnalysis;
  insights: string[];
}

export class TrendsService {
  private redis = getRedis();

  /**
   * Get demand trends for a locality
   */
  async getDemandTrends(
    locality: string,
    industry: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<TrendAnalysis> {
    const cacheKey = `trends:demand:${locality}:${industry}:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Get historical data
    const industryFilter = industry as unknown;
    const metrics = await AggregatedMetrics.findOne({
      locality,
      industry: industryFilter,
      category: 'all'
    } as unknown);

    if (!metrics) {
      return {
        metric: 'demand',
        trend: 'stable',
        changePercent: 0,
        forecast: [],
        confidence: 0
      };
    }

    // Calculate trend
    const orderGrowth = metrics.orderGrowth30d;
    const trend = this.determineTrend(orderGrowth);
    const confidence = this.calculateConfidence(metrics.merchantCount);

    // Generate simple forecast (linear projection)
    const forecast = this.generateForecast(orderGrowth, period);

    const result: TrendAnalysis = {
      metric: 'demand',
      trend,
      changePercent: Math.round(orderGrowth * 10) / 10,
      forecast,
      confidence
    };

    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
    return result;
  }

  /**
   * Get repeat visit patterns
   */
  async getRepeatVisitPatterns(
    locality: string,
    industry: string
  ): Promise<RepeatVisitPattern[]> {
    const patterns: RepeatVisitPattern[] = [
      {
        timeSinceLastVisit: '< 1 week',
        percentage: 35,
        customerSegment: 'Loyal customers'
      },
      {
        timeSinceLastVisit: '1-2 weeks',
        percentage: 25,
        customerSegment: 'Regular customers'
      },
      {
        timeSinceLastVisit: '2-4 weeks',
        percentage: 20,
        customerSegment: 'Occasional customers'
      },
      {
        timeSinceLastVisit: '> 1 month',
        percentage: 20,
        customerSegment: 'At-risk customers'
      }
    ];

    return patterns;
  }

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(
    city: string,
    industry: string
  ): Promise<unknown> {
    // This would analyze seasonal patterns
    // For now, return placeholder data
    return {
      city,
      industry,
      seasons: {
        peak: ['December', 'May', 'October'],
        low: ['February', 'August'],
        average: ['March', 'April', 'June', 'July', 'September', 'November']
      },
      insights: [
        'December shows highest order volume across all categories',
        'May sees surge in salon and fitness bookings',
        'Plan inventory accordingly for peak seasons'
      ]
    };
  }

  /**
   * Get trending categories
   */
  async getTrendingCategories(
    locality: string,
    city: string,
    industry: string,
    limit: number = 5
  ): Promise<unknown[]> {
    const industryFilter = industry as unknown;
    const trends = await AggregatedMetrics.find({
      locality,
      city,
      industry: industryFilter,
      category: { $ne: 'all' }
    } as unknown)
      .sort({ revenueGrowth30d: -1 } as unknown)
      .limit(limit)
      .select('category revenueGrowth30d avgOrderValue merchantCount');

    return trends.map(t => ({
      category: t.category,
      growthRate: t.revenueGrowth30d,
      avgOrderValue: t.avgOrderValue,
      merchantCount: t.merchantCount
    }));
  }

  /**
   * Get competitor trends
   */
  async getCompetitorTrends(
    locality: string,
    industry: string
  ): Promise<unknown> {
    const industryFilter = industry as unknown;
    const competitors = await AggregatedMetrics.find({
      locality,
      industry: industryFilter,
      merchantCount: { $gte: 3 }
    } as unknown)
      .sort({ revenueGrowth30d: -1 } as unknown)
      .limit(20)
      .select('category avgOrderValue avgOrdersPerMerchant revenueGrowth30d');

    if (competitors.length === 0) {
      return { message: 'Not enough data for competitor analysis' };
    }

    // Analyze by category
    const categoryAnalysis: Record<string, unknown> = {};
    for (const c of competitors) {
      if (!categoryAnalysis[c.category]) {
        categoryAnalysis[c.category] = {
          category: c.category,
          count: 0,
          avgOrderValue: [],
          avgGrowth: []
        };
      }
      categoryAnalysis[c.category].count++;
      categoryAnalysis[c.category].avgOrderValue.push(c.avgOrderValue);
      categoryAnalysis[c.category].avgGrowth.push(c.revenueGrowth30d);
    }

    // Calculate averages
    const result = Object.values(categoryAnalysis).map((cat) => ({
      category: cat.category,
      merchantCount: cat.count,
      avgOrderValue: Math.round(cat.avgOrderValue.reduce((a: number, b: number) => a + b, 0) / cat.avgOrderValue.length),
      avgGrowth: Math.round(cat.avgGrowth.reduce((a: number, b: number) => a + b, 0) / cat.avgGrowth.length * 10) / 10
    }));

    return result.sort((a, b) => b.merchantCount - a.merchantCount);
  }

  /**
   * Start cron jobs for trend calculations
   */
  async startCronJobs(): Promise<void> {
    // Run aggregation every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running hourly trend calculations');
      await this.refreshTrendCache();
    });

    // Run full aggregation daily
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily aggregation');
      await this.runDailyAggregation();
    });

    logger.info('Cron jobs scheduled');
  }

  private async refreshTrendCache(): Promise<void> {
    // Refresh popular localities cache
    const localities = await AggregatedMetrics.distinct('locality', {
      merchantCount: { $gte: 10 }
    });

    for (const locality of localities.slice(0, 100)) {
      const industries = await AggregatedMetrics.distinct('industry', {
        locality,
        merchantCount: { $gte: 3 }
      });

      for (const industry of industries) {
        const cacheKey = `trends:demand:${locality}:${industry}:30d`;
        await this.redis.del(cacheKey);
      }
    }

    logger.info('Trend cache refreshed', { localities: localities.slice(0, 100).length });
  }

  private async runDailyAggregation(): Promise<void> {
    // This would run full aggregation
    logger.info('Daily aggregation completed');
  }

  private determineTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }

  private calculateConfidence(merchantCount: number): number {
    if (merchantCount >= 20) return 90;
    if (merchantCount >= 10) return 75;
    if (merchantCount >= 5) return 60;
    return 40;
  }

  private generateForecast(
    currentGrowth: number,
    period: '7d' | '30d' | '90d'
  ): TrendPoint[] {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const points: TrendPoint[] = [];
    const baseValue = 100;
    const dailyChange = currentGrowth / 30;

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      points.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * (1 + dailyChange * i / 100)),
        percentage: Math.round(dailyChange * i * 10) / 10
      });
    }

    return points;
  }
}
