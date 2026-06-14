import { YieldRecommendation, YieldSummary, YieldStrategy } from '../models';
import { yieldService } from './yieldService';
import logger from '../utils/logger';
import { recommendationsGenerated } from '../utils/metrics';

export interface RecommendationParams {
  inventoryType?: string;
  demandSource?: string;
  limit?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface RecommendationResult {
  recommendations: any[];
  summary: {
    total: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byCategory: {
      revenue: number;
      fill_rate: number;
      ecpm: number;
      efficiency: number;
      risk: number;
    };
    avgConfidence: number;
  };
}

class RecommendationService {
  /**
   * Get yield recommendations
   */
  async getRecommendations(params: RecommendationParams = {}): Promise<RecommendationResult> {
    const { inventoryType, demandSource, limit = 50, priority } = params;

    logger.info('Getting yield recommendations', { inventoryType, demandSource, priority });

    try {
      // First, generate new recommendations if needed
      await this.generateRecommendations(inventoryType);

      // Get pending recommendations
      const recommendations = await YieldRecommendation.findPending({
        inventoryType,
        priority,
        limit
      });

      // Filter by demand source if specified
      let filtered = recommendations;
      if (demandSource) {
        filtered = recommendations.filter(r =>
          r.demandSources.length === 0 || r.demandSources.includes(demandSource)
        );
      }

      // Calculate summary
      const summary = this.calculateSummary(filtered);

      // Record metrics
      filtered.forEach(r => {
        recommendationsGenerated.labels(r.type, r.priority).inc();
      });

      logger.info('Recommendations retrieved', {
        count: filtered.length,
        avgConfidence: summary.avgConfidence
      });

      return {
        recommendations: filtered.map(r => this.formatRecommendation(r)),
        summary
      };
    } catch (error) {
      logger.error('Failed to get recommendations', { error });
      throw error;
    }
  }

