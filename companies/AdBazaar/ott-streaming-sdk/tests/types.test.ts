import { z } from 'zod';
import {
  OTTStreamingConfigSchema,
  StreamAssetSchema,
  PlaybackEventSchema,
  HeartbeatSchema,
  DRMLicenseRequestSchema,
  AnalyticsEventSchema,
} from '../src/types/index.js';

describe('Type Schemas', () => {
  describe('OTTStreamingConfigSchema', () => {
    it('should validate a valid config', () => {
      const validConfig = {
        sdkVersion: '1.0.0',
        streamConfig: {
          hls: {
            enabled: true,
            maxBitrate: 15000000,
            minBitrate: 500000,
          },
          dash: {
            enabled: true,
            manifestVersion: '2.0',
          },
        },
        drm: {
          widevine: {
            licenseUrl: 'https://drm.example.com/widevine',
            serverCertificate: 'cert123',
          },
          fairplay: {
            licenseUrl: 'https://drm.example.com/fairplay',
            certificateUrl: 'https://drm.example.com/cert',
          },
        },
        analytics: {
          endpoint: 'https://analytics.example.com',
          heartbeatInterval: 5000,
        },
        adConfig: {
          adServerUrl: 'https://ads.example.com',
          adTimeout: 10000,
        },
      };

      const result = OTTStreamingConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL in DRM config', () => {
      const invalidConfig = {
        sdkVersion: '1.0.0',
        streamConfig: {
          hls: { enabled: true, maxBitrate: 15000000, minBitrate: 500000 },
          dash: { enabled: true, manifestVersion: '2.0' },
        },
        drm: {
          widevine: {
            licenseUrl: 'not-a-valid-url',
            serverCertificate: 'cert123',
          },
          fairplay: {
            licenseUrl: 'https://drm.example.com/fairplay',
            certificateUrl: 'https://drm.example.com/cert',
          },
        },
        analytics: {
          endpoint: 'https://analytics.example.com',
          heartbeatInterval: 5000,
        },
        adConfig: {
          adServerUrl: 'https://ads.example.com',
          adTimeout: 10000,
        },
      };

      const result = OTTStreamingConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('PlaybackEventSchema', () => {
    it('should validate a valid playback event', () => {
      const validEvent = {
        eventId: 'evt-123',
        contentId: 'content-456',
        deviceId: 'device-789',
        eventType: 'play',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: {
          position: 120,
          quality: '1080p',
          bitrate: 5000000,
        },
      };

      const result = PlaybackEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        eventId: 'evt-123',
        contentId: 'content-456',
        deviceId: 'device-789',
        eventType: 'invalid_type',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: {
          position: 120,
          quality: '1080p',
          bitrate: 5000000,
        },
      };

      const result = PlaybackEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should accept all valid event types', () => {
      const eventTypes = ['play', 'pause', 'seek', 'buffer', 'complete', 'error'];

      for (const eventType of eventTypes) {
        const event = {
          eventId: 'evt-123',
          contentId: 'content-456',
          deviceId: 'device-789',
          eventType,
          timestamp: '2024-01-01T00:00:00.000Z',
          metadata: {
            position: 120,
            quality: '1080p',
            bitrate: 5000000,
          },
        };

        const result = PlaybackEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('StreamAssetSchema', () => {
    it('should validate a valid stream asset', () => {
      const validAsset = {
        contentId: 'movie-123',
        title: 'Test Movie',
        duration: 7200,
        streams: [
          {
            url: 'https://cdn.example.com/hls/master.m3u8',
            type: 'hls',
            quality: '1080p',
            bitrate: 5000000,
          },
          {
            url: 'https://cdn.example.com/dash/manifest.mpd',
            type: 'dash',
            quality: '1080p',
            bitrate: 5000000,
          },
        ],
        thumbnail: 'https://cdn.example.com/thumb.jpg',
        drm: {
          widevine: true,
          fairplay: true,
        },
      };

      const result = StreamAssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it('should reject invalid stream type', () => {
      const invalidAsset = {
        contentId: 'movie-123',
        title: 'Test Movie',
        duration: 7200,
        streams: [
          {
            url: 'https://cdn.example.com/stream',
            type: 'invalid',
            quality: '1080p',
            bitrate: 5000000,
          },
        ],
        thumbnail: 'https://cdn.example.com/thumb.jpg',
        drm: {
          widevine: true,
          fairplay: true,
        },
      };

      const result = StreamAssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
    });
  });

  describe('DRMLicenseRequestSchema', () => {
    it('should validate a valid DRM license request', () => {
      const validRequest = {
        contentId: 'content-123',
        drmType: 'widevine',
        deviceInfo: {
          manufacturer: 'Samsung',
          model: 'TV-Model-2024',
          osVersion: 'Tizen 7.0',
        },
      };

      const result = DRMLicenseRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept fairplay drm type', () => {
      const validRequest = {
        contentId: 'content-123',
        drmType: 'fairplay',
        deviceInfo: {
          manufacturer: 'Apple',
          model: 'Apple TV 4K',
          osVersion: 'tvOS 17.0',
        },
      };

      const result = DRMLicenseRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid DRM type', () => {
      const invalidRequest = {
        contentId: 'content-123',
        drmType: 'playready',
        deviceInfo: {
          manufacturer: 'Microsoft',
          model: 'Xbox',
          osVersion: '10.0',
        },
      };

      const result = DRMLicenseRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('AnalyticsEventSchema', () => {
    it('should validate a valid analytics event batch', () => {
      const validBatch = {
        events: [
          {
            eventId: 'evt-1',
            contentId: 'content-1',
            deviceId: 'device-1',
            eventType: 'play',
            timestamp: '2024-01-01T00:00:00.000Z',
            metadata: {
              position: 0,
              quality: '1080p',
              bitrate: 5000000,
            },
          },
          {
            eventId: 'evt-2',
            contentId: 'content-1',
            deviceId: 'device-1',
            eventType: 'complete',
            timestamp: '2024-01-01T01:00:00.000Z',
            metadata: {
              position: 3600,
              quality: '1080p',
              bitrate: 5000000,
            },
          },
        ],
      };

      const result = AnalyticsEventSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });

    it('should reject empty events array', () => {
      const invalidBatch = {
        events: [],
      };

      const result = AnalyticsEventSchema.safeParse(invalidBatch);
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 events', () => {
      const events = Array.from({ length: 101 }, (_, i) => ({
        eventId: `evt-${i}`,
        contentId: 'content-1',
        deviceId: 'device-1',
        eventType: 'play',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: {
          position: 0,
          quality: '1080p',
          bitrate: 5000000,
        },
      }));

      const result = AnalyticsEventSchema.safeParse({ events });
      expect(result.success).toBe(false);
    });
  });

  describe('HeartbeatSchema', () => {
    it('should validate a valid heartbeat', () => {
      const validHeartbeat = {
        deviceId: 'device-123',
        contentId: 'content-456',
        position: 1234,
        quality: '1080p',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = HeartbeatSchema.safeParse(validHeartbeat);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidHeartbeat = {
        deviceId: 'device-123',
        // missing contentId
        position: 1234,
        quality: '1080p',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = HeartbeatSchema.safeParse(invalidHeartbeat);
      expect(result.success).toBe(false);
    });
  });
});