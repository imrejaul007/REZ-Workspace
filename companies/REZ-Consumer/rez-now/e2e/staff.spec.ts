/**
 * E2E — Staff waiter dashboard (/[storeSlug]/staff)
 *
 * Covers:
 *  - Visiting /[storeSlug]/staff shows the PIN gate (not the dashboard)
 *  - Entering the wrong PIN shows "Incorrect PIN" error
 *  - Entering the correct PIN unlocks the dashboard
 *  - Dashboard shows call cards when the API returns pending calls
 *  - Clicking "Acknowledge" turns the card amber (acknowledged colour)
 *  - Clicking "Mark Resolved" starts the fade-out and removes the card
 *  - "No active calls" empty state shown when call list is empty
 *
 * PIN derivation: getExpectedPin(storeSlug) extracts digits from the slug,
 * takes the last 4.  For slug "test-cafe-1234" the PIN is "1234".
 * We use "test-cafe-5678" so the pin is "5678" — a slug with exactly 4 digits.
 *
 * Auth: No user auth required for the staff dashboard.
 * API mocking: page.route() intercepts waiter-call endpoints.
 * Unlock state: injected via page.addInitScript (sets sessionStorage) to skip
 * the PIN gate in tests that focus on the dashboard directly.
 */

import { test, expect } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * slug whose digit suffix is "5678" → expected PIN = "5678".
 * getExpectedPin removes non-digits ('test-cafe-' → ''), takes last 4 of '5678'.
 */
const STORE_SLUG = 'test-cafe-5678';
const CORRECT_PIN = '5678';
const WRONG_PIN = '0000';

// ── Builders ──────────────────────────────────────────────────────────────────

function buildWaiterCall(overrides: Partial<{
  requestId: string;
  tableNumber: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  reason: string;
}> = {}) {
  return {
    requestId: overrides.requestId ?? 'call-001',
    tableNumber: overrides.tableNumber ?? '5',
    status: overrides.status ?? 'pending',
    createdAt: new Date(Date.now() - 30000).toISOString(), // 30 s ago
    reason: overrides.reason,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Inject sessionStorage key so the dashboard component sees itself as already
 * unlocked — bypasses the PIN gate for tests focused on dashboard behaviour.
 */
async function injectUnlocked(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ key }: { key: string }) => {
      sessionStorage.setItem(key, '1');
    },
    { key: `staff_unlocked_${STORE_SLUG}` }
  );
}

async function installCommonMocks(page: import('@playwright/test').Page) {
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/socket.io/**', (route) => { route.abort(); });
}

/**
 * Mock GET /api/web-ordering/store/:slug/waiter-calls
 */
async function mockWaiterCalls(
  page: import('@playwright/test').Page,
  calls: ReturnType<typeof buildWaiterCall>[]
) {
  await page.route(`**/api/web-ordering/store/${STORE_SLUG}/waiter-calls`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: calls }),
    });
  });
}

/**
 * Mock PATCH /api/web-ordering/waiter/call/:requestId
 */
async function mockUpdateCall(page: import('@playwright/test').Page) {
  await page.route('**/api/web-ordering/waiter/call/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// ── Test suites ────────────────────────────────────────────────────────────────

test.describe('Staff — PIN gate', () => {
  test.beforeEach(async ({ page }) => {
    await installCommonMocks(page);
    await mockWaiterCalls(page, []);
  });

  test('visiting /staff shows the PIN gate', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/staff`);

    // PIN gate heading
    await expect(page.getByText('Staff Dashboard')).toBeVisible({ timeout: 10000 });
    // PIN input
    await expect(page.locator('#staff-pin')).toBeVisible();
  });

  test('entering the wrong PIN shows "Incorrect PIN" error', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/staff`);

    await page.locator('#staff-pin').fill(WRONG_PIN);
    await page.getByRole('button', { name: /unlock/i }).click();

    await expect(page.getByText('Incorrect PIN')).toBeVisible({ timeout: 5000 });
  });

  test('entering the correct PIN dismisses the gate and shows the dashboard', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/staff`);

    await page.locator('#staff-pin').fill(CORRECT_PIN);
    await page.getByRole('button', { name: /unlock/i }).click();

    // Dashboard header badge "Staff View" visible
    await expect(page.getByText('Staff View')).toBeVisible({ timeout: 8000 });
    // PIN gate is gone
    await expect(page.locator('#staff-pin')).not.toBeVisible();
  });
});

test.describe('Staff — dashboard call cards', () => {
  test.beforeEach(async ({ page }) => {
    await injectUnlocked(page);
    await installCommonMocks(page);
    await mockUpdateCall(page);
  });

  test('shows two call cards when API returns 2 pending calls', async ({ page }) => {
    await mockWaiterCalls(page, [
      buildWaiterCall({ requestId: 'call-001', tableNumber: '3' }),
      buildWaiterCall({ requestId: 'call-002', tableNumber: '7' }),
    ]);

    await page.goto(`/${STORE_SLUG}/staff`);

    await expect(page.getByText('Table 3')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Table 7')).toBeVisible();
  });

  test('"Acknowledge" button is visible on a pending call card', async ({ page }) => {
    await mockWaiterCalls(page, [
      buildWaiterCall({ requestId: 'call-001', tableNumber: '3' }),
    ]);

    await page.goto(`/${STORE_SLUG}/staff`);

    await expect(
      page.getByRole('button', { name: /acknowledge table 3/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('clicking "Acknowledge" switches the card to amber (acknowledged)', async ({ page }) => {
    await mockWaiterCalls(page, [
      buildWaiterCall({ requestId: 'call-001', tableNumber: '4' }),
    ]);

    await page.goto(`/${STORE_SLUG}/staff`);

    await page.getByRole('button', { name: /acknowledge table 4/i }).click();

    // After acknowledge the card renders with amber styles.
    // The acknowledged text badge "✓ Acknowledged" appears
    await expect(page.getByText(/✓.*acknowledged/i)).toBeVisible({ timeout: 5000 });
  });

  test('clicking "Mark Resolved" starts removing the card from the list', async ({ page }) => {
    await mockWaiterCalls(page, [
      buildWaiterCall({ requestId: 'call-001', tableNumber: '6' }),
    ]);

    await page.goto(`/${STORE_SLUG}/staff`);

    await expect(page.getByText('Table 6')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /resolved table 6/i }).click();

    // After the 1 000 ms fade animation completes the card is removed.
    // Wait up to 3 s for the card to disappear.
    await expect(page.getByText('Table 6')).not.toBeVisible({ timeout: 3000 });
  });

  test('"No active calls" empty state shown when call list is empty', async ({ page }) => {
    await mockWaiterCalls(page, []);

    await page.goto(`/${STORE_SLUG}/staff`);

    await expect(page.getByText('No active calls')).toBeVisible({ timeout: 10000 });
  });

  test('active call count badge shown in header when there are pending calls', async ({ page }) => {
    await mockWaiterCalls(page, [
      buildWaiterCall({ requestId: 'call-001', tableNumber: '2' }),
      buildWaiterCall({ requestId: 'call-002', tableNumber: '8' }),
    ]);

    await page.goto(`/${STORE_SLUG}/staff`);

    await expect(page.getByText('Table 2')).toBeVisible({ timeout: 10000 });

    // Active calls badge: "2 active calls"
    await expect(
      page.getByText(/\d+ active calls/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
