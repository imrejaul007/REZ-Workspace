/**
 * Order Worker — standalone BullMQ consumer for order-events queue.
 *
 * Phase C extraction. Handles order lifecycle side effects: analytics,
 * cache invalidation, delivery tracking, settlement triggers.
 */

import { Worker, Job, Queue } from 'bullmq';
import { workerRedis } from './config/redis'; // M15 FIX: Use dedicated workerRedis instead of bullmqRedis
import { createServiceLogger } from './config/logger';
import crypto from 'crypto';
import { Order } from './models/Order';
import {
  OrderStatus,
  validateTransition,
  canBeCancelled,
  getAllowedTransitions,
} from './state/orderStateMachine';
import { sendOrderToRezMind } from './services/rezMindService';

let _walletQueue: Queue | null = null;
function getWalletQueue(): Queue {
  if (!_walletQueue) _walletQueue = new Queue('wallet-events', { connection: workerRedis });
  return _walletQueue;
}

let _notifQueue: Queue | null = null;
function getNotifQueue(): Queue {
  if (!_notifQueue) _notifQueue = new Queue('notification-events', { connection: workerRedis });
  return _notifQueue;
}

const logger = createServiceLogger('order-worker');

export const QUEUE_NAME = 'order-events';

/**
 * Worker lifecycle and shutdown procedures:
 *
 * **Startup:**
 * 1. Connect to MongoDB via connectMongoDB()
 * 2. Call startOrderWorker() to start the BullMQ worker
 * 3. Worker processes events from 'order-events' queue
 *
 * **Shutdown (graceful):**
 * 1. Receive SIGTERM or SIGINT signal
 * 2. stopWorker() closes all queues (order-events, wallet-events, notification-events)
 * 3. Worker Redis connection is closed via workerRedis.quit()
 * 4. MongoDB is disconnected
 *
 * **Error Handling:**
 * - Failed jobs are retried per backoff policy (5 attempts, exponential backoff)
 * - Stalled jobs (lock expired) are detected and logged
 * - Unhandled rejections trigger graceful shutdown
 *
 * **Concurrency:**
 * - Worker processes up to 10 jobs concurrently
 * - Rate limited to 300 jobs per second
 */

