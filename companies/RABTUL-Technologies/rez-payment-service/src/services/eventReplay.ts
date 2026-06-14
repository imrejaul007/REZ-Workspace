import Redis from 'ioredis';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Redis configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const REDIS_KEYS = {
  DLQ_STREAM: 'dlq:stream',
  DLQ_PROCESSING: 'dlq:processing',
  DLQ_STATS: 'dlq:stats',
  EVENT_LOCK: 'dlq:lock:',
} as const;

// Event schema for failed events stored in MongoDB
const failedEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  error: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'dead_letter'],
    default: 'pending',
    index: true,
  },
  source: {
    type: String,
    default: 'unknown',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  lastAttemptAt: {
    type: Date,
    default: null,
  },
  nextRetryAt: {
    type: Date,
    default: null,
  },
});

// Compound indexes for common queries
failedEventSchema.index({ status: 1, createdAt: 1 });
failedEventSchema.index({ eventType: 1, status: 1 });
failedEventSchema.index({ eventId: 1, status: 1 });

// Static method to update timestamps on save
failedEventSchema.pre('save', function (next) {
  if (this.isModified('retryCount')) {
    this.lastAttemptAt = new Date();
  }
  if (this.status === 'failed' && this.retryCount >= this.maxRetries) {
    this.status = 'dead_letter';
  }
  next();
});

const FailedEvent = mongoose.models.FailedEvent || mongoose.model('FailedEvent', failedEventSchema);

// Event type definitions
export type EventType =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'wallet.credited'
  | 'wallet.debited'
  | 'notification.sent'
  | 'webhook.delivered'
  | string;

export interface EventPayload {
  [key: string]: unknown;
}

export interface ReplayResult {
  success: boolean;
  eventId: string;
  attempts: number;
  error?: string;
  processedAt?: Date;
}

export interface DLQStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
  avgRetryCount: number;
}

export interface EventReplayConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  backoffMultiplier?: number;
  maxBatchSize?: number;
  processingTimeoutMs?: number;
  enableRedisTracking?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<EventReplayConfig> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  maxBatchSize: 100,
  processingTimeoutMs: 30000,
  enableRedisTracking: true,
};

/**
 * EventReplay - DLQ with replay capability for REZ payment service
 *
 * Features:
 * - Records failed events to MongoDB
 * - Redis-based tracking and deduplication
 * - Configurable retry with exponential backoff
 * - Batch replay support
 * - Event type-specific handlers
 * - Dead letter queue for events exceeding max retries
 * - Statistics and monitoring
 * - Event emitter for real-time updates
 */
export class EventReplay extends EventEmitter {
  private config: Required<EventReplayConfig>;
  private redis: Redis;
  private isProcessing: boolean = false;
  private shutdownSignal: boolean = false;

  constructor(config: EventReplayConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.redis = redis;
    this.setupRedisHandlers();
  }

  private setupRedisHandlers(): void {
    this.redis.on('error', (err) => {
      logger.error('[EventReplay] Redis connection error:', { message: err.message });
      this.emit('redis:error', err);
    });

    this.redis.on('connect', () => {
      logger.info('[EventReplay] Redis connected');
      this.emit('redis:connected');
    });
  }

