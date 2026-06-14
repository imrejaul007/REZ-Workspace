/**
 * REZ Revenue AI - TypeScript SDK
 * Client library for integrating with REZ Revenue AI services
 */

import axios, { AxiosInstance } from 'axios';

// ================== TYPES ==================

export interface PricingContext {
  entity: {
    id: string;
    type: 'product' | 'service' | 'ad_inventory' | 'room' | 'appointment' | 'slot';
    category: string;
    vertical: 'restaurant' | 'hotel' | 'clinic' | 'salon' | 'gym' | 'events' | 'retail' | 'home_services' | 'corp_perks';
    name: string;
    basePrice: number;
    cost: number;
  };
  time: {
    timestamp?: Date;
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    hourOfDay: number;
    isPeakHour?: boolean;
    isWeekend?: boolean;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    month?: number;
    isHoliday?: boolean;
    eventNearby?: boolean;
  };
  demand?: {
    current: number;
    predicted?: number;
    historical?: number;
    realTime?: number;
    trend?: 'increasing' | 'stable' | 'decreasing';
    confidence?: number;
  };
  inventory?: {
    level?: number;
    max?: number;
    percentage?: number;
    daysUntilExpiry?: number;
    slotsRemaining?: number;
    totalSlots?: number;
    velocity?: 'fast' | 'normal' | 'slow';
    isLowStock?: boolean;
    isOverstock?: boolean;
  };
  competition?: {
    avgPrice?: number;
    lowestPrice?: number;
    highestPrice?: number;
    competitorCount?: number;
    marketPosition?: 'premium' | 'mid_market' | 'economy';
  };
  audience?: {
    userId?: string;
    segment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    ltv?: number;
    churnRisk?: number;
    engagementScore?: number;
    orderCount?: number;
    daysSinceLastOrder?: number;
  };
  location?: {
    city: string;
    tier?: 1 | 2 | 3;
    area?: string;
    latitude?: number;
    longitude?: number;
    nearbyEvents?: number;
    weather?: 'clear' | 'rainy' | 'stormy' | 'hot' | 'cold' | 'cloudy';
    footfallIndex?: number;
    isCommercialArea?: boolean;
    isResidentialArea?: boolean;
  };
  constraints?: {
    minMargin?: number;
    maxDiscount?: number;
    maxSurge?: number;
    strategy?: 'aggressive' | 'balanced' | 'conservative';
    allowNegativePricing?: boolean;
    roundToNearest?: number;
  };
}

export interface PricingDecision {
  entityId: string;
  finalPrice: number;
  originalPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based' | 'inventory_based';
  confidence: number;
  source: 'rules' | 'ml' | 'hybrid';
  factors: Array<{
    name: string;
    category: string;
    value: number;
    contribution: number;
    weight: number;
    reason: string;
  }>;
  validUntil: string;
  calculatedAt: string;
  alternativePrices?: Array<{
    label: string;
    price: number;
    adjustment: number;
    offer?: string;
  }>;
}

export interface OfferOptimizationRequest {
  merchantId: string;
  entityId: string;
  basePrice: number;
  audience?: {
    segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    churnRisk?: number;
    orderCount?: number;
  };
  context: {
    demand?: number;
    inventoryPercentage?: number;
    timeOfDay?: number;
    dayOfWeek?: number;
    isWeekend?: boolean;
  };
  optimizationGoal: 'revenue' | 'conversion' | 'retention' | 'acquisition';
}

export interface OfferOptimizationResponse {
  recommendedOffer: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
  alternatives: Array<{
    offer: { id: string; name: string; type: string; value: number };
    expectedRevenue: number;
    conversionLift: number;
    marginImpact: number;
  }>;
  noOfferRecommendation: {
    shouldOffer: boolean;
    reason: string;
    expectedRevenue: number;
  };
  confidence: number;
}

export interface CashbackOptimizationRequest {
  merchantId: string;
  userId: string;
  orderValue: number;
  category: string;
  vertical: string;
  context: {
    audience: {
      segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
      ltv: number;
      churnRisk: number;
      engagementScore?: number;
      orderCount?: number;
      daysSinceLastOrder?: number;
    };
    demand?: number;
    isNewUser?: boolean;
  };
}

