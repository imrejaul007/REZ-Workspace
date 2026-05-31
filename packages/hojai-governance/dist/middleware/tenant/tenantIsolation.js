"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkQuota = exports.scopeRedisToTenant = exports.tenantIsolation = exports.TenantIsolation = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const tenantManager_js_1 = require("../../services/tenant/tenantManager.js");
const auditLogger_js_1 = require("../../services/audit/auditLogger.js");
const index_js_1 = require("../../types/index.js");
// Redis clients for namespace isolation
const redisClients = new Map();
/**
 * Get or create Redis client with tenant namespace
 */
function getRedisClient(namespace) {
    if (!redisClients.has(namespace)) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = new ioredis_1.default(redisUrl, {
            keyPrefix: `${namespace}:`,
            lazyConnect: true
        });
        redisClients.set(namespace, client);
    }
    return redisClients.get(namespace);
}
/**
 * Tenant Isolation Middleware
 * Ensures all data operations are scoped to the tenant's namespace
 */
class TenantIsolation {
    redis;
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
    }
    /**
     * Middleware to set up tenant context
     */
    setupTenantContext = async (req, res, next) => {
        try {
            if (!req.tenantId) {
                next();
                return;
            }
            const tenant = await tenantManager_js_1.TenantModel.findById(req.tenantId);
            if (!tenant) {
                res.status(404).json({
                    success: false,
                    error: 'Tenant not found'
                });
                return;
            }
            // Attach tenant isolation data to request
            req.app.locals.tenantContext = {
                tenantId: tenant.id,
                namespace: tenant.namespace,
                isolation: tenant.isolation,
                type: tenant.type,
                isPrivileged: tenant.type === index_js_1.TenantType.REZ_ECOSYSTEM
            };
            next();
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Build MongoDB collection name with tenant prefix
     */
    getTenantCollection(collectionName, tenant) {
        return `${tenant.isolation.databaseNamespace}_${collectionName}`;
    }
    /**
     * Build Redis key with tenant prefix
     */
    getTenantKey(tenant, key) {
        return `${tenant.isolation.redisNamespace}:${key}`;
    }
    /**
     * Build vector collection name with tenant prefix
     */
    getTenantVectorCollection(tenant, collectionName) {
        return `${tenant.isolation.vectorNamespace}_${collectionName}`;
    }
    /**
     * Build event namespace for the tenant
     */
    getTenantEventNamespace(tenant, eventType) {
        return `${tenant.isolation.eventNamespace}:${eventType}`;
    }
    /**
     * Verify tenant can access a specific resource
     */
    async verifyResourceAccess(params) {
        // Same tenant always has access
        if (params.tenantId === params.resourceTenantId) {
            return true;
        }
        // Check if requester is privileged (REZ ecosystem)
        const tenant = await tenantManager_js_1.TenantModel.findById(params.tenantId);
        if (tenant?.type === index_js_1.TenantType.REZ_ECOSYSTEM) {
            // Privileged tenants can access cross-tenant resources for specific actions
            const privilegedActions = ['admin', 'audit', 'export'];
            return privilegedActions.includes(params.action);
        }
        return false;
    }
    /**
     * Middleware to enforce tenant data boundaries
     */
    enforceTenantBoundary = async (req, res, next) => {
        try {
            const tenantContext = req.app.locals.tenantContext;
            if (!tenantContext) {
                next();
                return;
            }
            // Inject tenant isolation into request for downstream services
            req.app.locals.isolation = {
                databasePrefix: tenantContext.isolation.databaseNamespace,
                redisPrefix: tenantContext.isolation.redisNamespace,
                vectorPrefix: tenantContext.isolation.vectorNamespace,
                eventPrefix: tenantContext.isolation.eventNamespace,
                isPrivileged: tenantContext.isPrivileged
            };
            // Log resource access
            await auditLogger_js_1.auditLogger.logAsync({
                tenantId: tenantContext.tenantId,
                action: 'resource:accessed',
                resource: `${req.method} ${req.path}`,
                details: {
                    isolation: tenantContext.isolation
                },
                requestId: req.requestId,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            next();
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get tenant-scoped Redis client
     */
    async getTenantRedis(tenantId) {
        const tenant = await tenantManager_js_1.TenantModel.findById(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        return getRedisClient(tenant.isolation.redisNamespace);
    }
    /**
     * Check if a tenant has access to privileged features
     */
    async hasPrivilegedAccess(tenantId) {
        const tenant = await tenantManager_js_1.TenantModel.findById(tenantId);
        return tenant?.type === index_js_1.TenantType.REZ_ECOSYSTEM;
    }
    /**
     * Validate data isolation for a query
     */
    validateQueryIsolation(tenant, query) {
        // Ensure queries always include tenant ID filter
        return {
            ...query,
            tenantId: tenant.id
        };
    }
    /**
     * Sanitize response to remove cross-tenant data
     */
    sanitizeResponse(tenantId, data) {
        // Remove any data that doesn't belong to this tenant
        // This is a safety measure - actual filtering should happen at query level
        if (Array.isArray(data)) {
            return data.filter((item) => !item.tenantId || item.tenantId === tenantId);
        }
        if (data && typeof data === 'object' && 'tenantId' in data) {
            if (data.tenantId !== tenantId) {
                return null;
            }
        }
        return data;
    }
}
exports.TenantIsolation = TenantIsolation;
exports.tenantIsolation = new TenantIsolation();
/**
 * Express middleware to automatically scope Redis operations to tenant
 */
const scopeRedisToTenant = (tenantId, isolation) => {
    return (originalMethod) => {
        return async function (...args) {
            // Modify Redis key arguments to include tenant prefix
            if (args[0] && typeof args[0] === 'string') {
                args[0] = `${isolation.redisNamespace}:${args[0]}`;
            }
            return originalMethod.apply(this, args);
        };
    };
};
exports.scopeRedisToTenant = scopeRedisToTenant;
/**
 * Middleware to check quota before operations
 */
const checkQuota = (metric) => {
    return async (req, res, next) => {
        try {
            if (!req.tenantId) {
                next();
                return;
            }
            const tenant = await tenantManager_js_1.TenantModel.findById(req.tenantId);
            if (!tenant) {
                res.status(404).json({
                    success: false,
                    error: 'Tenant not found'
                });
                return;
            }
            // Check feature flag
            const featureMap = {
                events: 'eventIngestion',
                api_calls: 'eventIngestion', // Reuse for now
                storage: 'memoryStorage'
            };
            const feature = featureMap[metric];
            if (feature && !tenant.features[feature]) {
                res.status(403).json({
                    success: false,
                    error: `Feature ${feature} not enabled for this tenant`
                });
                return;
            }
            // For now, quota checking is handled by rate limiting
            // Full quota tracking would increment usage counters here
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkQuota = checkQuota;
//# sourceMappingURL=tenantIsolation.js.map