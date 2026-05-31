/**
 * HOJAI LLM Providers - Core Types
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Type definitions for LLM provider abstraction layer
 */
/**
 * Supported message roles for LLM conversations
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';
/**
 * A single message in a conversation
 */
export interface Message {
    role: MessageRole;
    content: string;
    name?: string;
    functionCall?: FunctionCall;
}
/**
 * Function call from the model
 */
export interface FunctionCall {
    name: string;
    arguments: string;
}
/**
 * Interface for LLM provider adapters
 */
export interface LLMProvider {
    /** Provider name identifier */
    name: string;
    /** Provider type */
    type: 'openai' | 'anthropic' | 'custom';
    /** Default model for this provider */
    defaultModel: string;
    /** Supported models by this provider */
    supportedModels: string[];
    /**
     * Generate a chat completion
     */
    chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
    /**
     * Generate embeddings for text
     */
    embed(text: string, model?: string): Promise<number[]>;
    /**
     * Classify text into categories
     */
    classify(text: string, labels: string[], options?: ClassifyOptions): Promise<string>;
    /**
     * Check if the provider is available and configured
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get the cost per 1K tokens for a model
     */
    getCostInfo(): ProviderCostInfo;
}
/**
 * Chat completion options
 */
export interface ChatOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string | string[];
    frequencyPenalty?: number;
    presencePenalty?: number;
    functions?: FunctionDefinition[];
    functionCall?: string;
    stream?: boolean;
}
/**
 * Chat completion response
 */
export interface ChatResponse {
    content: string;
    role: 'assistant';
    finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
    usage?: TokenUsage;
    model: string;
    provider: string;
    raw?: unknown;
}
/**
 * Token usage information
 */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
/**
 * Embedding response
 */
export interface EmbeddingResponse {
    embedding: number[];
    model: string;
    provider: string;
    dimensions: number;
}
/**
 * Classification options
 */
export interface ClassifyOptions {
    temperature?: number;
    model?: string;
    instruction?: string;
    maxTokens?: number;
}
/**
 * Classification response
 */
export interface ClassificationResponse {
    label: string;
    confidence: number;
    allScores?: Record<string, number>;
    provider: string;
    model: string;
}
/**
 * Function definition for tool use
 */
export interface FunctionDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, FunctionParameter>;
        required?: string[];
    };
}
/**
 * Function parameter definition
 */
export interface FunctionParameter {
    type: string;
    description?: string;
    enum?: string[];
    items?: {
        type: string;
    };
    properties?: Record<string, FunctionParameter>;
    required?: string[];
}
/**
 * Supported provider types
 */
export type ProviderType = 'openai' | 'anthropic';
/**
 * Cost information for a provider
 */
export interface ProviderCostInfo {
    provider: string;
    inputCostPer1K: number;
    outputCostPer1K: number;
    currency: string;
    lastUpdated: string;
    models: ProviderModelCost[];
}
/**
 * Model-specific cost information
 */
export interface ProviderModelCost {
    model: string;
    inputCostPer1K: number;
    outputCostPer1K: number;
    contextWindow: number;
}
/**
 * Provider availability status
 */
export interface ProviderStatus {
    name: string;
    type: ProviderType;
    available: boolean;
    latencyMs?: number;
    error?: string;
    lastChecked: string;
}
/**
 * Available provider information for listing
 */
export interface ProviderInfo {
    name: string;
    type: ProviderType;
    defaultModel: string;
    supportedModels: string[];
    isAvailable: boolean;
    costInfo: ProviderCostInfo;
}
/**
 * Task type for automatic provider selection
 */
export type TaskType = 'chat' | 'analysis' | 'classification' | 'embedding' | 'reasoning' | 'creative' | 'code' | 'summarization' | 'extraction' | 'general';
/**
 * Routing configuration for a task type
 */
export interface TaskRouting {
    preferredProvider: ProviderType;
    preferredModel: string;
    fallbackProvider?: ProviderType;
    fallbackModel?: string;
    temperature?: number;
    maxTokens?: number;
}
/**
 * Router configuration
 */
