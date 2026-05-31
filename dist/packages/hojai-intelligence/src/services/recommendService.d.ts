import { Recommendation, RecommendationType } from '../types/index.js';
export declare class RecommendService {
    /**
     * Get personalized recommendations for a user
     */
    getRecommendations(params: {
        tenantId: string;
        userId: string;
        type?: RecommendationType;
        limit?: number;
        context?: {
            trigger?: string;
            entityType?: string;
            entityId?: string;
        };
    }): Promise<Recommendation[]>;
    /**
     * Get similar items to a given product
     */
    getSimilarItems(params: {
        tenantId: string;
        userId: string;
        productId: string;
        limit?: number;
    }): Promise<Recommendation[]>;
    /**
     * Get frequently bought together items
     */
    getFrequentlyBoughtTogether(params: {
        tenantId: string;
        userId: string;
        productIds: string[];
        limit?: number;
    }): Promise<Recommendation[]>;
    /**
     * Get trending items
     */
    getTrending(params: {
        tenantId: string;
        userId: string;
        category?: string;
        limit?: number;
    }): Promise<Recommendation[]>;
    /**
     * Get personalized offers
     */
    getOffers(params: {
        tenantId: string;
        userId: string;
        limit?: number;
    }): Promise<Recommendation[]>;
    /**
     * Get next best actions
     */
    getNextBestActions(params: {
        tenantId: string;
        userId: string;
        context?: Record<string, unknown>;
    }): Promise<Recommendation[]>;
    /**
     * Track recommendation impression
     */
    trackImpression(params: {
        tenantId: string;
        recommendationId: string;
    }): Promise<void>;
    /**
     * Track recommendation click
     */
    trackClick(params: {
        tenantId: string;
        recommendationId: string;
    }): Promise<void>;
    /**
     * Track recommendation conversion
     */
    trackConversion(params: {
        tenantId: string;
        recommendationId: string;
    }): Promise<void>;
    /**
     * Create a recommendation
     */
    createRecommendation(params: {
        tenantId: string;
        userId: string;
        type: RecommendationType;
        category: string;
        title: string;
        description?: string;
        entityType: 'product' | 'content' | 'offer' | 'action';
        entityId: string;
        score: number;
        confidence?: number;
        reason: string;
        context?: {
            trigger?: string;
            sourceEntityId?: string;
            position?: number;
        };
        display?: {
            imageUrl?: string;
            price?: number;
            discount?: number;
            rating?: number;
        };
        metadata?: Record<string, unknown>;
        validUntil?: Date;
    }): Promise<Recommendation>;
    /**
     * Get recommendation performance stats
     */
    getPerformanceStats(params: {
        tenantId: string;
        startDate: Date;
        endDate: Date;
    }): Promise<{
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        clickThroughRate: number;
        conversionRate: number;
        topPerforming: Recommendation[];
    }>;
}
export declare const recommendService: RecommendService;
//# sourceMappingURL=recommendService.d.ts.map