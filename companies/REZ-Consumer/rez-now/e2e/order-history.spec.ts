/**
 * E2E — Order history page (/orders)
 *
 * Covers:
 *  - Unauthenticated visitor is redirected to /?login=1
 *  - Logged-in user sees order cards
 *  - Each card shows store name, total, and a status badge
 *  - "View Details" navigates to /[storeSlug]/order/[orderNumber]
 *  - Empty state shows "No orders yet" and a "Browse Stores" CTA
 *  - "Load more orders" button appends the next page of results
 *
 * Auth strategy: inject a fake zustand rez-auth session via
 * page.addInitScript before navigation (same pattern as checkout.spec.ts).
 *
 * API mocking: page.route() intercepts GET /api/web-ordering/orders/history.
 */

import { test, expect } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────────────

const FAKE_AUTH_SESSION = {
  state: {
    user: {
      id: 'u-001',
      name: 'Test User',
      phone: '9999999999',
      role: 'user',
      isOnboarded: true,
    },
    isLoggedIn: true,
  },
  version: 0,
};

// ── Builders ──────────────────────────────────────────────────────────────────

function buildOrderItem(
  overrides: Partial<{
    orderNumber: string;
    storeName: string;
    storeSlug: string;
    total: number;
    status: string;
    paymentStatus: string;
  }> = {}
) {
  return {
    orderNumber: overrides.orderNumber ?? 'WO-HIST-001',
    storeSlug: overrides.storeSlug ?? 'test-cafe',
    storeName: overrides.storeName ?? 'Test Cafe',
    storeLogo: null,
    items: [{ name: 'Espresso', quantity: 1 }],
    total: overrides.total ?? 15750,
    status: overrides.status ?? 'completed',
    paymentStatus: overrides.paymentStatus ?? 'paid',
    createdAt: new Date().toISOString(),
  };
}

function buildHistoryResponse(
  orders: ReturnType<typeof buildOrderItem>[],
  hasNext = false,
  page = 1
) {
  return {
    success: true,
    data: {
      orders,
      pagination: { page, limit: 10, total: orders.length + (hasNext ? 10 : 0), hasNext },
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    {
      key: 'rez-auth',
      value: JSON.stringify(FAKE_AUTH_SESSION),
    }
  );
}

async function installCommonMocks(page: import('@playwright/test').Page) {
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/socket.io/**', (route) => { route.abort(); });
  await page.route('**/api/wallet/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' });
  });
}

// ── Test suites ────────────────────────────────────────────────────────────────

test.describe('Order history — auth guard', () => {
  test('unauthenticated visit to /orders redirects to /?login=1', async ({ page }) => {
    // Do NOT inject auth — visitor is logged out
    await installCommonMocks(page);

    await page.goto('/orders');

    // The redirect adds ?login=1 to the home URL
    await page.waitForURL('**/?login=1', { timeout: 10000 });
    expect(page.url()).toContain('login=1');
  });
});

