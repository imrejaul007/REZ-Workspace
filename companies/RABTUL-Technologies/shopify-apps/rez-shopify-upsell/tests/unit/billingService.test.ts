/**
 * ReZ Upsell - Billing Service Tests
 */

import { describe, it, expect } from '@jest/globals';
import { PLANS, BillingService } from '../src/server/services/billingService';

describe('Billing Service', () => {
  describe('Plans', () => {
    it('should have all required plans defined', () => {
      expect(PLANS.starter).toBeDefined();
      expect(PLANS.growth).toBeDefined();
      expect(PLANS.scale).toBeDefined();
    });

    it('should have correct pricing', () => {
      expect(PLANS.starter.price).toBe(999);
      expect(PLANS.growth.price).toBe(1999);
      expect(PLANS.scale.price).toBe(4999);
    });

    it('should have trial days', () => {
      expect(PLANS.starter.trialDays).toBe(14);
      expect(PLANS.growth.trialDays).toBe(14);
      expect(PLANS.scale.trialDays).toBe(14);
    });

    it('should have Indian Rupee currency', () => {
      expect(PLANS.starter.currency).toBe('INR');
      expect(PLANS.growth.currency).toBe('INR');
      expect(PLANS.scale.currency).toBe('INR');
    });

    it('should have escalating features', () => {
      expect(PLANS.starter.features.length).toBeLessThan(PLANS.growth.features.length);
      expect(PLANS.growth.features.length).toBeLessThan(PLANS.scale.features.length);
    });

    it('should have escalating limits', () => {
      expect(PLANS.starter.limits.maxOrders).toBeLessThan(PLANS.growth.limits.maxOrders);
      expect(PLANS.growth.limits.maxOrders).toBeLessThan(PLANS.scale.limits.maxOrders);
    });
  });

  describe('BillingService', () => {
    it('should be instantiable', () => {
      const billing = new BillingService();
      expect(billing).toBeDefined();
    });
  });
});

describe('Plan Limits', () => {
  describe('Starter Plan', () => {
    it('should limit to 1 store', () => {
      expect(PLANS.starter.limits.maxOrders).toBe(1000);
    });

    it('should limit products', () => {
      expect(PLANS.starter.limits.maxProducts).toBe(100);
    });

    it('should limit customers', () => {
      expect(PLANS.starter.limits.maxCustomers).toBe(5000);
    });
  });

  describe('Growth Plan', () => {
    it('should allow more orders', () => {
      expect(PLANS.growth.limits.maxOrders).toBe(10000);
    });

    it('should allow more products', () => {
      expect(PLANS.growth.limits.maxProducts).toBe(500);
    });

    it('should allow more customers', () => {
      expect(PLANS.growth.limits.maxCustomers).toBe(50000);
    });

    it('should include AI features', () => {
      expect(PLANS.growth.features).toContain('ai_recommendations');
    });

    it('should include A/B testing', () => {
      expect(PLANS.growth.features).toContain('ab_testing');
    });
  });

  describe('Scale Plan', () => {
    it('should allow unlimited orders', () => {
      expect(PLANS.scale.limits.maxOrders).toBe(100000);
    });

    it('should allow unlimited products', () => {
      expect(PLANS.scale.limits.maxProducts).toBe(-1);
    });

    it('should allow unlimited customers', () => {
      expect(PLANS.scale.limits.maxCustomers).toBe(-1);
    });

    it('should include API access', () => {
      expect(PLANS.scale.features).toContain('api_access');
    });

    it('should include white label', () => {
      expect(PLANS.scale.features).toContain('white_label');
    });
  });
});

describe('Feature Availability', () => {
  it('should have basic features in Starter', () => {
    const features = PLANS.starter.features;
    expect(features).toContain('checkout_upsells');
    expect(features).toContain('basic_analytics');
  });

  it('should have cart upsells in Growth+', () => {
    expect(PLANS.growth.features).toContain('cart_upsells');
    expect(PLANS.scale.features).toContain('cart_upsells');
  });

  it('should have AI in Growth+', () => {
    expect(PLANS.growth.features).toContain('ai_recommendations');
    expect(PLANS.scale.features).toContain('ai_recommendations');
  });
});
