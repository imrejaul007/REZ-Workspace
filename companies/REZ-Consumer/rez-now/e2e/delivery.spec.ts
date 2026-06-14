/**
 * E2E — Delivery mode in the checkout page
 *
 * Covers:
 *  - Store with deliveryEnabled=true shows a "Delivery" button in Order Type
 *  - Store with deliveryEnabled=false does NOT show the "Delivery" button
 *  - Selecting "Delivery" renders the address form
 *  - Address form includes a "Use My Location" button
 *  - Zone check returning deliverable=false shows "Outside delivery zone" banner
 *  - Zone check returning deliverable=true with fee=40 shows "Delivery fee ₹40"
 *  - Delivery fee is included in the bill total
 *
 * Auth: fake zustand rez-auth session injected via page.addInitScript.
 * API mocking: page.route() for all backend calls including
 *   GET /api/web-ordering/store/:slug (returns store with delivery fields)
 *   POST /api/web-ordering/delivery/check (zone check)
 *
 * Geolocation: mocked via Playwright's browser context geolocation so
 * "Use My Location" triggers a real-looking coordinates callback without GPS.
 */

import { test, expect } from '@playwright/test';
import { mockCategories } from './fixtures/store';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_SLUG_DELIVERY = 'delivery-cafe';
const STORE_SLUG_NO_DELIVERY = 'no-delivery-cafe';

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

/** Cart with one item — enough to keep checkout page alive (it redirects away when empty). */
const CART_WITH_ITEM = {
  state: {
    storeSlug: STORE_SLUG_DELIVERY,
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

const CART_NO_DELIVERY = {
  ...CART_WITH_ITEM,
  state: { ...CART_WITH_ITEM.state, storeSlug: STORE_SLUG_NO_DELIVERY },
};

// ── Store builders ────────────────────────────────────────────────────────────

function buildStoreResponse(slug: string, deliveryEnabled: boolean, deliveryFee = 0) {
  return {
    success: true,
    data: {
      store: {
        id: 'store-del-001',
        name: 'Delivery Cafe',
        slug,
        logo: null,
        banner: null,
        address: '10 MG Road, Bengaluru',
        phone: 'delivery@upi',
        storeType: 'cafe',
        hasMenu: true,
        isProgramMerchant: false,
        estimatedPrepMinutes: 20,
        gstEnabled: false,
        gstPercent: 0,
        isOpen: true,
        operatingHours: {},
        googlePlaceId: null,
        rewardRules: { baseCashbackPercent: 0, coinsEnabled: false },
        deliveryEnabled,
        deliveryRadiusKm: deliveryEnabled ? 5 : 0,
        deliveryFee,
        activePromos: [],
      },
      categories: mockCategories,
      promotions: [],
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectLocalStorage(
  page: import('@playwright/test').Page,
  cartSlug: string,
  cart: typeof CART_WITH_ITEM
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
      cartValue: JSON.stringify({ ...cart, state: { ...cart.state, storeSlug: cartSlug } }),
    }
  );
}

async function installCommonMocks(page: import('@playwright/test').Page) {
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/socket.io/**', (route) => { route.abort(); });
  await page.route('**/api/wallet/balance', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { coins: 0, rupees: 0, tier: null } }),
    });
  });
  await page.route('**/api/web-ordering/cart/validate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { unavailableItems: [] } }),
    });
  });
  await page.route('**/api/push/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' });
  });
  await page.route('**/api/web-ordering/loyalty/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' });
  });
  await page.route('**/api/web-ordering/store/*/coupons', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

// ── Test suites ────────────────────────────────────────────────────────────────

test.describe('Delivery — button visibility', () => {
  test('store with deliveryEnabled=true shows the "Delivery" button', async ({ page }) => {
    await injectLocalStorage(page, STORE_SLUG_DELIVERY, CART_WITH_ITEM);
    await installCommonMocks(page);

    await page.route(`**/api/web-ordering/store/${STORE_SLUG_DELIVERY}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStoreResponse(STORE_SLUG_DELIVERY, true, 4000)),
      });
    });

    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);

    await expect(
      page.getByRole('button', { name: /^delivery$/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('store with deliveryEnabled=false does NOT show the "Delivery" button', async ({ page }) => {
    await injectLocalStorage(page, STORE_SLUG_NO_DELIVERY, CART_NO_DELIVERY);
    await installCommonMocks(page);

    await page.route(`**/api/web-ordering/store/${STORE_SLUG_NO_DELIVERY}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStoreResponse(STORE_SLUG_NO_DELIVERY, false, 0)),
      });
    });

    await page.goto(`/${STORE_SLUG_NO_DELIVERY}/checkout`);

    // Wait for page to load (Espresso cart item visible)
    await expect(page.getByText('Espresso')).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /^delivery$/i })
    ).not.toBeVisible();
  });
});

