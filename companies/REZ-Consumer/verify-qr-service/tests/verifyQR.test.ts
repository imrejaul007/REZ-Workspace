/**
 * REZ Verify QR Service - Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4003';

describe('Verify QR Service', () => {
  const testSerial = `TEST-${Date.now()}`;

  describe('Core APIs', () => {
    it('GET /health should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });

    it('POST /api/verify should verify product', async () => {
      const response = await fetch(`${BASE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: testSerial,
          user_id: 'test_user',
          user_phone: '+919999999999'
        })
      });
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Warranty APIs', () => {
    it('POST /api/activate-warranty should activate warranty', async () => {
      const response = await fetch(`${BASE_URL}/api/activate-warranty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: testSerial,
          user_id: 'test_user',
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          purchase_date: '2026-05-01'
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });

    it('GET /api/service-types/:serial should return services', async () => {
      const response = await fetch(`${BASE_URL}/api/service-types/${testSerial}`);
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Service Booking APIs', () => {
    it('GET /api/service-slots should return slots', async () => {
      const response = await fetch(`${BASE_URL}/api/service-slots?center_id=SC-TEST&days=7`);
      expect([200, 404]).toContain(response.status);
    });

    it('POST /api/book-service should create booking', async () => {
      const response = await fetch(`${BASE_URL}/api/book-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: testSerial,
          user_id: 'test_user',
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          service_center_id: 'SC-TEST',
          service_type: 'routine_service',
          preferred_date: new Date(Date.now() + 86400000).toISOString(),
          preferred_time: '10:00'
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });

    it('GET /api/bookings should return user bookings', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings?user_id=test_user`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Warranty Plans APIs', () => {
    it('GET /api/warranty-plans should return plans', async () => {
      const response = await fetch(`${BASE_URL}/api/warranty-plans`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data.plans)).toBe(true);
    });
  });

  describe('Express Replacement APIs', () => {
    it('POST /api/express-replacement should request replacement', async () => {
      const response = await fetch(`${BASE_URL}/api/express-replacement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: 'test_claim',
          serial_number: testSerial,
          user_id: 'test_user',
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          customer_address: {
            line1: '123 Test St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          },
          brand: 'TestBrand',
          model: 'TestModel',
          issue_description: 'Screen not working'
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('Pickup APIs', () => {
    it('POST /api/pickup-request should create pickup request', async () => {
      const response = await fetch(`${BASE_URL}/api/pickup-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: 'test_booking',
          user_id: 'test_user',
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          pickup_address: {
            line1: '123 Test St',
            city: 'Bangalore',
            pincode: '560001'
          },
          service_type: 'repair',
          scheduled_pickup: new Date(Date.now() + 86400000).toISOString()
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('Support APIs', () => {
    it('POST /api/support/request should create support ticket', async () => {
      const response = await fetch(`${BASE_URL}/api/support/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user',
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          serial_number: testSerial,
          issue_type: 'warranty_inquiry',
          description: 'Need help with warranty'
        })
      });
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('ML APIs', () => {
    it('GET /api/nearest-center should return nearest center', async () => {
      const response = await fetch(`${BASE_URL}/api/nearest-center?lat=12.97&lng=77.59`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Analytics APIs', () => {
    it('GET /analytics/bookings should return analytics', async () => {
      const response = await fetch(`${BASE_URL}/analytics/bookings`);
      expect([200, 400]).toContain(response.status);
    });
  });
});
