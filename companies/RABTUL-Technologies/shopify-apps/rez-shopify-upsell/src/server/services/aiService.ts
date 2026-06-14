/**
 * ReZ Upsell - AI Recommendation Engine
 *
 * Smart product recommendations based on:
 * - Customer behavior
 * - Purchase history
 * - Product affinity
 * - Collaborative filtering
 * - Real-time context
 */

import { UpsellStore } from '../models/UpsellStore';
import axios from 'axios';

export interface RecommendationContext {
  shop: string;
  customerId?: string;
  cartItems: CartItem[];
  totalValue: number;
  sessionId: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  tags?: string[];
}

export interface Recommendation {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  score: number;
  reason: string;
  discountPercentage: number;
}

export interface ABTest {
  testId: string;
  variant: 'A' | 'B';
  offerId: string;
  productId: string;
  discountPercentage: number;
  message: string;
  impressions: number;
  conversions: number;
}

export class AIRecommendationEngine {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:4123';
  }

  /**
   * Get AI-powered recommendations for a cart
   */
  async getRecommendations(ctx: RecommendationContext): Promise<Recommendation[]> {
    const config = await UpsellStore.findOne({ shop: ctx.shop.toLowerCase() });

    if (!config || config.products.length === 0) {
      return [];
    }

    // Get cart product IDs
    const cartProductIds = ctx.cartItems.map(item => item.productId);

    // Filter out products already in cart
    const availableProducts = config.products.filter(
      p => !cartProductIds.includes(p.productId)
    );

    if (availableProducts.length === 0) {
      return [];
    }

    // Score each product
    const scoredProducts = await Promise.all(
      availableProducts.map(async (product) => {
        const score = await this.calculateProductScore(product, ctx);
        const reason = await this.getRecommendationReason(product, ctx);

        return {
          productId: product.productId,
          variantId: product.variantId,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
          score,
          reason,
          discountPercentage: config.discountPercentage,
        };
      })
    );

    // Sort by score and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Calculate product recommendation score
   */
  private async calculateProductScore(
    product: any,
    ctx: RecommendationContext
  ): Promise<number> {
    let score = 50; // Base score

    // 1. Price affinity (products 1.5x-3x cart value score higher)
    const cartAvgPrice = ctx.totalValue / Math.max(ctx.cartItems.length, 1);
    const priceRatio = product.price / cartAvgPrice;

    if (priceRatio >= 1.5 && priceRatio <= 3) {
      score += 25; // Sweet spot
    } else if (priceRatio < 1.5) {
      score += 10; // Good add-on
    } else {
      score -= 10; // Too expensive
    }

    // 2. Category affinity
    if (product.category) {
      const cartCategories = ctx.cartItems
        .filter(item => item.category === product.category)
        .length;
      if (cartCategories > 0) {
        score += 15; // Same category bonus
      }
    }

    // 3. Tag affinity
    if (product.tags && product.tags.length > 0) {
      const cartTags = ctx.cartItems.flatMap(item => item.tags || []);
      const matchingTags = product.tags.filter(t => cartTags.includes(t));
      score += matchingTags.length * 5;
    }

    // 4. Price attractiveness (higher discount = higher score)
    if (product.compareAtPrice) {
      const discountPct = ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100;
      score += Math.min(discountPct, 20);
    }

    // 5. AI/ML enhancement (if available)
    try {
      const mlScore = await this.getMLScore(product, ctx);
      score = (score + mlScore) / 2;
    } catch (error) {
      // Fallback to rule-based score
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get ML-based score (if ML service available)
   */
  private async getMLScore(product: any, ctx: RecommendationContext): Promise<number> {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/api/recommend`, {
        productId: product.productId,
        shop: ctx.shop,
        customerId: ctx.customerId,
        cartItems: ctx.cartItems,
        context: {
          totalValue: ctx.totalValue,
          itemCount: ctx.cartItems.length,
        },
      });

      return response.data.score || 50;
    } catch {
      return 50; // Default fallback
    }
  }

  /**
   * Generate human-readable recommendation reason
   */
  private async getRecommendationReason(
    product: any,
    ctx: RecommendationContext
  ): Promise<string> {
    const reasons: string[] = [];

    // Check category match
    const cartCategories = ctx.cartItems
      .map(item => item.category)
      .filter(Boolean);

    if (product.category && cartCategories.includes(product.category)) {
      reasons.push(`Pairs great with your ${product.category}`);
    }

    // Check price sweet spot
    const cartAvgPrice = ctx.totalValue / Math.max(ctx.cartItems.length, 1);
    if (product.price < cartAvgPrice * 0.5) {
      reasons.push('Great value add-on');
    } else if (product.price < cartAvgPrice * 1.5) {
      reasons.push('Perfect companion');
    }

    // Check for popular items
    if (product.popularity && product.popularity > 0.8) {
      reasons.push('Customer favorite');
    }

    // Check for new items
    if (product.isNew) {
      reasons.push('New arrival you might like');
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push('You might also like this');
    }

    // FIX: Use crypto for secure random selection (statistical, non-security critical)
    return reasons[crypto.randomInt(0, reasons.length)];
  }

  /**
   * Generate personalized message
   */
  generateMessage(product: Recommendation, customerName?: string): string {
    const greeting = customerName ? `Hey ${customerName}! ` : '';
    const price = `₹${Math.round(product.price * (1 - product.discountPercentage / 100))}`;
    const original = `₹${product.price}`;

    const templates = [
      `${greeting}Add ${product.title} to your order for just ${price}!`,
      `${greeting}Don't miss out! Get ${product.title} for ${price} (was ${original})`,
      `${greeting}${product.reason} - Add ${product.title} for ${price}!`,
      `${greeting}Complete your order with ${product.title} at ${price}!`,
    ];

    // FIX: Use crypto for secure random selection (statistical, non-security critical)
    return templates[crypto.randomInt(0, templates.length)];
  }
}

/**
 * A/B Testing for Upsells
 */
export class ABTesting {
  /**
   * Get variant for a customer
   */
  static getVariant(sessionId: string): 'A' | 'B' {
    // Deterministic hash for consistent assignment
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
      hash = hash & hash;
    }
    return hash % 2 === 0 ? 'A' : 'B';
  }

  /**
   * Calculate statistical significance
   */
  static calculateSignificance(
    variantA: { impressions: number; conversions: number },
    variantB: { impressions: number; conversions: number }
  ): { winner: 'A' | 'B' | 'none'; confidence: number; pValue: number } {
    const rateA = variantA.conversions / Math.max(variantA.impressions, 1);
    const rateB = variantB.conversions / Math.max(variantB.impressions, 1);

    // Simple significance calculation
    const diff = Math.abs(rateA - rateB);
    const pooledRate = (variantA.conversions + variantB.conversions) /
                       (variantA.impressions + variantB.impressions);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) *
                        (1/variantA.impressions + 1/variantB.impressions));

    const z = se > 0 ? diff / se : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    const confidence = (1 - pValue) * 100;

    let winner: 'A' | 'B' | 'none' = 'none';
    if (pValue < 0.05 && confidence > 95) {
      winner = rateB > rateA ? 'B' : 'A';
    }

    return { winner, confidence, pValue };
  }

  private static normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }
}

