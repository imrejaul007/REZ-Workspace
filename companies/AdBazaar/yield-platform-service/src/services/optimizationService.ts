import { YieldStrategy, YieldSummary } from '../models';
import { yieldService } from './yieldService';
import logger from '../utils/logger';
import { optimizationAttempts, optimizationDuration } from '../utils/metrics';

export interface OptimizationParams {
  inventoryType?: string;
  objective: 'revenue' | 'ecpm' | 'fill_rate' | 'balanced';
  constraints?: {
    minFillRate?: number;
    maxFloorPrice?: number;
    minFloorPrice?: number;
  };
  lookbackDays?: number;
}

export interface OptimizationResult {
  id: string;
  timestamp: Date;
  objective: string;
  changes: {
    strategyId: string;
    strategyName: string;
    changeType: 'floor_adjustment' | 'priority_reorder' | 'enable' | 'disable';
    before: any;
    after: any;
    estimatedImpact: {
      revenueChange: number;
      ecpmChange: number;
      fillRateChange: number;
    };
  }[];
  overallImpact: {
    revenueChange: number;
    ecpmChange: number;
    fillRateChange: number;
  };
  status: 'completed' | 'no_improvement' | 'constrained';
  recommendations: string[];
}

class OptimizationService {
  /**
   * Optimize yield strategies
   */
  async optimize(params: OptimizationParams): Promise<OptimizationResult> {
    const startTime = Date.now();
    const { inventoryType, objective, constraints = {}, lookbackDays = 7 } = params;

    logger.info('Starting yield optimization', { inventoryType, objective, constraints });

    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get current strategies
      const strategies = inventoryType
        ? await YieldStrategy.findByInventoryType(inventoryType)
        : await YieldStrategy.findActive();

      if (strategies.length === 0) {
        optimizationAttempts.labels('default', 'no_strategies').inc();
        return this.createEmptyResult(optimizationId, objective);
      }

      // Get yield analysis
      const yieldAnalysis = await yieldService.getYieldSummary({
        startDate: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
        inventoryType
      });

      // Analyze current state
      const currentState = {
        avgEcpm: yieldAnalysis.current.ecpm,
        avgFillRate: yieldAnalysis.current.fillRate,
        totalRevenue: yieldAnalysis.current.revenue
      };

      // Generate optimization recommendations
      const changes = this.generateOptimizations(
        strategies,
        currentState,
        objective,
        constraints
      );

      // Apply optimizations
      const appliedChanges = await this.applyOptimizations(changes);

      // Calculate overall impact
      const overallImpact = this.calculateOverallImpact(appliedChanges, currentState);

      // Record metrics
      optimizationAttempts.labels(objective, appliedChanges.length > 0 ? 'success' : 'no_change').inc();
      optimizationDuration.labels(objective).observe((Date.now() - startTime) / 1000);

      const result: OptimizationResult = {
        id: optimizationId,
        timestamp: new Date(),
        objective,
        changes: appliedChanges,
        overallImpact,
        status: appliedChanges.length > 0 ? 'completed' : 'no_improvement',
        recommendations: this.generateRecommendations(appliedChanges, overallImpact)
      };

      logger.info('Yield optimization completed', {
        optimizationId,
        changesCount: appliedChanges.length,
        overallImpact
      });

      return result;
    } catch (error) {
      logger.error('Yield optimization failed', { error, optimizationId });
      optimizationAttempts.labels(objective, 'error').inc();
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizations(
    strategies: any[],
    currentState: any,
    objective: string,
    constraints: any
  ): any[] {
    const changes: any[] = [];

    // Strategy analysis
    strategies.forEach((strategy, index) => {
      const perf = strategy.performance;
      const isLowPerformer = perf.ecpm < currentState.avgEcpm * 0.7;
      const isHighPerformer = perf.ecpm > currentState.avgEcpm * 1.3;

      // Floor price optimization
      if (strategy.type === 'floor' && strategy.settings.floorPrice !== undefined) {
        const currentFloor = strategy.settings.floorPrice;
        let newFloor = currentFloor;

        if (objective === 'ecpm' || objective === 'revenue') {
          if (isHighPerformer) {
            // Increase floor for high performers
            newFloor = currentFloor * 1.1;
          } else if (isLowPerformer) {
            // Decrease floor to improve fill rate
            newFloor = currentFloor * 0.95;
          }

          // Apply constraints
          if (constraints.maxFloorPrice && newFloor > constraints.maxFloorPrice) {
            newFloor = constraints.maxFloorPrice;
          }
          if (constraints.minFloorPrice && newFloor < constraints.minFloorPrice) {
            newFloor = constraints.minFloorPrice;
          }

          if (newFloor !== currentFloor) {
            changes.push({
              strategyId: strategy._id.toString(),
              strategyName: strategy.name,
              changeType: 'floor_adjustment',
              before: { floorPrice: currentFloor },
              after: { floorPrice: Math.round(newFloor * 100) / 100 },
              estimatedImpact: {
                revenueChange: ((newFloor - currentFloor) / currentFloor) * 100,
                ecpmChange: ((newFloor - currentFloor) / currentFloor) * 100,
                fillRateChange: isLowPerformer ? 5 : -2
              }
            });
          }
        }
      }

      // Priority optimization
      if (index > 0 && isHighPerformer && strategy.priority < strategies[index - 1].priority) {
        changes.push({
          strategyId: strategy._id.toString(),
          strategyName: strategy.name,
          changeType: 'priority_reorder',
          before: { priority: strategy.priority },
          after: { priority: strategies[index - 1].priority + 1 },
          estimatedImpact: {
            revenueChange: 3,
            ecpmChange: 2,
            fillRateChange: 0
          }
        });
      }
    });

    // Fill rate optimization
    if ((objective === 'fill_rate' || objective === 'balanced') &&
        currentState.avgFillRate < (constraints.minFillRate || 70)) {
      // Enable additional demand sources
      const pausedStrategies = strategies.filter(s => s.status === 'paused');
      const topPaused = pausedStrategies
        .sort((a, b) => b.performance.ecpm - a.performance.ecpm)
        .slice(0, 2);

      topPaused.forEach(strategy => {
        changes.push({
          strategyId: strategy._id.toString(),
          strategyName: strategy.name,
          changeType: 'enable',
          before: { status: 'paused' },
          after: { status: 'active' },
          estimatedImpact: {
            revenueChange: strategy.performance.ecpm > 0 ? 5 : 0,
            ecpmChange: strategy.performance.ecpm > 0 ? -2 : 0,
            fillRateChange: 10
          }
        });
      });
    }

    return changes;
  }

  /**
   * Apply optimization changes to strategies
   */
  private async applyOptimizations(changes: any[]): Promise<any[]> {
    const appliedChanges: any[] = [];

    for (const change of changes) {
      try {
        const strategy = await YieldStrategy.findById(change.strategyId);
        if (!strategy) continue;

        switch (change.changeType) {
          case 'floor_adjustment':
            strategy.settings.floorPrice = change.after.floorPrice;
            break;
          case 'priority_reorder':
            strategy.priority = change.after.priority;
            break;
          case 'enable':
            strategy.status = 'active';
            break;
          case 'disable':
            strategy.status = 'paused';
            break;
        }

        await strategy.save();
        appliedChanges.push(change);

        logger.info('Applied optimization change', {
          strategyId: change.strategyId,
          changeType: change.changeType
        });
      } catch (error) {
        logger.error('Failed to apply optimization change', {
          error,
          strategyId: change.strategyId
        });
      }
    }

    return appliedChanges;
  }

  /**
   * Calculate overall impact of optimizations
   */
  private calculateOverallImpact(changes: any[], currentState: any): any {
    if (changes.length === 0) {
      return { revenueChange: 0, ecpmChange: 0, fillRateChange: 0 };
    }

    return changes.reduce(
      (acc, change) => ({
        revenueChange: acc.revenueChange + (change.estimatedImpact.revenueChange || 0),
        ecpmChange: acc.ecpmChange + (change.estimatedImpact.ecpmChange || 0),
        fillRateChange: acc.fillRateChange + (change.estimatedImpact.fillRateChange || 0)
      }),
      { revenueChange: 0, ecpmChange: 0, fillRateChange: 0 }
    );
  }

  /**
   * Generate human-readable recommendations
   */
  private generateRecommendations(changes: any[], overallImpact: any): string[] {
    const recommendations: string[] = [];

    const floorChanges = changes.filter(c => c.changeType === 'floor_adjustment');
    const priorityChanges = changes.filter(c => c.changeType === 'priority_reorder');
    const enableChanges = changes.filter(c => c.changeType === 'enable');

    if (floorChanges.length > 0) {
      recommendations.push(
        `Adjusted floor prices for ${floorChanges.length} strategy(ies) to optimize ${overallImpact.ecpmChange >= 0 ? 'eCPM' : 'fill rate'}`
      );
    }

    if (priorityChanges.length > 0) {
      recommendations.push(
        `Reordered priorities for ${priorityChanges.length} high-performing strategy(ies)`
      );
    }

    if (enableChanges.length > 0) {
      recommendations.push(
        `Enabled ${enableChanges.length} additional demand source(s) to improve fill rate`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Current strategy configuration is optimal for the given constraints');
    }

    return recommendations;
  }

  /**
   * Create empty result for no strategies case
   */
  private createEmptyResult(id: string, objective: string): OptimizationResult {
    return {
      id,
      timestamp: new Date(),
      objective,
      changes: [],
      overallImpact: { revenueChange: 0, ecpmChange: 0, fillRateChange: 0 },
      status: 'no_improvement',
      recommendations: ['No active strategies found to optimize']
    };
  }
}

export const optimizationService = new OptimizationService();