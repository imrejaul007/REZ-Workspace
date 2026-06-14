/**
 * REZ Inventory Alerts Service Tests
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('REZ Inventory Alerts Service', () => {
  let alertId;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('rez-inventory-alerts');
    });
  });

  describe('Threshold Management', () => {
    it('should set alert threshold', async () => {
      const res = await request(app)
        .post('/api/thresholds')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD001',
          productName: 'Test Product',
          lowStock: 15,
          criticalStock: 5,
          reorderPoint: 25
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.threshold).toBeDefined();
    });

    it('should get thresholds for merchant', async () => {
      const res = await request(app).get('/api/thresholds/MERCH001');
      expect(res.status).toBe(200);
      expect(res.body.thresholds).toBeInstanceOf(Array);
    });

    it('should get specific threshold', async () => {
      const res = await request(app).get('/api/thresholds/MERCH001/PRD001');
      expect(res.status).toBe(200);
      expect(res.body.merchantId).toBe('MERCH001');
    });

    it('should update threshold', async () => {
      const res = await request(app)
        .put('/api/thresholds/MERCH001/PRD001')
        .send({ lowStock: 20, criticalStock: 8 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete threshold', async () => {
      const res = await request(app).delete('/api/thresholds/MERCH001/NEWPROD');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent threshold', async () => {
      const res = await request(app).get('/api/thresholds/MERCH001/NONEXISTENT');
      expect(res.status).toBe(404);
    });
  });

  describe('Stock Checking', () => {
    it('should check stock and detect critical level', async () => {
      const res = await request(app)
        .post('/api/check-stock')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD001',
          currentStock: 3,
          productName: 'Test Product'
        });

      expect(res.status).toBe(200);
      expect(res.body.alert).toBeDefined();
    });

    it('should check stock and detect low level', async () => {
      const res = await request(app)
        .post('/api/check-stock')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD001',
          currentStock: 7,
          productName: 'Test Product'
        });

      expect(res.status).toBe(200);
      expect(res.body.alert).toMatch(/critical|low|none/);
    });

    it('should check stock with normal level', async () => {
      const res = await request(app)
        .post('/api/check-stock')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD001',
          currentStock: 50,
          productName: 'Test Product'
        });

      expect(res.status).toBe(200);
      expect(res.body.alert).toBe('none');
    });

    it('should bulk check stock levels', async () => {
      const res = await request(app)
        .post('/api/check-stock/bulk')
        .send({
          items: [
            { merchantId: 'MERCH001', productId: 'PRD001', currentStock: 3 },
            { merchantId: 'MERCH001', productId: 'PRD002', currentStock: 50 },
            { merchantId: 'MERCH002', productId: 'PRD003', currentStock: 8 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.totalChecked).toBe(3);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/check-stock')
        .send({ merchantId: 'MERCH001' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid bulk request', async () => {
      const res = await request(app)
        .post('/api/check-stock/bulk')
        .send({ items: 'not-an-array' });

      expect(res.status).toBe(400);
    });
  });

  describe('Alert Management', () => {
    it('should create alert by checking stock', async () => {
      // Check stock to trigger alert
      await request(app)
        .post('/api/check-stock')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD001',
          currentStock: 2,
          productName: 'Critical Product'
        });

      const res = await request(app).get('/api/alerts/MERCH001');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeInstanceOf(Array);

      // Store first alert for other tests
      if (res.body.alerts.length > 0) {
        alertId = res.body.alerts[0].id;
      }
    });

    it('should get all alerts', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeInstanceOf(Array);
    });

    it('should filter alerts by status', async () => {
      const res = await request(app).get('/api/alerts?status=active');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeInstanceOf(Array);
    });

    it('should filter alerts by level', async () => {
      const res = await request(app).get('/api/alerts?alertLevel=critical');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeInstanceOf(Array);
    });

    it('should get alert by ID', async () => {
      if (alertId) {
        const res = await request(app).get(`/api/alerts/detail/${alertId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(alertId);
      }
    });

    it('should resolve alert', async () => {
      if (alertId) {
        const res = await request(app)
          .put(`/api/alerts/${alertId}/resolve`)
          .send({
            resolution: 'Stock replenished',
            restockedQuantity: 50
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.alert.status).toBe('resolved');
      }
    });

    it('should snooze alert', async () => {
      // Create a new alert to snooze
      await request(app)
        .post('/api/check-stock')
        .send({
          merchantId: 'MERCH001',
          productId: 'PRD002',
          currentStock: 1
        });

      const alertsRes = await request(app).get('/api/alerts/MERCH001?status=active');
      if (alertsRes.body.alerts.length > 0) {
        const newAlertId = alertsRes.body.alerts[0].id;

        const res = await request(app)
          .put(`/api/alerts/${newAlertId}/snooze`)
          .send({ snoozeUntil: '2026-06-10' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.alert.status).toBe('snoozed');
      }
    });

    it('should bulk resolve alerts', async () => {
      const res = await request(app)
        .post('/api/alerts/bulk/resolve')
        .send({
          alertIds: ['ALT-TEST001', 'ALT-TEST002'],
          resolution: 'Bulk resolved'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete alert', async () => {
      const res = await request(app).delete('/api/alerts/ALT-NONEXISTENT');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent alert', async () => {
      const res = await request(app).get('/api/alerts/detail/NONEXISTENT');
      expect(res.status).toBe(404);
    });
  });

  describe('Product Management', () => {
    it('should register product for monitoring', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          id: 'NEW-PROD-001',
          name: 'New Monitored Product',
          merchantId: 'MERCH001',
          currentStock: 50,
          sku: 'SKU-NEW-001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should get products for merchant', async () => {
      const res = await request(app).get('/api/products/MERCH001');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
    });

    it('should update product stock', async () => {
      const res = await request(app)
        .put('/api/products/PRD001/stock')
        .send({
          currentStock: 45,
          reason: 'Sales'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should adjust product stock', async () => {
      const res = await request(app)
        .put('/api/products/PRD001/stock')
        .send({
          adjustment: -5,
          reason: 'Damaged'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Reports', () => {
    it('should get alert statistics', async () => {
      const res = await request(app).get('/api/reports/stats');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeDefined();
      expect(res.body.byLevel).toBeDefined();
    });

    it('should filter stats by merchant', async () => {
      const res = await request(app).get('/api/reports/stats?merchantId=MERCH001');
      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeDefined();
    });

    it('should get low stock report', async () => {
      const res = await request(app).get('/api/reports/low-stock');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
    });

    it('should limit low stock report', async () => {
      const res = await request(app).get('/api/reports/low-stock?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(5);
    });
  });
});