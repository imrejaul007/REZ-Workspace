/**
 * Optimization Service - Campaign optimization logic
 */

import { SearchCampaign, SearchKeyword, SearchAd, SearchPerformance } from '../models';
import { ISearchCampaign, OptimizeRequest, CampaignPerformance } from '../types';
import { logger } from 'utils/logger.js';
import { optimizationsTotal, campaignSpend } from '../utils/metrics';
import { qualityScoreService } from './qualityScoreService';

interface OptimizationResult {
  campaignId: string;
  optimizations: {
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  bidChanges: { keywordId: string; oldBid: number; newBid: number }[];
  statusChanges: { keywordId: string; status: string }[];
  estimatedImpact: {
    ctrChange: number;
    cpcChange: number;
    roasChange: number;
  };
}

export class OptimizationService {
  /**
   * Optimize campaign
   */
  async optimizeCampaign(campaignId: string, options: OptimizeRequest): Promise<OptimizationResult> {
    try {
      logger.info('Optimizing campaign', { campaignId, options });

      const campaign = await SearchCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const performance = await this.getCampaignPerformance(campaignId, 30);
      const qualityScores = await qualityScoreService.getCampaignQualityScores(campaignId);
      const keywords = await SearchKeyword.findByCampaign(campaignId);

      const optimizations: OptimizationResult = {
        campaignId,
        optimizations: [],
        bidChanges: [],
        statusChanges: [],
        estimatedImpact: { ctrChange: 0, cpcChange: 0, roasChange: 0 },
      };

      // Strategy-based optimization intensity
      const intensityMultiplier = {
        aggressive: 1.5,
        moderate: 1.0,
        conservative: 0.5,
      }[options.strategy];

      // Optimize bids
      const bidOptimizations = this.optimizeBids(keywords, qualityScores, performance, options, intensityMultiplier);
      optimizations.bidChanges = bidOptimizations;

      // Optimize keyword status
      const statusOptimizations = this.optimizeKeywordStatus(keywords, qualityScores, performance, options);
      optimizations.statusChanges = statusOptimizations;

      // Generate recommendations
      optimizations.optimizations = this.generateRecommendations(campaign, performance, qualityScores, options);

      // Calculate estimated impact
      optimizations.estimatedImpact = this.calculateEstimatedImpact(optimizations);

      // Record metrics
      optimizationsTotal.inc({
        campaign_id: campaignId,
        type: options.strategy,
        result: 'completed',
      });

      logger.info('Campaign optimized', { campaignId, optimizations: optimizations.optimizations.length });

      return optimizations;
    } catch (error) {
      logger.error('Failed to optimize campaign', { error, campaignId });
      optimizationsTotal.inc({
        campaign_id: campaignId,
        type: options.strategy || 'unknown',
        result: 'failed',
      });
      throw error;
    }
  }

  /**
   * Optimize keyword bids
   */
  private optimizeBids(
    keywords: any[],
    qualityScores: any[],
    performance: any,
    options: OptimizeRequest,
    intensityMultiplier: number
  ): { keywordId: string; oldBid: number; newBid: number }[] {
    const changes: { keywordId: string; oldBid: number; newBid: number }[] = [];

    const minQualityScore = options.minQualityScore || 5;
    const targetCpc = options.targetCpc || 0;

    for (const keyword of keywords) {
      if (keyword.status !== 'active') continue;

      const qualityScore = qualityScores.find((qs) => qs.keywordId === keyword._id.toString());
      const qs = qualityScore?.qualityScore || 5;

      // Skip low quality keywords
      if (qs < minQualityScore) continue;

      let newBid = keyword.bid;

      // Calculate adjustment based on performance
      const historicalPerformance = performance.metrics || {};
      const ctr = historicalPerformance.ctr || 0;
      const roas = historicalPerformance.roas || 0;

      // Increase bid for high-performing keywords
      if (ctr > 5 && roas > 3) {
        newBid = keyword.bid * (1 + 0.2 * intensityMultiplier);
      }
      // Decrease bid for underperforming keywords
      else if (ctr < 1 || roas < 1) {
        newBid = keyword.bid * (1 - 0.15 * intensityMultiplier);
      }

      // Apply target CPC constraint
      if (targetCpc > 0 && newBid > targetCpc) {
        newBid = targetCpc;
      }

      // Round to 2 decimal places
      newBid = Math.round(newBid * 100) / 100;

      // Only update if change is significant (> 5%)
      if (Math.abs(newBid - keyword.bid) / keyword.bid > 0.05) {
        changes.push({
          keywordId: keyword._id.toString(),
          oldBid: keyword.bid,
          newBid,
        });

        // Update keyword in database
        keyword.bid = newBid;
        keyword.save().catch((err) => logger.error('Failed to update keyword bid', { err }));
      }
    }

    return changes;
  }

