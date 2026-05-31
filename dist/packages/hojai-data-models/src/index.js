/**
 * Hojai Data Models - Main Export
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Canonical data models for Hojai AI Platform
 * All entities are tenant-scoped by default.
 */
// ============================================
// ENTITIES
// ============================================
// Tenant Entity (Priority #1)
export { 
// Schemas
TenantCreateSchema, TenantUpdateSchema, DEFAULT_TENANT_LIMITS, 
// Factories
createTenant, upgradeTenantPlan, suspendTenant, reactivateTenant, churnTenant, } from './entities/tenant';
// Consent Entity (Priority #2)
export { 
// Schemas
ConsentCreateSchema, ConsentUpdateSchema, ConsentWithdrawalSchema, CONSENT_CATEGORIES, CONSENT_PURPOSE_LABELS, CONSENT_TEXT_TEMPLATES, 
// Factories
grantConsent, denyConsent, withdrawConsent, isConsentValid, getCustomerConsentPreference, } from './entities/consent';
// Customer Entity
export { 
// Schemas
CustomerCreateSchema, CustomerUpdateSchema, 
// Factories
createCustomer, updateCustomerMetrics, updateCustomerRisk, } from './entities/customer';
// Merchant Entity (NEW - REZ Merchant)
export { 
// Schemas
MerchantCreateSchema, MerchantUpdateSchema, MerchantAddressSchema, DEFAULT_OPERATING_HOURS, 
// Factories
createMerchant, addMerchantAddress, updateMerchantMetrics, verifyMerchant, suspendMerchant, reactivateMerchant, getMerchantSummary, calculateMerchantHealth, } from './entities/merchant';
// Knowledge Entity (Graph Model)
export { 
// Schemas
KnowledgeNodeCreateSchema, KnowledgeNodeUpdateSchema, KnowledgeEdgeCreateSchema, KnowledgeCollectionCreateSchema, KNOWLEDGE_RELATIONSHIP_LABELS, 
// Factories
createKnowledgeNode, createKnowledgeEdge, createKnowledgeCollection, markNodeHelpful, markNodeNotHelpful, updateNodeQualityScore, verifyNode, incrementNodeUsage, archiveNode, findConnectedNodes, buildAdjacencyList, } from './entities/knowledge';
// Conversation Entity
export { ConversationCreateSchema, ConversationUpdateSchema, createConversation, closeConversation, } from './entities/conversation';
// Event, Workflow, Agent, Campaign Entities
export { createEvent, WorkflowCreateSchema, createWorkflow, AgentCreateSchema, createAgent, CampaignCreateSchema, createCampaign, } from './entities/event';
// ============================================
// FACTORY HELPERS
// ============================================
/**
 * Create standard API response
 */
export function createResponse(data, options) {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId || `req_${Date.now()}`,
            tenantId: options?.tenantId,
        },
    };
}
/**
 * Create error response
 */
export function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: { code, message, details },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`,
        },
    };
}
/**
 * Generate ID with prefix
 */
export function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=index.js.map