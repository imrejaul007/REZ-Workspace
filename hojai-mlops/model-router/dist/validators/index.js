"use strict";
/**
 * Hojai Model Router Validators (Zod Schemas)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackRequestSchema = exports.routeRequestSchema = exports.routeOptionsSchema = exports.taskTypeSchema = void 0;
const zod_1 = require("zod");
// Task type enum
exports.taskTypeSchema = zod_1.z.enum(['chat', 'embed', 'classify', 'complete']);
// Route options schema
exports.routeOptionsSchema = zod_1.z.object({
    maxTokens: zod_1.z.number().int().min(1).max(128000).optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
});
// Route request schema
exports.routeRequestSchema = zod_1.z.object({
    task: exports.taskTypeSchema,
    input: zod_1.z.string().min(1, 'Input is required').max(100000, 'Input too long (max 100k chars)'),
    options: exports.routeOptionsSchema.optional(),
});
// Fallback request schema
exports.fallbackRequestSchema = zod_1.z.object({
    originalRequest: exports.routeRequestSchema,
    failedProvider: zod_1.z.enum(['openai', 'anthropic', 'google', 'meta']),
    error: zod_1.z.string().min(1),
    attempt: zod_1.z.number().int().min(1).max(5).optional(),
});
//# sourceMappingURL=index.js.map