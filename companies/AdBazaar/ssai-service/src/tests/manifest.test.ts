import { ManifestService } from '../services/manifest.js';

describe('ManifestService', () => {
  let manifestService: ManifestService;

  beforeEach(() => {
    manifestService = new ManifestService();
  });

  describe('parseHLSMasterManifest', () => {
    it('should parse HLS master manifest with variants', () => {
      const manifest = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=720x480
http://example.com/video/480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1280x720
http://example.com/video/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
http://example.com/video/1080p.m3u8`;

      const variants = manifestService.parseHLSMasterManifest(manifest);

      expect(variants).toHaveLength(3);
      expect(variants[0]).toEqual({
        resolution: '720x480',
        bandwidth: 1280000,
        url: 'http://example.com/video/480p.m3u8',
      });
      expect(variants[1]).toEqual({
        resolution: '1280x720',
        bandwidth: 2560000,
        url: 'http://example.com/video/720p.m3u8',
      });
      expect(variants[2]).toEqual({
        resolution: '1920x1080',
        bandwidth: 5000000,
        url: 'http://example.com/video/1080p.m3u8',
      });
    });

    it('should handle manifest with no variants', () => {
      const manifest = `#EXTM3U
#EXT-X-VERSION:3`;

      const variants = manifestService.parseHLSMasterManifest(manifest);

      expect(variants).toHaveLength(0);
    });

    it('should handle manifest with missing bandwidth', () => {
      const manifest = `#EXTM3U
#EXT-X-STREAM-INF:RESOLUTION=720x480
http://example.com/video/480p.m3u8`;

      const variants = manifestService.parseHLSMasterManifest(manifest);

      expect(variants).toHaveLength(1);
      expect(variants[0]?.bandwidth).toBe(0);
    });
  });

  describe('parseHLSMediaManifest', () => {
    it('should parse HLS media manifest with segments', () => {
      const manifest = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:9.9,
http://example.com/video/segment1.ts
#EXTINF:9.9,
http://example.com/video/segment2.ts
#EXTINF:9.9,
http://example.com/video/segment3.ts`;

      const result = manifestService.parseHLSMediaManifest(manifest);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0]).toBe('http://example.com/video/segment1.ts');
      expect(result.duration).toBeCloseTo(29.7, 1);
    });

    it('should handle empty manifest', () => {
      const manifest = `#EXTM3U
#EXT-X-VERSION:3`;

      const result = manifestService.parseHLSMediaManifest(manifest);

      expect(result.segments).toHaveLength(0);
      expect(result.duration).toBe(0);
    });
  });

  describe('generateModifiedManifestUrl', () => {
    it('should generate modified manifest URL with stream ID', () => {
      const streamId = 'test-stream-123';
      const url = manifestService.generateModifiedManifestUrl(streamId, 'hls');

      expect(url).toContain(streamId);
      expect(url).toContain('.hls');
      expect(url).toContain('manifests');
    });

    it('should generate DASH manifest URL', () => {
      const streamId = 'test-stream-456';
      const url = manifestService.generateModifiedManifestUrl(streamId, 'dash');

      expect(url).toContain(streamId);
      expect(url).toContain('.dash');
    });
  });
});