export interface RouterConfig {
    defaultProvider: ProviderType;
    taskRouting: Record<TaskType, TaskRouting>;
    enableFallback: boolean;
    enableCostOptimization: boolean;
}
/**
 * Analyze a request to determine the best task type
 */
export interface TaskAnalyzer {
    analyzeTask(messages: Message[]): TaskType;
}
/**
 * LLM Router interface for API routes
 */
export interface LLMRouter {
    chat(messages: Message[], options?: ChatOptions & {
        provider?: ProviderType;
        taskType?: TaskType;
    }): Promise<ChatResponse>;
    embed(text: string, providerType?: ProviderType): Promise<number[]>;
    classify(text: string, labels: string[], providerType?: ProviderType): Promise<string>;
    getProviders(): Promise<ProviderInfo[]>;
    getProviderStatuses(): Promise<ProviderStatus[]>;
    getConfig(): RouterConfig;
}
/**
 * Chat API request
 */
export interface ChatRequest {
    provider?: ProviderType;
    messages: Message[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string | string[];
    frequencyPenalty?: number;
    presencePenalty?: number;
    functions?: FunctionDefinition[];
    functionCall?: string;
    taskType?: TaskType;
}
/**
 * Chat API response
 */
export interface ChatResponseDTO {
    success: boolean;
    data?: {
        content: string;
        role: 'assistant';
        finishReason: string;
        usage?: TokenUsage;
        model: string;
        provider: string;
    };
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        requestId: string;
        timestamp: string;
        durationMs: number;
    };
}
/**
 * Embed API request
 */
export interface EmbedRequest {
    provider?: ProviderType;
    text: string | string[];
    model?: string;
}
/**
 * Embed API response
 */
export interface EmbedResponseDTO {
    success: boolean;
    data?: {
        embeddings: number[][];
        model: string;
        provider: string;
        dimensions: number;
    };
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        requestId: string;
        timestamp: string;
        durationMs: number;
    };
}
/**
 * Classify API request
 */
export interface ClassifyRequest {
    provider?: ProviderType;
    text: string;
    labels: string[];
    temperature?: number;
    model?: string;
    instruction?: string;
}
/**
 * Classify API response
 */
export interface ClassifyResponseDTO {
    success: boolean;
    data?: {
        label: string;
        confidence: number;
        allScores?: Record<string, number>;
        provider: string;
        model: string;
    };
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        requestId: string;
        timestamp: string;
        durationMs: number;
    };
}
/**
 * Providers list response
 */
export interface ProvidersResponseDTO {
    success: boolean;
    data?: {
        providers: ProviderInfo[];
        defaultProvider: ProviderType;
        taskRouting: Record<TaskType, TaskRouting>;
    };
    meta: {
        requestId: string;
        timestamp: string;
    };
}
/**
 * Custom error class for LLM provider errors
 */
export declare class LLMProviderError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly provider?: string;
    readonly model?: string;
    readonly retryable: boolean;
    constructor(message: string, code: string, statusCode: number, provider?: string, model?: string, retryable?: boolean);
}
/**
 * Error codes for LLM provider errors
 */
export declare const LLMErrorCodes: {
    readonly PROVIDER_NOT_AVAILABLE: "PROVIDER_NOT_AVAILABLE";
    readonly MODEL_NOT_FOUND: "MODEL_NOT_FOUND";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly CONTEXT_LENGTH_EXCEEDED: "CONTEXT_LENGTH_EXCEEDED";
    readonly CONTENT_FILTERED: "CONTENT_FILTERED";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED";
    readonly INSUFFICIENT_QUOTA: "INSUFFICIENT_QUOTA";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
/**
 * Default task routing configuration
 */
export declare const DEFAULT_TASK_ROUTING: Record<TaskType, TaskRouting>;
/**
 * Default router configuration
 */
export declare const DEFAULT_ROUTER_CONFIG: RouterConfig;
//# sourceMappingURL=index.d.ts.map