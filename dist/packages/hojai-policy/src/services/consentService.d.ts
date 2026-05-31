import mongoose from 'mongoose';
import { Consent, ConsentType, ConsentStatus, ConsentSource, DataRightType, DataRightStatus, DataRightRequest, RetentionPolicy, DataCategory, ComplianceAudit } from '../types/index.js';
export declare const ConsentModel: mongoose.Model<{
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    version: string;
    status: ConsentStatus;
    type: ConsentType;
    tenantId: string;
    userId: string;
    source: ConsentSource;
    dataCategories: string[];
    canWithdraw: boolean;
    description?: string | null | undefined;
    purpose?: string | null | undefined;
    validUntil?: NativeDate | null | undefined;
    validFrom?: NativeDate | null | undefined;
    scope?: {
        scope: "service" | "global" | "tenant" | "specific";
        services: string[];
        dataTypes: string[];
    } | null | undefined;
    purposeDescription?: string | null | undefined;
    withdrawalMethod?: string | null | undefined;
    grantedAt?: NativeDate | null | undefined;
    grantedIP?: string | null | undefined;
    grantedUserAgent?: string | null | undefined;
    withdrawnAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const DataRightModel: mongoose.Model<{
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: DataRightStatus;
    type: DataRightType;
    tenantId: string;
    userId: string;
    requestedData: string[];
    cascadeDelete: boolean;
    retentionOverride: boolean;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    dueDate?: NativeDate | null | undefined;
    assignedTo?: string | null | undefined;
    objectionTo?: string | null | undefined;
    responseData?: Map<string, any> | null | undefined;
    responseAt?: NativeDate | null | undefined;
    responseBy?: string | null | undefined;
    fulfilledAt?: NativeDate | null | undefined;
    fulfillmentMethod?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const RetentionPolicyModel: mongoose.Model<{
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    policy: RetentionPolicy;
    dataCategory: string;
    description?: string | null | undefined;
    trigger?: string | null | undefined;
    retentionDays?: number | null | undefined;
    expiryAction?: "delete" | "review" | "anonymize" | "restrict" | "archive" | null | undefined;
    legalBasis?: string | null | undefined;
    legalBasisArticle?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const DataCategoryModel: mongoose.Model<{
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    category: DataCategory;
    sensitivityLevel: number;
    requiredProtections: string[];
    legalClassification?: "personal" | "public" | "sensitive" | "special" | null | undefined;
    sharingRules?: {
        canShareWithProcessors: boolean;
        canShareWithThirdParties: boolean;
        requiresConsent: boolean;
        requiresLegalBasis: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const PolicyRuleModel: mongoose.Model<{
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    priority: number;
    canOverride: boolean;
    overrideRoles: string[];
    description?: string | null | undefined;
    action?: "allow" | "deny" | "require_review" | "anonymize" | "restrict" | "require_consent" | "mask" | null | undefined;
    conditions?: {
        consentStatus: string[];
        dataCategory: string[];
        userSegment: string[];
        processingType: string[];
    } | null | undefined;
    enforcement?: {
        immediate: boolean;
        gracePeriodDays: number;
        notificationRequired: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ComplianceAuditModel: mongoose.Model<{
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    event: string;
    tenantId: string;
    category: "retention" | "transfer" | "consent" | "data_right" | "breach" | "security";
    action: string;
    dataCategories: string[];
    userId?: string | null | undefined;
    result?: "partial" | "success" | "failure" | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
    requestId?: string | null | undefined;
    legalBasis?: string | null | undefined;
    gdprArticle?: string | null | undefined;
    processedBy?: string | null | undefined;
    processingPurpose?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class PolicyService {
    /**
     * Check if processing is allowed
     */
    canProcess(params: {
        tenantId: string;
        userId: string;
        dataCategories: DataCategory[];
        purpose: string;
        processingType: string;
    }): Promise<{
        allowed: boolean;
        reason?: string;
        requiresConsent?: ConsentType[];
    }>;
    /**
     * Grant consent
     */
    grantConsent(params: {
        tenantId: string;
        userId: string;
        type: ConsentType;
        purpose: string;
        dataCategories: string[];
        ip?: string;
        userAgent?: string;
    }): Promise<Consent>;
    /**
     * Withdraw consent
     */
    withdrawConsent(params: {
        tenantId: string;
        userId: string;
        type: ConsentType;
    }): Promise<void>;
    /**
     * Check retention and trigger cleanup
     */
    checkRetention(tenantId: string, dataCategory: DataCategory): Promise<{
        action: 'delete' | 'anonymize' | 'restrict' | 'archive' | 'review';
        reason: string;
    }>;
    /**
     * Handle data right request
     */
    handleDataRightRequest(params: {
        tenantId: string;
        userId: string;
        type: DataRightType;
        description: string;
    }): Promise<DataRightRequest>;
    /**
     * Fulfill data right request (e.g., GDPR erasure)
     */
    fulfillDataRight(params: {
        tenantId: string;
        requestId: string;
        action: 'delete' | 'correction' | 'download' | 'restriction';
        data?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Get user consent summary
     */
    getConsentSummary(tenantId: string, userId: string): Promise<{
        total: number;
        granted: number;
        denied: number;
        pending: number;
        consents: Consent[];
    }>;
    /**
     * Log compliance audit
     */
    logAudit(params: {
        tenantId: string;
        userId?: string;
        event: string;
        category: string;
        dataCategories?: string[];
        action: string;
        result: 'success' | 'failure' | 'partial';
        legalBasis?: string;
        gdprArticle?: string;
        ip?: string;
        userAgent?: string;
        requestId?: string;
        processingPurpose?: string;
    }): Promise<void>;
    /**
     * Export audit logs (for compliance reporting)
     */
    exportAuditLogs(params: {
        tenantId: string;
        startDate: Date;
        endDate: Date;
        category?: string;
    }): Promise<ComplianceAudit[]>;
}
export declare const policyService: PolicyService;
//# sourceMappingURL=consentService.d.ts.map