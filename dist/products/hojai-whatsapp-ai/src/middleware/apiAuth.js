import { merchantService } from '../services/merchantService.js';
/**
 * API Key authentication middleware
 */
export async function verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required',
            hint: 'Include X-API-Key header'
        });
    }
    try {
        const merchant = await merchantService.validateApiKey(apiKey);
        if (!merchant) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }
        // Attach merchant info to request
        req.tenantId = merchant.tenantId;
        req.merchantId = merchant._id || merchant.id;
        req.merchant = merchant;
        next();
    }
    catch (error) {
        console.error('[API Auth] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}
/**
 * Tenant ID extraction middleware (for internal services)
 */
export async function extractTenantId(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(400).json({
            success: false,
            error: 'Tenant ID required',
            hint: 'Include X-Tenant-ID header'
        });
    }
    req.tenantId = tenantId;
    next();
}
//# sourceMappingURL=apiAuth.js.map