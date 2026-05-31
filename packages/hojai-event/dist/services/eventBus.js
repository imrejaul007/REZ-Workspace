"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBusService = exports.EventBusService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const kafkajs_1 = require("kafkajs");
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const eventModel_js_1 = require("../models/eventModel.js");
const subscriptionModel_js_1 = require("../models/subscriptionModel.js");
const dlqModel_js_1 = require("../models/dlqModel.js");
const axios_1 = __importDefault(require("axios"));
// ============================================================================
// EVENT BUS SERVICE
// ============================================================================
class EventBusService {
    redis;
    kafka;
    kafkaProducer = null;
    kafkaConsumers = new Map();
    subscriptions = new Map();
    eventHandlers = new Map();
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'hojai-event-bus',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            logLevel: kafkajs_1.logLevel.ERROR,
            retry: {
                initialRetryTime: 100,
                retries: 3
            }
        });
    }
    /**
     * Initialize Kafka producer
     */
    async initialize() {
        try {
            this.kafkaProducer = this.kafka.producer();
            await this.kafkaProducer.connect();
            console.log('[EventBus] Kafka producer connected');
            // Load active subscriptions
            await this.loadSubscriptions();
        }
        catch (error) {
            console.error('[EventBus] Kafka initialization failed, using Redis-only mode:', error);
        }
    }
    /**
     * Load active subscriptions from database
     */
    async loadSubscriptions() {
        try {
            const subs = await subscriptionModel_js_1.SubscriptionModel.find({ enabled: true });
            for (const sub of subs) {
                this.subscriptions.set(sub.id, sub.toObject());
            }
            console.log(`[EventBus] Loaded ${subs.length} subscriptions`);
        }
        catch (error) {
            console.error('[EventBus] Failed to load subscriptions:', error);
        }
    }
    /**
     * Publish an event
     */
    async publish(tenantId, event) {
        const fullEvent = {
            ...event,
            id: (0, uuid_1.v4)(),
            tenantId,
            timestamp: new Date(),
            processed: false
        };
        // Validate tenant exists
        const isPrivileged = await this.checkPrivilegedAccess(tenantId);
        const isolation = await this.getTenantIsolation(tenantId);
        // Store event in MongoDB
        const eventModel = new eventModel_js_1.EventModel({
            ...fullEvent,
            namespace: isolation.eventNamespace
        });
        await eventModel.save();
        // Publish to Redis for real-time subscribers
        const redisChannel = `events:${isolation.eventNamespace}:${event.category}`;
        await this.redis.publish(redisChannel, JSON.stringify(fullEvent));
        // Also publish to Kafka for durable consumers
        if (this.kafkaProducer) {
            await this.kafkaProducer.send({
                topic: `hojai-events-${isolation.eventNamespace}`,
                messages: [
                    {
                        key: fullEvent.userId || fullEvent.id,
                        value: JSON.stringify(fullEvent),
                        headers: {
                            tenantId,
                            eventType: fullEvent.type,
                            category: fullEvent.category
                        }
                    }
                ]
            });
        }
        // Trigger local handlers
        await this.triggerHandlers(fullEvent);
        // Trigger subscriptions
        await this.triggerSubscriptions(fullEvent);
        return fullEvent;
    }
    /**
     * Subscribe to events
     */
    async subscribe(subscription) {
        const sub = {
            ...subscription,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Save to database
        const subModel = new subscriptionModel_js_1.SubscriptionModel(sub);
        await subModel.save();
        // Store in memory
        this.subscriptions.set(sub.id, sub);
        // Set up Redis subscription if using Redis protocol
        if (sub.protocol === index_js_1.SubscriptionProtocol.REDIS) {
            await this.setupRedisSubscription(sub);
        }
        return sub;
    }
    /**
     * Set up Redis Pub/Sub subscription
     */
    async setupRedisSubscription(subscription) {
        const subscriber = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
        for (const eventType of subscription.eventTypes || []) {
            const pattern = eventType.replace(/\*/g, '*');
            await subscriber.psubscribe(`events:*:*:${pattern}`);
        }
        subscriber.on('pmessage', async (pattern, channel, message) => {
            try {
                const event = JSON.parse(message);
                await this.deliverToEndpoint(subscription, event);
            }
            catch (error) {
                console.error('[EventBus] Redis subscription error:', error);
            }
        });
    }
    /**
     * Trigger local event handlers
     */
    async triggerHandlers(event) {
        const handlers = this.eventHandlers.get(event.type) || [];
        // Also trigger category-level handlers
        const categoryHandlers = this.eventHandlers.get(`*:${event.category}`) || [];
        const allHandlers = [...handlers, ...categoryHandlers];
        await Promise.allSettled(allHandlers.map(handler => handler(event).catch(error => {
            console.error(`[EventBus] Handler error for ${event.type}:`, error);
        })));
    }
    /**
     * Trigger subscriptions for an event
     */
    async triggerSubscriptions(event) {
        const matchingSubs = Array.from(this.subscriptions.values()).filter(sub => {
            // Check if subscription is enabled
            if (!sub.enabled)
                return false;
            // Check event type filter
            if (sub.eventTypes && sub.eventTypes.length > 0) {
                const matches = sub.eventTypes.some(pattern => {
                    if (pattern === '*')
                        return true;
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    return regex.test(event.type);
                });
                if (!matches)
                    return false;
            }
            // Check user filter
            if (sub.userId && sub.userId !== event.userId)
                return false;
            return true;
        });
        // Deliver to each matching subscription
        await Promise.allSettled(matchingSubs.map(sub => this.deliverToEndpoint(sub, event).catch(error => {
            console.error(`[EventBus] Subscription delivery error:`, error);
            this.handleDeliveryFailure(sub, event, error);
        })));
    }
    /**
     * Deliver event to subscription endpoint
     */
    async deliverToEndpoint(subscription, event) {
        const maxRetries = subscription.maxRetries || 3;
        let lastError = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Event-ID': event.id,
                    'X-Event-Type': event.type,
                    'X-Tenant-ID': event.tenantId
                };
                // Add auth header if configured
                if (subscription.auth) {
                    if (subscription.auth.type === 'bearer' && subscription.auth.token) {
                        headers['Authorization'] = `Bearer ${subscription.auth.token}`;
                    }
                    else if (subscription.auth.type === 'api_key' && subscription.auth.apiKey) {
                        headers['X-API-Key'] = subscription.auth.apiKey;
                    }
                }
                await axios_1.default.post(subscription.endpoint, event, {
                    headers,
                    timeout: 10000
                });
                // Success - update subscription stats
                await subscriptionModel_js_1.SubscriptionModel.findByIdAndUpdate(subscription.id, {
                    $inc: { triggerCount: 1 },
                    $set: { lastTriggeredAt: new Date() }
                });
                return;
            }
            catch (error) {
                lastError = error;
                if (subscription.retryOnFailure) {
                    await this.delay(subscription.retryDelayMs * Math.pow(2, attempt));
                }
            }
        }
        // All retries failed
        throw lastError || new Error('Delivery failed');
    }
    /**
     * Handle subscription delivery failure
     */
    async handleDeliveryFailure(subscription, event, error) {
        // Add to dead letter queue
        const dlqEntry = new dlqModel_js_1.DLQModel({
            id: (0, uuid_1.v4)(),
            tenantId: event.tenantId,
            originalEvent: event,
            eventType: event.type,
            reason: 'SUBSCRIPTION_FAILED',
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            status: 'pending',
            failedAt: new Date()
        });
        await dlqEntry.save();
    }
    /**
     * Register an event handler
     */
    on(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.push(handler);
        this.eventHandlers.set(eventType, handlers);
    }
    /**
     * Remove an event handler
     */
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
            this.eventHandlers.set(eventType, handlers);
        }
    }
    /**
     * Query historical events
     */
    async query(params) {
        const isolation = await this.getTenantIsolation(params.tenantId);
        const filter = {
            namespace: isolation.eventNamespace
        };
        if (params.eventTypes && params.eventTypes.length > 0) {
            filter.type = { $in: params.eventTypes };
        }
        if (params.userId) {
            filter.userId = params.userId;
        }
        if (params.startDate || params.endDate) {
            filter.timestamp = {};
            if (params.startDate) {
                filter.timestamp.$gte = params.startDate;
            }
            if (params.endDate) {
                filter.timestamp.$lte = params.endDate;
            }
        }
        const [events, total] = await Promise.all([
            eventModel_js_1.EventModel.find(filter)
                .sort({ timestamp: -1 })
                .skip(params.offset || 0)
                .limit(params.limit || 100),
            eventModel_js_1.EventModel.countDocuments(filter)
        ]);
        return {
            events: events.map(e => e.toObject()),
            total
        };
    }
    /**
     * Replay events from a specific timestamp
     */
    async replay(params) {
        const { events } = await this.query({
            tenantId: params.tenantId,
            eventTypes: params.eventTypes,
            startDate: params.startDate,
            endDate: params.endDate,
            limit: 10000 // Max replay limit
        });
        const subscription = this.subscriptions.get(params.subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        let replayedCount = 0;
        for (const event of events) {
            try {
                await this.deliverToEndpoint(subscription, event);
                replayedCount++;
            }
            catch (error) {
                console.error(`[EventBus] Replay delivery failed for event ${event.id}:`, error);
            }
        }
        return { replayedCount };
    }
    /**
     * Get event statistics
     */
    async getStats(tenantId) {
        const isolation = await this.getTenantIsolation(tenantId);
        const [stats, last24h, dlqCount] = await Promise.all([
            eventModel_js_1.EventModel.aggregate([
                { $match: { namespace: isolation.eventNamespace } },
                {
                    $group: {
                        _id: { category: '$category', type: '$type' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            eventModel_js_1.EventModel.countDocuments({
                namespace: isolation.eventNamespace,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            dlqModel_js_1.DLQModel.countDocuments({
                tenantId,
                status: 'pending'
            })
        ]);
        const eventsByCategory = {};
        const eventsByType = {};
        let totalEvents = 0;
        for (const stat of stats) {
            const count = stat.count;
            totalEvents += count;
            eventsByCategory[stat._id.category] = (eventsByCategory[stat._id.category] || 0) + count;
            eventsByType[stat._id.type] = count;
        }
        return {
            totalEvents,
            eventsByCategory,
            eventsByType,
            eventsLast24h: last24h,
            dlqCount
        };
    }
    // Helper methods
    async checkPrivilegedAccess(tenantId) {
        // Check if tenant has privileged access
        // This would call the governance service
        return tenantId.startsWith('privileged-');
    }
    async getTenantIsolation(tenantId) {
        // In production, this would call the governance service
        // For now, use tenantId as namespace prefix
        return {
            eventNamespace: `tenant:${tenantId}`
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('[EventBus] Shutting down...');
        // Disconnect Kafka
        if (this.kafkaProducer) {
            await this.kafkaProducer.disconnect();
        }
        // Disconnect Redis
        await this.redis.quit();
        console.log('[EventBus] Shutdown complete');
    }
}
exports.EventBusService = EventBusService;
exports.eventBusService = new EventBusService();
//# sourceMappingURL=eventBus.js.map