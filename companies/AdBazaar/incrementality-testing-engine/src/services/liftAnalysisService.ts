import { LiftAnalysis, Result, TestGroup, Experiment } from '../models';
import { ILiftAnalysisDocument } from '../models/LiftAnalysis';
import { RunAnalysisRequest, LiftAnalysis as LiftAnalysisType } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export class LiftAnalysisService {
  /**
   * Run lift analysis for an experiment
   */
  async runAnalysis(
    experimentId: string,
    options: RunAnalysisRequest = {}
  ): Promise<ILiftAnalysisDocument> {
    const startTime = Date.now();

    logger.info('Running lift analysis', { experimentId, options });

    const confidenceLevel = options.confidenceLevel || 0.95;

    // Get experiment
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get test groups
    const testGroups = await TestGroup.find({ experimentId });
    const treatment = testGroups.find(g => g.type === 'treatment');
    const control = testGroups.find(g => g.type === 'control');

    if (!treatment || !control) {
      throw new Error('Both treatment and control groups required');
    }

    // Calculate conversion rates
    const treatmentCVR = treatment.metrics.clicks > 0
      ? treatment.metrics.conversions / treatment.metrics.clicks
      : 0;
    const controlCVR = control.metrics.clicks > 0
      ? control.metrics.conversions / control.metrics.clicks
      : 0;

    // Calculate CTR
    const treatmentCTR = treatment.metrics.impressions > 0
      ? treatment.metrics.impressions / treatment.metrics.impressions
      : 0;
    const controlCTR = control.metrics.impressions > 0
      ? control.metrics.impressions / control.metrics.impressions
      : 0;

    // Calculate total sample size
    const sampleSize = treatment.size + control.size;

    // Calculate lift
    const absoluteLift = treatmentCVR - controlCVR;
    const relativeLift = controlCVR > 0
      ? (absoluteLift / controlCVR) * 100
      : 0;

    // Calculate statistical significance
    const significance = LiftAnalysis.calculateStatisticalSignificance(
      treatment.metrics.conversions,
      treatment.size,
      control.metrics.conversions,
      control.size
    );

    // Calculate confidence interval
    const confidenceInterval = LiftAnalysis.calculateConfidenceInterval(
      treatmentCVR,
      controlCVR,
      treatment.size,
      control.size,
      confidenceLevel
    );

    // Calculate minimum detectable effect
    const mde = LiftAnalysis.calculateMinimumDetectableEffect(
      controlCVR,
      sampleSize
    );

    // Create lift analysis record
    const liftAnalysis = new LiftAnalysis({
      experimentId,
      lift: relativeLift,
      absoluteLift,
      relativeLift,
      confidenceInterval: {
        lower: confidenceInterval.lower * 100,
        upper: confidenceInterval.upper * 100
      },
      pValue: significance.pValue,
      tStatistic: significance.zScore,
      sampleSize,
      statisticalPower: 0.8,
      minimumDetectableEffect: mde * 100,
      isSignificant: significance.isSignificant,
      confidenceLevel,
      analysisDate: new Date()
    });

    await liftAnalysis.save();

    // Update experiment
    experiment.liftAnalyses.push(liftAnalysis._id);
    await experiment.save();

    // Update metrics
    metrics.liftAnalysisTotal.inc({
      significance: significance.isSignificant ? 'significant' : 'not_significant'
    });
    metrics.analysisDuration.observe({ type: 'lift' }, (Date.now() - startTime) / 1000);

    if (significance.isSignificant) {
      metrics.significantExperiments.inc();
    }

    logger.info('Lift analysis completed', {
      experimentId,
      lift: relativeLift,
      pValue: significance.pValue,
      isSignificant: significance.isSignificant
    });

    return liftAnalysis;
  }

  /**
   * Get lift analysis results
   */
  async getLiftAnalysis(experimentId: string): Promise<ILiftAnalysisDocument[]> {
    return LiftAnalysis.find({ experimentId })
      .sort({ analysisDate: -1 });
  }

  /**
   * Get latest lift analysis
   */
  async getLatestLiftAnalysis(experimentId: string): Promise<ILiftAnalysisDocument | null> {
    return LiftAnalysis.findOne({ experimentId })
      .sort({ analysisDate: -1 });
  }

  /**
   * Calculate lift for specific metric
   */
  async calculateMetricLift(
    experimentId: string,
    metric: 'cvr' | 'ctr' | 'roas' | 'revenue',
    confidenceLevel: number = 0.95
  ): Promise<ILiftAnalysisDocument> {
    const testGroups = await TestGroup.find({ experimentId });
    const treatment = testGroups.find(g => g.type === 'treatment');
    const control = testGroups.find(g => g.type === 'control');

    if (!treatment || !control) {
      throw new Error('Both treatment and control groups required');
    }

    // Get metric values
    const getMetricValue = (group: typeof treatment) => {
      switch (metric) {
        case 'cvr':
          return group.metrics.cvr / 100;
        case 'ctr':
          return group.metrics.ctr / 100;
        case 'roas':
          return group.metrics.roas;
        case 'revenue':
          return group.metrics.revenue;
        default:
          return 0;
      }
    };

    const treatmentValue = getMetricValue(treatment);
    const controlValue = getMetricValue(control);

    const absoluteLift = treatmentValue - controlValue;
    const relativeLift = controlValue > 0
      ? (absoluteLift / controlValue) * 100
      : 0;

    // Statistical significance
    const significance = LiftAnalysis.calculateStatisticalSignificance(
      treatment.metrics.conversions,
      treatment.size,
      control.metrics.conversions,
      control.size
    );

    // Confidence interval
    const confidenceInterval = LiftAnalysis.calculateConfidenceInterval(
      treatmentValue,
      controlValue,
      treatment.size,
      control.size,
      confidenceLevel
    );

    const liftAnalysis = new LiftAnalysis({
      experimentId,
      lift: relativeLift,
      absoluteLift,
      relativeLift,
      confidenceInterval: {
        lower: confidenceInterval.lower * 100,
        upper: confidenceInterval.upper * 100
      },
      pValue: significance.pValue,
      tStatistic: significance.zScore,
      sampleSize: treatment.size + control.size,
      statisticalPower: 0.8,
      minimumDetectableEffect: 0,
      isSignificant: significance.isSignificant,
      confidenceLevel,
      analysisDate: new Date()
    });

    await liftAnalysis.save();

    return liftAnalysis;
  }

  /**
   * Get lift metrics summary
   */
  async getLiftMetrics(experimentId: string): Promise<{
    currentLift: number;
    absoluteLift: number;
    relativeLift: number;
    confidenceInterval: { lower: number; upper: number };
    pValue: number;
    isSignificant: boolean;
    sampleSize: number;
    minimumDetectableEffect: number;
    trend: Array<{ date: Date; lift: number }>;
  }> {
    const analyses = await LiftAnalysis.find({ experimentId })
      .sort({ analysisDate: 1 });

    if (analyses.length === 0) {
      throw new Error('No lift analyses found');
    }

    const latest = analyses[analyses.length - 1];
    const trend = analyses.map(a => ({
      date: a.analysisDate,
      lift: a.lift
    }));

    return {
      currentLift: latest.lift,
      absoluteLift: latest.absoluteLift,
      relativeLift: latest.relativeLift,
      confidenceInterval: latest.confidenceInterval,
      pValue: latest.pValue,
      isSignificant: latest.isSignificant,
      sampleSize: latest.sampleSize,
      minimumDetectableEffect: latest.minimumDetectableEffect,
      trend
    };
  }

  /**
   * Calculate required sample size for desired MDE
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    alpha: number = 0.05
  ): number {
    const zAlpha = 1.96; // Two-tailed test at 95% confidence
    const zBeta = 0.84; // 80% power

    const p1 = baselineRate;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);

    const pooledP = (p1 + p2) / 2;
    const se = Math.sqrt(2 * pooledP * (1 - pooledP));

    const effectSize = Math.abs(p2 - p1);

    const sampleSize = Math.ceil(
      2 * Math.pow((zAlpha + zBeta) * se / effectSize, 2)
    );

    return sampleSize;
  }

  /**
   * Get statistical power analysis
   */
  async getStatisticalPower(
    experimentId: string,
    targetPower: number = 0.8
  ): Promise<{
    currentPower: number;
    requiredSampleSize: number;
    isAdequatelyPowered: boolean;
  }> {
    const testGroups = await TestGroup.find({ experimentId });
    const control = testGroups.find(g => g.type === 'control');

    if (!control) {
      throw new Error('Control group not found');
    }

    const currentSampleSize = testGroups.reduce((sum, g) => sum + g.size, 0);
    const baselineRate = control.metrics.cvr / 100;

    const requiredSampleSize = this.calculateRequiredSampleSize(
      baselineRate,
      10, // 10% MDE
      targetPower
    );

    return {
      currentPower: targetPower,
      requiredSampleSize,
      isAdequatelyPowered: currentSampleSize >= requiredSampleSize
    };
  }

  /**
   * Compare multiple experiments
   */
  async compareExperiments(
    experimentIds: string[]
  ): Promise<Array<{
    experimentId: string;
    lift: number;
    pValue: number;
    isSignificant: boolean;
    sampleSize: number;
  }>> {
    const comparisons = [];

    for (const experimentId of experimentIds) {
      const latestAnalysis = await this.getLatestLiftAnalysis(experimentId);

      if (latestAnalysis) {
        comparisons.push({
          experimentId,
          lift: latestAnalysis.lift,
          pValue: latestAnalysis.pValue,
          isSignificant: latestAnalysis.isSignificant,
          sampleSize: latestAnalysis.sampleSize
        });
      }
    }

    return comparisons.sort((a, b) => b.lift - a.lift);
  }
}

export const liftAnalysisService = new LiftAnalysisService();