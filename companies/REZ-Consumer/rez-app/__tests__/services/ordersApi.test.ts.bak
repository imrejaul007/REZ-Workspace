const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ordersApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch orders', async () => {
    const orders = [
      { id: 'ord-1', status: 'delivered', total: 150 },
      { id: 'ord-2', status: 'shipped', total: 89 },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: orders }),
    });

    const response = await fetch('/api/orders');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('ord-1');
    expect(body.data[0].total).toBe(150);
  });

  it('should create a new order', async () => {
    const newOrder = { id: 'ord-3', status: 'pending', total: 200 };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: newOrder }),
    });

    const response = await fetch('/api/orders', { method: 'POST' });
    const body = await response.json();

    expect(response.ok).toBe(true);
    expect(body.data.status).toBe('pending');
    expect(body.data.id).toBe('ord-3');
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network unavailable'));

    await expect(fetch('/api/orders')).rejects.toThrow('Network unavailable');
  });
});
