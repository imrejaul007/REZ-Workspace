import { Router, Request, Response, NextFunction } from 'express';
import { shiftService, coverageService } from '../services';
import {
  createShiftSchema,
  updateShiftSchema,
  getShiftsByDateSchema,
  bulkCreateShiftsSchema,
  createCoverageSchema,
} from '../types/schemas';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/shifts/schedule
 * Create a new shift schedule
 */
router.post('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createShiftSchema.parse(req.body);
    const shift = await shiftService.createShift(validated);

    res.status(201).json({
      success: true,
      data: shift,
      message: 'Shift created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error && error.message === 'Template not found') {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/shifts/schedule/bulk
 * Bulk create shifts for a date range
 */
router.post('/schedule/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = bulkCreateShiftsSchema.parse(req.body);
    const result = await shiftService.bulkCreateShifts(validated);

    res.status(201).json({
      success: true,
      data: {
        created: result.created,
        shifts: result.shifts,
      },
      message: `${result.created} shifts created successfully`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/shifts/:date
 * Get shifts for a specific date
 */
router.get('/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = getShiftsByDateSchema.parse({ date: req.params.date });
    const shifts = await shiftService.getShiftsByDate(validated.date, true);

    res.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/shifts/id/:id
 * Get shift by ID
 */
router.get('/id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shift = await shiftService.getShiftById(req.params.id, true);

    if (!shift) {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }

    res.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/shifts/id/:id
 * Update a shift
 */
router.patch('/id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateShiftSchema.parse(req.body);
    const shift = await shiftService.updateShift(req.params.id, validated);

    if (!shift) {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }

    res.json({
      success: true,
      data: shift,
      message: 'Shift updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /api/shifts/id/:id
 * Delete a shift
 */
router.delete('/id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await shiftService.deleteShift(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/employee/:employeeId
 * Get shifts for an employee
 */
router.get('/employee/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const shifts = await shiftService.getShiftsByEmployee(
      req.params.employeeId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/:id/assign
 * Assign employee to shift
 */
router.post('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      res.status(400).json({
        success: false,
        error: 'Employee ID is required',
      });
      return;
    }

    const shift = await shiftService.assignEmployee(req.params.id, employeeId);

    if (!shift) {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }

    res.json({
      success: true,
      data: shift,
      message: 'Employee assigned to shift',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/:id/remove
 * Remove employee from shift
 */
router.post('/:id/remove', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      res.status(400).json({
        success: false,
        error: 'Employee ID is required',
      });
      return;
    }

    const shift = await shiftService.removeEmployee(req.params.id, employeeId);

    if (!shift) {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }

    res.json({
      success: true,
      data: shift,
      message: 'Employee removed from shift',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/coverage/:date
 * Get coverage for a date
 */
router.get('/coverage/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await coverageService.getCoverageSummary(req.params.date);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/coverage
 * Create coverage requirement
 */
router.post('/coverage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createCoverageSchema.parse(req.body);
    const coverage = await coverageService.createCoverage(validated);

    res.status(201).json({
      success: true,
      data: coverage,
      message: 'Coverage created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error && error.message === 'Shift not found') {
      res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/shifts/coverage/summary/:date
 * Get coverage summary for a date
 */
router.get('/coverage/summary/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await coverageService.getCoverageSummary(req.params.date);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
