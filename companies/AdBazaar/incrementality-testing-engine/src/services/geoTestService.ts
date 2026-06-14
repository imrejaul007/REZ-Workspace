import { Experiment, TestGroup, Result, LiftAnalysis } from '../models';
import { IExperimentDocument } from '../models/Experiment';
import { CreateGeoTestRequest, GeoTest, Targeting } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import mongoose from 'mongoose';

interface GeoTestResult {
  region: string;
  treatmentRegions: string[];
  controlRegions: string[];
  treatmentMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  };
  controlMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  };
  lift: number;
  isSignificant: boolean;
  pValue: number;
}

export class GeoTestService {
  /**
   * Create a geo test experiment
   */
  async createGeoTest(
    experimentId: string,
    data: CreateGeoTestRequest
  ): Promise<IExperimentDocument> {
    logger.info('Creating geo test', { experimentId, region: data.region });

    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Create treatment group for geo test
    const treatmentGroup = new TestGroup({
      experimentId,
      name: `Geo Treatment - ${data.region}`,
      type: 'treatment' as const,
      size: 0,
      allocation: 50,
      isActive: true
    });
    await treatmentGroup.save();

    // Create control group for geo test
    const controlGroup = new TestGroup({
      experimentId,
      name: `Geo Control - ${data.region}`,
      type: 'control' as const,
      size: 0,
      allocation: 50,
      isActive: true
    });
    await controlGroup.save();

    // Update experiment targeting with geo parameters
    experiment.testGroups.push(treatmentGroup._id, controlGroup._id);
    experiment.targeting = {
      ...experiment.targeting,
      geo: {
        ...experiment.targeting.geo,
        regions: data.treatmentRegions.concat(data.controlRegions)
      }
    } as Targeting;

    await experiment.save();

    logger.info('Geo test created', {
      experimentId,
      treatmentRegions: data.treatmentRegions,
      controlRegions: data.controlRegions
    });

    return experiment;
  }

