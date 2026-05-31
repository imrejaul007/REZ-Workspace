/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Multi-tenant isolation for all services
 */
/**
 * Tenant Middleware
 * Extracts and validates tenant context from headers
 */
export function tenantMiddleware() {
    return async (req, res, next) => {
        // Extract tenant from header
        const tenant_id = req.headers['x-tenant-id'];
        if (!tenant_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_TENANT_ID',
                    message: 'X-Tenant-Id header is required'
                }
            });
        }
        // Validate tenant ID format
        if (!isValidTenantId(tenant_id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TENANT_ID',
                    message: 'Invalid tenant ID format'
                }
            });
        }
        // Build tenant context
        const tenantContext = {
            tenant_id,
            namespace: `tenant_${tenant_id}`,
            tenant_type: determineTenantType(tenant_id),
            organization_id: req.headers['x-organization-id'],
            user_id: req.headers['x-user-id'],
            roles: parseHeaderList(req.headers['x-roles']),
            permissions: parseHeaderList(req.headers['x-permissions']),
            plan: getPlanFromHeader(req.headers['x-plan']),
            limits: getLimitsFromHeaders(req.headers)
        };
        // Attach to request
        req.tenantContext = tenantContext;
        res.locals.tenant_id = tenant_id;
        next();
    };
}
/**
 * Optional tenant middleware (for public endpoints)
 */
export function optionalTenantMiddleware() {
    return (req, res, next) => {
        const tenant_id = req.headers['x-tenant-id'];
        if (tenant_id && isValidTenantId(tenant_id)) {
            req.tenantContext = {
                tenant_id,
                namespace: `tenant_${tenant_id}`,
                tenant_type: determineTenantType(tenant_id),
                roles: parseHeaderList(req.headers['x-roles']),
                permissions: parseHeaderList(req.headers['x-permissions'])
            };
            res.locals.tenant_id = tenant_id;
        }
        next();
    };
}
/**
 * Validate tenant ID format
 */
function isValidTenantId(tenant_id) {
    // Allow alphanumeric, dashes, underscores
    // Length: 3-50 characters
    return /^[a-zA-Z0-9_-]{3,50}$/.test(tenant_id);
}
/**
 * Determine tenant type from ID
 */
function determineTenantType(tenant_id) {
    if (tenant_id.startsWith('rez_')) {
        return 'internal';
    }
    if (tenant_id.includes('_industry')) {
        return 'industry';
    }
    return 'commercial';
}
/**
 * Parse header list (JSON or comma-separated)
 */
function parseHeaderList(header) {
    if (!header)
        return [];
    if (Array.isArray(header))
        return header;
    if (header.startsWith('[')) {
        try {
            return JSON.parse(header);
        }
        catch {
            return header.split(',').map(s => s.trim());
        }
    }
    return header.split(',').map(s => s.trim());
}
/**
 * Get plan from header
 */
function getPlanFromHeader(plan) {
    if (!plan)
        return undefined;
    if (['starter', 'professional', 'enterprise'].includes(plan)) {
        return plan;
    }
    return undefined;
}
/**
 * Get limits from headers
 */
function getLimitsFromHeaders(headers) {
    const rateLimit = parseInt(headers['x-rate-limit']);
    const maxUsers = parseInt(headers['x-max-users']);
    const maxApiCalls = parseInt(headers['x-max-api-calls']);
    const maxStorage = parseInt(headers['x-max-storage']);
    if (!rateLimit && !maxUsers && !maxApiCalls && !maxStorage) {
        return undefined;
    }
    return {
        rate_limit: rateLimit || 100,
        max_users: maxUsers || 10,
        max_api_calls: maxApiCalls || 10000,
        max_storage: maxStorage || 1000000
    };
}
/**
 * Cache key helper - always prefix with tenant
 */
export function cacheKey(tenant_id, ...parts) {
    return ['tenant', tenant_id, ...parts].join(':');
}
/**
 * Database collection helper - always scope by tenant
 */
export function scopedFilter(tenantContext, additionalFilter = {}) {
    return {
        tenant_id: tenantContext.tenant_id,
        ...additionalFilter
    };
}
/**
 * Error with tenant context
 */
export class TenantError extends Error {
    code;
    tenant_id;
    constructor(message, code, tenant_id) {
        super(message);
        this.code = code;
        this.tenant_id = tenant_id;
        this.name = 'TenantError';
    }
}
/**
 * Rate limit key generator
 */
export function rateLimitKey(tenantContext) {
    return tenantContext.tenant_id;
}
//# sourceMappingURL=tenant.js.map