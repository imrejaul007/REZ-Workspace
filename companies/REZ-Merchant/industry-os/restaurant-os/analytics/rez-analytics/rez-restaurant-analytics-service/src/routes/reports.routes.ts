import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { revenueService } from '../services/RevenueService';
import { customerAnalyticsService } from '../services/CustomerAnalytics';
import { menuAnalyticsService } from '../services/MenuAnalytics';
import { trendService } from '../services/TrendService';
import { ReportQuerySchema, PaginationSchema, DateRangeSchema, RestaurantIdSchema } from '../utils/validators';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateQuery = (schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        throw new ValidationError(result.error.errors.map((e) => e.message).join(', '));
      }
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Parse dates from query
const parseDateRange = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.startDate) {
    (req as unknown).startDate = new Date(req.query.startDate as string);
  }
  if (req.query.endDate) {
    (req as unknown).endDate = new Date(req.query.endDate as string);
  }
  next();
};

// Revenue Reports

/**
 * GET /api/reports/revenue
 * Get revenue summary with breakdown by period
 */
router.get(
  '/revenue',
  validateQuery(ReportQuerySchema),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, granularity } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const summary = await revenueService.getRevenueSummary({
        restaurantId,
        startDate,
        endDate,
        granularity,
      });

      res.json({
        success: true,
        data: summary,
        meta: {
          restaurantId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          granularity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/revenue/hourly
 * Get hourly revenue for a specific date
 */
router.get(
  '/revenue/hourly',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;

      const hourlyData = await revenueService.getHourlyRevenue(restaurantId, startDate);

      res.json({
        success: true,
        data: hourlyData,
        meta: {
          restaurantId,
          date: startDate.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Customer Reports

/**
 * GET /api/reports/customers
 * Get customer analytics summary
 */
router.get(
  '/customers',
  validateQuery(ReportQuerySchema.omit({ granularity: true })),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const analytics = await customerAnalyticsService.getCustomerAnalytics({
        restaurantId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: analytics,
        meta: {
          restaurantId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/customers/retention
 * Get customer retention metrics
 */
router.get(
  '/customers/retention',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const retention = await customerAnalyticsService.getRetentionMetrics(
        restaurantId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: retention,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Menu Reports

/**
 * GET /api/reports/menu
 * Get menu analytics summary
 */
router.get(
  '/menu',
  validateQuery(ReportQuerySchema.omit({ granularity: true })),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, limit } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const analytics = await menuAnalyticsService.getMenuAnalytics({
        restaurantId,
        startDate,
        endDate,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: analytics,
        meta: {
          restaurantId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: limit || 50,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/menu/:dishId
 * Get specific dish performance
 */
router.get(
  '/menu/:dishId',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const { dishId } = req.params;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const performance = await menuAnalyticsService.getDishPerformance(
        restaurantId,
        dishId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Trend Reports

/**
 * GET /api/reports/trends
 * Get trend summary (peak hours, occupancy, turnover, staff)
 */
router.get(
  '/trends',
  validateQuery(ReportQuerySchema.omit({ granularity: true })),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const trends = await trendService.getTrendSummary({
        restaurantId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: trends,
        meta: {
          restaurantId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/occupancy/realtime
 * Get real-time occupancy data
 */
router.get(
  '/occupancy/realtime',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;

      const occupancy = await trendService.getRealTimeOccupancy(restaurantId, startDate);

      res.json({
        success: true,
        data: occupancy,
        meta: {
          restaurantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/peak-hours
 * Get peak hours analysis
 */
router.get(
  '/peak-hours',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const peakHours = await trendService.getPeakHours({
        restaurantId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: peakHours,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/table-turnover
 * Get table turnover analysis
 */
router.get(
  '/table-turnover',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const turnover = await trendService.getTableTurnover({
        restaurantId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: turnover,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/staff-performance
 * Get staff performance metrics
 */
router.get(
  '/staff-performance',
  validateQuery(RestaurantIdSchema.merge(DateRangeSchema)),
  parseDateRange,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.query;
      const startDate = (req as unknown).startDate;
      const endDate = (req as unknown).endDate;

      const performance = await trendService.getStaffPerformance({
        restaurantId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
