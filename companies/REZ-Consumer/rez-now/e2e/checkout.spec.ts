/**
 * E2E — Checkout flow
 *
 * Covers:
 *  - Happy path: dine-in order, Razorpay invoked, order confirmation page loads
 *  - Coupon applied reduces the displayed total
 *  - Pay at Counter flow shows confirmation badge
 *
 * Auth strategy: zustand persists auth state to localStorage under the key
 * "rez-auth". We inject a fake logged-in session via page.addInitScript so
 * the checkout page never triggers the LoginModal redirect.
 *
 * Razorpay strategy: useRazorpay checks for window.Razorpay on mount. We
 * inject a mock constructor via addInitScript so the hook immediately sees
 * ready=true and calls our fake instead of loading the external script.
 */

import { test, expect } from '@playwright/test';
import {
  mockStoreMenuApiResponse,
  mockWalletBalance,
  mockCartValidationOk,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  mockStore,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  mockMenuItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  mockMenuItemNonVeg,
} from './fixtures/store';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A minimal fake auth session that matches AuthState persisted by zustand. */
const FAKE_AUTH_SESSION = {
  state: {
    user: { id: 'u-001', name: 'Test User', phone: '9999999999', role: 'user', isOnboarded: true },
    isLoggedIn: true,
  },
  version: 0,
};

/** A fake cart containing one Espresso (item-1, ₹150 = 15000 paise). */
const CART_ONE_ESPRESSO = {
  state: {
    storeSlug: 'test-cafe',
    tableNumber: null,
    items: [
      {
        itemId: 'item-1',
        name: 'Espresso',
        price: 15000,
        basePrice: 15000,
        quantity: 1,
        customizations: {},
        customizationTotal: 0,
        isVeg: true,
      },
    ],
    groupOrderId: null,
  },
  version: 0,
};

/** A fake cart containing Espresso + Chicken Sandwich (₹150 + ₹250 = ₹400 subtotal). */
const CART_TWO_ITEMS = {
  state: {
    storeSlug: 'test-cafe',
    tableNumber: null,
    items: [
      {
        itemId: 'item-1',
        name: 'Espresso',
        price: 15000,
        basePrice: 15000,
        quantity: 1,
        customizations: {},
        customizationTotal: 0,
        isVeg: true,
      },
      {
        itemId: 'item-2',
        name: 'Chicken Sandwich',
        price: 25000,
        basePrice: 25000,
        quantity: 1,
        customizations: {},
        customizationTotal: 0,
        isVeg: false,
      },
    ],
    groupOrderId: null,
  },
  version: 0,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Inject zustand localStorage state so tests start with a predictable session
 * and cart. Must be called before page.goto().
 */
async function injectLocalStorage(
  page: import('@playwright/test').Page,
  cart: typeof CART_ONE_ESPRESSO
) {
  await page.addInitScript(
    ({ authKey, authValue, cartKey, cartValue }: {
      authKey: string;
      authValue: string;
      cartKey: string;
      cartValue: string;
    }) => {
      localStorage.setItem(authKey, authValue);
      localStorage.setItem(cartKey, cartValue);
    },
    {
      authKey: 'rez-auth',
      authValue: JSON.stringify(FAKE_AUTH_SESSION),
      cartKey: 'rez-cart',
      cartValue: JSON.stringify(cart),
    }
  );
}

/**
 * Inject a mock window.Razorpay constructor.
 * The mock captures options (so tests can assert on them) and exposes a
 * window.__rzpLastOptions object. Calling rzp.open() is a no-op by default.
 * Tests can override window.__rzpTriggerSuccess = true to fire the handler.
 */
async function injectRazorpayMock(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.__rzpLastOptions = null;
    window.Razorpay = function (options: unknown) {
      (window as Record<string, unknown>).__rzpLastOptions = options;
      return {
        open() {
          // If the test has set __rzpTriggerSuccess, fire the success handler
          // immediately so the payment verify flow runs.
          const opts = options as {
            handler?: (r: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => void;
          };
          if ((window as Record<string, unknown>).__rzpTriggerSuccess && opts.handler) {
            opts.handler({
              razorpay_order_id: 'order_test123',
              razorpay_payment_id: 'pay_test456',
              razorpay_signature: 'sig_test789',
            });
          }
        },
        close() {},
      };
    } as unknown as typeof window.Razorpay;
  });
}

