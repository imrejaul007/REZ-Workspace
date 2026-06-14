const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('offersApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch offers', async () => {
    const offers = [
      { id: 'off-1', title: 'Summer Sale', discount: 20, category: 'fashion' },
      { id: 'off-2', title: 'Tech Deals', discount: 15, category: 'electronics' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: offers }),
    });

    const response = await fetch('/api/offers');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].title).toBe('Summer Sale');
    expect(body.data[0].discount).toBe(20);
  });

  it('should fetch offers by category', async () => {
    const fashionOffers = [{ id: 'off-1', title: 'Summer Sale', discount: 20, category: 'fashion' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: fashionOffers }),
    });

    const response = await fetch('/api/offers?category=fashion');
    const body = await response.json();

    expect(body.data[0].category).toBe('fashion');
    expect(mockFetch).toHaveBeenCalledWith('/api/offers?category=fashion');
  });

  it('should return empty array when no offers found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const response = await fetch('/api/offers?category=nonexistent');
    const body = await response.json();

    expect(body.data).toHaveLength(0);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
