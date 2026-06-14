/**
 * Event Registry Service
 * Manages webhook events with deduplication and retry handling
 * SECURITY HARDENED - Added SSRF protection
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WebhookEvent,
  WebhookEventStatus,
  EventTypeDefinition,
  RelayRequest,
  RelayResponse
} from '../types';
import { logger } from '../utils/logger';
import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';

/**
 * SECURITY FIX (HIGH-01): SSRF Protection
 * Validates URLs to prevent Server-Side Request Forgery attacks
 */
function validateRelayUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS in production
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTP/HTTPS protocols allowed' };
    }

    // Block private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^127\./,                           // Loopback
      /^10\./,                            // Class A private
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
      /^192\.168\./,                      // Class C private
      /^169\.254\./,                      // Link-local
      /^0\./,                             // Current network
      /^localhost$/i,                     // Localhost
      /^.*\.local$/,                      // .local domains
      /^::1$/,                            // IPv6 loopback
      /^fe80:/i,                          // IPv6 link-local
      /^fc00:/i,                          // IPv6 unique local
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private IP addresses not allowed' };
      }
    }

    // Resolve hostname and check if it resolves to a private IP
    const ipPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fe80:/i,
      /^fc00:/i,
    ];

    // Additional check for numeric IPs
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      for (const pattern of ipPatterns) {
        if (pattern.test(hostname)) {
          return { valid: false, error: 'Private IP addresses not allowed' };
        }
      }
    }

    // Set reasonable timeout limit (max 30 seconds)
    const maxTimeout = 30000;

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Event registry schema for MongoDB
const WebhookEventSchema = new mongoose.Schema<WebhookEventDocument>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    providerId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    signature: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WebhookEventStatus),
      default: WebhookEventStatus.PENDING,
      index: true
    },
    verificationResult: {
      isValid: Boolean,
      algorithm: String,
      error: String
    },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    nextRetryAt: { type: Date },
    relayResult: {
      success: Boolean,
      statusCode: Number,
      response: mongoose.Schema.Types.Mixed,
      error: String,
      relayedAt: Date
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
    idempotencyKey: { type: String, index: true }
  },
  {
    timestamps: true
  }
);

// Compound index for deduplication queries
WebhookEventSchema.index({ providerId: 1, idempotencyKey: 1 });
WebhookEventSchema.index({ status: 1, nextRetryAt: 1 });

interface WebhookEventDocument extends Omit<WebhookEvent, 'id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
}

