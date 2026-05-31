"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivilegedAccessSchema = exports.CrossAppAttributionSchema = exports.AudienceSyncSchema = exports.IntelligenceShareSchema = exports.BridgeEventSchema = exports.CrossAppIdentitySchema = exports.BridgeConfigSchema = exports.DataSensitivity = exports.TenantType = void 0;
const zod_1 = require("zod");
// ============================================================================
// BRIDGE TYPES
// ============================================================================
var TenantType;
(function (TenantType) {
    TenantType["REZ_ECOSYSTEM"] = "rez_ecosystem";
    TenantType["RABTUL_SAAS"] = "rabtul_saas";
    TenantType["EXTERNAL"] = "external";
})(TenantType || (exports.TenantType = TenantType = {}));
var DataSensitivity;
(function (DataSensitivity) {
    DataSensitivity["PUBLIC"] = "public";
    DataSensitivity["INTERNAL"] = "internal";
    DataSensitivity["CONFIDENTIAL"] = "confidential";
    DataSensitivity["RESTRICTED"] = "restricted";
})(DataSensitivity || (exports.DataSensitivity = DataSensitivity = {}));
exports.BridgeConfigSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    tenantType: zod_1.z.nativeEnum(TenantType),
    // REZ Ecosystem connection
    rezEnabled: zod_1.z.boolean().default(false),
    rezTenantId: zod_1.z.string().optional(),
    crossAppDataEnabled: zod_1.z.boolean().default(false),
    // Data sharing
    shareEventsToRez: zod_1.z.boolean().default(false),
    receiveEventsFromRez: zod_1.z.boolean().default(false),
    // Intelligence sharing
    sharePredictions: zod_1.z.boolean().default(false),
    shareBehavioralSignals: zod_1.z.boolean().default(false),
    shareAudienceSegments: zod_1.z.boolean().default(false),
    // Trust graph
    shareTrustScores: zod_1.z.boolean().default(false),
    receiveTrustScores: zod_1.z.boolean().default(false),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// CROSS-APP IDENTITY
// ============================================================================
exports.CrossAppIdentitySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // REZ unified ID
    rezUserId: zod_1.z.string(),
    rezUnifiedId: zod_1.z.string().optional(),
    // App-specific IDs
    appIds: zod_1.z.record(zod_1.z.string()), // e.g., { 'rez-app': 'user_123', 'rez-ride': 'driver_456' }
    // Link metadata
    linkMethod: zod_1.z.enum(['exact', 'fuzzy', 'probabilistic', 'manual']),
    linkConfidence: zod_1.z.number().min(0).max(1),
    // Last activity across apps
    lastActivity: zod_1.z.record(zod_1.z.string()), // e.g., { 'rez-app': '2026-05-27', 'rez-ride': '2026-05-26' }
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// BRIDGE EVENT
// ============================================================================
exports.BridgeEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    tenantType: zod_1.z.nativeEnum(TenantType),
    // Source
    source: zod_1.z.enum(['hojai', 'rez_intelligence', 'rez_ecosystem']),
    sourceService: zod_1.z.string(),
    sourceApp: zod_1.z.string().optional(),
    // Event data
    event: zod_1.z.object({
        type: zod_1.z.string(),
        category: zod_1.z.string(),
        data: zod_1.z.record(zod_1.z.any()),
        timestamp: zod_1.z.string()
    }),
    // Routing
    routeTo: zod_1.z.array(zod_1.z.enum(['hojai', 'rez_intelligence', 'rez_ecosystem'])),
    routingStatus: zod_1.z.enum(['pending', 'forwarded', 'filtered', 'failed']),
    // Privacy
    sensitivity: zod_1.z.nativeEnum(DataSensitivity),
    piiFields: zod_1.z.array(zod_1.z.string()).optional(),
    // Processing
    processedAt: zod_1.z.date().optional(),
    error: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// INTELLIGENCE SHARING
// ============================================================================
exports.IntelligenceShareSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Type of intelligence
    type: zod_1.z.enum([
        'prediction',
        'segment',
        'behavioral_signal',
        'trust_score',
        'intent',
        'churn_risk',
        'ltv_score',
        'audience'
    ]),
    // Direction
    direction: zod_1.z.enum(['hojai_to_rez', 'rez_to_hojai']),
    // Data
    entityType: zod_1.z.string(), // 'user', 'merchant', 'product'
    entityId: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.any()),
    // Metadata
    confidence: zod_1.z.number().min(0).max(1),
    source: zod_1.z.string(),
    model: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// AUDIENCE SYNC
// ============================================================================
exports.AudienceSyncSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Audience
    audienceId: zod_1.z.string(),
    audienceName: zod_1.z.string(),
    audienceType: zod_1.z.enum(['behavioral', 'demographic', 'predictive', 'rfm']),
    // Users in audience
    userCount: zod_1.z.number(),
    userSample: zod_1.z.array(zod_1.z.string()).max(100),
    // Sync settings
    syncEnabled: zod_1.z.boolean().default(false),
    syncFrequency: zod_1.z.enum(['realtime', 'hourly', 'daily', 'weekly']),
    // Last sync
    lastSyncedAt: zod_1.z.date().optional(),
    syncStatus: zod_1.z.enum(['pending', 'syncing', 'synced', 'failed']),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// CROSS-APP ATTRIBUTION
// ============================================================================
exports.CrossAppAttributionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    // User journey
    userId: zod_1.z.string(),
    sessionId: zod_1.z.string(),
    // Touchpoints across apps
    touchpoints: zod_1.z.array(zod_1.z.object({
        app: zod_1.z.string(),
        event: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        channel: zod_1.z.string().optional(),
        campaign: zod_1.z.string().optional(),
        conversionValue: zod_1.z.number().optional()
    })),
    // Attribution model
    model: zod_1.z.enum(['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based']),
    // Results
    attributedApp: zod_1.z.string(),
    attributedChannel: zod_1.z.string().optional(),
    attributedConversion: zod_1.z.number().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// PRIVILEGED ACCESS (REZ-ONLY)
// ============================================================================
exports.PrivilegedAccessSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    tenantType: zod_1.z.enum([TenantType.REZ_ECOSYSTEM]),
    // What REZ can access
    accessScope: zod_1.z.object({
        crossAppIdentity: zod_1.z.boolean().default(true),
        behavioralSignals: zod_1.z.boolean().default(true),
        mobilityPatterns: zod_1.z.boolean().default(true),
        commerceHistory: zod_1.z.boolean().default(true),
        loyaltyData: zod_1.z.boolean().default(true),
        predictionModels: zod_1.z.boolean().default(true)
    }),
    // What tenant can access from REZ
    rezAccess: zod_1.z.object({
        crossAppSegments: zod_1.z.boolean().default(true),
        ecosystemTrends: zod_1.z.boolean().default(true),
        unifiedProfiles: zod_1.z.boolean().default(true)
    }),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
