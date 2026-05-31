"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridgeService = exports.BridgeService = exports.PrivilegedAccessModel = exports.AudienceSyncModel = exports.IntelligenceShareModel = exports.BridgeEventModel = exports.CrossAppIdentityModel = exports.BridgeConfigModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
// ============================================================================
// MODELS
// ============================================================================
const BridgeConfigSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    tenantType: { type: String, enum: Object.values(index_js_1.TenantType), required: true },
    rezEnabled: { type: Boolean, default: false },
    rezTenantId: String,
    crossAppDataEnabled: { type: Boolean, default: false },
    shareEventsToRez: { type: Boolean, default: false },
    receiveEventsFromRez: { type: Boolean, default: false },
    sharePredictions: { type: Boolean, default: false },
    shareBehavioralSignals: { type: Boolean, default: false },
    shareAudienceSegments: { type: Boolean, default: false },
    shareTrustScores: { type: Boolean, default: false },
    receiveTrustScores: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
}, { timestamps: true });
const CrossAppIdentitySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    rezUserId: { type: String, required: true },
    rezUnifiedId: String,
    appIds: { type: Map, of: String },
    linkMethod: { type: String, enum: ['exact', 'fuzzy', 'probabilistic', 'manual'] },
    linkConfidence: { type: Number, min: 0, max: 1 },
    lastActivity: { type: Map, of: String }
}, { timestamps: true });
CrossAppIdentitySchema.index({ tenantId: 1, rezUserId: 1 }, { unique: true });
const BridgeEventSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    tenantType: { type: String, enum: Object.values(index_js_1.TenantType), required: true },
    source: { type: String, enum: ['hojai', 'rez_intelligence', 'rez_ecosystem'], required: true },
    sourceService: { type: String, required: true },
    sourceApp: String,
    event: {
        type: String,
        category: String,
        data: { type: Map, of: mongoose_1.Schema.Types.Mixed },
        timestamp: String
    },
    routeTo: [String],
    routingStatus: { type: String, enum: ['pending', 'forwarded', 'filtered', 'failed'], default: 'pending' },
    sensitivity: { type: String, enum: Object.values(index_js_1.DataSensitivity), default: index_js_1.DataSensitivity.INTERNAL },
    piiFields: [String],
    processedAt: Date,
    error: String
}, { timestamps: true });
BridgeEventSchema.index({ tenantId: 1, routingStatus: 1 });
BridgeEventSchema.index({ tenantId: 1, source: 1, createdAt: -1 });
const IntelligenceShareSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    direction: { type: String, enum: ['hojai_to_rez', 'rez_to_hojai'], required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    data: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    source: { type: String, required: true },
    model: String
}, { timestamps: true });
IntelligenceShareSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
const AudienceSyncSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    audienceId: { type: String, required: true },
    audienceName: { type: String, required: true },
    audienceType: { type: String, required: true },
    userCount: { type: Number, default: 0 },
    userSample: [String],
    syncEnabled: { type: Boolean, default: false },
    syncFrequency: { type: String, enum: ['realtime', 'hourly', 'daily', 'weekly'], default: 'daily' },
    lastSyncedAt: Date,
    syncStatus: { type: String, enum: ['pending', 'syncing', 'synced', 'failed'], default: 'pending' }
}, { timestamps: true });
const PrivilegedAccessSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, unique: true },
    tenantType: { type: String, enum: [index_js_1.TenantType.REZ_ECOSYSTEM], required: true },
    accessScope: {
        crossAppIdentity: { type: Boolean, default: true },
        behavioralSignals: { type: Boolean, default: true },
        mobilityPatterns: { type: Boolean, default: true },
        commerceHistory: { type: Boolean, default: true },
        loyaltyData: { type: Boolean, default: true },
        predictionModels: { type: Boolean, default: true }
    },
    rezAccess: {
        crossAppSegments: { type: Boolean, default: true },
        ecosystemTrends: { type: Boolean, default: true },
        unifiedProfiles: { type: Boolean, default: true }
    },
    active: { type: Boolean, default: true }
}, { timestamps: true });
exports.BridgeConfigModel = mongoose_1.default.model('BridgeConfig', BridgeConfigSchema);
exports.CrossAppIdentityModel = mongoose_1.default.model('CrossAppIdentity', CrossAppIdentitySchema);
exports.BridgeEventModel = mongoose_1.default.model('BridgeEvent', BridgeEventSchema);
exports.IntelligenceShareModel = mongoose_1.default.model('IntelligenceShare', IntelligenceShareSchema);
exports.AudienceSyncModel = mongoose_1.default.model('AudienceSync', AudienceSyncSchema);
exports.PrivilegedAccessModel = mongoose_1.default.model('PrivilegedAccess', PrivilegedAccessSchema);
// ============================================================================
// BRIDGE SERVICE
// ============================================================================
class BridgeService {
    redis;
    // REZ endpoints
    REZ_EVENT_BUS_URL = process.env.REZ_EVENT_BUS_URL || 'http://localhost:4025';
    REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';
    REZ_IDENTITY_URL = process.env.REZ_IDENTITY_URL || 'http://localhost:4060';
    INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    /**
     * Get bridge configuration for tenant
     */
    async getBridgeConfig(tenantId) {
        const config = await exports.BridgeConfigModel.findOne({ tenantId, active: true });
        return config ? config.toObject() : null;
    }
    /**
     * Configure bridge for tenant
     */
    async configureBridge(config) {
        const doc = await exports.BridgeConfigModel.findOneAndUpdate({ tenantId: config.tenantId }, config, { upsert: true, new: true });
        return doc.toObject();
    }
    /**
     * Process and route event through bridge
     */
    async processBridgeEvent(params) {
        const { tenantId, event, sourceService, sourceApp } = params;
        // Get bridge config
        const config = await this.getBridgeConfig(tenantId);
        if (!config) {
            return { routed: false, routes: [] };
        }
        const routes = [];
        const tenantType = config.tenantType;
        // Determine sensitivity
        const sensitivity = this.determineSensitivity(event);
        // Create bridge event record
        const bridgeEvent = new exports.BridgeEventModel({
            tenantId,
            tenantType,
            source: 'hojai',
            sourceService,
            sourceApp,
            event,
            sensitivity,
            routingStatus: 'pending'
        });
        // Route based on config and tenant type
        if (tenantType === index_js_1.TenantType.REZ_ECOSYSTEM || tenantType === index_js_1.TenantType.RABTUL_SAAS) {
            // Privileged tenants - full bidirectional sharing
            if (config.shareEventsToRez) {
                await this.forwardToRez(event, sourceService, sourceApp);
                routes.push('rez_intelligence');
            }
            routes.push('hojai'); // Always process locally
        }
        else {
            // External tenants - only local processing
            routes.push('hojai');
        }
        // Update bridge event
        bridgeEvent.routeTo = routes;
        bridgeEvent.routingStatus = 'forwarded';
        bridgeEvent.processedAt = new Date();
        await bridgeEvent.save();
        return { routed: routes.length > 1, routes };
    }
    /**
     * Forward event to REZ Event Bus
     */
    async forwardToRez(event, sourceService, sourceApp) {
        try {
            await axios_1.default.post(`${this.REZ_EVENT_BUS_URL}/api/events`, {
                type: event.type,
                category: event.category,
                userId: event.data?.userId,
                source: sourceService,
                sourceApp: sourceApp || 'hojai',
                data: this.sanitizeForRez(event.data),
                timestamp: event.timestamp
            }, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Source': 'hojai',
                    'Content-Type': 'application/json'
                }
            });
        }
        catch (error) {
            console.error('[Bridge] Failed to forward to REZ:', error);
            throw error;
        }
    }
    /**
     * Subscribe to REZ events (for privileged tenants)
     */
    async subscribeToRezEvents(tenantId, callback) {
        // In production, this would connect to REZ Event Bus subscription
        // For now, we'll poll or use WebSocket
        console.log(`[Bridge] ${tenantId} subscribed to REZ events`);
    }
    /**
     * Link cross-app identity
     */
    async linkCrossAppIdentity(params) {
        const { tenantId, hojaiUserId, rezUserId, appIds } = params;
        const identity = await exports.CrossAppIdentityModel.findOneAndUpdate({ tenantId, rezUserId }, {
            tenantId,
            rezUserId,
            appIds: { ...appIds, 'hojai': hojaiUserId },
            linkMethod: 'manual',
            linkConfidence: 1.0,
            lastActivity: { 'hojai': new Date().toISOString() }
        }, { upsert: true, new: true });
        return identity.toObject();
    }
    /**
     * Get unified profile across apps (REZ-only)
     */
    async getUnifiedProfile(params) {
        const { tenantId, entityId, entityType } = params;
        // Check if tenant has privileged access
        const privileged = await exports.PrivilegedAccessModel.findOne({ tenantId, active: true });
        if (!privileged) {
            throw new Error('Privileged access required for unified profiles');
        }
        try {
            // Fetch from REZ Unified Identity
            const response = await axios_1.default.get(`${this.REZ_IDENTITY_URL}/api/unified/${entityType}/${entityId}`, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Tenant-ID': tenantId
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('[Bridge] Failed to get unified profile:', error);
            return null;
        }
    }
    /**
     * Share intelligence (prediction, segment, etc.)
     */
    async shareIntelligence(params) {
        const share = await exports.IntelligenceShareModel.create({
            tenantId: params.tenantId,
            ...params,
            id: (0, uuid_1.v4)()
        });
        // If sharing to REZ, forward
        if (params.direction === 'hojai_to_rez') {
            await this.forwardIntelligenceToRez(params);
        }
        return share.toObject();
    }
    async forwardIntelligenceToRez(params) {
        try {
            await axios_1.default.post(`${this.REZ_INTELLIGENCE_URL}/api/intelligence/share`, {
                type: params.type,
                entityType: params.entityType,
                entityId: params.entityId,
                data: params.data,
                confidence: params.confidence,
                source: `hojai:${params.source}`
            }, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Source': 'hojai'
                }
            });
        }
        catch (error) {
            console.error('[Bridge] Failed to share intelligence:', error);
        }
    }
    /**
     * Sync audience segments
     */
    async syncAudience(params) {
        const { tenantId, audienceId, users, direction } = params;
        if (direction === 'hojai_to_rez') {
            await axios_1.default.post(`${this.REZ_INTELLIGENCE_URL}/api/audiences/${audienceId}/sync`, { users }, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Source': 'hojai'
                }
            });
        }
    }
    /**
     * Get behavioral signals from REZ (privileged)
     */
    async getBehavioralSignals(tenantId, userId) {
        const privileged = await exports.PrivilegedAccessModel.findOne({ tenantId, active: true });
        if (!privileged?.accessScope.behavioralSignals) {
            return null;
        }
        try {
            const response = await axios_1.default.get(`${this.REZ_INTELLIGENCE_URL}/api/signals/user/${userId}`, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Tenant-ID': tenantId
                }
            });
            return response.data;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get cross-app touchpoints for attribution
     */
    async getCrossAppTouchpoints(tenantId, sessionId) {
        const privileged = await exports.PrivilegedAccessModel.findOne({ tenantId, active: true });
        if (!privileged) {
            return [];
        }
        try {
            const response = await axios_1.default.get(`${this.REZ_INTELLIGENCE_URL}/api/attribution/touchpoints/${sessionId}`, {
                headers: {
                    'X-Internal-Token': this.INTERNAL_TOKEN,
                    'X-Tenant-ID': tenantId
                }
            });
            return response.data.touchpoints || [];
        }
        catch (error) {
            return [];
        }
    }
    // Helper methods
    determineSensitivity(event) {
        const piiFields = ['email', 'phone', 'name', 'address', 'location', 'ip'];
        const eventData = event.data || {};
        const foundPii = piiFields.filter(field => eventData[field]);
        if (foundPii.length > 0) {
            return index_js_1.DataSensitivity.CONFIDENTIAL;
        }
        return index_js_1.DataSensitivity.INTERNAL;
    }
    sanitizeForRez(data) {
        // Remove sensitive fields before sharing to REZ
        const sanitized = { ...data };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        delete sanitized.apiKey;
        return sanitized;
    }
}
exports.BridgeService = BridgeService;
exports.bridgeService = new BridgeService();
