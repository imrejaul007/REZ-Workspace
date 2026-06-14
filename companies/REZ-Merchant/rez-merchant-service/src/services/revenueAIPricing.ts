/**
 * REZ Revenue AI Integration for Merchant Service
 * Enhanced dynamic pricing using REZ Revenue AI Platform
 *
 * Replaces basic pricing with:
 * - 8-factor dynamic pricing
 * - Demand forecasting
 * - Segment-based offers
 * - AI-powered recommendations
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export interface PriceModifier {
  type: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based';
  factor: number;
  reason: string;
  contribution: number;
}

export interface DynamicPriceResult {
  itemId: string;
  basePrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based' | 'none';
  modifiers: PriceModifier[];
  factors: Array<{ name: string; reason: string; contribution: number }>;
  alternativePrices?: Array<{ label: string; price: number; offer?: string }>;
}

export interface PricingContext {
  entity: {
    id: string;
    type: 'product' | 'service';
    category: string;
    vertical: 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail';
    basePrice: number;
    cost: number;
  };
  time: {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    hourOfDay: number;
    isPeakHour?: boolean;
    isWeekend?: boolean;
    isHoliday?: boolean;
  };
  demand?: {
    current: number;
    predicted?: number;
    trend?: 'increasing' | 'stable' | 'decreasing';
  };
  inventory?: {
    slotsRemaining?: number;
    totalSlots?: number;
    percentage?: number;
  };
  location?: {
    city?: string;
    tier?: 1 | 2 | 3;
    weather?: string;
  };
  audience?: {
    userId?: string;
    segment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    ltv?: number;
    churnRisk?: number;
  };
  constraints?: {
    minMargin?: number;
    maxSurge?: number;
    maxDiscount?: number;
  };
}

/**
 * REZ Revenue AI Pricing Service
 * Uses REZ Revenue AI platform for intelligent pricing
 */
export class RevenueAIPricingService {
  private fallbackEnabled = true;

