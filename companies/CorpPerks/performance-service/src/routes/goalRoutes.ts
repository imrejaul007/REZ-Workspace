import { Router, Request, Response, NextFunction } from 'express';
import { GoalService, GoalServiceError } from '../services/goalService.js';
import { CreateGoalSchema, UpdateGoalProgressSchema, ListQuerySchema } from '../types/index.js';

const router = Router();
const goalService = new GoalService();

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// GOAL ROUTES
// ============================================

/**
 * POST /api/goals
 * Create a new goal
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.createGoal(req.body);
    res.status(201).json(result);
  })
);

/**
 * GET /api/goals
 * List all goals with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, managerId, status, cycleId, page, limit, search, sortBy, sortOrder } = req.query;

    // If filtering by employee
    if (employeeId) {
      const result = await goalService.getGoalsByEmployee(
        employeeId as string,
        status as string | undefined
      );
      return res.json(result);
    }

    // If filtering by manager
    if (managerId) {
      const result = await goalService.getGoalsByManager(
        managerId as string,
        status as string | undefined
      );
      return res.json(result);
    }

    // Default pagination list
    const result = await goalService.listGoals(req.query);
    res.json(result);
  })
);

/**
 * GET /api/goals/overdue
 * Get overdue goals
 */
router.get(
  '/overdue',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.getOverdueGoals();
    res.json(result);
  })
);

/**
 * GET /api/goals/upcoming
 * Get upcoming goals (due soon)
 */
router.get(
  '/upcoming',
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const result = await goalService.getUpcomingGoals(days);
    res.json(result);
  })
);

/**
 * GET /api/goals/stats/:employeeId
 * Get goal statistics for an employee
 */
router.get(
  '/stats/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.getEmployeeGoalStats(req.params.employeeId);
    res.json(result);
  })
);

/**
 * GET /api/goals/:id
 * Get a goal by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.getGoalById(req.params.id);
    res.json(result);
  })
);

/**
 * PATCH /api/goals/:id
 * Update a goal
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, dueDate, status, weight } = req.body;

    // For simple updates, use progress endpoint or create separate endpoints
    if (status || title !== undefined || description !== undefined || dueDate !== undefined || weight !== undefined) {
      // This would need a separate updateGoal method
      // For now, return not implemented
      return res.status(501).json({
        success: false,
        error: 'Use /progress endpoint for progress updates. Full goal updates coming soon.',
      });
    }

    res.status(501).json({ success: false, error: 'Not implemented' });
  })
);

/**
 * PATCH /api/goals/:id/progress
 * Update goal progress
 */
router.patch(
  '/:id/progress',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.updateProgress(req.params.id, req.body);
    res.json(result);
  })
);

/**
 * PATCH /api/goals/:id/key-result
 * Update a key result
 */
router.patch(
  '/:id/key-result',
  asyncHandler(async (req: Request, res: Response) => {
    const { keyResultId, currentValue, notes } = req.body;
    const result = await goalService.updateKeyResult(req.params.id, { keyResultId, currentValue, notes });
    res.json(result);
  })
);

/**
 * POST /api/goals/:id/key-result
 * Add a key result to a goal
 */
router.post(
  '/:id/key-result',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.addKeyResult(req.params.id, req.body);
    res.status(201).json(result);
  })
);

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await goalService.deleteGoal(req.params.id);
    res.json(result);
  })
);

export default router;
