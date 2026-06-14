import { Channel, ModelResult, MMMModel } from '../models';
import { OptimizationResult } from '../types';
import { logger } from '../utils/logger';
import { optimizationRequestsTotal } from '../utils/metrics';

/**
 * Budget Optimization Service
 * Finds optimal budget allocation across channels to maximize ROI
 */
export class OptimizationService {
  /**
   * Optimize budget allocation for a model
   */
  async optimizeBudget(
    modelId: string,
    totalBudget: number,
    constraints?: {
      minSpendPerChannel?: number;
      maxSpendPerChannel?: number;
      maintainMix?: boolean;
    }
  ): Promise<OptimizationResult> {
    optimizationRequestsTotal.inc();

    try {
      logger.info('Optimizing budget allocation', { modelId, totalBudget });

      // Get model and channels
      const model = await MMMModel.findById(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const channels = await Channel.find({ _id: { $in: model.channels } });

      // Get latest model results
      const modelResult = await ModelResult.findOne({ modelId: model._id })
        .sort({ trainedAt: -1 });

      if (!modelResult) {
        throw new Error('Model must be trained before optimization');
      }

      // Calculate current allocation
      const currentAllocation = this.getCurrentAllocation(channels);
      const currentRoas = this.calculateCurrentRoas(channels);

      // Get marginal returns from model results
      const marginalReturns = this.getMarginalReturns(modelResult, channels);

      // Calculate optimal allocation using marginal ROAS
      const optimalAllocation = this.calculateOptimalAllocation(
        channels,
        marginalReturns,
        totalBudget,
        constraints
      );

      // Calculate projected results
      const projectedRevenue = this.projectRevenue(channels, optimalAllocation, marginalReturns);
      const projectedRoas = totalBudget > 0 ? projectedRevenue / totalBudget : 0;

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        channels,
        currentAllocation,
        optimalAllocation,
        marginalReturns
      );

      logger.info('Budget optimization completed', {
        modelId,
        currentRoas,
        projectedRoas,
        improvement: projectedRoas - currentRoas
      });

      return {
        optimalAllocation,
        projectedRevenue,
        projectedRoas,
        marginalReturns,
        recommendations
      };
    } catch (error) {
      logger.error('Budget optimization failed', { modelId, error });
      throw error;
    }
  }

  /**
   * Get current budget allocation
   */
  private getCurrentAllocation(channels: any[]): Record<string, number> {
    const allocation: Record<string, number> = {};
    const totalSpend = channels.reduce((sum, ch) => sum + (ch.spend || 0), 0);

    channels.forEach(ch => {
      allocation[ch.channelId] = totalSpend > 0 ? (ch.spend / totalSpend) * 100 : 0;
    });

    return allocation;
  }

  /**
   * Calculate current ROAS
   */
  private calculateCurrentRoas(channels: any[]): number {
    const totalSpend = channels.reduce((sum, ch) => sum + (ch.spend || 0), 0);
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

    return totalSpend > 0 ? totalRevenue / totalSpend : 0;
  }

  /**
   * Get marginal returns from model results
   */
  private getMarginalReturns(modelResult: any, channels: any[]): Record<string, number> {
    const marginalRoas = modelResult?.marginalRoas || new Map();
    const returns: Record<string, number> = {};

    channels.forEach(ch => {
      const mRoas = marginalRoas.get?.(ch.channelId);
      if (mRoas !== undefined) {
        returns[ch.channelId] = mRoas;
      } else {
        // Default: use base ROAS
        returns[ch.channelId] = ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0;
      }
    });

    return returns;
  }

  /**
   * Calculate optimal allocation based on marginal returns
   */
  private calculateOptimalAllocation(
    channels: any[],
    marginalReturns: Record<string, number>,
    totalBudget: number,
    constraints?: {
      minSpendPerChannel?: number;
      maxSpendPerChannel?: number;
      maintainMix?: boolean;
    }
  ): Record<string, number> {
    const optimalAllocation: Record<string, number> = {};
    const minSpend = constraints?.minSpendPerChannel || 0;
    const maxSpend = constraints?.maxSpendPerChannel || totalBudget;

    // Sort channels by marginal ROAS (descending)
    const sortedChannels = [...channels].sort((a, b) => {
      const roasA = marginalReturns[a.channelId] || 0;
      const roasB = marginalReturns[b.channelId] || 0;
      return roasB - roasA;
    });

    // Greedy allocation: allocate budget to highest marginal ROAS channels first
    let remainingBudget = totalBudget;

    sortedChannels.forEach(ch => {
      if (remainingBudget <= 0) {
        optimalAllocation[ch.channelId] = 0;
        return;
      }

      const currentSpend = ch.spend || 0;
      const marginalRoas = marginalReturns[ch.channelId] || 0;

      // Calculate optimal spend based on diminishing returns curve
      // Higher marginal ROAS = more budget
      const targetAllocation = this.calculateTargetAllocation(
        currentSpend,
        marginalRoas,
        totalBudget,
        channels.length
      );

      // Apply constraints
      let allocatedSpend = Math.max(minSpend, Math.min(maxSpend, targetAllocation));

      // If maintaining mix, respect current allocation percentages
      if (constraints?.maintainMix) {
        const currentPercentage = currentSpend / (totalBudget - remainingBudget + currentSpend) * 100;
        allocatedSpend = (currentPercentage / 100) * totalBudget;
        allocatedSpend = Math.max(minSpend, Math.min(maxSpend, allocatedSpend));
      }

      optimalAllocation[ch.channelId] = allocatedSpend;
      remainingBudget -= allocatedSpend;
    });

    // Normalize to percentages
    const totalAllocated = Object.values(optimalAllocation).reduce((a, b) => a + b, 0);
    Object.keys(optimalAllocation).forEach(chId => {
      optimalAllocation[chId] = totalAllocated > 0
        ? (optimalAllocation[chId] / totalAllocated) * 100
        : 0;
    });

    return optimalAllocation;
  }

