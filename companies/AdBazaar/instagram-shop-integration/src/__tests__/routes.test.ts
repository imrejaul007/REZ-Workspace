/**
 * Route Tests for Instagram Shop Integration
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import { productRoutes } from '../routes/productRoutes';
import { orderRoutes } from '../routes/orderRoutes';
import { analyticsRoutes } from '../routes/analyticsRoutes';
import { webhookRoutes } from '../routes/webhookRoutes';
import { authMiddleware, validateBody, errorHandler, notFoundHandler } from '../middleware';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { analyticsService } from '../services/analyticsService';
import { Product, ShopOrder, Analytics } from '../models';

// Mock services
jest.mock('../services/productService');
jest.mock('../services/orderService');
jest.mock('../services/analyticsService');
jest.mock('../models');
jest.mock('../utils/logger');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'instagram-shop-integration' });
  });

  // Routes
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Product Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('instagram-shop-integration');
    });
  });

  describe('GET /api/products', () => {
    it('should list products with pagination', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Test Product',
          price: 999,
          images: ['https://example.com/image.jpg'],
        },
      ];

      (productService.listProducts as jest.Mock).mockResolvedValue({
        products: mockProducts,
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter products by category', async () => {
      (productService.listProducts as jest.Mock).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Electronics' });

      expect(response.status).toBe(200);
      expect(productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Electronics' })
      );
    });

    it('should handle query parameters correctly', async () => {
      (productService.listProducts as jest.Mock).mockResolvedValue({
        products: [],
        total: 0,
        page: 2,
        totalPages: 5,
      });

      const response = await request(app)
        .get('/api/products')
        .query({ page: '2', limit: '10', category: 'Test' });

      expect(response.status).toBe(200);
      expect(productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10, category: 'Test' })
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        price: 999,
      };

      (productService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app).get('/api/products/prod-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('prod-123');
    });

    it('should return 404 for non-existent product', async () => {
      (productService.getProduct as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/products/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    const validProduct = {
      name: 'New Product',
      description: 'A test product',
      price: 999,
      images: ['https://example.com/image.jpg'],
      category: 'Electronics',
      syncToInstagram: false,
    };

    it('should create product with valid data', async () => {
      const mockCreatedProduct = {
        id: 'new-prod-123',
        ...validProduct,
        syncStatus: 'pending',
      };

      (productService.createProduct as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send(validProduct);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.message).toBe('Product created successfully');
    });

    it('should create and sync to Instagram when requested', async () => {
      const mockCreatedProduct = {
        id: 'new-prod-123',
        ...validProduct,
        syncStatus: 'synced',
      };

      (productService.createProduct as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ ...validProduct, syncToInstagram: true });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product created and synced to Instagram');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).post('/api/products').send(validProduct);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: '',
        description: 'Test',
        price: -100,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send(invalidProduct);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when images array is empty', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ ...validProduct, images: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when price is not positive', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ ...validProduct, price: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product', async () => {
      const updatedProduct = {
        id: 'prod-123',
        name: 'Updated Product',
        price: 1999,
      };

      (productService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(app)
        .patch('/api/products/prod-123')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ name: 'Updated Product', price: 1999 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
    });

    it('should return 404 when updating non-existent product', async () => {
      (productService.updateProduct as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/products/nonexistent')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .patch('/api/products/prod-123')
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      (productService.deleteProduct as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/products/prod-123')
        .set('Authorization', 'Bearer test-token-1234567890');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 when deleting non-existent product', async () => {
      (productService.deleteProduct as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/products/nonexistent')
        .set('Authorization', 'Bearer test-token-1234567890');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/products/sync', () => {
    it('should sync product to Instagram', async () => {
      const syncedProduct = {
        id: 'prod-123',
        name: 'Test Product',
        syncStatus: 'synced',
      };

      (productService.syncToInstagram as jest.Mock).mockResolvedValue(syncedProduct);

      const response = await request(app)
        .post('/api/products/sync')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ productId: 'prod-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product synced to Instagram successfully');
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/products/sync')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Product ID is required');
    });

    it('should return 404 when product not found', async () => {
      (productService.syncToInstagram as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/products/sync')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ productId: 'nonexistent' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/products/:id/tags', () => {
    it('should return tagging suggestions', async () => {
      (productService.getTaggingSuggestions as jest.Mock).mockResolvedValue([
        { x: 0.25, y: 0.5, productId: 'prod-1' },
      ]);

      const response = await request(app).get('/api/products/prod-123/tags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toHaveLength(1);
    });
  });

  describe('PATCH /api/products/:id/availability', () => {
    it('should update availability', async () => {
      const updatedProduct = {
        id: 'prod-123',
        availability: 'out_of_stock',
      };

      (productService.updateAvailability as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(app)
        .patch('/api/products/prod-123/availability')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ availability: 'out_of_stock' });

      expect(response.status).toBe(200);
      expect(response.body.data.availability).toBe('out_of_stock');
    });

    it('should return 400 for invalid availability value', async () => {
      const response = await request(app)
        .patch('/api/products/prod-123/availability')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ availability: 'invalid' });

      expect(response.status).toBe(400);
    });
  });
});

describe('Order Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    const validOrder = {
      shopOrderId: 'shop-order-123',
      instagramOrderId: 'ig-order-123',
      customerId: 'cust-123',
      products: [{ productId: 'prod-1', quantity: 2, price: 999 }],
      totalAmount: 1998,
    };

    it('should create order from Instagram', async () => {
      const mockOrder = {
        id: 'order-123',
        ...validOrder,
        status: 'pending',
      };

      (orderService.createOrderFromInstagram as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send(validOrder);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by ID', async () => {
      const mockOrder = {
        id: 'order-123',
        orderId: 'IG-ORDER-123',
        status: 'pending',
      };

      (orderService.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/orders/order-123');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('order-123');
    });

    it('should return 404 for non-existent order', async () => {
      (orderService.getOrder as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/orders/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/orders', () => {
    it('should list orders with pagination', async () => {
      (orderService.listOrders as jest.Mock).mockResolvedValue({
        orders: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const updatedOrder = {
        id: 'order-123',
        status: 'confirmed',
      };

      (orderService.updateOrderStatus as jest.Mock).mockResolvedValue(updatedOrder);

      const response = await request(app)
        .patch('/api/orders/order-123/status')
        .set('Authorization', 'Bearer test-token-1234567890')
        .send({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('confirmed');
    });
  });
});

describe('Analytics Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/analytics/track', () => {
    it('should track engagement event', async () => {
      const mockEvent = {
        id: 'event-123',
        eventType: 'engagement',
      };

      (analyticsService.trackEvent as jest.Mock).mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/api/analytics/track')
        .send({
          eventType: 'engagement',
          productId: 'prod-123',
          accountId: 'acc-123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should return analytics summary', async () => {
      const mockSummary = {
        totalImpressions: 10000,
        totalReach: 8000,
        totalClicks: 1000,
      };

      (analyticsService.getSummary as jest.Mock).mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/api/analytics/summary')
        .query({ accountId: 'acc-123', startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.data.totalImpressions).toBe(10000);
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export analytics data', async () => {
      (analyticsService.exportAnalytics as jest.Mock).mockResolvedValue({
        url: 'https://example.com/export.csv',
      });

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ accountId: 'acc-123', format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.body.data.url).toBeDefined();
    });
  });
});

describe('Webhook Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/webhooks/instagram', () => {
    it('should verify webhook challenge', async () => {
      const response = await request(app)
        .get('/api/webhooks/instagram')
        .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': 'test-challenge' });

      expect(response.status).toBe(200);
      expect(response.body).toBe('test-challenge');
    });

    it('should return 400 when verify_token does not match', async () => {
      const response = await request(app)
        .get('/api/webhooks/instagram')
        .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': 'test-challenge' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/webhooks/instagram', () => {
    it('should handle incoming webhook', async () => {
      const webhookPayload = {
        object: 'instagram',
        entry: [
          {
            id: '123456',
            time: 1234567890,
            changes: [],
          },
        ],
      };

      const response = await request(app)
        .post('/api/webhooks/instagram')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('404 Handler', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Not found');
  });
});