  /**
   * Calculate dynamic price using REZ Revenue AI
   */
  async calculateDynamicPrice(
    itemId: string,
    basePrice: number,
    cost: number,
    context: {
      category: string;
      vertical?: 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail';
      time: Date;
      tablesRemaining?: number;
      totalTables?: number;
      customerId?: string;
      customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
      city?: string;
      tier?: 1 | 2 | 3;
    }
  ): Promise<DynamicPriceResult> {
    const pricingContext: PricingContext = {
      entity: {
        id: itemId,
        type: 'product',
        category: context.category,
        vertical: context.vertical || 'restaurant',
        basePrice,
        cost,
      },
      time: {
        dayOfWeek: context.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: context.time.getHours(),
        isPeakHour: this.isPeakHour(context.time),
        isWeekend: context.time.getDay() === 0 || context.time.getDay() === 6,
      },
      inventory: context.tablesRemaining !== undefined ? {
        slotsRemaining: context.tablesRemaining,
        totalSlots: context.totalTables,
        percentage: context.totalTables ? (context.tablesRemaining / context.totalTables) * 100 : undefined,
      } : undefined,
      audience: context.customerId ? {
        userId: context.customerId,
        segment: context.customerSegment,
      } : undefined,
      location: context.city ? {
        city: context.city,
        tier: context.tier,
      } : undefined,
    };

    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: pricingContext,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.data.success) {
        return this.transformResponse(response.data.data, basePrice);
      }
    } catch (error) {
      logger.warn('[RevenueAI] Pricing call failed, using fallback', { error });
    }

    // Fallback to local calculation
    return this.calculateLocalFallback(itemId, basePrice, context);
  }

  /**
   * Batch pricing for multiple items
   */
  async calculateBatchPrices(
    items: Array<{
      id: string;
      basePrice: number;
      cost: number;
      category: string;
    }>,
    context: {
      time: Date;
      tablesRemaining?: number;
      totalTables?: number;
      customerId?: string;
      customerSegment?: string;
    }
  ): Promise<DynamicPriceResult[]> {
    const results: DynamicPriceResult[] = [];

    for (const item of items) {
      const result = await this.calculateDynamicPrice(
        item.id,
        item.basePrice,
        item.cost,
        { ...context, category: item.category }
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get demand forecast for merchant
   */
  async getDemandForecast(
    merchantId: string,
    horizon: 'day' | 'week' | 'month'
  ): Promise<{
    peakHour: number;
    avgDemand: number;
    peakDay: string;
    recommendations: string[];
  }> {
    try {
      const response = await axios.post('http://localhost:4302/api/v1/forecast', {
        merchantId,
        horizon,
      }, {
        timeout: 5000,
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          peakHour: data.forecasts?.[0]?.peakHour || 19,
          avgDemand: data.summary?.avgDailyDemand || 60,
          peakDay: data.summary?.peakDay || 'Saturday',
          recommendations: [],
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Forecast call failed');
    }

    return {
      peakHour: 19,
      avgDemand: 60,
      peakDay: 'Saturday',
      recommendations: [],
    };
  }

  /**
   * Get optimal cashback for customer
   */
  async getOptimalCashback(
    merchantId: string,
    customerId: string,
    orderValue: number,
    customerData: {
      segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
      ltv: number;
      churnRisk: number;
    }
  ): Promise<{
    cashbackAmount: number;
    cashbackRate: number;
    reason: string;
  }> {
    try {
      const response = await axios.post('http://localhost:4304/api/v1/cashback/optimize', {
        merchantId,
        userId: customerId,
        orderValue,
        category: 'food',
        vertical: 'restaurant',
        context: {
          audience: customerData,
        },
      }, {
        timeout: 5000,
      });

      if (response.data.success) {
        return {
          cashbackAmount: response.data.data.recommendedCashback,
          cashbackRate: response.data.data.rate,
          reason: response.data.data.reason,
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Cashback call failed');
    }

    // Default cashback
    const rate = this.getSegmentDefaultRate(customerData.segment);
    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: 'Standard rate',
    };
  }

  /**
   * Get revenue action plan
   */
  async getRevenuePlan(
    merchantId: string,
    goal: { type: 'revenue' | 'customers' | 'orders'; target: number; timeframe: 'week' | 'month' }
  ): Promise<{
    gap: number;
    recommendations: Array<{ title: string; impact: number; priority: string }>;
    totalUplift: number;
  }> {
    try {
      const response = await axios.post('http://localhost:4307/api/v1/copilot/revenue-plan', {
        merchantId,
        goal,
      }, {
        timeout: 10000,
      });

      if (response.data.success) {
        return {
          gap: response.data.data.goal.gap,
          recommendations: response.data.data.recommendations.map((r: { title: string; expectedImpact: number; priority: string }) => ({
            title: r.title,
            impact: r.expectedImpact,
            priority: r.priority,
          })),
          totalUplift: response.data.data.totalExpectedUplift,
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Revenue plan call failed');
    }

    return {
      gap: goal.target * 0.2,
      recommendations: [],
      totalUplift: 0,
    };
  }

  /**
   * Transform REZ Revenue AI response to our format
   */
  private transformResponse(data: any, basePrice: number): DynamicPriceResult {
    return {
      itemId: data.entityId,
      basePrice,
      dynamicPrice: data.finalPrice,
      adjustment: data.adjustment,
      adjustmentType: data.adjustmentType,
      modifiers: data.factors?.map((f: any) => ({
        type: this.categorizeFactor(f.category),
        factor: 1 + (f.contribution / 100),
        reason: f.reason,
        contribution: f.contribution,
      })) || [],
      factors: data.factors?.map((f: any) => ({
        name: f.name,
        reason: f.reason,
        contribution: f.contribution,
      })) || [],
      alternativePrices: data.alternativePrices,
    };
  }

  /**
   * Local fallback pricing calculation
   */
  private calculateLocalFallback(
    itemId: string,
    basePrice: number,
    context: any
  ): DynamicPriceResult {
    const modifiers: PriceModifier[] = [];
    let adjustment = 0;
    let adjustmentType: DynamicPriceResult['adjustmentType'] = 'none';

    // Peak hour surge
    if (context.time) {
      const hour = context.time.getHours();
      if (hour >= 19 && hour <= 21) {
        modifiers.push({
          type: 'surge',
          factor: 1.15,
          reason: 'Peak dinner hours (7-9 PM)',
          contribution: 15,
        });
        adjustment += 15;
        adjustmentType = 'surge';
      }

      // Weekend pricing
      const day = context.time.getDay();
      if (day === 5 || day === 6) {
        modifiers.push({
          type: 'surge',
          factor: 1.1,
          reason: 'Weekend pricing',
          contribution: 10,
        });
        adjustment += 10;
      }

      // Happy hour discount (3-5 PM)
      if (hour >= 15 && hour <= 17) {
        modifiers.push({
          type: 'discount',
          factor: 0.85,
          reason: 'Happy hour - 15% off',
          contribution: -15,
        });
        adjustment -= 15;
        adjustmentType = 'discount';
      }
    }

    // Slot scarcity surge
    if (context.tablesRemaining !== undefined && context.totalTables) {
      const occupancy = 1 - (context.tablesRemaining / context.totalTables);
      if (occupancy > 0.7) {
        const surge = Math.round((occupancy - 0.7) * 100);
        modifiers.push({
          type: 'surge',
          factor: 1 + (surge / 100),
          reason: `High demand (${Math.round(occupancy * 100)}% full)`,
          contribution: surge,
        });
        adjustment += surge;
      }
    }

    // Calculate final price
    let dynamicPrice = basePrice;
    for (const mod of modifiers) {
      dynamicPrice *= mod.factor;
    }
    dynamicPrice = Math.round(dynamicPrice);

    return {
      itemId,
      basePrice,
      dynamicPrice,
      adjustment,
      adjustmentType,
      modifiers,
      factors: modifiers.map(m => ({
        name: m.type,
        reason: m.reason,
        contribution: m.contribution,
      })),
    };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  private categorizeFactor(category: string): PriceModifier['type'] {
    if (category.includes('surge') || category.includes('demand')) return 'surge';
    if (category.includes('discount')) return 'discount';
    if (category.includes('loyalty')) return 'loyalty';
    if (category.includes('bundle')) return 'bundle';
    return 'time_based';
  }

  private getSegmentDefaultRate(segment: string): number {
    const rates: Record<string, number> = {
      new: 0.15,
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      dormant: 0.10,
    };
    return rates[segment] || 0.05;
  }
}

// Singleton instance
let pricingServiceInstance: RevenueAIPricingService | null = null;

export function getRevenueAIPricingService(): RevenueAIPricingService {
  if (!pricingServiceInstance) {
    pricingServiceInstance = new RevenueAIPricingService();
  }
  return pricingServiceInstance;
}

export default RevenueAIPricingService;