  /**
   * Generate new recommendations based on current state
   */
  private async generateRecommendations(inventoryType?: string): Promise<void> {
    // Get yield analysis
    const yieldAnalysis = await yieldService.getYieldSummary({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      inventoryType
    });

    const recommendations: any[] = [];

    // Analyze revenue trends
    if (yieldAnalysis.trends.revenue < -5) {
      recommendations.push({
        type: 'revenue',
        title: 'Revenue Decline Alert',
        description: `Revenue has decreased by ${Math.abs(yieldAnalysis.trends.revenue).toFixed(1)}% over the past week`,
        category: 'revenue',
        priority: 'high',
        action: {
          type: 'adjust_floor',
          target: 'all',
          value: -0.1,
          reason: 'Revenue decline detected'
        },
        impact: {
          estimatedRevenue: yieldAnalysis.current.revenue * 0.05,
          estimatedEcpm: -0.05,
          estimatedFillRate: 2,
          confidence: 0.75,
          timeframe: '7 days'
        }
      });
    }

    // Analyze fill rate
    if (yieldAnalysis.current.fillRate < 65) {
      recommendations.push({
        type: 'fill_rate',
        title: 'Low Fill Rate Optimization',
        description: `Fill rate is at ${yieldAnalysis.current.fillRate.toFixed(1)}%, below target of 70%`,
        category: 'fill_rate',
        priority: yieldAnalysis.current.fillRate < 50 ? 'critical' : 'high',
        action: {
          type: 'add_demand',
          target: 'header_bidding',
          reason: 'Improve fill rate'
        },
        impact: {
          estimatedRevenue: yieldAnalysis.current.revenue * 0.08,
          estimatedEcpm: -0.03,
          estimatedFillRate: 8,
          confidence: 0.8,
          timeframe: '14 days'
        }
      });
    }

    // Analyze eCPM
    if (yieldAnalysis.trends.ecpm < -3) {
      recommendations.push({
        type: 'ecpm',
        title: 'eCPM Optimization Opportunity',
        description: `eCPM has decreased by ${Math.abs(yieldAnalysis.trends.ecpm).toFixed(1)}%. Consider floor price adjustments.`,
        category: 'ecpm',
        priority: 'medium',
        action: {
          type: 'modify_pacing',
          target: 'all',
          value: { type: 'reduce', amount: 0.15 },
          reason: 'eCPM decline'
        },
        impact: {
          estimatedRevenue: yieldAnalysis.current.revenue * 0.03,
          estimatedEcpm: 0.08,
          estimatedFillRate: -1.5,
          confidence: 0.65,
          timeframe: '7 days'
        }
      });
    }

    // Check inventory mix
    if (yieldAnalysis.breakdown.byInventory.length > 0) {
      const highValueInventory = yieldAnalysis.breakdown.byInventory.find(
        i => i.ecpm > yieldAnalysis.current.ecpm * 1.2
      );
      const lowValueInventory = yieldAnalysis.breakdown.byInventory.find(
        i => i.ecpm < yieldAnalysis.current.ecpm * 0.7
      );

      if (highValueInventory && lowValueInventory) {
        recommendations.push({
          type: 'inventory_mix',
          title: 'Inventory Mix Optimization',
          description: `Consider reallocating inventory from ${lowValueInventory.inventoryType} to ${highValueInventory.inventoryType}`,
          category: 'efficiency',
          priority: 'medium',
          action: {
            type: 'reorder_priority',
            target: highValueInventory.inventoryType,
            value: 1,
            reason: 'Optimize high-value inventory'
          },
          impact: {
            estimatedRevenue: yieldAnalysis.current.revenue * 0.04,
            estimatedEcpm: 0.02,
            estimatedFillRate: 0,
            confidence: 0.6,
            timeframe: '14 days'
          }
        });
      }
    }

    // Check strategy performance
    const strategies = inventoryType
      ? await YieldStrategy.findByInventoryType(inventoryType)
      : await YieldStrategy.findActive();

    const lowPerformingStrategies = strategies.filter(
      s => s.performance.ecpm < yieldAnalysis.current.ecpm * 0.5
    );

    if (lowPerformingStrategies.length > 0) {
      recommendations.push({
        type: 'strategy_adjustment',
        title: 'Low-Performing Strategies Detected',
        description: `${lowPerformingStrategies.length} strategy(ies) performing below 50% of average eCPM`,
        category: 'efficiency',
        priority: 'medium',
        action: {
          type: 'disable_strategy',
          target: lowPerformingStrategies[0]._id.toString(),
          reason: 'Underperforming'
        },
        impact: {
          estimatedRevenue: 0,
          estimatedEcpm: 0.02,
          estimatedFillRate: 0.5,
          confidence: 0.7,
          timeframe: '7 days'
        }
      });
    }

    // Save new recommendations
    for (const rec of recommendations) {
      const existing = await YieldRecommendation.findOne({
        title: rec.title,
        status: 'pending'
      });

      if (!existing) {
        await YieldRecommendation.create({
          ...rec,
          inventoryTypes: inventoryType ? [inventoryType] : [],
          demandSources: [],
          conditions: {
            currentValue: yieldAnalysis.current.ecpm,
            threshold: yieldAnalysis.current.ecpm * 0.8,
            trend: yieldAnalysis.trends.ecpm > 0 ? 'increasing' : 'decreasing'
          },
          metadata: {
            model: 'rule_based',
            features: ['revenue_trend', 'ecpm_trend', 'fill_rate', 'inventory_mix'],
            reasoning: rec.description
          }
        });
      }
    }
  }

