/**
 * E2E — Order & Pay flow (store with hasMenu: true)
 *
 * Covers:
 *  - Store menu page loads with name + category nav
 *  - Category navigation pill renders for each category
 *  - Add item to cart shows CartSummaryBar with correct count
 *  - Incrementing the same item updates the counter
 *  - Cart page shows items, subtotal, and GST
 *  - Empty cart state redirects back to menu
 *  - Unauthenticated checkout triggers the LoginModal
 *  - Veg-only filter hides non-veg items
 */

import { test, expect } from '@playwright/test';
import {
  mockStoreMenuApiResponse,
  mockWalletBalance,
  mockCartValidationOk,
} from './fixtures/store';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Install all route mocks needed for the Order & Pay flow.
 * Call this in beforeEach so every test starts with a clean slate.
 */
async function installMenuMocks(page: import('@playwright/test').Page) {
  // Menu store endpoint — used by StoreLayout (server component)
  await page.route('**/api/web-ordering/store/test-cafe', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStoreMenuApiResponse),
    });
  });

  // Wallet balance — fetched on checkout when isProgramMerchant
  await page.route('**/api/wallet/balance', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockWalletBalance),
    });
  });

  // Cart validation — called when user taps "Proceed to Checkout"
  await page.route('**/api/web-ordering/cart/validate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCartValidationOk),
    });
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Order & Pay flow', () => {
  test.beforeEach(async ({ page }) => {
    await installMenuMocks(page);
  });

  // ── Menu page ─────────────────────────────────────────────────────────────

  test('loads store menu page and displays store name', async ({ page }) => {
    await page.goto('/test-cafe');

    // Store name must be visible in the menu header
    await expect(page.getByText('Test Cafe')).toBeVisible();
  });

  test('renders a category nav pill for each category', async ({ page }) => {
    await page.goto('/test-cafe');

    // Each category defined in fixtures should appear as a nav button
    await expect(page.getByRole('button', { name: 'Beverages' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Food' })).toBeVisible();
  });

  test('renders menu items within their categories', async ({ page }) => {
    await page.goto('/test-cafe');

    await expect(page.getByRole('heading', { name: 'Beverages' })).toBeVisible();
    await expect(page.getByText('Espresso')).toBeVisible();
    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
  });

  test('shows the price of a menu item', async ({ page }) => {
    await page.goto('/test-cafe');

    // ₹150 in paise → formatINR(15000) → "₹150"
    await expect(page.getByText('₹150')).toBeVisible();
  });

  test('marks unavailable items as unavailable', async ({ page }) => {
    await page.goto('/test-cafe');

    await expect(page.getByText('Unavailable')).toBeVisible();
  });

  // ── Add to cart ───────────────────────────────────────────────────────────

  test('adds item to cart and shows CartSummaryBar with 1 item', async ({ page }) => {
    await page.goto('/test-cafe');

    // The MenuItem "Add" button: addLabel defaults to store uiCopy.addToCartLabel
    // For storeType='cafe' this resolves to "Add" — target by item name proximity
    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();

    // CartSummaryBar should surface with "1 item"
    await expect(page.getByText('1 item')).toBeVisible();
  });

  test('increments cart count when the same item is added twice', async ({ page }) => {
    await page.goto('/test-cafe');

    // First add
    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();

    // After first click the button becomes a stepper; the "+" button is now the increment
    const incrementButton = espressoSection.getByRole('button', { name: '+' }).first();
    await incrementButton.click();

    // CartSummaryBar should show 2 items
    await expect(page.getByText('2 items')).toBeVisible();
  });

  test('displays view cart total in CartSummaryBar', async ({ page }) => {
    await page.goto('/test-cafe');

    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();

    // CartSummaryBar also shows the subtotal — ₹150
    await expect(page.getByText('View Cart · ₹150')).toBeVisible();
  });

  // ── Cart page ─────────────────────────────────────────────────────────────

  test('cart page shows empty state when no items are in the cart', async ({ page }) => {
    // Navigate directly to cart without adding items
    await page.goto('/test-cafe/cart');

    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Menu' })).toBeVisible();
  });

  test('cart page shows item, subtotal, and GST after adding to cart', async ({ page }) => {
    // Add an item first from the menu page, then navigate to the cart
    await page.goto('/test-cafe');

    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();

    // Navigate to cart via the CartSummaryBar button
    await page.getByText('1 item').click();

    // Item name must be on the cart page
    await expect(page.getByText('Espresso')).toBeVisible();

    // Subtotal: ₹150 (1 × ₹150)
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('₹150').first()).toBeVisible();

    // GST is enabled at 5% → ₹7.5 → formatINR rounds → "₹8"
    await expect(page.getByText(/GST \(5%\)/)).toBeVisible();
  });

  test('cart page shows Bill Summary section heading', async ({ page }) => {
    await page.goto('/test-cafe');

    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();
    await page.getByText('1 item').click();

    await expect(page.getByText('Bill Summary')).toBeVisible();
  });

  test('cart page Proceed to Checkout button is visible', async ({ page }) => {
    await page.goto('/test-cafe');

    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();
    await page.getByText('1 item').click();

    await expect(page.getByRole('button', { name: /Proceed to Checkout/i })).toBeVisible();
  });

  // ── Unauthenticated checkout ───────────────────────────────────────────────

  test('unauthenticated checkout click opens the LoginModal', async ({ page }) => {
    // Add item and go to cart
    await page.goto('/test-cafe');
    const espressoSection = page.locator('text=Espresso').locator('..');
    const addButton = espressoSection.getByRole('button', { name: /^Add$/i }).first();
    await addButton.click();
    await page.getByText('1 item').click();

    // Tap checkout while not logged in
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    // LoginModal should open — it shows a phone input with placeholder text
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
    await expect(page.getByText('Login to continue')).toBeVisible();
  });

  test('unauthenticated direct navigation to checkout opens LoginModal', async ({ page }) => {
    // CheckoutPage itself calls openLoginModal when not logged in
    await page.goto('/test-cafe/checkout');

    // Should see the login modal or be redirected to show it
    await expect(page.getByText('Login to continue')).toBeVisible({ timeout: 10000 });
  });

  // ── Veg-only filter ───────────────────────────────────────────────────────

  test('veg-only toggle hides non-veg items', async ({ page }) => {
    await page.goto('/test-cafe');

    // Both items visible before filter
    await expect(page.getByText('Espresso')).toBeVisible();
    await expect(page.getByText('Chicken Sandwich')).toBeVisible();

    // Enable veg-only
    await page.getByRole('button', { name: /Veg only/i }).click();

    // Non-veg item should disappear
    await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();
    // Veg item should remain
    await expect(page.getByText('Espresso')).toBeVisible();
  });

  test('disabling veg-only filter restores non-veg items', async ({ page }) => {
    await page.goto('/test-cafe');

    // Enable then disable
    await page.getByRole('button', { name: /Veg only/i }).click();
    await page.getByRole('button', { name: /Veg only/i }).click();

    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
  });

  // ── Promo banner ──────────────────────────────────────────────────────────

  test('promo banner text is visible on menu page', async ({ page }) => {
    await page.goto('/test-cafe');

    await expect(page.getByText('10% off on orders above ₹300')).toBeVisible();
  });
});
