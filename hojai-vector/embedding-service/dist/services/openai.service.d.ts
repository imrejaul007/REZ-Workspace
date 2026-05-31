/**
 * HOJAI Embedding Service - OpenAI Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: OpenAI embeddings API integration
 */
import { Logger } from '../utils/logger.js';
import type { EmbedModelId, OpenAIEmbeddingResult, OpenAIBatchResult } from '../types/index.js';
export declare class OpenAIService {
    private client;
    private logger;
    constructor(apiKey: string, logger: Logger);
    /**
     * Generate embedding for a single text
     */
    embed(text: string, model?: EmbedModelId): Promise<OpenAIEmbeddingResult>;
    /**
     * Generate embeddings for multiple texts in a single request
     */
    embedBatch(texts: string[], model?: EmbedModelId): Promise<OpenAIBatchResult>;
    /**
     * Get available embedding models
     */
    getAvailableModels(): Array<{
        id: EmbedModelId;
        name: string;
        dimensions: number;
        description: string;
        maxTokens: number;
    }>;
    /**
     * Format model ID to human-readable name
     */
    private formatModelName;
}
export declare function createOpenAIService(apiKey: string, logger: Logger): OpenAIService;
export declare function getOpenAIService(): OpenAIService | null;
//# sourceMappingURL=openai.service.d.ts.map