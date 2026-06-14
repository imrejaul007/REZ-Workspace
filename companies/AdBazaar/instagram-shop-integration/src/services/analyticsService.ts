import { ShopAnalytics, IShopAnalytics, ShopOrder } from '../models';
import { instagramApiService } from './instagramApiService';
import logger from '../utils/logger';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  productId?: string;
}

export interface ShopAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  productViews: number;
  productClicks: number;
  checkoutRate: number;
  topProducts: Array<{
    productId: string;
    views: number;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Record<string, number>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  instagramInsights: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
}

class AnalyticsService {
  /**
   * Get shop performance analytics
   */
  async getShopAnalytics(
    filters: AnalyticsFilters = {},
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<ShopAnalyticsData> {
    try {
      // Get Instagram insights
      const instagramInsights = await instagramApiService.getShopInsights(period);

      // Get order statistics
      const match: Record<string, unknown> = {};
      if (filters.startDate) match.createdAt = { $gte: filters.startDate };
      if (filters.endDate) {
        match.createdAt = match.createdAt || {};
        (match.createdAt as Record<string, Date>).$lte = filters.endDate;
      }

      const orderStats = await ShopOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]);

      // Get orders by status
      const ordersByStatus = await ShopOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const statusCounts = ordersByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get revenue by day
      const revenueByDay = await ShopOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]);

      // Get top products
      const topProducts = await ShopOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$productId',
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]);

      const stats = orderStats[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
      };

      // Calculate conversion rate
      const checkoutCompleted = statusCounts.delivered || 0;
      const checkoutInitiated = stats.totalOrders || 0;
      const conversionRate =
        checkoutInitiated > 0 ? (checkoutCompleted / checkoutInitiated) * 100 : 0;

      return {
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.avgOrderValue || 0,
        conversionRate,
        productViews: instagramInsights.impressions,
        productClicks: instagramInsights.clicks,
        checkoutRate:
          checkoutInitiated > 0
            ? (checkoutCompleted / checkoutInitiated) * 100
            : 0,
        topProducts: topProducts.map((p) => ({
          productId: p._id.toString(),
          views: 0, // Would need product views tracking
          orders: p.orders,
          revenue: p.revenue,
        })),
        ordersByStatus: statusCounts,
        revenueByDay: revenueByDay.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders,
        })),
        instagramInsights: {
          reach: instagramInsights.reach,
          impressions: instagramInsights.impressions,
          engagement: instagramInsights.engagement,
          clicks: instagramInsights.clicks,
          conversions: instagramInsights.conversions,
          revenue: instagramInsights.revenue,
        },
      };
    } catch (error) {
      logger.error('Failed to get shop analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record daily analytics
   */
  async recordDailyAnalytics(date: Date = new Date()): Promise<IShopAnalytics> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get orders for the day
      const orders = await ShopOrder.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }).exec();

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      const completedOrders = orders.filter((o) => o.status === 'delivered').length;

      const analytics = await ShopAnalytics.findOneAndUpdate(
        { date: startOfDay },
        {
          date: startOfDay,
          productViews: 0, // Would be populated from Instagram
          productClicks: 0,
          addToCartCount: 0,
          checkoutInitiated: totalOrders,
          checkoutCompleted: completedOrders,
          revenue: totalRevenue,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          conversionRate:
            totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        },
        { upsert: true, new: true }
      );

      logger.info('Daily analytics recorded', {
        date: startOfDay.toISOString(),
        totalOrders,
        totalRevenue,
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to record daily analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get analytics for a specific date range
   */
  async getAnalyticsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<IShopAnalytics[]> {
    return ShopAnalytics.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .exec();
  }

  /**
   * Get product-level analytics
   */
  async getProductAnalytics(productId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageRating?: number;
    conversionRate: number;
  }> {
    const orders = await ShopOrder.find({ productId }).exec();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;

    return {
      totalOrders,
      totalRevenue,
      conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;