  /**
   * Calculate target allocation for a channel
   */
  private calculateTargetAllocation(
    currentSpend: number,
    marginalRoas: number,
    totalBudget: number,
    numChannels: number
  ): number {
    // Base allocation is equal share
    const baseAllocation = totalBudget / numChannels;

    // Adjust based on marginal ROAS
    // Higher ROAS = more than average share
    const avgRoas = 1; // Normalized
    const roasMultiplier = marginalRoas / avgRoas;

    // Diminishing returns: don't allocate too much to any single channel
    const diminishingFactor = 1 / (1 + Math.log(1 + currentSpend / 1000));

    return baseAllocation * roasMultiplier * diminishingFactor;
  }

  /**
   * Project revenue with new allocation
   */
  private projectRevenue(
    channels: any[],
    newAllocation: Record<string, number>,
    marginalReturns: Record<string, number>
  ): number {
    let projectedRevenue = 0;

    channels.forEach(ch => {
      const newSpend = (newAllocation[ch.channelId] || 0) / 100 * this.getTotalSpend(channels);
      const marginalRoas = marginalReturns[ch.channelId] || 0;

      // Revenue = spend * marginal ROAS
      projectedRevenue += newSpend * marginalRoas;
    });

    return projectedRevenue;
  }

  /**
   * Get total spend across all channels
   */
  private getTotalSpend(channels: any[]): number {
    return channels.reduce((sum, ch) => sum + (ch.spend || 0), 0);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    channels: any[],
    currentAllocation: Record<string, number>,
    optimalAllocation: Record<string, number>,
    marginalReturns: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    channels.forEach(ch => {
      const currentPct = currentAllocation[ch.channelId] || 0;
      const optimalPct = optimalAllocation[ch.channelId] || 0;
      const diff = optimalPct - currentPct;
      const marginalRoas = marginalReturns[ch.channelId] || 0;

      if (Math.abs(diff) > 5) {
        if (diff > 0) {
          recommendations.push(
            `Increase ${ch.name} budget by ${diff.toFixed(1)}% (marginal ROAS: ${marginalRoas.toFixed(2)}x)`
          );
        } else {
          recommendations.push(
            `Decrease ${ch.name} budget by ${Math.abs(diff).toFixed(1)}% (marginal ROAS: ${marginalRoas.toFixed(2)}x)`
          );
        }
      }
    });

    // Sort by impact
    recommendations.sort((a, b) => {
      const impactA = this.extractImpact(a);
      const impactB = this.extractImpact(b);
      return Math.abs(impactB) - Math.abs(impactA);
    });

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Extract budget change from recommendation string
   */
  private extractImpact(recommendation: string): number {
    const match = recommendation.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get channel efficiency scores
   */
  async getChannelEfficiency(modelId: string): Promise<any> {
    const model = await MMMModel.findById(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const channels = await Channel.find({ _id: { $in: model.channels } });
    const modelResult = await ModelResult.findOne({ modelId: model._id })
      .sort({ trainedAt: -1 });

    const efficiency = channels.map(ch => {
      const spend = ch.spend || 0;
      const revenue = ch.revenue || 0;
      const conversions = ch.conversions || 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;

      const saturation = modelResult?.saturation?.get?.(ch.channelId) || 0.5;
      const adstock = modelResult?.adstock?.get?.(ch.channelId) || 0.3;

      // Efficiency score: combination of ROAS, saturation, and adstock
      const efficiencyScore = roas * (1 - saturation * 0.3) * (1 + adstock * 0.2);

      return {
        channelId: ch.channelId,
        channelName: ch.name,
        channelType: ch.type,
        spend,
        revenue,
        conversions,
        roas,
        cpa,
        saturation,
        adstock,
        efficiencyScore: Math.max(0, efficiencyScore)
      };
    });

    // Sort by efficiency score
    efficiency.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    return {
      modelId,
      channels: efficiency,
      totalSpend: efficiency.reduce((sum, ch) => sum + ch.spend, 0),
      totalRevenue: efficiency.reduce((sum, ch) => sum + ch.revenue, 0),
      overallRoas: efficiency.reduce((sum, ch) => sum + ch.spend, 0) > 0
        ? efficiency.reduce((sum, ch) => sum + ch.revenue, 0) / efficiency.reduce((sum, ch) => sum + ch.spend, 0)
        : 0
    };
  }
}

export const optimizationService = new OptimizationService();