  /**
   * Optimize keyword status
   */
  private optimizeKeywordStatus(
    keywords: any[],
    qualityScores: any[],
    performance: any,
    options: OptimizeRequest
  ): { keywordId: string; status: string }[] {
    const changes: { keywordId: string; status: string }[] = [];

    const minQualityScore = options.minQualityScore || 5;

    for (const keyword of keywords) {
      const qualityScore = qualityScores.find((qs) => qs.keywordId === keyword._id.toString());
      const qs = qualityScore?.qualityScore || 5;

      // Pause low quality keywords
      if (qs < minQualityScore && keyword.status === 'active') {
        changes.push({
          keywordId: keyword._id.toString(),
          status: 'paused',
        });
        keyword.status = 'paused';
        keyword.save().catch((err) => logger.error('Failed to pause keyword', { err }));
      }

      // Resume high quality paused keywords
      if (qs >= 7 && keyword.status === 'paused') {
        changes.push({
          keywordId: keyword._id.toString(),
          status: 'active',
        });
        keyword.status = 'active';
        keyword.save().catch((err) => logger.error('Failed to resume keyword', { err }));
      }
    }

    return changes;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    campaign: any,
    performance: CampaignPerformance,
    qualityScores: any[],
    options: OptimizeRequest
  ): OptimizationResult['optimizations'] {
    const recommendations: OptimizationResult['optimizations'] = [];

    // Check for low quality score keywords
    const lowQualityCount = qualityScores.filter((qs) => qs.qualityScore < 5).length;
    if (lowQualityCount > 0) {
      recommendations.push({
        type: 'quality_score',
        description: `${lowQualityCount} keywords have quality scores below 5. Improve ad relevance or landing pages.`,
        impact: 'high',
      });
    }

    // Check CTR performance
    if (performance.metrics.ctr < 2) {
      recommendations.push({
        type: 'ctr',
        description: 'CTR is below 2%. Consider improving ad copy and testing new headlines.',
        impact: 'medium',
      });
    }

    // Check ROAS performance
    if (performance.metrics.roas < 2) {
      recommendations.push({
        type: 'roas',
        description: 'ROAS is below 2x. Review targeting and consider optimizing for conversions.',
        impact: 'high',
      });
    }

    // Check budget utilization
    const budgetUsed = (campaign.budget.spent / campaign.budget.daily) * 100;
    if (budgetUsed < 50) {
      recommendations.push({
        type: 'budget',
        description: 'Budget utilization is low. Consider expanding targeting or increasing bids.',
        impact: 'medium',
      });
    } else if (budgetUsed > 95) {
      recommendations.push({
        type: 'budget',
        description: 'Budget is nearly exhausted. Increase daily budget to maintain ad presence.',
        impact: 'high',
      });
    }

    // Check for keywords with high competition
    const highCompetitionKeywords = qualityScores.filter(
      (qs) => qs.factors && qs.factors.expectedCtr < 5
    );
    if (highCompetitionKeywords.length > 0) {
      recommendations.push({
        type: 'competition',
        description: 'Some keywords face high competition. Consider adding long-tail variations.',
        impact: 'medium',
      });
    }

    // Add generic recommendations based on strategy
    if (options.strategy === 'aggressive') {
      recommendations.push({
        type: 'strategy',
        description: 'Aggressive optimization applied. Monitor performance closely for the next 7 days.',
        impact: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Calculate estimated impact of optimizations
   */
  private calculateEstimatedImpact(optimizations: OptimizationResult): OptimizationResult['estimatedImpact'] {
    let ctrChange = 0;
    let cpcChange = 0;
    let roasChange = 0;

    // Estimate impact from bid changes
    const bidChanges = optimizations.bidChanges.length;
    if (bidChanges > 0) {
      const avgBidChange = optimizations.bidChanges.reduce(
        (sum, bc) => sum + (bc.newBid - bc.oldBid) / bc.oldBid,
        0
      ) / bidChanges;
      cpcChange = avgBidChange * 100;
      ctrChange = avgBidChange * 20; // Bid increases often improve ad position
      roasChange = avgBidChange * 10;
    }

    // Estimate impact from status changes
    const pausedCount = optimizations.statusChanges.filter((sc) => sc.status === 'paused').length;
    const resumedCount = optimizations.statusChanges.filter((sc) => sc.status === 'active').length;

    if (pausedCount > 0) {
      ctrChange += pausedCount * 0.5;
      cpcChange -= pausedCount * 2;
    }

    if (resumedCount > 0) {
      ctrChange += resumedCount * 0.3;
    }

    return {
      ctrChange: Math.round(ctrChange * 10) / 10,
      cpcChange: Math.round(cpcChange * 10) / 10,
      roasChange: Math.round(roasChange * 10) / 10,
    };
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string, days: number = 30): Promise<CampaignPerformance> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const performance = await SearchPerformance.getTotalMetrics(campaignId);
      const metrics = performance[0] || {
        totalImpressions: 0,
        totalClicks: 0,
        totalSpend: 0,
        totalConversions: 0,
        totalRevenue: 0,
        avgCtr: 0,
        avgCpc: 0,
        avgRoas: 0,
      };

      const ctr = metrics.totalImpressions > 0
        ? (metrics.totalClicks / metrics.totalImpressions) * 100
        : 0;
      const roas = metrics.totalSpend > 0
        ? metrics.totalRevenue / metrics.totalSpend
        : 0;

      // Calculate trend
      const recentPerformance = await SearchPerformance.findByCampaignAndPeriod(
        campaignId,
        new Date(startDate.getTime() - days * 1000),
        startDate
      );

      const previousCtr = recentPerformance.length > 0
        ? recentPerformance.reduce((sum, p) => sum + p.ctr, 0) / recentPerformance.length
        : ctr;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (ctr > previousCtr * 1.1) trend = 'up';
      else if (ctr < previousCtr * 0.9) trend = 'down';

      // Generate recommendations
      const recommendations: string[] = [];
      if (ctr < 2) recommendations.push('Improve ad copy to increase CTR');
      if (roas < 2) recommendations.push('Optimize targeting for better conversions');
      if (metrics.avgCpc > 5) recommendations.push('Consider reducing bids to lower CPC');

      return {
        campaignId,
        period: { start: startDate, end: endDate },
        metrics: {
          impressions: metrics.totalImpressions,
          clicks: metrics.totalClicks,
          ctr,
          cpc: metrics.avgCpc,
          spend: metrics.totalSpend,
          conversions: metrics.totalConversions,
          conversionRate: metrics.totalClicks > 0
            ? (metrics.totalConversions / metrics.totalClicks) * 100
            : 0,
          revenue: metrics.totalRevenue,
          roas,
        },
        trend,
        recommendations,
      };
    } catch (error) {
      logger.error('Failed to get campaign performance', { error, campaignId });
      throw error;
    }
  }

  /**
   * Auto-optimize campaign based on performance
   */
  async autoOptimize(campaignId: string): Promise<OptimizationResult> {
    try {
      // Analyze recent performance
      const performance = await this.getCampaignPerformance(campaignId, 7);

      // Determine optimization strategy
      let strategy: 'aggressive' | 'moderate' | 'conservative' = 'moderate';

      if (performance.metrics.roas > 5) {
        strategy = 'aggressive'; // High performer, scale up
      } else if (performance.metrics.roas < 1) {
        strategy = 'conservative'; // Poor performer, be careful
      }

      // Determine additional constraints
      const options: OptimizeRequest = {
        strategy,
        minQualityScore: 4,
      };

      return await this.optimizeCampaign(campaignId, options);
    } catch (error) {
      logger.error('Failed to auto-optimize campaign', { error, campaignId });
      throw error;
    }
  }
}

export const optimizationService = new OptimizationService();