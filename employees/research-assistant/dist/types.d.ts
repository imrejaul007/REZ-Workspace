/**
 * HOJAI Research Assistant - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Market research, competitor analysis, report generation
 *
 * Tagline: "AI-powered research that delivers insights, not just data."
 */
import { z } from 'zod';
/**
 * Research status
 */
export type ResearchStatus = 'pending' | 'processing' | 'completed' | 'failed';
/**
 * Report format
 */
export type ReportFormat = 'summary' | 'detailed' | 'comprehensive';
/**
 * Trend category
 */
export type TrendCategory = 'technology' | 'market' | 'consumer' | 'industry' | 'competitive';
/**
 * Data source type
 */
export type DataSourceType = 'web' | 'api' | 'database' | 'internal';
/**
 * Analysis depth
 */
export type AnalysisDepth = 'quick' | 'standard' | 'deep';
/**
 * Search query input
 */
export interface SearchQuery {
    query: string;
    filters?: SearchFilters;
    limit?: number;
    offset?: number;
}
/**
 * Search filters
 */
export interface SearchFilters {
    dateRange?: {
        from: string;
        to: string;
    };
    sources?: string[];
    language?: string;
    region?: string;
}
/**
 * Search result item
 */
export interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    publishedDate?: string;
    relevanceScore: number;
    metadata?: Record<string, unknown>;
}
/**
 * Search response
 */
export interface SearchResponse {
    query: string;
    totalResults: number;
    results: SearchResult[];
    facets?: Record<string, string[]>;
    tookMs: number;
}
/**
 * Competitor analysis input
 */
export interface CompetitorAnalysisInput {
    company: string;
    competitors?: string[];
    includeProducts?: boolean;
    includePricing?: boolean;
    includeMarketShare?: boolean;
}
/**
 * Competitor info
 */
export interface CompetitorInfo {
    name: string;
    website?: string;
    description?: string;
    founded?: string;
    headquarters?: string;
    employees?: string;
    funding?: string;
    socialLinks?: Record<string, string>;
}
/**
 * Product offering
 */
export interface ProductOffering {
    name: string;
    description?: string;
    price?: string;
    category?: string;
    features?: string[];
}
/**
 * Competitor analysis result
 */
export interface CompetitorAnalysis {
    id: string;
    targetCompany: string;
    competitors: CompetitorInfo[];
    marketPosition?: string;
    swot?: SWOTAnalysis;
    products?: ProductOffering[];
    pricingComparison?: PricingComparison[];
    marketShare?: number;
    generatedAt: string;
}
/**
 * SWOT Analysis
 */
export interface SWOTAnalysis {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}
/**
 * Pricing comparison
 */
export interface PricingComparison {
    productType: string;
    yourPrice?: string;
    competitorPrices: Record<string, string>;
}
/**
 * Report generation input
 */
export interface ReportGenerationInput {
    topic: string;
    format: ReportFormat;
    includeCharts?: boolean;
    includeRecommendations?: boolean;
    sections?: ReportSection[];
    audience?: string;
    timeframe?: string;
}
/**
 * Report section
 */
export interface ReportSection {
    title: string;
    content: string;
    order: number;
}
/**
 * Generated report
 */
export interface GeneratedReport {
    id: string;
    title: string;
    topic: string;
    format: ReportFormat;
    summary: string;
    sections: ReportSection[];
    recommendations?: string[];
    dataPoints?: Record<string, unknown>;
    sources?: string[];
    generatedAt: string;
    tookMs: number;
}
/**
 * Trend item
 */
export interface TrendItem {
    id: string;
    title: string;
    description: string;
    category: TrendCategory;
    sentiment: 'positive' | 'negative' | 'neutral';
    volume: number;
    velocity: 'rising' | 'stable' | 'declining';
    sources: string[];
    relatedTerms?: string[];
    firstSeen: string;
    lastUpdated: string;
}
/**
 * Trend summary
 */
export interface TrendSummary {
    category: TrendCategory;
    trends: TrendItem[];
    totalTrends: number;
    topMovers: TrendItem[];
    generatedAt: string;
}
/**
 * All trends response
 */
export interface TrendsResponse {
    allTrends: TrendSummary[];
    topOverall: TrendItem[];
    emerging: TrendItem[];
    generatedAt: string;
}
/**
 * Content summarization input
 */
export interface SummarizeInput {
    content: string;
    contentType?: 'article' | 'document' | 'webpage' | 'text';
    maxLength?: number;
    style?: 'brief' | 'standard' | 'detailed';
    includeKeyPoints?: boolean;
}
/**
 * Summarized content
 */
