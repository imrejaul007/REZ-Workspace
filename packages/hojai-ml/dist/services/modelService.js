"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelService = exports.ModelService = exports.PromptTemplateModel = exports.RoutingRuleModel = exports.ModelModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
// ============================================================================
// MODELS
// ============================================================================
const ModelSchema = new mongoose_1.Schema({
    tenantId: { type: String, sparse: true, index: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: String,
    tier: { type: String, enum: Object.values(index_js_1.ModelTier), required: true },
    type: { type: String, enum: Object.values(index_js_1.Model), required: true },
    domain: String,
    provider: { type: String, enum: ['openai', 'anthropic', 'meta', 'google', 'custom', 'hojai'], required: true },
    baseModel: String,
    config: {
        temperature: Number,
        maxTokens: Number,
        topP: Number,
        frequencyPenalty: Number,
        presencePenalty: Number
    },
    training: {
        datasetSize: Number,
        fineTunedFrom: String,
        trainingDate: Date,
        epochs: Number,
        learningRate: Number
    },
    metrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1: Number,
        auc: Number,
        rmse: Number,
        latencyMs: Number,
        costPerCall: Number
    },
    capabilities: [String],
    inputSchema: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    outputSchema: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    accessControl: {
        tenantIds: [String],
        requiresLicense: { type: Boolean, default: false },
        licenseKey: String,
        maxCallsPerDay: Number
    },
    costPerToken: Number,
    costPerCall: Number,
    status: { type: String, enum: Object.values(index_js_1.ModelStatus), default: index_js_1.ModelStatus.DEPLOYED },
    routingHints: {
        latencySensitive: { type: Boolean, default: false },
        costSensitive: { type: Boolean, default: false },
        accuracySensitive: { type: Boolean, default: false },
        fallbackModel: String
    }
}, { timestamps: true });
ModelSchema.index({ tier: 1, type: 1, status: 1 });
ModelSchema.index({ tenantId: 1, tier: 1 });
exports.ModelModel = mongoose_1.default.model('Model', ModelSchema);
// ============================================================================
// ROUTING RULES
// ============================================================================
const RoutingRuleSchema = new mongoose_1.Schema({
    tenantId: { type: String, sparse: true, index: true },
    name: { type: String, required: true },
    description: String,
    conditions: [{
            field: String,
            operator: String,
            value: mongoose_1.Schema.Types.Mixed
        }],
    modelId: { type: String, required: true },
    priority: { type: Number, default: 0 },
    fallbackModelId: String,
    active: { type: Boolean, default: true }
}, { timestamps: true });
RoutingRuleSchema.index({ tenantId: 1, priority: -1 });
exports.RoutingRuleModel = mongoose_1.default.model('RoutingRule', RoutingRuleSchema);
// ============================================================================
// PROMPT TEMPLATES
// ============================================================================
const PromptTemplateSchema = new mongoose_1.Schema({
    tenantId: { type: String, sparse: true, index: true },
    name: { type: String, required: true },
    description: String,
    task: { type: String, required: true },
    modelType: { type: String, enum: Object.values(index_js_1.Model), required: true },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String, required: true },
    variables: [{
            name: String,
            type: String,
            required: { type: Boolean, default: true },
            defaultValue: String
        }],
    config: {
        temperature: Number,
        maxTokens: Number
    },
    active: { type: Boolean, default: true }
}, { timestamps: true });
exports.PromptTemplateModel = mongoose_1.default.model('PromptTemplate', PromptTemplateSchema);
// ============================================================================
// MODEL SERVICE
// ============================================================================
class ModelService {
    redis;
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    /**
     * Register a model
     */
    async registerModel(params) {
        const model = new exports.ModelModel({ ...params, id: (0, uuid_1.v4)() });
        await model.save();
        return model.toObject();
    }
    /**
     * Get best model for a task
     */
    async getBestModel(params) {
        const { tenantId, task, domain, constraints } = params;
        // Check cache first
        const cacheKey = `model:${tenantId}:${task}:${domain || 'any'}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // Get routing rules for this tenant
        const rules = await exports.RoutingRuleModel.find({
            tenantId: { $in: [tenantId, null] }, // Include global rules
            active: true
        }).sort({ priority: -1 });
        // Find matching rule
        for (const rule of rules) {
            const matches = this.evaluateConditions(rule.conditions, params);
            if (matches) {
                const model = await exports.ModelModel.findOne({ _id: rule.modelId, status: index_js_1.ModelStatus.DEPLOYED });
                if (model) {
                    const result = model.toObject();
                    await this.redis.setex(cacheKey, 300, JSON.stringify(result)); // Cache 5 minutes
                    return result;
                }
            }
        }
        // Fallback: find best available model
        const query = {
            tier: { $in: [index_js_1.ModelTier.GLOBAL, index_js_1.ModelTier.VERTICAL] },
            status: index_js_1.ModelStatus.DEPLOYED
        };
        if (domain) {
            query.domain = domain;
        }
        const models = await exports.ModelModel.find(query).sort({ 'metrics.accuracy': -1 }).limit(1);
        if (models.length > 0) {
            return models[0].toObject();
        }
        return null;
    }
    evaluateConditions(conditions, params) {
        for (const cond of conditions) {
            const value = params[cond.field];
            switch (cond.operator) {
                case 'equals':
                    if (value !== cond.value)
                        return false;
                    break;
                case 'contains':
                    if (!String(value).includes(cond.value))
                        return false;
                    break;
                case 'in':
                    if (!cond.value.includes(value))
                        return false;
                    break;
                case 'greater_than':
                    if (value <= cond.value)
                        return false;
                    break;
                case 'less_than':
                    if (value >= cond.value)
                        return false;
                    break;
            }
        }
        return true;
    }
    /**
     * Execute inference
     */
    async infer(params) {
        const { tenantId, modelId, input, parameters } = params;
        const model = await exports.ModelModel.findById(modelId);
        if (!model)
            throw new Error('Model not found');
        const startTime = Date.now();
        let output;
        let tokensUsed;
        let cost;
        switch (model.provider) {
            case 'openai':
                const openaiResult = await this.callOpenAI(model, input, parameters);
                output = openaiResult.output;
                tokensUsed = openaiResult.tokens;
                cost = (tokensUsed || 0) * (model.costPerToken || 0.0001);
                break;
            case 'custom':
            case 'hojai':
                // Call custom model endpoint
                output = await this.callCustomModel(model, input);
                cost = model.costPerCall || 0;
                break;
            default:
                throw new Error(`Provider ${model.provider} not supported`);
        }
        const latencyMs = Date.now() - startTime;
        // Update model metrics (rolling average)
        await exports.ModelModel.updateOne({ _id: modelId }, {
            $set: { 'metrics.latencyMs': latencyMs }
        });
        return { output, tokens: tokensUsed, latencyMs, cost };
    }
    async callOpenAI(model, input, params) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            // Mock for development
            return { output: { response: 'Mock response' }, tokens: 100 };
        }
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model: model.baseModel || 'gpt-4',
            messages: input.messages || [{ role: 'user', content: input.text }],
            temperature: params?.temperature || model.config?.temperature || 0.7,
            max_tokens: params?.maxTokens || model.config?.maxTokens || 1000
        }, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        return {
            output: { response: response.data.choices[0].message.content },
            tokens: response.data.usage.total_tokens
        };
    }
    async callCustomModel(model, input) {
        // Call internal model service
        const response = await axios_1.default.post(model.config.endpoint, input, {
            timeout: 30000
        });
        return response.data;
    }
    /**
     * Create routing rule
     */
    async createRoutingRule(rule) {
        const doc = new exports.RoutingRuleModel({ ...rule, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    /**
     * Create prompt template
     */
    async createPromptTemplate(template) {
        const doc = new exports.PromptTemplateModel({ ...template, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    /**
     * Render prompt from template
     */
    renderPrompt(template, variables) {
        let userPrompt = template.userPromptTemplate;
        for (const variable of template.variables) {
            const value = variables[variable.name] || variable.defaultValue;
            if (variable.required && !value) {
                throw new Error(`Missing required variable: ${variable.name}`);
            }
            userPrompt = userPrompt.replace(`{{${variable.name}}}`, String(value));
        }
        return {
            system: template.systemPrompt,
            user: userPrompt
        };
    }
    /**
     * Get available models for tenant
     */
    async getAvailableModels(tenantId, tier) {
        const query = {
            status: index_js_1.ModelStatus.DEPLOYED,
            $or: [
                { tenantId: null }, // Global models
                { tenantId }, // Tenant's own models
                { 'accessControl.tenantIds': tenantId } // Licensed models
            ]
        };
        if (tier)
            query.tier = tier;
        const models = await exports.ModelModel.find(query);
        return models.map(m => m.toObject());
    }
    /**
     * Get cost estimate
     */
    async getCostEstimate(tenantId, task, estimatedTokens) {
        const model = await this.getBestModel({ tenantId, task });
        if (!model) {
            return { perCall: 0, monthlyEstimate: 0 };
        }
        const perCall = model.costPerCall || (model.costPerToken || 0) * (estimatedTokens || 1000);
        const monthlyEstimate = perCall * 1000 * 30; // Assume 1000 calls/day
        return { perCall, monthlyEstimate };
    }
}
exports.ModelService = ModelService;
exports.modelService = new ModelService();
