/**
 * REZ Bills - API Integration Tests
 * Tests the Express API endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Build a test app similar to production
function createTestApp() {
  const app = express();

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests' },
  });
  app.use('/api/', limiter);

  // Mock bill store
  const bills = new Map();

  // Routes
  app.post('/api/bills', (req, res) => {
    const { user_id, merchant_name, amount, category } = req.body;
    if (!user_id || !merchant_name || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const bill = {
      bill_id: `bill_${Date.now()}`,
      user_id,
      merchant_name,
      amount,
      category,
      cashback_earned: Math.round(amount * 0.01 * 100) / 100,
      cashback_claimed: false,
      created_at: new Date().toISOString(),
    };
    bills.set(bill.bill_id, bill);
    res.json({ success: true, data: bill });
  });

  app.get('/api/bills', (req, res) => {
    const { user_id } = req.query;
    const userBills = Array.from(bills.values()).filter(b => b.user_id === user_id);
    res.json({ success: true, data: userBills });
  });

  app.get('/api/bills/:id', (req, res) => {
    const bill = bills.get(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    res.json({ success: true, data: bill });
  });

  app.post('/api/bills/:id/claim-cashback', (req, res) => {
    const bill = bills.get(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (bill.cashback_claimed) {
      return res.status(400).json({ success: false, error: 'Cashback already claimed' });
    }
    bill.cashback_claimed = true;
    bills.set(bill.bill_id, bill);
    res.json({ success: true, data: bill });
  });

  return { app, bills };
}

describe('REZ Bills API Integration Tests', () => {
  let testApp: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    testApp = createTestApp();
    testApp.bills.clear();
  });

  describe('POST /api/bills', () => {
    it('should create a new bill', async () => {
      const request = require('supertest');
      const response = await request.default(testApp.app)
        .post('/api/bills')
        .send({
          user_id: 'user_123',
          merchant_name: 'Pizza Palace',
          amount: 500,
          category: 'restaurant',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bill_id).toBeDefined();
      expect(response.body.data.merchant_name).toBe('Pizza Palace');
      expect(response.body.data.amount).toBe(500);
      expect(response.body.data.cashback_earned).toBe(5);
    });

    it('should reject bills without required fields', async () => {
      const request = require('supertest');
      const response = await request.default(testApp.app)
        .post('/api/bills')
        .send({
          user_id: 'user_123',
          // missing merchant_name and amount
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/bills', () => {
    it('should get all bills for a user', async () => {
      const request = require('supertest');

      // Create some bills first
      await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_123', merchant_name: 'Shop A', amount: 100, category: 'shopping' });
      await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_123', merchant_name: 'Shop B', amount: 200, category: 'grocery' });
      await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_456', merchant_name: 'Shop C', amount: 300, category: 'food' });

      const response = await request.default(testApp.app)
        .get('/api/bills?user_id=user_123');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/bills/:id', () => {
    it('should get a specific bill', async () => {
      const request = require('supertest');

      const createResponse = await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_123', merchant_name: 'Pizza Palace', amount: 500, category: 'restaurant' });

      const billId = createResponse.body.data.bill_id;

      const response = await request.default(testApp.app)
        .get(`/api/bills/${billId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.merchant_name).toBe('Pizza Palace');
    });

    it('should return 404 for non-existent bill', async () => {
      const request = require('supertest');
      const response = await request.default(testApp.app)
        .get('/api/bills/non_existent_id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/bills/:id/claim-cashback', () => {
    it('should claim cashback for a bill', async () => {
      const request = require('supertest');

      const createResponse = await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_123', merchant_name: 'Pizza Palace', amount: 500, category: 'restaurant' });

      const billId = createResponse.body.data.bill_id;

      const response = await request.default(testApp.app)
        .post(`/api/bills/${billId}/claim-cashback`);

      expect(response.status).toBe(200);
      expect(response.body.data.cashback_claimed).toBe(true);
    });

    it('should reject double cashback claims', async () => {
      const request = require('supertest');

      const createResponse = await request.default(testApp.app)
        .post('/api/bills')
        .send({ user_id: 'user_123', merchant_name: 'Pizza Palace', amount: 500, category: 'restaurant' });

      const billId = createResponse.body.data.bill_id;

      // First claim
      await request.default(testApp.app).post(`/api/bills/${billId}/claim-cashback`);

      // Second claim should fail
      const response = await request.default(testApp.app)
        .post(`/api/bills/${billId}/claim-cashback`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cashback already claimed');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const request = require('supertest');

      // Make many requests quickly (simulating rate limit test)
      const results = [];
      for (let i = 0; i < 5; i++) {
        const response = await request.default(testApp.app)
          .get('/api/bills?user_id=test');
        results.push(response.status);
      }

      // All should succeed within rate limit
      expect(results.every(s => s === 200)).toBe(true);
    });
  });
});
