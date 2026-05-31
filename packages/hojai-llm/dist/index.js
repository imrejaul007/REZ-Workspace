"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLLMClient = exports.promptTemplates = exports.buildAnalystContext = exports.buildSupportContext = exports.buildSalesContext = exports.createContextBuilder = exports.ContextBuilder = exports.fitsInContext = exports.getModelContextWindow = exports.DEFAULT_ROUTING_RULES = exports.createModelRouter = exports.ModelRouter = exports.createOpenAIAdapter = exports.OpenAIAdapter = exports.createClaudeAdapter = exports.ClaudeAdapter = exports.sleep = exports.retryWithBackoff = exports.withErrorHandling = exports.getErrorMessage = exports.isRetryableError = exports.ConfigurationError = exports.ProviderUnavailableError = exports.RetryExhaustedError = exports.TimeoutError = exports.StreamingError = exports.ResponseParseError = exports.EmptyResponseError = exports.InvalidRequestError = exports.ContextWindowError = exports.ModelNotFoundError = exports.TokenLimitError = exports.RateLimitError = exports.AuthenticationError = exports.LLMError = exports.ChatMessageSchema = exports.ModelConfigSchema = exports.EmployeeContextSchema = exports.LLMRequestOptionsSchema = exports.EmployeeRole = exports.MessageRole = exports.TaskType = exports.OpenAIModel = exports.ClaudeModel = exports.LLMProvider = void 0;
exports.createUnifiedLLMClient = createUnifiedLLMClient;
exports.createLLMClient = createLLMClient;
// ============================================================================
// TYPES
// ============================================================================
var index_js_1 = require("./types/index.js");
Object.defineProperty(exports, "LLMProvider", { enumerable: true, get: function () { return index_js_1.LLMProvider; } });
Object.defineProperty(exports, "ClaudeModel", { enumerable: true, get: function () { return index_js_1.ClaudeModel; } });
Object.defineProperty(exports, "OpenAIModel", { enumerable: true, get: function () { return index_js_1.OpenAIModel; } });
Object.defineProperty(exports, "TaskType", { enumerable: true, get: function () { return index_js_1.TaskType; } });
Object.defineProperty(exports, "MessageRole", { enumerable: true, get: function () { return index_js_1.MessageRole; } });
Object.defineProperty(exports, "EmployeeRole", { enumerable: true, get: function () { return index_js_1.EmployeeRole; } });
var index_js_2 = require("./types/index.js");
Object.defineProperty(exports, "LLMRequestOptionsSchema", { enumerable: true, get: function () { return index_js_2.LLMRequestOptionsSchema; } });
Object.defineProperty(exports, "EmployeeContextSchema", { enumerable: true, get: function () { return index_js_2.EmployeeContextSchema; } });
Object.defineProperty(exports, "ModelConfigSchema", { enumerable: true, get: function () { return index_js_2.ModelConfigSchema; } });
Object.defineProperty(exports, "ChatMessageSchema", { enumerable: true, get: function () { return index_js_2.ChatMessageSchema; } });
// ============================================================================
// ERRORS
// ============================================================================
var errors_js_1 = require("./errors.js");
Object.defineProperty(exports, "LLMError", { enumerable: true, get: function () { return errors_js_1.LLMError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_js_1.AuthenticationError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_js_1.RateLimitError; } });
Object.defineProperty(exports, "TokenLimitError", { enumerable: true, get: function () { return errors_js_1.TokenLimitError; } });
Object.defineProperty(exports, "ModelNotFoundError", { enumerable: true, get: function () { return errors_js_1.ModelNotFoundError; } });
Object.defineProperty(exports, "ContextWindowError", { enumerable: true, get: function () { return errors_js_1.ContextWindowError; } });
Object.defineProperty(exports, "InvalidRequestError", { enumerable: true, get: function () { return errors_js_1.InvalidRequestError; } });
Object.defineProperty(exports, "EmptyResponseError", { enumerable: true, get: function () { return errors_js_1.EmptyResponseError; } });
Object.defineProperty(exports, "ResponseParseError", { enumerable: true, get: function () { return errors_js_1.ResponseParseError; } });
Object.defineProperty(exports, "StreamingError", { enumerable: true, get: function () { return errors_js_1.StreamingError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return errors_js_1.TimeoutError; } });
Object.defineProperty(exports, "RetryExhaustedError", { enumerable: true, get: function () { return errors_js_1.RetryExhaustedError; } });
Object.defineProperty(exports, "ProviderUnavailableError", { enumerable: true, get: function () { return errors_js_1.ProviderUnavailableError; } });
Object.defineProperty(exports, "ConfigurationError", { enumerable: true, get: function () { return errors_js_1.ConfigurationError; } });
Object.defineProperty(exports, "isRetryableError", { enumerable: true, get: function () { return errors_js_1.isRetryableError; } });
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return errors_js_1.getErrorMessage; } });
Object.defineProperty(exports, "withErrorHandling", { enumerable: true, get: function () { return errors_js_1.withErrorHandling; } });
Object.defineProperty(exports, "retryWithBackoff", { enumerable: true, get: function () { return errors_js_1.retryWithBackoff; } });
Object.defineProperty(exports, "sleep", { enumerable: true, get: function () { return errors_js_1.sleep; } });
// ============================================================================
// ADAPTERS
// ============================================================================
var claudeAdapter_js_1 = require("./claudeAdapter.js");
Object.defineProperty(exports, "ClaudeAdapter", { enumerable: true, get: function () { return claudeAdapter_js_1.ClaudeAdapter; } });
Object.defineProperty(exports, "createClaudeAdapter", { enumerable: true, get: function () { return claudeAdapter_js_1.createClaudeAdapter; } });
var openaiAdapter_js_1 = require("./openaiAdapter.js");
Object.defineProperty(exports, "OpenAIAdapter", { enumerable: true, get: function () { return openaiAdapter_js_1.OpenAIAdapter; } });
Object.defineProperty(exports, "createOpenAIAdapter", { enumerable: true, get: function () { return openaiAdapter_js_1.createOpenAIAdapter; } });
// ============================================================================
// ROUTER
// ============================================================================
var modelRouter_js_1 = require("./modelRouter.js");
Object.defineProperty(exports, "ModelRouter", { enumerable: true, get: function () { return modelRouter_js_1.ModelRouter; } });
Object.defineProperty(exports, "createModelRouter", { enumerable: true, get: function () { return modelRouter_js_1.createModelRouter; } });
Object.defineProperty(exports, "DEFAULT_ROUTING_RULES", { enumerable: true, get: function () { return modelRouter_js_1.DEFAULT_ROUTING_RULES; } });
Object.defineProperty(exports, "getModelContextWindow", { enumerable: true, get: function () { return modelRouter_js_1.getModelContextWindow; } });
Object.defineProperty(exports, "fitsInContext", { enumerable: true, get: function () { return modelRouter_js_1.fitsInContext; } });
// ============================================================================
// CONTEXT BUILDER
// ============================================================================
var contextBuilder_js_1 = require("./contextBuilder.js");
Object.defineProperty(exports, "ContextBuilder", { enumerable: true, get: function () { return contextBuilder_js_1.ContextBuilder; } });
Object.defineProperty(exports, "createContextBuilder", { enumerable: true, get: function () { return contextBuilder_js_1.createContextBuilder; } });
Object.defineProperty(exports, "buildSalesContext", { enumerable: true, get: function () { return contextBuilder_js_1.buildSalesContext; } });
Object.defineProperty(exports, "buildSupportContext", { enumerable: true, get: function () { return contextBuilder_js_1.buildSupportContext; } });
Object.defineProperty(exports, "buildAnalystContext", { enumerable: true, get: function () { return contextBuilder_js_1.buildAnalystContext; } });
// ============================================================================
// PROMPT TEMPLATES
// ============================================================================
var promptTemplates_js_1 = require("./promptTemplates.js");
Object.defineProperty(exports, "promptTemplates", { enumerable: true, get: function () { return promptTemplates_js_1.promptTemplates; } });
// ============================================================================
// UNIFIED CLIENT
// ============================================================================
const claudeAdapter_js_2 = require("./claudeAdapter.js");
const openaiAdapter_js_2 = require("./openaiAdapter.js");
const modelRouter_js_2 = require("./modelRouter.js");
const contextBuilder_js_2 = require("./contextBuilder.js");
const promptTemplates_js_2 = require("./promptTemplates.js");
const index_js_3 = require("./types/index.js");
const errors_js_2 = require("./errors.js");
/**
 * Unified LLM client that routes to appropriate provider
 */
