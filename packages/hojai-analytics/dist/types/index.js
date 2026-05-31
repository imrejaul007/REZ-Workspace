"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportSchema = exports.AudienceSchema = exports.ExperimentVariantSchema = exports.ExperimentSchema = exports.ExperimentStatus = exports.AttributionResultSchema = exports.ConversionSchema = exports.AttributionEventSchema = exports.AttributionModel = void 0;
const zod_1 = require("zod");
var AttributionModel;
(function (AttributionModel) {
    AttributionModel["FIRST_TOUCH"] = "first_touch";
    AttributionModel["LAST_TOUCH"] = "last_touch";
    AttributionModel["LINEAR"] = "linear";
    AttributionModel["TIME_DECAY"] = "time_decay";
    AttributionModel["POSITION_BASED"] = "position_based";
    AttributionModel["DATA_DRIVEN"] = "data_driven";
})(AttributionModel || (exports.AttributionModel = AttributionModel = {}));
exports.AttributionEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    sessionId: zod_1.z.string().optional(),
    // Touchpoint
    channel: zod_1.z.string(),
    source: zod_1.z.string().optional(),
    campaign: zod_1.z.string().optional(),
    medium: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    keyword: zod_1.z.string().optional(),
    // Interaction
    type: zod_1.z.enum(['impression', 'click', 'conversion']),
    timestamp: zod_1.z.date(),
    // Value
    value: zod_1.z.number().optional(),
    conversionId: zod_1.z.string().optional(),
    // Context
    device: zod_1.z.string().optional(),
    location: zod_1.z.string().optional()
});
exports.ConversionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    conversionType: zod_1.z.string(),
    value: zod_1.z.number(),
    currency: zod_1.z.string().default('INR'),
    timestamp: zod_1.z.date(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
exports.AttributionResultSchema = zod_1.z.object({
    channel: zod_1.z.string(),
    conversions: zod_1.z.number(),
    revenue: zod_1.z.number(),
    cost: zod_1.z.number(),
    roas: zod_1.z.number(),
    attribution: zod_1.z.number(),
    touchpoints: zod_1.z.array(zod_1.z.object({
        channel: zod_1.z.string(),
        touchpointDate: zod_1.z.date(),
        value: zod_1.z.number()
    }))
});
// A/B Testing
var ExperimentStatus;
(function (ExperimentStatus) {
    ExperimentStatus["DRAFT"] = "draft";
    ExperimentStatus["RUNNING"] = "running";
    ExperimentStatus["PAUSED"] = "paused";
    ExperimentStatus["COMPLETED"] = "completed";
})(ExperimentStatus || (exports.ExperimentStatus = ExperimentStatus = {}));
exports.ExperimentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    hypothesis: zod_1.z.string(),
    status: zod_1.z.nativeEnum(ExperimentStatus).default(ExperimentStatus.DRAFT),
    // Variants
    variants: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        traffic: zod_1.z.number().min(0).max(100),
        config: zod_1.z.record(zod_1.z.any())
    })).min(2),
    // Targeting
    targeting: zod_1.z.object({
        userSegments: zod_1.z.array(zod_1.z.string()).optional(),
        channels: zod_1.z.array(zod_1.z.string()).optional(),
        minSampleSize: zod_1.z.number().default(100)
    }).optional(),
    // Metrics
    primaryMetric: zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.enum(['conversion_rate', 'revenue', 'engagement', 'custom'])
    }),
    secondaryMetrics: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string()
    })).optional(),
    // Results
    results: zod_1.z.object({
        winner: zod_1.z.string().uuid().optional(),
        confidence: zod_1.z.number().optional(),
        pValue: zod_1.z.number().optional(),
        variantStats: zod_1.z.record(zod_1.z.object({
            conversions: zod_1.z.number(),
            total: zod_1.z.number(),
            conversionRate: zod_1.z.number(),
            revenue: zod_1.z.number()
        }))
    }).optional(),
    // Schedule
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.ExperimentVariantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    experimentId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    assignedAt: zod_1.z.date(),
    converted: zod_1.z.boolean().default(false),
    conversionValue: zod_1.z.number().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Targeting
exports.AudienceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    criteria: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        operator: zod_1.z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'exists']),
        value: zod_1.z.any()
    })),
    logic: zod_1.z.enum(['AND', 'OR']).default('AND'),
    estimatedSize: zod_1.z.number().optional(),
    actualSize: zod_1.z.number().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// Reports
exports.ReportSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['attribution', 'experiment', 'audience', 'custom']),
    config: zod_1.z.record(zod_1.z.any()),
    schedule: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        frequency: zod_1.z.enum(['daily', 'weekly', 'monthly']),
        recipients: zod_1.z.array(zod_1.z.string().email())
    }).optional(),
    lastRunAt: zod_1.z.date().optional(),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
