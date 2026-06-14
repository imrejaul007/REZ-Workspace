import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { commissionService } from '../services/commissionService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createCommissionSchema = z.object({
  affiliateId: z.string().min(1),
  conversionIds: z.array(z.string()).min(1),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

/**
 * POST /api/commissions
 * Create a new commission
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createCommissionSchema.parse(req.body);
    const commission = await commissionService.createCommission(input);

    res.status(201).json({
      success: true,
      data: commission,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create commission',
    });
  }
});

/**
 * GET /api/commissions/:id
 * Get commission by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const commission = await commissionService.getCommission(req.params.id);

    if (!commission) {
      res.status(404).json({
        success: false,
        error: 'Commission not found',
      });
      return;
    }

    res.json({
      success: true,
      data: commission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission',
    });
  }
});

/**
 * GET /api/commissions
 * Get all commissions
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, affiliateId } = req.query;

    if (affiliateId) {
      const result = await commissionService.getCommissionsByAffiliate(affiliateId as string, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as any,
      });

      res.json({
        success: true,
        data: result.commissions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'affiliateId is required',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commissions',
    });
  }
});

/**
 * POST /api/commissions/auto-generate
 * Auto-generate commission for an affiliate
 */
router.post('/auto-generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { affiliateId, period } = req.body;
    const commission = await commissionService.autoGenerateCommission(affiliateId, period);

    if (!commission) {
      res.status(404).json({
        success: false,
        error: 'No approved conversions found for the period',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: commission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to auto-generate commission',
    });
  }
});

/**
 * GET /api/commissions/summary/:affiliateId
 * Get commission summary for an affiliate
 */
router.get('/summary/:affiliateId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const summary = await commissionService.getCommissionSummary(req.params.affiliateId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission summary',
    });
  }
});

export default router;