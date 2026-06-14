/**
 * REZ Revenue AI - Restaurant Hub Integration
 *
 * Connects Restaurant Hub (restauranthub) to REZ Revenue AI
 * Enables dynamic pricing, demand forecasting, and AI recommendations
 *
 * Integration Points:
 * - Menu item pricing at POS
 * - Table/slot availability pricing
 * - Staffing recommendations
 * - Offer optimization
 * - Customer cashback
 */

import axios from 'axios';
import { logger } from '../config/logger';

// Configuration
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const REVENUE_AGENT_URL = process.env.REVENUE_AGENT_URL || 'http://localhost:4330';

export interface PricingContext {
  itemId: string;
  category: string;
  basePrice: number;
  cost: number;
  time: Date;
  tablesRemaining?: number;
  totalTables?: number;
  customerId?: string;
  customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
  city?: string;
  tier?: 1 | 2 | 3;
}

export interface PricingResult {
  itemId: string;
  basePrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based' | 'none';
  factors: Array<{ name: string; reason: string; contribution: number }>;
  alternativePrices?: Array<{ label: string; price: number }>;
}

export interface DemandForecast {
  merchantId: string;
  horizon: 'day' | 'week' | 'month';
  peakHour: number;
  avgDailyDemand: number;
  peakDay: string;
  staffingRecommendation: {
    morning: number;
    evening: number;
  };
}

export interface CashbackResult {
  cashbackAmount: number;
  cashbackRate: number;
  reason: string;
}

export interface OfferResult {
  offerType: string;
  offerValue: number;
  expectedRevenue: number;
}

/**
 * Restaurant Hub Revenue AI Integration
 */
