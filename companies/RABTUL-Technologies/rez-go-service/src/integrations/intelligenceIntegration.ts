/**
 * REZ Intelligence Integration
 *
 * Connects to REZ Intelligence services for:
 * - Shopping recommendations
 * - Price intelligence
 * - Spending predictions
 * - Behavioral signals
 */

import { config } from '../config/index.js';

export interface Recommendation {
  productId: string;
  name: string;
  reason: string;
  type: 'substitute' | 'complement' | 'frequent' | 'deal';
  score: number;
  cashback?: number;
}

export interface PriceInsight {
  productId: string;
  currentPrice: number;
  suggestedPrice?: number;
  priceHistory: { date: string; price: number }[];
  trend: 'up' | 'down' | 'stable';
  savings: number;
}

export interface SpendingPrediction {
  userId: string;
  predictedSpend: number;
  confidence: number;
  basedOn: string[];
  tips: string[];
}

export interface ShoppingSignal {
  type: 'habit' | 'deal' | 'stockup' | 'exploration';
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

class IntelligenceIntegration {
  private intentUrl: string;
  private predictionUrl: string;
  private signalsUrl: string;
  private apiKey: string;

  constructor() {
    this.intentUrl = config.INTENT_SERVICE_URL;
    this.predictionUrl = 'http://localhost:4123'; // REZ Predictive Engine
    this.signalsUrl = 'http://localhost:4121'; // Signal Aggregator
    this.apiKey = process.env.REZ_INTELLIGENCE_API_KEY || '';
  }

  /**
   * Get AI-powered shopping recommendations
   */
  async getRecommendations(params: {
    userId: string;
    storeId: string;
    cartItems?: string[];
    budget?: number;
  }): Promise<Recommendation[]> {
    // In production, call REZ Intelligence
    // For now, return mock recommendations

    return this.getMockRecommendations(params);
  }

  /**
   * Get price intelligence for cart
   */
  async getPriceInsights(params: {
    userId: string;
    storeId: string;
    products: string[];
  }): Promise<PriceInsight[]> {
    // In production, call price intelligence service
    return this.getMockPriceInsights(params);
  }

  /**
   * Get spending prediction
   */
  async getSpendingPrediction(params: {
    userId: string;
    storeId: string;
    cartTotal: number;
  }): Promise<SpendingPrediction> {
    // In production, call predictive engine
    return this.getMockSpendingPrediction(params);
  }

  /**
   * Get behavioral signals
   */
  async getSignals(params: {
    userId: string;
    storeId: string;
    context: 'scanning' | 'cart' | 'checkout';
  }): Promise<ShoppingSignal[]> {
    // In production, call signal aggregator
    return this.getMockSignals(params);
  }

  /**
   * Emit shopping event to intelligence
   */
  async emitEvent(event: {
    type: string;
    userId: string;
    storeId: string;
    sessionId: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    // In production, emit to event bus
    console.log('[REZ Intelligence] Event:', event.type, event.userId);
  }

  // Mock implementations for development

  private getMockRecommendations(params: {
    userId: string;
    storeId: string;
    cartItems?: string[];
    budget?: number;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Substitutes
    if (params.cartItems?.includes('PROD-MAGGI-2MIN')) {
      recommendations.push({
        productId: 'PROD-INSTANT-IDLI',
        name: 'MTR Instant Idli Mix',
        reason: 'Healthier alternative to noodles',
        type: 'substitute',
        score: 0.85,
        cashback: 2,
      });
    }

    // Complements
    if (params.cartItems?.includes('PROD-LAYS-AMERICANA')) {
      recommendations.push({
        productId: 'PROD-COCO-COLA-2L',
        name: 'Coca-Cola 2L',
        reason: 'Perfect with chips!',
        type: 'complement',
        score: 0.9,
        cashback: 2,
      });
    }

    // Frequent buys
    recommendations.push({
      productId: 'PROD-PARLE-G',
      name: 'Parle-G Biscuits',
      reason: 'You usually buy this weekly',
      type: 'frequent',
      score: 0.75,
      cashback: 2,
    });

    // Deals
    recommendations.push({
      productId: 'PROD-AMUL-BUTTER',
      name: 'Amul Butter 500g',
      reason: '5% cashback today only!',
      type: 'deal',
      score: 0.95,
      cashback: 5,
    });

    return recommendations;
  }

  private getMockPriceInsights(params: {
    userId: string;
    storeId: string;
    products: string[];
  }): PriceInsight[] {
    return params.products.map((productId) => ({
      productId,
      currentPrice: 100,
      suggestedPrice: 95,
      priceHistory: [
        { date: '2026-05-01', price: 105 },
        { date: '2026-05-15', price: 100 },
        { date: '2026-05-28', price: 100 },
      ],
      trend: 'stable' as const,
      savings: 5,
    }));
  }

  private getMockSpendingPrediction(params: {
    userId: string;
    storeId: string;
    cartTotal: number;
    budget?: number;
  }): SpendingPrediction {
    const isOverBudget = params.cartTotal > (params.budget || 2000);
    const tips: string[] = [];

    if (isOverBudget) {
      tips.push('Consider removing some items to stay within budget');
    }

    if (params.cartTotal > 1500) {
      tips.push('You could save ₹50 by choosing alternatives');
    }

    return {
      userId: params.userId,
      predictedSpend: params.cartTotal * 1.1,
      confidence: 0.8,
      basedOn: ['past_spending', 'store_category', 'time_of_day'],
      tips,
    };
  }

  private getMockSignals(params: {
    userId: string;
    storeId: string;
    context: 'scanning' | 'cart' | 'checkout';
  }): ShoppingSignal[] {
    const signals: ShoppingSignal[] = [];

    switch (params.context) {
      case 'scanning':
        signals.push({
          type: 'habit',
          message: 'You often shop on Saturday mornings',
          priority: 'low',
        });
        break;
      case 'cart':
        signals.push({
          type: 'deal',
          message: 'Add ₹150 more for free delivery',
          action: 'view_deals',
          priority: 'medium',
        });
        break;
      case 'checkout':
        signals.push({
          type: 'stockup',
          message: 'Your protein powder is running low based on past purchases',
          action: 'add_to_cart',
          priority: 'high',
        });
        break;
    }

    return signals;
  }
}

export const intelligenceIntegration = new IntelligenceIntegration();
export default intelligenceIntegration;
