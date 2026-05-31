/**
 * Hojai Event Platform
 *
 * Migration Strategy: Fork & Sync
 *
 * SOURCE: REZ-Intelligence/REZ-event-bus
 * PORT: 4510
 *
 * This wrapper provides:
 * 1. Hojai ownership identity
 * 2. Multi-tenant support (added incrementally)
 * 3. Standard Hojai interfaces
 *
 * The underlying REZ-event-bus service remains unchanged.
 * Only the ownership and interfaces are wrapped.
 *
 * Migration Phases:
 * Phase 1: Create wrapper (THIS FILE)
 * Phase 2: Add tenant_id to event envelope
 * Phase 3: Add tenant filtering to subscriptions
 * Phase 4: Full multi-tenant isolation
 */
import { HojaiEvent } from '../../shared/types';
/**
 * Hojai Event Platform
 * Wraps REZ-event-bus with Hojai identity
 */
export declare class HojaiEventPlatform {
    private emitter;
    private subscriptions;
    constructor();
    /**
     * Publish an event (REQUIRED: tenant_id)
     */
    publish(tenantId: string, type: string, data: Record<string, any>): Promise<HojaiEvent>;
    /**
     * Subscribe to events (tenant-scoped)
     */
    subscribe(tenantId: string, eventType: string, handler: (event: HojaiEvent) => void): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(tenantId: string, subscriptionId: string): boolean;
    /**
     * Get event history (tenant-scoped)
     */
    getHistory(tenantId: string, options?: {
        type?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<HojaiEvent[]>;
    /**
     * Get subscription stats (tenant-scoped)
     */
    getStats(tenantId: string): {
        activeSubscriptions: number;
        eventsPublished: number;
        eventsProcessed: number;
    };
    private categorizeEvent;
    private matchesPattern;
    private generateEventId;
    private generateSubscriptionId;
}
/**
 * Create Express routes for Event Platform
 */
export declare function createEventRoutes(eventPlatform: HojaiEventPlatform): import("express-serve-static-core").Router;
/**
 * Bootstrap the Event Platform service
 */
export declare function bootstrap(port?: number): Promise<{
    eventPlatform: HojaiEventPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiEventPlatform: typeof HojaiEventPlatform;
    createEventRoutes: typeof createEventRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map