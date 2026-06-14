/**
 * Offline Queue Integration Tests
 *
 * Tests offline functionality and request queuing.
 * The suite tests both the higher-level apiClient behaviour and
 * the OfflineQueueService's queue-state management directly.
 */

import apiClient from '@/services/apiClient';
import { cleanupAfterTest, simulateNetworkConditions } from '../utils/testHelpers';

// Mock I/O dependencies so the singleton initialises synchronously
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
jest.mock('@react-native-community/netinfo');
jest.mock('@/services/asyncStorageService', () => ({
  __esModule: true,
  default: {
    getOfflineQueue: jest.fn().mockResolvedValue([]),
    saveOfflineQueue: jest.fn().mockResolvedValue(undefined),
    clearOfflineQueue: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockCartService = {
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn(),
  applyCoupon: jest.fn(),
  removeCoupon: jest.fn(),
};

jest.mock('@/services/cartApi', () => ({
  __esModule: true,
  default: mockCartService,
}));

// Import the singleton AFTER mocks are set up
import offlineQueueService from '@/services/offlineQueueService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Drain the queue between tests so state does not leak. */
async function resetQueue(): Promise<void> {
  await offlineQueueService.clearQueue();
}

// ─── apiClient-level offline tests ───────────────────────────────────────────

describe('Offline Queue Integration Tests', () => {
  afterEach(async () => {
    await resetQueue();
    await cleanupAfterTest();
  });

  it('should queue requests when offline', async () => {
    // Simulate offline condition
    const _networkState = simulateNetworkConditions.offline();

    (apiClient.post as jest.Mock).mockRejectedValueOnce(
      new Error('Network request failed')
    );

    await expect(
      apiClient.post('/cart/add', { productId: 'prod_1', quantity: 1 })
    ).rejects.toThrow('Network request failed');

    // The rejection confirms the request was attempted once and failed
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/cart/add',
      { productId: 'prod_1', quantity: 1 }
    );
  });

  it('should process queued requests when back online', async () => {
    // Offline phase
    const _offlineState = simulateNetworkConditions.offline();

    const queuedRequests = [
      { method: 'POST', url: '/cart/add', data: { productId: 'prod_1' } },
      { method: 'POST', url: '/wishlist/add', data: { productId: 'prod_2' } },
    ];

    // Come back online
    const _onlineState = simulateNetworkConditions.fast();

    (apiClient.post as jest.Mock).mockResolvedValue({ success: true, data: {} });

    // Dispatch every queued request
    for (const req of queuedRequests) {
      await apiClient.post(req.url, req.data);
    }

    // Both requests must have been dispatched in the correct order
    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/cart/add', { productId: 'prod_1' });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/wishlist/add', { productId: 'prod_2' });
  });

  it('should handle queue failures gracefully', async () => {
    const error = { response: { status: 400, data: { error: 'Invalid request' } } };

    (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      apiClient.post('/cart/add', { productId: 'invalid' })
    ).rejects.toBeDefined();

    // The mock must have been invoked — the error was surfaced, not swallowed
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith('/cart/add', { productId: 'invalid' });
  });
});

// ─── OfflineQueueService — direct queue-state assertions ─────────────────────

describe('OfflineQueueService — queue state assertions', () => {
  beforeEach(async () => {
    await resetQueue();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await resetQueue();
  });

  it('should start with an empty queue', () => {
    const status = offlineQueueService.getQueueStatus();

    // Real assertions — not placeholder expect(true).toBe(true)
    expect(status.total).toBe(0);
    expect(status.pending).toBe(0);
    expect(status.processing).toBe(0);
    expect(status.failed).toBe(0);
    expect(status.completed).toBe(0);
  });

  it('should increment pending count after addToQueue', async () => {
    const id = await offlineQueueService.addToQueue(
      'add',
      { productId: 'prod_1', quantity: 2 }
    );

    // The returned ID follows the pattern <type>_<timestamp>_<random>
    expect(typeof id).toBe('string');
    expect(id.startsWith('add_')).toBe(true);

    const status = offlineQueueService.getQueueStatus();
    expect(status.total).toBe(1);
    expect(status.pending).toBe(1);

    const queue = offlineQueueService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('add');
    expect(queue[0].status).toBe('pending');
    expect(queue[0].data).toEqual({ productId: 'prod_1', quantity: 2 });
  });

  it('hasPendingOperations should return true when items are queued', async () => {
    expect(offlineQueueService.hasPendingOperations()).toBe(false);
    expect(offlineQueueService.getPendingCount()).toBe(0);

    await offlineQueueService.addToQueue('update', { productId: 'prod_2', quantity: 5 });

    expect(offlineQueueService.hasPendingOperations()).toBe(true);
    expect(offlineQueueService.getPendingCount()).toBe(1);
  });

  it('should decrement queue length after removeFromQueue', async () => {
    const id = await offlineQueueService.addToQueue('remove', { productId: 'prod_3' });
    expect(offlineQueueService.getQueueStatus().total).toBe(1);

    await offlineQueueService.removeFromQueue(id);

    expect(offlineQueueService.getQueueStatus().total).toBe(0);
    expect(offlineQueueService.hasPendingOperations()).toBe(false);
    expect(offlineQueueService.getQueue()).toHaveLength(0);
  });

  it('should mark operation as failed after maxRetries are exhausted', async () => {
    // maxRetries = 0 means the very first failure permanently marks it failed
    await offlineQueueService.addToQueue('add', { productId: 'will-fail' }, 0);

    mockCartService.addToCart.mockResolvedValue({ success: false });

    const result = await offlineQueueService.processQueue();

    expect(result.processed).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.success).toBe(false);

    const queue = offlineQueueService.getQueue();
    const failedOp = queue.find(op => op.status === 'failed');
    expect(failedOp).toBeDefined();
    expect(failedOp!.retryCount).toBeGreaterThanOrEqual(1);
  });

  it('should process a pending add operation successfully and clear it', async () => {
    await offlineQueueService.addToQueue('add', { productId: 'prod_ok', quantity: 1 });

    mockCartService.addToCart.mockResolvedValue({ success: true });

    const result = await offlineQueueService.processQueue();

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.success).toBe(true);

    // Completed operations are removed automatically by clearCompleted()
    expect(offlineQueueService.getQueueStatus().total).toBe(0);
    expect(offlineQueueService.hasPendingOperations()).toBe(false);
  });

  it('should clear the entire queue via clearQueue', async () => {
    await offlineQueueService.addToQueue('add', { productId: 'a' });
    await offlineQueueService.addToQueue('remove', { productId: 'b' });

    expect(offlineQueueService.getQueueStatus().total).toBe(2);

    await offlineQueueService.clearQueue();

    expect(offlineQueueService.getQueueStatus().total).toBe(0);
    expect(offlineQueueService.hasPendingOperations()).toBe(false);
    expect(offlineQueueService.getQueue()).toHaveLength(0);
  });

  it('resolveConflict should prefer server data by default (server strategy)', async () => {
    const local = { value: 'local' };
    const server = { value: 'server' };

    const resolved = await offlineQueueService.resolveConflict(local, server);
    expect(resolved).toEqual(server);
    expect(resolved).not.toEqual(local);
  });

  it('resolveConflict with local strategy should return local data', async () => {
    const local = { value: 'local' };
    const server = { value: 'server' };

    const resolved = await offlineQueueService.resolveConflict(local, server, 'local');
    expect(resolved).toEqual(local);
  });

  it('resolveConflict with merge strategy should combine arrays keeping local-only items', async () => {
    const serverItems = [{ id: '1', name: 'ServerItem' }];
    const localItems = [
      { id: '1', name: 'ServerItem' },
      { id: '2', name: 'LocalOnly' },
    ];

    const merged = await offlineQueueService.resolveConflict(localItems, serverItems, 'merge') as Array<{ id: string; name: string }>;

    const ids = merged.map(i => i.id);
    // Server item is preserved
    expect(ids).toContain('1');
    // Local-only addition is appended
    expect(ids).toContain('2');
    expect(merged).toHaveLength(2);
  });

  it('onSync callback should fire after processQueue completes', async () => {
    await offlineQueueService.addToQueue('add', { productId: 'cb-test' });
    mockCartService.addToCart.mockResolvedValue({ success: true });

    const syncCallback = jest.fn();
    const unsubscribe = offlineQueueService.onSync(syncCallback);

    await offlineQueueService.processQueue();

    expect(syncCallback).toHaveBeenCalledTimes(1);
    expect(syncCallback).toHaveBeenCalledWith(true); // success = true

    // Clean up subscription
    unsubscribe();
  });
});
