/**
 * Review Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ReviewStatus, Sentiment, TravelType } from '../types';
import { reviewService } from '../services/review.service';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  hotelId: z.string().min(1),
  guestId: z.string().min(1),
  guestName: z.string().min(1),
  overallRating: z.number().min(1).max(5),
  categories: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
    comfort: z.number().min(1).max(5).optional(),
    staff: z.number().min(1).max(5).optional(),
    food: z.number().min(1).max(5).optional(),
  }).optional(),
  title: z.string().optional(),
  content: z.string().min(10),
  images: z.array(z.string()).optional(),
  stayDate: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  travelType: z.enum(['business', 'leisure', 'couple', 'family', 'solo']).optional(),
});

const respondToReviewSchema = z.object({
  response: z.string().min(1),
  managerName: z.string().optional(),
});

const moderateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  isPublic: z.boolean().optional(),
});

// POST /api/reviews - Submit review
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(validated);

    res.status(201).json({
      success: true,
      data: { review },
      message: 'Thank you for your review!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create review' },
    });
  }
});

// GET /api/reviews/:hotelId - Get reviews for hotel
router.get('/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { status, minRating, maxRating, page = '1', limit = '20' } = req.query;

    const reviews = await reviewService.getReviewsByHotel(
      hotelId,
      {
        status: status as ReviewStatus | undefined,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        maxRating: maxRating ? parseInt(maxRating as string) : undefined,
      },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get reviews' },
    });
  }
});

// GET /api/reviews/single/:reviewId - Get single review
router.get('/single/:reviewId', async (req: Request, res: Response) => {
  try {
    const review = await reviewService.getReviewById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get review' },
    });
  }
});

// GET /api/reviews/hotel/:hotelId/rating - Get overall rating
router.get('/hotel/:hotelId/rating', async (req: Request, res: Response) => {
  try {
    const rating = await reviewService.getHotelRating(req.params.hotelId);

    res.json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get rating' },
    });
  }
});

// POST /api/reviews/:reviewId/respond - Respond to review
router.post('/:reviewId/respond', async (req: Request, res: Response) => {
  try {
    const validated = respondToReviewSchema.parse(req.body);
    const review = await reviewService.respondToReview(
      req.params.reviewId,
      validated.response,
      validated.managerName
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Respond error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to respond' },
    });
  }
});

// PUT /api/reviews/:reviewId/moderate - Moderate review
router.put('/:reviewId/moderate', async (req: Request, res: Response) => {
  try {
    const validated = moderateReviewSchema.parse(req.body);
    const review = await reviewService.moderateReview(
      req.params.reviewId,
      validated.status,
      validated.isPublic
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Moderate error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to moderate' },
    });
  }
});

// POST /api/reviews/:reviewId/helpful - Mark review as helpful
router.post('/:reviewId/helpful', async (req: Request, res: Response) => {
  try {
    const review = await reviewService.markHelpful(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    res.json({
      success: true,
      data: { helpful: review.helpful },
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to mark helpful' },
    });
  }
});

// POST /api/reviews/:reviewId/report - Report review
router.post('/:reviewId/report', async (req: Request, res: Response) => {
  try {
    const review = await reviewService.reportReview(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    res.json({
      success: true,
      data: { reportCount: review.reportCount },
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to report' },
    });
  }
});

// GET /api/reviews/analytics/:hotelId - Get analytics
router.get('/analytics/:hotelId', async (req: Request, res: Response) => {
  try {
    const analytics = await reviewService.getReviewAnalytics(req.params.hotelId);

    res.json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get analytics' },
    });
  }
});

export default router;
