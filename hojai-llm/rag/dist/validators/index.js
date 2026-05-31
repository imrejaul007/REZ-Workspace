"use strict";
/**
 * HOJAI RAG Service - Zod Validators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestSchema = exports.searchRequestSchema = exports.documentBatchSchema = exports.documentCreateSchema = void 0;
const zod_1 = require("zod");
exports.documentCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500),
    content: zod_1.z.string().min(1),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    namespace: zod_1.z.string().max(100).optional(),
});
exports.documentBatchSchema = zod_1.z.object({
    documents: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().min(1).max(500),
        content: zod_1.z.string().min(1),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    })).min(1).max(100),
    namespace: zod_1.z.string().max(100).optional(),
});
exports.searchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(10000),
    limit: zod_1.z.number().int().min(1).max(100).optional().default(10),
    namespace: zod_1.z.string().max(100).optional(),
    min_score: zod_1.z.number().min(0).max(1).optional(),
});
exports.generateRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(10000),
    context: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        content: zod_1.z.string(),
        score: zod_1.z.number(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    })).optional(),
    model: zod_1.z.string().max(100).optional(),
    max_tokens: zod_1.z.number().int().min(1).max(4096).optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
});
//# sourceMappingURL=index.js.map