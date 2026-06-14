/**
 * Validation Schemas Unit Tests
 */

import {
  feedUploadSchema,
  createCampaignSchema,
  updateCampaignSchema,
  previewRequestSchema,
  renderRequestSchema,
  batchRenderRequestSchema,
  listFeedsQuerySchema,
  listCampaignsQuerySchema,
} from '../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('feedUploadSchema', () => {
    it('should validate a valid feed upload', () => {
      const validFeed = {
        name: 'Test Feed',
        merchantId: 'merchant-001',
        source: 'manual',
        products: [
          {
            productId: 'prod-001',
            name: 'Test Product',
            category: 'Electronics',
            price: 999,
            imageUrl: 'https://example.com/image.jpg',
            url: 'https://example.com/product',
            availability: 'in_stock',
          },
        ],
      };

      const result = feedUploadSchema.safeParse(validFeed);
      expect(result.success).toBe(true);
    });

    it('should reject feed without name', () => {
      const invalidFeed = {
        merchantId: 'merchant-001',
        source: 'manual',
        products: [],
      };

      const result = feedUploadSchema.safeParse(invalidFeed);
      expect(result.success).toBe(false);
    });

    it('should reject feed with empty products array', () => {
      const invalidFeed = {
        name: 'Test Feed',
        merchantId: 'merchant-001',
        source: 'manual',
        products: [],
      };

      const result = feedUploadSchema.safeParse(invalidFeed);
      expect(result.success).toBe(false);
    });

    it('should validate shopify source', () => {
      const shopifyFeed = {
        name: 'Shopify Feed',
        merchantId: 'merchant-001',
        source: 'shopify',
        products: [
          {
            productId: 'prod-001',
            name: 'Test Product',
            category: 'Electronics',
            price: 999,
            imageUrl: 'https://example.com/image.jpg',
            url: 'https://example.com/product',
            availability: 'in_stock',
          },
        ],
      };

      const result = feedUploadSchema.safeParse(shopifyFeed);
      expect(result.success).toBe(true);
    });

    it('should reject invalid source', () => {
      const invalidFeed = {
        name: 'Test Feed',
        merchantId: 'merchant-001',
        source: 'invalid-source',
        products: [
          {
            productId: 'prod-001',
            name: 'Test Product',
            category: 'Electronics',
            price: 999,
            imageUrl: 'https://example.com/image.jpg',
            url: 'https://example.com/product',
            availability: 'in_stock',
          },
        ],
      };

      const result = feedUploadSchema.safeParse(invalidFeed);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalFeed = {
        name: 'Test Feed',
        merchantId: 'merchant-001',
        products: [
          {
            productId: 'prod-001',
            name: 'Test Product',
            category: 'Electronics',
            price: 999,
            imageUrl: 'https://example.com/image.jpg',
            url: 'https://example.com/product',
            availability: 'in_stock',
          },
        ],
      };

      const result = feedUploadSchema.safeParse(minimalFeed);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('manual');
        expect(result.data.products[0].currency).toBe('INR');
      }
    });
  });

  describe('createCampaignSchema', () => {
    it('should validate a valid campaign', () => {
      const validCampaign = {
        name: 'Test Campaign',
        advertiserId: 'advertiser-001',
        feedId: 'feed-001',
        template: {
          layout: 'single',
          dimensions: { width: 1200, height: 628 },
          elements: [
            {
              type: 'product_image',
              position: { x: 0, y: 0, width: 600, height: 628 },
              style: {},
            },
          ],
        },
      };

      const result = createCampaignSchema.safeParse(validCampaign);
      expect(result.success).toBe(true);
    });

    it('should reject campaign without feedId', () => {
      const invalidCampaign = {
        name: 'Test Campaign',
        advertiserId: 'advertiser-001',
        template: {
          layout: 'single',
          dimensions: { width: 1200, height: 628 },
          elements: [],
        },
      };

      const result = createCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should accept optional rules and targeting', () => {
      const campaignWithRules = {
        name: 'Test Campaign',
        advertiserId: 'advertiser-001',
        feedId: 'feed-001',
        template: {
          layout: 'single',
          dimensions: { width: 1200, height: 628 },
          elements: [
            {
              type: 'product_image',
              position: { x: 0, y: 0, width: 600, height: 628 },
              style: {},
            },
          ],
        },
        rules: {
          minPrice: 100,
          maxPrice: 1000,
          categories: ['Electronics'],
        },
        targeting: {
          browsingHistory: true,
          cartAbandoners: true,
        },
      };

      const result = createCampaignSchema.safeParse(campaignWithRules);
      expect(result.success).toBe(true);
    });

    it('should validate element types', () => {
      const campaignWithAllElements = {
        name: 'Test Campaign',
        advertiserId: 'advertiser-001',
        feedId: 'feed-001',
        template: {
          layout: 'grid',
          dimensions: { width: 1200, height: 628 },
          elements: [
            { type: 'product_image', position: { x: 0, y: 0, width: 100, height: 100 }, style: {} },
            { type: 'product_name', position: { x: 0, y: 100, width: 100, height: 50 }, style: {} },
            { type: 'price', position: { x: 0, y: 150, width: 100, height: 30 }, style: {} },
            { type: 'discount', position: { x: 0, y: 180, width: 100, height: 30 }, style: {} },
            { type: 'cta', position: { x: 0, y: 210, width: 100, height: 40 }, style: {} },
          ],
        },
      };

      const result = createCampaignSchema.safeParse(campaignWithAllElements);
      expect(result.success).toBe(true);
    });
  });

  describe('updateCampaignSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Campaign Name',
      };

      const result = updateCampaignSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow status update', () => {
      const statusUpdate = {
        status: 'paused',
      };

      const result = updateCampaignSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate status values', () => {
      const invalidStatus = {
        status: 'invalid-status',
      };

      const result = updateCampaignSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  describe('previewRequestSchema', () => {
    it('should validate a valid preview request', () => {
      const validPreview = {
        campaignId: 'campaign-001',
        productId: 'prod-001',
      };

      const result = previewRequestSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
    });

    it('should allow preview without productId', () => {
      const previewWithoutProduct = {
        campaignId: 'campaign-001',
      };

      const result = previewRequestSchema.safeParse(previewWithoutProduct);
      expect(result.success).toBe(true);
    });

    it('should reject preview without campaignId', () => {
      const invalidPreview = {
        productId: 'prod-001',
      };

      const result = previewRequestSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });
  });

  describe('renderRequestSchema', () => {
    it('should validate a valid render request', () => {
      const validRender = {
        campaignId: 'campaign-001',
        productId: 'prod-001',
        userId: 'user-001',
      };

      const result = renderRequestSchema.safeParse(validRender);
      expect(result.success).toBe(true);
    });

    it('should accept context object', () => {
      const renderWithContext = {
        campaignId: 'campaign-001',
        context: {
          deviceType: 'mobile',
          location: {
            country: 'India',
            city: 'Mumbai',
          },
        },
      };

      const result = renderRequestSchema.safeParse(renderWithContext);
      expect(result.success).toBe(true);
    });
  });

  describe('batchRenderRequestSchema', () => {
    it('should validate a valid batch render request', () => {
      const validBatch = {
        campaignId: 'campaign-001',
        count: 10,
      };

      const result = batchRenderRequestSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(10);
      }
    });

    it('should apply default count', () => {
      const minimalBatch = {
        campaignId: 'campaign-001',
      };

      const result = batchRenderRequestSchema.safeParse(minimalBatch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(10);
      }
    });

    it('should reject count over 100', () => {
      const tooMany = {
        campaignId: 'campaign-001',
        count: 150,
      };

      const result = batchRenderRequestSchema.safeParse(tooMany);
      expect(result.success).toBe(false);
    });

    it('should reject count less than 1', () => {
      const tooFew = {
        campaignId: 'campaign-001',
        count: 0,
      };

      const result = batchRenderRequestSchema.safeParse(tooFew);
      expect(result.success).toBe(false);
    });
  });

  describe('listFeedsQuerySchema', () => {
    it('should apply default pagination', () => {
      const emptyQuery = {};

      const result = listFeedsQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should coerce string numbers', () => {
      const stringQuery = {
        page: '2',
        limit: '50',
      };

      const result = listFeedsQuerySchema.safeParse(stringQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should validate status enum', () => {
      const validStatus = {
        status: 'active',
      };

      const result = listFeedsQuerySchema.safeParse(validStatus);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidStatus = {
        status: 'invalid',
      };

      const result = listFeedsQuerySchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  describe('listCampaignsQuerySchema', () => {
    it('should validate status enum', () => {
      const validStatuses = ['active', 'paused', 'completed', 'draft'];

      for (const status of validStatuses) {
        const result = listCampaignsQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all filter parameters', () => {
      const fullQuery = {
        advertiserId: 'advertiser-001',
        status: 'active',
        feedId: 'feed-001',
        page: 1,
        limit: 20,
        sortBy: 'metrics.ctr',
        sortOrder: 'desc',
      };

      const result = listCampaignsQuerySchema.safeParse(fullQuery);
      expect(result.success).toBe(true);
    });
  });
});