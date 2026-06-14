import logger from './utils/logger';

/**
 * REZ Business AI - Webhook System
 * Real-time event notifications
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Store webhooks and events
const webhooks = new Map();
const events = [];

// Event types
const EVENT_TYPES = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'payment.received',
  'customer.created',
  'customer.churned',
  'inventory.low',
  'campaign.launched',
  'campaign.completed',
  'campaign.failed',
  'ai.suggestion.created',
  'ai.action.approved',
  'ai.action.rejected',
  'ai.goal.achieved',
  'ai.goal.missed',
];

// ============== WEBHOOK MANAGEMENT ==============

// Register webhook
router.post('/webhooks', (req, res) => {
  const { url, events: eventTypes, secret, merchantId } = req.body;

  if (!url || !eventTypes || eventTypes.length === 0) {
    return res.status(400).json({ error: 'url and events required' });
  }

  const id = crypto.randomBytes(16).toString('hex');
  const webhook = {
    id,
    url,
    events: eventTypes,
    merchantId,
    secret: secret || crypto.randomBytes(32).toString('hex'),
    active: true,
    createdAt: new Date().toISOString(),
    stats: { delivered: 0, failed: 0, lastDelivery: null },
  };

  webhooks.set(id, webhook);

  res.json({ success: true, webhook });
});

// List webhooks
router.get('/webhooks', (req, res) => {
  const { merchantId } = req.query;
  let list = Array.from(webhooks.values());

  if (merchantId) {
    list = list.filter(w => w.merchantId === merchantId);
  }

  res.json({ webhooks: list });
});

// Delete webhook
router.delete('/webhooks/:id', (req, res) => {
  const { id } = req.params;
  webhooks.delete(id);
  res.json({ success: true });
});

// ============== EVENT TRIGGering ==============

// Emit event (internal)
function emitEvent(type, payload) {
  const event = {
    id: crypto.randomBytes(16).toString('hex'),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  events.unshift(event);
  if (events.length > 1000) events.pop();

  // Find matching webhooks
  const matching = Array.from(webhooks.values()).filter(w =>
    w.active && w.events.includes(type)
  );

  // Deliver to each webhook
  for (const webhook of matching) {
    deliverWebhook(webhook, event);
  }

  return event;
}

// Deliver webhook
async function deliverWebhook(webhook, event) {
  const payload = JSON.stringify({
    event: event.type,
    data: event.payload,
    timestamp: event.timestamp,
  });

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(payload)
    .digest('hex');

  try {
    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-REZ-Signature': signature,
        'X-REZ-Event': event.type,
      },
      body: payload,
    });

    webhook.stats.delivered++;
    webhook.stats.lastDelivery = new Date().toISOString();
  } catch (err) {
    webhook.stats.failed++;
    logger.error(`Webhook delivery failed: ${err.message}`);
  }
}

// ============== EVENT API ==============

// Publish event
router.post('/events', (req, res) => {
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: 'type and payload required' });
  }

  if (!EVENT_TYPES.includes(type)) {
    return res.status(400).json({ error: `Unknown event type. Valid: ${EVENT_TYPES.join(', ')}` });
  }

  const event = emitEvent(type, payload);
  res.json({ success: true, event });
});

// Get events
router.get('/events', (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;

  let filtered = events;
  if (type) {
    filtered = events.filter(e => e.type === type);
  }

  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    events: paginated,
    total: filtered.length,
    hasMore: offset + limit < filtered.length,
  });
});

// Event types
router.get('/events/types', (req, res) => {
  res.json({ types: EVENT_TYPES });
});

// ============== WEBHOOK DELIVERY STATUS ==============

router.get('/webhooks/:id/deliveries', (req, res) => {
  const webhook = webhooks.get(req.params.id);
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  res.json({
    webhookId: webhook.id,
    stats: webhook.stats,
  });
});

// ============== REPLAY EVENTS ==============

router.post('/webhooks/:id/replay', (req, res) => {
  const { eventIds } = req.body;
  const webhook = webhooks.get(req.params.id);

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const toReplay = events.filter(e => eventIds.includes(e.id));

  for (const event of toReplay) {
    deliverWebhook(webhook, event);
  }

  res.json({ success: true, delivered: toReplay.length });
});

module.exports = router;
module.exports.emitEvent = emitEvent;
