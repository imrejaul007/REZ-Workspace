import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service';
import { TransactionStatus, PaymentMethod, CreateTransactionSchema } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const refundSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
  reason: z.string().min(1),
});

const voidSchema = z.object({
  reason: z.string().min(1),
});

const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  storeId: z.string().uuid().optional(),
  cashierId: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

/**
 * POST /api/transactions
 * Create new transaction
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = CreateTransactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(validated);

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error creating transaction:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/transactions
 * List transactions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId, cashierId, status } = dateRangeSchema.parse(req.query);

    const transactions = await transactionService.getTransactionsByDateRange(
      new Date(startDate),
      new Date(endDate),
      { storeId, cashierId, status }
    );

    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Error listing transactions:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/transactions/summary
 * Get daily summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { date, storeId } = z.object({
      date: z.string().datetime().optional(),
      storeId: z.string().uuid().optional(),
    }).parse(req.query);

    const summary = await transactionService.getDailySummary(
      date ? new Date(date) : new Date(),
      storeId
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/transactions/number/:number
 * Get transaction by number
 */
router.get('/number/:number', async (req: Request, res: Response) => {
  try {
    const transaction = await transactionService.getTransactionByNumber(req.params.number);

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/transactions/:id/receipt
 * Generate receipt
 */
router.get('/:id/receipt', async (req: Request, res: Response) => {
  try {
    const result = await transactionService.generateReceipt(req.params.id);

    if (!result) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: result.receipt });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/transactions/:id/refund
 * Process refund
 */
router.post('/:id/refund', async (req: Request, res: Response) => {
  try {
    const validated = refundSchema.parse(req.body);
    const userId = req.headers['x-user-id'] as string || 'system';

    const transaction = await transactionService.processRefund(
      req.params.id,
      validated.items,
      validated.reason,
      userId
    );

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error processing refund:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/transactions/:id/void
 * Void transaction
 */
router.post('/:id/void', async (req: Request, res: Response) => {
  try {
    const { reason } = voidSchema.parse(req.body);
    const userId = req.headers['x-user-id'] as string || 'system';

    const transaction = await transactionService.voidTransaction(req.params.id, reason, userId);

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error voiding transaction:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;
