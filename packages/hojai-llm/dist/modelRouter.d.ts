/**
 * Hojai LLM Adapter - Model Router
 *
 * Routes requests to appropriate LLM model based on task type
 */
import { LLMProvider, TaskType, ModelConfig, ModelRoutingRule } from './types/index.js';
/**
 * Default routing rules for different task types
 */
export declare const DEFAULT_ROUTING_RULES: ModelRoutingRule[];
export interface ModelRouterConfig {
    rules?: ModelRoutingRule[];
    defaultProvider?: LLMProvider;
    defaultModel?: string;
    enableFallback?: boolean;
    costOptimization?: boolean;
}
export declare class ModelRouter {
    private rules;
    private config;
    private readonly logger;
    constructor(config?: ModelRouterConfig, logger?: Console);
    /**
     * Get the best model configuration for a task type
     */
    getModelConfig(taskType: TaskType): ModelConfig;
    /**
     * Get the fallback model configuration
     */
    getFallbackConfig(taskType: TaskType): ModelConfig | null;
    /**
     * Determine task type from query content
     */
    inferTaskType(query: string, context?: {
        hasCode?: boolean;
        hasClassification?: boolean;
        hasCreative?: boolean;
        messageCount?: number;
    }): TaskType;
    /**
     * Add or update a routing rule
     */
    addRule(rule: ModelRoutingRule): void;
    /**
     * Remove a routing rule
     */
    removeRule(taskType: TaskType): boolean;
    /**
     * Get all routing rules
     */
    getRules(): ModelRoutingRule[];
    /**
     * Estimate cost for a request
     */
    estimateCost(taskType: TaskType, inputTokens: number, outputTokens: number): {
        provider: string;
        estimatedCents: number;
    };
}
/**
 * Create a model router with default configuration
 */
export declare function createModelRouter(config?: ModelRouterConfig, logger?: Console): ModelRouter;
/**
 * Get model context window size
 */
export declare function getModelContextWindow(model: string): number;
/**
 * Check if input fits in context window
 */
export declare function fitsInContext(model: string, inputTokens: number, reservedOutputTokens?: number): boolean;
//# sourceMappingURL=modelRouter.d.ts.map