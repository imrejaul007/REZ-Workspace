/**
 * HOJAI Research Assistant - Trends Module
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Trend detection and analysis
 */
import { TrendItem, TrendSummary, TrendsResponse, TrendCategory } from '../types.js';
/**
 * Get all trends or filter by category
 */
export declare function getTrends(category?: TrendCategory, limit?: number): Promise<TrendsResponse>;
/**
 * Get trends by category
 */
export declare function getTrendsByCategory(category: TrendCategory): Promise<TrendSummary>;
/**
 * Get a specific trend by ID
 */
export declare function getTrendById(trendId: string): Promise<TrendItem | null>;
/**
 * Get related trends for a given trend
 */
export declare function getRelatedTrends(trendId: string): Promise<TrendItem[]>;
/**
 * Search trends by keyword
 */
export declare function searchTrends(keyword: string): Promise<TrendItem[]>;
/**
 * Get trend analytics and insights
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
//# sourceMappingURL=trendsModule.d.ts.map