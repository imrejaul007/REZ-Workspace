import { Types } from 'mongoose';
import { Analytics, Order, Product, Creator } from '../models';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import config from '../config';
import {
  CreatorAnalyticsSummary,
  PlatformAnalytics,
  PaginatedResponse,
} from '../types';

class AnalyticsService {
  /**
   * Get creator analytics summary
   */
  async getCreatorSummary(creatorId: string, days: number = 30): Promise<CreatorAnalyticsSummary | null> {
    // Try cache first
    const cacheKey = cacheService.keys.creatorAnalytics(creatorId);
    const cached = await cacheService.get<CreatorAnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const creator = await Creator.findById(creatorId);
    if (!creator) {
      return null;
    }

    // Get analytics for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalEarnings' },
          totalOrders: { $sum: '$totalOrders' },
          totalProducts: { $sum: '$totalProducts' },
          totalPageViews: { $sum: '$pageViews' },
          totalUniqueVisitors: { $sum: '$uniqueVisitors' },
          avgConversionRate: { $avg: '$conversionRate' },
        },
      },
    ]);

    const analytics = analyticsData[0] || {
      totalEarnings: 0,
      totalOrders: 0,
      totalProducts: creator.totalProducts,
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      avgConversionRate: 0,
    };

    // Get top products
    const topProducts = await this.getTopProducts(creatorId, 10);

    // Get monthly earnings
    const monthlyEarnings = await this.getMonthlyEarnings(creatorId, days);

    // Calculate paid out amount
    const paidOut = creator.totalEarnings - creator.pendingPayout;

    const summary: CreatorAnalyticsSummary = {
      totalEarnings: analytics.totalEarnings || creator.totalEarnings,
      totalOrders: analytics.totalOrders || creator.totalOrders,
      totalProducts: analytics.totalProducts || creator.totalProducts,
      conversionRate: analytics.avgConversionRate || 0,
      averageOrderValue: analytics.totalOrders > 0
        ? (analytics.totalEarnings / analytics.totalOrders)
        : 0,
      topProducts,
      monthlyEarnings,
      pendingPayout: creator.pendingPayout,
      paidOut,
    };

    // Cache the result
    await cacheService.set(cacheKey, summary, config.cache.analyticsTtl);

    return summary;
  }

  /**
   * Get top products for a creator
   */
  async getTopProducts(creatorId: string, limit: number = 10): Promise<Array<{
    productId: string;
    name: string;
    count: number;
    revenue: number;
  }>> {
    const products = await Product.find({ creatorId });
    const productIds = products.map((p) => p._id);

    const topProducts = await Order.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          productId: { $in: productIds },
        },
      },
      {
        $group: {
          _id: '$productId',
          count: { $sum: '$quantity' },
          revenue: { $sum: '$netEarnings' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    // Map product names
    const productMap = new Map(products.map((p) => [p._id.toString(), p.name]));

    return topProducts.map((p) => ({
      productId: p._id.toString(),
      name: productMap.get(p._id.toString()) || 'Unknown',
      count: p.count,
      revenue: p.revenue,
    }));
  }

  /**
   * Get monthly earnings breakdown
   */
  async getMonthlyEarnings(creatorId: string, days: number = 30): Promise<Array<{
    date: string;
    amount: number;
    orders: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analyticsData = await Analytics.find({
      creatorId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    return analyticsData.map((a) => ({
      date: a.date.toISOString().split('T')[0],
      amount: a.totalEarnings,
      orders: a.totalOrders,
    }));
  }

  /**
   * Get daily earnings breakdown
   */
  async getDailyEarnings(creatorId: string, days: number = 30): Promise<Array<{
    date: string;
    amount: number;
    orders: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = await Order.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          createdAt: { $gte: startDate },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          amount: { $sum: '$netEarnings' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return dailyData.map((d) => ({
      date: d._id,
      amount: d.amount,
      orders: d.orders,
    }));
  }

  /**
   * Get order status breakdown
   */
  async getOrderStatusBreakdown(creatorId: string): Promise<Record<string, number>> {
    const breakdown = await Order.aggregate([
      { $match: { creatorId: new Types.ObjectId(creatorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    breakdown.forEach((b) => {
      result[b._id] = b.count;
    });

    return result;
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    // Try cache first
    const cacheKey = cacheService.keys.platformAnalytics();
    const cached = await cacheService.get<PlatformAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    const [creatorStats, productStats, orderStats] = await Promise.all([
      Creator.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            totalCommission: { $sum: '$commissionAmount' },
          },
        },
      ]),
    ]);

    // Process creator stats
    let totalCreators = 0;
    let activeCreators = 0;
    creatorStats.forEach((c) => {
      totalCreators += c.count;
      if (c._id === 'active') {
        activeCreators = c.count;
      }
    });

    // Process product stats
    const totalProducts = productStats.reduce((sum, p) => sum + p.count, 0);

    // Process order stats
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalCommission = 0;
    let pendingPayouts = 0;

    orderStats.forEach((o) => {
      totalOrders += o.count;
      totalRevenue += o.totalRevenue;
      totalCommission += o.totalCommission;
      if (o._id === 'pending' || o._id === 'processing') {
        pendingPayouts += o.totalRevenue - o.totalCommission;
      }
    });

    const platformAnalytics: PlatformAnalytics = {
      totalCreators,
      activeCreators,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCommission,
      pendingPayouts,
    };

    // Cache for 1 minute
    await cacheService.set(cacheKey, platformAnalytics, 60);

    return platformAnalytics;
  }

  /**
   * Get recent orders for analytics
   */
  async getRecentOrders(creatorId: string, limit: number = 10): Promise<Array<{
    orderId: string;
    orderNumber: string;
    productName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>> {
    const orders = await Order.find({ creatorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name');

    return orders.map((o) => ({
      orderId: o._id.toString(),
      orderNumber: o.orderNumber,
      productName: (o.productId as unknown as { name: string })?.name || 'Unknown',
      amount: o.netEarnings,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  /**
   * Get conversion metrics
   */
  async getConversionMetrics(creatorId: string, days: number = 30): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    totalOrders: number;
    conversionRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$pageViews' },
          uniqueVisitors: { $sum: '$uniqueVisitors' },
          totalOrders: { $sum: '$totalOrders' },
        },
      },
    ]);

    const data = analyticsData[0] || {
      totalViews: 0,
      uniqueVisitors: 0,
      totalOrders: 0,
    };

    return {
      totalViews: data.totalViews,
      uniqueVisitors: data.uniqueVisitors,
      totalOrders: data.totalOrders,
      conversionRate: data.totalViews > 0
        ? (data.totalOrders / data.totalViews) * 100
        : 0,
    };
  }

  /**
   * Record page view
   */
  async recordPageView(creatorId: string, productId?: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existingAnalytics = await Analytics.findOne({
        creatorId,
        date: today,
      });

      if (existingAnalytics) {
        existingAnalytics.pageViews += 1;
        existingAnalytics.uniqueVisitors += 1;
        await existingAnalytics.save();
      } else {
        await Analytics.create({
          creatorId,
          date: today,
          pageViews: 1,
          uniqueVisitors: 1,
        });
      }

      // Invalidate cache
      await cacheService.invalidateCreatorCache(creatorId);
    } catch (error) {
      logger.error('Error recording page view:', error);
    }
  }

  /**
   * Get earnings trend
   */
  async getEarningsTrend(creatorId: string, days: number = 30): Promise<{
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    currentPeriod: number;
    previousPeriod: number;
  }> {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const [currentPeriodData, previousPeriodData] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            creatorId: new Types.ObjectId(creatorId),
            createdAt: { $gte: currentPeriodStart },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netEarnings' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            creatorId: new Types.ObjectId(creatorId),
            createdAt: {
              $gte: previousPeriodStart,
              $lt: currentPeriodStart,
            },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netEarnings' },
          },
        },
      ]),
    ]);

    const currentPeriod = currentPeriodData[0]?.total || 0;
    const previousPeriod = previousPeriodData[0]?.total || 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentage = 0;

    if (previousPeriod > 0) {
      percentage = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
      trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    } else if (currentPeriod > 0) {
      trend = 'up';
      percentage = 100;
    }

    return {
      trend,
      percentage: Math.round(percentage * 100) / 100,
      currentPeriod,
      previousPeriod,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
