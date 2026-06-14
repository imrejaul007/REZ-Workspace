import { Router, Request, Response } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { requireInternalToken } from '../middleware/internalAuth';
import { MerchantWallet } from '../models/MerchantWallet';
import merchantWalletService from '../services/merchantWalletService';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { AuditLogger, AUDIT_ACTIONS } from '../utils/AuditLogger';

const router = Router();

// Initialize audit logger
let auditLogger: AuditLogger | null = null;

function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    const auditCollection = mongoose.connection.collection('audit_logs');
    auditLogger = new AuditLogger(auditCollection);
  }
  return auditLogger;
}

// ── Redis-backed rate limiter for payout requests ───────────────────────────────────
// HIGH FIX: Add rate limiting on payout withdrawal endpoint to prevent rapid drain attacks.
async function checkPayoutRateLimit(merchantId: string): Promise<boolean> {
  const key = `rl:payout:${merchantId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 payout per hour
  const max = 1;
  try {
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, '-inf', now - windowMs);
    pipe.zcard(key);
    pipe.zadd(key, now, `${now}`);
    pipe.pexpire(key, windowMs);
    const results = await pipe.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;
    return count <= max;
  } catch (err) {
    logger.warn('[checkPayoutRateLimit] Redis unavailable', { merchantId, error: err });
    return true; // fail-open
  }
}

// All payout routes are internal — require X-Internal-Token header
router.use(requireInternalToken);

// Use the raw MongoDB driver collection (strict:false equivalent, no schema needed)
const getPayoutsCollection = () => mongoose.connection.collection('merchantpayouts');

// ── GET /payouts ────────────────────────────────────────────────
// Query: merchantId (required), page=1, limit=20
router.get('/payouts', async (req: Request, res: Response) => {
  try {
    const { merchantId, page: pageQ, limit: limitQ } = req.query;

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchantId is required' });
      return;
    }

    const page  = Math.max(1, parseInt(pageQ  as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitQ as string) || 20));
    const skip  = (page - 1) * limit;

    const col = getPayoutsCollection();
    const filter = { merchantId };

    const [docs, total] = await Promise.all([
      col
        .find(filter)
        .project({ _id: 1, amountPaise: 1, status: 1, requestedAt: 1, processedAt: 1 })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      col.countDocuments(filter),
    ]);

    res.json({ success: true, data: docs, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /payouts/request ───────────────────────────────────────
// Body: { merchantId, storeId, amountPaise, bankAccountId? }
// M22: Routes through merchantWalletService.requestWithdrawal() which performs an
// atomic balance check + pending deduction in a single findOneAndUpdate predicate,
// eliminating the TOCTOU race between the pre-read balance check and the insert.
router.post('/payouts/request', async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId, amountPaise } = req.body;

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchantId is required' });
      return;
    }
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    if (!amountPaise || typeof amountPaise !== 'number' || amountPaise <= 0) {
      res.status(400).json({ success: false, message: 'amountPaise must be a positive number' });
      return;
    }

    if (!mongoose.isValidObjectId(merchantId)) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }

    // HIGH FIX: Rate limit payout requests to 1 per hour per merchant
    if (!(await checkPayoutRateLimit(merchantId))) {
      res.status(429).json({ success: false, message: 'Too many payout requests. Please wait before requesting again.' });
      return;
    }

    // Delegate to the atomic service method which does a single conditional update
    // (balance check + pending increment in one DB round-trip) to prevent race conditions.
    const result = await merchantWalletService.requestWithdrawal(merchantId, amountPaise);

    // Audit logging: withdrawal requested
    getAuditLogger().log({
      timestamp: new Date(),
      userId: merchantId,
      action: AUDIT_ACTIONS.WITHDRAWAL_REQUESTED,
      entityType: 'wallet',
      entityId: result.transaction._id.toString(),
      status: 'success',
      metadata: {
        amountPaise,
        merchantId,
        storeId,
      },
    }).catch((err) => logger.warn('Audit log failed', { error: err?.message }));

    res.status(201).json({
      success: true,
      payoutId: result.transaction._id,
      transactionId: result.transaction._id,
      status: 'pending',
      balance: result.balance,
    });
  } catch (err) {
    const status =
      err.message === 'Wallet not found' ? 404
      : err.message === 'Bank details not configured' || err.message === 'Bank details not verified' ? 422
      : err.message?.startsWith('Minimum withdrawal') ? 400
      : err.message?.includes('Insufficient') || err.message?.includes('concurrent') ? 400
      : 500;
    res.status(status).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /payouts/pending ────────────────────────────────────────
// List all pending withdrawal requests across all merchants
router.get('/payouts/pending', async (_req: Request, res: Response) => {
  try {
    const col = getPayoutsCollection();
    const docs = await col
      .find({ status: 'pending' })
      .sort({ requestedAt: 1 })
      .limit(100)
      .toArray();
    res.json({ success: true, data: docs, count: docs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── PATCH /payouts/:id/process ──────────────────────────────────
// Mark a payout as processed (bank transfer completed). Moves pending balance to withdrawn.
// Wallet BUG-11: Both the wallet update and payout status update are now inside a single
// MongoDB transaction so a crash between them cannot leave the balance and status out of sync.
router.patch('/payouts/:id/process', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { transactionRef } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid payout ID' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const col = getPayoutsCollection();
    const payout = await col.findOne({ _id: new mongoose.Types.ObjectId(id) }, { session } as { session: ClientSession });
    if (!payout) { await session.abortTransaction(); res.status(404).json({ success: false, message: 'Payout not found' }); return; }
    if (payout.status !== 'pending') {
      await session.abortTransaction();
      res.status(409).json({ success: false, message: `Payout is already ${payout.status}` });
      return;
    }

    await MerchantWallet.updateOne(
      { merchant: new mongoose.Types.ObjectId(String(payout.merchantId)) },
      {
        $inc: {
          'balance.pending': -payout.amountPaise,
          'balance.withdrawn': payout.amountPaise,
          'statistics.totalWithdrawals': payout.amountPaise,
        },
        $set: { lastSettlementAt: new Date() },
      },
      { session },
    );

    await col.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { status: 'processed', processedAt: new Date(), transactionRef: transactionRef || null } },
      { session } as { session: ClientSession },
    );

    await session.commitTransaction();

    // Audit logging: withdrawal completed
    getAuditLogger().log({
      timestamp: new Date(),
      userId: payout.merchantId,
      action: AUDIT_ACTIONS.WITHDRAWAL_COMPLETED,
      entityType: 'wallet',
      entityId: id,
      status: 'success',
      metadata: {
        amountPaise: payout.amountPaise,
        transactionRef,
      },
    }).catch((err) => logger.warn('Audit log failed', { error: err?.message }));

    res.json({ success: true, message: 'Payout marked as processed' });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      logger.error('[PayoutRoutes] Transaction abort failed', { payoutId: id, originalError: err.message, abortError: abortErr?.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    session.endSession();
  }
});

// ── PATCH /payouts/:id/fail ─────────────────────────────────────
// Mark payout as failed — returns funds from pending back to available.
// Wallet BUG-11: Both writes are now inside a single MongoDB transaction.
router.patch('/payouts/:id/fail', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid payout ID' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const col = getPayoutsCollection();
    const payout = await col.findOne({ _id: new mongoose.Types.ObjectId(id) }, { session } as { session: ClientSession });
    if (!payout) { await session.abortTransaction(); res.status(404).json({ success: false, message: 'Payout not found' }); return; }
    if (payout.status !== 'pending') {
      await session.abortTransaction();
      res.status(409).json({ success: false, message: `Payout is already ${payout.status}` });
      return;
    }

    await MerchantWallet.updateOne(
      { merchant: new mongoose.Types.ObjectId(String(payout.merchantId)) },
      { $inc: { 'balance.pending': -payout.amountPaise, 'balance.available': payout.amountPaise } },
      { session },
    );

    await col.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { status: 'failed', failedAt: new Date(), failReason: reason || 'Payout failed' } },
      { session } as { session: ClientSession },
    );

    await session.commitTransaction();

    // Audit logging: withdrawal failed
    getAuditLogger().log({
      timestamp: new Date(),
      userId: payout.merchantId,
      action: AUDIT_ACTIONS.WITHDRAWAL_FAILED,
      entityType: 'wallet',
      entityId: id,
      status: 'failure',
      metadata: {
        amountPaise: payout.amountPaise,
        reason,
      },
    }).catch((err) => logger.warn('Audit log failed', { error: err?.message }));

    res.json({ success: true, message: 'Payout marked as failed. Funds returned to available balance.' });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      logger.error('[PayoutRoutes] Transaction abort failed', { payoutId: id, originalError: err.message, abortError: abortErr?.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    session.endSession();
  }
});

export default router;
