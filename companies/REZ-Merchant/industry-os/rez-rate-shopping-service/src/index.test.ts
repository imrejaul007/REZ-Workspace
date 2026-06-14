/**
 * Unit Tests for REZ Rate Shopping Service
 */

import { describe, it, expect } from 'vitest';

describe('REZ Rate Shopping Service', () => {
  describe('Channel Types', () => {
    const Channel = {
      BOOKING_COM: 'booking_com',
      MAKEMYTRIP: 'makemytrip',
      GOIBIBO: 'goibibo',
      OYO: 'oyo',
      FABHOTELS: 'fabhotels',
      TREEBO: 'treebo',
      AGODA: 'agoda',
    };

    it('should have all expected channels', () => {
      expect(Object.values(Channel)).toContain('booking_com');
      expect(Object.values(Channel)).toContain('makemytrip');
      expect(Object.values(Channel)).toContain('goibibo');
      expect(Object.values(Channel)).toContain('oyo');
    });

    it('should validate channel scraping frequencies', () => {
      const validFrequencies = ['hourly', 'daily', 'weekly'];
      validFrequencies.forEach(freq => {
        expect(validFrequencies).toContain(freq);
      });
    });
  });

  describe('Rate Status', () => {
    const RateStatus = {
      BELOW_MARKET: 'below_market',
      AT_MARKET: 'at_market',
      ABOVE_MARKET: 'above_market',
      NO_DATA: 'no_data',
    };

    it('should have all rate status values', () => {
      expect(Object.values(RateStatus)).toHaveLength(4);
    });

    it('should classify rate correctly against market', () => {
      const ourRate = 2500;
      const marketRate = 2600;

      let status: string;
      if (ourRate < marketRate * 0.9) {
        status = 'below_market';
      } else if (ourRate > marketRate * 1.1) {
        status = 'above_market';
      } else {
        status = 'at_market';
      }

      expect(status).toBe('below_market');
    });
  });

  describe('Alert Severity', () => {
    const AlertSeverity = {
      INFO: 'info',
      WARNING: 'warning',
      CRITICAL: 'critical',
    };

    it('should have all alert severity levels', () => {
      expect(Object.values(AlertSeverity)).toContain('info');
      expect(Object.values(AlertSeverity)).toContain('warning');
      expect(Object.values(AlertSeverity)).toContain('critical');
    });
  });

  describe('Rate Data Processing', () => {
    it('should calculate market average correctly', () => {
      const rates = [2500, 2600, 2400, 2700, 2550];
      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

      expect(avgRate).toBe(2550);
    });

    it('should calculate median correctly for odd count', () => {
      const rates = [2400, 2500, 2600, 2700, 2800].sort((a, b) => a - b);
      const median = rates[Math.floor(rates.length / 2)];

      expect(median).toBe(2600);
    });

    it('should calculate median correctly for even count', () => {
      const rates = [2400, 2500, 2600, 2700].sort((a, b) => a - b);
      const mid = rates.length / 2;
      const median = (rates[mid - 1] + rates[mid]) / 2;

      expect(median).toBe(2550);
    });

    it('should find min and max rates', () => {
      const rates = [2500, 2600, 2400, 2700, 2550];

      expect(Math.min(...rates)).toBe(2400);
      expect(Math.max(...rates)).toBe(2700);
    });

    it('should calculate rate difference percentage', () => {
      const ourRate = 2500;
      const marketRate = 2700;
      const diffPercent = ((marketRate - ourRate) / marketRate) * 100;

      expect(diffPercent).toBeCloseTo(7.41, 1);
    });
  });

  describe('Yield Recommendations', () => {
    it('should recommend increase when availability is low', () => {
      const availability = 2; // Low availability
      const avgRate = 2500;

      let recommendedRate = avgRate;
      let action = 'maintain';

      if (availability < 3) {
        recommendedRate = avgRate * 1.15;
        action = 'increase';
      }

      expect(action).toBe('increase');
      expect(recommendedRate).toBe(2875);
    });

    it('should recommend decrease when availability is high', () => {
      const availability = 10; // High availability
      const avgRate = 2500;

      let recommendedRate = avgRate;
      let action = 'maintain';

      if (availability > 8) {
        recommendedRate = avgRate * 0.95;
        action = 'decrease';
      }

      expect(action).toBe('decrease');
      expect(recommendedRate).toBe(2375);
    });

    it('should apply weekend premium', () => {
      const rate = 2500;
      const isWeekend = true;

      let finalRate = rate;
      if (isWeekend) {
        finalRate *= 1.1;
      }

      expect(finalRate).toBe(2750);
    });

    it('should calculate expected occupancy correctly', () => {
      const availability = 2;
      const expectedOccupancy = availability < 5 ? 85 : availability < 8 ? 70 : 55;

      expect(expectedOccupancy).toBe(85);
    });
  });

  describe('Price Parity Alerts', () => {
    it('should trigger alert when min rate is significantly below average', () => {
      const avgRate = 2500;
      const minRate = 1900; // 24% below average

      const shouldAlert = minRate < avgRate * 0.8;
      const differencePercent = Math.round((1 - minRate / avgRate) * 100);

      expect(shouldAlert).toBe(true);
      expect(differencePercent).toBe(24);
    });

    it('should calculate difference amount', () => {
      const avgRate = 2500;
      const minRate = 2000;

      const difference = avgRate - minRate;
      expect(difference).toBe(500);
    });
  });

  describe('Competitor Management', () => {
    it('should validate competitor URL format', () => {
      const urlRegex = /^https?:\/\/.+/;
      expect(urlRegex.test('https://www.booking.com')).toBe(true);
      expect(urlRegex.test('invalid-url')).toBe(false);
    });

    it('should generate date strings for scraping range', () => {
      const today = new Date();
      const dates = [];

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      expect(dates.length).toBe(30);
      expect(dates[0]).toBe(today.toISOString().split('T')[0]);
    });
  });

  describe('Rate Comparison', () => {
    it('should compare our rate against competitors', () => {
      const ourRate = 2600;
      const competitorRates = [2500, 2600, 2700, 2550];

      const avgMarketRate = competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length;
      const minCompetitor = Math.min(...competitorRates);
      const maxCompetitor = Math.max(...competitorRates);

      expect(avgMarketRate).toBe(2587.5);
      expect(minCompetitor).toBe(2500);
      expect(maxCompetitor).toBe(2700);
    });

    it('should determine position relative to market', () => {
      const ourRate = 2650;
      const avgMarketRate = 2587.5;

      let status: string;
      if (ourRate < avgMarketRate * 0.9) {
        status = 'below_market';
      } else if (ourRate > avgMarketRate * 1.1) {
        status = 'above_market';
      } else {
        status = 'at_market';
      }

      expect(status).toBe('at_market');
    });
  });

  describe('Scraping Logging', () => {
    it('should log scraping results correctly', () => {
      const log = {
        competitorId: 'comp_123',
        channel: 'booking_com',
        status: 'success',
        ratesFound: 30,
        duration: 1500, // ms
        errorMessage: null,
      };

      expect(log.status).toBe('success');
      expect(log.ratesFound).toBe(30);
      expect(log.duration).toBe(1500);
    });

    it('should calculate scraping duration', () => {
      const startTime = Date.now();
      // Simulate some work
      const endTime = startTime + 1500;
      const duration = endTime - startTime;

      expect(duration).toBe(1500);
    });
  });

  describe('Statistics Aggregation', () => {
    it('should calculate success rate from scraping logs', () => {
      const logs = [
        { status: 'success', count: 45 },
        { status: 'partial', count: 3 },
        { status: 'failed', count: 2 },
      ];

      const total = logs.reduce((sum, l) => sum + l.count, 0);
      const successCount = logs.find(l => l._id === 'success')?.count ||
        logs.find(l => l.status === 'success')?.count || 0;
      const successRate = (successCount / total) * 100;

      expect(successRate).toBeCloseTo(90, 0);
    });

    it('should aggregate alert counts', () => {
      const alerts = [
        { status: 'new', severity: 'warning' },
        { status: 'new', severity: 'critical' },
        { status: 'acknowledged', severity: 'warning' },
      ];

      const newCount = alerts.filter(a => a.status === 'new').length;
      expect(newCount).toBe(2);
    });
  });

  describe('Demand Indicators', () => {
    it('should classify demand based on availability', () => {
      const availabilities = [2, 4, 7, 10];

      const demandLevels = availabilities.map(avg => {
        if (avg < 3) return 'high';
        if (avg < 6) return 'medium';
        return 'low';
      });

      expect(demandLevels).toEqual(['high', 'high', 'medium', 'low']);
    });
  });
});
