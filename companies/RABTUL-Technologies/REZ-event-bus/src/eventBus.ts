/**
 * REZ Event Bus Service
 *
 * Central event bus for cross-company events
 *
 * Events:
 * - user.* (Auth)
 * - purchase.* (Order)
 * - payment.* (Payment)
 * - qr.* (QR Services)
 * - loyalty.* (Karma/Wallet)
 * - booking.* (Hotel)
 * - ad.* (Advertising)
 * - support.* (Care)
 */

import express from 'express';
import logger from './utils/logger';
import axios from 'axios';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// Redis for pub/sub
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// MongoDB for event store
const EventSchema = new mongoose.Schema({
  event_id: String,
  event_type: String,
  source: String,
  data: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false }
});

const Event = mongoose.model('Event', EventSchema);

// Subscribers map
const subscribers = new Map<string, Function[]>();

// ============================================
// EVENT TYPES
// ============================================

export const EVENTS = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATED: 'user.updated',

  // Purchase Events
  PURCHASE_CREATED: 'purchase.created',
  PURCHASE_COMPLETED: 'purchase.completed',
  PURCHASE_CANCELLED: 'purchase.cancelled',
  PURCHASE_REFUNDED: 'purchase.refunded',

  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // QR Events
  QR_SCANNED: 'qr.scanned',
  QR_CREATED: 'qr.created',
  WARRANTY_ACTIVATED: 'warranty.activated',
  CLAIM_FILED: 'claim.filed',
  CLAIM_RESOLVED: 'claim.resolved',
  BOOKING_CREATED: 'booking.created',
  BOOKING_COMPLETED: 'booking.completed',

  // Loyalty Events
  KARMA_EARNED: 'karma.earned',
  KARMA_REDEEMED: 'karma.redeemed',
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',

  // Hotel/Booking Events
  ROOM_BOOKED: 'room.booked',
  CHECKIN: 'hotel.checkin',
  CHECKOUT: 'hotel.checkout',

  // Ad Events
  AD_VIEWED: 'ad.viewed',
  AD_CLICKED: 'ad.clicked',
  AD_CONVERTED: 'ad.converted',

  // Support Events
  TICKET_CREATED: 'support.ticket_created',
  TICKET_RESOLVED: 'support.ticket_resolved',
  CSAT_SUBMITTED: 'support.csat_submitted',

  // Professional Events
  EMPLOYEE_ONBOARDED: 'employee.onboarded',
  BENEFIT_REDEEMED: 'benefit.redeemed'
};

// ============================================
// PUBLISH EVENT
// ============================================

async function publish(eventType: string, data, source: string) {
  // Generate cryptographically secure event ID
  const eventId = `evt_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;

  const event = {
    event_id: eventId,
    event_type: eventType,
    source,
    data,
    timestamp: new Date().toISOString()
  };

  // Store in MongoDB
  await Event.create(event);

  // Publish to Redis
  await redis.publish('events', JSON.stringify(event));

  // Process subscribers
  const handlers = subscribers.get(eventType) || [];
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (e) {
      console.error(`Handler error for ${eventType}:`, e);
    }
  }

  // Publish to intelligence signal aggregator
  try {
    await axios.post(`${process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com'}/api/collect`, {
      service: source,
      event: eventType,
      user_id: data.user_id || data.customer_id || data.guest_id,
      entities: data,
      timestamp: event.timestamp
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });
  } catch (e) {
    // Don't fail event publishing
  }

  return eventId;
}

// ============================================
// SUBSCRIBE
// ============================================

function subscribe(eventType: string, handler: Function) {
  if (!subscribers.has(eventType)) {
    subscribers.set(eventType, []);
  }
  subscribers.get(eventType)!.push(handler);

  return () => {
    const handlers = subscribers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  };
}

// ============================================
// REST API
// ============================================

// Publish event
app.post('/events', async (req, res) => {
  const { event_type, source, data } = req.body;

  if (!event_type || !source) {
    return res.status(400).json({ error: 'event_type and source required' });
  }

  const eventId = await publish(event_type, data || {}, source);
  res.json({ success: true, event_id: eventId });
});

// Get events
app.get('/events', async (req, res) => {
  const { event_type, source, from, to, limit = 100 } = req.query;

  const query: unknown = {};
  if (event_type) query.event_type = event_type;
  if (source) query.source = source;
  if (from || to) {
    query.timestamp = {};
    if (from) query.timestamp.$gte = new Date(from as string);
    if (to) query.timestamp.$lte = new Date(to as string);
  }

  const events = await Event.find(query)
    .sort({ timestamp: -1 })
    .limit(Number(limit));

  res.json({ events, count: events.length });
});

// Get event by ID
app.get('/events/:id', async (req, res) => {
  const event = await Event.findOne({ event_id: req.params.id });
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// Subscribe webhook
app.post('/subscribe', (req, res) => {
  const { event_type, webhook_url } = req.body;

  if (!event_type || !webhook_url) {
    return res.status(400).json({ error: 'event_type and webhook_url required' });
  }

  const unsubscribe = subscribe(event_type, async (event) => {
    try {
      await axios.post(webhook_url, event, {
        timeout: 5000
      });
    } catch (e) {
      console.error(`Webhook failed for ${event_type}:`, e);
    }
  });

  res.json({ success: true, message: `Subscribed to ${event_type}` });
});

// Get subscribers
app.get('/subscribers', (req, res) => {
  res.json({
    subscribers: Array.from(subscribers.entries()).map(([type, handlers]) => ({
      event_type: type,
      count: handlers.length
    }))
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    events: 'event_bus',
    subscribers: subscribers.size
  });
});

// ============================================
// START
// ============================================

async function start() {
  // Connect to Redis
  redis.on('error', (e) => console.error('Redis error:', e));
  await redis.ping();

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-bus');

  // Subscribe to Redis channel
  subscriber.subscribe('events');
  subscriber.on('message', (channel, message) => {
    if (channel === 'events') {
      const event = JSON.parse(message);
      const handlers = subscribers.get(event.event_type) || [];
      for (const handler of handlers) {
        handler(event).catch(console.error);
      }
    }
  });

  const PORT = process.env.PORT || 4032;

  app.listen(PORT, () => {
    logger.info(`REZ Event Bus running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
  });
}

start().catch(console.error);

// Export for use
export { publish, subscribe };
