import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateRate,
  recordPrice,
  getPricingHistory,
  getSeasonalTrends,
  ROOM_TYPES,
  SEASON_MULTIPLIERS,
} from './services/pricing.service.js';

describe('Dynamic Pricing Service', () => {
  describe('calculateRate', () => {
    it('should calculate base price for standard room', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-17', 50, 'hotel-1');
      expect(result.roomType).toBe('standard');
      expect(result.basePrice).toBe(4000); // 2000 * 2 nights
      expect(result.occupancyMultiplier).toBe(1.0);
    });

    it('should apply occupancy multiplier for high occupancy', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-16', 90, 'hotel-1');
      expect(result.occupancyMultiplier).toBe(1.35);
    });

    it('should apply occupancy multiplier for low occupancy', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-16', 20, 'hotel-1');
      expect(result.occupancyMultiplier).toBe(0.9);
    });

    it('should apply peak season multiplier in December', () => {
      const result = calculateRate('standard', '2026-12-25', '2026-12-26', 50, 'hotel-1');
      expect(result.seasonMultiplier).toBe(1.8);
    });

    it('should apply high season multiplier in October', () => {
      const result = calculateRate('deluxe', '2026-10-15', '2026-10-16', 50, 'hotel-1');
      expect(result.seasonMultiplier).toBe(1.4);
    });

    it('should apply low season multiplier in July', () => {
      const result = calculateRate('suite', '2026-07-15', '2026-07-16', 50, 'hotel-1');
      expect(result.seasonMultiplier).toBe(0.8);
    });

    it('should apply weekend multiplier for Friday', () => {
      const result = calculateRate('standard', '2026-06-19', '2026-06-20', 50, 'hotel-1'); // Friday
      expect(result.dayMultiplier).toBe(1.15);
    });

    it('should apply weekend multiplier for Saturday', () => {
      const result = calculateRate('standard', '2026-06-20', '2026-06-21', 50, 'hotel-1'); // Saturday
      expect(result.dayMultiplier).toBe(1.2);
    });

    it('should apply weekday discount for Monday', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-16', 50, 'hotel-1'); // Monday
      expect(result.dayMultiplier).toBe(0.95);
    });

    it('should calculate correct breakdown for combined multipliers', () => {
      const result = calculateRate('deluxe', '2026-10-15', '2026-10-16', 70, 'hotel-1');
      expect(result.breakdown.basePrice).toBe(3500);
      expect(result.breakdown.seasonAdjustment).toBe(1400); // 3500 * 0.4
      expect(result.breakdown.occupancyAdjustment).toBe(525); // 3500 * 0.15
      expect(result.breakdown.dayAdjustment).toBe(0); // Wednesday has 1.0 multiplier
    });

    it('should calculate final price correctly', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-16', 50, 'hotel-1');
      // June is high season (1.4), Monday is 0.95, 50% occupancy is 1.0
      const expected = Math.round(2000 * 1.4 * 0.95 * 1.0 * 1);
      expect(result.finalPrice).toBe(expected);
    });

    it('should calculate multi-night stay correctly', () => {
      const result = calculateRate('standard', '2026-06-15', '2026-06-20', 50, 'hotel-1');
      expect(result.basePrice).toBe(10000); // 2000 * 5 nights
    });
  });

  describe('recordPrice', () => {
    it('should record pricing history', () => {
      recordPrice('test-id-1', 'hotel-test-1', 'standard', '2026-06-15', 50, 2000);
      const history = getPricingHistory('hotel-test-1');
      expect(history).toHaveLength(1);
      expect(history[0].roomType).toBe('standard');
    });

    it('should store multiple entries for same hotel', () => {
      recordPrice('test-id-2', 'hotel-test-2', 'standard', '2026-06-15', 50, 2000);
      recordPrice('test-id-3', 'hotel-test-2', 'deluxe', '2026-06-16', 70, 4000);
      const history = getPricingHistory('hotel-test-2');
      expect(history).toHaveLength(2);
    });
  });

  describe('getSeasonalTrends', () => {
    it('should calculate average price per room type', () => {
      const hotelId = 'hotel-trends-' + Date.now();
      recordPrice('trend-1', hotelId, 'standard', '2026-06-15', 50, 2000);
      recordPrice('trend-2', hotelId, 'standard', '2026-06-16', 50, 3000);
      const trends = getSeasonalTrends(hotelId, 1);
      expect(trends.standard).toBe(2500); // Average of 2000 and 3000
    });

    it('should return empty object for hotel with no history', () => {
      const trends = getSeasonalTrends('hotel-nonexistent', 1);
      expect(Object.keys(trends)).toHaveLength(0);
    });
  });

  describe('ROOM_TYPES', () => {
    it('should have all expected room types', () => {
      expect(ROOM_TYPES.standard).toBeDefined();
      expect(ROOM_TYPES.deluxe).toBeDefined();
      expect(ROOM_TYPES.suite).toBeDefined();
      expect(ROOM_TYPES.presidential).toBeDefined();
    });

    it('should have correct base prices', () => {
      expect(ROOM_TYPES.standard.basePrice).toBe(2000);
      expect(ROOM_TYPES.deluxe.basePrice).toBe(3500);
      expect(ROOM_TYPES.suite.basePrice).toBe(6000);
      expect(ROOM_TYPES.presidential.basePrice).toBe(15000);
    });
  });

  describe('SEASON_MULTIPLIERS', () => {
    it('should have correct multiplier values', () => {
      expect(SEASON_MULTIPLIERS.low).toBe(0.8);
      expect(SEASON_MULTIPLIERS.regular).toBe(1.0);
      expect(SEASON_MULTIPLIERS.high).toBe(1.4);
      expect(SEASON_MULTIPLIERS.peak).toBe(1.8);
    });
  });
});
