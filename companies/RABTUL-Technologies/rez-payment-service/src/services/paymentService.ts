/**
 * Payment Service — core payment operations.
 *
 * PAY-019 FIX: Refactored from ~1,259 lines into three focused files:
 *   - paymentService.ts  — core payment operations (this file)
 *   - webhookService.ts  — Razorpay webhook handlers
 *   - refundService.ts   — refund processing logic
 *
 * Exported functions in this file:
 *   creditWalletAfterPayment, initiatePayment, capturePayment,
 *   getPaymentStatus, getPaymentAuditTrail, getMerchantSettlements,
 *   startMonolithSyncWorker
 */

// Re-export webhook and refund functions for backward compatibility.
// paymentRoutes.ts and other callers can still import from paymentService.
export { handleWebhookCaptured, handleWebhookRefundProcessed, handleWebhookRefundFailed, handleWebhookFailed } from './webhookService';
export { processRefund } from './refundService';

import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Queue } from 'bullmq';
import { Payment, IPayment, PaymentStatus } from '../models/Payment';
import { PaymentAuditLog } from '../models/TransactionAuditLog';
import * as razorpay from './razorpayService';
import { createServiceLogger } from '../config/logger';
import { redis, redisHost, redisPort } from '../config/redis';
import { recordPaymentProfileUpdate, mapPaymentTypeToVertical } from './profileIntegration';
import { fraudDetection } from './fraudDetection';

const logger = createServiceLogger('payment-service');

/** PAY-007/PAY-012 FIX: Explicitly typed metadata for payment documents. */
export interface PaymentMetadata {
  merchantId?: string;
  orderId?: string;
  orderNumber?: string;
  razorpayOrderId?: string;
  orchestratorIdempotencyKey?: string;
  userId?: string;
  reason?: string;
  [key: string]: unknown;
}

/** PAY-008 FIX: Typed interface for lean() query results from Payment collection. */
export interface LeanPayment {
  _id: mongoose.Types.ObjectId;
  paymentId: string;
  orderId: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  purpose: string;
  status: IPayment['status'];
  metadata?: PaymentMetadata;
  gatewayResponse?: {
    gateway: string;
    transactionId?: string;
    timestamp: Date;
    [key: string]: unknown;
  };
  walletCredited?: boolean;
  refundedAmount?: number;
  paymentMeta?: {
    refundDispute?: {
      reportedAt: Date;
      expected: number;
      actual: number;
    };
    [key: string]: unknown;
  };
  userDetails?: { name?: string; email?: string; phone?: string };
  createdAt: Date;
  updatedAt: Date;
}

/** PAY-013 FIX: Typed interface for the subset of order document fields used by this service. */
interface OrderDoc {
  _id: mongoose.Types.ObjectId;
  orderId?: string;
  orderNumber?: string;
  totals?: { total?: number; paidAmount?: number };
}

// ─── Wallet credit ────────────────────────────────────────────────────────────

/**
 * Post coin credit to the wallet service after a successful payment capture.
 *
 * F-01 FIX: Tracks enqueue state in Redis BEFORE creditWalletAfterPayment is called.
 * The MongoDB `walletCredited` flag must ONLY be set after BullMQ confirms the job
 * was queued. A recovery worker (lostCoinsRecoveryWorker.ts) periodically scans for
 * stuck states where walletCredited=true but the job was never queued, and re-enqueues.
 *
 * Redis key lifecycle:
 *   pay-credit-queued:<paymentId> = "pending"   → job not yet queued
 *   pay-credit-queued:<paymentId> = "enqueued"  → job successfully added to BullMQ
 *   pay-credit-queued:<paymentId> = "failed"    → enqueue failed (Redis will auto-expire)
 * Key expires after 7 days (auto-cleanup of stale entries).
 *
 * If Redis is unavailable, falls back to the old behavior (enqueue anyway) with a
 * warning — the recovery worker will catch unknown missed credits within its scan window.
 */
/**
 * Credits the consumer wallet with coins equal to the payment amount after payment capture.
 * Idempotent via Redis flag — skipped if coins were already credited for this payment.
 * @param payment - The captured Payment document
 */
