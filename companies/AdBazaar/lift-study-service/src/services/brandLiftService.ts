import { BrandLift, IBrandLift, LiftStudy, LiftResult } from '../models';
import { BrandLiftSurveyInput } from '../utils/validation';
import { logger } from '../utils/logger';
import { brandLiftCalculationsTotal, surveyResponsesTotal } from '../utils/metrics';
import mongoose from 'mongoose';

export interface BrandLiftMetrics {
  awareness: { treatment: number; control: number; lift: number };
  consideration: { treatment: number; control: number; lift: number };
  intent: { treatment: number; control: number; lift: number };
  adRecall: { treatment: number; control: number; lift: number };
  netPromoterScore: { treatment: number; control: number; lift: number };
}

export interface BrandLiftResult {
  studyId: string;
  surveyType: 'pre' | 'post' | 'both';
  treatment: BrandLiftMetrics;
  control: BrandLiftMetrics;
  overallLift: number;
  confidence: number;
  pValue: number;
  statisticalSignificance: boolean;
  sampleSize: { treatment: number; control: number };
  computedAt: Date;
}

export class BrandLiftService {
  async submitSurvey(input: BrandLiftSurveyInput, studyId: string): Promise<IBrandLift> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      throw new Error('Study not found');
    }

    if (study.status !== 'active') {
      throw new Error('Can only submit surveys for active studies');
    }

    const brandLift = new BrandLift({
      studyId: new mongoose.Types.ObjectId(studyId),
      surveyType: input.surveyType,
      treatmentGroup: input.treatmentGroup,
      respondentId: input.respondentId,
      responses: input.responses,
      demographics: input.demographics,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date()
    });

    await brandLift.save();
    surveyResponsesTotal.inc({ study_type: 'brand_lift' });

    logger.info('Brand lift survey submitted', {
      studyId,
      respondentId: input.respondentId,
      treatmentGroup: input.treatmentGroup
    });

    return brandLift;
  }

  async getBrandLiftResults(studyId: string): Promise<BrandLiftResult | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      return null;
    }

    // Get treatment and control group responses
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
      logger.warn('Insufficient data for brand lift calculation', { studyId });
      return null;
    }

    // Calculate metrics for each group
    const treatmentMetrics = this.calculateMetrics(treatmentResponses);
    const controlMetrics = this.calculateMetrics(controlResponses);

    // Calculate lifts
    const metrics: BrandLiftMetrics = {
      awareness: this.calculateLift(treatmentMetrics.awareness, controlMetrics.awareness),
      consideration: this.calculateLift(treatmentMetrics.consideration, controlMetrics.consideration),
      intent: this.calculateLift(treatmentMetrics.intent, controlMetrics.intent),
      adRecall: this.calculateLift(treatmentMetrics.adRecall, controlMetrics.adRecall),
      netPromoterScore: this.calculateLift(treatmentMetrics.netPromoterScore, controlMetrics.netPromoterScore)
    };

    // Calculate overall lift (weighted average of key metrics)
    const overallLift = this.calculateOverallLift(metrics);

    // Statistical significance test (simplified z-test)
    const { confidence, pValue, statisticalSignificance } = this.calculateStatisticalSignificance(
      treatmentResponses.length,
      controlResponses.length,
      overallLift
    );

    brandLiftCalculationsTotal.inc({ metric_type: 'awareness' });
    brandLiftCalculationsTotal.inc({ metric_type: 'consideration' });
    brandLiftCalculationsTotal.inc({ metric_type: 'intent' });

    return {
      studyId,
      surveyType: 'both',
      treatment: treatmentMetrics,
      control: controlMetrics,
      overallLift,
      confidence,
      pValue,
      statisticalSignificance,
      sampleSize: {
        treatment: treatmentResponses.length,
        control: controlResponses.length
      },
      computedAt: new Date()
    };
  }

  private calculateMetrics(responses: IBrandLift[]): BrandLiftMetrics {
    const n = responses.length;
    if (n === 0) {
      return {
        awareness: { treatment: 0, control: 0, lift: 0 },
        consideration: { treatment: 0, control: 0, lift: 0 },
        intent: { treatment: 0, control: 0, lift: 0 },
        adRecall: { treatment: 0, control: 0, lift: 0 },
        netPromoterScore: { treatment: 0, control: 0, lift: 0 }
      };
    }

    // Awareness: percentage with aided awareness
    const awarenessCount = responses.filter(r =>
      r.responses.awareness?.aided === true
    ).length;

    // Consideration: average score
    const considerationSum = responses.reduce((sum, r) =>
      sum + (r.responses.consideration || 0), 0
    );

    // Intent: average score
    const intentSum = responses.reduce((sum, r) =>
      sum + (r.responses.intent || 0), 0
    );

    // Ad Recall: percentage with exact recall
    const adRecallCount = responses.filter(r =>
      r.responses.adRecall?.exact === true
    ).length;

    // NPS: average recommendation likelihood
    const npsSum = responses.reduce((sum, r) =>
      sum + (r.responses.recommendationLikelihood || 0), 0
    );

    return {
      awareness: { treatment: (awarenessCount / n) * 100, control: 0, lift: 0 },
      consideration: { treatment: considerationSum / n, control: 0, lift: 0 },
      intent: { treatment: intentSum / n, control: 0, lift: 0 },
      adRecall: { treatment: (adRecallCount / n) * 100, control: 0, lift: 0 },
      netPromoterScore: { treatment: npsSum / n, control: 0, lift: 0 }
    };
  }

  private calculateLift(treatment: { treatment: number; control: number; lift: number },
 control: { treatment: number; control: number; lift: number }): any {
    const treatmentVal = treatment.treatment;
    const controlVal = control.control;
    const lift = controlVal > 0
      ? ((treatmentVal - controlVal) / controlVal) * 100
      : treatmentVal > 0 ? 100 : 0;

    return { treatment: treatmentVal, control: controlVal, lift };
  }

  private calculateOverallLift(metrics: BrandLiftMetrics): number {
    // Weighted average - awareness (30%), consideration (25%), intent (25%), ad recall (20%)
    const weights = {
      awareness: 0.30,
      consideration: 0.25,
      intent: 0.25,
      adRecall: 0.20
    };

    const lifts = [
      { metric: 'awareness', lift: metrics.awareness.lift, weight: weights.awareness },
      { metric: 'consideration', lift: metrics.consideration.lift, weight: weights.consideration },
      { metric: 'intent', lift: metrics.intent.lift, weight: weights.intent },
      { metric: 'adRecall', lift: metrics.adRecall.lift, weight: weights.adRecall }
    ];

    return lifts.reduce((sum, l) => sum + (l.lift * l.weight), 0);
  }

  private calculateStatisticalSignificance(
    treatmentN: number,
    controlN: number,
    lift: number
  ): { confidence: number; pValue: number; statisticalSignificance: boolean } {
    // Simplified z-test for proportions
    // Using a conservative estimate based on sample sizes
    const totalN = treatmentN + controlN;
    const pooledSE = Math.sqrt((1 / treatmentN) + (1 / controlN));

    // z-score approximation
    const zScore = Math.abs(lift) / (10 * pooledSE); // 10 is assumed baseline std dev

    // Convert z-score to p-value (two-tailed)
    const pValue =2 * (1 - this.normalCDF(zScore));

    // Confidence level (1 - p-value)
    const confidence = 1 - pValue;

    // Statistical significance at 95% confidence level
    const statisticalSignificance = pValue < 0.05;

    return { confidence, pValue, statisticalSignificance };
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function of standard normal
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

  async getSurveyResponses(studyId: string, treatmentGroup?: boolean): Promise<IBrandLift[]> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const query: Record<string, any> = {
      studyId: new mongoose.Types.ObjectId(studyId)
    };

    if (treatmentGroup !== undefined) {
      query.treatmentGroup = treatmentGroup;
    }

    return BrandLift.find(query).sort({ createdAt: -1 });
  }

  async saveBrandLiftResult(result: BrandLiftResult): Promise<void> {
    const liftResult = new LiftResult({
      studyId: new mongoose.Types.ObjectId(result.studyId),
      type: 'brand_lift',
      overallLift: result.overallLift,
      liftPercentage: result.overallLift,
      confidence: result.confidence,
      pValue: result.pValue,
      statisticalSignificance: result.statisticalSignificance,
      sampleSize: {
        treatment: result.sampleSize.treatment,
        control: result.sampleSize.control,
        total: result.sampleSize.treatment + result.sampleSize.control
      },
      metricResults: [
        {
          metric: 'awareness',
          treatmentValue: result.treatment.awareness.treatment,
          controlValue: result.treatment.awareness.control,
          lift: result.treatment.awareness.lift,
          liftPercentage: result.treatment.awareness.lift,
          confidence: result.confidence,
          pValue: result.pValue,
          statisticalSignificance: result.statisticalSignificance,
          sampleSize: result.sampleSize,
          confidenceInterval: { lower: 0, upper: 0 }
        }
      ],
      confidenceInterval: { lower: 0, upper: 0 },
      methodology: 'randomized_control',
      computationDetails: {
        testUsed: 'z-test',
        assumptionsMet: true,
        effectSize: result.overallLift / 100,
        power: 0.8
      },
      recommendations: [],
      computedAt: result.computedAt
    });

    await liftResult.save();
    logger.info('Brand lift result saved', { studyId: result.studyId });
  }
}

export const brandLiftService = new BrandLiftService();