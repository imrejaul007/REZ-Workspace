/**
 * E2E — Store search and browse (home page + /search results page)
 *
 * Covers:
 *  - Home page renders the search input
 *  - Typing a query debounces and shows a dropdown with up to 3 results
 *  - Pressing Enter navigates to /search?q=...
 *  - Search results page shows a results grid
 *  - Category filter "Restaurant" filters the results list
 *  - "Load more" appends the next page
 *  - Empty query shows the idle hint
 *  - Zero-result search shows the "No stores found" empty state
 *  - Clicking a StoreCard navigates to /[storeSlug]
 *
 * API mocking: page.route() intercepts GET /api/web-ordering/search requests
 * so no real backend is required.
 */

import { test, expect } from '@playwright/test';

// ── Shared mock data ──────────────────────────────────────────────────────────

const PIZZA_RESULTS = [
  {
    id: 'store-p1',
    name: 'Pizza Palace',
    slug: 'pizza-palace',
    logo: null,
    storeType: 'restaurant',
    category: 'restaurant',
    address: '12 MG Road, Bengaluru',
    isOpen: true,
    estimatedPrepMinutes: 20,
    rewardRules: { coinsEnabled: true, baseCashbackPercent: 1 },
  },
  {
    id: 'store-p2',
    name: 'Pizza Hut Koramangala',
    slug: 'pizza-hut-koramangala',
    logo: null,
    storeType: 'restaurant',
    category: 'restaurant',
    address: '5th Block, Koramangala',
    isOpen: true,
    estimatedPrepMinutes: 30,
    rewardRules: { coinsEnabled: false, baseCashbackPercent: 0 },
  },
  {
    id: 'store-p3',
    name: 'Slice & Dice',
    slug: 'slice-and-dice',
    logo: null,
    storeType: 'cafe',
    category: 'cafe',
    address: 'Indiranagar, Bengaluru',
    isOpen: false,
    estimatedPrepMinutes: 10,
    rewardRules: { coinsEnabled: true, baseCashbackPercent: 2 },
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
const RESTAURANT_RESULTS = PIZZA_RESULTS.filter((s) => s.storeType === 'restaurant');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Install home-page mocks: absorb analytics & wallet requests.
 * The search route itself is installed per-test as needed.
 */
async function installCommonMocks(page: import('@playwright/test').Page) {
  await page.route('**/api/analytics/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/api/wallet/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' });
  });
  await page.route('**/socket.io/**', (route) => { route.abort(); });
}

/**
 * Mock GET /api/web-ordering/search?q=pizza&limit=3
 * Returns the first 3 pizza results (for dropdown in home page SearchSection).
 */
async function mockSearchDropdown(page: import('@playwright/test').Page) {
  await page.route('**/api/web-ordering/search**', (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? 9);
    const pg = Number(url.searchParams.get('page') ?? 1);

    if (!q.trim()) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    const matching = PIZZA_RESULTS.filter((s) =>
      s.name.toLowerCase().includes(q.toLowerCase())
    );

    const start = (pg - 1) * limit;
    const slice = matching.slice(start, start + limit);

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: slice }),
    });
  });
}

// ── Test suites ────────────────────────────────────────────────────────────────

