import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requireAdminAuth } from '../middleware/auth';
import * as walletService from '../services/walletService';
import { COIN_TO_RUPEE_RATE, coinsToRupees, getDynamicConversionRate } from '../services/walletService';
import { redis } from '../config/redis';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';
import { sendWalletTopupToRezMind, sendWalletWithdrawToRezMind } from '../services/rezMindService';
import { success, err, ErrorCodes } from '../utils/response';

// Zod validation schemas
const coinDebitSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Maximum 1,000,000'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200, 'Idempotency key too long').optional(),
});

const creditSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Maximum 1,000,000'),
  coinType: z.enum(['rez', 'prive', 'branded', 'promo', 'cashback', 'referral']),
  source: z.string().min(1, 'Source required'),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
});

function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.errors[0].message });
    }
    req.body = result.data;
    next();
  };
}

/** Sliding-window rate limiter using Redis sorted sets. Returns false if limit exceeded. */
async function checkWalletRateLimit(userId: string, key: string, maxOps: number, windowMs: number): Promise<boolean> {
  try {
    const now = Date.now();
    const redisKey = `rl:wallet:${key}:${userId}`;
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(redisKey, '-inf', now - windowMs);
    pipe.zcard(redisKey);
    pipe.zadd(redisKey, now, `${now}-${randomUUID()}`);
    pipe.pexpire(redisKey, windowMs);
    const results = await pipe.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;
    return count < maxOps;
  } catch (err) {
    // fail-closed if Redis is unavailable (rate limit denied)
    logger.error('[walletRateLimit] Redis unavailable', { key, userId, error: err });
    return false;
  }
}

const router = Router();

/**
 * @route GET /api/wallet/balance
 * @summary Get wallet balance
 * @tags Wallet
 * @security BearerAuth
 * @description Returns the user's wallet balance across all coin types.
 * @response {object} 200 - Balance response
 */
const getBalanceHandler = async (req: Request, res: Response) => {
  try {
    const result = await walletService.getBalance(req.userId!);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/api/wallet/balance', requireAuth, getBalanceHandler);

// ── GET transactions ──
/**
 * @route GET /api/wallet/transactions
 * @summary Get wallet transactions
 * @tags Wallet
 * @security BearerAuth
 * @description Returns paginated wallet transaction history.
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page (max 100)
 * @param {string} [coinType] - Filter by coin type
 * @response {object} 200 - Transactions response
 */
const getTransactionsHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const coinType = req.query.coinType as string | undefined;
    const result = await walletService.getTransactions(req.userId!, page, limit, coinType);
    res.json(success({ transactions: result.transactions, pagination: { total: result.total, page: result.page, hasMore: result.hasMore } }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/api/wallet/transactions', requireAuth, getTransactionsHandler);

// ── GET summary ──
/**
 * @route GET /api/wallet/summary
 * @summary Get transaction summary
 * @tags Wallet
 * @security BearerAuth
 * @description Returns summary of all wallet transactions.
 * @response {object} 200 - Summary response
 */
const getSummaryHandler = async (req: Request, res: Response) => {
  try {
    const result = await walletService.getTransactionSummary(req.userId!);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/api/wallet/summary', requireAuth, getSummaryHandler);

// ── POST credit (internal / admin only) ──
/**
 * @route POST /api/wallet/credit
 * @summary Credit wallet (admin only)
 * @tags Wallet
 * @security BearerAuth
 * @description |
 *   Credits coins to a user's wallet. Admin/operator role required.
 *   Rate limited: 20 credits per minute per admin.
 * @response {object} 200 - Credit successful
 * @response {object} 403 - Admin role required
 */
const creditHandler = async (req: Request, res: Response) => {
  // Explicit null check: requireAuth middleware should set userId, but validate it
  if (!req.userId) {
    res.status(401).json(err('SRV_INTERNAL_ERROR', 'Authentication required'));
    return;
  }
  // Rate limit sensitive wallet credit operations: 20 credits per minute per admin
  const allowed = await checkWalletRateLimit(req.userId, 'credit', 20, 60 * 1000);
  if (!allowed) {
    res.status(429).json(err('BIZ_LIMIT_EXCEEDED'));
    return;
  }
  // Only admin roles may directly credit wallets via this endpoint
  if (req.userRole !== 'admin' && req.userRole !== 'super_admin' && req.userRole !== 'operator') {
    res.status(403).json(err('SRV_INTERNAL_ERROR', 'Admin role required for direct wallet credit'));
    return;
  }
  try {
    const { amount, coinType, source, description, sourceId, merchantId, idempotencyKey, targetUserId } = req.body;
    if (!amount || !coinType || !source || !description) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'amount, coinType, source, description required'));
      return;
    }
    // MED-02 FIX: Validate targetUserId ObjectId format if provided
    if (targetUserId && !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid user ID'));
    }
    // Admin credit: apply to targetUserId if provided, otherwise the caller's own wallet
    const recipientId = targetUserId || req.userId!;
    const result = await walletService.creditCoins(
      recipientId, amount, coinType, source, description,
      { sourceId, merchantId, idempotencyKey },
    );

    // Send to REZ Mind - treat as topup for analytics
    sendWalletTopupToRezMind({
      user_id: recipientId,
      amount,
      payment_method: source,
      transaction_id: idempotencyKey || `credit_${Date.now()}`,
      balance_after: typeof result.balance === 'number' ? result.balance : (result.balance as unknown)?.available,
    }).catch(() => {});

    res.json(success(result));
  } catch (err) {
    res.status(400).json(err('SRV_INTERNAL_ERROR', err.message));
  }
};
router.post('/api/wallet/credit', requireAdminAuth, creditHandler);

// ── POST debit ──
/**
 * @route POST /debit
 * @summary Debit wallet
 * @tags Wallet
 * @security BearerAuth
 * @description Debits coins from the authenticated user's wallet.
 * @response {object} 200 - Debit successful
 * @response {object} 400 - Insufficient balance
 */
const debitHandler = async (req: Request, res: Response) => {
  // 10 debit ops per minute per user
  const allowed = await checkWalletRateLimit(req.userId!, 'debit', 10, 60 * 1000);
  if (!allowed) {
    res.status(429).json(err('BIZ_LIMIT_EXCEEDED'));
    return;
  }
  try {
    const { amount, coinType, source, description, sourceId, idempotencyKey } = req.body;
    if (!amount || !coinType || !source || !description) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'amount, coinType, source, description required'));
      return;
    }
    const result = await walletService.debitCoins(
      req.userId!, amount, coinType, source, description,
      { sourceId, idempotencyKey },
    );

    // Send to REZ Mind - treat as withdraw for analytics
    sendWalletWithdrawToRezMind({
      user_id: req.userId!,
      amount,
      status: 'success',
      transaction_id: idempotencyKey || `debit_${Date.now()}`,
    }).catch(() => {});

    res.json(success(result));
  } catch (err) {
    if (err.message === 'Insufficient balance') {
      res.status(400).json(err('BIZ_INSUFFICIENT_BALANCE'));
    } else {
      res.status(500).json(err('SRV_INTERNAL_ERROR'));
    }
  }
};
router.post('/debit', requireAuth, debitHandler);

