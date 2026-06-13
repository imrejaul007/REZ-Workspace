import { Router, Response } from 'express';
import { buyerService } from '../services/index.js';
import { internalAuth, AuthRequest } from '../middleware/index.js';
import { MatchingCriteriaSchema } from '../middleware/validation.js';

const router = Router();

// Apply internal auth to all routes
router.use(internalAuth);

// ============================================================================
// MATCHING ROUTES
// ============================================================================

/**
 * Find matching buyers for property criteria
 * POST /api/v1/match/buyers
 */
router.post('/buyers', async (req: AuthRequest, res: Response) => {
  try {
    const criteria = MatchingCriteriaSchema.parse(req.body);
    const result = await buyerService.findMatchingBuyers(criteria);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data?.buyers,
      total: result.data?.total
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    console.error('[Matching Routes] Error finding matching buyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find matching buyers'
    });
  }
});

/**
 * Get matching buyers for areas
 * GET /api/v1/match/buyers/areas/:areaIds
 */
router.get('/buyers/areas/:areaIds', async (req: AuthRequest, res: Response) => {
  try {
    const areaIdsParam = req.params['areaIds'];
    if (!areaIdsParam) {
      return res.status(400).json({
        success: false,
        error: 'areaIds parameter required'
      });
    }
    const areaIds = areaIdsParam.split(',');
    const { minPrice, maxPrice, propertyTypes, limit } = req.query;

    const result = await buyerService.findMatchingBuyers({
      areas: areaIds,
      minPrice: minPrice ? parseInt(minPrice as string, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string, 10) : undefined,
      propertyTypes: propertyTypes ? (propertyTypes as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string, 10) : 20
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data?.buyers,
      total: result.data?.total
    });
  } catch (error: unknown) {
    console.error('[Matching Routes] Error finding matching buyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find matching buyers'
    });
  }
});

export default router;
