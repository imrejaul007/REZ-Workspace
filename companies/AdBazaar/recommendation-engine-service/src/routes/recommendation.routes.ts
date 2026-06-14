import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { recommendationService } from '../services/recommendation.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const generateRecommendationSchema = z.object({
  type: z.enum(['product', 'content', 'ad', 'personalized', 'trending']),
  limit: z.number().int().min(1).max(50).optional(),
  context: z.object({
    page: z.string().optional(),
    category: z.string().optional(),
    searchQuery: z.string().optional(),
    device: z.string().optional()
  }).optional(),
  excludeItems: z.array(z.string()).optional()
});

const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  itemId: z.string().min(1),
  type: z.enum(['click', 'view', 'add_to_cart', 'purchase', 'dismiss', 'rating']),
  rating: z.number().int().min(1).max(5).optional()
});

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

// GET /api/recommendations/:userId - Get recommendations
router.get('/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const type = req.query.type as 'product' | 'content' | 'ad' | 'personalized' | 'trending' || 'personalized';
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendation = await recommendationService.generate({
      userId,
      type,
      limit,
      context: req.query.context as Record<string, string>
    });

    res.json({ success: true, data: recommendation });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

// POST /api/recommendations/:userId - Generate recommendations
router.post('/:userId', authMiddleware, validateBody(generateRecommendationSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const input = req.body;

    const recommendation = await recommendationService.generate({
      userId,
      type: input.type,
      limit: input.limit,
      context: input.context,
      excludeItems: input.excludeItems
    });

    res.status(201).json({ success: true, data: recommendation });
  } catch (error) {
    logger.error('Generate recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

// POST /api/recommendations/:userId/feedback - Record feedback
router.post('/:userId/feedback', validateBody(feedbackSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { recommendationId, itemId, type, rating } = req.body;

    const feedback = await recommendationService.recordFeedback(
      recommendationId,
      userId,
      itemId,
      type,
      rating
    );

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    logger.error('Record feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to record feedback' });
  }
});

// GET /api/recommendations/:userId/history - Get user history
router.get('/:userId/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await recommendationService.getHistory(userId, limit);

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// GET /api/recommendations/id/:id - Get recommendation by ID
router.get('/id/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const recommendation = await recommendationService.getRecommendationById(req.params.id);

    if (!recommendation) {
      res.status(404).json({ success: false, error: 'Recommendation not found' });
      return;
    }

    res.json({ success: true, data: recommendation });
  } catch (error) {
    logger.error('Get recommendation error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recommendation' });
  }
});

export default router;