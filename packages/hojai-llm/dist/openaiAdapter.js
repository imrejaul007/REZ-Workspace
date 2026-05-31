"use strict";
/**
 * Hojai LLM Adapter - OpenAI API Integration
 *
 * Provides OpenAI API integration with retry logic, streaming, and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
exports.createOpenAIAdapter = createOpenAIAdapter;
const openai_1 = __importDefault(require("openai"));
const uuid_1 = require("uuid");
const index_js_1 = require("./types/index.js");
const errors_js_1 = require("./errors.js");
class OpenAIAdapter {
    client;
    config;
    logger;
    constructor(config, logger) {
        this.config = {
            apiKey: config.apiKey,
            organization: config.organization,
            baseURL: config.baseURL || 'https://api.openai.com/v1',
            timeout: config.timeout || 60000,
            maxRetries: config.maxRetries || 3,
            defaultModel: config.defaultModel || index_js_1.OpenAIModel.GPT_4O,
            defaultMaxTokens: config.defaultMaxTokens || 4096
        };
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
            organization: this.config.organization,
            baseURL: this.config.baseURL,
            timeout: this.config.timeout
        });
        this.logger = logger || console;
    }
    /**
     * Get the provider name
     */
    get provider() {
        return 'openai';
    }
    /**
     * Check if the API is healthy
     */
    async healthCheck() {
        try {
            await this.client.models.list();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Send a chat request to OpenAI
     */
    async chat(options) {
        const startTime = Date.now();
        const requestId = (0, uuid_1.v4)();
        this.logger.debug(`[OpenAIAdapter] chat request ${requestId}`, {
            messageCount: options.messages.length,
            systemPromptLength: options.systemPrompt?.length || 0
        });
        // Build messages array
        const messages = [];
        // Add system prompt if provided
        if (options.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt
            });
        }
        // Add conversation messages
        for (const msg of options.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                    ...(msg.name && { name: msg.name })
                });
            }
        }
        let lastError;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await this.executeChat({
                    model: this.config.defaultModel,
                    messages,
                    temperature: options.temperature,
                    max_tokens: options.maxTokens || this.config.defaultMaxTokens,
                    top_p: options.topP,
                    stop: options.stopSequences
                });
                const latencyMs = Date.now() - startTime;
                // Validate response
                if (!response.choices || response.choices.length === 0) {
                    throw new errors_js_1.EmptyResponseError();
                }
                const choice = response.choices[0];
                const content = choice.message?.content || '';
                if (!content) {
                    throw new errors_js_1.EmptyResponseError();
                }
                return {
                    content,
                    provider: index_js_1.LLMProvider.OPENAI,
                    model: response.model,
                    usage: {
                        inputTokens: response.usage?.prompt_tokens || 0,
                        outputTokens: response.usage?.completion_tokens || 0,
                        totalTokens: response.usage?.total_tokens || 0
                    },
                    finishReason: choice.finish_reason || 'stop',
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
                if (lastError instanceof openai_1.default.RateLimitError) {
                    throw new errors_js_1.RateLimitError(`OpenAI rate limit exceeded: ${lastError.message}`, { limitType: 'requests', originalError: lastError });
                }
                // Authentication error
                if (lastError instanceof openai_1.default.AuthenticationError) {
                    throw new errors_js_1.AuthenticationError(`OpenAI authentication failed: ${lastError.message}`, lastError);
                }
                // Check if retryable
                if (!(0, errors_js_1.isRetryableError)(lastError) || attempt === this.config.maxRetries) {
                    this.logger.error(`[OpenAIAdapter] Non-retryable error: ${lastError.message}`);
                    throw lastError;
                }
                this.logger.warn(`[OpenAIAdapter] Attempt ${attempt} failed, retrying...`, { error: lastError.message });
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
        const response = await this.client.chat.completions.create({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            stop: params.stop
        });
        return response;
    }
    /**
     * Stream chat response from OpenAI
     */
    async *streamChat(options) {
        const requestId = (0, uuid_1.v4)();
        let totalUsage = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
        };
        let chunkCount = 0;
        this.logger.debug(`[OpenAIAdapter] stream request ${requestId}`);
        // Build messages array
        const messages = [];
        if (options.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt
            });
        }
        for (const msg of options.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
        try {
            const stream = await this.client.chat.completions.create({
                model: this.config.defaultModel,
                messages,
                temperature: options.temperature,
                max_tokens: options.maxTokens || this.config.defaultMaxTokens,
                top_p: options.topP,
                stream: true
            });
            for await (const chunk of stream) {
                chunkCount++;
                const choice = chunk.choices[0];
                if (choice.delta?.content) {
                    totalUsage.outputTokens++;
                    yield {
                        type: 'content',
                        content: choice.delta.content,
                        delta: choice.delta.content
                    };
                }
                // Update usage from final chunk
                if (chunk.usage) {
                    totalUsage.inputTokens = chunk.usage.prompt_tokens;
                    totalUsage.outputTokens = chunk.usage.completion_tokens;
                    totalUsage.totalTokens = chunk.usage.total_tokens;
                }
                // Check for completion
                if (choice.finish_reason) {
                    yield {
                        type: 'done',
                        usage: totalUsage,
                        content: undefined
                    };
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
        // OpenAI uses ~4 chars per token on average
        return Math.ceil(text.length / 4);
    }
    /**
     * Update API key at runtime
     */
    updateApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
            organization: this.config.organization,
            baseURL: this.config.baseURL,
            timeout: this.config.timeout
        });
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
// ============================================================================
// DEFAULT EXPORT
// ============================================================================
function createOpenAIAdapter(config, logger) {
    return new OpenAIAdapter(config, logger);
}
//# sourceMappingURL=openaiAdapter.js.map