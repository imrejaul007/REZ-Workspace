import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { attendanceService } from '../services';

const router = Router();

// Validation schemas
const checkInSchema = Joi.object({
  staffId: Joi.string().required(),
  date: Joi.date().optional(),
});

const checkOutSchema = Joi.object({
  staffId: Joi.string().required(),
  date: Joi.date().optional(),
});

const attendanceQuerySchema = Joi.object({
  staffId: Joi.string().optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').optional(),
});

const updateStatusSchema = Joi.object({
  staffId: Joi.string().required(),
  date: Joi.date().required(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').required(),
});

const bulkAttendanceSchema = Joi.object({
  staffIds: Joi.array().items(Joi.string()).required(),
  date: Joi.date().required(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').required(),
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
 * POST /api/attendance/check-in
 * Check in a staff member
 */
router.post('/check-in', validate(checkInSchema), async (req: Request, res: Response) => {
  try {
    const { staffId, date } = req.body;
    const attendance = await attendanceService.checkIn({
      staffId,
      date: date ? new Date(date) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check in';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/attendance/check-out
 * Check out a staff member
 */
router.post('/check-out', validate(checkOutSchema), async (req: Request, res: Response) => {
  try {
    const { staffId, date } = req.body;
    const attendance = await attendanceService.checkOut({
      staffId,
      date: date ? new Date(date) : undefined,
    });

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check out';
    const statusCode = message.includes('not found') || message.includes('first') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/attendance
 * Get attendance records with filters
 */
router.get('/', validateQuery(attendanceQuerySchema), async (req: Request, res: Response) => {
  try {
    const { staffId, startDate, endDate, status } = req.query;

    const result = await attendanceService.getAttendance({
      staffId: staffId as string | undefined,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      status: status as any,
    });

    res.json({
      success: true,
      data: result.records,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/attendance/date/:date
 * Get attendance for a specific date
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceService.getAttendanceForDate(
      new Date(req.params.date)
    );

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/attendance/staff/:staffId/overtime
 * Calculate overtime for a staff member
 */
router.get('/staff/:staffId/overtime', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const overtime = await attendanceService.calculateOvertime(
      req.params.staffId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: overtime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate overtime';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PATCH /api/attendance/status
 * Update attendance status manually
 */
router.patch('/status', validate(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const { staffId, date, status } = req.body;
    const attendance = await attendanceService.updateStatus(
      staffId,
      new Date(date),
      status
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: attendance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/attendance/absent
 * Mark staff as absent
 */
router.post('/absent', async (req: Request, res: Response) => {
  try {
    const { staffId, date } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'staffId and date are required',
      });
    }

    const attendance = await attendanceService.markAbsent(
      staffId,
      new Date(date)
    );

    res.status(201).json({
      success: true,
      message: 'Marked as absent',
      data: attendance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark absent';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /api/attendance/bulk
 * Bulk mark attendance for multiple staff
 */
router.post('/bulk', validate(bulkAttendanceSchema), async (req: Request, res: Response) => {
  try {
    const { staffIds, date, status } = req.body;
    const result = await attendanceService.bulkMarkAttendance(
      staffIds,
      new Date(date),
      status
    );

    res.json({
      success: true,
      message: `Marked ${result.marked} staff, ${result.failed.length} failed`,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to bulk mark attendance';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/attendance/summary
 * Get attendance summary for a merchant
 */
router.get('/summary/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const summary = await attendanceService.getAttendanceSummary(
      req.params.merchantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
