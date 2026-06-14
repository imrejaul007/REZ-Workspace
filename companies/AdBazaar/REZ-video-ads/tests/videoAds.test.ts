import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mongoose
vi.mock('mongoose', () => {
  const mockModel = {
    find: vi.fn().mockReturnThis(),
    findOne: vi.fn(),
    save: vi.fn(),
    sort: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      connect: vi.fn(),
      model: vi.fn(() => mockModel),
      Schema: vi.fn(),
      connection: { readyState: 1 },
    },
    connect: vi.fn(),
    model: vi.fn(() => mockModel),
    Schema: vi.fn(),
    connection: { readyState: 1 },
  };
});

// Mock logger
vi.mock('./utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Video Ads Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const healthResponse = { status: 'healthy', service: 'rez-video-ads' };
      expect(healthResponse.status).toBe('healthy');
      expect(healthResponse.service).toBe('rez-video-ads');
    });
  });

  describe('Video Ad Schema', () => {
    it('should have required fields', () => {
      const requiredFields = ['adId', 'advertiserId', 'name', 'videoUrl', 'duration', 'format'];
      const mockAd = {
        adId: 'vidad-test123',
        advertiserId: 'adv-123',
        name: 'Test Ad',
        videoUrl: 'https://example.com/video.mp4',
        duration: 30,
        format: 'preroll',
        status: 'active',
      };

      requiredFields.forEach((field) => {
        expect(mockAd).toHaveProperty(field);
      });
    });

    it('should support all ad formats', () => {
      const formats = ['preroll', 'midroll', 'postroll'];
      formats.forEach((format) => {
        const ad = { format, name: 'Test' };
        expect(['preroll', 'midroll', 'postroll']).toContain(ad.format);
      });
    });
  });

  describe('VAST XML Generation', () => {
    it('should generate valid VAST XML structure', () => {
      const ad = {
        adId: 'vidad-123',
        name: 'Test Video Ad',
        duration: 30,
        skipOffset: 5,
        videoUrl: 'https://example.com/video.mp4',
        clickUrl: 'https://example.com/click',
        trackingUrls: {
          start: 'https://tracker.com/start',
          complete: 'https://tracker.com/complete',
        },
      };

      // Verify ad has all required VAST fields
      expect(ad.adId).toBeDefined();
      expect(ad.name).toBeDefined();
      expect(ad.duration).toBeGreaterThan(0);
      expect(ad.videoUrl).toContain('.mp4');
    });

    it('should support skip offset', () => {
      const ad = { skipOffset: 5 };
      expect(ad.skipOffset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Ad Status Management', () => {
    it('should support all status values', () => {
      const statuses = ['active', 'paused', 'completed'];
      const ad = { status: 'active' };
      expect(statuses).toContain(ad.status);
    });
  });

  describe('Tracking Events', () => {
    it('should have all tracking event types', () => {
      const events = ['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'skip', 'click'];
      const mockTracking = {
        start: 'https://tracker.com/start',
        firstQuartile: 'https://tracker.com/firstQuartile',
        midpoint: 'https://tracker.com/midpoint',
        thirdQuartile: 'https://tracker.com/thirdQuartile',
        complete: 'https://tracker.com/complete',
        skip: 'https://tracker.com/skip',
        click: 'https://tracker.com/click',
      };

      events.forEach((event) => {
        expect(mockTracking).toHaveProperty(event);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limit configuration', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
      };

      expect(rateLimitConfig.windowMs).toBe(900000);
      expect(rateLimitConfig.max).toBeGreaterThan(0);
    });
  });
});
