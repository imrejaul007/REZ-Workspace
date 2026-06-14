import dayjs from 'dayjs';
import { CustomerMetric, ICustomerMetric } from '../models/metrics';
import { getRedisClient, isRedisConnected } from '../config/database';

interface CustomerSummary {
  period: string;
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  segments: ICustomerMetric['customerSegments'];
  averageLTV: number;
  retentionRate: number;
}

interface CustomerTrend {
  date: string;
  total: number;
  new: number;
  repeat: number;
}

interface LTVAnalysis {
  averageLTV: number;
  medianLTV: number;
  projectedLifetime: number; // in months
  customerValueDistribution: {
    segment: string;
    count: number;
    percentage: number;
  }[];
}

interface CustomerSegment {
  segment: 'new' | 'regular' | 'at_risk' | 'churned';
  label: string;
  description: string;
  action: string;
}

export class CustomerService {
  private readonly CACHE_PREFIX = 'customer:';
  private readonly CACHE_TTL = 300; // 5 minutes

  // Segment definitions
  private readonly SEGMENTS: CustomerSegment[] = [
    {
      segment: 'new',
      label: 'New Customers',
      description: 'Customers who visited for the first time',
      action: 'Onboarding campaign, welcome offer',
    },
    {
      segment: 'regular',
      label: 'Regular Customers',
      description: 'Customers who visit at least weekly',
      action: 'Loyalty rewards, exclusive offers',
    },
    {
      segment: 'at_risk',
      label: 'At-Risk Customers',
      description: 'Regular customers who have not visited in 14+ days',
      action: 'Re-engagement campaign, special incentive',
    },
    {
      segment: 'churned',
      label: 'Churned Customers',
      description: 'Customers who have not visited in 30+ days',
      action: 'Win-back campaign, personalized outreach',
    },
  ];

  /**
   * Get customer summary for a period
   */
  async getCustomerSummary(
    restaurantId: string,
    period: 'daily' | 'weekly' | 'monthly',
    customDate?: Date
  ): Promise<CustomerSummary> {
    const dateRange = this.getDateRange(period, customDate);
    const previousRange = this.getPreviousPeriod(dateRange, period);

    const cacheKey = `${this.CACHE_PREFIX}${restaurantId}:${period}:${dayjs(dateRange.startDate).format('YYYY-MM-DD')}`;
    const cached = await this.getFromCache<CustomerSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = await this.getMetricsForRange(
      restaurantId,
      dateRange.startDate,
      dateRange.endDate
    );

    const summary: CustomerSummary = {
      period,
      totalCustomers: metrics.totalCustomers,
      newCustomers: metrics.newCustomers,
      repeatCustomers: metrics.repeatCustomers,
      segments: metrics.customerSegments,
      averageLTV: metrics.averageLTV,
      retentionRate: metrics.retentionRate,
    };

    await this.setCache(cacheKey, summary);
    return summary;
  }

  /**
   * Get customer trend over time
   */
  async getCustomerTrend(
    restaurantId: string,
    days: number = 30
  ): Promise<CustomerTrend[]> {
    const results: CustomerTrend[] = [];
    const today = dayjs().startOf('day');

    for (let i = days - 1; i >= 0; i--) {
      const date = today.subtract(i, 'day').toDate();
      const nextDate = today.subtract(i, 'day').add(1, 'day').toDate();

      const metric = await CustomerMetric.findOne({
        restaurantId,
        date: {
          $gte: date,
          $lt: nextDate,
        },
      });

      results.push({
        date: dayjs(date).format('YYYY-MM-DD'),
        total: metric?.totalCustomers || 0,
        new: metric?.newCustomers || 0,
        repeat: metric?.repeatCustomers || 0,
      });
    }

    return results;
  }

