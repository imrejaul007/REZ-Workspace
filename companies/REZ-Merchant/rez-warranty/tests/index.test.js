/**
 * REZ Warranty Service Tests
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('REZ Warranty Service', () => {
  let warrantyId;
  let claimId;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('rez-warranty');
    });
  });

  describe('Warranty Management', () => {
    it('should register a new warranty', async () => {
      const res = await request(app)
        .post('/api/warranties')
        .send({
          productId: 'PRD001',
          productName: 'Smart TV 55 inch',
          serialNumber: 'SN-2026-001',
          purchaseDate: '2026-01-15',
          customerName: 'Amit Sharma',
          customerEmail: 'amit@email.com',
          customerPhone: '9876543210',
          merchantId: 'MERCH001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.warrantyId).toBeDefined();
      warrantyId = res.body.warrantyId;
    });

    it('should get all warranties', async () => {
      const res = await request(app).get('/api/warranties');
      expect(res.status).toBe(200);
      expect(res.body.warranties).toBeInstanceOf(Array);
    });

    it('should get warranty by ID', async () => {
      const res = await request(app).get(`/api/warranties/${warrantyId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(warrantyId);
    });

    it('should verify warranty by serial number', async () => {
      const res = await request(app).get('/api/warranties/verify/SN-2026-001');
      expect(res.status).toBe(200);
      expect(res.body.serialNumber).toBe('SN-2026-001');
      expect(res.body.daysRemaining).toBeGreaterThan(0);
    });

    it('should extend warranty', async () => {
      const res = await request(app)
        .post(`/api/warranties/${warrantyId}/extend`)
        .send({ additionalMonths: 12 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warranty.extendedWarrantyMonths).toBe(12);
    });

    it('should transfer warranty ownership', async () => {
      const res = await request(app)
        .post(`/api/warranties/${warrantyId}/transfer`)
        .send({
          newOwnerName: 'Priya Patel',
          newOwnerEmail: 'priya@email.com',
          newOwnerPhone: '9988776655'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warranty.customerName).toBe('Priya Patel');
    });

    it('should filter warranties by merchant', async () => {
      const res = await request(app).get('/api/warranties?merchantId=MERCH001');
      expect(res.status).toBe(200);
      expect(res.body.warranties).toBeInstanceOf(Array);
    });

    it('should cancel warranty', async () => {
      const res = await request(app).delete(`/api/warranties/${warrantyId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent warranty', async () => {
      const res = await request(app).get('/api/warranties/NONEXISTENT');
      expect(res.status).toBe(404);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/warranties')
        .send({ productId: 'PRD001' });

      expect(res.status).toBe(400);
    });
  });

  describe('Warranty Claims', () => {
    beforeEach(async () => {
      // Create a warranty for claims tests
      const res = await request(app)
        .post('/api/warranties')
        .send({
          productId: 'PRD002',
          serialNumber: 'SN-TEST-CLAIM',
          purchaseDate: '2026-01-01',
          customerName: 'Test Customer'
        });
      warrantyId = res.body.warrantyId;
    });

    it('should file a warranty claim', async () => {
      const res = await request(app)
        .post('/api/claims')
        .send({
          warrantyId,
          issueDescription: 'Screen not displaying properly',
          issueCategory: 'display',
          customerName: 'Test Customer',
          customerPhone: '9876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.claimId).toBeDefined();
      claimId = res.body.claimId;
    });

    it('should reject claim for expired warranty', async () => {
      const res = await request(app)
        .post('/api/claims')
        .send({
          warrantyId: 'WRNT-EXPIRED001',
          issueDescription: 'Test issue'
        });

      expect(res.status).toBe(404);
    });

    it('should get all claims', async () => {
      const res = await request(app).get('/api/claims');
      expect(res.status).toBe(200);
      expect(res.body.claims).toBeInstanceOf(Array);
    });

    it('should get claim by ID', async () => {
      const res = await request(app).get(`/api/claims/${claimId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(claimId);
    });

    it('should update claim', async () => {
      const res = await request(app)
        .put(`/api/claims/${claimId}`)
        .send({ priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should assign claim to agent', async () => {
      const res = await request(app)
        .post(`/api/claims/${claimId}/assign`)
        .send({
          agentId: 'AGENT001',
          agentName: 'Service Agent'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.claim.status).toBe('in-progress');
    });

    it('should resolve claim', async () => {
      const res = await request(app)
        .post(`/api/claims/${claimId}/resolve`)
        .send({
          resolution: 'Screen replaced successfully',
          replacementIssued: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.claim.status).toBe('resolved');
    });

    it('should reject claim', async () => {
      const res = await request(app)
        .post(`/api/claims/${claimId}/reject`)
        .send({ reason: 'Warranty terms not met' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.claim.status).toBe('rejected');
    });

    it('should filter claims by status', async () => {
      const res = await request(app).get('/api/claims?status=pending');
      expect(res.status).toBe(200);
      expect(res.body.claims).toBeInstanceOf(Array);
    });
  });

  describe('Product Management', () => {
    it('should register a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          id: 'PRD-NEW-001',
          name: 'New Product',
          category: 'electronics',
          merchantId: 'MERCH001',
          baseWarrantyMonths: 24
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should get all products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
    });

    it('should get product by ID', async () => {
      const res = await request(app).get('/api/products/PRD001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('PRD001');
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=electronics');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
    });
  });

  describe('Reports', () => {
    it('should get warranty statistics', async () => {
      const res = await request(app).get('/api/reports/stats');
      expect(res.status).toBe(200);
      expect(res.body.warranties).toBeDefined();
      expect(res.body.claims).toBeDefined();
    });

    it('should get claims by warranty', async () => {
      const res = await request(app).get(`/api/warranties/${warrantyId}/claims`);
      expect(res.status).toBe(200);
      expect(res.body.claims).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent claim', async () => {
      const res = await request(app).get('/api/claims/NONEXISTENT');
      expect(res.status).toBe(404);
    });

    it('should return 400 for missing fields on extend', async () => {
      const res = await request(app)
        .post(`/api/warranties/${warrantyId}/extend`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/NONEXISTENT');
      expect(res.status).toBe(404);
    });
  });
});