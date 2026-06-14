/**
 * REZ Revenue AI - Hotel Integration
 *
 * Connects Hotel services to REZ Revenue AI
 * Enables dynamic room rates, seasonal pricing, and occupancy forecasting
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

export interface RoomPricingParams {
  roomId: string;
  roomType: string;
  baseRate: number;
  cost: number;
  checkIn: Date;
  checkOut: Date;
  availableRooms?: number;
  totalRooms?: number;
  guestId?: string;
  guestSegment?: 'new' | 'regular' | 'vip' | 'corporate';
  city?: string;
  tier?: 1 | 2 | 3;
}

export interface RoomPricingResult {
  roomId: string;
  baseRate: number;
  dynamicRate: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'seasonal' | 'last_minute' | 'early_bird' | 'none';
  factors: Array<{ name: string; reason: string; contribution: number }>;
  alternatives?: Array<{ label: string; price: number }>;
}

export interface SeasonalPricing {
  season: 'low' | 'shoulder' | 'peak';
  multiplier: number;
  recommendedRate: number;
}

/**
 * Hotel Revenue AI Integration
 */
export class HotelRevenueIntegration {
  /**
   * Calculate dynamic room rate
   */
  async calculateRoomRate(params: RoomPricingParams): Promise<RoomPricingResult> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.roomId,
            type: 'room',
            category: params.roomType,
            vertical: 'hotel',
            name: params.roomType,
            basePrice: params.baseRate,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.checkIn.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.checkIn.getHours(),
            isWeekend: this.isWeekend(params.checkIn),
            season: this.getSeason(params.checkIn),
            isHoliday: await this.isHoliday(params.checkIn),
          },
          inventory: params.availableRooms !== undefined ? {
            slotsRemaining: params.availableRooms,
            totalSlots: params.totalRooms,
          } : undefined,
          audience: params.guestId ? {
            userId: params.guestId,
            segment: params.guestSegment,
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
          roomId: params.roomId,
          baseRate: params.baseRate,
          dynamicRate: data.finalPrice,
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
      logger.warn('[RevenueAI] Hotel pricing failed, using fallback');
    }

    return this.calculateLocalFallback(params);
  }

  /**
   * Get seasonal pricing
   */
  async getSeasonalPricing(merchantId: string, month: number): Promise<SeasonalPricing> {
    const season = this.getSeasonFromMonth(month);

    const multipliers: Record<string, number> = {
      low: 0.8,
      shoulder: 1.0,
      peak: 1.5,
    };

    return {
      season,
      multiplier: multipliers[season],
      recommendedRate: 0, // Would calculate from base rate
    };
  }

  /**
   * Get occupancy forecast
   */
  async getOccupancyForecast(merchantId: string, horizon: 'day' | 'week' | 'month' = 'week') {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: 'hotel',
        category: 'rooms',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      logger.warn('[RevenueAI] Hotel forecast failed');
    }

    return {
      forecasts: [],
      summary: { avgOccupancy: 65, peakDay: 'Saturday' },
    };
  }

  /**
   * Get competitive pricing
   */
  async getCompetitiveRate(merchantId: string, roomType: string, date: Date): Promise<number> {
    // Would integrate with competitive intelligence
    return 0; // Placeholder
  }

  private calculateLocalFallback(params: RoomPricingParams): RoomPricingResult {
    const factors: Array<{ name: string; reason: string; contribution: number }> = [];
    let adjustment = 0;

    // Weekend
    if (params.checkIn.getDay() === 5 || params.checkIn.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Saturday check-in', contribution: 15 });
      adjustment += 15;
    }

    // Season
    const season = this.getSeason(params.checkIn);
    if (season === 'peak') {
      factors.push({ name: 'Peak Season', reason: 'Festival period', contribution: 40 });
      adjustment += 40;
    } else if (season === 'low') {
      factors.push({ name: 'Low Season', reason: 'Off-peak period', contribution: -20 });
      adjustment -= 20;
    }

    // Occupancy surge
    if (params.availableRooms !== undefined && params.totalRooms) {
      const occupancy = 1 - (params.availableRooms / params.totalRooms);
      if (occupancy > 0.8) {
        factors.push({ name: 'High Demand', reason: `${Math.round(occupancy * 100)}% occupancy`, contribution: 20 });
        adjustment += 20;
      }
    }

    // Early bird discount
    const daysUntilCheckIn = Math.ceil((params.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckIn > 30) {
      factors.push({ name: 'Early Bird', reason: '30+ days advance booking', contribution: -15 });
      adjustment -= 15;
    }

    const multiplier = 1 + (adjustment / 100);
    return {
      roomId: params.roomId,
      baseRate: params.baseRate,
      dynamicRate: Math.round(params.baseRate * multiplier),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : adjustment < 0 ? 'discount' : 'none',
      factors,
    };
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 5 || day === 6;
  }

  private getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getSeasonFromMonth(month: number): 'low' | 'shoulder' | 'peak' {
    if (month >= 1 && month <= 2) return 'low';
    if (month >= 3 && month <= 5) return 'shoulder';
    if (month >= 6 && month <= 8) return 'peak';
    if (month >= 9 && month <= 11) return 'shoulder';
    return 'peak'; // December
  }

  private async isHoliday(date: Date): Promise<boolean> {
    // Check against known holidays
    return false; // Placeholder
  }
}

let instance: HotelRevenueIntegration | null = null;

export function getHotelRevenueIntegration(): HotelRevenueIntegration {
  if (!instance) {
    instance = new HotelRevenueIntegration();
  }
  return instance;
}

export default HotelRevenueIntegration;
