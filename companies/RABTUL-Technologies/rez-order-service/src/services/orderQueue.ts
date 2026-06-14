/**
 * Order Queue Service with Idempotency
 *
 * Provides BullMQ-based order processing with Redis-backed idempotency
 * to prevent duplicate order processing from network retries.
 *
 * Architecture:
 * - Redis singleton for connection reuse
 * - Atomic idempotency check using SETNX
 * - TTL-based key expiration (1 hour default)
 *
 * Usage:
 * ```typescript
 * const queue = new OrderQueue();
 * const jobId = await queue.addWithIdempotency(orderId, orderData);
 * ```
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('order-queue');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CONNECTION_NAME = 'order-queue-connection';
const IDEMPOTENCY_TTL = 3600; // 1 hour in seconds
const DEFAULT_TTL = 1800; // 30 minutes for job data

// Redis singleton to prevent multiple connections
let redisInstance: Redis | null = null;

/**
 * Get or create Redis connection singleton
 */
export function getRedisConnection(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectionName: CONNECTION_NAME,
    });

    redisInstance.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisInstance.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redisInstance;
}

/**
 * Order job data structure
 */
export interface OrderJobData {
  orderId: string;
  merchantId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Order item structure
 */
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  name: string;
}

/**
 * Order processing result
 */
export interface OrderProcessingResult {
  success: boolean;
  jobId: string;
  orderId: string;
  status: 'processed' | 'duplicate' | 'failed';
  message?: string;
  processedAt?: string;
}

/**
 * Result codes for idempotency check
 */
export enum IdempotencyResult {
  NEW = 'new',
  DUPLICATE = 'duplicate',
  PROCESSING = 'processing',
}

/**
 * Order Queue Service with idempotency support
 *
 * Features:
 * - Atomic idempotency check using Redis SETNX
 * - Distributed lock to prevent race conditions
 * - Automatic key expiration to prevent memory leaks
 * - Graceful handling of concurrent duplicate requests
 */