  /**
   * Record a failed event to the DLQ
   */
  async recordFailure(
    eventId: string,
    eventType: string,
    payload: EventPayload,
    error: string,
    source: string = 'unknown',
    metadata: EventPayload = {}
  ): Promise<mongoose.Document> {
    // Check for duplicate
    const existing = await FailedEvent.findOne({ eventId });
    if (existing) {
      // Update existing record
      existing.retryCount += 1;
      existing.error = error;
      existing.lastAttemptAt = new Date();
      if (existing.retryCount >= this.config.maxRetries) {
        existing.status = 'dead_letter';
      }
      await existing.save();
      this.emit('event:updated', existing);
      return existing;
    }

    // Calculate next retry time
    const nextRetryAt = this.calculateNextRetry(1);

    // Create new failed event record
    const failedEvent = await FailedEvent.create({
      eventId,
      eventType,
      payload,
      error,
      source,
      metadata,
      status: 'pending',
      maxRetries: this.config.maxRetries,
      nextRetryAt,
      retryCount: 0,
    });

    // Track in Redis for quick access
    if (this.config.enableRedisTracking) {
      await this.trackInRedis(eventId, eventType, 'pending');
    }

    // Emit event for monitoring
    this.emit('event:recorded', failedEvent);
    logger.info(`[EventReplay] Recorded failed event: ${eventId} (${eventType})`);

    return failedEvent;
  }

  /**
   * Replay a single failed event by ID
   */
  async replay(eventId: string): Promise<ReplayResult> {
    // Check if already being processed
    if (await this.isEventLocked(eventId)) {
      return {
        success: false,
        eventId,
        attempts: 0,
        error: 'Event is currently being processed by another worker',
      };
    }

    // Acquire lock
    await this.acquireLock(eventId);

    try {
      const event = await FailedEvent.findOne({
        eventId,
        status: { $in: ['pending', 'failed'] },
      });

      if (!event) {
        return {
          success: false,
          eventId,
          attempts: 0,
          error: 'Event not found or already processed',
        };
      }

      // Mark as processing
      event.status = 'processing';
      event.retryCount += 1;
      event.lastAttemptAt = new Date();
      await event.save();

      // Update Redis
      await this.trackInRedis(eventId, event.eventType, 'processing');

      try {
        // Process with timeout
        await this.processEventWithTimeout(event.eventType, event.payload, event.metadata);

        // Mark as completed
        event.status = 'completed';
        event.processedAt = new Date();
        event.error = null;
        await event.save();

        // Update Redis
        await this.trackInRedis(eventId, event.eventType, 'completed');

        // Emit success event
        this.emit('event:completed', event);

        return {
          success: true,
          eventId,
          attempts: event.retryCount,
          processedAt: event.processedAt,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Check if max retries exceeded
        if (event.retryCount >= this.config.maxRetries) {
          event.status = 'dead_letter';
          this.emit('event:dead_letter', event);
        } else {
          event.status = 'failed';
          event.nextRetryAt = this.calculateNextRetry(event.retryCount + 1);
        }

        event.error = errorMessage;
        await event.save();

        // Update Redis
        await this.trackInRedis(eventId, event.eventType, event.status);

        // Emit failure event
        this.emit('event:failed', { event, error: errorStack || errorMessage });

        return {
          success: false,
          eventId,
          attempts: event.retryCount,
          error: errorMessage,
        };
      }
    } finally {
      // Release lock
      await this.releaseLock(eventId);
    }
  }

  /**
   * Replay multiple events in batch
   */
  async replayAll(limit: number = 100): Promise<{
    successCount: number;
    failureCount: number;
    results: ReplayResult[];
  }> {
    if (this.isProcessing) {
      throw new Error('Batch replay already in progress');
    }

    this.isProcessing = true;
    this.shutdownSignal = false;

    const events = await FailedEvent.find({
      status: 'pending',
      nextRetryAt: { $lte: new Date() },
    })
      .sort({ createdAt: 1 })
      .limit(Math.min(limit, this.config.maxBatchSize));

    const results: ReplayResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    logger.info(`[EventReplay] Starting batch replay of ${events.length} events`);

    for (const event of events) {
      if (this.shutdownSignal) {
        logger.warn('[EventReplay] Batch replay interrupted by shutdown signal');
        break;
      }

      const result = await this.replay(event.eventId);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Small delay between events to prevent overwhelming the system
      await this.delay(100);
    }

    this.isProcessing = false;

    logger.info(`[EventReplay] Batch replay complete: ${successCount} succeeded, ${failureCount} failed`);

    this.emit('batch:completed', { successCount, failureCount, total: events.length });

    return { successCount, failureCount, results };
  }

  /**
   * Replay events by type
   */
  async replayByType(eventType: string, limit: number = 50): Promise<number> {
    const events = await FailedEvent.find({
      eventType,
      status: { $in: ['pending', 'failed'] },
      nextRetryAt: { $lte: new Date() },
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    let successCount = 0;

    for (const event of events) {
      const result = await this.replay(event.eventId);
      if (result.success) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Get statistics about the DLQ
   */
  async getStats(): Promise<DLQStats> {
    const stats = await FailedEvent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRetries: { $sum: '$retryCount' },
        },
      },
    ]);

    const result: DLQStats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
      avgRetryCount: 0,
    };

    let totalRetries = 0;

    for (const stat of stats) {
      const status = stat._id as keyof DLQStats;
      const count = stat.count;
      totalRetries += stat.totalRetries;

      if (status in result) {
        (result as Record<string, number>)[status] = count;
        result.total += count;
      }
    }

    if (result.total > 0) {
      result.avgRetryCount = Number((totalRetries / result.total).toFixed(2));
    }

    return result;
  }

