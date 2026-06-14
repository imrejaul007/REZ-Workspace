import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  SponsoredProductSchema,
  AnalyticsQuerySchema,
} from '../src/types/index.js';

describe('Zod Schemas', () => {
  describe('CreateCampaignSchema', () => {
    it('should validate valid campaign data', () => {
      const data = {
        name: 'Test Campaign',
        type: 'sponsored_products',
        budget: {
          total: 10000,
        },
        targeting: {
          category: ['Electronics'],
        },
      };

      const result = CreateCampaignSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        type: 'display',
        budget: {
          total: 5000,
        },
        targeting: {},
      };

      const result = CreateCampaignSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid campaign type', () => {
      const data = {
        name: 'Test',
        type: 'invalid_type',
        budget: {
          total: 5000,
        },
        targeting: {},
      };

      const result = CreateCampaignSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative budget', () => {
      const data = {
        name: 'Test',
        type: 'video',
        budget: {
          total: -100,
        },
        targeting: {},
      };

      const result = CreateCampaignSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCampaignSchema', () => {
    it('should allow partial updates', () => {
      const data = {
        name: 'Updated Name',
      };

      const result = UpdateCampaignSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow status change', () => {
      const data = {
        status: 'paused',
      };

      const result = UpdateCampaignSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate products array', () => {
      const data = {
        products: [
          {
            productId: 'prod-123',
            bidAmount: 5,
            dailyBudget: 100,
          },
        ],
      };

      const result = UpdateCampaignSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('SponsoredProductSchema', () => {
    it('should validate sponsored product data', () => {
      const data = {
        productId: 'prod-123',
        campaignName: 'Sponsored Product Campaign',
        bidAmount: 5.5,
        dailyBudget: 100,
      };

      const result = SponsoredProductSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty productId', () => {
      const data = {
        productId: '',
        campaignName: 'Test',
        bidAmount: 5,
        dailyBudget: 100,
      };

      const result = SponsoredProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative bid amount', () => {
      const data = {
        productId: 'prod-123',
        campaignName: 'Test',
        bidAmount: -5,
        dailyBudget: 100,
      };

      const result = SponsoredProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('AnalyticsQuerySchema', () => {
    it('should validate query with all optional fields', () => {
      const data = {
        campaignId: 'RMN-123',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        groupBy: 'month',
      };

      const result = AnalyticsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty query', () => {
      const data = {};

      const result = AnalyticsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid groupBy value', () => {
      const data = {
        groupBy: 'year',
      };

      const result = AnalyticsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});