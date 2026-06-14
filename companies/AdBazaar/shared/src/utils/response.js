"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
/**
 * Create a success response
 */
function createSuccessResponse(res, data, meta) {
    const response = {
        success: true,
        data,
    };
    if (meta) {
        response.meta = meta;
    }
    if (res.locals.requestId) {
        response.requestId = res.locals.requestId;
    }
    return res.json(response);
}
/**
 * Create an error response
 */
function createErrorResponse(res, statusCode, error, code, details) {
    const response = {
        success: false,
        error,
    };
    if (code) {
        response.code = code;
    }
    if (details) {
        response.details = details;
    }
    if (res.locals.requestId) {
        response.requestId = res.locals.requestId;
    }
    return res.status(statusCode).json(response);
}
/**
 * Create a paginated response
 */
function createPaginatedResponse(res, data, meta) {
    return createSuccessResponse(res, data, {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: Math.ceil(meta.total / meta.limit),
    });
}
//# sourceMappingURL=response.js.map