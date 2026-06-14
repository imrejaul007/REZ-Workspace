import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireInternalToken } from '../middleware/internalAuth';
import * as walletService from '../services/walletService';
import * as merchantWalletService from '../services/merchantWalletService';
import * as referralService from '../services/referralService';
import { MerchantWalletTransaction } from '../models/MerchantWalletTransaction';
import { Wallet } from '../models/Wallet';
import { CoinTransaction } from '../models/CoinTransaction';
import { logger } from '../config/logger';
import { success, err, ErrorCodes } from '../utils/response';

// Zod validation schemas for internal routes
const internalCreditSchema = z.object({
  userId: z.string().min(1, 'userId required'),
  amount: z.number().positive().max(1_000_000),
  coinType: z.enum(['rez', 'prive', 'branded', 'promo', 'cashback', 'referral']),
  source: z.string().min(1),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
});

const internalDebitSchema = z.object({
  userId: z.string().min(1, 'userId required'),
  amount: z.number().positive().max(1_000_000),
  coinType: z.enum(['rez', 'prive', 'branded', 'promo', 'cashback', 'referral']),
  source: z.string().min(1),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
});

const merchantCreditSchema = z.object({
  merchantId: z.string().min(1, 'merchantId required'),
  amount: z.number().positive().max(1_000_000),
  source: z.string().min(1),
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

function auditLog(req: Request, action: string, meta: Record<string, unknown>) {
  logger.info('[WalletAudit]', {
    action,
    correlationId: req.headers['x-correlation-id'],
    requestId: req.headers['x-request-id'],
    ip: req.ip,
    ...meta,
  });
}

const router = Router();

// P0-ENUM-1 FIX: added cashback and referral
const VALID_COIN_TYPES = ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'] as const;
type CoinType = typeof VALID_COIN_TYPES[number];

function normalizeCoinType(type: string): CoinType {
  const COIN_TYPE_MAP: Record<string, CoinType> = {
    rez: 'rez', prive: 'prive', branded: 'branded', promo: 'promo',
    cashback: 'cashback', referral: 'referral',
  };
  return COIN_TYPE_MAP[type.toLowerCase()] ?? 'rez';
}

// Hard cap — prevents runaway coin issuance from a misconfigured caller
const MAX_COIN_OPERATION = 1_000_000;

// All internal routes require service-to-service token
router.use(requireInternalToken);

// ── POST /internal/credit — Credit coins to user wallet (called by payment/order services) ──
router.post('/credit', validateBody(internalCreditSchema), async (req: Request, res: Response) => {
  try {
    const { userId, amount, coinType, source, description, sourceId, merchantId, idempotencyKey, operationType, referenceModel } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid userId'));
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > MAX_COIN_OPERATION) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', `amount must be a positive number ≤ ${MAX_COIN_OPERATION}`));
      return;
    }

    // CRIT-02 FIX: Validate referral deduplication + referral verification
    // For source='referral', enforce idempotencyKey pattern: referral:{sourceId}:{userId}
    // Also validate that the referral is legitimate before crediting
    if (source === 'referral') {
      if (!sourceId) {
        res.status(400).json(err('SRV_INTERNAL_ERROR', 'sourceId required for referral credits'));
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(sourceId)) {
        res.status(400).json(err('SRV_INTERNAL_ERROR', 'sourceId must be a valid ObjectId for referral credits'));
        return;
      }
      // Enforce referral pattern: idempotencyKey must be "referral:{sourceId}:{userId}"
      const expectedPattern = `referral:${sourceId}:${userId}`;
      if (idempotencyKey && idempotencyKey !== expectedPattern) {
        res.status(400).json(err('SRV_INTERNAL_ERROR', `For referral source, idempotencyKey must follow pattern: referral:{sourceId}:{userId}`));
        return;
      }

      // Validate referral credit: sourceId is the referrer, userId is the referee
      const validation = await referralService.validateReferralCredit(sourceId, userId, userId);
      if (!validation.valid) {
        res.status(400).json(err('SRV_INTERNAL_ERROR', `Referral validation failed: ${validation.reason}`));
        return;
      }
    }

    // B8: enforce idempotencyKey for all credit sources that the server considers
    // idempotent-by-policy. If missing, reject with 400 — callers must pass one.
    const REQUIRES_IDEMPOTENCY: ReadonlySet<string> = new Set([
      'payment',
      'order',
      'gamification',
      'cashback',
      'refund',
    ]);
    if (REQUIRES_IDEMPOTENCY.has(source) && !idempotencyKey) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', `idempotencyKey is required for source='${source}' credits. Retries without a stable key risk double-crediting.`));
      return;
    }
    if (REQUIRES_IDEMPOTENCY.has(source) && idempotencyKey && idempotencyKey.length > 200) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'idempotencyKey too long (max 200 chars)'));
      return;
    }

    const result = await walletService.creditCoins(userId, parsedAmount, normalizeCoinType(coinType), source, description, {
      sourceId, merchantId, idempotencyKey, operationType, referenceModel,
    });
    auditLog(req, 'coins.credit', { userId, amount: parsedAmount, coinType, source, sourceId, idempotencyKey });
    res.json(success(result));
  } catch (err) {
    res.status(400).json(err('SRV_INTERNAL_ERROR'));
  }
});