export interface CashbackOptimizationResponse {
  recommendedCashback: number;
  rate: number;
  segment: string;
  reason: string;
  alternatives: Array<{
    rate: number;
    cashback: number;
    reason: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  totalCashbackExpense: number;
  expectedLTV: number;
  roi: number;
}

export interface DemandForecastRequest {
  merchantId: string;
  vertical: string;
  category: string;
  location: {
    city: string;
    tier?: 1 | 2 | 3;
    weather?: string;
    footfallIndex?: number;
    nearbyEvents?: number;
  };
  horizon: 'day' | 'week' | 'month';
  startDate?: string;
}

export interface DemandForecastResponse {
  merchantId: string;
  forecasts: Array<{
    date: string;
    dayOfWeek: number;
    totalDemand: number;
    peakHour: number;
    peakDemand: number;
    confidence: number;
    hourlyBreakdown: Array<{
      hour: number;
      predictedDemand: number;
      confidence: number;
      isPeakHour: boolean;
      recommendedPricing: 'discount' | 'normal' | 'surge';
    }>;
  }>;
  summary: {
    avgDailyDemand: number;
    peakDay: string;
    lowestDay: string;
    totalPredictedOrders: number;
    confidence: number;
  };
}

// ================== CLIENT CLASS ==================

export class RevenueAIClient {
  private client: AxiosInstance;

  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
  }) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
      },
    });
  }

  /**
   * Calculate dynamic price
   */
  async calculatePrice(context: PricingContext): Promise<PricingDecision> {
    const response = await this.client.post('/api/v1/pricing/calculate', { context });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Pricing calculation failed');
    }
    return response.data.data;
  }

  /**
   * Batch pricing calculation
   */
  async calculateBatchPricing(
    items: Array<{
      entityId: string;
      entityType: string;
      basePrice: number;
      cost: number;
      category: string;
      vertical: string;
    }>,
    context: Omit<PricingContext, 'entity'>
  ): Promise<{ results: PricingDecision[]; summary: unknown }> {
    const response = await this.client.post('/api/v1/pricing/batch', { items, context });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Batch pricing failed');
    }
    return response.data.data;
  }

  /**
   * Optimize offer
   */
  async optimizeOffer(request: OfferOptimizationRequest): Promise<OfferOptimizationResponse> {
    const response = await this.client.post('/api/v1/offers/optimize', request);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Offer optimization failed');
    }
    return response.data.data;
  }

  /**
   * Optimize cashback
   */
  async optimizeCashback(request: CashbackOptimizationRequest): Promise<CashbackOptimizationResponse> {
    const response = await this.client.post('/api/v1/cashback/optimize', request);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Cashback optimization failed');
    }
    return response.data.data;
  }

  /**
   * Get demand forecast
   */
  async getDemandForecast(request: DemandForecastRequest): Promise<DemandForecastResponse> {
    const response = await this.client.post('/api/v1/forecast', request);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Demand forecast failed');
    }
    return response.data.data;
  }

  /**
   * Unified revenue optimization (all services at once)
   */
  async optimizeRevenue(params: {
    merchantId: string;
    entityId: string;
    basePrice: number;
    cost: number;
    vertical: string;
    audience?: PricingContext['audience'];
    location?: PricingContext['location'];
  }): Promise<{
    pricing: PricingDecision;
    offer: OfferOptimizationResponse;
    cashback: CashbackOptimizationResponse;
  }> {
    const response = await this.client.post('/api/v1/revenue/optimize', params);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Revenue optimization failed');
    }
    return response.data.data;
  }

  /**
   * Get pricing caps
   */
  async getPricingCaps(): Promise<Array<{ vertical: string; maxSurge: number }>> {
    const response = await this.client.get('/api/v1/pricing/caps');
    return response.data.data;
  }
}

// ================== SDK EXPORTS ==================

export default RevenueAIClient;

// Factory function for common use cases
export const createRevenueAIClient = (baseUrl: string = 'http://localhost:4300', apiKey?: string) => {
  return new RevenueAIClient({ baseUrl, apiKey });
};
