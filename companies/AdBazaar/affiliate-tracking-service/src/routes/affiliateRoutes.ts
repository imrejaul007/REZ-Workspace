import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { affiliateService } from '../services/affiliateService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createAffiliateSchema = z.object({
  userId: z.string().min(1),
  businessName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  niche: z.string().min(1),
  commissionStructure: z.object({
    cpa: z.number().min(0).optional(),
    revShare: z.number().min(0).max(100).optional(),
    cookieDuration: z.number().min(0).optional(),
  }).optional(),
  payoutSettings: z.object({
    minPayoutThreshold: z.number().min(0).optional(),
    payoutFrequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    autoPayout: z.boolean().optional(),
    paymentMethod: z.enum(['bank_transfer', 'paypal', 'upi']).optional(),
  }).optional(),
});

const updateAffiliateSchema = createAffiliateSchema.partial();

/**
 * POST /api/affiliates
 * Create a new affiliate
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createAffiliateSchema.parse(req.body);
    const affiliate = await affiliateService.createAffiliate(input);

    res.status(201).json({
      success: true,
      data: affiliate,
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
      error: 'Failed to create affiliate',
    });
  }
});

/**
 * GET /api/affiliates
 * Get all affiliates
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, niche } = req.query;

    const result = await affiliateService.getAllAffiliates({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as any,
      niche: niche as string,
    });

    res.json({
      success: true,
      data: result.affiliates,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliates',
    });
  }
});

/**
 * GET /api/affiliates/:id
 * Get affiliate by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const affiliate = await affiliateService.getAffiliate(req.params.id);

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: affiliate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate',
    });
  }
});

/**
 * PUT /api/affiliates/:id
 * Update affiliate
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = updateAffiliateSchema.parse(req.body);
    const affiliate = await affiliateService.updateAffiliate(req.params.id, input);

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: affiliate,
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
      error: 'Failed to update affiliate',
    });
  }
});

/**
 * PATCH /api/affiliates/:id/status
 * Update affiliate status
 */
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const affiliate = await affiliateService.updateAffiliateStatus(req.params.id, status);

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: affiliate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update affiliate status',
    });
  }
});

/**
 * GET /api/affiliates/:id/commissions
 * Get affiliate's commissions
 */
router.get('/:id/commissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const { commissionService } = await import('../services/commissionService');

    const result = await commissionService.getCommissionsByAffiliate(req.params.id, {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commissions',
    });
  }
});

/**
 * GET /api/affiliates/:id/analytics
 * Get affiliate analytics
 */
router.get('/:id/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const analytics = await affiliateService.getAffiliateAnalytics(req.params.id);

    if (!analytics) {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

export default router;