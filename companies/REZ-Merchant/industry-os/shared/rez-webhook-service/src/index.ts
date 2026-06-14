/**
 * REZ Webhook Service
 * Unified Webhook Infrastructure for REZ/HOJAI ecosystem
 * Port: 4090
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { z } from 'zod';
import winston from 'winston';
import axios from 'axios';
import { WebhookSubscription, WebhookEvent, EVENT_TYPES } from './models';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'rez-webhook-service' },
});

const PORT = parseInt(process.env.PORT || '4090', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez-webhooks';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

interface AuthRequest extends Request { user?: any; isInternal?: boolean; }

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) { req.isInternal = true; return next(); }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  next();
};

// Health checks
app.get('/health', async (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
    service: 'rez-webhook-service',
    version: '1.0.0',
    events: EVENT_TYPES.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// ============================================
// WEBHOOK SUBSCRIPTION MANAGEMENT
// ============================================

// Create subscription
app.post('/api/subscriptions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      url: z.string().url(),
      events: z.array(z.string()).min(1),
      headers: z.record(z.string()).optional(),
      filters: z.record(z.any()).optional(),
    });
    const validated = schema.parse(req.body);

    // Validate events
    const invalidEvents = validated.events.filter(e => !EVENT_TYPES.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EVENTS', message: `Invalid events: ${invalidEvents.join(', ')}` },
        validEvents: EVENT_TYPES,
      });
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const subscription = await WebhookSubscription.create({
      subscriptionId: `WH-${Date.now().toString(36)}`,
      name: validated.name,
      url: validated.url,
      events: validated.events,
      secret,
      headers: validated.headers || {},
      filters: validated.filters,
      active: true,
      createdBy: req.user?.userId || 'system',
    });

    logger.info(`Webhook subscription created: ${subscription.subscriptionId}`);
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
  }
});

// List subscriptions
app.get('/api/subscriptions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { active, event } = req.query;
    const filter: any = {};
    if (active !== undefined) filter.active = active === 'true';
    if (event) filter.events = event;

    const subscriptions = await WebhookSubscription.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: subscriptions });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Get subscription
app.get('/api/subscriptions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await WebhookSubscription.findOne({ subscriptionId: req.params.id });
    if (!subscription) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: subscription });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Update subscription
app.patch('/api/subscriptions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await WebhookSubscription.findOneAndUpdate(
      { subscriptionId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!subscription) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: subscription });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } }); }
});

// Delete subscription
app.delete('/api/subscriptions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await WebhookSubscription.findOneAndDelete({ subscriptionId: req.params.id });
    if (!subscription) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'DELETE_ERROR' } }); }
});

// ============================================
// EVENT TRIGGERING (Internal use)
// ============================================

// Trigger event - called by internal services
app.post('/api/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      event: z.string(),
      payload: z.record(z.any()),
      source: z.string().optional(),
      filters: z.record(z.any()).optional(),
    });
    const { event, payload, source, filters } = schema.parse(req.body);

    // Find matching subscriptions
    const subscriptions = await WebhookSubscription.find({
      active: true,
      events: event,
    });

    // Filter by additional filters if provided
    const matching = subscriptions.filter(sub => {
      if (!sub.filters) return true;
      for (const [key, value] of Object.entries(sub.filters)) {
        if (payload[key] !== value) return false;
      }
      return true;
    });

    // Queue webhook deliveries
    const results = [];
    for (const sub of matching) {
      const webhookEvent = await WebhookEvent.create({
        eventId: `WE-${Date.now().toString(36)}`,
        subscriptionId: sub.subscriptionId,
        event,
        payload,
        status: 'pending',
      });

      // Deliver asynchronously
      deliverWebhook(sub, webhookEvent).catch(err => logger.error('Delivery error:', err));
      results.push({ subscriptionId: sub.subscriptionId, eventId: webhookEvent.eventId });
    }

    logger.info(`Event triggered: ${event}`, { subscriptions: results.length });
    res.json({ success: true, data: { event, deliveries: results.length, results } });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'TRIGGER_ERROR' } });
  }
});

// Get event logs
app.get('/api/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { subscriptionId, status, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (subscriptionId) filter.subscriptionId = subscriptionId;
    if (status) filter.status = status;

    const events = await WebhookEvent.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await WebhookEvent.countDocuments(filter);
    res.json({ success: true, data: { events, pagination: { page: Number(page), limit: Number(limit), total } } });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// WEBHOOK DELIVERY
// ============================================

async function deliverWebhook(subscription: any, webhookEvent: any, attempt = 1) {
  const maxAttempts = 3;

  try {
    // Generate signature
    const signature = crypto
      .createHmac('sha256', subscription.secret)
      .update(JSON.stringify(webhookEvent.payload))
      .digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': webhookEvent.event,
      'X-Webhook-Timestamp': Date.now().toString(),
      'X-Webhook-Event-Id': webhookEvent.eventId,
      ...subscription.headers,
    };

    const response = await axios.post(subscription.url, webhookEvent.payload, {
      headers,
      timeout: 30000,
    });

    // Success
    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      status: 'delivered',
      attempts: attempt,
      lastAttempt: new Date(),
      response: { status: response.status, body: response.data },
    });

    await WebhookSubscription.findByIdAndUpdate(subscription._id, {
      lastTriggered: new Date(),
      lastSuccess: new Date(),
      retryCount: 0,
    });

    logger.info(`Webhook delivered: ${webhookEvent.eventId}`, { subscriptionId: subscription.subscriptionId });
  } catch (error: any) {
    logger.error(`Webhook delivery failed: ${webhookEvent.eventId}`, {
      subscriptionId: subscription.subscriptionId,
      attempt,
      error: error.message,
    });

    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      attempts: attempt,
      lastAttempt: new Date(),
      error: error.message,
    });

    // Retry if attempts remaining
    if (attempt < maxAttempts) {
      await WebhookEvent.findByIdAndUpdate(webhookEvent._id, { status: 'retrying' });
      setTimeout(() => deliverWebhook(subscription, webhookEvent, attempt + 1), attempt * 5000);
    } else {
      await WebhookEvent.findByIdAndUpdate(webhookEvent._id, { status: 'failed' });
      await WebhookSubscription.findByIdAndUpdate(subscription._id, {
        lastTriggered: new Date(),
        lastError: error.message,
        $inc: { retryCount: 1 },
      });
    }
  }
}

// ============================================
// STATS
// ============================================

app.get('/api/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [totalSubscriptions, activeSubscriptions, pendingEvents, failedEvents, deliveredToday] = await Promise.all([
      WebhookSubscription.countDocuments(),
      WebhookSubscription.countDocuments({ active: true }),
      WebhookEvent.countDocuments({ status: 'pending' }),
      WebhookEvent.countDocuments({ status: 'failed' }),
      WebhookEvent.countDocuments({
        status: 'delivered',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        subscriptions: { total: totalSubscriptions, active: activeSubscriptions },
        events: { pending: pendingEvents, failed: failedEvents, deliveredToday },
      },
    });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'STATS_ERROR' } }); }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
});

const shutdown = async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, { maxPoolSize: 20, minPoolSize: 5 });
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Webhook Service started on port ${PORT}`);
      logger.info(`Supported events: ${EVENT_TYPES.length}`);
    });
  } catch (error) { logger.error('Failed to start:', error); process.exit(1); }
};

start();