/**
 * Analytics Engine
 */
export class AnalyticsEngine {
  /**
   * Track upsell funnel
   */
  static calculateFunnel(events: any[]): {
    impressions: number;
    views: number;
    clicks: number;
    accepts: number;
    conversionRate: number;
    revenue: number;
  } {
    const impressions = events.filter(e => e.event === 'offer_shown').length;
    const views = events.filter(e => e.event === 'offer_viewed').length;
    const clicks = events.filter(e => e.event === 'offer_clicked').length;
    const accepts = events.filter(e => e.event === 'offer_accepted').length;
    const revenue = events
      .filter(e => e.event === 'offer_accepted')
      .reduce((sum, e) => sum + (e.revenue || 0), 0);

    return {
      impressions,
      views,
      clicks,
      accepts,
      conversionRate: impressions > 0 ? (accepts / impressions) * 100 : 0,
      revenue,
    };
  }

  /**
   * Calculate revenue attribution
   */
  static calculateAttribution(stats: any): {
    directRevenue: number;
    attributedRevenue: number;
    roi: number;
    aov: number;
  } {
    const directRevenue = stats.totalRevenue || 0;
    const attributedRevenue = directRevenue * 1.5; // Attribution model
    const cost = stats.totalOffers * 0.5; // Cost per offer shown
    const roi = cost > 0 ? ((attributedRevenue - cost) / cost) * 100 : 0;
    const aov = stats.totalAccepted > 0
      ? directRevenue / stats.totalAccepted
      : 0;

    return {
      directRevenue,
      attributedRevenue,
      roi,
      aov,
    };
  }

  /**
   * Generate insights
   */
  static generateInsights(funnel: any, stats: any): string[] {
    const insights: string[] = [];

    // Conversion rate insights
    if (funnel.conversionRate > 10) {
      insights.push('Excellent conversion rate! Your upsell offers are resonating with customers.');
    } else if (funnel.conversionRate > 5) {
      insights.push('Good conversion rate. Consider testing different discount percentages.');
    } else if (funnel.conversionRate < 2) {
      insights.push('Low conversion rate. Try offering higher discounts or different products.');
    }

    // Click rate insights
    const clickRate = funnel.impressions > 0
      ? (funnel.clicks / funnel.impressions) * 100
      : 0;

    if (clickRate > 50) {
      insights.push('High engagement! Your offer positioning is working well.');
    } else if (clickRate < 20) {
      insights.push('Consider improving offer visibility or timing.');
    }

    // AOV insights
    if (funnel.accepts > 10) {
      const aov = funnel.revenue / funnel.accepts;
      insights.push(`Average upsell value: ₹${Math.round(aov)}`);
    }

    return insights;
  }
}
