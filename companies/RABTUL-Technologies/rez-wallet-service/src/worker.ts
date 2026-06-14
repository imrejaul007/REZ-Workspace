/**
 * Wallet Worker — standalone BullMQ consumer for wallet-events queue.
 *
 * Phase C extraction. Handles post-mutation wallet side effects:
 * notifications, analytics, cache invalidation, merchant settlement.
 *
 * IMPORTANT: This service does NOT handle financial mutations.
 * The monolith's walletService.credit()/debit() remains the authoritative
 * path for all balance changes. This worker handles async side effects only.
 */

import { Worker, Job, Queue } from 'bullmq';
import mongoose from 'mongoose';
import { bullmqRedis } from './config/redis';
import { createServiceLogger } from './config/logger';
import { startIntentGraphConsumer } from './workers/intentGraphConsumer';

const logger = createServiceLogger('wallet-worker');

let _notifQueue: Queue | null = null;
function getNotifQueue(): Queue {
  if (!_notifQueue) {
    _notifQueue = new Queue('notification-events', { connection: bullmqRedis });
    // BullMQ Queue instances emit `error` events (Redis command failures,
    // re-subscription errors). Without a listener Node treats them as
    // unhandled. Log + continue — the worker on the same queue handles
    // delivery retries.
    _notifQueue.on('error', (err) => {
      logger.error('[wallet-service] notification-events Queue error (non-fatal)', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
  return _notifQueue;
}

/** MISS-02 / WAL-020 FIX: Emit settlement event to monolith with retry backoff.
 * Previously fire-and-forget — failures logged but never retried.
 */
async function emitSettlementEvent(data: {
  merchantId: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  platformFee: number;
  transactionId: string;
}): Promise<void> {
  const monolithUrl = process.env.MONOLITH_URL;
  const internalSecret = process.env.INTERNAL_SERVICE_TOKEN || (() => {
    try {
      const tokens = JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}');
      return tokens['wallet-service'] || tokens.default;
    } catch { return undefined; }
  })();

  if (!monolithUrl) {
    logger.error('[SettlementEvent] MONOLITH_URL is not set — settlement event will NOT be emitted', { data });
    return;
  }
  if (!internalSecret) {
    logger.error('[SettlementEvent] INTERNAL_SERVICE_TOKEN is not set', { orderId: data.orderId, merchantId: data.merchantId });
    return;
  }

  const maxAttempts = 3;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    try {
      const response = await fetch(`${monolithUrl}/api/internal/payments/settlement-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': internalSecret,
          'x-internal-service': 'wallet-service',
        },
        body: JSON.stringify(data),
        signal: ac.signal,
      });
      clearTimeout(timer);
      if (response.ok) {
        logger.info('[SettlementEvent] Settlement event emitted to monolith', {
          merchantId: data.merchantId,
          orderId: data.orderId,
          amount: data.amount,
        });
        return;
      }
      // Non-2xx response — retry on 5xx
      if (response.status >= 500 && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      logger.warn('[SettlementEvent] Settlement event returned non-OK status', {
        status: response.status,
        orderId: data.orderId,
      });
      return;
    } catch (err) {
      lastError = err;
      clearTimeout(timer);
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        logger.warn('[SettlementEvent] Retry attempt', { attempt, maxAttempts, error: err?.message });
      }
    }
  }
  logger.warn('[SettlementEvent] Failed to emit settlement event after all retries', {
    orderId: data.orderId,
    error: lastError?.message,
  });
}

export const QUEUE_NAME = 'wallet-events';

export interface WalletEvent {
  eventId: string;
  eventType: string;
  userId: string;
  merchantId?: string;
  payload: {
    amount?: number;
    newBalance?: number;
    previousBalance?: number;
    source?: string;
    description?: string;
    transactionId?: string;
    referenceId?: string;
    referenceModel?: string;
    coinType?: string;
    category?: string;
    // WAL-017 FIX: Add typed fields for merchant settlement events
    storeId?: string;
    orderNumber?: string;
    platformFee?: number;
  };
  createdAt: string;
}

let _worker: Worker | null = null;

export function startWalletWorker(): Worker {
  if (_worker) return _worker;

  // Start intent graph Redis pub/sub consumer
  startIntentGraphConsumer().catch(err => {
    logger.error('[Worker] Failed to start intent graph consumer', { error: err.message });
  });

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<WalletEvent>) => {
      const event = job.data;

      logger.debug('[Worker] Processing wallet event', {
        type: event.eventType,
        userId: event.userId,
        amount: event.payload.amount,
        attempt: job.attemptsMade,
      });

      const errors: string[] = [];

      // 1. Balance change notification (in-app)
      try {
        if (['wallet.credited', 'wallet.cashback_awarded', 'wallet.reward_granted'].includes(event.eventType)) {
          const Notification = mongoose.connection.collection('notifications');
          const titles: Record<string, string> = {
            'wallet.credited': 'Coins Credited',
            'wallet.cashback_awarded': 'Cashback Received',
            'wallet.reward_granted': 'Reward Earned',
          };
          await Notification.insertOne({
            userId: event.userId,
            title: titles[event.eventType] || 'Wallet Update',
            body: `${event.payload.amount} coins added. Balance: ${event.payload.newBalance ?? '—'}`,
            type: 'wallet',
            category: 'financial',
            data: {
              amount: event.payload.amount,
              newBalance: event.payload.newBalance,
              transactionId: event.payload.transactionId,
            },
            isRead: false,
            createdAt: new Date(event.createdAt),
          });
        }
      } catch (err) {
        errors.push(`notification:${err.message}`);
      }

      // 2. Wallet analytics
      try {
        const AnalyticsEvent = mongoose.connection.collection('analyticsevents');
        await AnalyticsEvent.updateOne(
          { eventId: `wallet-analytics:${event.eventId}` },
          {
            $setOnInsert: {
              eventId: `wallet-analytics:${event.eventId}`,
              eventType: 'wallet_transaction',
              userId: event.userId,
              data: {
                transactionId: event.payload.transactionId,
                walletEventType: event.eventType,
                amount: event.payload.amount,
                coinType: event.payload.coinType,
                source: event.payload.source,
              },
              processedAt: new Date(),
              createdAt: new Date(event.createdAt),
            },
          },
          { upsert: true },
        );
      } catch (err) {
        errors.push(`analytics:${err.message}`);
      }

      // 3. Wallet cache invalidation (safety net)
      try {
        await bullmqRedis.del(`wallet:${event.userId}`);
        await bullmqRedis.del(`wallet:balance:${event.userId}`);
        await bullmqRedis.del(`user:dashboard:${event.userId}`);
      } catch (err) {
        errors.push(`cache:${err.message}`);
      }

      // 4. Merchant wallet settlement credit + cache invalidation
      // CS-H5 fix: previously only invalidated Redis cache — never credited the wallet.
      // Now calls merchantWalletService.creditMerchant() with the orderId as idempotency key.
      try {
        if (event.eventType === 'wallet.merchant_settlement' && event.merchantId && event.payload.amount && event.payload.amount > 0) {
          const amount = event.payload.amount;
          // Dynamically import to avoid circular dep at module load time
          const { merchantWalletService } = await import('./services/merchantWalletService');
          await merchantWalletService.creditMerchant({
            merchantId: event.merchantId,
            storeId: event.payload.storeId || event.merchantId,
            orderId: event.payload.referenceId || event.eventId,
            amount,
            platformFee: event.payload.platformFee ?? 0,
            description: event.payload.description || `Settlement for order ${event.payload.referenceId}`,
          });
          logger.info('[Worker] Merchant wallet credited', {
            merchantId: event.merchantId,
            amount,
            orderId: event.payload.referenceId,
          });
          // Invalidate caches after successful credit
          await bullmqRedis.del(`merchant:wallet:${event.merchantId}`);
          await bullmqRedis.del(`merchant:revenue:${event.merchantId}`);

          // MISS-02 FIX: Emit settlement event to monolith Socket.IO so merchant app
          // receives real-time wallet balance update without polling.
          emitSettlementEvent({
            merchantId: event.merchantId,
            orderId: event.payload.referenceId || event.eventId,
            orderNumber: event.payload.orderNumber,
            amount,
            platformFee: event.payload.platformFee ?? 0,
            transactionId: event.eventId,
          });
        } else if (event.eventType === 'wallet.merchant_settlement' && event.merchantId) {
          // amount is 0 or missing — just invalidate cache, skip credit
          await bullmqRedis.del(`merchant:wallet:${event.merchantId}`);
          await bullmqRedis.del(`merchant:revenue:${event.merchantId}`);
        }
      } catch (err) {
        errors.push(`merchant-wallet:${err.message}`);
      }

      // 5. Low balance alert — push notification when balance drops below 50 coins
      try {
        if (event.eventType === 'wallet.debited' && event.payload.newBalance !== undefined) {
          if (event.payload.newBalance < 50) {
            logger.info('[Worker] Low balance alert', {
              userId: event.userId,
              balance: event.payload.newBalance,
            });
            await getNotifQueue().add('low-balance-alert', {
              eventId: `low-balance-${event.userId}-${Date.now()}`,
              eventType: 'low_balance',
              userId: event.userId,
              channels: ['push', 'in_app'],
              payload: {
                title: 'Low Coin Balance',
                body: `Your REZ coin balance is low (${event.payload.newBalance} coins). Earn more by visiting stores!`,
                data: { balance: event.payload.newBalance, screen: 'Wallet' },
                channelId: 'wallet',
                priority: 'normal',
              },
              category: 'wallet',
              source: 'wallet-worker',
              createdAt: new Date().toISOString(),
            }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
          }
        }
      } catch (err) {
        errors.push(`balance-alert:${err.message}`);
      }

      if (errors.length > 0) {
        logger.warn('[Worker] Some handlers failed', { eventId: event.eventId, errors });
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 10,
      limiter: { max: 200, duration: 1000 },
      // C-28 FIX: Job timeout enforcement - prevent stuck jobs
      lockDuration: 30000, // 30 second lock
      lockRenewTime: 5000, // Renew lock every 5 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Fail job after 2 stalled attempts
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400 },
    },
  );

  _worker.on('failed', (job, err) => {
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      type: job?.name,
      userId: (job?.data as WalletEvent)?.userId,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  _worker.on('error', (err) => {
    logger.error('[Worker] Error:', err.message);
  });

  // C-28 FIX: Stuck job detection and recovery
  _worker.on('stalled', (jobId: string) => {
    logger.warn('[Worker] Job stalled (lock expired without renewal)', { jobId });
  });

  logger.info('[Worker] Started — queue: ' + QUEUE_NAME);
  return _worker;
}

export async function stopWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
}

export async function stopWalletWorker(): Promise<void> {
  if (_worker) {
    logger.info('[Wallet Worker] Draining worker (waiting for current job to complete)...');
    await _worker.close(); // waits for current job to finish
    _worker = null;
    logger.info('[Wallet Worker] Worker stopped');
  }
}
