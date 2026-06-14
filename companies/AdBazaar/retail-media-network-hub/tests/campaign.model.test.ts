import { RetailMediaCampaign } from '../src/models/retailMediaCampaign.model.js';

describe('Campaign Model', () => {
  describe('campaignId generation', () => {
    it('should generate campaignId with RMN prefix on pre-save', async () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'sponsored_products',
        targeting: {
          category: ['Electronics'],
          keywords: ['laptop', 'phone'],
        },
        budget: {
          total: 10000,
          spent: 0,
        },
      });

      expect(campaign.campaignId).toBeUndefined();
      await campaign.save();
      expect(campaign.campaignId).toMatch(/^RMN-/);
    });
  });

  describe('ACOS calculation', () => {
    it('should calculate ACOS based on revenue and spend', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'display',
        targeting: {},
        budget: {
          total: 10000,
          spent: 500,
        },
        metrics: {
          impressions: 10000,
          clicks: 500,
          orders: 50,
          revenue: 2500,
          acos: 20, // 500/2500 = 0.2 = 20%
        },
      });

      expect(campaign.acos).toBe(20);
    });

    it('should return 0 ACOS when revenue is 0', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'video',
        targeting: {},
        budget: {
          total: 10000,
          spent: 100,
        },
        metrics: {
          impressions: 100,
          clicks: 10,
          orders: 0,
          revenue: 0,
          acos: 0,
        },
      });

      expect(campaign.acos).toBe(0);
    });
  });

  describe('validation', () => {
    it('should require merchantId', () => {
      const campaign = new RetailMediaCampaign({
        name: 'Test Campaign',
        type: 'sponsored_products',
        targeting: {},
        budget: {
          total: 10000,
        },
      });

      const error = campaign.validateSync();
      expect(error?.errors.merchantId).toBeDefined();
    });

    it('should require name', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        type: 'display',
        targeting: {},
        budget: {
          total: 10000,
        },
      });

      const error = campaign.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should validate campaign type enum', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'invalid_type',
        targeting: {},
        budget: {
          total: 10000,
        },
      });

      const error = campaign.validateSync();
      expect(error?.errors.type).toBeDefined();
    });
  });

  describe('targeting schema', () => {
    it('should allow empty targeting', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'search',
        targeting: {},
        budget: {
          total: 10000,
        },
      });

      const error = campaign.validateSync();
      expect(error).toBeUndefined();
    });

    it('should allow targeting with all fields', () => {
      const campaign = new RetailMediaCampaign({
        merchantId: 'merchant-123',
        name: 'Test Campaign',
        type: 'sponsored_products',
        targeting: {
          category: ['Electronics', 'Fashion'],
          keywords: ['laptop', 'phone', 'shirt'],
          priceRange: {
            min: 1000,
            max: 50000,
          },
          audienceType: 'repeat_buyers',
        },
        budget: {
          total: 10000,
        },
      });

      const error = campaign.validateSync();
      expect(error).toBeUndefined();
    });
  });
});