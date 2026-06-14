import express, { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import router from '../src/routes/sponsoredProducts';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { metricsMiddleware } from '../src/middleware/metrics';
import config from '../src/config';

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/sponsored', router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// Generate test token
function generateTestToken(merchantId: string, role: string = 'merchant'): string {
  return jwt.sign(
    { userId: `user-${merchantId}`, merchantId, role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

describe('Sponsored Products API Routes', () => {
  let app: Express;
  const testMerchantId = 'test-merchant-123';
  const testToken = generateTestToken(testMerchantId);

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/sponsored/products', () => {
    it('should create a new sponsored product', async () => {
      const payload = {
        campaignId: 'campaign-1',
        productId: 'product-1',
        product: {
          name: 'Test Product',
          category: 'Electronics',
          price: 99.99,
        },
        bid: {
          amount: 0.50,
          strategy: 'manual',
          maxBid: 2.00,
        },
        budget: {
          daily: 50,
          total: 1000,
        },
        targeting: {
          keywords: ['laptop'],
          categoryMatch: true,
        },
      };

      const response = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sponsoredId).toBeDefined();
      expect(response.body.data.merchantId).toBe(testMerchantId);
    });

    it('should reject invalid payload', async () => {
      const response = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should reject without auth token', async () => {
      const response = await request(app)
        .post('/api/sponsored/products')
        .send({
          campaignId: 'campaign-1',
          productId: 'product-1',
          product: { name: 'Test', category: 'Test', price: 10 },
          bid: { amount: 0.1, strategy: 'manual', maxBid: 1 },
          budget: { daily: 10, total: 100 },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sponsored/products', () => {
    it('should list sponsored products', async () => {
      const response = await request(app)
        .get('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/sponsored/products?page=1&limit=5')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/sponsored/products?status=active')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/sponsored/products/:id', () => {
    it('should get a specific product', async () => {
      // First create a product
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-get-test',
          product: { name: 'Get Test', category: 'Test', price: 50 },
          bid: { amount: 0.5, strategy: 'manual', maxBid: 2 },
          budget: { daily: 50, total: 500 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .get(`/api/sponsored/products/${sponsoredId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sponsoredId).toBe(sponsoredId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/sponsored/products/SPON-NONEXIST')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/sponsored/products/:id', () => {
    it('should update bid amount', async () => {
      // Create a product first
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-update-test',
          product: { name: 'Update Test', category: 'Test', price: 75 },
          bid: { amount: 0.75, strategy: 'manual', maxBid: 3 },
          budget: { daily: 75, total: 750 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .put(`/api/sponsored/products/${sponsoredId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          bid: { amount: 1.00 },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bid.amount).toBe(1.00);
    });

    it('should update status to paused', async () => {
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-pause-test',
          product: { name: 'Pause Test', category: 'Test', price: 80 },
          bid: { amount: 0.8, strategy: 'manual', maxBid: 4 },
          budget: { daily: 80, total: 800 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .put(`/api/sponsored/products/${sponsoredId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'paused',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('paused');
    });
  });

  describe('DELETE /api/sponsored/products/:id', () => {
    it('should delete a sponsored product', async () => {
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-delete-test',
          product: { name: 'Delete Test', category: 'Test', price: 90 },
          bid: { amount: 0.9, strategy: 'manual', maxBid: 4.5 },
          budget: { daily: 90, total: 900 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .delete(`/api/sponsored/products/${sponsoredId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sponsored product deleted successfully');
    });
  });

  describe('POST /api/sponsored/bid', () => {
    it('should place a bid', async () => {
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-bid-test',
          product: { name: 'Bid Test', category: 'Test', price: 100 },
          bid: { amount: 1.00, strategy: 'manual', maxBid: 5.00 },
          budget: { daily: 100, total: 1000 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .post('/api/sponsored/bid')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sponsoredId,
          amount: 1.50,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bidAmount).toBe(1.50);
    });

    it('should reject bid exceeding max', async () => {
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-max-bid-test',
          product: { name: 'Max Bid Test', category: 'Test', price: 100 },
          bid: { amount: 1.00, strategy: 'manual', maxBid: 1.50 },
          budget: { daily: 100, total: 1000 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .post('/api/sponsored/bid')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sponsoredId,
          amount: 2.00, // Exceeds maxBid
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sponsored/search', () => {
    it('should search products', async () => {
      const response = await request(app)
        .get('/api/sponsored/search?query=test')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/sponsored/search?minPrice=50&maxPrice=150')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination in search', async () => {
      const response = await request(app)
        .get('/api/sponsored/search?page=1&limit=10')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/sponsored/products/:id/performance', () => {
    it('should get product performance', async () => {
      const createResponse = await request(app)
        .post('/api/sponsored/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          campaignId: 'campaign-1',
          productId: 'product-performance-test',
          product: { name: 'Performance Test', category: 'Test', price: 110 },
          bid: { amount: 1.10, strategy: 'auto', maxBid: 5.50 },
          budget: { daily: 110, total: 1100 },
        });

      const sponsoredId = createResponse.body.data.sponsoredId;

      const response = await request(app)
        .get(`/api/sponsored/products/${sponsoredId}/performance`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.current).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });
  });

  describe('Health endpoints', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/sponsored/unknown');

      expect(response.status).toBe(404);
    });
  });
});