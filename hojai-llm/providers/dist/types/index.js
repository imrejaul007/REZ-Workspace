/**
 * HOJAI LLM Providers - Core Types
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Type definitions for LLM provider abstraction layer
 */
// ============================================================================
// Error Types
// ============================================================================
/**
 * Custom error class for LLM provider errors
 */
export class LLMProviderError extends Error {
    code;
    statusCode;
    provider;
    model;
    retryable;
    constructor(message, code, statusCode, provider, model, retryable = false) {
        super(message);
        this.name = 'LLMProviderError';
        this.code = code;
        this.statusCode = statusCode;
        this.provider = provider;
        this.model = model;
        this.retryable = retryable;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Error codes for LLM provider errors
 */
export const LLMErrorCodes = {
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    CONTEXT_LENGTH_EXCEEDED: 'CONTEXT_LENGTH_EXCEEDED',
    CONTENT_FILTERED: 'CONTENT_FILTERED',
    INVALID_REQUEST: 'INVALID_REQUEST',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
// ============================================================================
// Constants
// ============================================================================
/**
 * Default task routing configuration
 */
export const DEFAULT_TASK_ROUTING = {
    chat: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o-mini',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-haiku-20241022',
        temperature: 0.7,
        maxTokens: 4096,
    },
    analysis: {
        preferredProvider: 'anthropic',
        preferredModel: 'claude-3-5-sonnet-20241022',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 8192,
    },
    classification: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o-mini',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-haiku-20241022',
        temperature: 0.1,
        maxTokens: 512,
    },
    embedding: {
        preferredProvider: 'openai',
        preferredModel: 'text-embedding-3-small',
        temperature: 0,
        maxTokens: 8191,
    },
    reasoning: {
        preferredProvider: 'anthropic',
        preferredModel: 'claude-3-5-sonnet-20241022',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 16384,
    },
    creative: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-sonnet-20241022',
        temperature: 0.9,
        maxTokens: 8192,
    },
    code: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        maxTokens: 16384,
    },
    summarization: {
        preferredProvider: 'anthropic',
        preferredModel: 'claude-3-5-haiku-20241022',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 4096,
    },
    extraction: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o-mini',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-haiku-20241022',
        temperature: 0.1,
        maxTokens: 4096,
    },
    general: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o-mini',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-5-haiku-20241022',
        temperature: 0.7,
        maxTokens: 4096,
    },
};
/**
 * Default router configuration
 */
export const DEFAULT_ROUTER_CONFIG = {
    defaultProvider: 'openai',
    taskRouting: DEFAULT_TASK_ROUTING,
    enableFallback: true,
    enableCostOptimization: true,
};
//# sourceMappingURL=index.js.map