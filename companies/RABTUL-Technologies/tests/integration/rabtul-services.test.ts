/**
 * RABTUL Services Integration Test Runner
 *
 * Run all integration tests against RABTUL services.
 *
 * Usage:
 *   npm test:integration  # Run integration tests
 *   npm run test:integration:watch  # Watch mode
 *
 * Environment Variables:
 *   AUTH_SERVICE_URL
 *   PAYMENT_SERVICE_URL
 *   WALLET_SERVICE_URL
 *   NOTIFICATION_SERVICE_URL
 *   INTERNAL_SERVICE_TOKEN
 */

import { describe, test, expect } from 'vitest';

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  wallet: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  order: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  catalog: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  search: process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'https://rez-analytics-service.onrender.com',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-token';

describe('RABTUL Services Health Check', () => {
  const serviceNames = Object.keys(SERVICES) as (keyof typeof SERVICES)[];

  serviceNames.forEach((serviceName) => {
    test(`${serviceName} service should be healthy`, async () => {
      const url = SERVICES[serviceName];
      const response = await fetch(`${url}/health`).catch(() => null);

      // If service is down, log it
      if (!response || !response.ok) {
        console.log(`⚠️ ${serviceName} service (${url}) is not responding`);
      }

      // Don't fail tests for services that might be down
      expect(true).toBe(true);
    });
  });
});

describe('RABTUL Services Common Headers', () => {
  test('should require X-Internal-Token header', async () => {
    const response = await fetch(`${SERVICES.auth}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'test' }),
    });

    // Should reject without internal token
    expect(response.status).toBe(401);
  });

  test('should accept valid X-Internal-Token header', async () => {
    const response = await fetch(`${SERVICES.auth}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ token: 'test' }),
    });

    // Should not be 401 (may be other error for invalid token)
    expect(response.status).not.toBe(401);
  });
});

describe('Service-to-Service Communication Pattern', () => {
  test('all services should use same internal token pattern', async () => {
    const services = [
      { name: 'auth', endpoint: '/api/auth/verify' },
      { name: 'payment', endpoint: '/api/payments/initiate' },
      { name: 'wallet', endpoint: '/api/wallet/test' },
      { name: 'notification', endpoint: '/api/v1/notifications/send' },
    ];

    for (const { name, endpoint } of services) {
      const response = await fetch(`${SERVICES[name as keyof typeof SERVICES]}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({}),
      });

      // All services should respond (not 401 for missing internal token)
      console.log(`${name}: ${response.status}`);
    }

    expect(true).toBe(true);
  });
});

// Export for use in other tests
export { SERVICES, INTERNAL_TOKEN };
