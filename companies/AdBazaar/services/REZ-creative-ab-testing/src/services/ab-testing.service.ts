import { v4 as uuidv4 } from 'uuid';
import {
  ABTest,
  Variant,
  VariantMetrics,
  TestSession,
  TestResults,
  VariantResults,
  WinnerSelection,
  PrimaryMetric,
  TrafficSplitResult,
} from '../types';
import { statisticsService } from './statistics.service';
import { trafficSplitService } from './traffic-split.service';
import { logger } from '../utils/logger';

export class ABTestingService {
  private tests: Map<string, ABTest>;
  private sessions: Map<string, TestSession>;

  constructor() {
    this.tests = new Map();
    this.sessions = new Map();
  }

  createTest(test: Omit<ABTest, 'id' | 'status' | 'variants' | 'createdAt' | 'updatedAt'>): ABTest {
    const id = uuidv4();
    const now = new Date();

    // Create variants with traffic splits
    const variants: Variant[] = test.variants.map((v, index) => ({
      id: uuidv4(),
      name: v.name,
      creativeId: v.creativeId,
      trafficPercentage: v.trafficPercentage || Math.floor(100 / test.variants.length),
      status: 'active',
      metrics: this.initializeMetrics(),
      startDate: now,
    }));

    // Normalize traffic splits to sum to 100
    const total = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (total !== 100) {
      const factor = 100 / total;
      let remaining = 100;
      variants.forEach((v, i) => {
        if (i < variants.length - 1) {
          v.trafficPercentage = Math.floor(v.trafficPercentage * factor);
          remaining -= v.trafficPercentage;
        } else {
          v.trafficPercentage = remaining;
        }
      });
    }

    const abTest: ABTest = {
      id,
      name: test.name,
      description: test.description,
      campaignId: test.campaignId,
      status: 'draft',
      variants,
      primaryMetric: test.primaryMetric,
      secondaryMetrics: test.secondaryMetrics || [],
      startDate: test.startDate ? new Date(test.startDate) : undefined,
      endDate: test.endDate ? new Date(test.endDate) : undefined,
      targetAudience: test.targetAudience,
      createdAt: now,
      updatedAt: now,
    };

    this.tests.set(id, abTest);
    logger.logTestCreated(id, variants.length);

    return abTest;
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  getTests(filters?: {
    campaignId?: string;
    status?: ABTest['status'];
  }): ABTest[] {
    let tests = Array.from(this.tests.values());

    if (filters?.campaignId) {
      tests = tests.filter(t => t.campaignId === filters.campaignId);
    }

    if (filters?.status) {
      tests = tests.filter(t => t.status === filters.status);
    }

    return tests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  startTest(testId: string): ABTest | undefined {
    const test = this.tests.get(testId);
    if (!test) return undefined;

    test.status = 'running';
    test.startDate = new Date();
    test.updatedAt = new Date();

    test.variants.forEach(v => {
      v.startDate = new Date();
    });

    logger.logTestStarted(testId);
    return test;
  }

  pauseTest(testId: string): ABTest | undefined {
    const test = this.tests.get(testId);
    if (!test) return undefined;

    test.status = 'paused';
    test.updatedAt = new Date();

    return test;
  }

  resumeTest(testId: string): ABTest | undefined {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'paused') return undefined;

    test.status = 'running';
    test.updatedAt = new Date();

    return test;
  }

  completeTest(testId: string): ABTest | undefined {
    const test = this.tests.get(testId);
    if (!test) return undefined;

    // Calculate winner before completing
    const results = this.getResults(testId);
    if (results?.winner) {
      test.winner = results.winner.variantId;
      test.winnerConfidence = results.winner.confidence;
    } else {
      test.winner = 'none';
    }

    test.status = 'completed';
    test.endDate = new Date();
    test.updatedAt = new Date();

    logger.logTestCompleted(testId, test.winner as string);
    return test;
  }

  archiveTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    test.status = 'archived';
    test.updatedAt = new Date();
    return true;
  }

