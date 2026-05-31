"use strict";
/**
 * Hojai LLM Adapter - Model Router
 *
 * Routes requests to appropriate LLM model based on task type
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = exports.DEFAULT_ROUTING_RULES = void 0;
exports.createModelRouter = createModelRouter;
exports.getModelContextWindow = getModelContextWindow;
exports.fitsInContext = fitsInContext;
const index_js_1 = require("./types/index.js");
// ============================================================================
// MODEL ROUTING RULES
// ============================================================================
/**
 * Default routing rules for different task types
 */
exports.DEFAULT_ROUTING_RULES = [
    // Complex reasoning tasks - use Claude Sonnet for better reasoning
    {
        taskType: index_js_1.TaskType.REASONING,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 4096,
        temperature: 0.3
    },
    // Creative tasks - balanced between creativity and coherence
    {
        taskType: index_js_1.TaskType.CREATIVE,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 2048,
        temperature: 0.9
    },
    // Classification tasks - need consistency
    {
        taskType: index_js_1.TaskType.CLASSIFICATION,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 512,
        temperature: 0.1
    },
    // Extraction tasks - need precision
    {
        taskType: index_js_1.TaskType.EXTRACTION,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4_TURBO },
        maxTokens: 1024,
        temperature: 0.1
    },
    // Summarization - balanced
    {
        taskType: index_js_1.TaskType.SUMMARIZATION,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 1024,
        temperature: 0.4
    },
    // Conversation - natural, engaging
    {
        taskType: index_js_1.TaskType.CONVERSATION,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 2048,
        temperature: 0.7
    },
    // Code tasks - use Sonnet for better code understanding
    {
        taskType: index_js_1.TaskType.CODE,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4O },
        maxTokens: 4096,
        temperature: 0.2
    },
    // Document analysis - thorough
    {
        taskType: index_js_1.TaskType.DOCUMENT,
        primary: { provider: index_js_1.LLMProvider.CLAUDE, model: index_js_1.ClaudeModel.CLAUDE_3_5_SONNET },
        fallback: { provider: index_js_1.LLMProvider.OPENAI, model: index_js_1.OpenAIModel.GPT_4_TURBO },
        maxTokens: 2048,
        temperature: 0.3
    }
];
class ModelRouter {
    rules;
    config;
    logger;
    constructor(config = {}, logger) {
        this.config = {
            rules: config.rules || exports.DEFAULT_ROUTING_RULES,
            defaultProvider: config.defaultProvider || index_js_1.LLMProvider.CLAUDE,
            defaultModel: config.defaultModel || index_js_1.ClaudeModel.CLAUDE_3_5_SONNET,
            enableFallback: config.enableFallback ?? true,
            costOptimization: config.costOptimization ?? false
        };
        this.rules = new Map();
        for (const rule of this.config.rules) {
            this.rules.set(rule.taskType, rule);
        }
        this.logger = logger || console;
    }
    /**
     * Get the best model configuration for a task type
     */
    getModelConfig(taskType) {
        const rule = this.rules.get(taskType);
        if (!rule) {
            this.logger.warn(`[ModelRouter] No rule for task type ${taskType}, using defaults`);
            return {
                provider: this.config.defaultProvider,
                model: this.config.defaultModel,
                maxTokens: 2048,
                temperature: 0.7
            };
        }
        // Cost optimization: prefer faster/cheaper models for simple tasks
        if (this.config.costOptimization && taskType === index_js_1.TaskType.CLASSIFICATION) {
            return {
                provider: index_js_1.LLMProvider.OPENAI,
                model: index_js_1.OpenAIModel.GPT_35_TURBO,
                maxTokens: rule.maxTokens || 512,
                temperature: rule.temperature || 0.1
            };
        }
        return {
            provider: rule.primary.provider,
            model: rule.primary.model,
            maxTokens: rule.maxTokens || 2048,
            temperature: rule.temperature || 0.7
        };
    }
    /**
     * Get the fallback model configuration
     */
    getFallbackConfig(taskType) {
        if (!this.config.enableFallback) {
            return null;
        }
        const rule = this.rules.get(taskType);
        if (!rule?.fallback) {
            // Use default fallback
            return {
                provider: index_js_1.LLMProvider.OPENAI,
                model: index_js_1.OpenAIModel.GPT_4O,
                maxTokens: 2048,
                temperature: 0.7
            };
        }
        return {
            provider: rule.fallback.provider,
            model: rule.fallback.model,
            maxTokens: rule.maxTokens || 2048,
            temperature: rule.temperature || 0.7
        };
    }
    /**
     * Determine task type from query content
     */
    inferTaskType(query, context) {
        const lowerQuery = query.toLowerCase();
        // Check explicit indicators
        if (context?.hasCode ||
            lowerQuery.includes('code') ||
            lowerQuery.includes('function') ||
            lowerQuery.includes('api') ||
            lowerQuery.includes('implement')) {
            return index_js_1.TaskType.CODE;
        }
        if (context?.hasClassification ||
            lowerQuery.includes('classify') ||
            lowerQuery.includes('categorize') ||
            lowerQuery.includes('is this') ||
            lowerQuery.includes('is it') ||
            lowerQuery.includes('spam')) {
            return index_js_1.TaskType.CLASSIFICATION;
        }
        if (context?.hasCreative ||
            lowerQuery.includes('write') ||
            lowerQuery.includes('create') ||
            lowerQuery.includes('generate') ||
            lowerQuery.includes('story') ||
            lowerQuery.includes('brainstorm')) {
            return index_js_1.TaskType.CREATIVE;
        }
        if (lowerQuery.includes('summarize') ||
            lowerQuery.includes('summary') ||
            lowerQuery.includes('tl;dr')) {
            return index_js_1.TaskType.SUMMARIZATION;
        }
        if (lowerQuery.includes('extract') ||
            lowerQuery.includes('find all') ||
            lowerQuery.includes('identify')) {
            return index_js_1.TaskType.EXTRACTION;
        }
        if (lowerQuery.includes('analyze') ||
            lowerQuery.includes('reasoning') ||
            lowerQuery.includes('why') ||
            lowerQuery.includes('how would') ||
            lowerQuery.includes('think about')) {
            return index_js_1.TaskType.REASONING;
        }
        if (lowerQuery.includes('document') ||
            lowerQuery.includes('email') ||
            lowerQuery.includes('contract') ||
            lowerQuery.includes('invoice')) {
            return index_js_1.TaskType.DOCUMENT;
        }
        // Default to conversation for multi-turn
        if ((context?.messageCount || 0) > 1) {
            return index_js_1.TaskType.CONVERSATION;
        }
        return index_js_1.TaskType.REASONING;
    }
    /**
     * Add or update a routing rule
     */
    addRule(rule) {
        this.rules.set(rule.taskType, rule);
    }
    /**
     * Remove a routing rule
     */
    removeRule(taskType) {
        return this.rules.delete(taskType);
    }
    /**
     * Get all routing rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Estimate cost for a request
     */
    estimateCost(taskType, inputTokens, outputTokens) {
        const config = this.getModelConfig(taskType);
        // Approximate pricing (per 1M tokens, in cents)
        const pricing = {
            [index_js_1.ClaudeModel.CLAUDE_3_5_SONNET]: { input: 3, output: 15 },
            [index_js_1.ClaudeModel.CLAUDE_3_5_HAIKU]: { input: 0.8, output: 4 },
            [index_js_1.OpenAIModel.GPT_4O]: { input: 5, output: 15 },
            [index_js_1.OpenAIModel.GPT_4_TURBO]: { input: 10, output: 30 },
            [index_js_1.OpenAIModel.GPT_35_TURBO]: { input: 0.5, output: 1.5 }
        };
        const rates = pricing[config.model] || { input: 3, output: 15 };
        const estimatedCents = (inputTokens / 1000000) * rates.input +
            (outputTokens / 1000000) * rates.output;
        return {
            provider: config.provider,
            estimatedCents: Math.round(estimatedCents * 100) / 100
        };
    }
}
exports.ModelRouter = ModelRouter;
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a model router with default configuration
 */
