"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFMSchema = exports.RFMTier = exports.ModelMetadataSchema = exports.ModelStatus = exports.SegmentSchema = exports.SegmentType = exports.DecisionSchema = exports.DecisionType = exports.RecommendationSchema = exports.RecommendationType = exports.PredictionSchema = exports.PredictionRisk = exports.PredictionType = void 0;
const zod_1 = require("zod");
// ============================================================================
// PREDICTION TYPES
// ============================================================================
var PredictionType;
(function (PredictionType) {
    PredictionType["CHURN"] = "churn";
    PredictionType["LTV"] = "ltv";
    PredictionType["REVISIT"] = "revisit";
    PredictionType["CONVERSION"] = "conversion";
    PredictionType["NEXT_PURCHASE"] = "next_purchase";
    PredictionType["DEMAND"] = "demand";
    PredictionType["FRAUD"] = "fraud";
})(PredictionType || (exports.PredictionType = PredictionType = {}));
var PredictionRisk;
(function (PredictionRisk) {
    PredictionRisk["CRITICAL"] = "critical";
    PredictionRisk["HIGH"] = "high";
    PredictionRisk["MEDIUM"] = "medium";
    PredictionRisk["LOW"] = "low";
})(PredictionRisk || (exports.PredictionRisk = PredictionRisk = {}));
exports.PredictionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    entityType: zod_1.z.enum(['user', 'merchant', 'product', 'order']).optional(),
    entityId: zod_1.z.string().optional(),
    // Prediction
    type: zod_1.z.nativeEnum(PredictionType),
    value: zod_1.z.number(), // Probability or predicted value
    risk: zod_1.z.nativeEnum(PredictionRisk).optional(),
    confidence: zod_1.z.number().min(0).max(1),
    model: zod_1.z.string(), // Model used for prediction
    // Explanation
    factors: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        importance: zod_1.z.number(),
        value: zod_1.z.string().or(zod_1.z.number())
    })).optional(),
    explanation: zod_1.z.string().optional(),
    // Recommendations
    recommendations: zod_1.z.array(zod_1.z.object({
        action: zod_1.z.string(),
        reason: zod_1.z.string(),
        priority: zod_1.z.enum(['high', 'medium', 'low'])
    })).optional(),
    // Metadata
    features: zod_1.z.record(zod_1.z.number()).optional(),
    version: zod_1.z.string().optional(),
    // Timing
    predictedFor: zod_1.z.date().optional(),
    validUntil: zod_1.z.date(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["PRODUCT"] = "product";
    RecommendationType["CONTENT"] = "content";
    RecommendationType["OFFER"] = "offer";
    RecommendationType["ACTION"] = "action";
    RecommendationType["NEXT_BEST_ACTION"] = "next_best_action";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
exports.RecommendationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    // Recommendation
    type: zod_1.z.nativeEnum(RecommendationType),
    category: zod_1.z.string(), // 'similar', 'frequently_bought', 'trending', etc.
    // Content
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    entityType: zod_1.z.enum(['product', 'content', 'offer', 'action']),
    entityId: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    // Scoring
    score: zod_1.z.number().min(0).max(1),
    confidence: zod_1.z.number().min(0).max(1),
    // Context
    reason: zod_1.z.string(), // Why this was recommended
    context: zod_1.z.object({
        trigger: zod_1.z.string().optional(), // 'cart', 'browse', 'purchase', etc.
        sourceEntityId: zod_1.z.string().optional(), // Related entity
        position: zod_1.z.number().optional() // Position in list
    }).optional(),
    // Display
    display: zod_1.z.object({
        imageUrl: zod_1.z.string().optional(),
        price: zod_1.z.number().optional(),
        discount: zod_1.z.number().optional(),
        rating: zod_1.z.number().optional()
    }).optional(),
    // Personalization
    personalization: zod_1.z.object({
        demographics: zod_1.z.boolean().default(false),
        behavior: zod_1.z.boolean().default(true),
        collaborative: zod_1.z.boolean().default(true),
        contextual: zod_1.z.boolean().default(true)
    }).optional(),
    // Validity
    validFrom: zod_1.z.date().optional(),
    validUntil: zod_1.z.date(),
    impressions: zod_1.z.number().default(0),
    clicks: zod_1.z.number().default(0),
    conversions: zod_1.z.number().default(0),
    createdAt: zod_1.z.date()
});
// ============================================================================
// DECISION TYPES
// ============================================================================
var DecisionType;
(function (DecisionType) {
    DecisionType["CASHBACK"] = "cashback";
    DecisionType["OFFER"] = "offer";
    DecisionType["TARGETING"] = "targeting";
    DecisionType["ROUTING"] = "routing";
    DecisionType["PRICING"] = "pricing";
    DecisionType["FRAUD"] = "fraud";
})(DecisionType || (exports.DecisionType = DecisionType = {}));
exports.DecisionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().optional(),
    // Decision
    type: zod_1.z.nativeEnum(DecisionType),
    action: zod_1.z.string(), // 'approve', 'reject', 'offer_cashback', etc.
    value: zod_1.z.number().optional(), // Cashback percentage, price, etc.
    // Reasoning
    reason: zod_1.z.string(),
    factors: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        weight: zod_1.z.number(),
        value: zod_1.z.any()
    })),
    model: zod_1.z.string().optional(),
    // Context
    context: zod_1.z.object({
        requestId: zod_1.z.string().optional(),
        sessionId: zod_1.z.string().optional(),
        channel: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional()
    }).optional(),
    // Risk
    risk: zod_1.z.nativeEnum(PredictionRisk).optional(),
    fraudScore: zod_1.z.number().min(0).max(1).optional(),
    // Status
    status: zod_1.z.enum(['pending', 'approved', 'rejected', 'manual_review']),
    reviewedBy: zod_1.z.string().optional(),
    reviewedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// SEGMENT TYPES
