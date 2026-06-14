/**
 * Unit tests for DemandForecastAgent
 */

import { DemandForecastAgent, DailyOrderData, PatternAnalysis, DemandForecast } from '../demandForecastAgent';

// Create mock functions
const mockOrderAggregate = jest.fn();
const mockStoreFind = jest.fn();

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id),
  },
}));

// Mock models
jest.mock('../../models/Order', () => ({
  Order: {
    aggregate: (...args: any[]) => mockOrderAggregate(...args),
  },
}));

jest.mock('../../models/Store', () => ({
  Store: {
    find: (...args: any[]) => mockStoreFind(...args),
  },
}));

jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DemandForecastAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pattern Detection', () => {
    it('should detect weekend peak pattern', () => {
      const dailyData: DailyOrderData[] = Array.from({ length: 28 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (27 - i));
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        return {
          date: date.toISOString().split('T')[0],
          orders: isWeekend ? 150 : 80,
          revenue: isWeekend ? 15000 : 8000,
          avgOrderValue: 100,
          uniqueCustomers: isWeekend ? 120 : 70,
        };
      });

      // Access private method through any cast for testing
      const patterns = (DemandForecastAgent as any).detectPatterns(dailyData);

      expect(patterns.some((p: PatternAnalysis) => p.type === 'weekend_peak')).toBe(true);
    });

    it('should detect weekday low pattern', () => {
      const dailyData: DailyOrderData[] = Array.from({ length: 21 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (20 - i));
        const dayOfWeek = date.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

        return {
          date: date.toISOString().split('T')[0],
          orders: isWeekday ? 50 : 100,
          revenue: isWeekday ? 5000 : 10000,
          avgOrderValue: 100,
          uniqueCustomers: isWeekday ? 45 : 90,
        };
      });

      const patterns = (DemandForecastAgent as any).detectPatterns(dailyData);

      expect(patterns.some((p: PatternAnalysis) => p.type === 'weekday_low')).toBe(true);
    });

    it('should detect upward trend', () => {
      const dailyData: DailyOrderData[] = [];

      // Older data - lower orders
      for (let i = 28; i < 35; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          orders: 50,
          revenue: 5000,
          avgOrderValue: 100,
          uniqueCustomers: 45,
        });
      }

      // Recent data - higher orders
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          orders: 120,
          revenue: 12000,
          avgOrderValue: 100,
          uniqueCustomers: 100,
        });
      }

      const patterns = (DemandForecastAgent as any).detectPatterns(dailyData);

      expect(patterns.some((p: PatternAnalysis) => p.type === 'trend')).toBe(true);
    });

    it('should detect declining trend', () => {
      // Generate data in chronological order (oldest first)
      const dailyData: DailyOrderData[] = [];
      const baseDate = new Date('2024-02-01');

      // First 14 days (older) - higher orders
      for (let i = 27; i >= 14; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          orders: 120,
          revenue: 12000,
          avgOrderValue: 100,
          uniqueCustomers: 100,
        });
      }

      // Last 14 days (recent) - lower orders
      for (let i = 13; i >= 0; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          orders: 50,
          revenue: 5000,
          avgOrderValue: 100,
          uniqueCustomers: 45,
        });
      }

      const patterns = (DemandForecastAgent as any).detectPatterns(dailyData);

      // Check for trend pattern - impact is always positive (absolute value)
      // The description tells you if it's upward or downward
      const trendPattern = patterns.find((p: PatternAnalysis) => p.type === 'trend');
      expect(trendPattern).toBeDefined();
      expect(trendPattern?.description).toContain('Downward');
      expect(trendPattern?.impact).toBeGreaterThan(10);
    });

    it('should return empty patterns for insufficient data', () => {
      const dailyData: DailyOrderData[] = [
        { date: '2024-01-01', orders: 50, revenue: 5000, avgOrderValue: 100, uniqueCustomers: 45 },
        { date: '2024-01-02', orders: 55, revenue: 5500, avgOrderValue: 100, uniqueCustomers: 50 },
      ];

      const patterns = (DemandForecastAgent as any).detectPatterns(dailyData);

      expect(patterns).toEqual([]);
    });
  });

  describe('Demand Level Classification', () => {
    it('should classify as low for ratio < 0.7', () => {
      const getDemandLevel = (DemandForecastAgent as any).getDemandLevel;
      expect(getDemandLevel(5, 10)).toBe('low');
      expect(getDemandLevel(6, 10)).toBe('low');
    });

    it('should classify as medium for ratio >= 0.7 and < 1.3', () => {
      const getDemandLevel = (DemandForecastAgent as any).getDemandLevel;
      expect(getDemandLevel(7, 10)).toBe('medium');
      expect(getDemandLevel(10, 10)).toBe('medium');
      expect(getDemandLevel(12, 10)).toBe('medium');
    });

    it('should classify as high for ratio >= 1.3', () => {
      const getDemandLevel = (DemandForecastAgent as any).getDemandLevel;
      expect(getDemandLevel(13, 10)).toBe('high');
      expect(getDemandLevel(20, 10)).toBe('high');
    });
  });

  describe('Forecast Generation', () => {
    it('should generate forecasts for specified horizon', () => {
      const dailyData: DailyOrderData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          orders: 100,
          revenue: 10000,
          avgOrderValue: 100,
          uniqueCustomers: 90,
        };
      });

      const patterns: PatternAnalysis[] = [];
      const forecasts = (DemandForecastAgent as any).generateForecasts(
        dailyData,
        patterns,
        7,
        100,
        10000
      );

      expect(forecasts).toHaveLength(7);
    });

    it('should include factors in forecasts', () => {
      const dailyData: DailyOrderData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          orders: 100,
          revenue: 10000,
          avgOrderValue: 100,
          uniqueCustomers: 90,
        };
      });

      const patterns: PatternAnalysis[] = [
        {
          type: 'weekend_peak',
          description: 'Weekend peak',
          impact: 30,
          confidence: 0.8,
          affectedDays: [0, 6],
        },
      ];

      const forecasts = (DemandForecastAgent as any).generateForecasts(
        dailyData,
        patterns,
        7,
        100,
        10000
      );

      // At least one forecast should have weekend factors
      const weekendForecast = forecasts.find((f: DemandForecast) => {
        const forecastDate = new Date(f.date);
        return forecastDate.getDay() === 6;
      });

      expect(weekendForecast?.factors.length).toBeGreaterThan(0);
    });

    it('should decrease confidence for further dates', () => {
      const dailyData: DailyOrderData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          orders: 100,
          revenue: 10000,
          avgOrderValue: 100,
          uniqueCustomers: 90,
        };
      });

      const forecasts = (DemandForecastAgent as any).generateForecasts(
        dailyData,
        [],
        30,
        100,
        10000
      );

      expect(forecasts[0].confidence).toBeGreaterThan(forecasts[29].confidence);
    });
  });

  describe('Demand Signals', () => {
    it('should generate high demand signal for multiple high demand days', () => {
      const forecasts: DemandForecast[] = [
        { date: '2024-01-01', predictedOrders: 150, predictedRevenue: 15000, confidence: 0.8, demandLevel: 'high', factors: [] },
        { date: '2024-01-02', predictedOrders: 160, predictedRevenue: 16000, confidence: 0.8, demandLevel: 'high', factors: [] },
        { date: '2024-01-03', predictedOrders: 155, predictedRevenue: 15500, confidence: 0.8, demandLevel: 'high', factors: [] },
        { date: '2024-01-04', predictedOrders: 50, predictedRevenue: 5000, confidence: 0.7, demandLevel: 'low', factors: [] },
        { date: '2024-01-05', predictedOrders: 60, predictedRevenue: 6000, confidence: 0.7, demandLevel: 'low', factors: [] },
      ];

      const signals = (DemandForecastAgent as any).generateDemandSignals(forecasts, 100, []);

      expect(signals.some((s: any) => s.type === 'high_demand')).toBe(true);
    });

    it('should generate low demand signal for multiple low demand days', () => {
      const forecasts: DemandForecast[] = [
        { date: '2024-01-01', predictedOrders: 30, predictedRevenue: 3000, confidence: 0.7, demandLevel: 'low', factors: [] },
        { date: '2024-01-02', predictedOrders: 40, predictedRevenue: 4000, confidence: 0.7, demandLevel: 'low', factors: [] },
        { date: '2024-01-03', predictedOrders: 35, predictedRevenue: 3500, confidence: 0.7, demandLevel: 'low', factors: [] },
        { date: '2024-01-04', predictedOrders: 100, predictedRevenue: 10000, confidence: 0.8, demandLevel: 'medium', factors: [] },
      ];

      const signals = (DemandForecastAgent as any).generateDemandSignals(forecasts, 100, []);

      expect(signals.some((s: any) => s.type === 'low_demand')).toBe(true);
    });

    it('should generate opportunity signal for weekend peak pattern', () => {
      const patterns: PatternAnalysis[] = [
        {
          type: 'weekend_peak',
          description: 'Weekend peak',
          impact: 30,
          confidence: 0.8,
        },
      ];

      const forecasts: DemandForecast[] = [];
      const signals = (DemandForecastAgent as any).generateDemandSignals(forecasts, 100, patterns);

      expect(signals.some((s: any) => s.type === 'opportunity')).toBe(true);
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations for high demand days', () => {
      const forecasts: DemandForecast[] = Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-0${i + 1}`,
        predictedOrders: i < 3 ? 150 : 100,
        predictedRevenue: i < 3 ? 15000 : 10000,
        confidence: 0.8,
        demandLevel: i < 3 ? 'high' : 'medium',
        factors: [],
      }));

      const patterns: PatternAnalysis[] = [];
      const signals: any[] = [];
      const recommendations = (DemandForecastAgent as any).generateRecommendations(
        forecasts,
        patterns,
        signals
      );

      expect(recommendations.some((r: string) => r.includes('high-demand'))).toBe(true);
    });

    it('should generate recommendations for low demand days', () => {
      const forecasts: DemandForecast[] = Array.from({ length: 7 }, () => ({
        date: '2024-01-01',
        predictedOrders: 50,
        predictedRevenue: 5000,
        confidence: 0.7,
        demandLevel: 'low',
        factors: [],
      }));

      const recommendations = (DemandForecastAgent as any).generateRecommendations(
        forecasts,
        [],
        []
      );

      expect(recommendations.some((r: string) => r.includes('promotion') || r.includes('low-demand'))).toBe(true);
    });

    it('should limit recommendations to 10', () => {
      const forecasts: DemandForecast[] = Array.from({ length: 7 }, () => ({
        date: '2024-01-01',
        predictedOrders: 150,
        predictedRevenue: 15000,
        confidence: 0.8,
        demandLevel: 'high',
        factors: [],
      }));

      const patterns: PatternAnalysis[] = [
        { type: 'weekend_peak', description: 'Weekend peak', impact: 30, confidence: 0.8, affectedDays: [0, 6] },
        { type: 'weekday_low', description: 'Weekday low', impact: -20, confidence: 0.8, affectedDays: [1, 2, 3, 4, 5] },
        { type: 'seasonal', description: 'Seasonal', impact: 15, confidence: 0.7 },
        { type: 'trend', description: 'Trend', impact: 10, confidence: 0.75 },
      ];

      const recommendations = (DemandForecastAgent as any).generateRecommendations(
        forecasts,
        patterns,
        []
      );

      expect(recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('forecast', () => {
    it('should throw error for merchant with no stores', async () => {
      mockStoreFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await expect(DemandForecastAgent.forecast('merchant123')).rejects.toThrow('No stores found');
    });

    it('should complete forecast with valid data', async () => {
      mockStoreFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'store1' }]),
      });

      mockOrderAggregate.mockResolvedValue([
        { _id: '2024-01-01', orders: 50, revenue: 5000, uniqueCustomers: 45 },
        { _id: '2024-01-02', orders: 55, revenue: 5500, uniqueCustomers: 50 },
      ]);

      const result = await DemandForecastAgent.forecast('merchant123', 7);

      expect(result.merchantId).toBe('merchant123');
      expect(result.forecasts).toHaveLength(7);
      expect(result.patterns).toBeDefined();
      expect(result.demandSignals).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('getDemandAnalysis', () => {
    it('should return analysis for date range', async () => {
      mockStoreFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'store1' }]),
      });

      mockOrderAggregate.mockResolvedValue([
        { _id: '2024-01-01', orders: 100, revenue: 10000, uniqueCustomers: 90 },
        { _id: '2024-01-02', orders: 50, revenue: 5000, uniqueCustomers: 45 },
        { _id: '2024-01-03', orders: 150, revenue: 15000, uniqueCustomers: 130 },
      ]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      const result = await DemandForecastAgent.getDemandAnalysis('merchant123', startDate, endDate);

      expect(result.dailyData).toHaveLength(3);
      expect(result.summary.totalOrders).toBe(300);
      expect(result.summary.totalRevenue).toBe(30000);
      expect(result.summary.peakDay?.orders).toBe(150);
      expect(result.summary.lowDay?.orders).toBe(50);
    });
  });
});
