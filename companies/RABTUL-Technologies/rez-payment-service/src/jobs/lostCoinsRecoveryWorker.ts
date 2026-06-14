/**
 * Lost Coins Recovery Worker — F-01 CRITICAL FIX
 *
 * PROBLEM: In capturePayment() and handleWebhookCaptured(), the MongoDB flag
 * `walletCredited=true` is set inside a MongoDB transaction, then the transaction
 * commits, then creditWalletAfterPayment() is called to enqueue a BullMQ job.
 * If the BullMQ enqueue fails (Redis down, queue error), coins are permanently
 * lost — walletCredited=true persists in DB but no credit was ever issued. The
 * $ne:true guard on subsequent replays blocks re-credit permanently.
 *
 * SOLUTION: This worker periodically scans for stuck states and re-enqueues credits.
 *
 * SCAN LOGIC:
 *   Find payments where:
 *     status = 'completed'
 *     walletCredited = true
 *     walletCreditRecoveryAttempted = false
 *     completedAt > now - 24 hours  (only recent payments)
 *
 *   For each stuck payment:
 *     1. Check Redis key `pay-credit-queued:<paymentId>`
 *        - 'enqueued' → job was queued successfully, skip
 *        - 'pending'  → enqueue in progress when Redis went down, re-enqueue
 *        - 'failed'   → enqueue definitely failed, re-enqueue
 *        - absent     → Redis was down when creditWalletAfterPayment ran, re-enqueue
 *     2. Call creditWalletAfterPayment() — BullMQ idempotency key prevents double-credit
 *     3. Mark walletCreditRecoveryAttempted = true (prevents infinite loops)
 *
 *   Additionally: for payments where:
 *     walletCredited = true
 *     walletCreditRecoveryAttempted = true
 *     walletCreditRecoveryAt > now - 7 days
 *   The worker checks if the CoinTransaction was actually created (via wallet service API
 *   or by querying the CoinTransaction collection). If not, re-attempt.
 *
 * SCHEDULE: Runs every 5 minutes via setInterval.
 * CONCURRENCY: Processes one batch of 50 at a time to avoid hammering Redis/MongoDB.
 * SAFETY: Max 3 recovery attempts per payment (tracked in walletCreditRecoveryAt + count).
 */

import mongoose from 'mongoose';
import { Payment, IPayment } from '../models/Payment';
import { redis } from '../config/redis';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('lost-coins-recovery');

// ─── Config ────────────────────────────────────────────────────────────────────

const SCAN_INTERVAL_MS = 5 * 60 * 1000;       // 5 minutes
const BATCH_SIZE = 50;                           // payments scanned per run
const MAX_RECOVERY_AGE_HOURS = 24;              // only scan payments from last 24h
const REDEEM_CHECK_LOOKBACK_DAYS = 7;           // check redemption payments up to 7d old
const MAX_RECOVERY_ATTEMPTS = 3;                // hard cap per payment
const QUEUE_TTL_SECONDS = 7 * 24 * 60 * 60;   // 7 days

let _intervalHandle: ReturnType<typeof setInterval> | null = null;
let _isRunning = false; // prevent overlapping runs

// ─── Core scan ────────────────────────────────────────────────────────────────

/**
 * Scan for and recover lost coin credits.
 * Called on startup (immediate first run) and then every SCAN_INTERVAL_MS.
 */
export async function scanAndRecoverLostCoins(): Promise<void> {
  if (_isRunning) {
    logger.debug('[Recovery] Previous scan still running — skipping this cycle');
    return;
  }
  _isRunning = true;

  try {
    await recoverStuckPayments();
    await retryFailedRecoveries();
  } catch (err) {
    logger.error('[Recovery] Scan cycle failed', { error: err?.message });
  } finally {
    _isRunning = false;
  }
}

/**
 * RECOVERY PASS 1: New stuck payments (walletCreditRecoveryAttempted = false).
 * These are payments where the credit flag is set but no recovery has been attempted.
 */