class UnifiedLLMClient {
    config;
    logger;
    constructor(config, logger) {
        this.config = {
            claude: config.claude,
            openai: config.openai,
            router: config.router,
            contextBuilder: config.contextBuilder,
            maxRetries: config.maxRetries || 3
        };
        this.logger = logger || console;
    }
    /**
     * Send a chat request with employee context
     */
    async chat(request) {
        const { employee, taskType, systemPrompt, temperature, maxTokens, stream } = request;
        // Determine task type if not provided
        const effectiveTaskType = taskType ||
            this.config.router.inferTaskType(request.messages[request.messages.length - 1]?.content || '', { messageCount: request.messages.length });
        // Get model configuration
        const modelConfig = this.config.router.getModelConfig(effectiveTaskType);
        // Build context
        const context = this.config.contextBuilder.build(employee, request.messages);
        // Merge system prompts
        const finalSystemPrompt = [context.systemPrompt, systemPrompt, modelConfig.systemPrompt]
            .filter(Boolean)
            .join('\n\n');
        // Build request options
        const options = {
            messages: context.messages,
            systemPrompt: finalSystemPrompt,
            temperature: temperature ?? modelConfig.temperature,
            maxTokens: maxTokens ?? modelConfig.maxTokens,
            stream: stream ?? false
        };
        // Route to appropriate adapter
        let lastError;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                if (modelConfig.provider === index_js_3.LLMProvider.CLAUDE) {
                    return await this.config.claude.chat(options);
                }
                else {
                    return await this.config.openai.chat(options);
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Try fallback if primary fails
                if (attempt === 1 && modelConfig.provider === index_js_3.LLMProvider.CLAUDE) {
                    const fallbackConfig = this.config.router.getFallbackConfig(effectiveTaskType);
                    if (fallbackConfig) {
                        this.logger.warn(`[UnifiedLLMClient] Primary failed, trying fallback: ${fallbackConfig.model}`);
                        try {
                            if (fallbackConfig.provider === index_js_3.LLMProvider.CLAUDE) {
                                return await this.config.claude.chat({
                                    ...options,
                                    maxTokens: fallbackConfig.maxTokens || options.maxTokens
                                });
                            }
                            else {
                                return await this.config.openai.chat({
                                    ...options,
                                    maxTokens: fallbackConfig.maxTokens || options.maxTokens
                                });
                            }
                        }
                        catch (fallbackError) {
                            lastError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
                        }
                    }
                }
                // Check if retryable
                if (!(0, errors_js_2.isRetryableError)(lastError) || attempt === this.config.maxRetries) {
                    throw lastError;
                }
                this.logger.warn(`[UnifiedLLMClient] Attempt ${attempt} failed, retrying...`, {
                    error: lastError.message
                });
                await (0, errors_js_2.sleep)(Math.min(1000 * Math.pow(2, attempt - 1), 30000));
            }
        }
        throw lastError || new errors_js_2.LLMError('Chat request failed');
    }
    /**
     * Generate text with simple prompt
     */
    async generateText(prompt, options) {
        // Use Claude by default
        return this.config.claude.generateText(prompt, options);
    }
    /**
     * Analyze a document
     */
    async analyzeDocument(content, documentType, employee, options) {
        if (employee) {
            const context = this.config.contextBuilder.buildDocumentContext(employee, documentType, content);
            return this.config.claude.chat({
                messages: context.messages,
                systemPrompt: context.systemPrompt,
                maxTokens: 2000,
                temperature: 0.3
            });
        }
        return this.config.claude.analyzeDocument(content, documentType, options);
    }
    /**
     * Analyze a query
     */
    async analyzeQuery(query, context) {
        return this.config.claude.analyze(query, context);
    }
    /**
     * Stream a chat response
     */
    async *streamChat(request) {
        const response = await this.chat({ ...request, stream: true });
        // For streaming, we'd need to implement actual streaming
        // This is a placeholder that yields the complete response
        yield response.content;
    }
    /**
     * Get health status of all providers
     */
    async getHealthStatus() {
        const [claudeHealth, openaiHealth] = await Promise.all([
            this.config.claude.healthCheck().catch(() => false),
            this.config.openai.healthCheck().catch(() => false)
        ]);
        return {
            claude: claudeHealth,
            openai: openaiHealth
        };
    }
}
exports.UnifiedLLMClient = UnifiedLLMClient;
/**
 * Create a unified LLM client
 */
