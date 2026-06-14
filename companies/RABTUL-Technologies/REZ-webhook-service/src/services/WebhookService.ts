/**
 * Webhook Service
 *
 * Manages webhooks for loyalty events
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import crypto from 'crypto';
import { Webhook, IWebhook } from '../models/Webhook';
import { WebhookDelivery, IWebhookDelivery } from '../models/WebhookDelivery';
import { redis } from '../config/redis';

export class WebhookService {
  private secret: string;

  constructor() {
    this.secret = process.env.WEBHOOK_SECRET || 'default-secret-change-me';
  }

  async initialize(): Promise<void> {
    console.log('Webhook Service initialized');
  }

  /**
   * Create webhook
   */
  async createWebhook(params: {
    merchantId: string;
    url: string;
    events: string[];
    secret?: string;
    active?: boolean;
  }): Promise<IWebhook> {
    const secret = params.secret || crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.create({
      merchantId: params.merchantId,
      url: params.url,
      events: params.events,
      secret,
      active: params.active !== false,
      createdAt: new Date(),
    });

    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId: string, updates: Partial<IWebhook>): Promise<IWebhook | null> {
    return Webhook.findByIdAndUpdate(webhookId, updates, { new: true });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const result = await Webhook.findByIdAndDelete(webhookId);
    return !!result;
  }

  /**
   * List webhooks for merchant
   */
  async listWebhooks(merchantId: string): Promise<IWebhook[]> {
    return Webhook.find({ merchantId });
  }

  /**
   * Trigger webhooks for event
   */
  async triggerWebhooks(params: {
    merchantId: string;
    eventType: string;
    data: Record<string, any>;
  }): Promise<string[]> {
    const { merchantId, eventType, data } = params;

    // Find matching webhooks
    const webhooks = await Webhook.find({
      merchantId,
      active: true,
      events: eventType,
    });

    const deliveryIds: string[] = [];

    // Trigger each webhook
    for (const webhook of webhooks) {
      const delivery = await this.deliverWebhook(webhook, {
        eventType,
        data,
      });
      if (delivery) {
        deliveryIds.push(delivery._id.toString());
      }
    }

    return deliveryIds;
  }

  /**
   * Deliver webhook to URL with idempotency
   */
  private async deliverWebhook(
    webhook: IWebhook,
    payload: { eventType: string; data: Record<string, any> }
  ): Promise<IWebhookDelivery | null> {
    // Generate idempotency key based on webhook, event type, and a hash of the data
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(payload.data)).digest('hex').substring(0, 16);
    const idempotencyKey = `webhook:${webhook._id}:${payload.eventType}:${dataHash}`;
    const TTL_SECONDS = 86400; // 24 hours

    // Check for duplicate delivery using Redis
    try {
      const existingDeliveryId = await redis.get(idempotencyKey);
      if (existingDeliveryId) {
        console.log(`Duplicate webhook delivery detected, skipping: ${idempotencyKey}`);
        return null; // Skip duplicate delivery
      }
    } catch (redisErr) {
      // Redis unavailable - continue with delivery but log warning
      console.warn('Redis unavailable for idempotency check, proceeding with delivery:', redisErr);
    }

    const deliveryId = uuidv4();
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      id: deliveryId,
      timestamp,
      event: payload.eventType,
      data: payload.data,
    });

    // Create signature
    const signature = this.createSignature(body, webhook.secret);

    let status: 'pending' | 'success' | 'failed' = 'pending';
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let error: string | null = null;

    try {
      const response = await axios.post(webhook.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.eventType,
          'X-Webhook-Delivery': deliveryId,
        },
        timeout: 10000,
      });

      responseStatus = response.status;
      responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      status = response.status >= 200 && response.status < 300 ? 'success' : 'failed';
    } catch (err: any) {
      status = 'failed';
      error = err.message;
      if (err.response) {
        responseStatus = err.response.status;
        responseBody = typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data);
      }
    }

    // Save delivery record
    const delivery = await WebhookDelivery.create({
      webhookId: webhook._id,
      deliveryId,
      eventType: payload.eventType,
      payload: { eventType: payload.eventType, data: payload.data },
      status,
      attempts: 1,
      lastAttemptAt: new Date(),
      responseStatus,
      responseBody,
      error,
    });

    // Mark delivery as processed in Redis for idempotency
    try {
      await redis.setex(idempotencyKey, TTL_SECONDS, deliveryId);
    } catch (redisErr) {
      console.warn('Failed to set idempotency key in Redis:', redisErr);
    }

    // Update webhook stats
    await Webhook.findByIdAndUpdate(webhook._id, {
      $inc: { totalDeliveries: 1, ...(status === 'success' ? { successfulDeliveries: 1 } : { failedDeliveries: 1 }) },
      lastDeliveryAt: new Date(),
    });

    return delivery;
  }

  /**
   * Create HMAC signature
   */
  private createSignature(body: string, secret: string): string {
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<IWebhookDelivery | null> {
    const delivery = await WebhookDelivery.findOne({ deliveryId });
    if (!delivery || delivery.attempts >= 5) {
      return null;
    }

    const webhook = await Webhook.findById(delivery.webhookId);
    if (!webhook) {
      return null;
    }

    delivery.attempts += 1;
    delivery.lastAttemptAt = new Date();
    delivery.status = 'pending';

    try {
      const response = await axios.post(webhook.url, JSON.stringify(delivery.payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.createSignature(JSON.stringify(delivery.payload), webhook.secret),
          'X-Webhook-Event': delivery.eventType,
          'X-Webhook-Delivery': deliveryId,
        },
        timeout: 10000,
      });

      delivery.status = response.status >= 200 && response.status < 300 ? 'success' : 'failed';
      delivery.responseStatus = response.status;
      delivery.responseBody = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);
    } catch (err: any) {
      delivery.status = 'failed';
      delivery.error = err.message;
    }

    await delivery.save();
    return delivery;
  }

  /**
   * Get delivery history
   */
  async getDeliveryHistory(
    webhookId: string,
    options: { limit?: number; status?: string } = {}
  ): Promise<IWebhookDelivery[]> {
    const { limit = 50, status } = options;

    const query: any = { webhookId };
    if (status) {
      query.status = status;
    }

    return WebhookDelivery.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    const [webhookStats, deliveryStats] = await Promise.all([
      Webhook.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$active', 1, 0] } },
          },
        },
      ]),
      WebhookDelivery.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const webhooks = webhookStats[0] || { total: 0, active: 0 };
    const deliveries = deliveryStats.reduce(
      (acc, s) => {
        acc[s._id] = s.count;
        return acc;
      },
      { success: 0, failed: 0, pending: 0 }
    );

    const total = deliveries.success + deliveries.failed;
    const successRate = total > 0 ? (deliveries.success / total) * 100 : 0;

    return {
      totalWebhooks: webhooks.total,
      activeWebhooks: webhooks.active,
      totalDeliveries: deliveries.success + deliveries.failed + deliveries.pending,
      successfulDeliveries: deliveries.success,
      failedDeliveries: deliveries.failed,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Verify webhook signature
   */
  verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = this.createSignature(body, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}
