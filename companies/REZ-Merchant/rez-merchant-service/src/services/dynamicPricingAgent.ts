import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { logger } from '../config/logger';
import { DemandForecastAgent, DemandForecast } from './demandForecastAgent';

/**
 * Dynamic Pricing Agent
 * Provides intelligent pricing recommendations based on demand, time, and inventory
 */

// Types and Interfaces
export interface PricingContext {
  productId: string;
  productName: string;
  basePrice: number;
  category?: string;
  currentInventory?: number;
  maxInventory?: number;
  costPrice?: number;
  demandLevel: 'low' | 'medium' | 'high';
  dayOfWeek: number;
  timeSlot: 'breakfast' | 'lunch' | 'evening' | 'late_night';
  isWeekend: boolean;
  isHoliday: boolean;
  seasonMultiplier: number;
  trendMultiplier: number;
}

export interface PriceRecommendation {
  productId: string;
  productName: string;
  basePrice: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange: number;
  priceChangePercent: number;
  strategy: PricingStrategy;
  confidence: number;
  factors: PricingFactor[];
  validFrom: Date;
  validUntil: Date;
  reason: string;
}

export interface PricingStrategy {
  name: string;
  description: string;
  useCase: string;
}

export interface PricingFactor {
  type: 'demand' | 'time' | 'inventory' | 'seasonal' | 'trend' | 'competition';
  impact: number; // Percentage impact
  description: string;
  weight: number; // Contribution to final price
}

export interface PricingRecommendationSet {
  merchantId: string;
  storeId?: string;
  generatedAt: Date;
  validUntil: Date;
  context: {
    horizon: number;
    averageDemandLevel: 'low' | 'medium' | 'high';
    peakHours: string[];
    slowHours: string[];
  };
  recommendations: PriceRecommendation[];
  bundles: BundleRecommendation[];
  summary: {
    totalProducts: number;
    priceIncreases: number;
    priceDecreases: number;
    noChange: number;
    estimatedRevenueImpact: number;
    averagePriceChange: number;
  };
  actions: RecommendedAction[];
}

export interface BundleRecommendation {
  bundleName: string;
  products: { productId: string; productName: string }[];
  currentBundlePrice: number;
  suggestedBundlePrice: number;
  discount: number;
  reason: string;
}

export interface RecommendedAction {
  type: 'raise_prices' | 'lower_prices' | 'launch_promo' | 'bundle_deal' | 'time_discount';
  priority: 'low' | 'medium' | 'high';
  description: string;
  affectedProducts: string[];
  expectedImpact: string;
}

export interface InventoryLevel {
  productId: string;
  productName: string;
  currentStock: number;
  maxStock: number;
  turnoverRate: number;
  daysUntilStockout?: number;
  status: 'critical' | 'low' | 'normal' | 'overstocked';
}

// Pricing Strategies
const PRICING_STRATEGIES: Record<string, PricingStrategy> = {
  premium: {
    name: 'Premium Pricing',
    description: 'Higher prices during peak demand periods',
    useCase: 'Weekends, high demand days, peak hours',
  },
  competitive: {
    name: 'Competitive Pricing',
    description: 'Price matching with market average',
    useCase: 'Normal demand periods, weekdays',
  },
  penetration: {
    name: 'Penetration Pricing',
    description: 'Lower prices to attract customers',
    useCase: 'Low demand periods, new product launches',
  },
  dynamic: {
    name: 'Dynamic Pricing',
    description: 'Real-time price adjustments based on demand',
    useCase: 'Hourly price optimization, events',
  },
  bundle: {
    name: 'Bundle Pricing',
    description: 'Discounted prices for product combinations',
    useCase: 'Slow periods, combo meals',
  },
};

// Time slot definitions (in hours)
const TIME_SLOTS = {
  breakfast: { start: 6, end: 11 },
  lunch: { start: 11, end: 15 },
  evening: { start: 17, end: 21 },
  late_night: { start: 21, end: 6 },
};

