/**
 * Hojai Intelligence Service
 * Version: 1.0 | Port: 4530
 * ML predictions, recommendations, and insights
 */
export interface Prediction {
    id: string;
    tenantId: string;
    userId?: string;
    type: 'churn' | 'ltv' | 'propensity' | 'revisit' | 'conversion' | 'intent';
    model: string;
    score: number;
    confidence: number;
    features: Record<string, unknown>;
    prediction: unknown;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
export interface Recommendation {
    id: string;
    tenantId: string;
    userId?: string;
    type: 'product' | 'content' | 'action' | 'personalized';
    items: RecommendationItem[];
    strategy: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
export interface RecommendationItem {
    id: string;
    type: string;
    score: number;
    reason?: string;
    metadata?: Record<string, unknown>;
}
export interface Insight {
    id: string;
    tenantId: string;
    userId?: string;
    type: 'segment' | 'trend' | 'anomaly' | 'opportunity' | 'risk';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation?: string;
    data?: Record<string, unknown>;
    createdAt: string;
}
export declare const predictionStore: Map<string, Prediction[]>;
export declare const recommendationStore: Map<string, Recommendation[]>;
export declare const insightStore: Map<string, Insight[]>;
interface TenantContext {
    tenant_id: string;
    user_id?: string;
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
declare function predictChurn(features: Record<string, unknown>): {
    score: number;
    confidence: number;
};
declare function predictLTV(features: Record<string, unknown>): {
    score: number;
    confidence: number;
};
declare function predictIntent(features: Record<string, unknown>): {
    score: number;
    confidence: number;
    intent: string;
};
declare function predictPropensity(features: Record<string, unknown>): {
    score: number;
    confidence: number;
};
declare function predictRevisit(features: Record<string, unknown>): {
    score: number;
    confidence: number;
    days: number;
};
declare function predictConversion(features: Record<string, unknown>): {
    score: number;
    confidence: number;
};
declare function generateRecommendations(type: string, userId: string, tenantId: string, context?: Record<string, unknown>): RecommendationItem[];
declare class HojaiIntelligence {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private groupByType;
    start(): void;
}
declare const intelligence: HojaiIntelligence;
export { HojaiIntelligence, predictChurn, predictLTV, predictIntent, predictPropensity, predictRevisit, predictConversion, generateRecommendations };
export default intelligence;
//# sourceMappingURL=index.d.ts.map