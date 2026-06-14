import { FloorRecommendation, FloorPrice, IFloorRecommendation } from '../models';
import { createLogger } from 'utils/logger.js';
import { floorPricingMetrics } from '../utils/metrics';
import { config } from '../config';
import axios from 'axios';

const logger = createLogger('RecommendationService');

interface RecommendationQuery {
  inventoryIds?: string[];
  status?: string;
  minConfidence?: number;
  limit?: number;
}

interface GeneratedRecommendation {
  inventoryId: string;
  floorId?: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  direction: 'increase' | 'decrease' | 'maintain';
  algorithm: string;
  factors: Array<{
    name: string;
    impact: number;
    weight: number;
    description: string;
  }>;
  projectedImpact: {
    revenueChange: number;
    ecpmChange: number;
    demandImpact: number;
  };
}

export class RecommendationService {
  /**
   * Get recommendations for specific inventories
   */
  async getRecommendations(query: RecommendationQuery): Promise<IFloorRecommendation[]> {
    const { inventoryIds, status = 'pending', minConfidence = 0, limit = 50 } = query;

    const filter: Record<string, unknown> = {};
    if (inventoryIds && inventoryIds.length > 0) {
      filter.inventoryId = { $in: inventoryIds };
    }
    if (status) filter.status = status;
    if (minConfidence > 0) filter.confidence = { $gte: minConfidence };

    const recommendations = await FloorRecommendation.find(filter)
      .sort({ confidence: -1, createdAt: -1 })
      .limit(limit);

    logger.debug('Retrieved recommendations', { count: recommendations.length });
    return recommendations;
  }

  /**
   * Generate recommendations for all active floors
   */
  async generateRecommendations(floorIds?: string[]): Promise<GeneratedRecommendation[]> {
    logger.info('Generating recommendations', { floorCount: floorIds?.length || 'all' });

    // Get floors to analyze
    const filter = floorIds ? { _id: { $in: floorIds } } : { status: 'active' };
    const floors = await FloorPrice.find(filter);

    const recommendations: GeneratedRecommendation[] = [];

    for (const floor of floors) {
      try {
        const recommendation = await this.analyzeFloor(floor);
        recommendations.push(recommendation);

        // Store recommendation in database
        await this.storeRecommendation(recommendation);

      } catch (error) {
        logger.error('Failed to generate recommendation for floor', {
          floorId: floor._id,
          inventoryId: floor.inventoryId,
          error
        });
      }
    }

    logger.info('Generated recommendations', { count: recommendations.length });
    return recommendations;
  }

  /**
   * Analyze a single floor and generate recommendation
   */
  private async analyzeFloor(floor: any): Promise<GeneratedRecommendation> {
    // Get historical data for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get last 30 days of history
    const history = await this.getFloorHistory(floor._id.toString(), thirtyDaysAgo);

    // Analyze patterns
    const analysis = this.analyzePatterns(history, floor);

    // Try HOJAI AI for advanced recommendation
    if (config.hojai.apiKey) {
      try {
        const aiRecommendation = await this.getAIRecommendation(floor, analysis);
        if (aiRecommendation) {
          return aiRecommendation;
        }
      } catch (error) {
        logger.warn('AI recommendation failed, using rule-based', { error });
      }
    }

    // Fall back to rule-based recommendation
    return this.ruleBasedRecommendation(floor, analysis);
  }

  /**
   * Get floor history
   */
  private async getFloorHistory(floorId: string, since: Date): Promise<any[]> {
    // Import dynamically to avoid circular dependency
    const { FloorHistory } = await import('../models');
    return FloorHistory.find({
      floorId,
      timestamp: { $gte: since }
    }).sort({ timestamp: -1 }).limit(30).lean();
  }

