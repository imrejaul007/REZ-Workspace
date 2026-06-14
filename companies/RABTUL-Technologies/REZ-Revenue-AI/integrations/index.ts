/**
 * REZ Revenue AI - Unified Integration SDK
 *
 * Single SDK for ALL merchant verticals:
 * - Restaurant
 * - Hotel
 * - Salon
 * - Fitness
 * - Healthcare
 * - Retail
 *
 * Usage:
 *   import { createMerchantIntegration } from '@rez/revenue-ai-sdk';
 *
 *   const revenue = createMerchantIntegration('restaurant');
 *   const price = await revenue.calculatePrice({ ... });
 */

import axios from 'axios';

// Configuration
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const REVENUE_AGENT_URL = process.env.REVENUE_AGENT_URL || 'http://localhost:4330';

// Vertical types
export type Vertical = 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail';

// Base context for pricing
interface BasePricingContext {
  entityId: string;
  entityName: string;
  category: string;
  basePrice: number;
  cost: number;
  time: Date;
  slotsRemaining?: number;
  totalSlots?: number;
  customerId?: string;
  customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
  city?: string;
  tier?: 1 | 2 | 3;
}

// Pricing result
interface PricingResult {
  originalPrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: string;
  factors: Array<{ name: string; reason: string; contribution: number }>;
  alternatives?: Array<{ label: string; price: number }>;
}

// Forecast result
interface ForecastResult {
  peakHour: number;
  avgDemand: number;
  peakDay: string;
  staffingRecommendation?: { morning: number; evening: number };
}

// Cashback result
interface CashbackResult {
  cashbackAmount: number;
  cashbackRate: number;
  reason: string;
}

// Benchmark result
interface BenchmarkResult {
  overallScore: number;
  percentile: string;
  letterGrade: string;
  breakdown: Array<{ metric: string; score: number; categoryRank: string }>;
}

// Segment result
interface SegmentResult {
  segments: Array<{ id: string; name: string; count: number; percentage: number }>;
}

/**
 * Merchant Integration SDK
 */
export class MerchantIntegration {
  private vertical: Vertical;

  constructor(vertical: Vertical) {
    this.vertical = vertical;
  }

