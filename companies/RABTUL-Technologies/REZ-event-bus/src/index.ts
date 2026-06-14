/**
 * REZ Event Bus Service Entry Point
 *
 * Service: REZ-event-bus
 * Port: 4025
 * Category: infrastructure
 *
 * The nervous system of the REZ ecosystem
 *
 * Integrations:
 * - REZ Memory Layer (4201) - Memory and context service
 * - REZ Flow Runtime (4200) - Workflow orchestration
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import { rezEventBus, REZEvent, CommerceEvents, LoyaltyEvents, IntelligenceEvents, EngagementEvents, SupportEvents, MediaEvents, IdentityEvents, WhatsAppEvents, CartEvents, LoyaltyTierEvents, CampaignEvents, EventCategory, EventPriority, initializeEventConsumers } from './rezEventBus';
import { SubscriptionConfig, DeadLetterEvent, EventDeliveryLog } from './models/subscription.model';
import { subscriberForwarder } from './services/subscriberForwarder';
import { initializeNewServiceSubscriptions, getSubscriptionStatus, registerSubscriberHandlers, NEW_SERVICE_SUBSCRIPTIONS } from './services/serviceSubscribers';

const app = express();
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-bus';

// ============================================
// Health Endpoints
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-event-bus',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    schemas: rezEventBus.getSchemaRegistry().getAllSchemas().length,
    subscriptions: rezEventBus.listenerCount('*')
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

// ============================================
// Event Publishing Endpoints
// ============================================

/**
 * Publish a generic event
 * POST /api/events
 */
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const id = await rezEventBus.publish(event);
    res.status(201).json({
      success: true,
      eventId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PUBLISH_ERROR', message: error.message }
    });
  }
});

/**
 * Publish commerce event
 * POST /api/events/commerce
 */
