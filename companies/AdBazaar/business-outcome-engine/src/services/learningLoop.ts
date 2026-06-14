import { LearningOutcome, Prediction, OutcomeTrackingEvent, Intervention } from '../models/index.js';
import { OutcomeType, PredictionModel, LearningOutcome as LearningOutcomeType } from '../types/index.js';
import { config } from '../config/index.js';
import { learningLogger } from 'utils/logger.js';
import { recordLearningOutcome, modelAccuracy, learningUpdateTotal, startTimer } from '../utils/metrics.js';

// Generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

interface LearningStats {
  totalOutcomes: number;
  averageError: number;
  accuracyByType: Record<string, number>;
  accuracyByModel: Record<string, number>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Learning Loop Service
 * Continuously improves predictions by learning from outcomes
 */
export class LearningLoopService {
  private minSamples: number;
  private updateIntervalMs: number;
  private lastUpdate: Date | null = null;

  constructor() {
    this.minSamples = config.learning.minSamples;
    this.updateIntervalMs = config.learning.updateIntervalHours * 60 * 60 * 1000;
  }

  /**
   * Record an outcome and learn from it
   */
  async recordOutcome(
    businessId: string,
    predictionId: string,
    interventionId?: string
  ): Promise<LearningOutcomeType | null> {
    const endTimer = startTimer();

    learningLogger.info('Recording outcome', { businessId, predictionId, interventionId });

    try {
      // Get the prediction
      const prediction = await Prediction.findOne({ predictionId }).lean();
      if (!prediction) {
        learningLogger.error('Prediction not found', predictionId, { predictionId });
        return null;
      }

      // Get actual value from tracking events after horizon date
      const actualEvent = await OutcomeTrackingEvent.findOne({
        businessId,
        outcomeType: prediction.outcomeType,
        timestamp: { $gte: prediction.horizonDate },
      })
        .sort({ timestamp: 1 })
        .lean();

      if (!actualEvent) {
        learningLogger.info('No actual outcome yet', { predictionId, horizonDate: prediction.horizonDate });
        return null;
      }

      const actualValue = actualEvent.value;
      const predictedValue = prediction.predictedValue;
      const error = actualValue - predictedValue;
      const errorPercent = predictedValue !== 0
        ? Math.abs(error / predictedValue) * 100
        : 0;

      // Calculate factor contributions
      const factors = prediction.factors.map(f => {
        // Estimate actual contribution vs predicted
        const predictedContribution = f.impact * (predictedValue / 100);
        const actualContribution = f.impact * (actualValue / 100);
        const contributionDiff = Math.abs(actualContribution - predictedContribution);

        return {
          name: f.name,
          predicted: predictedContribution,
          actual: actualContribution,
          contribution: contributionDiff / predictedValue * 100,
        };
      });

      // Determine feedback quality
      let feedbackQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
      if (errorPercent <= 5) feedbackQuality = 'excellent';
      else if (errorPercent <= 15) feedbackQuality = 'good';
      else if (errorPercent <= 30) feedbackQuality = 'fair';
      else feedbackQuality = 'poor';

      // Create learning outcome record
      const outcomeId = generateId('learn');
      const learningOutcome = await LearningOutcome.create({
        outcomeId,
        businessId,
        predictionId,
        interventionId,
        predictedValue,
        actualValue,
        error,
        errorPercent,
        factors,
        timestamp: new Date(),
        modelUsed: prediction.model,
        feedbackQuality,
      });

      // Record metrics
      recordLearningOutcome(prediction.outcomeType as string, prediction.model, errorPercent, feedbackQuality);

      const duration = endTimer();
      learningLogger.info('Outcome recorded and learned', {
        outcomeId,
        predictionId,
        predictedValue,
        actualValue,
        errorPercent,
        feedbackQuality,
        duration,
      });

      return {
        outcomeId,
        businessId,
        predictionId,
        interventionId,
        predictedValue,
        actualValue,
        error,
        errorPercent,
        factors,
        timestamp: learningOutcome.timestamp,
        modelUsed: prediction.model as PredictionModel,
        feedbackQuality,
      };
    } catch (error) {
      learningLogger.error('Failed to record outcome', error, { predictionId });
      throw error;
    }
  }