export async function creditWalletAfterPayment(payment: IPayment): Promise<void> {
  const walletUrl = process.env.WALLET_SERVICE_URL;
  if (!walletUrl) {
    logger.warn('[WalletCredit] WALLET_SERVICE_URL not set — skipping coin credit', { paymentId: payment.paymentId });
    return;
  }
  const coinsToCredit = Math.floor(payment.amount);
  if (coinsToCredit <= 0) return;

  const redisKey = `pay-credit-queued:${payment.paymentId}`;
  const QUEUE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  // F-01 FIX: Check Redis first — if already enqueued (including by a concurrent call),
  // skip. This prevents double-enqueue on the rare race where capturePayment and
  // handleWebhookCaptured both fire for the same payment.
  try {
    const existing = await redis.get(redisKey);
    if (existing === 'enqueued') {
      logger.info('[WalletCredit] Already enqueued (skipping)', { paymentId: payment.paymentId });
      return;
    }
    // Mark as pending to signal that enqueue is in progress
    await redis.set(redisKey, 'pending', 'EX', QUEUE_TTL);
  } catch (redisErr: unknown) {
    // Redis unavailable — log and continue (recovery worker will catch missed credits)
    logger.warn('[WalletCredit] Redis unavailable for enqueue tracking — proceeding without lock', {
      paymentId: payment.paymentId,
      error: redisErr instanceof Error ? redisErr.message : String(redisErr),
    });
  }

  try {
    await getWalletCreditQueue().add(
      'wallet-credit',
      {
        userId: payment.user.toString(),
        amount: coinsToCredit,
        coinType: 'rez',
        source: 'recharge',
        description: `Payment capture — ₹${payment.amount}`,
        sourceId: payment.paymentId,
        idempotencyKey: `pay-credit-${payment.paymentId}`,
        walletUrl,
      },
      { jobId: `pay-credit-${payment.paymentId}` },
    );

    // F-01 FIX: Mark as enqueued in Redis so the recovery worker knows this payment
    // was successfully queued. If this SET fails, the key stays "pending" — the recovery
    // worker will treat it as stuck and re-enqueue.
    try {
      await redis.set(redisKey, 'enqueued', 'EX', QUEUE_TTL);
    } catch (setErr: unknown) {
      logger.warn('[WalletCredit] Failed to mark enqueued in Redis — recovery will catch', {
        paymentId: payment.paymentId,
        error: setErr instanceof Error ? setErr.message : String(setErr),
      });
    }

    logger.info('[WalletCredit] Wallet credit job enqueued', { paymentId: payment.paymentId, coins: coinsToCredit });
  } catch (err: unknown) {
    // F-01 FIX: On enqueue failure, mark as failed in Redis so the recovery worker
    // knows this needs re-enqueue. The MongoDB walletCredited=true flag (set inside
    // the transaction) will be reset by the recovery worker when it re-enqueues.
    try {
      await redis.set(redisKey, 'failed', 'EX', QUEUE_TTL);
    } catch (_setErr: unknown) {
      // Best-effort Redis update
    }
    logger.error('[WalletCredit] Failed to enqueue wallet credit job', { paymentId: payment.paymentId, error: err instanceof Error ? err.message : String(err) });
  }
}