export interface SummaryResult {
    id: string;
    originalLength: number;
    summaryLength: number;
    summary: string;
    keyPoints?: string[];
    keywords?: string[];
    topics?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    generatedAt: string;
    tookMs: number;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
export declare const SearchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        dateRange: z.ZodOptional<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            from: string;
            to: string;
        }, {
            from: string;
            to: string;
        }>>;
        sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        language: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dateRange?: {
            from: string;
            to: string;
        } | undefined;
        sources?: string[] | undefined;
        language?: string | undefined;
        region?: string | undefined;
    }, {
        dateRange?: {
            from: string;
            to: string;
        } | undefined;
        sources?: string[] | undefined;
        language?: string | undefined;
        region?: string | undefined;
    }>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    offset: number;
    filters?: {
        dateRange?: {
            from: string;
            to: string;
        } | undefined;
        sources?: string[] | undefined;
        language?: string | undefined;
        region?: string | undefined;
    } | undefined;
}, {
    query: string;
    filters?: {
        dateRange?: {
            from: string;
            to: string;
        } | undefined;
        sources?: string[] | undefined;
        language?: string | undefined;
        region?: string | undefined;
    } | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const CompetitorAnalysisSchema: z.ZodObject<{
    company: z.ZodString;
    competitors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeProducts: z.ZodDefault<z.ZodBoolean>;
    includePricing: z.ZodDefault<z.ZodBoolean>;
    includeMarketShare: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    company: string;
    includeProducts: boolean;
    includePricing: boolean;
    includeMarketShare: boolean;
    competitors?: string[] | undefined;
}, {
    company: string;
    competitors?: string[] | undefined;
    includeProducts?: boolean | undefined;
    includePricing?: boolean | undefined;
    includeMarketShare?: boolean | undefined;
}>;
export declare const ReportGenerationSchema: z.ZodObject<{
    topic: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["summary", "detailed", "comprehensive"]>>;
    includeCharts: z.ZodDefault<z.ZodBoolean>;
    includeRecommendations: z.ZodDefault<z.ZodBoolean>;
    sections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        order: number;
    }, {
        title: string;
        content: string;
        order: number;
    }>, "many">>;
    audience: z.ZodOptional<z.ZodString>;
    timeframe: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    format: "summary" | "detailed" | "comprehensive";
    includeCharts: boolean;
    includeRecommendations: boolean;
    sections?: {
        title: string;
        content: string;
        order: number;
    }[] | undefined;
    audience?: string | undefined;
    timeframe?: string | undefined;
}, {
    topic: string;
    format?: "summary" | "detailed" | "comprehensive" | undefined;
    includeCharts?: boolean | undefined;
    includeRecommendations?: boolean | undefined;
    sections?: {
        title: string;
        content: string;
        order: number;
    }[] | undefined;
    audience?: string | undefined;
    timeframe?: string | undefined;
}>;
export declare const TrendsQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["technology", "market", "consumer", "industry", "competitive"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    timeframe: z.ZodDefault<z.ZodEnum<["24h", "7d", "30d", "90d"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    timeframe: "24h" | "7d" | "30d" | "90d";
    category?: "technology" | "market" | "consumer" | "industry" | "competitive" | undefined;
}, {
    limit?: number | undefined;
    timeframe?: "24h" | "7d" | "30d" | "90d" | undefined;
    category?: "technology" | "market" | "consumer" | "industry" | "competitive" | undefined;
}>;
export declare const SummarizeSchema: z.ZodObject<{
    content: z.ZodString;
    contentType: z.ZodDefault<z.ZodEnum<["article", "document", "webpage", "text"]>>;
    maxLength: z.ZodDefault<z.ZodNumber>;
    style: z.ZodDefault<z.ZodEnum<["brief", "standard", "detailed"]>>;
    includeKeyPoints: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    contentType: "article" | "document" | "webpage" | "text";
    maxLength: number;
    style: "detailed" | "standard" | "brief";
    includeKeyPoints: boolean;
}, {
    content: string;
    contentType?: "article" | "document" | "webpage" | "text" | undefined;
    maxLength?: number | undefined;
    style?: "detailed" | "standard" | "brief" | undefined;
    includeKeyPoints?: boolean | undefined;
}>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type CompetitorAnalysisInputType = z.infer<typeof CompetitorAnalysisSchema>;
export type ReportGenerationInputType = z.infer<typeof ReportGenerationSchema>;
export type TrendsQueryInput = z.infer<typeof TrendsQuerySchema>;
export type SummarizeInputType = z.infer<typeof SummarizeSchema>;
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map