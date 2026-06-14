import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicPricingService } from './dynamic-pricing.service';

describe('DynamicPricingService', () => {
  let service: DynamicPricingService;

  beforeEach(() => {
    service = new DynamicPricingService();
  });

  describe('calculateRate', () => {
    it('should calculate base rate correctly', async () => {
      const result = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
      });

      expect(result.basePrice).toBe(3000);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(result.currency).toBe('INR');
    });

    it('should apply surge pricing for high occupancy', async () => {
      const normal = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
      });

      const high = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.95,
      });

      expect(high.finalPrice).toBeGreaterThan(normal.finalPrice);
    });

    it('should apply weekend pricing', async () => {
      const weekday = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-17'), // Tuesday
        checkOut: new Date('2026-06-18'),
        occupancy: 0.5,
      });

      const weekend = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-20'), // Saturday
        checkOut: new Date('2026-06-21'),
        occupancy: 0.5,
      });

      expect(weekend.finalPrice).toBeGreaterThan(weekday.finalPrice);
    });

    it('should apply early booking discount', async () => {
      const future = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        checkOut: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000),
        occupancy: 0.5,
      });

      const soon = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        occupancy: 0.5,
      });

      expect(future.finalPrice).toBeLessThan(soon.finalPrice);
    });

    it('should include breakdown', async () => {
      const result = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseRate).toBe(3000);
    });
  });

  describe('competitor adjustment', () => {
    it('should adjust for competitor rates', async () => {
      const result = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
        competitorRates: [3500, 3400, 3600],
      });

      expect(result.finalPrice).toBeGreaterThan(0);
    });
  });

  describe('special events', () => {
    it('should apply event pricing', async () => {
      const normal = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
      });

      const festival = await service.calculateRate({
        hotelId: 'hotel-1',
        roomTypeId: 'standard',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-17'),
        occupancy: 0.5,
        specialEvents: ['festival'],
      });

      expect(festival.finalPrice).toBeGreaterThanOrEqual(normal.finalPrice);
    });
  });
});
