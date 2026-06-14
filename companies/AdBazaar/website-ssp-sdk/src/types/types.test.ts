import { z } from 'zod';
import {
  ContactSchema,
  PublisherSettingsSchema,
  PublisherStatsSchema,
  PublisherSchema,
  PlacementSchema,
  ImpressionEventSchema,
  ClickEventSchema,
  SDKConfigSchema
} from '../types/index.js';

describe('Type Schemas', () => {
  describe('ContactSchema', () => {
    it('should validate a valid contact', () => {
      const contact = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };
      const result = ContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it('should validate contact without optional phone', () => {
      const contact = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const result = ContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const contact = {
        name: 'John Doe',
        email: 'not-an-email',
      };
      const result = ContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const contact = {
        name: '',
        email: 'john@example.com',
      };
      const result = ContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });
  });

  describe('PublisherSettingsSchema', () => {
    it('should validate valid settings', () => {
      const settings = {
        adFormats: ['banner', 'rectangle'],
        minCPM: 2.5,
        headerBidding: true,
      };
      const result = PublisherSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const settings = {};
      const result = PublisherSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minCPM).toBe(1.0);
        expect(result.data.headerBidding).toBe(false);
        expect(result.data.adFormats).toEqual([]);
      }
    });

    it('should reject invalid ad format', () => {
      const settings = {
        adFormats: ['invalid-format'],
      };
      const result = PublisherSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });
  });

  describe('PublisherSchema', () => {
    it('should validate a valid publisher', () => {
      const publisher = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Publisher',
        website: 'https://example.com',
        category: 'news',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        settings: {
          adFormats: ['banner'],
          minCPM: 1.0,
          headerBidding: false,
        },
        stats: {
          totalImpressions: 1000,
          totalClicks: 50,
          totalEarnings: 5.0,
          pendingPayout: 2.5,
        },
        status: 'active',
      };
      const result = PublisherSchema.safeParse(publisher);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const publisher = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Publisher',
        website: 'https://example.com',
        category: 'invalid-category',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };
      const result = PublisherSchema.safeParse(publisher);
      expect(result.success).toBe(false);
    });

    it('should reject invalid website URL', () => {
      const publisher = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Publisher',
        website: 'not-a-url',
        category: 'news',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };
      const result = PublisherSchema.safeParse(publisher);
      expect(result.success).toBe(false);
    });
  });

  describe('PlacementSchema', () => {
    it('should validate a valid placement', () => {
      const placement = {
        placementId: '550e8400-e29b-41d4-a716-446655440001',
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Homepage Banner',
        pageUrl: 'https://example.com',
        adFormats: ['banner', 'rectangle'],
        size: { width: 728, height: 90 },
        position: 'header',
        minCPM: 1.5,
        status: 'active',
      };
      const result = PlacementSchema.safeParse(placement);
      expect(result.success).toBe(true);
    });

    it('should reject invalid position', () => {
      const placement = {
        placementId: '550e8400-e29b-41d4-a716-446655440001',
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Homepage Banner',
        pageUrl: 'https://example.com',
        adFormats: ['banner'],
        size: { width: 728, height: 90 },
        position: 'invalid-position',
      };
      const result = PlacementSchema.safeParse(placement);
      expect(result.success).toBe(false);
    });
  });

  describe('ImpressionEventSchema', () => {
    it('should validate a valid impression event', () => {
      const impression = {
        eventId: '550e8400-e29b-41d4-a716-446655440002',
        placementId: '550e8400-e29b-41d4-a716-446655440001',
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        metadata: {
          country: 'US',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'https://google.com',
        },
      };
      const result = ImpressionEventSchema.safeParse(impression);
      expect(result.success).toBe(true);
    });
  });

  describe('ClickEventSchema', () => {
    it('should validate a valid click event', () => {
      const click = {
        eventId: '550e8400-e29b-41d4-a716-446655440003',
        impressionId: '550e8400-e29b-41d4-a716-446655440002',
        placementId: '550e8400-e29b-41d4-a716-446655440001',
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        metadata: {
          country: 'US',
          device: 'mobile',
        },
      };
      const result = ClickEventSchema.safeParse(click);
      expect(result.success).toBe(true);
    });
  });

  describe('SDKConfigSchema', () => {
    it('should validate a valid SDK config', () => {
      const config = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        apiKey: 'sk_test_key',
        adFormats: ['banner', 'rectangle'],
        headerBidding: true,
        minCPM: 1.5,
        refreshInterval: 60000,
        debug: false,
      };
      const result = SDKConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const config = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        apiKey: 'sk_test_key',
        adFormats: ['banner'],
        headerBidding: false,
        minCPM: 1.0,
      };
      const result = SDKConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refreshInterval).toBe(60000);
        expect(result.data.debug).toBe(false);
      }
    });

    it('should reject refresh interval below minimum', () => {
      const config = {
        publisherId: '550e8400-e29b-41d4-a716-446655440000',
        apiKey: 'sk_test_key',
        adFormats: ['banner'],
        headerBidding: false,
        minCPM: 1.0,
        refreshInterval: 5000, // Below 10000
      };
      const result = SDKConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});