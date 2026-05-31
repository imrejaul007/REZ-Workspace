/**
 * HOJAI AI Recommendation Engine - Type Definitions
 */
export interface RecommendationRequest {
    userId?: string;
    productId?: string;
    limit?: number;
    type?: RecommendationType;
}
export type RecommendationType = 'personalized' | 'trending' | 'similar' | 'frequently-bought';
export interface RecommendationResponse {
    items: RecommendationItem[];
    type: RecommendationType;
    generatedAt: string;
}
export interface RecommendationItem {
    id: string;
    name: string;
    score: number;
    reason: string;
}
export interface SimilarItemsRequest {
    productId: string;
    limit?: number;
}
export interface TrendingRequest {
    limit?: number;
    category?: string;
    timeframe?: number;
}
export interface UserRecommendationsRequest {
    userId: string;
    limit?: number;
    type?: RecommendationType;
}
export interface Product {
    id: string;
    name: string;
    category: string;
    embedding: number[];
    price: number;
    tags: string[];
    createdAt: string;
}
export interface UserPurchase {
    userId: string;
    productId: string;
    quantity: number;
    timestamp: string;
}
export interface PurchasePattern {
    productId: string;
    relatedProducts: Map<string, number>;
    totalPurchases: number;
}
export interface TrendingItem {
    productId: string;
    purchaseCount: number;
    recentPurchases: number;
    velocity: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: string;
}
export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    version: string;
    uptime: number;
    timestamp: string;
    checks: {
        memory: boolean;
        data: boolean;
    };
}
export declare const RecommendationRequestSchema: {
    readonly limit: {
        readonly min: 1;
        readonly max: 100;
        readonly default: 10;
    };
};
export declare const SimilarItemsRequestSchema: {
    readonly productId: {
        readonly required: true;
    };
    readonly limit: {
        readonly min: 1;
        readonly max: 50;
        readonly default: 10;
    };
};
export declare const TrendingRequestSchema: {
    readonly limit: {
        readonly min: 1;
        readonly max: 50;
        readonly default: 10;
    };
    readonly timeframe: {
        readonly min: 1;
        readonly max: 30;
        readonly default: 7;
    };
};
//# sourceMappingURL=index.d.ts.map