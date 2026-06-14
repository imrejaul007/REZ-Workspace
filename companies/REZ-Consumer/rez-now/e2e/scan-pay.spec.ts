/**
 * E2E — Scan & Pay flow (store with hasMenu: false)
 *
 * Covers:
 *  - Amount input is rendered for a scan-pay store
 *  - Quick-amount buttons populate the input
 *  - Zero / empty value shows validation error
 *  - A valid amount enables the Pay button
 *  - Unauthenticated "Pay" click opens the LoginModal
 *  - Coin earn preview appears for a valid amount on a program-merchant store
 */

import { test, expect } from '@playwright/test';
import {
  mockScanPayStoreApiResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  mockStoreMenuApiResponse,
} from './fixtures/store';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function installScanPayMocks(page: import('@playwright/test').Page) {
  // The StoreLayout tries Order & Pay first; simulate a 404 / failure so it
  // falls back to the Scan & Pay endpoint.
  await page.route('**/api/web-ordering/store/pay-store', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Return success: false so getStoreMenu() throws and falls back
      body: JSON.stringify({ success: false, message: 'Store not found' }),
    });
  });

  // Scan & Pay store endpoint
  await page.route('**/api/store-payment/store/pay-store', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockScanPayStoreApiResponse),
    });
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Scan & Pay flow', () => {
  test.beforeEach(async ({ page }) => {
    await installScanPayMocks(page);
  });

  // ── Page structure ────────────────────────────────────────────────────────

  test('shows store name and address in the header', async ({ page }) => {
    await page.goto('/pay-store');

    await expect(page.getByText('Pay Store')).toBeVisible();
    await expect(page.getByText('10 Brigade Road, Bengaluru, Karnataka 560001')).toBeVisible();
  });

  test('shows amount input with placeholder "0"', async ({ page }) => {
    await page.goto('/pay-store');

    await expect(page.getByPlaceholder('0')).toBeVisible();
  });

  test('shows prompt text "Enter amount to pay"', async ({ page }) => {
    await page.goto('/pay-store');

    await expect(page.getByText('Enter amount to pay')).toBeVisible();
  });

  test('renders all four quick-amount buttons', async ({ page }) => {
    await page.goto('/pay-store');

    for (const amount of ['₹100', '₹200', '₹500', '₹1000']) {
      await expect(page.getByRole('button', { name: amount })).toBeVisible();
    }
  });

  // ── Amount input behaviour ────────────────────────────────────────────────

  test('typing a valid amount into the input updates the display', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('250');
    await expect(page.getByPlaceholder('0')).toHaveValue('250');
  });

  test('quick-amount button populates the input field', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByRole('button', { name: '₹500' }).click();

    await expect(page.getByPlaceholder('0')).toHaveValue('500');
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test('Pay button is disabled when input is empty', async ({ page }) => {
    await page.goto('/pay-store');

    // The Button component sets disabled when !validAmount
    const payButton = page.getByRole('button', { name: /^Pay$/i });
    await expect(payButton).toBeDisabled();
  });

  test('tapping Pay with amount 0 shows a validation error', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('0');
    // Button is disabled for 0, but the validation message should appear on proceed
    // Force a click attempt via keyboard submit
    await page.getByPlaceholder('0').press('Enter');

    // The handleProceed guard message
    await expect(page.getByText(/Enter a valid amount/i)).toBeVisible();
  });

  test('entering a negative-like character does not corrupt the input', async ({ page }) => {
    await page.goto('/pay-store');

    // The handler strips non-digit/decimal chars
    await page.getByPlaceholder('0').fill('-50');

    // The cleaned value should be "50" (the "-" is stripped by handleAmountInput)
    await expect(page.getByPlaceholder('0')).toHaveValue('50');
  });

  // ── Valid amount state ────────────────────────────────────────────────────

  test('entering a valid amount enables the Pay button', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('150');

    const payButton = page.getByRole('button', { name: /Pay ₹150/i });
    await expect(payButton).toBeEnabled();
  });

  test('Pay button label reflects the entered amount', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('200');

    await expect(page.getByRole('button', { name: /Pay ₹200/i })).toBeVisible();
  });

  // ── Coin earn preview ─────────────────────────────────────────────────────

  test('coin earn preview appears for a valid amount on a program-merchant store', async ({ page }) => {
    await page.goto('/pay-store');

    // Use ₹500 so that estimatedCoins >= 1 at 2% rate.
    // Formula: floor((500/10) * (2/100)) = floor(50 * 0.02) = floor(1) = 1 coin
    await page.getByPlaceholder('0').fill('500');

    await expect(page.getByText(/REZ coins/i)).toBeVisible();
    await expect(page.getByText(/~1 REZ coins/i)).toBeVisible();
  });

  test('coin earn preview is hidden when amount is 0', async ({ page }) => {
    await page.goto('/pay-store');

    // Coins preview should not exist before any amount is entered
    await expect(page.getByText(/REZ coins/i)).not.toBeVisible();
  });

  // ── Unauthenticated flow ──────────────────────────────────────────────────

  test('tapping Pay while unauthenticated opens the LoginModal', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('150');
    await page.getByRole('button', { name: /Pay ₹150/i }).click();

    // LoginModal should open — shows the phone input step
    await expect(page.getByText('Login to continue')).toBeVisible();
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
  });

  test('LoginModal can be closed without logging in', async ({ page }) => {
    await page.goto('/pay-store');

    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    // Wait for modal
    await expect(page.getByText('Login to continue')).toBeVisible();

    // Close via the Modal's close button (aria-label="Close" is standard)
    await page.getByRole('button', { name: /close/i }).click();

    // Amount input should still be intact after closing
    await expect(page.getByPlaceholder('0')).toBeVisible();
  });
});

// ── Additional: scan-pay store served directly under /[storeSlug] ─────────────

test.describe('Scan & Pay — inline render from StorePage', () => {
  test('ScanPayPage renders when store.hasMenu is false', async ({ page }) => {
    // Re-use the fixtures but target the menu store endpoint returning hasMenu:false
    await page.route('**/api/web-ordering/store/pay-store', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'no menu' }),
      });
    });
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockScanPayStoreApiResponse),
      });
    });

    await page.goto('/pay-store');

    // The ScanPayPage component should be rendered (not the menu layout)
    await expect(page.getByPlaceholder('0')).toBeVisible();
    // Category nav must NOT be present — this is scan-pay, not a menu
    await expect(page.getByRole('navigation', { name: /menu categories/i })).not.toBeVisible();
  });
});
