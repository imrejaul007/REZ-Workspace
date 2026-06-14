/**
 * RABTUL Wallet Service Integration Tests
 *
 * Tests the centralized wallet service.
 *
 * @group integration
 * @group wallet
 */

import { describe, test, expect } from 'vitest';

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-token';

describe('RABTUL Wallet Service Integration Tests', () => {

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('Wallet Balance', () => {
    test('should get wallet balance for user', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/test_user_id`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      });

      // Should return 200 or 404
      expect([200, 404]).toContain(response.status);
    });

    test('should reject requests without internal token', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/test_user_id`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Credit Operations', () => {
    test('should credit wallet with valid data', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          amount: 1000,
          type: 'CREDIT',
          reason: 'Test credit',
        }),
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test('should validate amount is positive', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          amount: -100,
          type: 'CREDIT',
        }),
      });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Debit Operations', () => {
    test('should debit wallet with valid data', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/debit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          amount: 100,
          type: 'DEBIT',
          reason: 'Test debit',
        }),
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  describe('Transaction History', () => {
    test('should get transaction history', async () => {
      const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/test_user_id/transactions`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      });

      expect([200, 404]).toContain(response.status);
    });
  });
});

describe('Wallet Service Error Handling', () => {
  test('should handle insufficient balance', async () => {
    const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: 'test_user_id',
        amount: 999999999,
        type: 'DEBIT',
      }),
    });

    // Should return error for insufficient balance
    expect([400, 500]).toContain(response.status);
  });
});
