import { AnalyticsEvent, AnalyticsEventDocument } from '../models/index.js';
import {
  EventFilters,
  OverviewStats,
  StoreStats,
  UserStats,
  PopularProduct,
  RevenueStats,
  AnalyticsEventInput,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

// Generate unique event ID
const generateEventId = (): string => {
  return `evt_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

export class AnalyticsService {
  // Track single event
  async trackEvent(input: AnalyticsEventInput): Promise<AnalyticsEventDocument> {
    const eventData = {
      eventId: input.eventId || generateEventId(),
      eventType: input.eventType,
      userId: input.userId,
      sessionId: input.sessionId,
      storeId: input.storeId,
      productId: input.productId,
      metadata: input.metadata || {},
      timestamp: input.timestamp
        ? new Date(input.timestamp)
        : new Date(),
    };

    const event = new AnalyticsEvent(eventData);
    return event.save();
  }

  // Track multiple events in batch
  async trackBatch(
    events: AnalyticsEventInput[]
  ): Promise<AnalyticsEventDocument[]> {
    const eventDocs = events.map((input) => ({
      eventId: input.eventId || generateEventId(),
      eventType: input.eventType,
      userId: input.userId,
      sessionId: input.sessionId,
      storeId: input.storeId,
      productId: input.productId,
      metadata: input.metadata || {},
      timestamp: input.timestamp
        ? new Date(input.timestamp)
        : new Date(),
    }));

    return AnalyticsEvent.insertMany(eventDocs, { ordered: false });
  }

  // Get events with filters
  async getEvents(filters: EventFilters): Promise<{
    events: AnalyticsEventDocument[];
    total: number;
    hasMore: boolean;
  }> {
    const query: Record<string, any> = {};

    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.userId) query.userId = filters.userId;
    if (filters.sessionId) query.sessionId = filters.sessionId;
    if (filters.storeId) query.storeId = filters.storeId;
    if (filters.productId) query.productId = filters.productId;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const total = await AnalyticsEvent.countDocuments(query);
    const events = await AnalyticsEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(filters.offset)
      .limit(filters.limit);

    return {
      events,
      total,
      hasMore: filters.offset + events.length < total,
    };
  }

  // Get overview statistics
  async getOverviewStats(): Promise<OverviewStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total counts
    const [totalOrders, totalUsers, totalSessions, totalProducts] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventType: 'order' }),
      AnalyticsEvent.distinct('userId', { userId: { $exists: true, $ne: null } }),
      AnalyticsEvent.distinct('sessionId'),
      AnalyticsEvent.distinct('productId', { productId: { $exists: true, $ne: null } }),
    ]);

    // Revenue calculation (orders with amount in metadata)
    const orderEvents = await AnalyticsEvent.find({ eventType: 'order' });
    const totalRevenue = orderEvents.reduce((sum, event) => {
      const amount = event.metadata?.amount || event.metadata?.revenue || 0;
      return sum + Number(amount);
    }, 0);

    // Period stats
    const [ordersToday, ordersThisWeek, ordersThisMonth] = await Promise.all([
      AnalyticsEvent.countDocuments({
        eventType: 'order',
        timestamp: { $gte: startOfToday },
      }),
      AnalyticsEvent.countDocuments({
        eventType: 'order',
        timestamp: { $gte: startOfWeek },
      }),
      AnalyticsEvent.countDocuments({
        eventType: 'order',
        timestamp: { $gte: startOfMonth },
      }),
    ]);

    // Revenue by period
    const [revenueToday, revenueThisWeek, revenueThisMonth] = await Promise.all([
      this.calculateRevenue(startOfToday),
      this.calculateRevenue(startOfWeek),
      this.calculateRevenue(startOfMonth),
    ]);

    // Top categories
    const categoryAggregation = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'order' } },
      { $group: { _id: '$metadata.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topCategories = categoryAggregation.map((cat) => ({
      category: cat._id || 'uncategorized',
      count: cat.count,
    }));

    // Conversion rate (orders / views)
    const totalViews = await AnalyticsEvent.countDocuments({ eventType: 'view' });
    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      totalUsers: totalUsers.length,
      totalSessions: totalSessions.length,
      totalProducts: totalProducts.length,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topCategories,
      periodStats: {
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
      },
    };
  }

  // Get store-specific statistics
  async getStoreStats(storeId: string): Promise<StoreStats> {
    const [totalOrders, totalViews, totalAddToCart] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventType: 'order', storeId }),
      AnalyticsEvent.countDocuments({ eventType: 'view', storeId }),
      AnalyticsEvent.countDocuments({ eventType: 'add_to_cart', storeId }),
    ]);

    // Revenue
    const orderEvents = await AnalyticsEvent.find({ eventType: 'order', storeId });
    const totalRevenue = orderEvents.reduce((sum, event) => {
      const amount = event.metadata?.amount || event.metadata?.revenue || 0;
      return sum + Number(amount);
    }, 0);

    // Popular products
    const productAggregation = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'order', storeId, productId: { $exists: true } } },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 },
          revenue: { $sum: '$metadata.amount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const popularProducts = productAggregation.map((p) => ({
      productId: p._id,
      count: p.count,
      revenue: p.revenue || 0,
    }));

    // Hourly distribution
    const hourlyAggregation = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'order', storeId } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          orders: { $sum: 1 },
          revenue: { $sum: '$metadata.amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyDistribution = hourlyAggregation.map((h) => ({
      hour: h._id,
      orders: h.orders,
      revenue: h.revenue || 0,
    }));

    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    return {
      storeId,
      totalOrders,
      totalRevenue,
      totalViews,
      totalAddToCart,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      popularProducts,
      hourlyDistribution,
    };
  }

  // Get user-specific statistics
  async getUserStats(userId: string): Promise<UserStats> {
    const [totalOrders, sessionCount] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventType: 'order', userId }),
      AnalyticsEvent.distinct('sessionId', { userId }),
    ]);

    // Total spent
    const orderEvents = await AnalyticsEvent.find({ eventType: 'order', userId });
    const totalSpent = orderEvents.reduce((sum, event) => {
      const amount = event.metadata?.amount || event.metadata?.revenue || 0;
      return sum + Number(amount);
    }, 0);

    // Last order date
    const lastOrder = await AnalyticsEvent.findOne({ eventType: 'order', userId })
      .sort({ timestamp: -1 })
      .select('timestamp');

    // Favorite store
    const storeAggregation = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'order', userId, storeId: { $exists: true } } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const favoriteStore = storeAggregation[0]?._id || null;

    // Favorite products
    const productAggregation = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'order', userId, productId: { $exists: true } } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const favoriteProducts = productAggregation.map((p) => ({
      productId: p._id,
      count: p.count,
    }));

    // Cart abandonment rate
    const addToCartCount = await AnalyticsEvent.countDocuments({
      eventType: 'add_to_cart',
      userId,
    });
    const checkoutCount = await AnalyticsEvent.countDocuments({
      eventType: 'checkout',
      userId,
    });
    const cartAbandonmentRate =
      addToCartCount > 0
        ? ((addToCartCount - checkoutCount) / addToCartCount) * 100
        : 0;

    return {
      userId,
      totalOrders,
      totalSpent,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      lastOrderDate: lastOrder?.timestamp || null,
      favoriteStore,
      favoriteProducts,
      sessionCount: sessionCount.length,
      cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
    };
  }

  // Get popular products
  async getPopularProducts(limit: number = 20): Promise<PopularProduct[]> {
    const productStats = await AnalyticsEvent.aggregate([
      {
        $group: {
          _id: '$productId',
          viewCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] },
          },
          addToCartCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] },
          },
          orderCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'order'] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$eventType', 'order'] },
                { $ifNull: ['$metadata.amount', 0] },
                0,
              ],
            },
          },
        },
      },
      { $match: { _id: { $exists: true } } },
      { $sort: { orderCount: -1 } },
      { $limit: limit },
    ]);

    return productStats.map((p) => ({
      productId: p._id,
      viewCount: p.viewCount,
      addToCartCount: p.addToCartCount,
      orderCount: p.orderCount,
      revenue: p.revenue || 0,
      conversionRate:
        p.viewCount > 0 ? Math.round((p.orderCount / p.viewCount) * 10000) / 100 : 0,
    }));
  }

  // Get daily revenue
  async getDailyRevenue(days: number = 30): Promise<RevenueStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'order',
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          revenue: { $sum: { $ifNull: ['$metadata.amount', 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = dailyData.map((d) => ({
      date: d._id,
      revenue: d.revenue || 0,
      orders: d.orders,
    }));

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

    return {
      period: 'daily',
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      data,
    };
  }

  // Get weekly revenue
  async getWeeklyRevenue(weeks: number = 12): Promise<RevenueStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const weeklyData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'order',
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$timestamp' },
            week: { $isoWeek: '$timestamp' },
          },
          revenue: { $sum: { $ifNull: ['$metadata.amount', 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const data = weeklyData.map((w) => ({
      date: `${w._id.year}-W${String(w._id.week).padStart(2, '0')}`,
      revenue: w.revenue || 0,
      orders: w.orders,
    }));

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

    return {
      period: 'weekly',
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      data,
    };
  }

  // Get monthly revenue
  async getMonthlyRevenue(months: number = 12): Promise<RevenueStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'order',
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
          },
          revenue: { $sum: { $ifNull: ['$metadata.amount', 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const data = monthlyData.map((m) => ({
      date: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      revenue: m.revenue || 0,
      orders: m.orders,
    }));

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

    return {
      period: 'monthly',
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      data,
    };
  }

  // Cleanup old events
  async cleanupOldEvents(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await AnalyticsEvent.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  }

  // Helper: Calculate revenue since date
  private async calculateRevenue(sinceDate: Date): Promise<number> {
    const orders = await AnalyticsEvent.find({
      eventType: 'order',
      timestamp: { $gte: sinceDate },
    });

    return orders.reduce((sum, event) => {
      const amount = event.metadata?.amount || event.metadata?.revenue || 0;
      return sum + Number(amount);
    }, 0);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
