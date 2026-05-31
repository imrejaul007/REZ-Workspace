/**
 * Mock XGBoost Prediction Service for HOJAI AI Churn Model
 * Simulates XGBoost ML model predictions
 */
import type { ChurnPredictionRequest, ChurnPredictionResponse, ModelInfo, TrainRequest, TrainResponse } from '../types/index.js';
export declare class ChurnModelService {
    /**
     * Normalize a value to 0-1 range based on typical ranges
     */
    private normalizeFeature;
    /**
     * Get feature weight with fallback
     */
    private getFeatureWeight;
    /**
     * Calculate churn probability using mock XGBoost logic
     * In production, this would call actual XGBoost model inference
     */
    private calculateChurnProbability;
    /**
     * Determine risk level based on churn probability
     */
    private getRiskLevel;
    /**
     * Calculate feature impact on prediction
     * Shows which features contributed most to the prediction
     */
    private calculateFeatureImpact;
    /**
     * Calculate prediction confidence based on feature completeness
     */
    private calculateConfidence;
    /**
     * Predict churn probability for a customer
     */
    predict(request: ChurnPredictionRequest): ChurnPredictionResponse;
    /**
     * Train model with new data (mock implementation)
     */
    train(requests: TrainRequest[]): Promise<TrainResponse>;
    /**
     * Get model information
     */
    getModelInfo(id: string): ModelInfo;
    /**
     * Get current model version
     */
    getModelVersion(): string;
}
export declare const churnModelService: ChurnModelService;
//# sourceMappingURL=modelService.d.ts.map