app.post('/api/events/commerce', async (req: Request, res: Response) => {
  try {
    const { type, data, userId, merchantId, correlationId } = req.body;
    const id = await rezEventBus.publishCommerce(type, data, { userId, merchantId, correlationId });
    res.status(201).json({ success: true, eventId: id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Publish intelligence event
 * POST /api/events/intelligence
 */
app.post('/api/events/intelligence', async (req: Request, res: Response) => {
  try {
    const { type, data, userId } = req.body;
    const id = await rezEventBus.publishIntelligence(type, data, { userId });
    res.status(201).json({ success: true, eventId: id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Event Query Endpoints
// ============================================

/**
 * Get events by type
 * GET /api/events/type/:type
 */
app.get('/api/events/type/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  const events = rezEventBus.getEventsByType(type, limit);
  res.json({ success: true, events, count: events.length });
});

/**
 * Get events by user
 * GET /api/events/user/:userId
 */
app.get('/api/events/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  const events = rezEventBus.getEventsByUser(userId, limit);
  res.json({ success: true, events, count: events.length });
});

/**
 * Get events by correlation ID (tracing)
 * GET /api/events/correlation/:correlationId
 */
app.get('/api/events/correlation/:correlationId', (req: Request, res: Response) => {
  const { correlationId } = req.params;
  const events = rezEventBus.getEventsByCorrelation(correlationId);
  res.json({ success: true, events, count: events.length });
});

/**
 * Query events with filters
 * POST /api/events/query
 */
app.post('/api/events/query', (req: Request, res: Response) => {
  const filters = req.body;
  const events = rezEventBus.queryEvents(filters);
  res.json({ success: true, events, count: events.length });
});

/**
 * Get recent events
 * GET /api/events/recent
 */
app.get('/api/events/recent', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const events = rezEventBus.getRecentEvents(limit);
  res.json({ success: true, events, count: events.length });
});

// ============================================
// Schema Registry Endpoints
// ============================================

/**
 * Get all schemas
 * GET /api/schemas
 */
app.get('/api/schemas', (req: Request, res: Response) => {
  const schemas = rezEventBus.getSchemaRegistry().getAllSchemas();
  res.json({ success: true, schemas, count: schemas.length });
});

/**
 * Get schema by type
 * GET /api/schemas/:type
 */
app.get('/api/schemas/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const version = req.query.version as string;
  const schema = rezEventBus.getSchemaRegistry().get(type, version);
  if (schema) {
    res.json({ success: true, schema });
  } else {
    res.status(404).json({ success: false, error: 'Schema not found' });
  }
});

/**
 * Validate event against schema
 * POST /api/schemas/validate
 */
app.post('/api/schemas/validate', (req: Request, res: Response) => {
  const { event } = req.body;
  const validation = rezEventBus.getSchemaRegistry().validate(event);
  res.json({ success: true, ...validation });
});

// ============================================
// Dead Letter Queue Endpoints
// ============================================

/**
 * Get dead letter events
 * GET /api/dlq
 */
app.get('/api/dlq', (req: Request, res: Response) => {
  const events = rezEventBus.getDeadLetters();
  res.json({ success: true, events, count: events.length });
});

/**
 * Retry a dead letter event
 * POST /api/dlq/retry
 */
app.post('/api/dlq/retry', async (req: Request, res: Response) => {
  try {
    const { event } = req.body;
    const id = await rezEventBus.retryDeadLetter(event);
    res.json({ success: true, eventId: id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Subscription Endpoints
// ============================================

/**
 * Create subscription
 * POST /api/subscriptions
 */
app.post('/api/subscriptions', (req: Request, res: Response) => {
  const { groupId, topics, maxConcurrency } = req.body;
  const handler = async (event: REZEvent) => {
    // In production, this would forward to a message queue
    logger.info([EventBus] Event received: ${event.type}`, { userId: event.userId });
  };
  const subscriptionId = rezEventBus.subscribe({ groupId, topics, maxConcurrency }, handler);
  res.json({ success: true, subscriptionId });
});

/**
 * Get event statistics
 * GET /api/stats
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const stats = rezEventBus.getStats();
  res.json({ success: true, stats });
});

// ============================================
// Typed Event Publishing Convenience Endpoints
// ============================================

// Commerce Events
app.post('/api/events/commerce/order-created', async (req: Request, res: Response) => {
  const id = await CommerceEvents.orderCreated(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/commerce/order-completed', async (req: Request, res: Response) => {
  const id = await CommerceEvents.orderCompleted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/commerce/order-cancelled', async (req: Request, res: Response) => {
  const id = await CommerceEvents.orderCancelled(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/commerce/payment-completed', async (req: Request, res: Response) => {
  const id = await CommerceEvents.paymentCompleted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Identity Events
app.post('/api/events/identity/user-created', async (req: Request, res: Response) => {
  const id = await IdentityEvents.userCreated(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/identity/user-linked', async (req: Request, res: Response) => {
  const id = await IdentityEvents.userLinked(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Loyalty Events
app.post('/api/events/loyalty/points-earned', async (req: Request, res: Response) => {
  const id = await LoyaltyEvents.pointsEarned(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/loyalty/points-redeemed', async (req: Request, res: Response) => {
  const id = await LoyaltyEvents.pointsRedeemed(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Intelligence Events
app.post('/api/events/intelligence/intent-detected', async (req: Request, res: Response) => {
  const id = await IntelligenceEvents.intentDetected(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/intelligence/churn-risk', async (req: Request, res: Response) => {
  const id = await IntelligenceEvents.churnRisk(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Engagement Events
app.post('/api/events/engagement/page-viewed', async (req: Request, res: Response) => {
  const id = await EngagementEvents.pageViewed(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/engagement/qr-scanned', async (req: Request, res: Response) => {
  const id = await EngagementEvents.qrScanned(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Support Events
app.post('/api/events/support/ticket-created', async (req: Request, res: Response) => {
  const id = await SupportEvents.ticketCreated(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/support/csat-submitted', async (req: Request, res: Response) => {
  const id = await SupportEvents.csatSubmitted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Media Events
app.post('/api/events/media/ad-impression', async (req: Request, res: Response) => {
  const id = await MediaEvents.adImpression(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/media/ad-conversion', async (req: Request, res: Response) => {
  const id = await MediaEvents.adConversion(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// WhatsApp Events
app.post('/api/events/whatsapp/message-received', async (req: Request, res: Response) => {
  const id = await WhatsAppEvents.messageReceived(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/whatsapp/message-sent', async (req: Request, res: Response) => {
  const id = await WhatsAppEvents.messageSent(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/whatsapp/session-started', async (req: Request, res: Response) => {
  const id = await WhatsAppEvents.sessionStarted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/whatsapp/session-ended', async (req: Request, res: Response) => {
  const id = await WhatsAppEvents.sessionEnded(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Cart Events
app.post('/api/events/commerce/cart-abandoned', async (req: Request, res: Response) => {
  const id = await CartEvents.cartAbandoned(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Loyalty Tier Events
app.post('/api/events/loyalty/tier-upgraded', async (req: Request, res: Response) => {
  const id = await LoyaltyTierEvents.tierUpgraded(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/loyalty/tier-downgraded', async (req: Request, res: Response) => {
  const id = await LoyaltyTierEvents.tierDowngraded(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Campaign Events
app.post('/api/events/engagement/campaign-started', async (req: Request, res: Response) => {
  const id = await CampaignEvents.campaignStarted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

app.post('/api/events/engagement/campaign-completed', async (req: Request, res: Response) => {
  const id = await CampaignEvents.campaignCompleted(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// Support Ticket Resolved
app.post('/api/events/support/ticket-resolved', async (req: Request, res: Response) => {
  const id = await SupportEvents.ticketResolved(req.body.data, req.body.options);
  res.status(201).json({ success: true, eventId: id });
});

// ============================================
// Subscriber Management Endpoints (MongoDB)
// ============================================

/**
 * Get all subscriber subscriptions
 * GET /api/subscribers
 */
app.get('/api/subscribers', async (req: Request, res: Response) => {
  try {
    const subscribers = await SubscriptionConfig.find({ active: true }).lean();
    res.json({ success: true, subscribers, count: subscribers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get new service subscriptions status
 * GET /api/subscribers/status
 */
app.get('/api/subscribers/status', async (req: Request, res: Response) => {
  try {
    const status = await getSubscriptionStatus();
    res.json({ success: true, services: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get subscriber stats
 * GET /api/subscribers/:serviceId/stats
 */
app.get('/api/subscribers/:serviceId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await subscriberForwarder.getSubscriberStats(req.params.serviceId);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a new subscription
 * POST /api/subscribers
 */
app.post('/api/subscribers', async (req: Request, res: Response) => {
  try {
    const { serviceId, serviceName, endpoint, port, categories, eventTypes, concurrency, headers } = req.body;

    if (!serviceId || !serviceName || !endpoint || !port) {
      return res.status(400).json({ success: false, error: 'Missing required fields: serviceId, serviceName, endpoint, port' });
    }

    const subscription = await SubscriptionConfig.create({
      serviceId,
      serviceName,
      endpoint,
      port,
      categories: categories || [],
      eventTypes: eventTypes || [],
      concurrency: concurrency || 1,
      headers: headers || {},
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      },
      dlqThreshold: 5,
      active: true
    });

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Subscription already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/**
 * Update a subscription
 * PUT /api/subscribers/:serviceId
 */
app.put('/api/subscribers/:serviceId', async (req: Request, res: Response) => {
  try {
    const { categories, eventTypes, concurrency, active, endpoint, port } = req.body;
    const updateData: unknown = {};

    if (categories) updateData.categories = categories;
    if (eventTypes) updateData.eventTypes = eventTypes;
    if (concurrency !== undefined) updateData.concurrency = concurrency;
    if (active !== undefined) updateData.active = active;
    if (endpoint) updateData.endpoint = endpoint;
    if (port) updateData.port = port;

    const result = await SubscriptionConfig.findOneAndUpdate(
      { serviceId: req.params.serviceId },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    res.json({ success: true, subscription: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete a subscription
 * DELETE /api/subscribers/:serviceId
 */
app.delete('/api/subscribers/:serviceId', async (req: Request, res: Response) => {
  try {
    const result = await SubscriptionConfig.deleteOne({ serviceId: req.params.serviceId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Activate/deactivate a subscription
 * POST /api/subscribers/:serviceId/activate
 * POST /api/subscribers/:serviceId/deactivate
 */
app.post('/api/subscribers/:serviceId/activate', async (req: Request, res: Response) => {
  try {
    await SubscriptionConfig.updateOne(
      { serviceId: req.params.serviceId },
      { $set: { active: true } }
    );
    res.json({ success: true, message: 'Subscription activated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/subscribers/:serviceId/deactivate', async (req: Request, res: Response) => {
  try {
    await SubscriptionConfig.updateOne(
      { serviceId: req.params.serviceId },
      { $set: { active: false } }
    );
    res.json({ success: true, message: 'Subscription deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MongoDB DLQ Endpoints
// ============================================

/**
 * Get MongoDB DLQ events
 * GET /api/dlq/mongo
 */
app.get('/api/dlq/mongo', async (req: Request, res: Response) => {
  try {
    const { subscriberId, status, limit = 100 } = req.query;
    const query: unknown = {};
    if (subscriberId) query.subscriberId = subscriberId;
    if (status) query.status = status;

    const events = await DeadLetterEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, events, count: events.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Retry a MongoDB DLQ event
 * POST /api/dlq/mongo/:id/retry
 */
app.post('/api/dlq/mongo/:id/retry', async (req: Request, res: Response) => {
  try {
    const dlqEvent = await DeadLetterEvent.findById(req.params.id);
    if (!dlqEvent) {
      return res.status(404).json({ success: false, error: 'DLQ event not found' });
    }

    const success = await subscriberForwarder.retryDeadLetter(dlqEvent);
    if (success) {
      res.json({ success: true, message: 'Event retried successfully' });
    } else {
      res.json({ success: false, message: 'Retry failed - check DLQ for details' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get delivery logs
 * GET /api/delivery-logs
 */
app.get('/api/delivery-logs', async (req: Request, res: Response) => {
  try {
    const { subscriberId, eventType, status, limit = 100 } = req.query;
    const query: unknown = {};
    if (subscriberId) query.subscriberId = subscriberId;
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;

    const logs = await EventDeliveryLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Export for testing
// ============================================

export { app, rezEventBus };
export default app;

// ============================================
// Event Forwarding Handlers
// ============================================

/**
 * Forward events to subscriber endpoints
 */
async function forwardEventToSubscribers(event: REZEvent): Promise<void> {
  try {
    const results = await subscriberForwarder.forwardToAllSubscribers(event);
    if (results.length > 0) {
      logger.info(`[EventBus] Forwarded ${event.type} to ${results.length} subscribers`);
      for (const result of results) {
        if (!result.success) {
          logger.error(`[EventBus] Failed to forward to ${result.subscriberId}: ${result.error}`);
        }
      }
    }
  } catch (error) {
    console.error('[EventBus] Error forwarding event:', error);
  }
}

/**
 * Initialize event forwarding handlers for new services
 */
async function initializeSubscriberForwarding(): Promise<void> {
  logger.info('[REZ Event Bus] Initializing subscriber forwarding...');

  // Forward commerce events
  rezEventBus.onCategory('commerce', forwardEventToSubscribers);

  // Forward loyalty events
  rezEventBus.onCategory('loyalty', forwardEventToSubscribers);

  // Forward engagement events
  rezEventBus.onCategory('engagement', forwardEventToSubscribers);

  // Forward support events
  rezEventBus.onCategory('support', forwardEventToSubscribers);

  // Forward WhatsApp events
  rezEventBus.onCategory('whatsapp', forwardEventToSubscribers);

  // Forward identity events
  rezEventBus.onCategory('identity', forwardEventToSubscribers);

  // Forward notification events
  rezEventBus.onCategory('notification', forwardEventToSubscribers);

  logger.info('[REZ Event Bus] Subscriber forwarding initialized');
}

// ============================================
// Start server
// ============================================

const PORT = process.env.PORT || 4025;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('[REZ Event Bus] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('[REZ Event Bus] Connected to MongoDB');

    // Initialize standard event consumers
    initializeEventConsumers();
    logger.info('[REZ Event Bus] Standard event consumers initialized');

    // Initialize new service subscriptions in MongoDB
    logger.info('[REZ Event Bus] Initializing new service subscriptions...');
    await initializeNewServiceSubscriptions();

    // Initialize subscriber forwarding
    await initializeSubscriberForwarding();

    // Start HTTP server
    app.listen(parseInt(PORT as string), HOST as string, () => {
      logger.info(`[REZ Event Bus] Running on http://${HOST}:${PORT}`);
      logger.info(`[REZ Event Bus] Schema count: ${rezEventBus.getSchemaRegistry().getAllSchemas().length}`);
      logger.info('[REZ Event Bus] New Service Subscribers:');
      for (const sub of NEW_SERVICE_SUBSCRIPTIONS) {
        logger.info(`  - ${sub.serviceName} (${sub.serviceId}): ${sub.endpoint}:${sub.port}`);
        logger.info(`    Categories: ${sub.categories.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('[REZ Event Bus] Failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { startServer };
