import { ContentType, ContentStatus, ContentTone, IContent } from '../types';
export interface ContentGeneratorConfig {
    defaultTone: ContentTone;
    maxContentLength: number;
    enableSEOptimization: boolean;
    enableReadabilityCheck: boolean;
}
export declare class ContentGeneratorService {
    private config;
    constructor(config?: Partial<ContentGeneratorConfig>);
    /**
     * Generate content based on type and requirements
     */
    generateContent(tenantId: string, userId: string, params: {
        type: ContentType;
        topic: string;
        keywords?: string[];
        targetAudience?: string;
        tone?: ContentTone;
        length?: 'short' | 'medium' | 'long';
        brandVoice?: string;
        cta?: string;
        additionalContext?: string;
    }): Promise<{
        content: string;
        metadata: {
            wordCount: number;
            readabilityScore: number;
            seoScore: number;
            suggestedKeywords: string[];
            hashtags: string[];
        };
    }>;
    /**
     * Generate content based on type
     */
    private generateContentByType;
    /**
     * Generate blog post content
     */
    private generateBlogPost;
    /**
     * Generate social media post
     */
    private generateSocialPost;
    /**
     * Generate email content
     */
    private generateEmail;
    /**
     * Generate ad copy
     */
    private generateAdCopy;
    /**
     * Generate landing page content
     */
    private generateLandingPage;
    /**
     * Generate product description
     */
    private generateProductDescription;
    /**
     * Generate video script
     */
    private generateVideoScript;
    /**
     * Generate newsletter content
     */
    private generateNewsletter;
    /**
     * Generate case study
     */
    private generateCaseStudy;
    /**
     * Generate white paper
     */
    private generateWhitePaper;
    /**
     * Generate generic content
     */
    private generateGenericContent;
    /**
     * Get tone-specific introduction
     */
    private getToneIntro;
    /**
     * Apply brand voice to content
     */
    private applyBrandVoice;
    /**
     * Add call-to-action to content
     */
    private addCTA;
    /**
     * Count words in content
     */
    private countWords;
    /**
     * Calculate readability score (simplified Flesch-based score)
     */
    private calculateReadabilityScore;
    /**
     * Count syllables in a word (simplified)
     */
    private countSyllables;
    /**
     * Generate keywords from content
     */
    private generateKeywords;
    /**
     * Calculate SEO score
     */
    private calculateSEOScore;
    /**
     * Generate hashtags from topic
     */
    private generateHashtags;
    /**
     * Store generated content
     */
    private storeContent;
    /**
     * Get content by ID
     */
    getContent(tenantId: string, contentId: string): Promise<IContent | null>;
    /**
     * List content with filters
     */
    listContent(tenantId: string, filters: {
        type?: ContentType;
        status?: ContentStatus;
        createdBy?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: IContent[];
        total: number;
    }>;
    /**
     * Update content status
     */
    updateContentStatus(tenantId: string, contentId: string, status: ContentStatus): Promise<IContent | null>;
    /**
     * Map document to interface
     */
    private mapToIContent;
}
export declare const contentGenerator: ContentGeneratorService;
//# sourceMappingURL=contentGenerator.d.ts.map