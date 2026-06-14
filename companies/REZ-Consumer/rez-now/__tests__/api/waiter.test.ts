/**
 * Tests for rez-now/lib/api/waiter.ts
 *
 * Strategy:
 * - Mock `@/lib/api/client` so publicClient.post / publicClient.get are jest.fn().
 * - Verify callWaiter posts to the correct endpoint and maps requestId from
 *   both response shapes (data.data.requestId and data.requestId).
 * - Verify callWaiter throws when data.success is false.
 * - Verify getWaiterCallStatus normalises the status field from both shapes.
 */

jest.mock('@/lib/api/client', () => ({
  publicClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import { callWaiter, getWaiterCallStatus } from '@/lib/api/waiter';
import { publicClient } from '@/lib/api/client';

const postMock = publicClient.post as jest.Mock;
const getMock = publicClient.get as jest.Mock;

// ── callWaiter ────────────────────────────────────────────────────────────────

describe('callWaiter', () => {
  it('posts to /api/web-ordering/waiter/call', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, requestId: 'req-001' },
    });

    await callWaiter('my-store', '4');

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      '/api/web-ordering/waiter/call',
      expect.objectContaining({ storeSlug: 'my-store', tableNumber: '4' }),
    );
  });

  it('includes reason in the payload when provided', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, requestId: 'req-002' },
    });

    await callWaiter('my-store', '7', 'Need the bill');

    expect(postMock).toHaveBeenCalledWith(
      '/api/web-ordering/waiter/call',
      expect.objectContaining({ reason: 'Need the bill' }),
    );
  });

  it('omits reason from the payload when not provided', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, requestId: 'req-003' },
    });

    await callWaiter('my-store', '2');

    expect(postMock).toHaveBeenCalledWith(
      '/api/web-ordering/waiter/call',
      expect.not.objectContaining({ reason: expect.anything() }),
    );
  });

  it('maps requestId from data.requestId (flat response shape)', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, requestId: 'flat-id-123' },
    });

    const result = await callWaiter('store-a', '1');
    expect(result.requestId).toBe('flat-id-123');
    expect(result.success).toBe(true);
  });

  it('maps requestId from data.data.requestId (nested response shape)', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, data: { requestId: 'nested-id-456' } },
    });

    const result = await callWaiter('store-b', '3');
    expect(result.requestId).toBe('nested-id-456');
  });

  it('prefers data.data.requestId over data.requestId when both are present', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        requestId: 'flat-fallback',
        data: { requestId: 'nested-wins' },
      },
    });

    const result = await callWaiter('store-c', '5');
    expect(result.requestId).toBe('nested-wins');
  });

  it('returns empty string for requestId when neither field is present', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true },
    });

    const result = await callWaiter('store-d', '6');
    expect(result.requestId).toBe('');
  });

  it('throws when data.success is false', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: false, message: 'Table not found' },
    });

    await expect(callWaiter('store-e', '99')).rejects.toThrow('Table not found');
  });

  it('throws with default message when data.success is false and message is absent', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: false },
    });

    await expect(callWaiter('store-f', '8')).rejects.toThrow('Failed to call waiter');
  });

  it('propagates network errors from publicClient.post', async () => {
    postMock.mockRejectedValueOnce(new Error('Network error'));
    await expect(callWaiter('store-g', '2')).rejects.toThrow('Network error');
  });
});

// ── getWaiterCallStatus ───────────────────────────────────────────────────────

describe('getWaiterCallStatus', () => {
  it('calls GET /api/web-ordering/waiter/call/:requestId/status', async () => {
    getMock.mockResolvedValueOnce({
      data: { status: 'pending' },
    });

    await getWaiterCallStatus('req-777');

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      '/api/web-ordering/waiter/call/req-777/status',
    );
  });

  it('URL-encodes the requestId', async () => {
    getMock.mockResolvedValueOnce({ data: { status: 'acknowledged' } });

    await getWaiterCallStatus('req id with spaces');

    expect(getMock).toHaveBeenCalledWith(
      '/api/web-ordering/waiter/call/req%20id%20with%20spaces/status',
    );
  });

  it('returns status from flat data.status', async () => {
    getMock.mockResolvedValueOnce({ data: { status: 'acknowledged' } });
    const result = await getWaiterCallStatus('req-1');
    expect(result.status).toBe('acknowledged');
  });

  it('returns status from nested data.data.status', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { status: 'resolved' } } });
    const result = await getWaiterCallStatus('req-2');
    expect(result.status).toBe('resolved');
  });

  it('defaults to "pending" when status is absent from response', async () => {
    getMock.mockResolvedValueOnce({ data: {} });
    const result = await getWaiterCallStatus('req-3');
    expect(result.status).toBe('pending');
  });
});
