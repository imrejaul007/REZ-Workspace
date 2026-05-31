import { z } from 'zod';
// ============================================================================
// MODEL TYPES
// ============================================================================
export var ModelTier;
(function (ModelTier) {
    ModelTier["GLOBAL"] = "global";
    ModelTier["VERTICAL"] = "vertical";
    ModelTier["TENANT"] = "tenant";
    ModelTier["PRIVILEGED"] = "privileged"; // REZ-only models
})(ModelTier || (ModelTier = {}));
export var ModelType;
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
})(ModelType || (ModelType = {}));
export var ModelStatus;
(function (ModelStatus) {
    ModelStatus["TRAINING"] = "training";
    ModelStatus["DEPLOYED"] = "deployed";
    ModelStatus["ARCHIVED"] = "archived";
    ModelStatus["DEPRECATED"] = "deprecated";
})(ModelStatus || (ModelStatus = {}));
export const ModelSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid().optional(), // null for global models
    // Identity
    name: z.string(),
    version: z.string(),
    description: z.string(),
    // Classification
    tier: z.nativeEnum(ModelTier),
    type: z.nativeEnum(ModelType),
    domain: z.string().optional(), // 'healthcare', 'hospitality', 'commerce'
    // Provider
    provider: z.enum(['openai', 'anthropic', 'meta', 'google', 'custom', 'hojai']),
    baseModel: z.string().optional(), // 'gpt-4', 'llama-2', etc.
    // Configuration
    config: z.object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().optional(),
        topP: z.number().optional(),
        frequencyPenalty: z.number().optional(),
        presencePenalty: z.number().optional()
    }),
    // Training (if applicable)
    training: z.object({
        datasetSize: z.number().optional(),
        fineTunedFrom: z.string().optional(),
        trainingDate: z.date().optional(),
        epochs: z.number().optional(),
        learningRate: z.number().optional()
    }).optional(),
    // Performance
    metrics: z.object({
        accuracy: z.number().optional(),
        precision: z.number().optional(),
        recall: z.number().optional(),
        f1: z.number().optional(),
        auc: z.number().optional(),
        rmse: z.number().optional(),
        latencyMs: z.number().optional(),
        costPerCall: z.number().optional()
    }).optional(),
    // Capabilities
    capabilities: z.array(z.string()),
    inputSchema: z.record(z.any()).optional(),
    outputSchema: z.record(z.any()).optional(),
    // Access
    accessControl: z.object({
        tenantIds: z.array(z.string()).optional(), // null = all tenants
        requiresLicense: z.boolean().default(false),
        licenseKey: z.string().optional(),
        maxCallsPerDay: z.number().optional()
    }),
    // Cost
    costPerToken: z.number().optional(),
    costPerCall: z.number().optional(),
    // Status
    status: z.nativeEnum(ModelStatus),
    // Routing hints
    routingHints: z.object({
        latencySensitive: z.boolean().default(false),
        costSensitive: z.boolean().default(false),
        accuracySensitive: z.boolean().default(false),
        fallbackModel: z.string().optional()
    }),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// MODEL ROUTING
// ============================================================================
export const RoutingRuleSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid().optional(),
    name: z.string(),
    description: z.string(),
    // Trigger conditions
    conditions: z.array(z.object({
        field: z.string(), // 'task', 'domain', 'tenant', 'latency', 'cost'
        operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
        value: z.any()
    })),
    // Action: route to model
    modelId: z.string().uuid(),
    priority: z.number().default(0),
    // Fallback
    fallbackModelId: z.string().uuid().optional(),
    active: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// MODEL INFERENCE LOG
// ============================================================================
export const InferenceLogSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    modelId: z.string().uuid(),
    // Request
    request: z.object({
        input: z.record(z.any()),
        parameters: z.record(z.any()).optional()
    }),
    // Response
    response: z.object({
        output: z.record(z.any()),
        tokensUsed: z.number().optional(),
        latencyMs: z.number()
    }),
    // Cost
    cost: z.number(),
    // Quality
    quality: z.object({
        confidence: z.number().optional(),
        userFeedback: z.number().min(1).max(5).optional()
    }).optional(),
    createdAt: z.date()
});
// ============================================================================
// PROMPT TEMPLATES
// ============================================================================
export const PromptTemplateSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid().optional(),
    name: z.string(),
    description: z.string(),
    // For which task
    task: z.string(), // 'customer_support', 'product_description', etc.
    modelType: z.nativeEnum(ModelType),
    // Template
    systemPrompt: z.string(),
    userPromptTemplate: z.string(),
    // Variables
    variables: z.array(z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean().default(true),
        defaultValue: z.string().optional()
    })),
    // Configuration
    config: z.object({
        temperature: z.number().optional(),
        maxTokens: z.number().optional()
    }),
    active: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
//# sourceMappingURL=index.js.map