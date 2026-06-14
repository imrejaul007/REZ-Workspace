import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevenueService, RevenueQuery, RevenueSummary } from './services/RevenueService';
import { CustomerAnalyticsService, CustomerQuery, CustomerAnalyticsSummary } from './services/CustomerAnalytics';
import { Report } from './models/Report';

// Mock dependencies
vi.mock('./config/database', () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
  })),
}));

vi.mock('./config', () => ({
  config: {
    analytics: {
      cacheDurations: {
        revenueSummary: 300,
        customerMetrics: 300,
      },
    },
    nodeEnv: 'test',
    port: 3000,
  },
}));

vi.mock('./models/Report', () => ({
  Report: {
    aggregate: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
  },
}));

vi.mock('./utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RevenueService', () => {
  let revenueService: RevenueService;
  let mockRedis: { get: any; setex: any };

  beforeEach(() => {
    revenueService = new RevenueService();
    vi.clearAllMocks();

    // Setup mock Redis client
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
    };

    const { getRedisClient } = require('./config/database');
    (getRedisClient as any).mockReturnValue(mockRedis);
  });

  describe('getCacheKey', () => {
    it('should generate unique cache key for different queries', () => {
      const query1: RevenueQuery = {
        restaurantId: 'rest-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const query2: RevenueQuery = {
        restaurantId: 'rest-2',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const key1 = revenueService.getCacheKey(query1);
      const key2 = revenueService.getCacheKey(query2);

      expect(key1).not.toBe(key2);
    });

    it('should include all query parameters in cache key', () => {
      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
        granularity: 'week',
      };

      const key = revenueService.getCacheKey(query);

      expect(key).toContain('rest-123');
      expect(key).toContain('week');
    });
  });

  describe('getRevenueSummary', () => {
    it('should return cached result when available', async () => {
      const cachedData: RevenueSummary = {
        total: 50000,
        previousTotal: 45000,
        changePercentage: 11.11,
        averageOrderValue: 250,
        totalOrders: 200,
        totalCustomers: 150,
        byPeriod: [],
        byPaymentMethod: {},
        byCategory: {},
        projections: {
          daily: 1666.67,
          weekly: 11666.67,
          monthly: 50000,
        },
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const result = await revenueService.getRevenueSummary(query);

      expect(result.total).toBe(50000);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should calculate change percentage correctly for positive growth', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      // Mock Report.aggregate for current and previous periods
      (Report.aggregate as any).mockResolvedValueOnce([
        { totalRevenue: 10000, orderCount: 50, uniqueCustomers: 40 },
      ]).mockResolvedValueOnce([
        { totalRevenue: 8000, orderCount: 40, uniqueCustomers: 35 },
      ]).mockResolvedValueOnce([]) // byPeriod
        .mockResolvedValueOnce([]) // byPaymentMethod
        .mockResolvedValueOnce([]); // byCategory

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const result = await revenueService.getRevenueSummary(query);

      expect(result.changePercentage).toBeCloseTo(25); // (10000-8000)/8000 * 100 = 25%
    });

    it('should handle zero previous period revenue', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      (Report.aggregate as any)
        .mockResolvedValueOnce([{ totalRevenue: 10000, orderCount: 50, uniqueCustomers: 40 }])
        .mockResolvedValueOnce([]) // No previous data
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const result = await revenueService.getRevenueSummary(query);

      expect(result.changePercentage).toBe(0);
    });

    it('should calculate average order value correctly', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      (Report.aggregate as any)
        .mockResolvedValueOnce([{ totalRevenue: 10000, orderCount: 50, uniqueCustomers: 40 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const result = await revenueService.getRevenueSummary(query);

      expect(result.averageOrderValue).toBe(200); // 10000/50
    });

    it('should handle zero orders gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      (Report.aggregate as any)
        .mockResolvedValueOnce([{ totalRevenue: 0, orderCount: 0, uniqueCustomers: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      const result = await revenueService.getRevenueSummary(query);

      expect(result.averageOrderValue).toBe(0);
    });

    it('should cache result after calculation', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      (Report.aggregate as any).mockResolvedValue([]);

      const query: RevenueQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        granularity: 'day',
      };

      await revenueService.getRevenueSummary(query);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.any(String),
        300,
        expect.any(String)
      );
    });
  });

  describe('getDateFormat', () => {
    it('should return correct format for hourly granularity', () => {
      const format = (revenueService as any).getDateFormat('hour');
      expect(format).toBe('%Y-%m-%d %H:00');
    });

    it('should return correct format for daily granularity', () => {
      const format = (revenueService as any).getDateFormat('day');
      expect(format).toBe('%Y-%m-%d');
    });

    it('should return correct format for weekly granularity', () => {
      const format = (revenueService as any).getDateFormat('week');
      expect(format).toBe('%Y-W%V');
    });

    it('should return correct format for monthly granularity', () => {
      const format = (revenueService as any).getDateFormat('month');
      expect(format).toBe('%Y-%m');
    });

    it('should default to daily format for unknown granularity', () => {
      const format = (revenueService as any).getDateFormat('unknown');
      expect(format).toBe('%Y-%m-%d');
    });
  });

  describe('getDaysInRange', () => {
    it('should calculate days between two dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const days = (revenueService as any).getDaysInRange(startDate, endDate);

      expect(days).toBe(31);
    });

    it('should return at least 1 day for same-day range', () => {
      const sameDay = new Date('2024-01-15');

      const days = (revenueService as any).getDaysInRange(sameDay, sameDay);

      expect(days).toBe(1);
    });

    it('should handle month boundaries', () => {
      const startDate = new Date('2024-01-30');
      const endDate = new Date('2024-02-02');

      const days = (revenueService as any).getDaysInRange(startDate, endDate);

      expect(days).toBe(4);
    });
  });

  describe('getHourlyRevenue', () => {
    it('should return 24 hours of data', async () => {
      (Report.aggregate as any).mockResolvedValueOnce([]);

      const result = await revenueService.getHourlyRevenue('rest-123', new Date('2024-06-15'));

      expect(result).toHaveLength(24);
      expect(result[0].hour).toBe(0);
      expect(result[23].hour).toBe(23);
    });

    it('should return zero revenue for all hours when no data', async () => {
      (Report.aggregate as any).mockResolvedValueOnce([]);

      const result = await revenueService.getHourlyRevenue('rest-123', new Date('2024-06-15'));

      expect(result.every(h => h.revenue === 0)).toBe(true);
    });

    it('should map aggregated data to correct hours', async () => {
      (Report.aggregate as any).mockResolvedValueOnce([
        { hour: 12, revenue: 5000 },
        { hour: 18, revenue: 8000 },
      ]);

      const result = await revenueService.getHourlyRevenue('rest-123', new Date('2024-06-15'));

      expect(result[12].revenue).toBe(5000);
      expect(result[18].revenue).toBe(8000);
    });

    it('should handle errors gracefully', async () => {
      (Report.aggregate as any).mockRejectedValueOnce(new Error('Database error'));

      const result = await revenueService.getHourlyRevenue('rest-123', new Date('2024-06-15'));

      expect(result).toHaveLength(24);
      expect(result.every(h => h.revenue === 0)).toBe(true);
    });
  });
});