// ── POST /internal/debit — Debit coins from user wallet ──
// Pass autoOrder=true to consume coins in priority order: Promo → Branded → Prive → REZ
router.post('/debit', validateBody(internalDebitSchema), async (req: Request, res: Response) => {
  try {
    const { userId, amount, coinType, source, description, sourceId, idempotencyKey, operationType, referenceModel, autoOrder } = req.body;
    if (!userId || !amount || !source || !description) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'userId, amount, source, description required'));
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid userId'));
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > MAX_COIN_OPERATION) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', `amount must be a positive number ≤ ${MAX_COIN_OPERATION}`));
      return;
    }

    // autoOrder=true: consume Promo → Branded → Prive → REZ automatically
    if (autoOrder === true || autoOrder === 'true') {
      const result = await walletService.debitInPriorityOrder(userId, parsedAmount, source, description, {
        sourceId, idempotencyKey, operationType, referenceModel,
      });
      auditLog(req, 'coins.debit.priority', { userId, amount: parsedAmount, source, sourceId, idempotencyKey });
      res.json(success(result));
      return;
    }

    // Default: single coinType debit (backward-compatible)
    if (!coinType) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'coinType required when autoOrder is not true'));
      return;
    }
    const result = await walletService.debitCoins(userId, parsedAmount, normalizeCoinType(coinType), source, description, {
      sourceId, idempotencyKey, operationType, referenceModel,
    });
    auditLog(req, 'coins.debit', { userId, amount: parsedAmount, coinType, source, sourceId, idempotencyKey });
    res.json(success(result));
  } catch (err) {
    const BALANCE_ERRORS = ['Insufficient balance', 'Insufficient non-expired coins', 'Coins of this type have expired', 'Insufficient balance across all coin types'];
    const isClientError = BALANCE_ERRORS.some((e: string) => err.message?.includes(e)) || err.code === 'DAILY_LIMIT_EXCEEDED';
    const status = isClientError ? (err.statusCode || 400) : 500;
    res.status(status).json(err('SRV_INTERNAL_ERROR'));
  }
});

// ── GET /internal/balance/:userId — Get user balance (service-to-service) ──
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const userId = typeof req.params.userId === 'string' ? req.params.userId : Array.isArray(req.params.userId) ? req.params.userId[0] : undefined;
    if (!userId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'userId required')); return; }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid userId'));
      return;
    }
    const result = await walletService.getBalance(userId);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
});

