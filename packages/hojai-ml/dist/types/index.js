"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateSchema = exports.InferenceLogSchema = exports.RoutingRuleSchema = exports.ModelSchema = exports.ModelStatus = exports.ModelType = exports.ModelTier = void 0;
const zod_1 = require("zod");
// ============================================================================
// MODEL TYPES
// ============================================================================
var ModelTier;
(function (ModelTier) {
    ModelTier["GLOBAL"] = "global";
    ModelTier["VERTICAL"] = "vertical";
    ModelTier["TENANT"] = "tenant";
    ModelTier["PRIVILEGED"] = "privileged"; // REZ-only models
})(ModelTier || (exports.ModelTier = ModelTier = {}));
var ModelType;
(function (ModelType) {
    // Language
    ModelType["LANGUAGE"] = "language";
    ModelType["EMBEDDING"] = "embedding";
    ModelType["CHAT"] = "chat";
    // Prediction
    ModelType["PREDICTION"] = "prediction";
    ModelType["CLASSIFICATION"] = "classification";
    ModelType["REGRESSION"] = "regression";
    // Vision
    ModelType["VISION"] = "vision";
    ModelType["OCR"] = "ocr";
    // Voice
    ModelType["SPEECH_TO_TEXT"] = "speech_to_text";
    ModelType["TEXT_TO_SPEECH"] = "text_to_speech";
    // Domain
    ModelType["RECOMMENDATION"] = "recommendation";
    ModelType["FRAUD"] = "fraud";
    ModelType["CHURN"] = "churn";
    ModelType["LTV"] = "ltv";
    ModelType["INTENT"] = "intent";
    ModelType["SENTIMENT"] = "sentiment";
    ModelType["NER"] = "ner";
})(ModelType || (exports.ModelType = ModelType = {}));
var ModelStatus;
(function (ModelStatus) {
    ModelStatus["TRAINING"] = "training";
    ModelStatus["DEPLOYED"] = "deployed";
    ModelStatus["ARCHIVED"] = "archived";
    ModelStatus["DEPRECATED"] = "deprecated";
})(ModelStatus || (exports.ModelStatus = ModelStatus = {}));
exports.ModelSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid().optional(), // null for global models
    // Identity
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    description: zod_1.z.string(),
    // Classification
    tier: zod_1.z.nativeEnum(ModelTier),
    type: zod_1.z.nativeEnum(ModelType),
    domain: zod_1.z.string().optional(), // 'healthcare', 'hospitality', 'commerce'
    // Provider
    provider: zod_1.z.enum(['openai', 'anthropic', 'meta', 'google', 'custom', 'hojai']),
    baseModel: zod_1.z.string().optional(), // 'gpt-4', 'llama-2', etc.
    // Configuration
    config: zod_1.z.object({
        temperature: zod_1.z.number().min(0).max(2).optional(),
        maxTokens: zod_1.z.number().optional(),
        topP: zod_1.z.number().optional(),
        frequencyPenalty: zod_1.z.number().optional(),
        presencePenalty: zod_1.z.number().optional()
    }),
    // Training (if applicable)
    training: zod_1.z.object({
        datasetSize: zod_1.z.number().optional(),
        fineTunedFrom: zod_1.z.string().optional(),
        trainingDate: zod_1.z.date().optional(),
        epochs: zod_1.z.number().optional(),
        learningRate: zod_1.z.number().optional()
    }).optional(),
    // Performance
    metrics: zod_1.z.object({
        accuracy: zod_1.z.number().optional(),
        precision: zod_1.z.number().optional(),
        recall: zod_1.z.number().optional(),
        f1: zod_1.z.number().optional(),
        auc: zod_1.z.number().optional(),
        rmse: zod_1.z.number().optional(),
        latencyMs: zod_1.z.number().optional(),
        costPerCall: zod_1.z.number().optional()
    }).optional(),
    // Capabilities
    capabilities: zod_1.z.array(zod_1.z.string()),
    inputSchema: zod_1.z.record(zod_1.z.any()).optional(),
    outputSchema: zod_1.z.record(zod_1.z.any()).optional(),
    // Access
    accessControl: zod_1.z.object({
        tenantIds: zod_1.z.array(zod_1.z.string()).optional(), // null = all tenants
        requiresLicense: zod_1.z.boolean().default(false),
        licenseKey: zod_1.z.string().optional(),
        maxCallsPerDay: zod_1.z.number().optional()
    }),
    // Cost
    costPerToken: zod_1.z.number().optional(),
    costPerCall: zod_1.z.number().optional(),
    // Status
    status: zod_1.z.nativeEnum(ModelStatus),
    // Routing hints
    routingHints: zod_1.z.object({
        latencySensitive: zod_1.z.boolean().default(false),
        costSensitive: zod_1.z.boolean().default(false),
        accuracySensitive: zod_1.z.boolean().default(false),
        fallbackModel: zod_1.z.string().optional()
    }),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// MODEL ROUTING
// ============================================================================
exports.RoutingRuleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    // Trigger conditions
    conditions: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(), // 'task', 'domain', 'tenant', 'latency', 'cost'
        operator: zod_1.z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
        value: zod_1.z.any()
    })),
    // Action: route to model
    modelId: zod_1.z.string().uuid(),
    priority: zod_1.z.number().default(0),
    // Fallback
    fallbackModelId: zod_1.z.string().uuid().optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// MODEL INFERENCE LOG
// ============================================================================
exports.InferenceLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    modelId: zod_1.z.string().uuid(),
    // Request
    request: zod_1.z.object({
        input: zod_1.z.record(zod_1.z.any()),
        parameters: zod_1.z.record(zod_1.z.any()).optional()
    }),
    // Response
    response: zod_1.z.object({
        output: zod_1.z.record(zod_1.z.any()),
        tokensUsed: zod_1.z.number().optional(),
        latencyMs: zod_1.z.number()
    }),
    // Cost
    cost: zod_1.z.number(),
    // Quality
    quality: zod_1.z.object({
        confidence: zod_1.z.number().optional(),
        userFeedback: zod_1.z.number().min(1).max(5).optional()
    }).optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// PROMPT TEMPLATES
// ============================================================================
exports.PromptTemplateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    // For which task
    task: zod_1.z.string(), // 'customer_support', 'product_description', etc.
    modelType: zod_1.z.nativeEnum(ModelType),
    // Template
    systemPrompt: zod_1.z.string(),
    userPromptTemplate: zod_1.z.string(),
    // Variables
    variables: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        required: zod_1.z.boolean().default(true),
        defaultValue: zod_1.z.string().optional()
    })),
    // Configuration
    config: zod_1.z.object({
        temperature: zod_1.z.number().optional(),
        maxTokens: zod_1.z.number().optional()
    }),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
