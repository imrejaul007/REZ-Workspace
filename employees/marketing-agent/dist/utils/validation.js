"use strict";
// ============================================
// HOJAI AI - Validation Utility
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.DateSchema = exports.URLSchema = exports.EmailSchema = exports.UUIDSchema = void 0;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.getPaginationOptions = getPaginationOptions;
exports.formatPaginatedResponse = formatPaginatedResponse;
const zod_1 = require("zod");
const logger_1 = require("./logger");
/**
 * Validate request body against a Zod schema
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.body);
            req.body = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger_1.logger.warn('Validation error', {
                    path: req.path,
                    errors: details
                });
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        details
                    }
                });
                return;
            }
            logger_1.logger.error('Unexpected validation error', { error });
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected validation error occurred'
                }
            });
        }
    };
}
/**
 * Validate request query against a Zod schema
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.query);
            req.query = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger_1.logger.warn('Query validation error', {
                    path: req.path,
                    errors: details
                });
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Query validation failed',
                        details
                    }
                });
                return;
            }
            logger_1.logger.error('Unexpected validation error', { error });
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected validation error occurred'
                }
            });
        }
    };
}
/**
 * Validate request params against a Zod schema
 */
function validateParams(schema) {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.params);
            req.params = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger_1.logger.warn('Params validation error', {
                    path: req.path,
                    errors: details
                });
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Params validation failed',
                        details
                    }
                });
                return;
            }
            logger_1.logger.error('Unexpected validation error', { error });
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected validation error occurred'
                }
            });
        }
    };
}
/**
 * Validate UUID format
 */
exports.UUIDSchema = zod_1.z.string().uuid();
/**
 * Validate email format
 */
exports.EmailSchema = zod_1.z.string().email();
/**
 * Validate URL format
 */
exports.URLSchema = zod_1.z.string().url();
/**
 * Validate ISO date string
 */
exports.DateSchema = zod_1.z.string().datetime();
/**
 * Pagination schema
 */
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sort: zod_1.z.enum(['asc', 'desc']).optional(),
    sortBy: zod_1.z.string().optional()
});
/**
 * Get pagination options from query
 */
function getPaginationOptions(query) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    let sort = { createdAt: -1 };
    if (query.sortBy) {
        sort = { [query.sortBy]: query.sort === 'asc' ? 1 : -1 };
    }
    return { skip, limit, sort };
}
/**
 * Format pagination response
 */
function formatPaginatedResponse(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        success: true,
        data: {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        }
    };
}
//# sourceMappingURL=validation.js.map