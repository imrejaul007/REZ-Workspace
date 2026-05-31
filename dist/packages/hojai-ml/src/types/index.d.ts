import { z } from 'zod';
export declare enum ModelTier {
    GLOBAL = "global",// Shared, open models (GPT-4, Llama)
    VERTICAL = "vertical",// Industry-specific models
    TENANT = "tenant",// Tenant-specific fine-tuned
    PRIVILEGED = "privileged"
}
export declare enum ModelType {
    LANGUAGE = "language",
    EMBEDDING = "embedding",
    CHAT = "chat",
    PREDICTION = "prediction",
    CLASSIFICATION = "classification",
    REGRESSION = "regression",
    VISION = "vision",
    OCR = "ocr",
    SPEECH_TO_TEXT = "speech_to_text",
    TEXT_TO_SPEECH = "text_to_speech",
    RECOMMENDATION = "recommendation",
    FRAUD = "fraud",
    CHURN = "churn",
    LTV = "ltv",
    INTENT = "intent",
    SENTIMENT = "sentiment",
    NER = "ner"
}
export declare enum ModelStatus {
    TRAINING = "training",
    DEPLOYED = "deployed",
    ARCHIVED = "archived",
    DEPRECATED = "deprecated"
}
export declare const ModelSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodString;
    tier: z.ZodNativeEnum<typeof ModelTier>;
    type: z.ZodNativeEnum<typeof ModelType>;
    domain: z.ZodOptional<z.ZodString>;
    provider: z.ZodEnum<["openai", "anthropic", "meta", "google", "custom", "hojai"]>;
    baseModel: z.ZodOptional<z.ZodString>;
    config: z.ZodObject<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        frequencyPenalty: z.ZodOptional<z.ZodNumber>;
        presencePenalty: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        frequencyPenalty?: number | undefined;
        presencePenalty?: number | undefined;
    }, {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        frequencyPenalty?: number | undefined;
        presencePenalty?: number | undefined;
    }>;
    training: z.ZodOptional<z.ZodObject<{
        datasetSize: z.ZodOptional<z.ZodNumber>;
        fineTunedFrom: z.ZodOptional<z.ZodString>;
        trainingDate: z.ZodOptional<z.ZodDate>;
        epochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        datasetSize?: number | undefined;
        fineTunedFrom?: string | undefined;
        trainingDate?: Date | undefined;
        epochs?: number | undefined;
        learningRate?: number | undefined;
    }, {
        datasetSize?: number | undefined;
        fineTunedFrom?: string | undefined;
        trainingDate?: Date | undefined;
        epochs?: number | undefined;
        learningRate?: number | undefined;
    }>>;
    metrics: z.ZodOptional<z.ZodObject<{
        accuracy: z.ZodOptional<z.ZodNumber>;
        precision: z.ZodOptional<z.ZodNumber>;
        recall: z.ZodOptional<z.ZodNumber>;
        f1: z.ZodOptional<z.ZodNumber>;
        auc: z.ZodOptional<z.ZodNumber>;
        rmse: z.ZodOptional<z.ZodNumber>;
        latencyMs: z.ZodOptional<z.ZodNumber>;
        costPerCall: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        latencyMs?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
        costPerCall?: number | undefined;
    }, {
        latencyMs?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
        costPerCall?: number | undefined;
    }>>;
    capabilities: z.ZodArray<z.ZodString, "many">;
    inputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    accessControl: z.ZodObject<{
        tenantIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        requiresLicense: z.ZodDefault<z.ZodBoolean>;
        licenseKey: z.ZodOptional<z.ZodString>;
        maxCallsPerDay: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requiresLicense: boolean;
        tenantIds?: string[] | undefined;
        licenseKey?: string | undefined;
        maxCallsPerDay?: number | undefined;
    }, {
        tenantIds?: string[] | undefined;
        requiresLicense?: boolean | undefined;
        licenseKey?: string | undefined;
        maxCallsPerDay?: number | undefined;
    }>;
    costPerToken: z.ZodOptional<z.ZodNumber>;
    costPerCall: z.ZodOptional<z.ZodNumber>;
    status: z.ZodNativeEnum<typeof ModelStatus>;
    routingHints: z.ZodObject<{
        latencySensitive: z.ZodDefault<z.ZodBoolean>;
        costSensitive: z.ZodDefault<z.ZodBoolean>;
        accuracySensitive: z.ZodDefault<z.ZodBoolean>;
        fallbackModel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | undefined;
    }, {
        latencySensitive?: boolean | undefined;
        costSensitive?: boolean | undefined;
        accuracySensitive?: boolean | undefined;
        fallbackModel?: string | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    version: string;
    name: string;
    type: ModelType;
    status: ModelStatus;
    config: {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        frequencyPenalty?: number | undefined;
        presencePenalty?: number | undefined;
    };
    description: string;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
    tier: ModelTier;
    provider: "custom" | "hojai" | "openai" | "anthropic" | "meta" | "google";
    accessControl: {
        requiresLicense: boolean;
        tenantIds?: string[] | undefined;
        licenseKey?: string | undefined;
        maxCallsPerDay?: number | undefined;
    };
    routingHints: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | undefined;
    };
    training?: {
        datasetSize?: number | undefined;
        fineTunedFrom?: string | undefined;
        trainingDate?: Date | undefined;
        epochs?: number | undefined;
        learningRate?: number | undefined;
    } | undefined;
    tenantId?: string | undefined;
    inputSchema?: Record<string, any> | undefined;
    outputSchema?: Record<string, any> | undefined;
    metrics?: {
        latencyMs?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
        costPerCall?: number | undefined;
    } | undefined;
    domain?: string | undefined;
    baseModel?: string | undefined;
    costPerCall?: number | undefined;
    costPerToken?: number | undefined;
}, {
    id: string;
    version: string;
    name: string;
    type: ModelType;
    status: ModelStatus;
    config: {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        topP?: number | undefined;
        frequencyPenalty?: number | undefined;
        presencePenalty?: number | undefined;
    };
    description: string;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
    tier: ModelTier;
    provider: "custom" | "hojai" | "openai" | "anthropic" | "meta" | "google";
    accessControl: {
        tenantIds?: string[] | undefined;
        requiresLicense?: boolean | undefined;
        licenseKey?: string | undefined;
        maxCallsPerDay?: number | undefined;
    };
    routingHints: {
        latencySensitive?: boolean | undefined;
        costSensitive?: boolean | undefined;
        accuracySensitive?: boolean | undefined;
        fallbackModel?: string | undefined;
    };
    training?: {
        datasetSize?: number | undefined;
        fineTunedFrom?: string | undefined;
        trainingDate?: Date | undefined;
        epochs?: number | undefined;
        learningRate?: number | undefined;
    } | undefined;
    tenantId?: string | undefined;
    inputSchema?: Record<string, any> | undefined;
    outputSchema?: Record<string, any> | undefined;
    metrics?: {
        latencyMs?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
        costPerCall?: number | undefined;
    } | undefined;
    domain?: string | undefined;
    baseModel?: string | undefined;
    costPerCall?: number | undefined;
    costPerToken?: number | undefined;
}>;
export type Model = z.infer<typeof ModelSchema>;
export declare const RoutingRuleSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "contains", "greater_than", "less_than", "in"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }>, "many">;
    modelId: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    fallbackModelId: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    modelId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    priority: number;
    conditions: {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }[];
    tenantId?: string | undefined;
    fallbackModelId?: string | undefined;
}, {
    id: string;
    name: string;
    modelId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }[];
    active?: boolean | undefined;
    tenantId?: string | undefined;
    priority?: number | undefined;
    fallbackModelId?: string | undefined;
}>;
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;
export declare const InferenceLogSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    modelId: z.ZodString;
    request: z.ZodObject<{
        input: z.ZodRecord<z.ZodString, z.ZodAny>;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        input: Record<string, any>;
        parameters?: Record<string, any> | undefined;
    }, {
        input: Record<string, any>;
        parameters?: Record<string, any> | undefined;
    }>;
    response: z.ZodObject<{
        output: z.ZodRecord<z.ZodString, z.ZodAny>;
        tokensUsed: z.ZodOptional<z.ZodNumber>;
        latencyMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        output: Record<string, any>;
        latencyMs: number;
        tokensUsed?: number | undefined;
    }, {
        output: Record<string, any>;
        latencyMs: number;
        tokensUsed?: number | undefined;
    }>;
    cost: z.ZodNumber;
    quality: z.ZodOptional<z.ZodObject<{
        confidence: z.ZodOptional<z.ZodNumber>;
        userFeedback: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        confidence?: number | undefined;
        userFeedback?: number | undefined;
    }, {
        confidence?: number | undefined;
        userFeedback?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    response: {
        output: Record<string, any>;
        latencyMs: number;
        tokensUsed?: number | undefined;
    };
    modelId: string;
    request: {
        input: Record<string, any>;
        parameters?: Record<string, any> | undefined;
    };
    createdAt: Date;
    cost: number;
    quality?: {
        confidence?: number | undefined;
        userFeedback?: number | undefined;
    } | undefined;
}, {
    id: string;
    tenantId: string;
    response: {
        output: Record<string, any>;
        latencyMs: number;
        tokensUsed?: number | undefined;
    };
    modelId: string;
    request: {
        input: Record<string, any>;
        parameters?: Record<string, any> | undefined;
    };
    createdAt: Date;
    cost: number;
    quality?: {
        confidence?: number | undefined;
        userFeedback?: number | undefined;
    } | undefined;
}>;
export type InferenceLog = z.infer<typeof InferenceLogSchema>;
export declare const PromptTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    task: z.ZodString;
    modelType: z.ZodNativeEnum<typeof ModelType>;
    systemPrompt: z.ZodString;
    userPromptTemplate: z.ZodString;
    variables: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        required: boolean;
        defaultValue?: string | undefined;
    }, {
        name: string;
        type: string;
        required?: boolean | undefined;
        defaultValue?: string | undefined;
    }>, "many">;
    config: z.ZodObject<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
    }, {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
    }>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    config: {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
    };
    task: string;
    description: string;
    variables: {
        name: string;
        type: string;
        required: boolean;
        defaultValue?: string | undefined;
    }[];
    createdAt: Date;
    updatedAt: Date;
    modelType: ModelType;
    systemPrompt: string;
    userPromptTemplate: string;
    tenantId?: string | undefined;
}, {
    id: string;
    name: string;
    config: {
        temperature?: number | undefined;
        maxTokens?: number | undefined;
    };
    task: string;
    description: string;
    variables: {
        name: string;
        type: string;
        required?: boolean | undefined;
        defaultValue?: string | undefined;
    }[];
    createdAt: Date;
    updatedAt: Date;
    modelType: ModelType;
    systemPrompt: string;
    userPromptTemplate: string;
    active?: boolean | undefined;
    tenantId?: string | undefined;
}>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
//# sourceMappingURL=index.d.ts.map