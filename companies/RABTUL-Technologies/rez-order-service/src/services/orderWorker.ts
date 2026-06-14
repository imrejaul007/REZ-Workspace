/**
 * Order Worker
 *
 * BullMQ Worker for processing orders from the order queue.
 * Handles job lifecycle events and implements the order processing logic.
 *
 * Usage:
 * ```typescript
 * import { OrderWorker } from './services/orderWorker';
 * const worker = new OrderWorker();
 * worker.start();
 * ```
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createServiceLogger } from '../config/logger';
import { OrderJobData } from './orderQueue';
import { getRedisConnection } from './orderQueue';

const logger = createServiceLogger('order-worker');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Order processing function
 * This is where your actual business logic goes
 */
async function processOrder(job: Job<OrderJobData>): Promise<{ success: boolean; orderId: string }> {
  const { orderId, merchantId, customerId, items, totalAmount } = job.data;

  logger.info('Processing order', { orderId, merchantId, customerId });

  try {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Your actual order processing logic here:
    // - Update inventory
    // - Send notifications
    // - Update analytics
    // - etc.

    logger.info('Order processed successfully', {
      orderId,
      itemCount: items.length,
      totalAmount,
    });

    return { success: true, orderId };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Order processing failed', { orderId, error: err.message });
    throw error; // Re-throw to trigger BullMQ retry
  }
}

/**
 * Order Worker class
 *
 * Sets up a BullMQ worker with proper event handling for:
 * - Active jobs (processing started)
 * - Completed jobs (successfully processed)
 * - Failed jobs (processing failed)
 * - Stalled jobs (worker crashed during processing)
 */
export class OrderWorker {
  private worker: Worker;
  private redis: Redis;

  constructor() {
    this.redis = getRedisConnection();

    this.worker = new Worker('order-processing', async (job) => {
      return processOrder(job);
    }, {
      connection: this.redis.duplicate(),
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs
        duration: 1000, // Per second
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Set up worker event handlers for logging and monitoring
   */
  private setupEventHandlers(): void {
    this.worker.on('active', (job, prev) => {
      logger.info('Job activated', {
        jobId: job.id,
        orderId: job.data.orderId,
        previousState: prev,
      });
    });

    this.worker.on('completed', (job, result, prev) => {
      logger.info('Job completed', {
        jobId: job.id,
        orderId: job.data.orderId,
        result,
        previousState: prev,
        duration: job.finishedOn ? job.finishedOn - job.timestamp : undefined,
      });
    });

    this.worker.on('failed', (job, error, prev) => {
      logger.error('Job failed', {
        jobId: job?.id,
        orderId: job?.data?.orderId,
        error: error.message,
        previousState: prev,
        attemptsMade: job?.attemptsMade,
        maxAttempts: job?.opts?.attempts || 3,
      });
    });

    this.worker.on('stalled', (jobId, prev) => {
      logger.warn('Job stalled', {
        jobId,
        previousState: prev,
      });
    });

    this.worker.on('error', (error) => {
      logger.error('Worker error', { error: error.message });
    });

    this.worker.on('ready', () => {
      logger.info('Worker ready');
    });

    this.worker.on('closed', () => {
      logger.info('Worker closed');
    });
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    logger.info('Starting order worker');
    await this.worker.waitUntilReady();
    logger.info('Order worker started');
  }

  /**
   * Pause the worker (stop processing new jobs but finish current ones)
   */
  async pause(): Promise<void> {
    await this.worker.pause();
    logger.info('Worker paused');
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume();
    logger.info('Worker resumed');
  }

  /**
   * Close the worker gracefully
   */
  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Worker closed');
  }

  /**
   * Get worker statistics
   */
  async getStats(): Promise<{
    active: number;
    completed: number;
    failed: number;
    paused: boolean;
  }> {
    return {
      active: 0, // Worker doesn't track counts directly
      completed: 0,
      failed: 0,
      paused: this.worker.isPaused(),
    };
  }
}

// Singleton instance
let orderWorkerInstance: OrderWorker | null = null;

/**
 * Get the singleton OrderWorker instance
 */
export function getOrderWorker(): OrderWorker {
  if (!orderWorkerInstance) {
    orderWorkerInstance = new OrderWorker();
  }
  return orderWorkerInstance;
}
