/**
 * Hojai Intelligence Platform
 *
 * Migration Strategy: Fork & Sync
 *
 * SOURCES:
 * - REZ-Intelligence/REZ-predictive-engine
 * - REZ-Intelligence/REZ-recommendation-engine
 * - REZ-Intelligence/REZ-ml-feature-store
 * - REZ-Intelligence/REZ-ltv-attribution
 *
 * PORT: 4530
 */
export interface PredictionRequest {
    customerId: string;
    features: Record<string, number | string>;
}
export interface PredictionResult {
    customerId: string;
    predictions: {
        churn_probability?: number;
        ltv_prediction?: number;
        conversion_probability?: number;
        revisit_probability?: number;
        next_purchase_days?: number;
    };
    confidence: number;
    modelVersion: string;
    calculatedAt: string;
}
export interface RecommendationRequest {
    customerId?: string;
    productIds?: string[];
    limit?: number;
    context?: Record<string, any>;
}
export interface RecommendationResult {
    customerId?: string;
    recommendations: {
        productId: string;
        score: number;
        reason: string;
    }[];
    modelVersion: string;
    calculatedAt: string;
}
export interface SegmentRequest {
    customerId: string;
}
export interface SegmentResult {
    customerId: string;
    segments: string[];
    segmentScores: Record<string, number>;
}
/**
 * Feature Store for ML
 */
export declare class FeatureStore {
    private features;
    /**
     * Store features for a customer
     */
    storeFeatures(tenantId: string, customerId: string, features: Record<string, number>): Promise<void>;
    /**
     * Get features for a customer
     */
    getFeatures(tenantId: string, customerId: string): Promise<Record<string, number>>;
    /**
     * Get default features (for new customers)
     */
    private getDefaultFeatures;
}
/**
 * Prediction Engine
 */
export declare class PredictionEngine {
    private featureStore;
    constructor(featureStore: FeatureStore);
    /**
     * Predict churn probability
     */
    predictChurn(tenantId: string, customerId: string): Promise<number>;
    /**
     * Predict LTV (Lifetime Value)
     */
    predictLTV(tenantId: string, customerId: string): Promise<number>;
    /**
     * Predict conversion probability
     */
    predictConversion(tenantId: string, customerId: string): Promise<number>;
    /**
     * Predict revisit probability
     */
    predictRevisit(tenantId: string, customerId: string): Promise<number>;
    /**
     * Get all predictions for a customer
     */
    predictAll(tenantId: string, customerId: string): Promise<PredictionResult>;
}
/**
 * Recommendation Engine
 */
export declare class RecommendationEngine {
    /**
     * Get personalized recommendations
     */
    getRecommendations(tenantId: string, customerId: string, limit?: number): Promise<RecommendationResult>;
    /**
     * Get similar products
     */
    getSimilarProducts(tenantId: string, productId: string, limit?: number): Promise<{
        productId: string;
        score: number;
    }[]>;
    /**
     * Get trending products
     */
    getTrending(tenantId: string, category?: string, limit?: number): Promise<{
        productId: string;
        score: number;
        reason: string;
    }[]>;
}
/**
 * Segmentation Engine
 */
export declare class SegmentationEngine {
    /**
     * Segment a customer
     */
    segmentCustomer(tenantId: string, customerId: string, features: Record<string, number>): Promise<SegmentResult>;
}
/**
 * Hojai Intelligence Platform
 */
export declare class HojaiIntelligencePlatform {
    private featureStore;
    private predictionEngine;
    private recommendationEngine;
    private segmentationEngine;
    constructor();
    /**
     * Store customer features
     */
    storeFeatures(tenantId: string, customerId: string, features: Record<string, number>): Promise<void>;
    /**
     * Get all predictions
     */
    predictAll(tenantId: string, customerId: string): Promise<PredictionResult>;
    /**
     * Get recommendations
     */
    recommend(tenantId: string, customerId: string, limit?: number): Promise<RecommendationResult>;
    /**
     * Segment customer
     */
    segment(tenantId: string, customerId: string, features?: Record<string, number>): Promise<SegmentResult>;
}
/**
 * Create Express routes
 */
export declare function createIntelligenceRoutes(platform: HojaiIntelligencePlatform): import("express-serve-static-core").Router;
/**
 * Bootstrap the Intelligence Platform
 */
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiIntelligencePlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiIntelligencePlatform: typeof HojaiIntelligencePlatform;
    FeatureStore: typeof FeatureStore;
    PredictionEngine: typeof PredictionEngine;
    RecommendationEngine: typeof RecommendationEngine;
    SegmentationEngine: typeof SegmentationEngine;
    createIntelligenceRoutes: typeof createIntelligenceRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map