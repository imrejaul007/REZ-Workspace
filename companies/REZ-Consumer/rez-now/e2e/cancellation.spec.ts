/**
 * E2E — Order cancellation modal on the order tracking page
 *
 * Covers:
 *  - "Cancel Order" button is visible when order status = 'confirmed'
 *  - "Cancel Order" button is NOT visible when status = 'preparing'
 *  - Clicking "Cancel Order" opens the CancelOrderModal
 *  - Modal shows reason radio options including "Changed my mind"
 *  - Selecting a reason and clicking "Yes, Cancel" calls the cancel API
 *  - On success the status badge changes to "Cancelled"
 *  - If the API returns 409 (too late) an error message is shown in the modal
 *
 * Auth strategy: inject fake zustand rez-auth session via page.addInitScript.
 * API mocking: page.route() is used for all backend calls.
 */

import { test, expect } from '@playwright/test';
import { mockStoreMenuApiResponse } from './fixtures/store';

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_NUMBER = 'WO-CANCEL-001';
const STORE_SLUG = 'test-cafe';

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

// DM-CRIT-01 FIX: Use backend canonical statuses.
// pending_payment → placed, completed → delivered (mirrored in normalizeWebOrderStatus).
type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

function buildOrderResponse(status: OrderStatus) {
  return {
    success: true,
    data: {
      id: 'ord-cancel-001',
      orderNumber: ORDER_NUMBER,
      status,
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
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: 'rez-auth', value: JSON.stringify(FAKE_AUTH_SESSION) }
  );
}

async function installBaseMocks(
  page: import('@playwright/test').Page,
  orderStatus: OrderStatus
) {
  // Store menu (needed by StoreLayout/StoreContextProvider)
  await page.route(`**/api/web-ordering/store/${STORE_SLUG}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStoreMenuApiResponse),
    });
  });

  // Wallet
  await page.route('**/api/wallet/balance', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { coins: 0, rupees: 0, tier: null } }),
    });
  });

  // Socket — block so polling runs
  await page.route('**/socket.io/**', (route) => { route.abort(); });

  // Analytics — absorb
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  // Loyalty — absorb
  await page.route('**/api/web-ordering/loyalty/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' });
  });

  // Coins credit — absorb
  await page.route('**/api/web-ordering/coins/credit', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { coinsEarned: 0 } }),
    });
  });

  // Order status
  await page.route(`**/api/web-ordering/order/${ORDER_NUMBER}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildOrderResponse(orderStatus)),
    });
  });
}

// ── Test suites ────────────────────────────────────────────────────────────────

test.describe('Order cancellation — button visibility', () => {
  test('"Cancel Order" button is visible when status is confirmed', async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'confirmed');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(
      page.getByRole('button', { name: /cancel order/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('"Cancel Order" button is visible when status is placed', async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'placed');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(
      page.getByRole('button', { name: /cancel order/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('"Cancel Order" button is NOT visible when status is preparing', async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'preparing');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    // Wait for page to finish loading (store name visible)
    await expect(page.getByText('Test Cafe')).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /cancel order/i })
    ).not.toBeVisible();
  });

  test('"Cancel Order" button is NOT visible when status is delivered', async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'delivered');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/all done/i)).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: /cancel order/i })
    ).not.toBeVisible();
  });
});

test.describe('Order cancellation — modal interaction', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'confirmed');
  });

  test('clicking "Cancel Order" opens the cancellation modal', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();

    // Modal title
    await expect(page.getByText('Cancel this order?')).toBeVisible({ timeout: 5000 });
  });

  test('modal shows cancellation reason options', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();

    await expect(page.getByText('Changed my mind')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Ordered by mistake')).toBeVisible();
    await expect(page.getByText('Taking too long')).toBeVisible();
    await expect(page.getByText('Other')).toBeVisible();
  });

  test('selecting "Changed my mind" and confirming calls the cancel API', async ({ page }) => {
    const capturedBodies: string[] = [];

    await page.route(`**/api/web-ordering/orders/${ORDER_NUMBER}/cancel`, (route) => {
      capturedBodies.push(route.request().postData() ?? '');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, refundInitiated: true }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    // Open modal
    await page.getByRole('button', { name: /cancel order/i }).click();
    await expect(page.getByText('Cancel this order?')).toBeVisible({ timeout: 5000 });

    // "Changed my mind" is already selected by default (first option)
    // Click confirm
    await page.getByRole('button', { name: /yes, cancel/i }).click();

    // API must have been called
    await expect.poll(() => capturedBodies.length, { timeout: 8000 }).toBeGreaterThan(0);
    const body = JSON.parse(capturedBodies[0]);
    expect(body.reason).toBe('Changed my mind');
  });

  test('after successful cancellation the status changes to "Cancelled"', async ({ page }) => {
    await page.route(`**/api/web-ordering/orders/${ORDER_NUMBER}/cancel`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, refundInitiated: false }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();
    await page.getByRole('button', { name: /yes, cancel/i }).click();

    // Order Cancelled heading should appear in the status card
    await expect(page.getByText(/order cancelled/i)).toBeVisible({ timeout: 8000 });
  });

  test('refund message shown when API indicates refundInitiated=true', async ({ page }) => {
    await page.route(`**/api/web-ordering/orders/${ORDER_NUMBER}/cancel`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, refundInitiated: true }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();
    await page.getByRole('button', { name: /yes, cancel/i }).click();

    // Refund text shown
    await expect(page.getByText(/refund will be credited/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Order cancellation — API error (too late)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installBaseMocks(page, 'confirmed');
  });

  test('409 response shows an error message inside the modal', async ({ page }) => {
    await page.route(`**/api/web-ordering/orders/${ORDER_NUMBER}/cancel`, (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: "Your order is already being prepared and can't be cancelled.",
        }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();
    await page.getByRole('button', { name: /yes, cancel/i }).click();

    // Error message appears in the modal (not a page-level banner)
    await expect(
      page.getByText(/already being prepared.*can't be cancelled/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('modal stays open after a 409 error', async ({ page }) => {
    await page.route(`**/api/web-ordering/orders/${ORDER_NUMBER}/cancel`, (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: "Your order is already being prepared and can't be cancelled.",
        }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();
    await page.getByRole('button', { name: /yes, cancel/i }).click();

    // Modal heading still visible (not dismissed)
    await expect(page.getByText('Cancel this order?')).toBeVisible({ timeout: 8000 });
  });

  test('"Keep Order" button closes the modal without cancelling', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await page.getByRole('button', { name: /cancel order/i }).click();
    await expect(page.getByText('Cancel this order?')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /keep order/i }).click();

    // Modal disappears and order status is still "confirmed"
    await expect(page.getByText('Cancel this order?')).not.toBeVisible();
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
  });
});
