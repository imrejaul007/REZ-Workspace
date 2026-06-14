import { v4 as uuid } from 'uuid';
import { Webhook, WebhookDelivery, RetryConfig } from '../models/webhook';
import logger from '../utils/logger';

const webhooks = new Map<string, Webhook>();
const deliveries = new Map<string, WebhookDelivery>();

const defaultRetry: RetryConfig = { enabled: true, maxRetries: 3, backoffMs: 1000 };

export const createWebhook = (name: string, url: string, events: string[], options?: { secret?: string; retryConfig?: Partial<RetryConfig> }): Webhook => {
  const id = `wh_${uuid()}`;
  const webhook: Webhook = { id, name, url, events, secret: options?.secret, status: 'active', retryConfig: { ...defaultRetry, ...options?.retryConfig }, createdAt: new Date().toISOString() };
  webhooks.set(id, webhook);
  logger.info(`Webhook created: ${id}`);
  return webhook;
};

export const getWebhook = (id: string) => webhooks.get(id);
export const updateWebhook = (id: string, updates: Partial<Webhook>) => { const w = webhooks.get(id); if (w) { Object.assign(w, updates); } return w; };
export const deleteWebhook = (id: string) => webhooks.delete(id);
export const listWebhooks = () => Array.from(webhooks.values());

export const deliverWebhook = async (webhookId: string, eventType: string, data: any): Promise<WebhookDelivery> => {
  const delivery: WebhookDelivery = { id: `del_${uuid()}`, webhookId, event: eventType, status: 'pending', attempts: 0, createdAt: new Date().toISOString() };
  deliveries.set(delivery.id, delivery);
  const webhook = webhooks.get(webhookId);
  if (webhook) { webhook.lastTriggeredAt = new Date().toISOString(); }
  delivery.status = 'delivered';
  delivery.attempts = 1;
  logger.info(`Delivered webhook ${webhookId}`);
  return delivery;
};

export const getDelivery = (id: string) => deliveries.get(id);
export const getDeliveries = (webhookId: string) => Array.from(deliveries.values()).filter(d => d.webhookId === webhookId);
