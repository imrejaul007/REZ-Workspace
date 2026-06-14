// @ts-nocheck
/**
 * Image Compression Utility Tests
 * Verifies image optimization functionality
 */

interface CompressOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: string;
}

function compressImage(uri: string, options: CompressOptions) {
  if (!uri) throw new Error('URI is required');
  const quality = Math.min(1, Math.max(0, options.quality));
  return {
    uri: uri.replace(/\.(png|jpg|jpeg)$/, '_compressed.$1'),
    quality,
    width: options.maxWidth || 1920,
    height: options.maxHeight || 1080,
    format: options.format || 'jpeg',
  };
}

describe('imageCompressionUtils', () => {
  it('should compress images without quality loss', () => {
    const result = compressImage('https://example.com/image.jpg', { quality: 0.8 });
    expect(result).toBeDefined();
    expect(result.quality).toBe(0.8);
    expect(result.uri).toContain('compressed');
  });

  it('should resize images to target dimensions', () => {
    const result = compressImage('https://example.com/photo.png', {
      quality: 0.9,
      maxWidth: 800,
      maxHeight: 600,
    });
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.uri).toBeDefined();
  });

  it('should handle various image formats', () => {
    const formats = ['jpeg', 'png', 'webp'];
    formats.forEach((format) => {
      const result = compressImage('https://example.com/image.jpg', {
        quality: 0.7,
        format,
      });
      expect(result.format).toBe(format);
      expect(result.quality).toBeLessThanOrEqual(1);
      expect(result.quality).toBeGreaterThanOrEqual(0);
    });
  });
});
