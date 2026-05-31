"use strict";
/**
 * Feature Store Validators using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureNameSchema = exports.entityIdSchema = exports.batchGetSchema = exports.storeFeaturesSchema = void 0;
const zod_1 = require("zod");
/**
 * Validate feature value type
 */
const featureValueSchema = zod_1.z.union([
    zod_1.z.number(),
    zod_1.z.string(),
    zod_1.z.boolean(),
]);
/**
 * Single feature input schema
 */
const featureInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(256),
    value: featureValueSchema,
});
/**
 * Store features request schema
 */
exports.storeFeaturesSchema = zod_1.z.object({
    features: zod_1.z.array(featureInputSchema).min(1).max(100),
});
/**
 * Batch get request schema
 */
exports.batchGetSchema = zod_1.z.object({
    entity_ids: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(100),
    feature_names: zod_1.z.array(zod_1.z.string().min(1)).optional(),
});
/**
 * Entity ID parameter schema
 */
exports.entityIdSchema = zod_1.z.string().min(1).max(256);
/**
 * Feature name parameter schema
 */
exports.featureNameSchema = zod_1.z.string().min(1).max(256);
//# sourceMappingURL=index.js.map