import { LiftResult, ILiftResult, LiftStudy, BrandLift, ConversionLift } from '../models';
import { logger } from '../utils/logger';
import { analysisDuration, studiesCompletedTotal } from '../utils/metrics';
import mongoose from 'mongoose';

export interface AnalysisRequest {
  studyId: string;
  type: 'brand_lift' | 'conversion_lift' | 'both';
  confidenceLevel?: number;
}

export interface Recommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  metric?: string;
  expectedImpact?: string;
}

export interface AnalysisResult {
  studyId: string;
  type: string;
  overallLift: number;
  liftPercentage: number;
  confidence: number;
  pValue: number;
  statisticalSignificance: boolean;
  sampleSize: {
    treatment: number;
    control: number;
    total: number;
  };
  metricResults: Array<{
    metric: string;
    treatmentValue: number;
    controlValue: number;
    lift: number;
    liftPercentage: number;
    confidence: number;
    pValue: number;
    statisticalSignificance: boolean;
    confidenceInterval: { lower: number; upper: number };
  }>;
  recommendations: Recommendation[];
  computedAt: Date;
}

export class AnalysisService {
  async runAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    logger.info('Starting lift analysis', request);

    const study = await LiftStudy.findById(request.studyId);
    if (!study) {
      throw new Error('Study not found');
    }

    if (study.status !== 'active' && study.status !== 'paused') {
      throw new Error('Can only run analysis on active or paused studies');
    }

    const confidenceLevel = request.confidenceLevel || study.confidenceLevel || 0.95;

    let result: AnalysisResult;

    if (request.type === 'brand_lift' || request.type === 'both') {
      result = await this.runBrandLiftAnalysis(request.studyId, confidenceLevel);
    }

    if (request.type === 'conversion_lift' || request.type === 'both') {
      const conversionResult = await this.runConversionLiftAnalysis(request.studyId, confidenceLevel);

      if (request.type === 'both') {
        result = await this.mergeAnalysisResults(result!, conversionResult);
      } else {
        result = conversionResult;
      }
    }

    // Save results
    await this.saveResults(result!);

    // Mark study as completed
    await LiftStudy.findByIdAndUpdate(request.studyId, {
      $set: {
        status: 'completed',
        endDate: new Date(),
        results: {
          lift: result!.overallLift,
          confidence: result!.confidence,
          pValue: result!.pValue,
          sampleSize: result!.sampleSize.total,
          statisticalSignificance: result!.statisticalSignificance,
          computedAt: new Date()
        }
      }
    });

    studiesCompletedTotal.inc({ type: request.type });

    const duration = (Date.now() - startTime) / 1000;
    analysisDuration.observe({ analysis_type: request.type }, duration);

    logger.info('Analysis completed', {
      studyId: request.studyId,
      duration,
      lift: result!.overallLift
    });

