import { describe, test, expect } from '@jest/globals';
import {
  BusinessProfileSchema,
  CapabilitiesSchema,
  InitializeAIManagerRequestSchema,
  ExecuteActionRequestSchema,
  CreateCampaignRequestSchema,
} from '../src/types';

describe('Validation Schemas', () => {
  describe('BusinessProfileSchema', () => {
    test('should validate correct business profile', () => {
      const validProfile = {
        name: 'Test Restaurant',
        category: 'restaurant',
        location: '123 Main St, City',
        hours: '9 AM - 10 PM',
        priceRange: 'moderate',
        competitors: ['Competitor A', 'Competitor B'],
      };

      const result = BusinessProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    test('should reject empty name', () => {
      const invalidProfile = {
        name: '',
        category: 'restaurant',
        location: '123 Main St',
      };

      const result = BusinessProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    test('should reject invalid price range', () => {
      const invalidProfile = {
        name: 'Test',
        category: 'restaurant',
        location: '123 Main St',
        priceRange: 'invalid',
      };

      const result = BusinessProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    test('should accept optional fields', () => {
      const minimalProfile = {
        name: 'Test',
        category: 'restaurant',
        location: '123 Main St',
      };

      const result = BusinessProfileSchema.safeParse(minimalProfile);
      expect(result.success).toBe(true);
    });
  });

  describe('CapabilitiesSchema', () => {
    test('should validate correct capabilities', () => {
      const validCapabilities = {
        adCreation: true,
        reviewManagement: true,
        socialPosting: false,
        whatsappCampaigns: true,
        localSEO: true,
      };

      const result = CapabilitiesSchema.safeParse(validCapabilities);
      expect(result.success).toBe(true);
    });

    test('should use default values', () => {
      const emptyCapabilities = {};

      const result = CapabilitiesSchema.safeParse(emptyCapabilities);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.adCreation).toBe(true);
        expect(result.data.reviewManagement).toBe(true);
      }
    });
  });

  describe('InitializeAIManagerRequestSchema', () => {
    test('should validate correct initialization request', () => {
      const validRequest = {
        merchantId: 'merchant-123',
        businessProfile: {
          name: 'Test Business',
          category: 'restaurant',
          location: '123 Main St',
        },
        capabilities: {
          adCreation: true,
        },
      };

      const result = InitializeAIManagerRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test('should reject missing merchantId', () => {
      const invalidRequest = {
        businessProfile: {
          name: 'Test',
          category: 'restaurant',
          location: '123 Main St',
        },
      };

      const result = InitializeAIManagerRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('ExecuteActionRequestSchema', () => {
    test('should validate create_campaign action', () => {
      const validRequest = {
        merchantId: 'merchant-123',
        actionType: 'create_campaign',
        parameters: {
          type: 'facebook_ad',
          name: 'Test Campaign',
          headline: 'Test',
          body: 'Test body',
        },
      };

      const result = ExecuteActionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test('should validate respond_to_review action', () => {
      const validRequest = {
        merchantId: 'merchant-123',
        actionType: 'respond_to_review',
        parameters: {
          reviewId: 'rev-123',
          response: 'Thank you for your review!',
          tone: 'professional',
        },
      };

      const result = ExecuteActionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test('should reject invalid action type', () => {
      const invalidRequest = {
        merchantId: 'merchant-123',
        actionType: 'invalid_action',
        parameters: {},
      };

      const result = ExecuteActionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCampaignRequestSchema', () => {
    test('should validate correct campaign request', () => {
      const validRequest = {
        merchantId: 'merchant-123',
        type: 'instagram_ad',
        name: 'Summer Sale Campaign',
        content: {
          headline: 'Summer Sale!',
          body: 'Get 50% off on all items!',
          callToAction: 'Shop Now',
        },
        budget: 5000,
        schedule: {
          startDate: '2024-06-01',
          endDate: '2024-06-30',
          frequency: 'daily',
        },
      };

      const result = CreateCampaignRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test('should reject missing headline', () => {
      const invalidRequest = {
        merchantId: 'merchant-123',
        type: 'instagram_ad',
        name: 'Test Campaign',
        content: {
          body: 'Test body',
        },
      };

      const result = CreateCampaignRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});