  /**
   * Calculate customer lifetime value
   */
  async calculateLTV(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<LTVAnalysis> {
    const start = startDate || dayjs().subtract(90, 'day').toDate();
    const end = endDate || new Date();

    const metrics = await CustomerMetric.aggregate([
      {
        $match: {
          restaurantId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalLTV: { $sum: '$totalLTV' },
          totalCustomers: { $sum: '$totalCustomers' },
          averageLTV: { $avg: '$averageLTV' },
        },
      },
    ]);

    if (metrics.length === 0) {
      return {
        averageLTV: 0,
        medianLTV: 0,
        projectedLifetime: 0,
        customerValueDistribution: [],
      };
    }

    const result = metrics[0];
    const averageLTV = result.averageLTV || 0;

    // Project lifetime based on retention rate
    const retentionMetrics = await CustomerMetric.find({
      restaurantId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 }).limit(30);

    const avgRetention =
      retentionMetrics.length > 0
        ? retentionMetrics.reduce((sum, m) => sum + m.retentionRate, 0) /
          retentionMetrics.length
        : 0;

    // Estimate monthly churn and project lifetime
    const monthlyChurn = 1 - avgRetention;
    const projectedLifetime = monthlyChurn > 0 ? 1 / monthlyChurn : 12; // Default to 12 months

    // Calculate value distribution
    const valueSegments = this.calculateValueDistribution(result.totalCustomers, averageLTV);

    return {
      averageLTV: Math.round(averageLTV * 100) / 100,
      medianLTV: averageLTV * 0.7, // Estimate based on typical distribution
      projectedLifetime: Math.round(projectedLifetime * 10) / 10,
      customerValueDistribution: valueSegments,
    };
  }

  /**
   * Get at-risk customers
   */
  async getAtRiskCustomers(
    restaurantId: string,
    thresholdDays: number = 14
  ): Promise<{
    atRisk: number;
    churned: number;
    totalAtRisk: number;
    percentage: number;
  }> {
    const cutoffDate = dayjs().subtract(thresholdDays, 'day').startOf('day').toDate();
    const churnedCutoff = dayjs().subtract(30, 'day').startOf('day').toDate();

    const recentMetrics = await CustomerMetric.findOne({
      restaurantId,
      date: { $gte: cutoffDate },
    }).sort({ date: -1 });

    const churnedMetrics = await CustomerMetric.aggregate([
      {
        $match: {
          restaurantId,
          date: { $gte: churnedCutoff, $lte: cutoffDate },
        },
      },
      {
        $unwind: '$customerSegments',
      },
      {
        $match: {
          'customerSegments.segment': 'at_risk',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$customerSegments.count' },
        },
      },
    ]);

    const atRiskSegment = recentMetrics?.customerSegments.find(
      (s) => s.segment === 'at_risk'
    );
    const churnedSegment = recentMetrics?.customerSegments.find(
      (s) => s.segment === 'churned'
    );

    const atRisk = atRiskSegment?.count || 0;
    const churned = churnedSegment?.count || 0;
    const total = recentMetrics?.totalCustomers || 1;

    return {
      atRisk,
      churned,
      totalAtRisk: atRisk + churned,
      percentage: Math.round(((atRisk + churned) / total) * 100 * 100) / 100,
    };
  }

  /**
   * Record customer event
   */
  async recordCustomerEvent(
    restaurantId: string,
    customerId: string,
    eventType: 'visit' | 'signup' | 'return',
    timestamp: Date = new Date()
  ): Promise<void> {
    const date = dayjs(timestamp).startOf('day').toDate();

    const update: Record<string, unknown> = {
      $inc: {},
      $setOnInsert: {
        restaurantId,
        date,
      },
    };

    if (eventType === 'visit' || eventType === 'signup') {
      (update.$inc as Record<string, number>).totalCustomers = 1;
      (update.$inc as Record<string, number>).newCustomers = 1;
    } else if (eventType === 'return') {
      (update.$inc as Record<string, number>).totalCustomers = 1;
      (update.$inc as Record<string, number>).repeatCustomers = 1;
    }

    await CustomerMetric.findOneAndUpdate(
      { restaurantId, date },
      update,
      { upsert: true, new: true }
    );

    await this.invalidateCache(restaurantId);
  }

  /**
   * Get segment recommendations
   */
  getSegmentRecommendations(): CustomerSegment[] {
    return this.SEGMENTS;
  }

  // Private helper methods

  private getDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    customDate?: Date
  ): { startDate: Date; endDate: Date } {
    const date = dayjs(customDate || new Date());

    switch (period) {
      case 'daily':
        return {
          startDate: date.startOf('day').toDate(),
          endDate: date.endOf('day').toDate(),
        };
      case 'weekly':
        return {
          startDate: date.startOf('week').toDate(),
          endDate: date.endOf('week').toDate(),
        };
      case 'monthly':
        return {
          startDate: date.startOf('month').toDate(),
          endDate: date.endOf('month').toDate(),
        };
    }
  }

  private getPreviousPeriod(
    currentRange: { startDate: Date; endDate: Date },
    period: 'daily' | 'weekly' | 'monthly'
  ): { startDate: Date; endDate: Date } {
    const subtractUnit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    return {
      startDate: dayjs(currentRange.startDate).subtract(1, subtractUnit).toDate(),
      endDate: dayjs(currentRange.endDate).subtract(1, subtractUnit).toDate(),
    };
  }