test.describe('Home page — search input', () => {
  test.beforeEach(async ({ page }) => {
    await installCommonMocks(page);
    await mockSearchDropdown(page);
    await page.goto('/');
  });

  test('search input is visible on the home page', async ({ page }) => {
    await expect(
      page.getByRole('searchbox', { name: /search for a store/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('typing "pizza" shows dropdown with up to 3 results after debounce', async ({ page }) => {
    const input = page.getByRole('searchbox', { name: /search for a store/i });
    await input.fill('pizza');

    // Dropdown appears with results
    await expect(page.getByRole('listbox', { name: /quick search results/i })).toBeVisible({ timeout: 5000 });

    // At most 3 items shown
    const items = page.getByRole('listbox').getByRole('option');
    const count = await items.count();
    expect(count).toBeLessThanOrEqual(3);
    expect(count).toBeGreaterThan(0);
  });

  test('dropdown shows "Pizza Palace" when searching "pizza"', async ({ page }) => {
    await page.getByRole('searchbox', { name: /search for a store/i }).fill('pizza');

    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pizza Palace')).toBeVisible();
  });

  test('pressing Enter navigates to /search?q=pizza', async ({ page }) => {
    const input = page.getByRole('searchbox', { name: /search for a store/i });
    await input.fill('pizza');
    await input.press('Enter');

    await page.waitForURL('**/search?q=pizza', { timeout: 10000 });
    expect(page.url()).toContain('/search?q=pizza');
  });

  test('empty search shows the idle hint text', async ({ page }) => {
    // Input is empty on load — idle hint should be visible
    await expect(
      page.getByText(/press enter or click a result/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('/search page — results grid', () => {
  test.beforeEach(async ({ page }) => {
    await installCommonMocks(page);
  });

  test('search page shows results grid for query "pizza"', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: PIZZA_RESULTS }),
      });
    });

    await page.goto('/search?q=pizza');

    // At least one store card must be visible
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pizza Palace')).toBeVisible();
  });

  test('search results page shows result count', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: PIZZA_RESULTS }),
      });
    });

    await page.goto('/search?q=pizza');

    // "3 results for "pizza""
    await expect(
      page.getByText(/\d+ results? for/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('clicking category filter "Restaurant" keeps only restaurant cards', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: PIZZA_RESULTS }),
      });
    });

    await page.goto('/search?q=pizza');
    await expect(page.getByText('Pizza Palace')).toBeVisible({ timeout: 10000 });

    // Click the "Restaurant" chip
    await page.getByRole('button', { name: 'Restaurant' }).click();

    // Restaurant items visible
    await expect(page.getByText('Pizza Palace')).toBeVisible();
    await expect(page.getByText('Pizza Hut Koramangala')).toBeVisible();

    // "Slice & Dice" is a cafe — should be hidden now
    await expect(page.getByText('Slice & Dice')).not.toBeVisible();
  });

  test('"Load more" button appends the next page', async ({ page }) => {
    // Return PAGE_SIZE (9) items on page 1 to trigger "Load more" visibility,
    // then 2 items on page 2
    const page1Items = Array.from({ length: 9 }, (_, i) => ({
      id: `store-${i}`,
      name: `Restaurant ${i + 1}`,
      slug: `restaurant-${i + 1}`,
      logo: null,
      storeType: 'restaurant',
      category: 'restaurant',
      address: `Address ${i + 1}`,
      isOpen: true,
      estimatedPrepMinutes: 15,
      rewardRules: { coinsEnabled: false, baseCashbackPercent: 0 },
    }));

    const page2Items = [
      {
        id: 'store-extra',
        name: 'Extra Spot',
        slug: 'extra-spot',
        logo: null,
        storeType: 'restaurant',
        category: 'restaurant',
        address: 'MG Road',
        isOpen: true,
        estimatedPrepMinutes: 10,
        rewardRules: { coinsEnabled: false, baseCashbackPercent: 0 },
      },
    ];

    let callCount = 0;
    await page.route('**/api/web-ordering/search**', (route) => {
      const items = callCount === 0 ? page1Items : page2Items;
      callCount += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: items }),
      });
    });

    await page.goto('/search?q=restaurant');

    // Wait for first batch
    await expect(page.getByText('Restaurant 1')).toBeVisible({ timeout: 10000 });

    // "Load more" button is present when PAGE_SIZE results returned
    await expect(page.getByRole('button', { name: /load more/i })).toBeVisible();
    await page.getByRole('button', { name: /load more/i }).click();

    // Second page result appears
    await expect(page.getByText('Extra Spot')).toBeVisible({ timeout: 8000 });
  });

  test('empty search string shows the idle hint', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/search');

    await expect(
      page.getByText(/start typing to search/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('zero-result search shows the "No stores found" empty state', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/search?q=xyzzynotastore');

    await expect(page.getByText(/no stores found/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/xyzzynotastore/)).toBeVisible();
  });

  test('clicking a StoreCard navigates to /[storeSlug]', async ({ page }) => {
    await page.route('**/api/web-ordering/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: PIZZA_RESULTS }),
      });
    });

    // Mock the store page so navigation succeeds without a real backend
    await page.route('**/api/web-ordering/store/pizza-palace', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            store: {
              id: 'store-p1',
              name: 'Pizza Palace',
              slug: 'pizza-palace',
              logo: null,
              banner: null,
              address: '12 MG Road, Bengaluru',
              phone: 'pizzapalace@upi',
              storeType: 'restaurant',
              hasMenu: true,
              isProgramMerchant: false,
              estimatedPrepMinutes: 20,
              gstEnabled: false,
              gstPercent: 0,
              isOpen: true,
              operatingHours: {},
              googlePlaceId: null,
              rewardRules: { baseCashbackPercent: 0, coinsEnabled: false },
              deliveryEnabled: false,
              deliveryRadiusKm: 0,
              deliveryFee: 0,
            },
            categories: [],
            promotions: [],
          },
        }),
      });
    });

    await page.goto('/search?q=pizza');

    // Wait for results and click the first store card's order button
    await expect(page.getByText('Pizza Palace')).toBeVisible({ timeout: 10000 });

    // Find the StoreCard article wrapping "Pizza Palace" and click its Order button
    const card = page.getByRole('article').filter({ hasText: 'Pizza Palace' }).first();
    await card.getByRole('button', { name: /order|open|view/i }).first().click();

    await page.waitForURL('**/pizza-palace', { timeout: 10000 });
    expect(page.url()).toContain('/pizza-palace');
  });
});
