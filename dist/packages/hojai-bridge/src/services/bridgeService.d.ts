import mongoose from 'mongoose';
import { TenantType, DataSensitivity, BridgeConfig, CrossAppIdentity, IntelligenceShare } from '../types/index.js';
export declare const BridgeConfigModel: mongoose.Model<{
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
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
    rezTenantId?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const CrossAppIdentityModel: mongoose.Model<{
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    rezUserId: string;
    rezUnifiedId?: string | null | undefined;
    appIds?: Map<string, string> | null | undefined;
    linkMethod?: "exact" | "manual" | "fuzzy" | "probabilistic" | null | undefined;
    linkConfidence?: number | null | undefined;
    lastActivity?: Map<string, string> | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const BridgeEventModel: mongoose.Model<{
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    source: "hojai" | "rez_ecosystem" | "rez_intelligence";
    tenantId: string;
    tenantType: TenantType;
    sourceService: string;
    routeTo: string[];
    routingStatus: "pending" | "failed" | "forwarded" | "filtered";
    sensitivity: DataSensitivity;
    piiFields: string[];
    error?: string | null | undefined;
    event?: string | null | undefined;
    sourceApp?: string | null | undefined;
    processedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const IntelligenceShareModel: mongoose.Model<{
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    source: string;
    type: string;
    tenantId: string;
    direction: "hojai_to_rez" | "rez_to_hojai";
    entityType: string;
    entityId: string;
    data?: Map<string, any> | null | undefined;
    model?: string | null | undefined;
    confidence?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AudienceSyncModel: mongoose.Model<{
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    audienceId: string;
    audienceName: string;
    audienceType: string;
    userCount: number;
    userSample: string[];
    syncEnabled: boolean;
    syncFrequency: "daily" | "weekly" | "realtime" | "hourly";
    syncStatus: "pending" | "failed" | "syncing" | "synced";
    lastSyncedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const PrivilegedAccessModel: mongoose.Model<{
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    tenantType: TenantType.REZ_ECOSYSTEM;
    accessScope?: {
        crossAppIdentity: boolean;
        behavioralSignals: boolean;
        mobilityPatterns: boolean;
        commerceHistory: boolean;
        loyaltyData: boolean;
        predictionModels: boolean;
    } | null | undefined;
    rezAccess?: {
        crossAppSegments: boolean;
        ecosystemTrends: boolean;
        unifiedProfiles: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class BridgeService {
    private redis;
    private readonly REZ_EVENT_BUS_URL;
    private readonly REZ_INTELLIGENCE_URL;
    private readonly REZ_IDENTITY_URL;
    private readonly INTERNAL_TOKEN;
    constructor();
    /**
     * Get bridge configuration for tenant
     */
    getBridgeConfig(tenantId: string): Promise<BridgeConfig | null>;
    /**
     * Configure bridge for tenant
     */
    configureBridge(config: Omit<BridgeConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BridgeConfig>;
    /**
     * Process and route event through bridge
     */
    processBridgeEvent(params: {
        tenantId: string;
        event: {
            type: string;
            category: string;
            data: Record<string, unknown>;
            timestamp: string;
        };
        sourceService: string;
        sourceApp?: string;
    }): Promise<{
        routed: boolean;
        routes: string[];
    }>;
    /**
     * Forward event to REZ Event Bus
     */
    private forwardToRez;
    /**
     * Subscribe to REZ events (for privileged tenants)
     */
    subscribeToRezEvents(tenantId: string, callback: (event: any) => Promise<void>): Promise<void>;
    /**
     * Link cross-app identity
     */
    linkCrossAppIdentity(params: {
        tenantId: string;
        hojaiUserId: string;
        rezUserId: string;
        appIds?: Record<string, string>;
    }): Promise<CrossAppIdentity>;
    /**
     * Get unified profile across apps (REZ-only)
     */
    getUnifiedProfile(params: {
        tenantId: string;
        entityId: string;
        entityType: 'user' | 'merchant';
    }): Promise<any | null>;
    /**
     * Share intelligence (prediction, segment, etc.)
     */
    shareIntelligence(params: {
        tenantId: string;
        type: string;
        direction: 'hojai_to_rez' | 'rez_to_hojai';
        entityType: string;
        entityId: string;
        data: Record<string, unknown>;
        confidence: number;
        source: string;
    }): Promise<IntelligenceShare>;
    private forwardIntelligenceToRez;
    /**
     * Sync audience segments
     */
    syncAudience(params: {
        tenantId: string;
        audienceId: string;
        users: string[];
        direction: 'hojai_to_rez' | 'rez_to_hojai';
    }): Promise<void>;
    /**
     * Get behavioral signals from REZ (privileged)
     */
    getBehavioralSignals(tenantId: string, userId: string): Promise<any | null>;
    /**
     * Get cross-app touchpoints for attribution
     */
    getCrossAppTouchpoints(tenantId: string, sessionId: string): Promise<any[]>;
    private determineSensitivity;
    private sanitizeForRez;
}
export declare const bridgeService: BridgeService;
//# sourceMappingURL=bridgeService.d.ts.map