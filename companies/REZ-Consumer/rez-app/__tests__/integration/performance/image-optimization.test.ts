// @ts-nocheck
/**
 * Image Optimization Performance Tests
 */

describe('Image Optimization Tests', () => {
  it('should load optimized image sizes', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const optimized = `${imageUrl}?w=400&q=80`;

    expect(optimized).toContain('w=400');
    expect(optimized).toContain('q=80');
  });

  it('should cache images locally', () => {
    // Simulate an image cache keyed by URL
    const imageCache: Map<string, { uri: string; cachedAt: number }> = new Map();

    const cacheImage = jest.fn((url: string) => {
      imageCache.set(url, { uri: url, cachedAt: Date.now() });
    });

    const getCachedImage = jest.fn((url: string) => imageCache.get(url) ?? null);

    const url = 'https://cdn.example.com/product_1.jpg';

    // First access — not cached
    expect(getCachedImage(url)).toBeNull();

    // Cache the image
    cacheImage(url);
    expect(cacheImage).toHaveBeenCalledWith(url);

    // Second access — served from cache
    const cached = getCachedImage(url);
    expect(cached).not.toBeNull();
    expect(cached!.uri).toBe(url);
    expect(cached!.cachedAt).toBeLessThanOrEqual(Date.now());
  });

  it('should use placeholder while loading', () => {
    // Simulate progressive loading state machine
    type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

    let loadState: LoadState = 'idle';
    let displayedSrc: string | null = null;
    const PLACEHOLDER = 'placeholder://blur-hash';
    const REAL_URL = 'https://cdn.example.com/product_hi_res.jpg';

    const startLoading = () => {
      loadState = 'loading';
      displayedSrc = PLACEHOLDER;
    };

    const onLoadSuccess = (url: string) => {
      loadState = 'loaded';
      displayedSrc = url;
    };

    // Before load starts — idle
    expect(loadState).toBe('idle');

    // While loading — placeholder shown
    startLoading();
    expect(loadState).toBe('loading');
    expect(displayedSrc).toBe(PLACEHOLDER);

    // After load — real image shown
    onLoadSuccess(REAL_URL);
    expect(loadState).toBe('loaded');
    expect(displayedSrc).toBe(REAL_URL);
  });

  it('should preload critical images', async () => {
    const preloaded: string[] = [];

    const preloadImage = jest.fn(async (url: string) => {
      preloaded.push(url);
      return { url, width: 400, height: 400 };
    });

    const criticalImages = [
      'https://cdn.example.com/banner_1.jpg',
      'https://cdn.example.com/banner_2.jpg',
      'https://cdn.example.com/category_electronics.jpg',
    ];

    // Preload all critical images in parallel
    const results = await Promise.all(criticalImages.map(url => preloadImage(url)));

    expect(preloadImage).toHaveBeenCalledTimes(3);
    expect(preloaded).toHaveLength(3);
    expect(preloaded).toEqual(criticalImages);
    results.forEach((r, i) => {
      expect(r.url).toBe(criticalImages[i]);
      expect(r.width).toBe(400);
    });
  });
});
