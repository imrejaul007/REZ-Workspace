import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { schedulingService, SchedulingConfig } from '../services';
import { StaffRole } from '../models';

const router = Router();

// Validation schemas
const staffingRequirementSchema = Joi.object({
  role: Joi.string().valid('manager', 'chef', 'waiter', 'cashier', 'kitchen', 'delivery').required(),
  minStaff: Joi.number().integer().min(0).required(),
  preferredStaff: Joi.number().integer().min(0).required(),
  timeSlots: Joi.array().items(
    Joi.object({
      startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
      endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    })
  ).required(),
});

const generateScheduleSchema = Joi.object({
  merchantId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  staffingRequirements: Joi.array().items(staffingRequirementSchema).required(),
  excludeStaffIds: Joi.array().items(Joi.string()).optional(),
});

const validateScheduleSchema = Joi.object({
  merchantId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
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

/**
 * POST /api/schedule/generate
 * Generate schedule based on staffing requirements
 */
router.post('/generate', validate(generateScheduleSchema), async (req: Request, res: Response) => {
  try {
    const config: SchedulingConfig = req.body;
    const result = await schedulingService.generateSchedule(config);

    res.status(201).json({
      success: true,
      message: result.success
        ? 'Schedule generated successfully'
        : 'Schedule generated with some issues',
      data: {
        shifts: result.shifts,
        unassigned: result.unassigned,
        coverage: result.coverage,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedule';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/schedule/auto-generate
 * Auto-generate weekly schedule
 */
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    const { merchantId, weekStartDate } = req.body;

    if (!merchantId || !weekStartDate) {
      return res.status(400).json({
        success: false,
        message: 'merchantId and weekStartDate are required',
      });
    }

    const result = await schedulingService.autoGenerateWeeklySchedule(
      merchantId,
      new Date(weekStartDate)
    );

    res.status(201).json({
      success: true,
      message: result.success
        ? 'Weekly schedule generated successfully'
        : 'Schedule generated with some issues',
      data: {
        shifts: result.shifts,
        unassigned: result.unassigned,
        coverage: result.coverage,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to auto-generate schedule';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/schedule/optimize/:merchantId
 * Get optimized staffing recommendations
 */
router.get('/optimize/:merchantId', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required',
      });
    }

    const requirements = await schedulingService.optimizeStaffing(
      req.params.merchantId,
      new Date(date as string)
    );

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to optimize staffing';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/schedule/predict/:merchantId
 * Predict staffing needs
 */
router.get('/predict/:merchantId', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required',
      });
    }

    const prediction = await schedulingService.predictNeeds(
      req.params.merchantId,
      new Date(date as string)
    );

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to predict needs';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/schedule/suggest-swaps/:merchantId
 * Suggest shift swaps for better coverage
 */
router.get('/suggest-swaps/:merchantId', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required',
      });
    }

    const suggestions = await schedulingService.suggestShiftSwaps(
      req.params.merchantId,
      new Date(date as string)
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to suggest swaps';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/schedule/validate
 * Validate schedule coverage
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { merchantId, startDate, endDate } = req.body;

    if (!merchantId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'merchantId, startDate, and endDate are required',
      });
    }

    const validation = await schedulingService.validateSchedule(
      merchantId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate schedule';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/schedule/demand/:merchantId
 * Get demand prediction for multiple dates
 */
router.get('/demand/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const predictions: any[] = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const prediction = await schedulingService.predictNeeds(
        req.params.merchantId,
        new Date(currentDate)
      );
      predictions.push(prediction);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get demand predictions';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