  /**
   * Calculate dynamic price
   */
  async calculatePrice(context: BasePricingContext): Promise<PricingResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: context.entityId,
            type: 'product',
            category: context.category,
            vertical: this.vertical,
            name: context.entityName,
            basePrice: context.basePrice,
            cost: context.cost,
          },
          time: {
            dayOfWeek: context.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: context.time.getHours(),
            isPeakHour: this.isPeakHour(context.time),
            isWeekend: context.time.getDay() === 0 || context.time.getDay() === 6,
          },
          inventory: context.slotsRemaining !== undefined ? {
            slotsRemaining: context.slotsRemaining,
            totalSlots: context.totalSlots,
          } : undefined,
          audience: context.customerId ? {
            userId: context.customerId,
            segment: context.customerSegment,
          } : undefined,
          location: context.city ? {
            city: context.city,
            tier: context.tier,
          } : undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          originalPrice: data.originalPrice,
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors?.map((f: any) => ({
            name: f.name,
            reason: f.reason,
            contribution: f.contribution,
          })) || [],
          alternatives: data.alternativePrices,
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Pricing failed, using fallback');
    }

    return this.localFallback(context);
  }

  /**
   * Get demand forecast
   */
  async getForecast(merchantId: string, horizon: 'day' | 'week' | 'month' = 'week'): Promise<ForecastResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: this.vertical,
        category: 'general',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        const data = response.data.data;
        return {
          peakHour: data.forecasts?.[0]?.peakHour || 19,
          avgDemand: data.summary?.avgDailyDemand || 60,
          peakDay: data.summary?.peakDay || 'Saturday',
          staffingRecommendation: {
            morning: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 20),
            evening: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 10),
          },
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Forecast failed');
    }

    return {
      peakHour: 19,
      avgDemand: 60,
      peakDay: 'Saturday',
    };
  }

  /**
   * Get optimal cashback
   */
  async getCashback(
    merchantId: string,
    customerId: string,
    orderValue: number,
    segment: string,
    churnRisk: number = 0.2
  ): Promise<CashbackResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/cashback/optimize`, {
        merchantId,
        userId: customerId,
        orderValue,
        category: 'general',
        vertical: this.vertical,
        context: {
          audience: { segment, churnRisk },
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
      console.warn('[RevenueAI] Cashback failed');
    }

    const rates: Record<string, number> = {
      new: 0.15,
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      dormant: 0.10,
    };
    const rate = rates[segment] || 0.05;

    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: 'Standard rate',
    };
  }

  /**
   * Get benchmark score
   */
  async getBenchmark(merchantId: string): Promise<BenchmarkResult> {
    try {
      const response = await axios.get(`${REVENUE_AI_URL}/api/v1/benchmarks/${merchantId}`, {
        timeout: 10000,
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          overallScore: data.overallScore,
          percentile: data.percentile,
          letterGrade: data.letterGrade,
          breakdown: data.breakdown || [],
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Benchmark failed');
    }

    return {
      overallScore: 70,
      percentile: 'Top 50%',
      letterGrade: 'B',
      breakdown: [],
    };
  }

  /**
   * Get customer segments
   */
  async getSegments(merchantId: string): Promise<SegmentResult> {
    try {
      const response = await axios.get(`${REVENUE_AI_URL}/api/v1/segments/${merchantId}/summary`, {
        timeout: 10000,
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Segments failed');
    }

    return { segments: [] };
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
      console.error('[RevenueAI] Chat failed');
    }

    return { response: 'Sorry, I had trouble processing that.' };
  }

  /**
   * Get revenue plan
   */
  async getRevenuePlan(
    merchantId: string,
    goal: { type: 'revenue' | 'customers' | 'orders'; target: number; timeframe: string }
  ): Promise<any> {
    try {
      const response = await axios.post(`${REVENUE_AGENT_URL}/api/v1/agent/task`, {
        merchantId,
        type: 'recommendation',
        params: { question: `Help me achieve ${goal.target} ${goal.type} in ${goal.timeframe}` },
      }, { timeout: 15000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('[RevenueAI] Revenue plan failed');
    }

    return null;
  }

  /**
   * Generate campaign
   */
  async generateCampaign(params: {
    merchantId: string;
    objective: 'acquisition' | 'retention' | 'reactivation';
    target: 'new_users' | 'existing' | 'at_risk' | 'all';
    offer: { type: string; value: number };
    channels: string[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/campaigns/generate`, params, {
        timeout: 15000,
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('[RevenueAI] Campaign generation failed');
    }

    return null;
  }

  /**
   * Local fallback pricing
   */
  private localFallback(context: BasePricingContext): PricingResult {
    const factors: Array<{ name: string; reason: string; contribution: number }> = [];
    let adjustment = 0;

    if (this.isPeakHour(context.time)) {
      factors.push({ name: 'Peak Hour', reason: 'High demand time', contribution: 15 });
      adjustment += 15;
    }

    if (context.time.getDay() === 5 || context.time.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Weekend pricing', contribution: 10 });
      adjustment += 10;
    }

    if (context.slotsRemaining !== undefined && context.totalSlots) {
      const occupancy = 1 - (context.slotsRemaining / context.totalSlots);
      if (occupancy > 0.7) {
        factors.push({ name: 'High Demand', reason: `${Math.round(occupancy * 100)}% full`, contribution: Math.round((occupancy - 0.7) * 100) });
        adjustment += Math.round((occupancy - 0.7) * 100);
      }
    }

    return {
      originalPrice: context.basePrice,
      dynamicPrice: Math.round(context.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : 'none',
      factors,
    };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    if (this.vertical === 'restaurant') {
      return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
    }
    if (this.vertical === 'salon') {
      return [10, 11, 18, 19, 20].includes(hour);
    }
    if (this.vertical === 'gym') {
      return [7, 8, 9, 18, 19, 20].includes(hour);
    }
    return hour >= 9 && hour <= 21;
  }
}

/**
 * Factory function to create integration
 */
export function createMerchantIntegration(vertical: Vertical): MerchantIntegration {
  return new MerchantIntegration(vertical);
}

/**
 * Quick access to all verticals
 */
export const revenueAI = {
  restaurant: createMerchantIntegration('restaurant'),
  hotel: createMerchantIntegration('hotel'),
  salon: createMerchantIntegration('salon'),
  gym: createMerchantIntegration('gym'),
  clinic: createMerchantIntegration('clinic'),
  retail: createMerchantIntegration('retail'),
};

export default MerchantIntegration;
