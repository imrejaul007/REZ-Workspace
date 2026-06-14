import {
  YieldStrategy,
  ABTestRequest,
  ABTestResult,
} from '../types/index.js';
import { YieldStrategy as YieldStrategyModel, ABTest as ABTestModel } from '../models/index.js';
import logger from '../config/logger.js';

export class ABTestingService {
  /**
   * Create a new yield strategy
   */
  async createStrategy(strategy: Omit<YieldStrategy, 'strategyId' | 'createdAt' | 'updatedAt'>): Promise<YieldStrategy> {
    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Creating yield strategy', { strategyId, name: strategy.name });

    const doc = new YieldStrategyModel({
      strategyId,
      ...strategy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await doc.save();

    return {
      id: strategyId,
      ...strategy,
    };
  }

  /**
   * Update an existing strategy
   */
  async updateStrategy(strategyId: string, updates: Partial<YieldStrategy>): Promise<YieldStrategy | null> {
    const doc = await YieldStrategyModel.findOne({ strategyId });

    if (!doc) {
      return null;
    }

    // Apply updates
    if (updates.name) doc.name = updates.name;
    if (updates.type) doc.type = updates.type;
    if (updates.config) doc.config = updates.config;
    if (updates.weights) doc.weights = updates.weights;
    if (updates.status) doc.status = updates.status;
    doc.updatedAt = new Date();

    await doc.save();

    return {
      id: doc.strategyId,
      name: doc.name,
      type: doc.type as YieldStrategy['type'],
      config: doc.config,
      weights: doc.weights,
      status: doc.status as YieldStrategy['status'],
    };
  }

  /**
   * Get strategy by ID
   */
  async getStrategy(strategyId: string): Promise<YieldStrategy | null> {
    const doc = await YieldStrategyModel.findOne({ strategyId }).lean();

    if (!doc) {
      return null;
    }

    return {
      id: doc.strategyId,
      name: doc.name,
      type: doc.type as YieldStrategy['type'],
      config: doc.config,
      weights: doc.weights,
      status: doc.status as YieldStrategy['status'],
    };
  }

  /**
   * Get all strategies
   */
  async getStrategies(status?: 'active' | 'paused' | 'archived'): Promise<YieldStrategy[]> {
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const docs = await YieldStrategyModel.find(query).lean();

    return docs.map(doc => ({
      id: doc.strategyId,
      name: doc.name,
      type: doc.type as YieldStrategy['type'],
      config: doc.config,
      weights: doc.weights,
      status: doc.status as YieldStrategy['status'],
    }));
  }

  /**
   * Create a new A/B test
   */
  async createTest(request: ABTestRequest): Promise<ABTestResult> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Creating A/B test', { testId, name: request.name });

    // Validate traffic allocation
    const totalAllocation = request.trafficAllocation.reduce((a, b) => a + b, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    // Validate strategy count matches allocation count
    if (request.strategies.length !== request.trafficAllocation.length) {
      throw new Error('Number of strategies must match traffic allocation');
    }

    // Initialize results for each strategy
    const results = request.strategies.map(strategyId => ({
      strategyId,
      impressions: 0,
      revenue: 0,
      rpm: 0,
      ctr: 0,
      conversions: 0,
      cvr: 0,
      confidence: 0,
      winner: false,
    }));

    const doc = new ABTestModel({
      testId,
      name: request.name,
      description: request.description,
      strategies: request.strategies,
      trafficAllocation: request.trafficAllocation,
      duration: request.duration,
      successMetrics: request.successMetrics,
      status: 'running',
      startDate: new Date(),
      results,
      recommendations: [],
      statisticalSignificance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await doc.save();

    return {
      testId,
      name: request.name,
      status: 'running',
      startDate: doc.startDate,
      strategies: results,
      recommendations: [],
      statisticalSignificance: 0,
    };
  }

  /**
   * Update test results (called periodically or on event)
   */
  async updateTestResults(testId: string, results: ABTestResult['strategies']): Promise<ABTestResult | null> {
    const doc = await ABTestModel.findOne({ testId });

    if (!doc) {
      return null;
    }

    // Update results for each strategy
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const existingResult = doc.results[i];

      if (existingResult) {
        existingResult.impressions = result.impressions;
        existingResult.revenue = result.revenue;
        existingResult.ctr = result.ctr;
        existingResult.conversions = result.conversions;
        existingResult.cvr = result.cvr;

        // Calculate RPM
        existingResult.rpm = result.impressions > 0
          ? (result.revenue / result.impressions) * 1000
          : 0;

        // Calculate confidence (simplified)
        if (result.impressions > 100) {
          existingResult.confidence = Math.min(0.95, result.impressions / 10000);
        }
      }
    }

    // Calculate statistical significance
    doc.statisticalSignificance = this.calculateSignificance(doc.results);

    // Check if test should end
    const testAge = Date.now() - doc.startDate.getTime();
    const durationMs = doc.duration * 24 * 60 * 60 * 1000;

    if (testAge >= durationMs || doc.statisticalSignificance >= 0.95) {
      doc.status = 'completed';
      doc.endDate = new Date();
      doc.recommendations = this.generateRecommendations(doc.results);
    }

    doc.updatedAt = new Date();
    await doc.save();

    // Mark winner
    if (doc.status === 'completed') {
      const bestIndex = this.findBestStrategy(doc.results);
      if (bestIndex >= 0) {
        doc.results[bestIndex].winner = true;
      }
      await doc.save();
    }

    return {
      testId: doc.testId,
      name: doc.name,
      status: doc.status as ABTestResult['status'],
      startDate: doc.startDate,
      endDate: doc.endDate,
      strategies: doc.results,
      recommendations: doc.recommendations,
      statisticalSignificance: doc.statisticalSignificance,
    };
  }

  /**
   * Calculate statistical significance (simplified chi-square)
   */
  private calculateSignificance(results: ABTestResult['strategies']): number {
    if (results.length < 2) return 0;

    // Simple comparison: check if one strategy is clearly better
    const sorted = [...results].sort((a, b) => b.revenue - a.revenue);
    const best = sorted[0];
    const second = sorted[1];

    // Calculate relative improvement
    const improvement = second.revenue > 0
      ? (best.revenue - second.revenue) / second.revenue
      : 0;

    // Factor in sample size
    const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);
    const sampleSizeFactor = Math.min(1, totalImpressions / 10000);

    // Calculate significance (simplified)
    let significance = Math.min(0.95, improvement * sampleSizeFactor);

    // Minimum impressions for significance
    if (best.impressions < 100) {
      significance *= 0.5;
    }

    return Math.max(0, Math.min(0.95, significance));
  }

  /**
   * Find best strategy
   */
  private findBestStrategy(results: ABTestResult['strategies']): number {
    if (results.length === 0) return -1;

    // Find strategy with highest RPM
    let bestIndex = 0;
    let bestRPM = results[0].rpm;

    for (let i = 1; i < results.length; i++) {
      if (results[i].rpm > bestRPM) {
        bestIndex = i;
        bestRPM = results[i].rpm;
      }
    }

    return bestIndex;
  }

  /**
   * Generate recommendations from test results
   */
  private generateRecommendations(results: ABTestResult['strategies']): string[] {
    const recommendations: string[] = [];

    if (results.length < 2) return recommendations;

    const sorted = [...results].sort((a, b) => b.rpm - a.rpm);
    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];

    const improvement = loser.rpm > 0
      ? ((winner.rpm - loser.rpm) / loser.rpm * 100).toFixed(1)
      : 'N/A';

    recommendations.push(
      `${winner.strategyId} achieved ${improvement}% higher RPM than ${loser.strategyId}`
    );

    // CTR comparison
    const ctrImprovement = loser.ctr > 0
      ? ((winner.ctr - loser.ctr) / loser.ctr * 100).toFixed(1)
      : 'N/A';
    recommendations.push(`CTR improvement: ${ctrImprovement}%`);

    // Conversion comparison
    const cvrImprovement = loser.cvr > 0
      ? ((winner.cvr - loser.cvr) / loser.cvr * 100).toFixed(1)
      : 'N/A';
    recommendations.push(`Conversion improvement: ${cvrImprovement}%`);

    return recommendations;
  }

  /**
   * Get test by ID
   */
  async getTest(testId: string): Promise<ABTestResult | null> {
    const doc = await ABTestModel.findOne({ testId }).lean();

    if (!doc) {
      return null;
    }

    return {
      testId: doc.testId,
      name: doc.name,
      status: doc.status as ABTestResult['status'],
      startDate: doc.startDate,
      endDate: doc.endDate,
      strategies: doc.results,
      recommendations: doc.recommendations,
      statisticalSignificance: doc.statisticalSignificance,
    };
  }

  /**
   * Get all tests
   */
  async getTests(status?: 'running' | 'completed' | 'paused'): Promise<ABTestResult[]> {
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const docs = await ABTestModel.find(query).sort({ createdAt: -1 }).lean();

    return docs.map(doc => ({
      testId: doc.testId,
      name: doc.name,
      status: doc.status as ABTestResult['status'],
      startDate: doc.startDate,
      endDate: doc.endDate,
      strategies: doc.results,
      recommendations: doc.recommendations,
      statisticalSignificance: doc.statisticalSignificance,
    }));
  }

  /**
   * Pause a test
   */
  async pauseTest(testId: string): Promise<ABTestResult | null> {
    const doc = await ABTestModel.findOne({ testId });

    if (!doc) {
      return null;
    }

    doc.status = 'paused';
    doc.updatedAt = new Date();
    await doc.save();

    return {
      testId: doc.testId,
      name: doc.name,
      status: 'paused',
      startDate: doc.startDate,
      strategies: doc.results,
      recommendations: doc.recommendations,
      statisticalSignificance: doc.statisticalSignificance,
    };
  }

  /**
   * Delete/archive a strategy
   */
  async archiveStrategy(strategyId: string): Promise<boolean> {
    const doc = await YieldStrategyModel.findOne({ strategyId });

    if (!doc) {
      return false;
    }

    doc.status = 'archived';
    doc.updatedAt = new Date();
    await doc.save();

    return true;
  }
}

export const abTestingService = new ABTestingService();