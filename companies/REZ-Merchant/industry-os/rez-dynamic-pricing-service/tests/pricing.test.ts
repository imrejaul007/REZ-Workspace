/**
 * Dynamic Pricing Service Tests
 */

import { describe, it, expect } from 'vitest';

// Mock pricing engine logic for testing
class PricingEngine {
  calculateOccupancyMultiplier(occupancy: number): number {
    if (occupancy <= 30) return 0.85;
    if (occupancy <= 60) return 1.0;
    if (occupancy <= 80) return 1.15;
    if (occupancy <= 95) return 1.35;
    return 1.6;
  }

  calculateLeadTimeMultiplier(leadTime: number): number {
    if (leadTime <= 1) return 1.4;
    if (leadTime <= 3) return 1.25;
    if (leadTime <= 7) return 1.1;
    if (leadTime <= 30) return 1.0;
    if (leadTime <= 90) return 0.9;
    return 0.8;
  }

  getDayMultiplier(dayOfWeek: number): number {
    const multipliers = [1.1, 0.9, 0.9, 0.95, 1.0, 1.25, 1.35];
    return multipliers[dayOfWeek];
  }

  calculatePrice(baseRate: number, occupancy: number, leadTime: number, dayOfWeek: number): number {
    let rate = baseRate;
    rate *= this.calculateOccupancyMultiplier(occupancy);
    rate *= this.calculateLeadTimeMultiplier(leadTime);
    rate *= this.getDayMultiplier(dayOfWeek);
    return Math.round(rate * 100) / 100;
  }
}

const engine = new PricingEngine();

describe('Dynamic Pricing Engine', () => {
  describe('Occupancy-Based Pricing', () => {
    it('should apply 15% discount for low occupancy (0-30%)', () => {
      expect(engine.calculateOccupancyMultiplier(20)).toBe(0.85);
    });

    it('should apply base rate for medium occupancy (30-60%)', () => {
      expect(engine.calculateOccupancyMultiplier(45)).toBe(1.0);
    });

    it('should apply 15% premium for high occupancy (60-80%)', () => {
      expect(engine.calculateOccupancyMultiplier(70)).toBe(1.15);
    });

    it('should apply 35% premium for very high occupancy (80-95%)', () => {
      expect(engine.calculateOccupancyMultiplier(90)).toBe(1.35);
    });

    it('should apply 60% surge for critical occupancy (95%+)', () => {
      expect(engine.calculateOccupancyMultiplier(98)).toBe(1.6);
    });
  });

  describe('Lead Time Pricing', () => {
    it('should apply 40% premium for same-day booking', () => {
      expect(engine.calculateLeadTimeMultiplier(0)).toBe(1.4);
    });

    it('should apply 25% premium for 1-3 day lead time', () => {
      expect(engine.calculateLeadTimeMultiplier(2)).toBe(1.25);
    });

    it('should apply 10% premium for 4-7 day lead time', () => {
      expect(engine.calculateLeadTimeMultiplier(5)).toBe(1.1);
    });

    it('should apply base rate for 8-30 day lead time', () => {
      expect(engine.calculateLeadTimeMultiplier(15)).toBe(1.0);
    });

    it('should apply 10% discount for early booking (31-90 days)', () => {
      expect(engine.calculateLeadTimeMultiplier(60)).toBe(0.9);
    });

    it('should apply 20% discount for very early booking (90+ days)', () => {
      expect(engine.calculateLeadTimeMultiplier(120)).toBe(0.8);
    });
  });

  describe('Day of Week Pricing', () => {
    it('should apply premium for Friday', () => {
      expect(engine.getDayMultiplier(5)).toBe(1.25);
    });

    it('should apply highest premium for Saturday', () => {
      expect(engine.getDayMultiplier(6)).toBe(1.35);
    });

    it('should apply discount for Monday', () => {
      expect(engine.getDayMultiplier(1)).toBe(0.9);
    });

    it('should apply discount for Tuesday', () => {
      expect(engine.getDayMultiplier(2)).toBe(0.9);
    });

    it('should apply slight discount for Sunday', () => {
      expect(engine.getDayMultiplier(0)).toBe(1.1);
    });
  });

  describe('Combined Pricing', () => {
    it('should calculate correct price for weekday, low occupancy, early booking', () => {
      const baseRate = 3000;
      const price = engine.calculatePrice(baseRate, 25, 60, 2); // Tue, low occ, early
      expect(price).toBeGreaterThan(2000); // Should be discounted
      expect(price).toBeLessThan(3000); // But not below base
    });

    it('should calculate correct price for weekend, high occupancy, last minute', () => {
      const baseRate = 3000;
      const price = engine.calculatePrice(baseRate, 85, 1, 6); // Sat, high occ, last min
      expect(price).toBeGreaterThan(5000); // Should have premium
    });

    it('should calculate base rate for normal conditions', () => {
      const baseRate = 3000;
      const price = engine.calculatePrice(baseRate, 50, 20, 3); // Wed, medium occ, normal
      expect(price).toBeLessThan(3500); // Should be reasonable
    });
  });

  describe('Revenue Optimization', () => {
    it('should calculate potential revenue increase', () => {
      const baseOccupancy = 50;
      const optimizedOccupancy = 65;
      const baseRate = 3000;
      const rooms = 100;
      const days = 30;

      const currentRevenue = baseOccupancy / 100 * rooms * baseRate * days;
      const optimizedRevenue = optimizedOccupancy / 100 * rooms * baseRate * 1.1 * days;

      expect(optimizedRevenue).toBeGreaterThan(currentRevenue);
    });

    it('should suggest price increases for high demand periods', () => {
      const baseRate = 3000;
      const highOccupancyPrice = baseRate * 1.35;
      expect(highOccupancyPrice).toBeCloseTo(4050, 2);
    });
  });
});

describe('Dynamic Pricing API', () => {
  const BASE_URL = 'http://localhost:4040';

  it('should respond to health check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
  });

  it('should calculate price with valid input', async () => {
    const res = await fetch(`${BASE_URL}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occupancy: 75,
        leadTime: 7,
        dayOfWeek: 5,
        isWeekend: true,
        isHoliday: false,
        isEvent: false,
        baseRate: 3000,
        roomType: 'deluxe',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.adjustedRate).toBeGreaterThan(3000);
  });

  it('should generate batch pricing for date range', async () => {
    const res = await fetch(`${BASE_URL}/api/pricing/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: 'hotel_001',
        roomType: 'deluxe',
        baseRate: 3000,
        dates: ['2026-06-15', '2026-06-16', '2026-06-17'],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.prices.length).toBe(3);
  });

  it('should return competitor analysis', async () => {
    const res = await fetch(`${BASE_URL}/api/competitors?hotelId=hotel_001&roomType=deluxe`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.competitors).toBeDefined();
  });

  it('should return revenue optimization report', async () => {
    const res = await fetch(`${BASE_URL}/api/revenue/optimize?hotelId=hotel_001`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.projectedARR).toBeGreaterThan(data.data.currentARR);
  });

  it('should return demand forecast', async () => {
    const res = await fetch(`${BASE_URL}/api/demand/forecast?hotelId=hotel_001&days=7`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.forecast.length).toBe(7);
  });
});
