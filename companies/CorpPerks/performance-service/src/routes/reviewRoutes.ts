import { Router, Request, Response, NextFunction } from 'express';
import { ReviewCycleService, ReviewService, ReviewServiceError } from '../services/reviewService.js';
import { ListQuerySchema, CreateReviewCycleSchema, CreateReviewSchema, UpdateReviewRatingSchema } from '../types/index.js';

const router = Router();
const reviewCycleService = new ReviewCycleService();
const reviewService = new ReviewService();

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// REVIEW CYCLE ROUTES
// ============================================

/**
 * POST /api/reviews/cycles
 * Create a new review cycle
 */
router.post(
  '/cycles',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, startDate, endDate, status, description, participantIds, reviewTemplateId } = req.body;
    const createdBy = req.headers['x-user-id'] as string || 'system';

    const result = await reviewCycleService.createCycle(
      {
        name,
        startDate,
        endDate,
        status,
        description,
        participantIds,
        reviewTemplateId,
      },
      createdBy
    );

    res.status(201).json(result);
  })
);

/**
 * GET /api/reviews/cycles
 * List all review cycles
 */
router.get(
  '/cycles',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.listCycles(req.query);
    res.json(result);
  })
);

/**
 * GET /api/reviews/cycles/:id
 * Get a single review cycle
 */
router.get(
  '/cycles/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.getCycleById(req.params.id);
    res.json(result);
  })
);

/**
 * GET /api/reviews/cycles/:id/stats
 * Get cycle statistics
 */
router.get(
  '/cycles/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    // For now, return overall stats since cycle-specific stats require aggregation
    const result = await reviewCycleService.getCycleStats();
    res.json(result);
  })
);

/**
 * PATCH /api/reviews/cycles/:id
 * Update a review cycle
 */
router.patch(
  '/cycles/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.updateCycle(req.params.id, req.body);
    res.json(result);
  })
);

/**
 * DELETE /api/reviews/cycles/:id
 * Delete a review cycle
 */
router.delete(
  '/cycles/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.deleteCycle(req.params.id);
    res.json(result);
  })
);

/**
 * POST /api/reviews/cycles/:id/activate
 * Activate a review cycle
 */
router.post(
  '/cycles/:id/activate',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.updateCycle(req.params.id, { status: 'active' });
    res.json(result);
  })
);

/**
 * POST /api/reviews/cycles/:id/complete
 * Complete a review cycle
 */
router.post(
  '/cycles/:id/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCycleService.updateCycle(req.params.id, { status: 'completed' });
    res.json(result);
  })
);

// ============================================
// REVIEW ROUTES
// ============================================

/**
 * POST /api/reviews
 * Submit a new review
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.createReview(req.body);
    res.status(201).json(result);
  })
);

/**
 * GET /api/reviews
 * List reviews with filtering
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, cycleId, status } = req.query;

    if (employeeId) {
      const result = await reviewService.getReviewsByEmployee(
        employeeId as string,
        cycleId as string | undefined
      );
      return res.json(result);
    }

    // If no specific filter, return empty (use employee-specific endpoint)
    res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  })
);

/**
 * GET /api/reviews/pending/:cycleId
 * Get pending reviews for a cycle
 */
router.get(
  '/pending/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.getPendingReviewsByCycle(req.params.cycleId);
    res.json(result);
  })
);

/**
 * GET /api/reviews/:id
 * Get a review by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.getReviewById(req.params.id);
    res.json(result);
  })
);

/**
 * PATCH /api/reviews/:id/rating
 * Update a rating in a review
 */
router.patch(
  '/:id/rating',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.updateRating(req.params.id, req.body);
    res.json(result);
  })
);

/**
 * POST /api/reviews/:id/submit
 * Submit a review
 */
router.post(
  '/:id/submit',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.submitReview(req.params.id);
    res.json(result);
  })
);

/**
 * POST /api/reviews/:id/acknowledge
 * Acknowledge a review
 */
router.post(
  '/:id/acknowledge',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.acknowledgeReview(req.params.id);
    res.json(result);
  })
);

export default router;
