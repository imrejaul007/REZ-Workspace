/**
 * AI Optimization Service
 * Core business logic for conversion optimization
 */

import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import logger from 'utils/logger.js';
import { Optimization, IOptimizationDocument } from '../models';
import { BidRecommendationModel } from '../models';
import { redisService } from './redis.service';
import {
  OptimizationGoals,
  BidRecommendation,
  Recommendation,
  AudienceSegment,
  TimeSlotPerformance,
  ABTestRecommendation,
  CompetitorInsight,
  CampaignMetrics,
  PlacementData,
} from '../types';
import {
  aiProcessingTime,
  bidRecommendationsTotal,
  recommendationsGenerated,
  recommendationConfidence,
  optimizationScore,
  aiErrors,
} from '../utils/metrics';

export class OptimizationService {
  /**
   * Create a new campaign optimization
   */
  async createOptimization(
    campaignId: string,
    advertiserId: string,
    goals: OptimizationGoals,
    maxBid?: number
  ): Promise<IOptimizationDocument> {
    const optimizationId = `opt-${uuidv4().slice(0, 8)}`;

    const optimization = new Optimization({
      optimizationId,
      campaignId,
      advertiserId,
      status: 'active',
      goals,
      currentPerformance: {
        cpa: 0,
        roas: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      },
      aiActions: {
        bidAdjustments: [],
        audienceChanges: [],
        budgetReallocation: [],
      },
      recommendations: [],
      startedAt: new Date(),
    });

    await optimization.save();
    logger.info('Created optimization', { optimizationId, campaignId, advertiserId });

    // Generate initial recommendations
    await this.generateRecommendations(optimizationId);

    return optimization;
  }

  /**
   * Get optimization by ID
   */
  async getOptimization(optimizationId: string): Promise<IOptimizationDocument | null> {
    // Check cache first
    const cached = await redisService.get<IOptimizationDocument>(`opt:${optimizationId}`);
    if (cached) {
      return cached;
    }

    const optimization = await Optimization.findOne({ optimizationId });
    if (optimization) {
      await redisService.set(
        `opt:${optimizationId}`,
        optimization.toObject(),
        config.CACHE_TTL.CAMPAIGN_METRICS
      );
    }

    return optimization;
  }

  /**
   * Get optimization by campaign ID
   */
  async getOptimizationByCampaign(campaignId: string): Promise<IOptimizationDocument | null> {
    return Optimization.findOne({ campaignId, status: { $in: ['active', 'paused'] } });
  }

