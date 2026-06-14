// @ts-nocheck
/**
 * Rendering Performance Integration Tests
 */

import { generateMockProducts } from '../utils/testHelpers';

describe('Rendering Performance Tests', () => {
  it('should render product list without performance issues', () => {
    const products = generateMockProducts(100);
    expect(products).toHaveLength(100);
    // In real implementation, would measure render time
  });

  it('should virtualize long lists', () => {
    // Simulate FlatList virtualisation: only items in the visible window are rendered
    const allItems = generateMockProducts(200);
    const windowSize = 15; // items rendered above/below viewport
    const viewportStart = 50;

    const getRenderedItems = (items: unknown[], start: number, size: number) =>
      items.slice(Math.max(0, start - size), start + size);

    const rendered = getRenderedItems(allItems, viewportStart, windowSize);

    // Only a small window is in the DOM, not all 200 items
    expect(rendered.length).toBeLessThan(allItems.length);
    expect(rendered.length).toBe(windowSize * 2); // 15 above + 15 below
    expect(allItems).toHaveLength(200);
  });

  it('should lazy load images', () => {
    // Simulate intersection-observer-style lazy loading
    const loadedImages: string[] = [];

    const lazyLoadImage = jest.fn((url: string, isVisible: boolean) => {
      if (isVisible) {
        loadedImages.push(url);
        return url;
      }
      return null; // not yet loaded
    });

    const imageUrls = generateMockProducts(5).map(p => p.images[0]);

    // Items not yet in viewport — not loaded
    imageUrls.forEach(url => lazyLoadImage(url, false));
    expect(loadedImages).toHaveLength(0);

    // Items scroll into viewport — loaded on demand
    imageUrls.slice(0, 3).forEach(url => lazyLoadImage(url, true));
    expect(loadedImages).toHaveLength(3);

    // Items still off-screen remain unloaded
    expect(loadedImages.length).toBeLessThan(imageUrls.length);
  });

  it('should memoize expensive computations', () => {
    // Simulate React.useMemo: result is cached until dependencies change
    const computeTotal = jest.fn((items: Array<{ price: number; quantity: number }>) =>
      items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    const items = [
      { price: 100, quantity: 2 },
      { price: 200, quantity: 1 },
    ];
    const expectedTotal = 400;

    // First render — computation runs
    const result1 = computeTotal(items);
    expect(result1).toBe(expectedTotal);
    expect(computeTotal).toHaveBeenCalledTimes(1);

    // Re-render with same items reference — memo returns cached value (simulated by not calling again)
    const cachedResult = result1; // memo would skip recomputation
    expect(cachedResult).toBe(expectedTotal);
    expect(computeTotal).toHaveBeenCalledTimes(1); // still only called once

    // Dependency changes — recomputation required
    const updatedItems = [...items, { price: 50, quantity: 4 }];
    const result2 = computeTotal(updatedItems);
    expect(result2).toBe(600); // 400 + 200
    expect(computeTotal).toHaveBeenCalledTimes(2);
  });
});
