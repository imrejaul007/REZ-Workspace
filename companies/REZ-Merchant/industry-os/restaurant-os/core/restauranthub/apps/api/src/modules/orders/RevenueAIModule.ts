/**
 * REZ Revenue AI - NestJS Module for Restaurant Hub
 *
 * Add this module to enable dynamic pricing in orders:
 *
 * 1. Import in app.module.ts:
 *    RevenueAIModule.register()
 *
 * 2. Inject in OrdersService:
 *    constructor(
 *      private revenueAI: RevenueAIModule,
 *    ) {}
 *
 * 3. Use in createOrder:
 *    const result = await this.revenueAI.executeOrderPricing(orderData);
 */

import { Module, Global } from '@nestjs/common';
import axios from 'axios';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

export interface OrderPricingInput {
  restaurantId: string;
  userId?: string;
  customerSegment?: string;
  items: Array<{
    productId: string;
    productName: string;
    category: string;
    basePrice: number;
    cost: number;
    quantity: number;
  }>;
}

export interface PricingResult {
  items: Array<{
    productId: string;
    originalPrice: number;
    dynamicPrice: number;
    adjustment: number;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }>;
  subtotal: number;
  totalAdjustment: number;
  gstAmount: number;
  grandTotal: number;
  cashback: {
    amount: number;
    rate: number;
    reason: string;
  };
}

@Global()
@Module({})
export class RevenueAIModule {
  /**
   * Execute dynamic pricing for an order
   */
  async executeOrderPricing(input: OrderPricingInput): Promise<PricingResult> {
    const pricedItems = [];
    let subtotal = 0;
    let totalAdjustment = 0;

    for (const item of input.items) {
      try {
        const price = await this.getDynamicPrice({
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          basePrice: item.basePrice,
          cost: item.cost,
          restaurantId: input.restaurantId,
        });

        pricedItems.push({
          productId: item.productId,
          originalPrice: item.basePrice,
          dynamicPrice: price.dynamicPrice,
          adjustment: price.adjustment,
          factors: price.factors,
        });

        subtotal += price.dynamicPrice * item.quantity;
        totalAdjustment += price.adjustment;
      } catch (e) {
        // Fallback to base price
        pricedItems.push({
          productId: item.productId,
          originalPrice: item.basePrice,
          dynamicPrice: item.basePrice,
          adjustment: 0,
          factors: [],
        });
        subtotal += item.basePrice * item.quantity;
      }
    }

    // Calculate cashback
    const segment = input.customerSegment || 'regular';
    const cashback = this.calculateCashback(subtotal, segment);

    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;

    return {
      items: pricedItems,
      subtotal,
      totalAdjustment,
      gstAmount,
      grandTotal: subtotal + gstAmount,
      cashback,
    };
  }

  /**
   * Get dynamic price from REZ Revenue AI
   */
  private async getDynamicPrice(params: {
    productId: string;
    productName: string;
    category: string;
    basePrice: number;
    cost: number;
    restaurantId: string;
  }): Promise<{ dynamicPrice: number; adjustment: number; factors: any[] }> {
    const now = new Date();

    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/pricing/calculate`,
        {
          context: {
            entity: {
              id: params.productId,
              type: 'product',
              category: params.category,
              vertical: 'restaurant',
              name: params.productName,
              basePrice: params.basePrice,
              cost: params.cost,
            },
            time: {
              dayOfWeek: now.getDay(),
              hourOfDay: now.getHours(),
              isPeakHour: this.isPeakHour(now),
              isWeekend: now.getDay() === 0 || now.getDay() === 6,
            },
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
        return {
          dynamicPrice: response.data.data.finalPrice,
          adjustment: response.data.data.adjustment,
          factors: response.data.data.factors || [],
        };
      }
    } catch (e) {
      console.warn('[RevenueAI] Pricing call failed:', e.message);
    }

    return {
      dynamicPrice: params.basePrice,
      adjustment: 0,
      factors: [],
    };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  private calculateCashback(orderValue: number, segment: string): { amount: number; rate: number; reason: string } {
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
   * Credit cashback to customer wallet via RABTUL
   */
  async creditCashback(params: {
    userId: string;
    amount: number;
    reason: string;
    restaurantId: string;
    orderId: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    if (params.amount <= 0) return { success: false };

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
            source: 'restaurant_hub_dynamic_pricing',
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
          transactionId: response.data.data?.transactionId,
        };
      }
    } catch (e) {
      console.error('[RevenueAI] Cashback failed:', e.message);
    }

    return { success: false };
  }

  /**
   * Get demand forecast for staffing
   */
  async getStaffingRecommendation(restaurantId: string): Promise<{
    peakHour: number;
    morningStaff: number;
    eveningStaff: number;
  }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/forecast`,
        {
          merchantId: restaurantId,
          vertical: 'restaurant',
          category: 'general',
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
        const demand = data.forecasts?.[0]?.totalDemand || 60;
        return {
          peakHour: data.forecasts?.[0]?.peakHour || 19,
          morningStaff: Math.ceil(demand / 20),
          eveningStaff: Math.ceil(demand / 10),
        };
      }
    } catch (e) {
      console.warn('[RevenueAI] Forecast failed:', e.message);
    }

    return { peakHour: 19, morningStaff: 4, eveningStaff: 7 };
  }

  /**
   * Chat with MerchantGPT
   */
  async chat(restaurantId: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/agent/chat`,
        {
          merchantId: restaurantId,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        return response.data.data.response;
      }
    } catch (e) {
      console.error('[RevenueAI] Chat failed:', e.message);
    }

    return 'Unable to get AI response at this time.';
  }

  /**
   * Get benchmark score
   */
  async getBenchmark(restaurantId: string): Promise<{
    score: number;
    grade: string;
    percentile: string;
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
        return {
          score: response.data.data.overallScore,
          grade: response.data.data.letterGrade,
          percentile: response.data.data.percentile,
        };
      }
    } catch (e) {
      console.warn('[RevenueAI] Benchmark failed:', e.message);
    }

    return { score: 70, grade: 'B', percentile: 'Top 50%' };
  }
}

// Singleton
export const revenueAI = new RevenueAIModule();

export default RevenueAIModule;
