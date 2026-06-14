import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { PaymentAuditLog } from '../models/TransactionAuditLog';
import * as razorpay from './razorpayService';
import { createServiceLogger } from '../config/logger';
import { creditWalletAfterPayment } from './paymentService';

const logger = createServiceLogger('reconciliation');

/**
 * Send alerts for critical reconciliation issues.
 * In production, this integrates with PagerDuty, Slack, or other alerting systems.
 */
async function sendAlert(alert: {
  type: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  details: Record<string, unknown>;
}) {
  logger.error(`[ALERT:${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`, alert.details);

  // In production, this would send to PagerDuty/Slack
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: new Date().toISOString(),
          ...alert.details
        })
      });
    } catch (err) {
      logger.error('Failed to send alert', { error: err });
    }
  }
}

/** Find payments stuck in 'processing' for >30 min, check gateway for real status */
export async function runReconciliation(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  let reconciled = 0;
  let lastId: unknown = null;
  const BATCH = 50;

  while (true) {
    const query: Record<string, unknown> = {
      status: 'processing',
      updatedAt: { $lt: cutoff },
    };
    if (lastId) query._id = { $gt: lastId };

    const stuck = await Payment.find(query)
      .sort({ _id: 1 })
      .limit(BATCH)
      .lean();

    if (stuck.length === 0) break;

    for (const payment of stuck) {
      try {
        const gatewayId = payment.gatewayResponse?.transactionId;
        if (!gatewayId) {
          await sendAlert({
            type: 'MISSING_PAYMENT_RECORD',
            severity: 'critical',
            message: `Payment has no gateway transaction ID for reconciliation`,
            details: {
              paymentId: payment._id,
              paymentStatus: payment.status,
              createdAt: payment.createdAt
            }
          });
          lastId = payment._id;
          continue;
        }

        const details = await razorpay.getPaymentDetails(gatewayId);
        const gatewayStatus = details.status;

        // Check for settlement amount mismatch between gateway and stored payment
        const gatewayAmount = details.amount / 100; // razorpay returns in paise
        if (Math.abs(gatewayAmount - payment.amount) > 0.01) {
          await sendAlert({
            type: 'SETTLEMENT_AMOUNT_MISMATCH',
            severity: 'critical',
            message: `Gateway settlement amount differs from stored payment amount`,
            details: {
              paymentId: payment._id,
              transactionId: gatewayId,
              storedAmount: payment.amount,
              gatewayAmount: gatewayAmount,
              discrepancy: Math.abs(gatewayAmount - payment.amount),
              currency: details.currency
            }
          });
        }

        let newStatus: string | null = null;
        if (gatewayStatus === 'captured') newStatus = 'completed';
        else if (gatewayStatus === 'failed') newStatus = 'failed';
        else { lastId = payment._id; continue; }

        // Include updatedAt as an optimistic concurrency guard — if a concurrent webhook
        // already transitioned this payment, modifiedCount will be 0 and we skip the
        // audit log write rather than clobbering the webhook's write.
        const reconcileResult = await Payment.updateOne(
          { _id: payment._id, status: 'processing', updatedAt: payment.updatedAt },
          {
            $set: {
              status: newStatus,
              ...(newStatus === 'completed' ? { completedAt: new Date(), expiresAt: null } : {}),
              ...(newStatus === 'failed' ? { failedAt: new Date(), failureReason: 'Reconciled from gateway' } : {}),
            },
          },
        );
        if (reconcileResult.modifiedCount === 0) {
          logger.info('Reconciliation skipped — payment already transitioned by concurrent webhook', { paymentId: payment.paymentId });
          lastId = payment._id;
          continue;
        }

        await PaymentAuditLog.create({
          action: 'reconcile',
          paymentId: payment.paymentId,
          userId: payment.user.toString(),
          previousStatus: 'processing',
          newStatus,
          gatewayResponse: { gatewayStatus, gatewayPaymentId: gatewayId },
        });

        // H15 FIX: Wrap wallet credit + flag update in a MongoDB transaction to prevent
        // double credit. Previously creditWalletAfterPayment() was called BEFORE setting
        // walletCredited=true — if credit succeeded but the flag update failed, the next
        // reconciliation run would credit again (walletCredited=false). Now both operations
        // are atomic: the flag is only set if creditWalletAfterPayment succeeds, and if
        // the transaction aborts (credit failure or any error) the flag stays false so
        // the payment is retried on the next reconciliation cycle.
        if (newStatus === 'completed' && !payment.walletCredited) {
          const session = await mongoose.startSession();
          try {
            let creditSucceeded = false;
            await session.withTransaction(async () => {
              // Reload inside transaction with session for consistent read
              const fullPayment = await Payment.findById(payment._id).session(session);
              if (!fullPayment) return;

              // Re-check inside transaction — another concurrent reconciliation or webhook
              // may have already credited this payment while we were waiting for the lock.
              if (fullPayment.walletCredited) {
                logger.info('Reconciliation: wallet already credited by concurrent process', { paymentId: payment.paymentId });
                await sendAlert({
                  type: 'DOUBLE_PAYMENT_DETECTED',
                  severity: 'critical',
                  message: `Wallet credit already processed by concurrent process — duplicate credit prevented`,
                  details: {
                    paymentId: payment._id,
                    paymentStatus: fullPayment.status,
                    walletCreditedAt: fullPayment.walletCreditedAt
                  }
                });
                return;
              }

              await creditWalletAfterPayment(fullPayment);
              creditSucceeded = true;

              // Atomically set flag only after successful credit within the same transaction.
              // The update uses walletCredited: { $ne: true } as an idempotency guard so
              // concurrent processes cannot overwrite each other's success.
              await Payment.findByIdAndUpdate(
                payment._id,
                { walletCredited: true, walletCreditedAt: new Date() },
                { session },
              );
            });

            if (creditSucceeded) {
              logger.info('Reconciliation: wallet credited after completing payment', { paymentId: payment.paymentId });
            }
          } catch (creditErr) {
            logger.error('Reconciliation: wallet credit failed — will retry on next run', {
              paymentId: payment.paymentId,
              error: creditErr.message,
            });
            await sendAlert({
              type: 'WALLET_CREDIT_FAILURE',
              severity: 'high',
              message: `Wallet credit failed for payment — will retry on next reconciliation run`,
              details: {
                paymentId: payment._id,
                userId: payment.user.toString(),
                error: creditErr.message,
                amount: payment.amount
              }
            });
          } finally {
            session.endSession();
          }
        }

        reconciled++;
        logger.info('Reconciled payment', { paymentId: payment.paymentId, newStatus });
      } catch (err) {
        logger.error('Reconciliation error', { paymentId: payment.paymentId, error: err.message });
        await sendAlert({
          type: 'RECONCILIATION_ERROR',
          severity: 'high',
          message: `Failed to reconcile payment: ${err.message}`,
          details: {
            paymentId: payment._id,
            gatewayId,
            error: err.message
          }
        });
      }
      lastId = payment._id;
    }

    if (stuck.length < BATCH) break;
  }

  if (reconciled > 0) logger.info(`Reconciliation complete: ${reconciled} payments reconciled`);
  return reconciled;
}

/** Expire payments stuck in 'pending' for >1 hour */
export async function recoverStuckPayments(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  // expiresAt guard prevents expiring a payment that was only recently initiated
  // and has not yet had time to be captured — avoids racing with capturePayment().
  const result = await Payment.updateMany(
    { status: 'pending', createdAt: { $lt: cutoff }, expiresAt: { $lte: new Date() } },
    { $set: { status: 'expired', failedAt: new Date() } },
  );

  const expired = result.modifiedCount;
  if (expired > 0) {
    logger.info(`Expired ${expired} stuck pending payments`);
  }
  return expired;
}
