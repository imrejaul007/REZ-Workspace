/**
 * REZ Revenue AI - Ride/Hyperlocal Integration
 *
 * Connects Ride and Hyperlocal services to REZ Revenue AI
 * Enables surge pricing, rental optimization, delivery pricing
 */

import axios from 'axios';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

export class RideRevenueIntegration {
  /**
   * Calculate dynamic ride fare
   */
  async calculateRideFare(params: {
    vehicleType: 'auto' | 'bike' | 'cab' | 'suv';
    baseFare: number;
    perKmRate: number;
    perMinRate: number;
    distance: number;
    duration: number;
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    weather?: 'clear' | 'rainy' | 'stormy';
    nearbyEvents?: number;
    time?: Date;
    customerSegment?: string;
  }): Promise<{
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    totalFare: number;
    surgeMultiplier: number;
    surgeFactors: Array<{ name: string; contribution: number }>;
  }> {
    const now = params.time || new Date();

    // Calculate base fare
    const distanceFare = params.distance * params.perKmRate;
    const timeFare = params.duration * params.perMinRate;

    // Calculate surge
    let surgeMultiplier = 1;
    const surgeFactors: Array<{ name: string; contribution: number }> = [];

    // Peak hour surge
    const hour = now.getHours();
    if ((hour >= 9 && hour <= 11) || (hour >= 18 && hour <= 21)) {
      const peakSurge = 1.3;
      surgeMultiplier *= peakSurge;
      surgeFactors.push({ name: 'Peak Hours', contribution: 30 });
    }

    // Weekend surge
    const day = now.getDay();
    if (day === 0 || day === 6) {
      surgeMultiplier *= 1.15;
      surgeFactors.push({ name: 'Weekend', contribution: 15 });
    }

    // Weather surge
    if (params.weather === 'rainy') {
      surgeMultiplier *= 1.4;
      surgeFactors.push({ name: 'Rain', contribution: 40 });
    } else if (params.weather === 'stormy') {
      surgeMultiplier *= 1.6;
      surgeFactors.push({ name: 'Storm', contribution: 60 });
    }

    // Event surge
    if (params.nearbyEvents && params.nearbyEvents > 0) {
      const eventSurge = 1 + (params.nearbyEvents * 0.15);
      surgeMultiplier *= eventSurge;
      surgeFactors.push({ name: 'Nearby Events', contribution: params.nearbyEvents * 15 });
    }

    // Cap surge at 3x
    surgeMultiplier = Math.min(surgeMultiplier, 3);

    const baseTotal = params.baseFare + distanceFare + timeFare;
    const surgeFare = Math.round(baseTotal * (surgeMultiplier - 1));
    const totalFare = Math.round(baseTotal * surgeMultiplier);

    return {
      baseFare: params.baseFare,
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      surgeFare,
      totalFare,
      surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
      surgeFactors,
    };
  }

  /**
   * Calculate rental pricing
   */
  async calculateRentalPrice(params: {
    vehicleType: 'bike' | 'auto' | 'car' | 'suv';
    baseHourlyRate: number;
    hours: number;
    dailyRate?: number;
    time?: Date;
  }): Promise<{
    hourlyRate: number;
    totalRate: number;
    discount: number;
    adjustedRate: number;
    factors: Array<{ name: string; contribution: number }>;
  }> {
    const now = params.time || new Date();
    const day = now.getDay();

    let adjustedRate = params.baseHourlyRate;
    const factors: Array<{ name: string; contribution: number }> = [];

    // Weekend pricing
    if (day === 0 || day === 6) {
      adjustedRate *= 1.2;
      factors.push({ name: 'Weekend', contribution: 20 });
    }

    // Multi-day discount
    let discount = 0;
    if (params.hours >= 24) {
      // Daily rate discount
      discount = params.dailyRate ? 20 : 10;
    } else if (params.hours >= 8) {
      // Half day discount
      discount = 15;
    }

    if (discount > 0) {
      factors.push({ name: 'Long-term Discount', contribution: -discount });
    }

    const totalRate = Math.round(adjustedRate * params.hours * (1 - discount / 100));

    return {
      hourlyRate: params.baseHourlyRate,
      totalRate: Math.round(params.baseHourlyRate * params.hours),
      discount,
      adjustedRate: Math.round(adjustedRate),
      factors,
    };
  }

  /**
   * Calculate delivery surge
   */
  async calculateDeliveryPrice(params: {
    baseDeliveryFee: number;
    distance: number;
    weight: number;
    restaurantBusy: boolean;
    time?: Date;
  }): Promise<{
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    surgeFee: number;
    totalFee: number;
    factors: Array<{ name: string; contribution: number }>;
  }> {
    const now = params.time || new Date();
    const hour = now.getHours();

    let surgeMultiplier = 1;
    const factors: Array<{ name: string; contribution: number }> = [];

    // Peak meal times
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      surgeMultiplier *= 1.3;
      factors.push({ name: 'Peak Hours', contribution: 30 });
    }

    // Restaurant busy
    if (params.restaurantBusy) {
      surgeMultiplier *= 1.15;
      factors.push({ name: 'High Demand', contribution: 15 });
    }

    // Weekend
    const day = now.getDay();
    if (day === 5 || day === 6) {
      surgeMultiplier *= 1.1;
      factors.push({ name: 'Weekend', contribution: 10 });
    }

    const distanceFee = Math.round(params.distance * 5); // ₹5 per km
    const weightFee = Math.round(params.weight * 2); // ₹2 per 500g
    const baseTotal = params.baseDeliveryFee + distanceFee + weightFee;
    const surgeFee = Math.round(baseTotal * (surgeMultiplier - 1));

    return {
      baseFee: params.baseDeliveryFee,
      distanceFee,
      weightFee,
      surgeFee,
      totalFee: Math.round(baseTotal * surgeMultiplier),
      factors,
    };
  }

  /**
   * Get demand forecast for rides
   */
  async getRideDemandForecast(merchantId: string, horizon: 'day' | 'week' = 'week') {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: 'ride',
        category: 'rides',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Ride forecast failed');
    }

    return {
      forecasts: [],
      summary: { avgDemand: 65, peakHour: 9 },
    };
  }

  /**
   * Calculate promotional cashback
   */
  async calculatePromoCashback(orderValue: number, segment: string) {
    const rates: Record<string, number> = {
      new: 0.20, // First ride bonus
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      inactive: 0.10,
    };

    const rate = rates[segment] || 0.05;

    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: segment === 'new' ? 'First ride bonus' : 'Ride cashback',
    };
  }
}

export const rideRevenue = new RideRevenueIntegration();
export default RideRevenueIntegration;
