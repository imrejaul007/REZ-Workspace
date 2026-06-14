import {
  StreamManifestSchema,
  ManifestProcessRequestSchema,
  AdBreakSchema,
  SCTE35ProcessRequestSchema,
  SpliceInsertRequestSchema,
  AdBreakCompleteRequestSchema,
} from '../validators/index.js';

describe('Validators', () => {
  describe('StreamManifestSchema', () => {
    it('should validate a valid stream manifest', () => {
      const validManifest = {
        streamId: 'stream-123',
        contentId: 'content-456',
        contentType: 'live',
        originalManifestUrl: 'https://example.com/manifest.m3u8',
        manifestType: 'hls',
        status: 'active',
      };

      const result = StreamManifestSchema.safeParse(validManifest);

      expect(result.success).toBe(true);
    });

    it('should reject invalid content type', () => {
      const invalidManifest = {
        streamId: 'stream-123',
        contentId: 'content-456',
        contentType: 'invalid',
        originalManifestUrl: 'https://example.com/manifest.m3u8',
        manifestType: 'hls',
      };

      const result = StreamManifestSchema.safeParse(invalidManifest);

      expect(result.success).toBe(false);
    });

    it('should reject invalid manifest type', () => {
      const invalidManifest = {
        streamId: 'stream-123',
        contentId: 'content-456',
        contentType: 'live',
        originalManifestUrl: 'https://example.com/manifest.m3u8',
        manifestType: 'invalid',
      };

      const result = StreamManifestSchema.safeParse(invalidManifest);

      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const invalidManifest = {
        streamId: 'stream-123',
        contentId: 'content-456',
        contentType: 'live',
        originalManifestUrl: 'not-a-url',
        manifestType: 'hls',
      };

      const result = StreamManifestSchema.safeParse(invalidManifest);

      expect(result.success).toBe(false);
    });
  });

  describe('ManifestProcessRequestSchema', () => {
    it('should validate a valid manifest process request', () => {
      const validRequest = {
        contentUrl: 'https://example.com/manifest.m3u8',
        contentType: 'vod',
        manifestType: 'hls',
        adBreaks: [
          {
            position: 'midroll',
            duration: 120,
          },
        ],
      };

      const result = ManifestProcessRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        contentUrl: 'https://example.com/manifest.m3u8',
      };

      const result = ManifestProcessRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('AdBreakSchema', () => {
    it('should validate a valid ad break', () => {
      const validAdBreak = {
        id: 'break-123',
        position: 'preroll',
        duration: 30,
        maxAds: 5,
        status: 'scheduled',
      };

      const result = AdBreakSchema.safeParse(validAdBreak);

      expect(result.success).toBe(true);
    });

    it('should accept all valid positions', () => {
      const positions = ['preroll', 'midroll', 'postroll'];

      for (const position of positions) {
        const adBreak = {
          id: 'break-123',
          position,
          duration: 30,
        };

        const result = AdBreakSchema.safeParse(adBreak);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid position', () => {
      const invalidAdBreak = {
        id: 'break-123',
        position: 'invalid',
        duration: 30,
      };

      const result = AdBreakSchema.safeParse(invalidAdBreak);

      expect(result.success).toBe(false);
    });

    it('should reject negative duration', () => {
      const invalidAdBreak = {
        id: 'break-123',
        position: 'midroll',
        duration: -10,
      };

      const result = AdBreakSchema.safeParse(invalidAdBreak);

      expect(result.success).toBe(false);
    });
  });

  describe('SCTE35ProcessRequestSchema', () => {
    it('should validate a valid SCTE-35 process request', () => {
      const validRequest = {
        streamId: 'stream-123',
        rawData: '0x47413934fc0000000000000000000000000000',
        ptsTime: 1000,
      };

      const result = SCTE35ProcessRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
    });

    it('should reject missing stream ID', () => {
      const invalidRequest = {
        rawData: '0x47413934fc0000000000000000000000000000',
      };

      const result = SCTE35ProcessRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('SpliceInsertRequestSchema', () => {
    it('should validate a valid splice insert request', () => {
      const validRequest = {
        streamId: 'stream-123',
        spliceEventId: 100,
        breakDuration: 30,
        startTime: 100,
        endTime: 130,
        assets: ['https://example.com/ad1.mp4', 'https://example.com/ad2.mp4'],
      };

      const result = SpliceInsertRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        streamId: 'stream-123',
      };

      const result = SpliceInsertRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should reject negative break duration', () => {
      const invalidRequest = {
        streamId: 'stream-123',
        spliceEventId: 100,
        breakDuration: -10,
      };

      const result = SpliceInsertRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('AdBreakCompleteRequestSchema', () => {
    it('should validate a valid ad break complete request', () => {
      const validRequest = {
        adBreakId: 'break-123',
        completedAds: ['ad-1', 'ad-2'],
        totalDuration: 30,
        exitPosition: 'natural',
      };

      const result = AdBreakCompleteRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
    });

    it('should accept all valid exit positions', () => {
      const positions = ['natural', 'early', 'timeout'];

      for (const position of positions) {
        const request = {
          adBreakId: 'break-123',
          completedAds: ['ad-1'],
          totalDuration: 30,
          exitPosition: position,
        };

        const result = AdBreakCompleteRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });

    it('should reject empty completed ads', () => {
      const invalidRequest = {
        adBreakId: 'break-123',
        completedAds: [],
        totalDuration: 30,
      };

      const result = AdBreakCompleteRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });
  });
});