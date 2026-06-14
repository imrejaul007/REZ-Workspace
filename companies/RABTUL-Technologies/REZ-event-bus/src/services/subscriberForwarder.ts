import logger from './utils/logger';

/**
 * Subscriber Forwarder Service
 *
 * Forwards events to registered subscriber endpoints with:
 * - Automatic retries with exponential backoff
 * - Dead Letter Queue for failed deliveries
 * - Delivery logging for monitoring
 * - Concurrent delivery to multiple subscribers
 */

import axios, { AxiosError } from 'axios';
import { REZEvent } from '../rezEventBus';
import { SubscriptionConfig, DeadLetterEvent, EventDeliveryLog, ISubscriptionConfig, IDeadLetterEvent } from '../models/subscription.model';

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_INITIAL_DELAY_MS = 1000;

interface ForwardResult {
  success: boolean;
  subscriberId: string;
  eventId: string;
  statusCode?: number;
  error?: string;
  deliveryTimeMs?: number;
  retryCount: number;
}

interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

class SubscriberForwarder {
  private activeDeliveries: Map<string, boolean> = new Map();

  /**
   * Check if a subscription matches an event
   */
  private matchesSubscription(event: REZEvent, subscription: ISubscriptionConfig): boolean {
    // Check category match
    if (subscription.categories.includes(event.category)) {
      return true;
    }

    // Check for wildcard category subscriptions
    if (subscription.categories.includes('*')) {
      return true;
    }

    // Check event type match
    const eventType = event.type;
    for (const pattern of subscription.eventTypes) {
      if (this.matchEventPattern(eventType, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match event type against pattern (supports wildcards)
   * e.g., 'commerce.*' matches 'commerce.order.completed'
   */
  private matchEventPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Handle category.* pattern
    if (pattern.endsWith('.*')) {
      const category = pattern.slice(0, -2);
      return eventType.startsWith(category + '.');
    }

    // Handle prefix.* pattern
    if (pattern.includes('.*')) {
      const [prefix, suffix] = pattern.split('.*');
      return eventType.startsWith(prefix + '.') || eventType.endsWith('.' + suffix);
    }

    return false;
  }

  /**
   * Forward an event to a single subscriber
   */
  async forwardToSubscriber(
    event: REZEvent,
    subscription: ISubscriptionConfig
  ): Promise<ForwardResult> {
    const deliveryKey = `${event.id}-${subscription.serviceId}`;

    // Prevent duplicate concurrent deliveries
    if (this.activeDeliveries.get(deliveryKey)) {
      return {
        success: false,
        subscriberId: subscription.serviceId,
        eventId: event.id,
        error: 'Delivery already in progress',
        retryCount: 0
      };
    }

    this.activeDeliveries.set(deliveryKey, true);
    const startTime = Date.now();

    try {
      const retryConfig: RetryConfig = {
        maxRetries: subscription.retryPolicy?.maxRetries ?? DEFAULT_MAX_RETRIES,
        backoffMultiplier: subscription.retryPolicy?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER,
        initialDelayMs: subscription.retryPolicy?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS
      };

      let lastError: Error | null = null;
      let retryCount = 0;

      while (retryCount <= retryConfig.maxRetries) {
        try {
          const response = await this.deliverEvent(event, subscription);
          const deliveryTimeMs = Date.now() - startTime;

          // Log successful delivery
          await this.logDelivery(event, subscription, 'delivered', deliveryTimeMs, retryCount);

          // Update subscription stats
          await SubscriptionConfig.updateOne(
            { serviceId: subscription.serviceId },
            {
              $inc: { eventsReceived: 1 },
              $set: { lastEventAt: new Date() }
            }
          );

          return {
            success: true,
            subscriberId: subscription.serviceId,
            eventId: event.id,
            statusCode: response.status,
            deliveryTimeMs,
            retryCount
          };
        } catch (error) {
          lastError = error as Error;
          retryCount++;

          if (retryCount <= retryConfig.maxRetries) {
            // Calculate delay with exponential backoff
            const delay = retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, retryCount - 1);
            await this.sleep(delay);

            // Log retry
            await this.logDelivery(event, subscription, 'retrying', undefined, retryCount, lastError.message);
          }
        }
      }

      // All retries failed - move to DLQ
      const deliveryTimeMs = Date.now() - startTime;
      await this.moveToDeadLetterQueue(event, subscription, lastError!, retryCount);
      await this.logDelivery(event, subscription, 'failed', deliveryTimeMs, retryCount, lastError?.message);

      // Update error count
      await SubscriptionConfig.updateOne(
        { serviceId: subscription.serviceId },
        { $inc: { errorsCount: 1 } }
      );

      return {
        success: false,
        subscriberId: subscription.serviceId,
        eventId: event.id,
        error: lastError?.message || 'Unknown error',
        deliveryTimeMs,
        retryCount
      };
    } finally {
      this.activeDeliveries.delete(deliveryKey);
    }
  }

  /**
   * Deliver a single event to a subscriber endpoint
   */
  private async deliverEvent(event: REZEvent, subscription: ISubscriptionConfig): Promise<unknown> {
    // Convert headers Map to plain object if needed
    const customHeaders: Record<string, string> = {};
    if (subscription.headers) {
      if (subscription.headers instanceof Map) {
        subscription.headers.forEach((value, key) => {
          customHeaders[key] = value;
        });
      } else if (typeof subscription.headers === 'object') {
        Object.assign(customHeaders, subscription.headers);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Event-Id': event.id,
      'X-Event-Type': event.type,
      'X-Event-Category': event.category,
      'X-Event-Timestamp': event.timestamp,
      'X-Source-Service': event.source,
      ...customHeaders
    };

    // Add auth header if configured
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken) {
      headers['X-Internal-Token'] = internalToken;
    }

    const url = `${subscription.endpoint}:${subscription.port}/api/events/receive`;

    return axios.post(url, {
      event,
      receivedAt: new Date().toISOString()
    }, {
      timeout: DEFAULT_TIMEOUT_MS,
      headers
    });
  }

  /**
   * Move a failed event to the Dead Letter Queue
   */
  private async moveToDeadLetterQueue(
    event: REZEvent,
    subscription: ISubscriptionConfig,
    error: Error,
    retryCount: number
  ): Promise<void> {
    // Check DLQ threshold
    if (retryCount < subscription.dlqThreshold) {
      logger.info(`[SubscriberForwarder] Event ${event.id} failed after ${retryCount} retries, moving to DLQ`);
    }

    await DeadLetterEvent.create({
      originalEvent: event,
      subscriberId: subscription.serviceId,
      subscriberName: subscription.serviceName,
      error: error.message,
      errorStack: error.stack,
      retryCount,
      status: 'pending'
    });
  }

  /**
   * Log event delivery attempt
   */
  private async logDelivery(
    event: REZEvent,
    subscription: ISubscriptionConfig,
    status: 'delivered' | 'failed' | 'retrying',
    deliveryTimeMs?: number,
    retryCount?: number,
    error?: string
  ): Promise<void> {
    try {
      await EventDeliveryLog.create({
        eventId: event.id,
        subscriberId: subscription.serviceId,
        subscriberName: subscription.serviceName,
        eventType: event.type,
        category: event.category,
        status,
        deliveryTimeMs,
        retryCount: retryCount || 0,
        error
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`[SubscriberForwarder] Failed to log delivery: ${message}`);
    }
  }

  /**
   * Forward an event to all matching subscribers
   */
  async forwardToAllSubscribers(event: REZEvent): Promise<ForwardResult[]> {
    // Find all active subscriptions that match this event
    const subscriptions = await SubscriptionConfig.find({
      active: true
    });

    const matchingSubscriptions = subscriptions.filter(sub =>
      this.matchesSubscription(event, sub)
    );

    if (matchingSubscriptions.length === 0) {
      return [];
    }

    logger.info(`[SubscriberForwarder] Forwarding event ${event.id} (${event.type}) to ${matchingSubscriptions.length} subscribers`);

    // Forward to all matching subscribers concurrently
    const results = await Promise.all(
      matchingSubscriptions.map(sub =>
        this.forwardToSubscriber(event, sub)
      )
    );

    return results;
  }

  /**
   * Retry a dead letter event
   */
  async retryDeadLetter(dlqEvent: IDeadLetterEvent): Promise<boolean> {
    const subscription = await SubscriptionConfig.findOne({
      serviceId: dlqEvent.subscriberId
    });

    if (!subscription || !subscription.active) {
      await DeadLetterEvent.updateOne(
        { _id: dlqEvent._id },
        { status: 'failed' }
      );
      return false;
    }

    await DeadLetterEvent.updateOne(
      { _id: dlqEvent._id },
      { status: 'retrying' }
    );

    try {
      const event = dlqEvent.originalEvent as REZEvent;
      const result = await this.deliverEvent(event, subscription);

      await DeadLetterEvent.updateOne(
        { _id: dlqEvent._id },
        { status: 'resolved' }
      );

      await SubscriptionConfig.updateOne(
        { serviceId: subscription.serviceId },
        { $inc: { eventsReceived: 1 } }
      );

      return true;
    } catch (error) {
      const newRetryCount = dlqEvent.retryCount + 1;
      const maxRetries = subscription.retryPolicy?.maxRetries ?? DEFAULT_MAX_RETRIES;

      if (newRetryCount >= maxRetries) {
        await DeadLetterEvent.updateOne(
          { _id: dlqEvent._id },
          {
            status: 'failed',
            retryCount: newRetryCount,
            error: (error as Error).message
          }
        );
      } else {
        const initialDelayMs = subscription.retryPolicy?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
        const backoffMultiplier = subscription.retryPolicy?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
        const nextRetryAt = new Date(Date.now() + initialDelayMs * Math.pow(backoffMultiplier, newRetryCount));

        await DeadLetterEvent.updateOne(
          { _id: dlqEvent._id },
          {
            status: 'pending',
            retryCount: newRetryCount,
            error: (error as Error).message,
            nextRetryAt
          }
        );
      }

      return false;
    }
  }

  /**
   * Get pending DLQ events for a subscriber
   */
  async getPendingDeadLetters(subscriberId?: string): Promise<IDeadLetterEvent[]> {
    const query: unknown = { status: 'pending' };
    if (subscriberId) {
      query.subscriberId = subscriberId;
    }
    return DeadLetterEvent.find(query).sort({ createdAt: 1 }).limit(100);
  }

  /**
   * Get delivery stats for a subscriber
   */
  async getSubscriberStats(subscriberId: string): Promise<unknown> {
    const subscription = await SubscriptionConfig.findOne({ serviceId: subscriberId });
    if (!subscription) return null;

    const totalDeliveries = await EventDeliveryLog.countDocuments({ subscriberId });
    const successfulDeliveries = await EventDeliveryLog.countDocuments({
      subscriberId,
      status: 'delivered'
    });
    const failedDeliveries = await EventDeliveryLog.countDocuments({
      subscriberId,
      status: 'failed'
    });
    const pendingDLQ = await DeadLetterEvent.countDocuments({
      subscriberId,
      status: { $in: ['pending', 'retrying'] }
    });

    const avgDeliveryTime = await EventDeliveryLog.aggregate([
      { $match: { subscriberId, status: 'delivered', deliveryTimeMs: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$deliveryTimeMs' } } }
    ]);

    return {
      subscription: {
        serviceId: subscription.serviceId,
        serviceName: subscription.serviceName,
        active: subscription.active,
        categories: subscription.categories,
        eventTypes: subscription.eventTypes
      },
      stats: {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        pendingDLQ,
        deliverySuccessRate: totalDeliveries > 0
          ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(2) + '%'
          : 'N/A',
        averageDeliveryTimeMs: avgDeliveryTime[0]?.avgTime?.toFixed(2) || 'N/A'
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const subscriberForwarder = new SubscriberForwarder();

export default subscriberForwarder;
