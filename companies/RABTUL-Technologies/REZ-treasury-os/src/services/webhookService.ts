/**
 * TreasuryOS - Webhook Service
 * Real-time notifications for treasury events
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  businessId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  retries: number;
  lastRetryAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export type WebhookEventType =
  // Account Events
  | 'account.created'
  | 'account.updated'
  | 'account.deactivated'
  // Transaction Events
  | 'transaction.deposit'
  | 'transaction.withdrawal'
  | 'transaction.transfer'
  | 'transaction.failed'
  // Investment Events
  | 'investment.created'
  | 'investment.matured'
  | 'investment.renewed'
  | 'investment.foreclosed'
  | 'investment.value_updated'
  // Forecast Events
  | 'forecast.generated'
  | 'shortfall.predicted'
  | 'shortfall.alert'
  | 'forecast.actualized'
  // Alert Events
  | 'alert.created'
  | 'alert.acknowledged'
  | 'alert.resolved'
  | 'alert.escalated';

export interface WebhookSubscription {
  id: string;
  businessId?: string; // If undefined, applies to all businesses
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'sent' | 'failed';
  responseStatus?: number;
  responseBody?: string;
  attempts: number;
  nextRetryAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

const WEBHOOK_DB_PREFIX = 'webhook:';
const WEBHOOK_SUBSCRIPTIONS_KEY = 'webhook:subscriptions';
const WEBHOOK_EVENTS_KEY = 'webhook:events';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60000, 300000, 900000]; // 1min, 5min, 15min

export class WebhookService {
  /**
   * Register a new webhook subscription
   */
  async subscribe(subscription: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookSubscription> {
    const { redis } = await import('../config/redis');

    const sub: WebhookSubscription = {
      ...subscription,
      id: `whk_${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await redis.hset(WEBHOOK_SUBSCRIPTIONS_KEY, sub.id, JSON.stringify(sub));

    return sub;
  }

  /**
   * Unsubscribe from webhooks
   */
  async unsubscribe(webhookId: string): Promise<void> {
    const { redis } = await import('../config/redis');
    await redis.hdel(WEBHOOK_SUBSCRIPTIONS_KEY, webhookId);
  }

  /**
   * Get all active subscriptions for an event
   */
  async getSubscriptionsForEvent(eventType: WebhookEventType, businessId?: string): Promise<WebhookSubscription[]> {
    const { redis } = await import('../config/redis');

    const allSubs = await redis.hgetall(WEBHOOK_SUBSCRIPTIONS_KEY);
    const subscriptions: WebhookSubscription[] = [];

    for (const [, value] of Object.entries(allSubs)) {
      const sub = JSON.parse(value) as WebhookSubscription;

      if (!sub.active) continue;
      if (!sub.events.includes(eventType)) continue;
      if (sub.businessId && sub.businessId !== businessId) continue;

      subscriptions.push(sub);
    }

    return subscriptions;
  }

  /**
   * Emit an event to all matching subscriptions
   */
  async emit(event: Omit<WebhookEvent, 'id' | 'retries' | 'status'>): Promise<string> {
    const { redis } = await import('../config/redis');

    const fullEvent: WebhookEvent = {
      ...event,
      id: `evt_${uuidv4()}`,
      retries: 0,
      status: 'pending',
    };

    // Store event
    await redis.hset(`${WEBHOOK_EVENTS_KEY}:${fullEvent.id}`, JSON.stringify(fullEvent));

    // Get matching subscriptions and queue deliveries
    const subscriptions = await this.getSubscriptionsForEvent(event.type, event.businessId);

    for (const sub of subscriptions) {
      await this.queueDelivery(sub, fullEvent);
    }

    return fullEvent.id;
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(subscription: WebhookSubscription, event: WebhookEvent): Promise<void> {
    const { redis } = await import('../config/redis');

    const delivery: WebhookDelivery = {
      id: `del_${uuidv4()}`,
      webhookId: subscription.id,
      eventId: event.id,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    const deliveryKey = `${WEBHOOK_DB_PREFIX}deliveries:${subscription.id}:${delivery.id}`;
    await redis.hset(deliveryKey, JSON.stringify(delivery));

    // Process immediately
    await this.processDelivery(subscription, event, delivery);
  }

  /**
   * Process a webhook delivery
   */
  private async processDelivery(
    subscription: WebhookSubscription,
    event: WebhookEvent,
    delivery: WebhookDelivery
  ): Promise<void> {
    const { redis } = await import('../config/redis');
    const crypto = await import('crypto');

    try {
      // Generate signature
      const payload = JSON.stringify(event);
      const signature = crypto
        .createHmac('sha256', subscription.secret)
        .update(payload)
        .digest('hex');

      // Send webhook
      const response = await axios.post(subscription.url, event, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-Event-ID': event.id,
          'X-Webhook-Timestamp': event.timestamp.toISOString(),
        },
        timeout: 30000, // 30 second timeout
      });

      // Success - update delivery
      delivery.status = 'sent';
      delivery.responseStatus = response.status;
      delivery.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      delivery.completedAt = new Date();

      const deliveryKey = `${WEBHOOK_DB_PREFIX}deliveries:${subscription.id}:${delivery.id}`;
      await redis.hset(deliveryKey, JSON.stringify(delivery));

    } catch (error) {
      delivery.attempts++;
      delivery.responseStatus = (error as { response?: { status?: number } }).response?.status;
      delivery.responseBody = (error as Error).message;

      if (delivery.attempts < MAX_RETRIES) {
        // Schedule retry
        delivery.status = 'pending';
        delivery.nextRetryAt = new Date(Date.now() + RETRY_DELAYS[delivery.attempts - 1]);

        const deliveryKey = `${WEBHOOK_DB_PREFIX}deliveries:${subscription.id}:${delivery.id}`;
        await redis.hset(deliveryKey, JSON.stringify(delivery));

        // Queue for retry
        await redis.zadd(
          `${WEBHOOK_DB_PREFIX}retry_queue`,
          delivery.nextRetryAt.getTime(),
          `${subscription.id}:${delivery.id}`
        );
      } else {
        // Max retries reached
        delivery.status = 'failed';
        delivery.completedAt = new Date();

        const deliveryKey = `${WEBHOOK_DB_PREFIX}deliveries:${subscription.id}:${delivery.id}`;
        await redis.hset(deliveryKey, JSON.stringify(delivery));
      }
    }
  }

  /**
   * Process retry queue (called by scheduled job)
   */
  async processRetryQueue(): Promise<{ processed: number; failed: number }> {
    const { redis } = await import('../config/redis');

    // Get due retries
    const now = Date.now();
    const dueRetries = await redis.zrangebyscore(`${WEBHOOK_DB_PREFIX}retry_queue`, 0, now);

    let processed = 0;
    let failed = 0;

    for (const retryKey of dueRetries) {
      const [subscriptionId, deliveryId] = retryKey.split(':');

      // Get subscription and delivery
      const subData = await redis.hget(WEBHOOK_SUBSCRIPTIONS_KEY, subscriptionId);
      const deliveryData = await redis.hget(
        `${WEBHOOK_DB_PREFIX}deliveries:${subscriptionId}:${deliveryId}`,
        '1'
      );

      if (!subData || !deliveryData) continue;

      const subscription = JSON.parse(subData) as WebhookSubscription;
      const delivery = JSON.parse(deliveryData) as WebhookDelivery;

      // Get event
      const eventData = await redis.hget(`${WEBHOOK_EVENTS_KEY}:${delivery.eventId}`, '1');
      if (!eventData) continue;

      const event = JSON.parse(eventData) as WebhookEvent;

      // Process delivery
      await this.processDelivery(subscription, event, delivery);

      // Remove from queue
      await redis.zrem(`${WEBHOOK_DB_PREFIX}retry_queue`, retryKey);

      if (delivery.status === 'failed') {
        failed++;
      } else {
        processed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(
    webhookId: string,
    options?: { limit?: number; offset?: number; status?: string }
  ): Promise<WebhookDelivery[]> {
    const { redis } = await import('../config/redis');

    const pattern = `${WEBHOOK_DB_PREFIX}deliveries:${webhookId}:*`;
    const keys = await redis.keys(pattern);

    const deliveries: WebhookDelivery[] = [];

    for (const key of keys) {
      const data = await redis.hget(key, '1');
      if (data) {
        const delivery = JSON.parse(data) as WebhookDelivery;
        if (!options?.status || delivery.status === options.status) {
          deliveries.push(delivery);
        }
      }
    }

    // Sort by created date (newest first)
    deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return deliveries.slice(offset, offset + limit);
  }
}

export const webhookService = new WebhookService();

// ============================================
// Event Emitters for Treasury Operations
// ============================================

export async function emitAccountCreated(businessId: string, accountId: string, accountType: string): Promise<void> {
  await webhookService.emit({
    type: 'account.created',
    businessId,
    data: { accountId, accountType },
    timestamp: new Date(),
  });
}

export async function emitTransactionDeposited(
  businessId: string,
  accountId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await webhookService.emit({
    type: 'transaction.deposit',
    businessId,
    data: { accountId, transactionId, amount },
    timestamp: new Date(),
  });
}

export async function emitInvestmentMatured(
  businessId: string,
  investmentId: string,
  maturityAmount: number
): Promise<void> {
  await webhookService.emit({
    type: 'investment.matured',
    businessId,
    data: { investmentId, maturityAmount },
    timestamp: new Date(),
  });
}

export async function emitShortfallAlert(
  businessId: string,
  alertId: string,
  shortfall: number,
  projectedBalance: number
): Promise<void> {
  await webhookService.emit({
    type: 'shortfall.alert',
    businessId,
    data: { alertId, shortfall, projectedBalance },
    timestamp: new Date(),
  });
}
