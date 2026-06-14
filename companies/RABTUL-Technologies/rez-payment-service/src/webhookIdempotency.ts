// Webhook Idempotency Service

import IORedis from 'ioredis';
import { logger } from './utils/logger';

export class WebhookIdempotency {
  private redis: IORedis;
  // SECURITY FIX: Extended TTL to 72 hours to match Razorpay retry window
  private ttl = 72 * 60 * 60; // 72 hours (259200 seconds)

  constructor(redis: IORedis) {
    this.redis = redis;
  }

  async isProcessed(eventId: string): Promise<boolean> {
    const key = `webhook:processed:${eventId}`;
    const result = await this.redis.get(key);
    return result !== null;
  }

  async markProcessed(eventId: string): Promise<void> {
    const key = `webhook:processed:${eventId}`;
    await this.redis.setex(key, this.ttl, Date.now().toString());
  }

  async handleWebhook(eventId: string, handler: () => Promise<void>): Promise<void> {
    // Check if already processed
    if (await this.isProcessed(eventId)) {
      logger.info(`Webhook ${eventId} already processed, skipping`);
      return;
    }

    try {
      await handler();
      await this.markProcessed(eventId);
    } catch (error) {
      // Don't mark as processed if handler failed
      throw error;
    }
  }
}