// ── POST /internal/partial-refund — Credit proportional coins back for a partial refund ──
// Called by the order/payment service when a customer gets a partial refund
// (e.g., some items returned, partial cancellation).
router.post('/partial-refund', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      originalTransactionId,
      refundAmount,
      originalAmount,
      coinsOriginallyUsed,
      coinType,
    } = req.body;

    if (!userId || !originalTransactionId) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'userId and originalTransactionId required'));
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid userId'));
      return;
    }

    const parsedRefundAmount = Number(refundAmount);
    const parsedOriginalAmount = Number(originalAmount);
    const parsedCoinsOriginallyUsed = Number(coinsOriginallyUsed);

    if (!Number.isFinite(parsedRefundAmount) || parsedRefundAmount <= 0) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'refundAmount must be a positive number'));
      return;
    }
    if (!Number.isFinite(parsedOriginalAmount) || parsedOriginalAmount <= 0) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'originalAmount must be a positive number'));
      return;
    }
    if (!Number.isFinite(parsedCoinsOriginallyUsed) || parsedCoinsOriginallyUsed < 0) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'coinsOriginallyUsed must be a non-negative number'));
      return;
    }
    if (parsedRefundAmount > parsedOriginalAmount) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'refundAmount cannot exceed originalAmount'));
      return;
    }

    const effectiveCoinType = coinType ? normalizeCoinType(coinType) : 'rez';

    const result = await walletService.partialRefund(
      userId,
      originalTransactionId,
      parsedRefundAmount,
      parsedOriginalAmount,
      parsedCoinsOriginallyUsed,
      effectiveCoinType,
    );

    auditLog(req, 'coins.partialRefund', {
      userId,
      originalTransactionId,
      refundAmount: parsedRefundAmount,
      originalAmount: parsedOriginalAmount,
      coinsOriginallyUsed: parsedCoinsOriginallyUsed,
      coinType: effectiveCoinType,
      coinsRefunded: result.coinsRefunded,
    });

    if (result.coinsRefunded === 0) {
      // Zero refund is not an error — just return what happened
      res.json({
        ...success(result),
        message: 'No coins to refund (amount rounds to zero or coinsOriginallyUsed was 0)',
      });
      return;
    }

    res.json(success(result));
  } catch (err) {
    const isClientError = ['Wallet is frozen'].some((e) => err.message?.includes(e));
    res.status(isClientError ? 403 : 500).json(err('SRV_INTERNAL_ERROR'));
  }
});

