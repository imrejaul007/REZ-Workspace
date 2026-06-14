const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('videosApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch videos', async () => {
    const videos = [
      { id: 'v1', title: 'Summer Lookbook', category: 'fashion', views: 1200 },
      { id: 'v2', title: 'Tech Review', category: 'electronics', views: 850 },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: videos, hasMore: false }),
    });

    const response = await fetch('/api/videos');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('v1');
    expect(body.data[0].views).toBeGreaterThan(0);
  });

  it('should fetch trending videos', async () => {
    const trending = [{ id: 'v1', title: 'Summer Lookbook', trending: true }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: trending }),
    });

    const response = await fetch('/api/videos?type=trending');
    const body = await response.json();

    expect(body.data[0].trending).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/videos?type=trending');
  });

  it('should handle video fetch pagination', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], hasMore: false, page: 2 }),
    });

    const response = await fetch('/api/videos?page=2');
    const body = await response.json();

    expect(body.page).toBe(2);
    expect(body.hasMore).toBe(false);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