export class OrderQueue {
  private queue: Queue;
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = getRedisConnection();
    this.queue = new Queue('order-processing', {
      connection: this.redis.duplicate(), // Queue needs its own connection
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000,
          age: 86400, // Keep last 24 hours
        },
        removeOnFail: {
          count: 5000,
          age: 604800, // Keep last 7 days
        },
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Set up queue event handlers for logging and monitoring
   * Note: active/completed/failed events are on the Worker, not the Queue
   */
  private setupEventHandlers(): void {
    this.queue.on('error', (error: Error) => {
      logger.error('Queue error', { error: error.message });
    });

    this.queue.on('paused', () => {
      logger.info('Queue paused');
    });

    this.queue.on('resumed', () => {
      logger.info('Queue resumed');
    });

    this.queue.on('removed', (jobId: string) => {
      logger.debug('Job removed', { jobId });
    });
  }

  /**
   * Build idempotency key for Redis storage
   */
  private buildIdempotencyKey(orderId: string): string {
    return `order:idempotent:${orderId}`;
  }

  /**
   * Build lock key for distributed locking
   */
  private buildLockKey(orderId: string): string {
    return `order:lock:${orderId}`;
  }

  /**
   * Build result key for storing processing results
   */
  private buildResultKey(orderId: string): string {
    return `order:result:${orderId}`;
  }

  /**
   * Check idempotency status for an order
   *
   * Uses Redis atomic operations to prevent race conditions:
   * 1. SETNX to acquire lock (returns 1 if acquired, 0 if already exists)
   * 2. If lock acquired, check if result exists
   * 3. Return appropriate status
   *
   * @param orderId - The unique order identifier
   * @returns Object with status and existing job ID if duplicate
   */
  async checkIdempotency(orderId: string): Promise<{
    result: IdempotencyResult;
    jobId?: string;
    existingResult?: OrderProcessingResult;
  }> {
    const idempotencyKey = this.buildIdempotencyKey(orderId);
    const lockKey = this.buildLockKey(orderId);
    const resultKey = this.buildResultKey(orderId);

    // First, try to acquire a lock using SETNX
    // NX = only set if not exists, EX = expire in seconds
    const lockAcquired = await this.redis.set(lockKey, 'processing', 'EX', 30, 'NX');

    if (lockAcquired) {
      // We got the lock - this is a new request
      // Check if there's a previous result (edge case: lock expired but result exists)
      const existingResult = await this.redis.get(resultKey);
      if (existingResult) {
        // Release lock since we found existing result
        await this.redis.del(lockKey);
        return {
          result: IdempotencyResult.DUPLICATE,
          existingResult: JSON.parse(existingResult),
        };
      }
      return { result: IdempotencyResult.NEW };
    }

    // Lock not acquired - someone else is processing
    // Check if result exists (completed processing)
    const existingResult = await this.redis.get(resultKey);
    if (existingResult) {
      return {
        result: IdempotencyResult.DUPLICATE,
        existingResult: JSON.parse(existingResult),
      };
    }

    // Result doesn't exist yet - another request is actively processing
    return { result: IdempotencyResult.PROCESSING };
  }

  /**
   * Store idempotency data atomically
   *
   * @param orderId - The order ID
   * @param jobId - The BullMQ job ID
   */
  async storeIdempotencyKey(orderId: string, jobId: string): Promise<void> {
    const idempotencyKey = this.buildIdempotencyKey(orderId);
    const lockKey = this.buildLockKey(orderId);

    // Store idempotency key with TTL
    await this.redis.setex(idempotencyKey, IDEMPOTENCY_TTL, jobId);

    // Release the processing lock
    await this.redis.del(lockKey);

    logger.debug('Stored idempotency key', { orderId, jobId });
  }

  /**
   * Store processing result for future idempotency checks
   *
   * @param orderId - The order ID
   * @param result - The processing result
   */
  async storeResult(orderId: string, result: OrderProcessingResult): Promise<void> {
    const resultKey = this.buildResultKey(orderId);
    const lockKey = this.buildLockKey(orderId);

    // Store result with same TTL as idempotency key
    await this.redis.setex(resultKey, IDEMPOTENCY_TTL, JSON.stringify(result));

    // Release any remaining lock
    await this.redis.del(lockKey);

    logger.debug('Stored processing result', { orderId, status: result.status });
  }

  /**
   * Check if order has already been processed
   *
   * @param orderId - The order ID to check
   * @returns True if order was already processed
   */
  async isProcessed(orderId: string): Promise<boolean> {
    const idempotencyKey = this.buildIdempotencyKey(orderId);
    const exists = await this.redis.exists(idempotencyKey);
    return exists === 1;
  }

  /**
   * Get the job ID for an already-processed order
   *
   * @param orderId - The order ID
   * @returns The job ID or null if not found
   */
  async getJobId(orderId: string): Promise<string | null> {
    const idempotencyKey = this.buildIdempotencyKey(orderId);
    return this.redis.get(idempotencyKey);
  }

  /**
   * Get the processing result for an order
   *
   * @param orderId - The order ID
   * @returns The processing result or null if not found
   */
  async getResult(orderId: string): Promise<OrderProcessingResult | null> {
    const resultKey = this.buildResultKey(orderId);
    const result = await this.redis.get(resultKey);
    if (result) {
      return JSON.parse(result);
    }
    return null;
  }

  /**
   * Add an order to the queue with idempotency protection
   *
   * This method ensures that duplicate orders (same orderId) are not
   * added to the queue multiple times. Uses atomic Redis operations
   * to prevent race conditions.
   *
   * Flow:
   * 1. Check idempotency status
   * 2. If duplicate, return existing job ID
   * 3. If new, create job and store idempotency key
   * 4. Return the job ID
   *
   * @param orderId - Unique order identifier
   * @param data - Order data to process
   * @returns Processing result with job ID and status
   */
  async addWithIdempotency(
    orderId: string,
    data: Partial<OrderJobData>
  ): Promise<OrderProcessingResult> {
    const { result, jobId: existingJobId, existingResult } = await this.checkIdempotency(orderId);

    if (result === IdempotencyResult.DUPLICATE && existingResult) {
      logger.info('Duplicate order detected', { orderId, existingJobId });
      return existingResult;
    }

    if (result === IdempotencyResult.PROCESSING) {
      logger.warn('Order currently being processed', { orderId });
      return {
        success: false,
        jobId: '',
        orderId,
        status: 'failed',
        message: 'Order is currently being processed by another request',
      };
    }

    // Create new job ID
    const newJobId = uuidv4();

    try {
      // Add job to queue with unique job ID
      await this.queue.add('process-order', {
        orderId,
        ...data,
        metadata: {
          ...data.metadata,
          queuedAt: new Date().toISOString(),
          idempotentJobId: newJobId,
        },
      }, {
        jobId: newJobId,
        // Individual job timeout is handled by the worker, not the queue
      });

      // Store idempotency key and result
      const result: OrderProcessingResult = {
        success: true,
        jobId: newJobId,
        orderId,
        status: 'processed',
        processedAt: new Date().toISOString(),
      };

      await this.storeIdempotencyKey(orderId, newJobId);
      await this.storeResult(orderId, result);

      logger.info('Order added to queue', { orderId, jobId: newJobId });
      return result;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to add order to queue', { orderId, error: err.message });

      // Clean up on failure
      await this.cleanupIdempotency(orderId);

      return {
        success: false,
        jobId: newJobId,
        orderId,
        status: 'failed',
        message: `Failed to queue order: ${err.message}`,
      };
    }
  }

  /**
   * Clean up idempotency keys on failure
   *
   * @param orderId - The order ID to clean up
   */
  private async cleanupIdempotency(orderId: string): Promise<void> {
    const lockKey = this.buildLockKey(orderId);
    await this.redis.del(lockKey);
  }

  /**
   * Remove idempotency protection for an order
   *
   * Use this to allow re-processing of a failed order.
   *
   * @param orderId - The order ID
   */
  async clearIdempotency(orderId: string): Promise<void> {
    const idempotencyKey = this.buildIdempotencyKey(orderId);
    const lockKey = this.buildLockKey(orderId);
    const resultKey = this.buildResultKey(orderId);

    await this.redis.del(idempotencyKey, lockKey, resultKey);
    logger.info('Cleared idempotency keys', { orderId });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
    return {
      waiting: counts.wait || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  /**
   * Get a job by ID
   *
   * @param jobId - The BullMQ job ID
   */
  async getJob(jobId: string): Promise<Job | undefined> {
    return this.queue.getJob(jobId);
  }

  /**
   * Pause the queue (drain mode)
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Close connections gracefully
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Queue closed');
  }
}

// Singleton instance for easy access
let orderQueueInstance: OrderQueue | null = null;

/**
 * Get the singleton OrderQueue instance
 */
export function getOrderQueue(): OrderQueue {
  if (!orderQueueInstance) {
    orderQueueInstance = new OrderQueue();
  }
  return orderQueueInstance;
}
