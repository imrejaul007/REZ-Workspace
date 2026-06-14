import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import {
  AnalyticsEventSchema,
  BatchEventsSchema,
  EventFiltersSchema,
} from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation error handler
const validateRequest = (schema: any, data: any) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    };
  }
  return { valid: true, data: result.data };
};

// POST /events - Track single analytics event
router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateRequest(AnalyticsEventSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const event = await analyticsService.trackEvent(validation.data);

    logger.info('Analytics event tracked', {
      eventId: event.eventId,
      eventType: event.eventType,
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /events/batch - Track multiple analytics events
router.post('/events/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateRequest(BatchEventsSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const events = await analyticsService.trackBatch(validation.data.events);

    logger.info('Batch analytics events tracked', {
      count: events.length,
    });

    res.status(201).json({
      success: true,
      data: {
        count: events.length,
        eventIds: events.map((e) => e.eventId),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /events - List events with filters
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      eventType: req.query.eventType as any,
      userId: req.query.userId as string,
      sessionId: req.query.sessionId as string,
      storeId: req.query.storeId as string,
      productId: req.query.productId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const validation = validateRequest(EventFiltersSchema, filters);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const result = await analyticsService.getEvents(validation.data);

    res.json({
      success: true,
      data: {
        events: result.events.map((e) => ({
          eventId: e.eventId,
          eventType: e.eventType,
          userId: e.userId,
          sessionId: e.sessionId,
          storeId: e.storeId,
          productId: e.productId,
          metadata: e.metadata,
          timestamp: e.timestamp,
        })),
        pagination: {
          total: result.total,
          limit: validation.data.limit,
          offset: validation.data.offset,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/overview - Get overview statistics
router.get('/stats/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await analyticsService.getOverviewStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/store/:storeId - Get store-specific statistics
router.get(
  '/stats/store/:storeId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
      }

      const stats = await analyticsService.getStoreStats(storeId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/user/:userId - Get user-specific statistics
router.get(
  '/stats/user/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const stats = await analyticsService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/products/popular - Get popular products
router.get(
  '/stats/products/popular',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const stats = await analyticsService.getPopularProducts(limit);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/revenue/daily - Get daily revenue
router.get(
  '/stats/revenue/daily',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const stats = await analyticsService.getDailyRevenue(days);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/revenue/weekly - Get weekly revenue
router.get(
  '/stats/revenue/weekly',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weeks = req.query.weeks ? parseInt(req.query.weeks as string) : 12;
      const stats = await analyticsService.getWeeklyRevenue(weeks);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/revenue/monthly - Get monthly revenue
router.get(
  '/stats/revenue/monthly',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 12;
      const stats = await analyticsService.getMonthlyRevenue(months);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /events/cleanup - Cleanup old events
router.delete(
  '/events/cleanup',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const retentionDays = req.query.days
        ? parseInt(req.query.days as string)
        : 90;

      const deletedCount = await analyticsService.cleanupOldEvents(retentionDays);

      logger.info('Analytics cleanup completed', { deletedCount, retentionDays });

      res.json({
        success: true,
        data: {
          deletedCount,
          retentionDays,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
