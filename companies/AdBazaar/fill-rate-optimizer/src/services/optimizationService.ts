import { FillRate } from '../models/FillRate';
import { logger } from 'utils/logger.js';
import { optimizationCounter } from '../utils/metrics';

export interface OptimizationAction {
  type: 'pricing' | 'targeting' | 'inventory' | 'demand' | 'technical';
  description: string;
  priority: number;
  estimatedImpact: number;
  parameters?: Record<string, any>;
}

export interface OptimizationResult {
  inventoryId?: string;
  currentRate: number;
  targetRate: number;
  actions: OptimizationAction[];
  expectedOutcome: {
    rate: number;
    impressions: number;
    revenue: number;
  };
  timestamp: Date;
}

export class OptimizationService {
  // Optimize fill rate for inventory or overall
  async optimizeFillRate(params: {
    inventoryId?: string;
    targetRate?: number;
    strategy?: 'aggressive' | 'moderate' | 'conservative';
    timeWindow?: '1h' | '6h' | '24h' | '7d';
  }): Promise<OptimizationResult> {
    try {
      const { inventoryId, targetRate = 85, strategy = 'moderate' } = params;

      logger.info('Optimizing fill rate', { inventoryId, targetRate, strategy });

      // Get current fill rate data
      const currentMetrics = await this.getCurrentMetrics(inventoryId);
      const currentRate = currentMetrics.avgRate;

      // Generate optimization actions based on strategy
      const actions = this.generateOptimizationActions(currentMetrics, strategy);

      // Calculate expected outcome
      const expectedRate = this.calculateExpectedRate(currentRate, actions);
      const expectedOutcome = this.calculateExpectedOutcome(
        currentMetrics,
        expectedRate,
        targetRate
      );

      // Record optimization
      optimizationCounter.labels('optimization', inventoryId || 'all', 'success').inc();

      logger.info('Fill rate optimization completed', {
        inventoryId,
        currentRate,
        expectedRate,
        actionsCount: actions.length
      });

      return {
        inventoryId,
        currentRate,
        targetRate,
        actions,
        expectedOutcome,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error optimizing fill rate', { error, params });
      optimizationCounter.labels('optimization', params.inventoryId || 'all', 'error').inc();
      throw error;
    }
  }

  // Apply specific optimization
  async applyOptimization(inventoryId: string, actionType: string, parameters: Record<string, any>): Promise<{
    success: boolean;
    newRate: number;
    impact: number;
    message: string;
  }> {
    try {
      logger.info('Applying optimization', { inventoryId, actionType, parameters });

      // Get current rate
      const currentRate = await this.getCurrentRate(inventoryId);

      // Simulate optimization impact
      const impact = this.simulateOptimizationImpact(actionType, parameters);
      const newRate = Math.min(100, currentRate + impact);

      // Record optimization
      optimizationCounter.labels(actionType, inventoryId, 'applied').inc();

      return {
        success: true,
        newRate: Math.round(newRate * 100) / 100,
        impact: Math.round(impact * 100) / 100,
        message: `${actionType} optimization applied successfully`
      };
    } catch (error) {
      logger.error('Error applying optimization', { error, inventoryId, actionType });
      throw error;
    }
  }

  // Get A/B test results for optimization
  async getOptimizationResults(inventoryId: string): Promise<{
    testId: string;
    variant: string;
    fillRate: number;
    impressions: number;
    revenue: number;
    significance: number;
  }[]> {
    try {
      // Get historical optimization results from FillRate metadata
      const results = await FillRate.find({
        inventoryId,
        'metadata.testId': { $exists: true }
      })
        .sort({ date: -1 })
        .limit(100)
        .lean();

      // Group by test and variant
      const testGroups = new Map<string, Map<string, any[]>>();

      results.forEach(r => {
        const testId = r.metadata?.testId;
        const variant = r.metadata?.variant || 'control';
        if (!testId) return;

        if (!testGroups.has(testId)) testGroups.set(testId, new Map());
        const variants = testGroups.get(testId)!;
        if (!variants.has(variant)) variants.set(variant, []);
        variants.get(variant)!.push(r);
      });

      // Calculate statistics for each test
      const testResults: any[] = [];
      testGroups.forEach((variants, testId) => {
        variants.forEach((records, variant) => {
          const avgRate = records.reduce((sum, r) => sum + r.rate, 0) / records.length;
          const totalImpressions = records.reduce((sum, r) => sum + r.impressions, 0);
          const totalRevenue = records.reduce((sum, r) => sum + (r.metadata?.revenue || 0), 0);

          testResults.push({
            testId,
            variant,
            fillRate: Math.round(avgRate * 100) / 100,
            impressions: totalImpressions,
            revenue: totalRevenue,
            significance: this.calculateSignificance(records)
          });
        });
      });

      return testResults;
    } catch (error) {
      logger.error('Error getting optimization results', { error, inventoryId });
      throw error;
    }
  }

  private async getCurrentMetrics(inventoryId?: string): Promise<{
    avgRate: number;
    totalImpressions: number;
    totalFilled: number;
    hourlyPattern: Map<number, number>;
  }> {
    const query = inventoryId ? { inventoryId } : {};
    const lookback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await FillRate.aggregate([
      { $match: { ...query, date: { $gte: lookback } } },
      {
        $group: {
          _id: null,
          avgRate: { $avg: '$rate' },
          totalImpressions: { $sum: '$impressions' },
          totalFilled: { $sum: '$filled' }
        }
      }
    ]);

    // Get hourly pattern
    const hourlyData = await FillRate.aggregate([
      { $match: { ...query, date: { $gte: lookback } } },
      {
        $group: {
          _id: { $hour: '$date' },
          avgRate: { $avg: '$rate' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourlyPattern = new Map<number, number>(
      hourlyData.map(h => [h._id, h.avgRate])
    );

    return {
      avgRate: results[0]?.avgRate || 0,
      totalImpressions: results[0]?.totalImpressions || 0,
      totalFilled: results[0]?.totalFilled || 0,
      hourlyPattern
    };
  }

  private async getCurrentRate(inventoryId: string): Promise<number> {
    const latest = await FillRate.findOne({ inventoryId })
      .sort({ date: -1 })
      .lean();
    return latest?.rate || 0;
  }

  private generateOptimizationActions(metrics: any, strategy: string): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    // Pricing optimization
    if (metrics.avgRate < 70) {
      actions.push({
        type: 'pricing',
        description: 'Lower floor price by 10-15% to attract more demand',
        priority: 1,
        estimatedImpact: 8,
        parameters: { priceReduction: 0.1 }
      });
    }

    // Demand expansion
    if (metrics.avgRate < 80) {
      actions.push({
        type: 'demand',
        description: 'Expand to additional demand sources (DSPs, networks)',
        priority: 2,
        estimatedImpact: 12,
        parameters: { newSources: 3 }
      });
    }

    // Targeting optimization
    if (metrics.avgRate < 75) {
      actions.push({
        type: 'targeting',
        description: 'Relax targeting constraints to increase eligible demand',
        priority: 3,
        estimatedImpact: 5,
        parameters: { expandTargeting: true }
      });
    }

    // Technical optimization
    if (metrics.avgRate < 85) {
      actions.push({
        type: 'technical',
        description: 'Reduce latency to improve bid response rates',
        priority: 4,
        estimatedImpact: 3,
        parameters: { latencyReduction: 20 }
      });
    }

    // Aggressive strategy adds more actions
    if (strategy === 'aggressive') {
      actions.push({
        type: 'inventory',
        description: 'Enable additional ad formats to increase fill opportunities',
        priority: 5,
        estimatedImpact: 6,
        parameters: { additionalFormats: ['video', 'native'] }
      });
    }

    // Sort by priority
    actions.sort((a, b) => a.priority - b.priority);

    return actions;
  }

  private calculateExpectedRate(currentRate: number, actions: OptimizationAction[]): number {
    // Sum up estimated impacts
    const totalImpact = actions.reduce((sum, action) => sum + action.estimatedImpact, 0);
    return Math.min(100, currentRate + totalImpact);
  }

  private calculateExpectedOutcome(
    metrics: any,
    expectedRate: number,
    targetRate: number
  ): { rate: number; impressions: number; revenue: number } {
    // Assume impressions stay constant
    const impressions = metrics.totalImpressions;

    // Calculate potential revenue increase (simplified model)
    const currentRevenuePerFilled = metrics.totalFilled > 0
      ? 0.01 // Simplified CPM of $10
      : 0;

    const newFilledCount = Math.round(impressions * (expectedRate / 100));
    const revenueIncrease = (newFilledCount - metrics.totalFilled) * currentRevenuePerFilled;

    return {
      rate: Math.round(expectedRate * 100) / 100,
      impressions,
      revenue: Math.round(revenueIncrease * 100) / 100
    };
  }

  private simulateOptimizationImpact(actionType: string, parameters: Record<string, any>): number {
    // Simulate impact based on action type
    switch (actionType) {
      case 'pricing':
        return (parameters.priceReduction || 0.1) * 20;
      case 'demand':
        return (parameters.newSources || 1) * 5;
      case 'targeting':
        return parameters.expandTargeting ? 5 : 0;
      case 'technical':
        return (parameters.latencyReduction || 10) * 0.2;
      default:
        return 3;
    }
  }

  private calculateSignificance(records: any[]): number {
    if (records.length < 10) return 0;

    const rates = records.map(r => r.rate);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);

    // Simple significance calculation (should use proper t-test in production)
    return stdDev > 0 ? Math.min(95, 100 - (stdDev / mean) * 100) : 95;
  }
}