// Demand-based price adjustments
const DEMAND_MULTIPLIERS = {
  low: 0.85,    // 15% discount for low demand
  medium: 1.0,  // Base price
  high: 1.25,   // 25% premium for high demand
};

// Time slot adjustments
const TIME_MULTIPLIERS = {
  breakfast: 1.05,    // Slight premium
  lunch: 1.15,       // Lunch rush premium
  evening: 1.20,     // Dinner premium
  late_night: 0.80,  // Discount for late night
};

// Day of week adjustments
const DAYOFWEEK_MULTIPLIERS: Record<number, number> = {
  0: 1.10,  // Sunday - weekend
  1: 0.95,  // Monday - low
  2: 0.95,  // Tuesday - low
  3: 1.00,  // Wednesday
  4: 1.05,  // Thursday
  5: 1.15,  // Friday - weekend start
  6: 1.20,  // Saturday - peak weekend
};

// Seasonal adjustments
const SEASONAL_MULTIPLIERS: Record<number, number> = {
  0: 1.0,   // January
  1: 0.95,  // February
  2: 1.0,   // March
  3: 1.05,  // April
  4: 1.1,   // May
  5: 1.15,  // June
  6: 1.2,   // July
  7: 1.25,  // August
  8: 1.1,   // September
  9: 1.0,   // October
  10: 1.15, // November
  11: 1.3,  // December - holiday season
};

// Minimum margin thresholds
const MIN_MARGIN_PERCENT = 15; // Minimum 15% margin
const MAX_DISCOUNT_PERCENT = 40; // Maximum 40% discount

export class DynamicPricingAgent {
  /**
   * Get store IDs for a merchant
   */
  private static async getStoreIds(merchantId: string, storeId?: string): Promise<Types.ObjectId[]> {
    if (storeId) {
      return [new mongoose.Types.ObjectId(storeId)];
    }
    const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
    return stores.map((s) => s._id);
  }

  /**
   * Determine current time slot
   */
  private static getTimeSlot(hour: number): 'breakfast' | 'lunch' | 'evening' | 'late_night' {
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'late_night';
  }

