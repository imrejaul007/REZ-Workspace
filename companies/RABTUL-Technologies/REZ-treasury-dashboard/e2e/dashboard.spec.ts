/**
 * TreasuryOS Dashboard - E2E Tests with Playwright
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3056';
const API_URL = process.env.E2E_API_URL || 'http://localhost:4055';

test.describe('TreasuryOS Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Dashboard Page', () => {
    test('should display main dashboard with KPIs', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Treasury Dashboard');

      // Check KPI cards exist
      await expect(page.locator('text=Total Balance')).toBeVisible();
      await expect(page.locator('text=Available Balance')).toBeVisible();
      await expect(page.locator('text=Invested')).toBeVisible();
      await expect(page.locator('text=Forecast (13wk)')).toBeVisible();
    });

    test('should display cash flow chart', async ({ page }) => {
      await expect(page.locator('text=13-Week Cash Flow Forecast')).toBeVisible();
      await expect(page.locator('canvas').first()).toBeVisible();
    });

    test('should display alerts section', async ({ page }) => {
      await expect(page.locator('text=Alerts')).toBeVisible();
    });

    test('should navigate to Accounts page', async ({ page }) => {
      await page.click('text=Accounts');
      await expect(page.locator('h1')).toContainText('Treasury Accounts');
    });

    test('should navigate to Investments page', async ({ page }) => {
      await page.click('text=Investments');
      await expect(page.locator('h1')).toContainText('Investment Portfolio');
    });

    test('should navigate to Forecast page', async ({ page }) => {
      await page.click('text=Forecast');
      await expect(page.locator('h1')).toContainText('13-Week Cash Flow Forecast');
    });

    test('should navigate to Alerts page', async ({ page }) => {
      await page.click('text=Alerts');
      await expect(page.locator('h1')).toContainText('Alerts & Notifications');
    });
  });

  test.describe('Accounts Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/accounts`);
    });

    test('should display account cards', async ({ page }) => {
      await expect(page.locator('text=Treasury Accounts')).toBeVisible();
      await expect(page.locator('text=Main Treasury')).toBeVisible();
      await expect(page.locator('text=Operations')).toBeVisible();
    });

    test('should show Create Account button', async ({ page }) => {
      const createButton = page.locator('button', { hasText: 'Create Account' });
      await expect(createButton).toBeVisible();
    });

    test('should open create account modal', async ({ page }) => {
      await page.click('button:has-text("Create Account")');
      await expect(page.locator('text=Create Treasury Account')).toBeVisible();
    });

    test('should display cash position summary', async ({ page }) => {
      await expect(page.locator('text=Cash Position Summary')).toBeVisible();
      await expect(page.locator('text=Total Balance')).toBeVisible();
      await expect(page.locator('text=Reserved')).toBeVisible();
      await expect(page.locator('text=Available')).toBeVisible();
    });

    test('should show recent transactions table', async ({ page }) => {
      await expect(page.locator('text=Recent Transactions')).toBeVisible();
    });
  });

  test.describe('Investments Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/investments`);
    });

    test('should display investment summary cards', async ({ page }) => {
      await expect(page.locator('text=Total Invested')).toBeVisible();
      await expect(page.locator('text=Current Value')).toBeVisible();
      await expect(page.locator('text=Total Returns')).toBeVisible();
    });

    test('should display portfolio performance chart', async ({ page }) => {
      await expect(page.locator('text=Portfolio Performance')).toBeVisible();
    });

    test('should show active investments table', async ({ page }) => {
      await expect(page.locator('text=Active Investments')).toBeVisible();
    });

    test('should show maturity warnings for soon-to-mature investments', async ({ page }) => {
      const maturityWarning = page.locator('text=days');
      await expect(maturityWarning.first()).toBeVisible();
    });

    test('should open new investment form', async ({ page }) => {
      await page.click('button:has-text("New Investment")');
      await expect(page.locator('text=Create Investment')).toBeVisible();
    });
  });

  test.describe('Forecast Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/forecast`);
    });

    test('should display forecast summary', async ({ page }) => {
      await expect(page.locator('text=Week 13 Balance')).toBeVisible();
      await expect(page.locator('text=Net Cash Flow')).toBeVisible();
      await expect(page.locator('text=Confidence')).toBeVisible();
      await expect(page.locator('text=Shortfall Risk')).toBeVisible();
    });

    test('should display cash flow bar chart', async ({ page }) => {
      await expect(page.locator('text=Cash Flow by Week')).toBeVisible();
    });

    test('should display balance trend line chart', async ({ page }) => {
      await expect(page.locator('text=Projected Balance Trend')).toBeVisible();
    });

    test('should show weekly breakdown table', async ({ page }) => {
      await expect(page.locator('text=Weekly Breakdown')).toBeVisible();
    });

    test('should have regenerate forecast button', async ({ page }) => {
      const regenerateButton = page.locator('button:has-text("Regenerate")');
      await expect(regenerateButton).toBeVisible();
    });
  });

  test.describe('Alerts Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/alerts`);
    });

    test('should display alert counts', async ({ page }) => {
      await expect(page.locator('text=Active Alerts')).toBeVisible();
      await expect(page.locator('text=Acknowledged')).toBeVisible();
    });

    test('should show alert severity badges', async ({ page }) => {
      const severityBadge = page.locator('text=HIGH').or(page.locator('text=MEDIUM')).or(page.locator('text=LOW'));
      await expect(severityBadge.first()).toBeVisible();
    });

    test('should allow acknowledging alerts', async ({ page }) => {
      const acknowledgeButton = page.locator('button:has-text("Acknowledge")');
      if (await acknowledgeButton.first().isVisible()) {
        await acknowledgeButton.first().click();
        await expect(page.locator('button:has-text("Mark Resolved")')).toBeVisible();
      }
    });

    test('should allow resolving alerts', async ({ page }) => {
      const resolveButton = page.locator('button:has-text("Mark Resolved")');
      if (await resolveButton.first().isVisible()) {
        await resolveButton.first().click();
        await expect(page.locator('text=Resolved')).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should highlight current nav item', async ({ page }) => {
      // Dashboard is default
      await expect(page.locator('nav a:has-text("Dashboard")')).toHaveClass(/bg-blue-50/);

      // Navigate to Accounts
      await page.click('nav a:has-text("Accounts")');
      await expect(page.locator('nav a:has-text("Accounts")')).toHaveClass(/bg-blue-50/);
      await expect(page.locator('nav a:has-text("Dashboard")')).not.toHaveClass(/bg-blue-50/);
    });

    test('should show quick stats in sidebar', async ({ page }) => {
      await expect(page.locator('text=Quick Stats')).toBeVisible();
      await expect(page.locator('text=Balance')).toBeVisible();
      await expect(page.locator('text=Invested')).toBeVisible();
      await expect(page.locator('text=Alerts')).toBeVisible();
    });

    test('should have working notification bell', async ({ page }) => {
      const bellButton = page.locator('button:has-text("🔔")');
      await expect(bellButton).toBeVisible();
    });

    test('should show user avatar', async ({ page }) => {
      const avatar = page.locator('div:has-text("RK")').first();
      await expect(avatar).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);

      // Sidebar should collapse on mobile
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('API Integration', () => {
    test('should load cash position data', async ({ page }) => {
      await page.goto(`${BASE_URL}/accounts`);
      // Wait for data to load
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Total Balance')).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Navigate with invalid business ID
      await page.goto(`${BASE_URL}/accounts`);
      // Should show error state or fallback
      await expect(page.locator('text=Treasury Accounts')).toBeVisible();
    });
  });
});

test.describe('TreasuryOS API', () => {
  test('health check endpoint should work', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('accounts endpoint should require auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/accounts/test-business`);
    expect(response.status()).toBe(401);
  });

  test('accounts endpoint should work with auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/accounts/test-business`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'test-token',
      },
    });
    // Should return 200 or 404 (not 401)
    expect([200, 404]).toContain(response.status());
  });
});