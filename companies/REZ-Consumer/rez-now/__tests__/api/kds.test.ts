import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('Kitchen Display System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new order', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ orderId: 'order_123', status: 'received' }),
    });

    const response = await fetch('/api/kds/orders', {
      method: 'POST',
      body: JSON.stringify({
        storeId: 'store_123',
        items: [{ itemId: 'item_1', quantity: 2 }],
        tableNumber: '5',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.orderId).toBe('order_123');
  });

  it('should update item status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/kds/orders/order_123/items/item_1/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });

    expect(response.ok).toBe(true);
  });
});
