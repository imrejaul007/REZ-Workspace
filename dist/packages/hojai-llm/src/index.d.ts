/**
 * Hojai LLM Adapter
 *
 * A unified adapter for connecting AI employees to Claude and OpenAI
 *
 * @example
 * ```typescript
 * import {
 *   createClaudeAdapter,
 *   createOpenAIAdapter,
 *   createModelRouter,
 *   createContextBuilder,
 *   UnifiedLLMClient
 * } from '@hojai/llm';
 *
 * // Create adapters
 * const claude = createClaudeAdapter({ apiKey: process.env.ANTHROPIC_API_KEY! });
 * const openai = createOpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! });
 *
 * // Create router and context builder
 * const router = createModelRouter();
 * const contextBuilder = createContextBuilder();
 *
 * // Create unified client
 * const client = new UnifiedLLMClient({
 *   claude,
 *   openai,
 *   router,
 *   contextBuilder
 * });
 *
 * // Use the client
 * const response = await client.chat({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   employeeContext: { id, tenantId, name, role }
 * });
 * ```
 */
export { LLMProvider, ClaudeModel, OpenAIModel, TaskType, MessageRole, EmployeeRole, type ChatMessage, type StreamingChunk, type TokenUsage, type LLMRequestOptions, type LLMResponse, type EmployeeCapability, type EmployeeKnowledge, type EmployeeMemory, type EmployeeContext, type ModelConfig, type ModelRoutingRule, type QueryAnalysisRequest, type QueryAnalysisResponse, type DocumentAnalysisRequest, type DocumentAnalysisResponse, type TextGenerationRequest, type TextGenerationResponse } from './types/index.js';
export { LLMRequestOptionsSchema, EmployeeContextSchema, ModelConfigSchema, ChatMessageSchema } from './types/index.js';
export { LLMError, AuthenticationError, RateLimitError, TokenLimitError, ModelNotFoundError, ContextWindowError, InvalidRequestError, EmptyResponseError, ResponseParseError, StreamingError, TimeoutError, RetryExhaustedError, ProviderUnavailableError, ConfigurationError, isRetryableError, getErrorMessage, withErrorHandling, retryWithBackoff, sleep } from './errors.js';
export { ClaudeAdapter, createClaudeAdapter, type ClaudeAdapterConfig } from './claudeAdapter.js';
export { OpenAIAdapter, createOpenAIAdapter, type OpenAIAdapterConfig } from './openaiAdapter.js';
export { ModelRouter, createModelRouter, DEFAULT_ROUTING_RULES, getModelContextWindow, fitsInContext, type ModelRouterConfig } from './modelRouter.js';
export { ContextBuilder, createContextBuilder, buildSalesContext, buildSupportContext, buildAnalystContext, type ContextBuilderOptions, type BuiltContext } from './contextBuilder.js';
export { promptTemplates } from './promptTemplates.js';
import { ClaudeAdapter, createClaudeAdapter } from './claudeAdapter.js';
import { OpenAIAdapter, createOpenAIAdapter } from './openaiAdapter.js';
import { ModelRouter, createModelRouter } from './modelRouter.js';
import { ContextBuilder, createContextBuilder, buildSalesContext, buildSupportContext, buildAnalystContext } from './contextBuilder.js';
import { LLMResponse, EmployeeContext, ChatMessage, TaskType } from './types/index.js';
/**
 * Unified LLM client configuration
 */
export interface UnifiedLLMClientConfig {
    claude: ClaudeAdapter;
    openai: OpenAIAdapter;
    router: ModelRouter;
    contextBuilder: ContextBuilder;
    maxRetries?: number;
}
/**
 * Chat request with employee context
 */
export interface EmployeeChatRequest {
    messages: ChatMessage[];
    employee: EmployeeContext;
    taskType?: TaskType;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}
/**
 * Unified LLM client that routes to appropriate provider
 */
export declare class UnifiedLLMClient {
    private config;
    private readonly logger;
    constructor(config: UnifiedLLMClientConfig, logger?: Console);
    /**
     * Send a chat request with employee context
     */
    chat(request: EmployeeChatRequest): Promise<LLMResponse>;
    /**
     * Generate text with simple prompt
     */
    generateText(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<LLMResponse>;
    /**
     * Analyze a document
     */
    analyzeDocument(content: string, documentType: string, employee?: EmployeeContext, options?: {
        extractFields?: string[];
        summaryLength?: 'short' | 'medium' | 'long';
    }): Promise<LLMResponse>;
    /**
     * Analyze a query
     */
    analyzeQuery(query: string, context?: {
        recentConversations?: ChatMessage[];
        relevantFacts?: string[];
        userIntent?: string;
    }): Promise<LLMResponse>;
    /**
     * Stream a chat response
     */
    streamChat(request: EmployeeChatRequest): AsyncGenerator<string, void, unknown>;
    /**
     * Get health status of all providers
     */
    getHealthStatus(): Promise<{
        claude: boolean;
        openai: boolean;
    }>;
}
/**
 * Create a unified LLM client
 */
export declare function createUnifiedLLMClient(config: UnifiedLLMClientConfig, logger?: Console): UnifiedLLMClient;
/**
 * Create a fully configured LLM client with default settings
 */
export declare function createLLMClient(options: {
    anthropicApiKey: string;
    openaiApiKey: string;
    logger?: Console;
}): Promise<UnifiedLLMClient>;
declare const _default: {
    ClaudeAdapter: typeof ClaudeAdapter;
    OpenAIAdapter: typeof OpenAIAdapter;
    createClaudeAdapter: typeof createClaudeAdapter;
    createOpenAIAdapter: typeof createOpenAIAdapter;
    ModelRouter: typeof ModelRouter;
    createModelRouter: typeof createModelRouter;
    DEFAULT_ROUTING_RULES: import("./index.js").ModelRoutingRule[];
    ContextBuilder: typeof ContextBuilder;
    createContextBuilder: typeof createContextBuilder;
    buildSalesContext: typeof buildSalesContext;
    buildSupportContext: typeof buildSupportContext;
    buildAnalystContext: typeof buildAnalystContext;
    promptTemplates: {
        getForRole: typeof import("./promptTemplates.js").getForRole;
        getForTask: typeof import("./promptTemplates.js").getForTask;
        documentAnalysis: typeof import("./promptTemplates.js").documentAnalysis;
        queryAnalysis: typeof import("./promptTemplates.js").queryAnalysis;
        analyst: typeof import("./promptTemplates.js").analyst;
    };
    UnifiedLLMClient: typeof UnifiedLLMClient;
    createUnifiedLLMClient: typeof createUnifiedLLMClient;
    createLLMClient: typeof createLLMClient;
};
export default _default;
//# sourceMappingURL=index.d.ts.map