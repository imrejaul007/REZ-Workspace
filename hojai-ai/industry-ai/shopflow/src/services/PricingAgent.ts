/**
 * PRICING AGENT - ShopFlow AI
 * Dynamic pricing, competitor matching, margin optimization
 */

import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface PricingRecommendation {
  productId: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  strategy: 'competitive' | 'premium' | 'penetration' | 'markdown';
  confidence: number;
  factors: {
    cost: number;
    competitorAvg: number;
    demandFactor: number;
    margin: number;
    competitorPrices: number[];
  };
  reason: string;
  validUntil: Date;
}

export interface CompetitorPrice {
  competitor: string;
  price: number;
  url: string;
  lastUpdated: Date;
}

export interface PriceScenario {
  name: string;
  price: number;
  expectedMargin: number;
  expectedSalesLift: number;
  risk: 'low' | 'medium' | 'high';
}

export class PricingAgent {
  private config = {
    defaultMargin: 0.25,
    competitorWeight: 0.4,
    demandWeight: 0.3,
    marginWeight: 0.3,
  };

  /**
   * Get pricing recommendation for a product
   */
  async getRecommendation(productId: string, options?: {
    strategy?: 'competitive' | 'premium' | 'penetration';
    targetMargin?: number;
  }): Promise<PricingRecommendation> {
    try {
      // Fetch product from Retail Service
      const product = await this.fetchProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const { cost, price: currentPrice } = product;
      const strategy = options?.strategy || 'competitive';
      const targetMargin = options?.targetMargin || this.config.defaultMargin;

      // Get competitor prices (simulated)
      const competitorPrices = await this.getCompetitorPrices(productId);
      const competitorAvg = competitorPrices.length > 0
        ? competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length
        : currentPrice;

      // Get demand factor (simulated)
      const demandFactor = await this.getDemandFactor(productId);

      // Calculate recommended price
      const recommendedPrice = this.calculatePrice({
        cost,
        competitorAvg,
        demandFactor,
        targetMargin,
        strategy,
      });

      const margin = (recommendedPrice - cost) / recommendedPrice;

      const recommendation: PricingRecommendation = {
        productId,
        productName: product.name,
        currentPrice,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        strategy,
        confidence: 0.85,
        factors: {
          cost,
          competitorAvg: Math.round(competitorAvg * 100) / 100,
          demandFactor,
          margin: Math.round(margin * 10000) / 100,
          competitorPrices: competitorPrices.map(p => p.price),
        },
        reason: this.generateReason(strategy, currentPrice, recommendedPrice, competitorAvg),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      logger.info('Pricing recommendation generated', {
        productId,
        currentPrice,
        recommendedPrice: recommendation.recommendedPrice,
        strategy,
      });

      return recommendation;
    } catch (error) {
      logger.error('Pricing recommendation failed', { error, productId });
      throw error;
    }
  }

  /**
   * Get price scenarios for A/B testing
   */
  async getScenarios(productId: string): Promise<PriceScenario[]> {
    const recommendation = await this.getRecommendation(productId);
    const { cost, currentPrice } = recommendation;

    const basePrice = recommendation.recommendedPrice;
    const scenarios: PriceScenario[] = [
      {
        name: 'Current',
        price: currentPrice,
        expectedMargin: Math.round(((currentPrice - cost) / currentPrice) * 100),
        expectedSalesLift: 0,
        risk: 'low',
      },
      {
        name: 'Recommended',
        price: basePrice,
        expectedMargin: Math.round(((basePrice - cost) / basePrice) * 100),
        expectedSalesLift: 10,
        risk: 'low',
      },
      {
        name: 'Aggressive',
        price: Math.round(basePrice * 0.95 * 100) / 100,
        expectedMargin: Math.round(((basePrice * 0.95 - cost) / (basePrice * 0.95)) * 100),
        expectedSalesLift: 20,
        risk: 'medium',
      },
      {
        name: 'Premium',
        price: Math.round(basePrice * 1.1 * 100) / 100,
        expectedMargin: Math.round(((basePrice * 1.1 - cost) / (basePrice * 1.1)) * 100),
        expectedSalesLift: -5,
        risk: 'medium',
      },
    ];

    return scenarios;
  }

  /**
   * Optimize bundle pricing
   */
  async optimizeBundle(productIds: string[], discountPercent: number = 10): Promise<{
    bundlePrice: number;
    individualTotal: number;
    savings: number;
    margin: number;
  }> {
    let individualTotal = 0;
    const products: any[] = [];

    for (const productId of productIds) {
      const product = await this.fetchProduct(productId);
      if (product) {
        products.push(product);
        individualTotal += product.price;
      }
    }

    const bundlePrice = Math.round(individualTotal * (1 - discountPercent / 100) * 100) / 100;
    const totalCost = products.reduce((sum, p) => sum + p.cost, 0);
    const margin = (bundlePrice - totalCost) / bundlePrice;

    return {
      bundlePrice,
      individualTotal: Math.round(individualTotal * 100) / 100,
      savings: Math.round((individualTotal - bundlePrice) * 100) / 100,
      margin: Math.round(margin * 10000) / 100,
    };
  }

  /**
   * Calculate markdown price for slow-moving inventory
   */
  async getMarkdownPrice(productId: string, daysOld: number): Promise<{
    originalPrice: number;
    markdownPrice: number;
    markdownPercent: number;
    estimatedSellThrough: number;
  }> {
    const product = await this.fetchProduct(productId);
    if (!product) throw new Error('Product not found');

    // Markdown schedule: 10% after 30 days, 20% after 60 days, 30% after 90 days
    let markdownPercent = 0;
    if (daysOld >= 90) markdownPercent = 30;
    else if (daysOld >= 60) markdownPercent = 20;
    else if (daysOld >= 30) markdownPercent = 10;

    const markdownPrice = Math.round(product.price * (1 - markdownPercent / 100) * 100) / 100;
    const estimatedSellThrough = markdownPercent > 0 ? 50 + markdownPercent : 100;

    return {
      originalPrice: product.price,
      markdownPrice,
      markdownPercent,
      estimatedSellThrough,
    };
  }

  /**
   * Fetch product from Retail Service
   */
  private async fetchProduct(productId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.integrations.retail}/api/products/${productId}`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch (error) {
      // Fallback to mock data for demo
      return {
        _id: productId,
        name: 'Sample Product',
        price: 999,
        cost: 500,
        category: 'General',
      };
    }
  }

  /**
   * Get competitor prices (simulated)
   */
  private async getCompetitorPrices(productId: string): Promise<CompetitorPrice[]> {
    // In production, this would scrape or fetch from competitor APIs
    return [
      { competitor: 'Competitor A', price: 950 + Math.random() * 100, url: '', lastUpdated: new Date() },
      { competitor: 'Competitor B', price: 980 + Math.random() * 100, url: '', lastUpdated: new Date() },
    ];
  }

  /**
   * Get demand factor (simulated)
   */
  private async getDemandFactor(productId: string): Promise<number> {
    // In production, this would use ML model or sales velocity
    return 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  }

  /**
   * Calculate optimal price
   */
  private calculatePrice(params: {
    cost: number;
    competitorAvg: number;
    demandFactor: number;
    targetMargin: number;
    strategy: string;
  }): number {
    const { cost, competitorAvg, demandFactor, targetMargin, strategy } = params;

    let basePrice: number;

    switch (strategy) {
      case 'competitive':
        basePrice = competitorAvg * 0.98; // Just below competitor average
        break;
      case 'premium':
        basePrice = competitorAvg * 1.1; // Above market
        break;
      case 'penetration':
        basePrice = cost * (1 + targetMargin) * 0.9; // Low margin, low price
        break;
      default:
        basePrice = cost * (1 + targetMargin);
    }

    // Adjust for demand
    const demandAdjustedPrice = basePrice * (1 + (demandFactor - 1) * 0.2);

    // Ensure minimum margin
    const minPrice = cost * 1.1;
    const finalPrice = Math.max(demandAdjustedPrice, minPrice);

    return Math.round(finalPrice);
  }

  /**
   * Generate human-readable reason
   */
  private generateReason(strategy: string, current: number, recommended: number, competitor: number): string {
    const diff = ((recommended - current) / current * 100).toFixed(1);

    if (strategy === 'competitive') {
      return `Recommended ${diff}% price adjustment to stay competitive with market (₹${competitor.toFixed(0)} avg)`;
    } else if (strategy === 'premium') {
      return `Premium positioning - increase price by ${diff}% to capture higher margin`;
    } else {
      return `Penetration pricing - reduce by ${diff}% to drive volume`;
    }
  }
}

export const pricingAgent = new PricingAgent();
export default pricingAgent;