function createUnifiedLLMClient(config, logger) {
    return new UnifiedLLMClient(config, logger);
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Create a fully configured LLM client with default settings
 */
async function createLLMClient(options) {
    const { anthropicApiKey, openaiApiKey, logger } = options;
    const claude = (0, claudeAdapter_js_2.createClaudeAdapter)({ apiKey: anthropicApiKey }, logger);
    const openai = (0, openaiAdapter_js_2.createOpenAIAdapter)({ apiKey: openaiApiKey }, logger);
    const router = (0, modelRouter_js_2.createModelRouter)({}, logger);
    const contextBuilder = (0, contextBuilder_js_2.createContextBuilder)({}, logger);
    return new UnifiedLLMClient({
        claude,
        openai,
        router,
        contextBuilder
    }, logger);
}
// ============================================================================
// DEFAULT EXPORT
// ============================================================================
exports.default = {
    // Adapters
    ClaudeAdapter: claudeAdapter_js_2.ClaudeAdapter,
    OpenAIAdapter: openaiAdapter_js_2.OpenAIAdapter,
    createClaudeAdapter: claudeAdapter_js_2.createClaudeAdapter,
    createOpenAIAdapter: openaiAdapter_js_2.createOpenAIAdapter,
    // Router
    ModelRouter: modelRouter_js_2.ModelRouter,
    createModelRouter: modelRouter_js_2.createModelRouter,
    DEFAULT_ROUTING_RULES: modelRouter_js_2.DEFAULT_ROUTING_RULES,
    // Context
    ContextBuilder: contextBuilder_js_2.ContextBuilder,
    createContextBuilder: contextBuilder_js_2.createContextBuilder,
    buildSalesContext: contextBuilder_js_2.buildSalesContext,
    buildSupportContext: contextBuilder_js_2.buildSupportContext,
    buildAnalystContext: contextBuilder_js_2.buildAnalystContext,
    // Templates
    promptTemplates: promptTemplates_js_2.promptTemplates,
    // Client
    UnifiedLLMClient,
    createUnifiedLLMClient,
    createLLMClient
};
//# sourceMappingURL=index.js.map