  /**
   * Get pending events with pagination
   */
  async getPendingEvents(
    page: number = 1,
    limit: number = 20,
    eventType?: string
  ): Promise<{
    events: mongoose.Document[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = { status: 'pending' };
    if (eventType) {
      query.eventType = eventType;
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      FailedEvent.find(query).sort({ createdAt: 1 }).skip(skip).limit(limit),
      FailedEvent.countDocuments(query),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get dead letter events for manual review
   */
  async getDeadLetterEvents(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    events: mongoose.Document[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      FailedEvent.find({ status: 'dead_letter' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FailedEvent.countDocuments({ status: 'dead_letter' }),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark dead letter events for retry
   */
  async retryDeadLetter(eventIds: string[]): Promise<number> {
    const result = await FailedEvent.updateMany(
      {
        eventId: { $in: eventIds },
        status: 'dead_letter',
      },
      {
        $set: {
          status: 'pending',
          retryCount: 0,
          error: null,
          nextRetryAt: new Date(),
        },
      }
    );

    logger.info(`[EventReplay] Reset ${result.modifiedCount} dead letter events for retry`);
    return result.modifiedCount;
  }

  /**
   * Purge completed events older than specified days
   */
  async purgeCompletedEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await FailedEvent.deleteMany({
      status: 'completed',
      processedAt: { $lt: cutoffDate },
    });

    logger.info(`[EventReplay] Purged ${result.deletedCount} completed events older than ${olderThanDays} days`);
    return result.deletedCount;
  }

  /**
   * Manually reset a failed event for retry
   */
  async resetEvent(eventId: string): Promise<boolean> {
    const event = await FailedEvent.findOne({ eventId });
    if (!event) return false;

    event.status = 'pending';
    event.retryCount = 0;
    event.error = null;
    event.nextRetryAt = new Date();
    await event.save();

    await this.trackInRedis(eventId, event.eventType, 'pending');

    return true;
  }

  /**
   * Delete a failed event record
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    const result = await FailedEvent.deleteOne({ eventId });
    if (result.deletedCount > 0) {
      await this.removeFromRedis(eventId);
      return true;
    }
    return false;
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<mongoose.Document | null> {
    return FailedEvent.findOne({ eventId });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('[EventReplay] Initiating graceful shutdown...');
    this.shutdownSignal = true;

    // Wait for any in-progress batch to complete
    if (this.isProcessing) {
      logger.info('[EventReplay] Waiting for batch replay to complete...');
      await this.waitForBatchComplete();
    }

    // Close Redis connection
    await this.redis.quit();
    logger.info('[EventReplay] Shutdown complete');
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Process event with timeout wrapper
   */
  private async processEventWithTimeout(
    type: string,
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Event processing timed out after ${this.config.processingTimeoutMs}ms`));
      }, this.config.processingTimeoutMs);

      this.processEvent(type, payload, metadata)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Main event processing dispatcher
   */
  private async processEvent(
    type: string,
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    logger.debug(`[EventReplay] Processing event: ${type}`);

    switch (type) {
      case 'payment.completed':
        await this.handlePaymentCompleted(payload, metadata);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload, metadata);
        break;
      case 'payment.refunded':
        await this.handlePaymentRefunded(payload, metadata);
        break;
      case 'order.created':
        await this.handleOrderCreated(payload, metadata);
        break;
      case 'order.updated':
        await this.handleOrderUpdated(payload, metadata);
        break;
      case 'order.cancelled':
        await this.handleOrderCancelled(payload, metadata);
        break;
      case 'wallet.credited':
        await this.handleWalletCredited(payload, metadata);
        break;
      case 'wallet.debited':
        await this.handleWalletDebited(payload, metadata);
        break;
      case 'notification.sent':
        await this.handleNotificationSent(payload, metadata);
        break;
      case 'webhook.delivered':
        await this.handleWebhookDelivered(payload, metadata);
        break;
      default:
        await this.handleUnknownEvent(type, payload, metadata);
    }
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle payment completed event
   */
  private async handlePaymentCompleted(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    // Trigger wallet credit
    const { userId, amount, currency, transactionId } = payload as {
      userId: string;
      amount: number;
      currency: string;
      transactionId: string;
    };

    logger.debug(`[EventReplay] Processing wallet credit: user=${userId}, amount=${amount} ${currency}`);

    // Emit event for wallet service to handle
    this.emit('wallet:credit', {
      userId,
      amount,
      currency,
      transactionId,
      source: 'payment_completion',
    });

    // Track in Redis stream for audit
    await this.addToStream('payment.completed', payload);
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { userId, orderId, errorCode, errorMessage } = payload as {
      userId: string;
      orderId: string;
      errorCode: string;
      errorMessage: string;
    };

    logger.debug(`[EventReplay] Processing payment failure: order=${orderId}, error=${errorCode}`);

    // Emit event for notification service
    this.emit('payment:failed', {
      userId,
      orderId,
      errorCode,
      errorMessage,
    });

    // Add to stream for audit
    await this.addToStream('payment.failed', payload);
  }

  /**
   * Handle payment refunded event
   */
  private async handlePaymentRefunded(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { userId, orderId, amount, currency, reason } = payload as {
      userId: string;
      orderId: string;
      amount: number;
      currency: string;
      reason?: string;
    };

    logger.debug(`[EventReplay] Processing refund: order=${orderId}, amount=${amount} ${currency}`);

    // Trigger wallet debit for refund
    this.emit('wallet:debit', {
      userId,
      amount,
      currency,
      transactionId: orderId,
      source: 'refund',
      reason,
    });

    // Notify user
    this.emit('notification:send', {
      userId,
      template: 'refund_processed',
      data: { amount, currency, orderId },
    });

    await this.addToStream('payment.refunded', payload);
  }

  /**
   * Handle order created event
   */
  private async handleOrderCreated(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { orderId, userId, items, totalAmount } = payload as {
      orderId: string;
      userId: string;
      items: unknown[];
      totalAmount: number;
    };

    logger.debug(`[EventReplay] Processing order created: order=${orderId}`);

    // Trigger notifications
    this.emit('notification:send', {
      userId,
      template: 'order_confirmed',
      data: { orderId, items, totalAmount },
    });

    // Reserve inventory
    this.emit('inventory:reserve', { orderId, items });

    // Update analytics
    this.emit('analytics:track', {
      event: 'order_created',
      properties: { orderId, userId, totalAmount, itemCount: items.length },
    });

    await this.addToStream('order.created', payload);
  }

  /**
   * Handle order updated event
   */
  private async handleOrderUpdated(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { orderId, userId, updates, previousStatus, newStatus } = payload as {
      orderId: string;
      userId: string;
      updates: Record<string, unknown>;
      previousStatus: string;
      newStatus: string;
    };

    logger.debug(`[EventReplay] Processing order update: order=${orderId}, ${previousStatus} -> ${newStatus}`);

    // Notify user of status change
    this.emit('notification:send', {
      userId,
      template: 'order_status_changed',
      data: { orderId, previousStatus, newStatus },
    });

    // Update analytics
    this.emit('analytics:track', {
      event: 'order_status_changed',
      properties: { orderId, previousStatus, newStatus },
    });

    await this.addToStream('order.updated', payload);
  }

  /**
   * Handle order cancelled event
   */
  private async handleOrderCancelled(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { orderId, userId, reason, refundRequired } = payload as {
      orderId: string;
      userId: string;
      reason: string;
      refundRequired: boolean;
    };

    logger.debug(`[EventReplay] Processing order cancellation: order=${orderId}`);

    // Notify user
    this.emit('notification:send', {
      userId,
      template: 'order_cancelled',
      data: { orderId, reason },
    });

    // Release inventory
    this.emit('inventory:release', { orderId });

    // Process refund if required
    if (refundRequired) {
      this.emit('refund:initiate', { orderId, reason });
    }

    // Update analytics
    this.emit('analytics:track', {
      event: 'order_cancelled',
      properties: { orderId, reason, refundRequired },
    });

    await this.addToStream('order.cancelled', payload);
  }

  /**
   * Handle wallet credited event
   */
  private async handleWalletCredited(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { userId, amount, currency, source, referenceId } = payload as {
      userId: string;
      amount: number;
      currency: string;
      source: string;
      referenceId: string;
    };

    logger.debug(`[EventReplay] Processing wallet credit: user=${userId}, amount=${amount} ${currency}`);

    // Emit event for wallet service
    this.emit('wallet:updated', {
      userId,
      type: 'credit',
      amount,
      currency,
      source,
      referenceId,
    });

    // Update analytics
    this.emit('analytics:track', {
      event: 'wallet_credited',
      properties: { userId, amount, currency, source },
    });

    await this.addToStream('wallet.credited', payload);
  }

  /**
   * Handle wallet debited event
   */
  private async handleWalletDebited(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { userId, amount, currency, source, referenceId } = payload as {
      userId: string;
      amount: number;
      currency: string;
      source: string;
      referenceId: string;
    };

    logger.debug(`[EventReplay] Processing wallet debit: user=${userId}, amount=${amount} ${currency}`);

    // Emit event for wallet service
    this.emit('wallet:updated', {
      userId,
      type: 'debit',
      amount,
      currency,
      source,
      referenceId,
    });

    // Update analytics
    this.emit('analytics:track', {
      event: 'wallet_debited',
      properties: { userId, amount, currency, source },
    });

    await this.addToStream('wallet.debited', payload);
  }

  /**
   * Handle notification sent event
   */
  private async handleNotificationSent(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { userId, channel, template, status, messageId } = payload as {
      userId: string;
      channel: string;
      template: string;
      status: string;
      messageId: string;
    };

    logger.debug(`[EventReplay] Processing notification sent: user=${userId}, template=${template}`);

    // Track delivery status
    this.emit('notification:delivered', {
      userId,
      channel,
      template,
      status,
      messageId,
    });

    await this.addToStream('notification.sent', payload);
  }

  /**
   * Handle webhook delivered event
   */
  private async handleWebhookDelivered(
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    const { webhookId, endpoint, statusCode, attempt } = payload as {
      webhookId: string;
      endpoint: string;
      statusCode: number;
      attempt: number;
    };

    logger.debug(`[EventReplay] Processing webhook delivered: webhook=${webhookId}, status=${statusCode}`);

    // Track delivery
    this.emit('webhook:delivered', {
      webhookId,
      endpoint,
      statusCode,
      attempt,
    });

    await this.addToStream('webhook.delivered', payload);
  }

  /**
   * Handle unknown event types
   */
  private async handleUnknownEvent(
    type: string,
    payload: EventPayload,
    metadata: EventPayload
  ): Promise<void> {
    logger.warn(`[EventReplay] Unknown event type: ${type}`);

    // Emit generic event for extensibility
    this.emit('event:custom', { type, payload, metadata });
  }

  // ==================== REDIS HELPERS ====================

  /**
   * Track event in Redis for quick access
   */
  private async trackInRedis(
    eventId: string,
    eventType: string,
    status: string
  ): Promise<void> {
    if (!this.config.enableRedisTracking) return;

    try {
      await this.redis.hset(
        REDIS_KEYS.DLQ_PROCESSING,
        eventId,
        JSON.stringify({ eventType, status, timestamp: Date.now() })
      );
    } catch (error) {
      logger.error('[EventReplay] Failed to track in Redis:', { error });
    }
  }

  /**
   * Remove event from Redis tracking
   */
  private async removeFromRedis(eventId: string): Promise<void> {
    if (!this.config.enableRedisTracking) return;

    try {
      await this.redis.hdel(REDIS_KEYS.DLQ_PROCESSING, eventId);
    } catch (error) {
      logger.error('[EventReplay] Failed to remove from Redis:', { error });
    }
  }

  /**
   * Add event to Redis stream for audit
   */
  private async addToStream(eventType: string, payload: EventPayload): Promise<void> {
    if (!this.config.enableRedisTracking) return;

    try {
      await this.redis.xadd(
        REDIS_KEYS.DLQ_STREAM,
        '*',
        'eventType',
        eventType,
        'payload',
        JSON.stringify(payload),
        'timestamp',
        Date.now().toString()
      );
    } catch (error) {
      logger.error('[EventReplay] Failed to add to stream:', { error });
    }
  }

  /**
   * Check if event is locked for processing
   */
  private async isEventLocked(eventId: string): Promise<boolean> {
    const lockKey = `${REDIS_KEYS.EVENT_LOCK}${eventId}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }

  /**
   * Acquire processing lock for event
   */
  private async acquireLock(eventId: string): Promise<void> {
    const lockKey = `${REDIS_KEYS.EVENT_LOCK}${eventId}`;
    // Lock expires after 5 minutes to prevent deadlocks
    await this.redis.set(lockKey, '1', 'EX', 300, 'NX');
  }

  /**
   * Release processing lock for event
   */
  private async releaseLock(eventId: string): Promise<void> {
    const lockKey = `${REDIS_KEYS.EVENT_LOCK}${eventId}`;
    await this.redis.del(lockKey);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attempt: number): Date {
    const delay = this.config.retryDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const nextRetry = new Date();
    nextRetry.setTime(nextRetry.getTime() + delay);
    return nextRetry;
  }

  /**
   * Wait for batch processing to complete
   */
  private async waitForBatchComplete(timeoutMs: number = 30000): Promise<void> {
    const start = Date.now();
    while (this.isProcessing && Date.now() - start < timeoutMs) {
      await this.delay(100);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ==================== SINGLETON INSTANCE ====================

let eventReplayInstance: EventReplay | null = null;

/**
 * Get or create the EventReplay singleton instance
 */
export function getEventReplay(config?: EventReplayConfig): EventReplay {
  if (!eventReplayInstance) {
    eventReplayInstance = new EventReplay(config);
  }
  return eventReplayInstance;
}

/**
 * Reset the EventReplay singleton (useful for testing)
 */
export function resetEventReplay(): void {
  if (eventReplayInstance) {
    eventReplayInstance.removeAllListeners();
    eventReplayInstance = null;
  }
}

export default EventReplay;
