import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { payoutService } from '../services/payoutService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createPayoutSchema = z.object({
  affiliateId: z.string().min(1),
  commissionIds: z.array(z.string()).min(1),
  method: z.enum(['bank_transfer', 'paypal', 'upi', 'razorpay']),
  recipient: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    upiId: z.string().optional(),
  }),
  period: z.object({
    start: z.string().transform((s) => new Date(s)),
    end: z.string().transform((s) => new Date(s)),
  }),
});

/**
 * POST /api/payouts
 * Create a new payout
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createPayoutSchema.parse(req.body);
    const payout = await payoutService.createPayout(input);

    res.status(201).json({ success: true, data: payout });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create payout' });
  }
});

/**
 * GET /api/payouts/:id
 * Get payout by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payout = await payoutService.getPayout(req.params.id);

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found' });
      return;
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payout' });
  }
});

/**
 * POST /api/payouts/:id/process
 * Process a payout
 */
router.post('/:id/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payout = await payoutService.processPayout(req.params.id);

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found or not ready for processing' });
      return;
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process payout' });
  }
});

/**
 * GET /api/payouts/pending
 * Get pending payouts
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, affiliateId } = req.query;

    if (status === 'pending') {
      const payouts = await payoutService.getPendingPayouts(affiliateId as string);
      res.json({ success: true, data: payouts });
    } else if (affiliateId) {
      const result = await payoutService.getPayoutsByAffiliate(affiliateId as string, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as any,
      });

      res.json({
        success: true,
        data: result.payouts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'affiliateId or status=pending required' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payouts' });
  }
});

/**
 * POST /api/payouts/:id/retry
 * Retry a failed payout
 */
router.post('/:id/retry', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payout = await payoutService.retryPayout(req.params.id);

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found or cannot be retried' });
      return;
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retry payout' });
  }
});

/**
 * POST /api/payouts/:id/cancel
 * Cancel a payout
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payout = await payoutService.cancelPayout(req.params.id);

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found or cannot be cancelled' });
      return;
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel payout' });
  }
});

/**
 * GET /api/payouts/analytics
 * Get payout analytics
 */
router.get('/analytics/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.query;
    const analytics = await payoutService.getPayoutAnalytics(affiliateId as string);

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;