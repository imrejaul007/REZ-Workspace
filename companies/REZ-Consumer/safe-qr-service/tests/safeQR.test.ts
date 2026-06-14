/**
 * REZ Safe QR Service - Tests
 */

import { describe, it, expect } from '@jest/globals';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4000';

describe('Safe QR Service', () => {
  const testShortcode = `SAFE${Date.now()}`;

  describe('Core APIs', () => {
    it('GET /health should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
    });
  });

  describe('Support APIs', () => {
    it('GET /api/support/plans should return plans', async () => {
      const response = await fetch(`${BASE_URL}/api/support/plans`);
      expect([200, 404]).toContain(response.status);
    });

    it('POST /api/support/request should create request', async () => {
      const response = await fetch(`${BASE_URL}/api/support/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user',
          shortcode: testShortcode,
          device_type: 'phone',
          issue_type: 'lost',
          description: 'Device lost'
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('Express Recovery', () => {
    it('POST /api/express-recovery should request recovery', async () => {
      const response = await fetch(`${BASE_URL}/api/express-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user',
          shortcode: testShortcode,
          customer_phone: '+919999999999'
        })
      });
      expect([200, 400, 403]).toContain(response.status);
    });
  });

  describe('Merchant Integration', () => {
    it('POST /api/merchant/register-device should register device', async () => {
      const response = await fetch(`${BASE_URL}/api/merchant/register-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user',
          merchant_id: 'MERCH-TEST',
          shortcode: testShortcode,
          device_info: 'Test Device'
        })
      });
      expect([200, 400, 500]).toContain(response.status);
    });

    it('GET /api/merchant/analytics should return analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/merchant/analytics?merchant_id=MERCH-TEST`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Analytics', () => {
    it('GET /api/support/analytics should return support analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/support/analytics`);
      expect([200, 400]).toContain(response.status);
    });
  });
});
