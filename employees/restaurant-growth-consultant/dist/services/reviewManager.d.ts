import { ReviewRequest, ReviewResponse } from '../types';
/**
 * Review Management Service
 * Analyzes reviews, generates response suggestions, and creates review strategies
 */
export declare class ReviewManagerService {
    private readonly SENTIMENT_WEIGHTS;
    /**
     * Analyze reviews and generate management strategy
     */
    analyze(request: ReviewRequest): Promise<ReviewResponse>;
    /**
     * Process and analyze reviews for sentiment
     */
    private processReviews;
    /**
     * Simple sentiment detection based on keywords
     */
    private detectSentiment;
    /**
     * Extract category mentions from review text
     */
    private extractCategories;
    /**
     * Generate comprehensive review analysis
     */
    private generateAnalysis;
    /**
     * Calculate scores for each category
     */
    private calculateCategoryScores;
    /**
     * Calculate trend based on recent vs older reviews
     */
    private calculateTrend;
    /**
     * Generate response suggestions for reviews
     */
    private generateResponseSuggestions;
    /**
     * Generate review management strategy
     */
    private generateStrategy;
    /**
     * Generate review generation campaigns
     */
    private generateCampaigns;
    /**
     * Calculate number of reviews needed to reach target rating
     */
    private calculateReviewsNeeded;
    /**
     * Generate automation rules
     */
    private generateAutomation;
    /**
     * Generate review report
     */
    generateReport(request: ReviewRequest, response: ReviewResponse): Promise<string>;
}
export declare const reviewManagerService: ReviewManagerService;
//# sourceMappingURL=reviewManager.d.ts.map