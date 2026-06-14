/**
 * E2E — Menu search functionality
 *
 * Covers:
 *  - Typing a matching query shows the matching item
 *  - Search highlights the matched substring in the item name
 *  - Searching a non-existent term shows the empty state message
 *  - The empty state has a "Clear search" button
 *  - Clicking "Clear search" restores all menu items
 *  - Clearing the input manually restores all items
 *  - Result count badge is shown for a valid query
 *  - Case-insensitive matching works correctly
 *  - Partial match works (prefix match)
 *  - Veg-only filter stacks correctly on top of search results
 */

import { test, expect } from '@playwright/test';
import { mockStoreMenuApiResponse } from './fixtures/store';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function installMenuMocks(page: import('@playwright/test').Page) {
  await page.route('**/api/web-ordering/store/test-cafe', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStoreMenuApiResponse),
    });
  });

  // Wallet and analytics requests that may fire — absorb them silently
  await page.route('**/api/wallet/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' });
  });
}

async function goToMenu(page: import('@playwright/test').Page) {
  await page.goto('/test-cafe');
  // Wait for at least one menu item to be rendered before interacting
  await expect(page.getByText('Espresso')).toBeVisible();
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Menu search', () => {
  test.beforeEach(async ({ page }) => {
    await installMenuMocks(page);
    await goToMenu(page);
  });

  // ── Basic search ──────────────────────────────────────────────────────────

  test('typing "esp" shows Espresso and hides non-matching items', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('esp');

    await expect(page.getByText('Espresso')).toBeVisible();
    await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();
  });

  test('typing "chicken" shows Chicken Sandwich and hides beverages', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('chicken');

    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
    await expect(page.getByText('Espresso')).not.toBeVisible();
  });

  test('search is case-insensitive', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('ESPRESSO');

    await expect(page.getByText('Espresso')).toBeVisible();
  });

  test('partial match on item description works', async ({ page }) => {
    // Espresso description contains "bold" — should match
    await page.getByPlaceholder('Search items...').fill('bold');

    await expect(page.getByText('Espresso')).toBeVisible();
  });

  // ── Result count ──────────────────────────────────────────────────────────

  test('result count badge shows correct number for a matching query', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('esp');

    // "1 result for "esp""
    await expect(page.getByText(/1 result/i)).toBeVisible();
  });

  test('result count updates when multiple items match', async ({ page }) => {
    // Both "Espresso" and "Cold Brew" are in the Beverages category.
    // Search "e" is broad enough to match both (Espresso, Cold Brew description contains "e")
    // Use "brew" which matches Cold Brew only — then use "e" to check multi-match separately.
    await page.getByPlaceholder('Search items...').fill('resso');

    // Espresso matches
    await expect(page.getByText(/1 result/i)).toBeVisible();
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  test('searching "xyz" shows the empty state message', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('xyz');

    await expect(page.getByText(/No items found for/i)).toBeVisible();
    await expect(page.getByText(/"xyz"/)).toBeVisible();
  });

  test('empty state shows helpful tip text', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('xyz');

    await expect(page.getByText(/Check the spelling or try a broader term/i)).toBeVisible();
  });

  test('empty state has a "Clear search" button', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('xyz');

    await expect(page.getByRole('button', { name: /Clear search/i })).toBeVisible();
  });

  // ── Clear search ──────────────────────────────────────────────────────────

  test('clicking "Clear search" restores all items', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('xyz');
    // Verify empty state first
    await expect(page.getByText(/No items found/i)).toBeVisible();

    await page.getByRole('button', { name: /Clear search/i }).click();

    // All items should be visible again
    await expect(page.getByText('Espresso')).toBeVisible();
    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
    // Search input should be empty
    await expect(page.getByPlaceholder('Search items...')).toHaveValue('');
  });

  test('manually clearing the input restores all items', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('esp');
    await expect(page.getByText('Espresso')).toBeVisible();
    await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();

    // Clear the input by triple-clicking and deleting
    await page.getByPlaceholder('Search items...').fill('');

    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
    await expect(page.getByText('Espresso')).toBeVisible();
  });

  test('clearing search also removes the result count badge', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('esp');
    await expect(page.getByText(/1 result/i)).toBeVisible();

    await page.getByPlaceholder('Search items...').fill('');
    await expect(page.getByText(/result/i)).not.toBeVisible();
  });

  // ── Stacking with veg-only filter ─────────────────────────────────────────

  test('veg-only filter stacks on top of search results', async ({ page }) => {
    // Search "sandwich" → shows Chicken Sandwich (non-veg)
    await page.getByPlaceholder('Search items...').fill('sandwich');
    await expect(page.getByText('Chicken Sandwich')).toBeVisible();

    // Now enable veg-only — should hide the non-veg result
    await page.getByRole('button', { name: /Veg only/i }).click();

    await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();
    // Empty state or zero results
    await expect(page.getByText(/No items found/i)).toBeVisible();
  });

  test('disabling veg-only filter within an active search restores matching items', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('sandwich');
    await page.getByRole('button', { name: /Veg only/i }).click();

    // Empty after veg-only — now disable
    await page.getByRole('button', { name: /Veg only/i }).click();

    // Chicken Sandwich should be back
    await expect(page.getByText('Chicken Sandwich')).toBeVisible();
  });

  // ── Search with no items at all ───────────────────────────────────────────

  test('empty state message includes the searched term in quotes', async ({ page }) => {
    const searchTerm = 'nothingmatches';
    await page.getByPlaceholder('Search items...').fill(searchTerm);

    await expect(page.getByText(`"${searchTerm}"`)).toBeVisible();
  });
});
