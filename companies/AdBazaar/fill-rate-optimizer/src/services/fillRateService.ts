import { FillRate, IFillRate } from '../models/FillRate';
import { logger } from 'utils/logger.js';
import { fillRateGauge, impressionsCounter, fillRateHistogram } from '../utils/metrics';
import { Redis } from 'redis';

export class FillRateService {
  private redis: Redis | null;
  private cacheTTL = 300; // 5 minutes

  constructor(redis: Redis | null) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('FillRateService initialized');
  }

  // Get current fill rate
  async getCurrentFillRate(inventoryId?: string): Promise<{
    rate: number;
    impressions: number;
    filled: number;
    timestamp: Date;
    inventoryId?: string;
  }> {
    try {
      const cacheKey = `fill_rate:current:${inventoryId || 'all'}`;

      // Try cache first
      if (this.redis?.isOpen) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Query database
      const query: any = {};
      if (inventoryId) {
        query.inventoryId = inventoryId;
      }

      // Get latest record
      const latest = await FillRate.findOne(query)
        .sort({ date: -1 })
        .lean();

      if (!latest) {
        return {
          rate: 0,
          impressions: 0,
          filled: 0,
          timestamp: new Date(),
          inventoryId
        };
      }

      const result = {
        rate: latest.rate,
        impressions: latest.impressions,
        filled: latest.filled,
        timestamp: latest.date,
        inventoryId: latest.inventoryId
      };

      // Cache result
      if (this.redis?.isOpen) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(result));
      }

      // Update metrics
      fillRateGauge.labels(inventoryId || 'all').set(latest.rate);
      impressionsCounter.labels(inventoryId || 'all', 'total').inc(latest.impressions);
      fillRateHistogram.labels(inventoryId || 'all').observe(latest.rate);

      return result;
    } catch (error) {
      logger.error('Error getting current fill rate', { error, inventoryId });
      throw error;
    }
  }

  // Get fill rate history
  async getFillRateHistory(params: {
    startDate?: Date;
    endDate?: Date;
    inventoryId?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
    limit?: number;
  }): Promise<IFillRate[]> {
    try {
      const { startDate, endDate, inventoryId, granularity = 'day', limit = 100 } = params;

      const query: any = {};

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      if (inventoryId) {
        query.inventoryId = inventoryId;
      }

      let aggregation: any[] = [
        { $match: query },
        { $sort: { date: -1 } },
        { $limit: limit }
      ];

      // Add granularity grouping if needed
      if (granularity !== 'hour') {
        const groupFormat = this.getGranularityFormat(granularity);
        aggregation = [
          { $match: query },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: groupFormat, date: '$date' } },
                inventoryId: '$inventoryId'
              },
              impressions: { $sum: '$impressions' },
              filled: { $sum: '$filled' },
              rate: { $avg: '$rate' }
            }
          },
          {
            $project: {
              _id: 0,
              date: { $toDate: '$_id.date' },
              inventoryId: '$_id.inventoryId',
              impressions: 1,
              filled: 1,
              rate: { $round: ['$rate', 2] }
            }
          },
          { $sort: { date: -1 } },
          { $limit: limit }
        ];
      }

      const results = await FillRate.aggregate(aggregation);
      return results;
    } catch (error) {
      logger.error('Error getting fill rate history', { error, params });
      throw error;
    }
  }

  // Get fill rate by inventory
  async getFillRateByInventory(startDate?: Date, endDate?: Date): Promise<Array<{
    inventoryId: string;
    inventoryName?: string;
    fillRate: number;
    impressions: number;
    filled: number;
    unfilled: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  }>> {
    try {
      const query: any = {};
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      // Get current period
      const currentPeriod = await FillRate.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$inventoryId',
            inventoryName: { $first: '$inventoryName' },
            avgRate: { $avg: '$rate' },
            totalImpressions: { $sum: '$impressions' },
            totalFilled: { $sum: '$filled' }
          }
        }
      ]);

      // Calculate trend (compare with previous period)
      const previousEndDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const previousStartDate = new Date(previousEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const previousQuery = {
        date: { $gte: previousStartDate, $lte: previousEndDate }
      };

      const previousPeriod = await FillRate.aggregate([
        { $match: previousQuery },
        {
          $group: {
            _id: '$inventoryId',
            avgRate: { $avg: '$rate' }
          }
        }
      ]);

      const previousMap = new Map(previousPeriod.map(p => [p._id, p.avgRate]));

      return currentPeriod.map(cp => {
        const previousRate = previousMap.get(cp._id) || 0;
        const currentRate = cp.avgRate || 0;
        const trendPercentage = previousRate > 0
          ? ((currentRate - previousRate) / previousRate) * 100
          : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (trendPercentage > 1) trend = 'up';
        else if (trendPercentage < -1) trend = 'down';

        return {
          inventoryId: cp._id,
          inventoryName: cp.inventoryName,
          fillRate: Math.round(currentRate * 100) / 100,
          impressions: cp.totalImpressions,
          filled: cp.totalFilled,
          unfilled: cp.totalImpressions - cp.totalFilled,
          trend,
          trendPercentage: Math.round(trendPercentage * 100) / 100
        };
      }).sort((a, b) => b.fillRate - a.fillRate);
    } catch (error) {
      logger.error('Error getting fill rate by inventory', { error });
      throw error;
    }
  }

  // Get fill rate by demand source
  async getFillRateByDemandSource(startDate?: Date, endDate?: Date): Promise<Array<{
    source: string;
    fillRate: number;
    impressions: number;
    filled: number;
    revenue: number;
    percentage: number;
  }>> {
    try {
      const query: any = {};
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const results = await FillRate.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $ifNull: ['$metadata.source', 'direct'] },
            totalImpressions: { $sum: '$impressions' },
            totalFilled: { $sum: '$filled' },
            totalRevenue: { $sum: { $ifNull: ['$metadata.revenue', 0] } }
          }
        },
        {
          $project: {
            source: '$_id',
            impressions: '$totalImpressions',
            filled: '$totalFilled',
            rate: {
              $cond: [
                { $gt: ['$totalImpressions', 0] },
                { $multiply: [{ $divide: ['$totalFilled', '$totalImpressions'] }, 100] },
                0
              ]
            },
            revenue: '$totalRevenue'
          }
        },
        { $sort: { impressions: -1 } }
      ]);

      const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);

      return results.map(r => ({
        source: r.source,
        fillRate: Math.round(r.rate * 100) / 100,
        impressions: r.impressions,
        filled: r.filled,
        revenue: r.revenue,
        percentage: totalImpressions > 0
          ? Math.round((r.impressions / totalImpressions) * 10000) / 100
          : 0
      }));
    } catch (error) {
      logger.error('Error getting fill rate by demand source', { error });
      throw error;
    }
  }

  // Record new fill rate data
  async recordFillRate(data: {
    inventoryId: string;
    inventoryName?: string;
    impressions: number;
    filled: number;
    requestId?: string;
    metadata?: Record<string, any>;
  }): Promise<IFillRate> {
    try {
      const rate = data.impressions > 0
        ? (data.filled / data.impressions) * 100
        : 0;

      const fillRate = new FillRate({
        date: new Date(),
        inventoryId: data.inventoryId,
        inventoryName: data.inventoryName,
        impressions: data.impressions,
        filled: data.filled,
        rate,
        requestId: data.requestId,
        metadata: data.metadata
      });

      await fillRate.save();

      // Invalidate cache
      if (this.redis?.isOpen) {
        await this.redis.del(`fill_rate:current:${data.inventoryId}`);
        await this.redis.del('fill_rate:current:all');
      }

      // Update metrics
      fillRateGauge.labels(data.inventoryId).set(rate);
      impressionsCounter.labels(data.inventoryId, 'total').inc(data.impressions);
      fillRateHistogram.labels(data.inventoryId).observe(rate);

      logger.info('Fill rate recorded', {
        inventoryId: data.inventoryId,
        rate,
        impressions: data.impressions,
        filled: data.filled
      });

      return fillRate;
    } catch (error) {
      logger.error('Error recording fill rate', { error, data });
      throw error;
    }
  }

  // Get summary with comparison to previous period
  async getFillRateSummary(periodHours: number = 24): Promise<{
    current: { rate: number; impressions: number; filled: number; timestamp: Date };
    previous: { rate: number; impressions: number; filled: number; timestamp: Date };
    change: { rate: number; impressions: number; filled: number };
  }> {
    try {
      const now = new Date();
      const currentStart = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
      const previousStart = new Date(currentStart.getTime() - periodHours * 60 * 60 * 1000);
      const previousEnd = currentStart;

      const [currentAgg, previousAgg] = await Promise.all([
        FillRate.aggregate([
          { $match: { date: { $gte: currentStart, $lte: now } } },
          {
            $group: {
              _id: null,
              rate: { $avg: '$rate' },
              impressions: { $sum: '$impressions' },
              filled: { $sum: '$filled' }
            }
          }
        ]),
        FillRate.aggregate([
          { $match: { date: { $gte: previousStart, $lte: previousEnd } } },
          {
            $group: {
              _id: null,
              rate: { $avg: '$rate' },
              impressions: { $sum: '$impressions' },
              filled: { $sum: '$filled' }
            }
          }
        ])
      ]);

      const current = currentAgg[0] || { rate: 0, impressions: 0, filled: 0 };
      const previous = previousAgg[0] || { rate: 0, impressions: 0, filled: 0 };

      return {
        current: {
          rate: Math.round(current.rate * 100) / 100,
          impressions: current.impressions,
          filled: current.filled,
          timestamp: now
        },
        previous: {
          rate: Math.round(previous.rate * 100) / 100,
          impressions: previous.impressions,
          filled: previous.filled,
          timestamp: previousEnd
        },
        change: {
          rate: Math.round((current.rate - previous.rate) * 100) / 100,
          impressions: current.impressions - previous.impressions,
          filled: current.filled - previous.filled
        }
      };
    } catch (error) {
      logger.error('Error getting fill rate summary', { error });
      throw error;
    }
  }

  private getGranularityFormat(granularity: string): string {
    switch (granularity) {
      case 'day': return '%Y-%m-%d';
      case 'week': return '%Y-W%V';
      case 'month': return '%Y-%m';
      default: return '%Y-%m-%d %H:00';
    }
  }
}