function createModelRouter(config, logger) {
    return new ModelRouter(config, logger);
}
/**
 * Get model context window size
 */
function getModelContextWindow(model) {
    const contextWindows = {
        [index_js_1.ClaudeModel.CLAUDE_3_5_SONNET]: 200000,
        [index_js_1.ClaudeModel.CLAUDE_3_5_HAIKU]: 200000,
        [index_js_1.ClaudeModel.CLAUDE_3_OPUS]: 200000,
        [index_js_1.ClaudeModel.CLAUDE_3_SONNET]: 200000,
        [index_js_1.ClaudeModel.CLAUDE_3_HAIKU]: 200000,
        [index_js_1.OpenAIModel.GPT_4O]: 128000,
        [index_js_1.OpenAIModel.GPT_4_TURBO]: 128000,
        [index_js_1.OpenAIModel.GPT_4]: 8192,
        [index_js_1.OpenAIModel.GPT_35_TURBO]: 16385
    };
    return contextWindows[model] || 4096;
}
/**
 * Check if input fits in context window
 */
function fitsInContext(model, inputTokens, reservedOutputTokens = 1000) {
    const contextWindow = getModelContextWindow(model);
    return inputTokens + reservedOutputTokens <= contextWindow;
}
//# sourceMappingURL=modelRouter.js.map