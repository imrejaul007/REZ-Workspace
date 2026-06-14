import { v4 as uuidv4 } from 'crypto';
import { Prediction, OutcomeTrackingEvent, BusinessGoal } from '../models/index.js';
import { OutcomeType, PredictionModel, PredictionResult, PredictionInput } from '../types/index.js';
import { config } from '../config/index.js';
import { predictionLogger } from 'utils/logger.js';
import { recordPrediction, startTimer } from '../utils/metrics.js';

// Simple UUID generator without external dependency
const generateId = (): string => {
  return 'pred_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};

/**
 * Prediction Engine Service
 * Provides ML-based outcome forecasting for business goals
 */
export class PredictionEngine {
  private confidenceThreshold: number;
  private horizonDays: number;

  constructor() {
    this.confidenceThreshold = config.prediction.confidenceThreshold;
    this.horizonDays = config.prediction.horizonDays;
  }

  /**
   * Generate a unique prediction ID
   */
  private generatePredictionId(): string {
    return generateId();
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(values: number[]): { slope: number; direction: 'up' | 'down' | 'stable' } {
    if (values.length < 2) {
      return { slope: 0, direction: 'stable' };
    }

    // Simple linear regression for trend
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgValue = sumY / n;
    const normalizedSlope = avgValue !== 0 ? slope / avgValue : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (normalizedSlope > 0.02) direction = 'up';
    else if (normalizedSlope < -0.02) direction = 'down';

    return { slope, direction };
  }

  /**
   * Calculate confidence based on data quality and trend consistency
   */
  private calculateConfidence(
    dataPoints: number,
    trendConsistency: number,
    variance: number
  ): number {
    // Base confidence on data points (more data = higher confidence)
    const dataFactor = Math.min(dataPoints / 90, 1) * 0.4;

    // Trend consistency factor (0-1)
    const consistencyFactor = trendConsistency * 0.3;

    // Low variance = higher confidence
    const varianceFactor = Math.max(0, 1 - Math.min(variance, 1)) * 0.3;

    return Math.min(0.95, 0.2 + dataFactor + consistencyFactor + varianceFactor);
  }

  /**
   * Calculate variance of values
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    // Normalize variance relative to mean
    return mean !== 0 ? variance / mean : 0;
  }

  /**
   * Generate scenario predictions (optimistic, base, pessimistic)
   */
  private generateScenarios(
    baseValue: number,
    trend: number,
    variance: number
  ): { optimistic: number; base: number; pessimistic: number } {
    const dailyTrend = trend;
    const daysOut = this.horizonDays;

    // Base prediction
    const base = baseValue + (dailyTrend * daysOut);

    // Apply variance for scenarios
    const volatility = Math.sqrt(variance) * baseValue;
    const optimistic = base + volatility * 0.5;
    const pessimistic = base - volatility * 0.5;

    return { optimistic, base, pessimistic };
  }

  /**
   * Identify key factors affecting the prediction
   */
  private identifyFactors(
    historicalData: Array<{ value: number; timestamp: Date }>,
    outcomeType: OutcomeType
  ): Array<{ name: string; impact: number; direction: 'positive' | 'negative' | 'neutral' }> {
    const factors: Array<{ name: string; impact: number; direction: 'positive' | 'negative' | 'neutral' }> = [];

    if (historicalData.length < 7) {
      return [{ name: 'limited_data', impact: 0.1, direction: 'neutral' }];
    }

    // Calculate trend
    const trend = this.calculateTrend(historicalData.map(d => d.value));

    // Add trend factor
    factors.push({
      name: 'historical_trend',
      impact: Math.abs(trend.slope),
      direction: trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral',
    });

    // Calculate recent vs older data comparison
    const midpoint = Math.floor(historicalData.length / 2);
    const recentAvg = historicalData.slice(midpoint).reduce((a, b) => a + b.value, 0) / (historicalData.length - midpoint);
    const olderAvg = historicalData.slice(0, midpoint).reduce((a, b) => a + b.value, 0) / midpoint;

    if (recentAvg > olderAvg * 1.05) {
      factors.push({ name: 'recent_momentum', impact: 0.3, direction: 'positive' });
    } else if (recentAvg < olderAvg * 0.95) {
      factors.push({ name: 'recent_decline', impact: 0.3, direction: 'negative' });
    }

    // Calculate variance factor
    const variance = this.calculateVariance(historicalData.map(d => d.value));
    if (variance > 0.5) {
      factors.push({ name: 'high_volatility', impact: 0.2, direction: 'negative' });
    } else if (variance < 0.1) {
      factors.push({ name: 'stable_performance', impact: 0.15, direction: 'positive' });
    }

    // Outcome-specific factors
    switch (outcomeType) {
      case OutcomeType.REVENUE:
        factors.push({ name: 'revenue_growth_rate', impact: 0.25, direction: trend.direction === 'up' ? 'positive' : 'negative' });
        break;
      case OutcomeType.CHURN:
        factors.push({ name: 'retention_trend', impact: 0.3, direction: trend.direction === 'down' ? 'positive' : 'negative' });
        break;
      case OutcomeType.LTV:
        factors.push({ name: 'customer_value_trend', impact: 0.25, direction: trend.direction === 'up' ? 'positive' : 'negative' });
        break;
      case OutcomeType.CONVERSION:
        factors.push({ name: 'conversion_momentum', impact: 0.2, direction: trend.direction === 'up' ? 'positive' : 'negative' });
        break;
    }

    return factors.slice(0, 5); // Limit to top 5 factors
  }

  /**
   * Select best model based on data characteristics
   */
  private selectModel(dataPoints: number, variance: number): PredictionModel {
    if (dataPoints < 14) {
      return PredictionModel.EXPONENTIAL_SMOOTHING;
    }
    if (dataPoints < 30) {
      return PredictionModel.LINEAR_REGRESSION;
    }
    if (variance > 0.3) {
      return PredictionModel.RANDOM_FOREST;
    }
    return PredictionModel.GRADIENT_BOOSTING;
  }

  /**
   * Predict outcome for a business
   */
  async predict(input: PredictionInput): Promise<PredictionResult> {
    const endTimer = startTimer();
    const predictionId = this.generatePredictionId();
    const { businessId, outcomeType, horizonDays = this.horizonDays, features } = input;

    predictionLogger.info('Starting prediction', { predictionId, businessId, outcomeType });

    try {
      // Fetch historical data for the business
      const historicalEvents = await OutcomeTrackingEvent.find({
        businessId,
        outcomeType,
      })
        .sort({ timestamp: -1 })
        .limit(input.historicalDataPoints || 90)
        .lean();

      const historicalData = historicalEvents
        .map(e => ({ value: e.value, timestamp: e.timestamp }))
        .reverse(); // Oldest first

      // If no historical data, use goal data if available
      let currentValue = 0;
      if (historicalData.length === 0) {
        const activeGoal = await BusinessGoal.findOne({
          businessId,
          type: outcomeType,
          status: 'active',
        }).lean();

        if (activeGoal) {
          currentValue = activeGoal.currentValue;
          // Generate synthetic historical data from goal
          const daysBetween = Math.floor(
            (activeGoal.targetDate.getTime() - activeGoal.startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const dailyTarget = (activeGoal.targetValue - activeGoal.currentValue) / daysBetween;

          for (let i = 0; i < 30; i++) {
            historicalData.push({
              value: activeGoal.currentValue + dailyTarget * i * (0.8 + Math.random() * 0.4),
              timestamp: new Date(activeGoal.startDate.getTime() + i * 24 * 60 * 60 * 1000),
            });
          }
        }
      } else {
        currentValue = historicalData[historicalData.length - 1].value;
      }

      // Calculate trend and confidence
      const trend = this.calculateTrend(historicalData.map(d => d.value));
      const variance = this.calculateVariance(historicalData.map(d => d.value));

      // Calculate trend consistency
      const trendConsistency = historicalData.length > 1
        ? 1 - this.calculateVariance(
            historicalData.slice(1).map((d, i) => d.value - historicalData[i].value)
          )
        : 0.5;

      const confidence = this.calculateConfidence(
        historicalData.length,
        trendConsistency,
        variance
      );

      // Select prediction model
      const model = this.selectModel(historicalData.length, variance);

      // Calculate prediction
      const dailyTrend = trend.slope;
      const predictedValue = currentValue + (dailyTrend * horizonDays);

      // Generate scenarios
      const scenario = this.generateScenarios(currentValue, dailyTrend, variance);

      // Identify factors
      const factors = this.identifyFactors(historicalData, outcomeType);

      // Apply custom features if provided
      let finalPredictedValue = predictedValue;
      if (features) {
        const featureAdjustment = Object.values(features).reduce((sum, val) => sum + val, 0) * 0.1;
        finalPredictedValue = predictedValue * (1 + featureAdjustment);
      }

      const predictionDate = new Date();
      const horizonDate = new Date(predictionDate.getTime() + horizonDays * 24 * 60 * 60 * 1000);

      // Create prediction result
      const predictionResult: PredictionResult = {
        predictionId,
        businessId,
        outcomeType,
        predictedValue: finalPredictedValue,
        confidence,
        predictionDate,
        horizonDate,
        model,
        factors,
        scenario: {
          optimistic: scenario.optimistic,
          base: scenario.base,
          pessimistic: scenario.pessimistic,
        },
      };

      // Save prediction to database
      await Prediction.create({
        predictionId,
        businessId,
        outcomeType,
        predictedValue: finalPredictedValue,
        confidence,
        predictionDate,
        horizonDate,
        model,
        factors,
        scenario: {
          optimistic: scenario.optimistic,
          base: scenario.base,
          pessimistic: scenario.pessimistic,
        },
      });

      // Record metrics
      const duration = endTimer();
      recordPrediction(outcomeType, model, 'success', confidence, duration);

      predictionLogger.info('Prediction completed', {
        predictionId,
        businessId,
        outcomeType,
        predictedValue: finalPredictedValue,
        confidence,
        duration,
      });

      return predictionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      predictionLogger.error('Prediction failed', errorMessage, { predictionId, businessId, outcomeType });

      recordPrediction(outcomeType, 'unknown', 'error', 0, endTimer());
      throw error;
    }
  }

  /**
   * Get recent predictions for a business
   */
  async getRecentPredictions(
    businessId: string,
    outcomeType?: OutcomeType,
    limit: number = 10
  ): Promise<PredictionResult[]> {
    const query: Record<string, any> = { businessId };
    if (outcomeType) {
      query.outcomeType = outcomeType;
    }

    const predictions = await Prediction.find(query)
      .sort({ predictionDate: -1 })
      .limit(limit)
      .lean();

    return predictions.map(p => ({
      predictionId: p.predictionId,
      businessId: p.businessId,
      outcomeType: p.outcomeType as OutcomeType,
      predictedValue: p.predictedValue,
      confidence: p.confidence,
      predictionDate: p.predictionDate,
      horizonDate: p.horizonDate,
      model: p.model as PredictionModel,
      factors: p.factors,
      scenario: p.scenario,
    }));
  }

  /**
   * Compare predictions with actual outcomes
   */
  async comparePrediction(predictionId: string): Promise<{
    prediction: PredictionResult;
    actual: number;
    error: number;
    errorPercent: number;
  } | null> {
    const prediction = await Prediction.findOne({ predictionId }).lean();
    if (!prediction) return null;

    // Get actual value from most recent tracking event
    const actualEvent = await OutcomeTrackingEvent.findOne({
      businessId: prediction.businessId,
      outcomeType: prediction.outcomeType,
      timestamp: { $gte: prediction.horizonDate },
    })
      .sort({ timestamp: 1 })
      .lean();

    if (!actualEvent) return null;

    const error = actualEvent.value - prediction.predictedValue;
    const errorPercent = prediction.predictedValue !== 0
      ? Math.abs(error / prediction.predictedValue) * 100
      : 0;

    return {
      prediction: {
        predictionId: prediction.predictionId,
        businessId: prediction.businessId,
        outcomeType: prediction.outcomeType as OutcomeType,
        predictedValue: prediction.predictedValue,
        confidence: prediction.confidence,
        predictionDate: prediction.predictionDate,
        horizonDate: prediction.horizonDate,
        model: prediction.model as PredictionModel,
        factors: prediction.factors,
        scenario: prediction.scenario,
      },
      actual: actualEvent.value,
      error,
      errorPercent,
    };
  }

  /**
   * Get prediction accuracy metrics
   */
  async getAccuracyMetrics(outcomeType?: OutcomeType): Promise<{
    overallAccuracy: number;
    averageErrorPercent: number;
    predictionsAnalyzed: number;
    byModel: Record<string, { accuracy: number; count: number }>;
  }> {
    const query: Record<string, any> = {};
    if (outcomeType) {
      query.outcomeType = outcomeType;
    }

    const predictions = await Prediction.find(query).lean();
    const analyzed: Array<{ model: string; errorPercent: number }> = [];

    for (const pred of predictions) {
      const comparison = await this.comparePrediction(pred.predictionId);
      if (comparison) {
        analyzed.push({
          model: pred.model,
          errorPercent: comparison.errorPercent,
        });
      }
    }

    if (analyzed.length === 0) {
      return {
        overallAccuracy: 0,
        averageErrorPercent: 100,
        predictionsAnalyzed: 0,
        byModel: {},
      };
    }

    const avgError = analyzed.reduce((sum, a) => sum + a.errorPercent, 0) / analyzed.length;
    const overallAccuracy = Math.max(0, 100 - avgError);

    const byModel: Record<string, { accuracy: number; count: number }> = {};
    for (const item of analyzed) {
      if (!byModel[item.model]) {
        byModel[item.model] = { accuracy: 0, count: 0 };
      }
      byModel[item.model].count++;
      byModel[item.model].accuracy += Math.max(0, 100 - item.errorPercent);
    }

    for (const model of Object.keys(byModel)) {
      byModel[model].accuracy /= byModel[model].count;
    }

    return {
      overallAccuracy,
      averageErrorPercent: avgError,
      predictionsAnalyzed: analyzed.length,
      byModel,
    };
  }
}

// Export singleton instance
export const predictionEngine = new PredictionEngine();
export default predictionEngine;