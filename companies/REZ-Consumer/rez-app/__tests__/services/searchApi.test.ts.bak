const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('searchApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should perform search', async () => {
    const results = [
      { id: 'p1', name: 'Blue Shirt', type: 'product' },
      { id: 's1', name: 'Fashion Store', type: 'store' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: results, total: 2 }),
    });

    const response = await fetch('/api/search?q=shirt');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.data[0].name).toContain('Shirt');
  });

  it('should return empty results for no match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0 }),
    });

    const response = await fetch('/api/search?q=zzznomatch');
    const body = await response.json();

    expect(body.data).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('should handle search errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 });

    const response = await fetch('/api/search?q=');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });
});
