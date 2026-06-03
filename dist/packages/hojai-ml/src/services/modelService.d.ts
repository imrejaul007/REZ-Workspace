import mongoose from 'mongoose';
import { Model as ModelType, ModelTier, ModelStatus, RoutingRule, PromptTemplate } from '../types/index.js';
export declare const ModelModel: mongoose.Model<{
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    type: any;
    status: ModelStatus;
    version: string;
    capabilities: string[];
    tier: ModelTier;
    provider: "anthropic" | "openai" | "google" | "hojai" | "custom" | "meta";
    metrics?: {
        recall?: number | null | undefined;
        accuracy?: number | null | undefined;
        latencyMs?: number | null | undefined;
        precision?: number | null | undefined;
        f1?: number | null | undefined;
        auc?: number | null | undefined;
        rmse?: number | null | undefined;
        costPerCall?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    training?: {
        datasetSize?: number | null | undefined;
        fineTunedFrom?: string | null | undefined;
        trainingDate?: NativeDate | null | undefined;
        epochs?: number | null | undefined;
        learningRate?: number | null | undefined;
    } | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
        topP?: number | null | undefined;
        frequencyPenalty?: number | null | undefined;
        presencePenalty?: number | null | undefined;
    } | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    domain?: string | null | undefined;
    baseModel?: string | null | undefined;
    costPerCall?: number | null | undefined;
    accessControl?: {
        tenantIds: string[];
        requiresLicense: boolean;
        licenseKey?: string | null | undefined;
        maxCallsPerDay?: number | null | undefined;
    } | null | undefined;
    costPerToken?: number | null | undefined;
    routingHints?: {
        latencySensitive: boolean;
        costSensitive: boolean;
        accuracySensitive: boolean;
        fallbackModel?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const RoutingRuleModel: mongoose.Model<{
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    active: boolean;
    priority: number;
    modelId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    fallbackModelId?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const PromptTemplateModel: mongoose.Model<{
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    task: string;
    active: boolean;
    variables: string[];
    systemPrompt: string;
    modelType: any;
    userPromptTemplate: string;
    description?: string | null | undefined;
    tenantId?: string | null | undefined;
    config?: {
        temperature?: number | null | undefined;
        maxTokens?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class ModelService {
    private redis;
    constructor();
    /**
     * Register a model
     */
    registerModel(params: Omit<ModelType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelType>;
    /**
     * Get best model for a task
     */
    getBestModel(params: {
        tenantId: string;
        task: string;
        domain?: string;
        constraints?: {
            maxLatencyMs?: number;
            maxCost?: number;
            minAccuracy?: number;
        };
    }): Promise<ModelType | null>;
    private evaluateConditions;
    /**
     * Execute inference
     */
    infer(params: {
        tenantId: string;
        modelId: string;
        input: Record<string, any>;
        parameters?: Record<string, any>;
    }): Promise<{
        output: any;
        tokens?: number;
        latencyMs: number;
        cost: number;
    }>;
    private callOpenAI;
    private callCustomModel;
    /**
     * Create routing rule
     */
    createRoutingRule(rule: Omit<RoutingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoutingRule>;
    /**
     * Create prompt template
     */
    createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate>;
    /**
     * Render prompt from template
     */
    renderPrompt(template: PromptTemplate, variables: Record<string, any>): {
        system: string;
        user: string;
    };
    /**
     * Get available models for tenant
     */
    getAvailableModels(tenantId: string, tier?: ModelTier): Promise<ModelType[]>;
    /**
     * Get cost estimate
     */
    getCostEstimate(tenantId: string, task: string, estimatedTokens?: number): Promise<{
        perCall: number;
        monthlyEstimate: number;
    }>;
}
export declare const modelService: ModelService;
//# sourceMappingURL=modelService.d.ts.map