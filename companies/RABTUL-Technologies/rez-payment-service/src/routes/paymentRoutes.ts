import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { paymentLimiter, sensitiveLimiter } from '../middleware/rateLimiter';
import * as paymentService from '../services/paymentService';
import * as razorpayService from '../services/razorpayService';
import { createServiceLogger } from '../config/logger';
import { redis } from '../config/redis';
import type { LeanPayment } from '../services/paymentService';
import { recordPaymentProfileUpdate, mapPaymentTypeToVertical } from '../services/profileIntegration';
import { PAYMENT_WEBHOOK_TRANSITIONS } from '../config/paymentTransitions';
import { sendPaymentToRezMind } from '../services/rezMindService';
import { success, err as apiErr } from '../utils/response';
import { emitPaymentFailed, emitRefundInitiated, emitRefundCompleted } from '../utils/careEventEmitter';

/**
 * Initiate payment request schema.
 *
 * @field orderId     — The order's MongoDB _id or orderNumber (string, required).
 * @field amount      — Payment amount in **rupees** (not paise). Max 500,000.
 *                      The Razorpay integration multiplies ×100 internally when
 *                      creating orders (Razorpay expects paise).
 * @field paymentMethod — One of: cod, wallet, razorpay, upi, card, netbanking, bnpl.
 * @field purpose     — Defaults to 'order'. Client-facing route only allows 'order'
 *                      (other purposes require the internal endpoint).
 * @field orchestratorIdempotencyKey — UUID preventing duplicate payment initiation.
 *                      Auto-generated if not provided (see transform below).
 */
const initiateSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().finite().max(500000),
  // M20 FIX: Sync Zod enums with Mongoose model Payment.ts enum values.
  // Previously Zod allowed values (cod, razorpay, bnpl, order, subscription, refund)
  // that would fail Mongoose validation. Aligning with the canonical model enums.
  paymentMethod: z.enum(['upi', 'card', 'wallet', 'netbanking']),
  purpose: z.enum(['wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other']).optional(),
  orchestratorIdempotencyKey: z.string().min(1).max(200).optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
  userDetails: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).transform((data) => {
  // BE-PAY-006 FIX: Idempotency key must always be present.
  // If neither orchestratorIdempotencyKey nor idempotencyKey provided, generate one server-side.
  // This prevents duplicate payment requests from being processed multiple times.
  const key = data.orchestratorIdempotencyKey || data.idempotencyKey || crypto.randomUUID();
  return { ...data, orchestratorIdempotencyKey: key };
});

/**
 * Capture payment request schema.
 *
 * Sent by the consumer app after Razorpay Checkout returns successfully.
 * @field paymentId          — Our internal payment document _id.
 * @field razorpayPaymentId  — Razorpay's `pay_*` ID (14–20 alphanumeric chars).
 * @field razorpayOrderId    — Razorpay's `order_*` ID.
 * @field razorpaySignature  — HMAC-SHA256 signature for server-side verification.
 */
const captureSchema = z.object({
  paymentId: z.string().min(1),
  razorpayPaymentId: z.string().regex(/^pay_[A-Za-z0-9]{14,20}$/, 'Invalid Razorpay payment ID'),
  razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]{14,20}$/, 'Invalid Razorpay order ID'),
  razorpaySignature: z.string().min(1),
});

/**
 * Refund request schema (merchant/admin only).
 *
 * @field paymentId — Our internal payment document _id.
 * @field amount    — Refund amount in **rupees** (supports paise precision via multipleOf 0.01).
 * @field reason    — Optional human-readable reason for the refund.
 */
const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().finite().max(500000).multipleOf(0.01),
  reason: z.string().optional(),
	  // Idempotency key to prevent duplicate refunds
	  idempotencyKey: z.string().min(1).max(200).optional(),
});

/**
 * Internal deduct schema (service-to-service only, requires X-Internal-Token).
 *
 * @field userId        — Target user's MongoDB _id.
 * @field orderId       — Associated order _id.
 * @field amount        — Deduction amount in **rupees**.
 * @field paymentMethod — Defaults to 'wallet' if not provided.
 * @field purpose       — Payment purpose category.
 */