// ── POST /internal/merchant/credit — Credit to merchant wallet (called by order service on completion) ──
router.post('/merchant/credit', validateBody(merchantCreditSchema), async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId, amount, platformFee, orderId, orderNumber, description } = req.body;
    if (!merchantId || !storeId || !amount) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'merchantId, storeId, amount required'));
      return;
    }
    // WAL-010 FIX: Validate storeId as a proper ObjectId before use
    const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
    if (!OBJECT_ID_REGEX.test(storeId)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid storeId format'));
      return;
    }
    const { MerchantWallet } = await import('../models/MerchantWallet');
    const mongoose = await import('mongoose');
    const netAmount = amount - (platformFee || 0);
    const orderObjectId = orderId ? new mongoose.Types.ObjectId(orderId) : undefined;

    // Wallet BUG-07: getOrCreateWallet ran outside any session, which means a crash after
    // wallet creation but before the balance update could leave a wallet with no credits.
    // Now we use findOneAndUpdate with upsert inside the same code path as the balance update
    // so the wallet creation and the balance update are both done atomically.
    // Idempotency via unique index on MerchantWalletTransaction.orderId.
    // Insert-first pattern: attempt to create the transaction record atomically.
    // A duplicate key error (E11000) means this orderId was already processed —
    // return the existing balance idempotently.
    if (orderObjectId) {
      // Idempotency pre-check (outside transaction, fast path): if this orderId was already
      // processed return early without starting a session.
      const existingTxn = await MerchantWalletTransaction.findOne({ orderId: orderObjectId }).lean();
      if (existingTxn) {
        const existingWallet = await MerchantWallet.findOne({ merchant: new mongoose.Types.ObjectId(merchantId) }).lean();
        res.json({ ...success({ balance: existingWallet?.balance }), idempotent: true });
        return;
      }

      // Ensure wallet exists before opening the session (upsert is not transactional but
      // $setOnInsert is safe to retry — only sets fields on insert, never overwrites).
      // DM-C1 / CS-C4 fix: use `store` (ObjectId) not `storeId` (string) to match schema.
      // Also initialize all statistics fields to 0 to prevent NaN arithmetic downstream.
      await MerchantWallet.findOneAndUpdate(
        { merchant: new mongoose.Types.ObjectId(merchantId) },
        {
          $setOnInsert: {
            merchant: new mongoose.Types.ObjectId(merchantId),
            store: new mongoose.Types.ObjectId(storeId),
            balance: { total: 0, available: 0, pending: 0, withdrawn: 0, held: 0 },
            statistics: {
              totalSales: 0,
              totalPlatformFees: 0,
              netSales: 0,
              totalOrders: 0,
              totalWithdrawals: 0,
              totalRefunds: 0,
              averageOrderValue: 0,
            },
          },
        },
        { upsert: true, new: true },
      );
      const wallet = await MerchantWallet.findOne({ merchant: new mongoose.Types.ObjectId(merchantId) });

      // Wrap the transaction record insert + balance update in a single MongoDB session so
      // a crash between the two writes cannot leave the books out of sync.
      const session = await mongoose.startSession();
      let updated;
      try {
        session.startTransaction();

        try {
          await MerchantWalletTransaction.create(
            [{
              merchantId: wallet?._id || new mongoose.Types.ObjectId(merchantId),
              type: 'credit',
              amount,
              platformFee: platformFee || 0,
              netAmount,
              orderId: orderObjectId,
              orderNumber,
              description: description || `Order ${orderNumber || 'completed'}`,
              status: 'completed',
            }],
            { session },
          );
        } catch (createErr) {
          if (createErr.code === 11000 || createErr.message?.includes('E11000')) {
            await session.abortTransaction();
            const existingBalance = await MerchantWallet.findOne({ merchant: new mongoose.Types.ObjectId(merchantId) }).lean();
            res.json({ ...success({ balance: existingBalance?.balance }), idempotent: true });
            return;
          }
          throw createErr;
        }

        updated = await MerchantWallet.findOneAndUpdate(
          { merchant: new mongoose.Types.ObjectId(merchantId) },
          {
            $inc: {
              'balance.total': netAmount,
              'balance.available': netAmount,
              'statistics.totalSales': amount,
              'statistics.totalPlatformFees': platformFee || 0,
              'statistics.netSales': netAmount,
              'statistics.totalOrders': 1,
            },
          },
          { new: true, session },
        );

        await session.commitTransaction();
      } catch (txnErr) {
        await session.abortTransaction().catch((err) => logger.error('[wallet] Failed to abort transaction', { error: err?.message }));
        throw txnErr;
      } finally {
        session.endSession();
      }

      auditLog(req, 'merchant.credit', { merchantId, storeId, amount, platformFee, netAmount, orderId, orderNumber });
      res.json(success({ balance: updated?.balance }));
      return;
    }

    // WAL-009 FIX: Wrap in session + server-generated idempotency key.
    // A crash between balance update and transaction record creation is now impossible
    // because both happen inside the same transaction.
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const idempotencyKey = randomUUID();

      // Ensure wallet exists (upsert-safe to retry)
      await MerchantWallet.findOneAndUpdate(
        { merchant: new mongoose.Types.ObjectId(merchantId) },
        {
          $setOnInsert: {
            merchant: new mongoose.Types.ObjectId(merchantId),
            balance: { total: 0, available: 0, pending: 0, withdrawn: 0, held: 0 },
            statistics: {
              totalSales: 0, totalPlatformFees: 0, netSales: 0,
              totalOrders: 0, totalWithdrawals: 0, totalRefunds: 0, averageOrderValue: 0,
            },
          },
        },
        { upsert: true, new: true, session },
      );

      const updated = await MerchantWallet.findOneAndUpdate(
        { merchant: new mongoose.Types.ObjectId(merchantId) },
        {
          $inc: {
            'balance.total': netAmount,
            'balance.available': netAmount,
            'statistics.totalSales': amount,
            'statistics.totalPlatformFees': platformFee || 0,
            'statistics.netSales': netAmount,
            'statistics.totalOrders': 1,
          },
        },
        { new: true, session },
      );

      if (!updated) {
        throw new Error('Merchant wallet not found');
      }

      await MerchantWalletTransaction.create([{
        merchantId: updated._id,
        type: 'credit',
        amount,
        platformFee: platformFee || 0,
        netAmount,
        orderId: undefined,
        orderNumber,
        description: description || `Order ${orderNumber || 'completed'}`,
        status: 'completed',
        idempotencyKey,
      }], { session });

      await session.commitTransaction();

      auditLog(req, 'merchant.credit', { merchantId, storeId, amount, platformFee, netAmount, orderNumber, noOrderId: true, idempotencyKey });
      res.json(success({ balance: updated.balance }));
      return;
    } catch (txnErr) {
      await session.abortTransaction().catch((err) => logger.error('[wallet] Failed to abort transaction in merchant.credit', { error: err?.message }));
      throw txnErr;
    } finally {
      session.endSession();
    }
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
});

