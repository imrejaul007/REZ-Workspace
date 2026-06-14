import { Request, Response, NextFunction } from 'express';
import {
  startOffboarding,
  getOffboardingById,
  getOffboardingByEmployee,
  getActiveOffboarding,
  listOffboardings,
  completeOffboardingTask,
  updateClearance,
  addNote,
  cancelOffboarding,
  getOffboardingStats
} from '../services/offboardingService';
import {
  StartOffboardingSchema,
  CompleteOffboardingTaskSchema,
  UpdateClearanceSchema,
  AddNoteSchema,
  ListOffboardingQuerySchema
} from '../utils/validators';

/**
 * Start offboarding for an employee
 * POST /api/offboarding/start
 */
export async function startOffboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = StartOffboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const instance = await startOffboarding(parsed.data);

    res.status(201).json({
      success: true,
      data: instance
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already has an active')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
}

/**
 * Get offboarding by ID
 * GET /api/offboarding/:id
 */
export async function getOffboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const instance = await getOffboardingById(id);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Offboarding not found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get offboarding by employee ID
 * GET /api/offboarding/employee/:employeeId
 */
export async function getByEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { employeeId } = req.params;
    const instances = await getOffboardingByEmployee(employeeId);

    res.json({
      success: true,
      data: instances
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active offboarding for current user
 * GET /api/offboarding/active
 */
export async function getActiveHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employeeId = req.headers['x-employee-id'] as string;
    if (!employeeId) {
      res.status(400).json({
        success: false,
        error: 'Employee ID required'
      });
      return;
    }

    const instance = await getActiveOffboarding(employeeId);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'No active offboarding found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all offboardings with filters
 * GET /api/offboarding
 */
export async function listOffboardingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ListOffboardingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const result = await listOffboardings(parsed.data);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete an offboarding task
 * PATCH /api/offboarding/:id/task/:taskId
 */
export async function completeTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, taskId } = req.params;
    const parsed = CompleteOffboardingTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const completedBy = (req.headers['x-user-id'] as string) || 'system';
    const instance = await completeOffboardingTask(id, taskId, parsed.data, completedBy);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Offboarding not found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
}

/**
 * Update clearance status
 * PATCH /api/offboarding/:id/clearance
 */
export async function updateClearanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = UpdateClearanceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const clearedBy = (req.headers['x-user-id'] as string) || 'system';
    const instance = await updateClearance(id, parsed.data, clearedBy);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Offboarding not found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
}

/**
 * Add note to offboarding
 * POST /api/offboarding/:id/notes
 */
export async function addNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = AddNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const instance = await addNote(id, parsed.data.note);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Offboarding not found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel offboarding
 * POST /api/offboarding/:id/cancel
 */
export async function cancelOffboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Cancellation reason required'
      });
      return;
    }

    const instance = await cancelOffboarding(id, reason);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Offboarding not found'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get offboarding statistics
 * GET /api/offboarding/stats
 */
export async function getStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { department, fromDate, toDate } = req.query;

    const filters: {
      department?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {};

    if (department) filters.department = department as string;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const stats = await getOffboardingStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}
