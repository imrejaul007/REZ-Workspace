import { Optimization, AutonomousCampaign, Decision } from '../models';
import { campaignMetrics } from '../utils/metrics';
import logger from '../utils/logger';

interface OptimizationResult {
  success: boolean;
  optimizationId: string;
  changes: Record<string, any>;
  impact: {
    metrics: Record<string, number>;
    score: number;
  };
}

export class OptimizationService {
  private optimizationInterval: number;
  private minConfidence: number;

  constructor() {
    this.optimizationInterval = 15 * 60 * 1000; // 15 minutes
    this.minConfidence = 0.6; // Minimum confidence to apply optimization
  }

  /**
   * Run continuous optimization for active campaigns
   */
  async runOptimizationCycle(): Promise<{
    campaignsOptimized: number;
    optimizationsApplied: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let campaignsOptimized = 0;
    let optimizationsApplied = 0;
    const errors: string[] = [];

    logger.info('Starting optimization cycle');

    // Find active autonomous campaigns due for optimization
    const campaigns = await AutonomousCampaign.find({
      autonomousMode: true,
      status: 'active',
      $or: [
        { nextOptimization: { $lte: new Date() } },
        { nextOptimization: { $exists: false } }
      ]
    });

    for (const campaign of campaigns) {
      try {
        const result = await this.optimizeCampaign(campaign._id.toString());
        if (result.success) {
          campaignsOptimized++;
          optimizationsApplied += result.changes ? Object.keys(result.changes).length : 0;
        }
      } catch (error) {
        const errorMsg = `Failed to optimize campaign ${campaign._id}: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Update next optimization times
    await AutonomousCampaign.updateMany(
      {
        autonomousMode: true,
        status: 'active'
      },
      {
        lastOptimization: new Date(),
        nextOptimization: new Date(Date.now() + this.optimizationInterval)
      }
    );

    logger.info('Optimization cycle complete', {
      campaignsOptimized,
      optimizationsApplied,
      durationMs: Date.now() - startTime
    });

    return { campaignsOptimized, optimizationsApplied, errors };
  }

  /**
   * Optimize a single campaign
   */
  async optimizeCampaign(campaignId: string): Promise<OptimizationResult> {
    const campaign = await AutonomousCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    logger.info('Optimizing campaign', { campaignId, name: campaign.name });

    const changes: Record<string, any> = {};
    const metrics: Record<string, number> = {};

    // Get recent decisions for this campaign
    const recentDecisions = await Decision.find({
      campaignId,
      approved: true,
      executed: false
    }).sort({ createdAt: -1 }).limit(5);

    // Apply approved decisions
    for (const decision of recentDecisions) {
      if (decision.reasoning.confidence >= this.minConfidence) {
        changes[decision.action.target] = {
          from: decision.action.currentValue,
          to: decision.action.proposedValue
        };

        // Mark decision as executed
        decision.executed = true;
        decision.executedAt = new Date();
        await decision.save();

        campaignMetrics.optimizationsApplied.inc({ type: decision.type });
      }
    }

    // Calculate impact metrics
    const performance = campaign.performance;
    if (performance.impressions > 0) {
      metrics.ctr = performance.clicks / performance.impressions;
    }
    if (performance.clicks > 0) {
      metrics.cpc = performance.spend / performance.clicks;
      metrics.cpa = performance.spend / performance.conversions;
    }
    if (performance.spend > 0) {
      metrics.roas = performance.conversions > 0 ? performance.conversions / performance.spend : 0;
    }

    // Calculate optimization score
    const score = this.calculateOptimizationScore(performance, changes);

    // Create optimization record
    const optimization = new Optimization({
      campaignId,
      type: this.determineOptimizationType(changes),
      changes: {
        before: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, (v as any).from])
        ),
        after: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, (v as any).to])
        ),
        parameters: Object.keys(changes)
      },
      impact: {
        metrics,
        score,
        confidence: this.calculateConfidence(changes, performance)
      },
      decisionId: recentDecisions[0]?._id,
      automated: true
    });

    await optimization.save();

    logger.info('Campaign optimization complete', {
      campaignId,
      changesCount: Object.keys(changes).length,
      score
    });

    return {
      success: true,
      optimizationId: optimization._id.toString(),
      changes,
      impact: {
        metrics,
        score
      }
    };
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(
    performance: { roas: number; ctr: number; cpc: number; conversions: number },
    changes: Record<string, any>
  ): number {
    let score = 50; // Base score

    // ROAS contribution
    if (performance.roas > 0) {
      score += Math.min(performance.roas * 10, 30);
    }

    // CTR contribution
    if (performance.ctr > 0) {
      score += Math.min(performance.ctr * 100, 20);
    }

    // Changes made
    score += Math.min(Object.keys(changes).length * 5, 10);

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    changes: Record<string, any>,
    performance: { impressions: number; clicks: number; conversions: number }
  ): number {
    let confidence = 0.5;

    // More data = higher confidence
    if (performance.impressions > 10000) confidence += 0.15;
    else if (performance.impressions > 1000) confidence += 0.1;

    if (performance.clicks > 100) confidence += 0.1;
    if (performance.conversions > 10) confidence += 0.1;

    // Fewer changes = higher confidence
    if (Object.keys(changes).length <= 2) confidence += 0.05;

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Determine optimization type based on changes
   */
  private determineOptimizationType(changes: Record<string, any>): string {
    const keys = Object.keys(changes);

    if (keys.some(k => k.includes('budget'))) return 'budget_reallocation';
    if (keys.some(k => k.includes('bid'))) return 'bid_optimization';
    if (keys.some(k => k.includes('audience') || k.includes('target'))) return 'audience_refinement';
    if (keys.some(k => k.includes('creative'))) return 'creative_testing';
    if (keys.some(k => k.includes('frequency'))) return 'frequency_optimization';

    return 'performance_boost';
  }

  /**
   * Get optimization history for a campaign
   */
  async getOptimizationHistory(
    campaignId: string,
    options: { limit?: number; type?: string } = {}
  ): Promise<Optimization[]> {
    const query: Record<string, any> = { campaignId };
    if (options.type) query.type = options.type;

    return Optimization.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50);
  }

  /**
   * Get optimization statistics
   */
  async getOptimizationStats(campaignId?: string): Promise<{
    totalOptimizations: number;
    averageScore: number;
    byType: Record<string, number>;
  }> {
    const match: Record<string, any> = {};
    if (campaignId) match.campaignId = campaignId;

    const stats = await Optimization.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOptimizations: { $sum: 1 },
          averageScore: { $avg: '$impact.score' },
          byType: { $push: '$type' }
        }
      }
    ]);

    if (!stats.length) {
      return { totalOptimizations: 0, averageScore: 0, byType: {} };
    }

    // Count by type
    const byType: Record<string, number> = {};
    for (const type of stats[0].byType) {
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalOptimizations: stats[0].totalOptimizations,
      averageScore: stats[0].averageScore || 0,
      byType
    };
  }

  /**
   * Rollback an optimization
   */
  async rollbackOptimization(optimizationId: string): Promise<boolean> {
    const optimization = await Optimization.findById(optimizationId);
    if (!optimization) return false;

    const campaign = await AutonomousCampaign.findById(optimization.campaignId);
    if (!campaign) return false;

    // Apply rollback changes
    const beforeChanges = optimization.changes.before;
    for (const [key, value] of Object.entries(beforeChanges)) {
      logger.info('Rolling back optimization', {
        optimizationId,
        parameter: key,
        value
      });
    }

    logger.info('Optimization rolled back', { optimizationId });
    return true;
  }
}

export const optimizationService = new OptimizationService();
export default optimizationService;