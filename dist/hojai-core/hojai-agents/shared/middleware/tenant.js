/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */
export function tenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_TENANT_ID', message: 'X-Tenant-Id header required' }
            });
        }
        req.tenantContext = {
            tenant_id: tenantId,
            namespace: `tenant_${tenantId}`
        };
        next();
    };
}
//# sourceMappingURL=tenant.js.map