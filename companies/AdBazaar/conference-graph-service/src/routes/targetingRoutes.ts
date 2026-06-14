import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { targetingService } from '../services';
import { internalServiceAuth, AuthenticatedRequest } from '../middleware';

const router = Router();

// Validation schema for targeting query
const targetingQuerySchema = z.object({
  industry: z.string().optional(),
  topics: z.string().optional(),
  audience: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minFollowers: z.coerce.number().optional(),
  minRating: z.coerce.number().optional()
});

// Apply auth
router.use(internalServiceAuth);

/**
 * GET /api/targeting - Get ad targeting data
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = targetingQuerySchema.parse(req.query);

    const criteria = {
      industry: query.industry,
      topics: query.topics ? query.topics.split(',') : undefined,
      audience: query.audience ? query.audience.split(',') : undefined,
      location: query.location,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined,
      speakerInfluence: query.minFollowers ? {
        minFollowers: query.minFollowers,
        minRating: query.minRating
      } : undefined
    };

    const targetingData = await targetingService.getTargetingData(criteria);

    res.json({
      success: true,
      data: targetingData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/targeting/reach - Get estimated reach for targeting criteria
 */
router.get('/reach', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = targetingQuerySchema.parse(req.query);

    const criteria = {
      industry: query.industry,
      topics: query.topics ? query.topics.split(',') : undefined,
      audience: query.audience ? query.audience.split(',') : undefined,
      location: query.location,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined,
      speakerInfluence: query.minFollowers ? {
        minFollowers: query.minFollowers,
        minRating: query.minRating
      } : undefined
    };

    const reach = await targetingService.getEstimatedReach(criteria);

    res.json({
      success: true,
      data: reach
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/targeting/cross-analytics - Get cross-conference analytics
 */
router.get('/cross-analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const industry = req.query.industry as string | undefined;
    const analytics = await targetingService.getEstimatedReach({
      industry
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

export default router;