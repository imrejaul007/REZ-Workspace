import { Prediction, RFM } from '../types/index.js';
export declare class PredictService {
    private redis;
    private readonly CACHE_TTL;
    constructor();
    /**
     * Get churn prediction for a user
     */
    predictChurn(params: {
        tenantId: string;
        userId: string;
        features?: Record<string, number>;
    }): Promise<Prediction>;
    /**
     * Get LTV prediction for a user
     */
    predictLTV(params: {
        tenantId: string;
        userId: string;
        features?: Record<string, number>;
        timeframe?: number;
    }): Promise<Prediction>;
    /**
     * Get revisit prediction
     */
    predictRevisit(params: {
        tenantId: string;
        userId: string;
        features?: Record<string, number>;
    }): Promise<Prediction>;
    /**
     * Get conversion prediction
     */
    predictConversion(params: {
        tenantId: string;
        userId: string;
        context?: Record<string, unknown>;
    }): Promise<Prediction>;
    /**
     * Get all predictions for a user
     */
    getAllPredictions(params: {
        tenantId: string;
        userId: string;
        features?: Record<string, number>;
    }): Promise<Prediction[]>;
    /**
     * Get at-risk users
     */
    getAtRiskUsers(tenantId: string, limit?: number): Promise<Prediction[]>;
    /**
     * Get high-value users
     */
    getHighValueUsers(tenantId: string, limit?: number): Promise<Prediction[]>;
    /**
     * Compute RFM for a user
     */
    computeRFM(params: {
        tenantId: string;
        userId: string;
        lastOrderDate: Date;
        totalOrders: number;
        totalSpent: number;
    }): Promise<RFM>;
    private computeChurnScore;
    private getChurnRisk;
    private getChurnFactors;
    private getChurnExplanation;
    private getChurnRecommendations;
    private computeLTV;
    private getLTVFactors;
    private computeRevisitScore;
    private estimateRevisitDays;
    private getRevisitFactors;
    private computeConversionScore;
    private getRecencyScore;
    private getFrequencyScore;
    private getMonetaryScore;
    private getRFMTier;
    private getRFMSegment;
}
export declare const predictService: PredictService;
//# sourceMappingURL=predictService.d.ts.map