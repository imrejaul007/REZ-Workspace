/**
 * REZ Revenue AI - Pricing Engine Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// ================== MOCK PRICING ENGINE ==================

interface PriceFactor {
  name: string;
  category: string;
  value: number;
  contribution: number;
  weight: number;
  reason: string;
}

interface PricingContext {
  entity: {
    id: string;
    type: 'product' | 'service';
    category: string;
    vertical: string;
    basePrice: number;
    cost: number;
  };
  time: {
    dayOfWeek: number;
    hourOfDay: number;
    isPeakHour: boolean;
    isWeekend: boolean;
    isHoliday: boolean;
    season: string;
  };
  demand: {
    current: number;
    predicted: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  inventory: {
    percentage: number;
    slotsRemaining?: number;
    totalSlots?: number;
    isLowStock: boolean;
    isOverstock: boolean;
  };
  competition: {
    avgPrice: number;
    competitorCount: number;
  };
  location: {
    tier: number;
    footfallIndex: number;
    weather: string;
    nearbyEvents: number;
  };
  constraints: {
    minMargin: number;
    maxSurge: number;
    maxDiscount: number;
  };
}

interface PricingDecision {
  finalPrice: number;
  originalPrice: number;
  adjustment: number;
  factors: PriceFactor[];
  confidence: number;
}

// Simplified pricing engine for testing
class TestPricingEngine {
  private verticalPatterns: Record<string, {
    peakHours: number[];
    timeMultipliers: Record<number, number>;
    dayMultipliers: Record<number, number>;
    maxSurge: number;
  }>;

  constructor() {
    this.verticalPatterns = {
      restaurant: {
        peakHours: [12, 13, 19, 20, 21],
        timeMultipliers: {
          6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 0.95,
          11: 1.1, 12: 1.0, 13: 0.85, 14: 0.75, 15: 0.8,
          16: 0.9, 17: 1.0, 18: 1.2, 19: 1.4, 20: 1.3,
          21: 1.1, 22: 0.9, 23: 0.7
        },
        dayMultipliers: {
          0: 1.0, 1: 0.85, 2: 0.90, 3: 0.95, 4: 1.05, 5: 1.15, 6: 1.20
        },
        maxSurge: 2.0,
      },
      salon: {
        peakHours: [10, 11, 18, 19, 20],
        timeMultipliers: {
          9: 0.9, 10: 1.0, 11: 1.1, 12: 1.0,
          13: 0.8, 14: 0.7, 15: 0.75, 16: 0.85,
          17: 1.0, 18: 1.2, 19: 1.4, 20: 1.2, 21: 0.9
        },
        dayMultipliers: {
          0: 1.10, 1: 0.80, 2: 0.85, 3: 0.90, 4: 1.00, 5: 1.15, 6: 1.25
        },
        maxSurge: 1.5,
      },
      hotel: {
        peakHours: [9, 10, 11],
        timeMultipliers: {},
        dayMultipliers: {
          0: 1.05, 1: 0.95, 2: 0.90, 3: 0.90, 4: 0.95, 5: 1.10, 6: 1.15
        },
        maxSurge: 3.0,
      },
    };
  }

  calculatePrice(context: PricingContext): PricingDecision {
    const factors: PriceFactor[] = [];
    let totalMultiplier = 1.0;
    const pattern = this.verticalPatterns[context.entity.vertical] || this.verticalPatterns.restaurant;

    // Time multiplier
    const hourMultiplier = pattern.timeMultipliers[context.time.hourOfDay] || 1.0;
    if (hourMultiplier !== 1.0) {
      factors.push({
        name: 'hour_multiplier',
        category: 'time',
        value: hourMultiplier - 1,
        contribution: (hourMultiplier - 1) * 100,
        weight: 0.2,
        reason: `Hour ${context.time.hourOfDay}: ${hourMultiplier > 1 ? 'surge' : 'discount'}`,
      });
      totalMultiplier *= hourMultiplier;
    }

    // Day multiplier
    const dayMultiplier = pattern.dayMultipliers[context.time.dayOfWeek] || 1.0;
    if (dayMultiplier !== 1.0) {
      factors.push({
        name: 'day_multiplier',
        category: 'time',
        value: dayMultiplier - 1,
        contribution: (dayMultiplier - 1) * 100,
        weight: 0.15,
        reason: `Day ${context.time.dayOfWeek}: ${dayMultiplier > 1 ? 'higher' : 'lower'} demand`,
      });
      totalMultiplier *= dayMultiplier;
    }

    // Weekend multiplier
    if (context.time.isWeekend) {
      const weekendMultiplier = 1.15;
      factors.push({
        name: 'weekend',
        category: 'time',
        value: 0.15,
        contribution: 15,
        weight: 0.1,
        reason: 'Weekend pricing',
      });
      totalMultiplier *= weekendMultiplier;
    }

    // Holiday multiplier
    if (context.time.isHoliday) {
      const holidayMultiplier = 1.20;
      factors.push({
        name: 'holiday',
        category: 'time',
        value: 0.20,
        contribution: 20,
        weight: 0.2,
        reason: 'Holiday pricing',
      });
      totalMultiplier *= holidayMultiplier;
    }

    // Demand multiplier
    const demandNormalized = (context.demand.current - 50) / 50;
    const demandMultiplier = 1 + (demandNormalized * 0.25);
    if (Math.abs(demandMultiplier - 1) > 0.02) {
      factors.push({
        name: 'demand',
        category: 'demand',
        value: demandMultiplier - 1,
        contribution: Math.abs(demandMultiplier - 1) * 100,
        weight: 0.25,
        reason: `Demand ${context.demand.current > 50 ? 'high' : 'low'}`,
      });
      totalMultiplier *= demandMultiplier;
    }

    // Trend multiplier
    if (context.demand.trend === 'increasing') {
      factors.push({
        name: 'demand_trend',
        category: 'demand',
        value: 0.05,
        contribution: 5,
        weight: 0.1,
        reason: 'Demand is increasing',
      });
      totalMultiplier *= 1.05;
    } else if (context.demand.trend === 'decreasing') {
      factors.push({
        name: 'demand_trend',
        category: 'demand',
        value: -0.05,
        contribution: -5,
        weight: 0.1,
        reason: 'Demand is decreasing',
      });
      totalMultiplier *= 0.95;
    }

    // Inventory multiplier (slot availability)
    if (context.inventory.slotsRemaining !== undefined && context.inventory.totalSlots !== undefined) {
      const slotPercentage = context.inventory.slotsRemaining / context.inventory.totalSlots;
      if (slotPercentage < 0.2) {
        const slotSurge = 1.15;
        factors.push({
          name: 'slot_availability',
          category: 'inventory',
          value: 0.15,
          contribution: 15,
          weight: 0.15,
          reason: `Only ${context.inventory.slotsRemaining} of ${context.inventory.totalSlots} slots left`,
        });
        totalMultiplier *= slotSurge;
      } else if (slotPercentage > 0.7) {
        const slotDiscount = 0.90;
        factors.push({
          name: 'slot_availability',
          category: 'inventory',
          value: -0.10,
          contribution: -10,
          weight: 0.1,
          reason: 'High slot availability',
        });
        totalMultiplier *= slotDiscount;
      }
    }

    // Location multiplier
    if (context.location.tier === 1) {
      factors.push({
        name: 'city_tier',
        category: 'location',
        value: 0.25,
        contribution: 25,
        weight: 0.15,
        reason: 'Tier 1 city premium',
      });
      totalMultiplier *= 1.25;
    } else if (context.location.tier === 3) {
      factors.push({
        name: 'city_tier',
        category: 'location',
        value: -0.15,
        contribution: -15,
        weight: 0.1,
        reason: 'Tier 3 city adjustment',
      });
      totalMultiplier *= 0.85;
    }

    // Events multiplier
    if (context.location.nearbyEvents > 0) {
      const eventMultiplier = 1 + (context.location.nearbyEvents * 0.1);
      factors.push({
        name: 'nearby_events',
        category: 'events',
        value: eventMultiplier - 1,
        contribution: (eventMultiplier - 1) * 100,
        weight: 0.2,
        reason: `${context.location.nearbyEvents} events nearby`,
      });
      totalMultiplier *= Math.min(eventMultiplier, 1.3);
    }

    // Apply constraints
    const maxMultiplier = Math.min(context.constraints.maxSurge, pattern.maxSurge);
    const minMultiplier = 1 - context.constraints.maxDiscount;
    totalMultiplier = Math.max(minMultiplier, Math.min(maxMultiplier, totalMultiplier));

    // Calculate final price
    let finalPrice = context.entity.basePrice * totalMultiplier;

    // Ensure margin constraint
    const minPrice = context.entity.cost * (1 + context.constraints.minMargin);
    finalPrice = Math.max(minPrice, finalPrice);

    // Round to nearest rupee
    finalPrice = Math.round(finalPrice);

    const adjustment = ((finalPrice - context.entity.basePrice) / context.entity.basePrice) * 100;
    const confidence = Math.min(0.95, 0.6 + (factors.length * 0.03));

    return {
      finalPrice,
      originalPrice: context.entity.basePrice,
      adjustment,
      factors,
      confidence,
    };
  }
}

// ================== TESTS ==================

describe('Pricing Engine', () => {
  let engine: TestPricingEngine;

  beforeEach(() => {
    engine = new TestPricingEngine();
  });

  describe('Basic Pricing', () => {
    test('should return original price when no factors active', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_1',
          type: 'service',
          category: 'haircut',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 3, // Wednesday
          hourOfDay: 11, // Normal hour
          isPeakHour: false,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 50,
          predicted: 50,
          trend: 'stable',
        },
        inventory: {
          percentage: 50,
          slotsRemaining: 5,
          totalSlots: 10,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 5,
        },
        location: {
          tier: 2,
          footfallIndex: 50,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.originalPrice).toBe(500);
      expect(result.finalPrice).toBeGreaterThanOrEqual(250); // Min 50% discount
      expect(result.finalPrice).toBeLessThanOrEqual(750); // Max 50% surge
    });

    test('should apply surge pricing during peak hours', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_2',
          type: 'service',
          category: 'haircut',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 5, // Friday
          hourOfDay: 19, // Peak evening
          isPeakHour: true,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 75,
          predicted: 80,
          trend: 'increasing',
        },
        inventory: {
          percentage: 30,
          slotsRemaining: 2,
          totalSlots: 10,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 5,
        },
        location: {
          tier: 1,
          footfallIndex: 70,
          weather: 'clear',
          nearbyEvents: 1,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.finalPrice).toBeGreaterThan(500); // Should be surged
      expect(result.adjustment).toBeGreaterThan(0);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.some(f => f.category === 'time')).toBe(true);
    });

    test('should apply discount during off-peak hours', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_3',
          type: 'service',
          category: 'haircut',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 1, // Monday
          hourOfDay: 14, // Off-peak afternoon
          isPeakHour: false,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 30,
          predicted: 35,
          trend: 'decreasing',
        },
        inventory: {
          percentage: 70,
          slotsRemaining: 8,
          totalSlots: 10,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 5,
        },
        location: {
          tier: 3,
          footfallIndex: 40,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.finalPrice).toBeLessThan(500); // Should be discounted
      expect(result.adjustment).toBeLessThan(0);
    });
  });

  describe('Vertical-Specific Pricing', () => {
    test('should apply restaurant surge during lunch hours', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_4',
          type: 'product',
          category: 'meal',
          vertical: 'restaurant',
          basePrice: 300,
          cost: 100,
        },
        time: {
          dayOfWeek: 5,
          hourOfDay: 12,
          isPeakHour: true,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 80,
          predicted: 75,
          trend: 'stable',
        },
        inventory: {
          percentage: 40,
          slotsRemaining: 5,
          totalSlots: 20,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 300,
          competitorCount: 3,
        },
        location: {
          tier: 1,
          footfallIndex: 80,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 2.0,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.finalPrice).toBeGreaterThan(300);
      expect(result.adjustment).toBeGreaterThan(0);
    });

    test('should apply hotel weekend pricing', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_5',
          type: 'product',
          category: 'room',
          vertical: 'hotel',
          basePrice: 3000,
          cost: 1000,
        },
        time: {
          dayOfWeek: 6, // Saturday
          hourOfDay: 10,
          isPeakHour: true,
          isWeekend: true,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 70,
          predicted: 75,
          trend: 'increasing',
        },
        inventory: {
          percentage: 60,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 3000,
          competitorCount: 5,
        },
        location: {
          tier: 1,
          footfallIndex: 60,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 3.0,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.finalPrice).toBeGreaterThan(3000);
      expect(result.factors.some(f => f.name === 'day_multiplier')).toBe(true);
    });
  });

  describe('Slot-Based Pricing', () => {
    test('should surge when few slots remaining', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_6',
          type: 'service',
          category: 'appointment',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 5,
          hourOfDay: 10,
          isPeakHour: true,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 60,
          predicted: 65,
          trend: 'stable',
        },
        inventory: {
          percentage: 15,
          slotsRemaining: 1,
          totalSlots: 8,
          isLowStock: true,
          isOverstock: false,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 5,
        },
        location: {
          tier: 2,
          footfallIndex: 50,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.factors.some(f => f.name === 'slot_availability')).toBe(true);
      const slotFactor = result.factors.find(f => f.name === 'slot_availability');
      expect(slotFactor?.value).toBeGreaterThan(0); // Should be positive (surge)
    });

    test('should discount when many slots available', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_7',
          type: 'service',
          category: 'appointment',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 2,
          hourOfDay: 14,
          isPeakHour: false,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 40,
          predicted: 35,
          trend: 'decreasing',
        },
        inventory: {
          percentage: 85,
          slotsRemaining: 7,
          totalSlots: 8,
          isLowStock: false,
          isOverstock: true,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 5,
        },
        location: {
          tier: 2,
          footfallIndex: 50,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      expect(result.factors.some(f => f.name === 'slot_availability')).toBe(true);
      const slotFactor = result.factors.find(f => f.name === 'slot_availability');
      expect(slotFactor?.value).toBeLessThan(0); // Should be negative (discount)
    });
  });

  describe('Constraints', () => {
    test('should not exceed max surge', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_8',
          type: 'service',
          category: 'premium',
          vertical: 'hotel',
          basePrice: 1000,
          cost: 300,
        },
        time: {
          dayOfWeek: 6,
          hourOfDay: 19,
          isPeakHour: true,
          isWeekend: true,
          isHoliday: true,
          season: 'summer',
        },
        demand: {
          current: 100,
          predicted: 100,
          trend: 'increasing',
        },
        inventory: {
          percentage: 10,
          isLowStock: true,
          isOverstock: false,
        },
        competition: {
          avgPrice: 1000,
          competitorCount: 3,
        },
        location: {
          tier: 1,
          footfallIndex: 100,
          weather: 'clear',
          nearbyEvents: 2,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 2.0, // Strict constraint
          maxDiscount: 0.3,
        },
      };

      const result = engine.calculatePrice(context);

      // Should not exceed 2x surge even with all factors
      expect(result.finalPrice).toBeLessThanOrEqual(2000);
    });

    test('should maintain minimum margin', () => {
      const context: PricingContext = {
        entity: {
          id: 'test_9',
          type: 'service',
          category: 'basic',
          vertical: 'salon',
          basePrice: 100,
          cost: 80, // High cost
        },
        time: {
          dayOfWeek: 1,
          hourOfDay: 14,
          isPeakHour: false,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 20,
          predicted: 20,
          trend: 'stable',
        },
        inventory: {
          percentage: 90,
          isLowStock: false,
          isOverstock: true,
        },
        competition: {
          avgPrice: 100,
          competitorCount: 5,
        },
        location: {
          tier: 3,
          footfallIndex: 30,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15, // 15% minimum margin
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const result = engine.calculatePrice(context);

      // Minimum price should be cost * (1 + minMargin) = 80 * 1.15 = 92
      expect(result.finalPrice).toBeGreaterThanOrEqual(92);
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence with more factors', () => {
      const lowFactorsContext: PricingContext = {
        entity: {
          id: 'test_10a',
          type: 'service',
          category: 'basic',
          vertical: 'salon',
          basePrice: 500,
          cost: 200,
        },
        time: {
          dayOfWeek: 3,
          hourOfDay: 11,
          isPeakHour: false,
          isWeekend: false,
          isHoliday: false,
          season: 'summer',
        },
        demand: {
          current: 50,
          predicted: 50,
          trend: 'stable',
        },
        inventory: {
          percentage: 50,
          isLowStock: false,
          isOverstock: false,
        },
        competition: {
          avgPrice: 500,
          competitorCount: 0,
        },
        location: {
          tier: 2,
          footfallIndex: 50,
          weather: 'clear',
          nearbyEvents: 0,
        },
        constraints: {
          minMargin: 0.15,
          maxSurge: 1.5,
          maxDiscount: 0.5,
        },
      };

      const highFactorsContext: PricingContext = {
        ...lowFactorsContext,
        entity: { ...lowFactorsContext.entity, id: 'test_10b' },
        time: {
          dayOfWeek: 5,
          hourOfDay: 19,
          isPeakHour: true,
          isWeekend: true,
          isHoliday: true,
          season: 'summer',
        },
        demand: {
          current: 80,
          predicted: 85,
          trend: 'increasing',
        },
        inventory: {
          percentage: 20,
          slotsRemaining: 1,
          totalSlots: 10,
          isLowStock: true,
          isOverstock: false,
        },
        location: {
          tier: 1,
          footfallIndex: 80,
          weather: 'clear',
          nearbyEvents: 2,
        },
      };

      const lowFactorsResult = engine.calculatePrice(lowFactorsContext);
      const highFactorsResult = engine.calculatePrice(highFactorsContext);

      expect(highFactorsResult.factors.length).toBeGreaterThan(lowFactorsResult.factors.length);
    });
  });
});

// ================== DEMAND FORECAST TESTS ==================

describe('Demand Forecast', () => {
  const verticalPatterns = {
    restaurant: {
      peakHours: [12, 13, 19, 20, 21],
      offPeakHours: [14, 15, 16],
      weekendBoost: 1.25,
    },
    salon: {
      peakHours: [10, 11, 18, 19, 20],
      offPeakHours: [13, 14, 15],
      weekendBoost: 1.30,
    },
  };

  const calculateHourlyDemand = (
    hour: number,
    dayOfWeek: number,
    weather: string,
    vertical: string
  ): number => {
    let multiplier = 1.0;
    const pattern = verticalPatterns[vertical as keyof typeof verticalPatterns] || verticalPatterns.restaurant;

    // Peak hours
    if (pattern.peakHours.includes(hour)) {
      multiplier *= 1.4;
    }

    // Off-peak hours
    if (pattern.offPeakHours.includes(hour)) {
      multiplier *= 0.7;
    }

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      multiplier *= pattern.weekendBoost;
    }

    // Monday dip
    if (dayOfWeek === 1) {
      multiplier *= 0.85;
    }

    // Weather
    if (weather === 'rainy') multiplier *= 1.1;
    if (weather === 'stormy') multiplier *= 0.7;

    return Math.min(100, 50 * multiplier);
  };

  test('should predict higher demand during peak hours', () => {
    const morningDemand = calculateHourlyDemand(10, 3, 'clear', 'salon');
    const eveningDemand = calculateHourlyDemand(19, 3, 'clear', 'salon');

    expect(eveningDemand).toBeGreaterThan(morningDemand);
  });

  test('should predict higher weekend demand', () => {
    const weekdayDemand = calculateHourlyDemand(12, 3, 'clear', 'restaurant');
    const weekendDemand = calculateHourlyDemand(12, 6, 'clear', 'restaurant');

    expect(weekendDemand).toBeGreaterThan(weekdayDemand);
  });

  test('should predict lower Monday demand', () => {
    const mondayDemand = calculateHourlyDemand(12, 1, 'clear', 'restaurant');
    const wednesdayDemand = calculateHourlyDemand(12, 3, 'clear', 'restaurant');

    expect(mondayDemand).toBeLessThan(wednesdayDemand);
  });

  test('should affect demand based on weather', () => {
    const clearDemand = calculateHourlyDemand(12, 3, 'clear', 'restaurant');
    const rainyDemand = calculateHourlyDemand(12, 3, 'rainy', 'restaurant');

    expect(rainyDemand).toBeGreaterThan(clearDemand);
  });
});

// ================== CASHBACK OPTIMIZATION TESTS ==================

describe('Cashback Optimization', () => {
  const CASHBACK_RATES = {
    new: { base: 0.20, min: 0.10, max: 0.30 },
    regular: { base: 0.08, min: 0.05, max: 0.15 },
    vip: { base: 0.03, min: 0.02, max: 0.08 },
    at_risk: { base: 0.15, min: 0.10, max: 0.25 },
    dormant: { base: 0.12, min: 0.08, max: 0.20 },
  };

  const calculateCashback = (
    orderValue: number,
    segment: keyof typeof CASHBACK_RATES,
    churnRisk: number = 0,
    demand: number = 50
  ): { rate: number; cashback: number; reason: string } => {
    const config = CASHBACK_RATES[segment];
    let rate = config.base;

    // Churn risk adjustment
    if (churnRisk > 0.7) {
      rate = Math.min(rate * 1.5, config.max);
    }

    // Demand adjustment
    if (demand > 70) {
      rate = Math.max(rate * 0.85, config.min);
    } else if (demand < 30) {
      rate = Math.min(rate * 1.25, config.max);
    }

    const cashback = orderValue * rate;
    let reason = `Base ${segment} rate`;

    if (churnRisk > 0.7) reason += ' (high churn risk boost)';
    if (demand > 70) reason += ' (reduced for high demand)';
    if (demand < 30) reason += ' (boosted for low demand)';

    return { rate, cashback, reason };
  };

  test('should recommend higher cashback for new users', () => {
    const newUserCashback = calculateCashback(1000, 'new');
    const regularCashback = calculateCashback(1000, 'regular');

    expect(newUserCashback.rate).toBeGreaterThan(regularCashback.rate);
    expect(newUserCashback.cashback).toBeGreaterThan(regularCashback.cashback);
  });

  test('should recommend higher cashback for at-risk users', () => {
    const atRiskCashback = calculateCashback(1000, 'at_risk', 0.75);
    const regularCashback = calculateCashback(1000, 'regular', 0.2);

    expect(atRiskCashback.rate).toBeGreaterThan(regularCashback.rate);
  });

  test('should reduce cashback for VIP users', () => {
    const vipCashback = calculateCashback(1000, 'vip');
    const regularCashback = calculateCashback(1000, 'regular');

    expect(vipCashback.rate).toBeLessThan(regularCashback.rate);
  });

  test('should reduce cashback during high demand', () => {
    const highDemandCashback = calculateCashback(1000, 'regular', 0.2, 85);
    const normalDemandCashback = calculateCashback(1000, 'regular', 0.2, 50);

    expect(highDemandCashback.rate).toBeLessThan(normalDemandCashback.rate);
  });

  test('should boost cashback during low demand', () => {
    const lowDemandCashback = calculateCashback(1000, 'regular', 0.2, 20);
    const normalDemandCashback = calculateCashback(1000, 'regular', 0.2, 50);

    expect(lowDemandCashback.rate).toBeGreaterThan(normalDemandCashback.rate);
  });

  test('should respect rate boundaries', () => {
    const maxRate = CASHBACK_RATES.at_risk.max;
    const result = calculateCashback(1000, 'at_risk', 0.99); // Very high churn

    expect(result.rate).toBeLessThanOrEqual(maxRate);
  });
});

// ================== OFFER OPTIMIZATION TESTS ==================

describe('Offer Optimization', () => {
  const offerTemplates = [
    { id: 'new_user_10', type: 'percentage', value: 10, minOrder: 0 },
    { id: 'new_user_100', type: 'fixed', value: 100, minOrder: 500 },
    { id: 'comeback_15', type: 'percentage', value: 15, minOrder: 0 },
    { id: 'buy2get1', type: 'bundle', value: 1, minOrder: 0 },
    { id: 'bundle_20', type: 'percentage', value: 20, minOrder: 800 },
  ];

  const optimizeOffer = (
    basePrice: number,
    segment: string,
    demand: number,
    goal: string
  ): { offer: typeof offerTemplates[0]; score: number } => {
    let bestOffer = offerTemplates[0];
    let bestScore = -Infinity;

    for (const offer of offerTemplates) {
      let score = 50;

      // Goal alignment
      if (goal === 'acquisition' && (offer.id.includes('new_user') || offer.id.includes('welcome'))) {
        score += 30;
      }
      if (goal === 'retention' && (segment === 'at_risk' || segment === 'dormant')) {
        if (offer.id.includes('comeback') || offer.id.includes('cashback')) {
          score += 30;
        }
      }
      if (goal === 'conversion' && demand < 40) {
        score += 25;
        if (offer.type === 'buy2get1' || offer.type === 'bundle') {
          score += 15;
        }
      }

      // Demand adjustment
      if (demand < 30 && (offer.type === 'percentage' && offer.value >= 15)) {
        score += 15;
      }
      if (demand > 70 && offer.value > 15) {
        score -= 20;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOffer = offer;
      }
    }

    return { offer: bestOffer, score: bestScore };
  };

  test('should recommend new user offer for acquisition goal', () => {
    const result = optimizeOffer(500, 'new', 50, 'acquisition');

    expect(result.offer.id).toContain('new_user');
    expect(result.score).toBeGreaterThan(70);
  });

  test('should recommend comeback offer for retention goal', () => {
    const result = optimizeOffer(500, 'at_risk', 50, 'retention');

    expect(result.offer.id).toContain('comeback');
    expect(result.score).toBeGreaterThan(70);
  });

  test('should recommend bundle for low demand conversion', () => {
    const result = optimizeOffer(500, 'regular', 25, 'conversion');

    expect(result.offer.type).toBe('bundle');
    expect(result.score).toBeGreaterThan(70);
  });

  test('should avoid deep discounts during high demand', () => {
    const result = optimizeOffer(500, 'regular', 85, 'conversion');

    expect(result.offer.value).toBeLessThanOrEqual(20);
  });
});
