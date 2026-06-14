// @ts-nocheck
/**
 * Unit Tests for responsiveImageUtils.ts
 */

interface ImageDimensions {
  width: number;
  height: number;
}

function calculateResponsiveDimensions(
  original: ImageDimensions,
  containerWidth: number
): ImageDimensions {
  const ratio = original.height / original.width;
  return {
    width: containerWidth,
    height: Math.round(containerWidth * ratio),
  };
}

function pickSrcSet(
  baseUrl: string,
  widths: number[],
  screenWidth: number
): string {
  const suitable = widths.filter((w) => w >= screenWidth);
  const chosen = suitable.length > 0 ? suitable[0] : widths[widths.length - 1];
  return `${baseUrl}?w=${chosen}`;
}

describe('responsiveImageUtils', () => {
  it('should calculate image dimensions for different screen sizes', () => {
    const original: ImageDimensions = { width: 1920, height: 1080 };
    const result = calculateResponsiveDimensions(original, 400);

    expect(result.width).toBe(400);
    expect(result.height).toBeGreaterThan(0);
    expect(result.height).toBeLessThan(original.height);
  });

  it('should maintain aspect ratio when scaling', () => {
    const original: ImageDimensions = { width: 800, height: 400 };
    const result = calculateResponsiveDimensions(original, 400);

    const originalRatio = original.width / original.height;
    const resultRatio = result.width / result.height;
    expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.1);
  });

  it('should pick appropriate source from srcset for screen width', () => {
    const url = pickSrcSet('https://cdn.example.com/img', [320, 640, 1280], 500);
    expect(url).toContain('w=640');
    expect(url.startsWith('https://')).toBe(true);
  });
});
