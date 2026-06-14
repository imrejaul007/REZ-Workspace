import { z } from 'zod';
import {
  LocationSchema,
  PriceRangeSchema,
  DemographicsSchema,
  PreferencesSchema,
  ProfileSchema,
  InterestSchema,
  PurchaseHistoryItemSchema,
  BrowsingPatternsSchema,
  BehavioralSchema,
  PredictiveSchema,
  AdvertisingSchema,
} from '../src/types';

describe('Validation Schemas', () => {
  describe('LocationSchema', () => {
    it('should validate valid location', () => {
      const validLocation = {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      const result = LocationSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it('should reject empty city', () => {
      const invalidLocation = {
        city: '',
        state: 'Maharashtra',
        country: 'India',
      };

      const result = LocationSchema.safeParse(invalidLocation);
      expect(result.success).toBe(false);
    });
  });

  describe('PriceRangeSchema', () => {
    it('should validate valid price range', () => {
      const validRange = { min: 100, max: 5000 };

      const result = PriceRangeSchema.safeParse(validRange);
      expect(result.success).toBe(true);
    });

    it('should reject when max < min', () => {
      const invalidRange = { min: 5000, max: 100 };

      const result = PriceRangeSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const invalidRange = { min: -100, max: 5000 };

      const result = PriceRangeSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
    });
  });

  describe('DemographicsSchema', () => {
    it('should validate valid demographics', () => {
      const validDemographics = {
        age: 30,
        gender: 'male',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      };

      const result = DemographicsSchema.safeParse(validDemographics);
      expect(result.success).toBe(true);
    });

    it('should allow missing optional fields', () => {
      const validDemographics = {
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      };

      const result = DemographicsSchema.safeParse(validDemographics);
      expect(result.success).toBe(true);
    });

    it('should reject age below 13', () => {
      const invalidDemographics = {
        age: 10,
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      };

      const result = DemographicsSchema.safeParse(invalidDemographics);
      expect(result.success).toBe(false);
    });

    it('should reject age above 120', () => {
      const invalidDemographics = {
        age: 150,
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      };

      const result = DemographicsSchema.safeParse(invalidDemographics);
      expect(result.success).toBe(false);
    });
  });

  describe('PreferencesSchema', () => {
    it('should validate valid preferences', () => {
      const validPreferences = {
        language: 'en',
        notifications: ['email', 'push'],
        priceRange: { min: 100, max: 5000 },
      };

      const result = PreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
    });

    it('should use default language if not provided', () => {
      const partialPreferences = {
        priceRange: { min: 100, max: 5000 },
      };

      const result = PreferencesSchema.safeParse(partialPreferences);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('en');
      }
    });
  });

  describe('ProfileSchema', () => {
    it('should validate complete profile', () => {
      const validProfile = {
        demographics: {
          age: 30,
          gender: 'male',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
        },
        preferences: {
          language: 'en',
          notifications: ['email'],
          priceRange: { min: 100, max: 5000 },
        },
      };

      const result = ProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });
  });

  describe('InterestSchema', () => {
    it('should validate valid interest', () => {
      const validInterest = { category: 'electronics', score: 0.8 };

      const result = InterestSchema.safeParse(validInterest);
      expect(result.success).toBe(true);
    });

    it('should reject score > 1', () => {
      const invalidInterest = { category: 'electronics', score: 1.5 };

      const result = InterestSchema.safeParse(invalidInterest);
      expect(result.success).toBe(false);
    });

    it('should reject negative score', () => {
      const invalidInterest = { category: 'electronics', score: -0.1 };

      const result = InterestSchema.safeParse(invalidInterest);
      expect(result.success).toBe(false);
    });
  });

  describe('PurchaseHistoryItemSchema', () => {
    it('should validate valid purchase history item', () => {
      const validItem = { category: 'electronics', count: 5, total: 25000 };

      const result = PurchaseHistoryItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject negative count', () => {
      const invalidItem = { category: 'electronics', count: -1, total: 25000 };

      const result = PurchaseHistoryItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('BrowsingPatternsSchema', () => {
    it('should validate valid browsing patterns', () => {
      const validPatterns = {
        patterns: ['search', 'browse'],
        frequency: 0.7,
      };

      const result = BrowsingPatternsSchema.safeParse(validPatterns);
      expect(result.success).toBe(true);
    });

    it('should reject frequency > 1', () => {
      const invalidPatterns = {
        patterns: ['search'],
        frequency: 1.5,
      };

      const result = BrowsingPatternsSchema.safeParse(invalidPatterns);
      expect(result.success).toBe(false);
    });
  });

  describe('BehavioralSchema', () => {
    it('should validate complete behavioral data', () => {
      const validBehavioral = {
        interests: [{ category: 'electronics', score: 0.8 }],
        purchaseHistory: [{ category: 'electronics', count: 5, total: 25000 }],
        browsingPatterns: { patterns: ['search'], frequency: 0.7 },
        engagementScore: 0.75,
        lastActive: new Date(),
      };

      const result = BehavioralSchema.safeParse(validBehavioral);
      expect(result.success).toBe(true);
    });
  });

  describe('PredictiveSchema', () => {
    it('should validate complete predictive data', () => {
      const validPredictive = {
        churnRisk: 0.2,
        lifetimeValue: 15000,
        nextPurchaseLikely: new Date(),
        preferredChannels: ['email', 'push'],
        optimalContactTime: '19:00',
      };

      const result = PredictiveSchema.safeParse(validPredictive);
      expect(result.success).toBe(true);
    });

    it('should reject churn risk > 1', () => {
      const invalidPredictive = {
        churnRisk: 1.5,
        lifetimeValue: 15000,
        nextPurchaseLikely: new Date(),
        preferredChannels: ['email'],
        optimalContactTime: '19:00',
      };

      const result = PredictiveSchema.safeParse(invalidPredictive);
      expect(result.success).toBe(false);
    });
  });

  describe('AdvertisingSchema', () => {
    it('should validate complete advertising data', () => {
      const validAdvertising = {
        adResponsiveness: 0.65,
        clickThroughHistory: 0.12,
        conversionRate: 0.08,
        preferredAdFormats: ['banner', 'video'],
        brandAffinities: { 'Brand A': 0.9, 'Brand B': 0.7 },
      };

      const result = AdvertisingSchema.safeParse(validAdvertising);
      expect(result.success).toBe(true);
    });

    it('should reject brand affinity > 1', () => {
      const invalidAdvertising = {
        adResponsiveness: 0.65,
        clickThroughHistory: 0.12,
        conversionRate: 0.08,
        preferredAdFormats: ['banner'],
        brandAffinities: { 'Brand A': 1.5 },
      };

      const result = AdvertisingSchema.safeParse(invalidAdvertising);
      expect(result.success).toBe(false);
    });
  });
});

describe('API Request Schemas', () => {
  const createTwinSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    profile: z.object({
      demographics: z.object({
        age: z.number().min(13).max(120).optional(),
        gender: z.string().optional(),
        location: z.object({
          city: z.string().min(1, 'City is required'),
          state: z.string().min(1, 'State is required'),
          country: z.string().min(1, 'Country is required'),
        }),
      }),
      preferences: z.object({
        language: z.string().default('en'),
        notifications: z.array(z.string()).default([]),
        priceRange: z.object({
          min: z.number().min(0),
          max: z.number().min(0),
        }),
      }),
    }),
  });

  describe('createTwinSchema', () => {
    it('should validate valid create twin request', () => {
      const validRequest = {
        userId: 'user-123',
        profile: {
          demographics: {
            age: 30,
            location: {
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
            },
          },
          preferences: {
            priceRange: { min: 100, max: 5000 },
          },
        },
      };

      const result = createTwinSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing userId', () => {
      const invalidRequest = {
        profile: {
          demographics: {
            location: {
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
            },
          },
          preferences: {
            priceRange: { min: 100, max: 5000 },
          },
        },
      };

      const result = createTwinSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject missing location', () => {
      const invalidRequest = {
        userId: 'user-123',
        profile: {
          demographics: {
            age: 30,
          },
          preferences: {
            priceRange: { min: 100, max: 5000 },
          },
        },
      };

      const result = createTwinSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});