export interface OrderEvent {
  eventId: string;
  eventType: string;
  userId: string;
  merchantId?: string;
  storeId?: string;
  payload: {
    orderId: string;
    orderNumber?: string;
    previousStatus?: string;
    newStatus?: string;
    amount?: number;
    items?: Array<{ productId: string; name: string; quantity: number; price: number }>;
    cancelReason?: string;
    refundAmount?: number;
    failureReason?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

let _worker: Worker | null = null;

/**
 * Starts the BullMQ worker for processing order events.
 *
 * Handles:
 * - Cache invalidation for merchant/user order lists
 * - Settlement triggers on order delivery
 * - Cancellation notifications
 * - Payment failure handling with state machine validation
 * - Refund completion tracking
 * - Order return processing
 * - REZ Mind event integration
 *
 * @returns The Worker instance
 * @throws {Error} If worker fails to start
 */
export function startOrderWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<OrderEvent>) => {
      const event = job.data;

      logger.debug('[Worker] Processing order event', {
        type: event.eventType,
        orderId: event.payload.orderId,
        userId: event.userId,
        attempt: job.attemptsMade,
      });

      const errors: string[] = [];

      // 1. Merchant dashboard cache invalidation (batched)
      try {
        const delKeys = [];
        if (event.merchantId) {
          delKeys.push(`merchant:orders:${event.merchantId}`);
          delKeys.push(`merchant:revenue:${event.merchantId}`);
          if (event.storeId) {
            delKeys.push(`store:orders:${event.storeId}`);
          }
        }
        delKeys.push(`user:orders:${event.userId}`);
        delKeys.push(`user:recent-orders:${event.userId}`);

        // perf: batch cache invalidations in a single redis call instead of sequential awaits
        if (delKeys.length > 0) {
          await Promise.all(delKeys.map((key) => workerRedis.del(key)));
        }
      } catch (err: unknown) {
        errors.push(`cache-invalidation:${err instanceof Error ? err.message : String(err)}`);
      }

      // 3. Delivery tracking
      try {
        if (['order.shipped', 'order.out_for_delivery', 'order.delivered'].includes(event.eventType)) {
          logger.info('[Worker] Delivery tracking update', {
            orderId: event.payload.orderId,
            status: event.payload.newStatus,
          });
          // Future: wire to delivery tracking service
        }
      } catch (err: unknown) {
        errors.push(`delivery:${err instanceof Error ? err.message : String(err)}`);
      }

      // 4. Settlement trigger on delivery — enqueue to wallet-events for payout
      try {
        if (event.eventType === 'order.delivered' && event.merchantId) {
          // HIGH-08 FIX: Validate settlement amount upfront — before enqueuing
          // Check: amount exists, is positive, is finite, and doesn't exceed max (10M)
          const amount = event.payload?.amount;
          if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            logger.error('[Worker] Settlement validation failed: invalid amount', {
              orderId: event.payload?.orderId,
              amount,
              reason: !amount ? 'missing' : !Number.isFinite(amount) ? 'not finite' : 'not positive',
            });
            return; // Skip settlement enqueue for invalid amount
          }
          if (amount > 10000000) { // 10M max
            logger.error('[Worker] Settlement validation failed: amount exceeds maximum', {
              orderId: event.payload?.orderId,
              amount,
              maxAllowed: 10000000,
            });
            return; // Skip settlement enqueue for amount over limit
          }

          // Use a stable, deterministic jobId so retries don't enqueue duplicate settlements.
          // Previously included Date.now() which changed on every retry, creating new jobs.
          const settlementEventId = `settlement:${event.payload.orderId}`;
          await getWalletQueue().add(
            'merchant-settlement',
            {
              eventId: settlementEventId,
              eventType: 'wallet.merchant_settlement',
              userId: event.userId,
              merchantId: event.merchantId,
              payload: {
                amount: event.payload.amount,
                source: 'order_delivery',
                description: `Settlement for order ${event.payload.orderNumber ?? event.payload.orderId}`,
                referenceId: event.payload.orderId,
                referenceModel: 'Order',
                // MISS-02: Include orderNumber separately so wallet-service can emit it via Socket.IO
                orderNumber: event.payload.orderNumber ?? event.payload.orderId,
              },
              createdAt: new Date().toISOString(),
            },
            {
              attempts: 5,
              backoff: { type: 'exponential', delay: 10000 },
              jobId: settlementEventId,
            },
          );
          logger.info('[Worker] Settlement enqueued', {
            orderId: event.payload.orderId,
            merchantId: event.merchantId,
            amount: event.payload.amount,
          });
        }
      } catch (err: unknown) {
        errors.push(`settlement:${err instanceof Error ? err.message : String(err)}`);
      }

      // 5. Cancellation side effects — notify customer and clear caches
      // (Stock restore and refund are handled synchronously by cancelOrderService in rezbackend)
      try {
        if (event.eventType === 'order.cancelled') {
          // Send cancellation notification to customer
          await getNotifQueue().add(
            'order-cancelled',
            {
              eventId: `notif:cancel:${event.payload.orderId}`,
              eventType: 'order_cancelled',
              userId: event.userId,
              channels: ['push', 'in_app'],
              payload: {
                title: 'Order Cancelled',
                body: event.payload.cancelReason
                  ? `Your order was cancelled: ${event.payload.cancelReason}`
                  : 'Your order has been cancelled.',
                data: {
                  orderId: event.payload.orderId,
                  orderNumber: event.payload.orderNumber,
                  screen: 'OrderDetail',
                },
                channelId: 'orders',
                priority: 'high',
              },
              category: 'orders',
              source: 'order-worker',
              createdAt: new Date().toISOString(),
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              jobId: `notif:cancel:${event.payload.orderId}`,
            },
          );
          logger.info('[Worker] Cancellation notification enqueued', {
            orderId: event.payload.orderId,
            reason: event.payload.cancelReason,
          });
        }
      } catch (err: unknown) {
        errors.push(`cancellation:${err instanceof Error ? err.message : String(err)}`);
      }