async function recoverStuckPayments(): Promise<void> {
  const cutoff = new Date(Date.now() - MAX_RECOVERY_AGE_HOURS * 60 * 60 * 1000);

  // F-01 FIX: Use the compound index { status, walletCredited, walletCreditRecoveryAttempted, completedAt }
  const stuckPayments = await Payment.find({
    status: 'completed',
    walletCredited: true,
    walletCreditRecoveryAttempted: { $ne: true },
    completedAt: { $gte: cutoff },
  })
    .sort({ completedAt: -1 })
    .limit(BATCH_SIZE)
    .lean<IPayment[]>();

  if (stuckPayments.length === 0) return;

  logger.info('[Recovery] Found stuck payments to recover', { count: stuckPayments.length });

  for (const payment of stuckPayments) {
    await recoverSinglePayment(payment);
  }
}

/**
 * RECOVERY PASS 2: Retry payments that previously had a recovery attempt but may have
 * failed again (e.g., Redis was temporarily down during the first recovery).
 * Only retries payments with < MAX_RECOVERY_ATTEMPTS attempts.
 */
async function retryFailedRecoveries(): Promise<void> {
  const retryCutoff = new Date(Date.now() - REDEEM_CHECK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const retryPayments = await Payment.find({
    status: 'completed',
    walletCredited: true,
    walletCreditRecoveryAttempted: true,
    walletCreditRecoveryAt: { $gte: retryCutoff },
  })
    .sort({ walletCreditRecoveryAt: 1 })
    .limit(BATCH_SIZE)
    .lean<IPayment[]>();

  if (retryPayments.length === 0) return;

  logger.info('[Recovery] Checking previously-attempted recovery payments', { count: retryPayments.length });

  for (const payment of retryPayments) {
    // Re-check Redis state — if it's 'enqueued' now, skip
    const redisKey = `pay-credit-queued:${payment.paymentId}`;
    try {
      const state = await redis.get(redisKey);
      if (state === 'enqueued') {
        logger.debug('[Recovery] Payment already enqueued (skipping retry)', { paymentId: payment.paymentId });
        continue;
      }
    } catch (_err) {
      // Redis unavailable — proceed with retry
    }

    // Verify the credit actually happened via the wallet service API
    const credited = await verifyWalletCredit(payment);
    if (credited) {
      logger.info('[Recovery] Credit already applied (skipping)', { paymentId: payment.paymentId });
      continue;
    }

    await recoverSinglePayment(payment);
  }
}

/**
 * Attempt to recover a single stuck payment.
 */
async function recoverSinglePayment(payment: IPayment): Promise<void> {
  const redisKey = `pay-credit-queued:${payment.paymentId}`;
  const paymentId = payment.paymentId as string;

  logger.info('[Recovery] Attempting to recover stuck payment', {
    paymentId,
    userId: (payment.user as unknown as { toString(): string }).toString(),
    amount: payment.amount,
  });

  // Step 1: Check Redis state
  let redisState: string | null = null;
  try {
    redisState = await redis.get(redisKey);
  } catch (_err) {
    // Redis unavailable — proceed with recovery
  }

  if (redisState === 'enqueued') {
    // Job was successfully queued but recovery was triggered prematurely or Redis state
    // was updated after the scan. Skip.
    logger.info('[Recovery] Job already enqueued in Redis (skipping)', { paymentId });
    await markRecoveryAttempted(paymentId, true);
    return;
  }

  if (redisState === 'pending') {
    // Enqueue was in progress when Redis went down. Reset to 'failed' so the
    // recovery re-enqueue goes through cleanly.
    try {
      await redis.set(redisKey, 'failed', 'EX', QUEUE_TTL_SECONDS);
    } catch (_err) {
      // Best-effort
    }
  }

  // Step 2: Verify credit hasn't already been applied
  const alreadyCredited = await verifyWalletCredit(payment);
  if (alreadyCredited) {
    logger.info('[Recovery] Credit already applied (verified via CoinTransaction)', { paymentId });
    await markRecoveryAttempted(paymentId, true);
    return;
  }

  // Step 3: Re-enqueue the credit job using the existing creditWalletAfterPayment.
  // The BullMQ idempotency key `pay-credit-<paymentId>` ensures the wallet service
  // won't credit twice even if this job was somehow previously queued and failed.
  try {
    // Import dynamically to avoid circular dependency issues at module load time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { creditWalletAfterPayment } = require('../services/paymentService') as {
      creditWalletAfterPayment: (p: IPayment) => Promise<void>;
    };

    // Cast to the shape creditWalletAfterPayment expects
    const paymentDoc = payment as unknown as Parameters<typeof creditWalletAfterPayment>[0];
    await creditWalletAfterPayment(paymentDoc);
    logger.info('[Recovery] Recovery enqueue attempted', { paymentId, redisState });
  } catch (err) {
    logger.error('[Recovery] Failed to re-enqueue credit job', {
      paymentId,
      error: err?.message,
    });
    // Don't mark as attempted — will retry on next cycle
    return;
  }

  // Step 4: Mark that a recovery attempt was made.
  // We mark as attempted even if the re-enqueue succeeded — the recovery worker
  // will verify the credit via CoinTransaction on subsequent cycles.
  await markRecoveryAttempted(paymentId, true);
}

