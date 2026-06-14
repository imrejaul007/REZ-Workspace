import { ScoringService } from '../services/ScoringService';
import { MerchantProfileDocument } from '../models';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
  });

  describe('calculateHealthScore', () => {
    it('should return a valid health score object', () => {
      const mockProfile = {
        merchantId: 'test-merchant-1',
        businessName: 'Test Business',
        businessType: 'restaurant',
        category: 'food',
        location: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'US',
        },
        contact: {
          email: 'test@test.com',
          phone: '123-456-7890',
        },
        lastSyncedAt: new Date(),
        revenuePatterns: {
          daily: [],
          weekly: [],
          monthly: [],
          averageOrderValue: 50,
          totalRevenue: 10000,
          revenueGrowth: { mom: 5, wow: 2 },
        },
        orderVolume: {
          total: 100,
          completed: 90,
          cancelled: 5,
          refunded: 3,
          pending: 2,
          averagePerDay: 10,
          averagePerWeek: 70,
          frequency: { daily: 10, weekly: 70, monthly: 300 },
          peakTimes: [],
        },
        customerDemographics: {
          totalCustomers: 50,
          newCustomers: 10,
          returningCustomers: 40,
          retentionRate: 0.8,
          demographics: {
            ageGroups: { '18-24': 10, '25-34': 20, '35-44': 15, '45-54': 10, '55+': 5 },
            customerTypes: { individual: 35, business: 10, premium: 5 },
            locations: [],
            orderPatterns: {
              timeOfDay: { morning: 15, afternoon: 35, evening: 40, night: 10 },
              orderSize: { small: 20, medium: 25, large: 5 },
              frequency: { occasional: 15, regular: 25, frequent: 10 },
            },
          },
          topCustomers: [],
          customerLifetimeValue: {
            average: 200,
            median: 150,
            distribution: [],
          },
        },
        inventoryPatterns: {
          totalProducts: 30,
          activeProducts: 28,
          outOfStock: 2,
          lowStock: 3,
          averageStockLevel: 25,
          turnoverRate: 5,
          reorderFrequency: 4,
          topCategories: [],
          stockAlerts: [],
          restockPatterns: [],
        },
        healthSignals: {
          overall: { status: 'healthy', score: 85, factors: [] },
          alerts: [],
          warnings: [],
          indicators: [],
          lastHealthCheck: new Date(),
        },
      } as unknown as MerchantProfileDocument;

      const healthScore = scoringService.calculateHealthScore(mockProfile);

      expect(healthScore).toBeDefined();
      expect(healthScore.score).toBeGreaterThanOrEqual(0);
      expect(healthScore.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(healthScore.grade);
      expect(healthScore.components).toBeDefined();
      expect(healthScore.factors).toBeDefined();
    });

    it('should handle missing data gracefully', () => {
      const mockProfile = {
        merchantId: 'test-merchant-2',
        businessName: 'Test Business 2',
        businessType: 'retail',
        category: 'general',
        location: {
          address: '456 Test Ave',
          city: 'Test Town',
          state: 'TS',
          country: 'US',
        },
        contact: {
          email: 'test2@test.com',
          phone: '098-765-4321',
        },
        lastSyncedAt: new Date(),
      } as unknown as MerchantProfileDocument;

      const healthScore = scoringService.calculateHealthScore(mockProfile);

      expect(healthScore).toBeDefined();
      expect(healthScore.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateGrowthScore', () => {
    it('should calculate growth score based on growth metrics', () => {
      const mockProfile = {
        merchantId: 'test-merchant-3',
        businessName: 'Test Business 3',
        businessType: 'retail',
        category: 'general',
        location: {
          address: '789 Test Blvd',
          city: 'Test City',
          state: 'TS',
          country: 'US',
        },
        contact: {
          email: 'test3@test.com',
          phone: '111-222-3333',
        },
        lastSyncedAt: new Date(),
        growthMetrics: {
          revenue: {
            current: 15000,
            previous: 10000,
            change: 5000,
            percentageChange: 50,
            trend: 'up',
            momentum: 'accelerating',
          },
          orders: {
            current: 200,
            previous: 150,
            change: 50,
            percentageChange: 33,
            trend: 'up',
            momentum: 'steady',
          },
          customers: {
            current: 100,
            previous: 80,
            change: 20,
            percentageChange: 25,
            trend: 'up',
            momentum: 'steady',
          },
          averageOrderValue: {
            current: 75,
            previous: 66,
            change: 9,
            percentageChange: 13.6,
            trend: 'up',
            momentum: 'steady',
          },
          customerRetention: {
            current: 0.85,
            previous: 0.80,
            change: 0.05,
            percentageChange: 6.25,
            trend: 'up',
            momentum: 'steady',
          },
        },
        customerDemographics: {
          totalCustomers: 100,
          demographics: {
            locations: [
              { location: 'Downtown', count: 50, percentage: 50 },
              { location: 'Uptown', count: 30, percentage: 30 },
              { location: 'Suburbs', count: 20, percentage: 20 },
            ],
          },
        },
      } as unknown as MerchantProfileDocument;

      const growthScore = scoringService.calculateGrowthScore(mockProfile);

      expect(growthScore).toBeDefined();
      expect(growthScore.score).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(growthScore.grade);
      expect(['accelerating', 'stable', 'decelerating']).toContain(growthScore.momentum);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score based on customer activity', () => {
      const mockProfile = {
        merchantId: 'test-merchant-4',
        businessName: 'Test Business 4',
        businessType: 'restaurant',
        category: 'food',
        location: {
          address: '100 Test Lane',
          city: 'Test City',
          state: 'TS',
          country: 'US',
        },
        contact: {
          email: 'test4@test.com',
          phone: '444-555-6666',
        },
        lastSyncedAt: new Date(),
        customerDemographics: {
          totalCustomers: 50,
          newCustomers: 10,
          returningCustomers: 40,
          retentionRate: 0.8,
          topCustomers: [
            {
              customerId: 'cust-1',
              totalOrders: 20,
              totalSpent: 1000,
              averageOrderValue: 50,
              lastOrderDate: new Date(),
              customerType: 'regular',
            },
            {
              customerId: 'cust-2',
              totalOrders: 15,
              totalSpent: 750,
              averageOrderValue: 50,
              lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              customerType: 'regular',
            },
          ],
        },
        orderVolume: {
          total: 100,
          completed: 95,
        },
      } as unknown as MerchantProfileDocument;

      const engagementScore = scoringService.calculateEngagementScore(mockProfile);

      expect(engagementScore).toBeDefined();
      expect(engagementScore.score).toBeGreaterThanOrEqual(0);
      expect(engagementScore.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(engagementScore.grade);
    });
  });

  describe('identifyRiskIndicators', () => {
    it('should identify risks based on profile data', () => {
      const mockProfile = {
        merchantId: 'test-merchant-5',
        businessName: 'Test Business 5',
        businessType: 'retail',
        category: 'general',
        location: {
          address: '200 Test Way',
          city: 'Test City',
          state: 'TS',
          country: 'US',
        },
        contact: {
          email: 'test5@test.com',
          phone: '777-888-9999',
        },
        lastSyncedAt: new Date(),
        growthMetrics: {
          revenue: {
            current: 8000,
            previous: 10000,
            change: -2000,
            percentageChange: -20,
            trend: 'down',
            momentum: 'decelerating',
          },
          customerRetention: {
            current: 0.4,
            previous: 0.5,
            change: -0.1,
            percentageChange: -20,
            trend: 'down',
            momentum: 'decelerating',
          },
        },
        inventoryPatterns: {
          totalProducts: 50,
          outOfStock: 15,
        },
        healthSignals: {
          alerts: [
            { id: 'alert-1', type: 'low_revenue', severity: 'high', message: 'Revenue declining', acknowledged: false },
            { id: 'alert-2', type: 'low_revenue', severity: 'medium', message: 'Revenue below target', acknowledged: false },
            { id: 'alert-3', type: 'inventory_issue', severity: 'low', message: 'Low stock', acknowledged: false },
            { id: 'alert-4', type: 'inventory_issue', severity: 'high', message: 'Out of stock', acknowledged: false },
          ],
        },
      } as unknown as MerchantProfileDocument;

      const healthScore = {
        score: 35,
        grade: 'F' as const,
        components: {},
        factors: [],
      };

      const growthScore = {
        score: 30,
        grade: 'F' as const,
        components: {},
        momentum: 'decelerating' as const,
      };

      const risks = scoringService.identifyRiskIndicators(mockProfile, healthScore, growthScore);

      expect(risks).toBeDefined();
      expect(risks.length).toBeGreaterThan(0);
      expect(risks.some(r => r.type === 'declining_revenue')).toBe(true);
    });
  });
});
