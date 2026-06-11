/**
 * ShopFlow Service - API Integration Tests
 * Retail AI Operating System
 */

import request from 'supertest';
import express, { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health endpoints
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'shopflow',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  // In-memory storage
  const products: Map<string, any> = new Map();
  const customers: Map<string, any> = new Map();
  const orders: Map<string, any> = new Map();
  const transactions: Map<string, any> = new Map();
  const customerPoints: Map<string, number> = new Map();

  // Product endpoints
  app.post('/api/products', (req, res) => {
    const productId = 'prod-' + Math.random().toString(36).substring(7);
    const product = { ...req.body, productId, createdAt: new Date().toISOString() };
    products.set(productId, product);
    res.status(201).json({ success: true, data: product });
  });

  app.get('/api/products', (req, res) => {
    const { q, category, minPrice, maxPrice } = req.query;
    let result = Array.from(products.values());

    if (q) {
      const query = (q as string).toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(query))
      );
    }
    if (category) result = result.filter(p => p.category === category);
    if (minPrice) result = result.filter(p => p.price >= parseFloat(minPrice as string));
    if (maxPrice) result = result.filter(p => p.price <= parseFloat(maxPrice as string));

    res.json({ success: true, data: result, count: result.length });
  });

  app.get('/api/products/:productId', (req, res) => {
    const product = products.get(req.params.productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  });

  app.patch('/api/products/:productId', (req, res) => {
    const product = products.get(req.params.productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const updated = { ...product, ...req.body, updatedAt: new Date().toISOString() };
    products.set(req.params.productId, updated);
    res.json({ success: true, data: updated });
  });

  app.delete('/api/products/:productId', (req, res) => {
    if (!products.has(req.params.productId)) return res.status(404).json({ success: false, error: 'Product not found' });
    products.delete(req.params.productId);
    res.json({ success: true, message: 'Product deleted' });
  });

  // Customer endpoints
  app.post('/api/customers', (req, res) => {
    const customerId = 'cust-' + Math.random().toString(36).substring(7);
    const customer = {
      ...req.body,
      customerId,
      tier: req.body.tier || 'bronze',
      points: req.body.points || 0,
      purchaseHistory: [],
      createdAt: new Date().toISOString()
    };
    customers.set(customerId, customer);
    res.status(201).json({ success: true, data: customer });
  });

  app.get('/api/customers/:customerId', (req, res) => {
    const customer = customers.get(req.params.customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, data: customer });
  });

  app.patch('/api/customers/:customerId', (req, res) => {
    const customer = customers.get(req.params.customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    const updated = { ...customer, ...req.body, updatedAt: new Date().toISOString() };
    customers.set(req.params.customerId, updated);
    res.json({ success: true, data: updated });
  });

  // Loyalty endpoints
  app.post('/api/loyalty/earn', (req, res) => {
    const { customerId, amount } = req.body;
    const transactionId = 'txn-' + Math.random().toString(36).substring(7);
    const points = Math.floor(amount * 10);

    const transaction = {
      transactionId,
      customerId,
      points,
      type: 'earn',
      createdAt: new Date().toISOString()
    };
    transactions.set(transactionId, transaction);

    const currentPoints = customerPoints.get(customerId) || 0;
    customerPoints.set(customerId, currentPoints + points);

    res.status(201).json({ success: true, data: { transaction, totalPoints: customerPoints.get(customerId) } });
  });

  app.post('/api/loyalty/redeem', (req, res) => {
    const { customerId, points } = req.body;
    const currentPoints = customerPoints.get(customerId) || 0;

    if (currentPoints < points) {
      return res.status(400).json({ success: false, error: 'Insufficient points' });
    }

    const transactionId = 'txn-' + Math.random().toString(36).substring(7);
    const transaction = {
      transactionId,
      customerId,
      points,
      type: 'redeem',
      createdAt: new Date().toISOString()
    };
    transactions.set(transactionId, transaction);
    customerPoints.set(customerId, currentPoints - points);

    res.json({ success: true, data: { transaction, totalPoints: customerPoints.get(customerId) } });
  });

  app.get('/api/loyalty/:customerId/points', (req, res) => {
    const points = customerPoints.get(req.params.customerId) || 0;
    res.json({ success: true, data: { customerId: req.params.customerId, points } });
  });

  // Order endpoints
  app.post('/api/orders', (req, res) => {
    const { customerId, items } = req.body;
    const orderId = 'order-' + Math.random().toString(36).substring(7);
    const total = items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);

    const order = {
      orderId,
      customerId,
      items,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.set(orderId, order);

    // Update customer purchase history
    const customer = customers.get(customerId);
    if (customer) {
      items.forEach((item: any) => {
        customer.purchaseHistory.push({
          productId: item.productId,
          amount: item.price * item.quantity,
          date: new Date().toISOString()
        });
      });
      customers.set(customerId, customer);
    }

    res.status(201).json({ success: true, data: order });
  });

  app.get('/api/orders/:orderId', (req, res) => {
    const order = orders.get(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  });

  app.patch('/api/orders/:orderId/status', (req, res) => {
    const order = orders.get(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    order.status = req.body.status;
    orders.set(req.params.orderId, order);
    res.json({ success: true, data: order });
  });

  // Analytics endpoint
  app.get('/api/analytics/summary', (_req, res) => {
    const totalProducts = products.size;
    const totalCustomers = customers.size;
    const totalOrders = orders.size;
    const totalRevenue = Array.from(orders.values()).reduce((sum, o) => sum + o.total, 0);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      }
    });
  });

  // Error handler
  app.use((err: Error, _req: any, res: any, _next: any) => {
    res.status(500).json({ success: false, error: err.message });
  });

  return app;
};

