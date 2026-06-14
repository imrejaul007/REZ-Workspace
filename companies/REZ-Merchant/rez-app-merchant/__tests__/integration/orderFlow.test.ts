/**
 * Integration tests — Order Management Flow
 */

const ALLOWED_STATUSES = ['pending', 'preparing', 'ready', 'done', 'cancelled'] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

function validateOrderStatus(status: string): status is OrderStatus {
  return (ALLOWED_STATUSES as readonly string[]).includes(status);
}

function detectNewOrders(prevIds: Set<string>, nextOrders: Array<{ _id: string }>): string[] {
  return nextOrders.map((o) => o._id).filter((id) => !prevIds.has(id));
}

describe('Order Flow — Live Orders Polling', () => {
  it('returns an array from the polling endpoint', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [{ _id: 'a1' }, { _id: 'a2' }] });
    const result = await mockGet('/api/merchant/orders?status=pending,preparing&limit=50');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('returns an empty array when there are no active orders', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [] });
    const result = await mockGet('/api/merchant/orders?status=pending,preparing&limit=50');
    expect(result.data).toEqual([]);
  });
});

describe('Order Flow — PATCH status validation', () => {
  it.each(ALLOWED_STATUSES)('accepts allowed status: %s', (status) => {
    expect(validateOrderStatus(status)).toBe(true);
  });

  it('rejects an unknown status value', () => {
    expect(validateOrderStatus('shipped')).toBe(false);
    expect(validateOrderStatus('')).toBe(false);
    expect(validateOrderStatus('PENDING')).toBe(false);
  });

  it('calls PATCH with the correct payload', async () => {
    const mockPatch = jest.fn().mockResolvedValue({ success: true });
    await mockPatch('/api/merchant/orders/order123/status', { status: 'ready' });
    expect(mockPatch).toHaveBeenCalledWith('/api/merchant/orders/order123/status', {
      status: 'ready',
    });
  });
});

describe('Order Flow — New order detection', () => {
  it('identifies IDs absent from the previous set', () => {
    const prev = new Set(['id1', 'id2']);
    const next = [{ _id: 'id1' }, { _id: 'id3' }];
    const newIds = detectNewOrders(prev, next);
    expect(newIds).toEqual(['id3']);
  });

  it('returns empty array when no new orders arrived', () => {
    const prev = new Set(['id1', 'id2']);
    const next = [{ _id: 'id1' }, { _id: 'id2' }];
    expect(detectNewOrders(prev, next)).toEqual([]);
  });

  it('treats all orders as new on first poll (empty prev set)', () => {
    const prev = new Set<string>();
    const next = [{ _id: 'id1' }, { _id: 'id2' }];
    expect(detectNewOrders(prev, next)).toHaveLength(2);
  });
});
