import { Router, Request, Response, NextFunction } from 'express';
import { FeedbackService, GoalServiceError } from '../services/goalService.js';
import { CreateFeedbackSchema } from '../types/index.js';

const router = Router();
const feedbackService = new FeedbackService();

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// FEEDBACK ROUTES
// ============================================

/**
 * POST /api/feedback
 * Submit 360 feedback
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await feedbackService.createFeedback(req.body);
    res.status(201).json(result);
  })
);

/**
 * GET /api/feedback
 * List feedback with filtering
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, cycleId, type } = req.query;

    // If filtering by user (received)
    if (userId && !type) {
      const result = await feedbackService.getFeedbackReceived(
        userId as string,
        cycleId as string | undefined
      );
      return res.json(result);
    }

    // Default - return empty (use specific endpoints)
    res.json({ success: true, data: [] });
  })
);

/**
 * GET /api/feedback/received
 * Get feedback received by current user
 */
router.get(
  '/received',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { cycleId } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const result = await feedbackService.getFeedbackReceived(
      userId,
      cycleId as string | undefined
    );
    res.json(result);
  })
);

/**
 * GET /api/feedback/given
 * Get feedback given by current user
 */
router.get(
  '/given',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { cycleId } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const result = await feedbackService.getFeedbackGiven(
      userId,
      cycleId as string | undefined
    );
    res.json(result);
  })
);

/**
 * GET /api/feedback/360/:userId/:cycleId
 * Get 360 feedback for a user
 */
router.get(
  '/360/:userId/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await feedbackService.get360Feedback(
      req.params.userId,
      req.params.cycleId
    );
    res.json(result);
  })
);

/**
 * GET /api/feedback/received/:userId
 * Get feedback received by a specific user
 */
router.get(
  '/received/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await feedbackService.getFeedbackReceived(
      req.params.userId,
      req.query.cycleId as string | undefined
    );
    res.json(result);
  })
);

/**
 * GET /api/feedback/given/:userId
 * Get feedback given by a specific user
 */
router.get(
  '/given/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await feedbackService.getFeedbackGiven(
      req.params.userId,
      req.query.cycleId as string | undefined
    );
    res.json(result);
  })
);

/**
 * DELETE /api/feedback/:id
 * Delete feedback
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await feedbackService.deleteFeedback(req.params.id);
    res.json(result);
  })
);

export default router;
