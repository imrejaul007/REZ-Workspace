"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalIdParamSchema = exports.idParamSchema = exports.paginationSchema = void 0;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const zod_1 = require("zod");
/**
 * Validate request body against a Zod schema
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                    requestId: req.requestId,
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Validate query parameters against a Zod schema
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Query validation error',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                    requestId: req.requestId,
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Validate URL parameters against a Zod schema
 */
function validateParams(schema) {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Parameter validation error',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                    requestId: req.requestId,
                });
                return;
            }
            next(error);
        }
    };
}
// Common validation schemas
const zod_2 = require("zod");
exports.paginationSchema = zod_2.z.object({
    page: zod_2.z.coerce.number().int().min(1).default(1),
    limit: zod_2.z.coerce.number().int().min(1).max(100).default(20),
});
exports.idParamSchema = zod_2.z.object({
    id: zod_2.z.string().min(1),
});
exports.optionalIdParamSchema = zod_2.z.object({
    id: zod_2.z.string().min(1).optional(),
});
//# sourceMappingURL=validation.js.map