import { z } from 'zod';
// ============================================================================
// CONSENT TYPES
// ============================================================================
export var ConsentType;
(function (ConsentType) {
    ConsentType["DATA_COLLECTION"] = "data_collection";
    ConsentType["MARKETING"] = "marketing";
    ConsentType["ANALYTICS"] = "analytics";
    ConsentType["AI_PROCESSING"] = "ai_processing";
    ConsentType["AI_TRAINING"] = "ai_training";
    ConsentType["DATA_SHARING"] = "data_sharing";
    ConsentType["THIRD_PARTY_SHARING"] = "third_party_sharing";
    ConsentType["PROFILING"] = "profiling";
    ConsentType["AUTOMATED_DECISIONS"] = "automated_decisions";
    ConsentType["LOCATION_TRACKING"] = "location_tracking";
})(ConsentType || (ConsentType = {}));
export var ConsentStatus;
(function (ConsentStatus) {
    ConsentStatus["GRANTED"] = "granted";
    ConsentStatus["DENIED"] = "denied";
    ConsentStatus["WITHDRAWN"] = "withdrawn";
    ConsentStatus["EXPIRED"] = "expired";
    ConsentStatus["PENDING"] = "pending";
})(ConsentStatus || (ConsentStatus = {}));
export var ConsentSource;
(function (ConsentSource) {
    ConsentSource["EXPLICIT"] = "explicit";
    ConsentSource["IMPLIED"] = "implied";
    ConsentSource["LEGAL"] = "legal";
    ConsentSource["CONTRACT"] = "contract"; // Contractual necessity
})(ConsentSource || (ConsentSource = {}));
export const ConsentSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string(),
    // What consent is for
    type: z.nativeEnum(ConsentType),
    // Who gave consent
    source: z.nativeEnum(ConsentSource),
    // Status
    status: z.nativeEnum(ConsentStatus).default(ConsentStatus.PENDING),
    // Details
    version: z.string(), // Consent policy version
    description: z.string(), // What they're consenting to
    dataCategories: z.array(z.string()), // e.g., ['behavior', 'location', 'purchase_history']
    // Granularity
    scope: z.object({
        scope: z.enum(['global', 'tenant', 'service', 'specific']),
        services: z.array(z.string()).optional(),
        dataTypes: z.array(z.string()).optional()
    }),
    // Purpose limitation
    purpose: z.string(), // e.g., "improve_recommendations"
    purposeDescription: z.string(),
    // Duration
    validFrom: z.date(),
    validUntil: z.date().optional(),
    // Withdrawal
    canWithdraw: z.boolean().default(true),
    withdrawalMethod: z.string().optional(),
    // Audit
    grantedAt: z.date().optional(),
    grantedIP: z.string().optional(),
    grantedUserAgent: z.string().optional(),
    withdrawnAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// DATA RIGHTS TYPES
// ============================================================================
export var DataRightType;
(function (DataRightType) {
    DataRightType["ACCESS"] = "access";
    DataRightType["RECTIFICATION"] = "rectification";
    DataRightType["ERASURE"] = "erasure";
    DataRightType["RESTRICTION"] = "restriction";
    DataRightType["PORTABILITY"] = "portability";
    DataRightType["OBJECTION"] = "objection";
    DataRightType["HUMAN_REVIEW"] = "human_review";
    DataRightType["EXPLAIN"] = "explain"; // Right to explanation
})(DataRightType || (DataRightType = {}));
export var DataRightStatus;
(function (DataRightStatus) {
    DataRightStatus["PENDING"] = "pending";
    DataRightStatus["IN_REVIEW"] = "in_review";
    DataRightStatus["APPROVED"] = "approved";
    DataRightStatus["DENIED"] = "denied";
    DataRightStatus["PARTIAL"] = "partial";
    DataRightStatus["FULFILLED"] = "fulfilled";
    DataRightStatus["EXPIRED"] = "expired";
})(DataRightStatus || (DataRightStatus = {}));
export const DataRightRequestSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string(),
    type: z.nativeEnum(DataRightType),
    status: z.nativeEnum(DataRightStatus).default(DataRightStatus.PENDING),
    // Request details
    description: z.string(),
    requestedData: z.array(z.string()).optional(), // Specific data requested
    reason: z.string().optional(),
    // For erasure requests
    cascadeDelete: z.boolean().default(false), // Also delete from third parties?
    retentionOverride: z.boolean().default(false), // Override legal retention
    // For objection requests
    objectionTo: z.string().optional(), // Processing being objected to
    // Processing
    assignedTo: z.string().optional(), // Employee handling it
    dueDate: z.date().optional(),
    // Response
    responseData: z.record(z.any()).optional(),
    responseAt: z.date().optional(),
    responseBy: z.string().optional(),
    // Fulfillment
    fulfilledAt: z.date().optional(),
    fulfillmentMethod: z.enum(['download', 'deletion', 'correction', 'restriction_applied']).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// DATA RETENTION POLICIES