  /**
   * Get learning statistics
   */
  async getStats(outcomeType?: OutcomeType): Promise<LearningStats> {
    const query: Record<string, any> = {};
    if (outcomeType) {
      query.outcomeType = outcomeType;
    }

    // Get all learning outcomes
    const outcomes = await LearningOutcome.find().lean();

    if (outcomes.length === 0) {
      return {
        totalOutcomes: 0,
        averageError: 100,
        accuracyByType: {},
        accuracyByModel: {},
        recentTrend: 'stable',
      };
    }

    // Calculate overall statistics
    const totalOutcomes = outcomes.length;
    const averageError = outcomes.reduce((sum, o) => sum + o.errorPercent, 0) / totalOutcomes;

    // Calculate accuracy by outcome type
    const accuracyByType: Record<string, number> = {};
    const byType: Record<string, number[]> = {};

    for (const outcome of outcomes) {
      // We need outcomeType from prediction
      const prediction = await Prediction.findOne({ predictionId: outcome.predictionId }).lean();
      if (prediction) {
        const type = prediction.outcomeType;
        if (!byType[type]) {
          byType[type] = [];
        }
        byType[type].push(outcome.errorPercent);
      }
    }

    for (const [type, errors] of Object.entries(byType)) {
      accuracyByType[type] = 100 - (errors.reduce((a, b) => a + b, 0) / errors.length);
    }

    // Calculate accuracy by model
    const accuracyByModel: Record<string, number> = {};
    const byModel: Record<string, number[]> = {};

    for (const outcome of outcomes) {
      if (!byModel[outcome.modelUsed]) {
        byModel[outcome.modelUsed] = [];
      }
      byModel[outcome.modelUsed].push(outcome.errorPercent);
    }

    for (const [model, errors] of Object.entries(byModel)) {
      accuracyByModel[model] = 100 - (errors.reduce((a, b) => a + b, 0) / errors.length);
    }

    // Determine recent trend (last 20% vs first 20%)
    const sortedOutcomes = [...outcomes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentCount = Math.max(1, Math.floor(sortedOutcomes.length * 0.2));
    const recentOutcomes = sortedOutcomes.slice(-recentCount);
    const olderOutcomes = sortedOutcomes.slice(0, recentCount);

    const recentAvgError = recentOutcomes.reduce((sum, o) => sum + o.errorPercent, 0) / recentOutcomes.length;
    const olderAvgError = olderOutcomes.reduce((sum, o) => sum + o.errorPercent, 0) / olderOutcomes.length;

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvgError < olderAvgError * 0.9) recentTrend = 'improving';
    else if (recentAvgError > olderAvgError * 1.1) recentTrend = 'declining';

    return {
      totalOutcomes,
      averageError,
      accuracyByType,
      accuracyByModel,
      recentTrend,
    };
  }

  /**
   * Trigger model update if conditions are met
   */
  async triggerModelUpdate(outcomeType: OutcomeType): Promise<{
    triggered: boolean;
    reason: string;
    samplesAvailable: number;
  }> {
    // Check if enough time has passed since last update
    if (this.lastUpdate && Date.now() - this.lastUpdate.getTime() < this.updateIntervalMs) {
      return {
        triggered: false,
        reason: 'Update interval not reached',
        samplesAvailable: 0,
      };
    }

    // Check if we have enough new samples
    const sinceLastUpdate = this.lastUpdate || new Date(0);
    const newOutcomes = await LearningOutcome.countDocuments({
      outcomeType,
      timestamp: { $gte: sinceLastUpdate },
    });

    if (newOutcomes < this.minSamples / 4) {
      return {
        triggered: false,
        reason: `Insufficient new samples (${newOutcomes} < ${this.minSamples / 4})`,
        samplesAvailable: newOutcomes,
      };
    }

    // Trigger model update
    this.lastUpdate = new Date();
    learningUpdateTotal.inc({ outcome_type: outcomeType, status: 'triggered' });

    learningLogger.info('Model update triggered', {
      outcomeType,
      samplesAvailable: newOutcomes,
    });

    return {
      triggered: true,
      reason: 'Sufficient samples and time elapsed',
      samplesAvailable: newOutcomes,
    };
  }