/** Install API mocks shared across all checkout tests. */
async function installCheckoutMocks(page: import('@playwright/test').Page) {
  // Menu store endpoint
  await page.route('**/api/web-ordering/store/test-cafe', (route) => {
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
      body: JSON.stringify(mockWalletBalance),
    });
  });

  // Cart validation — no unavailable items
  await page.route('**/api/web-ordering/cart/validate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCartValidationOk),
    });
  });

  // Analytics events — absorb silently
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  // Socket.IO long-poll — block so polling falls back gracefully
  await page.route('**/socket.io/**', (route) => {
    route.abort();
  });

  // Loyalty / stamps — absorb
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

  // Push subscription VAPID key — absorb
  await page.route('**/api/push/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' });
  });
}

// ── Test suites ───────────────────────────────────────────────────────────────

test.describe('Checkout — happy path (dine-in, Razorpay)', () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalStorage(page, CART_TWO_ITEMS);
    await injectRazorpayMock(page);
    await installCheckoutMocks(page);
  });

  test('checkout page shows Bill Summary with correct subtotal', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    // Bill Summary heading
    await expect(page.getByText('Bill Summary')).toBeVisible();

    // Subtotal: ₹150 + ₹250 = ₹400
    // formatINR(40000) = "₹400"
    await expect(page.getByText('₹400')).toBeVisible();
  });

  test('checkout page lists items from the cart', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await expect(page.getByText(/Espresso/)).toBeVisible();
    await expect(page.getByText(/Chicken Sandwich/)).toBeVisible();
  });

  test('checkout page shows GST line for GST-enabled store', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    // Store has gstEnabled=true, gstPercent=5
    // GST on ₹400 = ₹20 → formatINR(2000) = "₹20"
    await expect(page.getByText(/GST \(5%\)/)).toBeVisible();
    await expect(page.getByText('₹20')).toBeVisible();
  });

  test('checkout page renders Pay with Razorpay button', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await expect(page.getByText('Pay with Razorpay')).toBeVisible();
    // The button label includes the total (₹420 after GST)
    await expect(page.getByRole('button', { name: /Pay ₹/i }).first()).toBeVisible();
  });

  test('tapping Pay with Razorpay invokes the Razorpay constructor', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    // Mock the Razorpay order creation endpoint
    await page.route('**/api/web-ordering/razorpay/create-order', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            razorpayOrderId: 'order_test123',
            amount: 42000, // ₹420 in paise
            currency: 'INR',
            keyId: 'rzp_test_key',
            orderNumber: 'WO-TEST-001',
          },
        }),
      });
    });

    // Click the primary Razorpay pay button
    await page.getByRole('button', { name: /Pay ₹/i }).first().click();

    // Verify our mock Razorpay constructor was invoked
    const rzpOptions = await page.evaluate(() => (window as Record<string, unknown>).__rzpLastOptions);
    expect(rzpOptions).not.toBeNull();
    expect((rzpOptions as { order_id: string }).order_id).toBe('order_test123');
  });

  test('after Razorpay success the order confirmation page loads with order number', async ({ page }) => {
    const ORDER_NUMBER = 'WO-TEST-001';

    // Trigger automatic Razorpay success callback
    await page.addInitScript(() => {
      (window as Record<string, unknown>).__rzpTriggerSuccess = true;
    });

    // Create order endpoint
    await page.route('**/api/web-ordering/razorpay/create-order', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            razorpayOrderId: 'order_test123',
            amount: 42000,
            currency: 'INR',
            keyId: 'rzp_test_key',
            orderNumber: ORDER_NUMBER,
          },
        }),
      });
    });

    // Payment verify endpoint
    await page.route('**/api/web-ordering/payment/verify', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { verified: true } }),
      });
    });

    // Order status — confirmed
    await page.route(`**/api/web-ordering/order/${ORDER_NUMBER}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'ord-001',
            orderNumber: ORDER_NUMBER,
            status: 'confirmed',
            items: [
              { name: 'Espresso', quantity: 1, price: 15000 },
              { name: 'Chicken Sandwich', quantity: 1, price: 25000 },
            ],
            subtotal: 40000,
            gst: 2000,
            tip: 0,
            donation: 0,
            discount: 0,
            total: 42000,
            customerPhone: '9999999999',
            tableNumber: null,
            storeSlug: 'test-cafe',
            storeName: 'Test Cafe',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/test-cafe/checkout');

    // Trigger Razorpay
    await page.getByRole('button', { name: /Pay ₹/i }).first().click();

    // Should navigate to the order confirmation page
    await page.waitForURL(`**/test-cafe/order/${ORDER_NUMBER}`, { timeout: 15000 });

    // Order number is shown in the page header
    await expect(page.getByText(`Order #${ORDER_NUMBER}`)).toBeVisible();
  });
});

