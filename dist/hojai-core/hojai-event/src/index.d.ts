/**
 * Hojai Event Bus Service
 * Version: 1.0 | Port: 4510
 * Event streaming, pub/sub, and event sourcing
 */
export interface Event {
    id: string;
    type: string;
    source: string;
    tenantId: string;
    timestamp: string;
    data: Record<string, unknown>;
    metadata?: {
        userId?: string;
        sessionId?: string;
        correlationId?: string;
        traceId?: string;
    };
}
export interface Subscription {
    id: string;
    tenantId: string;
    name: string;
    eventType: string;
    eventPattern?: string;
    handler: string;
    filter?: Record<string, unknown>;
    createdAt: string;
    active: boolean;
    stats: {
        received: number;
        processed: number;
        failed: number;
    };
}
export interface EventStream {
    id: string;
    name: string;
    tenantId: string;
    eventTypes: string[];
    retentionDays: number;
    createdAt: string;
}
export declare const eventStore: Map<string, Event[]>;
export declare const subscriptionStore: Subscription[];
export declare const streamStore: EventStream[];
interface TenantContext {
    tenant_id: string;
    user_id?: string;
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
declare class HojaiEventBus {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private groupByType;
    start(): void;
}
declare const eventBus: HojaiEventBus;
export { HojaiEventBus };
export default eventBus;
//# sourceMappingURL=index.d.ts.map