  /**
   * Analyze intervention effectiveness
   */
  async analyzeInterventionEffectiveness(interventionId: string): Promise<{
    interventionId: string;
    type: string;
    expectedImpact: number;
    actualImpact: number;
    effectiveness: number;
    roi: number | null;
    success: boolean;
  } | null> {
    const intervention = await Intervention.findOne({ interventionId }).lean();
    if (!intervention) {
      return null;
    }

    if (!intervention.result) {
      return {
        interventionId,
        type: intervention.type,
        expectedImpact: intervention.expectedImpact,
        actualImpact: 0,
        effectiveness: 0,
        roi: null,
        success: false,
      };
    }

    const actualImpact = intervention.result.actualImpact || 0;
    const expectedImpact = intervention.expectedImpact;
    const effectiveness = expectedImpact !== 0 ? (actualImpact / expectedImpact) * 100 : 0;

    let roi: number | null = null;
    if (intervention.cost && intervention.cost > 0 && actualImpact > 0) {
      roi = (actualImpact - intervention.cost) / intervention.cost;
    }

    const success = intervention.result.achieved || effectiveness >= 80;

    return {
      interventionId,
      type: intervention.type,
      expectedImpact,
      actualImpact,
      effectiveness,
      roi,
      success,
    };
  }

  /**
   * Get best performing interventions by type
   */
  async getBestInterventions(limit: number = 10): Promise<Array<{
    type: string;
    averageEffectiveness: number;
    totalInterventions: number;
    successRate: number;
    averageROI: number;
  }>> {
    const interventions = await Intervention.find({
      status: 'completed',
      result: { $exists: true },
    }).lean();

    const byType: Record<string, {
      effectiveness: number[];
      successCount: number;
      totalCount: number;
      roiValues: number[];
    }> = {};

    for (const intervention of interventions) {
      if (!intervention.result?.actualImpact) continue;

      const type = intervention.type;
      if (!byType[type]) {
        byType[type] = { effectiveness: [], successCount: 0, totalCount: 0, roiValues: [] };
      }

      const effectiveness = intervention.expectedImpact !== 0
        ? (intervention.result.actualImpact / intervention.expectedImpact) * 100
        : 0;

      byType[type].effectiveness.push(effectiveness);
      if (intervention.result.achieved) {
        byType[type].successCount++;
      }
      byType[type].totalCount++;

      if (intervention.estimatedROI) {
        byType[type].roiValues.push(intervention.estimatedROI);
      }
    }

    const results = Object.entries(byType).map(([type, data]) => ({
      type,
      averageEffectiveness: data.effectiveness.reduce((a, b) => a + b, 0) / data.effectiveness.length,
      totalInterventions: data.totalCount,
      successRate: (data.successCount / data.totalCount) * 100,
      averageROI: data.roiValues.length > 0
        ? data.roiValues.reduce((a, b) => a + b, 0) / data.roiValues.length
        : 0,
    }));

    results.sort((a, b) => b.averageEffectiveness - a.averageEffectiveness);

    return results.slice(0, limit);
  }

