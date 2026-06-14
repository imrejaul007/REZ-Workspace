import { Router, Request, Response, NextFunction } from 'express';
import { subDays, startOfDay, endOfDay, format, subMonths } from 'date-fns';
import { revenueService } from '../services/RevenueService';
import { customerAnalyticsService } from '../services/CustomerAnalytics';
import { menuAnalyticsService } from '../services/MenuAnalytics';
import { trendService } from '../services/TrendService';
import { DashboardQuerySchema } from '../utils/validators';
import { ValidationError } from '../utils/errors';

const router = Router();

interface DashboardData {
  summary: {
    revenue: {
      today: number;
      yesterday: number;
      thisWeek: number;
      thisMonth: number;
      changePercentage: number;
    };
    orders: {
      today: number;
      yesterday: number;
      thisWeek: number;
      thisMonth: number;
    };
    customers: {
      today: number;
      totalActive: number;
      newCustomers: number;
      returningCustomers: number;
    };
    averageOrderValue: number;
  };
  charts: {
    revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
    revenueByHour: Array<{ hour: number; revenue: number }>;
    topDishes: Array<{ name: string; revenue: number; orders: number }>;
    customerFlow: Array<{ hour: number; customers: number }>;
    occupancyByHour: Array<{ hour: number; rate: number }>;
  };
  metrics: {
    tableTurnover: number;
    averageTableTime: number;
    peakHour: string;
    averageOrderValue: number;
    customerRetention: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'success';
    message: string;
    timestamp: Date;
  }>;
  insights: Array<{
    type: 'opportunity' | 'warning' | 'info';
    metric: string;
    message: string;
  }>;
}

const getPeriodDates = (period: string) => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const weekAgo = subDays(today, 7);
  const monthAgo = subMonths(today, 1);

  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        weekStart: startOfDay(weekAgo),
        weekEnd: endOfDay(yesterday),
      };
    case 'week':
      return {
        startDate: startOfDay(weekAgo),
        endDate: endOfDay(today),
        weekStart: startOfDay(subDays(weekAgo, 7)),
        weekEnd: startOfDay(weekAgo),
      };
    case 'month':
      return {
        startDate: startOfDay(monthAgo),
        endDate: endOfDay(today),
        weekStart: startOfDay(subDays(monthAgo, 7)),
        weekEnd: startOfDay(monthAgo),
      };
    case 'year':
      return {
        startDate: startOfDay(subMonths(today, 12)),
        endDate: endOfDay(today),
        weekStart: startOfDay(subMonths(today, 24)),
        weekEnd: startOfDay(subMonths(today, 12)),
      };
    default:
      return {
        startDate: startOfDay(weekAgo),
        endDate: endOfDay(today),
        weekStart: startOfDay(subDays(weekAgo, 7)),
        weekEnd: startOfDay(weekAgo),
      };
  }
};

// Validation middleware
const validateDashboardQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = DashboardQuerySchema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => e.message).join(', '));
    }
    req.query = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard
 * Get complete dashboard data
 */
