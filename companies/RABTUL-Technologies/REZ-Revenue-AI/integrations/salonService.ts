/**
 * REZ Revenue AI - Salon Integration
 *
 * Connects Salon services to REZ Revenue AI
 * Enables slot-based surge pricing and service bundling
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

/**
 * Salon Revenue AI Integration
 */
export class SalonRevenueIntegration {
  /**
   * Calculate dynamic service price based on slot availability
   */
  async calculateServicePrice(params: {
    serviceId: string;
    serviceName: string;
    category: string;
    basePrice: number;
    cost: number;
    slot: Date;
    stylistId?: string;
    slotsRemaining?: number;
    totalSlots?: number;
    customerId?: string;
    customerSegment?: string;
  }): Promise<{
    serviceId: string;
    basePrice: number;
    dynamicPrice: number;
    adjustment: number;
    adjustmentType: string;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.serviceId,
            type: 'service',
            category: params.category,
            vertical: 'salon',
            name: params.serviceName,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.slot.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.slot.getHours(),
            isPeakHour: this.isPeakHour(params.slot),
            isWeekend: params.slot.getDay() === 0 || params.slot.getDay() === 6,
          },
          inventory: params.slotsRemaining !== undefined ? {
            slotsRemaining: params.slotsRemaining,
            totalSlots: params.totalSlots,
          } : undefined,
          audience: params.customerId ? {
            userId: params.customerId,
            segment: params.customerSegment as any,
          } : undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          serviceId: params.serviceId,
          basePrice: params.basePrice,
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors?.map((f: any) => ({
            name: f.name,
            reason: f.reason,
            contribution: f.contribution,
          })) || [],
        };
      }
    } catch (error) {
      logger.warn('[RevenueAI] Salon pricing failed');
    }

    return this.localFallback(params);
  }

  /**
   * Calculate bundle pricing
   */
  async calculateBundlePrice(params: {
    services: Array<{ id: string; price: number }>;
    discountPercent: number;
  }): Promise<{
    originalTotal: number;
    bundlePrice: number;
    savings: number;
    discountPercent: number;
  }> {
    const originalTotal = params.services.reduce((sum, s) => sum + s.price, 0);
    const bundlePrice = originalTotal * (1 - params.discountPercent / 100);

    return {
      originalTotal,
      bundlePrice: Math.round(bundlePrice),
      savings: originalTotal - bundlePrice,
      discountPercent: params.discountPercent,
    };
  }

  /**
   * Get slot recommendations
   */
  async getSlotRecommendations(params: {
    serviceId: string;
    preferredDate: Date;
    preferredTime?: number;
  }): Promise<Array<{ slot: Date; price: number; surcharge: number }>> {
    const slots = [];
    const preferredHour = params.preferredTime || 14;

    // Check different slots
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(params.preferredDate);
      date.setDate(date.getDate() + dayOffset);

      for (const hour of [10, 11, preferredHour, 15, 16, 18, 19]) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);

        const price = await this.calculateServicePrice({
          serviceId: params.serviceId,
          serviceName: 'Service',
          category: 'general',
          basePrice: 500,
          cost: 200,
          slot: slotDate,
        });

        slots.push({
          slot: slotDate,
          price: price.dynamicPrice,
          surcharge: price.adjustment,
        });
      }
    }

    return slots
      .filter(s => s.surcharge <= 0)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
  }

  private isPeakHour(slot: Date): boolean {
    const hour = slot.getHours();
    return [10, 11, 18, 19, 20].includes(hour);
  }

  private localFallback(params: any): any {
    const factors = [];
    let adjustment = 0;
    const hour = params.slot.getHours();

    if (this.isPeakHour(params.slot)) {
      factors.push({ name: 'Peak Hour', reason: 'High demand time slot', contribution: 20 });
      adjustment += 20;
    }

    if (params.slot.getDay() === 5 || params.slot.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Saturday pricing', contribution: 15 });
      adjustment += 15;
    }

    if (params.slotsRemaining !== undefined && params.slotsRemaining < 3) {
      factors.push({ name: 'Limited Slots', reason: 'Few slots remaining', contribution: 10 });
      adjustment += 10;
    }

    return {
      serviceId: params.serviceId,
      basePrice: params.basePrice,
      dynamicPrice: Math.round(params.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : 'none',
      factors,
    };
  }
}

export const salonRevenue = new SalonRevenueIntegration();
export default SalonRevenueIntegration;
