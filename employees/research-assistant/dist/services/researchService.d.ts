/**
 * HOJAI Research Assistant - Research Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Orchestrates all research modules
 */
import { SearchQuery, SearchResponse, CompetitorAnalysisInput, CompetitorAnalysis, ReportGenerationInput, GeneratedReport, TrendsResponse, TrendCategory, TrendSummary, SummarizeInput, SummaryResult } from '../types.js';
/**
 * Execute a research search
 */
export declare function search(query: SearchQuery): Promise<SearchResponse>;
/**
 * Get search result by ID
 */
export declare function getSearchResult(id: string): Promise<import("../types.js").SearchResult | null>;
/**
 * Get user's search history
 */
export declare function getSearchHistory(userId: string, limit?: number): Promise<{
    query: string;
    timestamp: string;
    resultCount: number;
}[]>;
/**
 * Perform competitor analysis
 */
export declare function analyzeCompetitors(input: CompetitorAnalysisInput): Promise<CompetitorAnalysis>;
/**
 * Get detailed competitor info
 */
export declare function getCompetitorDetails(competitorName: string): Promise<import("../types.js").CompetitorInfo | null>;
/**
 * Get product comparison between companies
 */
export declare function getProductComparison(company: string, competitor: string): Promise<import("../types.js").ProductOffering[]>;
/**
 * Generate competitive insights
 */
export declare function generateInsights(company: string): Promise<string[]>;
/**
 * Generate a research report
 */
export declare function generateReport(input: ReportGenerationInput): Promise<GeneratedReport>;
/**
 * Get a report by ID
 */
export declare function getReport(reportId: string): Promise<GeneratedReport | null>;
/**
 * Export a report
 */
export declare function exportReport(reportId: string, format: 'pdf' | 'docx' | 'html'): Promise<{
    url: string;
    format: string;
}>;
/**
 * Generate a quick summary
 */
export declare function generateSummary(topic: string, length?: 'short' | 'medium' | 'long'): Promise<string>;
/**
 * Get trends
 */
export declare function getTrends(category?: TrendCategory, limit?: number): Promise<TrendsResponse>;
/**
 * Get trends by category
 */
export declare function getTrendsByCategory(category: TrendCategory): Promise<TrendSummary>;
/**
 * Get a specific trend
 */
export declare function getTrend(trendId: string): Promise<import("../types.js").TrendItem | null>;
/**
 * Get related trends
 */
export declare function getRelatedTrends(trendId: string): Promise<import("../types.js").TrendItem[]>;
/**
 * Search trends
 */
export declare function searchTrends(keyword: string): Promise<import("../types.js").TrendItem[]>;
/**
 * Get trend analytics
 */
export declare function getTrendAnalytics(): Promise<{
    totalTrends: number;
    byCategory: Record<TrendCategory, number>;
    byVelocity: Record<string, number>;
    topSources: Array<{
        source: string;
        count: number;
    }>;
}>;
/**
 * Summarize content
 */
export declare function summarize(input: SummarizeInput): Promise<SummaryResult>;
/**
 * Summarize multiple contents
 */
export declare function summarizeBatch(contents: string[], style?: 'brief' | 'standard' | 'detailed'): Promise<SummaryResult[]>;
/**
 * Extract entities from content
 */
export declare function extractEntities(content: string): Promise<{
    organizations: string[];
    people: string[];
    locations: string[];
    dates: string[];
}>;
/**
 * Compare multiple summaries
 */
export declare function compareSummaries(summaries: string[]): Promise<{
    commonThemes: string[];
    uniqueInsights: Array<{
        index: number;
        unique: string[];
    }>;
    consensus: string;
}>;
/**
 * Perform comprehensive research on a topic
 */
export declare function comprehensiveResearch(topic: string, includeReport?: boolean, includeTrends?: boolean, includeCompetitors?: boolean): Promise<{
    topic: string;
    searchResults?: SearchResponse;
    trends?: TrendsResponse;
    report?: GeneratedReport;
    competitorAnalysis?: CompetitorAnalysis;
    generatedAt: string;
}>;
declare const _default: {
    search: typeof search;
    getSearchResult: typeof getSearchResult;
    getSearchHistory: typeof getSearchHistory;
    analyzeCompetitors: typeof analyzeCompetitors;
    getCompetitorDetails: typeof getCompetitorDetails;
    getProductComparison: typeof getProductComparison;
    generateInsights: typeof generateInsights;
    generateReport: typeof generateReport;
    getReport: typeof getReport;
    exportReport: typeof exportReport;
    generateSummary: typeof generateSummary;
    getTrends: typeof getTrends;
    getTrendsByCategory: typeof getTrendsByCategory;
    getTrend: typeof getTrend;
    getRelatedTrends: typeof getRelatedTrends;
    searchTrends: typeof searchTrends;
    getTrendAnalytics: typeof getTrendAnalytics;
    summarize: typeof summarize;
    summarizeBatch: typeof summarizeBatch;
    extractEntities: typeof extractEntities;
    compareSummaries: typeof compareSummaries;
    comprehensiveResearch: typeof comprehensiveResearch;
};
export default _default;
//# sourceMappingURL=researchService.d.ts.map