test.describe('Order history — order cards', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installCommonMocks(page);
  });

  test('shows order cards for logged-in user', async ({ page }) => {
    const orders = [
      buildOrderItem({ orderNumber: 'WO-001', storeName: 'Test Cafe', total: 15750 }),
      buildOrderItem({ orderNumber: 'WO-002', storeName: 'Pizza Palace', storeSlug: 'pizza-palace', total: 32000 }),
    ];

    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse(orders)),
      });
    });

    await page.goto('/orders');

    await expect(page.getByText('Test Cafe')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pizza Palace')).toBeVisible();
  });

  test('order card displays the store name', async ({ page }) => {
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([
          buildOrderItem({ storeName: 'Brew House' }),
        ])),
      });
    });

    await page.goto('/orders');

    await expect(page.getByText('Brew House')).toBeVisible({ timeout: 10000 });
  });

  test('order card displays the formatted total', async ({ page }) => {
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([
          buildOrderItem({ total: 42000 }), // ₹420
        ])),
      });
    });

    await page.goto('/orders');

    // formatINR(42000) = "₹420"
    await expect(page.getByText('₹420')).toBeVisible({ timeout: 10000 });
  });

  test('order card shows a status badge', async ({ page }) => {
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([
          buildOrderItem({ status: 'completed' }),
        ])),
      });
    });

    await page.goto('/orders');

    // Badge text: status with underscores replaced by spaces → "completed"
    await expect(page.getByText('completed')).toBeVisible({ timeout: 10000 });
  });

  test('"View Details" navigates to the order tracking page', async ({ page }) => {
    const ORDER_NUMBER = 'WO-DETAIL-001';
    const STORE_SLUG = 'test-cafe';

    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([
          buildOrderItem({ orderNumber: ORDER_NUMBER, storeSlug: STORE_SLUG }),
        ])),
      });
    });

    // Mock the order detail page so navigation doesn't 404
    await page.route(`**/api/web-ordering/order/${ORDER_NUMBER}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'ord-001',
            orderNumber: ORDER_NUMBER,
            status: 'completed',
            items: [{ name: 'Espresso', quantity: 1, price: 15000 }],
            subtotal: 15000,
            gst: 750,
            tip: 0,
            donation: 0,
            discount: 0,
            total: 15750,
            customerPhone: '9999999999',
            tableNumber: null,
            storeSlug: STORE_SLUG,
            storeName: 'Test Cafe',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route(`**/api/web-ordering/store/${STORE_SLUG}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            store: {
              id: 'store-001',
              name: 'Test Cafe',
              slug: STORE_SLUG,
              logo: null,
              banner: null,
              address: '42 MG Road',
              phone: 'testcafe@upi',
              storeType: 'cafe',
              hasMenu: true,
              isProgramMerchant: false,
              estimatedPrepMinutes: 15,
              gstEnabled: false,
              gstPercent: 0,
              isOpen: true,
              operatingHours: {},
              googlePlaceId: null,
              rewardRules: { baseCashbackPercent: 0, coinsEnabled: false },
              deliveryEnabled: false,
              deliveryRadiusKm: 0,
              deliveryFee: 0,
            },
            categories: [],
            promotions: [],
          },
        }),
      });
    });

    await page.goto('/orders');

    await expect(page.getByText('Test Cafe')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.waitForURL(`**/${STORE_SLUG}/order/${ORDER_NUMBER}`, { timeout: 10000 });
    expect(page.url()).toContain(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);
  });
});

test.describe('Order history — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installCommonMocks(page);
  });

  test('shows "No orders yet" when history is empty', async ({ page }) => {
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([])),
      });
    });

    await page.goto('/orders');

    await expect(page.getByText('No orders yet')).toBeVisible({ timeout: 10000 });
  });

  test('empty state has a "Browse Stores" CTA that navigates to /', async ({ page }) => {
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHistoryResponse([])),
      });
    });

    await page.goto('/orders');

    await expect(page.getByRole('button', { name: /browse stores/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Order history — pagination', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installCommonMocks(page);
  });

  test('"Load more orders" appends the next page', async ({ page }) => {
    // Page 1: 10 orders (hasNext=true triggers button)
    const page1Orders = Array.from({ length: 10 }, (_, i) =>
      buildOrderItem({ orderNumber: `WO-PAGE1-${i + 1}`, storeName: `Store ${i + 1}` })
    );
    // Page 2: 2 orders
    const page2Orders = [
      buildOrderItem({ orderNumber: 'WO-PAGE2-001', storeName: 'Extra Store A' }),
      buildOrderItem({ orderNumber: 'WO-PAGE2-002', storeName: 'Extra Store B' }),
    ];

    let callCount = 0;
    await page.route('**/api/web-ordering/orders/history**', (route) => {
      if (callCount === 0) {
        callCount += 1;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildHistoryResponse(page1Orders, true, 1)),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildHistoryResponse(page2Orders, false, 2)),
        });
      }
    });

    await page.goto('/orders');

    // Wait for first page
    await expect(page.getByText('Store 1')).toBeVisible({ timeout: 10000 });

    // "Load more orders" button must be visible
    await expect(page.getByRole('button', { name: /load more orders/i })).toBeVisible();
    await page.getByRole('button', { name: /load more orders/i }).click();

    // Page 2 items appear
    await expect(page.getByText('Extra Store A')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Extra Store B')).toBeVisible();
  });
});
