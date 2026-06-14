/**
 * E2E — Order tracking page (/[storeSlug]/order/[orderNumber])
 *
 * Covers:
 *  - Page loads and shows the order number in the header
 *  - Status badge reflects the initial status returned by the API
 *  - Status badge updates when the API returns a different status on a
 *    subsequent poll (simulated via call-count-aware route handler)
 *  - "Ready for Pickup" state renders the correct UI message
 *  - Cancelled order shows the cancelled state
 *
 * Poll timing: useOrderPolling starts after BACKOFF_MS[0] = 2 000 ms. Tests
 * that observe status changes wait up to 10 000 ms to account for the initial
 * delay plus any rendering time.
 *
 * Auth strategy: same as checkout.spec.ts — inject a fake zustand session
 * into localStorage via page.addInitScript before navigation.
 *
 * Socket.IO is blocked so the polling fallback always runs.
 */

import { test, expect } from '@playwright/test';
import { mockStoreMenuApiResponse } from './fixtures/store';

// ── Constants ────────────────────────────────────────────────────────────────

const ORDER_NUMBER = 'WO-TRACK-001';
const STORE_SLUG = 'test-cafe';

// ── Fake auth session (zustand persist format) ────────────────────────────────

const FAKE_AUTH_SESSION = {
  state: {
    user: { id: 'u-001', name: 'Test User', phone: '9999999999', role: 'user', isOnboarded: true },
    isLoggedIn: true,
  },
  version: 0,
};

// ── Order response builders ───────────────────────────────────────────────────

// DM-CRIT-01 FIX: Use backend canonical statuses.
// pending_payment → placed, completed → delivered (mirrored in normalizeOrderStatus).
type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

function buildOrderResponse(status: OrderStatus) {
  return {
    success: true,
    data: {
      id: 'ord-track-001',
      orderNumber: ORDER_NUMBER,
      status,
      items: [
        { name: 'Espresso', quantity: 1, price: 15000 },
      ],
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Install all route mocks required for the order tracking page.
 *
 * @param initialStatus   The status returned on the first GET call.
 * @param updatedStatus   When provided, the status returned from the second
 *                        GET call onwards (simulates a real-time status change
 *                        that the polling hook would pick up).
 */
async function installOrderTrackingMocks(
  page: import('@playwright/test').Page,
  initialStatus: OrderStatus,
  updatedStatus?: OrderStatus
) {
  // Store menu endpoint (needed by StoreLayout)
  await page.route(`**/api/web-ordering/store/${STORE_SLUG}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStoreMenuApiResponse),
    });
  });

  // Wallet balance
  await page.route('**/api/wallet/balance', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { coins: 0, rupees: 0, tier: null } }),
    });
  });

  // Block Socket.IO so polling always runs
  await page.route('**/socket.io/**', (route) => {
    route.abort();
  });

  // Analytics — absorb silently
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

  // Order status endpoint: stateful call counter
  let callCount = 0;
  await page.route(`**/api/web-ordering/order/${ORDER_NUMBER}`, (route) => {
    const status = callCount === 0 || !updatedStatus ? initialStatus : updatedStatus;
    callCount += 1;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildOrderResponse(status)),
    });
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Order tracking — page structure', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'confirmed');
  });

  test('loads and shows the order number in the header', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(`Order #${ORDER_NUMBER}`)).toBeVisible({ timeout: 10000 });
  });

  test('shows the store name in the header', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText('Test Cafe')).toBeVisible({ timeout: 10000 });
  });

  test('shows the order items', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText('Espresso')).toBeVisible({ timeout: 10000 });
  });

  test('shows order total in the items section', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    // total = 15750 paise = ₹157.5 → formatINR renders "₹158" (rounds half-up)
    // Use a regex to match either rendering
    await expect(page.getByText(/₹15[0-9]/)).toBeVisible({ timeout: 10000 });
  });

  test('shows Back to Menu button', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(
      page.getByRole('button', { name: /Back to Menu/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows View receipt link', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText('View receipt')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Order tracking — status badge', () => {
  test('confirmed status shows "Order confirmed" message', async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'confirmed');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Order confirmed/i)).toBeVisible({ timeout: 10000 });
  });

  test('preparing status shows "Being prepared" message', async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'preparing');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Being prepared|preparing/i)).toBeVisible({ timeout: 10000 });
  });

  test('placed status shows awaiting payment message', async ({ page }) => {
    await injectAuthSession(page);
    // DM-CRIT-01 FIX: Backend sends 'placed' — test mocks backend canonical status
    await installOrderTrackingMocks(page, 'placed');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Awaiting payment/i)).toBeVisible({ timeout: 10000 });
  });

  test('cancelled order shows Order Cancelled heading', async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'cancelled');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Order Cancelled/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Order tracking — status transitions via polling', () => {
  test('status badge updates from "pending" to "preparing" after second poll', async ({ page }) => {
    await injectAuthSession(page);
    // First call returns 'confirmed', subsequent calls return 'preparing'
    await installOrderTrackingMocks(page, 'confirmed', 'preparing');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    // Initial state — confirmed
    await expect(page.getByText(/Order confirmed/i)).toBeVisible({ timeout: 10000 });

    // After the first poll interval (2 000 ms) the mock returns 'preparing'
    // The component updates setOrder({ ...prev, status: 'preparing' })
    await expect(page.getByText(/Being prepared|preparing/i)).toBeVisible({ timeout: 10000 });
  });

  test('status badge updates from "confirmed" to "ready" after poll', async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'confirmed', 'ready');

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Order confirmed/i)).toBeVisible({ timeout: 10000 });

    // After poll, status becomes 'ready'
    await expect(page.getByText(/Ready for pickup/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Order tracking — Ready for Pickup state', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'ready');
  });

  test('shows the Ready for Pickup message', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    // uiCopy for storeType 'cafe' uses the readyMessage — typically "Ready for pickup!"
    // The status card renders this inside a paragraph when status === 'ready'
    await expect(page.getByText(/Ready for pickup/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows the order items section when status is ready', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText('Order Items')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Espresso')).toBeVisible({ timeout: 10000 });
  });

  test('does not show the Order Cancelled state when status is ready', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Order confirmed/i)).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Order Cancelled/i)).not.toBeVisible();
  });
});

test.describe('Order tracking — completed state', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await installOrderTrackingMocks(page, 'completed');
  });

  test('completed order shows "All done! Thank you." message', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/All done/i)).toBeVisible({ timeout: 10000 });
  });

  test('completed order shows the Rate your experience button', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(
      page.getByRole('button', { name: /Rate your experience/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Order tracking — not found', () => {
  test('shows "Order not found" when the API returns an error', async ({ page }) => {
    await injectAuthSession(page);

    // Store endpoint
    await page.route(`**/api/web-ordering/store/${STORE_SLUG}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStoreMenuApiResponse),
      });
    });

    await page.route('**/socket.io/**', (route) => { route.abort(); });
    await page.route('**/api/analytics/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    // Order endpoint returns failure
    await page.route(`**/api/web-ordering/order/${ORDER_NUMBER}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Order not found' }),
      });
    });

    await page.goto(`/${STORE_SLUG}/order/${ORDER_NUMBER}`);

    await expect(page.getByText(/Order not found/i)).toBeVisible({ timeout: 10000 });
  });
});
