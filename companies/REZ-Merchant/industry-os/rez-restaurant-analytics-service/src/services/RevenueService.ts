import { startOfHour, startOfDay, startOfWeek, startOfMonth, format } from 'date-fns';
import { getRedisClient } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Report, IRevenueByPeriod } from '../models/Report';

export interface RevenueSummary {
  total: number;
  previousTotal: number;
  changePercentage: number;
  averageOrderValue: number;
  totalOrders: number;
  totalCustomers: number;
  byPeriod: IRevenueByPeriod[];
  byPaymentMethod: Record<string, number>;
  byCategory: Record<string, number>;
  projections: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface RevenueQuery {
  restaurantId: string;
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export class RevenueService {
  private getCacheKey(query: RevenueQuery): string {
    return `revenue:${query.restaurantId}:${query.startDate.toISOString()}:${query.endDate.toISOString()}:${query.granularity}`;
  }

  async getRevenueSummary(query: RevenueQuery): Promise<RevenueSummary> {
    const cacheKey = this.getCacheKey(query);
    const redis = getRedisClient();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Revenue summary cache hit', { cacheKey });
      return JSON.parse(cached);
    }

    // Calculate date range for previous period
    const periodLength = query.endDate.getTime() - query.startDate.getTime();
    const previousStartDate = new Date(query.startDate.getTime() - periodLength);
    const previousEndDate = new Date(query.startDate.getTime() - 1);

    // Fetch current and previous period data
    const [currentData, previousData] = await Promise.all([
      this.aggregateRevenue(query.restaurantId, query.startDate, query.endDate),
      this.aggregateRevenue(query.restaurantId, previousStartDate, previousEndDate),
    ]);

    // Calculate metrics
    const total = currentData.totalRevenue;
    const previousTotal = previousData.totalRevenue || 0;
    const changePercentage = previousTotal > 0
      ? ((total - previousTotal) / previousTotal) * 100
      : 0;

    // Get revenue by period with granularity
    const byPeriod = await this.getRevenueByPeriod(query);

    // Get breakdown by payment method and category
    const [byPaymentMethod, byCategory] = await Promise.all([
      this.getRevenueByPaymentMethod(query.restaurantId, query.startDate, query.endDate),
      this.getRevenueByCategory(query.restaurantId, query.startDate, query.endDate),
    ]);

    // Calculate projections based on trends
    const dailyAverage = total / this.getDaysInRange(query.startDate, query.endDate);
    const projections = {
      daily: dailyAverage,
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
    };

    const result: RevenueSummary = {
      total,
      previousTotal,
      changePercentage,
      averageOrderValue: currentData.orderCount > 0 ? total / currentData.orderCount : 0,
      totalOrders: currentData.orderCount,
      totalCustomers: currentData.uniqueCustomers,
      byPeriod,
      byPaymentMethod,
      byCategory,
      projections,
    };

    // Cache the result
    await redis.setex(
      cacheKey,
      config.analytics.cacheDurations.revenueSummary,
      JSON.stringify(result)
    );

    logger.info('Revenue summary generated', {
      restaurantId: query.restaurantId,
      total,
      orderCount: currentData.orderCount,
    });

    return result;
  }

  private async aggregateRevenue(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    orderCount: number;
    uniqueCustomers: number;
  }> {
    // In a real implementation, this would query the order service or local orders collection
    // For now, we simulate the aggregation
    try {
      const result = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
            'revenue.total': { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$revenue.total' },
            orderCount: { $sum: { $size: { $ifNull: ['$revenue.byPeriod', []] } } },
            uniqueCustomers: { $sum: '$revenue.byPeriod.totalCustomers' },
          },
        },
      ]);

