/**
 * HOJAI Research Assistant - Search Module
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Web search functionality for research
 */
import { SearchQuery, SearchResult, SearchResponse } from '../types.js';
/**
 * Perform a web search with query and filters
 */
export declare function search(query: SearchQuery): Promise<SearchResponse>;
/**
 * Get a single search result by ID
 */
export declare function getSearchResultById(id: string): Promise<SearchResult | null>;
/**
 * Save a search result to favorites
 */
export declare function saveSearchResult(userId: string, result: SearchResult): Promise<{
    id: string;
    saved: boolean;
}>;
/**
 * Get search history for a user
 */
export declare function getSearchHistory(userId: string, limit?: number): Promise<Array<{
    query: string;
    timestamp: string;
    resultCount: number;
}>>;
//# sourceMappingURL=searchModule.d.ts.map