import { z } from 'zod';
// ============================================================================
// PREDICTION TYPES
// ============================================================================
export var PredictionType;
(function (PredictionType) {
    PredictionType["CHURN"] = "churn";
    PredictionType["LTV"] = "ltv";
    PredictionType["REVISIT"] = "revisit";
    PredictionType["CONVERSION"] = "conversion";
    PredictionType["NEXT_PURCHASE"] = "next_purchase";
    PredictionType["DEMAND"] = "demand";
    PredictionType["FRAUD"] = "fraud";
})(PredictionType || (PredictionType = {}));
export var PredictionRisk;
(function (PredictionRisk) {
    PredictionRisk["CRITICAL"] = "critical";
    PredictionRisk["HIGH"] = "high";
    PredictionRisk["MEDIUM"] = "medium";
    PredictionRisk["LOW"] = "low";
})(PredictionRisk || (PredictionRisk = {}));
export const PredictionSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string(),
    entityType: z.enum(['user', 'merchant', 'product', 'order']).optional(),
    entityId: z.string().optional(),
    // Prediction
    type: z.nativeEnum(PredictionType),
    value: z.number(), // Probability or predicted value
    risk: z.nativeEnum(PredictionRisk).optional(),
    confidence: z.number().min(0).max(1),
    model: z.string(), // Model used for prediction
    // Explanation
    factors: z.array(z.object({
        name: z.string(),
        importance: z.number(),
        value: z.string().or(z.number())
    })).optional(),
    explanation: z.string().optional(),
    // Recommendations
    recommendations: z.array(z.object({
        action: z.string(),
        reason: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })).optional(),
    // Metadata
    features: z.record(z.number()).optional(),
    version: z.string().optional(),
    // Timing
    predictedFor: z.date().optional(),
    validUntil: z.date(),
    createdAt: z.date()
});
// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================
export var RecommendationType;
(function (RecommendationType) {
    RecommendationType["PRODUCT"] = "product";
    RecommendationType["CONTENT"] = "content";
    RecommendationType["OFFER"] = "offer";
    RecommendationType["ACTION"] = "action";
    RecommendationType["NEXT_BEST_ACTION"] = "next_best_action";
})(RecommendationType || (RecommendationType = {}));
export const RecommendationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string(),
    // Recommendation
    type: z.nativeEnum(RecommendationType),
    category: z.string(), // 'similar', 'frequently_bought', 'trending', etc.
    // Content
    title: z.string(),
    description: z.string().optional(),
    entityType: z.enum(['product', 'content', 'offer', 'action']),
    entityId: z.string(),
    metadata: z.record(z.any()).optional(),
    // Scoring
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    // Context
    reason: z.string(), // Why this was recommended
    context: z.object({
        trigger: z.string().optional(), // 'cart', 'browse', 'purchase', etc.
        sourceEntityId: z.string().optional(), // Related entity
        position: z.number().optional() // Position in list
    }).optional(),
    // Display
    display: z.object({
        imageUrl: z.string().optional(),
        price: z.number().optional(),
        discount: z.number().optional(),
        rating: z.number().optional()
    }).optional(),
    // Personalization
    personalization: z.object({
        demographics: z.boolean().default(false),
        behavior: z.boolean().default(true),
        collaborative: z.boolean().default(true),
        contextual: z.boolean().default(true)
    }).optional(),
    // Validity
    validFrom: z.date().optional(),
    validUntil: z.date(),
    impressions: z.number().default(0),
    clicks: z.number().default(0),
    conversions: z.number().default(0),
    createdAt: z.date()
});
// ============================================================================
// DECISION TYPES
// ============================================================================
export var DecisionType;
(function (DecisionType) {
    DecisionType["CASHBACK"] = "cashback";
    DecisionType["OFFER"] = "offer";
    DecisionType["TARGETING"] = "targeting";
    DecisionType["ROUTING"] = "routing";
    DecisionType["PRICING"] = "pricing";
    DecisionType["FRAUD"] = "fraud";
})(DecisionType || (DecisionType = {}));
export const DecisionSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().optional(),
    // Decision
    type: z.nativeEnum(DecisionType),
    action: z.string(), // 'approve', 'reject', 'offer_cashback', etc.
    value: z.number().optional(), // Cashback percentage, price, etc.
    // Reasoning
    reason: z.string(),
    factors: z.array(z.object({
        name: z.string(),
        weight: z.number(),
        value: z.any()
    })),
    model: z.string().optional(),
    // Context
    context: z.object({
        requestId: z.string().optional(),
        sessionId: z.string().optional(),
        channel: z.string().optional(),
        amount: z.number().optional()
    }).optional(),
    // Risk
    risk: z.nativeEnum(PredictionRisk).optional(),
    fraudScore: z.number().min(0).max(1).optional(),
    // Status
    status: z.enum(['pending', 'approved', 'rejected', 'manual_review']),
    reviewedBy: z.string().optional(),
    reviewedAt: z.date().optional(),
    createdAt: z.date()
});
// ============================================================================
// SEGMENT TYPES
// ============================================================================
export var SegmentType;
(function (SegmentType) {
    SegmentType["BEHAVIORAL"] = "behavioral";
    SegmentType["DEMOGRAPHIC"] = "demographic";
    SegmentType["PREDICTIVE"] = "predictive";
    SegmentType["RFM"] = "rfm";
    SegmentType["CUSTOM"] = "custom";
})(SegmentType || (SegmentType = {}));
export const SegmentSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    // Segment info
    name: z.string(),
    type: z.nativeEnum(SegmentType),
    description: z.string().optional(),
    // Criteria
    criteria: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: z.any()
    })),
    logic: z.enum(['AND', 'OR']).default('AND'),
    // Computed vs Static
    isDynamic: z.boolean().default(true), // Recomputed vs manually managed
    // Stats
    memberCount: z.number().default(0),
    memberSample: z.array(z.string()).max(10).optional(), // Sample user IDs
    // Priority
    priority: z.number().default(0), // Higher = processed first
    // Tags
    tags: z.array(z.string()).default([]),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// MODEL TYPES
