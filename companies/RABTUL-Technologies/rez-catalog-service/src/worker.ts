/**
 * Catalog Worker — standalone BullMQ consumer for catalog-events queue.
 *
 * Phase C extraction. Handles product CRUD side effects: cache invalidation,
 * analytics, stock alerts, aggregator sync.
 */

import { Worker, Job } from 'bullmq';
import { bullmqRedis } from './config/redis';
import { createServiceLogger } from './config/logger';

const logger = createServiceLogger('catalog-worker');

export const QUEUE_NAME = 'catalog-events';

export interface CatalogEvent {
  eventId: string;
  eventType: string;
  merchantId: string;
  storeId?: string;
  payload: {
    productId?: string;
    categoryId?: string;
    menuId?: string;
    productName?: string;
    changes?: Record<string, unknown>;
    stockDelta?: number;
    previousStock?: number;
    newStock?: number;
    lowStockThreshold?: number;
    bulkCount?: number;
    [key: string];
  };
  createdAt: string;
}

let _worker: Worker | null = null;

/**
 * Starts the BullMQ catalog worker on the 'catalog-events' queue.
 * Handles cache invalidation and stock alert notifications.
 * @returns The BullMQ worker instance (singleton)
 */
export function startCatalogWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<CatalogEvent>) => {
      const event = job.data;

      logger.debug('[Worker] Processing catalog event', {
        type: event.eventType,
        merchantId: event.merchantId,
        productId: event.payload.productId,
        attempt: job.attemptsMade,
      });

      const errors: string[] = [];

      // 1. Cache invalidation
      try {
        const keysToInvalidate: string[] = [
          'products:list', 'products:featured', 'products:trending',
        ];
        if (event.payload.productId) keysToInvalidate.push(`product:${event.payload.productId}`);
        if (event.payload.categoryId) keysToInvalidate.push(`category:${event.payload.categoryId}`);
        if (event.storeId) keysToInvalidate.push(`products:store:${event.storeId}`);

        for (const key of keysToInvalidate) {
          await bullmqRedis.del(key);
        }
      } catch (err) {
        errors.push(`cache:${err.message}`);
      }

      // 2. Stock alert for low stock
      try {
        if (event.eventType === 'product.stock_changed' && event.payload.newStock !== undefined) {
          const threshold = event.payload.lowStockThreshold || 5;
          if (event.payload.newStock <= threshold) {
            logger.info('[Worker] Low stock alert', {
              productId: event.payload.productId,
              productName: event.payload.productName,
              stock: event.payload.newStock,
              threshold,
            });
            // Future: publish to notification queue for merchant alert
          }
        }
      } catch (err) {
        errors.push(`stock-alert:${err.message}`);
      }

      // 3. Aggregator sync placeholder (Swiggy/Zomato menu push)
      try {
        if (['product.created', 'product.updated', 'product.deleted', 'product.eighty_sixed', 'menu.updated'].includes(event.eventType)) {
          logger.debug('[Worker] Aggregator sync placeholder', {
            eventType: event.eventType,
            productId: event.payload.productId,
          });
        }
      } catch (err) {
        errors.push(`aggregator:${err.message}`);
      }

      if (errors.length > 0) {
        logger.warn('[Worker] Some handlers failed', { eventId: event.eventId, errors });
        // Throw so BullMQ marks the job failed and retries it — silently returning
        // would treat cache invalidation failures as success, losing the job permanently.
        throw new Error(`Handlers failed: ${errors.join(', ')}`);
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 10,
      limiter: { max: 200, duration: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    },
  );

  _worker.on('failed', (job, err: Error) => {
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      type: job?.name,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  _worker.on('error', (err: Error) => {
    logger.error('[Worker] Error:', err.message);
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
