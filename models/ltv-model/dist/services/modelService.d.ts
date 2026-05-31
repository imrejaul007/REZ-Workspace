/**
 * Mock CatBoost LTV Prediction Service for HOJAI AI
 * Simulates CatBoost ML model predictions for customer lifetime value
 */
import type { LTVPredictionRequest, LTVPredictionResponse, LTVTrainSample, LTVTrainResponse, LTVModelInfo } from '../types/index.js';
export declare class LTVModelService {
    /**
     * Normalize a feature value to 0-1 range based on typical ranges
     */
    private normalizeFeature;
    /**
     * Get feature weight with fallback
     */
    private getFeatureWeight;
    /**
     * Calculate base LTV using mock CatBoost logic
     * In production, this would call actual CatBoost model inference
     */
    private calculateBaseLTV;
    /**
     * Calculate time-based predictions using growth rates
     */
    private calculateTimeframePredictions;
    /**
     * Determine customer tier based on LTV
     */
    private determineTier;
    /**
     * Calculate feature contributions to the prediction
     */
    private calculateFeatureContributions;
    /**
     * Calculate prediction confidence based on feature completeness and data quality
     */
    private calculateConfidence;
    /**
     * Predict LTV for a customer
     */
    predict(request: LTVPredictionRequest): LTVPredictionResponse;
    /**
     * Train model with new data (mock CatBoost training)
     */
    train(samples: LTVTrainSample[]): Promise<LTVTrainResponse>;
    /**
     * Get model information
     */
    getModelInfo(id: string): LTVModelInfo;
    /**
     * Get current model version
     */
    getModelVersion(): string;
}
export declare const ltvModelService: LTVModelService;
//# sourceMappingURL=modelService.d.ts.map