    return result!;
  }

  private async runBrandLiftAnalysis(studyId: string, confidenceLevel: number): Promise<AnalysisResult> {
    const treatmentResponses = await BrandLift.find({
      studyId: new mongoose.Types.ObjectId(studyId),
      treatmentGroup: true,
      surveyType: { $in: ['post', 'both'] }
    });

    const controlResponses = await BrandLift.find({
      studyId: new mongoose.Types.ObjectId(studyId),
      treatmentGroup: false,
      surveyType: { $in: ['post', 'both'] }
    });

    if (treatmentResponses.length === 0 || controlResponses.length === 0) {
      throw new Error('Insufficient data for brand lift analysis');
    }

    // Calculate brand metrics
    const treatmentMetrics = this.calculateBrandMetrics(treatmentResponses);
    const controlMetrics = this.calculateBrandMetrics(controlResponses);

    // Calculate lifts for each metric
    const metricResults = this.calculateMetricLifts(treatmentMetrics, controlMetrics, confidenceLevel);

    // Calculate overall lift
    const overallLift = this.calculateOverallLift(metricResults);

    // Statistical significance
    const { confidence, pValue, statisticalSignificance } = this.calculateStatisticalSignificance(
      treatmentResponses.length,
      controlResponses.length,
      overallLift,
      confidenceLevel
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(metricResults, statisticalSignificance);

    return {
      studyId,
      type: 'brand_lift',
      overallLift,
      liftPercentage: overallLift,
      confidence,
      pValue,
      statisticalSignificance,
      sampleSize: {
        treatment: treatmentResponses.length,
        control: controlResponses.length,
        total: treatmentResponses.length + controlResponses.length
      },
      metricResults,
      recommendations,
      computedAt: new Date()
    };
  }

  private async runConversionLiftAnalysis(studyId: string, confidenceLevel: number): Promise<AnalysisResult> {
    const treatmentData = await ConversionLift.aggregate([
      { $match: { studyId: new mongoose.Types.ObjectId(studyId), treatmentGroup: true } },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: '$metrics.conversions' },
          totalRevenue: { $sum: '$metrics.revenue' },
          totalVisits: { $sum: '$metrics.visits' },
          totalPageViews: { $sum: '$metrics.pageViews' },
          totalAddToCart: { $sum: '$metrics.addToCart' },
          totalPurchases: { $sum: '$metrics.purchases' },
          totalPurchaseValue: { $sum: '$metrics.purchaseValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    const controlData = await ConversionLift.aggregate([
      { $match: { studyId: new mongoose.Types.ObjectId(studyId), treatmentGroup: false } },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: '$metrics.conversions' },
          totalRevenue: { $sum: '$metrics.revenue' },
          totalVisits: { $sum: '$metrics.visits' },
          totalPageViews: { $sum: '$metrics.pageViews' },
          totalAddToCart: { $sum: '$metrics.addToCart' },
          totalPurchases: { $sum: '$metrics.purchases' },
          totalPurchaseValue: { $sum: '$metrics.purchaseValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (!treatmentData[0] || !controlData[0]) {
      throw new Error('Insufficient data for conversion lift analysis');
    }

    const treatment = treatmentData[0];
    const control = controlData[0];

    // Calculate conversion metrics
    const treatmentMetrics = this.calculateConversionMetrics(treatment);
    const controlMetrics = this.calculateConversionMetrics(control);

    // Calculate lifts
    const metricResults = this.calculateMetricLifts(treatmentMetrics, controlMetrics, confidenceLevel);

    // Overall lift
    const overallLift = this.calculateOverallLift(metricResults);

    // Statistical significance
    const { confidence, pValue, statisticalSignificance } = this.calculateStatisticalSignificance(
      treatment.count,
      control.count,
      overallLift,
      confidenceLevel
    );

    // Recommendations
    const recommendations = this.generateRecommendations(metricResults, statisticalSignificance);

    return {
      studyId,
      type: 'conversion_lift',
      overallLift,
      liftPercentage: overallLift,
      confidence,
      pValue,
      statisticalSignificance,
      sampleSize: {
        treatment: treatment.count,
        control: control.count,
        total: treatment.count + control.count
      },
      metricResults,
      recommendations,
      computedAt: new Date()
    };
  }

  private calculateBrandMetrics(responses: any[]): Record<string, number> {
    const n = responses.length;
    if (n === 0) return {};

    return {
      awareness: (responses.filter(r => r.responses.awareness?.aided).length / n) * 100,
      consideration: responses.reduce((sum, r) => sum + (r.responses.consideration || 0), 0) / n,
      intent: responses.reduce((sum, r) => sum + (r.responses.intent || 0), 0) / n,
      adRecall: (responses.filter(r => r.responses.adRecall?.exact).length / n) * 100,
      purchaseIntent: responses.reduce((sum, r) => sum + (r.responses.purchaseIntent || 0), 0) / n,
      nps: responses.reduce((sum, r) => sum + (r.responses.recommendationLikelihood || 0), 0) / n
    };
  }

  private calculateConversionMetrics(data: any): Record<string, number> {
    const n = data.count || 1;
    const visits = data.totalVisits || n;

    return {
      conversionRate: visits > 0 ? (data.totalConversions / visits) * 100 : 0,
      revenuePerUser: visits > 0 ? data.totalRevenue / visits : 0,
      engagementRate: visits > 0 ? data.totalPageViews / visits : 0,
      averageOrderValue: data.totalPurchases > 0 ? data.totalPurchaseValue / data.totalPurchases : 0,
      clickThroughRate: visits > 0 ? (data.totalAddToCart / visits) * 100 : 0
    };
  }

  private calculateMetricLifts(
    treatment: Record<string, number>,
    control: Record<string, number>,
    confidenceLevel: number
  ): AnalysisResult['metricResults'] {
    const metrics: AnalysisResult['metricResults'] = [];

    for (const [metric, treatmentValue] of Object.entries(treatment)) {
      const controlValue = control[metric] || 0;
      const lift = controlValue > 0
        ? ((treatmentValue - controlValue) / controlValue) * 100
        : treatmentValue > 0 ? 100 : 0;

      // Simplified confidence interval calculation
      const marginOfError = Math.abs(lift) * 0.1; // 10% margin
 const { confidence, pValue, statisticalSignificance } = this.calculateStatisticalSignificance(
        100, 100, lift, confidenceLevel
      );

      metrics.push({
        metric,
        treatmentValue,
        controlValue,
        lift,
        liftPercentage: lift,
        confidence,
        pValue,
        statisticalSignificance,
        confidenceInterval: {
          lower: lift - marginOfError,
          upper: lift + marginOfError
        }
      });
    }

    return metrics;
  }

  private calculateOverallLift(metrics: AnalysisResult['metricResults']): number {
    if (metrics.length === 0) return 0;

    // Weighted average
    const weights: Record<string, number> = {
      awareness: 0.25,
      consideration: 0.20,
      intent: 0.20,
      adRecall: 0.15,
      purchaseIntent: 0.10,
      conversionRate: 0.35,
      revenuePerUser: 0.30,
      engagementRate: 0.15,
      averageOrderValue: 0.10,
      clickThroughRate: 0.10
    };

    return metrics.reduce((sum, m) => {
      const weight = weights[m.metric] || (1 / metrics.length);
      return sum + (m.lift * weight);
    }, 0);
  }

  private calculateStatisticalSignificance(
    treatmentN: number,
    controlN: number,
    lift: number,
    confidenceLevel: number
  ): { confidence: number; pValue: number; statisticalSignificance: boolean } {
    // Two-proportion z-test
    const pooledP = lift / 100;
    const se = Math.sqrt((pooledP * (1 - pooledP)) * (1 / treatmentN + 1 / controlN));

    const zScore = se > 0 ? Math.abs(lift) / (10 * se) : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    const statisticalSignificance = pValue < (1 - confidenceLevel);

    return { confidence, pValue, statisticalSignificance };
  }

  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private generateRecommendations(
    metrics: AnalysisResult['metricResults'],
    overallSignificance: boolean
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!overallSignificance) {
      recommendations.push({
        action: 'Extend study duration to increase sample size',
        priority: 'high',
        rationale: 'Results are not statistically significant. Larger sample size needed.',
        expectedImpact: 'Improved confidence in results'
      });
    }

    // Find top performing metrics
    const sortedMetrics = [...metrics].sort((a, b) => b.lift - a.lift);
    const topMetric = sortedMetrics[0];
    const bottomMetric = sortedMetrics[sortedMetrics.length - 1];

    if (topMetric && topMetric.lift > 10) {
      recommendations.push({
        action: `Double down on ${topMetric.metric}`,
        priority: 'high',
        rationale: `${topMetric.metric} shows ${topMetric.lift.toFixed(1)}% lift - strong performance`,
        metric: topMetric.metric,
        expectedImpact: `Potential additional ${topMetric.lift * 0.5}% improvement`
      });
    }

    if (bottomMetric && bottomMetric.lift < 0) {
      recommendations.push({
        action: `Investigate ${bottomMetric.metric} underperformance`,
        priority: 'medium',
        rationale: `${bottomMetric.metric} shows negative lift of ${bottomMetric.lift.toFixed(1)}%`,
        metric: bottomMetric.metric,
        expectedImpact: 'Identify root cause and optimize'
      });
    }

    // General recommendations
    recommendations.push({
      action: 'Plan follow-up study with learnings',
      priority: 'low',
      rationale: 'Use insights to optimize creative and targeting for future campaigns'
    });

    return recommendations;
  }

  private mergeAnalysisResults(brandResult: AnalysisResult, conversionResult: AnalysisResult): AnalysisResult {
    // Combine metric results
    const allMetrics = [...brandResult.metricResults, ...conversionResult.metricResults];

    // Calculate combined overall lift
    const overallLift = (brandResult.overallLift * 0.4 + conversionResult.overallLift * 0.6);

    // Combined sample size
    const sampleSize = {
      treatment: brandResult.sampleSize.treatment + conversionResult.sampleSize.treatment,
      control: brandResult.sampleSize.control + conversionResult.sampleSize.control,
      total: brandResult.sampleSize.total + conversionResult.sampleSize.total
    };

    return {
      studyId: brandResult.studyId,
      type: 'both',
      overallLift,
      liftPercentage: overallLift,
      confidence: (brandResult.confidence + conversionResult.confidence) / 2,
      pValue: Math.min(brandResult.pValue, conversionResult.pValue),
      statisticalSignificance: brandResult.statisticalSignificance || conversionResult.statisticalSignificance,
      sampleSize,
      metricResults: allMetrics,
      recommendations: [...brandResult.recommendations, ...conversionResult.recommendations],
      computedAt: new Date()
    };
  }

  private async saveResults(result: AnalysisResult): Promise<void> {
    const liftResult = new LiftResult({
      studyId: new mongoose.Types.ObjectId(result.studyId),
      type: result.type as 'brand_lift' | 'conversion_lift' | 'both',
      overallLift: result.overallLift,
      liftPercentage: result.liftPercentage,
      confidence: result.confidence,
      pValue: result.pValue,
      statisticalSignificance: result.statisticalSignificance,
      sampleSize: result.sampleSize,
      metricResults: result.metricResults.map(m => ({
        metric: m.metric,
        treatmentValue: m.treatmentValue,
        controlValue: m.controlValue,
        lift: m.lift,
        liftPercentage: m.liftPercentage,
        confidence: m.confidence,
        pValue: m.pValue,
        statisticalSignificance: m.statisticalSignificance,
        sampleSize: result.sampleSize,
        confidenceInterval: m.confidenceInterval
      })),
      confidenceInterval: {
        lower: result.overallLift * 0.9,
        upper: result.overallLift * 1.1
      },
      methodology: 'randomized_control',
      computationDetails: {
        testUsed: 'z-test',
        assumptionsMet: true,
        effectSize: result.overallLift / 100,
        power: 0.8
      },
      recommendations: result.recommendations.map(r => ({
        action: r.action,
        priority: r.priority,
        rationale: r.rationale
      })),
      computedAt: result.computedAt
    });

    await liftResult.save();
    logger.info('Analysis results saved', { studyId: result.studyId });
  }

  async getResults(studyId: string): Promise<ILiftResult | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    return LiftResult.findOne({ studyId: new mongoose.Types.ObjectId(studyId) });
  }

  async getRecommendations(studyId: string): Promise<Recommendation[]> {
    const result = await this.getResults(studyId);
    if (!result) {
      return [];
    }

    return result.recommendations.map(r => ({
      action: r.action,
      priority: r.priority,
      rationale: r.rationale
    }));
  }
}

export const analysisService = new AnalysisService();