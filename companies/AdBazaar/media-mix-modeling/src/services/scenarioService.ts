import { v4 as uuidv4 } from 'uuid';
import { Scenario, MMMModel, Channel, ModelResult } from '../models';
import { ScenarioRequest } from '../types';
import { logger } from '../utils/logger';
import { scenarioRequestsTotal } from '../utils/metrics';
import { optimizationService } from './optimizationService';

/**
 * Scenario Planning Service
 * Creates and evaluates budget allocation scenarios
 */
export class ScenarioService {
  /**
   * Create a new scenario
   */
  async createScenario(modelId: string, data: ScenarioRequest): Promise<any> {
    scenarioRequestsTotal.inc();

    try {
      logger.info('Creating scenario', { modelId, name: data.name });

      // Verify model exists and is trained
      const model = await MMMModel.findById(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      if (model.status !== 'TRAINED') {
        throw new Error('Model must be trained before creating scenarios');
      }

      const channels = await Channel.find({ _id: { $in: model.channels } });
      const modelResult = await ModelResult.findOne({ modelId: model._id })
        .sort({ trainedAt: -1 });

      // Calculate baseline metrics
      const baseline = this.calculateBaseline(channels);

      // Simulate scenario
      const simulation = this.simulateScenario(channels, data, modelResult);

      // Create scenario document
      const scenario = new Scenario({
        scenarioId: uuidv4(),
        name: data.name,
        modelId: model._id,
        totalBudget: data.totalBudget,
        allocation: this.objectToMap(data.allocation),
        projected: {
          revenue: simulation.projectedRevenue,
          roas: simulation.projectedRoas,
          conversions: simulation.projectedConversions,
          incrementalRevenue: simulation.projectedRevenue - baseline.revenue
        },
        constraints: data.constraints,
        status: 'SIMULATED',
        comparison: {
          vsBaseline: {
            revenueChange: simulation.projectedRevenue - baseline.revenue,
            revenueChangePct: baseline.revenue > 0
              ? ((simulation.projectedRevenue - baseline.revenue) / baseline.revenue) * 100
              : 0,
            roasChange: simulation.projectedRoas - baseline.roas,
            spendChange: data.totalBudget - baseline.spend
          },
          vsCurrent: {
            revenueChange: simulation.projectedRevenue - baseline.revenue,
            revenueChangePct: baseline.revenue > 0
              ? ((simulation.projectedRevenue - baseline.revenue) / baseline.revenue) * 100
              : 0
          }
        }
      });

      await scenario.save();

      logger.info('Scenario created', { scenarioId: scenario.scenarioId });

      return this.formatScenario(scenario, baseline);
    } catch (error) {
      logger.error('Failed to create scenario', { modelId, error });
      throw error;
    }
  }

  /**
   * Get scenario by ID
   */
  async getScenario(modelId: string, scenarioId: string): Promise<any> {
    const scenario = await Scenario.findOne({
      _id: scenarioId,
      modelId
    });

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const baseline = await this.getBaseline(modelId);
    return this.formatScenario(scenario, baseline);
  }

  /**
   * List scenarios for a model
   */
  async listScenarios(modelId: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [scenarios, total] = await Promise.all([
      Scenario.find({ modelId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Scenario.countDocuments({ modelId })
    ]);

    const baseline = await this.getBaseline(modelId);

    return {
      data: scenarios.map(s => this.formatScenario(s, baseline)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(modelId: string, scenarioIds: string[]): Promise<any> {
    const scenarios = await Scenario.find({
      _id: { $in: scenarioIds },
      modelId
    });

    if (scenarios.length < 2) {
      throw new Error('At least 2 scenarios required for comparison');
    }

    const baseline = await this.getBaseline(modelId);

    const comparison = {
      baseline,
      scenarios: scenarios.map(s => this.formatScenario(s, baseline)),
      recommendations: this.generateComparisonRecommendations(scenarios, baseline)
    };

    return comparison;
  }

  /**
   * Calculate baseline metrics
   */
  private async getBaseline(modelId: string): Promise<any> {
    const model = await MMMModel.findById(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const channels = await Channel.find({ _id: { $in: model.channels } });
    return this.calculateBaseline(channels);
  }

  /**
   * Calculate baseline from current channel data
   */
  private calculateBaseline(channels: any[]): any {
    const totalSpend = channels.reduce((sum, ch) => sum + (ch.spend || 0), 0);
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);
    const totalConversions = channels.reduce((sum, ch) => sum + (ch.conversions || 0), 0);

    return {
      spend: totalSpend,
      revenue: totalRevenue,
      conversions: totalConversions,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      channelCount: channels.length
    };
  }

  /**
   * Simulate a scenario
   */
  private simulateScenario(
    channels: any[],
    data: ScenarioRequest,
    modelResult: any
  ): any {
    const marginalRoas = modelResult?.marginalRoas || new Map();
    const saturation = modelResult?.saturation || new Map();

    let projectedRevenue = 0;
    let projectedConversions = 0;

    channels.forEach(ch => {
      const allocationPct = data.allocation[ch.channelId] || 0;
      const newSpend = (allocationPct / 100) * data.totalBudget;

      // Get channel metrics
      const mRoas = marginalRoas.get?.(ch.channelId) || 1;
      const sat = saturation.get?.(ch.channelId) || 0.5;

      // Apply saturation curve
      const effectiveRoas = mRoas * (1 - sat * 0.3);

      // Project revenue
      const channelRevenue = newSpend * effectiveRoas;
      projectedRevenue += channelRevenue;

      // Estimate conversions (assume average conversion value)
      const avgConversionValue = 100; // Can be made configurable
      projectedConversions += channelRevenue / avgConversionValue;
    });

    const projectedRoas = data.totalBudget > 0 ? projectedRevenue / data.totalBudget : 0;

    return {
      projectedRevenue,
      projectedRoas,
      projectedConversions
    };
  }

  /**
   * Generate comparison recommendations
   */
  private generateComparisonRecommendations(scenarios: any[], baseline: any): string[] {
    const recommendations: string[] = [];

    // Find best scenario by ROAS
    const bestRoas = scenarios.reduce((best, s) =>
      s.projected.roas > best.projected.roas ? s : best
    , scenarios[0]);

    // Find best scenario by revenue
    const bestRevenue = scenarios.reduce((best, s) =>
      s.projected.revenue > best.projected.revenue ? s : best
    , scenarios[0]);

    if (bestRoas._id !== bestRevenue._id) {
      recommendations.push(
        `Best ROAS: ${bestRoas.name} (${bestRoas.projected.roas.toFixed(2)}x)`
      );
      recommendations.push(
        `Best Revenue: ${bestRevenue.name} (₹${bestRevenue.projected.revenue.toLocaleString()})`
      );
    } else {
      recommendations.push(
        `Optimal Scenario: ${bestRoas.name} with ${bestRoas.projected.roas.toFixed(2)}x ROAS and ₹${bestRoas.projected.revenue.toLocaleString()} projected revenue`
      );
    }

    // Check for budget efficiency
    const avgSpend = scenarios.reduce((sum, s) => sum + s.totalBudget, 0) / scenarios.length;
    const efficientScenarios = scenarios.filter(s =>
      s.projected.roas > baseline.roas && s.totalBudget <= avgSpend
    );

    if (efficientScenarios.length > 0) {
      recommendations.push(
        `${efficientScenarios.length} scenario(s) achieve better ROAS with budget <= average`
      );
    }

    return recommendations;
  }

  /**
   * Format scenario for API response
   */
  private formatScenario(scenario: any, baseline: any): any {
    return {
      id: scenario._id,
      scenarioId: scenario.scenarioId,
      name: scenario.name,
      modelId: scenario.modelId,
      totalBudget: scenario.totalBudget,
      allocation: this.mapToObject(scenario.allocation),
      projected: scenario.projected,
      constraints: scenario.constraints,
      status: scenario.status,
      comparison: scenario.comparison ? {
        vsBaseline: {
          revenueChange: scenario.comparison.vsBaseline?.revenueChange || 0,
          revenueChangePct: scenario.comparison.vsBaseline?.revenueChangePct || 0,
          roasChange: scenario.comparison.vsBaseline?.roasChange || 0,
          spendChange: scenario.comparison.vsBaseline?.spendChange || 0
        },
        vsCurrent: {
          revenueChange: scenario.comparison.vsCurrent?.revenueChange || 0,
          revenueChangePct: scenario.comparison.vsCurrent?.revenueChangePct || 0
        }
      } : null,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt
    };
  }

  /**
   * Convert Map to plain object
   */
  private mapToObject(map: Map<string, number> | Record<string, number>): Record<string, number> {
    if (map instanceof Map) {
      return Object.fromEntries(map);
    }
    return map;
  }

  /**
   * Convert plain object to Map
   */
  private objectToMap(obj: Record<string, number>): Map<string, number> {
    return new Map(Object.entries(obj));
  }
}

export const scenarioService = new ScenarioService();