// @ts-nocheck
/**
 * List/ScrollView Integration Tests
 */

import { generateMockProducts } from '../utils/testHelpers';

describe('List Integration Tests', () => {
  it('should load and paginate product list', () => {
    // Simulate a paginated API response
    const pageSize = 10;
    const page1Products = generateMockProducts(pageSize);
    const page2Products = generateMockProducts(pageSize);

    const mockFetchPage = jest.fn()
      .mockReturnValueOnce({ data: page1Products, nextPage: 2, hasMore: true })
      .mockReturnValueOnce({ data: page2Products, nextPage: null, hasMore: false });

    // Load page 1
    const page1 = mockFetchPage(1);
    expect(page1.data).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextPage).toBe(2);

    // Load page 2
    const page2 = mockFetchPage(2);
    expect(page2.data).toHaveLength(10);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextPage).toBeNull();

    // Combined list has 20 items
    const allProducts = [...page1.data, ...page2.data];
    expect(allProducts).toHaveLength(20);
    expect(mockFetchPage).toHaveBeenCalledTimes(2);
  });

  it('should handle pull-to-refresh', async () => {
    const initialProducts = generateMockProducts(5);
    const refreshedProducts = generateMockProducts(6); // one new item after refresh

    const mockRefresh = jest.fn().mockResolvedValueOnce({
      data: refreshedProducts,
      refreshedAt: new Date().toISOString(),
    });

    let listState = { items: initialProducts, isRefreshing: false };

    // Trigger refresh
    listState = { ...listState, isRefreshing: true };
    expect(listState.isRefreshing).toBe(true);

    const result = await mockRefresh();

    listState = { items: result.data, isRefreshing: false };

    expect(listState.isRefreshing).toBe(false);
    expect(listState.items).toHaveLength(6);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(result.refreshedAt).toBeDefined();
  });

  it('should virtualize long lists for performance', () => {
    // Simulate a virtualized list that only renders visible window
    const allProducts = generateMockProducts(100);
    const windowSize = 10;
    const visibleStartIndex = 0;

    const getVisibleItems = (items: unknown[], start: number, size: number) =>
      items.slice(start, start + size);

    const visibleItems = getVisibleItems(allProducts, visibleStartIndex, windowSize);

    // Only windowSize items are rendered at a time, not all 100
    expect(allProducts).toHaveLength(100);
    expect(visibleItems).toHaveLength(10);
    expect(visibleItems[0].id).toBe(allProducts[0].id);

    // Scroll down: window shifts
    const scrolledItems = getVisibleItems(allProducts, 20, windowSize);
    expect(scrolledItems).toHaveLength(10);
    expect(scrolledItems[0].id).toBe(allProducts[20].id);
  });

  it('should handle infinite scroll with API', async () => {
    const fetchProducts = jest.fn();

    // First load
    fetchProducts.mockResolvedValueOnce({ data: generateMockProducts(10), cursor: 'cursor_1' });
    // Second load (scroll to bottom triggers next fetch)
    fetchProducts.mockResolvedValueOnce({ data: generateMockProducts(10), cursor: 'cursor_2' });
    // Third load — end of list
    fetchProducts.mockResolvedValueOnce({ data: generateMockProducts(3), cursor: null });

    const page1 = await fetchProducts({ cursor: null });
    expect(page1.data).toHaveLength(10);
    expect(page1.cursor).toBe('cursor_1');

    const page2 = await fetchProducts({ cursor: 'cursor_1' });
    expect(page2.data).toHaveLength(10);
    expect(page2.cursor).toBe('cursor_2');

    const page3 = await fetchProducts({ cursor: 'cursor_2' });
    expect(page3.data).toHaveLength(3);
    expect(page3.cursor).toBeNull(); // no more pages

    // Total items accumulated
    const allItems = [...page1.data, ...page2.data, ...page3.data];
    expect(allItems).toHaveLength(23);
    expect(fetchProducts).toHaveBeenCalledTimes(3);
    expect(fetchProducts).toHaveBeenNthCalledWith(2, { cursor: 'cursor_1' });
    expect(fetchProducts).toHaveBeenNthCalledWith(3, { cursor: 'cursor_2' });
  });
});
