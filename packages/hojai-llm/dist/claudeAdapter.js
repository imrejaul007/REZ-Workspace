"use strict";
/**
 * Hojai LLM Adapter - Claude API Integration
 *
 * Provides Claude API integration with retry logic, streaming, and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
exports.createClaudeAdapter = createClaudeAdapter;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
const index_js_1 = require("./types/index.js");
const errors_js_1 = require("./errors.js");
class ClaudeAdapter {
    client;
    config;
    logger;
    constructor(config, logger) {
        this.config = {
            apiKey: config.apiKey,
            baseURL: config.baseURL || 'https://api.anthropic.com',
            timeout: config.timeout || 60000,
            maxRetries: config.maxRetries || 3,
            defaultModel: config.defaultModel || index_js_1.ClaudeModel.CLAUDE_3_5_SONNET,
            defaultMaxTokens: config.defaultMaxTokens || 4096
        };
        this.client = new sdk_1.default({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL,
            timeout: this.config.timeout
        });
        this.logger = logger || console;
    }
    /**
     * Get the provider name
     */
    get provider() {
        return 'claude';
    }
    /**
     * Check if the API is healthy
     */
    async healthCheck() {
        try {
            // Simple API test - make a minimal request
            await this.client.messages.create({
                model: this.config.defaultModel,
                max_tokens: 1,
                messages: [{ role: 'user', content: 'ping' }]
            });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Send a chat request to Claude
     */
    async chat(options) {
        const startTime = Date.now();
        const requestId = (0, uuid_1.v4)();
        this.logger.debug(`[ClaudeAdapter] chat request ${requestId}`, {
            messageCount: options.messages.length,
            systemPromptLength: options.systemPrompt?.length || 0
        });
        // Build messages array - filter to only user/assistant roles
        const messages = options.messages
            .filter(msg => msg.role === index_js_1.MessageRole.USER || msg.role === index_js_1.MessageRole.ASSISTANT)
            .map(msg => ({
            role: msg.role === index_js_1.MessageRole.USER ? 'user' : 'assistant',
            content: msg.content,
            ...(msg.name && { name: msg.name })
        }));
        let lastError;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await this.executeChat({
                    model: this.config.defaultModel,
                    messages,
                    system: options.systemPrompt,
                    temperature: options.temperature,
                    max_tokens: options.maxTokens || this.config.defaultMaxTokens,
                    top_p: options.topP,
                    stop_sequences: options.stopSequences
                });
                const latencyMs = Date.now() - startTime;
                // Validate response
                if (!response.content || response.content.length === 0) {
                    throw new errors_js_1.EmptyResponseError();
                }
                const textContent = response.content.find(block => block.type === 'text');
                if (!textContent || !('text' in textContent)) {
                    throw new errors_js_1.EmptyResponseError();
                }
                return {
                    content: textContent.text,
                    provider: index_js_1.LLMProvider.CLAUDE,
                    model: response.model,
                    usage: {
                        inputTokens: response.usage.input_tokens,
                        outputTokens: response.usage.output_tokens,
                        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
                        cachedTokens: response.usage.cache_creation_input_tokens
                    },
                    finishReason: response.stop_reason || 'end_turn',
                    requestId,
                    latencyMs
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Handle specific errors
                if (error instanceof errors_js_1.AuthenticationError ||
                    error instanceof errors_js_1.TokenLimitError ||
                    error instanceof errors_js_1.EmptyResponseError) {
                    throw error;
                }
                // Rate limit handling
                if (error instanceof sdk_1.default.RateLimitError) {
                    const retryAfterMs = error.retryAfter
                        ? (error.retryAfter || 0) * 1000
                        : undefined;
                    throw new errors_js_1.RateLimitError(`Claude rate limit exceeded: ${error.message}`, { retryAfterMs, limitType: 'requests', originalError: error });
                }
                // Check if retryable
                if (!(0, errors_js_1.isRetryableError)(lastError) || attempt === this.config.maxRetries) {
                    this.logger.error(`[ClaudeAdapter] Non-retryable error: ${lastError.message}`);
                    throw lastError;
                }
                this.logger.warn(`[ClaudeAdapter] Attempt ${attempt} failed, retrying...`, { error: lastError.message });
                // Exponential backoff
                await (0, errors_js_1.sleep)(Math.min(1000 * Math.pow(2, attempt - 1), 30000));
            }
        }
        throw lastError;
    }
    /**
     * Execute chat with raw API call
     */
    async executeChat(params) {
        const response = await this.client.messages.create({
            model: params.model,
            messages: params.messages,
            system: params.system,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            stop_sequences: params.stop_sequences
        });
        return response;
    }
    /**
     * Stream chat response from Claude
     */
    async *streamChat(options) {
        const requestId = (0, uuid_1.v4)();
        let totalUsage = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
        };
        let chunkCount = 0;
        this.logger.debug(`[ClaudeAdapter] stream request ${requestId}`);
        const messages = options.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        try {
            const stream = await this.client.messages.stream({
                model: this.config.defaultModel,
                messages,
                system: options.systemPrompt,
                temperature: options.temperature,
                max_tokens: options.maxTokens || this.config.defaultMaxTokens,
                top_p: options.topP
            });
            for await (const event of stream) {
                chunkCount++;
                if (event.type === 'message_delta') {
                    yield {
                        type: 'done',
                        usage: totalUsage,
                        content: undefined
                    };
                }
                if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                        totalUsage.outputTokens++;
                        yield {
                            type: 'content',
                            content: event.delta.text,
                            delta: event.delta.text
                        };
                    }
                }
                if (event.type === 'message_start') {
                    totalUsage.inputTokens = event.message.usage.input_tokens;
                }
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            yield {
                type: 'error',
                error: err.message
            };
        }
    }
    /**
     * Analyze a query with context
     */
    async analyze(query, context) {
        const systemPrompt = `You are an expert query analyzer. Analyze the user's query and provide structured insights.

Return a JSON response with:
- intent: The primary intent of the query
- entities: Key entities mentioned (people, organizations, products)
- sentiment: positive, neutral, or negative
- complexity: simple, moderate, or complex
- suggested_task: Recommended task type (reasoning, creative, classification, extraction, summarization, conversation, code, document)

Format your response as valid JSON only.`;
        const contextSection = context?.relevantFacts?.length
            ? `\n\nRelevant facts:\n${context.relevantFacts.map(f => `- ${f}`).join('\n')}`
            : '';
        const conversationSection = context?.recentConversations?.length
            ? `\n\nRecent conversation:\n${context.recentConversations.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`
            : '';
        return this.chat({
            messages: [
                {
                    role: index_js_1.MessageRole.USER,
                    content: `Analyze this query:${contextSection}${conversationSection}\n\nQuery: ${query}`
                }
            ],
            systemPrompt,
            temperature: 0.3,
            maxTokens: 500
        });
    }
    /**
     * Generate text from a prompt
     */
    async generateText(prompt, options) {
        return this.chat({
            messages: [{ role: index_js_1.MessageRole.USER, content: prompt }],
            systemPrompt: options?.systemPrompt,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            stopSequences: options?.stopSequences
        });
    }
    /**
     * Analyze a document
     */
    async analyzeDocument(content, documentType, options) {
        const summaryLengthMap = {
            short: '2-3 sentences',
            medium: '1 paragraph',
            long: '2-3 paragraphs'
        };
        const systemPrompt = `You are an expert document analyzer. Analyze the provided ${documentType} and provide structured insights.

Provide the following:
1. A ${summaryLengthMap[options?.summaryLength || 'medium']} summary
2. Key points (bullet list)
3. Sentiment (positive, neutral, or negative)
4. Any notable entities (people, organizations, dates, amounts)

${options?.extractFields?.length
            ? `5. Extract these specific fields:\n${options.extractFields.map(f => `- ${f}`).join('\n')}`
            : ''}

Format your response clearly with sections.`;
        return this.chat({
            messages: [{ role: index_js_1.MessageRole.USER, content: content }],
            systemPrompt,
            temperature: 0.3,
            maxTokens: 2000
        });
    }
    /**
     * Count tokens for a message (approximate)
     */
    async countTokens(text) {
        // Claude uses ~4 chars per token on average
        return Math.ceil(text.length / 4);
    }
    /**
     * Update API key at runtime
     */
    updateApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.client = new sdk_1.default({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL,
            timeout: this.config.timeout
        });
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
// ============================================================================
// DEFAULT EXPORT
// ============================================================================
function createClaudeAdapter(config, logger) {
    return new ClaudeAdapter(config, logger);
}
//# sourceMappingURL=claudeAdapter.js.map