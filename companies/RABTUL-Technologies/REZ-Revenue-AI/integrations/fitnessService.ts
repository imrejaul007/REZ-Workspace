/**
 * REZ Revenue AI - Fitness Integration
 *
 * Connects Fitness services to REZ Revenue AI
 * Enables class-based pricing and membership optimization
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

/**
 * Fitness Revenue AI Integration
 */
export class FitnessRevenueIntegration {
  /**
   * Calculate dynamic class pricing
   */
  async calculateClassPrice(params: {
    classId: string;
    className: string;
    category: string;
    basePrice: number;
    cost: number;
    classTime: Date;
    capacityRemaining?: number;
    totalCapacity?: number;
    memberId?: string;
    membershipTier?: string;
  }): Promise<{
    classId: string;
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
            id: params.classId,
            type: 'service',
            category: params.category,
            vertical: 'gym',
            name: params.className,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.classTime.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.classTime.getHours(),
            isPeakHour: this.isPeakHour(params.classTime),
            isWeekend: params.classTime.getDay() === 0 || params.classTime.getDay() === 6,
          },
          inventory: params.capacityRemaining !== undefined ? {
            slotsRemaining: params.capacityRemaining,
            totalSlots: params.totalCapacity,
          } : undefined,
          audience: params.memberId ? {
            userId: params.memberId,
            segment: this.membershipToSegment(params.membershipTier),
          } : undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        return {
          classId: params.classId,
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
      logger.warn('[RevenueAI] Fitness pricing failed');
    }

    return this.localFallback(params);
  }

  /**
   * Get membership tier pricing
   */
  async getMembershipPricing(params: {
    memberId: string;
    currentTier: string;
    visitsThisMonth: number;
  }): Promise<{
    currentTier: string;
    recommendedTier: string;
    upgradeValue: number;
    discount: number;
  }> {
    // Calculate if upgrade makes sense
    const tierDiscounts: Record<string, number> = {
      basic: 0,
      silver: 10,
      gold: 20,
      platinum: 30,
    };

    const tiers = ['basic', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(params.currentTier);
    const nextTier = tiers[currentIndex + 1] || params.currentTier;

    return {
      currentTier: params.currentTier,
      recommendedTier: nextTier,
      upgradeValue: tierDiscounts[nextTier] - tierDiscounts[params.currentTier],
      discount: tierDiscounts[params.currentTier],
    };
  }

  /**
   * Get class demand forecast
   */
  async getClassDemandForecast(classId: string, horizon: 'day' | 'week' = 'week') {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId: classId,
        vertical: 'gym',
        category: 'classes',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      logger.warn('[RevenueAI] Fitness forecast failed');
    }

    return { forecasts: [], summary: { avgDemand: 70 } };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return [7, 8, 9, 18, 19, 20].includes(hour);
  }

  private membershipToSegment(tier?: string): 'new' | 'regular' | 'vip' | 'at_risk' {
    if (!tier) return 'regular';
    if (tier === 'platinum' || tier === 'gold') return 'vip';
    if (tier === 'inactive') return 'at_risk';
    return 'regular';
  }

  private localFallback(params: any): any {
    const factors = [];
    let adjustment = 0;

    if (this.isPeakHour(params.classTime)) {
      factors.push({ name: 'Peak Hour', reason: 'Morning/Evening rush', contribution: 15 });
      adjustment += 15;
    }

    if (params.capacityRemaining !== undefined && params.capacityRemaining < 5) {
      factors.push({ name: 'Almost Full', reason: 'Limited spots left', contribution: 10 });
      adjustment += 10;
    }

    if (params.membershipTier === 'platinum') {
      factors.push({ name: 'VIP', reason: 'Platinum member discount', contribution: -10 });
      adjustment -= 10;
    }

    return {
      classId: params.classId,
      basePrice: params.basePrice,
      dynamicPrice: Math.round(params.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : adjustment < 0 ? 'loyalty' : 'none',
      factors,
    };
  }
}

export const fitnessRevenue = new FitnessRevenueIntegration();
export default FitnessRevenueIntegration;
