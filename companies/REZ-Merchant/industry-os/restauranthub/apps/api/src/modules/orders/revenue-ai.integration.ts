/**
 * REZ Revenue AI - Restaurant Hub Integration
 *
 * Add this to orders.service.ts to enable dynamic pricing:
 *
 * 1. Import: import { RevenueAIIntegration } from './revenue-ai.integration';
 * 2. Add to constructor: this.revenueAI = new RevenueAIIntegration();
 * 3. Replace validateAndCalculateTotals with dynamic pricing
 */

import axios from 'axios';

// REZ Revenue AI URL
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  basePrice: number;
  cost: number;
  quantity: number;
}

export interface DynamicPricingResult {
  items: Array<{
    item: OrderItem;
    originalPrice: number;
    dynamicPrice: number;
    adjustment: number;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }>;
  subtotal: number;
  totalAdjustment: number;
  grandTotal: number;
  cashback: {
    amount: number;
    rate: number;
    reason: string;
  };
}

export interface PricingContext {
  time: Date;
  tableId?: string;
  customerId?: string;
  customerSegment?: string;
  restaurantId?: string;
}

/**
 * Revenue AI Integration for Restaurant Hub
 */
export class RevenueAIIntegration {
  /**
   * Calculate dynamic prices for all order items
   */
  async calculateDynamicPricing(
    items: OrderItem[],
    context: PricingContext
  ): Promise<DynamicPricingResult> {
    const pricedItems = [];
    let subtotal = 0;
    let totalAdjustment = 0;

    for (const item of items) {
      const price = await this.calculateItemPrice(item, context);
      pricedItems.push({
        item,
        originalPrice: item.basePrice,
        dynamicPrice: price.dynamicPrice,
        adjustment: price.adjustment,
        factors: price.factors,
      });
      subtotal += price.dynamicPrice * item.quantity;
      totalAdjustment += price.adjustment;
    }

    // Calculate cashback
    const customerSegment = context.customerSegment || 'regular';
    const cashback = this.calculateCashback(subtotal, customerSegment);

    return {
      items: pricedItems,
      subtotal,
      totalAdjustment,
      grandTotal: subtotal, // + GST added later
      cashback,
    };
  }

  /**
   * Calculate dynamic price for single item
   */
  async calculateItemPrice(
    item: OrderItem,
    context: PricingContext
  ): Promise<{
    dynamicPrice: number;
    adjustment: number;
    adjustmentType: string;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/pricing/calculate`,
        {
          context: {
            entity: {
              id: item.productId,
              type: 'product',
              category: item.category,
              vertical: 'restaurant',
              name: item.productName,
              basePrice: item.basePrice,
              cost: item.cost,
            },
            time: {
              dayOfWeek: context.time.getDay(),
              hourOfDay: context.time.getHours(),
              isPeakHour: this.isPeakHour(context.time),
              isWeekend: this.isWeekend(context.time),
            },
            audience: context.customerId ? {
              segment: context.customerSegment,
            } : undefined,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors || [],
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Dynamic pricing failed, using base price');
    }

    // Fallback to base price
    return {
      dynamicPrice: item.basePrice,
      adjustment: 0,
      adjustmentType: 'none',
      factors: [],
    };
  }

  /**
   * Calculate cashback based on customer segment
   */
  private calculateCashback(orderValue: number, segment: string): {
    amount: number;
    rate: number;
    reason: string;
  } {
    const rates: Record<string, { rate: number; reason: string }> = {
      new: { rate: 0.15, reason: 'Welcome cashback!' },
      regular: { rate: 0.05, reason: 'Loyalty reward' },
      vip: { rate: 0.03, reason: 'VIP bonus' },
      at_risk: { rate: 0.15, reason: 'We miss you!' },
      dormant: { rate: 0.10, reason: 'Happy to see you!' },
    };

    const config = rates[segment] || rates.regular;
    return {
      amount: Math.round(orderValue * config.rate),
      rate: config.rate,
      reason: config.reason,
    };
  }

  /**
   * Check if peak hour
   */
  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  /**
   * Check if weekend
   */
  private isWeekend(time: Date): boolean {
    const day = time.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Get demand forecast for restaurant
   */
  async getDemandForecast(restaurantId: string): Promise<{
    peakHour: number;
    avgDemand: number;
    peakDay: string;
    staffingRecommendation: { morning: number; evening: number };
  }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/forecast`,
        {
          merchantId: restaurantId,
          vertical: 'restaurant',
          category: 'general',
          location: {},
          horizon: 'week',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

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
      staffingRecommendation: { morning: 4, evening: 7 },
    };
  }

  /**
   * Get benchmark score
   */
  async getBenchmark(restaurantId: string): Promise<{
    overallScore: number;
    percentile: string;
    letterGrade: string;
  }> {
    try {
      const response = await axios.get(
        `${REVENUE_AI_URL}/api/v1/benchmarks/${restaurantId}`,
        {
          headers: {
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Benchmark failed');
    }

    return {
      overallScore: 70,
      percentile: 'Top 50%',
      letterGrade: 'B',
    };
  }

  /**
   * Credit cashback to customer wallet
   */
  async creditCashback(params: {
    userId: string;
    amount: number;
    reason: string;
    restaurantId: string;
    orderId: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/rabtul/wallet/credit`,
        {
          userId: params.userId,
          amount: params.amount,
          type: 'cashback',
          reason: params.reason,
          metadata: {
            restaurantId: params.restaurantId,
            orderId: params.orderId,
            source: 'revenue_ai_dynamic_pricing',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.data.transactionId,
        };
      }
    } catch (error) {
      console.error('[RevenueAI] Cashback credit failed', error);
    }

    return { success: false };
  }
}

// Singleton export
export const revenueAI = new RevenueAIIntegration();
export default RevenueAIIntegration;
