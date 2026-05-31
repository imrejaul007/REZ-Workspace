/**
 * Hojai Core - Shared Types
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Canonical types for all Hojai Core platforms
 */
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    tenant_type: 'internal' | 'commercial' | 'industry';
    organization_id?: string;
    user_id?: string;
    roles: string[];
    permissions: string[];
    plan?: 'starter' | 'professional' | 'enterprise';
    limits?: TenantLimits;
}
export interface TenantLimits {
    max_users: number;
    max_api_calls: number;
    max_storage: number;
    rate_limit: number;
}
export interface TenantIdentifier {
    tenant_id: string;
    organization_id: string;
    namespace: string;
    display_name: string;
    type: 'internal' | 'commercial' | 'industry';
    industry?: string;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: APIError;
    meta: ResponseMeta;
}
export interface APIError {
    code: string;
    message: string;
    details?: any;
}
export interface ResponseMeta {
    timestamp: string;
    requestId: string;
    tenantId?: string;
    latencyMs?: number;
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
export interface HojaiEvent {
    id: string;
    tenant_id: string;
    type: string;
    category: EventCategory;
    source: string;
    timestamp: string;
    correlationId?: string;
    causationId?: string;
    data: Record<string, any>;
}
export type EventCategory = 'commerce' | 'identity' | 'loyalty' | 'engagement' | 'support' | 'communication' | 'ai' | 'system' | 'workflow';
export interface EventSubscription {
    id: string;
    tenant_id: string;
    eventType: string;
    handler: string;
    filter?: Record<string, any>;
    status: 'active' | 'paused';
}
export interface MemoryEntry {
    id: string;
    tenant_id: string;
    scope_type: 'customer' | 'business' | 'conversation';
    scope_id: string;
    type: MemoryType;
    key: string;
    value: string;
    confidence: number;
    source: 'ai_extracted' | 'manual' | 'behavior' | 'conversation';
    expires_at?: string;
    created_at: string;
    updated_at: string;
}
export type MemoryType = 'preference' | 'history' | 'context' | 'sop' | 'intent';
export interface CustomerMemory extends MemoryEntry {
    scope_type: 'customer';
    type: 'preference' | 'history' | 'intent';
}
export interface BusinessMemory extends MemoryEntry {
    scope_type: 'business';
    type: 'sop';
}
export interface Workflow {
    id: string;
    tenant_id: string;
    name: string;
    type: WorkflowType;
    status: 'draft' | 'active' | 'paused' | 'stopped';
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    version: number;
    created_at: string;
    updated_at: string;
}
export type WorkflowType = 'automation' | 'sequence' | 'broadcast' | 'reaction';
export interface WorkflowTrigger {
    type: 'event' | 'schedule' | 'manual' | 'api';
    event_type?: string;
    schedule_cron?: string;
}
export interface WorkflowStep {
    id: string;
    order: number;
    type: 'message' | 'delay' | 'condition' | 'action' | 'ai';
    config: Record<string, any>;
}
export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    tenant_id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    started_at: string;
    completed_at?: string;
    current_step: number;
    context: Record<string, any>;
}
export interface AIEmployee {
    id: string;
    tenant_id: string;
    name: string;
    type: AgentType;
    status: 'active' | 'training' | 'inactive';
    version: number;
    config: AgentConfig;
    stats: AgentStats;
    created_at: string;
    updated_at: string;
}
export type AgentType = 'support' | 'sales' | 'booking' | 'marketing' | 'retention';
export interface AgentConfig {
    working_hours: {
        enabled: boolean;
        timezone: string;
    };
    channels: string[];
    languages: string[];
    handoff_enabled: boolean;
}
export interface AgentStats {
    total_conversations: number;
    resolved_conversations: number;
    escalated_conversations: number;
    avg_resolution_time_minutes: number;
    avg_csat_score: number;
}
export declare function createResponse<T>(data: T, options?: {
    tenantId?: string;
    requestId?: string;
}): APIResponse<T>;
export declare function createErrorResponse(code: string, message: string, details?: any): APIResponse<null>;
//# sourceMappingURL=index.d.ts.map