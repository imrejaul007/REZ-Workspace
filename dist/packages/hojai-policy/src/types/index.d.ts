import { z } from 'zod';
export declare enum ConsentType {
    DATA_COLLECTION = "data_collection",
    MARKETING = "marketing",
    ANALYTICS = "analytics",
    AI_PROCESSING = "ai_processing",
    AI_TRAINING = "ai_training",
    DATA_SHARING = "data_sharing",
    THIRD_PARTY_SHARING = "third_party_sharing",
    PROFILING = "profiling",
    AUTOMATED_DECISIONS = "automated_decisions",
    LOCATION_TRACKING = "location_tracking"
}
export declare enum ConsentStatus {
    GRANTED = "granted",
    DENIED = "denied",
    WITHDRAWN = "withdrawn",
    EXPIRED = "expired",
    PENDING = "pending"
}
export declare enum ConsentSource {
    EXPLICIT = "explicit",// User clicked accept
    IMPLIED = "implied",// User continued using service
    LEGAL = "legal",// Legal obligation
    CONTRACT = "contract"
}
export declare const ConsentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodNativeEnum<typeof ConsentType>;
    source: z.ZodNativeEnum<typeof ConsentSource>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ConsentStatus>>;
    version: z.ZodString;
    description: z.ZodString;
    dataCategories: z.ZodArray<z.ZodString, "many">;
    scope: z.ZodObject<{
        scope: z.ZodEnum<["global", "tenant", "service", "specific"]>;
        services: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dataTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        scope: "tenant" | "service" | "global" | "specific";
        services?: string[] | undefined;
        dataTypes?: string[] | undefined;
    }, {
        scope: "tenant" | "service" | "global" | "specific";
        services?: string[] | undefined;
        dataTypes?: string[] | undefined;
    }>;
    purpose: z.ZodString;
    purposeDescription: z.ZodString;
    validFrom: z.ZodDate;
    validUntil: z.ZodOptional<z.ZodDate>;
    canWithdraw: z.ZodDefault<z.ZodBoolean>;
    withdrawalMethod: z.ZodOptional<z.ZodString>;
    grantedAt: z.ZodOptional<z.ZodDate>;
    grantedIP: z.ZodOptional<z.ZodString>;
    grantedUserAgent: z.ZodOptional<z.ZodString>;
    withdrawnAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    version: string;
    type: ConsentType;
    status: ConsentStatus;
    tenantId: string;
    source: ConsentSource;
    userId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    purpose: string;
    validFrom: Date;
    dataCategories: string[];
    scope: {
        scope: "tenant" | "service" | "global" | "specific";
        services?: string[] | undefined;
        dataTypes?: string[] | undefined;
    };
    purposeDescription: string;
    canWithdraw: boolean;
    validUntil?: Date | undefined;
    withdrawalMethod?: string | undefined;
    grantedAt?: Date | undefined;
    grantedIP?: string | undefined;
    grantedUserAgent?: string | undefined;
    withdrawnAt?: Date | undefined;
}, {
    id: string;
    version: string;
    type: ConsentType;
    tenantId: string;
    source: ConsentSource;
    userId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    purpose: string;
    validFrom: Date;
    dataCategories: string[];
    scope: {
        scope: "tenant" | "service" | "global" | "specific";
        services?: string[] | undefined;
        dataTypes?: string[] | undefined;
    };
    purposeDescription: string;
    status?: ConsentStatus | undefined;
    validUntil?: Date | undefined;
    canWithdraw?: boolean | undefined;
    withdrawalMethod?: string | undefined;
    grantedAt?: Date | undefined;
    grantedIP?: string | undefined;
    grantedUserAgent?: string | undefined;
    withdrawnAt?: Date | undefined;
}>;
export type Consent = z.infer<typeof ConsentSchema>;
export declare enum DataRightType {
    ACCESS = "access",// Right to access their data
    RECTIFICATION = "rectification",// Right to correct errors
    ERASURE = "erasure",// Right to delete ("right to be forgotten")
    RESTRICTION = "restriction",// Right to restrict processing
    PORTABILITY = "portability",// Right to data portability
    OBJECTION = "objection",// Right to object to processing
    HUMAN_REVIEW = "human_review",// Right to human review of automated decisions
    EXPLAIN = "explain"
}
export declare enum DataRightStatus {
    PENDING = "pending",
    IN_REVIEW = "in_review",
    APPROVED = "approved",
    DENIED = "denied",
    PARTIAL = "partial",
    FULFILLED = "fulfilled",
    EXPIRED = "expired"
}
export declare const DataRightRequestSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodNativeEnum<typeof DataRightType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof DataRightStatus>>;
    description: z.ZodString;
    requestedData: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    reason: z.ZodOptional<z.ZodString>;
    cascadeDelete: z.ZodDefault<z.ZodBoolean>;
    retentionOverride: z.ZodDefault<z.ZodBoolean>;
    objectionTo: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodDate>;
    responseData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    responseAt: z.ZodOptional<z.ZodDate>;
    responseBy: z.ZodOptional<z.ZodString>;
    fulfilledAt: z.ZodOptional<z.ZodDate>;
    fulfillmentMethod: z.ZodOptional<z.ZodEnum<["download", "deletion", "correction", "restriction_applied"]>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: DataRightType;
    status: DataRightStatus;
    tenantId: string;
    userId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    cascadeDelete: boolean;
    retentionOverride: boolean;
    reason?: string | undefined;
    assignedTo?: string | undefined;
    requestedData?: string[] | undefined;
    objectionTo?: string | undefined;
    dueDate?: Date | undefined;
    responseData?: Record<string, any> | undefined;
    responseAt?: Date | undefined;
    responseBy?: string | undefined;
    fulfilledAt?: Date | undefined;
    fulfillmentMethod?: "download" | "deletion" | "correction" | "restriction_applied" | undefined;
}, {
    id: string;
    type: DataRightType;
    tenantId: string;
    userId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    status?: DataRightStatus | undefined;
    reason?: string | undefined;
    assignedTo?: string | undefined;
    requestedData?: string[] | undefined;
    cascadeDelete?: boolean | undefined;
    retentionOverride?: boolean | undefined;
    objectionTo?: string | undefined;
    dueDate?: Date | undefined;
    responseData?: Record<string, any> | undefined;
    responseAt?: Date | undefined;
    responseBy?: string | undefined;
    fulfilledAt?: Date | undefined;
    fulfillmentMethod?: "download" | "deletion" | "correction" | "restriction_applied" | undefined;
}>;
export type DataRightRequest = z.infer<typeof DataRightRequestSchema>;
export declare enum RetentionPolicy {
    ACTIVE_USER = "active_user",// Keep while account active
    INACTIVE_USER = "inactive_user",// Keep X months after last activity
    TRANSACTION = "transaction",// Keep X years for legal compliance
    CONSENT_BASED = "consent_based",// Keep only while consent valid
    LEGAL_HOLD = "legal_hold",// Never delete (legal)
    ANONYMIZED = "anonymized"
}
export declare const RetentionPolicySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    dataCategory: z.ZodString;
    policy: z.ZodNativeEnum<typeof RetentionPolicy>;
    retentionDays: z.ZodOptional<z.ZodNumber>;
    trigger: z.ZodOptional<z.ZodEnum<["consent_valid", "last_activity", "account_closed", "manual", "legal_requirement"]>>;
    expiryAction: z.ZodEnum<["delete", "anonymize", "restrict", "archive", "review"]>;
    legalBasis: z.ZodOptional<z.ZodString>;
    legalBasisArticle: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    dataCategory: string;
    expiryAction: "delete" | "review" | "anonymize" | "restrict" | "archive";
    trigger?: "manual" | "consent_valid" | "last_activity" | "account_closed" | "legal_requirement" | undefined;
    retentionDays?: number | undefined;
    legalBasis?: string | undefined;
    legalBasisArticle?: string | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    dataCategory: string;
    expiryAction: "delete" | "review" | "anonymize" | "restrict" | "archive";
    active?: boolean | undefined;
    trigger?: "manual" | "consent_valid" | "last_activity" | "account_closed" | "legal_requirement" | undefined;
    retentionDays?: number | undefined;
    legalBasis?: string | undefined;
    legalBasisArticle?: string | undefined;
}>;
export type RetentionPolicyDoc = z.infer<typeof RetentionPolicySchema>;
export declare enum DataCategory {
    PERSONAL = "personal",// Name, email, phone
    FINANCIAL = "financial",// Payment info, transactions
    BEHAVIORAL = "behavioral",// Browsing, clicks, preferences
    LOCATION = "location",// GPS, visit history
    BIOMETRIC = "biometric",// Fingerprint, face (highly sensitive)
    HEALTH = "health",// Medical, health records
    CHILDREN = "children",// Data about children (very sensitive)
    COMMUNICATION = "communication",// Messages, calls
    SOCIAL = "social",// Social connections
    PROFESSIONAL = "professional",// Employment, education
    CONSUMPTION = "consumption",// Purchase history, habits
    DEVICE = "device"
}
export declare const DataCategorySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    category: z.ZodNativeEnum<typeof DataCategory>;
    sensitivityLevel: z.ZodDefault<z.ZodNumber>;
    legalClassification: z.ZodEnum<["public", "personal", "sensitive", "special"]>;
    requiredProtections: z.ZodArray<z.ZodEnum<["encryption_at_rest", "encryption_in_transit", "access_logging", "audit_trail", "consent_required", "legal_basis_required", "dpo_approval", "breach_notification", "impact_assessment"]>, "many">;
    sharingRules: z.ZodObject<{
        canShareWithProcessors: z.ZodDefault<z.ZodBoolean>;
        canShareWithThirdParties: z.ZodDefault<z.ZodBoolean>;
        requiresConsent: z.ZodDefault<z.ZodBoolean>;
        requiresLegalBasis: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    }, {
        canShareWithProcessors?: boolean | undefined;
        canShareWithThirdParties?: boolean | undefined;
        requiresConsent?: boolean | undefined;
        requiresLegalBasis?: boolean | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    category: DataCategory;
    createdAt: Date;
    updatedAt: Date;
    sensitivityLevel: number;
    legalClassification: "public" | "personal" | "sensitive" | "special";
    requiredProtections: ("encryption_at_rest" | "encryption_in_transit" | "access_logging" | "audit_trail" | "consent_required" | "legal_basis_required" | "dpo_approval" | "breach_notification" | "impact_assessment")[];
    sharingRules: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    };
}, {
    id: string;
    tenantId: string;
    category: DataCategory;
    createdAt: Date;
    updatedAt: Date;
    legalClassification: "public" | "personal" | "sensitive" | "special";
    requiredProtections: ("encryption_at_rest" | "encryption_in_transit" | "access_logging" | "audit_trail" | "consent_required" | "legal_basis_required" | "dpo_approval" | "breach_notification" | "impact_assessment")[];
    sharingRules: {
        canShareWithProcessors?: boolean | undefined;
        canShareWithThirdParties?: boolean | undefined;
        requiresConsent?: boolean | undefined;
        requiresLegalBasis?: boolean | undefined;
    };
    sensitivityLevel?: number | undefined;
}>;
export type DataCategoryDoc = z.infer<typeof DataCategorySchema>;
export declare const ComplianceAuditSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    event: z.ZodString;
    category: z.ZodEnum<["consent", "data_right", "retention", "breach", "transfer", "security"]>;
    userId: z.ZodOptional<z.ZodString>;
    dataCategories: z.ZodArray<z.ZodString, "many">;
    action: z.ZodString;
    result: z.ZodEnum<["success", "failure", "partial"]>;
    legalBasis: z.ZodOptional<z.ZodString>;
    gdprArticle: z.ZodOptional<z.ZodString>;
    ip: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    processedBy: z.ZodOptional<z.ZodString>;
    processingPurpose: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    event: string;
    action: string;
    id: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    createdAt: Date;
    result: "partial" | "success" | "failure";
    dataCategories: string[];
    userId?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    processedBy?: string | undefined;
    requestId?: string | undefined;
    legalBasis?: string | undefined;
    gdprArticle?: string | undefined;
    processingPurpose?: string | undefined;
}, {
    event: string;
    action: string;
    id: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    createdAt: Date;
    result: "partial" | "success" | "failure";
    dataCategories: string[];
    userId?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    processedBy?: string | undefined;
    requestId?: string | undefined;
    legalBasis?: string | undefined;
    gdprArticle?: string | undefined;
    processingPurpose?: string | undefined;
}>;
export type ComplianceAudit = z.infer<typeof ComplianceAuditSchema>;
export declare const PolicyRuleSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    conditions: z.ZodObject<{
        dataCategory: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof DataCategory>, "many">>;
        consentStatus: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof ConsentStatus>, "many">>;
        userSegment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        processingType: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        consentStatus?: ConsentStatus[] | undefined;
        dataCategory?: DataCategory[] | undefined;
        userSegment?: string[] | undefined;
        processingType?: string[] | undefined;
    }, {
        consentStatus?: ConsentStatus[] | undefined;
        dataCategory?: DataCategory[] | undefined;
        userSegment?: string[] | undefined;
        processingType?: string[] | undefined;
    }>;
    action: z.ZodEnum<["allow", "deny", "require_consent", "require_review", "restrict", "mask", "anonymize"]>;
    enforcement: z.ZodObject<{
        immediate: z.ZodDefault<z.ZodBoolean>;
        gracePeriodDays: z.ZodDefault<z.ZodNumber>;
        notificationRequired: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    }, {
        immediate?: boolean | undefined;
        gracePeriodDays?: number | undefined;
        notificationRequired?: boolean | undefined;
    }>;
    canOverride: z.ZodDefault<z.ZodBoolean>;
    overrideRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    action: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask";
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    priority: number;
    conditions: {
        consentStatus?: ConsentStatus[] | undefined;
        dataCategory?: DataCategory[] | undefined;
        userSegment?: string[] | undefined;
        processingType?: string[] | undefined;
    };
    canOverride: boolean;
    enforcement: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    };
    overrideRoles?: string[] | undefined;
}, {
    action: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask";
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        consentStatus?: ConsentStatus[] | undefined;
        dataCategory?: DataCategory[] | undefined;
        userSegment?: string[] | undefined;
        processingType?: string[] | undefined;
    };
    enforcement: {
        immediate?: boolean | undefined;
        gracePeriodDays?: number | undefined;
        notificationRequired?: boolean | undefined;
    };
    active?: boolean | undefined;
    priority?: number | undefined;
    canOverride?: boolean | undefined;
    overrideRoles?: string[] | undefined;
}>;
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;
//# sourceMappingURL=index.d.ts.map