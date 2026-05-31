"use strict";
/**
 * Zod validation schemas for HOJAI AI Churn Model Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelIdSchema = exports.batchTrainRequestSchema = exports.trainRequestSchema = exports.churnPredictionRequestSchema = exports.featuresSchema = void 0;
const zod_1 = require("zod");
// Feature validation schema
exports.featuresSchema = zod_1.z.object({
    daysSinceLastPurchase: zod_1.z
        .number()
        .min(0, 'Days since last purchase must be non-negative')
        .max(365, 'Days since last purchase cannot exceed 365'),
    totalOrders: zod_1.z
        .number()
        .int('Total orders must be an integer')
        .min(0, 'Total orders must be non-negative')
        .max(10000, 'Total orders cannot exceed 10000'),
    averageOrderValue: zod_1.z
        .number()
        .min(0, 'Average order value must be non-negative')
        .max(1000000, 'Average order value cannot exceed 1,000,000'),
    engagementScore: zod_1.z
        .number()
        .min(0, 'Engagement score must be non-negative')
        .max(100, 'Engagement score cannot exceed 100'),
    supportTickets: zod_1.z
        .number()
        .int('Support tickets must be an integer')
        .min(0, 'Support tickets must be non-negative')
        .max(1000, 'Support tickets cannot exceed 1000'),
});
// Churn prediction request schema
exports.churnPredictionRequestSchema = zod_1.z.object({
    customerId: zod_1.z
        .string()
        .min(1, 'Customer ID is required')
        .max(100, 'Customer ID too long')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Customer ID contains invalid characters'),
    features: exports.featuresSchema,
});
// Training request schema
exports.trainRequestSchema = zod_1.z.object({
    customerId: zod_1.z
        .string()
        .min(1, 'Customer ID is required')
        .max(100, 'Customer ID too long'),
    features: exports.featuresSchema,
    label: zod_1.z.boolean({ message: 'Label must be a boolean' }),
});
// Batch training request schema
exports.batchTrainRequestSchema = zod_1.z.object({
    samples: zod_1.z
        .array(exports.trainRequestSchema)
        .min(1, 'At least one training sample is required')
        .max(10000, 'Cannot exceed 10000 training samples'),
});
// Model ID schema
exports.modelIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .min(1, 'Model ID is required')
        .max(100, 'Model ID too long'),
});
//# sourceMappingURL=validation.js.map