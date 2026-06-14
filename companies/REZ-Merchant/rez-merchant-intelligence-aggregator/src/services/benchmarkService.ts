/**
 * Benchmark Service
 * Compares merchant performance against industry benchmarks
 */

import { AggregatedMetrics } from '../models/AggregatedData';
import { logger } from '../config/logger';
import { getRedis } from '../config/redis';

export interface BenchmarkResult {
  percentile: number;           // Merchant's percentile (0-100)
  rating: 'below' | 'average' | 'above' | 'top';
  comparedTo: {
    locality: number;
    city: number;
    industry: number;
  };
  insights: string[];
}

export interface MerchantBenchmarkInput {
  merchantId: string;
  industry: string;
  locality: string;
  city: string;
  avgOrderValue: number;
  ordersPerDay: number;
  dailyRevenue: number;
  repeatRate: number;
}

export class BenchmarkService {
  private redis = getRedis();

  /**
   * Get benchmarks for a merchant
   */
  async getBenchmark(input: MerchantBenchmarkInput): Promise<BenchmarkResult> {
    const { merchantId, industry, locality, city, avgOrderValue, ordersPerDay, dailyRevenue, repeatRate } = input;

    // Get benchmarks from cache or calculate
    const benchmarks = await this.getBenchmarks(industry, locality, city);

    if (!benchmarks) {
      return {
        percentile: 50,
        rating: 'average',
        comparedTo: { locality: 50, city: 50, industry: 50 },
        insights: ['Not enough data for benchmarking']
      };
    }

    // Calculate percentiles
    const localityPercentile = this.calculatePercentile(avgOrderValue, benchmarks.locality);
    const cityPercentile = this.calculatePercentile(avgOrderValue, benchmarks.city);
    const industryPercentile = this.calculatePercentile(avgOrderValue, benchmarks.industry);

    // Determine rating
    const avgPercentile = (localityPercentile + cityPercentile + industryPercentile) / 3;
    const rating = this.getRating(avgPercentile);

    // Generate insights
    const insights = this.generateInsights(input, benchmarks);

    return {
      percentile: Math.round(avgPercentile),
      rating,
      comparedTo: {
        locality: Math.round(localityPercentile),
        city: Math.round(cityPercentile),
        industry: Math.round(industryPercentile)
      },
      insights
    };
  }

  /**
   * Get industry-wide benchmarks
   */
  async getIndustryBenchmarks(industry: string): Promise<unknown> {
    const cacheKey = `benchmarks:industry:${industry}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const benchmarks = await AggregatedMetrics.aggregate([
      { $match: { industry, merchantCount: { $gte: 3 } } },
      {
        $group: {
          _id: null,
          avgOrderValue: { $avg: '$avgOrderValue' },
          avgOrdersPerDay: { $avg: '$avgOrdersPerDay' },
          avgRetentionRate: { $avg: '$avgRetentionRate' },
          avgRepeatRate: { $avg: '$avgRepeatRate' },
          avgRevenueGrowth: { $avg: '$revenueGrowth30d' }
        }
      }
    ]);

    const result = benchmarks[0] || null;
    if (result) {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
    }

    return result;
  }

  /**
   * Get top performing merchants in a locality
   */
  async getTopPerformers(
    industry: string,
    locality: string,
    metric: 'orders' | 'revenue' | 'growth' = 'revenue',
    limit: number = 10
  ): Promise<unknown[]> {
    const sortField = metric === 'orders' ? 'totalOrders30d' :
      metric === 'growth' ? 'revenueGrowth30d' : 'totalRevenue30d';

    const top = await AggregatedMetrics.find({
      industry: industry as unknown,
      locality,
      merchantCount: { $gte: 3 }
    } as unknown)
      .sort({ [sortField]: -1 } as unknown)
      .limit(limit)
      .select('-_id -__v');

    return top;
  }

  /**
   * Compare multiple merchants
   */
  async compareMerchants(merchantIds: string[]): Promise<unknown> {
    // This would compare merchant performance
    // Note: merchant IDs are anonymized in aggregated data
    return {
      message: 'Comparison feature coming soon',
      merchantIds: merchantIds.length
    };
  }

  private async getBenchmarks(industry: string, locality: string, city: string) {
    const industryFilter = industry as unknown;
    const [localityMetrics, cityMetrics, industryMetrics] = await Promise.all([
      AggregatedMetrics.findOne({
        industry: industryFilter,
        locality,
        merchantCount: { $gte: 3 }
      } as unknown),
      AggregatedMetrics.aggregate([
        {
          $match: {
            industry: industryFilter,
            city,
            merchantCount: { $gte: 5 },
            category: 'all'
          }
        },
        {
          $group: {
            _id: null,
            avgOrderValue: { $avg: '$avgOrderValue' },
            avgOrdersPerMerchant: { $avg: '$avgOrdersPerMerchant' }
          }
        }
      ]),
      AggregatedMetrics.aggregate([
        {
          $match: {
            industry: industryFilter,
            merchantCount: { $gte: 10 },
            category: 'all'
          }
        },
        {
          $group: {
            _id: null,
            avgOrderValue: { $avg: '$avgOrderValue' },
            avgOrdersPerMerchant: { $avg: '$avgOrdersPerMerchant' }
          }
        }
      ])
    ]);

    return {
      locality: localityMetrics?.avgOrderValue || 0,
      city: cityMetrics[0]?.avgOrderValue || 0,
      industry: industryMetrics[0]?.avgOrderValue || 0
    };
  }

  private calculatePercentile(value: number, benchmark: number): number {
    if (benchmark === 0) return 50;

    const ratio = value / benchmark;

    if (ratio >= 2) return 95;
    if (ratio >= 1.5) return 80;
    if (ratio >= 1.2) return 70;
    if (ratio >= 1) return 60;
    if (ratio >= 0.8) return 50;
    if (ratio >= 0.5) return 30;
    return 15;
  }

  private getRating(percentile: number): 'below' | 'average' | 'above' | 'top' {
    if (percentile >= 80) return 'top';
    if (percentile >= 60) return 'above';
    if (percentile >= 40) return 'average';
    return 'below';
  }

  private generateInsights(input: MerchantBenchmarkInput, benchmarks): string[] {
    const insights: string[] = [];

    const { avgOrderValue, ordersPerDay, repeatRate } = input;

    // Order value insights
    if (avgOrderValue > benchmarks.locality * 1.2) {
      insights.push(`Your average order value is ${Math.round((avgOrderValue / benchmarks.locality - 1) * 100)}% higher than local competitors`);
    } else if (avgOrderValue < benchmarks.locality * 0.8) {
      insights.push('Consider bundling items to increase average order value');
    }

    // Volume insights
    if (ordersPerDay > benchmarks.locality * 1.5) {
      insights.push('High order volume! Consider optimizing kitchen capacity');
    }

    // Retention insights
    if (repeatRate > 0.4) {
      insights.push('Strong customer loyalty - your repeat rate is above average');
    } else if (repeatRate < 0.2) {
      insights.push('Focus on customer retention - consider a loyalty program');
    }

    return insights;
  }
}
