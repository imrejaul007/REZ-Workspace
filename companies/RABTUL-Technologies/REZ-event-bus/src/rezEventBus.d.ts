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
export type EventCategory = 'commerce' | 'identity' | 'intelligence' | 'notification' | 'payment' | 'loyalty' | 'engagement' | 'support' | 'media' | 'system' | 'whatsapp';
export type EventPriority = 'low' | 'normal' | 'high' | 'critical';
export interface REZEvent<T = unknown> {
    id: string;
    correlationId?: string;
    causationId?: string;
    type: string;
    category: EventCategory;
    priority: EventPriority;
    version: string;
    source: string;
    sourceId: string;
    timestamp: string;
    userId?: string;
    merchantId?: string;
    companyId?: string;
    data: T;
    tags?: string[];
    routingKey?: string;
    retries?: number;
    maxRetries?: number;
    processedAt?: string;
    processedBy?: string[];
}
export interface EventSchema {
    type: string;
    version: string;
    category: EventCategory;
    description: string;
    payloadSchema: Record<string, unknown>;
    requiredFields: string[];
    examples: unknown[];
}
export interface ConsumerOptions {
    groupId: string;
    topics: string[];
    fromBeginning?: boolean;
    autoCommit?: boolean;
    maxConcurrency?: number;
}
export interface Subscription {
    id: string;
    consumerGroup: string;
    topics: string[];
    handler: (event: REZEvent) => Promise<void>;
    filter?: (event: REZEvent) => boolean;
    concurrency: number;
    active: boolean;
}
export interface DeadLetterEvent extends REZEvent {
    error: string;
    stack?: string;
    failedAt: string;
    retryCount: number;
}
declare class SchemaRegistry {
    private schemas;
    private validator;
    constructor();
    private initializeDefaultSchemas;
    register(schema: EventSchema): void;
    get(type: string, version?: string): EventSchema | undefined;
    validate(event: REZEvent): {
        valid: boolean;
        errors: string[];
    };
    getAllSchemas(): EventSchema[];
}
export declare class REZEventBus extends EventEmitter {
    private subscriptions;
    private eventStore;
    private schemaRegistry;
    private deadLetterQueue;
    private consumerOffsets;
    private readonly MAX_EVENT_STORE;
    private readonly MAX_RETRIES;
    constructor();
    /**
     * Publish an event to the bus
     */
    publish<T = unknown>(event: Omit<REZEvent<T>, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Publish a commerce event
     */
    publishCommerce(type: string, data: any, options?: {
        userId?: string;
        merchantId?: string;
        correlationId?: string;
        priority?: EventPriority;
    }): Promise<string>;
    /**
     * Publish an intelligence event
     */
    publishIntelligence(type: string, data: any, options?: {
        userId?: string;
        priority?: EventPriority;
    }): Promise<string>;
    /**
     * Subscribe to events
     */
    subscribe(options: ConsumerOptions, handler: (event: REZEvent) => Promise<void>): string;
    /**
     * Subscribe to specific event types
     */
    onEvent(eventType: string, handler: (event: REZEvent) => Promise<void>): () => void;
    /**
     * Subscribe to event category
     */
    onCategory(category: EventCategory, handler: (event: REZEvent) => Promise<void>): () => void;
    /**
     * Subscribe to all events
     */
    onAny(handler: (event: REZEvent) => Promise<void>): () => void;
    /**
     * Unsubscribe
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Get events by type
     */
    getEventsByType(type: string, limit?: number): REZEvent[];
    /**
     * Get events for a user
     */
    getEventsByUser(userId: string, limit?: number): REZEvent[];
    /**
     * Get events by correlation ID (tracing)
     */
    getEventsByCorrelation(correlationId: string): REZEvent[];
    /**
     * Get recent events
     */
    getRecentEvents(limit?: number): REZEvent[];
    /**
     * Query events with filters
     */
    queryEvents(filters: {
        types?: string[];
        categories?: EventCategory[];
        userId?: string;
        merchantId?: string;
        startTime?: string;
        endTime?: string;
        tags?: string[];
        limit?: number;
    }): REZEvent[];
    private handleProcessingError;
    /**
     * Get dead letter events
     */
    getDeadLetters(): DeadLetterEvent[];
    /**
     * Retry a dead letter event
     */
    retryDeadLetter(dlqEvent: DeadLetterEvent): Promise<string>;
    /**
     * Create a correlation ID for tracing
     */
    createCorrelationId(): string;
    /**
     * Create an event builder
     */
    createEvent<T>(type: string, data: T): Omit<REZEvent<T>, 'id' | 'timestamp'>;
    private inferCategory;
    /**
     * Get schema registry
     */
    getSchemaRegistry(): SchemaRegistry;
    /**
     * Get stats
     */
    getStats(): {
        totalEvents: number;
        subscriptions: number;
        deadLetters: number;
        categories: Record<string, number>;
    };
}
export declare const rezEventBus: REZEventBus;
export default rezEventBus;
export declare const CommerceEvents: {
    orderCreated: (data: any, options?: any) => Promise<string>;
    orderCompleted: (data: any, options?: any) => Promise<string>;
    orderCancelled: (data: any, options?: any) => Promise<string>;
    paymentCompleted: (data: any, options?: any) => Promise<string>;
    cartUpdated: (data: any, options?: any) => Promise<string>;
    checkoutStarted: (data: any, options?: any) => Promise<string>;
};
export declare const IdentityEvents: {
    userCreated: (data: any, options?: any) => Promise<string>;
    userLinked: (data: any, options?: any) => Promise<string>;
    profileUpdated: (data: any, options?: any) => Promise<string>;
};
export declare const LoyaltyEvents: {
    pointsEarned: (data: any, options?: any) => Promise<string>;
    pointsRedeemed: (data: any, options?: any) => Promise<string>;
    tierChanged: (data: any, options?: any) => Promise<string>;
};
export declare const IntelligenceEvents: {
    intentDetected: (data: any, options?: any) => Promise<string>;
    churnRisk: (data: any, options?: any) => Promise<string>;
    ltvUpdated: (data: any, options?: any) => Promise<string>;
    segmentChanged: (data: any, options?: any) => Promise<string>;
};
export declare const EngagementEvents: {
    pageViewed: (data: any, options?: any) => Promise<string>;
    qrScanned: (data: any, options?: any) => Promise<string>;
    searchPerformed: (data: any, options?: any) => Promise<string>;
};
export declare const SupportEvents: {
    ticketCreated: (data: any, options?: any) => Promise<string>;
    csatSubmitted: (data: any, options?: any) => Promise<string>;
    ticketResolved: (data: any, options?: any) => Promise<string>;
};
export declare const MediaEvents: {
    adImpression: (data: any, options?: any) => Promise<string>;
    adConversion: (data: any, options?: any) => Promise<string>;
    screenViewed: (data: any, options?: any) => Promise<string>;
};
export declare const WhatsAppEvents: {
    messageReceived: (data: any, options?: any) => Promise<string>;
    messageSent: (data: any, options?: any) => Promise<string>;
    sessionStarted: (data: any, options?: any) => Promise<string>;
    sessionEnded: (data: any, options?: any) => Promise<string>;
    conversationCreated: (data: any, options?: any) => Promise<string>;
};
export declare const CartEvents: {
    cartAbandoned: (data: any, options?: any) => Promise<string>;
    cartRecovered: (data: any, options?: any) => Promise<string>;
};
export declare const LoyaltyTierEvents: {
    tierUpgraded: (data: any, options?: any) => Promise<string>;
    tierDowngraded: (data: any, options?: any) => Promise<string>;
};
export declare const CampaignEvents: {
    campaignStarted: (data: any, options?: any) => Promise<string>;
    campaignCompleted: (data: any, options?: any) => Promise<string>;
    campaignEngaged: (data: any, options?: any) => Promise<string>;
};
/**
 * Initialize standard event consumers
 * Call this once at application startup
 */
export declare function initializeEventConsumers(): void;
//# sourceMappingURL=rezEventBus.d.ts.map