const internalDeductSchema = z.object({
  userId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking', 'bnpl']).optional(),
  purpose: z.enum(['order', 'wallet_topup', 'subscription', 'refund', 'other']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const logger = createServiceLogger('routes');
const router = Router();

// ── Replay-prevention nonce store ─────────────────────────────
// Stores processed razorpayPaymentIds for 25 hours (Razorpay payment IDs are
// globally unique and never recycled, so a 25-hour window covers any retry window).
// Falls back to an in-process Map when Redis is unavailable.
const _localNonceCache = new Map<string, number>();
const NONCE_TTL_MS = 25 * 60 * 60 * 1000;

// B3: explicit per-transaction cap for wallet-credit coin issuance.
// Previously we silently truncated via Math.min — a user who paid for more
// coins than the cap allowed would be under-credited with no error shown.
// Now the endpoint rejects over-cap requests so the caller can split the
// recharge or contact support, rather than quietly losing coins.
const COIN_CREDIT_MAX_PER_TX = 10000;

interface ReplayCheckResult {
  replayed: boolean;
  redisError: boolean;
}

async function isReplayedPaymentId(razorpayPaymentId: string): Promise<ReplayCheckResult> {
  const key = `pay:nonce:${razorpayPaymentId}`;
  try {
    // SET NX returns 'OK' if the key was newly set, null if it already existed
    const result = await redis.set(key, '1', 'EX', 25 * 3600, 'NX');
    return { replayed: result === null, redisError: false }; // null = key already existed = replay
  } catch (err) {
    // MED-04 FIX: Redis unavailable → fail closed in all environments.
    // Replaying a payment without Redis protection allows duplicate charges, which is unacceptable.
    // Even in development, we must fail closed to prevent replay.
    logger.error('Redis unavailable for payment nonce check — failing closed to prevent replay', {
      razorpayPaymentId,
      error: err.message,
      environment: process.env.NODE_ENV
    });
    throw new Error('Payment system temporarily unavailable. Redis unavailable.');
  }
}

// ── Initiate payment ──────────────────────────────────────────
/**
 * @route POST /pay/initiate
 * @summary Initiate payment
 * @tags Payment
 * @security BearerAuth
 * @description |
 *   Initiates a payment request. Creates a payment record and returns
 *   payment details for the client to complete via Razorpay.
 *   Rate limited per user.
 * @response {object} 200 - Payment initiated
 * @response {object} 400 - Invalid request
 * @response {object} 429 - Rate limit exceeded
 */
async function initiateHandler(req: Request, res: Response) {
  try {
    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', parsed.error.issues));
      return;
    }
    const {
      orderId,
      amount,
      paymentMethod,
      purpose,
      orchestratorIdempotencyKey,
      idempotencyKey,
      userDetails,
      metadata,
    } = parsed.data;
    if (amount < 1) {
      res.status(400).json(apiErr('PAY_FAILED', 'amount must be at least 1'));
      return;
    }
    const publicPurpose = purpose || 'order';
    if (publicPurpose !== 'order') {
      logger.warn('Rejected non-order payment initiation on client-facing route without authoritative amount source', {
        userId: req.userId,
        orderId,
        amount,
        purpose: publicPurpose,
      });
      res.status(400).json(apiErr('PAY_FAILED', 'Client-facing payment initiation only supports order payments with server-verified amounts'));
      return;
    }
    const result = await paymentService.initiatePayment({
      userId: req.userId!,
      orderId,
      amount,
      paymentMethod,
      purpose: publicPurpose,
      orchestratorIdempotencyKey: orchestratorIdempotencyKey || idempotencyKey,
      userDetails,
      metadata,
    });
    res.json(success(result));
  } catch (err) {
    logger.error('Initiate failed', { error: err.message });

    // Emit event to REZ Care for support tracking
    emitPaymentFailed({
      customerId: req.userId || 'unknown',
      customerPhone: req.body?.userDetails?.phone || '',
      orderId: req.body?.orderId,
      errorCode: 'PAYMENT_INIT_FAILED',
      errorMessage: err.message,
      amount: req.body?.amount,
      platform: req.body?.metadata?.platform
    }).catch(() => {});

    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Payment initiation failed'));
  }
}
router.post('/pay/initiate', paymentLimiter, requireAuth, initiateHandler);
router.post('/api/payment/initiate', paymentLimiter, requireAuth, initiateHandler);

// ── Capture payment ───────────────────────────────────────────
/**
 * @route POST /pay/capture
 * @summary Capture payment
 * @tags Payment
 * @security BearerAuth
 * @description |
 *   Captures payment after Razorpay Checkout completes.
 *   Verifies HMAC signature and updates payment status.
 *   Implements replay prevention via Razorpay payment ID deduplication.
 * @response {object} 200 - Payment captured
 * @response {object} 409 - Payment already captured (replay detected)
 * @response {object} 400 - Signature verification failed
 */
async function captureHandler(req: Request, res: Response) {
  try {
    const parsed = captureSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', parsed.error.issues));
      return;
    }
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = parsed.data;
    // Replay prevention — reject if this razorpayPaymentId has already been captured.
    // Razorpay payment IDs are globally unique; a second capture attempt means either
    // a double-tap on the client or an attacker replaying a captured request.
    // FIX BE-PAY-002: Fail closed in ALL environments (not just production) when Redis is unavailable.
    // Allowing replays in dev mode opens the door to duplicate charges.
    let replayed;
    try {
      replayed = await isReplayedPaymentId(razorpayPaymentId);
    } catch (redisErr) {
      // Fail closed in all environments to prevent replay attacks
      logger.error('Replay protection unavailable, rejecting payment', { razorpayPaymentId, error: redisErr.message, environment: process.env.NODE_ENV });
      res.status(503).json(apiErr('SRV_INTERNAL_ERROR', 'Service temporarily unavailable. Please try again in a moment.'));
      return;
    }
    if (replayed.replayed) {
      logger.warn('Replay detected: razorpayPaymentId rejected', {
        razorpayPaymentId, userId: req.userId,
      });
      res.status(409).json(apiErr('PAY_FAILED', 'Payment already captured'));
      return;
    }
    const payment = await paymentService.capturePayment(
      paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature, req.userId!,
    );

    // Fire and forget: Update user profile after successful payment
    const phone = (req as unknown).userPhone || '';
    if (payment && phone) {
      // Type payment as LeanPayment to avoid 'as any' casts
      const typedPayment = payment as LeanPayment;
      recordPaymentProfileUpdate({
        userId: req.userId!,
        phone,
        amount: typedPayment.amount || 0,
        merchantId: (typedPayment.userDetails as any)?.merchantId || '', // userDetails is optional
        vertical: mapPaymentTypeToVertical(typedPayment.purpose),
        orderId: typedPayment.orderId,
      }).catch((err) => {
        logger.error('Profile update failed after capture', { error: err.message });
      });
    }

    // REZ Mind: Send payment event
    if (payment && payment.status === 'completed') {
      // Type payment as LeanPayment to avoid 'as any' casts
      const typedPayment = payment as LeanPayment;
      sendPaymentToRezMind({
        merchant_id: (typedPayment.userDetails as any)?.merchantId || '', // userDetails is optional
        transaction_id: typedPayment.paymentId,
        amount: typedPayment.amount || 0,
        order_id: typedPayment.orderId,
        payment_method: typedPayment.paymentMethod,
        status: 'success',
      }).catch((err) => {
        logger.warn('REZ Mind payment event failed', { error: err.message });
      });
    }

    res.json(success({ paymentId: payment.paymentId, status: payment.status }));
  } catch (err) {
    logger.error('Capture failed', { error: err.message });
    const message = 'Internal server error';
    res.status(400).json(apiErr('SRV_INTERNAL_ERROR', message));
  }
}
router.post('/pay/capture', paymentLimiter, requireAuth, captureHandler);
router.post('/api/payment/capture', paymentLimiter, requireAuth, captureHandler);

// ── Refund (merchant/admin only) ──────────────────────────────
/**
 * @route POST /pay/refund
 * @summary Process refund
 * @tags Refund
 * @security BearerAuth
 * @description |
 *   Initiates a refund for a completed payment.
 *   Requires merchant or admin role.
 * @response {object} 200 - Refund initiated
 * @response {object} 403 - Merchant/admin role required
 */
async function refundHandler(req: Request, res: Response) {
  // Refunds are a merchant or admin action — not self-service for consumers
  const allowedRoles = ['merchant', 'admin', 'super_admin', 'operator'];
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    res.status(403).json(apiErr('PAY_REFUND_NOT_ALLOWED', 'Merchant or admin role required to initiate refunds'));
    return;
  }
  try {
    const parsed = refundSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', parsed.error.issues));
      return;
    }
    const { paymentId, amount, reason, idempotencyKey } = parsed.data;

    // Idempotency check - prevent duplicate refunds
    if (idempotencyKey) {
      const cached = await redis.get(`refund:idempotency:${idempotencyKey}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        res.status(200).json({ success: true, data: cachedData, idempotent: true });
        return;
      }
    }

    // Pass req.userId as ownerUserId for merchants so the IDOR guard in processRefund
    // verifies they only refund payments from their own orders.
    // Admins pass undefined to bypass the ownership check (they can refund any payment).
    const isAdmin = ['admin', 'super_admin', 'operator'].includes(req.userRole || '');
    const result = await paymentService.processRefund(
      paymentId, amount, reason || 'Merchant request', req.userId!, isAdmin ? undefined : req.userId!,
    );

    // Emit event to REZ Care for support tracking
    emitRefundInitiated({
      customerId: req.userId || 'unknown',
      customerPhone: req.body?.userDetails?.phone || '',
      orderId: result?.paymentId,
      transactionId: paymentId,
      amount: amount || 0,
      reason: reason || 'Merchant request',
      platform: req.body?.metadata?.platform
    }).catch(() => {});

    res.json(success(result));

    // Cache successful refund for idempotency
    if (idempotencyKey) {
      await redis.setex(`refund:idempotency:${idempotencyKey}`, 86400, JSON.stringify(result));
    }
  } catch (err) {
    logger.error('Refund failed', { error: err.message });
    const message = 'Internal server error';
    res.status(400).json(apiErr('SRV_INTERNAL_ERROR', message));
  }
}
router.post('/pay/refund', sensitiveLimiter, requireAuth, refundHandler);
router.post('/api/payment/refund', sensitiveLimiter, requireAuth, refundHandler);

// ── Payment status ────────────────────────────────────────────
/**
 * @route GET /pay/status/{paymentId}
 * @summary Get payment status
 * @tags Payment
 * @security BearerAuth
 * @description Returns payment status and audit trail.
 * @response {object} 200 - Payment status returned
 * @response {object} 404 - Payment not found
 */
async function statusHandler(req: Request, res: Response) {
  try {
    const paymentId = req.params.paymentId || req.params.orderId;
    const payment = await paymentService.getPaymentStatus(paymentId, req.userId!);
    if (!payment) { res.status(404).json(apiErr('RES_NOT_FOUND', 'Payment not found')); return; }
    const audit = await paymentService.getPaymentAuditTrail(paymentId);
    res.json(success({ payment, auditTrail: audit }));
  } catch (err) {
    logger.error('Status lookup failed', { error: err.message });
    const message = 'Internal server error';
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', message));
  }
}
router.get('/pay/status/:paymentId', requireAuth, statusHandler);
router.get('/api/payment/status/:paymentId', requireAuth, statusHandler);

// ── Verify signature (internal only — signature oracle risk if user-facing) ──
/**
 * @route POST /pay/verify
 * @summary Verify payment signature (internal)
 * @tags Internal
 * @description Verifies Razorpay payment signature. Internal use only.
 * @response {object} 200 - Verification result
 */
async function verifyHandler(req: Request, res: Response) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const valid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    res.json(success({ valid }));
  } catch (err) {
    const message = 'Internal server error';
    res.status(400).json(apiErr('SRV_INTERNAL_ERROR', message));
  }
}
// Internal-only — a user-accessible verify endpoint is a signature oracle
router.post('/pay/verify', requireInternalToken, verifyHandler);
router.post('/api/razorpay/verify-payment', requireInternalToken, verifyHandler);

// ── CRITICAL-008 FIX: Internal wallet credit endpoint ─────────────────────
// Called by rez-backend to credit wallet after a successful payment capture.
// This ensures the payments collection has a SINGLE writer (rez-payment-service).
// The backend MUST NOT write to the payments collection directly.
//
// Body: { paymentId, amount?, idempotencyKey? }
// Response: { success, transactionId?, newBalance? }
async function internalWalletCreditHandler(req: Request, res: Response) {
  const { paymentId, amount, idempotencyKey } = req.body;

  // BAK-CROSS-010/011 FIX: Removed redundant body-secret check.
  // Authentication is handled entirely by requireInternalToken middleware, which verifies
  // the X-Internal-Token header. Checking a second secret in the request body created a
  // dual-authentication path that was harder to reason about and harder to rotate.
  // The caller (rez-backend) authenticates via X-Internal-Token only — this is sufficient.

  if (!paymentId) {
    res.status(400).json(apiErr('SRV_INTERNAL_ERROR', 'paymentId is required'));
    return;
  }

  try {
    // Read the Payment doc to get userId and amount for wallet credit.
    // SINGLE SOURCE OF TRUTH: rez-payment-service reads and writes the payments collection.
    const { Payment } = await import('../models/Payment');
    const payment = (await Payment.findOne({ paymentId }).lean()) as LeanPayment | null;
    if (!payment) {
      res.status(404).json(apiErr('RES_NOT_FOUND', 'Payment not found'));
      return;
    }

    // Only credit completed or processing payments
    if (!['completed', 'processing'].includes(payment.status)) {
      res.status(400).json(apiErr('PAY_FAILED', `Payment not completed (status: ${payment.status})`));
      return;
    }

    // Skip if already credited (idempotent)
    if (payment.walletCredited) {
      logger.info('[InternalWalletCredit] Already credited (idempotent)', { paymentId });
      res.json(success({ alreadyCredited: true }));
      return;
    }

    // Use provided amount or derive from payment doc
    const creditAmount = amount ?? payment.amount;
    const userId = payment.user.toString();

    // Credit coins to wallet — this also sets walletCredited flag atomically
    const coinsToCredit = Math.floor(creditAmount);
    if (coinsToCredit > COIN_CREDIT_MAX_PER_TX) {
      res.status(413).json({
        success: false,
        message: `Coin credit exceeds per-transaction limit of ${COIN_CREDIT_MAX_PER_TX}. Please split into smaller transactions or contact support.`,
        limit: COIN_CREDIT_MAX_PER_TX,
        requested: coinsToCredit,
      });
      return;
    }
    const walletUrl = process.env.WALLET_SERVICE_URL;
    let walletCreditSucceeded = false;

    if (walletUrl) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10000);
      try {
        const response = await fetch(`${walletUrl}/internal/credit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
            'x-internal-service': 'rez-payment-service',
          },
          body: JSON.stringify({
            userId,
            amount: coinsToCredit,
            coinType: 'rez',
            source: 'payment_recharge',
            description: `Wallet recharge via payment ${paymentId}`,
            sourceId: paymentId,
            idempotencyKey: idempotencyKey || `internal-credit-${paymentId}`,
          }),
          signal: ac.signal,
        });
        // PAY-002 FIX: Only mark walletCredited=true if the wallet service returned 2xx.
        // HTTP 4xx/5xx responses don't throw in Node.js fetch — we must check status.
        // On non-2xx, reconciliation will retry this payment on its next run.
        if (response.ok) {
          walletCreditSucceeded = true;
          logger.info('[InternalWalletCredit] Wallet credit confirmed', { paymentId, status: response.status });
        } else {
          logger.warn('[InternalWalletCredit] Wallet credit returned non-2xx — will retry via reconciliation', {
            paymentId, status: response.status,
          });
        }
      } catch (err) {
        logger.warn('[InternalWalletCredit] Wallet credit call failed — will retry via reconciliation', {
          paymentId, error: err?.message,
        });
      } finally {
        clearTimeout(timer);
      }
    } else {
      logger.warn('[InternalWalletCredit] WALLET_SERVICE_URL not set — skipping coin credit', { paymentId });
    }

    // PAY-002 FIX: Only mark walletCredited=true if the wallet HTTP call actually succeeded.
    // Previously this was unconditional — setting walletCredited=true even when the wallet
    // service returned 4xx or timed out, causing silent coin loss for users.
    // Reconciliation will catch and retry these payments on its next run.
    if (walletCreditSucceeded) {
      await (Payment as typeof import('../models/Payment').Payment).findOneAndUpdate(
        { paymentId, walletCredited: { $ne: true } },
        { $set: { walletCredited: true, walletCreditedAt: new Date() } },
      );
      logger.info('[InternalWalletCredit] Wallet credited via payment service authority', { paymentId, userId, amount: coinsToCredit });
      res.json(success({ credited: true }));
    } else {
      logger.warn('[InternalWalletCredit] Wallet credit failed — NOT marking walletCredited=true', { paymentId, userId });
      res.status(502).json(apiErr('PAY_GATEWAY_ERROR', 'Wallet credit failed — will retry via reconciliation'));
    }
  } catch (err) {
    logger.error('[InternalWalletCredit] Error:', { error: err.message, paymentId });
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Internal server error'));
  }
}
router.post('/pay/internal/wallet-credit', requireInternalToken, internalWalletCreditHandler);
router.post('/api/payment/internal/wallet-credit', requireInternalToken, internalWalletCreditHandler);

