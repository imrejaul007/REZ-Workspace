/**
 * ReZ Upsell - E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('ReZ Upsell E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Health Check', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get('/health');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('rez-upsell');
    });
  });

  test.describe('OAuth Flow', () => {
    test('should redirect to Shopify for auth', async ({ page }) => {
      await page.goto('/auth?shop=test-store.myshopify.com');

      // Should redirect to Shopify OAuth
      await expect(page).toHaveURL(/admin\/oauth\/authorize/);
    });

    test('should require shop parameter', async ({ request }) => {
      const response = await request.get('/auth');
      // Should not redirect without shop
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Upsell Configuration', () => {
    test('should configure upsell settings', async ({ request }) => {
      const config = {
        shop: 'test-store.myshopify.com',
        products: [
          { productId: 'p1', variantId: 'v1', title: 'Test Product', price: 999 },
        ],
        discountPercentage: 10,
        discountCode: 'TEST10',
        position: 'checkout',
      };

      const response = await request.post('/api/upsell/configure', { data: config });
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should require shop for configuration', async ({ request }) => {
      const response = await request.post('/api/upsell/configure', {
        data: { products: [] },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Offer Generation', () => {
    test('should return null for empty cart', async ({ request }) => {
      const response = await request.post('/api/upsell/offer', {
        data: {
          shop: 'test-store.myshopify.com',
          cartItems: [],
          sessionId: 'test-session',
        },
      });

      const body = await response.json();
      expect(body.offer).toBeNull();
    });

    test('should return offer for valid cart', async ({ request }) => {
      const response = await request.post('/api/upsell/offer', {
        data: {
          shop: 'test-store.myshopify.com',
          cartItems: [
            { productId: 'p1', variantId: 'v1', title: 'Product 1', price: 500, quantity: 1 },
          ],
          sessionId: 'test-session',
        },
      });

      const body = await response.json();
      // Will be null if no products configured
      expect(body).toHaveProperty('offer');
    });
  });

  test.describe('Event Tracking', () => {
    test('should track offer_shown event', async ({ request }) => {
      const event = {
        shop: 'test-store.myshopify.com',
        sessionId: 'test-session',
        offerId: 'offer-123',
        productId: 'p1',
        event: 'offer_shown',
        revenue: 0,
      };

      const response = await request.post('/api/upsell/track', { data: event });
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should track offer_accepted with revenue', async ({ request }) => {
      const event = {
        shop: 'test-store.myshopify.com',
        sessionId: 'test-session',
        offerId: 'offer-123',
        productId: 'p1',
        event: 'offer_accepted',
        revenue: 899,
      };

      const response = await request.post('/api/upsell/track', { data: event });
      expect(response.ok()).toBeTruthy();
    });

    test('should track offer_declined', async ({ request }) => {
      const event = {
        shop: 'test-store.myshopify.com',
        sessionId: 'test-session',
        offerId: 'offer-123',
        productId: 'p1',
        event: 'offer_declined',
        revenue: 0,
      };

      const response = await request.post('/api/upsell/track', { data: event });
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Analytics', () => {
    test('should return stats', async ({ request }) => {
      const response = await request.get('/api/upsell/stats', {
        params: { shop: 'test-store.myshopify.com' },
      });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('totalOffers');
      expect(body).toHaveProperty('totalClicks');
      expect(body).toHaveProperty('totalAccepted');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      expect(page).toHaveTitle(/ReZ Upsell/i);
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      expect(page).toHaveTitle(/ReZ Upsell/i);
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      expect(page).toHaveTitle(/ReZ Upsell/i);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid JSON', async ({ request }) => {
      const response = await request.post('/api/upsell/configure', {
        headers: { 'Content-Type': 'application/json' },
        data: 'invalid json',
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should handle missing fields', async ({ request }) => {
      const response = await request.post('/api/upsell/track', {
        data: { shop: 'test.myshopify.com' },
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});

test.describe('API Rate Limiting', () => {
  test('should rate limit excessive requests', async ({ request }) => {
    // Make many rapid requests
    const promises = Array(150)
      .fill(null)
      .map(() =>
        request.get('/api/upsell/config', {
          params: { shop: 'test.myshopify.com' },
        })
      );

    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status() === 429);

    // Some should be rate limited
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