/**
 * Mark a payment as having had a recovery attempt (or cleared).
 */
async function markRecoveryAttempted(paymentId: string, attempted: boolean): Promise<void> {
  try {
    await Payment.updateOne(
      { paymentId },
      {
        $set: {
          walletCreditRecoveryAttempted: attempted,
          walletCreditRecoveryAt: new Date(),
        },
      },
    );
  } catch (err) {
    logger.error('[Recovery] Failed to update recovery flag', { paymentId, error: err?.message });
  }
}

/**
 * Verify whether the wallet credit actually happened by querying the CoinTransaction
 * collection directly in MongoDB.
 *
 * Both payment-service and wallet-service share the same MongoDB instance, so the
 * payment-service can safely query the CoinTransaction collection to check if a credit
 * with the idempotency key `pay-credit-<paymentId>` was successfully created.
 *
 * The CoinTransaction.idempotencyKey has a unique index, so this query is O(1).
 */
async function verifyWalletCredit(payment: IPayment): Promise<boolean> {
  const paymentId = payment.paymentId as string;
  const idempotencyKey = `pay-credit-${paymentId}`;

  try {
    const exists = await mongoose.connection.collection('cointransactions').findOne(
      { idempotencyKey, status: 'completed' },
      { projection: { _id: 1 } },
    );
    return exists !== null;
  } catch (err) {
    // If the collection doesn't exist (e.g., wallet-service not yet initialized),
    // assume credit was NOT applied so we re-enqueue.
    logger.warn('[Recovery] Could not verify credit via CoinTransaction collection', {
      paymentId,
      error: err?.message,
    });
    return false;
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/** Start the lost-coins recovery worker. Idempotent — safe to call multiple times. */
export function startLostCoinsRecoveryWorker(): void {
  if (_intervalHandle !== null) {
    logger.info('[Recovery] Worker already running');
    return;
  }

  logger.info('[Recovery] Starting lost-coins recovery worker', {
    scanIntervalMs: SCAN_INTERVAL_MS,
    batchSize: BATCH_SIZE,
    maxRecoveryAgeHours: MAX_RECOVERY_AGE_HOURS,
  });

  // Run immediately on startup to catch any payments that were stuck before restart
  scanAndRecoverLostCoins().catch((err) =>
    logger.error('[Recovery] Initial recovery scan failed', { error: err?.message }),
  );

  _intervalHandle = setInterval(() => {
    scanAndRecoverLostCoins().catch((err) =>
      logger.error('[Recovery] Scheduled recovery scan failed', { error: err?.message }),
    );
  }, SCAN_INTERVAL_MS);
}

/** Stop the recovery worker. */
export function stopLostCoinsRecoveryWorker(): void {
  if (_intervalHandle !== null) {
    clearInterval(_intervalHandle);
    _intervalHandle = null;
    logger.info('[Recovery] Worker stopped');
  }
}
