/**
 * Hojai Core - Shared Types
 * Version: 1.0.0 | Date: May 30, 2026
 */
export function createResponse(data, options) {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`,
            tenantId: options?.tenantId
        }
    };
}
export function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: { code, message, details },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`
        }
    };
}
//# sourceMappingURL=index.js.map