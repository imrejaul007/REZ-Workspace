import { Request, Response, NextFunction } from 'express';
import { MerchantProfileModel, MerchantScoreModel, MerchantEventModel } from '../models';
import { scoringService, insightsService, recommendationService, competitorService, trendService } from '../services';
import { orderConnector, inventoryConnector, feedbackConnector } from '../connectors';
import { logger } from '../utils/logger';
import { ApiResponse, MerchantProfile, MerchantEvent } from '../types';

/**
 * Create or update merchant profile
 * POST /merchant/profile
 */
export const createOrUpdateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profileData: Partial<MerchantProfile> = req.body;

    if (!profileData.merchantId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'MISSING_MERCHANT_ID', message: 'merchantId is required' },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(400).json(response);
      return;
    }

    // Upsert the profile
    const profile = await MerchantProfileModel.findOneAndUpdate(
      { merchantId: profileData.merchantId },
      { ...profileData, lastSyncedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    // Calculate and update scores
    const scores = await scoringService.calculateMerchantScores(profile);
    await MerchantScoreModel.findOneAndUpdate(
      { merchantId: profile.merchantId },
      scores,
      { new: true, upsert: true }
    );

    logger.info(`Profile created/updated for merchant: ${profile.merchantId}`);

    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant profile
 * GET /merchant/:id/profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Sync merchant data from external services
 * POST /merchant/:id/sync
 */
export const syncMerchantData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    let profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch data from connectors in parallel
    const [orderSummary, dailyOrders, popularItems, customerStats, peakHours,
           inventorySummary, stockAlerts, topCategories, feedbackSummary] = await Promise.all([
      orderConnector.getOrderSummary(id),
      orderConnector.getDailyOrderStats(id, 90),
      orderConnector.getPopularItems(id),
      orderConnector.getCustomerStats(id),
      orderConnector.getPeakHoursAnalysis(id),
      inventoryConnector.getInventorySummary(id),
      inventoryConnector.getStockAlerts(id),
      inventoryConnector.getTopCategories(id),
      feedbackConnector.getFeedbackSummary(id),
    ]);

    // Calculate revenue patterns
    const totalRevenue = orderSummary.totalRevenue;
    const totalOrders = orderSummary.completed;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate MoM and WoW growth
    const last30Days = dailyOrders.slice(-30);
    const previous30Days = dailyOrders.slice(-60, -30);
    const currentPeriodRevenue = last30Days.reduce((sum, d) => sum + d.revenue, 0);
    const previousPeriodRevenue = previous30Days.reduce((sum, d) => sum + d.revenue, 0);
    const momGrowth = previousPeriodRevenue > 0 ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;

    // Update profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).revenuePatterns = {
      daily: dailyOrders.map(d => ({
        date: d.date,
        amount: d.revenue,
        orderCount: d.orderCount,
      })),
      weekly: aggregateWeeklyData(dailyOrders),
      monthly: aggregateMonthlyData(dailyOrders),
      averageOrderValue: avgOrderValue,
      totalRevenue,
      revenueGrowth: {
        mom: momGrowth,
        wow: calculateWeeklyGrowth(dailyOrders),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).orderVolume = {
      total: orderSummary.total,
      completed: orderSummary.completed,
      cancelled: orderSummary.cancelled,
      refunded: orderSummary.refunded,
      pending: orderSummary.pending,
      averagePerDay: last30Days.reduce((sum, d) => sum + d.orderCount, 0) / 30,
      averagePerWeek: last30Days.reduce((sum, d) => sum + d.orderCount, 0) / 4,
      frequency: {
        daily: last30Days.reduce((sum, d) => sum + d.orderCount, 0) / 30,
        weekly: last30Days.reduce((sum, d) => sum + d.orderCount, 0) / 4,
        monthly: last30Days.reduce((sum, d) => sum + d.orderCount, 0),
      },
      peakTimes: extractPeakTimes(peakHours),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).popularItems = {
      items: popularItems.map(item => ({
        ...item,
        trend: 'stable' as const,
        lastUpdated: new Date(),
      })),
      totalItems: popularItems.length,
      topCategories: aggregateItemCategories(popularItems),
    };

    // Customer demographics
    const returningCustomers = customerStats.filter(c => c.totalOrders > 1).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).customerDemographics = {
      totalCustomers: customerStats.length,
      newCustomers: Math.floor(customerStats.length * 0.2), // Mock new customers
      returningCustomers,
      retentionRate: customerStats.length > 0 ? returningCustomers / customerStats.length : 0,
      demographics: {
        ageGroups: { '18-24': 15, '25-34': 30, '35-44': 25, '45-54': 20, '55+': 10 },
        customerTypes: { individual: 60, business: 25, premium: 15 },
        locations: [],
        orderPatterns: {
          timeOfDay: { morning: 15, afternoon: 35, evening: 40, night: 10 },
          orderSize: { small: 25, medium: 45, large: 30 },
          frequency: { occasional: 30, regular: 45, frequent: 25 },
        },
      },
      topCustomers: customerStats.slice(0, 10).map(c => ({
        customerId: c.customerId,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        averageOrderValue: c.averageOrderValue,
        lastOrderDate: new Date(c.lastOrderDate),
        customerType: 'individual',
      })),
      customerLifetimeValue: {
        average: customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / Math.max(customerStats.length, 1),
        median: calculateMedian(customerStats.map(c => c.totalSpent)),
        distribution: [
          { range: '$0-50', count: Math.floor(customerStats.length * 0.3) },
          { range: '$50-200', count: Math.floor(customerStats.length * 0.4) },
          { range: '$200+', count: Math.floor(customerStats.length * 0.3) },
        ],
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).peakHoursDays = {
      hourlyDistribution: peakHours.hourlyDistribution,
      dailyDistribution: peakHours.dailyDistribution,
      weeklyDistribution: [],
      monthlyDistribution: [],
      seasonalPatterns: [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).inventoryPatterns = {
      totalProducts: inventorySummary.totalProducts,
      activeProducts: inventorySummary.activeProducts,
      outOfStock: inventorySummary.outOfStock,
      lowStock: inventorySummary.lowStock,
      averageStockLevel: inventorySummary.averageStockLevel,
      turnoverRate: inventorySummary.turnoverRate,
      reorderFrequency: 3, // Mock
      topCategories,
      stockAlerts: stockAlerts.map(a => ({
        ...a,
        alertType: a.alertType as 'low_stock' | 'out_of_stock',
        createdAt: new Date(),
      })),
      restockPatterns: [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).growthMetrics = {
      revenue: {
        current: totalRevenue,
        previous: previousPeriodRevenue,
        change: currentPeriodRevenue - previousPeriodRevenue,
        percentageChange: momGrowth,
        trend: momGrowth >= 0 ? 'up' : 'down',
        momentum: momGrowth > 5 ? 'accelerating' : momGrowth < 0 ? 'decelerating' : 'steady',
      },
      orders: {
        current: totalOrders,
        previous: previous30Days.reduce((sum, d) => sum + d.orderCount, 0),
        change: totalOrders - previous30Days.reduce((sum, d) => sum + d.orderCount, 0),
        percentageChange: calculatePercentageChange(
          totalOrders,
          previous30Days.reduce((sum, d) => sum + d.orderCount, 0)
        ),
        trend: 'stable',
        momentum: 'steady',
      },
      customers: {
        current: customerStats.length,
        previous: Math.floor(customerStats.length * 0.9),
        change: Math.floor(customerStats.length * 0.1),
        percentageChange: 10,
        trend: 'up',
        momentum: 'accelerating',
      },
      averageOrderValue: {
        current: avgOrderValue,
        previous: avgOrderValue * 0.95,
        change: avgOrderValue * 0.05,
        percentageChange: 5,
        trend: 'up',
        momentum: 'steady',
      },
      customerRetention: {
        current: returningCustomers / Math.max(customerStats.length, 1),
        previous: 0.6,
        change: 0.05,
        percentageChange: 8,
        trend: 'up',
        momentum: 'steady',
      },
    };

    // Health signals
    const healthIndicators = [];
    if (momGrowth >= 0) {
      healthIndicators.push({ name: 'Revenue Growth', value: momGrowth, unit: '%', status: 'good' as const, trend: 'up' as const });
    } else {
      healthIndicators.push({ name: 'Revenue Growth', value: momGrowth, unit: '%', status: 'poor' as const, trend: 'down' as const });
    }

    healthIndicators.push({
      name: 'Order Completion Rate',
      value: orderSummary.total > 0 ? (orderSummary.completed / orderSummary.total) * 100 : 0,
      unit: '%',
      status: 'good',
      trend: 'stable',
    });

    if (inventorySummary.outOfStock > 0) {
      healthIndicators.push({
        name: 'Stock Availability',
        value: ((inventorySummary.totalProducts - inventorySummary.outOfStock) / Math.max(inventorySummary.totalProducts, 1)) * 100,
        unit: '%',
        status: 'moderate',
        trend: 'down',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as unknown).healthSignals = {
      overall: {
        status: momGrowth >= 0 && orderSummary.completed / Math.max(orderSummary.total, 1) > 0.8 ? 'healthy' : 'warning',
        score: Math.round(70 + momGrowth),
        factors: [],
      },
      alerts: stockAlerts.length > 0 ? stockAlerts.map((a, i) => ({
        id: `alert-${i}`,
        type: a.alertType === 'out_of_stock' ? 'inventory_issue' as const : 'inventory_issue' as const,
        severity: a.alertType === 'out_of_stock' ? 'high' as const : 'medium' as const,
        message: `${a.productName} is ${a.alertType === 'out_of_stock' ? 'out of stock' : 'low on stock'}`,
        metric: 'inventory',
        value: a.currentStock,
        threshold: a.threshold,
        createdAt: new Date(),
        acknowledged: false,
      })) : [],
      warnings: [],
      indicators: healthIndicators,
      lastHealthCheck: new Date(),
    };

    profile.lastSyncedAt = new Date();
    await profile.save();

    // Recalculate scores
    const scores = await scoringService.calculateMerchantScores(profile);
    await MerchantScoreModel.findOneAndUpdate(
      { merchantId: id },
      scores,
      { new: true, upsert: true }
    );

    logger.info(`Synced data for merchant: ${id}`);

    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant insights
 * GET /merchant/:id/insights
 */
export const getInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    const insights = await insightsService.generateInsights(profile);

    const response: ApiResponse<typeof insights> = {
      success: true,
      data: insights,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant recommendations
 * GET /merchant/:id/recommendations
 */
export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    const recommendations = await recommendationService.generateRecommendations(profile);

    const response: ApiResponse<typeof recommendations> = {
      success: true,
      data: recommendations,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant competitors
 * GET /merchant/:id/competitors
 */
export const getCompetitors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    const competitors = await competitorService.analyzeCompetitors(profile);

    const response: ApiResponse<typeof competitors> = {
      success: true,
      data: competitors,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant health score
 * GET /merchant/:id/health-score
 */
export const getHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const scores = await MerchantScoreModel.findOne({ merchantId: id });

    if (!scores) {
      const profile = await MerchantProfileModel.findOne({ merchantId: id });

      if (!profile) {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
          meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
        };
        res.status(404).json(response);
        return;
      }

      const newScores = await scoringService.calculateMerchantScores(profile);
      await MerchantScoreModel.create(newScores);

      const response: ApiResponse<typeof newScores.healthScore> = {
        success: true,
        data: newScores.healthScore,
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(200).json(response);
      return;
    }

    const response: ApiResponse<typeof scores.healthScore> = {
      success: true,
      data: scores.healthScore,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Capture merchant event
 * POST /merchant/:id/event
 */
export const captureEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const eventData: Partial<MerchantEvent> = req.body;

    if (!eventData.eventType || !eventData.eventData) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'INVALID_EVENT', message: 'eventType and eventData are required' },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(400).json(response);
      return;
    }

    const event = await MerchantEventModel.create({
      merchantId: id,
      eventType: eventData.eventType,
      eventData: eventData.eventData,
      metadata: {
        source: eventData.metadata?.source || 'api',
        correlationId: eventData.metadata?.correlationId,
        userId: eventData.metadata?.userId,
        sessionId: eventData.metadata?.sessionId,
      },
      timestamp: new Date(),
    });

    // Trigger any necessary updates based on event type
    await processEvent(id, eventData.eventType, eventData.eventData);

    logger.info(`Event captured for merchant ${id}: ${eventData.eventType}`);

    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant trends
 * GET /merchant/:id/trends
 */
export const getTrends = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { period, startDate, endDate, metrics } = req.query;

    const profile = await MerchantProfileModel.findOne({ merchantId: id });

    if (!profile) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Merchant profile not found: ${id}` },
        meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
      };
      res.status(404).json(response);
      return;
    }

    const filter = {
      period: period as unknown,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      metrics: metrics ? (metrics as string).split(',') : undefined,
    };

    const trends = await trendService.generateTrends(profile, filter);

    const response: ApiResponse<typeof trends> = {
      success: true,
      data: trends,
      meta: { timestamp: new Date(), requestId: req.headers['x-request-id'] as string || '' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Process event and update relevant data
 */
async function processEvent(
  merchantId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<void> {
  try {
    const profile = await MerchantProfileModel.findOne({ merchantId });

    if (!profile) return;

    // Update profile based on event type
    switch (eventType) {
      case 'order':
        // Order-related event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as unknown).orderVolume = {
          ...(profile as unknown).orderVolume,
          total: ((profile as unknown).orderVolume?.total || 0) + 1,
        };
        break;

      case 'inventory':
        // Inventory-related event
        break;

      case 'feedback':
        // Feedback-related event
        break;
    }

    profile.lastSyncedAt = new Date();
    await profile.save();
  } catch (error) {
    logger.error('Error processing event', error);
  }
}

/**
 * Aggregate daily data into weekly
 */
function aggregateWeeklyData(dailyData: unknown[]): unknown[] {
  const weeklyMap = new Map<string, unknown>();

  dailyData.forEach(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        weekStart: weekKey,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 0,
        orderCount: 0,
      });
    }

    const week = weeklyMap.get(weekKey)!;
    week.amount += day.revenue;
    week.orderCount += day.orderCount;
  });

  return Array.from(weeklyMap.values());
}

/**
 * Aggregate daily data into monthly
 */
function aggregateMonthlyData(dailyData: unknown[]): unknown[] {
  const monthlyMap = new Map<string, unknown>();

  dailyData.forEach(day => {
    const monthKey = day.date.substring(0, 7); // YYYY-MM

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        amount: 0,
        orderCount: 0,
      });
    }

    const month = monthlyMap.get(monthKey)!;
    month.amount += day.revenue;
    month.orderCount += day.orderCount;
  });

  return Array.from(monthlyMap.values());
}

/**
 * Calculate weekly growth
 */
function calculateWeeklyGrowth(dailyData: unknown[]): number {
  if (dailyData.length < 14) return 0;

  const thisWeek = dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
  const lastWeek = dailyData.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);

  return lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
}

/**
 * Extract peak times from hourly data
 */
function extractPeakTimes(peakHours): unknown[] {
  const peakTimes = [];

  for (const hour of peakHours.hourlyDistribution || []) {
    if (hour.orderCount > 10) {
      for (const day of peakHours.dailyDistribution || []) {
        if (day.orderCount > day.averageOrderValue * 2) {
          peakTimes.push({
            hour: hour.hour,
            dayOfWeek: day.dayOfWeek,
            orderCount: Math.min(hour.orderCount, day.orderCount),
            averageValue: (hour.averageOrderValue + day.averageOrderValue) / 2,
          });
        }
      }
    }
  }

  return peakTimes.sort((a, b) => b.orderCount - a.orderCount).slice(0, 10);
}

/**
 * Aggregate item categories
 */
function aggregateItemCategories(items: unknown[]): { category: string; count: number }[] {
  const categoryMap = new Map<string, number>();

  items.forEach(item => {
    const count = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, count + item.orderCount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate median value
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}
