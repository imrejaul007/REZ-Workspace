import { describe, it, expect } from 'vitest';
import {
  insightsQuerySchema,
  revenueQuerySchema,
  productsQuerySchema,
  recommendationsQuerySchema,
  createMerchantSchema,
  createRevenueRecordSchema,
  createProductPerformanceSchema,
  createCustomerSchema,
} from '../src/middleware/validation.js';

describe('Validation Schemas', () => {
  describe('insightsQuerySchema', () => {
    it('should accept valid period values', () => {
      expect(insightsQuerySchema.parse({ period: 'week' })).toEqual({ period: 'week' });
      expect(insightsQuerySchema.parse({ period: 'month' })).toEqual({ period: 'month' });
      expect(insightsQuerySchema.parse({ period: 'quarter' })).toEqual({ period: 'quarter' });
      expect(insightsQuerySchema.parse({ period: 'year' })).toEqual({ period: 'year' });
    });

    it('should default to month when no period provided', () => {
      expect(insightsQuerySchema.parse({})).toEqual({ period: 'month' });
    });

    it('should reject invalid period values', () => {
      expect(() => insightsQuerySchema.parse({ period: 'invalid' })).toThrow();
    });
  });

  describe('revenueQuerySchema', () => {
    it('should accept valid date formats', () => {
      expect(revenueQuerySchema.parse({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: 'daily',
      })).toBeDefined();
    });

    it('should accept valid granularity values', () => {
      expect(revenueQuerySchema.parse({ granularity: 'daily' })).toEqual({
        granularity: 'daily',
        startDate: undefined,
        endDate: undefined,
      });
      expect(revenueQuerySchema.parse({ granularity: 'weekly' })).toEqual({
        granularity: 'weekly',
        startDate: undefined,
        endDate: undefined,
      });
      expect(revenueQuerySchema.parse({ granularity: 'monthly' })).toEqual({
        granularity: 'monthly',
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should reject invalid date formats', () => {
      expect(() => revenueQuerySchema.parse({ startDate: '2024/01/01' })).toThrow();
      expect(() => revenueQuerySchema.parse({ startDate: '01-01-2024' })).toThrow();
    });
  });

  describe('productsQuerySchema', () => {
    it('should accept valid sortBy values', () => {
      expect(productsQuerySchema.parse({ sortBy: 'revenue' })).toEqual({
        sortBy: 'revenue',
        limit: 20,
      });
      expect(productsQuerySchema.parse({ sortBy: 'units' })).toEqual({
        sortBy: 'units',
        limit: 20,
      });
      expect(productsQuerySchema.parse({ sortBy: 'margin' })).toEqual({
        sortBy: 'margin',
        limit: 20,
      });
      expect(productsQuerySchema.parse({ sortBy: 'growth' })).toEqual({
        sortBy: 'growth',
        limit: 20,
      });
    });

    it('should enforce limit bounds', () => {
      expect(productsQuerySchema.parse({ limit: '50' })).toEqual({
        sortBy: 'revenue',
        limit: 50,
      });
      expect(() => productsQuerySchema.parse({ limit: '0' })).toThrow();
      expect(() => productsQuerySchema.parse({ limit: '101' })).toThrow();
    });
  });

  describe('recommendationsQuerySchema', () => {
    it('should accept valid category values', () => {
      expect(recommendationsQuerySchema.parse({ category: 'all' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ category: 'revenue' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ category: 'marketing' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ category: 'inventory' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ category: 'pricing' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ category: 'customer' })).toBeDefined();
    });

    it('should accept valid priority values', () => {
      expect(recommendationsQuerySchema.parse({ priority: 'all' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ priority: 'critical' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ priority: 'high' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ priority: 'medium' })).toBeDefined();
      expect(recommendationsQuerySchema.parse({ priority: 'low' })).toBeDefined();
    });
  });

  describe('createMerchantSchema', () => {
    it('should accept valid merchant data', () => {
      const validData = {
        merchantId: 'merchant-123',
        name: 'Test Restaurant',
        category: 'restaurant',
        subcategory: 'fine-dining',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      };

      const result = createMerchantSchema.parse(validData);
      expect(result.merchantId).toBe('merchant-123');
      expect(result.name).toBe('Test Restaurant');
    });

    it('should reject missing required fields', () => {
      expect(() => createMerchantSchema.parse({ name: 'Test' })).toThrow();
      expect(() => createMerchantSchema.parse({ merchantId: 'test' })).toThrow();
    });

    it('should reject invalid location data', () => {
      expect(() => createMerchantSchema.parse({
        merchantId: 'test',
        name: 'Test',
        category: 'test',
        location: { city: 'Mumbai' }, // Missing state and pincode
      })).toThrow();
    });
  });

  describe('createRevenueRecordSchema', () => {
    it('should accept valid revenue record data', () => {
      const validData = {
        merchantId: 'merchant-123',
        date: '2024-01-15',
        revenue: 5000,
        orders: 50,
        averageOrderValue: 100,
      };

      const result = createRevenueRecordSchema.parse(validData);
      expect(result.merchantId).toBe('merchant-123');
      expect(result.revenue).toBe(5000);
    });

    it('should accept datetime format for date', () => {
      const validData = {
        merchantId: 'merchant-123',
        date: '2024-01-15T10:30:00.000Z',
        revenue: 5000,
        orders: 50,
        averageOrderValue: 100,
      };

      expect(createRevenueRecordSchema.parse(validData)).toBeDefined();
    });

    it('should reject negative values', () => {
      expect(() => createRevenueRecordSchema.parse({
        merchantId: 'test',
        date: '2024-01-15',
        revenue: -100,
        orders: 50,
        averageOrderValue: 100,
      })).toThrow();
    });

    it('should reject non-integer orders', () => {
      expect(() => createRevenueRecordSchema.parse({
        merchantId: 'test',
        date: '2024-01-15',
        revenue: 5000,
        orders: 50.5,
        averageOrderValue: 100,
      })).toThrow();
    });
  });

  describe('createProductPerformanceSchema', () => {
    it('should accept valid product performance data', () => {
      const validData = {
        merchantId: 'merchant-123',
        productId: 'prod-1',
        name: 'Burger',
        sku: 'BRG-001',
        category: 'food',
        revenue: 10000,
        unitsSold: 200,
        margin: 35,
        returnRate: 2,
        trend: 'rising',
      };

      const result = createProductPerformanceSchema.parse(validData);
      expect(result.productId).toBe('prod-1');
      expect(result.trend).toBe('rising');
    });

    it('should default optional fields', () => {
      const minimalData = {
        merchantId: 'merchant-123',
        productId: 'prod-1',
        name: 'Burger',
        sku: 'BRG-001',
        category: 'food',
        revenue: 10000,
        unitsSold: 200,
        margin: 35,
      };

      const result = createProductPerformanceSchema.parse(minimalData);
      expect(result.returnRate).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should reject margin outside 0-100 range', () => {
      expect(() => createProductPerformanceSchema.parse({
        merchantId: 'test',
        productId: 'prod-1',
        name: 'Test',
        sku: 'SKU-1',
        category: 'test',
        revenue: 10000,
        unitsSold: 200,
        margin: 150, // Invalid - above 100
      })).toThrow();
    });
  });

  describe('createCustomerSchema', () => {
    it('should accept valid customer data', () => {
      const validData = {
        merchantId: 'merchant-123',
        customerId: 'cust-1',
        email: 'customer@example.com',
        phone: '+919876543210',
        firstPurchase: '2024-01-01',
        lastPurchase: '2024-06-01',
        totalOrders: 15,
        totalSpent: 7500,
        averageOrderValue: 500,
        rfmScores: {
          recency: 4,
          frequency: 4,
          monetary: 4,
        },
        segment: 'loyal',
        churnRisk: 'low',
      };

      const result = createCustomerSchema.parse(validData);
      expect(result.customerId).toBe('cust-1');
      expect(result.segment).toBe('loyal');
    });

    it('should accept valid email format', () => {
      const validData = {
        merchantId: 'merchant-123',
        customerId: 'cust-1',
        email: 'test@example.com',
        firstPurchase: '2024-01-01',
        lastPurchase: '2024-06-01',
      };

      expect(createCustomerSchema.parse(validData)).toBeDefined();
    });

    it('should reject invalid email format', () => {
      expect(() => createCustomerSchema.parse({
        merchantId: 'merchant-123',
        customerId: 'cust-1',
        email: 'invalid-email',
        firstPurchase: '2024-01-01',
        lastPurchase: '2024-06-01',
      })).toThrow();
    });

    it('should reject invalid churn risk values', () => {
      expect(() => createCustomerSchema.parse({
        merchantId: 'merchant-123',
        customerId: 'cust-1',
        firstPurchase: '2024-01-01',
        lastPurchase: '2024-06-01',
        churnRisk: 'unknown',
      })).toThrow();
    });
  });
});