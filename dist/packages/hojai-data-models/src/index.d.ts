/**
 * Hojai Data Models - Main Export
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Canonical data models for Hojai AI Platform
 * All entities are tenant-scoped by default.
 */
export { type Tenant, type TenantType, type TenantPlan, type TenantStatus, type Industry, type TenantLimits, type TenantContact, type TenantBranding, type TenantSettings, type TenantBilling, TenantCreateSchema, TenantUpdateSchema, DEFAULT_TENANT_LIMITS, createTenant, upgradeTenantPlan, suspendTenant, reactivateTenant, churnTenant, } from './entities/tenant';
export { type Consent, type ConsentPurpose, type ConsentSource, type ConsentStatus, type ConsentChannel, type ConsentCategory, type CustomerConsentPreference, type ConsentSummary, ConsentCreateSchema, ConsentUpdateSchema, ConsentWithdrawalSchema, CONSENT_CATEGORIES, CONSENT_PURPOSE_LABELS, CONSENT_TEXT_TEMPLATES, grantConsent, denyConsent, withdrawConsent, isConsentValid, getCustomerConsentPreference, } from './entities/consent';
export { type Customer, type CustomerType, type CustomerStatus, type CustomerPreferences, type CustomerConsentStatus, type CustomerSummary, type Customer360, type GeoPoint, CustomerCreateSchema, CustomerUpdateSchema, createCustomer, updateCustomerMetrics, updateCustomerRisk, } from './entities/customer';
export { type Merchant, type MerchantType, type MerchantStatus, type BusinessCategory, type OperatingHours, type MerchantAddress, type MerchantSummary, type MerchantMetrics, type MerchantHealthScore, MerchantCreateSchema, MerchantUpdateSchema, MerchantAddressSchema, DEFAULT_OPERATING_HOURS, createMerchant, addMerchantAddress, updateMerchantMetrics, verifyMerchant, suspendMerchant, reactivateMerchant, getMerchantSummary, calculateMerchantHealth, } from './entities/merchant';
export { type KnowledgeNode, type KnowledgeNodeType, type KnowledgeStatus, type KnowledgeEdge, type KnowledgeRelationship, type KnowledgeSource, type KnowledgeCollection, KnowledgeNodeCreateSchema, KnowledgeNodeUpdateSchema, KnowledgeEdgeCreateSchema, KnowledgeCollectionCreateSchema, KNOWLEDGE_RELATIONSHIP_LABELS, createKnowledgeNode, createKnowledgeEdge, createKnowledgeCollection, markNodeHelpful, markNodeNotHelpful, updateNodeQualityScore, verifyNode, incrementNodeUsage, archiveNode, findConnectedNodes, buildAdjacencyList, } from './entities/knowledge';
export { type Conversation, type ConversationChannel, type ConversationStatus, type ConversationPriority, type Message, ConversationCreateSchema, ConversationUpdateSchema, createConversation, closeConversation, } from './entities/conversation';
export { type Event, type EventCategory, type EventActorType, createEvent, type Workflow, type WorkflowType, type WorkflowStatus, type WorkflowTrigger, type WorkflowStep, type WorkflowExecution, WorkflowCreateSchema, createWorkflow, type Agent, type AgentType, type AgentStatus, type AgentConfig, type AgentBehavior, type AgentStats, AgentCreateSchema, createAgent, type Campaign, type CampaignType, type CampaignChannel, type CampaignStatus, type CampaignContent, type CampaignStats, CampaignCreateSchema, createCampaign, } from './entities/event';
/**
 * Base entity with timestamps
 */
export interface BaseEntity {
    id: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
}
/**
 * API response wrapper
 */
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: APIError;
    meta: ResponseMeta;
}
export interface APIError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface ResponseMeta {
    timestamp: string;
    requestId: string;
    tenantId?: string;
    latencyMs?: number;
}
/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
/**
 * Create standard API response
 */
export declare function createResponse<T>(data: T, options?: {
    tenantId?: string;
    requestId?: string;
}): APIResponse<T>;
/**
 * Create error response
 */
export declare function createErrorResponse(code: string, message: string, details?: Record<string, unknown>): APIResponse<null>;
/**
 * Generate ID with prefix
 */
export declare function generateId(prefix: string): string;
export type { BaseEntity, APIResponse, APIError, ResponseMeta, PaginatedResponse, };
//# sourceMappingURL=index.d.ts.map