  /**
   * Calculate optimal price for a product
   */
  private static calculateOptimalPrice(context: PricingContext): {
    price: number;
    factors: PricingFactor[];
    strategy: PricingStrategy;
    confidence: number;
  } {
    const factors: PricingFactor[] = [];
    let totalMultiplier = 1.0;
    let confidence = 0.7;

    // 1. Demand-based adjustment
    const demandMultiplier = DEMAND_MULTIPLIERS[context.demandLevel];
    factors.push({
      type: 'demand',
      impact: (demandMultiplier - 1) * 100,
      description: `${context.demandLevel} demand`,
      weight: 0.35,
    });
    totalMultiplier *= demandMultiplier;
    confidence += context.demandLevel === 'high' ? 0.1 : 0.05;

    // 2. Time slot adjustment
    const timeMultiplier = TIME_MULTIPLIERS[context.timeSlot];
    factors.push({
      type: 'time',
      impact: (timeMultiplier - 1) * 100,
      description: `${context.timeSlot} time slot`,
      weight: 0.20,
    });
    totalMultiplier *= timeMultiplier;

    // 3. Day of week adjustment
    const dowMultiplier = DAYOFWEEK_MULTIPLIERS[context.dayOfWeek] || 1.0;
    if (context.isWeekend) {
      factors.push({
        type: 'time',
        impact: 15,
        description: 'Weekend pricing',
        weight: 0.15,
      });
      totalMultiplier *= 1.15;
    } else {
      factors.push({
        type: 'time',
        impact: (dowMultiplier - 1) * 100,
        description: `Day of week (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][context.dayOfWeek]})`,
        weight: 0.10,
      });
      totalMultiplier *= dowMultiplier;
    }

    // 4. Inventory adjustment
    if (context.currentInventory !== undefined && context.maxInventory) {
      const inventoryRatio = context.currentInventory / context.maxInventory;
      let inventoryAdjustment = 0;

      if (inventoryRatio < 0.2) {
        inventoryAdjustment = 20; // Scarcity premium
        factors.push({
          type: 'inventory',
          impact: 20,
          description: 'Low stock - scarcity pricing',
          weight: 0.10,
        });
        confidence -= 0.05;
      } else if (inventoryRatio > 0.8) {
        inventoryAdjustment = -15; // Discount to move stock
        factors.push({
          type: 'inventory',
          impact: -15,
          description: 'High stock - promotional pricing',
          weight: 0.10,
        });
        confidence += 0.05;
      }

      totalMultiplier *= (1 + inventoryAdjustment / 100);
    }

    // 5. Seasonal adjustment
    const seasonalMultiplier = context.seasonMultiplier;
    factors.push({
      type: 'seasonal',
      impact: (seasonalMultiplier - 1) * 100,
      description: `Seasonal factor (${SEASONAL_MULTIPLIERS[new Date().getMonth()] > 1 ? 'peak' : 'off'}-season)`,
      weight: 0.10,
    });
    totalMultiplier *= seasonalMultiplier;

    // 6. Trend adjustment
    if (context.trendMultiplier !== 1.0) {
      factors.push({
        type: 'trend',
        impact: (context.trendMultiplier - 1) * 100,
        description: context.trendMultiplier > 1 ? 'Growing demand trend' : 'Declining demand trend',
        weight: 0.10,
      });
      totalMultiplier *= context.trendMultiplier;
    }

    // Calculate optimal price
    let optimalPrice = context.basePrice * totalMultiplier;

    // Apply minimum margin constraint
    if (context.costPrice) {
      const minPrice = context.costPrice * (1 + MIN_MARGIN_PERCENT / 100);
      optimalPrice = Math.max(optimalPrice, minPrice);
    }

    // Apply maximum discount constraint
    const maxDiscountPrice = context.basePrice * (1 - MAX_DISCOUNT_PERCENT / 100);
    optimalPrice = Math.min(optimalPrice, context.basePrice); // Don't exceed base for now
    optimalPrice = Math.max(optimalPrice, maxDiscountPrice);

    // Determine strategy
    let strategy: PricingStrategy;
    if (context.demandLevel === 'high' || (context.isWeekend && context.demandLevel === 'medium')) {
      strategy = PRICING_STRATEGIES.premium;
    } else if (context.demandLevel === 'low') {
      strategy = PRICING_STRATEGIES.penetration;
    } else {
      strategy = PRICING_STRATEGIES.competitive;
    }

    return {
      price: Math.round(optimalPrice * 100) / 100,
      factors,
      strategy,
      confidence: Math.min(0.95, Math.max(0.5, confidence)),
    };
  }

  /**
   * Get inventory levels for products
   */
  private static async getInventoryLevels(
    merchantId: string,
    storeId?: string
  ): Promise<Map<string, InventoryLevel>> {
    const inventoryMap = new Map<string, InventoryLevel>();

    // This would typically query an inventory system
    // For now, we'll return empty map and assume inventory is managed separately
    // In production, this would integrate with the inventory service

    return inventoryMap;
  }

  /**
   * Get product data for pricing
   */
  private static async getProductPricingData(
    merchantId: string,
    storeId?: string
  ): Promise<Array<{
    product;
    currentInventory?: number;
    maxInventory?: number;
  }>> {
    const storeIds = await this.getStoreIds(merchantId, storeId);

    // Get products for merchant's stores
    const products = await Product.find({
      $or: [
        { merchant: new mongoose.Types.ObjectId(merchantId) },
        { store: { $in: storeIds } },
      ],
      isActive: true,
    })
      .select('_id name category pricing inventory variants')
      .lean();

    const inventoryLevels = await this.getInventoryLevels(merchantId, storeId);

    return products.map(product => ({
      product,
      currentInventory: inventoryLevels.get(product._id.toString())?.currentStock,
      maxInventory: inventoryLevels.get(product._id.toString())?.maxStock,
    }));
  }

