import { z } from 'zod';
import { CTVCampaignSchema, CTVCreativeSchema } from '../types/ctv-campaign.js';

describe('CTVCampaign Schema Validation', () => {
  describe('CTVCreativeSchema', () => {
    it('should validate a valid creative', () => {
      const validCreative = {
        creativeId: 'creative-001',
        name: 'Test Creative',
        videoUrl: 'https://cdn.example.com/video.mp4',
        duration: 30,
        clickUrl: 'https://example.com/click',
      };

      const result = CTVCreativeSchema.safeParse(validCreative);
      expect(result.success).toBe(true);
    });

    it('should reject creative with invalid URL', () => {
      const invalidCreative = {
        creativeId: 'creative-001',
        name: 'Test Creative',
        videoUrl: 'not-a-valid-url',
        duration: 30,
        clickUrl: 'https://example.com/click',
      };

      const result = CTVCreativeSchema.safeParse(invalidCreative);
      expect(result.success).toBe(false);
    });

    it('should reject creative with negative duration', () => {
      const invalidCreative = {
        creativeId: 'creative-001',
        name: 'Test Creative',
        videoUrl: 'https://cdn.example.com/video.mp4',
        duration: -5,
        clickUrl: 'https://example.com/click',
      };

      const result = CTVCreativeSchema.safeParse(invalidCreative);
      expect(result.success).toBe(false);
    });

    it('should accept creative with companion ads', () => {
      const creativeWithCompanion = {
        creativeId: 'creative-001',
        name: 'Test Creative',
        videoUrl: 'https://cdn.example.com/video.mp4',
        duration: 30,
        clickUrl: 'https://example.com/click',
        companionAds: [{
          id: 'companion-1',
          type: 'static',
          content: 'https://cdn.example.com/companion.jpg',
          clickUrl: 'https://example.com/companion-click',
        }],
      };

      const result = CTVCreativeSchema.safeParse(creativeWithCompanion);
      expect(result.success).toBe(true);
    });
  });

  describe('CTVCampaignSchema', () => {
    it('should validate a valid campaign', () => {
      const validCampaign = {
        advertiserId: 'advertiser-001',
        name: 'Test Campaign',
        status: 'active',
        format: 'preroll',
        budget: {
          daily: 1000,
          total: 30000,
          spent: 0,
        },
        bid: {
          type: 'cpm',
          amount: 10,
          maxBid: 15,
        },
        targeting: {
          geo: ['IN', 'US'],
          deviceTypes: ['smarttv'],
        },
        creatives: [{
          creativeId: 'creative-001',
          name: 'Test Creative',
          videoUrl: 'https://cdn.example.com/video.mp4',
          duration: 30,
          clickUrl: 'https://example.com/click',
        }],
        pacing: {
          type: 'even',
        },
        frequency: {
          maxImpressions: 4,
          windowHours: 24,
        },
        startDate: '2024-01-01T00:00:00Z',
      };

      const result = CTVCampaignSchema.safeParse(validCampaign);
      expect(result.success).toBe(true);
    });

    it('should reject campaign without creatives', () => {
      const invalidCampaign = {
        advertiserId: 'advertiser-001',
        name: 'Test Campaign',
        status: 'active',
        format: 'preroll',
        budget: {
          daily: 1000,
          total: 30000,
          spent: 0,
        },
        bid: {
          type: 'cpm',
          amount: 10,
          maxBid: 15,
        },
        creatives: [],
        pacing: {
          type: 'even',
        },
        frequency: {
          maxImpressions: 4,
          windowHours: 24,
        },
        startDate: '2024-01-01T00:00:00Z',
      };

      const result = CTVCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidCampaign = {
        advertiserId: 'advertiser-001',
        name: 'Test Campaign',
        status: 'invalid_status',
        format: 'preroll',
        budget: {
          daily: 1000,
          total: 30000,
          spent: 0,
        },
        bid: {
          type: 'cpm',
          amount: 10,
          maxBid: 15,
        },
        creatives: [{
          creativeId: 'creative-001',
          name: 'Test Creative',
          videoUrl: 'https://cdn.example.com/video.mp4',
          duration: 30,
          clickUrl: 'https://example.com/click',
        }],
        pacing: {
          type: 'even',
        },
        frequency: {
          maxImpressions: 4,
          windowHours: 24,
        },
        startDate: '2024-01-01T00:00:00Z',
      };

      const result = CTVCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should reject invalid bid type', () => {
      const invalidCampaign = {
        advertiserId: 'advertiser-001',
        name: 'Test Campaign',
        status: 'active',
        format: 'preroll',
        budget: {
          daily: 1000,
          total: 30000,
          spent: 0,
        },
        bid: {
          type: 'invalid_type',
          amount: 10,
          maxBid: 15,
        },
        creatives: [{
          creativeId: 'creative-001',
          name: 'Test Creative',
          videoUrl: 'https://cdn.example.com/video.mp4',
          duration: 30,
          clickUrl: 'https://example.com/click',
        }],
        pacing: {
          type: 'even',
        },
        frequency: {
          maxImpressions: 4,
          windowHours: 24,
        },
        startDate: '2024-01-01T00:00:00Z',
      };

      const result = CTVCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should accept all valid ad formats', () => {
      const formats = ['preroll', 'midroll', 'postroll', 'pod'];

      formats.forEach(format => {
        const campaign = {
          advertiserId: 'advertiser-001',
          name: 'Test Campaign',
          status: 'active',
          format,
          budget: {
            daily: 1000,
            total: 30000,
            spent: 0,
          },
          bid: {
            type: 'cpm',
            amount: 10,
            maxBid: 15,
          },
          creatives: [{
            creativeId: 'creative-001',
            name: 'Test Creative',
            videoUrl: 'https://cdn.example.com/video.mp4',
            duration: 30,
            clickUrl: 'https://example.com/click',
          }],
          pacing: {
            type: 'even',
          },
          frequency: {
            maxImpressions: 4,
            windowHours: 24,
          },
          startDate: '2024-01-01T00:00:00Z',
        };

        const result = CTVCampaignSchema.safeParse(campaign);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid pacing types', () => {
      const pacingTypes = ['even', 'asap', 'frontloaded'];

      pacingTypes.forEach(pacingType => {
        const campaign = {
          advertiserId: 'advertiser-001',
          name: 'Test Campaign',
          status: 'active',
          format: 'preroll',
          budget: {
            daily: 1000,
            total: 30000,
            spent: 0,
          },
          bid: {
            type: 'cpm',
            amount: 10,
            maxBid: 15,
          },
          creatives: [{
            creativeId: 'creative-001',
            name: 'Test Creative',
            videoUrl: 'https://cdn.example.com/video.mp4',
            duration: 30,
            clickUrl: 'https://example.com/click',
          }],
          pacing: {
            type: pacingType,
          },
          frequency: {
            maxImpressions: 4,
            windowHours: 24,
          },
          startDate: '2024-01-01T00:00:00Z',
        };

        const result = CTVCampaignSchema.safeParse(campaign);
        expect(result.success).toBe(true);
      });
    });
  });
});