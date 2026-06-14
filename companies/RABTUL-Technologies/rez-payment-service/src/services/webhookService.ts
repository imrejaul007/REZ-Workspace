/**
 * Webhook Service — processes Razorpay webhook events.
 *
 * PAY-019 FIX: Split from paymentService.ts (was ~1,259 lines).
 *
 * Covers:
 *   - payment.captured  → credit wallet, sync to monolith
 *   - payment.failed    → mark payment failed
 *   - refund.processed  → update refund status, emit to monolith
 *   - refund.failed     → mark refund_failed, emit to monolith
 */
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import { Payment, IPayment, PaymentStatus } from '../models/Payment';
import { PaymentAuditLog } from '../models/TransactionAuditLog';
import * as razorpay from './razorpayService';
import { createServiceLogger } from '../config/logger';
import { redis, redisHost, redisPort } from '../config/redis';
import { enqueueMonolithSync } from './paymentService';

// Re-export PaymentMetadata for callers that import from webhookService
export type { PaymentMetadata } from './paymentService';

const logger = createServiceLogger('webhook-service');

// Singleton queue for wallet credit (used inside transactions)
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
    _walletCreditQueue.on('error', (err) => {
      logger.error('[webhook-service] wallet-credit Queue error (non-fatal)', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
  return _walletCreditQueue;
}

/** PAY-005 FIX: Emit refund event to the monolith via internal endpoint.
 * Retry with exponential backoff — refund notifications must reach the monolith
 * even under temporary network partitions or rate limiting.
 */
async function emitRefundEvent(data: {
  merchantId?: string;
  orderId: string;
  orderNumber?: string;
  paymentId: string;
  refundId: string;
  amount: number;
  status: 'refund_processed' | 'refund_failed' | 'refund_disputed';
}): Promise<void> {
  const monolithUrl = process.env.MONOLITH_URL;
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!monolithUrl) {
    logger.error('[RefundEvent] MONOLITH_URL is not set — refund event will NOT be emitted', { data });
    return;
  }
  if (!internalSecret) {
    logger.error('[RefundEvent] INTERNAL_WEBHOOK_SECRET is not set', { orderId: data.orderId, refundId: data.refundId });
    return;
  }

  const maxAttempts = 3;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    try {
      const response = await fetch(`${monolithUrl}/api/internal/payments/refund-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': internalSecret,
        },
        body: JSON.stringify({ ...data }),
        signal: ac.signal,
      });
      clearTimeout(timer);
      if (response.ok) {
        logger.info('[RefundEvent] Refund event emitted to monolith', {
          orderId: data.orderId,
          refundId: data.refundId,
          status: data.status,
        });
        return;
      }
      if (response.status >= 500 && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      logger.warn('[RefundEvent] Refund event returned non-OK status', {
        status: response.status,
        orderId: data.orderId,
        refundId: data.refundId,
      });
      return;
    } catch (err) {
      lastError = err;
      clearTimeout(timer);
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        logger.warn('[RefundEvent] Retrying refund emit', { attempt, maxAttempts, error: err?.message });
      }
    }
  }
  logger.error('[RefundEvent] Failed to emit refund event after all retries', {
    orderId: data.orderId,
    refundId: data.refundId,
    error: lastError?.message,
  });
}

// Re-export emitRefundEvent so it can be tested in isolation
export { emitRefundEvent };

/**
 * handleWebhookCaptured — called when Razorpay fires payment.captured.
 *
 * Looks up the Payment by its Razorpay order ID stored in metadata, then
 * applies the same transactional capture logic as capturePayment(). Safe to
 * call multiple times — idempotent if already completed.
 */
/**
 * Handles the Razorpay webhook for captured payments. Verifies the capture directly with
 * Razorpay before crediting the wallet (prevents fake webhook injection).
 * @param razorpayOrderId - The Razorpay order ID
 * @param razorpayPaymentId - The Razorpay payment ID
 */
export async function handleWebhookCaptured(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<void> {
  // HIGH BE-PAY-009 FIX: Verify payment was actually captured by Razorpay before crediting wallet.
  // Without this check, a malicious actor with the webhook secret could craft a webhook
  // claiming a payment was captured without actual payment to Razorpay.
  let verifiedAmount: number | null = null;
  try {
    const razorpayPayment = await razorpay.getPaymentDetails(razorpayPaymentId);
    if (!razorpayPayment || razorpayPayment.status !== 'captured') {
      logger.warn('Webhook capture: Razorpay verification failed — payment not captured', {
        razorpayPaymentId,
        razorpayStatus: razorpayPayment?.status,
      });
      return;
    }
    verifiedAmount = razorpayPayment.amount / 100;
  } catch (err) {
    logger.error('Webhook capture: Failed to verify payment with Razorpay', { error: err.message });
    return;
  }

  const session = await mongoose.startSession();
  let capturedPayment: IPayment | null = null;
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        'metadata.razorpayOrderId': razorpayOrderId,
      }).session(session);

      if (!payment) {
        logger.warn('Webhook capture: payment not found', { razorpayOrderId });
        return;
      }

      if (verifiedAmount !== null && Math.abs(verifiedAmount - payment.amount) > 0.01) {
        logger.warn('Webhook capture: Amount mismatch between Razorpay and our records', {
          razorpayPaymentId,
          razorpayAmount: verifiedAmount,
          recordAmount: payment.amount,
        });
        return;
      }

      if (payment.status === 'completed') {
        logger.info('Webhook capture: already completed (idempotent)', { paymentId: payment.paymentId });
        return;
      }

      const credited = await (Payment.findOneAndUpdate(
        { _id: payment._id, walletCredited: { $ne: true } },
        { $set: { walletCredited: true, walletCreditedAt: new Date() } },
        { session, new: true },
      ) as unknown as Promise<IPayment | null>);
      capturedPayment = credited;

      const prevStatus = payment.status;
      payment.status = PaymentStatus.COMPLETED as PaymentStatus;
      payment.completedAt = new Date();
      payment.expiresAt = undefined;
      payment.gatewayResponse = {
        gateway: 'razorpay',
        transactionId: razorpayPaymentId,
        timestamp: new Date(),
        source: 'webhook',
      };
      await payment.save({ session });

      await PaymentAuditLog.create(
        [{
          action: 'capture',
          paymentId: payment.paymentId,
          userId: payment.user.toString(),
          amount: payment.amount,
          previousStatus: prevStatus,
          newStatus: 'completed',
          gatewayResponse: { razorpayPaymentId, razorpayOrderId, source: 'webhook' },
        }],
        { session },
      );

      // FIX: Enqueue BullMQ job INSIDE the transaction to prevent race condition.
      // If the job enqueue fails, the transaction rolls back and walletCredited=false.
      // This guarantees atomicity: either both succeed or both fail.
      if (credited) {
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
              logger.info('[Webhook] Wallet credit job enqueued inside transaction', {
                paymentId: payment.paymentId,
                coins: coinsToCredit,
              });
            }
          }
        }
      }

      logger.info('Webhook capture: payment marked completed', {
        paymentId: payment.paymentId,
        razorpayPaymentId,
      });
    });

    const cp = capturedPayment as IPayment | null;
    if (cp) {
      if (cp.walletCredited) {
        logger.info('[Webhook] Wallet credit job committed with transaction', { paymentId: cp.paymentId });
      } else {
        logger.info('[Webhook] Wallet already credited by another path (skipping)', { paymentId: cp.paymentId });
      }

      // BAK-CROSS-022 FIX: Replace fire-and-forget fetch with BullMQ job with exponential backoff.
      const monolithUrl = process.env.MONOLITH_URL;
      if (monolithUrl) {
        const orderId = (cp.metadata as { orderId?: string })?.orderId ?? cp.orderId?.toString();
        if (orderId) {
          const monolithSyncJobId = `monolith-sync:${orderId}:${razorpayPaymentId}`;
          await enqueueMonolithSync({
            monolithUrl,
            orderId,
            status: 'completed',
            paymentId: razorpayPaymentId,
            idempotencyKey: monolithSyncJobId,
          }).catch((err) =>
            logger.warn('Failed to enqueue monolith sync job — will reconcile: ' + err?.message),
          );
        }
      }
    }
  } finally {
    session.endSession();
  }
}

/**
 * handleWebhookFailed — called when Razorpay fires payment.failed.
 *
 * Marks the Payment as failed. Idempotent — skips if already in a terminal state.
 */
/**
 * Handles the Razorpay webhook for failed payments. Marks the payment as failed.
 * Idempotent — skips if the payment is already in a terminal state.
 * @param razorpayOrderId - The Razorpay order ID
 * @param failureCode - The Razorpay failure reason code
 * @param failureDescription - Human-readable failure description
 */
export async function handleWebhookFailed(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  errorDescription?: string,
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        'metadata.razorpayOrderId': razorpayOrderId,
      }).session(session);

      if (!payment) {
        logger.warn('Webhook failed: payment not found', { razorpayOrderId });
        return;
      }

      const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
      if (terminalStates.includes(payment.status)) {
        logger.info('Webhook failed: already in terminal state (idempotent)', {
          paymentId: payment.paymentId,
          status: payment.status,
        });
        return;
      }

      const prevStatus = payment.status;
      payment.status = PaymentStatus.FAILED as PaymentStatus;
      payment.failedAt = new Date();
      payment.failureReason = errorDescription || 'Payment failed via Razorpay webhook';
      await payment.save({ session });

      await PaymentAuditLog.create(
        [{
          action: 'fail',
          paymentId: payment.paymentId,
          userId: payment.user.toString(),
          amount: payment.amount,
          previousStatus: prevStatus,
          newStatus: 'failed',
          gatewayResponse: { razorpayPaymentId, razorpayOrderId, errorDescription },
        }],
        { session },
      );

      logger.warn('Webhook failed: payment marked failed', {
        paymentId: payment.paymentId,
        errorDescription,
      });
    });
  } finally {
    session.endSession();
  }
}

/**
 * handleWebhookRefundProcessed — called when Razorpay fires refund.processed.
 *
 * Marks the payment status as 'refunded' once Razorpay confirms the funds landed.
 * Idempotent — skips if already in 'refunded' state.
 * MISS-01/03: Emits refund event to the monolith after committing the transaction.
 * @param razorpayPaymentId - The Razorpay payment ID
 * @param refundId - The Razorpay refund ID
 * @param refundAmount - The refund amount in rupees
 * @param razorpayRefundAmountPaise - The refund amount in paisa from Razorpay
 */
export async function handleWebhookRefundProcessed(
  razorpayPaymentId: string,
  refundId: string,
  refundAmount: number,
  razorpayRefundAmountPaise: number,
): Promise<void> {
  const session = await mongoose.startSession();
  let emitData: {
    merchantId?: string;
    orderId: string;
    orderNumber?: string;
    paymentId: string;
    refundId: string;
    amount: number;
    status: 'refund_processed' | 'refund_disputed';
    userId?: string;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        'gatewayResponse.transactionId': razorpayPaymentId,
      }).session(session);

      if (!payment) {
        logger.warn('Webhook refund.processed: payment not found', { razorpayPaymentId, refundId });
        return;
      }

      if (payment.status === 'refunded') {
        logger.info('Webhook refund.processed: already refunded (idempotent)', { paymentId: payment.paymentId });
        emitData = {
          merchantId: (payment.metadata as { merchantId?: string })?.merchantId,
          orderId: (payment.metadata as { orderId?: string })?.orderId ?? payment.orderId?.toString() ?? '',
          orderNumber: (payment.metadata as { orderNumber?: string })?.orderNumber,
          paymentId: payment.paymentId,
          refundId,
          amount: refundAmount,
          status: 'refund_processed',
          userId: payment.user.toString(),
        };
        return;
      }

      const actualRefundAmount = razorpayRefundAmountPaise / 100;
      const maxRefundable = payment.amount - (payment.refundedAmount ?? 0);
      if (Math.round(actualRefundAmount * 100) > Math.round(maxRefundable * 100)) {
        logger.error('[SECURITY] Refund amount exceeds maximum refundable — possible webhook tampering', {
          paymentId: payment.paymentId,
          refundableAmount: maxRefundable,
          refundAmountReported: actualRefundAmount,
          refundId,
          razorpayPaymentId,
        });
        payment.paymentMeta = payment.paymentMeta || {};
        payment.paymentMeta.refundDispute = {
          reportedAt: new Date(),
          expected: maxRefundable,
          actual: actualRefundAmount,
        };
        await payment.save({ session });
        emitData = {
          merchantId: (payment.metadata as { merchantId?: string })?.merchantId,
          orderId: (payment.metadata as { orderId?: string })?.orderId ?? payment.orderId?.toString() ?? '',
          orderNumber: (payment.metadata as { orderNumber?: string })?.orderNumber,
          paymentId: payment.paymentId,
          refundId,
          amount: actualRefundAmount,
          status: 'refund_disputed',
        };
        return;
      }

      const prevStatus = payment.status;
      const isFullRefund = Math.round(refundAmount * 100) >= Math.round(payment.amount * 100);
      payment.status = (isFullRefund ? 'refunded' : 'refund_initiated') as PaymentStatus;
      await payment.save({ session });

      await PaymentAuditLog.create(
        [{
          action: 'refund_confirmed',
          paymentId: payment.paymentId,
          userId: payment.user.toString(),
          amount: refundAmount,
          previousStatus: prevStatus,
          newStatus: payment.status,
          gatewayResponse: { razorpayPaymentId, refundId, source: 'webhook' },
        }],
        { session },
      );

      emitData = {
        merchantId: (payment.metadata as { merchantId?: string })?.merchantId,
        orderId: (payment.metadata as { orderId?: string })?.orderId ?? payment.orderId?.toString() ?? '',
        orderNumber: (payment.metadata as { orderNumber?: string })?.orderNumber,
        paymentId: payment.paymentId,
        refundId,
        amount: refundAmount,
        status: 'refund_processed',
        userId: payment.user.toString(),
      };

      logger.info('Webhook refund.processed: payment status updated', {
        paymentId: payment.paymentId,
        refundId,
        refundAmount,
        newStatus: payment.status,
      });
    });
  } finally {
    session.endSession();
  }

  if (emitData) {
    await emitRefundEvent(emitData);
  }
}

/**
 * handleWebhookRefundFailed — called when Razorpay fires refund.failed.
 *
 * Marks the payment status as 'refund_failed' so the admin can retry.
 * Idempotent — skips if already in a terminal refund state.
 * MISS-01/03: Emits refund.failed event to the monolith after committing the transaction.
 * @param razorpayPaymentId - The Razorpay payment ID
 * @param refundId - The Razorpay refund ID
 */
export async function handleWebhookRefundFailed(
  razorpayPaymentId: string,
  refundId: string,
): Promise<void> {
  const session = await mongoose.startSession();
  let emitData: {
    merchantId?: string;
    orderId: string;
    orderNumber?: string;
    paymentId: string;
    refundId: string;
    amount: number;
    status: 'refund_failed';
    userId?: string;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        'gatewayResponse.transactionId': razorpayPaymentId,
      }).session(session);

      if (!payment) {
        logger.warn('Webhook refund.failed: payment not found', { razorpayPaymentId, refundId });
        return;
      }

      if (payment.status === 'refund_failed' || payment.status === 'refunded') {
        logger.info('Webhook refund.failed: already in terminal refund state (idempotent)', {
          paymentId: payment.paymentId,
          status: payment.status,
        });
        return;
      }

      const prevStatus = payment.status;
      payment.status = PaymentStatus.REFUND_FAILED as PaymentStatus;
      await payment.save({ session });

      await PaymentAuditLog.create(
        [{
          action: 'refund_failed',
          paymentId: payment.paymentId,
          userId: payment.user.toString(),
          amount: payment.refundedAmount || 0,
          previousStatus: prevStatus,
          newStatus: 'refund_failed',
          gatewayResponse: { razorpayPaymentId, refundId, source: 'webhook' },
        }],
        { session },
      );

      emitData = {
        merchantId: (payment.metadata as { merchantId?: string })?.merchantId,
        orderId: (payment.metadata as { orderId?: string })?.orderId ?? payment.orderId?.toString() ?? '',
        orderNumber: (payment.metadata as { orderNumber?: string })?.orderNumber,
        paymentId: payment.paymentId,
        refundId,
        amount: payment.refundedAmount || 0,
        status: 'refund_failed',
        userId: payment.user.toString(),
      };
    });
  } finally {
    session.endSession();
  }

  if (emitData) {
    await emitRefundEvent(emitData);
  }
}
