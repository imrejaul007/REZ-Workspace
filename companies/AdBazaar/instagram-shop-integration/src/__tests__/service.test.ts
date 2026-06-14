/**
 * Service Tests for Instagram Shop Integration
 * Tests business logic for product, order, and analytics services
 */

import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { analyticsService } from '../services/analyticsService';
import { Product, ShopOrder, Analytics } from '../models';
import { instagramApiService } from '../services/instagramApiService';

// Mock dependencies
jest.mock('../services/instagramApiService');
jest.mock('../models');

describe('ProductService', () => {
  const mockProduct = {
    _id: 'product-123',
    id: 'product-123',
    catalogId: 'catalog-123',
    name: 'Test Product',
    description: 'Test description',
    price: 999,
    currency: 'INR',
    images: ['https://example.com/image.jpg'],
    availability: 'in_stock',
    category: 'Electronics',
    syncStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product description',
        price: 999,
        images: ['https://example.com/image.jpg'],
        category: 'Electronics',
      };

      const MockProductModel = jest.mocked(Product).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockProduct,
          save: jest.fn().mockResolvedValue(mockProduct),
        })) as any
      );

      const result = await productService.createProduct(productData, false);

      expect(result).toBeDefined();
      expect(result.name).toBe(productData.name);
      expect(result.price).toBe(productData.price);
 });

    it('should create and sync to Instagram when flag is true', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 999,
        images: ['https://example.com/image.jpg'],
        category: 'Electronics',
      };

      const MockProductModel = jest.mocked(Product).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockProduct,
          save: jest.fn().mockResolvedValue(mockProduct),
        })) as any
      );

      (instagramApiService.createCatalogProduct as jest.Mock).mockResolvedValue('ig-product-123');

      const result = await productService.createProduct(productData, true);

      expect(result).toBeDefined();
    });

    it('should set default currency to INR', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const MockProductModel = jest.mocked(Product).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockProduct,
          currency: 'INR',
          save: jest.fn().mockResolvedValue(mockProduct),
        })) as any
      );

      const result = await productService.createProduct(productData);
      expect(result.currency).toBe('INR');
    });

    it('should throw error on database failure', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const MockProductModel = jest.mocked(Product).mockImplementation(
        jest.fn().mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(new Error('Database error')),
        })) as any
      );

      await expect(productService.createProduct(productData)).rejects.toThrow('Database error');
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await productService.getProduct('product-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('product-123');
      expect(Product.findById).toHaveBeenCalledWith('product-123');
    });

    it('should return null for non-existent product', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await productService.getProduct('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Name', price: 1999 };

      (Product.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProduct),
      });

      const result = await productService.updateProduct('product-123', {
        name: 'Updated Name',
        price: 1999,
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null if product not found', async () => {
      (Product.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await productService.updateProduct('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should sync to Instagram when product has instagramProductId', async () => {
      const productWithIgId = { ...mockProduct, instagramProductId: 'ig-123' };

      (Product.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(productWithIgId),
      });

      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(productWithIgId),
      });

      (instagramApiService.updateCatalogProduct as jest.Mock).mockResolvedValue(undefined);

      await productService.updateProduct('product-123', { name: 'Updated' });

      expect(instagramApiService.updateCatalogProduct).toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and return true', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      (Product.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await productService.deleteProduct('product-123');

      expect(result).toBe(true);
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product-123');
    });

    it('should return false if product not found', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await productService.deleteProduct('nonexistent');

      expect(result).toBe(false);
    });

    it('should also delete from Instagram if synced', async () => {
      const syncedProduct = { ...mockProduct, instagramProductId: 'ig-123' };

      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(syncedProduct),
      });

      (Product.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(syncedProduct),
      });

      (instagramApiService.deleteCatalogProduct as jest.Mock).mockResolvedValue(undefined);

      await productService.deleteProduct('product-123');

      expect(instagramApiService.deleteCatalogProduct).toHaveBeenCalledWith('ig-123');
    });
  });

  describe('syncToInstagram', () => {
    it('should sync product to Instagram successfully', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      (instagramApiService.createCatalogProduct as jest.Mock).mockResolvedValue('ig-new-product');

      const result = await productService.syncToInstagram('product-123');

      expect(result).toBeDefined();
      expect(result?.syncStatus).toBe('synced');
      expect(instagramApiService.createCatalogProduct).toHaveBeenCalled();
    });

    it('should throw error if product not found', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(productService.syncToInstagram('nonexistent')).rejects.toThrow('Product not found');
    });

    it('should mark as failed on API error', async () => {
      const failedProduct = { ...mockProduct, save: jest.fn().mockResolvedValue(undefined) };

      (Product.findById as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockProduct),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(failedProduct),
        });

      (instagramApiService.createCatalogProduct as jest.Mock).mockRejectedValue(
        new Error('Instagram API error')
      );

      await expect(productService.syncToInstagram('product-123')).rejects.toThrow('Instagram API error');
    });
  });

  describe('listProducts', () => {
    it('should list products with pagination', async () => {
      const mockProducts = [mockProduct];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      (Product.find as jest.Mock).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await productService.listProducts({ page: 1, limit: 10 });

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by category', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await productService.listProducts({ category: 'Electronics', page: 1, limit: 10 });

      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'Electronics' }));
    });

    it('should filter by availability', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await productService.listProducts({ availability: 'in_stock', page: 1, limit: 10 });

      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({ availability: 'in_stock' }));
    });

    it('should filter by syncStatus', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await productService.listProducts({ syncStatus: 'synced', page: 1, limit: 10 });

      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({ syncStatus: 'synced' }));
    });
  });

  describe('batchSyncToInstagram', () => {
    it('should sync multiple products', async () => {
      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      (instagramApiService.createCatalogProduct as jest.Mock).mockResolvedValue('ig-product');

      const result = await productService.batchSyncToInstagram(['product-123', 'product-456']);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should track failed syncs', async () => {
      (Product.findById as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockProduct),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

      (instagramApiService.createCatalogProduct as jest.Mock).mockResolvedValue('ig-product');

      const result = await productService.batchSyncToInstagram(['product-123', 'nonexistent']);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('nonexistent');
    });
  });

  describe('getTaggingSuggestions', () => {
    it('should return tagging suggestions for product with images', async () => {
      const productWithImages = { ...mockProduct, images: ['https://example.com/image.jpg'] };

      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(productWithImages),
      });

      (instagramApiService.getProductTaggingSuggestions as jest.Mock).mockResolvedValue([
        { x: 0.25, y: 0.5, productId: 'prod-1' },
      ]);

      const result = await productService.getTaggingSuggestions('product-123');

      expect(result).toHaveLength(1);
      expect(instagramApiService.getProductTaggingSuggestions).toHaveBeenCalled();
    });

    it('should return empty array for product without images', async () => {
      const productWithoutImages = { ...mockProduct, images: [] };

      (Product.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(productWithoutImages),
      });

      const result = await productService.getTaggingSuggestions('product-123');

      expect(result).toHaveLength(0);
    });
  });
});

