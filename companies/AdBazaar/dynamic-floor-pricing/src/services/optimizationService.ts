import { FloorPrice, FloorHistory, FloorPerformance, FloorRecommendation } from '../models';
import { createLogger } from 'utils/logger.js';
import { floorPricingMetrics } from '../utils/metrics';
import axios from 'axios';
import { config } from '../config';

const logger = createLogger('OptimizationService');

interface OptimizationContext {
  floorId: string;
  inventoryId: string;
  currentPrice: number;
  performance: {
    impressions: number;
    revenue: number;
    ecpm: number;
    winRate: number;
    fillRate: number;
  };
  marketData: {
    competitorPrices: number[];
    marketRate: number;
    demandScore: number;
  };
  historicalData: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

interface OptimizationResult {
  suggestedPrice: number;
  confidence: number;
  factors: Array<{ name: string; impact: number; weight: number; description: string }>;
  projectedImpact: {
    revenueChange: number;
    ecpmChange: number;
    demandImpact: number;
  };
  reason: string;
}

export class OptimizationService {
  private hojaiApiUrl: string;
  private hojaiApiKey: string;

  constructor() {
    this.hojaiApiUrl = config.hojai.apiUrl;
    this.hojaiApiKey = config.hojai.apiKey;
  }

  /**
   * Optimize floor price for a specific inventory
   */
  async optimizeFloor(floorId: string, force: boolean = false): Promise<OptimizationResult> {
    logger.info('Optimizing floor price', { floorId, force });

    const startTime = Date.now();

    try {
      // Get floor data
      const floor = await FloorPrice.findById(floorId);
      if (!floor) {
        throw new Error('Floor not found');
      }

      // Get optimization context
      const context = await this.buildOptimizationContext(floor);

      // Calculate optimal price
      const result = await this.calculateOptimalPrice(context, floor);

      // If confidence is high enough, apply the change
      if (result.confidence >= 0.7 || force) {
        await this.applyOptimization(floor, result, context);
      }

      // Record optimization metrics
      const duration = (Date.now() - startTime) / 1000;
      floorPricingMetrics.optimizationDuration.observe({ inventory_type: floor.type }, duration);

      logger.info('Floor optimization completed', {
        floorId,
        suggestedPrice: result.suggestedPrice,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'optimize', status: 'error' });
      logger.error('Floor optimization failed', { error, floorId });
      throw error;
    }
  }

