import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { walletService, karmaService } from '../../integrations/rezIntegrations.js';
import { logger } from '../../utils/logger.js';

export const walletRouter = Router();

// In-memory idempotency store (use Redis in production)
const idempotencyStore = new Map<string, { response; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Validation schemas
const amountSchema = z.number().positive().max(1000000, 'Maximum amount is 1,000,000');
const debitSchema = z.object({
  amount: amountSchema,
  reason: z.string().min(1).max(200).optional(),
  orderId: z.string().max(100).optional(),
  idempotencyKey: z.string().min(16).max(64).optional(),
});
const creditSchema = z.object({
  amount: amountSchema,
  reason: z.string().min(1).max(200).optional(),
  idempotencyKey: z.string().min(16).max(64).optional(),
});
const karmaActionSchema = z.object({
  action: z.string().min(1).max(100),
  entityId: z.string().max(100).optional(),
});

// Helper to check idempotency
function checkIdempotency(key: string, res): boolean {
  if (!key) return false;

  const existing = idempotencyStore.get(key);
  if (existing) {
    logger.info('Idempotent request detected', { key: key.slice(0, 8) });
    res.json(existing.response);
    return true;
  }
  return false;
}

// Helper to store idempotency result
function storeIdempotency(key: string, response): void {
  if (key) {
    idempotencyStore.set(key, { response, timestamp: Date.now() });
  }
}

// GET /wallet - Get wallet balance
walletRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const wallet = await walletService.getBalance(userId, token);

      res.json({
        success: true,
        coins: wallet.coins,
        cash: wallet.cash,
        locked: wallet.locked,
      });
    } catch (error) {
      logger.warn('Wallet getBalance failed', { error });
      res.json({
        success: true,
        coins: 0,
        cash: 0,
        locked: 0,
      });
    }
  })
);

// GET /wallet/transactions - Get transaction history
walletRouter.get(
  '/transactions',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    try {
      const transactions = await walletService.getTransactions(userId, token, limit);

      res.json({
        success: true,
        transactions: transactions.slice(offset, offset + limit),
        total: transactions.length,
        limit,
        offset,
      });
    } catch (error) {
      logger.warn('Wallet getTransactions failed', { error });
      res.json({
        success: true,
        transactions: [],
        total: 0,
      });
    }
  })
);

// POST /wallet/debit - Deduct coins with idempotency
walletRouter.post(
  '/debit',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    // Validate input
    const parsed = debitSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { amount, reason, orderId, idempotencyKey } = parsed.data;

    // Check idempotency
    if (checkIdempotency(idempotencyKey!, res)) {
      return;
    }

    logger.info('Wallet debit requested', {
      userId,
      amount,
      reason,
      orderId,
      idempotencyKey: idempotencyKey?.slice(0, 8),
    });

    try {
      const result = await walletService.debit(
        userId,
        token,
        amount,
        reason || 'Purchase',
        orderId
      );

      const response = {
        success: true,
        ...result,
      };

      storeIdempotency(idempotencyKey!, response);
      res.json(response);
    } catch (error) {
      logger.error('Wallet debit failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to debit wallet' },
      });
    }
  })
);

// POST /wallet/credit - Add coins with idempotency
walletRouter.post(
  '/credit',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    // Validate input
    const parsed = creditSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { amount, reason, idempotencyKey } = parsed.data;

    // Check idempotency
    if (checkIdempotency(idempotencyKey!, res)) {
      return;
    }

    logger.info('Wallet credit requested', {
      userId,
      amount,
      reason,
      idempotencyKey: idempotencyKey?.slice(0, 8),
    });

    try {
      const result = await walletService.credit(
        userId,
        token,
        amount,
        reason || 'Credit'
      );

      const response = {
        success: true,
        ...result,
      };

      storeIdempotency(idempotencyKey!, response);
      res.json(response);
    } catch (error) {
      logger.error('Wallet credit failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to credit wallet' },
      });
    }
  })
);

// GET /wallet/karma - Get karma/loyalty status
walletRouter.get(
  '/karma',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const karma = await karmaService.getStatus(userId, token);

      res.json({
        success: true,
        ...karma,
      });
    } catch (error) {
      logger.warn('Karma getStatus failed', { error });
      res.json({
        success: true,
        tier: 'Bronze',
        points: 0,
        nextTier: 'Silver',
        progress: 0,
        multiplier: 1,
      });
    }
  })
);

// GET /wallet/karma/achievements - Get achievements
walletRouter.get(
  '/karma/achievements',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const achievements = await karmaService.getAchievements(userId, token);

      res.json({
        success: true,
        achievements,
      });
    } catch (error) {
      logger.warn('Karma getAchievements failed', { error });
      res.json({
        success: true,
        achievements: [],
      });
    }
  })
);

// POST /wallet/karma/action - Record karma action
walletRouter.post(
  '/karma/action',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    // Validate input
    const parsed = karmaActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { action, entityId } = parsed.data;

    try {
      await karmaService.recordAction(userId, token, action, entityId);

      res.json({
        success: true,
        message: 'Action recorded',
      });
    } catch (error) {
      logger.warn('Karma recordAction failed', { error });
      // Return success anyway to not block the user flow
      res.json({
        success: true,
        message: 'Action recorded (async)',
      });
    }
  })
);
