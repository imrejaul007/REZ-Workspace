/**
 * Refund Service — handles payment refund operations.
 *
 * PAY-019 FIX: Split from paymentService.ts (was ~1,259 lines).
 */

import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Payment, IPayment, PaymentStatus } from '../models/Payment';
import { PaymentAuditLog } from '../models/TransactionAuditLog';
import * as razorpay from './razorpayService';
import { createServiceLogger } from '../config/logger';
import { redis } from '../config/redis';

const logger = createServiceLogger('refund-service');

/** TTL (ms) for the per-refund mutex in Redis. */
const REFUND_LOCK_TTL_MS = 30_000;

/**
 * Acquire a Redis mutex using SET NX PX.
 * Returns the lock token on success, or null if the lock is already held.
 */
async function acquireLock(key: string, ttlMs: number): Promise<string | null> {
  const token = uuid();
  const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
  return result === 'OK' ? token : null;
}

/**
 * Release the Redis mutex only if we still own it (compare-and-delete via Lua).
 */
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

/**
 * processRefund — processes a refund request.
 *
 * Three-phase operation:
 *   1. Atomic DB reservation of refundable amount (TOCTOU guard)
 *   2. Razorpay API call to initiate refund
 *   3. DB status update on success; atomic reversal on failure
 */
/**
 * Processes a refund request through a three-phase workflow:
 * 1. Reserve phase: creates a refund record and verifies the payment is eligible
 * 2. Razorpay phase: calls Razorpay refund API
 * 3. Confirmation phase: updates refund record and emits events
 * On failure, the reserve is atomically reverted.
 * @param paymentId - The internal payment ID
 * @param amount - Refund amount in rupees
 * @param reason - Human-readable reason for the refund
 * @param initiatedBy - Identifier of who initiated the refund (admin/merchant/system)
 * @param ownerUserId - Optional user ID for authorization
 * @returns Refund result with refundId and status
 */
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string,
  initiatedBy: string,
  ownerUserId?: string,
): Promise<{ refundId: string; status: string }> {
  // IDOR guard
  const paymentCheck = await Payment.findOne({ paymentId }, { user: 1, gatewayResponse: 1, status: 1 }).lean();
  if (!paymentCheck) throw new Error('Payment not found');

  if (ownerUserId && paymentCheck.user.toString() !== ownerUserId) {
    logger.warn('IDOR attempt: refund on another user payment', { paymentId, ownerUserId, actualOwner: paymentCheck.user.toString() });
    throw new Error('Unauthorized: payment does not belong to this user');
  }

  if (paymentCheck.status !== 'completed') throw new Error('Can only refund completed payments');

  const gatewayPaymentId = paymentCheck.gatewayResponse?.transactionId;
  if (!gatewayPaymentId) throw new Error('No gateway transaction ID for refund');

  // Step 1: Atomically reserve the refund amount (TOCTOU guard).
  const session = await mongoose.startSession();
  let updated: IPayment | null = null;
  try {
    await session.withTransaction(async () => {
      updated = await Payment.findOneAndUpdate(
        {
          paymentId,
          status: 'completed',
          $expr: { $lte: [{ $add: ['$refundedAmount', amount] }, '$amount'] },
        },
        { $inc: { refundedAmount: amount } },
        { new: true, session },
      );
      if (!updated) {
        throw new Error('Refund rejected: payment not found, wrong state, or exceeds refundable amount');
      }
    });
  } finally {
    session.endSession();
  }

  if (!updated) throw new Error('Refund rejected: payment not found, wrong state, or exceeds refundable amount');
  const reservedPayment = updated as IPayment;

  // Step 2: Call Razorpay — if it fails, reverse the reservation.
  let rzRefund: { id: string };
  try {
    rzRefund = await razorpay.initiateRefund(gatewayPaymentId, amount, { reason, paymentId }) as { id: string };
  } catch (razorpayErr) {
    // PAY-004 FIX: Reverse atomically inside a transaction.
    const session3 = await mongoose.startSession();
    try {
      await session3.withTransaction(async () => {
        const reversed = await Payment.findOneAndUpdate(
          { paymentId },
          { $inc: { refundedAmount: -amount } },
          { session: session3 },
        );
        if (!reversed) {
          logger.error('PAY-004: Refund reversal failed — payment not found', { paymentId, amount });
        }
      });
    } finally {
      session3.endSession();
    }
    logger.error('Razorpay refund failed — DB reservation reversed', { paymentId, amount, error: (razorpayErr as Error).message });
    throw razorpayErr;
  }

  // Step 3: Update status (full vs partial refund).
  const isFullRefund = Math.round((reservedPayment.refundedAmount ?? 0) * 100) >= Math.round(reservedPayment.amount * 100);
  const newStatus: PaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.REFUND_INITIATED;

  const session2 = await mongoose.startSession();
  try {
    await session2.withTransaction(async () => {
      const doc = await Payment.findOne({ paymentId }).session(session2);
      if (!doc) return;
      const prevStatus = doc.status;
      doc.status = newStatus;
      await doc.save({ session: session2 });

      await PaymentAuditLog.create(
        [{
          action: 'refund',
          paymentId,
          userId: doc.user.toString(),
          merchantId: initiatedBy,
          amount,
          previousStatus: prevStatus,
          newStatus,
          metadata: { reason, refundId: rzRefund.id, totalRefunded: doc.refundedAmount },
        }],
        { session: session2 },
      );
    });
  } finally {
    session2.endSession();
  }

  logger.info('Refund initiated', { paymentId, amount, refundId: rzRefund.id, newStatus });
  return { refundId: rzRefund.id, status: newStatus };
}
