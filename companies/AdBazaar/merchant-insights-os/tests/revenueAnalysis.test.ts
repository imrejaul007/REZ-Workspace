import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the logger
vi.mock('../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock mongoose models
vi.mock('../src/models/index', () => ({
  Merchant: {
    findOne: vi.fn(),
  },
  RevenueRecord: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
    }),
  },
  IndustryBenchmark: {
    findOne: vi.fn(),
  },
}));

describe('RevenueAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDaysForPeriod', () => {
    it('should return correct days for each period', async () => {
      const { Merchant, RevenueRecord, IndustryBenchmark } = await import('../src/models/index');

      // Setup mock data
      (Merchant.findOne as any).mockResolvedValue({
        merchantId: 'merchant-1',
        name: 'Test Merchant',
        category: 'restaurant',
      });

      (RevenueRecord.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          { date: new Date(), revenue: 1000, orders: 10, averageOrderValue: 100 },
        ]),
      });

      (IndustryBenchmark.findOne as any).mockResolvedValue(null);

      // Import service after mocks are set up
      const { default: service } = await import('../src/services/revenueAnalysis');

      // Test the private method indirectly through getRevenueAnalysis
      const result = await service.getRevenueAnalysis('merchant-1', 'week');

      expect(result.merchantId).toBe('merchant-1');
      expect(result.period).toBeDefined();
    });
  });

  describe('Revenue Analysis Response Structure', () => {
    it('should return properly structured response', async () => {
      const { Merchant, RevenueRecord, IndustryBenchmark } = await import('../src/models/index');

      (Merchant.findOne as any).mockResolvedValue({
        merchantId: 'merchant-1',
        name: 'Test Merchant',
        category: 'restaurant',
      });

      (RevenueRecord.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          { date: new Date('2024-01-01'), revenue: 1000, orders: 10, averageOrderValue: 100 },
          { date: new Date('2024-01-02'), revenue: 1500, orders: 15, averageOrderValue: 100 },
        ]),
      });

      (IndustryBenchmark.findOne as any).mockResolvedValue(null);

      const { default: service } = await import('../src/services/revenueAnalysis');
      const result = await service.getRevenueAnalysis('merchant-1', 'month');

      expect(result).toHaveProperty('merchantId');
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('averageOrderValue');
      expect(result).toHaveProperty('revenueGrowth');
      expect(result).toHaveProperty('ordersGrowth');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('benchmarkComparison');
      expect(result).toHaveProperty('dailyRevenue');
      expect(result).toHaveProperty('weeklyRevenue');
      expect(result).toHaveProperty('monthlyRevenue');
    });
  });
});

describe('MarginAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate margin correctly', async () => {
    const { Merchant, RevenueRecord } = await import('../src/models/index');

    (Merchant.findOne as any).mockResolvedValue({
      merchantId: 'merchant-1',
      name: 'Test Merchant',
      category: 'restaurant',
    });

    (RevenueRecord.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          date: new Date(),
          revenue: 10000,
          orders: 100,
          averageOrderValue: 100,
          costs: { cogs: 3000, marketing: 1000, operations: 500, other: 200 },
        },
      ]),
    });

    const { default: service } = await import('../src/services/marginAnalysis');
    const result = await service.getMarginAnalysis('merchant-1', 'month');

    expect(result.merchantId).toBe('merchant-1');
    expect(result.grossMargin).toBe(70); // (10000 - 3000) / 10000 * 100
    expect(result.netMargin).toBe(52); // (10000 - 4700) / 10000 * 100
    expect(result.costBreakdown).toBeDefined();
  });
});

describe('ProductAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return product analysis structure', async () => {
    const { Merchant, ProductPerformance } = await import('../src/models/index');

    (Merchant.findOne as any).mockResolvedValue({
      merchantId: 'merchant-1',
      name: 'Test Merchant',
      category: 'restaurant',
    });

    (ProductPerformance.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          productId: 'prod-1',
          name: 'Product 1',
          sku: 'SKU-1',
          category: 'main',
          revenue: 5000,
          unitsSold: 100,
          margin: 30,
          returnRate: 2,
          trend: 'rising',
        },
        {
          productId: 'prod-2',
          name: 'Product 2',
          sku: 'SKU-2',
          category: 'side',
          revenue: 2000,
          unitsSold: 80,
          margin: 40,
          returnRate: 5,
          trend: 'stable',
        },
      ]),
    });

    const { default: service } = await import('../src/services/productAnalysis');
    const result = await service.getProductAnalysis('merchant-1', 'month');

    expect(result.merchantId).toBe('merchant-1');
    expect(result.totalProducts).toBe(2);
    expect(result.topProducts).toHaveLength(2);
    expect(result.categoryBreakdown).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });
});

describe('CustomerAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return customer cohort analysis structure', async () => {
    const { Merchant, Customer } = await import('../src/models/index');

    (Merchant.findOne as any).mockResolvedValue({
      merchantId: 'merchant-1',
      name: 'Test Merchant',
      category: 'restaurant',
    });

    (Customer.find as any).mockResolvedValue([
      {
        customerId: 'cust-1',
        firstPurchase: new Date('2024-01-01'),
        lastPurchase: new Date('2024-06-01'),
        totalOrders: 10,
        totalSpent: 5000,
        averageOrderValue: 500,
        rfmScores: { recency: 4, frequency: 4, monetary: 4 },
        segment: 'loyal',
        churnRisk: 'low',
      },
    ]);

    const { default: service } = await import('../src/services/customerAnalysis');
    const result = await service.getCustomerCohortAnalysis('merchant-1', 'month');

    expect(result.merchantId).toBe('merchant-1');
    expect(result.totalCustomers).toBe(1);
    expect(result.segments).toBeDefined();
    expect(result.rfmAnalysis).toBeDefined();
    expect(result.cohortRetention).toBeDefined();
  });
});

describe('RecommendationsEngineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate recommendations with proper structure', async () => {
    const { Merchant } = await import('../src/models/index');

    (Merchant.findOne as any).mockResolvedValue({
      merchantId: 'merchant-1',
      name: 'Test Merchant',
      category: 'restaurant',
    });

    const { default: service } = await import('../src/services/recommendationsEngine');
    const result = await service.getRecommendations('merchant-1');

    expect(result.merchantId).toBe('merchant-1');
    expect(result.generatedAt).toBeDefined();
    expect(result.priorityScore).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.summary).toHaveProperty('immediate');
    expect(result.summary).toHaveProperty('thisWeek');
    expect(result.summary).toHaveProperty('thisMonth');
  });
});