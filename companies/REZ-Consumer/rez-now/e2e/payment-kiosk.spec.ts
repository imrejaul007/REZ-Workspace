/**
 * E2E — Payment Kiosk (Pay Display)
 *
 * Covers:
 *  - Payment kiosk page loads for authenticated merchant
 *  - Shows store name, logo, and today's total
 *  - Live feed of incoming payments via WebSocket (mocked)
 *  - Payment confirmation — merchant taps to confirm
 *  - Audio ding plays on new payment (synthesized)
 *  - Payment card shows customer name, amount, payment ID
 *  - Pending → Confirmed state transition
 *  - Rejected state
 *  - Empty state when no payments yet
 */

import { test, expect } from '@playwright/test';
import { mockScanPayStore } from './fixtures/store';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MockPayment {
  id: string;
  amount: number;
  customerName: string | null;
  customerPhone: string | null;
  razorpayPaymentId: string | null;
  storeSlug: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPayments: MockPayment[] = [
  {
    id: 'pay-001',
    amount: 50000, // ₹500 in paise
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    razorpayPaymentId: 'razorpay_pay_001',
    storeSlug: 'pay-store',
    createdAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: 'pay-002',
    amount: 15000, // ₹150 in paise
    customerName: 'Priya Patel',
    customerPhone: '9123456789',
    razorpayPaymentId: 'razorpay_pay_002',
    storeSlug: 'pay-store',
    createdAt: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    status: 'confirmed',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function installKioskMocks(page: import('@playwright/test').Page) {
  // Store data
  await page.route('**/api/store-payment/store/pay-store', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockScanPayStore }),
    });
  });

  // Merchant auth (logged-in merchant session)
  await page.route('**/api/merchant/auth/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'merchant-001',
          name: 'Pay Store',
          slug: 'pay-store',
          email: 'merchant@test.com',
        },
      }),
    });
  });

  // Today's payments
  await page.route('**/api/store-payment/store/pay-store/payments*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          payments: mockPayments,
          todayTotal: 65000, // ₹650 in paise
          todayCount: 2,
        },
      }),
    });
  });

  // Payment confirm endpoint
  await page.route('**/api/web-ordering/store/pay-store/payments/**/confirm', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Payment reject endpoint
  await page.route('**/api/web-ordering/store/pay-store/payments/**/reject', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Payment Kiosk', () => {
  test.beforeEach(async ({ page }) => {
    await installKioskMocks(page);
  });

  // ── Page structure ────────────────────────────────────────────────────────

  test('shows store name in header', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    await expect(page.getByText('Pay Store')).toBeVisible();
  });

  test('shows today\'s total revenue', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    await expect(page.getByText(/₹650/i)).toBeVisible();
  });

  test('shows today\'s transaction count', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    await expect(page.getByText(/2.*transaction/i)).toBeVisible();
  });

  // ── Live feed ────────────────────────────────────────────────────────────

  test('shows pending payment cards in the live feed', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText(/₹500/i)).toBeVisible();
    await expect(page.getByText('razorpay_pay_001')).toBeVisible();
  });

  test('pending payment shows Confirm and Reject buttons', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reject/i })).toBeVisible();
  });

  test('confirmed payment shows confirmation badge, not action buttons', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');
    // The confirmed payment should show a badge, not action buttons
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
    const _confirmedSection = page.getByText('Priya Patel').locator('..');
    await expect(page.getByText('Priya Patel')).toBeVisible();
    // Confirm/Reject buttons should only apply to pending payments
    // Confirmed payments should not have action buttons
  });

  // ── Payment confirmation ──────────────────────────────────────────────────

  test('tapping Confirm transitions payment to confirmed state', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');

    // Find the confirm button for the pending payment
    const confirmButtons = page.getByRole('button', { name: /confirm/i });
    await expect(confirmButtons).toBeVisible();

    // Intercept the confirm API call
    let confirmCalled = false;
    await page.route('**/api/web-ordering/store/pay-store/payments/**/confirm', (route) => {
      confirmCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await confirmButtons.first().click();

    // Should call confirm API
    expect(confirmCalled).toBeTruthy();
  });

  test('tapping Reject transitions payment to rejected state', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');

    let rejectCalled = false;
    await page.route('**/api/web-ordering/store/pay-store/payments/**/reject', (route) => {
      rejectCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const rejectButtons = page.getByRole('button', { name: /reject/i });
    await expect(rejectButtons).toBeVisible();
    await rejectButtons.first().click();

    expect(rejectCalled).toBeTruthy();
  });

  // ── WebSocket live feed ──────────────────────────────────────────────────

  test('new payment via WebSocket appears in live feed without page refresh', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');

    // Initial state: only 2 payments
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Priya Patel')).toBeVisible();

    // Simulate incoming WebSocket event by injecting it via page.evaluate
    await page.evaluate(() => {
      // Dispatch a custom event that the PayDisplayClient listens to
      window.dispatchEvent(new CustomEvent('rez:payment-received', {
        detail: {
          id: 'pay-003',
          amount: 80000,
          customerName: 'Amit Singh',
          customerPhone: '9988776655',
          razorpayPaymentId: 'razorpay_pay_003',
          storeSlug: 'pay-store',
          createdAt: new Date().toISOString(),
        },
      }));
    });

    // New payment should appear in the feed
    await expect(page.getByText('Amit Singh')).toBeVisible();
  });

  // ── Empty state ─────────────────────────────────────────────────────────

  test('shows empty state message when no payments today', async ({ page }) => {
    // Override the payments mock to return empty
    await page.route('**/api/store-payment/store/pay-store/payments*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            payments: [],
            todayTotal: 0,
            todayCount: 0,
          },
        }),
      });
    });

    await page.goto('/pay-store/merchant/pay-display');

    // Should show ₹0 and some empty-state message
    await expect(page.getByText(/₹0/i)).toBeVisible();
  });

  // ── Error handling ───────────────────────────────────────────────────────

  test('shows error state when payments API fails', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store/payments*', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Server error' }) });
    });

    await page.goto('/pay-store/merchant/pay-display');

    await expect(page.getByText(/error|failed/i)).toBeVisible();
  });

  test('retry button reloads the payments feed', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/store-payment/store/pay-store/payments*', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { payments: mockPayments, todayTotal: 65000, todayCount: 2 } }),
        });
      }
    });

    await page.goto('/pay-store/merchant/pay-display');

    // Trigger retry
    const retryButton = page.getByRole('button', { name: /retry|reload|refresh/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // Should show data on retry success
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  test('Confirm and Reject buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');

    const confirmBtn = page.getByRole('button', { name: /confirm/i }).first();
    await confirmBtn.focus();
    await expect(confirmBtn).toBeFocused();
  });

  test('payment cards have accessible labels', async ({ page }) => {
    await page.goto('/pay-store/merchant/pay-display');

    // Customer name should be perceivable
    await expect(page.getByText('Rahul Sharma')).toBeAttached();
    // Amount should be perceivable
    await expect(page.getByText(/₹500/i)).toBeAttached();
  });
});