let _walletCreditQueue: Queue | null = null;
function getWalletCreditQueue(): Queue {
  if (!_walletCreditQueue) {
    _walletCreditQueue = new Queue('wallet-credit', {
      connection: { host: redisHost, port: redisPort },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
    // BullMQ Queue instances emit their own `error` events (Redis command
    // failures, re-subscription errors). Without a listener Node treats
    // them as unhandled and in strict modes crashes the process. The
    // ioredis connection has its own listener but it only covers transport
    // errors, not Queue-level issues. Log + continue.
    _walletCreditQueue.on('error', (err) => {
      logger.error('[payment-service] wallet-credit Queue error (non-fatal)', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
  return _walletCreditQueue;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** TTL (ms) for the per-order initiation mutex. */
const INIT_LOCK_TTL_MS = 30_000;

type RoutePurpose = 'order' | 'wallet_topup' | 'subscription' | 'refund' | 'other';
type PaymentPurpose = 'wallet_topup' | 'order_payment' | 'event_booking' | 'financial_service' | 'other';

function normalizePaymentPurpose(purpose?: string): PaymentPurpose {
  const input = (purpose || 'order') as RoutePurpose;
  switch (input) {
    case 'order':        return 'order_payment';
    case 'wallet_topup': return 'wallet_topup';
    case 'subscription': return 'financial_service';
    case 'refund':       return 'other';
    case 'other':        return 'other';
    default: {
      const _exhaustive: never = input;
      logger.warn('Unknown payment purpose, defaulting to other', { purpose: _exhaustive });
      return 'other';
    }
  }
}

async function resolveAuthoritativeOrderAmount(orderId: string): Promise<number | null> {
  const filters: Record<string, unknown>[] = [
    { orderId },
    { orderNumber: orderId },
  ];
  if (mongoose.isValidObjectId(orderId)) {
    filters.unshift({ _id: new mongoose.Types.ObjectId(orderId) });
  }
  const order = (await mongoose.connection.collection('orders').findOne(
    filters.length === 1 ? filters[0] : { $or: filters },
    { projection: { totals: 1 } },
  )) as OrderDoc | null;

  const totals = order?.totals;
  const rawAmount = typeof totals?.total === 'number'
    ? totals.total
    : typeof totals?.paidAmount === 'number'
      ? totals.paidAmount
      : null;

  return rawAmount !== null && Number.isFinite(rawAmount) && rawAmount >= 0 ? rawAmount : null;
}

export async function assertAuthoritativeOrderAmount(orderId: string, amount: number): Promise<void> {
  const authoritativeAmount = await resolveAuthoritativeOrderAmount(orderId);
  if (authoritativeAmount === null) {
    throw new Error('Authoritative order amount not found');
  }
  if (Math.abs(authoritativeAmount - amount) > 0.01) {
    throw new Error(`Amount mismatch: expected ${authoritativeAmount}, got ${amount}`);
  }
}

async function acquireLock(key: string, ttlMs: number): Promise<string | null> {
  const token = uuid();
  const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
  return result === 'OK' ? token : null;
}

async function releaseLock(key: string, token: string): Promise<void> {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, key, token);
}

// ─── Core payment operations ──────────────────────────────────────────────────

export interface InitiateInput {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  purpose?: string;
  userDetails?: { name?: string; email?: string; phone?: string };
  orchestratorIdempotencyKey?: string;
  metadata?: PaymentMetadata;
}

export interface InitiateResult {
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Initiates a payment by creating an order in Razorpay and recording it in MongoDB.
 * Supports order_payment, wallet_topup, and financial_service purposes.
 * Uses idempotency keys to prevent duplicate payment initiation.
 * @param input - Payment initiation parameters (userId, amount, purpose, orderId, etc.)
 * @returns The created payment record with Razorpay gateway order details
 */
export async function initiatePayment(input: InitiateInput): Promise<InitiateResult> {
  const { orchestratorIdempotencyKey } = input;
  const normalizedPurpose = normalizePaymentPurpose(input.purpose);

  // FRAUD DETECTION: Check transaction against velocity and amount limits
  const fraudCheck = await fraudDetection.checkTransaction(
    input.userId,
    input.amount,
    input.metadata?.merchantId,
  );
  if (!fraudCheck.passed) {
    logger.warn('[FRAUD] Transaction blocked by fraud detection', {
      userId: input.userId,
      amount: input.amount,
      reason: fraudCheck.reason,
      risk: fraudCheck.risk,
    });
    throw new Error(`Transaction blocked: ${fraudCheck.reason}`);
  }

  if (normalizedPurpose === 'order_payment') {
    await assertAuthoritativeOrderAmount(input.orderId, input.amount);
  } else {
    const MAX_WALLET_TOPUP = 100000;
    const MAX_FINANCIAL_SERVICE = 500000;

    if (normalizedPurpose === 'wallet_topup' && input.amount > MAX_WALLET_TOPUP) {
      logger.warn('[PaymentService] Wallet topup amount exceeds limit', {
        requestedAmount: input.amount,
        maxAllowed: MAX_WALLET_TOPUP,
        userId: input.userId,
      });
      throw new Error(`Wallet topup amount cannot exceed ${MAX_WALLET_TOPUP}`);
    }

    if (normalizedPurpose === 'financial_service' && input.amount > MAX_FINANCIAL_SERVICE) {
      logger.warn('[PaymentService] Financial service amount exceeds limit', {
        requestedAmount: input.amount,
        maxAllowed: MAX_FINANCIAL_SERVICE,
        userId: input.userId,
      });
      throw new Error(`Financial service amount cannot exceed ${MAX_FINANCIAL_SERVICE}`);
    }
  }

  if (orchestratorIdempotencyKey) {
    const existing = await Payment.findOne({
      'metadata.orchestratorIdempotencyKey': orchestratorIdempotencyKey,
      status: 'pending',
    }).lean();

    if (existing) {
      logger.info('[PaymentService] Returning existing payment for idempotency key', {
        paymentId: existing.paymentId,
        orchestratorIdempotencyKey,
      });
      return {
        paymentId: existing.paymentId,
        gatewayOrderId: existing.metadata?.razorpayOrderId as string,
        amount: existing.amount,
        currency: existing.currency,
        keyId: process.env.RAZORPAY_KEY_ID || '',
      };
    }
  }

  const initLockKey = `payment:init:${input.orderId}`;
  const lockToken = await acquireLock(initLockKey, INIT_LOCK_TTL_MS);
  if (!lockToken) {
    logger.warn('[PaymentService] Concurrent initiation detected, lock unavailable', {
      orderId: input.orderId,
      orchestratorIdempotencyKey,
    });
    throw new Error('A payment initiation for this order is already in progress. Please retry in a moment.');
  }

  try {
    if (orchestratorIdempotencyKey) {
      const existingAfterLock = await Payment.findOne({
        'metadata.orchestratorIdempotencyKey': orchestratorIdempotencyKey,
        status: { $in: ['pending', 'processing'] },
      }).lean();

      if (existingAfterLock) {
        logger.info('[PaymentService] Returning existing payment (post-lock re-check)', {
          paymentId: existingAfterLock.paymentId,
          orchestratorIdempotencyKey,
        });
        return {
          paymentId: existingAfterLock.paymentId,
          gatewayOrderId: existingAfterLock.metadata?.razorpayOrderId as string,
          amount: existingAfterLock.amount,
          currency: existingAfterLock.currency,
          keyId: process.env.RAZORPAY_KEY_ID || '',
        };
      }
    }

    const paymentId = `pay_${uuid().replace(/-/g, '').slice(0, 16)}`;

    // BNPL: Skip Razorpay, create BNPL record directly
    if (input.paymentMethod === 'bnpl') {
      return await handleBNPLPayment(input, paymentId, orchestratorIdempotencyKey);
    }

    const rzOrder = await razorpay.createOrder(input.amount, paymentId, {
      userId: input.userId,
      purpose: normalizedPurpose,
    });

    const metadata: PaymentMetadata = {
      ...(input.metadata ?? {}),
      razorpayOrderId: rzOrder.id,
      ...(orchestratorIdempotencyKey ? { orchestratorIdempotencyKey } : {}),
    };

    await Payment.create({
      paymentId,
      orderId: input.orderId,
      user: mongoose.isValidObjectId(input.userId)
        ? new mongoose.Types.ObjectId(input.userId)
        : (() => { throw new Error(`Invalid userId: ${input.userId}`); })(),
      amount: input.amount,
      currency: input.currency || 'INR',
      paymentMethod: input.paymentMethod,
      purpose: normalizedPurpose,
      status: 'pending',
      userDetails: input.userDetails || {},
      metadata,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await PaymentAuditLog.create({
      action: 'initiate',
      paymentId,
      userId: input.userId,
      amount: input.amount,
      newStatus: 'pending',
      metadata: { razorpayOrderId: rzOrder.id },
    });

    logger.info('Payment initiated', { paymentId, orderId: input.orderId, amount: input.amount });

    return {
      paymentId,
      gatewayOrderId: rzOrder.id,
      amount: input.amount,
      currency: input.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || '',
    };
  } finally {
    await releaseLock(initLockKey, lockToken);
  }
}

// ─── BNPL Payment Handler ─────────────────────────────────────────────────────

async function handleBNPLPayment(input: InitiateInput, paymentId: string, orchestratorIdempotencyKey?: string): Promise<InitiateResult> {
  const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL;
  if (!WALLET_SERVICE_URL) {
    throw new Error('WALLET_SERVICE_URL is required for BNPL operations');
  }

  try {
    // Check eligibility first
    const eligibilityResp = await fetch(`${WALLET_SERVICE_URL}/internal/credit/check-eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'payment-service',
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
      body: JSON.stringify({
        userId: input.userId,
        phone: input.userDetails?.phone || '',
        amount: input.amount,
      }),
    });

    if (!eligibilityResp.ok) {
      const error = await eligibilityResp.text();
      throw new Error(`BNPL eligibility check failed: ${error}`);
    }

    const eligibility = await eligibilityResp.json() as { success: boolean; data?: { eligible: boolean; reason?: string } };
    if (!eligibility.data?.eligible) {
      throw new Error(eligibility.data?.reason || 'Not eligible for BNPL');
    }

    // Create BNPL record
    const bnplResp = await fetch(`${WALLET_SERVICE_URL}/internal/credit/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'payment-service',
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
      body: JSON.stringify({
        userId: input.userId,
        phone: input.userDetails?.phone || '',
        merchantId: input.metadata?.merchantId || '',
        merchantName: input.metadata?.merchantName || 'Unknown',
        vertical: input.metadata?.vertical || 'd2c',
        amount: input.amount,
      }),
    });

    if (!bnplResp.ok) {
      const error = await bnplResp.text();
      throw new Error(`BNPL creation failed: ${error}`);
    }

    const bnpl = await bnplResp.json() as { success: boolean; data?: { _id: string } };

    const metadata: PaymentMetadata = {
      ...(input.metadata ?? {}),
      bnplTransactionId: bnpl.data?._id,
      ...(orchestratorIdempotencyKey ? { orchestratorIdempotencyKey } : {}),
    };

    // Create payment record
    await Payment.create({
      paymentId,
      orderId: input.orderId,
      user: new mongoose.Types.ObjectId(input.userId),
      amount: input.amount,
      currency: 'INR',
      paymentMethod: 'bnpl',
      purpose: input.purpose || 'order_payment',
      status: 'pending',
      userDetails: input.userDetails || {},
      metadata,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await PaymentAuditLog.create({
      action: 'initiate',
      paymentId,
      userId: input.userId,
      amount: input.amount,
      newStatus: 'pending',
      metadata: { bnplTransactionId: bnpl.data?._id },
    });

    // FIX: Update user profile with BNPL transaction for LTV/tier tracking
    const metadataVertical = typeof input.metadata?.vertical === 'string' ? input.metadata.vertical : undefined;
    await recordPaymentProfileUpdate({
      userId: input.userId,
      phone: input.userDetails?.phone || '',
      amount: input.amount,
      merchantId: input.metadata?.merchantId || '',
      vertical: mapPaymentTypeToVertical(input.purpose || metadataVertical || 'order'),
      category: 'bnpl',
      orderId: input.orderId,
    });

    logger.info('[PaymentService] BNPL payment initiated', { paymentId, bnplId: bnpl.data?._id });

    return {
      paymentId,
      gatewayOrderId: `bnpl_${bnpl.data?._id || paymentId}`,
      amount: input.amount,
      currency: 'INR',
      keyId: '',
    };
  } catch (err) {
    logger.error('[PaymentService] BNPL payment failed', { error: err.message });
    throw err;
  }
}

/**
 * Captures a payment after Razorpay authorization. Updates payment status to 'captured'
 * and credits the merchant wallet via the wallet service.
 * @param paymentId - The internal payment ID
 * @param razorpayPaymentId - The Razorpay payment ID from the capture webhook
 * @param razorpayOrderId - The Razorpay order ID
 * @param ownerUserId - Optional user ID for authorization
 */
export async function capturePayment(
  paymentId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  ownerUserId?: string,
): Promise<IPayment> {
  const valid = razorpay.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!valid) throw new Error('Invalid payment signature');

  if (ownerUserId) {
    const existing = await Payment.findOne({ paymentId }, { user: 1 }).lean();
    if (!existing) throw new Error('Payment not found');
    if (existing.user.toString() !== ownerUserId) {
      logger.warn('IDOR attempt: capture on another user payment', { paymentId, ownerUserId, actualOwner: existing.user.toString() });
      throw new Error('Unauthorized: payment does not belong to this user');
    }
  }

  const session = await mongoose.startSession();
  let payment: IPayment | null = null;
  let walletCreditWonRace = false;

  try {
    await session.withTransaction(async () => {
      payment = await Payment.findOne({ paymentId }).session(session);
      if (!payment) throw new Error('Payment not found');
      if (payment.status === 'completed') return;

      const credited = await Payment.findOneAndUpdate(
        { _id: payment._id, walletCredited: { $ne: true } },
        { $set: { walletCredited: true, walletCreditedAt: new Date() } },
        { session, new: true },
      );
      walletCreditWonRace = credited !== null;

      const prevStatus = payment.status;
      payment.status = 'processing' as PaymentStatus;
      await payment.save({ session });

      payment.status = 'completed' as PaymentStatus;
      payment.completedAt = new Date();
      payment.expiresAt = undefined;
      payment.gatewayResponse = {
        gateway: 'razorpay',
        transactionId: razorpayPaymentId,
        timestamp: new Date(),
      };
      await payment.save({ session });

      await PaymentAuditLog.create(
        [{
          action: 'capture',
          paymentId,
          userId: payment.user.toString(),
          amount: payment.amount,
          previousStatus: prevStatus,
          newStatus: 'completed',
          gatewayResponse: { razorpayPaymentId, razorpayOrderId },
        }],
        { session },
      );

      // FIX: Enqueue BullMQ job INSIDE the transaction to prevent race condition.
      // If the job enqueue fails, the transaction rolls back and walletCredited=false.
      // This guarantees atomicity: either both succeed or both fail.
      if (walletCreditWonRace) {
        const coinsToCredit = Math.floor(payment.amount);
        if (coinsToCredit > 0) {
          const walletUrl = process.env.WALLET_SERVICE_URL;
          if (walletUrl) {
            const creditJobId = `pay-credit-${payment.paymentId}`;
            const queue = getWalletCreditQueue();
            const existingJob = await queue.getJob(creditJobId);
            if (!existingJob) {
              await queue.add(
                'wallet-credit',
                {
                  userId: payment.user.toString(),
                  amount: coinsToCredit,
                  coinType: 'rez',
                  source: 'recharge',
                  description: `Payment capture — ₹${payment.amount}`,
                  sourceId: payment.paymentId,
                  idempotencyKey: `pay-credit-${payment.paymentId}`,
                  walletUrl,
                },
                { jobId: creditJobId },
              );
              logger.info('[Payment] Wallet credit job enqueued inside transaction', { paymentId, coins: coinsToCredit });
            }
          }
        }
      }
    });

    logger.info('Payment captured', { paymentId, razorpayPaymentId });
    if (!payment) throw new Error('Payment not found after transaction');
    const confirmedPayment = payment as IPayment;

    if (walletCreditWonRace) {
      logger.info('[Payment] Wallet credit job committed with transaction', { paymentId });
    } else {
      logger.info('[Payment] Wallet already credited by another path (skipping)', { paymentId });
    }
    return confirmedPayment;
  } finally {
    session.endSession();
  }
}

/**
 * Retrieves a payment by its internal ID, optionally scoped to the owner.
 * @param paymentId - The internal payment ID
 * @param ownerUserId - Optional user ID to scope the query
 * @returns The payment document or null if not found
 */
export async function getPaymentStatus(paymentId: string, ownerUserId?: string): Promise<IPayment | null> {
  const query: { paymentId: string; user?: mongoose.Types.ObjectId } = { paymentId };
  if (ownerUserId) {
    if (!mongoose.isValidObjectId(ownerUserId)) throw new Error(`Invalid ownerUserId: ${ownerUserId}`);
    query.user = new mongoose.Types.ObjectId(ownerUserId);
  }
  return Payment.findOne(query);
}

/**
 * Retrieves the full audit trail for a payment from the TransactionAuditLog collection.
 * @param paymentId - The internal payment ID
 * @returns Array of audit log entries ordered chronologically
 */
export async function getPaymentAuditTrail(paymentId: string) {
  return PaymentAuditLog.find({ paymentId }).sort({ createdAt: -1 }).limit(200).lean();
}

/**
 * Retrieves completed payments for a merchant with pagination, used for settlement reporting.
 * @param merchantId - The merchant's ID
 * @param page - Page number for pagination (default: 1)
 * @param limit - Items per page, clamped to 1-100 (default: 20)
 * @returns Paginated list of completed payment records
 */
export async function getMerchantSettlements(merchantId: string, page = 1, limit = 20) {
  limit = Math.min(100, Math.max(1, limit));
  const skip = (page - 1) * limit;
  const payments = await Payment.find({
    status: 'completed',
    'metadata.merchantId': merchantId,
  })
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Payment.countDocuments({
    status: 'completed',
    'metadata.merchantId': merchantId,
  });

  return { payments, total, page, hasMore: skip + payments.length < total };
}

// ─── Monolith sync (used by webhookService) ───────────────────────────────────

/** BAK-CROSS-022 FIX: Enqueue a BullMQ job to sync payment status to the monolith. */
let _monolithSyncQueue: Queue | null = null;
function getMonolithSyncQueue(): Queue {
  if (!_monolithSyncQueue) {
    _monolithSyncQueue = new Queue('monolith-sync', {
      connection: { host: redisHost, port: redisPort },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 0 },
        removeOnFail: { age: 86400 },
      },
    });
    // See wallet-credit queue above — error listener required to prevent
    // Queue-level errors from bubbling to unhandledRejection.
    _monolithSyncQueue.on('error', (err) => {
      logger.error('[payment-service] monolith-sync Queue error (non-fatal)', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
  return _monolithSyncQueue;
}

export async function enqueueMonolithSync(data: {
  monolithUrl: string;
  orderId: string;
  status: string;
  paymentId: string;
  idempotencyKey: string;
}): Promise<void> {
  const queue = getMonolithSyncQueue();
  const token = process.env.INTERNAL_SERVICE_TOKEN || '';
  await queue.add('webhook-sync', {
    monolithUrl: data.monolithUrl,
    orderId: data.orderId,
    status: data.status,
    paymentId: data.paymentId,
    idempotencyKey: data.idempotencyKey,
    token,
  }, {
    jobId: data.idempotencyKey,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

/** Monolith sync worker — consumes webhook-sync jobs and calls the monolith endpoint. */
let _monolithSyncWorker: unknown = null;
export function startMonolithSyncWorker(): void {
  if (_monolithSyncWorker) return;
  _monolithSyncWorker = new (require('bullmq').Worker)(
    'monolith-sync',
    async (job) => {
      const { monolithUrl, orderId, status, paymentId, token } = job.data;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10000);
      try {
        const response = await fetch(`${monolithUrl}/api/internal/payments/webhook-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': token,
            'x-internal-service': 'payment-service',
          },
          body: JSON.stringify({ orderId, status, paymentId, idempotencyKey: job.id }),
          signal: ac.signal,
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Monolith sync failed: ${response.status} ${body}`);
        }
        logger.info('[MonolithSync] Payment status synced', { orderId, paymentId, status: response.status });
      } finally {
        clearTimeout(timer);
      }
    },
    {
      connection: { host: redisHost, port: redisPort },
      concurrency: 3,
    },
  );
  _monolithSyncWorker.on('completed', (job) => {
    logger.info('[MonolithSync] Job completed', { jobId: job.id });
  });
  _monolithSyncWorker.on('failed', (job, err) => {
    logger.error('[MonolithSync] Job failed', { jobId: job?.id, error: err.message });
  });
}
