import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { claimService } from '../services/claimService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createClaimSchema = z.object({
  fundId: z.string().min(1),
  advertiserId: z.string().min(1),
  partnerId: z.string().min(1),
  campaign: z.object({
    campaignId: z.string().min(1),
    name: z.string().min(1),
    spend: z.number().min(0),
    startDate: z.string().transform((s) => new Date(s)),
    endDate: z.string().transform((s) => new Date(s)),
  }),
  claimDetails: z.object({
    invoices: z.array(z.object({
      invoiceId: z.string().min(1),
      amount: z.number().min(0),
      date: z.string().transform((s) => new Date(s)),
    })),
    totalSpend: z.number().min(0),
    documentation: z.array(z.string()).optional(),
  }),
});

/**
 * POST /api/claims
 * Create a new claim
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createClaimSchema.parse(req.body);
    const claim = await claimService.createClaim(input);

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create claim' });
  }
});

/**
 * GET /api/claims/:id
 * Get claim by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const claim = await claimService.getClaim(req.params.id);

    if (!claim) {
      res.status(404).json({ success: false, error: 'Claim not found' });
      return;
    }

    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch claim' });
  }
});

/**
 * GET /api/claims/fund/:fundId
 * Get claims by fund
 */
router.get('/fund/:fundId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const result = await claimService.getClaimsByFund(req.params.fundId, {
      status: status as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
});

/**
 * GET /api/claims/partner/:partnerId
 * Get claims by partner
 */
router.get('/partner/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const result = await claimService.getClaimsByPartner(req.params.partnerId, {
      status: status as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
});

/**
 * POST /api/claims/:id/approve
 * Approve claim
 */
router.post('/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reviewedBy, notes } = req.body;
    const claim = await claimService.approveClaim(req.params.id, reviewedBy, notes);

    if (!claim) {
      res.status(404).json({ success: false, error: 'Claim not found or not under review' });
      return;
    }

    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve claim' });
  }
});

/**
 * POST /api/claims/:id/reject
 * Reject claim
 */
router.post('/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reviewedBy, rejectionReason } = req.body;
    const claim = await claimService.rejectClaim(req.params.id, reviewedBy, rejectionReason);

    if (!claim) {
      res.status(404).json({ success: false, error: 'Claim not found or not under review' });
      return;
    }

    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject claim' });
  }
});

/**
 * GET /api/claims/summary
 * Get claim summary
 */
router.get('/summary/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fundId } = req.query;
    const summary = await claimService.getClaimSummary(fundId as string);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

export default router;