// ============================================================================
export var ModelStatus;
(function (ModelStatus) {
    ModelStatus["TRAINING"] = "training";
    ModelStatus["DEPLOYED"] = "deployed";
    ModelStatus["ARCHIVED"] = "archived";
})(ModelStatus || (ModelStatus = {}));
export const ModelMetadataSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    // Model info
    name: z.string(),
    description: z.string().optional(),
    type: z.string(), // 'churn', 'ltv', 'recommendation', etc.
    version: z.string().default('1.0'),
    // Performance
    status: z.nativeEnum(ModelStatus),
    metrics: z.object({
        accuracy: z.number().optional(),
        precision: z.number().optional(),
        recall: z.number().optional(),
        f1: z.number().optional(),
        auc: z.number().optional(),
        rmse: z.number().optional()
    }).optional(),
    // Training
    trainedAt: z.date().optional(),
    trainingDataSize: z.number().optional(),
    trainingDuration: z.number().optional(), // seconds
    // Deployment
    deployedAt: z.date().optional(),
    lastPredictionAt: z.date().optional(),
    predictionCount: z.number().default(0),
    // Config
    config: z.record(z.any()).optional(),
    features: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// RFM TYPES
// ============================================================================
export var RFMTier;
(function (RFMTier) {
    RFMTier["CHAMPIONS"] = "champions";
    RFMTier["LOYAL"] = "loyal";
    RFMTier["POTENTIAL"] = "potential";
    RFMTier["AT_RISK"] = "at_risk";
    RFMTier["LOST"] = "lost";
})(RFMTier || (RFMTier = {}));
export const RFMSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string(),
    // RFM Scores (1-5)
    recencyScore: z.number().min(1).max(5),
    frequencyScore: z.number().min(1).max(5),
    monetaryScore: z.number().min(1).max(5),
    // Combined
    rfmScore: z.number().min(3).max(15),
    tier: z.nativeEnum(RFMTier),
    // Computed values
    lastOrderDate: z.date(),
    totalOrders: z.number(),
    totalSpent: z.number(),
    averageOrderValue: z.number(),
    // Segment
    segment: z.string(),
    // Validity
    computedAt: z.date(),
    validUntil: z.date()
});
//# sourceMappingURL=index.js.map