describe('CustomerAnalyticsService', () => {
  let customerAnalyticsService: CustomerAnalyticsService;

  beforeEach(() => {
    customerAnalyticsService = new CustomerAnalyticsService();
    vi.clearAllMocks();

    // Setup mock Redis client
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
    };

    const { getRedisClient } = require('./config/database');
    (getRedisClient as any).mockReturnValue(mockRedis);
  });

  describe('getCacheKey', () => {
    it('should generate unique cache key for different restaurants', () => {
      const query1: CustomerQuery = {
        restaurantId: 'rest-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const query2: CustomerQuery = {
        restaurantId: 'rest-2',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const key1 = customerAnalyticsService.getCacheKey(query1);
      const key2 = customerAnalyticsService.getCacheKey(query2);

      expect(key1).not.toBe(key2);
    });

    it('should include date range in cache key', () => {
      const query: CustomerQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      };

      const key = customerAnalyticsService.getCacheKey(query);

      expect(key).toContain('rest-123');
      expect(key).toContain('2024-06-01');
      expect(key).toContain('2024-06-30');
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return cached result when available', async () => {
      const cachedData: CustomerAnalyticsSummary = {
        totalCustomers: 500,
        newCustomers: 100,
        returningCustomers: 400,
        customerMetrics: {
          newCustomers: 100,
          returningCustomers: 400,
          retentionRate: 80,
          churnRate: 5,
          averageVisitsPerCustomer: 3.5,
          averageOrderFrequency: 2.1,
        },
        customerLifetimeValue: {
          averageLTV: 5000,
          medianLTV: 3500,
          totalLTV: 2500000,
        },
        visitFrequency: [],
        customerSegments: {
          vip: 50,
          regular: 200,
          occasional: 150,
          atRisk: 75,
          churned: 25,
        },
        cohortAnalysis: [],
        topCustomers: [],
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const query: CustomerQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await customerAnalyticsService.getCustomerAnalytics(query);

      expect(result.totalCustomers).toBe(500);
    });

    it('should calculate total customers from new and returning', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      // Mock Report.findOne
      (Report.findOne as any).mockResolvedValueOnce({
        customerMetrics: {
          newCustomers: 50,
          returningCustomers: 150,
          retentionRate: 75,
          churnRate: 10,
          averageVisitsPerCustomer: 2.5,
          averageOrderFrequency: 1.8,
        },
      });

      // Mock aggregations
      (Report.aggregate as any)
        .mockResolvedValueOnce([]) // visitFrequency
        .mockResolvedValueOnce([]) // customerSegments
        .mockResolvedValueOnce([]) // cohortAnalysis
        .mockResolvedValueOnce([]) // topCustomers
        .mockResolvedValueOnce([]); // ltvData

      const query: CustomerQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await customerAnalyticsService.getCustomerAnalytics(query);

      expect(result.totalCustomers).toBe(200); // 50 + 150
    });

    it('should handle empty metrics gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      (Report.findOne as any).mockResolvedValueOnce(null);

      (Report.aggregate as any)
        .mockResolvedValueOnce([]) // visitFrequency
        .mockResolvedValueOnce([]) // customerSegments
        .mockResolvedValueOnce([]) // cohortAnalysis
        .mockResolvedValueOnce([]) // topCustomers
        .mockResolvedValueOnce([]); // ltvData

      const query: CustomerQuery = {
        restaurantId: 'rest-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await customerAnalyticsService.getCustomerAnalytics(query);

      expect(result.totalCustomers).toBe(0);
      expect(result.newCustomers).toBe(0);
      expect(result.returningCustomers).toBe(0);
    });
  });

  describe('getRetentionMetrics', () => {
    it('should return retention metrics with n-day retention array', async () => {
      const result = await customerAnalyticsService.getRetentionMetrics(
        'rest-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toHaveProperty('retentionRate');
      expect(result).toHaveProperty('churnRate');
      expect(result).toHaveProperty('nDayRetention');
      expect(result.nDayRetention).toHaveLength(5);
    });

    it('should include standard n-day retention points', async () => {
      const result = await customerAnalyticsService.getRetentionMetrics(
        'rest-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const days = result.nDayRetention.map((d: any) => d.day);

      expect(days).toContain(1);
      expect(days).toContain(7);
      expect(days).toContain(30);
      expect(days).toContain(60);
      expect(days).toContain(90);
    });

    it('should cache retention metrics', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await customerAnalyticsService.getRetentionMetrics(
        'rest-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('retention:rest-123'),
        300,
        expect.any(String)
      );
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        retentionRate: 85,
        churnRate: 10,
        nDayRetention: [
          { day: 1, rate: 90 },
          { day: 7, rate: 70 },
          { day: 30, rate: 50 },
          { day: 60, rate: 35 },
          { day: 90, rate: 25 },
        ],
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await customerAnalyticsService.getRetentionMetrics(
        'rest-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.retentionRate).toBe(85);
      expect(result.nDayRetention[0].rate).toBe(90);
    });
  });

  describe('getDefaultCustomerMetrics', () => {
    it('should return zero values for default metrics', () => {
      const defaults = (customerAnalyticsService as any).getDefaultCustomerMetrics();

      expect(defaults.newCustomers).toBe(0);
      expect(defaults.returningCustomers).toBe(0);
      expect(defaults.retentionRate).toBe(0);
      expect(defaults.churnRate).toBe(0);
      expect(defaults.averageVisitsPerCustomer).toBe(0);
      expect(defaults.averageOrderFrequency).toBe(0);
    });
  });
});