export class RestaurantHubRevenueIntegration {
  /**
   * Calculate dynamic price for menu item
   */
  async calculateDynamicPrice(params: PricingContext): Promise<PricingResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.itemId,
            type: 'product',
            category: params.category,
            vertical: 'restaurant',
            name: params.itemId,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.time.getHours(),
            isPeakHour: this.isPeakHour(params.time),
            isWeekend: params.time.getDay() === 0 || params.time.getDay() === 6,
          },
          inventory: params.tablesRemaining !== undefined ? {
            slotsRemaining: params.tablesRemaining,
            totalSlots: params.totalTables,
          } : undefined,
          audience: params.customerId ? {
            userId: params.customerId,
            segment: params.customerSegment,
          } : undefined,
          location: params.city ? {
            city: params.city,
            tier: params.tier,
          } : undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          itemId: data.entityId,
          basePrice: params.basePrice,
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors?.map((f: any) => ({
            name: f.name,
            reason: f.reason,
            contribution: f.contribution,
          })) || [],
          alternativePrices: data.alternativePrices,
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Pricing call failed, using fallback');
    }

    // Fallback to local calculation
    return this.calculateLocalFallback(params);
  }

  /**
   * Get demand forecast for staffing
   */
  async getDemandForecast(merchantId: string, horizon: 'day' | 'week' | 'month' = 'week'): Promise<DemandForecast> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: 'restaurant',
        category: 'general',
        location: { city: 'Bangalore', tier: 1 },
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        const data = response.data.data;
        return {
          merchantId,
          horizon,
          peakHour: data.forecasts?.[0]?.peakHour || 19,
          avgDailyDemand: data.summary?.avgDailyDemand || 60,
          peakDay: data.summary?.peakDay || 'Saturday',
          staffingRecommendation: {
            morning: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 20),
            evening: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 10),
          },
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Forecast call failed');
    }

    return {
      merchantId,
      horizon,
      peakHour: 19,
      avgDailyDemand: 60,
      peakDay: 'Saturday',
      staffingRecommendation: { morning: 4, evening: 7 },
    };
  }

  /**
   * Get optimal cashback for customer
   */
  async getOptimalCashback(
    merchantId: string,
    customerId: string,
    orderValue: number,
    customerData: { segment: string; ltv: number; churnRisk: number }
  ): Promise<CashbackResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/cashback/optimize`, {
        merchantId,
        userId: customerId,
        orderValue,
        category: 'food',
        vertical: 'restaurant',
        context: {
          audience: {
            segment: customerData.segment,
            ltv: customerData.ltv,
            churnRisk: customerData.churnRisk,
          },
        },
      }, { timeout: 10000 });

      if (response.data.success) {
        const data = response.data.data;
        return {
          cashbackAmount: data.recommendedCashback,
          cashbackRate: data.rate,
          reason: data.reason,
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Cashback call failed');
    }

    // Default rates
    const rates: Record<string, number> = {
      new: 0.15,
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      dormant: 0.10,
    };
    const rate = rates[customerData.segment] || 0.05;

    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: 'Standard rate',
    };
  }

  /**
   * Get offer recommendation
   */
  async getOfferRecommendation(
    merchantId: string,
    basePrice: number,
    goal: 'revenue' | 'conversion' | 'retention' | 'acquisition' = 'conversion',
    customerSegment?: string
  ): Promise<OfferResult | null> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/offers/optimize`, {
        merchantId,
        entityId: 'menu_item',
        basePrice,
        audience: customerSegment ? { segment: customerSegment } : undefined,
        optimizationGoal: goal,
      }, { timeout: 10000 });

      if (response.data.success && response.data.data.recommendedOffer) {
        const offer = response.data.data.recommendedOffer;
        return {
          offerType: offer.type,
          offerValue: offer.value,
          expectedRevenue: response.data.data.alternatives?.[0]?.expectedRevenue || basePrice * 1.1,
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Offer call failed');
    }

    return null;
  }

  /**
   * Chat with Revenue Agent
   */
  async chat(merchantId: string, message: string): Promise<{ response: string; actions?: any[] }> {
    try {
      const response = await axios.post(`${REVENUE_AGENT_URL}/api/v1/agent/chat`, {
        merchantId,
        message,
      }, { timeout: 15000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      logger.error('[RevenueAI] Chat call failed', error);
    }

    return { response: 'Sorry, I had trouble processing that request.' };
  }

  /**
   * Get revenue benchmark
   */
  async getBenchmark(merchantId: string): Promise<any> {
    try {
      const response = await axios.get(`${REVENUE_AI_URL}/api/v1/benchmarks/${merchantId}`, {
        timeout: 10000,
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      logger.warn('[RevenueAI] Benchmark call failed');
    }

    return {
      overallScore: 70,
      percentile: 'Top 50%',
      letterGrade: 'B',
    };
  }

  /**
   * Local fallback pricing
   */
  private calculateLocalFallback(params: PricingContext): PricingResult {
    const factors: Array<{ name: string; reason: string; contribution: number }> = [];
    let adjustment = 0;

    // Peak hour surge
    if (this.isPeakHour(params.time)) {
      factors.push({ name: 'Peak Hour', reason: '7-9 PM dinner rush', contribution: 15 });
      adjustment += 15;
    }

    // Weekend pricing
    if (params.time.getDay() === 5 || params.time.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Saturday/Friday pricing', contribution: 10 });
      adjustment += 10;
    }

    // Happy hour discount
    const hour = params.time.getHours();
    if (hour >= 15 && hour <= 17) {
      factors.push({ name: 'Happy Hour', reason: '3-5 PM discount', contribution: -15 });
      adjustment -= 15;
    }

    // Slot scarcity
    if (params.tablesRemaining !== undefined && params.totalTables) {
      const occupancy = 1 - (params.tablesRemaining / params.totalTables);
      if (occupancy > 0.7) {
        const surge = Math.round((occupancy - 0.7) * 100);
        factors.push({ name: 'Demand', reason: `${Math.round(occupancy * 100)}% full`, contribution: surge });
        adjustment += surge;
      }
    }

    // Customer segment
    if (params.customerSegment === 'vip') {
      factors.push({ name: 'VIP', reason: 'Premium customer', contribution: 0 });
    } else if (params.customerSegment === 'new') {
      factors.push({ name: 'New Customer', reason: 'Welcome discount', contribution: -5 });
      adjustment -= 5;
    }

    const multiplier = 1 + (adjustment / 100);
    const dynamicPrice = Math.round(params.basePrice * multiplier);

    return {
      itemId: params.itemId,
      basePrice: params.basePrice,
      dynamicPrice,
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : adjustment < 0 ? 'discount' : 'none',
      factors,
    };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }
}

// Singleton
let instance: RestaurantHubRevenueIntegration | null = null;

export function getRestaurantHubRevenueIntegration(): RestaurantHubRevenueIntegration {
  if (!instance) {
    instance = new RestaurantHubRevenueIntegration();
  }
  return instance;
}

export default RestaurantHubRevenueIntegration;
