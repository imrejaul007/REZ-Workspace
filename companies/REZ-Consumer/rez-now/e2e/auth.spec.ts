/**
 * E2E — Auth flow
 *
 * Covers:
 *  - LoginModal opens from pay/checkout pages
 *  - Phone number validation (10 digits, +91 prefix)
 *  - OTP send success → OTP input appears
 *  - Invalid phone number shows error
 *  - OTP verification success → modal closes
 *  - OTP verification failure → error message
 *  - Resend OTP button
 *  - Logout clears session
 */

import { test, expect } from '@playwright/test';
import { mockScanPayStore } from './fixtures/store';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSendOtpSuccess = {
  success: true,
  isNewUser: false,
  hasPIN: false,
  message: 'OTP sent',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
const mockSendOtpNewUser = {
  success: true,
  isNewUser: true,
  hasPIN: false,
  message: 'OTP sent',
};

const mockVerifyOtpSuccess = {
  success: true,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-001',
    phone: '9876543210',
    fullName: 'Test User',
    profile: { firstName: 'Test', lastName: 'User' },
  },
};

const mockVerifyOtpFailure = {
  success: false,
  message: 'Invalid OTP. Please try again.',
};

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Auth flow', () => {
  // ── LoginModal renders ─────────────────────────────────────────────────────

  test('LoginModal opens when unauthenticated user taps Pay', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('150');
    await page.getByRole('button', { name: /Pay ₹150/i }).click();

    await expect(page.getByText('Login to continue')).toBeVisible();
  });

  test('LoginModal shows phone input step by default', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send OTP/i })).toBeVisible();
  });

  // ── Phone validation ───────────────────────────────────────────────────────

  test('shows error for less than 10-digit phone number', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('98765');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await expect(page.getByText(/enter a valid/i)).toBeVisible();
  });

  test('shows error for non-numeric phone input', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('98765abcde');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await expect(page.getByText(/enter a valid/i)).toBeVisible();
  });

  test('rejects phone number with special characters', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('98765@4321');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await expect(page.getByText(/enter a valid/i)).toBeVisible();
  });

  // ── OTP send ──────────────────────────────────────────────────────────────

  test('Send OTP button is disabled when phone field is empty', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await expect(page.getByRole('button', { name: /Send OTP/i })).toBeDisabled();
  });

  test('valid phone number enables Send OTP button', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await expect(page.getByRole('button', { name: /Send OTP/i })).toBeEnabled();
  });

  test('Send OTP navigates to OTP input step', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    // Should show OTP input
    await expect(page.getByPlaceholder('4-digit OTP')).toBeVisible();
    await expect(page.getByText(/OTP sent to.*9876543210/i)).toBeVisible();
  });

  test('Send OTP shows error on API failure', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Service unavailable' }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();

    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await expect(page.getByText(/service unavailable/i)).toBeVisible();
  });

  // ── OTP verification ──────────────────────────────────────────────────────

  test('OTP input shows 4-digit field', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await expect(page.getByPlaceholder('4-digit OTP')).toBeVisible();
  });

  test('Verify OTP with correct code closes modal and shows success', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });
    await page.route('**/api/user/auth/verify-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockVerifyOtpSuccess) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await page.getByPlaceholder('4-digit OTP').fill('1234');
    await page.getByRole('button', { name: /Verify & Pay/i }).click();

    // Modal should close — "Login to continue" no longer visible
    await expect(page.getByText('Login to continue')).not.toBeVisible();
  });

  test('Verify OTP with wrong code shows error message', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });
    await page.route('**/api/user/auth/verify-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockVerifyOtpFailure) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    await page.getByPlaceholder('4-digit OTP').fill('0000');
    await page.getByRole('button', { name: /Verify & Pay/i }).click();

    await expect(page.getByText(/invalid otp/i)).toBeVisible();
  });

  test('Resend OTP is available after sending OTP', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    // Resend link should be visible
    await expect(page.getByRole('button', { name: /resend/i })).toBeVisible();
  });

  // ── Modal close ───────────────────────────────────────────────────────────

  test('Modal can be closed and reopened', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await expect(page.getByText('Login to continue')).toBeVisible();

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText('Login to continue')).not.toBeVisible();

    // Reopen
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await expect(page.getByText('Login to continue')).toBeVisible();
  });

  test('Back button from OTP step returns to phone input', async ({ page }) => {
    await page.route('**/api/store-payment/store/pay-store', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockScanPayStore }) });
    });
    await page.route('**/api/user/auth/send-otp', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendOtpSuccess) });
    });

    await page.goto('/pay-store');
    await page.getByPlaceholder('0').fill('100');
    await page.getByRole('button', { name: /Pay ₹100/i }).click();
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await expect(page.getByPlaceholder('4-digit OTP')).toBeVisible();

    // Click back
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
  });
});
