/**
 * POS Loyalty Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Base URL for tests
const BASE_URL = process.env.TEST_URL || 'http://localhost:4095';

describe('POS Loyalty Integration', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(BASE_URL).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('pos-loyalty-integration');
    });
  });

  describe('POS Sale Flow', () => {
    it('should process a POS sale', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/pos/sale')
        .send({
          merchantId: 'test_merchant',
          userId: 'test_user_123',
          orderId: 'order_001',
          amount: 500,
          paymentMethod: 'upi',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.coinsEarned).toBeGreaterThan(0);
    });

    it('should calculate coins correctly', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/pos/sale')
        .send({
          merchantId: 'rest_001',
          userId: 'user_silver',
          orderId: 'order_002',
          amount: 1000,
          paymentMethod: 'card',
        });

      expect(res.body.coinsEarned).toBe(1000); // 1000 * 1.0 (base rate)
    });

    it('should apply UPI bonus', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/pos/sale')
        .send({
          merchantId: 'rest_002',
          userId: 'user_003',
          orderId: 'order_003',
          amount: 500,
          paymentMethod: 'upi',
        });

      expect(res.body.bonusCoins).toBeGreaterThan(0);
    });
  });

  describe('QR Scan Flow', () => {
    it('should process check-in scan', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/pos/scan')
        .send({
          userId: 'user_004',
          merchantId: 'rest_003',
          scanType: 'checkin',
        });

      expect(res.status).toBe(200);
      expect(res.body.coinsEarned).toBe(10); // 10 coins for check-in
    });

    it('should process review scan', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/pos/scan')
        .send({
          userId: 'user_005',
          merchantId: 'rest_004',
          scanType: 'review',
        });

      expect(res.body.coinsEarned).toBe(25); // 25 coins for review
    });
  });

  describe('Merchant Config', () => {
    it('should get merchant config', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/merchant/test_merchant/config');

      expect(res.status).toBe(200);
      expect(res.body.config).toBeDefined();
    });

    it('should update merchant config', async () => {
      const res = await request(BASE_URL)
        .put('/api/v1/merchant/test_merchant/config')
        .send({
          earningRate: 0.10,
          tierEnabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Customer Balance', () => {
    it('should get customer balance', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/customer/test_user_123/balance');

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('test_user_123');
    });
  });

  describe('KDS Endpoints', () => {
    it('should process order completion', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/kds/order-complete')
        .send({
          orderId: 'kds_order_001',
          userId: 'kds_user',
          merchantId: 'kds_merchant',
          items: ['biryani', 'naan', 'curry'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bonusCoins).toBe(6); // 3 items × 2 coins
    });

    it('should process reorder', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/kds/reorder')
        .send({
          orderId: 'reorder_001',
          userId: 'reorder_user',
          merchantId: 'rest_005',
        });

      expect(res.status).toBe(200);
      expect(res.body.bonusCoins).toBeGreaterThan(0);
    });
  });

  describe('REZ NOW Endpoints', () => {
    it('should process fast delivery', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/reznow/delivery-complete')
        .send({
          orderId: 'now_order_001',
          userId: 'now_user',
          deliveryTime: 20, // Fast delivery
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should process first order bonus', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/reznow/first-order')
        .send({
          orderId: 'first_order',
          userId: 'new_user',
        });

      expect(res.status).toBe(200);
      expect(res.body.bonusCoins).toBe(100); // Welcome bonus
    });
  });

  describe('Analytics', () => {
    it('should get merchant stats', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/merchant/test_merchant/stats');

      expect(res.status).toBe(200);
      expect(res.body.merchantId).toBe('test_merchant');
    });
  });
});

describe('Loyalty Flow E2E', () => {
  it('should complete full loyalty cycle', async () => {
    const userId = 'e2e_user';
    const merchantId = 'e2e_merchant';

    // 1. Customer scans QR
    const scanRes = await request(BASE_URL)
      .post('/api/v1/pos/scan')
      .send({ userId, merchantId, scanType: 'checkin' });
    expect(scanRes.status).toBe(200);

    // 2. Customer makes purchase
    const saleRes = await request(BASE_URL)
      .post('/api/v1/pos/sale')
      .send({
        merchantId,
        userId,
        orderId: 'e2e_order',
        amount: 1000,
        paymentMethod: 'upi',
      });
    expect(saleRes.status).toBe(200);
    expect(saleRes.body.coinsEarned).toBeGreaterThan(100);

    // 3. Check customer balance
    const balanceRes = await request(BASE_URL)
      .get(`/api/v1/customer/${userId}/balance`);
    expect(balanceRes.status).toBe(200);
    expect(balanceRes.body.coins).toBeGreaterThan(0);
  });
});