  private async getMetricsForRange(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
    customerSegments: ICustomerMetric['customerSegments'];
    averageLTV: number;
    retentionRate: number;
  }> {
    const metrics = await CustomerMetric.aggregate([
      {
        $match: {
          restaurantId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: '$totalCustomers' },
          newCustomers: { $sum: '$newCustomers' },
          repeatCustomers: { $sum: '$repeatCustomers' },
          customerSegments: { $push: '$customerSegments' },
          averageLTV: { $avg: '$averageLTV' },
          retentionRate: { $avg: '$retentionRate' },
        },
      },
    ]);

    if (metrics.length === 0) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        repeatCustomers: 0,
        customerSegments: this.getDefaultSegments(),
        averageLTV: 0,
        retentionRate: 0,
      };
    }

    const result = metrics[0];

    // Aggregate segments
    const segmentMap = new Map<string, { count: number; percentage: number }>();
    result.customerSegments.flat().forEach((seg: { segment: string; count: number; percentage: number }) => {
      const existing = segmentMap.get(seg.segment) || { count: 0, percentage: 0 };
      segmentMap.set(seg.segment, {
        count: existing.count + seg.count,
        percentage: existing.percentage + seg.percentage,
      });
    });

    const segments: ICustomerMetric['customerSegments'] = Array.from(segmentMap.entries()).map(
      ([segment, data]) => ({
        segment: segment as 'new' | 'regular' | 'at_risk' | 'churned',
        count: data.count,
        percentage: data.percentage,
      })
    );

    return {
      totalCustomers: result.totalCustomers || 0,
      newCustomers: result.newCustomers || 0,
      repeatCustomers: result.repeatCustomers || 0,
      customerSegments: segments.length > 0 ? segments : this.getDefaultSegments(),
      averageLTV: result.averageLTV || 0,
      retentionRate: result.retentionRate || 0,
    };
  }

  private getDefaultSegments(): ICustomerMetric['customerSegments'] {
    return [
      { segment: 'new', count: 0, percentage: 0 },
      { segment: 'regular', count: 0, percentage: 0 },
      { segment: 'at_risk', count: 0, percentage: 0 },
      { segment: 'churned', count: 0, percentage: 0 },
    ];
  }

  /**
   * Record an order for a customer (called from order events)
   */
  async recordOrder(customerId: string, orderId: string, total: number): Promise<void> {
    const key = `${this.CACHE_PREFIX}${customerId}:stats`;
    const stats = await this.getFromCache<{ orderCount: number; totalSpend: number }>(key);
    if (stats) {
      stats.orderCount += 1;
      stats.totalSpend += total;
      await this.setCache(key, stats);
    } else {
      await this.setCache(key, { orderCount: 1, totalSpend: total });
    }
  }

  /**
   * Record a cancelled order
   */
  async recordCancelledOrder(customerId: string, orderId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${customerId}:cancelled`;
    const cancelledOrders = await this.getFromCache<string[]>(key) || [];
    cancelledOrders.push(orderId);
    await this.setCache(key, cancelledOrders.slice(-100));
  }

  private calculateValueDistribution(
    totalCustomers: number,
    averageLTV: number
  ): { segment: string; count: number; percentage: number }[] {
    if (totalCustomers === 0) {
      return [];
    }

    // Based on Pareto principle / typical customer value distribution
    const highValue = Math.round(totalCustomers * 0.2); // Top 20%
    const mediumValue = Math.round(totalCustomers * 0.3); // Middle 30%
    const lowValue = totalCustomers - highValue - mediumValue; // Remaining 50%

    return [
      {
        segment: 'High Value',
        count: highValue,
        percentage: Math.round((highValue / totalCustomers) * 100 * 100) / 100,
      },
      {
        segment: 'Medium Value',
        count: mediumValue,
        percentage: Math.round((mediumValue / totalCustomers) * 100 * 100) / 100,
      },
      {
        segment: 'Low Value',
        count: lowValue,
        percentage: Math.round((lowValue / totalCustomers) * 100 * 100) / 100,
      },
    ];
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!isRedisConnected()) return null;

    const client = getRedisClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: unknown): Promise<void> {
    if (!isRedisConnected()) return;

    const client = getRedisClient();
    if (!client) return;

    try {
      await client.setex(key, this.CACHE_TTL, JSON.stringify(data));
    } catch {
      // Cache set failed
    }
  }

  private async invalidateCache(restaurantId: string): Promise<void> {
    if (!isRedisConnected()) return;

    const client = getRedisClient();
    if (!client) return;

    try {
      const keys = await client.keys(`${this.CACHE_PREFIX}${restaurantId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Cache invalidation failed
    }
  }
}

export const customerService = new CustomerService();
