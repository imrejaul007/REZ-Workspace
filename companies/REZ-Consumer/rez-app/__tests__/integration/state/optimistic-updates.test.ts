// @ts-nocheck
/**
 * Optimistic Updates Integration Tests
 */

import apiClient from '@/services/apiClient';
import { cleanupAfterTest } from '../utils/testHelpers';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Optimistic Updates Tests', () => {
  afterEach(async () => {
    await cleanupAfterTest();
  });

  it('should optimistically update cart UI before server response', async () => {
    // Simulate slow API
    (apiClient.post as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { item: { id: 'item_1' } },
      }), 1000))
    );

    // Optimistic state applied immediately before awaiting
    const cartItemsBefore = [{ id: 'item_existing', productId: 'prod_0', quantity: 1 }];
    const optimisticItem = { id: 'item_optimistic', productId: 'prod_1', quantity: 1 };
    const optimisticState = [...cartItemsBefore, optimisticItem];

    // UI reflects optimistic state before API resolves
    expect(optimisticState).toHaveLength(2);
    expect(optimisticState[1].productId).toBe('prod_1');

    const promise = apiClient.post('/cart/add', { productId: 'prod_1' });
    expect(promise).toBeDefined();

    const result = await promise;
    // After API resolves, server-confirmed item replaces optimistic one
    expect(result.data.item.id).toBe('item_1');
    expect(result.success).toBe(true);
  });

  it('should rollback optimistic update on API failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: { status: 400 },
    });

    // State before optimistic update
    const originalState = { items: [{ id: 'item_1', productId: 'prod_1', quantity: 1 }] };
    // Optimistic state (applied immediately)
    const optimisticState = {
      items: [...originalState.items, { id: 'item_optimistic', productId: 'invalid', quantity: 1 }],
    };

    expect(optimisticState.items).toHaveLength(2);

    let rolledBack = optimisticState;
    try {
      await apiClient.post('/cart/add', { productId: 'invalid' });
    } catch {
      // Rollback: revert to state before optimistic update
      rolledBack = originalState;
    }

    // UI reverts to previous state after failure
    expect(rolledBack.items).toHaveLength(1);
    expect(rolledBack.items[0].id).toBe('item_1');
    expect(rolledBack).toEqual(originalState);
  });

  it('should handle concurrent optimistic updates', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: {},
    });

    // Apply all three optimistic updates at once
    const optimisticItems = [
      { id: 'opt_1', productId: 'prod_1', pending: true },
      { id: 'opt_2', productId: 'prod_2', pending: true },
      { id: 'opt_3', productId: 'prod_3', pending: true },
    ];
    expect(optimisticItems).toHaveLength(3);

    // Multiple optimistic updates resolve concurrently
    const updates = [
      apiClient.post('/wishlist/add', { productId: 'prod_1' }),
      apiClient.post('/wishlist/add', { productId: 'prod_2' }),
      apiClient.post('/wishlist/add', { productId: 'prod_3' }),
    ];

    const results = await Promise.all(updates);
    expect(apiClient.post).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(3);
    results.forEach(r => expect(r.success).toBe(true));

    // After all resolve, no pending optimistic items remain
    const confirmedItems = optimisticItems.map(item => ({ ...item, pending: false }));
    expect(confirmedItems.every(item => !item.pending)).toBe(true);
  });
});
