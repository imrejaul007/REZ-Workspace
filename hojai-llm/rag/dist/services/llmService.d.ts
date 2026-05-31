/**
 * HOJAI RAG Service - LLM Service
 *
 * Simple LLM integration for RAG-powered generation.
 * Supports OpenAI-compatible APIs.
 */
import type { SearchResult } from '../types';
interface LLMResponse {
    answer: string;
    tokens_used?: number;
}
/**
 * Call LLM API (OpenAI-compatible)
 */
export declare function generateWithContext(query: string, searchResults?: SearchResult[], options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
}): Promise<LLMResponse>;
/**
 * Generate completion without context (general query)
 */
export declare function generateCompletion(prompt: string, options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
}): Promise<LLMResponse>;
export {};
//# sourceMappingURL=llmService.d.ts.map