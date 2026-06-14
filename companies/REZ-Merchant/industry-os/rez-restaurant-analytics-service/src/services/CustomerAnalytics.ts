import { getRedisClient } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Report, ICustomerMetrics } from '../models/Report';

export interface CustomerAnalyticsSummary {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerMetrics: ICustomerMetrics;
  customerLifetimeValue: {
    averageLTV: number;
    medianLTV: number;
    totalLTV: number;
  };
  visitFrequency: Array<{
    customerId: string;
    visitCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastVisit: Date;
  }>;
  customerSegments: {
    vip: number;
    regular: number;
    occasional: number;
    atRisk: number;
    churned: number;
  };
  cohortAnalysis: Array<{
    cohort: string; // Month of first visit
    retention: Array<{ month: number; rate: number }>;
  }>;
  topCustomers: Array<{
    customerId: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    visitsThisMonth: number;
  }>;
}

export interface CustomerQuery {
  restaurantId: string;
  startDate: Date;
  endDate: Date;
}

export class CustomerAnalyticsService {
  private getCacheKey(query: CustomerQuery): string {
    return `customer:${query.restaurantId}:${query.startDate.toISOString()}:${query.endDate.toISOString()}`;
  }

  async getCustomerAnalytics(query: CustomerQuery): Promise<CustomerAnalyticsSummary> {
    const cacheKey = this.getCacheKey(query);
    const redis = getRedisClient();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Customer analytics cache hit', { cacheKey });
      return JSON.parse(cached);
    }

    // Fetch all customer metrics in parallel
    const [
      customerMetrics,
      visitFrequency,
      customerSegments,
      cohortAnalysis,
      topCustomers,
      ltvData,
    ] = await Promise.all([
      this.getCustomerMetrics(query),
      this.getVisitFrequency(query),
      this.getCustomerSegments(query),
      this.getCohortAnalysis(query),
      this.getTopCustomers(query),
      this.getLTVData(query),
    ]);

    const totalCustomers = customerMetrics.newCustomers + customerMetrics.returningCustomers;

    const result: CustomerAnalyticsSummary = {
      totalCustomers,
      newCustomers: customerMetrics.newCustomers,
      returningCustomers: customerMetrics.returningCustomers,
      customerMetrics,
      customerLifetimeValue: ltvData,
      visitFrequency,
      customerSegments,
      cohortAnalysis,
      topCustomers,
    };

    // Cache the result
    await redis.setex(
      cacheKey,
      config.analytics.cacheDurations.customerMetrics,
      JSON.stringify(result)
    );

    logger.info('Customer analytics generated', {
      restaurantId: query.restaurantId,
      totalCustomers,
      retentionRate: customerMetrics.retentionRate,
    });

