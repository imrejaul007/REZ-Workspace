/**
 * REZ Event Bus - Nervous System of the Ecosystem
 *
 * Central event-driven infrastructure for real-time data flow
 *
 * Features:
 * - Kafka/Redpanda compatible event streaming
 * - Schema registry for event validation
 * - Consumer groups for parallel processing
 * - Event replay and replayability
 * - Dead letter queue for failed events
 * - Real-time and batch consumers
 * - Cross-company event routing
 *
 * @module REZ-Event-Bus
 */
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
// ============================================================================
// Schema Registry
// ============================================================================
class SchemaRegistry {
    schemas = new Map();
    validator;
    constructor() {
        this.initializeDefaultSchemas();
    }
    initializeDefaultSchemas() {
        // Commerce Events
        this.register({
            type: 'commerce.order.created',
            version: '1.0.0',
            category: 'commerce',
            description: 'New order created',
            payloadSchema: {
                orderId: { type: 'string' },
                userId: { type: 'string' },
                merchantId: { type: 'string' },
                items: { type: 'array' },
                total: { type: 'number' },
                currency: { type: 'string' },
                paymentMethod: { type: 'string' },
                deliveryType: { type: 'string' }
            },
            requiredFields: ['orderId', 'userId', 'merchantId', 'total'],
            examples: []
        });
        this.register({
            type: 'commerce.order.completed',
            version: '1.0.0',
            category: 'commerce',
            description: 'Order completed/fulfilled',
            payloadSchema: {
                orderId: { type: 'string' },
                userId: { type: 'string' },
                merchantId: { type: 'string' },
                total: { type: 'number' },
                items: { type: 'array' },
                completedAt: { type: 'string' }
            },
            requiredFields: ['orderId', 'userId', 'merchantId', 'total'],
            examples: []
        });
        this.register({
            type: 'commerce.order.cancelled',
            version: '1.0.0',
            category: 'commerce',
            description: 'Order cancelled',
            payloadSchema: {
                orderId: { type: 'string' },
                userId: { type: 'string' },
                merchantId: { type: 'string' },
                reason: { type: 'string' },
                refundedAmount: { type: 'number' }
            },
            requiredFields: ['orderId', 'userId', 'reason'],
            examples: []
        });
        this.register({
            type: 'commerce.payment.completed',
            version: '1.0.0',
            category: 'payment',
            description: 'Payment successful',
            payloadSchema: {
                paymentId: { type: 'string' },
                orderId: { type: 'string' },
                userId: { type: 'string' },
                amount: { type: 'number' },
                method: { type: 'string' },
                status: { type: 'string' }
            },
            requiredFields: ['paymentId', 'orderId', 'userId', 'amount'],
            examples: []
        });
        // Identity Events
        this.register({
            type: 'identity.user.created',
            version: '1.0.0',
            category: 'identity',
            description: 'New user registered',
            payloadSchema: {
                userId: { type: 'string' },
                identifiers: { type: 'array' },
                source: { type: 'string' },
                companyId: { type: 'string' }
            },
            requiredFields: ['userId', 'source'],
            examples: []
        });
        this.register({
            type: 'identity.user.linked',
            version: '1.0.0',
            category: 'identity',
            description: 'User identities linked',
            payloadSchema: {
                primaryId: { type: 'string' },
                secondaryId: { type: 'string' },
                linkType: { type: 'string' }
            },
            requiredFields: ['primaryId', 'secondaryId'],
            examples: []
        });
        // Loyalty Events
        this.register({
            type: 'loyalty.points.earned',
            version: '1.0.0',
            category: 'loyalty',
            description: 'Points earned',
            payloadSchema: {
                userId: { type: 'string' },
                points: { type: 'number' },
                source: { type: 'string' },
                referenceId: { type: 'string' }
            },
            requiredFields: ['userId', 'points', 'source'],
            examples: []
        });
        this.register({
            type: 'loyalty.points.redeemed',
            version: '1.0.0',
            category: 'loyalty',
            description: 'Points redeemed',
            payloadSchema: {
                userId: { type: 'string' },
                points: { type: 'number' },
                rewardId: { type: 'string' },
                merchantId: { type: 'string' }
            },
            requiredFields: ['userId', 'points', 'rewardId'],
            examples: []
        });
        // Engagement Events
        this.register({
            type: 'engagement.page.viewed',
            version: '1.0.0',
            category: 'engagement',
            description: 'Page viewed',
            payloadSchema: {
                userId: { type: 'string' },
                pageType: { type: 'string' },
                pageId: { type: 'string' },
                duration: { type: 'number' },
                source: { type: 'string' }
            },
            requiredFields: ['userId', 'pageType', 'pageId'],
            examples: []
        });
        this.register({
            type: 'engagement.qr.scanned',
            version: '1.0.0',
            category: 'engagement',
            description: 'QR code scanned',
            payloadSchema: {
                userId: { type: 'string' },
                qrId: { type: 'string' },
                qrType: { type: 'string' },
                merchantId: { type: 'string' },
                location: { type: 'object' }
            },
            requiredFields: ['qrId', 'qrType'],
            examples: []
        });
        // Intelligence Events
        this.register({
            type: 'intelligence.intent.detected',
            version: '1.0.0',
            category: 'intelligence',
            description: 'User intent detected',
            payloadSchema: {
                userId: { type: 'string' },
                intent: { type: 'string' },
                confidence: { type: 'number' },
                signals: { type: 'array' },
                context: { type: 'object' }
            },
            requiredFields: ['userId', 'intent', 'confidence'],
            examples: []
        });
        this.register({
            type: 'intelligence.churn.risk',
            version: '1.0.0',
            category: 'intelligence',
            description: 'Churn risk detected',
            payloadSchema: {
                userId: { type: 'string' },
                riskLevel: { type: 'string' },
                probability: { type: 'number' },
                factors: { type: 'array' }
            },
            requiredFields: ['userId', 'riskLevel', 'probability'],
            examples: []
        });
        // Support Events
        this.register({
            type: 'support.ticket.created',
            version: '1.0.0',
            category: 'support',
            description: 'Support ticket created',
            payloadSchema: {
                ticketId: { type: 'string' },
                userId: { type: 'string' },
                category: { type: 'string' },
                priority: { type: 'string' },
                subject: { type: 'string' }
            },
            requiredFields: ['ticketId', 'userId', 'category'],
            examples: []
        });
        this.register({
            type: 'support.csat.submitted',
            version: '1.0.0',
            category: 'support',
            description: 'CSAT rating submitted',
            payloadSchema: {
                ticketId: { type: 'string' },
                userId: { type: 'string' },
                rating: { type: 'number' },
                feedback: { type: 'string' }
            },
            requiredFields: ['ticketId', 'userId', 'rating'],
            examples: []
        });
        // Media Events
        this.register({
            type: 'media.ad.impression',
            version: '1.0.0',
            category: 'media',
            description: 'Ad impression recorded',
            payloadSchema: {
                userId: { type: 'string' },
                adId: { type: 'string' },
                screenId: { type: 'string' },
                duration: { type: 'number' },
                screenType: { type: 'string' }
            },
            requiredFields: ['adId', 'screenId'],
            examples: []
        });
        this.register({
            type: 'media.ad.conversion',
            version: '1.0.0',
            category: 'media',
            description: 'Ad conversion recorded',
            payloadSchema: {
                userId: { type: 'string' },
                adId: { type: 'string' },
                campaignId: { type: 'string' },
                conversionType: { type: 'string' },
                value: { type: 'number' }
            },
            requiredFields: ['adId', 'campaignId', 'conversionType'],
            examples: []
        });
        // Notification Events
        this.register({
            type: 'notification.sent',
            version: '1.0.0',
            category: 'notification',
            description: 'Notification sent',
            payloadSchema: {
                userId: { type: 'string' },
                channel: { type: 'string' },
                templateId: { type: 'string' },
                status: { type: 'string' }
            },
            requiredFields: ['userId', 'channel', 'templateId'],
            examples: []
        });
        this.register({
            type: 'notification.opened',
            version: '1.0.0',
            category: 'notification',
            description: 'Notification opened',
            payloadSchema: {
                notificationId: { type: 'string' },
                userId: { type: 'string' },
                channel: { type: 'string' }
            },
            requiredFields: ['notificationId', 'userId'],
            examples: []
        });
        // WhatsApp Events
        this.register({
            type: 'whatsapp.message.received',
            version: '1.0.0',
            category: 'whatsapp',
            description: 'WhatsApp message received',
            payloadSchema: {
                messageId: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
                body: { type: 'string' },
                type: { type: 'string' },
                mediaUrl: { type: 'string' },
                userId: { type: 'string' },
                sessionId: { type: 'string' }
            },
            requiredFields: ['messageId', 'from', 'to'],
            examples: []
        });
        this.register({
            type: 'whatsapp.message.sent',
            version: '1.0.0',
            category: 'whatsapp',
            description: 'WhatsApp message sent',
            payloadSchema: {
                messageId: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
                body: { type: 'string' },
                type: { type: 'string' },
                status: { type: 'string' },
                userId: { type: 'string' },
                sessionId: { type: 'string' }
            },
            requiredFields: ['messageId', 'from', 'to'],
            examples: []
        });
        this.register({
            type: 'whatsapp.session.started',
            version: '1.0.0',
            category: 'whatsapp',
            description: 'WhatsApp session started',
            payloadSchema: {
                sessionId: { type: 'string' },
                userId: { type: 'string' },
                source: { type: 'string' },
                context: { type: 'object' }
            },
            requiredFields: ['sessionId', 'userId'],
            examples: []
        });
        this.register({
            type: 'whatsapp.session.ended',
            version: '1.0.0',
            category: 'whatsapp',
            description: 'WhatsApp session ended',
            payloadSchema: {
                sessionId: { type: 'string' },
                userId: { type: 'string' },
                duration: { type: 'number' },
                reason: { type: 'string' }
            },
            requiredFields: ['sessionId', 'userId'],
            examples: []
        });
        this.register({
            type: 'whatsapp.conversation.created',
            version: '1.0.0',
            category: 'whatsapp',
            description: 'WhatsApp conversation created',
            payloadSchema: {
                conversationId: { type: 'string' },
                userId: { type: 'string' },
                merchantId: { type: 'string' },
                channel: { type: 'string' },
                source: { type: 'string' }
            },
            requiredFields: ['conversationId', 'userId'],
            examples: []
        });
        // Commerce Cart Events
        this.register({
            type: 'commerce.cart.abandoned',
            version: '1.0.0',
            category: 'commerce',
            description: 'Shopping cart abandoned',
            payloadSchema: {
                cartId: { type: 'string' },
                userId: { type: 'string' },
                items: { type: 'array' },
                total: { type: 'number' },
                currency: { type: 'string' },
                recoveryUrl: { type: 'string' }
            },
            requiredFields: ['cartId', 'userId'],
            examples: []
        });
        // Loyalty Tier Events
        this.register({
            type: 'loyalty.tier.upgraded',
            version: '1.0.0',
            category: 'loyalty',
            description: 'Loyalty tier upgraded',
            payloadSchema: {
                userId: { type: 'string' },
                previousTier: { type: 'string' },
                newTier: { type: 'string' },
                points: { type: 'number' },
                benefits: { type: 'array' }
            },
            requiredFields: ['userId', 'previousTier', 'newTier'],
            examples: []
        });
        this.register({
            type: 'loyalty.tier.downgraded',
            version: '1.0.0',
            category: 'loyalty',
            description: 'Loyalty tier downgraded',
            payloadSchema: {
                userId: { type: 'string' },
                previousTier: { type: 'string' },
                newTier: { type: 'string' },
                reason: { type: 'string' }
            },
            requiredFields: ['userId', 'previousTier', 'newTier'],
            examples: []
        });
        // Engagement Campaign Events
        this.register({
            type: 'engagement.campaign.started',
            version: '1.0.0',
            category: 'engagement',
            description: 'Engagement campaign started',
            payloadSchema: {
                campaignId: { type: 'string' },
                campaignType: { type: 'string' },
                userId: { type: 'string' },
                targetSegment: { type: 'string' }
            },
            requiredFields: ['campaignId', 'campaignType'],
            examples: []
        });
        this.register({
            type: 'engagement.campaign.completed',
            version: '1.0.0',
            category: 'engagement',
            description: 'Engagement campaign completed',
            payloadSchema: {
                campaignId: { type: 'string' },
                campaignType: { type: 'string' },
                totalRecipients: { type: 'number' },
                responses: { type: 'number' },
                conversionRate: { type: 'number' }
            },
            requiredFields: ['campaignId', 'totalRecipients'],
            examples: []
        });
        // Support Ticket Resolved Event
        this.register({
            type: 'support.ticket.resolved',
            version: '1.0.0',
            category: 'support',
            description: 'Support ticket resolved',
            payloadSchema: {
                ticketId: { type: 'string' },
                userId: { type: 'string' },
                resolvedBy: { type: 'string' },
                resolution: { type: 'string' },
                resolutionTimeMinutes: { type: 'number' }
            },
            requiredFields: ['ticketId', 'userId', 'resolvedBy'],
            examples: []
        });
    }
    register(schema) {
        const key = `${schema.type}:${schema.version}`;
        this.schemas.set(key, schema);
    }
    get(type, version) {
        if (version) {
            return this.schemas.get(`${type}:${version}`);
        }
        // Get latest version
        const versions = Array.from(this.schemas.keys())
            .filter(k => k.startsWith(`${type}:`))
            .sort()
            .reverse();
        return versions.length > 0 ? this.schemas.get(versions[0]) : undefined;
    }
    validate(event) {
        const schema = this.get(event.type, event.version);
        if (!schema) {
            return { valid: true, errors: [] }; // Allow unregistered events
        }
        const errors = [];
        const data = event.data;
        for (const field of schema.requiredFields) {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    getAllSchemas() {
        return Array.from(this.schemas.values());
    }
}
// ============================================================================
// Dead Letter Queue
// ============================================================================
class DeadLetterQueue {
    events = [];
    maxSize;
    constructor(maxSize = 10000) {
        this.maxSize = maxSize;
    }
    add(event, error) {
        const dlqEvent = {
            ...event,
            error: error.message,
            stack: error.stack,
            failedAt: new Date().toISOString(),
            retryCount: (event.retries || 0) + 1
        };
        this.events.push(dlqEvent);
        // Trim if over max size
        if (this.events.length > this.maxSize) {
            this.events = this.events.slice(-this.maxSize);
        }
    }
    getAll() {
        return [...this.events];
    }
    getBySource(source) {
        return this.events.filter(e => e.source === source);
    }
    retry(dlqEvent) {
        return {
            ...dlqEvent,
            retries: dlqEvent.retryCount,
            processedAt: undefined,
            processedBy: undefined
        };
    }
    clear() {
        this.events = [];
    }
}
// ============================================================================
// Event Bus Implementation
// ============================================================================
export class REZEventBus extends EventEmitter {
    subscriptions = new Map();
    eventStore = [];
    schemaRegistry;
    deadLetterQueue;
    consumerOffsets = new Map();
    MAX_EVENT_STORE = 100000;
    MAX_RETRIES = 3;
    constructor() {
        super();
        this.schemaRegistry = new SchemaRegistry();
        this.deadLetterQueue = new DeadLetterQueue();
        this.setMaxListeners(1000);
    }
    // ============================================================================
    // Event Publishing
    // ============================================================================
    /**
     * Publish an event to the bus
     */
    async publish(event) {
        const fullEvent = {
            ...event,
            id: randomUUID(),
            timestamp: new Date().toISOString()
        };
        // Validate against schema
        const validation = this.schemaRegistry.validate(fullEvent);
        if (!validation.valid) {
            console.warn(`[REZEventBus] Event validation warnings:`, validation.errors);
        }
        // Store event
        this.eventStore.push(fullEvent);
        if (this.eventStore.length > this.MAX_EVENT_STORE) {
            this.eventStore = this.eventStore.slice(-this.MAX_EVENT_STORE);
        }
        // Emit to local subscribers
        this.emit(fullEvent.type, fullEvent);
        this.emit('*', fullEvent);
        this.emit(fullEvent.category, fullEvent);
        return fullEvent.id;
    }
    /**
     * Publish a commerce event
     */
    async publishCommerce(type, data, options = {}) {
        return this.publish({
            type: `commerce.${type}`,
            category: 'commerce',
            priority: options.priority || 'normal',
            version: '1.0.0',
            source: 'event-bus',
            sourceId: process.env.INSTANCE_ID || 'default',
            userId: options.userId,
            merchantId: options.merchantId,
            correlationId: options.correlationId,
            data
        });
    }
    /**
     * Publish an intelligence event
     */
    async publishIntelligence(type, data, options = {}) {
        return this.publish({
            type: `intelligence.${type}`,
            category: 'intelligence',
            priority: options.priority || 'normal',
            version: '1.0.0',
            source: 'event-bus',
            sourceId: process.env.INSTANCE_ID || 'default',
            userId: options.userId,
            data
        });
    }
    // ============================================================================
    // Subscriptions
    // ============================================================================
    /**
     * Subscribe to events
     */
    subscribe(options, handler) {
        const subscriptionId = randomUUID();
        const subscription = {
            id: subscriptionId,
            consumerGroup: options.groupId,
            topics: options.topics,
            handler,
            concurrency: options.maxConcurrency || 1,
            active: true
        };
        this.subscriptions.set(subscriptionId, subscription);
        // Initialize consumer offset tracking
        if (!this.consumerOffsets.has(options.groupId)) {
            this.consumerOffsets.set(options.groupId, new Map());
        }
        return subscriptionId;
    }
    /**
     * Subscribe to specific event types
     */
    onEvent(eventType, handler) {
        const wrappedHandler = async (event) => {
            try {
                await handler(event);
                this.emit('processed', event);
            }
            catch (error) {
                this.handleProcessingError(event, error);
            }
        };
        this.on(eventType, wrappedHandler);
        return () => this.off(eventType, wrappedHandler);
    }
    /**
     * Subscribe to event category
     */
    onCategory(category, handler) {
        return this.onEvent(category, handler);
    }
    /**
     * Subscribe to all events
     */
    onAny(handler) {
        return this.onEvent('*', handler);
    }
    /**
     * Unsubscribe
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.active = false;
            this.subscriptions.delete(subscriptionId);
            return true;
        }
        return false;
    }
    // ============================================================================
    // Event Retrieval
    // ============================================================================
    /**
     * Get events by type
     */
    getEventsByType(type, limit = 100) {
        return this.eventStore
            .filter(e => e.type === type)
            .slice(-limit)
            .reverse();
    }
    /**
     * Get events for a user
     */
    getEventsByUser(userId, limit = 100) {
        return this.eventStore
            .filter(e => e.userId === userId)
            .slice(-limit)
            .reverse();
    }
    /**
     * Get events by correlation ID (tracing)
     */
    getEventsByCorrelation(correlationId) {
        return this.eventStore
            .filter(e => e.correlationId === correlationId || e.id === correlationId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    /**
     * Get recent events
     */
    getRecentEvents(limit = 100) {
        return this.eventStore.slice(-limit).reverse();
    }
    /**
     * Query events with filters
     */
    queryEvents(filters) {
        let results = [...this.eventStore];
        if (filters.types?.length) {
            results = results.filter(e => filters.types.includes(e.type));
        }
        if (filters.categories?.length) {
            results = results.filter(e => filters.categories.includes(e.category));
        }
        if (filters.userId) {
            results = results.filter(e => e.userId === filters.userId);
        }
        if (filters.merchantId) {
            results = results.filter(e => e.merchantId === filters.merchantId);
        }
        if (filters.startTime) {
            const start = new Date(filters.startTime).getTime();
            results = results.filter(e => new Date(e.timestamp).getTime() >= start);
        }
        if (filters.endTime) {
            const end = new Date(filters.endTime).getTime();
            results = results.filter(e => new Date(e.timestamp).getTime() <= end);
        }
        if (filters.tags?.length) {
            results = results.filter(e => e.tags?.some(t => filters.tags.includes(t)));
        }
        const limit = filters.limit || 100;
        return results.slice(-limit).reverse();
    }
    // ============================================================================
    // Error Handling
    // ============================================================================
    async handleProcessingError(event, error) {
        console.error(`[REZEventBus] Error processing event ${event.id}:`, error.message);
        if ((event.retries || 0) >= this.MAX_RETRIES) {
            // Move to DLQ
            this.deadLetterQueue.add(event, error);
            this.emit('deadLetter', event, error);
        }
        else {
            // Retry
            event.retries = (event.retries || 0) + 1;
            setTimeout(() => {
                this.emit(event.type, event);
            }, Math.pow(2, event.retries) * 1000);
        }
    }
    /**
     * Get dead letter events
     */
    getDeadLetters() {
        return this.deadLetterQueue.getAll();
    }
    /**
     * Retry a dead letter event
     */
    async retryDeadLetter(dlqEvent) {
        const event = this.deadLetterQueue.retry(dlqEvent);
        return this.publish(event);
    }
    // ============================================================================
    // Utilities
    // ============================================================================
    /**
     * Create a correlation ID for tracing
     */
    createCorrelationId() {
        return randomUUID();
    }
    /**
     * Create an event builder
     */
    createEvent(type, data) {
        return {
            type,
            category: this.inferCategory(type),
            priority: 'normal',
            version: '1.0.0',
            source: 'event-bus',
            sourceId: process.env.INSTANCE_ID || 'default',
            data
        };
    }
    inferCategory(type) {
        const prefix = type.split('.')[0];
        const categoryMap = {
            commerce: 'commerce',
            identity: 'identity',
            intelligence: 'intelligence',
            notification: 'notification',
            payment: 'payment',
            loyalty: 'loyalty',
            engagement: 'engagement',
            support: 'support',
            media: 'media',
            system: 'system',
            whatsapp: 'whatsapp'
        };
        return categoryMap[prefix] || 'system';
    }
    /**
     * Get schema registry
     */
    getSchemaRegistry() {
        return this.schemaRegistry;
    }
    /**
     * Get stats
     */
    getStats() {
        const categories = {};
        for (const event of this.eventStore) {
            categories[event.category] = (categories[event.category] || 0) + 1;
        }
        return {
            totalEvents: this.eventStore.length,
            subscriptions: this.subscriptions.size,
            deadLetters: this.deadLetterQueue.getAll().length,
            categories
        };
    }
}
// ============================================================================
// Singleton Export
// ============================================================================
export const rezEventBus = new REZEventBus();
export default rezEventBus;
// ============================================================================
// High-Level Event Publishers (Typed Convenience Methods)
// ============================================================================
export const CommerceEvents = {
    orderCreated: (data, options) => rezEventBus.publishCommerce('order.created', data, options),
    orderCompleted: (data, options) => rezEventBus.publishCommerce('order.completed', data, options),
    orderCancelled: (data, options) => rezEventBus.publishCommerce('order.cancelled', data, options),
    paymentCompleted: (data, options) => rezEventBus.publishCommerce('payment.completed', data, options),
    cartUpdated: (data, options) => rezEventBus.publishCommerce('cart.updated', data, options),
    checkoutStarted: (data, options) => rezEventBus.publishCommerce('checkout.started', data, options),
};
export const IdentityEvents = {
    userCreated: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('identity.user.created', data), ...options }),
    userLinked: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('identity.user.linked', data), ...options }),
    profileUpdated: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('identity.profile.updated', data), ...options }),
};
export const LoyaltyEvents = {
    pointsEarned: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('loyalty.points.earned', data), ...options }),
    pointsRedeemed: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('loyalty.points.redeemed', data), ...options }),
    tierChanged: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('loyalty.tier.changed', data), ...options }),
};
export const IntelligenceEvents = {
    intentDetected: (data, options) => rezEventBus.publishIntelligence('intent.detected', data, options),
    churnRisk: (data, options) => rezEventBus.publishIntelligence('churn.risk', data, options),
    ltvUpdated: (data, options) => rezEventBus.publishIntelligence('ltv.updated', data, options),
    segmentChanged: (data, options) => rezEventBus.publishIntelligence('segment.changed', data, options),
};
export const EngagementEvents = {
    pageViewed: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.page.viewed', data), ...options }),
    qrScanned: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.qr.scanned', data), ...options }),
    searchPerformed: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.search.performed', data), ...options }),
};
export const SupportEvents = {
    ticketCreated: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('support.ticket.created', data), ...options }),
    csatSubmitted: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('support.csat.submitted', data), ...options }),
    ticketResolved: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('support.ticket.resolved', data), ...options }),
};
export const MediaEvents = {
    adImpression: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('media.ad.impression', data), ...options }),
    adConversion: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('media.ad.conversion', data), ...options }),
    screenViewed: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('media.screen.viewed', data), ...options }),
};
export const WhatsAppEvents = {
    messageReceived: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('whatsapp.message.received', data), ...options }),
    messageSent: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('whatsapp.message.sent', data), ...options }),
    sessionStarted: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('whatsapp.session.started', data), ...options }),
    sessionEnded: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('whatsapp.session.ended', data), ...options }),
    conversationCreated: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('whatsapp.conversation.created', data), ...options }),
};
export const CartEvents = {
    cartAbandoned: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('commerce.cart.abandoned', data), ...options }),
    cartRecovered: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('commerce.cart.recovered', data), ...options }),
};
export const LoyaltyTierEvents = {
    tierUpgraded: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('loyalty.tier.upgraded', data), ...options }),
    tierDowngraded: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('loyalty.tier.downgraded', data), ...options }),
};
export const CampaignEvents = {
    campaignStarted: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.campaign.started', data), ...options }),
    campaignCompleted: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.campaign.completed', data), ...options }),
    campaignEngaged: (data, options) => rezEventBus.publish({ ...rezEventBus.createEvent('engagement.campaign.engaged', data), ...options }),
};
// ============================================================================
// Event Listeners Setup
// ============================================================================
/**
 * Initialize standard event consumers
 * Call this once at application startup
 */
export function initializeEventConsumers() {
    // Intelligence: Capture all commerce events for ML training
    rezEventBus.onEvent('commerce.*', async (event) => {
        await IntelligenceEvents.intentDetected({
            source: event.type,
            data: event.data,
            signals: [event.type]
        }, { userId: event.userId });
    });
    // Signal Aggregator: Collect all signals
    rezEventBus.onAny(async (event) => {
        // Forward to signal aggregator service
        console.log(`[SignalAggregator] Event: ${event.type}`, { userId: event.userId });
    });
    // Audit: Log all events
    rezEventBus.onAny(async (event) => {
        // In production, forward to audit service
        console.log(`[Audit] ${event.type}`, {
            id: event.id,
            userId: event.userId,
            timestamp: event.timestamp
        });
    });
}
//# sourceMappingURL=rezEventBus.js.map