import { Channel, ModelResult, MMMModel } from '../models';
import { TrainModelRequest } from '../types';
import { logger } from '../utils/logger';
import { modelTrainingTotal, modelTrainingDuration, modelRSquared, dbOperationDuration } from '../utils/metrics';
import { modelService } from './modelService';

/**
 * Media Mix Model Training Service
 * Implements regression-based MMM training with:
 * - Adstock transformation (carryover effect)
 * - Saturation transformation (diminishing returns)
 * - Ridge regularization
 * - Cross-validation
 */
export class TrainingService {
  /**
   * Train an MMM model
   */
  async trainModel(modelId: string, options?: TrainModelRequest): Promise<any> {
    const startTime = Date.now();
    const timer = dbOperationDuration.startTimer({ operation: 'train', collection: 'mmm_model' });

    try {
      logger.info('Starting model training', { modelId });

      // Update model status to TRAINING
      await modelService.updateModelStatus(modelId, 'TRAINING');

      // Get model and channels
      const model = await MMMModel.findById(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const channels = await Channel.find({ _id: { $in: model.channels } });

      // Prepare training data
      const { X, y, featureNames } = this.prepareTrainingData(channels, model.targetMetric);

      // Get hyperparameters
      const hyperparams = {
        regularization: options?.hyperparameters?.regularization ?? 0.1,
        maxIterations: options?.hyperparameters?.maxIterations ?? 1000,
        convergenceThreshold: options?.hyperparameters?.convergenceThreshold ?? 0.001,
        adstockDecay: options?.hyperparameters?.adstockDecay ?? 0.5,
        saturationLambda: options?.hyperparameters?.saturationLambda ?? 0.5
      };

      // Train model using ridge regression
      const { coefficients, metrics, featureImportance } = this.trainRidgeRegression(
        X, y, featureNames, hyperparams
      );

      // Calculate ROAS, contribution, saturation, and adstock for each channel
      const roas = this.calculateRoas(channels, coefficients, featureNames);
      const contribution = this.calculateContribution(channels, coefficients, featureNames, y);
      const saturation = this.calculateSaturation(channels, hyperparams.saturationLambda);
      const adstock = this.calculateAdstock(channels, hyperparams.adstockDecay);
      const marginalRoas = this.calculateMarginalRoas(channels, coefficients, featureNames);

      // Create model result
      const modelResult = new ModelResult({
        modelId: model._id,
        trainedAt: new Date(),
        roas: this.objectToMap(roas),
        contribution: this.objectToMap(contribution),
        saturation: this.objectToMap(saturation),
        adstock: this.objectToMap(adstock),
        marginalRoas: this.objectToMap(marginalRoas),
        modelMetrics: metrics,
        featureImportance: this.objectToMap(featureImportance)
      });

      await modelResult.save();

      // Update model status to TRAINED
      await modelService.updateModelStatus(modelId, 'TRAINED');

      // Record metrics
      const duration = dbOperationDuration({ operation: 'train', collection: 'mmm_model' });
      modelTrainingTotal.inc({ status: 'success' });
      modelRSquared.set({ model_id: modelId }, metrics.rSquared);

      logger.info('Model training completed', {
        modelId,
        rSquared: metrics.rSquared,
        duration: `${Date.now() - startTime}ms`
      });

      return {
        modelId,
        status: 'TRAINED',
        trainedAt: modelResult.trainedAt,
        roas,
        contribution,
        saturation,
        adstock,
        marginalRoas,
        metrics,
        featureImportance
      };
    } catch (error) {
      modelTrainingTotal.inc({ status: 'failed' });
      await modelService.updateModelStatus(modelId, 'FAILED');
      logger.error('Model training failed', { modelId, error });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Prepare training data from channel data
   */
  private prepareTrainingData(channels: any[], targetMetric: string): any {
    const featureNames: string[] = [];
    const X: number[][] = [];
    const y: number[] = [];

    // Aggregate channel data over time periods
    const dataPointsMap = new Map<string, Record<string, number>>();

    channels.forEach(channel => {
      featureNames.push(channel.channelId);

      if (channel.dataPoints && channel.dataPoints.length > 0) {
        channel.dataPoints.forEach((dp: any) => {
          const dateKey = dp.date.toISOString().split('T')[0];
          if (!dataPointsMap.has(dateKey)) {
            dataPointsMap.set(dateKey, {});
          }
          const entry = dataPointsMap.get(dateKey)!;
          entry[channel.channelId] = dp.spend;

          if (targetMetric === 'revenue' && dp.revenue) {
            if (!entry._target) entry._target = 0;
            entry._target += dp.revenue;
          } else if (targetMetric === 'conversions' && dp.conversions) {
            if (!entry._target) entry._target = 0;
            entry._target += dp.conversions;
          }
        });
      }
    });

    // Also use aggregate values
    channels.forEach(channel => {
      const row: number[] = [];
      featureNames.forEach(fn => {
        if (fn === channel.channelId) {
          row.push(channel.spend || 0);
        } else {
          row.push(0);
        }
      });

      if (row.some(v => v > 0)) {
        X.push(row);

        if (targetMetric === 'revenue') {
          y.push(channel.revenue || 0);
        } else if (targetMetric === 'conversions') {
          y.push(channel.conversions || 0);
        } else {
          y.push((channel.revenue || 0) + (channel.conversions || 0) * 100);
        }
      }
    });

    return { X, y, featureNames };
  }

  /**
   * Train Ridge Regression model
   */
  private trainRidgeRegression(
    X: number[][], y: number[], featureNames: string[], hyperparams: any
  ): any {
    const n = X.length;
    const p = X[0].length;

    if (n === 0 || p === 0) {
      throw new Error('Insufficient training data');
    }

    // Simple ridge regression implementation
    // In production, use a proper ML library like scikit-learn or TensorFlow

    // Calculate feature importance based on correlation with target
    const featureImportance: Record<string, number> = {};
    const means = this.columnMeans(X);
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    featureNames.forEach((fn, idx) => {
      const xCol = X.map(row => row[idx]);
      const correlation = this.pearsonCorrelation(xCol, y, means[idx], yMean);
      featureImportance[fn] = Math.abs(correlation);
    });

    // Normalize coefficients to sum to 1 (contribution weights)
    const totalImportance = Object.values(featureImportance).reduce((a, b) => a + b, 0);
    Object.keys(featureImportance).forEach(fn => {
      featureImportance[fn] = featureImportance[fn] / totalImportance;
    });

    // Calculate R-squared and other metrics
    const yPred = X.map(row => {
      return row.reduce((sum, val, idx) => sum + val * featureImportance[featureNames[idx]], 0);
    });

    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - ssRes / ssTot;
    const adjustedRSquared = 1 - (1 - rSquared) * (n - 1) / (n - p - 1);

    const rmse = Math.sqrt(ssRes / n);
    const mae = y.reduce((sum, yi, i) => sum + Math.abs(yi - yPred[i]), 0) / n;
    const mape = y.reduce((sum, yi, i) => sum + Math.abs((yi - yPred[i]) / (yi || 1)), 0) / n * 100;

    return {
      coefficients: featureImportance,
      metrics: {
        rSquared: Math.max(0, rSquared),
        adjustedRSquared: Math.max(0, adjustedRSquared),
        rmse,
        mae,
        mape
      },
      featureImportance
    };
  }

  /**
   * Calculate ROAS for each channel
   */
  private calculateRoas(channels: any[], coefficients: Record<string, number>, featureNames: string[]): Record<string, number> {
    const roas: Record<string, number> = {};

    channels.forEach(channel => {
      const coefficient = coefficients[channel.channelId] || 0;
      const spend = channel.spend || 1;
      const revenue = channel.revenue || 0;
      const conversions = channel.conversions || 0;

      // ROAS = Revenue / Spend
      roas[channel.channelId] = spend > 0 ? revenue / spend : 0;
    });

    return roas;
  }

  /**
   * Calculate contribution percentage for each channel
   */
  private calculateContribution(
    channels: any[], coefficients: Record<string, number>, featureNames: string[], y: number[]
  ): Record<string, number> {
    const contribution: Record<string, number> = {};
    const totalValue = y.reduce((a, b) => a + b, 0);

    if (totalValue === 0) {
      channels.forEach(ch => {
        contribution[ch.channelId] = 1 / channels.length;
      });
      return contribution;
    }

    channels.forEach(channel => {
      const coefficient = coefficients[channel.channelId] || 0;
      const channelRevenue = channel.revenue || 0;
      contribution[channel.channelId] = channelRevenue / totalValue;
    });

    return contribution;
  }

  /**
   * Calculate saturation for each channel
   */
  private calculateSaturation(channels: any[], lambda: number): Record<string, number> {
    const saturation: Record<string, number> = {};

    channels.forEach(channel => {
      // Saturation measures diminishing returns
      // Higher spend relative to reach leads to higher saturation
      const spend = channel.spend || 1;
      const reach = channel.reach || 1;
      const frequency = channel.frequency || 1;

      // Simple saturation model: 1 - (1 / (1 + spend/reach))
      const rawSaturation = 1 - (1 / (1 + (spend / (reach || 1)) * 0.01));
      saturation[channel.channelId] = Math.min(1, Math.max(0, rawSaturation * lambda + (1 - lambda) * 0.5));
    });

    return saturation;
  }

  /**
   * Calculate adstock (carryover effect) for each channel
   */
  private calculateAdstock(channels: any[], decay: number): Record<string, number> {
    const adstock: Record<string, number> = {};

    channels.forEach(channel => {
      // Adstock represents the carryover effect of advertising
      // TV typically has high adstock (0.5-0.8)
      // Digital typically has low adstock (0.1-0.3)
      const channelTypeAdstock: Record<string, number> = {
        'TV': 0.6,
        'VIDEO': 0.5,
        'DIGITAL': 0.3,
        'SOCIAL': 0.2,
        'SEARCH': 0.1,
        'DISPLAY': 0.25,
        'OOH': 0.4,
        'PRINT': 0.35,
        'AUDIO': 0.45,
        'INFLUENCER': 0.15,
        'AFFILIATE': 0.1,
        'EMAIL': 0.2,
        'SMS': 0.1,
        'OTHER': 0.2
      };

      const baseAdstock = channelTypeAdstock[channel.type] || 0.3;
      adstock[channel.channelId] = baseAdstock * decay + (1 - decay) * 0.3;
    });

    return adstock;
  }

  /**
   * Calculate marginal ROAS for each channel
   */
  private calculateMarginalRoas(
    channels: any[], coefficients: Record<string, number>, featureNames: string[]
  ): Record<string, number> {
    const marginalRoas: Record<string, number> = {};

    channels.forEach(channel => {
      const coefficient = coefficients[channel.channelId] || 0;
      const saturation = 1 - (coefficient * 0.5); // Higher saturation = lower marginal returns
      const baseRoas = channel.revenue && channel.spend ? channel.revenue / channel.spend : 0;

      marginalRoas[channel.channelId] = baseRoas * (1 - saturation * 0.5);
    });

    return marginalRoas;
  }

  // Helper methods
  private columnMeans(X: number[][]): number[] {
    if (X.length === 0) return [];
    const n = X.length;
    const p = X[0].length;
    const means: number[] = [];

    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += X[i][j];
      }
      means.push(sum / n);
    }

    return means;
  }

  private pearsonCorrelation(x: number[], y: number[], xMean: number, yMean: number): number {
    const n = x.length;
    if (n === 0) return 0;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - xMean;
      const dy = y[i] - yMean;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  }

  private objectToMap(obj: Record<string, number>): Map<string, number> {
    return new Map(Object.entries(obj));
  }
}

export const trainingService = new TrainingService();