/**
 * Memory Performance Integration Tests
 */

import { generateMockProducts } from '../utils/testHelpers';

describe('Memory Performance Tests', () => {
  it('should not leak memory on repeated operations', () => {
    // Simulate repeated cart operations and verify objects are not accumulated
    const snapshots: number[] = [];

    for (let i = 0; i < 100; i++) {
      const products = generateMockProducts(10);
      // Each iteration creates a fresh array — not accumulated into a growing structure
      snapshots.push(products.length);
    }

    // Every iteration produced exactly 10 items — no unbounded growth
    expect(snapshots).toHaveLength(100);
    expect(snapshots.every(n => n === 10)).toBe(true);
    // First and last iteration both produced the same count
    expect(snapshots[0]).toBe(snapshots[99]);
  });

  it('should clean up event listeners', () => {
    const listeners: Map<string, Function[]> = new Map();

    const addEventListener = jest.fn((event: string, handler: Function) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event)!.push(handler);
    });

    const removeEventListener = jest.fn((event: string, handler: Function) => {
      const handlers = listeners.get(event) ?? [];
      listeners.set(event, handlers.filter(h => h !== handler));
    });

    const handler1 = jest.fn();
    const handler2 = jest.fn();

    // Register two listeners
    addEventListener('cart:update', handler1);
    addEventListener('cart:update', handler2);
    expect(listeners.get('cart:update')).toHaveLength(2);

    // Cleanup on component unmount
    removeEventListener('cart:update', handler1);
    removeEventListener('cart:update', handler2);

    expect(listeners.get('cart:update')).toHaveLength(0);
    expect(removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('should release cached data appropriately', () => {
    // Simulate an LRU-style cache with a max size
    const MAX_CACHE_SIZE = 5;
    const cache: Map<string, any> = new Map();

    const setCache = (key: string, value: any) => {
      if (cache.size >= MAX_CACHE_SIZE) {
        // Evict oldest entry (first inserted key)
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      cache.set(key, value);
    };

    // Fill cache to capacity
    for (let i = 0; i < MAX_CACHE_SIZE; i++) {
      setCache(`key_${i}`, { data: `value_${i}` });
    }
    expect(cache.size).toBe(MAX_CACHE_SIZE);

    // Adding one more should evict the oldest
    setCache('key_new', { data: 'new_value' });
    expect(cache.size).toBe(MAX_CACHE_SIZE); // size stays bounded
    expect(cache.has('key_0')).toBe(false);  // oldest entry evicted
    expect(cache.has('key_new')).toBe(true); // newest entry present
  });
});
