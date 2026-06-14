import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { Business } from '../models/Business';
import { Industry } from '../models/Industry';

describe('NexTaBizz Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Business.deleteMany({});
    await Industry.deleteMany({});
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Business CRUD', () => {
    it('POST /api/business should create a business', async () => {
      const business = {
        name: 'Test Restaurant',
        industry: 'restaurant',
        ownerId: 'user123',
        phone: '+919876543210',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/business')
        .send(business);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(business.name);
      expect(res.body.industry).toBe(business.industry);
      expect(res.body.modules).toBeDefined();
    });

    it('GET /api/business should return all businesses', async () => {
      await Business.create([
        { name: 'Business 1', industry: 'restaurant', ownerId: 'user1' },
        { name: 'Business 2', industry: 'hotel', ownerId: 'user1' }
      ]);

      const res = await request(app).get('/api/business');

      expect(res.status).toBe(200);
      expect(res.body.businesses).toHaveLength(2);
    });

    it('GET /api/business/:id should return single business', async () => {
      const business = await Business.create({
        name: 'Test Business',
        industry: 'salon',
        ownerId: 'user123'
      });

      const res = await request(app).get(`/api/business/${business._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Business');
    });

    it('PUT /api/business/:id should update business', async () => {
      const business = await Business.create({
        name: 'Old Name',
        industry: 'restaurant',
        ownerId: 'user123'
      });

      const res = await request(app)
        .put(`/api/business/${business._id}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('DELETE /api/business/:id should delete business', async () => {
      const business = await Business.create({
        name: 'To Delete',
        industry: 'retail',
        ownerId: 'user123'
      });

      const res = await request(app).delete(`/api/business/${business._id}`);

      expect(res.status).toBe(204);
      expect(await Business.findById(business._id)).toBeNull();
    });
  });

  describe('Industry Modules', () => {
    it('GET /api/industries should return all industries', async () => {
      const res = await request(app).get('/api/industries');

      expect(res.status).toBe(200);
      expect(res.body.industries).toBeDefined();
      expect(Array.isArray(res.body.industries)).toBe(true);
    });

    it('GET /api/business/:id/modules should return business modules', async () => {
      const business = await Business.create({
        name: 'Test',
        industry: 'restaurant',
        ownerId: 'user123',
        modules: ['menu', 'pos', 'kds']
      });

      const res = await request(app).get(`/api/business/${business._id}/modules`);

      expect(res.status).toBe(200);
      expect(res.body.modules).toContain('menu');
    });

    it('POST /api/business/:id/modules should add module', async () => {
      const business = await Business.create({
        name: 'Test',
        industry: 'restaurant',
        ownerId: 'user123',
        modules: []
      });

      const res = await request(app)
        .post(`/api/business/${business._id}/modules`)
        .send({ module: 'inventory' });

      expect(res.status).toBe(200);
      expect(res.body.modules).toContain('inventory');
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/business/:id should return analytics', async () => {
      const business = await Business.create({
        name: 'Test',
        industry: 'restaurant',
        ownerId: 'user123',
        stats: {
          totalRevenue: 10000,
          totalOrders: 100,
          totalCustomers: 50
        }
      });

      const res = await request(app).get(`/api/analytics/business/${business._id}`);

      expect(res.status).toBe(200);
      expect(res.body.revenue).toBeDefined();
      expect(res.body.orders).toBeDefined();
    });
  });
});