  /**
   * Pause optimization
   */
  async pauseOptimization(optimizationId: string): Promise<IOptimizationDocument | null> {
    const optimization = await Optimization.findOneAndUpdate(
      { optimizationId, status: 'active' },
      {
        status: 'paused',
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (optimization) {
      await redisService.del(`opt:${optimizationId}`);
      logger.info('Paused optimization', { optimizationId });
    }

    return optimization;
  }

  /**
   * Resume optimization
   */
  async resumeOptimization(optimizationId: string): Promise<IOptimizationDocument | null> {
    const optimization = await Optimization.findOneAndUpdate(
      { optimizationId, status: 'paused' },
      {
        status: 'active',
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (optimization) {
      await redisService.del(`opt:${optimizationId}`);
      logger.info('Resumed optimization', { optimizationId });
    }

    return optimization;
  }

  /**
   * Generate AI-powered bid recommendation
   */
  async generateBidRecommendation(
    campaignId: string,
    placementId: string,
    currentBid: number,
    targetCPA?: number
  ): Promise<BidRecommendation> {
    const endTimer = aiProcessingTime.startTimer({ operation: 'bid_recommendation' });

    try {
      // Fetch historical data for this placement
      const placementData = await this.analyzePlacement(placementId);
      const campaignMetrics = await this.getCampaignMetrics(campaignId);

      // AI-powered bid calculation
      const { recommendedBid, maxBid, confidence, reasoning } = this.calculateOptimalBid(
        currentBid,
        placementData,
        campaignMetrics,
        targetCPA
      );

      const recommendation: BidRecommendation = {
        placementId,
        recommendedBid,
        maxBid,
        expectedCPC: recommendedBid * 0.85, // Estimated CPC based on historical data
        expectedCTR: placementData.historicalCTR * 1.15, // 15% improvement expected
        expectedConversions: Math.floor(campaignMetrics.conversions * (placementData.audienceOverlap / 100)),
        confidence,
        reasoning,
      };

      // Save recommendation to database
      const recommendationId = `rec-${uuidv4().slice(0, 8)}`;
      await BidRecommendationModel.create({
        recommendationId,
        optimizationId: (await this.getOptimizationByCampaign(campaignId))?.optimizationId || 'unknown',
        campaignId,
        placementId,
        ...recommendation,
        status: 'pending',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      });

      bidRecommendationsTotal.labels(campaignId, placementId).inc();
      recommendationConfidence.observe(confidence);

      logger.info('Generated bid recommendation', { campaignId, placementId, recommendedBid });
      return recommendation;
    } catch (error) {
      aiErrors.labels('bid_recommendation', 'calculation_error').inc();
      throw error;
    } finally {
      endTimer();
    }
  }

  /**
   * Calculate optimal bid using AI logic
   */
  private calculateOptimalBid(
    currentBid: number,
    placement: PlacementData,
    metrics: CampaignMetrics,
    targetCPA?: number
  ): { recommendedBid: number; maxBid: number; confidence: number; reasoning: string } {
    // Base bid adjustment based on placement performance
    let bidMultiplier = 1.0;

    // Adjust for CTR performance
    if (placement.historicalCTR > 0.03) {
      bidMultiplier *= 1.2; // High CTR placement, increase bid
    } else if (placement.historicalCTR < 0.01) {
      bidMultiplier *= 0.85; // Low CTR placement, decrease bid
    }

    // Adjust for competition level
    switch (placement.competition) {
      case 'high':
        bidMultiplier *= 1.15;
        break;
      case 'medium':
        bidMultiplier *= 1.0;
        break;
      case 'low':
        bidMultiplier *= 0.9;
        break;
    }

    // Adjust for audience overlap
    if (placement.audienceOverlap > 70) {
      bidMultiplier *= 1.1; // High overlap, increase bid
    }

    // Calculate recommended bid
    let recommendedBid = currentBid * bidMultiplier;

    // Apply limits based on configuration
    const maxIncrease = config.OPTIMIZATION.MAX_BID_INCREASE_PERCENT / 100;
    const maxDecrease = config.OPTIMIZATION.MAX_BID_DECREASE_PERCENT / 100;

    recommendedBid = Math.min(recommendedBid, currentBid * (1 + maxIncrease));
    recommendedBid = Math.max(recommendedBid, currentBid * (1 - maxDecrease));

    // Apply target CPA constraint if provided
    if (targetCPA && metrics.conversions > 0) {
      const currentCPA = metrics.spend / metrics.conversions;
      if (currentCPA > targetCPA) {
        recommendedBid *= 0.9; // Reduce bid to improve CPA
      }
    }

    // Calculate confidence based on data quality
    const confidence = Math.min(0.95, Math.max(0.5,
      placement.historicalCTR > 0.01 ? 0.7 : 0.5
    ));

    // Generate reasoning
    const reasoningParts: string[] = [];
    if (placement.historicalCTR > 0.02) {
      reasoningParts.push('Strong historical CTR');
    }
    if (placement.audienceOverlap > 60) {
      reasoningParts.push('High audience-target match');
    }
    if (placement.competition === 'high') {
      reasoningParts.push('Competitive market requires higher bid');
    }

    const reasoning = reasoningParts.length > 0
      ? `Recommended bid based on: ${reasoningParts.join(', ')}.`
      : 'Bid adjusted based on historical performance data.';

    return {
      recommendedBid: Math.round(recommendedBid * 100) / 100,
      maxBid: Math.round(recommendedBid * 1.3 * 100) / 100, // 30% max cap
      confidence,
      reasoning,
    };
  }

  /**
   * Analyze placement for bid optimization
   */
  private async analyzePlacement(placementId: string): Promise<PlacementData> {
    // Simulated historical data - in production, this would come from analytics
    const mockData: Record<string, PlacementData> = {
      'placement-1': {
        placementId: 'placement-1',
        name: 'Homepage Banner',
        type: 'banner',
        historicalCTR: 0.025,
        historicalCPC: 1.50,
        audienceOverlap: 75,
        competition: 'medium',
      },
      'placement-2': {
        placementId: 'placement-2',
        name: 'Video Pre-roll',
        type: 'video',
        historicalCTR: 0.015,
        historicalCPC: 2.25,
        audienceOverlap: 60,
        competition: 'high',
      },
      'placement-3': {
        placementId: 'placement-3',
        name: 'Native Feed',
        type: 'native',
        historicalCTR: 0.035,
        historicalCPC: 1.00,
        audienceOverlap: 80,
        competition: 'low',
      },
    };

    return mockData[placementId] || {
      placementId,
      name: 'Unknown Placement',
      type: 'banner',
      historicalCTR: 0.02,
      historicalCPC: 1.50,
      audienceOverlap: 50,
      competition: 'medium' as const,
    };
  }

  /**
   * Get campaign metrics
   */
  private async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    // In production, this would fetch from the ads service
    return {
      impressions: 100000,
      clicks: 2500,
      conversions: 125,
      spend: 3750,
      revenue: 15000,
      ctr: 0.025,
      cpc: 1.50,
      cpa: 30,
      roas: 4.0,
    };
  }

  /**
   * Generate recommendations for optimization
   */
  async generateRecommendations(optimizationId: string): Promise<Recommendation[]> {
    const endTimer = aiProcessingTime.startTimer({ operation: 'generate_recommendations' });

    try {
      const optimization = await Optimization.findOne({ optimizationId });
      if (!optimization) {
        throw new Error('Optimization not found');
      }

      const recommendations: Recommendation[] = [];
      const metrics = await this.getCampaignMetrics(optimization.campaignId);

      // CPA-based recommendations
      if (optimization.goals.targetCPA && metrics.cpa > optimization.goals.targetCPA) {
        const gap = ((metrics.cpa - optimization.goals.targetCPA) / optimization.goals.targetCPA) * 100;
        recommendations.push({
          priority: gap > 50 ? 'high' : gap > 25 ? 'medium' : 'low',
          action: `Reduce bids by ${Math.min(30, Math.ceil(gap / 2))}% to meet target CPA of ₹${optimization.goals.targetCPA}`,
          expectedImpact: Math.ceil(gap / 2),
          reason: `Current CPA (₹${metrics.cpa}) exceeds target (₹${optimization.goals.targetCPA}) by ${gap.toFixed(1)}%`,
        });
      }

      // ROAS-based recommendations
      if (optimization.goals.targetROAS && metrics.roas < optimization.goals.targetROAS) {
        recommendations.push({
          priority: 'high',
          action: 'Optimize audience targeting to improve conversion quality',
          expectedImpact: 15,
          reason: `Current ROAS (${metrics.roas}) below target (${optimization.goals.targetROAS})`,
        });
      }

      // CTR optimization recommendations
      if (metrics.ctr < 0.015) {
        recommendations.push({
          priority: 'medium',
          action: 'Test new creative variations to improve CTR',
          expectedImpact: 20,
          reason: 'CTR below industry average (1.5%), creative optimization needed',
        });
      }

      // Budget allocation recommendations
      if (recommendations.length === 0) {
        recommendations.push({
          priority: 'low',
          action: 'Consider expanding to new audience segments',
          expectedImpact: 10,
          reason: 'All metrics are meeting targets, opportunity to scale',
        });
      }

      // Save recommendations
      await Optimization.findOneAndUpdate(
        { optimizationId },
        {
          recommendations,
          updatedAt: new Date(),
          nextOptimizationAt: new Date(Date.now() + config.OPTIMIZATION.OPTIMIZATION_INTERVAL_MS),
        }
      );

      // Update metrics
      recommendations.forEach((rec) => {
        recommendationsGenerated.labels(rec.priority, 'general').inc();
      });

      // Update optimization score
      const overallScore = this.calculateOptimizationScore(metrics, optimization.goals);
      optimizationScore.labels(optimization.campaignId).set(overallScore);

      await redisService.del(`opt:${optimizationId}`);

      logger.info('Generated recommendations', { optimizationId, count: recommendations.length });
      return recommendations;
    } catch (error) {
      aiErrors.labels('generate_recommendations', 'generation_error').inc();
      throw error;
    } finally {
      endTimer();
    }
  }

  /**
   * Calculate overall optimization score (0-100)
   */
  private calculateOptimizationScore(metrics: CampaignMetrics, goals: OptimizationGoals): number {
    let score = 50; // Base score

    // CPA contribution (25 points max)
    if (goals.targetCPA && metrics.cpa > 0) {
      const cpaRatio = goals.targetCPA / metrics.cpa;
      score += Math.min(25, Math.max(-25, (cpaRatio - 1) * 25));
    }

    // ROAS contribution (25 points max)
    if (goals.targetROAS && metrics.roas > 0) {
      const roasRatio = metrics.roas / goals.targetROAS;
      score += Math.min(25, Math.max(-25, (roasRatio - 1) * 25));
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get optimization insights
   */
  async getInsights(optimizationId: string): Promise<{
    insights: {
      topPerformers: string[];
      underperformers: string[];
      predictedWinners: string[];
      riskFactors: string[];
      opportunities: string[];
    };
    overallScore: number;
  }> {
    const optimization = await this.getOptimization(optimizationId);
    if (!optimization) {
      throw new Error('Optimization not found');
    }

    const metrics = await this.getCampaignMetrics(optimization.campaignId);

    // Analyze performance patterns
    const topPerformers: string[] = [];
    const underperformers: string[] = [];
    const predictedWinners: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    // Analyze based on current metrics
    if (metrics.ctr > 0.025) {
      topPerformers.push('High CTR placement strategy');
      predictedWinners.push('Current creative variant');
    } else if (metrics.ctr < 0.01) {
      underperformers.push('Low CTR - creative refresh needed');
      riskFactors.push('Below-average engagement rate');
    }

    if (metrics.roas > 4.0) {
      topPerformers.push('Strong ROAS performance');
      predictedWinners.push('Current audience targeting');
    }

    if (metrics.cpa > 30) {
      underperformers.push('High CPA reducing profitability');
      riskFactors.push('Cost efficiency below target');
    }

    // Generate opportunities
    if (metrics.ctr > 0.02) {
      opportunities.push('Scale high-performing placements');
    }
    if (metrics.roas > 3.0) {
      opportunities.push('Test larger budget allocation');
    }

    const overallScore = this.calculateOptimizationScore(metrics, optimization.goals);

    return {
      insights: {
        topPerformers,
        underperformers,
        predictedWinners,
        riskFactors,
        opportunities,
      },
      overallScore,
    };
  }

  /**
   * Get all recommendations for an advertiser
   */
  async getAllRecommendations(advertiserId: string): Promise<{
    high: Recommendation[];
    medium: Recommendation[];
    low: Recommendation[];
  }> {
    const optimizations = await Optimization.find({
      advertiserId,
      status: 'active',
    });

    const result = {
      high: [] as Recommendation[],
      medium: [] as Recommendation[],
      low: [] as Recommendation[],
    };

    for (const opt of optimizations) {
      for (const rec of opt.recommendations) {
        result[rec.priority].push(rec);
      }
    }

    return result;
  }

  /**
   * Update campaign performance metrics
   */
  async updatePerformanceMetrics(
    optimizationId: string,
    metrics: Partial<{ cpa: number; roas: number; conversions: number; spend: number; revenue: number }>
  ): Promise<void> {
    await Optimization.findOneAndUpdate(
      { optimizationId },
      {
        currentPerformance: metrics,
        lastOptimizedAt: new Date(),
        updatedAt: new Date(),
      }
    );

    await redisService.del(`opt:${optimizationId}`);
  }

  /**
   * Record AI action
   */
  async recordBidAdjustment(
    optimizationId: string,
    change: number,
    reason: string
  ): Promise<void> {
    await Optimization.findOneAndUpdate(
      { optimizationId },
      {
        $push: {
          'aiActions.bidAdjustments': {
            time: new Date(),
            change,
            reason,
          },
        },
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Get audience analysis
   */
  async analyzeAudience(campaignId: string): Promise<AudienceSegment[]> {
    // Simulated audience analysis - in production, this would use ML models
    return [
      {
        segmentId: 'seg-1',
        name: 'High-Value Shoppers',
        size: 50000,
        conversionRate: 0.08,
        avgOrderValue: 2500,
        lifetimeValue: 15000,
        performance: 'excellent' as const,
      },
      {
        segmentId: 'seg-2',
        name: 'Deal Seekers',
        size: 120000,
        conversionRate: 0.04,
        avgOrderValue: 800,
        lifetimeValue: 3200,
        performance: 'good' as const,
      },
      {
        segmentId: 'seg-3',
        name: 'Browsers',
        size: 200000,
        conversionRate: 0.01,
        avgOrderValue: 400,
        lifetimeValue: 800,
        performance: 'poor' as const,
      },
    ];
  }

  /**
   * Get time-of-day optimization data
   */
  async getTimeSlotAnalysis(campaignId: string): Promise<TimeSlotPerformance[]> {
    // Simulated time-of-day analysis
    const slots: TimeSlotPerformance[] = [];

    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher performance during peak hours
      let basePerformance = 0.02;
      if (hour >= 9 && hour <= 11) basePerformance = 0.035;
      if (hour >= 19 && hour <= 22) basePerformance = 0.03;
      if (hour >= 0 && hour <= 6) basePerformance = 0.01;

      slots.push({
        hour,
        dayOfWeek: 1, // Monday
        avgCTR: basePerformance,
        avgCPC: 2.0 - (basePerformance - 0.02) * 20,
        conversionRate: basePerformance * 0.4,
        confidence: 0.8,
      });
    }

    return slots;
  }

  /**
   * Generate A/B test recommendations
   */
  async generateABTestRecommendations(campaignId: string): Promise<ABTestRecommendation[]> {
    return [
      {
        testId: `test-${uuidv4().slice(0, 8)}`,
        hypothesis: 'Different headline styles will improve CTR',
        variantA: { headline: 'Clear benefit statement' },
        variantB: { headline: 'Question-based headline' },
        expectedLift: 15,
        sampleSize: 10000,
        duration: 7,
        status: 'pending',
      },
    ];
  }

  /**
   * Get competitor insights
   */
  async getCompetitorInsights(campaignId: string): Promise<CompetitorInsight[]> {
    return [
      {
        competitorId: 'competitor-1',
        avgBid: 1.75,
        winRate: 0.45,
        strategy: 'Broad targeting with high volume',
        weakness: 'Lower quality scores',
      },
    ];
  }

  /**
   * List active optimizations
   */
  async listOptimizations(
    advertiserId: string,
    options: { status?: string; page?: number; limit?: number } = {}
  ): Promise<{ data: IOptimizationDocument[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = { advertiserId };
    if (status) {
      query.status = status;
    }

    const [data, total] = await Promise.all([
      Optimization.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Optimization.countDocuments(query),
    ]);

    return { data, total };
  }
}

export const optimizationService = new OptimizationService();
export default optimizationService;