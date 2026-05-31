/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */
// ============================================
// MIDDLEWARE
// ============================================
/**
 * Required tenant middleware - rejects requests without tenant ID
 */
export function tenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        const organizationId = req.headers['x-organization-id'];
        const userId = req.headers['x-user-id'];
        const rolesHeader = req.headers['x-roles'];
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_TENANT_ID',
                    message: 'X-Tenant-Id header is required for all API requests'
                }
            });
        }
        let roles = [];
        if (rolesHeader) {
            try {
                roles = JSON.parse(rolesHeader);
            }
            catch {
                roles = rolesHeader.split(',');
            }
        }
        req.tenantContext = {
            tenant_id: tenantId,
            organization_id: organizationId,
            user_id: userId,
            namespace: `tenant_${tenantId}`,
            roles,
            tenant_type: getTenantType(tenantId)
        };
        next();
    };
}
/**
 * Optional tenant middleware - allows requests without tenant ID
 */
export function optionalTenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        if (tenantId) {
            req.tenantContext = {
                tenant_id: tenantId,
                namespace: `tenant_${tenantId}`,
                tenant_type: getTenantType(tenantId)
            };
        }
        next();
    };
}
// ============================================
// HELPERS
// ============================================
function getTenantType(tenantId) {
    if (tenantId.startsWith('rez_'))
        return 'privileged';
    if (tenantId.startsWith('user_'))
        return 'personal';
    return 'commercial';
}
//# sourceMappingURL=tenant.js.map