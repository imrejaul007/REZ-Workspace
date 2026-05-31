"use strict";
/**
 * Hojai Model Registry Validators (Zod Schemas)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionParamSchema = exports.modelNameParamSchema = exports.updateStageSchema = exports.registerModelSchema = void 0;
const zod_1 = require("zod");
// Model name pattern: lowercase, alphanumeric with hyphens/underscores
const modelNamePattern = /^[a-z0-9][a-z0-9_-]*$/;
// Version pattern: semver-like (e.g., 1.0.0, 1.0.0-beta.1)
const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
// Register model request schema
exports.registerModelSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Model name is required')
        .max(128, 'Model name too long (max 128 chars)')
        .regex(modelNamePattern, 'Model name must be lowercase alphanumeric with hyphens/underscores'),
    version: zod_1.z
        .string()
        .min(1, 'Version is required')
        .max(64, 'Version too long (max 64 chars)')
        .regex(versionPattern, 'Version must be semver-like (e.g., 1.0.0)'),
    description: zod_1.z.string().max(1024, 'Description too long (max 1024 chars)').optional(),
    metrics: zod_1.z.record(zod_1.z.number()).optional(),
    stage: zod_1.z.enum(['dev', 'staging', 'production']).default('dev'),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Update stage request schema
exports.updateStageSchema = zod_1.z.object({
    stage: zod_1.z.enum(['dev', 'staging', 'production'], {
        errorMap: () => ({ message: 'Stage must be one of: dev, staging, production' }),
    }),
});
// Model name param schema
exports.modelNameParamSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1)
        .max(128)
        .regex(modelNamePattern, 'Invalid model name format'),
});
// Version param schema
exports.versionParamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(128).regex(modelNamePattern),
    version: zod_1.z.string().min(1).max(64).regex(versionPattern),
});
//# sourceMappingURL=index.js.map