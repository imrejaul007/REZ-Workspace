# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> Menu search >> manually clearing the input restores all items
- Location: e2e/search.spec.ts:136:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Espresso')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Espresso')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - alert [ref=e7]
```

# Test source

```ts
  1   | /**
  2   |  * E2E — Menu search functionality
  3   |  *
  4   |  * Covers:
  5   |  *  - Typing a matching query shows the matching item
  6   |  *  - Search highlights the matched substring in the item name
  7   |  *  - Searching a non-existent term shows the empty state message
  8   |  *  - The empty state has a "Clear search" button
  9   |  *  - Clicking "Clear search" restores all menu items
  10  |  *  - Clearing the input manually restores all items
  11  |  *  - Result count badge is shown for a valid query
  12  |  *  - Case-insensitive matching works correctly
  13  |  *  - Partial match works (prefix match)
  14  |  *  - Veg-only filter stacks correctly on top of search results
  15  |  */
  16  | 
  17  | import { test, expect } from '@playwright/test';
  18  | import { mockStoreMenuApiResponse } from './fixtures/store';
  19  | 
  20  | // ── Helpers ──────────────────────────────────────────────────────────────────
  21  | 
  22  | async function installMenuMocks(page: import('@playwright/test').Page) {
  23  |   await page.route('**/api/web-ordering/store/test-cafe', (route) => {
  24  |     route.fulfill({
  25  |       status: 200,
  26  |       contentType: 'application/json',
  27  |       body: JSON.stringify(mockStoreMenuApiResponse),
  28  |     });
  29  |   });
  30  | 
  31  |   // Wallet and analytics requests that may fire — absorb them silently
  32  |   await page.route('**/api/wallet/**', (route) => {
  33  |     route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' });
  34  |   });
  35  | }
  36  | 
  37  | async function goToMenu(page: import('@playwright/test').Page) {
  38  |   await page.goto('/test-cafe');
  39  |   // Wait for at least one menu item to be rendered before interacting
> 40  |   await expect(page.getByText('Espresso')).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
  41  | }
  42  | 
  43  | // ── Test suite ────────────────────────────────────────────────────────────────
  44  | 
  45  | test.describe('Menu search', () => {
  46  |   test.beforeEach(async ({ page }) => {
  47  |     await installMenuMocks(page);
  48  |     await goToMenu(page);
  49  |   });
  50  | 
  51  |   // ── Basic search ──────────────────────────────────────────────────────────
  52  | 
  53  |   test('typing "esp" shows Espresso and hides non-matching items', async ({ page }) => {
  54  |     await page.getByPlaceholder('Search items...').fill('esp');
  55  | 
  56  |     await expect(page.getByText('Espresso')).toBeVisible();
  57  |     await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();
  58  |   });
  59  | 
  60  |   test('typing "chicken" shows Chicken Sandwich and hides beverages', async ({ page }) => {
  61  |     await page.getByPlaceholder('Search items...').fill('chicken');
  62  | 
  63  |     await expect(page.getByText('Chicken Sandwich')).toBeVisible();
  64  |     await expect(page.getByText('Espresso')).not.toBeVisible();
  65  |   });
  66  | 
  67  |   test('search is case-insensitive', async ({ page }) => {
  68  |     await page.getByPlaceholder('Search items...').fill('ESPRESSO');
  69  | 
  70  |     await expect(page.getByText('Espresso')).toBeVisible();
  71  |   });
  72  | 
  73  |   test('partial match on item description works', async ({ page }) => {
  74  |     // Espresso description contains "bold" — should match
  75  |     await page.getByPlaceholder('Search items...').fill('bold');
  76  | 
  77  |     await expect(page.getByText('Espresso')).toBeVisible();
  78  |   });
  79  | 
  80  |   // ── Result count ──────────────────────────────────────────────────────────
  81  | 
  82  |   test('result count badge shows correct number for a matching query', async ({ page }) => {
  83  |     await page.getByPlaceholder('Search items...').fill('esp');
  84  | 
  85  |     // "1 result for "esp""
  86  |     await expect(page.getByText(/1 result/i)).toBeVisible();
  87  |   });
  88  | 
  89  |   test('result count updates when multiple items match', async ({ page }) => {
  90  |     // Both "Espresso" and "Cold Brew" are in the Beverages category.
  91  |     // Search "e" is broad enough to match both (Espresso, Cold Brew description contains "e")
  92  |     // Use "brew" which matches Cold Brew only — then use "e" to check multi-match separately.
  93  |     await page.getByPlaceholder('Search items...').fill('resso');
  94  | 
  95  |     // Espresso matches
  96  |     await expect(page.getByText(/1 result/i)).toBeVisible();
  97  |   });
  98  | 
  99  |   // ── Empty state ───────────────────────────────────────────────────────────
  100 | 
  101 |   test('searching "xyz" shows the empty state message', async ({ page }) => {
  102 |     await page.getByPlaceholder('Search items...').fill('xyz');
  103 | 
  104 |     await expect(page.getByText(/No items found for/i)).toBeVisible();
  105 |     await expect(page.getByText(/"xyz"/)).toBeVisible();
  106 |   });
  107 | 
  108 |   test('empty state shows helpful tip text', async ({ page }) => {
  109 |     await page.getByPlaceholder('Search items...').fill('xyz');
  110 | 
  111 |     await expect(page.getByText(/Check the spelling or try a broader term/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   test('empty state has a "Clear search" button', async ({ page }) => {
  115 |     await page.getByPlaceholder('Search items...').fill('xyz');
  116 | 
  117 |     await expect(page.getByRole('button', { name: /Clear search/i })).toBeVisible();
  118 |   });
  119 | 
  120 |   // ── Clear search ──────────────────────────────────────────────────────────
  121 | 
  122 |   test('clicking "Clear search" restores all items', async ({ page }) => {
  123 |     await page.getByPlaceholder('Search items...').fill('xyz');
  124 |     // Verify empty state first
  125 |     await expect(page.getByText(/No items found/i)).toBeVisible();
  126 | 
  127 |     await page.getByRole('button', { name: /Clear search/i }).click();
  128 | 
  129 |     // All items should be visible again
  130 |     await expect(page.getByText('Espresso')).toBeVisible();
  131 |     await expect(page.getByText('Chicken Sandwich')).toBeVisible();
  132 |     // Search input should be empty
  133 |     await expect(page.getByPlaceholder('Search items...')).toHaveValue('');
  134 |   });
  135 | 
  136 |   test('manually clearing the input restores all items', async ({ page }) => {
  137 |     await page.getByPlaceholder('Search items...').fill('esp');
  138 |     await expect(page.getByText('Espresso')).toBeVisible();
  139 |     await expect(page.getByText('Chicken Sandwich')).not.toBeVisible();
  140 | 
```