  /**
   * Analyze historical patterns
   */
  private analyzePatterns(history: any[], floor: any): {
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    avgPrice: number;
    avgEcpm: number;
    winRate: number;
    demandScore: number;
  } {
    const prices = history.map(h => h.newPrice);
    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : floor.price;

    // Calculate volatility (standard deviation)
    const variance = prices.length > 1
      ? prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
      : 0;
    const volatility = Math.sqrt(variance) / avgPrice;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (prices.length >= 7) {
      const recentPrices = prices.slice(0, 7);
      const olderPrices = prices.slice(7, 14);
      if (olderPrices.length > 0) {
        const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
        const change = (recentAvg - olderAvg) / olderAvg;
        if (change > 0.05) trend = 'increasing';
        else if (change < -0.05) trend = 'decreasing';
      }
    }

    // Get performance metrics
    const avgEcpm = history.length > 0
      ? history.reduce((sum, h) => sum + (h.factors?.ecpm || 0), 0) / history.length
      : 0;
    const winRate = 0.5; // Would come from performance data
    const demandScore = 0.6; // Would come from demand signals

    return {
      trend,
      volatility,
      avgPrice,
      avgEcpm,
      winRate,
      demandScore
    };
  }

  /**
   * Get AI-powered recommendation from HOJAI
   */
  private async getAIRecommendation(
    floor: any,
    analysis: ReturnType<typeof this.analyzePatterns>
  ): Promise<GeneratedRecommendation | null> {
    const prompt = `
Analyze this advertising inventory floor price and recommend optimal pricing:

Inventory: ${floor.inventoryId}
Current Price: ${floor.price} ${floor.currency}
Type: ${floor.type}
Status: ${floor.status}

Historical Analysis:
- Trend: ${analysis.trend}
- Volatility: ${(analysis.volatility * 100).toFixed(2)}%
- Average Price: ${analysis.avgPrice.toFixed(2)}
- Average eCPM: ${analysis.avgEcpm.toFixed(2)}
- Win Rate: ${(analysis.winRate * 100).toFixed(1)}%
- Demand Score: ${(analysis.demandScore * 100).toFixed(1)}%

Constraints:
- Min Price: ${floor.constraints?.minPrice || 'None'}
- Max Price: ${floor.constraints?.maxPrice || 'None'}

Return JSON with:
- suggestedPrice: number
- confidence: number (0-1)
- direction: "increase" | "decrease" | "maintain"
- factors: array of { name, impact, weight, description }
- projectedImpact: { revenueChange, ecpmChange, demandImpact }
`;

    try {
      const response = await axios.post(
        `${config.hojai.apiUrl}/api/reason`,
        { prompt, context: 'floor_pricing_recommendation' },
        {
          headers: {
            'Authorization': `Bearer ${config.hojai.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiResult = response.data;

      return {
        inventoryId: floor.inventoryId,
        floorId: floor._id.toString(),
        currentPrice: floor.price,
        suggestedPrice: aiResult.suggestedPrice || floor.price,
        confidence: aiResult.confidence || 0.5,
        direction: this.determineDirection(floor.price, aiResult.suggestedPrice),
        algorithm: 'hojai_ai',
        factors: aiResult.factors || [],
        projectedImpact: aiResult.projectedImpact || { revenueChange: 0, ecpmChange: 0, demandImpact: 0 }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rule-based recommendation
   */
  private ruleBasedRecommendation(
    floor: any,
    analysis: ReturnType<typeof this.analyzePatterns>
  ): GeneratedRecommendation {
    const factors: Array<{ name: string; impact: number; weight: number; description: string }> = [];
    let suggestedPrice = floor.price;
    let totalConfidence = 0.5;

    // Factor 1: Trend-based adjustment
    if (analysis.trend === 'increasing') {
      suggestedPrice *= 1.03;
      factors.push({
        name: 'Price Trend',
        impact: 3,
        weight: 0.2,
        description: 'Prices trending upward, moderate increase recommended'
      });
      totalConfidence += 0.1;
    } else if (analysis.trend === 'decreasing') {
      suggestedPrice *= 0.97;
      factors.push({
        name: 'Price Trend',
        impact: -3,
        weight: 0.2,
        description: 'Prices trending downward, adjustment needed'
      });
      totalConfidence += 0.1;
    }

    // Factor 2: Volatility adjustment
    if (analysis.volatility > 0.2) {
      // High volatility - consider stabilizing
      factors.push({
        name: 'High Volatility',
        impact: 0,
        weight: 0.15,
        description: `Volatility at ${(analysis.volatility * 100).toFixed(1)}%, recommending stable pricing`
      });
      totalConfidence += 0.1;
    }

    // Factor 3: Win rate optimization
    if (analysis.winRate < 0.3) {
      // Low win rate - recommend lower price
      suggestedPrice *= 0.9;
      factors.push({
        name: 'Low Win Rate',
        impact: -10,
        weight: 0.25,
        description: `Win rate ${(analysis.winRate * 100).toFixed(1)}% below target, reducing price`
      });
      totalConfidence += 0.15;
    } else if (analysis.winRate > 0.7) {
      // High win rate - room to increase
      suggestedPrice *= 1.05;
      factors.push({
        name: 'High Win Rate',
        impact: 5,
        weight: 0.2,
        description: `Win rate ${(analysis.winRate * 100).toFixed(1)}% above target, slight increase`
      });
      totalConfidence += 0.1;
    }

    // Factor 4: eCPM efficiency
    if (analysis.avgEcpm > floor.price * 1.2) {
      suggestedPrice *= 1.08;
      factors.push({
        name: 'eCPM Efficiency',
        impact: 8,
        weight: 0.2,
        description: 'Actual eCPM significantly above floor, price increase justified'
      });
      totalConfidence += 0.1;
    }

    // Apply constraints
    if (floor.constraints?.minPrice && suggestedPrice < floor.constraints.minPrice) {
      suggestedPrice = floor.constraints.minPrice;
    }
    if (floor.constraints?.maxPrice && suggestedPrice > floor.constraints.maxPrice) {
      suggestedPrice = floor.constraints.maxPrice;
    }

    // Round to 2 decimal places
    suggestedPrice = Math.round(suggestedPrice * 100) / 100;

    // Calculate projected impact
    const revenueChange = ((suggestedPrice - floor.price) / floor.price) * 100;

    return {
      inventoryId: floor.inventoryId,
      floorId: floor._id.toString(),
      currentPrice: floor.price,
      suggestedPrice,
      confidence: Math.min(totalConfidence, 0.95),
      direction: this.determineDirection(floor.price, suggestedPrice),
      algorithm: 'rule_based',
      factors,
      projectedImpact: {
        revenueChange: Math.round(revenueChange * 100) / 100,
        ecpmChange: Math.round(revenueChange * 100) / 100,
        demandImpact: analysis.winRate > 0.5 ? -0.05 : 0.05
      }
    };
  }

  /**
   * Determine price direction
   */
  private determineDirection(current: number, suggested: number): 'increase' | 'decrease' | 'maintain' {
    const change = (suggested - current) / current;
    if (change > 0.02) return 'increase';
    if (change < -0.02) return 'decrease';
    return 'maintain';
  }

  /**
   * Store recommendation in database
   */
  private async storeRecommendation(recommendation: GeneratedRecommendation): Promise<IFloorRecommendation> {
    // Check for existing pending recommendation
    const existing = await FloorRecommendation.findOne({
      inventoryId: recommendation.inventoryId,
      status: 'pending'
    });

    if (existing) {
      // Update existing
      existing.suggestedPrice = recommendation.suggestedPrice;
      existing.confidence = recommendation.confidence;
      existing.direction = recommendation.direction;
      existing.factors = recommendation.factors;
      existing.projectedImpact = recommendation.projectedImpact;
      existing.validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await existing.save();
      return existing;
    }

    // Create new recommendation
    const newRecommendation = new FloorRecommendation({
      inventoryId: recommendation.inventoryId,
      floorId: recommendation.floorId,
      currentPrice: recommendation.currentPrice,
      suggestedPrice: recommendation.suggestedPrice,
      confidence: recommendation.confidence,
      direction: recommendation.direction,
      algorithm: recommendation.algorithm,
      factors: recommendation.factors,
      projectedImpact: recommendation.projectedImpact,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: {
        modelVersion: '1.0.0'
      },
      status: 'pending'
    });

    await newRecommendation.save();

    // Update metrics
    floorPricingMetrics.optimizationRecommendationsTotal.inc({
      confidence_level: recommendation.confidence >= 0.8 ? 'high' : recommendation.confidence >= 0.5 ? 'medium' : 'low'
    });

    return newRecommendation;
  }

  /**
   * Apply a recommendation
   */
  async applyRecommendation(recommendationId: string): Promise<IFloorRecommendation | null> {
    const recommendation = await FloorRecommendation.findById(recommendationId);

    if (!recommendation) {
      logger.warn('Recommendation not found', { recommendationId });
      return null;
    }

    if (recommendation.status !== 'pending') {
      logger.warn('Recommendation already processed', {
        recommendationId,
        status: recommendation.status
      });
      return recommendation;
    }

    // Get floor and update
    const floor = await FloorPrice.findById(recommendation.floorId);
    if (!floor) {
      logger.warn('Floor not found for recommendation', { recommendationId });
      return null;
    }

    // Update floor price
    const previousPrice = floor.price;
    floor.price = recommendation.suggestedPrice;
    floor.type = 'ai_optimized';
    floor.metadata.updatedBy = 'ai_recommendation';
    await floor.save();

    // Update recommendation
    recommendation.status = 'applied';
    recommendation.appliedAt = new Date();
    await recommendation.save();

    // Record history
    const { FloorHistory } = await import('../models');
    const history = new FloorHistory({
      floorId: floor._id.toString(),
      inventoryId: floor.inventoryId,
      previousPrice,
      newPrice: recommendation.suggestedPrice,
      priceChange: recommendation.suggestedPrice - previousPrice,
      priceChangePercent: ((recommendation.suggestedPrice - previousPrice) / previousPrice) * 100,
      timestamp: new Date(),
      reason: `Applied AI recommendation: ${recommendation.algorithm}`,
      reasonCode: 'AI_RECOMMENDATION',
      triggeredBy: 'ai_optimization',
      factors: {
        ecpm: recommendation.projectedImpact.ecpmChange,
        demandScore: recommendation.projectedImpact.demandImpact
      },
      metadata: {
        algorithm: recommendation.algorithm,
        confidence: recommendation.confidence
      }
    });
    await history.save();

    // Update metrics
    floorPricingMetrics.currentFloorPrices.set(
      { inventory_id: floor.inventoryId, type: floor.type },
      recommendation.suggestedPrice
    );

    logger.info('Applied recommendation', {
      recommendationId,
      floorId: floor._id,
      priceChange: `${previousPrice} -> ${recommendation.suggestedPrice}`
    });

    return recommendation;
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(
    recommendationId: string,
    reason: string
  ): Promise<IFloorRecommendation | null> {
    const recommendation = await FloorRecommendation.findById(recommendationId);

    if (!recommendation) {
      return null;
    }

    recommendation.status = 'dismissed';
    recommendation.dismissedAt = new Date();
    recommendation.dismissedReason = reason;
    await recommendation.save();

    logger.info('Dismissed recommendation', { recommendationId, reason });
    return recommendation;
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(days: number = 30): Promise<{
    total: number;
    pending: number;
    applied: number;
    dismissed: number;
    avgConfidence: number;
    avgPriceChange: number;
    byDirection: Record<string, number>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const recommendations = await FloorRecommendation.find({
      createdAt: { $gte: since }
    });

    const stats = {
      total: recommendations.length,
      pending: 0,
      applied: 0,
      dismissed: 0,
      avgConfidence: 0,
      avgPriceChange: 0,
      byDirection: {
        increase: 0,
        decrease: 0,
        maintain: 0
      } as Record<string, number>
    };

    if (recommendations.length === 0) {
      return stats;
    }

    let totalConfidence = 0;
    let totalPriceChange = 0;

    for (const rec of recommendations) {
      if (rec.status === 'pending') stats.pending++;
      else if (rec.status === 'applied') stats.applied++;
      else if (rec.status === 'dismissed') stats.dismissed++;

      totalConfidence += rec.confidence;
      totalPriceChange += Math.abs((rec.suggestedPrice - rec.currentPrice) / rec.currentPrice);

      stats.byDirection[rec.direction] = (stats.byDirection[rec.direction] || 0) + 1;
    }

    stats.avgConfidence = totalConfidence / recommendations.length;
    stats.avgPriceChange = (totalPriceChange / recommendations.length) * 100;

    return stats;
  }
}

export const recommendationService = new RecommendationService();