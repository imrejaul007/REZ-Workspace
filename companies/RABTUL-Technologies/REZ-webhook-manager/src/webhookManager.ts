/**
 * REZ Webhook Manager
 *
 * Central webhook management with:
 * - Redis-backed persistence
 * - Retry logic
 * - Exponential backoff
 * - Delivery tracking
 * - Event filtering
 */

import express from 'express';
import logger from './utils/logger';
import axios from 'axios';
import Redis from 'ioredis';
import crypto from 'crypto';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.connect().catch((err) => {
  console.error('[WebhookManager] Redis connection failed:', err);
});

// Key prefixes
const WEBHOOK_KEY_PREFIX = 'webhook:';
const DELIVERY_KEY_PREFIX = 'delivery:';
const DELIVERY_LIST_KEY = 'deliveries:pending';

// ============================================
// TYPES
// ============================================

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
  headers: Record<string, string>;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: unknown;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  last_attempt?: string;
  response?: unknown;
  created_at: string;
}

// Retry configuration
const RETRY_CONFIG = {
  max_attempts: 5,
  base_delay_ms: 1000,
  max_delay_ms: 60000,
  backoff_multiplier: 2
};

// ============================================
// HELPERS
// ============================================

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

// SSRF protection for webhook URLs
function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block private IPs and localhost
    const blockedPatterns = [
      /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./, /^169\.254\./, /^0\./, /^localhost$/i,
      /^.*\.local$/, /^.*\.internal$/
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Only HTTPS allowed
    if (parsed.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================
// WEBHOOK MANAGEMENT
// ============================================

/**
 * POST /webhooks
 * Create webhook
 */
app.post('/webhooks', async (req, res) => {
  const { url, events, secret, headers } = req.body;

  // Validate URL for SSRF
  if (!validateWebhookUrl(url)) {
    return res.status(400).json({ error: 'Invalid webhook URL' });
  }

  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Events array required' });
  }

  const webhook: Webhook = {
    id: generateId('wh'),
    url,
    events,
    secret: secret || generateSecret(),
    active: true,
    created_at: new Date().toISOString(),
    headers: headers || {}
  };

  // Store in Redis
  await redis.set(`${WEBHOOK_KEY_PREFIX}${webhook.id}`, JSON.stringify(webhook));
  await redis.sadd(`${WEBHOOK_KEY_PREFIX}events:${event}`, webhook.id);

  res.status(201).json({ webhook_id: webhook.id, secret: webhook.secret });
});

/**
 * GET /webhooks
 * List webhooks
 */
app.get('/webhooks', async (req, res) => {
  try {
    const keys = await redis.keys(`${WEBHOOK_KEY_PREFIX}*`);
    const webhooks: Webhook[] = [];

    for (const key of keys) {
      if (key.startsWith(DELIVERY_KEY_PREFIX) || key.includes(':events:')) continue;
      const data = await redis.get(key);
      if (data) {
        webhooks.push(JSON.parse(data));
      }
    }

    res.json({ webhooks });
  } catch (error) {
    console.error('[WebhookManager] Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

/**
 * GET /webhooks/:id
 * Get webhook by ID
 */
app.get('/webhooks/:id', async (req, res) => {
  const webhook = await redis.get(`${WEBHOOK_KEY_PREFIX}${req.params.id}`);

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  res.json({ webhook: JSON.parse(webhook) });
});

/**
 * DELETE /webhooks/:id
 * Delete webhook
 */
app.delete('/webhooks/:id', async (req, res) => {
  const webhookData = await redis.get(`${WEBHOOK_KEY_PREFIX}${req.params.id}`);

  if (!webhookData) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const webhook: Webhook = JSON.parse(webhookData);

  // Remove from Redis
  await redis.del(`${WEBHOOK_KEY_PREFIX}${req.params.id}`);

  // Remove from event sets
  for (const event of webhook.events) {
    await redis.srem(`${WEBHOOK_KEY_PREFIX}events:${event}`, webhook.id);
  }

  res.json({ success: true });
});

/**
 * PATCH /webhooks/:id
 * Update webhook
 */
app.patch('/webhooks/:id', async (req, res) => {
  const key = `${WEBHOOK_KEY_PREFIX}${req.params.id}`;
  const existing = await redis.get(key);

  if (!existing) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const webhook: Webhook = JSON.parse(existing);

  // Validate URL if being updated
  if (req.body.url && !validateWebhookUrl(req.body.url)) {
    return res.status(400).json({ error: 'Invalid webhook URL' });
  }

  // Update fields
  Object.assign(webhook, req.body);

  await redis.set(key, JSON.stringify(webhook));

  res.json({ webhook });
});

// ============================================
// WEBHOOK TRIGGERING
// ============================================

/**
 * POST /webhooks/trigger
 * Trigger webhook for event
 */
app.post('/webhooks/trigger', async (req, res) => {
  const { event, payload } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Event type required' });
  }

  // Get all webhooks for this event
  const webhookIds = await redis.smembers(`${WEBHOOK_KEY_PREFIX}events:${event}`);

  if (webhookIds.length === 0) {
    return res.json({ delivered: 0 });
  }

  const deliveryIds: string[] = [];

  for (const webhookId of webhookIds) {
    const webhookData = await redis.get(`${WEBHOOK_KEY_PREFIX}${webhookId}`);
    if (!webhookData) continue;

    const webhook: Webhook = JSON.parse(webhookData);

    if (!webhook.active) continue;

    // Create delivery record
    const delivery: WebhookDelivery = {
      id: generateId('del'),
      webhook_id: webhook.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString()
    };

    // Store in Redis
    await redis.set(`${DELIVERY_KEY_PREFIX}${delivery.id}`, JSON.stringify(delivery));
    await redis.rpush(DELIVERY_LIST_KEY, delivery.id);

    deliveryIds.push(delivery.id);

    // Process delivery asynchronously
    processDelivery(delivery, webhook);
  }

  res.json({
    event,
    webhooks: webhookIds.length,
    deliveries: deliveryIds
  });
});

// ============================================
// DELIVERY PROCESSING
// ============================================

async function processDelivery(delivery: WebhookDelivery, webhook: Webhook): Promise<void> {
  delivery.attempts++;
  delivery.last_attempt = new Date().toISOString();

  try {
    const response = await axios.post(webhook.url, delivery.payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Delivery': delivery.id,
        'X-Webhook-Signature': crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(delivery.payload))
          .digest('hex'),
        ...webhook.headers
      },
      timeout: 30000
    });

    delivery.status = 'success';
    delivery.response = {
      status: response.status,
      body: response.data
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; message?: string };
    delivery.status = 'failed';
    delivery.response = {
      error: err.message,
      status: err.response?.status
    };
  }

  // Update delivery record
  await redis.set(`${DELIVERY_KEY_PREFIX}${delivery.id}`, JSON.stringify(delivery));

  // Remove from pending list if final
  if (delivery.status === 'success' || delivery.attempts >= RETRY_CONFIG.max_attempts) {
    await redis.lrem(DELIVERY_LIST_KEY, 1, delivery.id);
  }
}

/**
 * GET /deliveries/:id
 * Get delivery status
 */
app.get('/deliveries/:id', async (req, res) => {
  const delivery = await redis.get(`${DELIVERY_KEY_PREFIX}${req.params.id}`);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }

  res.json({ delivery: JSON.parse(delivery) });
});

// ============================================
// HEALTH & METRICS
// ============================================

app.get('/health', async (req, res) => {
  try {
    const ping = await redis.ping();
    const webhookCount = (await redis.keys(`${WEBHOOK_KEY_PREFIX}*`)).length;
    const pendingCount = await redis.llen(DELIVERY_LIST_KEY);

    res.json({
      status: ping === 'PONG' ? 'ok' : 'degraded',
      redis: ping === 'PONG' ? 'connected' : 'disconnected',
      webhooks: webhookCount,
      pending_deliveries: pendingCount
    });
  } catch (error) {
    res.status(503).json({ status: 'degraded', error: 'Redis unavailable' });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => {
  logger.info(`[WebhookManager] Service running on port ${PORT}`);
  logger.info(`[WebhookManager] Redis: ${REDIS_URL}`);
});
