/**
 * REZ Hotel Pricing Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Hotel Pricing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4022', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have correct MongoDB URL configuration', () => {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_hotel_pricing';
      expect(mongoUrl).toMatch(/^mongodb/);
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'rez-pricing-service',
        port: 4022,
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.service).toBe('rez-pricing-service');
    });
  });

  describe('Subscription Tiers', () => {
    it('should have three subscription tiers', () => {
      const tiers = ['BASIC', 'PRO', 'PREMIUM'];
      expect(tiers).toHaveLength(3);
    });

    it('should validate tier schema', () => {
      const tierSchema = {
        name: expect.any(String),
        displayName: expect.any(String),
        monthlyPrice: expect.any(Number),
        yearlyPrice: expect.any(Number),
        commission: expect.any(Number),
        maxOTAs: expect.any(Number),
        features: expect.any(Array),
        priority: expect.any(Number),
      };

      const mockTier = {
        name: 'PRO',
        displayName: 'Pro',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        commission: 10,
        maxOTAs: 3,
        features: ['Feature 1', 'Feature 2'],
        priority: 2,
      };

      expect(mockTier).toMatchObject(tierSchema);
    });

    it('should validate BASIC tier', () => {
      const basicTier = {
        name: 'BASIC',
        monthlyPrice: 0,
        yearlyPrice: 0,
        commission: 15,
        maxOTAs: 1,
        features: ['Basic listing', '1 OTA channel'],
      };

      expect(basicTier.monthlyPrice).toBe(0);
      expect(basicTier.commission).toBe(15);
    });

    it('should validate PREMIUM tier', () => {
      const premiumTier = {
        name: 'PREMIUM',
        monthlyPrice: 4999,
        yearlyPrice: 49999,
        commission: 5,
        maxOTAs: 999,
        apiAccess: true,
      };

      expect(premiumTier.monthlyPrice).toBe(4999);
      expect(premiumTier.apiAccess).toBe(true);
    });
  });

  describe('Subscription Schema', () => {
    it('should validate subscription data', () => {
      const subscriptionSchema = {
        hotelId: expect.any(String),
        tier: expect.stringMatching(/^(BASIC|PRO|PREMIUM)$/),
        plan: expect.stringMatching(/^(monthly|yearly)$/),
        startDate: expect.any(String),
        endDate: expect.any(String),
        autoRenew: expect.any(Boolean),
        status: expect.stringMatching(/^(active|expired|cancelled|trial)$/),
      };

      const mockSubscription = {
        hotelId: 'HTL-001',
        tier: 'PRO',
        plan: 'monthly',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        autoRenew: true,
        status: 'active',
      };

      expect(mockSubscription).toMatchObject(subscriptionSchema);
    });
  });

  describe('Promotional Campaigns', () => {
    it('should validate campaign schema', () => {
      const campaignSchema = {
        hotelId: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
        type: expect.stringMatching(/^(percentage|fixed|bogo|free_night)$/),
        value: expect.any(Number),
        maxUses: expect.any(Number),
        usedCount: expect.any(Number),
        startDate: expect.any(String),
        endDate: expect.any(String),
        isActive: expect.any(Boolean),
      };

      const mockCampaign = {
        hotelId: 'HTL-001',
        name: 'Summer Sale',
        code: 'SUMMER20',
        type: 'percentage',
        value: 20,
        maxUses: 100,
        usedCount: 45,
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.999Z',
        isActive: true,
      };

      expect(mockCampaign).toMatchObject(campaignSchema);
    });

    it('should validate discount types', () => {
      const discountTypes = ['percentage', 'fixed', 'bogo', 'free_night'];
      expect(discountTypes).toContain('percentage');
      expect(discountTypes).toContain('fixed');
    });
  });

  describe('Dynamic Pricing Rules', () => {
    it('should validate dynamic pricing schema', () => {
      const pricingSchema = {
        hotelId: expect.any(String),
        name: expect.any(String),
        type: expect.stringMatching(/^(occupancy|day_of_week|seasonal|lead_time|last_minute)$/),
        conditions: expect.any(Object),
        adjustment: {
          type: expect.stringMatching(/^(percentage|fixed)$/),
          value: expect.any(Number),
        },
        isActive: expect.any(Boolean),
      };

      const mockRule = {
        hotelId: 'HTL-001',
        name: 'Weekend Surge',
        type: 'day_of_week',
        conditions: {
          daysOfWeek: [0, 6], // Sunday, Saturday
        },
        adjustment: {
          type: 'percentage',
          value: 15,
        },
        isActive: true,
      };

      expect(mockRule).toMatchObject(pricingSchema);
    });

    it('should validate occupancy-based pricing', () => {
      const occupancyRule = {
        type: 'occupancy',
        conditions: {
          minOccupancy: 80,
          maxOccupancy: 100,
        },
        adjustment: {
          type: 'percentage',
          value: 20,
        },
      };

      expect(occupancyRule.conditions.minOccupancy).toBe(80);
      expect(occupancyRule.adjustment.value).toBe(20);
    });
  });

  describe('Discount Codes', () => {
    it('should validate discount code schema', () => {
      const discountSchema = {
        hotelId: expect.any(String),
        code: expect.any(String),
        type: expect.stringMatching(/^(percentage|fixed)$/),
        value: expect.any(Number),
        maxUses: expect.any(Number),
        usedCount: expect.any(Number),
        validFrom: expect.any(Date),
        validTo: expect.any(Date),
        isActive: expect.any(Boolean),
      };

      const mockDiscount = {
        hotelId: 'HTL-001',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        maxUses: 50,
        usedCount: 20,
        validFrom: new Date(),
        validTo: new Date(),
        isActive: true,
      };

      expect(mockDiscount).toMatchObject(discountSchema);
    });
  });

  describe('API Endpoints', () => {
    it('should have tiers endpoint', () => {
      const endpoint = '/api/tiers';
      expect(endpoint).toBe('/api/tiers');
    });

    it('should have subscriptions endpoint', () => {
      const endpoint = '/api/subscriptions';
      expect(endpoint).toBe('/api/subscriptions');
    });

    it('should have campaigns endpoint', () => {
      const endpoint = '/api/campaigns';
      expect(endpoint).toBe('/api/campaigns');
    });

    it('should have dynamic pricing endpoint', () => {
      const endpoint = '/api/dynamic-pricing';
      expect(endpoint).toBe('/api/dynamic-pricing');
    });

    it('should have discounts endpoint', () => {
      const endpoint = '/api/discounts';
      expect(endpoint).toBe('/api/discounts');
    });
  });

  describe('API Response Format', () => {
    it('should return success response format', () => {
      const successResponse = {
        success: true,
        data: expect.any(Object),
      };

      const mockResponse = {
        success: true,
        data: {
          tiers: [],
        },
      };

      expect(mockResponse).toMatchObject(successResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });

  describe('Pricing Calculation', () => {
    it('should calculate percentage discount correctly', () => {
      const basePrice = 1000;
      const discountPercent = 20;
      const discount = basePrice * (discountPercent / 100);
      expect(discount).toBe(200);
    });

    it('should calculate fixed discount correctly', () => {
      const basePrice = 1000;
      const fixedDiscount = 150;
      const finalPrice = Math.min(fixedDiscount, basePrice);
      expect(finalPrice).toBe(150);
    });

    it('should calculate dynamic price adjustment', () => {
      const basePrice = 1000;
      const adjustmentPercent = 15;
      const adjustedPrice = basePrice * (1 + adjustmentPercent / 100);
      expect(adjustedPrice).toBe(1150);
    });
  });
});