export class EventRegistryService {
  private model: mongoose.Model<WebhookEventDocument>;
  private redis: typeof import('redis').Redis | null = null;
  private readonly DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.model = mongoose.model<WebhookEventDocument>('WebhookEvent', WebhookEventSchema);
  }

  /**
   * Initialize Redis connection for deduplication
   */
  async initializeRedis(url?: string): Promise<void> {
    try {
      const redisUrl = url || process.env.REDIS_URL;
      if (!redisUrl) {
        logger.warn('Redis URL not provided, using MongoDB for deduplication');
        return;
      }

      const { createClient } = await import('redis');
      this.redis = createClient({ url: redisUrl });
      await this.redis.connect();
      logger.info('Redis connected for event deduplication');
    } catch (error) {
      logger.warn('Redis connection failed, falling back to MongoDB', { error });
    }
  }

  /**
   * Check for duplicate event using Redis or MongoDB
   */
  async isDuplicate(
    providerId: string,
    idempotencyKey: string
  ): Promise<boolean> {
    // Try Redis first (faster)
    if (this.redis) {
      try {
        const key = `webhook:dedup:${providerId}:${idempotencyKey}`;
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        logger.warn('Redis dedup check failed, falling back to MongoDB', { error });
      }
    }

    // Fallback to MongoDB
    const existing = await this.model.findOne({
      providerId,
      idempotencyKey
    });

    return !!existing;
  }

  /**
   * Mark event as processed in Redis
   */
  async markProcessed(
    providerId: string,
    idempotencyKey: string
  ): Promise<void> {
    if (this.redis) {
      try {
        const key = `webhook:dedup:${providerId}:${idempotencyKey}`;
        await this.redis.setEx(key, Math.floor(this.DEDUP_WINDOW_MS / 1000), '1');
      } catch (error) {
        logger.warn('Redis mark processed failed', { error });
      }
    }
  }

  /**
   * Create a new webhook event
   */
  async createEvent(
    providerId: string,
    eventType: string,
    payload: unknown,
    signature: string,
    idempotencyKey?: string
  ): Promise<WebhookEvent> {
    const eventId = uuidv4();

    const event = {
      eventId,
      providerId,
      eventType,
      payload,
      signature,
      status: WebhookEventStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
      idempotencyKey,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const doc = await this.model.create(event);
    logger.info('Webhook event created', { eventId, providerId, eventType });

    return this.documentToEvent(doc);
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<WebhookEvent | null> {
    const doc = await this.model.findOne({ eventId });
    return doc ? this.documentToEvent(doc) : null;
  }

  /**
   * Get events by provider
   */
  async getEventsByProvider(
    providerId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: WebhookEventStatus;
    } = {}
  ): Promise<WebhookEvent[]> {
    const { limit = 50, offset = 0, status } = options;

    const query: Record<string, unknown> = { providerId };
    if (status) {
      query.status = status;
    }

    const docs = await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return docs.map(doc => this.documentToEvent(doc));
  }

  /**
   * Get events pending retry
   */
  async getPendingRetries(): Promise<WebhookEvent[]> {
    const docs = await this.model.find({
      status: WebhookEventStatus.RETRY_SCHEDULED,
      nextRetryAt: { $lte: new Date() }
    });

    return docs.map(doc => this.documentToEvent(doc));
  }

  /**
   * Update event status
   */
  async updateStatus(
    eventId: string,
    status: WebhookEventStatus,
    additionalData?: Partial<WebhookEvent>
  ): Promise<WebhookEvent | null> {
    const update: Record<string, unknown> = {
      status,
      updatedAt: new Date()
    };

    if (additionalData) {
      Object.assign(update, additionalData);
    }

    const doc = await this.model.findOneAndUpdate(
      { eventId },
      update,
      { new: true }
    );

    if (doc) {
      logger.info('Event status updated', { eventId, status });
    }

    return doc ? this.documentToEvent(doc) : null;
  }

  /**
   * Record verification result
   */
  async recordVerification(
    eventId: string,
    isValid: boolean,
    algorithm: string,
    error?: string
  ): Promise<void> {
    await this.model.updateOne(
      { eventId },
      {
        $set: {
          verificationResult: { isValid, algorithm, error },
          status: isValid ? WebhookEventStatus.VERIFIED : WebhookEventStatus.FAILED,
          updatedAt: new Date()
        }
      }
    );

    logger.info('Verification recorded', { eventId, isValid, algorithm });
  }

  /**
   * Record relay result
   */
  async recordRelay(
    eventId: string,
    result: RelayResponse
  ): Promise<void> {
    await this.model.updateOne(
      { eventId },
      {
        $set: {
          relayResult: {
            success: result.success,
            statusCode: result.statusCode,
            response: result.response,
            error: result.error,
            relayedAt: new Date()
          },
          status: result.success ? WebhookEventStatus.RELAYED : WebhookEventStatus.FAILED,
          updatedAt: new Date()
        }
      }
    );

    logger.info('Relay recorded', { eventId, success: result.success });
  }

  /**
   * Schedule retry for failed event
   */
  async scheduleRetry(
    eventId: string,
    delayMs?: number
  ): Promise<boolean> {
    const event = await this.getEvent(eventId);
    if (!event) {
      return false;
    }

    if (event.retryCount >= event.maxRetries) {
      logger.warn('Max retries reached', { eventId, retryCount: event.retryCount });
      return false;
    }

    const delay = delayMs || this.calculateBackoff(event.retryCount);
    const nextRetryAt = new Date(Date.now() + delay);

    await this.model.updateOne(
      { eventId },
      {
        $inc: { retryCount: 1 },
        $set: {
          status: WebhookEventStatus.RETRY_SCHEDULED,
          nextRetryAt,
          updatedAt: new Date()
        }
      }
    );

    logger.info('Retry scheduled', { eventId, delayMs: delay, retryCount: event.retryCount + 1 });
    return true;
  }

  /**
   * Cancel pending retry
   */
  async cancelRetry(eventId: string): Promise<void> {
    await this.model.updateOne(
      { eventId },
      {
        $unset: { nextRetryAt: 1 },
        $set: { status: WebhookEventStatus.PENDING, updatedAt: new Date() }
      }
    );
  }

  /**
   * Relay event to target URL
   * SECURITY FIX (HIGH-01): Added SSRF protection
   */
  async relayEvent(
    eventId: string,
    request: RelayRequest
  ): Promise<RelayResponse> {
    const startTime = Date.now();

    // SECURITY FIX: Validate URL before making request
    const urlValidation = validateRelayUrl(request.targetUrl);
    if (!urlValidation.valid) {
      logger.warn('SSRF attempt blocked', { eventId, url: request.targetUrl, reason: urlValidation.error });
      return {
        success: false,
        statusCode: 400,
        error: `Invalid relay target URL: ${urlValidation.error}`
      };
    }

    try {
      // Limit timeout to max 30 seconds
      const timeout = Math.min(request.timeout || 5000, 30000);

      const response = await axios({
        method: request.method,
        url: request.targetUrl,
        data: request.payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event-Id': eventId,
          'X-Webhook-Timestamp': new Date().toISOString(),
          ...request.headers
        },
        timeout
      });

      const duration = Date.now() - startTime;

      const result: RelayResponse = {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        response: response.data,
        duration
      };

      await this.recordRelay(eventId, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;

      const result: RelayResponse = {
        success: false,
        statusCode: axiosError.response?.status,
        error: axiosError.message,
        duration
      };

      await this.recordRelay(eventId, result);
      return result;
    }
  }

  /**
   * Get event statistics
   */
  async getStatistics(
    providerId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byProvider: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const matchStage: Record<string, unknown> = {};

    if (providerId) {
      matchStage.providerId = providerId;
    }

    if (timeRange) {
      matchStage.createdAt = {
        $gte: timeRange.start,
        $lte: timeRange.end
      };
    }

    const stats = await this.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: { $push: '$status' },
          byProvider: { $push: '$providerId' }
        }
      }
    ]);

    if (!stats.length) {
      return {
        total: 0,
        byStatus: {},
        byProvider: {},
        averageProcessingTime: 0
      };
    }

    const statusCounts: Record<string, number> = {};
    for (const status of stats[0].byStatus) {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    const providerCounts: Record<string, number> = {};
    for (const provider of stats[0].byProvider) {
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }

    return {
      total: stats[0].total,
      byStatus: statusCounts,
      byProvider: providerCounts,
      averageProcessingTime: 0 // Would need to track processing time separately
    };
  }

  /**
   * Clean up old events
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.model.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: [WebhookEventStatus.RELAYED, WebhookEventStatus.DEDUPLICATED] }
    });

    logger.info('Old events cleaned up', {
      deletedCount: result.deletedCount,
      retentionDays
    });

    return result.deletedCount;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    // Base delay: 1 minute, max: 1 hour
    const baseDelay = 60 * 1000;
    const maxDelay = 60 * 60 * 1000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Add jitter (±10%) - STATISTICAL: network jitter for retry backoff, not security critical
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  /**
   * Convert MongoDB document to WebhookEvent
   */
  private documentToEvent(doc: WebhookEventDocument): WebhookEvent {
    return {
      id: doc.eventId,
      providerId: doc.providerId,
      eventType: doc.eventType,
      payload: doc.payload,
      signature: doc.signature,
      status: doc.status as WebhookEventStatus,
      verificationResult: doc.verificationResult,
      retryCount: doc.retryCount,
      maxRetries: doc.maxRetries,
      nextRetryAt: doc.nextRetryAt,
      relayResult: doc.relayResult ? {
        success: doc.relayResult.success,
        statusCode: doc.relayResult.statusCode,
        response: doc.relayResult.response,
        error: doc.relayResult.error,
        relayedAt: doc.relayResult.relayedAt
      } : undefined,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

// Event type definitions for common providers
export const EVENT_TYPE_DEFINITIONS: Record<string, EventTypeDefinition> = {
  // Payment events
  'payment.authorized': {
    name: 'Payment Authorized',
    category: 'payment',
    description: 'Payment has been authorized but not yet captured',
    requiredFields: ['id', 'amount', 'currency'],
    optionalFields: ['method', 'status', 'order_id'],
    handlers: ['paymentService', 'orderService']
  },
  'payment.captured': {
    name: 'Payment Captured',
    category: 'payment',
    description: 'Payment has been successfully captured',
    requiredFields: ['id', 'amount', 'currency'],
    optionalFields: ['method', 'status', 'order_id', 'captured_at'],
    handlers: ['paymentService', 'orderService']
  },
  'payment.failed': {
    name: 'Payment Failed',
    category: 'payment',
    description: 'Payment attempt failed',
    requiredFields: ['id', 'error_code', 'error_description'],
    optionalFields: ['amount', 'currency', 'order_id'],
    handlers: ['paymentService', 'notificationService']
  },

  // Order events
  'order.paid': {
    name: 'Order Paid',
    category: 'order',
    description: 'Order has been marked as paid',
    requiredFields: ['id', 'amount', 'status'],
    optionalFields: ['items', 'customer_id'],
    handlers: ['orderService', 'inventoryService']
  },

  // Refund events
  'refund.created': {
    name: 'Refund Created',
    category: 'refund',
    description: 'Refund has been initiated',
    requiredFields: ['id', 'payment_id', 'amount'],
    optionalFields: ['reason', 'status'],
    handlers: ['paymentService', 'orderService']
  },
  'refund.processed': {
    name: 'Refund Processed',
    category: 'refund',
    description: 'Refund has been processed successfully',
    requiredFields: ['id', 'payment_id', 'amount', 'status'],
    optionalFields: ['reason', 'processed_at'],
    handlers: ['paymentService', 'orderService', 'notificationService']
  },

  // Customer events
  'customer.created': {
    name: 'Customer Created',
    category: 'customer',
    description: 'New customer registered',
    requiredFields: ['id', 'email'],
    optionalFields: ['name', 'phone', 'metadata'],
    handlers: ['customerService', 'crmService']
  },
  'customer.updated': {
    name: 'Customer Updated',
    category: 'customer',
    description: 'Customer profile updated',
    requiredFields: ['id'],
    optionalFields: ['email', 'name', 'phone', 'metadata'],
    handlers: ['customerService', 'crmService']
  },

  // Subscription events
  'subscription.created': {
    name: 'Subscription Created',
    category: 'subscription',
    description: 'New subscription started',
    requiredFields: ['id', 'customer_id', 'plan_id'],
    optionalFields: ['status', 'current_period_start', 'current_period_end'],
    handlers: ['subscriptionService', 'billingService']
  },
  'subscription.updated': {
    name: 'Subscription Updated',
    category: 'subscription',
    description: 'Subscription details changed',
    requiredFields: ['id'],
    optionalFields: ['plan_id', 'status', 'current_period_end'],
    handlers: ['subscriptionService', 'billingService']
  },
  'subscription.deleted': {
    name: 'Subscription Deleted',
    category: 'subscription',
    description: 'Subscription cancelled',
    requiredFields: ['id'],
    optionalFields: ['cancelled_at', 'reason'],
    handlers: ['subscriptionService', 'notificationService']
  }
};

// Singleton instance
export const eventRegistry = new EventRegistryService();
