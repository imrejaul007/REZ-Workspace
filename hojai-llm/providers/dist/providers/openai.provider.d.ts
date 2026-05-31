/**
 * HOJAI LLM Providers - OpenAI Provider Adapter
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: OpenAI GPT integration via the official SDK
 */
import type { LLMProvider, Message, ChatOptions, ChatResponse, ClassifyOptions, ProviderCostInfo } from '../types/index.js';
interface OpenAIProviderConfig {
    apiKey?: string;
    organization?: string;
    baseURL?: string;
    defaultModel?: string;
    timeout?: number;
}
/**
 * OpenAI Provider - GPT-4o family models
 */
export declare class OpenAIProvider implements LLMProvider {
    readonly name = "openai";
    readonly type: "openai";
    readonly defaultModel: string;
    readonly supportedModels: string[];
    private client;
    private config;
    private available;
    constructor(config?: OpenAIProviderConfig);
    /**
     * Check if the provider is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get cost information for the provider
     */
    getCostInfo(): ProviderCostInfo;
    /**
     * Generate a chat completion
     */
    chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
    /**
     * Generate embeddings for text
     */
    embed(text: string, embeddingModel?: string): Promise<number[]>;
    /**
     * Classify text into categories using chat completion
     */
    classify(text: string, labels: string[], options?: ClassifyOptions): Promise<string>;
    /**
     * Map OpenAI finish reason to our format
     */
    private mapFinishReason;
    /**
     * Map OpenAI errors to our error format
     */
    private mapError;
}
/**
 * Factory function to create OpenAI provider
 */
export declare function createOpenAIProvider(config?: OpenAIProviderConfig): OpenAIProvider;
export {};
//# sourceMappingURL=openai.provider.d.ts.map