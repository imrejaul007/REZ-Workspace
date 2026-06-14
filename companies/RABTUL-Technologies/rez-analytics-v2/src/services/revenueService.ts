import dayjs from 'dayjs';
import { DailyRevenueMetric, IDailyRevenueMetric } from '../models/metrics';
import { getRedisClient, isRedisConnected } from '../config/database';

interface RevenueComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

interface RevenueSummary {
  period: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  comparison: RevenueComparison;
  categoryBreakdown: IDailyRevenueMetric['categoryBreakdown'];
  hourlyBreakdown: IDailyRevenueMetric['hourlyBreakdown'];
  paymentBreakdown: IDailyRevenueMetric['paymentMethodBreakdown'];
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class RevenueService {
  private readonly CACHE_PREFIX = 'revenue:';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get revenue summary for a specific period
   */
  async getRevenueSummary(
    restaurantId: string,
    period: 'daily' | 'weekly' | 'monthly',
    customDate?: Date
  ): Promise<RevenueSummary> {
    const dateRange = this.getDateRange(period, customDate);
    const previousRange = this.getPreviousPeriod(dateRange, period);

    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}${restaurantId}:${period}:${dayjs(dateRange.startDate).format('YYYY-MM-DD')}`;
    const cached = await this.getFromCache<RevenueSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch current period metrics
    const currentMetrics = await this.getMetricsForRange(
      restaurantId,
      dateRange.startDate,
      dateRange.endDate
    );

    // Fetch previous period metrics
    const previousMetrics = await this.getMetricsForRange(
      restaurantId,
      previousRange.startDate,
      previousRange.endDate
    );

    // Calculate comparison
    const comparison = this.calculateComparison(
      currentMetrics.totalRevenue,
      previousMetrics.totalRevenue
    );

    // Aggregate hourly data
    const hourlyBreakdown = this.aggregateHourlyData(currentMetrics.hourlyData);

    // Build summary
    const summary: RevenueSummary = {
      period: period,
      revenue: currentMetrics.totalRevenue,
      orderCount: currentMetrics.orderCount,
      averageOrderValue: currentMetrics.orderCount > 0
        ? currentMetrics.totalRevenue / currentMetrics.orderCount
        : 0,
      comparison,
      categoryBreakdown: currentMetrics.categoryBreakdown,
      hourlyBreakdown,
      paymentBreakdown: currentMetrics.paymentBreakdown,
    };

    // Cache the result
    await this.setCache(cacheKey, summary);

    return summary;
  }

  /**
   * Get daily revenue for the last N days
   */
  async getDailyRevenue(
    restaurantId: string,
    days: number = 7
  ): Promise<Array<{
    date: string;
    revenue: number;
    orderCount: number;
    aov: number;
  }>> {
    const results = [];
    const today = dayjs().startOf('day');

    for (let i = days - 1; i >= 0; i--) {
      const date = today.subtract(i, 'day').toDate();
      const nextDate = today.subtract(i, 'day').add(1, 'day').toDate();

      const metrics = await DailyRevenueMetric.findOne({
        restaurantId,
        date: {
          $gte: date,
          $lt: nextDate,
        },
      });

      results.push({
        date: dayjs(date).format('YYYY-MM-DD'),
        revenue: metrics?.totalRevenue || 0,
        orderCount: metrics?.orderCount || 0,
        aov: metrics?.averageOrderValue || 0,
      });
    }

    return results;
  }

  /**
   * Get weekly revenue comparison
   */
  async getWeeklyComparison(
    restaurantId: string,
    weeks: number = 4
  ): Promise<Array<{
    week: string;
    weekNumber: number;
    revenue: number;
    orderCount: number;
    comparison: number;
  }>> {
    const results = [];
    const currentWeek = (dayjs() as any).week() as number;
    const currentYear = dayjs().year();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekNum = currentWeek - i;
      const adjustedYear = weekNum > 0 ? currentYear : currentYear - 1;
      const adjustedWeek = weekNum > 0 ? weekNum : 52 + weekNum;

      const d = dayjs() as any;
      const weekStart = d.year(adjustedYear).week(adjustedWeek).startOf('week').toDate();
      const weekEnd = d.year(adjustedYear).week(adjustedWeek).endOf('week').toDate();

      const metrics = await this.getMetricsForRange(
        restaurantId,
        weekStart,
        weekEnd
      );

      const previousWeekMetrics = await this.getMetricsForRange(
        restaurantId,
        dayjs(weekStart).subtract(1, 'week').toDate(),
        dayjs(weekEnd).subtract(1, 'week').toDate()
      );

      const comparison = this.calculateComparison(
        metrics.totalRevenue,
        previousWeekMetrics.totalRevenue
      );

      results.push({
        week: `Week ${adjustedWeek}`,
        weekNumber: adjustedWeek,
        revenue: metrics.totalRevenue,
        orderCount: metrics.orderCount,
        comparison: comparison.changePercentage,
      });
    }

    return results;
  }

  /**
   * Get monthly revenue trend
   */
  async getMonthlyTrend(
    restaurantId: string,
    months: number = 6
  ): Promise<Array<{
    month: string;
    revenue: number;
    orderCount: number;
    aov: number;
  }>> {
    const results = [];
    const today = dayjs();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = today.subtract(i, 'month');
      const startDate = monthDate.startOf('month').toDate();
      const endDate = monthDate.endOf('month').toDate();

      const metrics = await this.getMetricsForRange(
        restaurantId,
        startDate,
        endDate
      );

      results.push({
        month: monthDate.format('MMM YYYY'),
        revenue: metrics.totalRevenue,
        orderCount: metrics.orderCount,
        aov: metrics.orderCount > 0
          ? metrics.totalRevenue / metrics.orderCount
          : 0,
      });
    }

    return results;
  }

  /**
   * Record a new revenue event
   */
  async recordRevenue(
    restaurantId: string,
    _orderId: string,
    amount: number,
    paymentMethod: string,
    items: Array<{ category: string; price: number; cost: number }>,
    timestamp: Date = new Date()
  ): Promise<void> {
    const date = dayjs(timestamp).startOf('day').toDate();
    const hour = dayjs(timestamp).hour();

    // Update or create daily metric
    await DailyRevenueMetric.findOneAndUpdate(
      {
        restaurantId,
        date,
      },
      {
        $inc: {
          totalRevenue: amount,
          grossRevenue: amount,
          orderCount: 1,
        },
        $push: {
          hourlyBreakdown: {
            hour,
            revenue: amount,
            orderCount: 1,
          },
        },
        $setOnInsert: {
          date,
          restaurantId,
        },
      },
      { upsert: true, new: true }
    );

    // Update category breakdown
    const categoryTotals = new Map<string, { revenue: number; count: number }>();
    items.forEach((item) => {
      const existing = categoryTotals.get(item.category) || { revenue: 0, count: 0 };
      categoryTotals.set(item.category, {
        revenue: existing.revenue + item.price,
        count: existing.count + 1,
      });
    });

    // Update payment method breakdown
    await DailyRevenueMetric.findOneAndUpdate(
      { restaurantId, date },
      {
        $inc: {
          [`paymentMethodBreakdown.${paymentMethod}.revenue`]: amount,
          [`paymentMethodBreakdown.${paymentMethod}.count`]: 1,
        },
      },
      { upsert: true }
    );

    // Invalidate cache
    await this.invalidateCache(restaurantId);
  }

  // Private helper methods

  private getDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    customDate?: Date
  ): DateRange {
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
    currentRange: DateRange,
    period: 'daily' | 'weekly' | 'monthly'
  ): DateRange {
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
    totalRevenue: number;
    orderCount: number;
    categoryBreakdown: IDailyRevenueMetric['categoryBreakdown'];
    hourlyData: Map<number, { revenue: number; orderCount: number }>;
    paymentBreakdown: IDailyRevenueMetric['paymentMethodBreakdown'];
  }> {
    const metrics = await DailyRevenueMetric.aggregate([
      {
        $match: {
          restaurantId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          orderCount: { $sum: '$orderCount' },
          categoryBreakdown: { $push: '$categoryBreakdown' },
          hourlyData: { $push: '$hourlyBreakdown' },
          paymentBreakdown: { $push: '$paymentMethodBreakdown' },
        },
      },
    ]);

    if (metrics.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        categoryBreakdown: [],
        hourlyData: new Map(),
        paymentBreakdown: [],
      };
    }

    const result = metrics[0];

    // Flatten and aggregate category breakdown
    const categoryMap = new Map<string, { revenue: number; count: number }>();
    result.categoryBreakdown.flat().forEach((cat: { category: string; revenue: number; orderCount: number }) => {
      const existing = categoryMap.get(cat.category) || { revenue: 0, count: 0 };
      categoryMap.set(cat.category, {
        revenue: existing.revenue + cat.revenue,
        count: existing.count + cat.orderCount,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        revenue: data.revenue,
        orderCount: data.count,
        percentage: result.totalRevenue > 0
          ? (data.revenue / result.totalRevenue) * 100
          : 0,
      })
    );

    // Flatten hourly data
    const hourlyMap = new Map<number, { revenue: number; orderCount: number }>();
    result.hourlyData.flat().flat().forEach((hour: { hour: number; revenue: number; orderCount: number }) => {
      const existing = hourlyMap.get(hour.hour) || { revenue: 0, orderCount: 0 };
      hourlyMap.set(hour.hour, {
        revenue: existing.revenue + hour.revenue,
        orderCount: existing.orderCount + hour.orderCount,
      });
    });

    // Flatten payment breakdown
    const paymentMap = new Map<string, { revenue: number; count: number }>();
    result.paymentBreakdown.flat().flat().forEach((pay: { method: string; revenue: number; count: number }) => {
      const existing = paymentMap.get(pay.method) || { revenue: 0, count: 0 };
      paymentMap.set(pay.method, {
        revenue: existing.revenue + pay.revenue,
        count: existing.count + pay.count,
      });
    });

    const paymentBreakdown = Array.from(paymentMap.entries()).map(
      ([method, data]) => ({
        method,
        revenue: data.revenue,
        count: data.count,
      })
    );

    return {
      totalRevenue: result.totalRevenue || 0,
      orderCount: result.orderCount || 0,
      categoryBreakdown,
      hourlyData: hourlyMap,
      paymentBreakdown,
    };
  }

  private calculateComparison(current: number, previous: number): RevenueComparison {
    const change = current - previous;
    const changePercentage = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;

    return {
      current,
      previous,
      change,
      changePercentage: Math.round(changePercentage * 100) / 100,
    };
  }

  private aggregateHourlyData(
    hourlyData: Map<number, { revenue: number; orderCount: number }>
  ): IDailyRevenueMetric['hourlyBreakdown'] {
    const result: IDailyRevenueMetric['hourlyBreakdown'] = [];

    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData.get(hour) || { revenue: 0, orderCount: 0 };
      result.push({
        hour,
        revenue: data.revenue,
        orderCount: data.orderCount,
      });
    }

    return result;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!isRedisConnected()) {
      return null;
    }

    const client = getRedisClient();
    if (!client) {
      return null;
    }

    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: unknown): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      await client.setex(key, this.CACHE_TTL, JSON.stringify(data));
    } catch {
      // Cache set failed, continue without caching
    }
  }

  private async invalidateCache(restaurantId: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      const keys = await client.keys(`${this.CACHE_PREFIX}${restaurantId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Cache invalidation failed, continue
    }
  }
}

export const revenueService = new RevenueService();
