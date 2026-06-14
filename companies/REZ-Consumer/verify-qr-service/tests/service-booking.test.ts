/**
 * Service Booking API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4003';

describe('Service Booking APIs', () => {
  const testSerial = 'TEST123456';
  const testUserId = 'user_test_123';
  const testCenterId = 'SC-TEST001';

  describe('GET /api/service-slots', () => {
    it('should return available slots for a center', async () => {
      const response = await fetch(`${BASE_URL}/api/service-slots?center_id=${testCenterId}&days=7`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.center_id).toBe(testCenterId);
      expect(Array.isArray(data.slots)).toBe(true);
    });

    it('should require center_id parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/service-slots`);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/service-types/:serial', () => {
    it('should return eligible services for a product', async () => {
      const response = await fetch(`${BASE_URL}/api/service-types/${testSerial}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.services)).toBe(true);
      expect(data.services.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/book-service', () => {
    it('should create a service booking', async () => {
      const bookingData = {
        serial_number: testSerial,
        user_id: testUserId,
        customer_name: 'Test User',
        customer_phone: '+919999999999',
        service_center_id: testCenterId,
        service_type: 'routine_service',
        preferred_date: new Date(Date.now() + 86400000).toISOString(),
        preferred_time: '10:00'
      };

      const response = await fetch(`${BASE_URL}/api/book-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.booking_id).toBeDefined();
    });

    it('should reject booking without required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/book-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bookings', () => {
    it('should return user bookings', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings?user_id=${testUserId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.bookings)).toBe(true);
    });

    it('should require user_id parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings`);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel a pending booking', async () => {
      // First create a booking
      const createResponse = await fetch(`${BASE_URL}/api/book-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: testSerial,
          user_id: testUserId,
          customer_name: 'Test',
          customer_phone: '+919999999999',
          service_center_id: testCenterId,
          service_type: 'routine_service',
          preferred_date: new Date(Date.now() + 86400000).toISOString(),
          preferred_time: '11:00'
        })
      });
      const { booking_id } = await createResponse.json();

      // Cancel it
      const cancelResponse = await fetch(`${BASE_URL}/api/bookings/${booking_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Test cancellation' })
      });

      expect(cancelResponse.status).toBe(200);
    });
  });

  describe('POST /api/support/request', () => {
    it('should create support ticket', async () => {
      const response = await fetch(`${BASE_URL}/api/support/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: testUserId,
          customer_name: 'Test User',
          customer_phone: '+919999999999',
          serial_number: testSerial,
          issue_type: 'warranty_inquiry',
          description: 'Need help with warranty claim'
        })
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Analytics', () => {
    it('should return booking metrics', async () => {
      const response = await fetch(`${BASE_URL}/analytics/bookings`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBeDefined();
      expect(data.breakdown).toBeDefined();
    });
  });
});
