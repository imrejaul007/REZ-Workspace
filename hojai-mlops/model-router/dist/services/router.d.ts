/**
 * Hojai Model Router - Router Service
 * Intelligent LLM Provider Routing
 */
import { TaskType, RouteRequest, RouteResponse, FallbackRequest, FallbackResponse, ProviderInfo, CostEstimate, RouterStats } from '../types';
declare class ModelRouterService {
    private stats;
    /**
     * Route request to appropriate model based on task type
     */
    route(request: RouteRequest): Promise<RouteResponse>;
    /**
     * Handle fallback when primary provider fails
     */
    handleFallback(request: FallbackRequest): Promise<FallbackResponse>;
    /**
     * Get available providers
     */
    getProviders(): ProviderInfo[];
    /**
     * Get cost estimates for a task
     */
    getCostEstimates(task: TaskType, inputLength: number): CostEstimate[];
    /**
     * Get router statistics
     */
    getStats(): RouterStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Select the best provider for a task
     */
    private selectProvider;
    /**
     * Call an LLM provider
     */
    private callProvider;
    /**
     * Call OpenAI API
     */
    private callOpenAI;
    /**
     * Call Anthropic API
     */
    private callAnthropic;
    /**
     * Call Google Generative AI API
     */
    private callGoogle;
    /**
     * Call Meta LLM (via Groq or similar)
     */
    private callMeta;
    /**
     * Calculate cost for a request
     */
    private calculateCost;
    /**
     * Get models for a provider
     */
    private getProviderModels;
    /**
     * Get context window for a model
     */
    private getContextWindow;
    /**
     * Get provider display name
     */
    private getProviderDisplayName;
    /**
     * Update statistics
     */
    private updateStats;
}
export declare const modelRouterService: ModelRouterService;
export {};
//# sourceMappingURL=router.d.ts.map