router.get(
  '/',
  validateDashboardQuery,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, period } = req.query as { restaurantId: string; period: string };

      const dates = getPeriodDates(period);
      const today = new Date();
      const yesterday = subDays(today, 1);

      // Fetch all data in parallel
      const [
        todayRevenue,
        yesterdayRevenue,
        weekRevenue,
        monthRevenue,
        customerAnalytics,
        menuAnalytics,
        trendSummary,
        hourlyRevenue,
        peakHours,
      ] = await Promise.all([
        revenueService.getRevenueSummary({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
          granularity: 'day',
        }),
        revenueService.getRevenueSummary({
          restaurantId,
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
          granularity: 'day',
        }),
        revenueService.getRevenueSummary({
          restaurantId,
          startDate: dates.weekStart,
          endDate: dates.weekEnd,
          granularity: 'day',
        }),
        revenueService.getRevenueSummary({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
          granularity: 'day',
        }),
        customerAnalyticsService.getCustomerAnalytics({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
        menuAnalyticsService.getMenuAnalytics({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
          limit: 10,
        }),
        trendService.getTrendSummary({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
        revenueService.getHourlyRevenue(restaurantId, today),
        trendService.getPeakHours({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
      ]);

      // Calculate change percentage
      const changePercentage = yesterdayRevenue.total > 0
        ? ((todayRevenue.total - yesterdayRevenue.total) / yesterdayRevenue.total) * 100
        : 0;

      // Find peak hour
      const topPeakHour = peakHours.sort((a, b) => b.averageRevenue - a.averageRevenue)[0];
      const peakHourTime = topPeakHour
        ? `${topPeakHour.hour.toString().padStart(2, '0')}:00`
        : '12:00';

      // Build dashboard response
      const dashboardData: DashboardData = {
        summary: {
          revenue: {
            today: todayRevenue.total,
            yesterday: yesterdayRevenue.total,
            thisWeek: weekRevenue.total,
            thisMonth: monthRevenue.total,
            changePercentage: Math.round(changePercentage * 100) / 100,
          },
          orders: {
            today: todayRevenue.totalOrders,
            yesterday: yesterdayRevenue.totalOrders,
            thisWeek: weekRevenue.totalOrders,
            thisMonth: monthRevenue.totalOrders,
          },
          customers: {
            today: todayRevenue.totalCustomers,
            totalActive: customerAnalytics.totalCustomers,
            newCustomers: customerAnalytics.newCustomers,
            returningCustomers: customerAnalytics.returningCustomers,
          },
          averageOrderValue: todayRevenue.averageOrderValue,
        },
        charts: {
          revenueByDay: todayRevenue.byPeriod.map((p) => ({
            date: p.period,
            revenue: p.revenue,
            orders: p.orderCount,
          })),
          revenueByHour: hourlyRevenue,
          topDishes: menuAnalytics.popularDishes.slice(0, 5).map((d) => ({
            name: d.dishName,
            revenue: d.revenue,
            orders: d.orderCount,
          })),
          customerFlow: peakHours.slice(0, 12).map((p) => ({
            hour: p.hour,
            customers: p.averageCustomers,
          })),
          occupancyByHour: trendSummary.occupancyRate.byHour,
        },
        metrics: {
          tableTurnover: trendSummary.tableTurnover.reduce((sum, t) => sum + t.turnoverCount, 0) /
            Math.max(1, trendSummary.tableTurnover.length),
          averageTableTime: trendSummary.tableTurnover.reduce((sum, t) => sum + t.avgTurnoverTime, 0) /
            Math.max(1, trendSummary.tableTurnover.length),
          peakHour: peakHourTime,
          averageOrderValue: customerAnalytics.customerMetrics.averageOrderFrequency > 0
            ? monthRevenue.total / monthRevenue.totalOrders
            : 0,
          customerRetention: customerAnalytics.customerMetrics.retentionRate,
        },
        alerts: generateAlerts(todayRevenue, customerAnalytics, trendSummary),
        insights: trendSummary.insights,
      };

      res.json({
        success: true,
        data: dashboardData,
        meta: {
          restaurantId,
          period,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/summary
 * Quick summary for navbar/header
 */
router.get(
  '/summary',
  validateDashboardQuery,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, period } = req.query as { restaurantId: string; period: string };
      const dates = getPeriodDates(period);

      const [revenue, customerAnalytics] = await Promise.all([
        revenueService.getRevenueSummary({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
          granularity: 'day',
        }),
        customerAnalyticsService.getCustomerAnalytics({
          restaurantId,
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
      ]);

      res.json({
        success: true,
        data: {
          revenue: {
            total: revenue.total,
            changePercentage: revenue.changePercentage,
          },
          orders: revenue.totalOrders,
          customers: {
            active: customerAnalytics.totalCustomers,
            new: customerAnalytics.newCustomers,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/revenue-chart
 * Revenue chart data for the period
 */
router.get(
  '/revenue-chart',
  validateDashboardQuery,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, period } = req.query as { restaurantId: string; period: string };
      const dates = getPeriodDates(period);

      const granularity = period === 'today' ? 'hour' : 'day';

      const revenue = await revenueService.getRevenueSummary({
        restaurantId,
        startDate: dates.startDate,
        endDate: dates.endDate,
        granularity,
      });

      res.json({
        success: true,
        data: revenue.byPeriod.map((p) => ({
          label: p.period,
          revenue: p.revenue,
          orders: p.orderCount,
          averageOrderValue: p.averageOrderValue,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/occupancy-chart
 * Occupancy chart data
 */
router.get(
  '/occupancy-chart',
  validateDashboardQuery,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, period } = req.query as { restaurantId: string; period: string };
      const dates = getPeriodDates(period);

      const occupancy = await trendService.getOccupancyRate({
        restaurantId,
        startDate: dates.startDate,
        endDate: dates.endDate,
      });

      res.json({
        success: true,
        data: {
          average: occupancy.average,
          byHour: occupancy.byHour,
          byDayOfWeek: occupancy.byDayOfWeek,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/top-items
 * Top selling items
 */
router.get(
  '/top-items',
  validateDashboardQuery,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, period } = req.query as { restaurantId: string; period: string };
      const dates = getPeriodDates(period);

      const menu = await menuAnalyticsService.getMenuAnalytics({
        restaurantId,
        startDate: dates.startDate,
        endDate: dates.endDate,
        limit: 10,
      });

      res.json({
        success: true,
        data: menu.popularDishes,
        meta: {
          totalItems: menu.totalItems,
          totalRevenue: menu.totalRevenue,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

function generateAlerts(
  revenue,
  customerAnalytics,
  trendSummary: unknown
): Array<{
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp: Date;
}> {
  const alerts: Array<{
    type: 'info' | 'warning' | 'success';
    message: string;
    timestamp: Date;
  }> = [];

  // Revenue alerts
  if (revenue.changePercentage > 20) {
    alerts.push({
      type: 'success',
      message: `Revenue is up ${revenue.changePercentage.toFixed(1)}% compared to yesterday!`,
      timestamp: new Date(),
    });
  } else if (revenue.changePercentage < -20) {
    alerts.push({
      type: 'warning',
      message: `Revenue is down ${Math.abs(revenue.changePercentage).toFixed(1)}% compared to yesterday.`,
      timestamp: new Date(),
    });
  }

  // Customer retention alerts
  if (customerAnalytics.customerMetrics.retentionRate < 30) {
    alerts.push({
      type: 'warning',
      message: `Customer retention is low at ${customerAnalytics.customerMetrics.retentionRate.toFixed(1)}%. Consider loyalty programs.`,
      timestamp: new Date(),
    });
  }

  // Occupancy alerts
  if (trendSummary.occupancyRate.average > 95) {
    alerts.push({
      type: 'info',
      message: 'Restaurant frequently at full capacity. Consider expansion or waitlist management.',
      timestamp: new Date(),
    });
  }

  // Peak hour info
  const topPeak = trendSummary.peakHours[0];
  if (topPeak) {
    alerts.push({
      type: 'info',
      message: `Peak hours: ${topPeak.hour}:00 with ${topPeak.occupancyRate}% occupancy.`,
      timestamp: new Date(),
    });
  }

  return alerts;
}

export default router;