  assignVariant(testId: string, sessionId: string, userId?: string): TrafficSplitResult | undefined {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return undefined;

    // Check if already assigned
    const existingKey = `${testId}:${sessionId}`;
    const existing = this.sessions.get(existingKey);
    if (existing) {
      return {
        testId,
        variantId: existing.variantId,
        sessionId,
        assignedAt: existing.assignedAt,
      };
    }

    // Select variant based on traffic split
    const variantId = trafficSplitService.selectVariant(
      sessionId,
      test.variants.map(v => ({ id: v.id, trafficPercentage: v.trafficPercentage }))
    );

    const session: TestSession = {
      testId,
      variantId,
      sessionId,
      userId,
      assignedAt: new Date(),
      sawImpression: false,
      clicked: false,
      converted: false,
    };

    this.sessions.set(existingKey, session);
    logger.logVariantAssigned(testId, variantId, sessionId);

    return {
      testId,
      variantId,
      sessionId,
      assignedAt: session.assignedAt,
    };
  }

  recordImpression(testId: string, variantId: string, sessionId: string): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.metrics.impressions++;
    variant.metrics.uniqueImpressions++;
    variant.metrics = this.calculateRates(variant.metrics);

    const key = `${testId}:${sessionId}`;
    const session = this.sessions.get(key);
    if (session) {
      session.sawImpression = true;
    }

