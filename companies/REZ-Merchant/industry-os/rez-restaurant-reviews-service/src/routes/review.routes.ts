/**
 * Restaurant Reviews Service - API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createReview,
  getReview,
  getReviewsByRestaurant,
  approveReview,
  rejectReview,
  flagReview,
  addResponse,
  markHelpful,
  updateReview,
  deleteReview,
  getTopReviews,
  getRecentReviews,
  getCriticalReviews,
  getPendingModeration,
  getReviewStats,
  getReviewAnalytics,
  getReviewReport,
  REVIEW_SETTINGS,
} from '../services/review.service.js';
import { ReviewStatus, ReviewSentiment } from '../models/review.model.js';

const router = Router();

// Validation schemas
const CreateReviewSchema = z.object({
  restaurantId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  rating: z.number().int().min(REVIEW_SETTINGS.minRating).max(REVIEW_SETTINGS.maxRating),
  title: z.string().max(REVIEW_SETTINGS.maxTitleLength).optional(),
  comment: z.string().max(REVIEW_SETTINGS.maxCommentLength).min(1),
  foodRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
  ambienceRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  photos: z.array(z.string().url()).max(REVIEW_SETTINGS.maxPhotosPerReview).optional(),
  pros: z.array(z.string()).max(10).optional(),
  cons: z.array(z.string()).max(10).optional(),
  visitDate: z.string().or(z.date()),
  orderDetails: z.object({
    items: z.array(z.string()),
    totalAmount: z.number().min(0),
  }).optional(),
  isVerifiedVisit: z.boolean().default(false),
});

const UpdateReviewSchema = z.object({
  title: z.string().max(REVIEW_SETTINGS.maxTitleLength).optional(),
  comment: z.string().max(REVIEW_SETTINGS.maxCommentLength).min(1).optional(),
  photos: z.array(z.string().url()).max(REVIEW_SETTINGS.maxPhotosPerReview).optional(),
  pros: z.array(z.string()).max(10).optional(),
  cons: z.array(z.string()).max(10).optional(),
});

const AddResponseSchema = z.object({
  text: z.string().min(1).max(1000),
  respondedBy: z.string().min(1),
  managerName: z.string().min(1),
});

const FlagReviewSchema = z.object({
  reason: z.string().min(1),
});

const RejectReviewSchema = z.object({
  reason: z.string().optional(),
});

// ============ Info Routes ============

/**
 * GET /api/info - Get service info
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ratingRange: {
        min: REVIEW_SETTINGS.minRating,
        max: REVIEW_SETTINGS.maxRating,
      },
      maxCommentLength: REVIEW_SETTINGS.maxCommentLength,
      maxPhotosPerReview: REVIEW_SETTINGS.maxPhotosPerReview,
      autoApproveThreshold: REVIEW_SETTINGS.autoApproveThreshold,
    },
  });
});

// ============ Review CRUD Routes ============

/**
 * POST /api/reviews - Create a new review
 */
router.post('/reviews', (req: Request, res: Response) => {
  try {
    const data = CreateReviewSchema.parse(req.body);

    const review = createReview({
      ...data,
      visitDate: new Date(data.visitDate),
    });

    res.status(201).json({
      success: true,
      data: { review },
      message: review.status === 'approved'
        ? 'Thank you for your review!'
        : 'Your review has been submitted for moderation.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create review' },
    });
  }
});

/**
 * GET /api/reviews/:restaurantId - Get reviews for restaurant
 */
router.get('/reviews/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { status, minRating, maxRating, verified, sentiment, limit } = req.query;

  const filters: Parameters<typeof getReviewsByRestaurant>[1] = {};

  if (status && ['pending', 'approved', 'rejected', 'flagged'].includes(status as string)) {
    filters.status = status as ReviewStatus;
  }
  if (minRating) {
    filters.minRating = parseInt(minRating as string, 10);
  }
  if (maxRating) {
    filters.maxRating = parseInt(maxRating as string, 10);
  }
  if (verified === 'true') {
    filters.isVerifiedVisit = true;
  }
  if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment as string)) {
    filters.sentiment = sentiment as ReviewSentiment;
  }

  let reviews = getReviewsByRestaurant(restaurantId, filters);

  if (limit) {
    reviews = reviews.slice(0, parseInt(limit as string, 10));
  }

  res.json({
    success: true,
    data: { reviews, count: reviews.length },
  });
});

