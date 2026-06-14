import { getRedisClient } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Report, IPopularDish } from '../models/Report';

export interface MenuAnalyticsSummary {
  totalItems: number;
  totalRevenue: number;
  popularDishes: IPopularDish[];
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orderCount: number;
    percentageOfTotal: number;
  }>;
  averageOrderItems: number;
  profitMargins: Array<{
    dishId: string;
    dishName: string;
    revenue: number;
    cost: number;
    profitMargin: number; // percentage
  }>;
  underperformers: Array<{
    dishId: string;
    dishName: string;
    orderCount: number;
    revenue: number;
    lastOrdered?: Date;
  }>;
  recommendations: Array<{
    type: 'remove' | 'promote' | 'bundle' | 'price_adjust';
    dishId?: string;
    dishIds?: string[];
    message: string;
    potentialImpact: 'high' | 'medium' | 'low';
  }>;
}

export interface MenuQuery {
  restaurantId: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

export class MenuAnalyticsService {
  private getCacheKey(query: MenuQuery): string {
    return `menu:${query.restaurantId}:${query.startDate.toISOString()}:${query.endDate.toISOString()}:${query.limit || 50}`;
  }

  async getMenuAnalytics(query: MenuQuery): Promise<MenuAnalyticsSummary> {
    const cacheKey = this.getCacheKey(query);
    const redis = getRedisClient();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Menu analytics cache hit', { cacheKey });
      return JSON.parse(cached);
    }

    const [
      popularDishes,
      categoryBreakdown,
      profitMargins,
      underperformers,
      recommendations,
      summaryStats,
    ] = await Promise.all([
      this.getPopularDishes(query),
      this.getCategoryBreakdown(query),
      this.getProfitMargins(query),
      this.getUnderperformers(query),
      this.generateRecommendations(query),
      this.getSummaryStats(query),
    ]);

    const result: MenuAnalyticsSummary = {
      ...summaryStats,
      popularDishes,
      categoryBreakdown,
      profitMargins,
      underperformers,
      recommendations,
    };

    // Cache the result
    await redis.setex(
      cacheKey,
      config.analytics.cacheDurations.menuAnalytics,
      JSON.stringify(result)
    );

    logger.info('Menu analytics generated', {
      restaurantId: query.restaurantId,
      totalItems: result.totalItems,
      topDish: popularDishes[0]?.dishName || 'N/A',
    });

    return result;
  }

