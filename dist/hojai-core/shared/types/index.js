/**
 * Hojai Core - Shared Types
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Canonical types for all Hojai Core platforms
 */
// ============================================
// UTILITY FUNCTIONS
// ============================================
export function createResponse(data, options) {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId || generateRequestId(),
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
            requestId: generateRequestId()
        }
    };
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=index.js.map