  /**
   * Get geo test results
   */
  async getGeoTestResults(experimentId: string): Promise<GeoTestResult[]> {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const testGroups = await TestGroup.find({ experimentId });
    const treatmentGroup = testGroups.find(g => g.type === 'treatment');
    const controlGroup = testGroups.find(g => g.type === 'control');

    if (!treatmentGroup || !controlGroup) {
      throw new Error('Treatment or control group not found');
    }

    // Get results for each region
    const treatmentResults = await Result.find({ groupId: treatmentGroup._id });
    const controlResults = await Result.find({ groupId: controlGroup._id });

    // Aggregate metrics
    const aggregateMetrics = (results: typeof treatmentResults) => {
      const totals = results.reduce(
        (acc, r) => ({
          impressions: acc.impressions + r.impressions,
          clicks: acc.clicks + r.clicks,
          conversions: acc.conversions + r.conversions,
          revenue: acc.revenue + r.revenue
        }),
        { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
      );

      return {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cvr: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
      };
    };

    const treatmentMetrics = aggregateMetrics(treatmentResults);
    const controlMetrics = aggregateMetrics(controlResults);

    // Calculate lift
    const treatmentCVR = treatmentMetrics.cvr;
    const controlCVR = controlMetrics.cvr;
    const lift = controlCVR > 0
      ? ((treatmentCVR - controlCVR) / controlCVR) * 100
      : 0;

    // Calculate statistical significance
    const significance = LiftAnalysis.calculateStatisticalSignificance(
      treatmentMetrics.conversions,
      treatmentGroup.size,
      controlMetrics.conversions,
      controlGroup.size
    );

    return [{
      region: experiment.targeting.geo?.regions?.[0] || 'unknown',
      treatmentRegions: experiment.targeting.geo?.regions?.filter((_, i) => i < 5) || [],
      controlRegions: experiment.targeting.geo?.regions?.filter((_, i) => i >= 5) || [],
      treatmentMetrics,
      controlMetrics,
      lift,
      isSignificant: significance.isSignificant,
      pValue: significance.pValue
    }];
  }

  /**
   * Run geo test analysis
   */
  async runGeoAnalysis(experimentId: string): Promise<{
    overallLift: number;
    regionalResults: GeoTestResult[];
    recommendations: string[];
  }> {
    logger.info('Running geo analysis', { experimentId });

    const regionalResults = await this.getGeoTestResults(experimentId);

    // Calculate overall lift
    const overallLift = regionalResults.reduce((sum, r) => sum + r.lift, 0) /
      (regionalResults.length || 1);

    // Generate recommendations based on results
    const recommendations: string[] = [];

    for (const result of regionalResults) {
      if (result.isSignificant && result.lift > 0) {
        recommendations.push(
          `Scale ${result.region}: Significant ${result.lift.toFixed(1)}% lift detected`
        );
      } else if (result.isSignificant && result.lift < 0) {
        recommendations.push(
          `Pause ${result.region}: Negative ${Math.abs(result.lift).toFixed(1)}% lift detected`
        );
      } else {
        recommendations.push(
          `Monitor ${result.region}: Results not yet statistically significant`
        );
      }
    }

    // Create lift analysis record
    const liftAnalysis = new LiftAnalysis({
      experimentId,
      lift: overallLift,
      absoluteLift: overallLift / 100,
      relativeLift: overallLift,
      confidenceInterval: {
        lower: overallLift - 5,
        upper: overallLift + 5
      },
      pValue: 0.05,
      tStatistic: 0,
      sampleSize: regionalResults.reduce((sum, r) =>
        sum + r.treatmentMetrics.conversions + r.controlMetrics.conversions, 0
      ),
      statisticalPower: 0.8,
      minimumDetectableEffect: 5,
      isSignificant: Math.abs(overallLift) > 5,
      confidenceLevel: 0.95,
      analysisDate: new Date()
    });

    await liftAnalysis.save();

    metrics.analysisDuration.observe({ type: 'geo' }, 1);

    return {
      overallLift,
      regionalResults,
      recommendations
    };
  }

  /**
   * Allocate geo regions to treatment/control
   */
  async allocateRegions(
    regions: string[],
    treatmentPercentage: number = 50
  ): Promise<{
    treatment: string[];
    control: string[];
  }> {
    const shuffled = [...regions].sort(() => Math.random() - 0.5);
    const treatmentCount = Math.floor((treatmentPercentage / 100) * shuffled.length);

    return {
      treatment: shuffled.slice(0, treatmentCount),
      control: shuffled.slice(treatmentCount)
    };
  }

  /**
   * Get geo performance by region
   */
  async getRegionPerformance(experimentId: string): Promise<Array<{
    region: string;
    groupType: 'treatment' | 'control';
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  }>> {
    const testGroups = await TestGroup.find({ experimentId });
    const performance: Array<{
      region: string;
      groupType: 'treatment' | 'control';
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      ctr: number;
      cvr: number;
    }> = [];

    for (const group of testGroups) {
      const results = await Result.find({ groupId: group._id });

      const totals = results.reduce(
        (acc, r) => ({
          impressions: acc.impressions + r.impressions,
          clicks: acc.clicks + r.clicks,
          conversions: acc.conversions + r.conversions,
          revenue: acc.revenue + r.revenue
        }),
        { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
      );

      performance.push({
        region: group.name,
        groupType: group.type as 'treatment' | 'control',
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cvr: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
      });
    }

    return performance;
  }

  /**
   * Compare geo markets
   */
  async compareGeoMarkets(experimentId: string): Promise<{
    bestPerforming: string;
    worstPerforming: string;
    averageLift: number;
    markets: Array<{
      region: string;
      lift: number;
      rank: number;
    }>;
  }> {
    const regionalResults = await this.getGeoTestResults(experimentId);

    const markets = regionalResults.map(r => ({
      region: r.region,
      lift: r.lift,
      rank: 0
    }));

    // Sort by lift
    markets.sort((a, b) => b.lift - a.lift);

    // Assign ranks
    markets.forEach((m, i) => {
      m.rank = i + 1;
    });

    const validLifts = markets.map(m => m.lift).filter(l => !isNaN(l));

    return {
      bestPerforming: markets[0]?.region || '',
      worstPerforming: markets[markets.length - 1]?.region || '',
      averageLift: validLifts.length > 0
        ? validLifts.reduce((a, b) => a + b, 0) / validLifts.length
        : 0,
      markets
    };
  }

  /**
   * Simulate geo test results
   */
  async simulateGeoTest(
    treatmentLift: number,
    controlLift: number,
    sampleSize: number
  ): Promise<{
    expectedLift: number;
    requiredDuration: number;
    confidenceLevel: number;
  }> {
    // Calculate expected lift
    const expectedLift = treatmentLift - controlLift;

    // Calculate required duration based on traffic
    const dailyTraffic = sampleSize / 30; // Assume 30-day test
    const requiredDuration = dailyTraffic > 0
      ? Math.ceil(sampleSize / dailyTraffic)
      : 30;

    // Calculate confidence level
    const zScore = Math.abs(expectedLift) / Math.sqrt(
      (treatmentLift * (1 - treatmentLift / 100) +
        controlLift * (1 - controlLift / 100)) / sampleSize
    );

    const confidenceLevel = Math.min(0.99, 1 - (2 * Math.exp(-zScore)));

    return {
      expectedLift,
      requiredDuration,
      confidenceLevel
    };
  }
}

export const geoTestService = new GeoTestService();