  private async getPopularDishes(query: MenuQuery): Promise<IPopularDish[]> {
    const limit = query.limit || 50;

    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$popularDishes.dishId',
            dishName: { $first: '$popularDishes.dishName' },
            category: { $first: '$popularDishes.category' },
            orderCount: { $sum: '$popularDishes.orderCount' },
            revenue: { $sum: '$popularDishes.revenue' },
            revenuePercentage: { $avg: '$popularDishes.revenuePercentage' },
            averageRating: { $avg: '$popularDishes.averageRating' },
            preparationTime: { $avg: '$popularDishes.preparationTime' },
          },
        },
        {
          $project: {
            _id: 0,
            dishId: '$_id',
            dishName: 1,
            category: 1,
            orderCount: 1,
            revenue: 1,
            revenuePercentage: 1,
            averageRating: 1,
            preparationTime: 1,
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting popular dishes:', error);
      return [];
    }
  }

  private async getCategoryBreakdown(query: MenuQuery): Promise<Array<{
    category: string;
    revenue: number;
    orderCount: number;
    percentageOfTotal: number;
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
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$popularDishes.category',
            revenue: { $sum: '$popularDishes.revenue' },
            orderCount: { $sum: '$popularDishes.orderCount' },
          },
        },
        {
          $group: {
            _id: null,
            categories: {
              $push: {
                category: '$_id',
                revenue: '$revenue',
                orderCount: '$orderCount',
              },
            },
            totalRevenue: { $sum: '$revenue' },
          },
        },
        { $unwind: '$categories' },
        {
          $project: {
            _id: 0,
            category: '$categories.category',
            revenue: '$categories.revenue',
            orderCount: '$categories.orderCount',
            percentageOfTotal: {
              $cond: [
                { $eq: ['$totalRevenue', 0] },
                0,
                { $multiply: [{ $divide: ['$categories.revenue', '$totalRevenue'] }, 100] },
              ],
            },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting category breakdown:', error);
      return [];
    }
  }

  private async getProfitMargins(query: MenuQuery): Promise<Array<{
    dishId: string;
    dishName: string;
    revenue: number;
    cost: number;
    profitMargin: number;
  }>> {
    // In production, this would require actual cost data from inventory/orders
    // Simulated profit margin calculation
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$popularDishes.dishId',
            dishName: { $first: '$popularDishes.dishName' },
            revenue: { $sum: '$popularDishes.revenue' },
            orderCount: { $sum: '$popularDishes.orderCount' },
          },
        },
        {
          $project: {
            _id: 0,
            dishId: '$_id',
            dishName: 1,
            revenue: 1,
            // Simulated cost at 30% of revenue
            cost: { $multiply: ['$revenue', 0.3] },
            profitMargin: 70, // Simulated
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
      ]);

      return results.map((r) => ({
        ...r,
        profitMargin: 100 - (r.cost / r.revenue) * 100 || 70,
      }));
    } catch (error) {
      logger.error('Error getting profit margins:', error);
      return [];
    }
  }

  private async getUnderperformers(query: MenuQuery): Promise<Array<{
    dishId: string;
    dishName: string;
    orderCount: number;
    revenue: number;
    lastOrdered?: Date;
  }>> {
    // Dishes with low order count or declining sales
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: query.restaurantId as unknown,
            periodStart: { $gte: query.startDate },
            periodEnd: { $lte: query.endDate },
          },
        },
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$popularDishes.dishId',
            dishName: { $first: '$popularDishes.dishName' },
            orderCount: { $sum: '$popularDishes.orderCount' },
            revenue: { $sum: '$popularDishes.revenue' },
            lastOrdered: { $max: '$periodEnd' },
          },
        },
        {
          $match: {
            orderCount: { $lte: 10 }, // Low performers threshold
          },
        },
        {
          $project: {
            _id: 0,
            dishId: '$_id',
            dishName: 1,
            orderCount: 1,
            revenue: 1,
            lastOrdered: 1,
          },
        },
        { $sort: { orderCount: 1 } },
        { $limit: 10 },
      ]);

      return results;
    } catch (error) {
      logger.error('Error getting underperformers:', error);
      return [];
    }
  }

  private async generateRecommendations(query: MenuQuery): Promise<Array<{
    type: 'remove' | 'promote' | 'bundle' | 'price_adjust';
    dishId?: string;
    dishIds?: string[];
    message: string;
    potentialImpact: 'high' | 'medium' | 'low';
  }>> {
    const recommendations: Array<{
      type: 'remove' | 'promote' | 'bundle' | 'price_adjust';
      dishId?: string;
      dishIds?: string[];
      message: string;
      potentialImpact: 'high' | 'medium' | 'low';
    }> = [];

    try {
      // Get underperformers for removal recommendations
      const underperformers = await this.getUnderperformers(query);

      for (const dish of underperformers.slice(0, 3)) {
        recommendations.push({
          type: 'remove',
          dishId: dish.dishId,
          message: `Consider removing "${dish.dishName}" - only ${dish.orderCount} orders in the period`,
          potentialImpact: 'medium',
        });
      }

      // Get top performers for promotion recommendations
      const topDishes = await this.getPopularDishes({ ...query, limit: 5 });

      for (const dish of topDishes.slice(0, 2)) {
        recommendations.push({
          type: 'promote',
          dishId: dish.dishId,
          message: `Promote "${dish.dishName}" - top revenue generator (${dish.revenuePercentage?.toFixed(1)}% of total)`,
          potentialImpact: 'high',
        });
      }

      // Bundle recommendations (complementary items)
      if (topDishes.length >= 2) {
        recommendations.push({
          type: 'bundle',
          dishIds: [topDishes[0].dishId, topDishes[1].dishId],
          message: `Bundle "${topDishes[0].dishName}" with "${topDishes[1].dishName}" for combo deals`,
          potentialImpact: 'medium',
        });
      }

      // Price adjustment recommendations
      const profitMargins = await this.getProfitMargins(query);
      const lowMarginItems = profitMargins.filter((p) => p.profitMargin < 30);

      for (const item of lowMarginItems.slice(0, 2)) {
        recommendations.push({
          type: 'price_adjust',
          dishId: item.dishId,
          message: `Consider increasing price for "${item.dishName}" - low margin (${item.profitMargin.toFixed(1)}%)`,
          potentialImpact: 'medium',
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  private async getSummaryStats(query: MenuQuery): Promise<{
    totalItems: number;
    totalRevenue: number;
    averageOrderItems: number;
  }> {
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
            totalItems: { $sum: { $size: { $ifNull: ['$popularDishes', []] } } },
            totalRevenue: { $sum: { $sum: '$popularDishes.revenue' } },
            totalOrders: { $sum: '$revenue.byPeriod.orderCount' },
          },
        },
        {
          $project: {
            _id: 0,
            totalItems: 1,
            totalRevenue: 1,
            averageOrderItems: {
              $cond: [
                { $eq: ['$totalOrders', 0] },
                0,
                { $divide: ['$totalItems', '$totalOrders'] },
              ],
            },
          },
        },
      ]);

      if (results.length > 0) {
        return results[0];
      }

      return { totalItems: 0, totalRevenue: 0, averageOrderItems: 0 };
    } catch (error) {
      logger.error('Error getting summary stats:', error);
      return { totalItems: 0, totalRevenue: 0, averageOrderItems: 0 };
    }
  }

  async getDishPerformance(
    restaurantId: string,
    dishId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    dishId: string;
    revenue: number;
    orderCount: number;
    trend: Array<{ date: Date; revenue: number; orderCount: number }>;
    averageRating: number;
    comparisonToAverage: number; // percentage above/below average
  }> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
          },
        },
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            'popularDishes.dishId': dishId,
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$periodStart' } },
            revenue: { $sum: '$popularDishes.revenue' },
            orderCount: { $sum: '$popularDishes.orderCount' },
            averageRating: { $avg: '$popularDishes.averageRating' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
            orderCount: 1,
            averageRating: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);

      const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
      const totalOrders = results.reduce((sum, r) => sum + r.orderCount, 0);
      const avgRating = results.length > 0
        ? results.reduce((sum, r) => sum + (r.averageRating || 0), 0) / results.length
        : 0;

      // Calculate comparison to average
      const allDishesAvg = await this.getAverageDishRevenue(restaurantId, startDate, endDate);
      const comparisonToAverage = allDishesAvg > 0
        ? ((totalRevenue / Math.max(1, results.length)) - allDishesAvg) / allDishesAvg * 100
        : 0;

      return {
        dishId,
        revenue: totalRevenue,
        orderCount: totalOrders,
        trend: results.map((r) => ({
          date: new Date(r.date),
          revenue: r.revenue,
          orderCount: r.orderCount,
        })),
        averageRating: avgRating,
        comparisonToAverage,
      };
    } catch (error) {
      logger.error('Error getting dish performance:', error);
      return {
        dishId,
        revenue: 0,
        orderCount: 0,
        trend: [],
        averageRating: 0,
        comparisonToAverage: 0,
      };
    }
  }

  private async getAverageDishRevenue(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const results = await Report.aggregate([
        {
          $match: {
            restaurantId: restaurantId as unknown,
            periodStart: { $gte: startDate },
            periodEnd: { $lte: endDate },
          },
        },
        { $unwind: { path: '$popularDishes', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$popularDishes.revenue' },
            dishCount: { $sum: 1 },
          },
        },
      ]);

      if (results.length > 0 && results[0].dishCount > 0) {
        return results[0].totalRevenue / results[0].dishCount;
      }

      return 0;
    } catch (error) {
      logger.error('Error getting average dish revenue:', error);
      return 0;
    }
  }
}

export const menuAnalyticsService = new MenuAnalyticsService();