/**
 * GET /api/reviews/:restaurantId/:reviewId - Get specific review
 */
router.get('/reviews/:restaurantId/:reviewId', (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const review = getReview(reviewId);

  if (!review) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { review },
  });
});

/**
 * PUT /api/reviews/:reviewId - Update review
 */
router.put('/reviews/:reviewId', (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const updates = UpdateReviewSchema.parse(req.body);

    const review = updateReview(reviewId, updates);
    if (!review) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update review' },
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId - Delete review
 */
router.delete('/reviews/:reviewId', (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const deleted = deleteReview(reviewId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found' },
    });
    return;
  }

  res.json({
    success: true,
    message: 'Review deleted',
  });
});

// ============ Review Actions Routes ============

/**
 * POST /api/reviews/:reviewId/approve - Approve review
 */
router.post('/reviews/:reviewId/approve', (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const review = approveReview(reviewId);

  if (!review) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found or already rejected' },
    });
    return;
  }

  res.json({
    success: true,
    data: { review },
  });
});

/**
 * POST /api/reviews/:reviewId/reject - Reject review
 */
router.post('/reviews/:reviewId/reject', (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const data = RejectReviewSchema.parse(req.body);

    const review = rejectReview(reviewId, data.reason);
    if (!review) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to reject review' },
    });
  }
});

/**
 * POST /api/reviews/:reviewId/flag - Flag review
 */
router.post('/reviews/:reviewId/flag', (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const data = FlagReviewSchema.parse(req.body);

    const review = flagReview(reviewId, data.reason);
    if (!review) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to flag review' },
    });
  }
});

/**
 * POST /api/reviews/:reviewId/respond - Add response to review
 */
router.post('/reviews/:reviewId/respond', (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const data = AddResponseSchema.parse(req.body);

    const review = addResponse(reviewId, data.text, data.respondedBy, data.managerName);
    if (!review) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { review },
      message: 'Response added successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to add response' },
    });
  }
});

/**
 * POST /api/reviews/:reviewId/helpful - Mark review as helpful
 */
router.post('/reviews/:reviewId/helpful', (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const review = markHelpful(reviewId);

  if (!review) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { helpful: review.isHelpful },
  });
});

// ============ Query Routes ============

/**
 * GET /api/reviews/:restaurantId/top - Get top reviews by helpfulness
 */
router.get('/reviews/:restaurantId/top', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { limit } = req.query;
  const reviews = getTopReviews(restaurantId, limit ? parseInt(limit as string, 10) : 5);

  res.json({
    success: true,
    data: { reviews, count: reviews.length },
  });
});

/**
 * GET /api/reviews/:restaurantId/recent - Get recent reviews
 */
router.get('/reviews/:restaurantId/recent', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { limit } = req.query;
  const reviews = getRecentReviews(restaurantId, limit ? parseInt(limit as string, 10) : 10);

  res.json({
    success: true,
    data: { reviews, count: reviews.length },
  });
});

/**
 * GET /api/reviews/:restaurantId/critical - Get critical reviews (rating <= 2)
 */
router.get('/reviews/:restaurantId/critical', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const reviews = getCriticalReviews(restaurantId);

  res.json({
    success: true,
    data: { reviews, count: reviews.length },
  });
});

/**
 * GET /api/reviews/:restaurantId/pending - Get pending moderation reviews
 */
router.get('/reviews/:restaurantId/pending', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const reviews = getPendingModeration(restaurantId);

  res.json({
    success: true,
    data: { reviews, count: reviews.length },
  });
});

// ============ Statistics & Analytics Routes ============

/**
 * GET /api/stats/:restaurantId - Get review statistics
 */
router.get('/stats/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const stats = getReviewStats(restaurantId);

  res.json({
    success: true,
    data: { stats },
  });
});

/**
 * GET /api/analytics/:restaurantId - Get detailed analytics
 */
router.get('/analytics/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { period } = req.query;
  const days = period ? parseInt(period as string, 10) : 30;

  const analytics = getReviewAnalytics(restaurantId, days);

  res.json({
    success: true,
    data: { analytics },
  });
});

/**
 * GET /api/reports/:restaurantId - Get review report
 */
router.get('/reports/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { period } = req.query;
  const days = period ? parseInt(period as string, 10) : 30;

  const report = getReviewReport(restaurantId, days);

  res.json({
    success: true,
    data: { report },
  });
});

export default router;
