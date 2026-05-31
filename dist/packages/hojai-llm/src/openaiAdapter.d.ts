/**
 * Hojai LLM Adapter - OpenAI API Integration
 *
 * Provides OpenAI API integration with retry logic, streaming, and error handling
 */
import { ChatMessage, LLMRequestOptions, LLMResponse, StreamingChunk, OpenAIModel } from './types/index.js';
export interface OpenAIAdapterConfig {
    apiKey: string;
    organization?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    defaultModel?: OpenAIModel;
    defaultMaxTokens?: number;
}
export declare class OpenAIAdapter {
    private client;
    private config;
    private readonly logger;
    constructor(config: OpenAIAdapterConfig, logger?: Console);
    /**
     * Get the provider name
     */
    get provider(): string;
    /**
     * Check if the API is healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Send a chat request to OpenAI
     */
    chat(options: LLMRequestOptions): Promise<LLMResponse>;
    /**
     * Execute chat with raw API call
     */
    private executeChat;
    /**
     * Stream chat response from OpenAI
     */
    streamChat(options: LLMRequestOptions): AsyncGenerator<StreamingChunk, void, unknown>;
    /**
     * Analyze a query with context
     */
    analyze(query: string, context?: {
        recentConversations?: ChatMessage[];
        relevantFacts?: string[];
        userIntent?: string;
    }): Promise<LLMResponse>;
    /**
     * Generate text from a prompt
     */
    generateText(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        stopSequences?: string[];
    }): Promise<LLMResponse>;
    /**
     * Analyze a document
     */
    analyzeDocument(content: string, documentType: string, options?: {
        extractFields?: string[];
        summaryLength?: 'short' | 'medium' | 'long';
    }): Promise<LLMResponse>;
    /**
     * Count tokens for a message (approximate)
     */
    countTokens(text: string): Promise<number>;
    /**
     * Update API key at runtime
     */
    updateApiKey(apiKey: string): void;
}
export declare function createOpenAIAdapter(config: OpenAIAdapterConfig, logger?: Console): OpenAIAdapter;
//# sourceMappingURL=openaiAdapter.d.ts.map