  /**
   * Batch optimize multiple floors
   */
  async batchOptimize(floorIds: string[], force: boolean = false): Promise<{
    success: string[];
    failed: Array<{ floorId: string; error: string }>;
    results: Array<OptimizationResult & { floorId: string }>;
  }> {
    logger.info('Batch optimizing floors', { count: floorIds.length });

    const results: Array<OptimizationResult & { floorId: string }> = [];
    const success: string[] = [];
    const failed: Array<{ floorId: string; error: string }> = [];

    for (const floorId of floorIds) {
      try {
        const result = await this.optimizeFloor(floorId, force);
        results.push({ ...result, floorId });
        success.push(floorId);
      } catch (error) {
        failed.push({
          floorId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Batch optimization completed', { success: success.length, failed: failed.length });
    return { success, failed, results };
  }

  /**
   * Build optimization context from various data sources
   */
  private async buildOptimizationContext(floor: any): Promise<OptimizationContext> {
    // Get performance data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const performance = await FloorPerformance.findOne({
      floorId: floor._id.toString(),
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });

    // Get historical prices for trend analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyPrices = await FloorHistory.find({
      floorId: floor._id.toString(),
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    // Calculate historical statistics
    const prices = historyPrices.map(h => h.newPrice);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : floor.price;
    const minPrice = prices.length > 0 ? Math.min(...prices) : floor.price;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : floor.price;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (prices.length >= 7) {
      const recentPrices = prices.slice(-7);
      const olderPrices = prices.slice(-14, -7);
      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.length > 0 ? olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length : recentAvg;
      const change = (recentAvg - olderAvg) / olderAvg;
      if (change > 0.05) trend = 'increasing';
      else if (change < -0.05) trend = 'decreasing';
    }

    // Get market data (would integrate with market data service in production)
    const marketData = await this.fetchMarketData(floor.inventoryId);

    return {
      floorId: floor._id.toString(),
      inventoryId: floor.inventoryId,
      currentPrice: floor.price,
      performance: performance?.metrics || {
        impressions: 0,
        revenue: 0,
        ecpm: 0,
        winRate: 0,
        fillRate: 0
      },
      marketData,
      historicalData: {
        avgPrice,
        minPrice,
        maxPrice,
        trend
      }
    };
  }

  /**
   * Fetch market data for inventory
   */
  private async fetchMarketData(inventoryId: string): Promise<{
    competitorPrices: number[];
    marketRate: number;
    demandScore: number;
  }> {
    // In production, this would call market data services
    // For now, return simulated data
    return {
      competitorPrices: [], // Would fetch from competitor intelligence
      marketRate: 0, // Would fetch from market data service
      demandScore: 0.5 // Would calculate from demand signals
    };
  }

  /**
   * Calculate optimal price using AI or rule-based logic
   */
  private async calculateOptimalPrice(
    context: OptimizationContext,
    floor: any
  ): Promise<OptimizationResult> {
    // Try to use HOJAI AI for optimization
    if (this.hojaiApiKey) {
      try {
        return await this.aiOptimizePrice(context, floor);
      } catch (error) {
        logger.warn('HOJAI AI optimization failed, falling back to rule-based', { error });
      }
    }

    // Fall back to rule-based optimization
    return this.ruleBasedOptimization(context, floor);
  }

  /**
   * AI-powered price optimization using HOJAI
   */
  private async aiOptimizePrice(
    context: OptimizationContext,
    floor: any
  ): Promise<OptimizationResult> {
    const prompt = `
Analyze the following floor pricing context and determine the optimal price:

Inventory: ${context.inventoryId}
Current Floor Price: ${context.currentPrice}
Performance Metrics:
- Impressions: ${context.performance.impressions}
- Revenue: ${context.performance.revenue}
- eCPM: ${context.performance.ecpm}
- Win Rate: ${context.performance.winRate}
- Fill Rate: ${context.performance.fillRate}

Historical Data:
- Average Price: ${context.historicalData.avgPrice}
- Min Price: ${context.historicalData.minPrice}
- Max Price: ${context.historicalData.maxPrice}
- Trend: ${context.historicalData.trend}

Market Data:
- Competitor Prices: ${context.marketData.competitorPrices.join(', ') || 'N/A'}
- Market Rate: ${context.marketData.marketRate}
- Demand Score: ${context.marketData.demandScore}

Constraints:
- Min Price: ${floor.constraints?.minPrice || 'None'}
- Max Price: ${floor.constraints?.maxPrice || 'None'}
- Max Daily Change: ${floor.constraints?.maxDailyChange || 'None'}%

Return a JSON with:
- suggestedPrice: number
- confidence: number (0-1)
- factors: array of { name, impact, weight, description }
- projectedImpact: { revenueChange, ecpmChange, demandImpact }
- reason: string explaining the recommendation
`;

    try {
      const response = await axios.post(
        `${this.hojaiApiUrl}/api/reason`,
        {
          prompt,
          context: 'floor_pricing_optimization'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.hojaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiResult = response.data;

      return {
        suggestedPrice: aiResult.suggestedPrice || context.currentPrice,
        confidence: aiResult.confidence || 0.5,
        factors: aiResult.factors || [],
        projectedImpact: aiResult.projectedImpact || { revenueChange: 0, ecpmChange: 0, demandImpact: 0 },
        reason: aiResult.reason || 'AI optimization'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rule-based price optimization
   */
  private ruleBasedOptimization(
    context: OptimizationContext,
    floor: any
  ): OptimizationResult {
    const factors: Array<{ name: string; impact: number; weight: number; description: string }> = [];
    let suggestedPrice = context.currentPrice;
    let totalWeight = 0;

    // Factor 1: Win rate analysis
    if (context.performance.winRate < 0.3) {
      // Low win rate - consider lowering price
      const adjustment = Math.max(0.05, (0.3 - context.performance.winRate));
      suggestedPrice = suggestedPrice * (1 - adjustment);
      factors.push({
        name: 'Low Win Rate',
        impact: -adjustment * 100,
        weight: 0.3,
        description: `Win rate ${(context.performance.winRate * 100).toFixed(1)}% is below target, reducing price by ${(adjustment * 100).toFixed(1)}%`
      });
      totalWeight += 0.3;
    } else if (context.performance.winRate > 0.8) {
      // High win rate - consider raising price
      const adjustment = Math.min(0.1, (context.performance.winRate - 0.8));
      suggestedPrice = suggestedPrice * (1 + adjustment);
      factors.push({
        name: 'High Win Rate',
        impact: adjustment * 100,
        weight: 0.2,
        description: `Win rate ${(context.performance.winRate * 100).toFixed(1)}% is above target, increasing price by ${(adjustment * 100).toFixed(1)}%`
      });
      totalWeight += 0.2;
    }

    // Factor 2: Revenue vs Floor comparison
    const revenuePerImpression = context.performance.impressions > 0
      ? context.performance.revenue / context.performance.impressions
      : 0;
    const floorEfficiency = revenuePerImpression / (context.currentPrice / 1000);

    if (floorEfficiency < 0.8) {
      factors.push({
        name: 'Low Floor Efficiency',
        impact: -5,
        weight: 0.25,
        description: `Floor efficiency ${(floorEfficiency * 100).toFixed(1)}% indicates price may be too high`
      });
      totalWeight += 0.25;
    } else if (floorEfficiency > 1.2) {
      factors.push({
        name: 'High Floor Efficiency',
        impact: 5,
        weight: 0.25,
        description: `Floor efficiency ${(floorEfficiency * 100).toFixed(1)}% suggests room to increase price`
      });
      totalWeight += 0.25;
    }

    // Factor 3: Trend analysis
    if (context.historicalData.trend === 'increasing') {
      suggestedPrice = suggestedPrice * 1.02;
      factors.push({
        name: 'Price Trend',
        impact: 2,
        weight: 0.15,
        description: 'Historical prices trending upward'
      });
      totalWeight += 0.15;
    } else if (context.historicalData.trend === 'decreasing') {
      suggestedPrice = suggestedPrice * 0.98;
      factors.push({
        name: 'Price Trend',
        impact: -2,
        weight: 0.15,
        description: 'Historical prices trending downward'
      });
      totalWeight += 0.15;
    }

    // Apply constraints
    if (floor.constraints?.minPrice && suggestedPrice < floor.constraints.minPrice) {
      suggestedPrice = floor.constraints.minPrice;
      factors.push({
        name: 'Min Price Constraint',
        impact: 0,
        weight: 0,
        description: `Adjusted to minimum price constraint of ${floor.constraints.minPrice}`
      });
    }

    if (floor.constraints?.maxPrice && suggestedPrice > floor.constraints.maxPrice) {
      suggestedPrice = floor.constraints.maxPrice;
      factors.push({
        name: 'Max Price Constraint',
        impact: 0,
        weight: 0,
        description: `Adjusted to maximum price constraint of ${floor.constraints.maxPrice}`
      });
    }

    // Apply max daily change constraint
    if (floor.constraints?.maxDailyChange) {
      const maxChange = context.currentPrice * (floor.constraints.maxDailyChange / 100);
      const priceDiff = Math.abs(suggestedPrice - context.currentPrice);
      if (priceDiff > maxChange) {
        const direction = suggestedPrice > context.currentPrice ? 1 : -1;
        suggestedPrice = context.currentPrice + (maxChange * direction);
        factors.push({
          name: 'Max Daily Change Constraint',
          impact: 0,
          weight: 0,
          description: `Limited to max daily change of ${floor.constraints.maxDailyChange}%`
        });
      }
    }

    // Round to 2 decimal places
    suggestedPrice = Math.round(suggestedPrice * 100) / 100;

    // Calculate projected impact
    const priceChange = suggestedPrice - context.currentPrice;
    const projectedRevenueChange = (priceChange / context.currentPrice) * context.performance.revenue;
    const projectedEcpmChange = (priceChange / context.currentPrice) * context.performance.ecpm;
    const projectedDemandImpact = context.performance.winRate > 0.5 ? -0.05 : 0.05;

    const confidence = totalWeight / 0.85; // Normalize confidence

    return {
      suggestedPrice,
      confidence: Math.min(confidence, 0.95),
      factors,
      projectedImpact: {
        revenueChange: Math.round(projectedRevenueChange * 100) / 100,
        ecpmChange: Math.round(projectedEcpmChange * 100) / 100,
        demandImpact: projectedDemandImpact
      },
      reason: factors.length > 0
        ? factors.map(f => f.name).join(', ')
        : 'No significant optimization opportunity identified'
    };
  }

  /**
   * Apply optimization result to floor
   */
  private async applyOptimization(
    floor: any,
    result: OptimizationResult,
    context: OptimizationContext
  ): Promise<void> {
    const previousPrice = floor.price;

    // Update floor
    floor.price = result.suggestedPrice;
    floor.type = 'ai_optimized';
    floor.lastOptimized = new Date();
    floor.optimizationCount += 1;
    floor.metadata.updatedBy = 'ai_optimizer';

    await floor.save();

    // Record history
    const history = new FloorHistory({
      floorId: floor._id.toString(),
      inventoryId: floor.inventoryId,
      previousPrice,
      newPrice: result.suggestedPrice,
      priceChange: result.suggestedPrice - previousPrice,
      priceChangePercent: ((result.suggestedPrice - previousPrice) / previousPrice) * 100,
      timestamp: new Date(),
      reason: result.reason,
      reasonCode: 'AI_OPTIMIZATION',
      triggeredBy: 'ai_optimization',
      factors: {
        ecpm: context.performance.ecpm,
        revenue: context.performance.revenue,
        demandScore: context.marketData.demandScore
      },
      metadata: {
        algorithm: 'rule_based',
        confidence: result.confidence,
        notes: `AI optimization: ${result.reason}`
      }
    });

    await history.save();

    // Update metrics
    floorPricingMetrics.currentFloorPrices.set(
      { inventory_id: floor.inventoryId, type: 'ai_optimized' },
      result.suggestedPrice
    );
    floorPricingMetrics.floorOperationsTotal.inc({ operation: 'optimize', status: 'success' });
    floorPricingMetrics.optimizationRecommendationsTotal.inc({
      confidence_level: result.confidence >= 0.8 ? 'high' : result.confidence >= 0.5 ? 'medium' : 'low'
    });
  }
}

export const optimizationService = new OptimizationService();