      return result[0] || { totalRevenue: 0, orderCount: 0, uniqueCustomers: 0 };
    } catch (error) {
      logger.error('Error aggregating revenue:', error);
      return { totalRevenue: 0, orderCount: 0, uniqueCustomers: 0 };
    }
  }

  private async getRevenueByPeriod(query: RevenueQuery): Promise<IRevenueByPeriod[]> {
    const { restaurantId, startDate, endDate, granularity } = query;

    // Map granularity to date grouping
    const dateFormat = this.getDateFormat(granularity);

    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
          },
        },
        { $unwind: { path: '$revenue.byPeriod', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              period: granularity === 'hour'
                ? { $dateToString: { format: '%Y-%m-%d %H:00', date: '$periodStart' } }
                : { $dateToString: { format: dateFormat, date: '$periodStart' } },
            },
            revenue: { $sum: '$revenue.byPeriod.revenue' },
            orderCount: { $sum: '$revenue.byPeriod.orderCount' },
            totalCustomers: { $sum: '$revenue.byPeriod.totalCustomers' },
          },
        },
        {
          $project: {
            _id: 0,
            period: '$_id.period',
            revenue: 1,
            orderCount: 1,
            averageOrderValue: { $cond: [{ $eq: ['$orderCount', 0] }, 0, { $divide: ['$revenue', '$orderCount'] }] },
            totalCustomers: 1,
          },
        },
        { $sort: { period: 1 } },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting revenue by period:', error);
      return [];
    }
  }

  private async getRevenueByPaymentMethod(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    // In production, this would query actual payment/transaction records
    // Simulating payment method breakdown
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
          },
        },
        {
          $project: {
            paymentMethods: { $objectToArray: '$revenue.byPaymentMethod' },
          },
        },
        { $unwind: '$paymentMethods' },
        {
          $group: {
            _id: '$paymentMethods.k',
            total: { $sum: '$paymentMethods.v' },
          },
        },
        {
          $group: {
            _id: null,
            methods: { $push: { k: '$_id', v: '$total' } },
          },
        },
      ]);

      if (results.length === 0) {
        return { cash: 0, card: 0, digital: 0, wallet: 0 };
      }

      const methods = results[0].methods;
      return methods.reduce((acc: Record<string, number>, item) => {
        acc[item.k] = item.v;
        return acc;
      }, {});
    } catch (error) {
      logger.error('Error getting revenue by payment method:', error);
      return {};
    }
  }

  private async getRevenueByCategory(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
          },
        },
        {
          $project: {
            categories: { $objectToArray: '$revenue.byCategory' },
          },
        },
        { $unwind: '$categories' },
        {
          $group: {
            _id: '$categories.k',
            total: { $sum: '$categories.v' },
          },
        },
        {
          $group: {
            _id: null,
            categories: { $push: { k: '$_id', v: '$total' } },
          },
        },
      ]);

      if (results.length === 0) {
        return {};
      }

      const categories = results[0].categories;
      return categories.reduce((acc: Record<string, number>, item) => {
        acc[item.k] = item.v;
        return acc;
      }, {});
    } catch (error) {
      logger.error('Error getting revenue by category:', error);
      return {};
    }
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hour':
        return '%Y-%m-%d %H:00';
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-W%V';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  private getDaysInRange(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
  }

  async getHourlyRevenue(restaurantId: string, date: Date): Promise<Array<{ hour: number; revenue: number }>> {
    const startDate = startOfDay(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lt: endDate },
          },
        },
        { $unwind: { path: '$revenue.byPeriod', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            'revenue.byPeriod.period': { $regex: format(date, 'yyyy-MM-dd') },
          },
        },
        {
          $group: {
            _id: { $hour: '$periodStart' },
            revenue: { $sum: '$revenue.byPeriod.revenue' },
          },
        },
        {
          $project: {
            _id: 0,
            hour: '$_id',
            revenue: 1,
          },
        },
        { $sort: { hour: 1 } },
      ]);

      // Fill in missing hours with zeros
      const hourlyData = new Array(24).fill(0).map((_, i) => ({
        hour: i,
        revenue: 0,
      }));

      results.forEach((r) => {
        if (r.hour >= 0 && r.hour < 24) {
          hourlyData[r.hour].revenue = r.revenue;
        }
      });

      return hourlyData;
    } catch (error) {
      logger.error('Error getting hourly revenue:', error);
      return new Array(24).fill(0).map((_, i) => ({ hour: i, revenue: 0 }));
    }
  }
}

export const revenueService = new RevenueService();