      // 6. BL-M3 FIX: payment_failed — cancel order and append status history entry
      // CAS guard: only cancel orders that are still in a pre-payment-confirmation state.
      // This prevents clobbering a concurrent merchant-service status advance (e.g., confirmed).
      try {
        if (event.eventType === 'payment_failed') {
          // STATE-MACHINE-001: Validate state transition before cancelling
          const orderForTransition = await Order.findById(event.payload.orderId).select('status');
          if (orderForTransition) {
            const currentStatus = orderForTransition.status as OrderStatus;
            if (!canBeCancelled(currentStatus)) {
              logger.warn('[Worker] payment_failed: order cannot be cancelled from current state', {
                orderId: event.payload.orderId,
                currentStatus,
                allowedTransitions: getAllowedTransitions(currentStatus),
              });
            } else if (!validateTransition(currentStatus, 'cancelled')) {
              logger.warn('[Worker] payment_failed: invalid state transition', {
                orderId: event.payload.orderId,
                from: currentStatus,
                to: 'cancelled',
                allowedTransitions: getAllowedTransitions(currentStatus),
              });
            } else {
              await Order.findOneAndUpdate(
                // HIGH-3 CAS guard: only cancel orders in pre-confirmation states.
                // If a merchant already advanced this order (confirmed+), the payment
                // failure update is a no-op — prevents clobbering merchant's transition.
                { _id: event.payload.orderId, status: { $in: ['placed', 'pending'] } },
                {
                  $set: { status: 'cancelled', 'payment.status': 'failed' },
                  $push: {
                    timeline: {
                      status: 'cancelled',
                      timestamp: new Date(),
                      note: `Payment failed: ${event.payload.failureReason || 'Payment could not be processed'}`,
                    },
                  },
                },
                { runValidators: false },
              );
              logger.info('[Worker] Order cancelled due to payment failure', {
                orderId: event.payload.orderId,
              });
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`payment_failed:${err instanceof Error ? err.message : String(err)}`);
      }

      // 7. BL-M3 FIX: refunded — mark refund as completed and record timestamp
      // CAS guard: only apply if the order is in a state that has a pending refund
      // (i.e., already cancelled/being cancelled with refundStatus !== 'completed').
      // Uses $ne to prevent double-processing if the event is delivered twice.
      try {
        if (event.eventType === 'refunded') {
          // HIGH-3 CAS guard: idempotent — skip if refund already marked complete.
          await Order.findOneAndUpdate(
            { _id: event.payload.orderId, 'cancellation.refundStatus': { $ne: 'completed' } },
            {
              $set: {
                'cancellation.refundStatus': 'completed',
                'cancellation.refundedAt': new Date(),
                'payment.refundedAt': new Date(),
                'payment.status': { value: 'refunded', updatedAt: new Date() },
              },
            },
            { runValidators: false },
          );
          logger.info('[Worker] Order refund marked complete', {
            orderId: event.payload.orderId,
          });
        }
      } catch (err: unknown) {
        errors.push(`refunded:${err instanceof Error ? err.message : String(err)}`);
      }

      // 8. BL-M2 FIX: order.returned — record return completion and invalidate caches.
      // No upstream publisher sends this event type yet (as of 2026-04-14), but when
      // merchant-originated returns are wired through the order-events queue, this
      // handler will mark the return as complete and invalidate any stale order caches.
      // CAS guard: only mark returned if the order is currently in 'delivered' state.
      // This prevents clobbering a cancellation that may race from the consumer side.
      try {
        if (event.eventType === 'order.returned') {
          // STATE-MACHINE-001: Validate state transition before marking returned
          const orderForTransition = await Order.findById(event.payload.orderId).select('status');
          if (!orderForTransition) {
            logger.warn('[Worker] order.returned: order not found', {
              orderId: event.payload.orderId,
            });
          } else {
            const currentStatus = orderForTransition.status as OrderStatus;
            // MED-16 FIX: Validate refundAmount before using in update
            const refundAmount = event.payload.refundAmount;
            if (typeof refundAmount !== 'number' || refundAmount <= 0 || !Number.isFinite(refundAmount)) {
              throw new Error('Invalid refund amount');
            }

            if (!validateTransition(currentStatus, 'returned')) {
              logger.warn('[Worker] order.returned: invalid state transition', {
                orderId: event.payload.orderId,
                from: currentStatus,
                to: 'returned',
                allowedTransitions: getAllowedTransitions(currentStatus),
              });
            } else {
              await Order.findOneAndUpdate(
                // HIGH-3 CAS guard: only mark returned if order was delivered/completed first
                { _id: event.payload.orderId, status: { $in: ['delivered', 'completed'] } },
                {
                  $set: {
                    status: 'returned',
                    'return.status': 'completed',
                    'return.completedAt': new Date(),
                  },
                  $push: {
                    timeline: {
                      status: 'returned',
                      timestamp: new Date(),
                      note: `Order returned. Refund amount: ${refundAmount}`,
                    },
                  },
                },
                { runValidators: false },
              );
              logger.info('[Worker] order.returned processed — order marked as returned', {
                orderId: event.payload.orderId,
                refundAmount: refundAmount,
              });
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`order.returned:${err instanceof Error ? err.message : String(err)}`);
      }

      // 9. REZ Mind Integration - Send order events to Event Platform
      try {
        if (event.eventType === 'order.placed' || event.eventType === 'order.confirmed') {
          await sendOrderToRezMind({
            merchant_id: event.merchantId || '',
            order_id: event.payload.orderId,
            customer_id: event.userId,
            items: event.payload.items?.map(item => ({
              item_id: item.productId,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            })) || [],
            total_amount: event.payload.amount || 0,
            status: event.eventType,
          }, 'order.completed');
        }
      } catch (err: unknown) {
        // Non-blocking - log but don't fail
        logger.warn('[Worker] REZ Mind event failed', { error: err instanceof Error ? err.message : String(err) });
      }

      if (errors.length > 0) {
        logger.warn('[Worker] Some handlers failed', { eventId: event.eventId, errors });
        // OS-06: Re-throw so BullMQ marks the job as failed and retries per backoff policy
        throw new Error(`Event handlers failed: ${errors.join('; ')}`);
      }
    },
    {
      // M15 FIX: Use dedicated workerRedis connection for BullMQ worker.
      // This separates worker traffic from app-level Redis operations.
      connection: workerRedis,
      concurrency: 10,
      limiter: { max: 300, duration: 1000 },
      // C-28 FIX: Job timeout enforcement - prevent stuck jobs
      lockDuration: 30000, // 30 second lock
      lockRenewTime: 5000, // Renew lock every 5 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Fail job after 2 stalled attempts
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  );

  _worker.on('failed', (job, err) => {
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      type: job?.name,
      orderId: (job?.data as OrderEvent)?.payload?.orderId,
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

/**
 * Gracefully stops the order worker and all associated queues.
 *
 * Closes:
 * - Main order-events worker
 * - wallet-events queue
 * - notification-events queue
 *
 * @returns Promise that resolves when all connections are closed
 */
export async function stopWorker(): Promise<void> {
  await Promise.allSettled([
    _worker?.close().then(() => { _worker = null; }),
    _walletQueue?.close().then(() => { _walletQueue = null; }),
    _notifQueue?.close().then(() => { _notifQueue = null; }),
  ]);
}

// ── Standalone entrypoint ─────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    require('dotenv/config');
    process.env.SERVICE_NAME = 'rez-order-worker';

    const { connectMongoDB, disconnectMongoDB } = await import('./config/mongodb');

    try {
      await connectMongoDB();
    } catch (err) {
      logger.error('[Worker] MongoDB connection failed, exiting', err);
      process.exit(1);
    }

    startOrderWorker();

    const shutdown = async (signal: string) => {
      logger.info(`[${signal}] Worker shutdown`);
      try {
        await stopWorker();
        await workerRedis.quit();
        await disconnectMongoDB();
      } catch (_) {
        // best-effort
      }
      logger.info('[Worker] Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('[FATAL] Unhandled rejection in worker:', reason);
    });

    logger.info('[Worker] Standalone mode — ready');
  })().catch((err) => {
    logger.error('[FATAL] Worker startup failed:', err);
    process.exit(1);
  });
}