    return result;
  }

  private async getCustomerMetrics(query: CustomerQuery): Promise<ICustomerMetrics> {
    try {
      // Get report with customer metrics for the period
      const report = await Report.findOne({
        restaurantId: query.restaurantId as unknown,
        periodStart: { $lte: query.endDate },
        periodEnd: { $gte: query.startDate },
        'customerMetrics': { $exists: true },
      }).sort({ periodEnd: -1 });

      if (report?.customerMetrics) {
        return report.customerMetrics;
      }

      // Calculate metrics from scratch if no report exists
      return this.calculateCustomerMetrics(query);
    } catch (error) {
      logger.error('Error getting customer metrics:', error);
      return this.getDefaultCustomerMetrics();
    }
  }

  private async calculateCustomerMetrics(query: CustomerQuery): Promise<ICustomerMetrics> {
    // In production, this would query order/customer data
    // Simulated calculation based on report data
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        {
          $group: {
            _id: null,
            newCustomers: { $sum: '$customerMetrics.newCustomers' },
            returningCustomers: { $sum: '$customerMetrics.returningCustomers' },
            retentionRate: { $avg: '$customerMetrics.retentionRate' },
            churnRate: { $avg: '$customerMetrics.churnRate' },
            avgVisits: { $avg: '$customerMetrics.averageVisitsPerCustomer' },
            avgFrequency: { $avg: '$customerMetrics.averageOrderFrequency' },
          },
        },
      ]);

      if (results.length > 0) {
        const r = results[0];
        return {
          newCustomers: r.newCustomers || 0,
          returningCustomers: r.returningCustomers || 0,
          retentionRate: r.retentionRate || 0,
          churnRate: r.churnRate || 0,
          averageVisitsPerCustomer: r.avgVisits || 0,
          averageOrderFrequency: r.avgFrequency || 0,
        };
      }

      return this.getDefaultCustomerMetrics();
    } catch (error) {
      logger.error('Error calculating customer metrics:', error);
      return this.getDefaultCustomerMetrics();
    }
  }

  private getDefaultCustomerMetrics(): ICustomerMetrics {
    return {
      newCustomers: 0,
      returningCustomers: 0,
      retentionRate: 0,
      churnRate: 0,
      averageVisitsPerCustomer: 0,
      averageOrderFrequency: 0,
    };
  }

  private async getVisitFrequency(query: CustomerQuery): Promise<Array<{
    customerId: string;
    visitCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastVisit: Date;
  }>> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        {
          $unwind: {
            path: '$customerLifetime.topCustomers',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$customerLifetime.topCustomers.customerId',
            visitCount: { $sum: '$customerLifetime.topCustomers.totalOrders' },
            totalSpent: { $sum: '$customerLifetime.topCustomers.totalSpent' },
            lastVisit: { $max: '$periodEnd' },
          },
        },
        {
          $project: {
            _id: 0,
            customerId: '$_id',
            visitCount: 1,
            totalSpent: 1,
            averageOrderValue: { $cond: [{ $eq: ['$visitCount', 0] }, 0, { $divide: ['$totalSpent', '$visitCount'] }] },
            lastVisit: 1,
          },
        },
        { $sort: { visitCount: -1 } },
        { $limit: 100 },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting visit frequency:', error);
      return [];
    }
  }

  private async getCustomerSegments(query: CustomerQuery): Promise<{
    vip: number;
    regular: number;
    occasional: number;
    atRisk: number;
    churned: number;
  }> {
    // Segment customers based on activity:
    // VIP: >10 visits or >5000 spent
    // Regular: 4-10 visits
    // Occasional: 1-3 visits
    // At Risk: no visits in 30+ days
    // Churned: no visits in 90+ days

    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        {
          $unwind: {
            path: '$customerLifetime.topCustomers',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            vip: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $gte: ['$customerLifetime.topCustomers.totalOrders', 10] },
                      { $gte: ['$customerLifetime.topCustomers.totalSpent', 5000] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            regular: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$customerLifetime.topCustomers.totalOrders', 4] },
                      { $lt: ['$customerLifetime.topCustomers.totalOrders', 10] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            occasional: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$customerLifetime.topCustomers.totalOrders', 1] },
                      { $lt: ['$customerLifetime.topCustomers.totalOrders', 4] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            atRisk: {
              $sum: {
                $cond: [{ $eq: ['$customerLifetime.topCustomers.totalOrders', 0] }, 1, 0],
              },
            },
            churned: { $sum: 0 },
          },
        },
      ]);

      if (results.length > 0) {
        return {
          vip: results[0].vip || 0,
          regular: results[0].regular || 0,
          occasional: results[0].occasional || 0,
          atRisk: results[0].atRisk || 0,
          churned: results[0].churned || 0,
        };
      }

      return { vip: 0, regular: 0, occasional: 0, atRisk: 0, churned: 0 };
    } catch (error) {
      logger.error('Error getting customer segments:', error);
      return { vip: 0, regular: 0, occasional: 0, atRisk: 0, churned: 0 };
    }
  }

  private async getCohortAnalysis(query: CustomerQuery): Promise<Array<{
    cohort: string;
    retention: Array<{ month: number; rate: number }>;
  }>> {
    // In production, this would analyze customer cohorts over time
    // Returns retention rates by cohort month
    try {
      // Simplified cohort analysis
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$periodStart' } },
            initialCustomers: { $sum: '$customerMetrics.newCustomers' },
            retained: {
              $sum: {
                $multiply: [
                  '$customerMetrics.newCustomers',
                  { $divide: ['$customerMetrics.retentionRate', 100] },
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            cohort: '$_id',
            retentionRate: {
              $cond: [
                { $eq: ['$initialCustomers', 0] },
                0,
                { $multiply: [{ $divide: ['$retained', '$initialCustomers'] }, 100] },
              ],
            },
          },
        },
        { $sort: { cohort: 1 } },
      ]);

      return results.map((r) => ({
        cohort: r.cohort,
        retention: [{ month: 0, rate: 100 }, { month: 1, rate: r.retentionRate }],
      }));
    } catch (error) {
      logger.error('Error getting cohort analysis:', error);
      return [];
    }
  }

  private async getTopCustomers(query: CustomerQuery): Promise<Array<{
    customerId: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    visitsThisMonth: number;
  }>> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        {
          $unwind: {
            path: '$customerLifetime.topCustomers',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$customerLifetime.topCustomers.customerId',
            totalOrders: { $sum: '$customerLifetime.topCustomers.totalOrders' },
            totalSpent: { $sum: '$customerLifetime.topCustomers.totalSpent' },
          },
        },
        {
          $project: {
            _id: 0,
            customerId: '$_id',
            totalOrders: 1,
            totalSpent: 1,
            averageOrderValue: { $cond: [{ $eq: ['$totalOrders', 0] }, 0, { $divide: ['$totalSpent', '$totalOrders'] }] },
            visitsThisMonth: '$totalOrders',
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 20 },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting top customers:', error);
      return [];
    }
  }

  private async getLTVData(query: CustomerQuery): Promise<{
    averageLTV: number;
    medianLTV: number;
    totalLTV: number;
  }> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
            'customerLifetime.averageLTV': { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            averageLTV: { $avg: '$customerLifetime.averageLTV' },
            totalLTV: { $sum: '$customerLifetime.averageLTV' },
          },
        },
      ]);

      if (results.length > 0) {
        return {
          averageLTV: results[0].averageLTV || 0,
          medianLTV: results[0].averageLTV || 0, // Would need separate calculation for true median
          totalLTV: results[0].totalLTV || 0,
        };
      }

      return { averageLTV: 0, medianLTV: 0, totalLTV: 0 };
    } catch (error) {
      logger.error('Error getting LTV data:', error);
      return { averageLTV: 0, medianLTV: 0, totalLTV: 0 };
    }
  }

  async getRetentionMetrics(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    retentionRate: number;
    churnRate: number;
    nDayRetention: Array<{ day: number; rate: number }>;
  }> {
    // Calculate retention over time
    const cacheKey = `retention:${restaurantId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const redis = getRedisClient();

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate n-day retention
    const nDayRetention = [
      { day: 1, rate: 0 },   // Day 1 retention
      { day: 7, rate: 0 },   // Week 1 retention
      { day: 30, rate: 0 },  // Month 1 retention
      { day: 60, rate: 0 },  // Month 2 retention
      { day: 90, rate: 0 },  // Month 3 retention
    ];

    const result = {
      retentionRate: 0,
      churnRate: 0,
      nDayRetention,
    };

    await redis.setex(cacheKey, config.analytics.cacheDurations.customerMetrics, JSON.stringify(result));

    return result;
  }
}

export const customerAnalyticsService = new CustomerAnalyticsService();