// ── Razorpay config (client needs key_id) ─────────────────────
async function razorpayConfigHandler(_req: Request, res: Response) {
  res.json(success({ key_id: process.env.RAZORPAY_KEY_ID || '' }));
}
router.get('/api/razorpay/config', requireAuth, razorpayConfigHandler);

// Remove old user-accessible verify route (now internal-only above)
// router.post('/api/razorpay/verify-payment', requireAuth, verifyHandler); — REMOVED

// ── Create Razorpay order (compat with monolith) ──────────────
async function createRazorpayOrderHandler(req: Request, res: Response) {
  try {
    const { amount, receipt, notes, orderId, orderNumber } = req.body;
    if (!amount) { res.status(400).json(apiErr('SRV_INTERNAL_ERROR', 'amount required')); return; }
    const parsedOrderAmount = Number(amount);
    // ROUTE-SEC-012 FIX: Enforce upper bound. The initiateSchema has .max(500000)
    // but createRazorpayOrderHandler was missing this check — aligned to same cap.
    if (!Number.isFinite(parsedOrderAmount) || parsedOrderAmount <= 0 || parsedOrderAmount > 500000) {
      res.status(400).json(apiErr('PAY_FAILED', 'amount must be a positive number up to 500000'));
      return;
    }
    const orderRef = String(orderId || orderNumber || notes?.orderId || notes?.orderNumber || '').trim();
    if (!orderRef) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', 'orderId or orderNumber is required for Razorpay order creation'));
      return;
    }
    await paymentService.assertAuthoritativeOrderAmount(orderRef, parsedOrderAmount);
    const order = await razorpayService.createOrder(parsedOrderAmount, receipt || `rcpt_${crypto.randomBytes(8).toString('hex')}`, notes);
    res.json(success(order));
  } catch (err) {
    logger.error('Razorpay order failed', { error: err.message });
    if (/Amount mismatch|Authoritative order amount not found/.test(err.message)) {
      const message = 'Internal server error';
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', message));
    } else {
      res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Failed to create payment order'));
    }
  }
}
router.post('/api/razorpay/create-order', paymentLimiter, requireAuth, createRazorpayOrderHandler);