// ============================================================================
var SegmentType;
(function (SegmentType) {
    SegmentType["BEHAVIORAL"] = "behavioral";
    SegmentType["DEMOGRAPHIC"] = "demographic";
    SegmentType["PREDICTIVE"] = "predictive";
    SegmentType["RFM"] = "rfm";
    SegmentType["CUSTOM"] = "custom";
})(SegmentType || (exports.SegmentType = SegmentType = {}));
exports.SegmentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Segment info
    name: zod_1.z.string(),
    type: zod_1.z.nativeEnum(SegmentType),
    description: zod_1.z.string().optional(),
    // Criteria
    criteria: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        operator: zod_1.z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: zod_1.z.any()
    })),
    logic: zod_1.z.enum(['AND', 'OR']).default('AND'),
    // Computed vs Static
    isDynamic: zod_1.z.boolean().default(true), // Recomputed vs manually managed
    // Stats
    memberCount: zod_1.z.number().default(0),
    memberSample: zod_1.z.array(zod_1.z.string()).max(10).optional(), // Sample user IDs
    // Priority
    priority: zod_1.z.number().default(0), // Higher = processed first
    // Tags
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// MODEL TYPES
// ============================================================================
var ModelStatus;
(function (ModelStatus) {
    ModelStatus["TRAINING"] = "training";
    ModelStatus["DEPLOYED"] = "deployed";
    ModelStatus["ARCHIVED"] = "archived";
})(ModelStatus || (exports.ModelStatus = ModelStatus = {}));
exports.ModelMetadataSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Model info
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    type: zod_1.z.string(), // 'churn', 'ltv', 'recommendation', etc.
    version: zod_1.z.string().default('1.0'),
    // Performance
    status: zod_1.z.nativeEnum(ModelStatus),
    metrics: zod_1.z.object({
        accuracy: zod_1.z.number().optional(),
        precision: zod_1.z.number().optional(),
        recall: zod_1.z.number().optional(),
        f1: zod_1.z.number().optional(),
        auc: zod_1.z.number().optional(),
        rmse: zod_1.z.number().optional()
    }).optional(),
    // Training
    trainedAt: zod_1.z.date().optional(),
    trainingDataSize: zod_1.z.number().optional(),
    trainingDuration: zod_1.z.number().optional(), // seconds
    // Deployment
    deployedAt: zod_1.z.date().optional(),
    lastPredictionAt: zod_1.z.date().optional(),
    predictionCount: zod_1.z.number().default(0),
    // Config
    config: zod_1.z.record(zod_1.z.any()).optional(),
    features: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// RFM TYPES
// ============================================================================
var RFMTier;
(function (RFMTier) {
    RFMTier["CHAMPIONS"] = "champions";
    RFMTier["LOYAL"] = "loyal";
    RFMTier["POTENTIAL"] = "potential";
    RFMTier["AT_RISK"] = "at_risk";
    RFMTier["LOST"] = "lost";
})(RFMTier || (exports.RFMTier = RFMTier = {}));
exports.RFMSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    // RFM Scores (1-5)
    recencyScore: zod_1.z.number().min(1).max(5),
    frequencyScore: zod_1.z.number().min(1).max(5),
    monetaryScore: zod_1.z.number().min(1).max(5),
    // Combined
    rfmScore: zod_1.z.number().min(3).max(15),
    tier: zod_1.z.nativeEnum(RFMTier),
    // Computed values
    lastOrderDate: zod_1.z.date(),
    totalOrders: zod_1.z.number(),
    totalSpent: zod_1.z.number(),
    averageOrderValue: zod_1.z.number(),
    // Segment
    segment: zod_1.z.string(),
    // Validity
    computedAt: zod_1.z.date(),
    validUntil: zod_1.z.date()
});
//# sourceMappingURL=index.js.map