describe('OrderService', () => {
  const mockOrder = {
    _id: 'order-123',
    id: 'order-123',
    orderId: 'IG-ORDER-123',
    shopOrderId: 'shop-order-123',
    instagramOrderId: 'ig-order-123',
    status: 'pending',
    customerId: 'customer-123',
    products: [
      { productId: 'prod-1', quantity: 2, price: 999 },
    ],
    totalAmount: 1998,
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order from Instagram checkout', async () => {
      const MockOrderModel = jest.mocked(ShopOrder).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockOrder,
          save: jest.fn().mockResolvedValue(mockOrder),
        })) as any
      );

      const orderData = {
        shopOrderId: 'shop-order-123',
        instagramOrderId: 'ig-order-123',
        customerId: 'customer-123',
        products: [{ productId: 'prod-1', quantity: 2, price: 999 }],
        totalAmount: 1998,
      };

      const result = await orderService.createOrderFromInstagram(orderData);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('getOrder', () => {
    it('should return order by ID', async () => {
      (ShopOrder.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await orderService.getOrder('order-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('order-123');
    });

    it('should return null for non-existent order', async () => {
      (ShopOrder.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await orderService.getOrder('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'confirmed' };

      (ShopOrder.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrder),
      });

      const result = await orderService.updateOrderStatus('order-123', 'confirmed');

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
    });

    it('should return null for non-existent order', async () => {
      (ShopOrder.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await orderService.updateOrderStatus('nonexistent', 'confirmed');

      expect(result).toBeNull();
    });
  });

  describe('listOrders', () => {
    it('should list orders with pagination', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockOrder]),
      };

      (ShopOrder.find as jest.Mock).mockReturnValue(mockQuery);
      (ShopOrder.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await orderService.listOrders({ page: 1, limit: 10 });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (ShopOrder.find as jest.Mock).mockReturnValue(mockQuery);
      (ShopOrder.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await orderService.listOrders({ status: 'pending', page: 1, limit: 10 });

      expect(ShopOrder.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });
  });
});

describe('AnalyticsService', () => {
  const mockAnalytics = {
    _id: 'analytics-123',
    id: 'analytics-123',
    date: new Date(),
    impressions: 1000,
    reach: 800,
    clicks: 100,
    engagement: 50,
    orders: 10,
    revenue: 5000,
    topProducts: [],
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track engagement event', async () => {
      const MockAnalyticsModel = jest.mocked(Analytics).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockAnalytics,
          save: jest.fn().mockResolvedValue(mockAnalytics),
        })) as any
      );

      const eventData = {
        eventType: 'engagement',
        productId: 'prod-123',
        accountId: 'acc-123',
        value: 1,
      };

      const result = await analyticsService.trackEvent(eventData);

      expect(result).toBeDefined();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for date range', async () => {
      (Analytics.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAnalytics]),
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await analyticsService.getAnalytics('acc-123', startDate, endDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for no data', async () => {
      (Analytics.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await analyticsService.getAnalytics('acc-123', new Date(), new Date());

      expect(result).toHaveLength(0);
    });
  });

  describe('getSummary', () => {
    it('should return analytics summary', async () => {
      (Analytics.aggregate as jest.Mock).mockResolvedValue([
        {
          totalImpressions: 10000,
          totalReach: 8000,
          totalClicks: 1000,
          totalEngagement: 500,
          totalOrders: 100,
          totalRevenue: 50000,
        },
      ]);

      const result = await analyticsService.getSummary('acc-123', '2024-01-01', '2024-01-31');

      expect(result).toBeDefined();
      expect(result.totalImpressions).toBe(10000);
    });
  });
});