// ── GET /internal/reconcile — Wallet reconciliation stats (admin use only) ──
//
// Runs an in-memory reconciliation pass over all wallets and returns a summary
// of any wallets whose balance.available diverges from their CoinTransaction
// ledger total by more than RECONCILE_THRESHOLD coins.
//
// Query params:
//   limit    — Max wallets to inspect (default: 100, max: 100)
//   threshold — Coin difference tolerance before flagging (default: 0.01)
//
// This endpoint is intentionally synchronous and capped — for full dataset
// reconciliation use the standalone scripts/reconcileWallets.ts script.
// FIX REZ-WALLET-002: Added warning to response when approaching limit.
router.get('/reconcile', async (req: Request, res: Response) => {
  const THRESHOLD = parseFloat((req.query.threshold as string) ?? '0.01');
  const parsedLimit = parseInt((req.query.limit as string) ?? '100', 10);
  const LIMIT = Math.min(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100, 100);

  if (!Number.isFinite(THRESHOLD) || THRESHOLD < 0) {
    res.status(400).json(err('SRV_INTERNAL_ERROR', 'threshold must be a non-negative number'));
    return;
  }

  interface DiscrepancyRow {
    walletId: string;
    userId: string;
    walletBalance: number;
    ledgerBalance: number;
    diff: number;
    isFrozen: boolean;
  }

  try {
    const wallets = await Wallet.find({}).limit(LIMIT).lean();

    const discrepancies: DiscrepancyRow[] = [];
    let walletsChecked = 0;

    for (const wallet of wallets) {
      walletsChecked++;
      const userId = (wallet.user as Types.ObjectId).toString();
      const walletBalance = wallet.balance?.available ?? 0;

      // Aggregate credits − debits for rez coins (maps to balance.available).
      // CoinTransaction.type uses 'earned'|'bonus'|'branded_award'|'refunded' for credits
      // and 'spent'|'expired' for debits — NOT 'credit'/'debit'.
      const agg = await CoinTransaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            coinType: { $in: ['rez'] },
          },
        },
        {
          $group: {
            _id: null,
            credits: { $sum: { $cond: [{ $in: ['$type', ['earned', 'bonus', 'branded_award', 'refunded']] }, '$amount', 0] } },
            debits: { $sum: { $cond: [{ $in: ['$type', ['spent', 'expired']] }, '$amount', 0] } },
          },
        },
      ]);

      const ledgerBalance = agg.length > 0 ? agg[0].credits - agg[0].debits : 0;
      const diff = Math.abs(walletBalance - ledgerBalance);

      if (diff > THRESHOLD) {
        discrepancies.push({
          walletId: (wallet._id as Types.ObjectId).toString(),
          userId,
          walletBalance,
          ledgerBalance,
          diff: parseFloat(diff.toFixed(4)),
          isFrozen: wallet.isFrozen ?? false,
        });
      }
    }

    res.json(success({
      summary: {
        walletsChecked,
        discrepanciesFound: discrepancies.length,
        threshold: THRESHOLD,
        limit: LIMIT,
        generatedAt: new Date().toISOString(),
        // FIX REZ-WALLET-002: Warn when results are truncated
        warning: walletsChecked >= LIMIT ? 'Limit reached — use scripts/reconcileWallets.ts for full reconciliation' : undefined,
      },
      discrepancies,
    }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
});

export default router;
