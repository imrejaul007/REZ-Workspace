/**
 * Payment Worker — standalone BullMQ consumer for wallet-credit queue.
 *
 * INC-4 FIX: rez-payment-service credits the customer wallet inside the
 * wallet-credit BullMQ queue but previously had NO consumer — the job sat
 * in Redis forever and the consumer app never received a socket notification.
 *
 * This worker:
 *  1. Consumes wallet-credit jobs (enqueued by creditWalletAfterPayment)
 *  2. Credits the wallet via POST to rez-wallet-service /internal/credit
 *  3. Emits coins:awarded / wallet:updated to the monolith's Socket.IO so
 *     the consumer app's WalletContext auto-refreshes without polling.
 */

import { Worker, Job } from 'bullmq';
import { redisHost, redisPort } from './config/redis';
import { createServiceLogger } from './config/logger';
import { IPayment } from './models/Payment';

const logger = createServiceLogger('payment-worker');

export const WALLET_CREDIT_QUEUE = 'wallet-credit';

interface WalletCreditJob {
  userId: string;
  amount: number;
  coinType: string;
  source: string;
  description: string;
  sourceId: string;
  idempotencyKey: string;
  walletUrl: string;
}

let _worker: Worker | null = null;

/**
 * BAK-CROSS-007 FIX: Resolve internal service token from scoped env var.
 * The token must NOT be stored in BullMQ job data (job data is stored in Redis
 * without encryption at rest). Instead, each worker resolves it internally from
 * INTERNAL_SERVICE_TOKENS_JSON on each job execution.
 */
function resolveInternalToken(): string {
  const scopedRaw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (scopedRaw) {
    try {
      const parsed = JSON.parse(scopedRaw) as Record<string, string>;
      // payment-service calls wallet-service
      return parsed['payment-service'] ?? parsed['wallet-service'] ?? Object.values(parsed)[0] ?? '';
    } catch {
      return '';
    }
  }
  return process.env.INTERNAL_SERVICE_TOKEN ?? '';
}

/**
 * Emit coins:awarded to the monolith's Socket.IO so the consumer app
 * auto-refreshes its wallet balance.
 * Fire-and-forget — failures are logged but do not block job completion.
 *
 * BAK-CROSS-014 FIX: Now uses x-internal-token header (not body secret) for consistency
 * with all other internal service-to-service calls. The monolith's coins-awarded-notify
 * endpoint accepts both header and body for backward compatibility.
 */
async function emitCoinsAwarded(data: {
  userId: string;
  amount: number;
  coinType: string;
  source: string;
  description: string;
  sourceId: string;
}): Promise<void> {
  const monolithUrl = process.env.MONOLITH_URL;
  const token = resolveInternalToken();
  if (!monolithUrl || !token) {
    logger.warn('[CoinsAwarded] MONOLITH_URL or INTERNAL_SERVICE_TOKEN not set — skipping Socket.IO emit');
    return;
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 5000);
  try {
    // BAK-CROSS-014: Use x-internal-token header instead of secret in body.
    await fetch(`${monolithUrl}/api/internal/payments/coins-awarded-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': token,
        'x-internal-service': 'payment-service',
      },
      body: JSON.stringify({
        userId: data.userId,
        amount: data.amount,
        coinType: data.coinType,
        source: data.source,
        description: data.description,
        sourceId: data.sourceId,
      }),
      signal: ac.signal,
    });
    logger.info('[CoinsAwarded] coins:awarded emitted to monolith', {
      userId: data.userId,
      amount: data.amount,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn('[CoinsAwarded] Failed to emit coins:awarded to monolith — non-critical', { error: errorMessage });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Credit the user wallet via the rez-wallet-service HTTP API.
 */
async function creditWallet(jobData: WalletCreditJob): Promise<void> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  const token = resolveInternalToken();
  if (!token) {
    throw new Error('[Worker] No internal token available — cannot call wallet service');
  }
  try {
    const response = await fetch(`${jobData.walletUrl}/internal/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': token,
        'x-internal-service': 'payment-service',
      },
      body: JSON.stringify({
        userId: jobData.userId,
        amount: jobData.amount,
        coinType: jobData.coinType,
        source: jobData.source,
        description: jobData.description,
        sourceId: jobData.sourceId,
        idempotencyKey: jobData.idempotencyKey,
      }),
      signal: ac.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Wallet credit HTTP ${response.status}: ${body}`);
    }

    logger.info('[Worker] Wallet credited successfully', {
      userId: jobData.userId,
      amount: jobData.amount,
      sourceId: jobData.sourceId,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('[Worker] Wallet credit HTTP call failed', {
      userId: jobData.userId,
      amount: jobData.amount,
      error: errorMessage,
    });
    throw err; // Re-throw so BullMQ retries
  } finally {
    clearTimeout(timer);
  }
}

export function startPaymentWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker(
    WALLET_CREDIT_QUEUE,
    async (job: Job<WalletCreditJob>) => {
      const data = job.data;
      logger.debug('[Worker] Processing wallet-credit job', {
        jobId: job.id,
        userId: data.userId,
        amount: data.amount,
        attempt: job.attemptsMade,
      });

      // Step 1: Credit the wallet via rez-wallet-service HTTP API
      await creditWallet(data);

      // Step 2: Emit coins:awarded to monolith Socket.IO so consumer app auto-refreshes
      // INC-4 FIX: Previously the job was enqueued but no worker consumed it, so
      // the consumer app never received a wallet update notification.
      await emitCoinsAwarded({
        userId: data.userId,
        amount: data.amount,
        coinType: data.coinType,
        source: data.source,
        description: data.description,
        sourceId: data.sourceId,
      });

      logger.info('[Worker] wallet-credit job completed', {
        jobId: job.id,
        userId: data.userId,
        amount: data.amount,
      });
    },
    {
      connection: {
        host: redisHost,
        port: redisPort,
      },
      // BAK-CROSS-021 FIX: concurrency=1 for financial wallet credit operations.
      // Concurrent processing of wallet debits/credits risks race conditions on balance
      // updates. Queue limiter still caps throughput globally at 100 jobs/sec.
      concurrency: 1,
      limiter: { max: 100, duration: 1000 },
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  );

  _worker.on('failed', (job, err) => {
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      userId: (job?.data as WalletCreditJob)?.userId,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  _worker.on('error', (err: Error) => {
    logger.error('[Worker] Error:', { error: err.message, stack: err.stack });
  });

  logger.info(`[Worker] Started — consuming queue: ${WALLET_CREDIT_QUEUE}`);
  return _worker;
}

export async function stopPaymentWorker(): Promise<void> {
  if (_worker) {
    logger.info('[Worker] Stopping payment worker...');
    await _worker.close();
    _worker = null;
    logger.info('[Worker] Payment worker stopped');
  }
}
