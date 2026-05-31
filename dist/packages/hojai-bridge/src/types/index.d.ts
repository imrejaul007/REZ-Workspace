import { z } from 'zod';
export declare enum TenantType {
    REZ_ECOSYSTEM = "rez_ecosystem",
    RABTUL_SAAS = "rabtul_saas",
    EXTERNAL = "external"
}
export declare enum DataSensitivity {
    PUBLIC = "public",
    INTERNAL = "internal",
    CONFIDENTIAL = "confidential",
    RESTRICTED = "restricted"
}
export declare const BridgeConfigSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    tenantType: z.ZodNativeEnum<typeof TenantType>;
    rezEnabled: z.ZodDefault<z.ZodBoolean>;
    rezTenantId: z.ZodOptional<z.ZodString>;
    crossAppDataEnabled: z.ZodDefault<z.ZodBoolean>;
    shareEventsToRez: z.ZodDefault<z.ZodBoolean>;
    receiveEventsFromRez: z.ZodDefault<z.ZodBoolean>;
    sharePredictions: z.ZodDefault<z.ZodBoolean>;
    shareBehavioralSignals: z.ZodDefault<z.ZodBoolean>;
    shareAudienceSegments: z.ZodDefault<z.ZodBoolean>;
    shareTrustScores: z.ZodDefault<z.ZodBoolean>;
    receiveTrustScores: z.ZodDefault<z.ZodBoolean>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    active: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    tenantType: TenantType;
    rezEnabled: boolean;
    crossAppDataEnabled: boolean;
    shareEventsToRez: boolean;
    receiveEventsFromRez: boolean;
    sharePredictions: boolean;
    shareBehavioralSignals: boolean;
    shareAudienceSegments: boolean;
    shareTrustScores: boolean;
    receiveTrustScores: boolean;
    rezTenantId?: string | undefined;
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    tenantType: TenantType;
    active?: boolean | undefined;
    rezEnabled?: boolean | undefined;
    rezTenantId?: string | undefined;
    crossAppDataEnabled?: boolean | undefined;
    shareEventsToRez?: boolean | undefined;
    receiveEventsFromRez?: boolean | undefined;
    sharePredictions?: boolean | undefined;
    shareBehavioralSignals?: boolean | undefined;
    shareAudienceSegments?: boolean | undefined;
    shareTrustScores?: boolean | undefined;
    receiveTrustScores?: boolean | undefined;
}>;
export type BridgeConfig = z.infer<typeof BridgeConfigSchema>;
export declare const CrossAppIdentitySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    rezUserId: z.ZodString;
    rezUnifiedId: z.ZodOptional<z.ZodString>;
    appIds: z.ZodRecord<z.ZodString, z.ZodString>;
    linkMethod: z.ZodEnum<["exact", "fuzzy", "probabilistic", "manual"]>;
    linkConfidence: z.ZodNumber;
    lastActivity: z.ZodRecord<z.ZodString, z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    rezUserId: string;
    appIds: Record<string, string>;
    linkMethod: "manual" | "exact" | "probabilistic" | "fuzzy";
    linkConfidence: number;
    lastActivity: Record<string, string>;
    rezUnifiedId?: string | undefined;
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    rezUserId: string;
    appIds: Record<string, string>;
    linkMethod: "manual" | "exact" | "probabilistic" | "fuzzy";
    linkConfidence: number;
    lastActivity: Record<string, string>;
    rezUnifiedId?: string | undefined;
}>;
export type CrossAppIdentity = z.infer<typeof CrossAppIdentitySchema>;
export declare const BridgeEventSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    tenantType: z.ZodNativeEnum<typeof TenantType>;
    source: z.ZodEnum<["hojai", "rez_intelligence", "rez_ecosystem"]>;
    sourceService: z.ZodString;
    sourceApp: z.ZodOptional<z.ZodString>;
    event: z.ZodObject<{
        type: z.ZodString;
        category: z.ZodString;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        data: Record<string, any>;
        category: string;
        timestamp: string;
    }, {
        type: string;
        data: Record<string, any>;
        category: string;
        timestamp: string;
    }>;
    routeTo: z.ZodArray<z.ZodEnum<["hojai", "rez_intelligence", "rez_ecosystem"]>, "many">;
    routingStatus: z.ZodEnum<["pending", "forwarded", "filtered", "failed"]>;
    sensitivity: z.ZodNativeEnum<typeof DataSensitivity>;
    piiFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    processedAt: z.ZodOptional<z.ZodDate>;
    error: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    event: {
        type: string;
        data: Record<string, any>;
        category: string;
        timestamp: string;
    };
    tenantId: string;
    createdAt: Date;
    source: "rez_ecosystem" | "hojai" | "rez_intelligence";
    tenantType: TenantType;
    sourceService: string;
    routeTo: ("rez_ecosystem" | "hojai" | "rez_intelligence")[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    error?: string | undefined;
    sourceApp?: string | undefined;
    piiFields?: string[] | undefined;
    processedAt?: Date | undefined;
}, {
    id: string;
    event: {
        type: string;
        data: Record<string, any>;
        category: string;
        timestamp: string;
    };
    tenantId: string;
    createdAt: Date;
    source: "rez_ecosystem" | "hojai" | "rez_intelligence";
    tenantType: TenantType;
    sourceService: string;
    routeTo: ("rez_ecosystem" | "hojai" | "rez_intelligence")[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    error?: string | undefined;
    sourceApp?: string | undefined;
    piiFields?: string[] | undefined;
    processedAt?: Date | undefined;
}>;
export type BridgeEvent = z.infer<typeof BridgeEventSchema>;
export declare const IntelligenceShareSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodEnum<["prediction", "segment", "behavioral_signal", "trust_score", "intent", "churn_risk", "ltv_score", "audience"]>;
    direction: z.ZodEnum<["hojai_to_rez", "rez_to_hojai"]>;
    entityType: z.ZodString;
    entityId: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    confidence: z.ZodNumber;
    source: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "segment" | "intent" | "churn_risk" | "prediction" | "audience" | "behavioral_signal" | "trust_score" | "ltv_score";
    data: Record<string, any>;
    tenantId: string;
    confidence: number;
    createdAt: Date;
    source: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    model?: string | undefined;
}, {
    id: string;
    type: "segment" | "intent" | "churn_risk" | "prediction" | "audience" | "behavioral_signal" | "trust_score" | "ltv_score";
    data: Record<string, any>;
    tenantId: string;
    confidence: number;
    createdAt: Date;
    source: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    model?: string | undefined;
}>;
export type IntelligenceShare = z.infer<typeof IntelligenceShareSchema>;
export declare const AudienceSyncSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    audienceId: z.ZodString;
    audienceName: z.ZodString;
    audienceType: z.ZodEnum<["behavioral", "demographic", "predictive", "rfm"]>;
    userCount: z.ZodNumber;
    userSample: z.ZodArray<z.ZodString, "many">;
    syncEnabled: z.ZodDefault<z.ZodBoolean>;
    syncFrequency: z.ZodEnum<["realtime", "hourly", "daily", "weekly"]>;
    lastSyncedAt: z.ZodOptional<z.ZodDate>;
    syncStatus: z.ZodEnum<["pending", "syncing", "synced", "failed"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    audienceId: string;
    audienceName: string;
    audienceType: "behavioral" | "demographic" | "predictive" | "rfm";
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    audienceId: string;
    audienceName: string;
    audienceType: "behavioral" | "demographic" | "predictive" | "rfm";
    userCount: number;
    userSample: string[];
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    syncEnabled?: boolean | undefined;
    lastSyncedAt?: Date | undefined;
}>;
export type AudienceSync = z.infer<typeof AudienceSyncSchema>;
export declare const CrossAppAttributionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    touchpoints: z.ZodArray<z.ZodObject<{
        app: z.ZodString;
        event: z.ZodString;
        timestamp: z.ZodString;
        channel: z.ZodOptional<z.ZodString>;
        campaign: z.ZodOptional<z.ZodString>;
        conversionValue: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        event: string;
        timestamp: string;
        app: string;
        channel?: string | undefined;
        campaign?: string | undefined;
        conversionValue?: number | undefined;
    }, {
        event: string;
        timestamp: string;
        app: string;
        channel?: string | undefined;
        campaign?: string | undefined;
        conversionValue?: number | undefined;
    }>, "many">;
    model: z.ZodEnum<["first_touch", "last_touch", "linear", "time_decay", "position_based"]>;
    attributedApp: z.ZodString;
    attributedChannel: z.ZodOptional<z.ZodString>;
    attributedConversion: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    createdAt: Date;
    model: "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";
    sessionId: string;
    touchpoints: {
        event: string;
        timestamp: string;
        app: string;
        channel?: string | undefined;
        campaign?: string | undefined;
        conversionValue?: number | undefined;
    }[];
    attributedApp: string;
    attributedChannel?: string | undefined;
    attributedConversion?: number | undefined;
}, {
    id: string;
    userId: string;
    createdAt: Date;
    model: "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";
    sessionId: string;
    touchpoints: {
        event: string;
        timestamp: string;
        app: string;
        channel?: string | undefined;
        campaign?: string | undefined;
        conversionValue?: number | undefined;
    }[];
    attributedApp: string;
    attributedChannel?: string | undefined;
    attributedConversion?: number | undefined;
}>;
export type CrossAppAttribution = z.infer<typeof CrossAppAttributionSchema>;
export declare const PrivilegedAccessSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    tenantType: z.ZodEnum<[TenantType.REZ_ECOSYSTEM]>;
    accessScope: z.ZodObject<{
        crossAppIdentity: z.ZodDefault<z.ZodBoolean>;
        behavioralSignals: z.ZodDefault<z.ZodBoolean>;
        mobilityPatterns: z.ZodDefault<z.ZodBoolean>;
        commerceHistory: z.ZodDefault<z.ZodBoolean>;
        loyaltyData: z.ZodDefault<z.ZodBoolean>;
        predictionModels: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    }, {
        crossAppIdentity?: boolean | undefined;
        behavioralSignals?: boolean | undefined;
        mobilityPatterns?: boolean | undefined;
        commerceHistory?: boolean | undefined;
        loyaltyData?: boolean | undefined;
        predictionModels?: boolean | undefined;
    }>;
    rezAccess: z.ZodObject<{
        crossAppSegments: z.ZodDefault<z.ZodBoolean>;
        ecosystemTrends: z.ZodDefault<z.ZodBoolean>;
        unifiedProfiles: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    }, {
        crossAppSegments?: boolean | undefined;
        ecosystemTrends?: boolean | undefined;
        unifiedProfiles?: boolean | undefined;
    }>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    active: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    };
    rezAccess: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    };
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope: {
        crossAppIdentity?: boolean | undefined;
        behavioralSignals?: boolean | undefined;
        mobilityPatterns?: boolean | undefined;
        commerceHistory?: boolean | undefined;
        loyaltyData?: boolean | undefined;
        predictionModels?: boolean | undefined;
    };
    rezAccess: {
        crossAppSegments?: boolean | undefined;
        ecosystemTrends?: boolean | undefined;
        unifiedProfiles?: boolean | undefined;
    };
    active?: boolean | undefined;
}>;
export type PrivilegedAccess = z.infer<typeof PrivilegedAccessSchema>;
//# sourceMappingURL=index.d.ts.map