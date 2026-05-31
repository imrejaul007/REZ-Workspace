/**
 * HOJAI LLM Providers - Task Router
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Intelligent routing based on task type with fallback support
 */
import type { LLMProvider, Message, ChatOptions, ChatResponse, ProviderType, RouterConfig, TaskType, TaskRouting, ProviderInfo, ProviderStatus } from '../types/index.js';
interface RouterProvider {
    type: ProviderType;
    provider: LLMProvider;
}
/**
 * LLM Router - Routes requests to the best provider based on task
 */
export declare class LLMRouter {
    private providers;
    private config;
    private analyzer;
    private providerStatus;
    constructor(providerList: RouterProvider[], config?: RouterConfig);
    /**
     * Get a provider by type
     */
    getProvider(type: ProviderType): LLMProvider | undefined;
    /**
     * Get the default provider
     */
    getDefaultProvider(): LLMProvider | undefined;
    /**
     * Check if a provider is available
     */
    isProviderAvailable(type: ProviderType): Promise<boolean>;
    /**
     * Get routing info for a task type
     */
    getTaskRouting(taskType: TaskType): TaskRouting;
    /**
     * Select the best provider for a task
     */
    selectProvider(taskType: TaskType, preferredProvider?: ProviderType): Promise<{
        provider: LLMProvider;
        model: string;
    }>;
    /**
     * Route a chat request to the best provider
     */
    chat(messages: Message[], options?: ChatOptions & {
        provider?: ProviderType;
        taskType?: TaskType;
    }): Promise<ChatResponse>;
    /**
     * Route an embed request
     */
    embed(text: string, providerType?: ProviderType): Promise<number[]>;
    /**
     * Route a classify request
     */
    classify(text: string, labels: string[], providerType?: ProviderType): Promise<string>;
    /**
     * Get information about all providers
     */
    getProviders(): Promise<ProviderInfo[]>;
    /**
     * Get status of all providers
     */
    getProviderStatuses(): Promise<ProviderStatus[]>;
    /**
     * Update router configuration
     */
    updateConfig(config: Partial<RouterConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): RouterConfig;
}
/**
 * Create a router with the configured providers
 */
export declare function createLLMRouter(providers: RouterProvider[], config?: RouterConfig): LLMRouter;
export {};
//# sourceMappingURL=router.d.ts.map