import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { transactionService } from '../services/transactionService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createTransactionSchema = z.object({
  payoutId: z.string().min(1),
  affiliateId: z.string().min(1),
  type: z.enum(['payout', 'refund', 'adjustment', 'bonus', 'fee']),
  amount: z.number(),
  description: z.string().min(1),
  gateway: z.object({
    name: z.string().min(1),
    transactionRef: z.string().optional(),
    responseCode: z.string().optional(),
    responseMessage: z.string().optional(),
  }),
});

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(input);

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const transaction = await transactionService.getTransaction(req.params.id);

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
});

/**
 * GET /api/transactions
 * Get transactions by affiliate
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', type, status, affiliateId } = req.query;

    if (!affiliateId) {
      res.status(400).json({ success: false, error: 'affiliateId required' });
      return;
    }

    const result = await transactionService.getTransactionsByAffiliate(affiliateId as string, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      type: type as any,
      status: status as any,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/transactions/:id/reverse
 * Reverse a transaction
 */
router.post('/:id/reverse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const transaction = await transactionService.reverseTransaction(req.params.id, reason);

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reverse transaction' });
  }
});

/**
 * GET /api/transactions/balance/:affiliateId
 * Get affiliate balance
 */
router.get('/balance/:affiliateId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const balance = await transactionService.getAffiliateBalance(req.params.affiliateId);

    res.json({ success: true, data: { balance } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

export default router;