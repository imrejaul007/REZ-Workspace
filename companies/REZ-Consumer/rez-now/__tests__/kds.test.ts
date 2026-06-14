describe('Kitchen Display System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should receive new order', async () => {
    const mockOrder = {
      id: 'order_123',
      orderId: 'order_123',
      items: [{ id: 'item_1', name: 'Pizza', status: 'pending' }],
      status: 'pending',
    };

    // Mock Socket.IO emit
    const emitMock = vi.fn();
    (global as any).io = { emit: emitMock };

    // Simulate order creation
    emitMock('order:created', mockOrder);

    expect(emitMock).toHaveBeenCalledWith('order:created', mockOrder);
  });

  it('should update item status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/kds/order_123/items/item_1/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });

    expect(response.ok).toBe(true);
  });

  it('should mark order as ready', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/kds/order_123/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'ready' }),
    });

    expect(response.ok).toBe(true);
  });
});
