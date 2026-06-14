/**
 * Validation Schema Tests
 */

import {
  createMerchantTwinSchema,
  updateMerchantTwinSchema,
  listQuerySchema,
  merchantIdParamSchema,
} from '../src/middleware/validation';

describe('Validation Schemas', () => {
  describe('createMerchantTwinSchema', () => {
    it('should validate a valid create request', () => {
      const validInput = {
        merchantId: 'merchant-123',
        business: {
          name: 'Test Restaurant',
          category: 'restaurant',
          subcategory: 'casual dining',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          size: 'medium',
        },
      };

      const result = createMerchantTwinSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject missing merchantId', () => {
      const invalidInput = {
        business: {
          name: 'Test Restaurant',
          category: 'restaurant',
          subcategory: 'casual dining',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          size: 'medium',
        },
      };

      const result = createMerchantTwinSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid size value', () => {
      const invalidInput = {
        merchantId: 'merchant-123',
        business: {
          name: 'Test Restaurant',
          category: 'restaurant',
          subcategory: 'casual dining',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          size: 'xlarge',
        },
      };

      const result = createMerchantTwinSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept optional customerProfile', () => {
      const validInput = {
        merchantId: 'merchant-123',
        business: {
          name: 'Test Restaurant',
          category: 'restaurant',
          subcategory: 'casual dining',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          size: 'medium',
        },
        customerProfile: {
          demographics: {
            ageDistribution: [{ range: '25-34', percentage: 40 }],
            genderDistribution: { male: 50, female: 50 },
            incomeLevel: 'medium',
          },
          behavioral: {
            avgVisitFrequency: 4,
            avgOrderValue: 800,
            peakHours: ['12:00-14:00'],
            popularDays: ['Saturday'],
            repeatCustomerRate: 0.6,
          },
          size: 500,
        },
      };

      const result = createMerchantTwinSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('updateMerchantTwinSchema', () => {
    it('should validate a valid update request', () => {
      const validInput = {
        business: {
          name: 'Updated Restaurant Name',
        },
      };

      const result = updateMerchantTwinSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty update', () => {
      const invalidInput = {};

      const result = updateMerchantTwinSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept nested updates', () => {
      const validInput = {
        customerProfile: {
          behavioral: {
            avgVisitFrequency: 6,
          },
        },
      };

      const result = updateMerchantTwinSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('listQuerySchema', () => {
    it('should apply defaults for missing values', () => {
      const result = listQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string values to numbers', () => {
      const result = listQuerySchema.safeParse({
        page: '2',
        limit: '50',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit exceeding max', () => {
      const result = listQuerySchema.safeParse({
        limit: '200',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('merchantIdParamSchema', () => {
    it('should validate a valid merchantId', () => {
      const result = merchantIdParamSchema.safeParse({
        merchantId: 'merchant-123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty merchantId', () => {
      const result = merchantIdParamSchema.safeParse({
        merchantId: '',
      });

      expect(result.success).toBe(false);
    });
  });
});