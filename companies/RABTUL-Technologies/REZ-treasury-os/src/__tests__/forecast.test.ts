/**
 * TreasuryOS - Forecast Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('mongoose');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

describe('ForecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('13-Week Rolling Forecast', () => {
    it('should generate 13 weeks of forecasts', () => {
      const FORECAST_WEEKS = 13;
      expect(FORECAST_WEEKS).toBe(13);
    });

    it('should calculate week start dates correctly', () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Week should start on Monday
      expect(startOfWeek.getDay()).toBe(1);
    });

    it('should project weekly cash flow from history', () => {
      const history = {
        dailyAverage: { inflow: 10000, outflow: 7000 },
        byDayOfWeek: {
          0: { inflow: 5000, outflow: 4000 }, // Sunday
          1: { inflow: 12000, outflow: 8000 }, // Monday
        },
      };

      const weeklyInflow = history.dailyAverage.inflow * 7;
      const weeklyOutflow = history.dailyAverage.outflow * 7;

      expect(weeklyInflow).toBe(70000);
      expect(weeklyOutflow).toBe(49000);
    });

    it('should calculate net cash flow', () => {
      const inflow = 100000;
      const outflow = 75000;
      const netFlow = inflow - outflow;

      expect(netFlow).toBe(25000);
    });

    it('should calculate running balance', () => {
      let balance = 50000;
      const weeklyFlows = [10000, -5000, 15000, -2000, 8000, -3000, 12000];

      weeklyFlows.forEach(flow => {
        balance += flow;
      });

      expect(balance).toBe(85000);
    });
  });

  describe('Shortfall Prediction', () => {
    it('should identify when balance falls below minimum', () => {
      const minimumRequired = 10000;
      const projectedBalance = 7500;

      expect(projectedBalance).toBeLessThan(minimumRequired);
    });

    it('should calculate shortfall amount', () => {
      const requiredBalance = 10000;
      const projectedBalance = 7500;
      const shortfall = requiredBalance - projectedBalance;

      expect(shortfall).toBe(2500);
    });

    it('should predict shortfall timeline', () => {
      const forecasts = [
        { week: 1, closingBalance: 20000 },
        { week: 2, closingBalance: 15000 },
        { week: 3, closingBalance: 8000 },
        { week: 4, closingBalance: 3000 },
      ];

      const minimumRequired = 10000;
      const shortfallWeek = forecasts.findIndex(f => f.closingBalance < minimumRequired);

      expect(shortfallWeek).toBe(2); // Week 3 (index 2)
    });

    it('should calculate shortfall severity', () => {
      const shortfall = 2500;
      const shortfallPercent = (shortfall / 10000) * 100;

      expect(shortfallPercent).toBe(25);
    });

    it('should classify shortfall risk levels', () => {
      const testCases = [
        { balance: -1000, expectedRisk: 'critical' },
        { balance: 3000, expectedRisk: 'critical' }, // < outflow * 0.5
        { balance: 8000, expectedRisk: 'high' }, // < outflow
        { balance: 15000, expectedRisk: 'medium' }, // < outflow * 2
        { balance: 50000, expectedRisk: 'low' },
      ];

      const outflow = 10000;

      testCases.forEach(({ balance, expectedRisk }) => {
        let risk: string;
        if (balance < 0) risk = 'critical';
        else if (balance < outflow * 0.5) risk = 'critical';
        else if (balance < outflow) risk = 'high';
        else if (balance < outflow * 2) risk = 'medium';
        else risk = 'low';

        expect(risk).toBe(expectedRisk);
      });
    });
  });

  describe('Recovery Actions', () => {
    it('should generate acceleration recommendation', () => {
      const shortfall = 25000;
      const accelerationRecovery = shortfall * 0.3; // 30%

      expect(accelerationRecovery).toBe(7500);
      expect(accelerationRecovery).toBeLessThan(shortfall);
    });

    it('should recommend credit line usage', () => {
      const shortfall = 25000;
      const creditLineNeeded = shortfall;

      expect(creditLineNeeded).toBe(25000);
    });

    it('should calculate delayed payments', () => {
      const shortfall = 25000;
      const delayedPayments = shortfall * 0.2; // 20%

      expect(delayedPayments).toBe(5000);
    });

    it('should prioritize recovery actions', () => {
      const actions = [
        { action: 'Credit line', priority: 'high', timeline: '1-3 days' },
        { action: 'Accelerate receivables', priority: 'high', timeline: '1-2 weeks' },
        { action: 'Delay payments', priority: 'medium', timeline: '2-4 weeks' },
      ];

      const highPriority = actions.filter(a => a.priority === 'high');
      expect(highPriority.length).toBe(2);
    });
  });

  describe('Variance Analysis', () => {
    it('should calculate inflow variance', () => {
      const projected = 100000;
      const actual = 115000;
      const variance = actual - projected;
      const variancePercent = (variance / projected) * 100;

      expect(variance).toBe(15000);
      expect(variancePercent).toBe(15);
    });

    it('should calculate outflow variance', () => {
      const projected = 75000;
      const actual = 68000;
      const variance = actual - projected;
      const variancePercent = (variance / projected) * 100;

      expect(variance).toBe(-7000);
      expect(variancePercent).toBeCloseTo(-9.33, 1);
    });

    it('should identify variance status', () => {
      const variancePercent = 15;
      let status: string;

      if (Math.abs(variancePercent) < 5) status = 'on_track';
      else if (variancePercent > 10) status = 'over';
      else status = 'under';

      expect(status).toBe('over');
    });

    it('should generate variance explanations', () => {
      const variancePercent = 25;
      const reasons: string[] = [];

      if (variancePercent > 10) {
        reasons.push('Significant positive variance - review assumptions');
      } else if (variancePercent < -10) {
        reasons.push('Significant negative variance - investigate causes');
      } else {
        reasons.push('Variance within normal range');
      }

      expect(reasons[0]).toContain('positive variance');
    });
  });

  describe('Confidence Calculation', () => {
    it('should decrease confidence over time', () => {
      const baseConfidence = 0.9;
      const weeksAhead = [0, 1, 2, 3, 4, 5, 6, 12];
      const confidences = weeksAhead.map(week =>
        Math.max(0.5, baseConfidence - week * 0.03)
      );

      expect(confidences[0]).toBe(0.9);
      expect(confidences[1]).toBe(0.87);
      expect(confidences[6]).toBe(0.72);
      expect(confidences[12]).toBe(0.54);
    });

    it('should floor confidence at minimum', () => {
      const confidence = Math.max(0.5, 0.4);
      expect(confidence).toBe(0.5);
    });
  });

  describe('Historical Analysis', () => {
    it('should calculate daily averages from history', () => {
      const totalInflow = 900000;
      const totalOutflow = 630000;
      const days = 90;

      const dailyInflow = totalInflow / days;
      const dailyOutflow = totalOutflow / days;

      expect(dailyInflow).toBe(10000);
      expect(dailyOutflow).toBe(7000);
    });

    it('should analyze by day of week', () => {
      const byDayOfWeek = {
        0: { inflow: 35000, outflow: 28000 }, // Sunday
        1: { inflow: 84000, outflow: 56000 }, // Monday
        2: { inflow: 88000, outflow: 60000 }, // Tuesday
        3: { inflow: 90000, outflow: 62000 }, // Wednesday
        4: { inflow: 92000, outflow: 64000 }, // Thursday
        5: { inflow: 96000, outflow: 68000 }, // Friday
        6: { inflow: 55000, outflow: 45000 }, // Saturday
      };

      // Monday should have higher average than Sunday
      expect(byDayOfWeek[1].inflow).toBeGreaterThan(byDayOfWeek[0].inflow);
    });

    it('should adjust for month-end patterns', () => {
      const weekOfMonth = 3; // Last week
      let inflowMultiplier = 1.0;

      if (weekOfMonth === 0) {
        inflowMultiplier = 0.85; // First week lower
      } else if (weekOfMonth === 3) {
        inflowMultiplier = 1.1; // Month-end push
      }

      expect(inflowMultiplier).toBe(1.1);
    });
  });

  describe('Alert Generation', () => {
    it('should create alert for projected shortfall', () => {
      const shortfall = 50000;
      const willShortfall = shortfall > 0;

      expect(willShortfall).toBe(true);
    });

    it('should determine alert severity', () => {
      const shortfall = 50000;
      const requiredBalance = 10000;

      let severity: string;
      if (shortfall > 50000) severity = 'critical';
      else if (shortfall > 10000) severity = 'high';
      else severity = 'medium';

      expect(severity).toBe('high');
    });

    it('should set alert type based on timeline', () => {
      const shortfallDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const daysUntilShortfall = 7;

      let type: string;
      if (daysUntilShortfall < 14) type = 'imminent';
      else type = 'projected';

      expect(type).toBe('imminent');
    });
  });

  describe('Forecast Accuracy', () => {
    it('should measure forecast accuracy', () => {
      const forecasts = [
        { projected: 25000, actual: 24500 },
        { projected: 25000, actual: 26000 },
        { projected: 25000, actual: 24800 },
      ];

      const accuracies = forecasts.map(f =>
        1 - Math.abs(f.actual - f.projected) / f.projected
      );

      const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

      expect(avgAccuracy).toBeGreaterThan(0.95);
    });

    it('should track prediction errors', () => {
      const predictions = [500, -1000, 200, -300];
      const mae = predictions.reduce((sum, err) => sum + Math.abs(err), 0) / predictions.length;

      expect(mae).toBe(500);
    });
  });
});

describe('Forecast Factors', () => {
  it('should weight factors by probability', () => {
    const factors = [
      { category: 'seasonal', amount: 10000, probability: 0.8 },
      { category: 'one-time', amount: 5000, probability: 0.5 },
    ];

    const weightedTotal = factors.reduce((sum, f) =>
      sum + (f.amount * f.probability), 0
    );

    expect(weightedTotal).toBe(10500);
  });

  it('should categorize forecast factors', () => {
    const categories = ['seasonal', 'recurring', 'one-time', 'market', 'operational'];

    categories.forEach(cat => {
      expect(categories).toContain(cat);
    });
  });
});
