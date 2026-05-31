import { Event, Subscription } from '../types/index.js';
export declare class EventBusService {
    private redis;
    private kafka;
    private kafkaProducer;
    private kafkaConsumers;
    private subscriptions;
    private eventHandlers;
    constructor();
    /**
     * Initialize Kafka producer
     */
    initialize(): Promise<void>;
    /**
     * Load active subscriptions from database
     */
    private loadSubscriptions;
    /**
     * Publish an event
     */
    publish(tenantId: string, event: Omit<Event, 'id' | 'tenantId' | 'timestamp'>): Promise<Event>;
    /**
     * Subscribe to events
     */
    subscribe(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription>;
    /**
     * Set up Redis Pub/Sub subscription
     */
    private setupRedisSubscription;
    /**
     * Trigger local event handlers
     */
    private triggerHandlers;
    /**
     * Trigger subscriptions for an event
     */
    private triggerSubscriptions;
    /**
     * Deliver event to subscription endpoint
     */
    private deliverToEndpoint;
    /**
     * Handle subscription delivery failure
     */
    private handleDeliveryFailure;
    /**
     * Register an event handler
     */
    on(eventType: string, handler: (event: Event) => Promise<void>): void;
    /**
     * Remove an event handler
     */
    off(eventType: string, handler: (event: Event) => Promise<void>): void;
    /**
     * Query historical events
     */
    query(params: {
        tenantId: string;
        eventTypes?: string[];
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: Event[];
        total: number;
    }>;
    /**
     * Replay events from a specific timestamp
     */
    replay(params: {
        tenantId: string;
        startDate: Date;
        endDate?: Date;
        eventTypes?: string[];
        subscriptionId: string;
    }): Promise<{
        replayedCount: number;
    }>;
    /**
     * Get event statistics
     */
    getStats(tenantId: string): Promise<{
        totalEvents: number;
        eventsByCategory: Record<string, number>;
        eventsByType: Record<string, number>;
        eventsLast24h: number;
        dlqCount: number;
    }>;
    private checkPrivilegedAccess;
    private getTenantIsolation;
    private delay;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare const eventBusService: EventBusService;
//# sourceMappingURL=eventBus.d.ts.map