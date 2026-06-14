/**
 * REZ Multi-Location Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('REZ Multi-Location Service', () => {
  let locationId;
  let orderId;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('rez-multi-location');
    });
  });

  describe('Location Management', () => {
    it('should create a new location', async () => {
      const res = await request(app)
        .post('/api/locations')
        .send({
          name: 'Test Store',
          address: '123 Test St',
          city: 'Pune',
          merchantId: 'MERCH001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.locationId).toBeDefined();
      locationId = res.body.locationId;
    });

    it('should get all locations', async () => {
      const res = await request(app).get('/api/locations');
      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should get location by ID', async () => {
      const res = await request(app).get(`/api/locations/${locationId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(locationId);
    });

    it('should update location', async () => {
      const res = await request(app)
        .put(`/api/locations/${locationId}`)
        .send({ name: 'Updated Store Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.location.name).toBe('Updated Store Name');
    });

    it('should filter locations by city', async () => {
      const res = await request(app).get('/api/locations?city=Mumbai');
      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
    });

    it('should delete location', async () => {
      const res = await request(app).delete(`/api/locations/${locationId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent location', async () => {
      const res = await request(app).get('/api/locations/NONEXISTENT');
      expect(res.status).toBe(404);
    });
  });

  describe('Inventory Management', () => {
    it('should add inventory item', async () => {
      const res = await request(app)
        .post('/api/inventory/LOC001')
        .send({
          productId: 'PROD001',
          productName: 'Test Product',
          quantity: 50,
          minStock: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get inventory for location', async () => {
      const res = await request(app).get('/api/inventory/LOC001');
      expect(res.status).toBe(200);
      expect(res.body.locationId).toBe('LOC001');
      expect(res.body.inventory).toBeInstanceOf(Array);
    });

    it('should transfer inventory between locations', async () => {
      const res = await request(app)
        .post('/api/inventory/transfer')
        .send({
          fromLocationId: 'LOC001',
          toLocationId: 'LOC002',
          productId: 'PROD001',
          quantity: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transfer).toBeDefined();
    });

    it('should reject transfer with insufficient stock', async () => {
      const res = await request(app)
        .post('/api/inventory/transfer')
        .send({
          fromLocationId: 'LOC001',
          toLocationId: 'LOC002',
          productId: 'PROD999',
          quantity: 10000
        });

      expect(res.status).toBe(404);
    });

    it('should get transfer history', async () => {
      const res = await request(app).get('/api/inventory/transfers');
      expect(res.status).toBe(200);
      expect(res.body.transfers).toBeInstanceOf(Array);
    });
  });

  describe('Order Management', () => {
    it('should create an order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          locationId: 'LOC001',
          customerId: 'CUST001',
          items: [
            { productId: 'PROD001', name: 'Product 1', price: 100, quantity: 2 }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBeDefined();
      orderId = res.body.orderId;
    });

    it('should get all orders', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body.orders).toBeInstanceOf(Array);
    });

    it('should filter orders by location', async () => {
      const res = await request(app).get('/api/orders?locationId=LOC001');
      expect(res.status).toBe(200);
      expect(res.body.orders).toBeInstanceOf(Array);
    });

    it('should get order by ID', async () => {
      const res = await request(app).get(`/api/orders/${orderId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
    });
  });

  describe('Analytics & Reports', () => {
    it('should get consolidated report', async () => {
      const res = await request(app).get('/api/reports/consolidated');
      expect(res.status).toBe(200);
      expect(res.body.totalLocations).toBeDefined();
      expect(res.body.totalRevenue).toBeDefined();
      expect(res.body.totalOrders).toBeDefined();
    });

    it('should get location analytics', async () => {
      const res = await request(app).get('/api/locations/LOC001/analytics');
      expect(res.status).toBe(200);
      expect(res.body.locationId).toBe('LOC001');
      expect(res.body.revenue).toBeDefined();
    });

    it('should get comparison report', async () => {
      const res = await request(app).get('/api/reports/comparison');
      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
    });

    it('should filter comparison by city', async () => {
      const res = await request(app).get('/api/reports/comparison?city=Mumbai');
      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
    });
  });

  describe('Manager Operations', () => {
    it('should assign manager to location', async () => {
      const res = await request(app)
        .post('/api/locations/LOC001/manager')
        .send({
          name: 'John Manager',
          email: 'john@rez.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.manager).toBeDefined();
    });

    it('should get manager details', async () => {
      const res = await request(app).get('/api/managers/MGR001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('MGR001');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing required fields on location create', async () => {
      const res = await request(app)
        .post('/api/locations')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for missing fields on transfer', async () => {
      const res = await request(app)
        .post('/api/inventory/transfer')
        .send({ fromLocationId: 'LOC001' });

      expect(res.status).toBe(400);
    });
  });
});