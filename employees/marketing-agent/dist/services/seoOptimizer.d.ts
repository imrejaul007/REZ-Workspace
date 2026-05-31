import { SEOContentType, ISEOOptimization } from '../types';
export interface SEOConfig {
    maxTitleLength: number;
    maxDescriptionLength: number;
    minKeywordDensity: number;
    maxKeywordDensity: number;
}
export declare class SEOOptimizerService {
    private config;
    constructor(config?: Partial<SEOConfig>);
    /**
     * Optimize content for SEO
     */
    optimize(tenantId: string, params: {
        url?: string;
        content?: string;
        type?: SEOContentType;
        targetKeywords: string[];
        competitorUrls?: string[];
        metaTitle?: string;
        metaDescription?: string;
    }): Promise<{
        metaTitle: string;
        metaDescription: string;
        suggestions: string[];
        contentScore: number;
        keywordDensity: Record<string, number>;
        headings?: {
            h1: string[];
            h2: string[];
            h3: string[];
        };
        optimizedContent?: string;
    }>;
    /**
     * Generate meta title
     */
    private generateMetaTitle;
    /**
     * Generate meta description
     */
    private generateMetaDescription;
    /**
     * Calculate keyword density
     */
    private calculateKeywordDensity;
    /**
     * Calculate content score
     */
    private calculateContentScore;
    /**
     * Generate SEO suggestions
     */
    private generateSuggestions;
    /**
     * Generate heading structure
     */
    private generateHeadings;
    /**
     * Optimize content with headings and structure
     */
    private optimizeContent;
    /**
     * Get SEO analysis for URL
     */
    analyzeUrl(tenantId: string, url: string): Promise<ISEOOptimization | null>;
    /**
     * List SEO optimizations
     */
    listOptimizations(tenantId: string, filters: {
        type?: SEOContentType;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: ISEOOptimization[];
        total: number;
    }>;
    /**
     * Map document to interface
     */
    private mapToISEOOptimization;
}
export declare const seoOptimizer: SEOOptimizerService;
//# sourceMappingURL=seoOptimizer.d.ts.map