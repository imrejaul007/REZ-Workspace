/**
 * HOJAI LLM Providers - Anthropic Provider Adapter
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Anthropic Claude integration via the official SDK
 */
import type { LLMProvider, Message, ChatOptions, ChatResponse, ClassifyOptions, ProviderCostInfo } from '../types/index.js';
interface AnthropicProviderConfig {
    apiKey?: string;
    baseURL?: string;
    defaultModel?: string;
    maxRetries?: number;
    timeout?: number;
}
/**
 * Anthropic Provider - Claude 3.5 family models
 */
export declare class AnthropicProvider implements LLMProvider {
    readonly name = "anthropic";
    readonly type: "anthropic";
    readonly defaultModel: string;
    readonly supportedModels: string[];
    private client;
    private config;
    private available;
    constructor(config?: AnthropicProviderConfig);
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
     * Note: Anthropic doesn't have an embeddings API, so we use a fallback
     */
    embed(_text: string): Promise<number[]>;
    /**
     * Classify text into categories
     */
    classify(text: string, labels: string[], options?: ClassifyOptions): Promise<string>;
    /**
     * Map Anthropic errors to our error format
     */
    private mapError;
}
/**
 * Factory function to create Anthropic provider
 */
export declare function createAnthropicProvider(config?: AnthropicProviderConfig): AnthropicProvider;
export {};
//# sourceMappingURL=anthropic.provider.d.ts.map