    logger.logMetricRecorded(testId, variantId, 'impression');
    return true;
  }

  recordClick(testId: string, variantId: string, sessionId: string): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.metrics.clicks++;
    variant.metrics = this.calculateRates(variant.metrics);

    const key = `${testId}:${sessionId}`;
    const session = this.sessions.get(key);
    if (session) {
      session.clicked = true;
    }

    logger.logMetricRecorded(testId, variantId, 'click');
    return true;
  }

  recordConversion(
    testId: string,
    variantId: string,
    sessionId: string,
    value?: number
  ): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.metrics.conversions++;
    if (value) {
      variant.metrics.revenue += value;
    }
    variant.metrics = this.calculateRates(variant.metrics);

    const key = `${testId}:${sessionId}`;
    const session = this.sessions.get(key);
    if (session) {
      session.converted = true;
    }

    logger.logMetricRecorded(testId, variantId, 'conversion');
    return true;
  }

  getResults(testId: string): TestResults | undefined {
    const test = this.tests.get(testId);
    if (!test) return undefined;

    const variantResults: VariantResults[] = test.variants.map(variant => {
      const significance = this.calculateSignificance(test, variant.id);
      return {
        variantId: variant.id,
        variantName: variant.name,
        trafficPercentage: variant.trafficPercentage,
        impressions: variant.metrics.impressions,
        clicks: variant.metrics.clicks,
        conversions: variant.metrics.conversions,
        revenue: variant.metrics.revenue,
        ctr: variant.metrics.ctr,
        conversionRate: variant.metrics.conversionRate,
        roas: variant.metrics.roas,
        statisticalSignificance: significance,
      };
    });

    // Determine winner
    const winner = this.determineWinner(test);

    // Calculate significance for each variant pair
    const significanceMap: Record<string, ReturnType<typeof statisticsService.calculateSignificance>> = {};
    if (test.variants.length === 2) {
      const control = test.variants[0];
      const treatment = test.variants[1];
      significanceMap[`${control.id}:${treatment.id}`] = statisticsService.calculateSignificance(
        control.metrics.clicks,
        control.metrics.impressions,
        treatment.metrics.clicks,
        treatment.metrics.impressions
      );
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(test, winner);

    return {
      testId,
      status: test.status,
      isComplete: test.status === 'completed',
      winner,
      variants: variantResults,
      statisticalSignificance: significanceMap,
      recommendations,
    };
  }

  private determineWinner(test: ABTest): WinnerSelection | undefined {
    if (test.variants.length < 2) return undefined;

    const control = test.variants[0];
    const treatment = test.variants[1];

    const significance = statisticsService.calculateSignificance(
      control.metrics.conversions,
      control.metrics.impressions,
      treatment.metrics.conversions,
      treatment.metrics.impressions
    );

    const primaryMetric = test.primaryMetric;
    const getMetricValue = (m: VariantMetrics): number => {
      switch (primaryMetric) {
        case 'ctr': return m.ctr;
        case 'conversion_rate': return m.conversionRate;
        case 'roas': return m.roas;
        case 'revenue': return m.revenue;
        default: return m.conversionRate;
      }
    };

    const controlValue = getMetricValue(control.metrics);
    const treatmentValue = getMetricValue(treatment.metrics);

    // Only declare winner if statistically significant
    if (!significance.isSignificant || significance.pValue > 0.05) {
      return undefined;
    }

    const winner = treatmentValue > controlValue ? treatment : control;
    const loser = treatmentValue > controlValue ? control : treatment;
    const improvement = controlValue > 0
      ? (treatmentValue - controlValue) / controlValue
      : 0;

    return {
      variantId: winner.id,
      variantName: winner.name,
      confidence: significance.confidenceLevel,
      improvement,
      isSignificant: significance.isSignificant,
      metrics: [{
        metric: primaryMetric,
        control: controlValue,
        treatment: treatmentValue,
        lift: improvement,
      }],
    };
  }

  private calculateSignificance(test: ABTest, variantId: string): ReturnType<typeof statisticsService.calculateSignificance> {
    const control = test.variants[0];
    const variant = test.variants.find(v => v.id === variantId);
    if (!variant || variant.id === control.id) {
      return {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
        zScore: 0,
        effectSize: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        sampleSize: { control: 0, treatment: 0, required: 0 },
      };
    }

    return statisticsService.calculateSignificance(
      control.metrics.conversions,
      control.metrics.impressions,
      variant.metrics.conversions,
      variant.metrics.impressions
    );
  }

  private generateRecommendations(test: ABTest, winner?: WinnerSelection): string[] {
    const recommendations: string[] = [];

    // Check sample size
    const minImpressions = Math.min(...test.variants.map(v => v.metrics.impressions));
    if (minImpressions < 100) {
      recommendations.push(`Continue collecting data - current sample size is ${minImpressions}, recommend at least 100 per variant`);
    }

    // Add winner recommendations
    if (winner) {
      recommendations.push(`Winner detected: ${winner.variantName} with ${(winner.improvement * 100).toFixed(1)}% improvement`);
      recommendations.push(`Apply winning variant to production with ${(winner.confidence * 100).toFixed(0)}% confidence`);
    } else {
      recommendations.push('No clear winner yet - continue running the test');
    }

    // Check for significant underperformer
    const worstVariant = test.variants.reduce((worst, v) => {
      const rate = v.metrics.impressions > 0 ? v.metrics.clicks / v.metrics.impressions : 0;
      const worstRate = worst.metrics.impressions > 0 ? worst.metrics.clicks / worst.metrics.impressions : 0;
      return rate < worstRate ? v : worst;
    });

    if (worstVariant.metrics.impressions > 50) {
      const worstRate = worstVariant.metrics.impressions > 0
        ? worstVariant.metrics.clicks / worstVariant.metrics.impressions
        : 0;
      const bestRate = test.variants[0].metrics.impressions > 0
        ? test.variants[0].metrics.clicks / test.variants[0].metrics.impressions
        : 0;

      if (bestRate > 0 && worstRate / bestRate < 0.5) {
        recommendations.push(`Consider pausing or removing underperforming variant: ${worstVariant.name}`);
      }
    }

    return recommendations;
  }

  private initializeMetrics(): VariantMetrics {
    return {
      impressions: 0,
      uniqueImpressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      ctr: 0,
      conversionRate: 0,
      engagement: 0,
      roas: 0,
      cost: 0,
    };
  }

  private calculateRates(metrics: VariantMetrics): VariantMetrics {
    return {
      ...metrics,
      ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      conversionRate: metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0,
      roas: metrics.cost > 0 ? metrics.revenue / metrics.cost : 0,
    };
  }

  getStats(): { tests: number; activeSessions: number } {
    return {
      tests: this.tests.size,
      activeSessions: this.sessions.size,
    };
  }
}

export const abTestingService = new ABTestingService();
