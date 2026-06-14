/**
 * Webhook Service
 *
 * Handles webhook subscription management and event delivery:
 * - Register webhooks for specific events
 * - Retry failed deliveries with exponential backoff
 * - HMAC signature verification for security
 * - Event deduplication
 */

import axios, { AxiosError } from 'axios';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { recordWebhookDelivery } from '../metrics';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'supplier.created'
  | 'supplier.updated'
  | 'supplier.deleted'
  | 'po.created'
  | 'po.updated'
  | 'po.approved'
  | 'po.rejected'
  | 'po.confirmed'
  | 'po.received'
  | 'po.cancelled'
  | 'po.overdue'
  | 'payment.recorded'
  | 'credit_limit.exceeded'
  | 'credit_limit.reset';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  merchantId: string;
  data: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

export interface WebhookSubscription {
  _id?: Types.ObjectId;
  merchantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]; // 1s, 5s, 30s, 2m, 5m
const DEDUP_WINDOW = 3600; // 1 hour

// ── Signature Generation ──────────────────────────────────────────────────────

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 * SECURITY FIX: Added length validation before timingSafeEqual to prevent timing attacks
 * on mismatched signature lengths. crypto.timingSafeEqual throws if buffers differ in length.
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateSignature(payload, secret);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  // Length check prevents timing attack via buffer length difference
  if (sigBuf.length !== expBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// ── Event Delivery ────────────────────────────────────────────────────────────

/**
 * Deliver webhook with retry logic
 */
export async function deliverWebhook(
  webhook: WebhookSubscription,
  payload: WebhookPayload,
  attempt = 1
): Promise<WebhookDelivery> {
  const deliveryId = new Types.ObjectId().toString();
  const payloadString = JSON.stringify(payload);

  const delivery: WebhookDelivery = {
    id: deliveryId,
    webhookId: webhook._id?.toString() || '',
    event: payload.event,
    payload,
    status: 'pending',
    attempts: attempt,
    lastAttemptAt: new Date(),
    createdAt: new Date(),
  };

  try {
    const signature = generateSignature(payloadString, webhook.secret);

    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery': deliveryId,
        'User-Agent': 'ReZ-Merchant-Webhook/2.0',
      },
      timeout: 30000, // 30s timeout
      validateStatus: () => true, // Accept all status codes
    });

    delivery.responseCode = response.status;
    delivery.responseBody = typeof response.data === 'string'
      ? response.data.substring(0, 1000)
      : JSON.stringify(response.data).substring(0, 1000);

    if (response.status >= 200 && response.status < 300) {
      delivery.status = 'success';
      recordWebhookDelivery(payload.event, true, response.status, Date.now() - delivery.createdAt.getTime());
      logger.info(`[Webhook] Delivered ${payload.event} to ${webhook.url}`, {
        deliveryId,
        statusCode: response.status,
      });
    } else {
      delivery.status = 'failed';
      delivery.error = `HTTP ${response.status}`;
      recordWebhookDelivery(payload.event, false, response.status);
      logger.warn(`[Webhook] Failed delivery ${payload.event} to ${webhook.url}`, {
        deliveryId,
        statusCode: response.status,
        attempt,
      });
    }
  } catch (err) {
    const error = err as Error | AxiosError;
    delivery.status = 'failed';
    delivery.error = error.message;
    delivery.responseBody = axios.isAxiosError(err) ? err.response?.data as string : undefined;

    logger.warn(`[Webhook] Error delivering ${payload.event} to ${webhook.url}`, {
      deliveryId,
      error: error.message,
      attempt,
    });
  }

  // Retry if failed and attempts remaining
  if (delivery.status === 'failed' && attempt < MAX_RETRY_ATTEMPTS) {
    const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    delivery.attempts = attempt + 1;

    setTimeout(() => {
      // Fire and forget retry
      deliverWebhook(webhook, payload, attempt + 1).catch(() => {});
    }, delay);
  }

  return delivery;
}

// ── Event Publishing ───────────────────────────────────────────────────────────

/**
 * Publish an event to all subscribed webhooks
 */
export async function publishEvent(
  merchantId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Check for duplicate (idempotency)
  const eventId = `${merchantId}:${event}:${JSON.stringify(data)}`;
  const eventHash = crypto.createHash('sha256').update(eventId).digest('hex').substring(0, 16);

  try {
    const isDuplicate = await redis.get(`webhook:dedup:${eventHash}`);
    if (isDuplicate) {
      logger.debug(`[Webhook] Skipping duplicate event: ${event}`);
      return;
    }

    await redis.setex(`webhook:dedup:${eventHash}`, DEDUP_WINDOW, '1');
  } catch {
    // Redis unavailable - proceed without dedup
  }

  const payload: WebhookPayload = {
    id: new Types.ObjectId().toString(),
    event,
    timestamp: new Date().toISOString(),
    merchantId,
    data,
  };

  // Get all active webhooks for this event and merchant
  const webhooks = await getActiveWebhooks(merchantId, event);

  logger.info(`[Webhook] Publishing ${event} to ${webhooks.length} subscribers`, {
    event,
    merchantId,
    subscriberCount: webhooks.length,
  });

  // Deliver to all subscribers in parallel
  await Promise.allSettled(
    webhooks.map((webhook) => deliverWebhook(webhook, payload))
  );
}

// ── Subscription Management ────────────────────────────────────────────────────

/**
 * Get active webhooks for an event
 */
async function getActiveWebhooks(merchantId: string, event: WebhookEvent): Promise<WebhookSubscription[]> {
  // In production, this would query the database
  // For now, return empty array - implement with actual model when ready
  return [];
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── Event Helpers ─────────────────────────────────────────────────────────────

export const WebhookEvents = {
  // Supplier events
  SUPPLIER_CREATED: 'supplier.created' as WebhookEvent,
  SUPPLIER_UPDATED: 'supplier.updated' as WebhookEvent,
  SUPPLIER_DELETED: 'supplier.deleted' as WebhookEvent,

  // PO events
  PO_CREATED: 'po.created' as WebhookEvent,
  PO_UPDATED: 'po.updated' as WebhookEvent,
  PO_APPROVED: 'po.approved' as WebhookEvent,
  PO_REJECTED: 'po.rejected' as WebhookEvent,
  PO_CONFIRMED: 'po.confirmed' as WebhookEvent,
  PO_RECEIVED: 'po.received' as WebhookEvent,
  PO_CANCELLED: 'po.cancelled' as WebhookEvent,
  PO_OVERDUE: 'po.overdue' as WebhookEvent,

  // Payment events
  PAYMENT_RECORDED: 'payment.recorded' as WebhookEvent,

  // Credit events
  CREDIT_LIMIT_EXCEEDED: 'credit_limit.exceeded' as WebhookEvent,
  CREDIT_LIMIT_RESET: 'credit_limit.reset' as WebhookEvent,
};

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  'supplier.created',
  'supplier.updated',
  'supplier.deleted',
  'po.created',
  'po.updated',
  'po.approved',
  'po.rejected',
  'po.confirmed',
  'po.received',
  'po.cancelled',
  'po.overdue',
  'payment.recorded',
  'credit_limit.exceeded',
  'credit_limit.reset',
];

export const EVENT_CATEGORIES = {
  supplier: ['supplier.created', 'supplier.updated', 'supplier.deleted'],
  purchase_order: [
    'po.created',
    'po.updated',
    'po.approved',
    'po.rejected',
    'po.confirmed',
    'po.received',
    'po.cancelled',
    'po.overdue',
  ],
  payment: ['payment.recorded'],
  credit: ['credit_limit.exceeded', 'credit_limit.reset'],
};
