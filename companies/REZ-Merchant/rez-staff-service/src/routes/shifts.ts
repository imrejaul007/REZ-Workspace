import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { shiftService, CreateShiftDTO, UpdateShiftDTO, ShiftSwapDTO } from '../services';

const router = Router();

// Validation schemas
const createShiftSchema = Joi.object({
  merchantId: Joi.string().required(),
  staffId: Joi.string().required(),
  date: Joi.date().required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  role: Joi.string().required(),
  breakMinutes: Joi.number().integer().min(0).default(0),
  notes: Joi.string().optional(),
});

const updateShiftSchema = Joi.object({
  date: Joi.date().optional(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  role: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'absent').optional(),
  breakMinutes: Joi.number().integer().min(0).optional(),
  notes: Joi.string().optional().allow(''),
});

const swapShiftsSchema = Joi.object({
  shiftId1: Joi.string().required(),
  shiftId2: Joi.string().required(),
});

const scheduleQuerySchema = Joi.object({
  merchantId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  staffId: Joi.string().optional(),
  role: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'absent').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
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
 * POST /api/shifts
 * Create a new shift
 */
router.post('/', validate(createShiftSchema), async (req: Request, res: Response) => {
  try {
    const data: CreateShiftDTO = req.body;
    const shift = await shiftService.createShift(data);

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/shifts/bulk
 * Bulk create shifts
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const shifts: CreateShiftDTO[] = req.body.shifts;

    if (!Array.isArray(shifts)) {
      return res.status(400).json({
        success: false,
        message: 'Shifts must be an array',
      });
    }

    const result = await shiftService.bulkCreateShifts(shifts);

    res.status(201).json({
      success: true,
      message: `Created ${result.created.length} shifts, ${result.failed.length} failed`,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create shifts';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/shifts/schedule
 * Get schedule for date range
 */
router.get('/schedule', validateQuery(scheduleQuerySchema), async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const result = await shiftService.getSchedule({
      merchantId: query.merchantId as string,
      startDate: new Date(query.startDate as string),
      endDate: new Date(query.endDate as string),
      staffId: query.staffId as string | undefined,
      role: query.role as string | undefined,
      status: query.status as any,
    });

    res.json({
      success: true,
      data: result.shifts,
      summary: result.summary,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get schedule';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/shifts/staff/:staffId
 * Get shifts for a specific staff member
 */
router.get('/staff/:staffId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const shifts = await shiftService.getStaffShifts(
      req.params.staffId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get staff shifts';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/shifts/:id
 * Get shift by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shift = await shiftService.getShiftById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PUT /api/shifts/:id
 * Update shift
 */
router.put('/:id', validate(updateShiftSchema), async (req: Request, res: Response) => {
  try {
    const data: UpdateShiftDTO = req.body;
    const shift = await shiftService.updateShift(req.params.id, data);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * DELETE /api/shifts/:id
 * Delete shift
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await shiftService.deleteShift(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/shifts/swap
 * Swap two shifts
 */
router.post('/swap', validate(swapShiftsSchema), async (req: Request, res: Response) => {
  try {
    const data: ShiftSwapDTO = req.body;
    const result = await shiftService.swapShifts(data);

    res.json({
      success: true,
      message: 'Shifts swapped successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to swap shifts';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PATCH /api/shifts/:id/confirm
 * Confirm a shift
 */
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const shift = await shiftService.confirmShift(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      message: 'Shift confirmed',
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PATCH /api/shifts/:id/complete
 * Mark shift as completed
 */
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const shift = await shiftService.completeShift(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      message: 'Shift completed',
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete shift';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PATCH /api/shifts/:id/absent
 * Mark shift as absent
 */
router.patch('/:id/absent', async (req: Request, res: Response) => {
  try {
    const shift = await shiftService.markAbsent(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.json({
      success: true,
      message: 'Shift marked as absent',
      data: shift,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark shift absent';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
