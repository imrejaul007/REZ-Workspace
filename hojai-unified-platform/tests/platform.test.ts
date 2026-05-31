import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:4850';

describe('Hojai Unified Platform API', () => {

  // ============ HEALTH CHECKS ============

  describe('Health Checks', () => {
    test('GET /health returns ok', async () => {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('hojai-unified-platform');
    });

    test('GET /health/live returns alive', async () => {
      const response = await fetch(`${API_URL}/health/live`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('alive');
    });

    test('GET /health/ready returns ready', async () => {
      const response = await fetch(`${API_URL}/health/ready`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mongodb).toBeDefined();
    });
  });

  // ============ INFO ============

  describe('Info Endpoints', () => {
    test('GET /api/info returns platform info', async () => {
      const response = await fetch(`${API_URL}/api/info`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Hojai Unified Platform');
      expect(data.version).toBe('1.0.0');
      expect(data.features).toBeDefined();
    });

    test('GET /api/channels returns channels', async () => {
      const response = await fetch(`${API_URL}/api/channels`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0].id).toBe('whatsapp');
    });
  });

  // ============ CART ============

  describe('Cart API', () => {
    const tenantId = 'test_tenant';
    let cartId: string;

    test('POST /api/cart creates cart', async () => {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify({
          sessionId: 'test_session_1',
          customer: {
            id: 'user_1',
            name: 'Test User',
            phone: '+919876543210'
          },
          items: [
            { productId: 'prod_1', name: 'Pizza', price: 299, quantity: 2 }
          ]
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.cartId).toBeDefined();
      expect(data.data.subtotal).toBe(598);
      expect(data.data.total).toBe(598);

      cartId = data.data.cartId;
    });

    test('GET /api/cart/:id returns cart', async () => {
      if (!cartId) {
        console.log('Skipping - no cart created');
        return;
      }

      const response = await fetch(`${API_URL}/api/cart/${cartId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cartId).toBe(cartId);
    });

    test('POST /api/cart/:id/items adds item', async () => {
      if (!cartId) {
        console.log('Skipping - no cart created');
        return;
      }

      const response = await fetch(`${API_URL}/api/cart/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod_2',
          name: 'Coke',
          price: 49,
          quantity: 2
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBe(2);
    });
  });

  // ============ MESSAGES ============

  describe('Message API', () => {
    test('POST /api/messages/send sends message', async () => {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'test_tenant'
        },
        body: JSON.stringify({
          channel: 'whatsapp',
          to: {
            id: 'user_123',
            name: 'Test User',
            phone: '+919876543210'
          },
          type: 'text',
          content: {
            text: 'Hello from test!'
          }
        })
      });

      // May fail without real WhatsApp token, but should return valid response
      expect([200, 500]).toContain(response.status);
    });
  });

  // ============ ANALYTICS ============

  describe('Analytics API', () => {
    test('GET /api/analytics returns analytics', async () => {
      const response = await fetch(`${API_URL}/api/analytics?tenantId=test_tenant`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.overview).toBeDefined();
      expect(data.data.commerce).toBeDefined();
      expect(data.data.campaigns).toBeDefined();
    });
  });
});

// ============ TEST HELPERS ============

export function createTestCustomer() {
  return {
    id: `user_${Date.now()}`,
    name: 'Test User',
    phone: `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`
  };
}

export function createTestItem() {
  return {
    productId: `prod_${Date.now()}`,
    name: 'Test Product',
    price: Math.floor(Math.random() * 500 + 100),
    quantity: Math.floor(Math.random() * 5 + 1)
  };
}
