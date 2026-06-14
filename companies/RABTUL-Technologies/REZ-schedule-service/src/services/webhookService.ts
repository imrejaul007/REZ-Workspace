// ReZ Schedule - Webhook Service
import { createHmac, randomBytes } from 'crypto';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const WEBHOOK_DELIVERY_TIMEOUT = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [60, 300, 900, 3600, 14400]; // 1m, 5m, 15m, 1h, 4h

export type WebhookEvent =
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.rescheduled'
  | 'booking.completed'
  | 'booking.no_show'
  | 'booking.reminder_sent'
  | 'event_type.created'
  | 'event_type.updated'
  | 'event_type.deleted'
  | 'availability.updated';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export class WebhookService {
  /**
   * Generate a webhook secret
   */
  generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create webhook signature for verification
   */
  signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.signPayload(payload, secret);

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Emit a webhook event
   */
  async emit(
    event: WebhookEvent,
    entityId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data,
    };

    // Find all active webhooks that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
        triggers: { has: event },
      },
    });

    if (webhooks.length === 0) {
      logger.debug(`[Webhook] No webhooks registered for event: ${event}`);
      return;
    }

    logger.info(`[Webhook] Emitting ${event} to ${webhooks.length} webhooks`);

    // Queue deliveries asynchronously
    for (const webhook of webhooks) {
      this.queueDelivery(webhook.id, event, entityId, payload);
    }
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(
    webhookId: string,
    event: WebhookEvent,
    entityId: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId,
          eventType: event,
          eventId: entityId,
          payload: payload as unknown as object,
          status: 'PENDING',
        },
      });

      // Process delivery asynchronously
      this.processDelivery(delivery.id).catch(err => {
        logger.error(`[Webhook] Delivery failed:`, err);
      });
    } catch (error) {
      logger.error(`[Webhook] Failed to queue delivery:`, error);
    }
  }

  /**
   * Process a webhook delivery
   */
  async processDelivery(deliveryId: string): Promise<boolean> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhookId: true } as never,
    });

    if (!delivery) {
      logger.error(`[Webhook] Delivery not found: ${deliveryId}`);
      return false;
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: (delivery as { webhookId: string }).webhookId },
    });

    if (!webhook) {
      logger.error(`[Webhook] Webhook not found`);
      return false;
    }

    const payload = JSON.stringify(delivery.payload);
    const signature = this.signPayload(payload, webhook.secret);

    try {
      const response = await axios.post(webhook.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Rez-Schedule-Signature': signature,
          'X-Rez-Schedule-Event': delivery.eventType,
          'X-Rez-Schedule-Delivery-Id': delivery.id,
          'User-Agent': 'ReZ-Schedule-Webhook/1.0',
        },
        timeout: WEBHOOK_DELIVERY_TIMEOUT,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Update delivery as successful
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 1000),
          lastAttemptAt: new Date(),
        },
      });

      // Update webhook stats
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });

      logger.info(`[Webhook] Delivered ${delivery.eventType} to ${webhook.url}`);
      return true;
    } catch (error) {
      const attemptCount = delivery.attemptCount + 1;
      const nextRetryAt = attemptCount < MAX_RETRY_ATTEMPTS
        ? new Date(Date.now() + RETRY_DELAYS[attemptCount - 1] * 1000)
        : null;

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attemptCount,
          status: attemptCount < MAX_RETRY_ATTEMPTS ? 'RETRYING' : 'FAILED',
          nextRetryAt,
          lastAttemptAt: new Date(),
          responseCode: (error as { response?: { status?: number } }).response?.status,
          responseBody: (error as Error).message.substring(0, 500),
        },
      });

      // Update webhook failure count
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
        },
      });

      logger.warn(`[Webhook] Delivery failed (attempt ${attemptCount}):`, error);

      // Schedule retry if applicable
      if (attemptCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS[attemptCount - 1] * 1000;
        setTimeout(() => {
          this.processDelivery(deliveryId).catch(err => {
            logger.error(`[Webhook] Retry failed:`, err);
          });
        }, delay);
      }

      return false;
    }
  }

  /**
   * Create a new webhook
   */
  async createWebhook(data: {
    userId?: string;
    organizationId?: string;
    url: string;
    triggers: WebhookEvent[];
    settings?: Record<string, unknown>;
  }): Promise<{ id: string; secret: string }> {
    const secret = this.generateSecret();

    const webhook = await prisma.webhook.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        url: data.url,
        secret,
        triggers: data.triggers,
        settings: data.settings as object,
      },
    });

    logger.info(`[Webhook] Created webhook ${webhook.id}`);

    return { id: webhook.id, secret };
  }

  /**
   * List webhooks for a user/org
   */
  async listWebhooks(userId?: string, organizationId?: string) {
    return prisma.webhook.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await prisma.webhook.delete({
      where: { id: webhookId },
    });
    logger.info(`[Webhook] Deleted webhook ${webhookId}`);
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(
    webhookId: string,
    options: { limit?: number; status?: string } = {}
  ) {
    return prisma.webhookDelivery.findMany({
      where: {
        webhookId,
        ...(options.status ? { status: options.status as 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status !== 'FAILED') {
      return false;
    }

    // Reset for retry
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        attemptCount: 0,
        nextRetryAt: null,
      },
    });

    return this.processDelivery(deliveryId);
  }

  /**
   * Retry all failed deliveries for a webhook
   */
  async retryFailedDeliveries(webhookId: string): Promise<number> {
    const failed = await prisma.webhookDelivery.findMany({
      where: {
        webhookId,
        status: 'FAILED',
      },
    });

    for (const delivery of failed) {
      await this.retryDelivery(delivery.id);
    }

    return failed.length;
  }
}

export const webhookService = new WebhookService();
export default webhookService;
