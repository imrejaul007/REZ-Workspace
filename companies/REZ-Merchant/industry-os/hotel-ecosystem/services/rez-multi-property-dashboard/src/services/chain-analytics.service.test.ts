import { describe, it, expect, beforeEach } from 'vitest';
import { ChainAnalyticsService } from './chain-analytics.service';

describe('ChainAnalyticsService', () => {
  let service: ChainAnalyticsService;

  beforeEach(() => {
    service = new ChainAnalyticsService();
  });

  describe('getChainPerformance', () => {
    it('should return chain performance metrics', async () => {
      const properties = [
        { propertyId: 'p1', name: 'Hotel Alpha', totalRooms: 100, segment: 'luxury' },
        { propertyId: 'p2', name: 'Hotel Beta', totalRooms: 80, segment: 'upper_midscale' },
      ];

      const performance = await service.getChainPerformance(
        'chain-1',
        properties,
        new Date('2026-06-01'),
        new Date('2026-06-30')
      );

      expect(performance.chainId).toBe('chain-1');
      expect(performance.totalProperties).toBe(2);
      expect(performance.totalRooms).toBe(180);
      expect(performance.aggregateMetrics).toBeDefined();
      expect(performance.propertyPerformance.length).toBe(2);
    });

    it('should rank properties by revenue', async () => {
      const properties = [
        { propertyId: 'p1', name: 'Hotel Alpha', totalRooms: 100, segment: 'luxury' },
        { propertyId: 'p2', name: 'Hotel Beta', totalRooms: 50, segment: 'midscale' },
      ];

      const performance = await service.getChainPerformance(
        'chain-1',
        properties,
        new Date('2026-06-01'),
        new Date('2026-06-30')
      );

      expect(performance.propertyPerformance[0].rank).toBe(1);
      expect(performance.propertyPerformance[1].rank).toBe(2);
    });
  });

  describe('getPropertyMetrics', () => {
    it('should return property metrics', async () => {
      const metrics = await service.getPropertyMetrics('p1', 'Hotel Alpha', new Date());

      expect(metrics.propertyId).toBe('p1');
      expect(metrics.propertyName).toBe('Hotel Alpha');
      expect(metrics.occupancyRate).toBeGreaterThan(0);
      expect(metrics.totalRevenue).toBeGreaterThan(0);
      expect(metrics.revPAR).toBeGreaterThan(0);
    });
  });

  describe('compareProperties', () => {
    it('should compare properties by metric', async () => {
      const propertiesMap = new Map([
        ['p1', { name: 'Hotel Alpha', totalRooms: 100, segment: 'luxury' }],
        ['p2', { name: 'Hotel Beta', totalRooms: 80, segment: 'upper_midscale' }],
      ]);

      const comparison = await service.compareProperties(
        ['p1', 'p2'],
        propertiesMap,
        'occupancyRate',
        { start: new Date('2026-06-01'), end: new Date('2026-06-30') }
      );

      expect(comparison.length).toBe(2);
      expect(comparison[0].rank).toBe(1);
    });
  });

  describe('getRevenueForecast', () => {
    it('should return revenue forecast', async () => {
      const forecast = await service.getRevenueForecast('p1', 7);

      expect(forecast.length).toBe(7);
      forecast.forEach(day => {
        expect(day.predictedOccupancy).toBeGreaterThan(0);
        expect(day.predictedADR).toBeGreaterThan(0);
        expect(day.confidence).toBeGreaterThan(0);
      });
    });
  });
});