test.describe('Delivery — address form', () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalStorage(page, STORE_SLUG_DELIVERY, CART_WITH_ITEM);
    await installCommonMocks(page);

    await page.route(`**/api/web-ordering/store/${STORE_SLUG_DELIVERY}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStoreResponse(STORE_SLUG_DELIVERY, true, 4000)),
      });
    });
  });

  test('selecting "Delivery" reveals the address form', async ({ page }) => {
    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);

    await page.getByRole('button', { name: /^delivery$/i }).click();

    // Address form fields appear
    await expect(page.locator('#delivery-line1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#delivery-city')).toBeVisible();
    await expect(page.locator('#delivery-pincode')).toBeVisible();
  });

  test('"Use My Location" button is visible inside the address form', async ({ page }) => {
    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);

    await page.getByRole('button', { name: /^delivery$/i }).click();

    await expect(
      page.getByRole('button', { name: /use my location/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('filling address fields is reflected in the inputs', async ({ page }) => {
    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);

    await page.getByRole('button', { name: /^delivery$/i }).click();

    await page.locator('#delivery-line1').fill('42 MG Road');
    await page.locator('#delivery-city').fill('Bengaluru');
    await page.locator('#delivery-pincode').fill('560001');

    await expect(page.locator('#delivery-line1')).toHaveValue('42 MG Road');
    await expect(page.locator('#delivery-city')).toHaveValue('Bengaluru');
    await expect(page.locator('#delivery-pincode')).toHaveValue('560001');
  });
});

test.describe('Delivery — zone check', () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalStorage(page, STORE_SLUG_DELIVERY, CART_WITH_ITEM);
    await installCommonMocks(page);

    await page.route(`**/api/web-ordering/store/${STORE_SLUG_DELIVERY}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStoreResponse(STORE_SLUG_DELIVERY, true, 4000)),
      });
    });
  });

  test('zone check returning deliverable=false shows outside-zone message', async ({ page }) => {
    // Mock checkDelivery to return not deliverable
    await page.route('**/api/web-ordering/delivery/check**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            deliverable: false,
            message: "Sorry, we don't deliver to your area",
            distanceKm: 12,
            fee: 0,
          },
        }),
      });
    });

    // Grant geolocation permission and provide a mock position
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 12.9, longitude: 77.5 });

    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);
    await page.getByRole('button', { name: /^delivery$/i }).click();
    await page.getByRole('button', { name: /use my location/i }).click();

    // Outside zone error message
    await expect(
      page.getByText(/sorry.*don't deliver to your area/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('zone check returning deliverable=true with fee=40 shows "Delivery fee ₹40"', async ({ page }) => {
    // Delivery fee is 4000 paise = ₹40
    await page.route('**/api/web-ordering/delivery/check**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            deliverable: true,
            distanceKm: 2.3,
            fee: 4000,
            message: null,
          },
        }),
      });
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);
    await page.getByRole('button', { name: /^delivery$/i }).click();
    await page.getByRole('button', { name: /use my location/i }).click();

    // Bill summary shows delivery fee line
    await expect(
      page.getByText(/delivery fee/i)
    ).toBeVisible({ timeout: 10000 });

    // formatINR(4000) = "₹40"
    // The bill row shows "Delivery fee" + "₹40"
    const billSection = page.getByText('Bill Summary').locator('..');
    await expect(billSection.getByText('₹40')).toBeVisible({ timeout: 5000 });
  });

  test('delivery fee is included in the bill total', async ({ page }) => {
    // Subtotal = ₹150 (Espresso). Delivery fee = ₹40. No GST. Total = ₹190.
    await page.route('**/api/web-ordering/delivery/check**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            deliverable: true,
            distanceKm: 1.5,
            fee: 4000,
            message: null,
          },
        }),
      });
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 12.97, longitude: 77.59 });

    await page.goto(`/${STORE_SLUG_DELIVERY}/checkout`);
    await page.getByRole('button', { name: /^delivery$/i }).click();
    await page.getByRole('button', { name: /use my location/i }).click();

    // Wait for delivery fee to show in bill
    await expect(page.getByText(/delivery fee/i)).toBeVisible({ timeout: 10000 });

    // Total should now be ₹190 (₹150 + ₹40)
    // formatINR(19000) = "₹190"
    const totalRow = page.getByText('Total').locator('..').last();
    await expect(totalRow.getByText('₹190')).toBeVisible({ timeout: 5000 });
  });
});
