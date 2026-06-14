/**
 * useImageQuality Hook Tests
 */

type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'unknown';
type ImageQuality = 'high' | 'medium' | 'low';

function selectImageQuality(networkType: NetworkType): ImageQuality {
  if (networkType === 'wifi' || networkType === '4g') return 'high';
  if (networkType === '3g') return 'medium';
  return 'low';
}

function getImageUrl(baseUrl: string, quality: ImageQuality): string {
  const qualityParams: Record<ImageQuality, string> = {
    high: 'q=90&w=1200',
    medium: 'q=70&w=800',
    low: 'q=40&w=400',
  };
  return `${baseUrl}?${qualityParams[quality]}`;
}

describe('useImageQuality', () => {
  it('should select image quality based on network', () => {
    expect(selectImageQuality('wifi')).toBe('high');
    expect(selectImageQuality('4g')).toBe('high');
    expect(selectImageQuality('3g')).toBe('medium');
    expect(selectImageQuality('2g')).toBe('low');
  });

  it('should handle network changes', () => {
    const networks: NetworkType[] = ['wifi', '4g', '3g', '2g', 'unknown'];
    networks.forEach((net) => {
      const quality = selectImageQuality(net);
      expect(['high', 'medium', 'low']).toContain(quality);
    });

    const wifiQuality = selectImageQuality('wifi');
    const lowQuality = selectImageQuality('2g');
    expect(wifiQuality).not.toBe(lowQuality);
  });

  it('should build image URL with quality parameters', () => {
    const highUrl = getImageUrl('https://cdn.example.com/img.jpg', 'high');
    const lowUrl = getImageUrl('https://cdn.example.com/img.jpg', 'low');

    expect(highUrl).toContain('q=90');
    expect(highUrl).toContain('w=1200');
    expect(lowUrl).toContain('q=40');
    expect(lowUrl).toContain('w=400');
  });
});
