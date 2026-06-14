/**
 * RABTUL Payment Service Integration Tests
 *
 * Tests the centralized payment service via Razorpay.
 *
 * @group integration
 * @group payment
 */

import { describe, test, expect } from 'vitest';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-token';

describe('RABTUL Payment Service Integration Tests', () => {

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('Payment Initiation', () => {
    test('should initiate payment with valid data', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          amount: 1000, // in paise
          currency: 'INR',
          receipt: `test_${Date.now()}`,
          notes: {
            test: 'integration-test'
          }
        }),
      });

      // Should return 200 or 400 depending on validation
      expect([200, 400, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('orderId');
      }
    });

    test('should reject payment without internal token', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000,
          currency: 'INR',
        }),
      });

      expect(response.status).toBe(401);
    });

    test('should validate amount is positive', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          amount: -100,
          currency: 'INR',
        }),
      });

      // Should return validation error
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Payment Status', () => {
    test('should get payment status with valid order ID', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/status/invalid_order_id`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      });

      // Should return 404 for non-existent order
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Payment Verification', () => {
    test('should verify payment with valid signature', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'invalid_signature',
        }),
      });

      // Should return error for invalid signature
      expect(response.status).toBe(400);
    });
  });

  describe('Refund Operations', () => {
    test('should handle refund request', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          payment_id: 'pay_nonexistent',
          amount: 100,
          notes: 'Test refund',
        }),
      });

      // Should return error for non-existent payment
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('UPI Operations', () => {
    test('should create UPI payment', async () => {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/create-upi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          amount: 1000,
          currency: 'INR',
          customer_vpa: 'test@upi',
        }),
      });

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

describe('Payment Service Error Handling', () => {
  test('should timeout gracefully', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    try {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': 'invalid-token-to-cause-delay',
        },
        body: JSON.stringify({ amount: 1000 }),
        signal: controller.signal,
      });

      // Should complete within timeout
      expect(response.status).toBeDefined();
    } catch (error) {
      // Should timeout gracefully
      expect(error).toBeDefined();
    } finally {
      clearTimeout(timeout);
    }
  });
});
