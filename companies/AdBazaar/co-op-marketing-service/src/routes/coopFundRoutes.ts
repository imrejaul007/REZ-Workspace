import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { coopFundService } from '../services/coopFundService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createCoopFundSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['standard', 'accelerated', 'tiered']),
  totalBudget: z.number().min(0),
  rules: z.object({
    minSpend: z.number().min(0),
    maxContribution: z.number().min(0),
    contributionPercent: z.number().min(0).max(100),
    eligibleCategories: z.array(z.string()).optional(),
    excludedProducts: z.array(z.string()).optional(),
    startDate: z.string().transform((s) => new Date(s)),
    endDate: z.string().transform((s) => new Date(s)),
  }),
  partnerEligibility: z.object({
    tiers: z.array(z.string()).optional(),
    minimumPerformance: z.number().optional(),
    approvedPartners: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * POST /api/coop-funds
 * Create a new co-op fund
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createCoopFundSchema.parse(req.body);
    const fund = await coopFundService.createCoopFund(input);

    res.status(201).json({ success: true, data: fund });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create co-op fund' });
  }
});

/**
 * GET /api/coop-funds
 * Get co-op funds by advertiser
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { advertiserId, status } = req.query;

    if (!advertiserId) {
      res.status(400).json({ success: false, error: 'advertiserId required' });
      return;
    }

    const funds = await coopFundService.getCoopFundsByAdvertiser(advertiserId as string, {
      status: status as any,
    });

    res.json({ success: true, data: funds });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch co-op funds' });
  }
});

/**
 * GET /api/coop-funds/:id
 * Get co-op fund by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const fund = await coopFundService.getCoopFund(req.params.id);

    if (!fund) {
      res.status(404).json({ success: false, error: 'Co-op fund not found' });
      return;
    }

    res.json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch co-op fund' });
  }
});

/**
 * POST /api/coop-funds/:id/claim
 * Create a claim against a fund
 */
router.post('/:id/claim', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { claimService } = await import('../services/claimService');
    const claim = await claimService.createClaim({
      fundId: req.params.id,
      ...req.body,
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create claim' });
  }
});

/**
 * GET /api/coop-funds/:id/analytics
 * Get fund analytics
 */
router.get('/:id/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const analytics = await coopFundService.getFundAnalytics(req.params.id);

    if (!analytics) {
      res.status(404).json({ success: false, error: 'Co-op fund not found' });
      return;
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/coop-funds/:id/eligibility
 * Check partner eligibility
 */
router.get('/:id/eligibility', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerId, partnerTier, partnerPerformance } = req.query;
    const eligibility = await coopFundService.checkEligibility(
      req.params.id,
      partnerId as string,
      partnerTier as string,
      parseFloat(partnerPerformance as string) || 0
    );

    res.json({ success: true, data: eligibility });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check eligibility' });
  }
});

export default router;