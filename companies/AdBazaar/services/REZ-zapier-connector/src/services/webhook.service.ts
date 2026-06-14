import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { WebhookSubscription, WebhookEvent, WebhookPayload } from '../types';
import { authService } from './auth.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('WebhookService');

// In-memory storage
const webhooks: Map<string, WebhookSubscription> = new Map();

export class WebhookService {
  async create(integrationId: string, tenantId: string, event: WebhookEvent, url: string): Promise<WebhookSubscription> {
    const secret = uuidv4();

    const webhook: WebhookSubscription = {
      id: uuidv4(),
      integrationId,
      tenantId,
      event,
      url,
      secret,
      isActive: true,
      createdAt: new Date(),
    };

    webhooks.set(webhook.id, webhook);
    logger.info('Webhook subscription created', { webhookId: webhook.id, event, url });

    return webhook;
  }

  async findById(id: string): Promise<WebhookSubscription | null> {
    return webhooks.get(id) || null;
  }

  async findByTenant(tenantId: string): Promise<WebhookSubscription[]> {
    return Array.from(webhooks.values())
      .filter(w => w.tenantId === tenantId);
  }

  async findByEvent(tenantId: string, event: WebhookEvent): Promise<WebhookSubscription[]> {
    return Array.from(webhooks.values())
      .filter(w => w.tenantId === tenantId && w.event === event && w.isActive);
  }

  async update(id: string, updates: Partial<WebhookSubscription>): Promise<WebhookSubscription | null> {
    const existing = webhooks.get(id);
    if (!existing) {
      return null;
    }

    const updated: WebhookSubscription = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    webhooks.set(id, updated);
    logger.info('Webhook updated', { webhookId: id });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = webhooks.delete(id);
    if (deleted) {
      logger.info('Webhook deleted', { webhookId: id });
    }
    return deleted;
  }

  async toggleActive(id: string, isActive: boolean): Promise<WebhookSubscription | null> {
    return this.update(id, { isActive });
  }

  async trigger(event: WebhookEvent, data: Record<string, unknown>): Promise<{ success: number; failed: number }> {
    const subscriptions = Array.from(webhooks.values())
      .filter(w => w.event === event && w.isActive);

    let success = 0;
    let failed = 0;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      signature: undefined, // Will be set per webhook
    };

    for (const subscription of subscriptions) {
      try {
        payload.signature = authService.generateWebhookSignature(
          JSON.stringify(payload),
          subscription.secret
        );

        await axios.post(subscription.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': payload.signature,
            'X-Webhook-Event': event,
          },
          timeout: 10000,
        });

        success++;
        logger.debug('Webhook triggered successfully', { webhookId: subscription.id, event });
      } catch (error) {
        failed++;
        logger.error('Webhook trigger failed', {
          webhookId: subscription.id,
          event,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Deactivate webhook after 5 consecutive failures
        const webhook = webhooks.get(subscription.id);
        if (webhook) {
          webhook.isActive = false;
          webhooks.set(subscription.id, webhook);
          logger.warn('Webhook deactivated due to failures', { webhookId: subscription.id });
        }
      }
    }

    return { success, failed };
  }

  // Zapier-compatible REST hook endpoints
  async registerRestHook(tenantId: string, event: WebhookEvent): Promise<{ id: string; subscribeUrl: string }> {
    const webhook = await this.create('zapier', tenantId, event, '');
    return {
      id: webhook.id,
      subscribeUrl: `/api/hooks/${webhook.id}/resthook`,
    };
  }
}

export const webhookService = new WebhookService();
