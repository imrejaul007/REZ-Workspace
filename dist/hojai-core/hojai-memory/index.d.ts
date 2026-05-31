/**
 * Hojai Memory Platform - Enhanced
 *
 * PORT: 4520
 *
 * Enhanced with:
 * - Context Engine (current situation understanding)
 * - Timeline Engine (temporal memory)
 * - Semantic Memory (long-term knowledge)
 * - Working Memory (short-term context)
 */
/**
 * Memory types
 */
export type MemoryType = 'preference' | 'history' | 'context' | 'intent' | 'sop' | 'knowledge' | 'fact' | 'preference';
/**
 * Memory source
 */
export type MemorySource = 'explicit' | 'implicit' | 'conversation' | 'behavior' | 'ai_extracted' | 'manual';
/**
 * Memory entity
 */
export interface Memory {
    id: string;
    tenant_id: string;
    scope_type: 'customer' | 'merchant' | 'business';
    scope_id: string;
    type: MemoryType;
    key: string;
    value: string;
    source: MemorySource;
    confidence: number;
    importance: number;
    tags: string[];
    usage_count: number;
    last_used_at?: string;
    expires_at?: string;
    verified: boolean;
    verified_by?: string;
    created_at: string;
    updated_at: string;
}
/**
 * Context types
 */
export type ContextType = 'session' | 'task' | 'goal' | 'constraint' | 'preference' | 'emotional';
/**
 * Context entry
 */
export interface ContextEntry {
    id: string;
    tenant_id: string;
    customer_id: string;
    type: ContextType;
    value: string;
    confidence: number;
    session_id: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
}
/**
 * Customer context (snapshot of current state)
 */
export interface CustomerContext {
    customer_id: string;
    tenant_id: string;
    active_intent?: string;
    active_task?: string;
    active_goal?: string;
    emotional_state?: 'positive' | 'neutral' | 'negative';
    sentiment_score?: number;
    recent_entries: ContextEntry[];
    current_session_id?: string;
    session_started_at?: string;
    context_summary?: string;
    last_updated: string;
}
/**
 * Timeline event
 */
export interface TimelineEvent {
    id: string;
    tenant_id: string;
    customer_id: string;
    type: string;
    category: TimelineCategory;
    title: string;
    description?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    value?: number;
    currency?: string;
    impact: 'positive' | 'negative' | 'neutral';
    metadata: Record<string, unknown>;
    occurred_at: string;
    created_at: string;
}
export type TimelineCategory = 'commerce' | 'support' | 'engagement' | 'communication' | 'loyalty' | 'feedback';
/**
 * Timeline summary
 */
export interface TimelineSummary {
    customer_id: string;
    tenant_id: string;
    total_events: number;
    first_event_date?: string;
    last_event_date?: string;
    events_by_category: Record<TimelineCategory, number>;
    recent_events: TimelineEvent[];
    highlights: TimelineHighlight[];
}
export interface TimelineHighlight {
    type: 'milestone' | 'achievement' | 'concern';
    title: string;
    description: string;
    date: string;
}
export declare class HojaiMemoryPlatform {
    private memoryEngine;
    private contextEngine;
    private timelineEngine;
    constructor();
    store(tenantId: string, scopeType: 'customer' | 'merchant' | 'business', scopeId: string, type: MemoryType, key: string, value: string, options?: any): Promise<Memory>;
    get(tenantId: string, scopeType: 'customer' | 'merchant' | 'business', scopeId: string, options?: any): Promise<Memory[]>;
    search(tenantId: string, scopeType: 'customer' | 'merchant' | 'business', scopeId: string, query: string): Promise<Memory[]>;
    delete(tenantId: string, scopeType: 'customer' | 'merchant' | 'business', scopeId: string, memoryId: string): Promise<boolean>;
    setContext(tenantId: string, customerId: string, sessionId: string, type: ContextType, value: string, confidence?: number): Promise<ContextEntry>;
    getContext(tenantId: string, customerId: string, sessionId?: string): Promise<CustomerContext>;
    clearSession(tenantId: string, customerId: string, sessionId: string): Promise<void>;
    summarizeContext(tenantId: string, customerId: string, sessionId: string): Promise<string>;
    addTimelineEvent(tenantId: string, customerId: string, event: any): Promise<TimelineEvent>;
    getTimeline(tenantId: string, customerId: string, options?: any): Promise<TimelineEvent[]>;
    getTimelineSummary(tenantId: string, customerId: string): Promise<TimelineSummary>;
}
export declare function createMemoryRoutes(platform: HojaiMemoryPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiMemoryPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiMemoryPlatform: typeof HojaiMemoryPlatform;
    createMemoryRoutes: typeof createMemoryRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map