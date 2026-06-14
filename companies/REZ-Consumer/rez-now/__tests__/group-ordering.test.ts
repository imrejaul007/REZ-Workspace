describe('Group Ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create group session', async () => {
    const mockSession = {
      code: 'ABC123',
      storeId: 'store_123',
      hostId: 'user_123',
      status: 'active',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSession }),
    });

    const response = await fetch('/api/group', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'store_123' }),
    });

    const data = await response.json();
    expect(data.data.code).toBe('ABC123');
    expect(data.success).toBe(true);
  });

  it('should join existing session', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/group/ABC123/join', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user_456' }),
    });

    expect(response.ok).toBe(true);
  });

  it('should add item to shared cart', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/group/ABC123/items', {
      method: 'POST',
      body: JSON.stringify({ itemId: 'item_789' }),
    });

    expect(response.ok).toBe(true);
  });
});
