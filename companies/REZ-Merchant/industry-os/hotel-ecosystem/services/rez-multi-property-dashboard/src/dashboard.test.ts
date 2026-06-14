import { describe, it, expect, beforeEach } from 'vitest';
import { ChainAnalyticsService } from './services/chain-analytics.service';
import { CrossPropertyService } from './services/cross-property.service';

describe('Multi-Property Dashboard', () => {
  let analyticsService: ChainAnalyticsService;
  let crossPropertyService: CrossPropertyService;

  beforeEach(() => {
    analyticsService = new ChainAnalyticsService();
    crossPropertyService = new CrossPropertyService();
  });

  describe('ChainAnalyticsService', () => {
    describe('getChainPerformance', () => {
      it('should return chain performance metrics', async () => {
        const properties = [
          { propertyId: 'prop-1', name: 'Hotel A', totalRooms: 50, segment: 'upper_midscale' },
          { propertyId: 'prop-2', name: 'Hotel B', totalRooms: 30, segment: 'upper_midscale' },
        ];
        const performance = await analyticsService.getChainPerformance(
          'chain-1',
          properties,
          new Date('2026-06-01'),
          new Date('2026-06-30')
        );

        expect(performance.chainId).toBe('chain-1');
        expect(performance.totalProperties).toBe(2);
        expect(performance.totalRooms).toBe(80);
        expect(performance.aggregateMetrics.totalRevenue).toBeGreaterThan(0);
      });

      it('should calculate aggregate occupancy rate correctly', async () => {
        const properties = [
          { propertyId: 'prop-1', name: 'Hotel A', totalRooms: 50, segment: 'upper_midscale' },
        ];
        const performance = await analyticsService.getChainPerformance(
          'chain-1',
          properties,
          new Date('2026-06-01'),
          new Date('2026-06-30')
        );

        expect(performance.aggregateMetrics.occupancyRate).toBeGreaterThanOrEqual(0);
        expect(performance.aggregateMetrics.occupancyRate).toBeLessThanOrEqual(100);
      });

      it('should rank properties by revenue', async () => {
        const properties = [
          { propertyId: 'prop-1', name: 'Hotel A', totalRooms: 50, segment: 'upper_midscale' },
          { propertyId: 'prop-2', name: 'Hotel B', totalRooms: 30, segment: 'upper_midscale' },
        ];
        const performance = await analyticsService.getChainPerformance(
          'chain-1',
          properties,
          new Date('2026-06-01'),
          new Date('2026-06-30')
        );

        expect(performance.propertyPerformance.length).toBe(2);
        expect(performance.propertyPerformance[0].rank).toBe(1);
        expect(performance.propertyPerformance[1].rank).toBe(2);
      });
    });

    describe('compareProperties', () => {
      it('should compare multiple properties', async () => {
        const propertiesMap = new Map([
          ['prop-1', { name: 'Hotel A', totalRooms: 50, segment: 'upper_midscale' as const }],
          ['prop-2', { name: 'Hotel B', totalRooms: 30, segment: 'upper_midscale' as const }],
        ]);

        const comparison = await analyticsService.compareProperties(
          ['prop-1', 'prop-2'],
          propertiesMap,
          'occupancyRate',
          { start: new Date('2026-06-01'), end: new Date('2026-06-30') }
        );

        expect(Array.isArray(comparison)).toBe(true);
        expect(comparison.length).toBe(2);
        expect(comparison[0].propertyId).toBeDefined();
      });
    });

    describe('getPropertyMetrics', () => {
      it('should return property metrics', async () => {
        const metrics = await analyticsService.getPropertyMetrics('prop-1', 'Test Hotel', new Date());

        expect(metrics.propertyId).toBe('prop-1');
        expect(metrics.propertyName).toBe('Test Hotel');
        expect(metrics.occupancyRate).toBeGreaterThanOrEqual(0);
        expect(metrics.revPAR).toBeGreaterThanOrEqual(0);
      });

      it('should include revenue metrics', async () => {
        const metrics = await analyticsService.getPropertyMetrics('prop-1', 'Test Hotel', new Date());

        expect(metrics.totalRevenue).toBeGreaterThan(0);
        expect(metrics.roomRevenue).toBeGreaterThan(0);
        expect(metrics.adr).toBeGreaterThan(0);
      });
    });

    describe('getRevenueForecast', () => {
      it('should return revenue forecast array', async () => {
        const forecast = await analyticsService.getRevenueForecast('prop-1', 7);

        expect(Array.isArray(forecast)).toBe(true);
        expect(forecast.length).toBe(7);
        expect(forecast[0].predictedOccupancy).toBeGreaterThan(0);
        expect(forecast[0].predictedADR).toBeGreaterThan(0);
        expect(forecast[0].confidence).toBeGreaterThan(0);
      });

      it('should decrease confidence over time', async () => {
        const forecast = await analyticsService.getRevenueForecast('prop-1', 14);

        expect(forecast[0].confidence).toBeGreaterThan(forecast[13].confidence);
      });
    });
  });

  describe('CrossPropertyService', () => {
    describe('createBookingInquiry', () => {
      it('should create a booking inquiry', async () => {
        const inquiry = await crossPropertyService.createBookingInquiry(
          'John Doe',
          'john@example.com',
          '+91-9876543210',
          { roomType: 'deluxe' }
        );

        expect(inquiry.inquiryId).toBeDefined();
        expect(inquiry.guestName).toBe('John Doe');
        expect(inquiry.status).toBe('pending');
      });
    });

    describe('checkMultiPropertyAvailability', () => {
      it('should check availability across properties', async () => {
        const availability = await crossPropertyService.checkMultiPropertyAvailability(
          ['prop-1', 'prop-2'],
          new Date('2026-06-15'),
          new Date('2026-06-18'),
          2,
          'deluxe'
        );

        expect(Array.isArray(availability)).toBe(true);
        expect(availability.length).toBe(2);
        expect(availability[0].propertyId).toBeDefined();
      });
    });

    describe('getMultiPropertyQuote', () => {
      it('should return quotes for multiple properties', async () => {
        const quotes = await crossPropertyService.getMultiPropertyQuote(
          ['prop-1', 'prop-2'],
          new Date('2026-06-15'),
          new Date('2026-06-18'),
          2,
          2
        );

        expect(Array.isArray(quotes)).toBe(true);
        expect(quotes.length).toBe(2);
        expect(quotes[0].grandTotal).toBeGreaterThan(0);
      });
    });

    describe('reserveRoom', () => {
      it('should create a reservation after inquiry', async () => {
        const inquiry = await crossPropertyService.createBookingInquiry(
          'John Doe',
          'john@example.com',
          '+91-9876543210',
          {}
        );

        const reservation = await crossPropertyService.reserveRoom(
          inquiry.inquiryId,
          'prop-1',
          'deluxe',
          'credit_card'
        );

        expect(reservation.reservationId).toBeDefined();
        expect(reservation.confirmationNumber).toBeDefined();
      });
    });
  });
});