// ============================================================================
export var RetentionPolicy;
(function (RetentionPolicy) {
    RetentionPolicy["ACTIVE_USER"] = "active_user";
    RetentionPolicy["INACTIVE_USER"] = "inactive_user";
    RetentionPolicy["TRANSACTION"] = "transaction";
    RetentionPolicy["CONSENT_BASED"] = "consent_based";
    RetentionPolicy["LEGAL_HOLD"] = "legal_hold";
    RetentionPolicy["ANONYMIZED"] = "anonymized"; // Anonymize after X months
})(RetentionPolicy || (RetentionPolicy = {}));
export const RetentionPolicySchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    // What data category this applies to
    dataCategory: z.string(), // e.g., 'behavior', 'transaction', 'location'
    // Policy
    policy: z.nativeEnum(RetentionPolicy),
    // Duration (in days)
    retentionDays: z.number().optional(),
    // Trigger
    trigger: z.enum(['consent_valid', 'last_activity', 'account_closed', 'manual', 'legal_requirement']).optional(),
    // Actions at expiry
    expiryAction: z.enum(['delete', 'anonymize', 'restrict', 'archive', 'review']),
    // Legal compliance
    legalBasis: z.string().optional(), // GDPR, CCPA, DPDPA, etc.
    legalBasisArticle: z.string().optional(), // e.g., "GDPR Article 6(1)(a)"
    active: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// DATA CATEGORIES
// ============================================================================
export var DataCategory;
(function (DataCategory) {
    DataCategory["PERSONAL"] = "personal";
    DataCategory["FINANCIAL"] = "financial";
    DataCategory["BEHAVIORAL"] = "behavioral";
    DataCategory["LOCATION"] = "location";
    DataCategory["BIOMETRIC"] = "biometric";
    DataCategory["HEALTH"] = "health";
    DataCategory["CHILDREN"] = "children";
    DataCategory["COMMUNICATION"] = "communication";
    DataCategory["SOCIAL"] = "social";
    DataCategory["PROFESSIONAL"] = "professional";
    DataCategory["CONSUMPTION"] = "consumption";
    DataCategory["DEVICE"] = "device"; // Device IDs, technical data
})(DataCategory || (DataCategory = {}));
export const DataCategorySchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    category: z.nativeEnum(DataCategory),
    // Sensitivity level (1-5, 5 = highest)
    sensitivityLevel: z.number().min(1).max(5).default(1),
    // Legal classification
    legalClassification: z.enum(['public', 'personal', 'sensitive', 'special']),
    // Required protections
    requiredProtections: z.array(z.enum([
        'encryption_at_rest',
        'encryption_in_transit',
        'access_logging',
        'audit_trail',
        'consent_required',
        'legal_basis_required',
        'dpo_approval',
        'breach_notification',
        'impact_assessment'
    ])),
    // Sharing rules
    sharingRules: z.object({
        canShareWithProcessors: z.boolean().default(true),
        canShareWithThirdParties: z.boolean().default(false),
        requiresConsent: z.boolean().default(true),
        requiresLegalBasis: z.boolean().default(true)
    }),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================
export const ComplianceAuditSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    // What happened
    event: z.string(),
    category: z.enum(['consent', 'data_right', 'retention', 'breach', 'transfer', 'security']),
    // Who was affected
    userId: z.string().optional(),
    dataCategories: z.array(z.string()),
    // Details
    action: z.string(),
    result: z.enum(['success', 'failure', 'partial']),
    // Legal
    legalBasis: z.string().optional(),
    gdprArticle: z.string().optional(),
    // Technical
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    requestId: z.string().optional(),
    // Metadata
    processedBy: z.string().optional(),
    processingPurpose: z.string().optional(),
    createdAt: z.date()
});
// ============================================================================
// POLICY RULES
// ============================================================================
export const PolicyRuleSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    // Priority (higher = evaluated first)
    priority: z.number().default(0),
    // Conditions
    conditions: z.object({
        dataCategory: z.array(z.nativeEnum(DataCategory)).optional(),
        consentStatus: z.array(z.nativeEnum(ConsentStatus)).optional(),
        userSegment: z.array(z.string()).optional(),
        processingType: z.array(z.string()).optional()
    }),
    // Action
    action: z.enum(['allow', 'deny', 'require_consent', 'require_review', 'restrict', 'mask', 'anonymize']),
    // Enforcement
    enforcement: z.object({
        immediate: z.boolean().default(true),
        gracePeriodDays: z.number().default(0),
        notificationRequired: z.boolean().default(false)
    }),
    // Override
    canOverride: z.boolean().default(false),
    overrideRoles: z.array(z.string()).optional(),
    active: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
//# sourceMappingURL=index.js.map