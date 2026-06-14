import { Request, Response, NextFunction } from 'express';
import {
  startOnboarding,
  getOnboardingById,
  getOnboardingByEmployee,
  getActiveOnboarding,
  listOnboardings,
  completeTask,
  addNote,
  cancelOnboarding,
  getOnboardingStats
} from '../services/onboardingService';
import {
  StartOnboardingSchema,
  CompleteTaskSchema,
  AddNoteSchema,
  ListOnboardingQuerySchema
} from '../utils/validators';

/**
 * Start onboarding for a new employee
 * POST /api/onboarding/start
 */
export async function startOnboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = StartOnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const instance = await startOnboarding(parsed.data);

    res.status(201).json({
      success: true,
      data: instance
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already has an active onboarding')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
      return;
    }
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
 * Get onboarding by ID
 * GET /api/onboarding/:id
 */
export async function getOnboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const instance = await getOnboardingById(id);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found'
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
 * Get onboarding by employee ID
 * GET /api/onboarding/employee/:employeeId
 */
export async function getOnboardingByEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { employeeId } = req.params;
    const instances = await getOnboardingByEmployee(employeeId);

    res.json({
      success: true,
      data: instances
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active onboarding for current user
 * GET /api/onboarding/active
 */
export async function getActiveOnboardingHandler(
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

    const instance = await getActiveOnboarding(employeeId);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'No active onboarding found'
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
 * List all onboardings with filters
 * GET /api/onboarding
 */
export async function listOnboardingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ListOnboardingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const result = await listOnboardings(parsed.data);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete a task
 * PATCH /api/onboarding/:id/task/:taskId
 */
export async function completeTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, taskId } = req.params;
    const parsed = CompleteTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const completedBy = (req.headers['x-user-id'] as string) || 'system';
    const instance = await completeTask(id, taskId, parsed.data, completedBy);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found'
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
 * Add note to onboarding
 * POST /api/onboarding/:id/notes
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
        error: 'Onboarding not found'
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
 * Cancel onboarding
 * POST /api/onboarding/:id/cancel
 */
export async function cancelOnboardingHandler(
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

    const instance = await cancelOnboarding(id, reason);

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found'
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
 * Get onboarding statistics
 * GET /api/onboarding/stats
 */
export async function getOnboardingStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { department, startDateFrom, startDateTo } = req.query;

    const filters: {
      department?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
    } = {};

    if (department) filters.department = department as string;
    if (startDateFrom) filters.startDateFrom = new Date(startDateFrom as string);
    if (startDateTo) filters.startDateTo = new Date(startDateTo as string);

    const stats = await getOnboardingStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}
