"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyRuleSchema = exports.ComplianceAuditSchema = exports.DataCategorySchema = exports.DataCategory = exports.RetentionPolicySchema = exports.RetentionPolicy = exports.DataRightRequestSchema = exports.DataRightStatus = exports.DataRightType = exports.ConsentSchema = exports.ConsentSource = exports.ConsentStatus = exports.ConsentType = void 0;
const zod_1 = require("zod");
// ============================================================================
// CONSENT TYPES
// ============================================================================
var ConsentType;
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
})(ConsentType || (exports.ConsentType = ConsentType = {}));
var ConsentStatus;
(function (ConsentStatus) {
    ConsentStatus["GRANTED"] = "granted";
    ConsentStatus["DENIED"] = "denied";
    ConsentStatus["WITHDRAWN"] = "withdrawn";
    ConsentStatus["EXPIRED"] = "expired";
    ConsentStatus["PENDING"] = "pending";
})(ConsentStatus || (exports.ConsentStatus = ConsentStatus = {}));
var ConsentSource;
(function (ConsentSource) {
    ConsentSource["EXPLICIT"] = "explicit";
    ConsentSource["IMPLIED"] = "implied";
    ConsentSource["LEGAL"] = "legal";
    ConsentSource["CONTRACT"] = "contract"; // Contractual necessity
})(ConsentSource || (exports.ConsentSource = ConsentSource = {}));
exports.ConsentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    // What consent is for
    type: zod_1.z.nativeEnum(ConsentType),
    // Who gave consent
    source: zod_1.z.nativeEnum(ConsentSource),
    // Status
    status: zod_1.z.nativeEnum(ConsentStatus).default(ConsentStatus.PENDING),
    // Details
    version: zod_1.z.string(), // Consent policy version
    description: zod_1.z.string(), // What they're consenting to
    dataCategories: zod_1.z.array(zod_1.z.string()), // e.g., ['behavior', 'location', 'purchase_history']
    // Granularity
    scope: zod_1.z.object({
        scope: zod_1.z.enum(['global', 'tenant', 'service', 'specific']),
        services: zod_1.z.array(zod_1.z.string()).optional(),
        dataTypes: zod_1.z.array(zod_1.z.string()).optional()
    }),
    // Purpose limitation
    purpose: zod_1.z.string(), // e.g., "improve_recommendations"
    purposeDescription: zod_1.z.string(),
    // Duration
    validFrom: zod_1.z.date(),
    validUntil: zod_1.z.date().optional(),
    // Withdrawal
    canWithdraw: zod_1.z.boolean().default(true),
    withdrawalMethod: zod_1.z.string().optional(),
    // Audit
    grantedAt: zod_1.z.date().optional(),
    grantedIP: zod_1.z.string().optional(),
    grantedUserAgent: zod_1.z.string().optional(),
    withdrawnAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// DATA RIGHTS TYPES
// ============================================================================
var DataRightType;
(function (DataRightType) {
    DataRightType["ACCESS"] = "access";
    DataRightType["RECTIFICATION"] = "rectification";
    DataRightType["ERASURE"] = "erasure";
    DataRightType["RESTRICTION"] = "restriction";
    DataRightType["PORTABILITY"] = "portability";
    DataRightType["OBJECTION"] = "objection";
    DataRightType["HUMAN_REVIEW"] = "human_review";
    DataRightType["EXPLAIN"] = "explain"; // Right to explanation
})(DataRightType || (exports.DataRightType = DataRightType = {}));
var DataRightStatus;
(function (DataRightStatus) {
    DataRightStatus["PENDING"] = "pending";
    DataRightStatus["IN_REVIEW"] = "in_review";
    DataRightStatus["APPROVED"] = "approved";
    DataRightStatus["DENIED"] = "denied";
    DataRightStatus["PARTIAL"] = "partial";
    DataRightStatus["FULFILLED"] = "fulfilled";
    DataRightStatus["EXPIRED"] = "expired";
})(DataRightStatus || (exports.DataRightStatus = DataRightStatus = {}));
exports.DataRightRequestSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    type: zod_1.z.nativeEnum(DataRightType),
    status: zod_1.z.nativeEnum(DataRightStatus).default(DataRightStatus.PENDING),
    // Request details
    description: zod_1.z.string(),
    requestedData: zod_1.z.array(zod_1.z.string()).optional(), // Specific data requested
    reason: zod_1.z.string().optional(),
    // For erasure requests
    cascadeDelete: zod_1.z.boolean().default(false), // Also delete from third parties?
    retentionOverride: zod_1.z.boolean().default(false), // Override legal retention
    // For objection requests
    objectionTo: zod_1.z.string().optional(), // Processing being objected to
    // Processing
    assignedTo: zod_1.z.string().optional(), // Employee handling it
    dueDate: zod_1.z.date().optional(),
    // Response
    responseData: zod_1.z.record(zod_1.z.any()).optional(),
    responseAt: zod_1.z.date().optional(),
    responseBy: zod_1.z.string().optional(),
    // Fulfillment
    fulfilledAt: zod_1.z.date().optional(),
    fulfillmentMethod: zod_1.z.enum(['download', 'deletion', 'correction', 'restriction_applied']).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// DATA RETENTION POLICIES
