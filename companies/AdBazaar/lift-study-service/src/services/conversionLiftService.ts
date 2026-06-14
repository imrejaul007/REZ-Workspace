import { ConversionLift, IConversionLift, LiftStudy, LiftResult } from '../models';
import { ConversionLiftInput } from '../utils/validation';
import { logger } from '../utils/logger';
import { conversionLiftCalculationsTotal } from '../utils/metrics';
import mongoose from 'mongoose';

export interface ConversionMetrics {
  conversionRate: { treatment: number; control: number; lift: number };
  revenuePerUser: { treatment: number; control: number; lift: number };
  engagementRate: { treatment: number; control: number; lift: number };
  averageOrderValue: { treatment: number; control: number; lift: number };
  clickThroughRate: { treatment: number; control: number; lift: number };
}

export interface ConversionLiftResult {
  studyId: string;
  treatment: ConversionMetrics;
  control: ConversionMetrics;
  overallLift: number;
  confidence: number;
  pValue: number;
  statisticalSignificance: boolean;
  sampleSize: { treatment: number; control: number };
  dailyBreakdown: Array<{
    date: Date;
    treatment: ConversionMetrics;
    control: ConversionMetrics;
  }>;
  computedAt: Date;
}

export class ConversionLiftService {
  async recordConversion(input: ConversionLiftInput, studyId: string): Promise<IConversionLift> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      throw new Error('Study not found');
    }

    if (study.status !== 'active') {
      throw new Error('Can only record conversions for active studies');
    }

    const conversionLift = new ConversionLift({
      studyId: new mongoose.Types.ObjectId(studyId),
      treatmentGroup: input.treatmentGroup,
      userId: input.userId,
      sessionId: input.sessionId,
      metrics: input.metrics,
      metadata: input.metadata,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date()
    });

    await conversionLift.save();

    logger.info('Conversion recorded', {
      studyId,
      treatmentGroup: input.treatmentGroup,
      userId: input.userId
    });

    return conversionLift;
  }

 async getConversionLiftResults(studyId: string): Promise<ConversionLiftResult | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      return null;
    }

    // Get treatment and control group data
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
          totalCheckoutStarted: { $sum: '$metrics.checkoutStarted' },
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
          totalCheckoutStarted: { $sum: '$metrics.checkoutStarted' },
          totalPurchases: { $sum: '$metrics.purchases' },
          totalPurchaseValue: { $sum: '$metrics.purchaseValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (!treatmentData[0] || !controlData[0]) {
      logger.warn('Insufficient data for conversion lift calculation', { studyId });
      return null;
    }

    const treatment = treatmentData[0];
    const control = controlData[0];

    // Calculate metrics
    const treatmentMetrics = this.calculateMetrics(treatment);
    const controlMetrics = this.calculateMetrics(control);

    // Calculate lifts
    const metrics: ConversionMetrics = {
      conversionRate: this.calculateLift(treatmentMetrics.conversionRate, controlMetrics.conversionRate),
      revenuePerUser: this.calculateLift(treatmentMetrics.revenuePerUser, controlMetrics.revenuePerUser),
      engagementRate: this.calculateLift(treatmentMetrics.engagementRate, controlMetrics.engagementRate),
      averageOrderValue: this.calculateLift(treatmentMetrics.averageOrderValue, controlMetrics.averageOrderValue),
      clickThroughRate: this.calculateLift(treatmentMetrics.clickThroughRate, controlMetrics.clickThroughRate)
    };

    // Calculate overall lift
    const overallLift = this.calculateOverallLift(metrics);

    // Statistical significance
    const { confidence, pValue, statisticalSignificance } = this.calculateStatisticalSignificance(
      treatment.count,
      control.count,
      overallLift
    );

    conversionLiftCalculationsTotal.inc();

    // Get daily breakdown
    const dailyBreakdown = await this.getDailyBreakdown(studyId);

    return {
      studyId,
      treatment: treatmentMetrics,
      control: controlMetrics,
      overallLift,
      confidence,
      pValue,
      statisticalSignificance,
      sampleSize: {
        treatment: treatment.count,
        control: control.count
      },
      dailyBreakdown,
      computedAt: new Date()
    };
  }

  private calculateMetrics(data: any): ConversionMetrics {
    const n = data.count || 1;
    const visits = data.totalVisits || n;

    return {
      conversionRate: {
        treatment: visits > 0 ? (data.totalConversions / visits) * 100 : 0,
        control: 0,
        lift: 0
      },
      revenuePerUser: {
        treatment: visits > 0 ? data.totalRevenue / visits : 0,
        control: 0,
        lift: 0
      },
      engagementRate: {
        treatment: visits > 0 ? (data.totalPageViews / visits) : 0,
        control: 0,
        lift: 0
      },
      averageOrderValue: {
        treatment: data.totalPurchases > 0 ? data.totalPurchaseValue / data.totalPurchases : 0,
        control: 0,
        lift: 0
      },
      clickThroughRate: {
        treatment: visits > 0 ? (data.totalAddToCart / visits) * 100 : 0,
        control: 0,
        lift: 0
      }
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

  private calculateOverallLift(metrics: ConversionMetrics): number {
    // Primary metric is conversion rate lift
    // Weighted by business importance
    const weights = {
      conversionRate: 0.40,
      revenuePerUser: 0.30,
      engagementRate: 0.15,
      averageOrderValue: 0.10,
      clickThroughRate: 0.05
    };

    return (
      metrics.conversionRate.lift * weights.conversionRate +
      metrics.revenuePerUser.lift * weights.revenuePerUser +
      metrics.engagementRate.lift * weights.engagementRate +
      metrics.averageOrderValue.lift * weights.averageOrderValue +
      metrics.clickThroughRate.lift * weights.clickThroughRate
    );
  }

  private calculateStatisticalSignificance(
    treatmentN: number,
    controlN: number,
    lift: number
  ): { confidence: number; pValue: number; statisticalSignificance: boolean } {
    const totalN = treatmentN + controlN;
    const pooledProportion = lift / 100;
    const pooledSE = Math.sqrt((pooledProportion * (1 - pooledProportion)) * (1 / treatmentN + 1 / controlN));

    const zScore = pooledSE > 0 ? Math.abs(lift) / (10 * pooledSE) : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    const statisticalSignificance = pValue < 0.05;

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

  private async getDailyBreakdown(studyId: string): Promise<Array<{
    date: Date;
    treatment: ConversionMetrics;
    control: ConversionMetrics;
  }>> {
    const treatmentDaily = await ConversionLift.aggregate([
      {
        $match: {
          studyId: new mongoose.Types.ObjectId(studyId),
          treatmentGroup: true
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          totalConversions: { $sum: '$metrics.conversions' },
          totalRevenue: { $sum: '$metrics.revenue' },
          totalVisits: { $sum: '$metrics.visits' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const controlDaily = await ConversionLift.aggregate([
      {
        $match: {
          studyId: new mongoose.Types.ObjectId(studyId),
          treatmentGroup: false
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          totalConversions: { $sum: '$metrics.conversions' },
          totalRevenue: { $sum: '$metrics.revenue' },
          totalVisits: { $sum: '$metrics.visits' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Merge daily data
    const dateMap = new Map<string, any>();

    treatmentDaily.forEach(d => {
      dateMap.set(d._id, {
        date: new Date(d._id),
        treatment: {
          conversionRate: { treatment: d.totalVisits > 0 ? (d.totalConversions / d.totalVisits) * 100 : 0, control: 0, lift: 0 },
          revenuePerUser: { treatment: d.totalVisits > 0 ? d.totalRevenue / d.totalVisits : 0, control: 0, lift: 0 },
          engagementRate: { treatment: 0, control: 0, lift: 0 },
          averageOrderValue: { treatment: 0, control: 0, lift: 0 },
          clickThroughRate: { treatment: 0, control: 0, lift: 0 }
        },
        control: {
          conversionRate: { treatment: 0, control: 0, lift: 0 },
          revenuePerUser: { treatment: 0, control: 0, lift: 0 },
          engagementRate: { treatment: 0, control: 0, lift: 0 },
          averageOrderValue: { treatment: 0, control: 0, lift: 0 },
          clickThroughRate: { treatment: 0, control: 0, lift: 0 }
        }
      });
    });

    controlDaily.forEach(d => {
      const existing = dateMap.get(d._id);
      if (existing) {
        existing.control = {
          conversionRate: { treatment: 0, control: d.totalVisits > 0 ? (d.totalConversions / d.totalVisits) * 100 : 0, lift: 0 },
          revenuePerUser: { treatment: 0, control: d.totalVisits > 0 ? d.totalRevenue / d.totalVisits : 0, lift: 0 },
          engagementRate: { treatment: 0, control: 0, lift: 0 },
          averageOrderValue: { treatment: 0, control: 0, lift: 0 },
          clickThroughRate: { treatment: 0, control: 0, lift: 0 }
        };
      } else {
        dateMap.set(d._id, {
          date: new Date(d._id),
          treatment: {
            conversionRate: { treatment: 0, control: 0, lift: 0 },
            revenuePerUser: { treatment: 0, control: 0, lift: 0 },
            engagementRate: { treatment: 0, control: 0, lift: 0 },
            averageOrderValue: { treatment: 0, control: 0, lift: 0 },
            clickThroughRate: { treatment: 0, control: 0, lift: 0 }
          },
          control: {
            conversionRate: { treatment: 0, control: d.totalVisits > 0 ? (d.totalConversions / d.totalVisits) * 100 : 0, lift: 0 },
            revenuePerUser: { treatment: 0, control: d.totalVisits > 0 ? d.totalRevenue / d.totalVisits : 0, lift: 0 },
            engagementRate: { treatment: 0, control: 0, lift: 0 },
            averageOrderValue: { treatment: 0, control: 0, lift: 0 },
            clickThroughRate: { treatment: 0, control: 0, lift: 0 }
          }
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async saveConversionLiftResult(result: ConversionLiftResult): Promise<void> {
    const liftResult = new LiftResult({
      studyId: new mongoose.Types.ObjectId(result.studyId),
      type: 'conversion_lift',
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
          metric: 'conversion_rate',
          treatmentValue: result.treatment.conversionRate.treatment,
          controlValue: result.treatment.conversionRate.control,
          lift: result.treatment.conversionRate.lift,
          liftPercentage: result.treatment.conversionRate.lift,
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
    logger.info('Conversion lift result saved', { studyId: result.studyId });
  }
}

export const conversionLiftService = new ConversionLiftService();