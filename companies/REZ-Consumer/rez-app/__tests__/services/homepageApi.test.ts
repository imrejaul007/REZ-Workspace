// @ts-nocheck
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('homepageApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch homepage data', async () => {
    const homepageData = {
      banners: [{ id: 'b1', imageUrl: 'https://example.com/banner.jpg', link: '/sale' }],
      featuredOffers: [{ id: 'o1', title: 'Flash Sale', discount: 30 }],
      categories: ['fashion', 'electronics', 'food'],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: homepageData }),
    });

    const response = await fetch('/api/homepage');
    const body = await response.json();

    expect(body.data.banners).toHaveLength(1);
    expect(body.data.featuredOffers).toHaveLength(1);
    expect(body.data.categories).toContain('fashion');
  });

  it('should fetch homepage banners', async () => {
    const banners = [
      { id: 'b1', imageUrl: 'https://example.com/b1.jpg' },
      { id: 'b2', imageUrl: 'https://example.com/b2.jpg' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: banners }),
    });

    const response = await fetch('/api/homepage/banners');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('b1');
  });

  it('should handle homepage fetch failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const response = await fetch('/api/homepage');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });
});