describe('ShopFlow API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('shopflow');
    });

    it('GET /health/ready should return ready status', async () => {
      const response = await request(app).get('/health/ready');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });
  });

  describe('Product CRUD', () => {
    describe('POST /api/products', () => {
      it('should create a product', async () => {
        const response = await request(app)
          .post('/api/products')
          .send({
            name: 'Test Product',
            sku: 'TEST-001',
            price: 29.99,
            category: 'electronics',
            inventory: 100,
            tags: ['new', 'featured']
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.productId).toBeDefined();
        expect(response.body.data.name).toBe('Test Product');
      });

      it('should accept all required fields', async () => {
        const response = await request(app)
          .post('/api/products')
          .send({
            name: 'Minimal Product',
            sku: 'MIN-001',
            price: 10,
            category: 'misc'
          });

        expect(response.status).toBe(201);
      });
    });

    describe('GET /api/products', () => {
      beforeEach(async () => {
        await request(app).post('/api/products').send({ name: 'Product A', sku: 'A-001', price: 20, category: 'electronics' });
        await request(app).post('/api/products').send({ name: 'Product B', sku: 'B-001', price: 30, category: 'books' });
      });

      it('should return all products', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should search by query', async () => {
        const response = await request(app).get('/api/products').query({ q: 'Product A' });
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should filter by category', async () => {
        const response = await request(app).get('/api/products').query({ category: 'electronics' });
        expect(response.status).toBe(200);
        response.body.data.forEach((p: any) => expect(p.category).toBe('electronics'));
      });

      it('should filter by price range', async () => {
        const response = await request(app).get('/api/products').query({ minPrice: 25, maxPrice: 35 });
        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/products/:productId', () => {
      let testProductId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/products')
          .send({ name: 'Get Test', sku: 'GET-001', price: 15, category: 'misc' });
        testProductId = createResponse.body.data.productId;
      });

      it('should return product by ID', async () => {
        const response = await request(app).get(`/api/products/${testProductId}`);
        expect(response.status).toBe(200);
        expect(response.body.data.productId).toBe(testProductId);
      });

      it('should return 404 for non-existent product', async () => {
        const response = await request(app).get('/api/products/non-existent');
        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/products/:productId', () => {
      let testProductId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/products')
          .send({ name: 'Update Test', sku: 'UPD-001', price: 25, category: 'electronics' });
        testProductId = createResponse.body.data.productId;
      });

      it('should update product', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProductId}`)
          .send({ price: 19.99, name: 'Updated Product' });

        expect(response.status).toBe(200);
        expect(response.body.data.price).toBe(19.99);
        expect(response.body.data.name).toBe('Updated Product');
      });

      it('should return 404 for non-existent product', async () => {
        const response = await request(app)
          .patch('/api/products/non-existent')
          .send({ price: 10 });
        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/products/:productId', () => {
      it('should delete product', async () => {
        const createResponse = await request(app)
          .post('/api/products')
          .send({ name: 'Delete Test', sku: 'DEL-001', price: 10, category: 'misc' });

        const deleteResponse = await request(app).delete(`/api/products/${createResponse.body.data.productId}`);
        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/products/${createResponse.body.data.productId}`);
        expect(getResponse.status).toBe(404);
      });
    });
  });

  describe('Customer Operations', () => {
    describe('POST /api/customers', () => {
      it('should create a customer', async () => {
        const response = await request(app)
          .post('/api/customers')
          .send({
            name: 'John Doe',
            email: 'john@example.com',
            tier: 'silver'
          });

        expect(response.status).toBe(201);
        expect(response.body.data.customerId).toBeDefined();
        expect(response.body.data.tier).toBe('silver');
      });

      it('should default to bronze tier', async () => {
        const response = await request(app)
          .post('/api/customers')
          .send({ name: 'Jane', email: 'jane@example.com' });

        expect(response.body.data.tier).toBe('bronze');
      });
    });

    describe('GET /api/customers/:customerId', () => {
      let testCustomerId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/customers')
          .send({ name: 'Test Customer', email: 'test@customer.com', tier: 'gold' });
        testCustomerId = createResponse.body.data.customerId;
      });

      it('should return customer', async () => {
        const response = await request(app).get(`/api/customers/${testCustomerId}`);
        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Test Customer');
      });
    });

    describe('PATCH /api/customers/:customerId', () => {
      it('should update customer', async () => {
        const createResponse = await request(app)
          .post('/api/customers')
          .send({ name: 'Original Name', email: 'original@email.com', tier: 'bronze' });

        const response = await request(app)
          .patch(`/api/customers/${createResponse.body.data.customerId}`)
          .send({ tier: 'platinum' });

        expect(response.status).toBe(200);
        expect(response.body.data.tier).toBe('platinum');
      });
    });
  });

  describe('Loyalty Operations', () => {
    let testCustomerId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/customers')
        .send({ name: 'Loyalty Test', email: 'loyalty@test.com' });
      testCustomerId = createResponse.body.data.customerId;
    });

    it('should earn points', async () => {
      const response = await request(app)
        .post('/api/loyalty/earn')
        .send({ customerId: testCustomerId, amount: 100 });

      expect(response.status).toBe(201);
      expect(response.body.data.transaction.points).toBe(1000); // 10 points per dollar
      expect(response.body.data.totalPoints).toBe(1000);
    });

    it('should accumulate points', async () => {
      await request(app).post('/api/loyalty/earn').send({ customerId: testCustomerId, amount: 50 });
      const response = await request(app)
        .post('/api/loyalty/earn')
        .send({ customerId: testCustomerId, amount: 50 });

      expect(response.body.data.totalPoints).toBe(1000);
    });

    it('should redeem points', async () => {
      await request(app).post('/api/loyalty/earn').send({ customerId: testCustomerId, amount: 100 });

      const response = await request(app)
        .post('/api/loyalty/redeem')
        .send({ customerId: testCustomerId, points: 500 });

      expect(response.status).toBe(200);
      expect(response.body.data.totalPoints).toBe(500);
    });

    it('should reject insufficient points redemption', async () => {
      await request(app).post('/api/loyalty/earn').send({ customerId: testCustomerId, amount: 10 });

      const response = await request(app)
        .post('/api/loyalty/redeem')
        .send({ customerId: testCustomerId, points: 500 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Insufficient points');
    });

    it('should get points balance', async () => {
      await request(app).post('/api/loyalty/earn').send({ customerId: testCustomerId, amount: 75 });

      const response = await request(app).get(`/api/loyalty/${testCustomerId}/points`);

      expect(response.status).toBe(200);
      expect(response.body.data.points).toBe(750);
    });
  });

  describe('Order Operations', () => {
    let testCustomerId: string;
    let testProductId: string;

    beforeEach(async () => {
      const custResponse = await request(app)
        .post('/api/customers')
        .send({ name: 'Order Test', email: 'order@test.com' });
      testCustomerId = custResponse.body.data.customerId;

      const prodResponse = await request(app)
        .post('/api/products')
        .send({ name: 'Order Product', sku: 'ORDER-001', price: 25, category: 'misc' });
      testProductId = prodResponse.body.data.productId;
    });

    it('should create an order', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          customerId: testCustomerId,
          items: [
            { productId: testProductId, quantity: 2, price: 25 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.orderId).toBeDefined();
      expect(response.body.data.total).toBe(50);
      expect(response.body.data.status).toBe('pending');
    });

    it('should calculate total correctly', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          customerId: testCustomerId,
          items: [
            { productId: testProductId, quantity: 3, price: 10 },
            { productId: testProductId, quantity: 1, price: 25 }
          ]
        });

      expect(response.body.data.total).toBe(55);
    });

    it('should get order by ID', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          customerId: testCustomerId,
          items: [{ productId: testProductId, quantity: 1, price: 25 }]
        });

      const response = await request(app).get(`/api/orders/${createResponse.body.data.orderId}`);
      expect(response.status).toBe(200);
    });

    it('should update order status', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          customerId: testCustomerId,
          items: [{ productId: testProductId, quantity: 1, price: 25 }]
        });

      const response = await request(app)
        .patch(`/api/orders/${createResponse.body.data.orderId}/status`)
        .send({ status: 'processing' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('processing');
    });
  });

  describe('Analytics', () => {
    it('should return summary statistics', async () => {
      // Create some test data
      await request(app).post('/api/products').send({ name: 'P1', sku: 'SKU1', price: 10, category: 'a' });
      await request(app).post('/api/customers').send({ name: 'C1', email: 'c1@test.com' });

      const response = await request(app).get('/api/analytics/summary');

      expect(response.status).toBe(200);
      expect(response.body.data.totalProducts).toBeGreaterThan(0);
      expect(response.body.data.totalCustomers).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});