import { z } from 'zod';
import {
  RegisterSchema,
  LoginSchema,
  AddAppSchema,
  CreatePlacementSchema,
  AdRequestSchema,
  ImpressionSchema,
  ClickSchema,
} from '../middleware/validation.js';

describe('Validation Schemas', () => {
  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: 'Test Publisher',
        email: 'test@example.com',
        password: 'password123',
 company: 'Test Company',
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Test Publisher',
        email: 'invalid-email',
        password: 'password123',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        name: 'Test Publisher',
        email: 'test@example.com',
        password: 'short',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'T',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AddAppSchema', () => {
    it('should validate valid app data', () => {
      const validData = {
        name: 'My App',
        platform: 'ios',
        bundleId: 'com.example.app',
        category: 'Games',
      };

      const result = AddAppSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', () => {
      const invalidData = {
        name: 'My App',
        platform: 'windows',
        bundleId: 'com.example.app',
        category: 'Games',
      };

      const result = AddAppSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid platforms', () => {
      const platforms = ['ios', 'android', 'react-native', 'flutter'];

      for (const platform of platforms) {
        const validData = {
          name: 'My App',
          platform,
          bundleId: 'com.example.app',
          category: 'Games',
        };

        const result = AddAppSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('CreatePlacementSchema', () => {
    it('should validate valid placement data', () => {
      const validData = {
        appId: 'app_123',
        name: 'Banner Ad',
        adFormat: 'banner',
        width: 320,
        height: 50,
 position: 'bottom',
        refreshInterval: 30,
        ecpm: 1.5,
      };

      const result = CreatePlacementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid ad format', () => {
      const invalidData = {
        appId: 'app_123',
        name: 'Banner Ad',
        adFormat: 'invalid',
      };

      const result = CreatePlacementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject refresh interval out of range', () => {
      const invalidData = {
        appId: 'app_123',
        name: 'Banner Ad',
        adFormat: 'banner',
        refreshInterval: 500, // Max is 300
      };

      const result = CreatePlacementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AdRequestSchema', () => {
    it('should validate valid ad request data', () => {
      const validData = {
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        platform: 'ios',
        adFormat: 'banner',
        deviceId: 'device_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        language: 'en',
        country: 'US',
      };

      const result = AdRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid IP address', () => {
      const invalidData = {
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        platform: 'ios',
        adFormat: 'banner',
        deviceId: 'device_123',
        ipAddress: 'invalid-ip',
        userAgent: 'Mozilla/5.0',
      };

      const result = AdRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional demographics', () => {
      const validData = {
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        platform: 'ios',
        adFormat: 'banner',
        deviceId: 'device_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        demographics: {
          age: 25,
          gender: 'male',
        },
      };

      const result = AdRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ImpressionSchema', () => {
    it('should validate valid impression data', () => {
      const validData = {
        requestId: 'req_123',
        adId: 'ad_123',
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        viewable: true,
        viewableTime: 2000,
      };

      const result = ImpressionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        requestId: 'req_123',
      };

      const result = ImpressionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ClickSchema', () => {
    it('should validate valid click data', () => {
      const validData = {
        impressionId: 'imp_123',
        requestId: 'req_123',
        adId: 'ad_123',
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        deviceType: 'mobile',
      };

      const result = ClickSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});