  /**
   * Apply a recommendation
   */
  async applyRecommendation(recommendationId: string, appliedBy: string): Promise<any> {
    logger.info('Applying recommendation', { recommendationId, appliedBy });

    const recommendation = await YieldRecommendation.findById(recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Apply the action
    switch (recommendation.action.type) {
      case 'adjust_floor':
        await this.applyFloorAdjustment(recommendation);
        break;
      case 'enable_strategy':
        await this.applyEnableStrategy(recommendation);
        break;
      case 'disable_strategy':
        await this.applyDisableStrategy(recommendation);
        break;
      case 'reorder_priority':
        await this.applyReorderPriority(recommendation);
        break;
      case 'add_demand':
        await this.applyAddDemand(recommendation);
        break;
      case 'modify_pacing':
        await this.applyModifyPacing(recommendation);
        break;
    }

    // Mark as applied
    await YieldRecommendation.markAsApplied(recommendationId, appliedBy);

    logger.info('Recommendation applied', { recommendationId, appliedBy });

    return { success: true, recommendationId };
  }

  /**
   * Apply floor price adjustment
   */
  private async applyFloorAdjustment(recommendation: any): Promise<void> {
    const strategies = await YieldStrategy.find({ type: 'floor' });
    const adjustment = recommendation.action.value || -0.1;

    for (const strategy of strategies) {
      if (strategy.settings.floorPrice !== undefined) {
        strategy.settings.floorPrice *= (1 + adjustment);
        await strategy.save();
      }
    }
  }

  /**
   * Enable a strategy
   */
  private async applyEnableStrategy(recommendation: any): Promise<void> {
    await YieldStrategy.findByIdAndUpdate(recommendation.action.target, {
      status: 'active'
    });
  }

  /**
   * Disable a strategy
   */
  private async applyDisableStrategy(recommendation: any): Promise<void> {
    await YieldStrategy.findByIdAndUpdate(recommendation.action.target, {
      status: 'paused'
    });
  }

  /**
   * Reorder priority
   */
  private async applyReorderPriority(recommendation: any): Promise<void> {
    await YieldStrategy.findByIdAndUpdate(recommendation.action.target, {
      $inc: { priority: recommendation.action.value || 1 }
    });
  }

  /**
   * Add demand source
   */
  private async applyAddDemand(recommendation: any): Promise<void> {
    logger.info('Adding demand source', { target: recommendation.action.target });
    // Implementation would create/configure new demand source
  }

  /**
   * Modify pacing
   */
  private async applyModifyPacing(recommendation: any): Promise<void> {
    const pacing = recommendation.action.value;
    const strategies = await YieldStrategy.find({});

    for (const strategy of strategies) {
      strategy.settings.pacing = {
        enabled: true,
        dailyLimit: pacing?.type === 'reduce' ? strategy.settings.pacing?.dailyLimit * 0.85 : undefined,
        hourlyLimit: pacing?.type === 'reduce' ? strategy.settings.pacing?.hourlyLimit * 0.85 : undefined
      };
      await strategy.save();
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(recommendations: any[]): any {
    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    const byCategory = { revenue: 0, fill_rate: 0, ecpm: 0, efficiency: 0, risk: 0 };

    let totalConfidence = 0;

    recommendations.forEach(r => {
      byPriority[r.priority]++;
      byCategory[r.category]++;
      totalConfidence += r.impact.confidence;
    });

    return {
      total: recommendations.length,
      byPriority,
      byCategory,
      avgConfidence: recommendations.length > 0 ? totalConfidence / recommendations.length : 0
    };
  }

  /**
   * Format recommendation for output
   */
  private formatRecommendation(recommendation: any): any {
    return {
      id: recommendation._id,
      type: recommendation.type,
      category: recommendation.category,
      title: recommendation.title,
      description: recommendation.description,
      action: recommendation.action,
      impact: recommendation.impact,
      priority: recommendation.priority,
      status: recommendation.status,
      inventoryTypes: recommendation.inventoryTypes,
      conditions: recommendation.conditions,
      expiresAt: recommendation.expiresAt,
      createdAt: recommendation.createdAt
    };
  }
}

export const recommendationService = new RecommendationService();