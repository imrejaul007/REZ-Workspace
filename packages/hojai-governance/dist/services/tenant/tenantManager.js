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
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantManager = exports.TenantManager = exports.TenantModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../../types/index.js");
const DEFAULT_FEATURES = {
    eventIngestion: true,
    memoryStorage: true,
    vectorSearch: true,
    workflowRuntime: true,
    agentRuntime: false,
    whatsappAI: false,
    hyperlocal: false,
    privilegedGraph: false
};
const DEFAULT_QUOTAS = {
    [index_js_1.TenantTier.FREE]: {
        eventsPerMonth: 10000,
        memoryStorageMB: 100,
        apiCallsPerDay: 1000,
        workflows: 5,
        agents: 0,
        users: 3
    },
    [index_js_1.TenantTier.STARTER]: {
        eventsPerMonth: 100000,
        memoryStorageMB: 1024,
        apiCallsPerDay: 10000,
        workflows: 25,
        agents: 2,
        users: 10
    },
    [index_js_1.TenantTier.PROFESSIONAL]: {
        eventsPerMonth: 1000000,
        memoryStorageMB: 10240,
        apiCallsPerDay: 100000,
        workflows: 100,
        agents: 10,
        users: 50
    },
    [index_js_1.TenantTier.ENTERPRISE]: {
        eventsPerMonth: 10000000,
        memoryStorageMB: 102400,
        apiCallsPerDay: 1000000,
        workflows: -1, // unlimited
        agents: -1,
        users: -1
    },
    [index_js_1.TenantTier.PRIVILEGED]: {
        eventsPerMonth: -1,
        memoryStorageMB: -1,
        apiCallsPerDay: -1,
        workflows: -1,
        agents: -1,
        users: -1
    }
};
const TenantSchema = new mongoose_1.Schema({
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    type: {
        type: String,
        enum: Object.values(index_js_1.TenantType),
        required: true
    },
    tier: {
        type: String,
        enum: Object.values(index_js_1.TenantTier),
        default: index_js_1.TenantTier.FREE
    },
    status: {
        type: String,
        enum: Object.values(index_js_1.TenantStatus),
        default: index_js_1.TenantStatus.PENDING
    },
    namespace: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-z0-9-]+$/
    },
    features: {
        eventIngestion: { type: Boolean, default: true },
        memoryStorage: { type: Boolean, default: true },
        vectorSearch: { type: Boolean, default: true },
        workflowRuntime: { type: Boolean, default: true },
        agentRuntime: { type: Boolean, default: false },
        whatsappAI: { type: Boolean, default: false },
        hyperlocal: { type: Boolean, default: false },
        privilegedGraph: { type: Boolean, default: false }
    },
    quotas: {
        eventsPerMonth: { type: Number, default: 10000 },
        memoryStorageMB: { type: Number, default: 100 },
        apiCallsPerDay: { type: Number, default: 1000 },
        workflows: { type: Number, default: 5 },
        agents: { type: Number, default: 0 },
        users: { type: Number, default: 3 }
    },
    isolation: {
        databaseNamespace: { type: String, required: true },
        redisNamespace: { type: String, required: true },
        vectorNamespace: { type: String, required: true },
        eventNamespace: { type: String, required: true },
        encryptAtRest: { type: Boolean, default: true },
        encryptInTransit: { type: Boolean, default: true }
    }
}, {
    timestamps: true,
    collection: 'tenants'
});
// Indexes
TenantSchema.index({ type: 1, status: 1 });
TenantSchema.index({ namespace: 1 }, { unique: true });
// Virtual for checking if tenant is active
TenantSchema.virtual('isActive').get(function () {
    return this.status === index_js_1.TenantStatus.ACTIVE;
});
// Method to check if a feature is enabled
TenantSchema.methods.hasFeature = function (feature) {
    if (this.type === index_js_1.TenantType.REZ_ECOSYSTEM)
        return true; // REZ has all features
    return this.features[feature] ?? false;
};
// Method to check quota
TenantSchema.methods.checkQuota = function (metric, value) {
    const limit = this.quotas[metric];
    if (limit === -1)
        return { allowed: true, current: value, limit: -1 };
    return {
        allowed: value <= limit,
        current: value,
        limit
    };
};
// Method to apply tier quotas
TenantSchema.methods.applyTierQuotas = function () {
    const quotas = DEFAULT_QUOTAS[this.tier];
    if (quotas) {
        this.quotas = quotas;
    }
};
// Static method to create a new tenant
TenantSchema.statics.createTenant = async function (data) {
    const id = (0, uuid_1.v4)();
    const namespace = data.namespace ?? `${data.type.toLowerCase()}-${id.slice(0, 8)}`;
    const isolation = {
        databaseNamespace: `tenant_${namespace}`,
        redisNamespace: `tenant:${namespace}`,
        vectorNamespace: `tenant_${namespace}`,
        eventNamespace: `tenant:${namespace}`,
        encryptAtRest: true,
        encryptInTransit: true
    };
    const tenant = new this({
        ...data,
        id,
        namespace,
        isolation,
        features: data.type === index_js_1.TenantType.REZ_ECOSYSTEM
            ? { ...DEFAULT_FEATURES, privilegedGraph: true }
            : DEFAULT_FEATURES
    });
    tenant.applyTierQuotas();
    await tenant.save();
    return tenant;
};
// Static method to find by namespace
TenantSchema.statics.findByNamespace = function (namespace) {
    return this.findOne({ namespace });
};
// Static method to find privileged tenant (REZ)
TenantSchema.statics.findPrivilegedTenant = function () {
    return this.findOne({ type: index_js_1.TenantType.REZ_ECOSYSTEM });
};
exports.TenantModel = mongoose_1.default.model('Tenant', TenantSchema);
// ============================================================================
// TENANT MANAGER SERVICE
// ============================================================================
class TenantManager {
    /**
     * Create a new tenant with proper isolation setup
     */
    async createTenant(params) {
        // Check namespace uniqueness
        if (params.namespace) {
            const existing = await exports.TenantModel.findByNamespace(params.namespace);
            if (existing) {
                throw new Error(`Namespace ${params.namespace} already exists`);
            }
        }
        const tenant = await exports.TenantModel.createTenant(params);
        // Set up isolated resources for the tenant
        await this.setupTenantResources(tenant);
        return tenant.toObject();
    }
    /**
     * Set up isolated resources for a tenant
     */
    async setupTenantResources(tenant) {
        // Database collections are namespace through collection prefix
        // Redis uses namespace prefix
        // Vector DB uses namespace prefix
        // This is handled by the respective platform services using tenant isolation middleware
        console.log(`[TenantManager] Resources set up for tenant: ${tenant.namespace}`);
    }
    /**
     * Get tenant by ID
     */
    async getTenant(tenantId) {
        const tenant = await exports.TenantModel.findById(tenantId);
        return tenant ? tenant.toObject() : null;
    }
    /**
     * Get tenant by namespace
     */
    async getTenantByNamespace(namespace) {
        const tenant = await exports.TenantModel.findByNamespace(namespace);
        return tenant ? tenant.toObject() : null;
    }
    /**
     * Update tenant
     */
    async updateTenant(tenantId, updates) {
        const tenant = await exports.TenantModel.findByIdAndUpdate(tenantId, { $set: updates }, { new: true });
        return tenant ? tenant.toObject() : null;
    }
    /**
     * Suspend a tenant
     */
    async suspendTenant(tenantId, reason) {
        const tenant = await exports.TenantModel.findByIdAndUpdate(tenantId, {
            $set: {
                status: index_js_1.TenantStatus.SUSPENDED,
                suspendedAt: new Date()
            }
        }, { new: true });
        if (tenant) {
            console.log(`[TenantManager] Tenant suspended: ${tenant.namespace}`, { reason });
        }
        return tenant ? tenant.toObject() : null;
    }
    /**
     * Activate a tenant
     */
    async activateTenant(tenantId) {
        const tenant = await exports.TenantModel.findByIdAndUpdate(tenantId, {
            $set: {
                status: index_js_1.TenantStatus.ACTIVE,
                activatedAt: new Date()
            }
        }, { new: true });
        return tenant ? tenant.toObject() : null;
    }
    /**
     * Update tenant tier and quotas
     */
    async updateTier(tenantId, tier) {
        const tenant = await exports.TenantModel.findById(tenantId);
        if (!tenant)
            return null;
        tenant.tier = tier;
        tenant.applyTierQuotas();
        await tenant.save();
        return tenant.toObject();
    }
    /**
     * Check and update quotas
     */
    async checkQuota(tenantId, metric, currentValue) {
        const tenant = await exports.TenantModel.findById(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        const result = tenant.checkQuota(metric, currentValue);
        return { allowed: result.allowed, limit: result.limit };
    }
    /**
     * List all tenants with filtering
     */
    async listTenants(params) {
        const filter = {};
        if (params?.type)
            filter.type = params.type;
        if (params?.status)
            filter.status = params.status;
        if (params?.tier)
            filter.tier = params.tier;
        const [tenants, total] = await Promise.all([
            exports.TenantModel.find(filter)
                .skip(params?.offset ?? 0)
                .limit(params?.limit ?? 50),
            exports.TenantModel.countDocuments(filter)
        ]);
        return { tenants: tenants.map(t => t.toObject()), total };
    }
    /**
     * Get tenant isolation configuration
     */
    getTenantIsolation(tenant) {
        return tenant.isolation;
    }
    /**
     * Build namespace prefixes for all resources
     */
    buildNamespaceMap(tenant) {
        const ns = tenant.isolation;
        return {
            database: ns.databaseNamespace,
            redis: ns.redisNamespace,
            vector: ns.vectorNamespace,
            events: ns.eventNamespace
        };
    }
}
exports.TenantManager = TenantManager;
exports.tenantManager = new TenantManager();
//# sourceMappingURL=tenantManager.js.map