// ============================================================================
var RetentionPolicy;
(function (RetentionPolicy) {
    RetentionPolicy["ACTIVE_USER"] = "active_user";
    RetentionPolicy["INACTIVE_USER"] = "inactive_user";
    RetentionPolicy["TRANSACTION"] = "transaction";
    RetentionPolicy["CONSENT_BASED"] = "consent_based";
    RetentionPolicy["LEGAL_HOLD"] = "legal_hold";
    RetentionPolicy["ANONYMIZED"] = "anonymized"; // Anonymize after X months
})(RetentionPolicy || (exports.RetentionPolicy = RetentionPolicy = {}));
exports.RetentionPolicySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    // What data category this applies to
    dataCategory: zod_1.z.string(), // e.g., 'behavior', 'transaction', 'location'
    // Policy
    policy: zod_1.z.nativeEnum(RetentionPolicy),
    // Duration (in days)
    retentionDays: zod_1.z.number().optional(),
    // Trigger
    trigger: zod_1.z.enum(['consent_valid', 'last_activity', 'account_closed', 'manual', 'legal_requirement']).optional(),
    // Actions at expiry
    expiryAction: zod_1.z.enum(['delete', 'anonymize', 'restrict', 'archive', 'review']),
    // Legal compliance
    legalBasis: zod_1.z.string().optional(), // GDPR, CCPA, DPDPA, etc.
    legalBasisArticle: zod_1.z.string().optional(), // e.g., "GDPR Article 6(1)(a)"
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// DATA CATEGORIES
// ============================================================================
var DataCategory;
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
})(DataCategory || (exports.DataCategory = DataCategory = {}));
exports.DataCategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    category: zod_1.z.nativeEnum(DataCategory),
    // Sensitivity level (1-5, 5 = highest)
    sensitivityLevel: zod_1.z.number().min(1).max(5).default(1),
    // Legal classification
    legalClassification: zod_1.z.enum(['public', 'personal', 'sensitive', 'special']),
    // Required protections
    requiredProtections: zod_1.z.array(zod_1.z.enum([
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
    sharingRules: zod_1.z.object({
        canShareWithProcessors: zod_1.z.boolean().default(true),
        canShareWithThirdParties: zod_1.z.boolean().default(false),
        requiresConsent: zod_1.z.boolean().default(true),
        requiresLegalBasis: zod_1.z.boolean().default(true)
    }),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================
exports.ComplianceAuditSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // What happened
    event: zod_1.z.string(),
    category: zod_1.z.enum(['consent', 'data_right', 'retention', 'breach', 'transfer', 'security']),
    // Who was affected
    userId: zod_1.z.string().optional(),
    dataCategories: zod_1.z.array(zod_1.z.string()),
    // Details
    action: zod_1.z.string(),
    result: zod_1.z.enum(['success', 'failure', 'partial']),
    // Legal
    legalBasis: zod_1.z.string().optional(),
    gdprArticle: zod_1.z.string().optional(),
    // Technical
    ip: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    requestId: zod_1.z.string().optional(),
    // Metadata
    processedBy: zod_1.z.string().optional(),
    processingPurpose: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// POLICY RULES
// ============================================================================
exports.PolicyRuleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    // Priority (higher = evaluated first)
    priority: zod_1.z.number().default(0),
    // Conditions
    conditions: zod_1.z.object({
        dataCategory: zod_1.z.array(zod_1.z.nativeEnum(DataCategory)).optional(),
        consentStatus: zod_1.z.array(zod_1.z.nativeEnum(ConsentStatus)).optional(),
        userSegment: zod_1.z.array(zod_1.z.string()).optional(),
        processingType: zod_1.z.array(zod_1.z.string()).optional()
    }),
    // Action
    action: zod_1.z.enum(['allow', 'deny', 'require_consent', 'require_review', 'restrict', 'mask', 'anonymize']),
    // Enforcement
    enforcement: zod_1.z.object({
        immediate: zod_1.z.boolean().default(true),
        gracePeriodDays: zod_1.z.number().default(0),
        notificationRequired: zod_1.z.boolean().default(false)
    }),
    // Override
    canOverride: zod_1.z.boolean().default(false),
    overrideRoles: zod_1.z.array(zod_1.z.string()).optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
