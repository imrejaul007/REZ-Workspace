import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { SponsoredProduct } from '../src/models/SponsoredProduct';
import { SponsoredProductService } from '../src/services/SponsoredProductService';

// Mock the database module
jest.mock('../src/config/database', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    lPush: jest.fn().mockResolvedValue(1),
    lTrim: jest.fn().mockResolvedValue('OK'),
    isOpen: true,
  },
  redisClientWrapper: {
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
}));

describe('SponsoredProductService', () => {
  let service: SponsoredProductService;
  const testMerchantId = `merchant-${uuidv4()}`;
  const testCampaignId = `campaign-${uuidv4()}`;

  beforeEach(() => {
    service = new SponsoredProductService();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up test data
    await SponsoredProduct.deleteMany({ merchantId: testMerchantId });
  });

  describe('create', () => {
    it('should create a new sponsored product', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: {
          name: 'Test Product',
          category: 'Electronics',
          price: 99.99,
          imageUrl: 'https://example.com/image.jpg',
        },
        bid: {
          amount: 0.50,
          strategy: 'manual' as const,
          maxBid: 2.00,
        },
        budget: {
          daily: 50,
          total: 1000,
        },
        targeting: {
          keywords: ['laptop', 'electronics'],
          categoryMatch: true,
        },
      };

      const result = await service.create(dto, testMerchantId);

      expect(result).toBeDefined();
      expect(result.sponsoredId).toMatch(/^SPON-[A-Z0-9]{8}$/);
      expect(result.merchantId).toBe(testMerchantId);
      expect(result.campaignId).toBe(testCampaignId);
      expect(result.product.name).toBe('Test Product');
      expect(result.bid.amount).toBe(0.50);
      expect(result.budget.spent).toBe(0);
      expect(result.status).toBe('active');

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: result.sponsoredId });
    });

    it('should create product with default targeting when not provided', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: {
          name: 'Simple Product',
          category: 'Books',
          price: 19.99,
        },
        bid: {
          amount: 0.25,
          strategy: 'auto' as const,
          maxBid: 1.00,
        },
        budget: {
          daily: 25,
          total: 500,
        },
      };

      const result = await service.create(dto, testMerchantId);

      expect(result.targeting.keywords).toEqual([]);
      expect(result.targeting.categoryMatch).toBe(false);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: result.sponsoredId });
    });
  });

  describe('getById', () => {
    it('should retrieve a sponsored product by ID', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: {
          name: 'Fetch Test Product',
          category: 'Fashion',
          price: 149.99,
        },
        bid: {
          amount: 0.75,
          strategy: 'manual' as const,
          maxBid: 3.00,
        },
        budget: {
          daily: 100,
          total: 2000,
        },
      };

      const created = await service.create(dto, testMerchantId);
      const result = await service.getById(created.sponsoredId, testMerchantId);

      expect(result).toBeDefined();
      expect(result?.sponsoredId).toBe(created.sponsoredId);
      expect(result?.product.name).toBe('Fetch Test Product');

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should return null for non-existent product', async () => {
      const result = await service.getById('SPON-NONEXISTENT', testMerchantId);
      expect(result).toBeNull();
    });
  });

  describe('listByMerchant', () => {
    it('should list all sponsored products for a merchant', async () => {
      const dto1 = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Product 1', category: 'A', price: 10 },
        bid: { amount: 0.10, strategy: 'manual' as const, maxBid: 1.00 },
        budget: { daily: 10, total: 100 },
      };

      const dto2 = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Product 2', category: 'B', price: 20 },
        bid: { amount: 0.20, strategy: 'auto' as const, maxBid: 2.00 },
        budget: { daily: 20, total: 200 },
      };

      const created1 = await service.create(dto1, testMerchantId);
      const created2 = await service.create(dto2, testMerchantId);

      const result = await service.listByMerchant(testMerchantId);

      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created1.sponsoredId });
      await SponsoredProduct.deleteOne({ sponsoredId: created2.sponsoredId });
    });

    it('should filter by status', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Filter Test', category: 'C', price: 30 },
        bid: { amount: 0.30, strategy: 'manual' as const, maxBid: 1.50 },
        budget: { daily: 30, total: 300 },
      };

      const created = await service.create(dto, testMerchantId);

      const activeResult = await service.listByMerchant(testMerchantId, { status: 'active' });
      expect(activeResult.data.some(p => p.sponsoredId === created.sponsoredId)).toBe(true);

      const pausedResult = await service.listByMerchant(testMerchantId, { status: 'paused' });
      expect(pausedResult.data.some(p => p.sponsoredId === created.sponsoredId)).toBe(false);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });
  });

  describe('update', () => {
    it('should update bid amount', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Update Test', category: 'D', price: 40 },
        bid: { amount: 0.50, strategy: 'manual' as const, maxBid: 2.00 },
        budget: { daily: 50, total: 500 },
      };

      const created = await service.create(dto, testMerchantId);

      const updated = await service.update(
        created.sponsoredId,
        { bid: { amount: 0.75 } },
        testMerchantId
      );

      expect(updated.bid.amount).toBe(0.75);
      expect(updated.bid.strategy).toBe('manual'); // Unchanged

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should update status to paused', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Status Test', category: 'E', price: 50 },
        bid: { amount: 0.60, strategy: 'manual' as const, maxBid: 2.50 },
        budget: { daily: 60, total: 600 },
      };

      const created = await service.create(dto, testMerchantId);

      const updated = await service.update(
        created.sponsoredId,
        { status: 'paused' },
        testMerchantId
      );

      expect(updated.status).toBe('paused');

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        service.update('SPON-NONEXISTENT', { status: 'paused' }, testMerchantId)
      ).rejects.toThrow('Sponsored product not found');
    });
  });

  describe('delete', () => {
    it('should delete a sponsored product', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Delete Test', category: 'F', price: 60 },
        bid: { amount: 0.70, strategy: 'manual' as const, maxBid: 3.00 },
        budget: { daily: 70, total: 700 },
      };

      const created = await service.create(dto, testMerchantId);

      const result = await service.delete(created.sponsoredId, testMerchantId);

      expect(result).toBe(true);

      const deleted = await service.getById(created.sponsoredId, testMerchantId);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent product', async () => {
      const result = await service.delete('SPON-NONEXISTENT', testMerchantId);
      expect(result).toBe(false);
    });
  });

  describe('placeBid', () => {
    it('should place a bid successfully', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Bid Test', category: 'G', price: 70 },
        bid: { amount: 0.80, strategy: 'manual' as const, maxBid: 4.00 },
        budget: { daily: 80, total: 800 },
      };

      const created = await service.create(dto, testMerchantId);

      const updated = await service.placeBid(
        { sponsoredId: created.sponsoredId, amount: 1.00 },
        testMerchantId
      );

      expect(updated.bid.amount).toBe(1.00);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should reject bid exceeding max bid', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Max Bid Test', category: 'H', price: 80 },
        bid: { amount: 0.90, strategy: 'manual' as const, maxBid: 1.00 },
        budget: { daily: 90, total: 900 },
      };

      const created = await service.create(dto, testMerchantId);

      await expect(
        service.placeBid(
          { sponsoredId: created.sponsoredId, amount: 1.50 },
          testMerchantId
        )
      ).rejects.toThrow('Bid amount exceeds maximum bid');

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Searchable Product', category: 'Electronics', price: 100 },
        bid: { amount: 1.00, strategy: 'manual' as const, maxBid: 5.00 },
        budget: { daily: 100, total: 1000 },
        targeting: { keywords: ['laptop', 'computer'] },
      };

      const created = await service.create(dto, testMerchantId);

      const result = await service.search({
        query: 'Searchable',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should filter by price range', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Price Filter Test', category: 'Books', price: 25 },
        bid: { amount: 0.25, strategy: 'manual' as const, maxBid: 1.00 },
        budget: { daily: 25, total: 250 },
      };

      const created = await service.create(dto, testMerchantId);

      const result = await service.search({
        minPrice: 20,
        maxPrice: 30,
        page: 1,
        limit: 10,
      });

      expect(result.data.some(p => p.sponsoredId === created.sponsoredId)).toBe(true);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });
  });

  describe('getPerformance', () => {
    it('should get performance metrics', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Performance Test', category: 'Sports', price: 120 },
        bid: { amount: 1.20, strategy: 'auto' as const, maxBid: 6.00 },
        budget: { daily: 120, total: 1200 },
      };

      const created = await service.create(dto, testMerchantId);

      // Update performance first
      await service.updatePerformance(created.sponsoredId, {
        impressions: 10000,
        clicks: 500,
        orders: 50,
        revenue: 5000,
      });

      const performance = await service.getPerformance(created.sponsoredId, testMerchantId);

      expect(performance.current.impressions).toBe(10000);
      expect(performance.current.clicks).toBe(500);
      expect(performance.current.orders).toBe(50);
      expect(performance.current.revenue).toBe(5000);
      expect(performance.current.ctr).toBe(5);
      expect(performance.summary.totalImpressions).toBe(10000);

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });
  });

  describe('autoBid', () => {
    it('should execute auto-bidding', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Auto Bid Test', category: 'Home', price: 200 },
        bid: { amount: 2.00, strategy: 'auto' as const, maxBid: 10.00 },
        budget: { daily: 200, total: 2000 },
      };

      const created = await service.create(dto, testMerchantId);

      // Set some performance metrics
      await service.updatePerformance(created.sponsoredId, {
        impressions: 5000,
        clicks: 100,
        orders: 5,
        revenue: 500,
      });

      const result = await service.autoBid(created.sponsoredId);

      expect(result.bid.strategy).toBe('auto');

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });

    it('should reject non-auto strategy products', async () => {
      const dto = {
        campaignId: testCampaignId,
        productId: `product-${uuidv4()}`,
        product: { name: 'Manual Bid Test', category: 'Garden', price: 150 },
        bid: { amount: 1.50, strategy: 'manual' as const, maxBid: 7.50 },
        budget: { daily: 150, total: 1500 },
      };

      const created = await service.create(dto, testMerchantId);

      await expect(service.autoBid(created.sponsoredId)).rejects.toThrow(
        'Auto-bidding is only available for products with auto strategy'
      );

      // Cleanup
      await SponsoredProduct.deleteOne({ sponsoredId: created.sponsoredId });
    });
  });
});