test.describe('Checkout — coupon applied reduces total', () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalStorage(page, CART_TWO_ITEMS);
    await injectRazorpayMock(page);
    await installCheckoutMocks(page);
  });

  test('applying coupon SAVE50 on cart page shows discount line and reduced total', async ({ page }) => {
    // Mock the coupon validate endpoint — flat ₹50 discount (5000 paise)
    await page.route('**/api/web-ordering/coupon/validate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          couponCode: 'SAVE50',
          discountType: 'flat',
          discountValue: 5000,
          discountAmount: 5000,
        }),
      });
    });

    // Also absorb available-coupons request from the OffersModal
    await page.route('**/api/web-ordering/store/test-cafe/coupons', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/test-cafe/cart');

    // Wait for cart to render
    await expect(page.getByText('Espresso')).toBeVisible();

    // Type coupon code into the input
    await page.getByLabel('Coupon code').fill('SAVE50');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Discount line appears — "You save ₹50"
    await expect(page.getByText(/You save ₹50/i)).toBeVisible({ timeout: 8000 });
  });

  test('coupon discount line shows the correct discount amount', async ({ page }) => {
    await page.route('**/api/web-ordering/coupon/validate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          couponCode: 'SAVE50',
          discountType: 'flat',
          discountValue: 5000,
          discountAmount: 5000,
        }),
      });
    });

    await page.route('**/api/web-ordering/store/test-cafe/coupons', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' });
    });

    await page.goto('/test-cafe/cart');
    await expect(page.getByText('Espresso')).toBeVisible();

    await page.getByLabel('Coupon code').fill('SAVE50');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Applied coupon badge shows the code
    await expect(page.getByText('SAVE50')).toBeVisible({ timeout: 8000 });

    // Bill summary discount line: "−₹50"
    await expect(page.getByText(/−₹50/)).toBeVisible();
  });

  test('total is reduced after coupon is applied', async ({ page }) => {
    await page.route('**/api/web-ordering/coupon/validate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          couponCode: 'SAVE50',
          discountType: 'flat',
          discountValue: 5000,
          discountAmount: 5000,
        }),
      });
    });

    await page.route('**/api/web-ordering/store/test-cafe/coupons', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' });
    });

    await page.goto('/test-cafe/cart');
    await expect(page.getByText('Espresso')).toBeVisible();

    // Before coupon: subtotal ₹400 + GST ₹20 = ₹420
    // After coupon SAVE50 (flat ₹50 off): total = ₹400 + ₹20 - ₹50 = ₹370
    await page.getByLabel('Coupon code').fill('SAVE50');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('SAVE50')).toBeVisible({ timeout: 8000 });

    // The checkout CTA button shows the new total
    await expect(page.getByRole('button', { name: /Proceed to Checkout.*₹370/i })).toBeVisible();
  });
});

test.describe('Checkout — Pay at Counter flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalStorage(page, CART_ONE_ESPRESSO);
    await injectRazorpayMock(page);
    await installCheckoutMocks(page);
  });

  test('Pay at Counter button is visible on checkout page', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await expect(page.getByText('Pay at the counter')).toBeVisible();
    await expect(page.getByRole('button', { name: /Place order · Pay later/i })).toBeVisible();
  });

  test('tapping Place order · Pay later shows pay-at-counter confirmation badge', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await page.getByRole('button', { name: /Place order · Pay later/i }).click();

    // Confirmation message appears
    await expect(
      page.getByText('Your order has been placed. Please pay at the counter when collecting.')
    ).toBeVisible();
  });

  test('payment options are hidden after Pay at Counter is selected', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await page.getByRole('button', { name: /Place order · Pay later/i }).click();

    // The "Choose payment method" heading should no longer be visible
    await expect(page.getByText('Choose payment method')).not.toBeVisible();
  });

  test('split bill button is hidden after Pay at Counter is selected', async ({ page }) => {
    await page.goto('/test-cafe/checkout');

    await page.getByRole('button', { name: /Place order · Pay later/i }).click();

    await expect(page.getByRole('button', { name: /Split bill/i })).not.toBeVisible();
  });
});

test.describe('Checkout — unauthenticated guard', () => {
  test('direct navigation to checkout opens LoginModal when not logged in', async ({ page }) => {
    // No auth injection — default state is logged out
    await installCheckoutMocks(page);

    await page.goto('/test-cafe/checkout');

    // LoginModal triggered by the useEffect guard
    await expect(page.getByText('Login to continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
  });
});