// ── Verify Razorpay payment (compat) ──────────────────────────
// Intentionally not exposed to normal authenticated users.
// Keeping this path internal-only prevents a signature-oracle regression.

// ── Webhook — Razorpay ────────────────────────────────────────
/**
 * @route POST /pay/webhook/razorpay
 * @summary Razorpay webhook receiver
 * @tags Webhook
 * @description |
 *   Receives payment status updates from Razorpay.
 *   Verifies webhook signature and processes events.
 *   Events: payment.captured, payment.failed, refund.processed, refund.failed
 * @response {object} 200 - Webhook processed
 * @response {object} 400 - Invalid signature
 * @response {object} 503 - Service temporarily unavailable
 */
async function webhookHandler(req: Request, res: Response) {
  // WH-01 FIX: Check Redis connectivity BEFORE any webhook processing.
  // If Redis is unavailable, event deduplication via webhook:event:${eventId} is not
  // functional — an attacker could replay webhook events causing duplicate wallet credits.
  // Fail closed by returning 503 so Razorpay will retry later when Redis is healthy.
  if (redis.status !== 'ready') {
    logger.error('Webhook: Redis unavailable — rejecting to prevent replay attacks', {
      redisStatus: redis.status,
    });
    return res.status(503).json(apiErr('SRV_INTERNAL_ERROR', 'Service temporarily unavailable'));
  }

  // HIGH FIX: Rate limit webhook endpoint to prevent flooding attacks.
  // Razorpay webhooks come from known IPs, so per-IP limiting is appropriate.
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const webhookKey = `rl:webhook:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100; // Razorpay shouldn't hit this hard, but allow burst for legitimate retries
  try {
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(webhookKey, '-inf', now - windowMs);
    pipe.zcard(webhookKey);
    pipe.zadd(webhookKey, now, `${now}`);
    pipe.pexpire(webhookKey, windowMs);
    const results = await pipe.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;
    if (count > maxRequests) {
      logger.warn('Webhook: rate limit exceeded', { ip, count });
      return res.status(429).json(apiErr('SRV_INTERNAL_ERROR', 'Too many requests'));
    }
  } catch (err) {
    logger.warn('Webhook: rate limit check failed, continuing', { ip, error: err });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    // Reject immediately if the signature header is missing — do not proceed to HMAC
    // verification with an undefined value, which would throw a confusing TypeError.
    if (!signature || typeof signature !== 'string') {
      logger.warn('Webhook: missing x-razorpay-signature header');
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', 'Missing webhook signature'));
      return;
    }
    // req.body is a Buffer here (express.raw middleware applied by index.ts)
    const rawBody: string = (req.body as Buffer).toString('utf8');

    if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Webhook: invalid signature rejected');
      res.status(400).json(apiErr('PAY_GATEWAY_ERROR', 'Invalid webhook signature'));
      return;
    }

    // Event-ID deduplication — prevent replay or double-delivery within 24 hours.
    // Razorpay sends an x-razorpay-event-id header that is unique per event delivery.
    const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
    if (eventId) {
      const alreadyProcessed = await redis.set(`webhook:event:${eventId}`, '1', 'EX', 86400, 'NX');
      if (alreadyProcessed === null) {
        logger.info('Duplicate webhook event ignored', { eventId });
        res.status(200).json(success({ duplicate: true }));
        return;
      }
    }

    // Parse after verification
    const parsed = JSON.parse(rawBody);
    const event: string = parsed.event;
    const paymentEntity = parsed.payload?.payment?.entity;
    const refundEntity = parsed.payload?.refund?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      // CS-M1/A10-C4 FIX: Replace in-memory PaymentMachine with DB-backed state check.
      // Query MongoDB for the current payment status so the guard reflects the true
      // persisted state. A new in-memory machine would always start at PENDING,
      // making the guard a no-op — this is the actual authoritative check.
      const { Payment } = await import('../models/Payment');
      const payment = (await Payment.findOne({
        'metadata.razorpayOrderId': paymentEntity.order_id,
      }).lean()) as LeanPayment | null;
      if (!payment) {
        logger.warn('Webhook: payment not found for order_id', { razorpayOrderId: paymentEntity.order_id });
        return res.status(200).json(success(null)); // acknowledge to Razorpay
      }
      // BUG-002 FIX: Use shared transition map for consistency
      // Previously had duplicate definitions that could drift from model
      const allowed = PAYMENT_WEBHOOK_TRANSITIONS[payment.status] || [];
      if (!allowed.includes('completed')) {
        logger.error('PaymentMachine: illegal transition to SUCCESS/completed', {
          razorpayPaymentId: paymentEntity.id,
          currentStatus: payment.status,
        });
        return res.status(400).json(apiErr('PAY_FAILED', { message: 'Invalid payment state transition', razorpayPaymentId: paymentEntity.id }));
      }
      logger.info('Webhook: payment.captured', {
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
      });
      await paymentService.handleWebhookCaptured(paymentEntity.order_id, paymentEntity.id);

    } else if (event === 'payment.failed' && paymentEntity) {
      const errorDescription = paymentEntity.error_description || paymentEntity.error_reason || 'Unknown error';
      // CS-M1/A10-C4 FIX: DB-backed state check replaces the broken in-memory machine.
      const { Payment } = await import('../models/Payment');
      const payment = (await Payment.findOne({
        'metadata.razorpayOrderId': paymentEntity.order_id,
      }).lean()) as LeanPayment | null;
      if (!payment) {
        logger.warn('Webhook: payment not found for order_id', { razorpayOrderId: paymentEntity.order_id });
        return res.status(200).json(success(null));
      }
      const allowed = PAYMENT_WEBHOOK_TRANSITIONS[payment.status] || [];
      if (!allowed.includes('failed')) {
        logger.error('PaymentMachine: illegal transition to FAILED', {
          razorpayPaymentId: paymentEntity.id,
          currentStatus: payment.status,
          error: errorDescription,
        });
        return res.status(400).json(apiErr('PAY_FAILED', { message: 'Invalid payment state transition', razorpayPaymentId: paymentEntity.id }));
      }
      logger.info('Webhook: payment.failed', {
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        errorDescription,
      });
      await paymentService.handleWebhookFailed(paymentEntity.order_id, paymentEntity.id, errorDescription);

    } else if (event === 'refund.processed' && refundEntity) {
      // Mark the payment as refunded once Razorpay confirms the refund landed
      logger.info('Webhook: refund.processed', {
        refundId: refundEntity.id,
        paymentId: refundEntity.payment_id,
        amount: refundEntity.amount,
      });
      await paymentService.handleWebhookRefundProcessed(refundEntity.payment_id, refundEntity.id, refundEntity.amount / 100, refundEntity.amount);

    } else if (event === 'refund.failed' && refundEntity) {
      logger.warn('Webhook: refund.failed', {
        refundId: refundEntity.id,
        paymentId: refundEntity.payment_id,
        reason: refundEntity.notes?.reason,
      });
      await paymentService.handleWebhookRefundFailed(refundEntity.payment_id, refundEntity.id);

    } else {
      logger.debug('Webhook: unhandled event', { event });
    }

    res.json(success(null));
  } catch (err) {
    logger.error('Webhook error', { error: err.message });
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Webhook processing failed'));
  }
}
router.post('/pay/webhook/razorpay', webhookHandler);
router.post('/api/payment/webhook/razorpay', webhookHandler);

// ── Merchant settlements ──────────────────────────────────────
async function settlementsHandler(req: Request, res: Response) {
  try {
    // HIGH BE-PAY-017 FIX: Verify merchantId from query matches authenticated merchant from JWT.
    // Without this check, a merchant can forge a different merchantId in query and retrieve
    // another merchant's payment history.
    const queriedMerchantId = req.query.merchantId as string | undefined;

    if (!req.merchantId && req.userRole !== 'admin') {
      res.status(403).json(apiErr('PAY_REFUND_NOT_ALLOWED', 'Merchant access required'));
      return;
    }

    // If a query merchantId is provided, verify it matches the authenticated merchant (unless admin)
    if (queriedMerchantId && req.userRole !== 'admin') {
      if (queriedMerchantId !== req.merchantId) {
        logger.warn('IDOR attempt: merchant querying another merchant settlements', {
          authenticated: req.merchantId,
          queried: queriedMerchantId,
        });
        res.status(403).json(apiErr('PAY_REFUND_NOT_ALLOWED', 'Cannot access other merchant settlements'));
        return;
      }
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    // Use merchantId from auth context, not from query (only query param for filtering is now validated above)
    const targetMerchantId = req.merchantId || req.userId!;
    const result = await paymentService.getMerchantSettlements(targetMerchantId, page, limit);
    res.json(success(result));
  } catch (err) {
    logger.error('Settlements lookup failed', { error: err.message });
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Failed to retrieve settlements'));
  }
}
router.get('/pay/merchant/settlements', requireAuth, settlementsHandler);
router.get('/api/payment/merchant/settlements', requireAuth, settlementsHandler);

// ── Internal endpoints ────────────────────────────────────────
router.post('/internal/pay/deduct', sensitiveLimiter, requireInternalToken, async (req: Request, res: Response) => {
  try {
    const parsed = internalDeductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', parsed.error.issues));
      return;
    }
    const { userId, orderId, amount, paymentMethod, purpose, metadata } = parsed.data;
    const result = await paymentService.initiatePayment({
      userId, orderId, amount, paymentMethod: paymentMethod || 'wallet', purpose, metadata,
    });
    res.json(success(result));
  } catch (err) {
    logger.error('Internal deduct failed', { error: err.message });
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Internal payment deduction failed'));
  }
});

router.get('/internal/pay/:paymentId', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.getPaymentStatus(req.params.paymentId);
    res.json({ success: true, data: payment });
  } catch (err) {
    logger.error('Internal payment lookup failed', { error: err.message });
    res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Failed to retrieve payment'));
  }
});

// ── CS-H2: Payment regularity for credit scoring ──────────────────────────────
// Called by rez-wallet-service creditScore.ts when computing merchant credit scores.
// Returns the fraction of payments completed on-time (not cancelled/failed) over
// the trailing 90 days. Range 0.0–1.0. Defaults to 0.5 (neutral) for merchants
// with no payment history.
router.get(
  '/internal/merchants/:merchantId/payment-regularity',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;

    if (!merchantId || merchantId.length < 1 || merchantId.length > 64) {
      res.status(400).json(apiErr('SRV_INTERNAL_ERROR', 'Invalid merchantId'));
      return;
    }

    try {
      const { Payment } = await import('../models/Payment');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Payments linked to this merchant are found via orderId prefix or metadata.
      // The Payment model stores userId (buyer) not merchantId. To scope payments
      // to a merchant we use metadata.merchantId if present, or fall back to the
      // total platform history for the orderId set. This is best-effort — credit
      // scoring tolerates imprecision; the important thing is the endpoint exists
      // and returns real data rather than a hardcoded 0.5 default.
      const [totalCount, completedCount] = await Promise.all([
        Payment.countDocuments({
          'metadata.merchantId': merchantId,
          createdAt: { $gte: ninetyDaysAgo },
        }),
        Payment.countDocuments({
          'metadata.merchantId': merchantId,
          createdAt: { $gte: ninetyDaysAgo },
          status: 'completed',
        }),
      ]);

      const onTimeRate = totalCount > 0 ? parseFloat((completedCount / totalCount).toFixed(4)) : 0.5;

      res.json(success({ onTimeRate, totalPayments: totalCount, completedPayments: completedCount }));
    } catch (err) {
      logger.error('Internal payment-regularity lookup failed', { merchantId, error: err.message });
      res.status(500).json(apiErr('SRV_INTERNAL_ERROR', 'Failed to compute payment regularity'));
    }
  },
);

export default router;