  /**
   * Get recommendations for model improvements
   */
  async getModelImprovementRecommendations(): Promise<Array<{
    model: string;
    currentAccuracy: number;
    recommendedChanges: string[];
    priority: 'high' | 'medium' | 'low';
  }>> {
    const stats = await this.getStats();

    const recommendations: Array<{
      model: string;
      currentAccuracy: number;
      recommendedChanges: string[];
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Analyze each model's performance
    for (const [model, accuracy] of Object.entries(stats.accuracyByModel)) {
      const changes: string[] = [];

      if (accuracy < 70) {
        changes.push('Consider switching to ensemble model for better accuracy');
        changes.push('Increase historical data points for training');
        changes.push('Review and recalibrate feature weights');
      } else if (accuracy < 85) {
        changes.push('Fine-tune hyperparameters');
        changes.push('Add more relevant features');
        changes.push('Consider feature engineering for high-impact variables');
      } else {
        changes.push('Model is performing well - maintain current configuration');
        changes.push('Continue collecting data for edge case handling');
      }

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (accuracy < 60) priority = 'high';
      else if (accuracy >= 90) priority = 'low';

      recommendations.push({
        model,
        currentAccuracy: accuracy,
        recommendedChanges: changes,
        priority,
      });
    }

    return recommendations;
  }

  /**
   * Backfill learning outcomes for existing predictions
   */
  async backfillLearningOutcomes(businessId?: string): Promise<{
    processed: number;
    recorded: number;
    skipped: number;
  }> {
    const query: Record<string, any> = {};
    if (businessId) {
      query.businessId = businessId;
    }

    const predictions = await Prediction.find(query).lean();
    let processed = 0;
    let recorded = 0;
    let skipped = 0;

    for (const prediction of predictions) {
      processed++;

      // Check if already recorded
      const existing = await LearningOutcome.findOne({ predictionId: prediction.predictionId });
      if (existing) {
        skipped++;
        continue;
      }

      // Try to record outcome
      const result = await this.recordOutcome(
        prediction.businessId,
        prediction.predictionId
      );

      if (result) {
        recorded++;
      } else {
        skipped++;
      }
    }

    learningLogger.info('Backfill completed', { processed, recorded, skipped });

    return { processed, recorded, skipped };
  }

  /**
   * Get learning curve data for visualization
   */
  async getLearningCurve(outcomeType: OutcomeType, bins: number = 20): Promise<Array<{
    bin: number;
    startDate: Date;
    endDate: Date;
    averageError: number;
    sampleCount: number;
    accuracy: number;
  }>> {
    const outcomes = await LearningOutcome.find({
      // Join with prediction to filter by outcomeType
    })
      .sort({ timestamp: 1 })
      .limit(1000)
      .lean();

    // Filter by outcome type
    const filteredOutcomes: typeof outcomes = [];
    for (const outcome of outcomes) {
      const prediction = await Prediction.findOne({ predictionId: outcome.predictionId }).lean();
      if (prediction && prediction.outcomeType === outcomeType) {
        filteredOutcomes.push(outcome);
      }
    }

    if (filteredOutcomes.length === 0) {
      return [];
    }

    // Create time bins
    const startTime = filteredOutcomes[0].timestamp.getTime();
    const endTime = filteredOutcomes[filteredOutcomes.length - 1].timestamp.getTime();
    const binSize = (endTime - startTime) / bins;

    const binsData: Array<{
      bin: number;
      startDate: Date;
      endDate: Date;
      averageError: number;
      sampleCount: number;
      accuracy: number;
    }> = [];

    for (let i = 0; i < bins; i++) {
      const binStart = new Date(startTime + i * binSize);
      const binEnd = new Date(startTime + (i + 1) * binSize);

      const binOutcomes = filteredOutcomes.filter(
        o => o.timestamp >= binStart && o.timestamp < binEnd
      );

      if (binOutcomes.length > 0) {
        const avgError = binOutcomes.reduce((sum, o) => sum + o.errorPercent, 0) / binOutcomes.length;

        binsData.push({
          bin: i + 1,
          startDate: binStart,
          endDate: binEnd,
          averageError: avgError,
          sampleCount: binOutcomes.length,
          accuracy: 100 - avgError,
        });
      }
    }

    return binsData;
  }
}

// Export singleton instance
export const learningLoopService = new LearningLoopService();
export default learningLoopService;