// POST /api/wallet/coin-debit — renamed from /api/wallet/payment to avoid monolith payload conflict
// Payload: { amount: number, coinType: string, source: string, description: string,
//            sourceId?: string, idempotencyKey?: string }
router.post('/api/wallet/coin-debit', requireAuth, validateBody(coinDebitSchema), async (req: Request, res: Response) => {
  return debitHandler(req, res);
});

// ── POST welcome-coins ──
/**
 * @route POST /api/wallet/welcome-coins
 * @summary Claim welcome coins
 * @tags Wallet
 * @security BearerAuth
 * @description Claims 50 welcome coins on first login. Limited to 3 claims per day.
 * @response {object} 200 - Coins credited
 * @response {object} 429 - Daily limit exceeded
 */
const welcomeCoinsHandler = async (req: Request, res: Response) => {
  // BAK-CROSS-003 FIX: Removed the separate hasWelcomeCoinsTransaction DB check.
  // Previously, check-then-credit created a TOCTOU race window: two concurrent requests
  // both passed the check before either committed, causing double credit.
  // The idempotency key in creditCoins (welcome_${userId}) is checked INSIDE a MongoDB
  // transaction and protected by a unique index on CoinTransaction.idempotencyKey.
  // Only one request can succeed; concurrent requests get the already-committed transaction.
  //
  // Rate limit remains as secondary guard (3 claims/day per user).

  // 3 welcome-coin claims per day per user (rate limit as secondary guard)
  const allowed = await checkWalletRateLimit(req.userId!, 'welcome', 3, 24 * 60 * 60 * 1000);
  if (!allowed) {
    res.status(429).json(err('BIZ_LIMIT_EXCEEDED'));
    return;
  }
  try {
    const result = await walletService.creditCoins(
      req.userId!, 50, 'rez', 'welcome_bonus', 'Welcome coins for joining REZ!',
      { idempotencyKey: `welcome_${req.userId}` },
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(err('SRV_INTERNAL_ERROR', err.message));
  }
};
router.post('/api/wallet/welcome-coins', requireAuth, welcomeCoinsHandler);

// ── GET conversion-rate ──
/**
 * @route GET /api/wallet/conversion-rate
 * @summary Get conversion rate
 * @tags Wallet
 * @security BearerAuth
 * @description Returns the current coin-to-rupee conversion rate.
 * @response {object} 200 - Conversion rate
 */
const conversionRateHandler = async (_req: Request, res: Response) => {
  // FIX REZ-WALLET-001: Use dynamic rate from DB instead of static env var
  const rate = await getDynamicConversionRate();
  res.json(success({
    coinToRupeeRate: rate,
    exampleConversion: { coins: 100, rupees: coinsToRupees(100) },
  }));
};
router.get('/api/wallet/conversion-rate', requireAuth, conversionRateHandler);

export default router;
