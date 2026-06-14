import { Router, Request, Response, NextFunction } from 'express';
import { revenueService } from '../services/revenue.service';
import {
  CreateRevenueSchema,
  QueryRevenueSchema,
  StatsQuerySchema,
} from '../validators/revenue.validator';
import { ZodError } from 'zod';

const router = Router();

// Validation error handler
const validateRequest = (schema: typeof CreateRevenueSchema | typeof QueryRevenueSchema | typeof StatsQuerySchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req.method === 'GET' || req.method === 'DELETE'
        ? req.query
        : req.body;
      req.body = schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};

// POST / - Record new revenue
router.post(
  '/',
  validateRequest(CreateRevenueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await revenueService.createRecord(req.body);
      res.status(201).json({
        success: true,
        data: record,
        message: 'Revenue record created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET / - List all revenue records
router.get(
  '/',
  validateRequest(QueryRevenueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await revenueService.getRecords(req.body);
      res.json({
        success: true,
        data: result.records,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.records.length < result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /:id - Get record by ID
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await revenueService.getRecordById(req.params.id);
      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Revenue record not found',
        });
        return;
      }
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /screen/:screenId - Get revenue by screen
router.get(
  '/screen/:screenId',
  validateRequest(QueryRevenueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await revenueService.getRecordsByScreen(
        req.params.screenId,
        req.body
      );
      res.json({
        success: true,
        data: result.records,
        summary: {
          totalRevenue: result.totalRevenue,
          totalRecords: result.total,
        },
        pagination: {
          total: result.total,
          limit: req.body.limit,
          offset: req.body.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /advertiser/:advertiserId - Get revenue by advertiser
router.get(
  '/advertiser/:advertiserId',
  validateRequest(QueryRevenueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await revenueService.getRecordsByAdvertiser(
        req.params.advertiserId,
        req.body
      );
      res.json({
        success: true,
        data: result.records,
        summary: {
          totalRevenue: result.totalRevenue,
          totalRecords: result.total,
        },
        pagination: {
          total: result.total,
          limit: req.body.limit,
          offset: req.body.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /campaign/:campaignId - Get revenue by campaign
router.get(
  '/campaign/:campaignId',
  validateRequest(QueryRevenueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await revenueService.getRecordsByCampaign(
        req.params.campaignId,
        req.body
      );
      res.json({
        success: true,
        data: result.records,
        summary: {
          totalRevenue: result.totalRevenue,
          totalRecords: result.total,
        },
        pagination: {
          total: result.total,
          limit: req.body.limit,
          offset: req.body.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/overview - Get revenue overview
router.get(
  '/stats/overview',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await revenueService.getOverviewStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/daily - Get daily revenue
router.get(
  '/stats/daily',
  validateRequest(StatsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await revenueService.getDailyStats(req.body);
      res.json({
        success: true,
        data: stats,
        summary: {
          totalPeriods: stats.length,
          totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/weekly - Get weekly revenue
router.get(
  '/stats/weekly',
  validateRequest(StatsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await revenueService.getWeeklyStats(req.body);
      res.json({
        success: true,
        data: stats,
        summary: {
          totalPeriods: stats.length,
          totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/monthly - Get monthly revenue
router.get(
  '/stats/monthly',
  validateRequest(StatsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await revenueService.getMonthlyStats(req.body);
      res.json({
        success: true,
        data: stats,
        summary: {
          totalPeriods: stats.length,
          totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /stats/screen/:screenId/period - Get revenue for screen in period
router.get(
  '/stats/screen/:screenId/period',
  validateRequest(StatsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const stats = await revenueService.getScreenRevenueByPeriod(
        req.params.screenId,
        period,
        req.body
      );
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /:id - Delete record
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await revenueService.deleteRecord(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Revenue record not found',
        });
        return;
      }
      res.json({
        success: true,
        message: 'Revenue record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
