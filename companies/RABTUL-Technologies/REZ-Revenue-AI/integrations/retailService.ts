/**
 * REZ Revenue AI - Retail Integration
 *
 * Connects Retail POS services to REZ Revenue AI
 * Enables inventory pricing, flash sales, and clearance optimization
 */

import axios from 'axios';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

export class RetailRevenueIntegration {
  /**
   * Calculate dynamic product price
   */
  async calculateProductPrice(params: {
    productId: string;
    productName: string;
    category: string;
    basePrice: number;
    cost: number;
    stockLevel: number;
    maxStock: number;
    daysUntilExpiry?: number;
    isOnSale?: boolean;
    customerSegment?: string;
    time?: Date;
  }): Promise<{
    originalPrice: number;
    dynamicPrice: number;
    adjustment: number;
    adjustmentType: string;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }> {
    const now = params.time || new Date();

    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.productId,
            type: 'product',
            category: params.category,
            vertical: 'retail',
            name: params.productName,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: now.getHours(),
            isPeakHour: [10, 11, 17, 18].includes(now.getHours()),
            isWeekend: now.getDay() === 0 || now.getDay() === 6,
          },
          inventory: {
            level: params.stockLevel,
            percentage: (params.stockLevel / params.maxStock) * 100,
            daysUntilExpiry: params.daysUntilExpiry,
          },
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          originalPrice: params.basePrice,
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors || [],
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Retail pricing failed');
    }

    return this.localFallback(params);
  }

  /**
   * Calculate clearance price for expiring inventory
   */
  async calculateClearancePrice(params: {
    productId: string;
    basePrice: number;
    cost: number;
    daysUntilExpiry: number;
    stockLevel: number;
  }): Promise<{
    originalPrice: number;
    clearancePrice: number;
    discount: number;
    maxDiscount: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }> {
    // Urgency based on expiry
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    let minDiscount: number;
    let recommendation: string;

    if (params.daysUntilExpiry <= 1) {
      urgency = 'critical';
      minDiscount = 50;
      recommendation = 'Clear immediately - sell at 50%+ discount';
    } else if (params.daysUntilExpiry <= 3) {
      urgency = 'high';
      minDiscount = 35;
      recommendation = 'Start clearance - aim for 35-50% off';
    } else if (params.daysUntilExpiry <= 7) {
      urgency = 'medium';
      minDiscount = 20;
      recommendation = 'Consider promotion - 20-35% off';
    } else {
      urgency = 'low';
      minDiscount = 10;
      recommendation = 'Minor discount - 10-20% off';
    }

    // Stock pressure
    if (params.stockLevel > 100) {
      recommendation += ' (High stock - increase discount)';
    }

    const clearancePrice = Math.round(params.basePrice * (1 - minDiscount / 100));

    return {
      originalPrice: params.basePrice,
      clearancePrice,
      discount: minDiscount,
      maxDiscount: 70, // Don't go below cost
      urgency,
      recommendation,
    };
  }

  /**
   * Calculate flash sale price
   */
  async calculateFlashSalePrice(params: {
    productId: string;
    basePrice: number;
    discountPercent: number;
    startTime: Date;
    endTime: Date;
  }): Promise<{
    originalPrice: number;
    salePrice: number;
    discount: number;
    hoursRemaining: number;
    urgency: 'hot' | 'ending' | 'upcoming';
  }> {
    const now = new Date();
    const hoursRemaining = (params.endTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let urgency: 'hot' | 'ending' | 'upcoming';
    if (params.startTime > now) {
      urgency = 'upcoming';
    } else if (hoursRemaining < 2) {
      urgency = 'ending';
    } else {
      urgency = 'hot';
    }

    return {
      originalPrice: params.basePrice,
      salePrice: Math.round(params.basePrice * (1 - params.discountPercent / 100)),
      discount: params.discountPercent,
      hoursRemaining: Math.max(0, Math.round(hoursRemaining)),
      urgency,
    };
  }

  /**
   * Get inventory demand forecast
   */
  async getInventoryForecast(merchantId: string, horizon: 'day' | 'week' = 'week') {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: 'retail',
        category: 'inventory',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Retail forecast failed');
    }

    return {
      forecasts: [],
      summary: { avgDailySales: 50, peakHour: 18 },
    };
  }

  /**
   * Calculate bundle discount
   */
  async calculateBundlePrice(products: Array<{
    id: string;
    price: number;
  }>, discountPercent: number = 15): Promise<{
    originalTotal: number;
    bundlePrice: number;
    savings: number;
    discount: number;
  }> {
    const originalTotal = products.reduce((sum, p) => sum + p.price, 0);
    const bundlePrice = Math.round(originalTotal * (1 - discountPercent / 100));

    return {
      originalTotal,
      bundlePrice,
      savings: originalTotal - bundlePrice,
      discount: discountPercent,
    };
  }

  private localFallback(params: any): any {
    const factors = [];
    let adjustment = 0;

    // Stock pressure
    const stockPercent = (params.stockLevel / params.maxStock) * 100;
    if (stockPercent > 80) {
      factors.push({ name: 'High Stock', reason: 'Inventory pressure', contribution: -10 });
      adjustment -= 10;
    } else if (stockPercent < 20) {
      factors.push({ name: 'Low Stock', reason: 'Scarcity premium', contribution: 15 });
      adjustment += 15;
    }

    // Expiry urgency
    if (params.daysUntilExpiry && params.daysUntilExpiry <= 7) {
      const discount = Math.min(50, (7 - params.daysUntilExpiry) * 7);
      factors.push({ name: 'Expiry Soon', reason: `${params.daysUntilExpiry} days left`, contribution: -discount });
      adjustment -= discount;
    }

    // Weekend shopping
    if (params.time) {
      const day = params.time.getDay();
      if (day === 0 || day === 6) {
        factors.push({ name: 'Weekend', reason: 'Higher footfall', contribution: 5 });
        adjustment += 5;
      }
    }

    return {
      originalPrice: params.basePrice,
      dynamicPrice: Math.round(params.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : adjustment < 0 ? 'discount' : 'none',
      factors,
    };
  }
}

export const retailRevenue = new RetailRevenueIntegration();
export default RetailRevenueIntegration;
