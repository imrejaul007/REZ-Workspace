import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { performanceService } from '../services';

const router = Router();

// Validation schemas
const createPerformanceSchema = Joi.object({
  staffId: Joi.string().required(),
  period: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  date: Joi.date().required(),
  ordersServed: Joi.number().integer().min(0).optional(),
  avgTicketTime: Joi.number().min(0).optional(),
  customerRating: Joi.number().min(0).max(5).optional(),
  tips: Joi.number().min(0).optional(),
  deductions: Joi.number().min(0).optional(),
  bonus: Joi.number().min(0).optional(),
});

const updatePerformanceSchema = Joi.object({
  ordersServed: Joi.number().integer().min(0).optional(),
  avgTicketTime: Joi.number().min(0).optional(),
  customerRating: Joi.number().min(0).max(5).optional(),
  tips: Joi.number().min(0).optional(),
  deductions: Joi.number().min(0).optional(),
  bonus: Joi.number().min(0).optional(),
});

const performanceQuerySchema = Joi.object({
  staffId: Joi.string().optional(),
  period: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const upsertDailySchema = Joi.object({
  staffId: Joi.string().required(),
  date: Joi.date().required(),
  ordersServed: Joi.number().integer().min(0).optional(),
  avgTicketTime: Joi.number().min(0).optional(),
  customerRating: Joi.number().min(0).max(5).optional(),
  tips: Joi.number().min(0).optional(),
  deductions: Joi.number().min(0).optional(),
  bonus: Joi.number().min(0).optional(),
});

// Validation middleware
const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
};

const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
};

/**
 * POST /api/performance
 * Create a new performance record
 */
router.post('/', validate(createPerformanceSchema), async (req: Request, res: Response) => {
  try {
    const performance = await performanceService.createPerformance(req.body);

    res.status(201).json({
      success: true,
      message: 'Performance record created',
      data: performance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create performance record';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance
 * Get performance records with filters
 */
router.get('/', validateQuery(performanceQuerySchema), async (req: Request, res: Response) => {
  try {
    const { staffId, period, startDate, endDate, page, limit } = req.query;

    const result = await performanceService.getPerformanceRecords(
      {
        staffId: staffId as string | undefined,
        period: period as any,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      },
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: result.records,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get performance records';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance/:id
 * Get performance by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const performance = await performanceService.getPerformanceById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found',
      });
    }

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get performance record';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PUT /api/performance/:id
 * Update performance record
 */
router.put('/:id', validate(updatePerformanceSchema), async (req: Request, res: Response) => {
  try {
    const performance = await performanceService.updatePerformance(
      req.params.id,
      req.body
    );

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Performance record updated',
      data: performance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update performance record';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance/staff/:staffId/summary
 * Get performance summary for a staff member
 */
router.get('/staff/:staffId/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const summary = await performanceService.getStaffPerformanceSummary(
      req.params.staffId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get performance summary';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance/staff/:staffId/daily/:date
 * Get daily performance for a staff member
 */
router.get('/staff/:staffId/daily/:date', async (req: Request, res: Response) => {
  try {
    const performance = await performanceService.getDailyPerformance(
      req.params.staffId,
      new Date(req.params.date)
    );

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'No daily performance record found',
      });
    }

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get daily performance';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/performance/daily
 * Update or create daily performance
 */
router.post('/daily', validate(upsertDailySchema), async (req: Request, res: Response) => {
  try {
    const { staffId, date, ...data } = req.body;

    const performance = await performanceService.upsertDailyPerformance(
      staffId,
      new Date(date),
      data
    );

    res.json({
      success: true,
      message: 'Daily performance updated',
      data: performance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update daily performance';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/performance/staff/:staffId/weekly-summary
 * Generate weekly performance summary
 */
router.post('/staff/:staffId/weekly-summary', async (req: Request, res: Response) => {
  try {
    const { weekStartDate } = req.body;

    if (!weekStartDate) {
      return res.status(400).json({
        success: false,
        message: 'weekStartDate is required',
      });
    }

    const summary = await performanceService.generateWeeklySummary(
      req.params.staffId,
      new Date(weekStartDate)
    );

    res.json({
      success: true,
      message: 'Weekly summary generated',
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate weekly summary';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance/staff/:staffId/trends
 * Get performance trends
 */
router.get('/staff/:staffId/trends', async (req: Request, res: Response) => {
  try {
    const { period, count } = req.query;

    const trends = await performanceService.getPerformanceTrends(
      req.params.staffId,
      (period as any) || 'daily',
      Number(count) || 12
    );

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get performance trends';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/performance/top-performers/:merchantId
 * Get top performing staff for a merchant
 */
router.get('/top-performers/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const topPerformers = await performanceService.getTopPerformers(
      req.params.merchantId,
      new Date(startDate as string),
      new Date(endDate as string),
      Number(limit) || 10
    );

    res.json({
      success: true,
      data: topPerformers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get top performers';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
