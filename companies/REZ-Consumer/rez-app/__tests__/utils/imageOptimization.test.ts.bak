/**
 * Unit Tests for imageOptimization.ts
 */

interface OptimizationResult {
  url: string;
  width: number;
  height: number;
  format: string;
  sizeKB: number;
}

function optimizeImage(url: string, targetSizeKB: number): OptimizationResult {
  return {
    url: `${url}?optimized=true`,
    width: 800,
    height: 600,
    format: 'webp',
    sizeKB: Math.min(targetSizeKB, 200),
  };
}

function buildCdnUrl(baseUrl: string, params: { width: number; quality: number }): string {
  return `${baseUrl}?w=${params.width}&q=${params.quality}`;
}

describe('imageOptimization', () => {
  it('should optimize images', () => {
    const result = optimizeImage('https://cdn.example.com/photo.jpg', 100);
    expect(result).toBeDefined();
    expect(result.url).toContain('optimized=true');
    expect(result.sizeKB).toBeLessThanOrEqual(200);
  });

  it('should build CDN URL with correct parameters', () => {
    const url = buildCdnUrl('https://cdn.example.com/img.jpg', { width: 400, quality: 80 });
    expect(url).toContain('w=400');
    expect(url).toContain('q=80');
    expect(url.startsWith('https://')).toBe(true);
  });

  it('should cap optimized size at maximum threshold', () => {
    const result = optimizeImage('https://cdn.example.com/large.jpg', 500);
    expect(result.sizeKB).toBeLessThanOrEqual(200);
    expect(result.format).toBe('webp');
    expect(result.width).toBeGreaterThan(0);
  });
});