  /**
   * Generate pricing recommendations
   */
  static async getRecommendations(
    merchantId: string,
    storeId?: string,
    horizon: 7 | 14 | 30 = 7
  ): Promise<PricingRecommendationSet> {
    const startTime = Date.now();
    logger.info(`[DynamicPricingAgent] Generating recommendations for merchant ${merchantId}`);

    try {
      // Get demand forecast
      const forecast = await DemandForecastAgent.forecast(merchantId, horizon, storeId);

      // Get products
      const products = await this.getProductPricingData(merchantId, storeId);

      // Current time context
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const timeSlot = this.getTimeSlot(hour);
      const seasonMultiplier = SEASONAL_MULTIPLIERS[now.getMonth()];

      // Calculate average demand level
      const avgDemandLevel = this.calculateAverageDemandLevel(forecast.forecasts);

      // Identify peak and slow hours
      const peakHours = this.identifyPeakHours(forecast.forecasts);
      const slowHours = this.identifySlowHours(forecast.forecasts);

      // Generate recommendations
      const recommendations: PriceRecommendation[] = [];
      let priceIncreases = 0;
      let priceDecreases = 0;
      let noChange = 0;
      let totalRevenueImpact = 0;

      for (const { product } of products.slice(0, 50)) { // Limit to 50 products for performance
        const basePrice = product.pricing?.selling || product.pricing?.original || 0;
        if (basePrice <= 0) continue;

        // Estimate cost price as 60% of selling price if not available
        const costPrice = product.pricing?.original ? product.pricing.original * 0.6 : undefined;

        const context: PricingContext = {
          productId: product._id.toString(),
          productName: product.name,
          basePrice,
          category: product.category,
          currentInventory: product.inventory?.stock,
          maxInventory: product.inventory?.unlimited ? undefined : (product.inventory?.stock || 100),
          costPrice,
          demandLevel: avgDemandLevel,
          dayOfWeek,
          timeSlot,
          isWeekend,
          isHoliday: false, // Would check against holidays
          seasonMultiplier,
          trendMultiplier: this.getTrendMultiplier(forecast),
        };

        const { price, factors, strategy, confidence } = this.calculateOptimalPrice(context);
        const priceChange = price - basePrice;
        const priceChangePercent = (priceChange / basePrice) * 100;

        // Track changes
        if (priceChange > 0.01) priceIncreases++;
        else if (priceChange < -0.01) priceDecreases++;
        else noChange++;

        // Estimate revenue impact
        const avgDailyOrders = forecast.historicalAnalysis.avgDailyOrders;
        const expectedDailyOrders = avgDailyOrders * (forecast.forecasts.filter(f => f.demandLevel === avgDemandLevel).length / forecast.forecasts.length);
        totalRevenueImpact += priceChange * expectedDailyOrders;

        // Calculate min/max prices
        const minPrice = context.costPrice
          ? context.costPrice * (1 + MIN_MARGIN_PERCENT / 100)
          : basePrice * 0.6;
        const maxPrice = basePrice * 1.5;

        recommendations.push({
          productId: product._id.toString(),
          productName: product.name,
          basePrice,
          recommendedPrice: price,
          minPrice: Math.round(minPrice * 100) / 100,
          maxPrice: Math.round(maxPrice * 100) / 100,
          priceChange: Math.round(priceChange * 100) / 100,
          priceChangePercent: Math.round(priceChangePercent * 10) / 10,
          strategy,
          confidence,
          factors,
          validFrom: now,
          validUntil: new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000),
          reason: this.generateRecommendationReason(factors, strategy),
        });
      }

      // Generate bundle recommendations
      const bundles = this.generateBundleRecommendations(recommendations, forecast);

      // Generate recommended actions
      const actions = this.generateRecommendedActions(
        recommendations,
        avgDemandLevel,
        forecast
      );

      const result: PricingRecommendationSet = {
        merchantId,
        storeId,
        generatedAt: now,
        validUntil: new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000),
        context: {
          horizon,
          averageDemandLevel: avgDemandLevel,
          peakHours,
          slowHours,
        },
        recommendations: recommendations.sort((a, b) =>
          Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent)
        ),
        bundles,
        summary: {
          totalProducts: recommendations.length,
          priceIncreases,
          priceDecreases,
          noChange,
          estimatedRevenueImpact: Math.round(totalRevenueImpact),
          averagePriceChange: recommendations.length > 0
            ? Math.round((totalRevenueImpact / recommendations.length) * 100) / 100
            : 0,
        },
        actions,
      };

      const duration = Date.now() - startTime;
      logger.info(`[DynamicPricingAgent] Recommendations generated in ${duration}ms`, {
        merchantId,
        totalProducts: result.summary.totalProducts,
        priceIncreases,
        priceDecreases,
        estimatedRevenueImpact: result.summary.estimatedRevenueImpact,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      logger.error(`[DynamicPricingAgent] Failed: ${err.message}`, {
        merchantId,
        error: err.stack,
      });
      throw error;
    }
  }

  /**
   * Calculate average demand level from forecasts
   */
  private static calculateAverageDemandLevel(forecasts: DemandForecast[]): 'low' | 'medium' | 'high' {
    const highCount = forecasts.filter(f => f.demandLevel === 'high').length;
    const lowCount = forecasts.filter(f => f.demandLevel === 'low').length;

    const highRatio = highCount / forecasts.length;
    const lowRatio = lowCount / forecasts.length;

    if (highRatio > 0.4) return 'high';
    if (lowRatio > 0.4) return 'low';
    return 'medium';
  }

  /**
   * Get trend multiplier from forecast
   */
  private static getTrendMultiplier(forecast): number {
    const patterns = forecast.patterns || [];
    const trendPattern = patterns.find((p) => p.type === 'trend');
    if (trendPattern) {
      return 1 + (trendPattern.impact / 100);
    }
    return 1.0;
  }

  /**
   * Identify peak hours from forecasts
   */
  private static identifyPeakHours(forecasts: DemandForecast[]): string[] {
    const peakForecasts = forecasts
      .filter(f => f.demandLevel === 'high')
      .map(f => f.date);

    return peakForecasts.slice(0, 3);
  }

  /**
   * Identify slow hours from forecasts
   */
  private static identifySlowHours(forecasts: DemandForecast[]): string[] {
    const slowForecasts = forecasts
      .filter(f => f.demandLevel === 'low')
      .map(f => f.date);

    return slowForecasts.slice(0, 3);
  }

  /**
   * Generate bundle recommendations
   */
  private static generateBundleRecommendations(
    recommendations: PriceRecommendation[],
    forecast: unknown
  ): BundleRecommendation[] {
    const bundles: BundleRecommendation[] = [];

    // Only suggest bundles during low demand periods
    const lowDemandDays = forecast.forecasts.filter((f: DemandForecast) => f.demandLevel === 'low').length;
    if (lowDemandDays < 3) {
      return bundles;
    }

    // Suggest combo meals/bundles for slow periods
    const highPricedItems = recommendations
      .filter(r => r.priceChangePercent > 0)
      .slice(0, 5);

    if (highPricedItems.length >= 2) {
      bundles.push({
        bundleName: 'Weekday Value Combo',
        products: highPricedItems.slice(0, 3).map(p => ({
          productId: p.productId,
          productName: p.productName,
        })),
        currentBundlePrice: highPricedItems.slice(0, 3).reduce((sum, p) => sum + p.basePrice, 0),
        suggestedBundlePrice: highPricedItems.slice(0, 3).reduce((sum, p) => sum + p.basePrice, 0) * 0.85,
        discount: 15,
        reason: 'Bundle deal to attract customers during slow weekdays',
      });
    }

    return bundles;
  }

  /**
   * Generate recommended actions
   */
  private static generateRecommendedActions(
    recommendations: PriceRecommendation[],
    demandLevel: 'low' | 'medium' | 'high',
    forecast: unknown
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    const priceIncreaseProducts = recommendations.filter(r => r.priceChangePercent > 5);
    if (priceIncreaseProducts.length > 0) {
      actions.push({
        type: 'raise_prices',
        priority: demandLevel === 'high' ? 'high' : 'medium',
        description: `${priceIncreaseProducts.length} products recommended for price increase`,
        affectedProducts: priceIncreaseProducts.map(p => p.productName),
        expectedImpact: `Estimated revenue increase of ${priceIncreaseProducts.reduce((sum, p) => sum + p.priceChange * 10, 0).toFixed(0)} over forecast period`,
      });
    }

    const priceDecreaseProducts = recommendations.filter(r => r.priceChangePercent < -5);
    if (priceDecreaseProducts.length > 0 && demandLevel === 'low') {
      actions.push({
        type: 'lower_prices',
        priority: 'high',
        description: `${priceDecreaseProducts.length} products recommended for promotional pricing`,
        affectedProducts: priceDecreaseProducts.map(p => p.productName),
        expectedImpact: `Target to increase orders by 15-25% during low demand periods`,
      });
    }

    if (demandLevel === 'low') {
      actions.push({
        type: 'launch_promo',
        priority: 'high',
        description: 'Launch targeted promotions for low-demand periods',
        affectedProducts: [],
        expectedImpact: 'Increase footfall by 20-30% during identified slow periods',
      });
    }

    // Bundle deals during slow periods
    const slowDays = forecast.forecasts.filter((f: DemandForecast) => f.demandLevel === 'low').length;
    if (slowDays >= 3) {
      actions.push({
        type: 'bundle_deal',
        priority: 'medium',
        description: 'Create combo/bundle deals for slow weekdays',
        affectedProducts: recommendations.slice(0, 5).map(p => p.productName),
        expectedImpact: 'Increase average order value by 10-15%',
      });
    }

    return actions;
  }

  /**
   * Generate recommendation reason text
   */
  private static generateRecommendationReason(
    factors: PricingFactor[],
    strategy: PricingStrategy
  ): string {
    const topFactors = factors
      .filter(f => Math.abs(f.impact) > 3)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 2);

    if (topFactors.length === 0) {
      return `Standard ${strategy.name.toLowerCase()} applied`;
    }

    const factorDescriptions = topFactors.map(f =>
      f.impact > 0 ? `${f.description} (+${f.impact.toFixed(0)}%)` : `${f.description} (${f.impact.toFixed(0)}%)`
    );

    return `${strategy.name}: ${factorDescriptions.join(', ')}`;
  }

  /**
   * Calculate real-time price for a specific product and time
   */
  static async getRealtimePrice(
    merchantId: string,
    productId: string,
    storeId?: string
  ): Promise<{
    currentPrice: number;
    suggestedPrice: number;
    factors: PricingFactor[];
    nextPriceChange?: { time: string; price: number };
  }> {
    // Get product
    const product = await Product.findById(productId)
      .select('name category pricing inventory')
      .lean();

    if (!product) {
      throw new Error('Product not found');
    }

    // Get forecast for demand context
    const forecast = await DemandForecastAgent.forecast(merchantId, 7, storeId);
    const avgDemandLevel = this.calculateAverageDemandLevel(forecast.forecasts);

    const basePrice = product.pricing?.selling || product.pricing?.original || 0;
    const costPrice = product.pricing?.original ? product.pricing.original * 0.6 : undefined;

    const now = new Date();
    const context: PricingContext = {
      productId,
      productName: product.name,
      basePrice,
      category: product.category,
      currentInventory: product.inventory?.stock,
      maxInventory: product.inventory?.unlimited ? undefined : (product.inventory?.stock || 100),
      costPrice,
      demandLevel: avgDemandLevel,
      dayOfWeek: now.getDay(),
      timeSlot: this.getTimeSlot(now.getHours()),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: false,
      seasonMultiplier: SEASONAL_MULTIPLIERS[now.getMonth() as keyof typeof SEASONAL_MULTIPLIERS],
      trendMultiplier: this.getTrendMultiplier(forecast),
    };

    const { price, factors } = this.calculateOptimalPrice(context);

    return {
      currentPrice: basePrice,
      suggestedPrice: price,
      factors,
    };
  }
}

export default DynamicPricingAgent;
