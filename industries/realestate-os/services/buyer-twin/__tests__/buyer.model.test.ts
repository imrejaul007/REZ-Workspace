import { CreateBuyerSchema, UpdateBuyerSchema, PropertyInteractionSchema, MatchingCriteriaSchema } from '../src/middleware/validation';

describe('Buyer Validation Schemas', () => {
  describe('CreateBuyerSchema', () => {
    it('should validate a valid buyer creation input', () => {
      const validInput = {
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: {
            first: 'John',
            last: 'Doe'
          },
          email: 'john.doe@example.com',
          phone: '1234567890',
          preferredContact: 'email',
          preferredLanguage: 'en'
        },
        searchCriteria: {
          propertyType: ['single_family', 'condo'],
          minBedrooms: 3,
          maxBedrooms: 5,
          minPrice: 300000,
          maxPrice: 500000,
          areas: ['AREA-001', 'AREA-002']
        },
        financing: {
          preApproved: true,
          preApprovalAmount: 450000,
          financingType: 'conventional'
        },
        timeline: {
          urgency: '3_6_months'
        },
        source: 'organic'
      };

      const result = CreateBuyerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject buyer without required fields', () => {
      const invalidInput = {
        buyerId: 'BUYER-001'
        // missing tenantId and profile
      };

      const result = CreateBuyerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidInput = {
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: {
            first: 'John',
            last: 'Doe'
          },
          email: 'invalid-email',
          phone: '1234567890'
        }
      };

      const result = CreateBuyerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject phone number with less than 10 digits', () => {
      const invalidInput = {
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: {
            first: 'John',
            last: 'Doe'
          },
          email: 'john.doe@example.com',
          phone: '12345' // only 5 digits
        }
      };

      const result = CreateBuyerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateBuyerSchema', () => {
    it('should validate partial update input', () => {
      const validInput = {
        profile: {
          name: {
            first: 'Jane'
          }
        },
        status: {
          stage: 'viewing'
        }
      };

      const result = UpdateBuyerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate empty update (all fields optional)', () => {
      const validInput = {};

      const result = UpdateBuyerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate financing update', () => {
      const validInput = {
        financing: {
          preApproved: true,
          preApprovalAmount: 500000
        }
      };

      const result = UpdateBuyerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('PropertyInteractionSchema', () => {
    it('should validate view action', () => {
      const validInput = {
        propertyId: 'PROP-001',
        action: 'view'
      };

      const result = PropertyInteractionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate save action', () => {
      const validInput = {
        propertyId: 'PROP-001',
        action: 'save'
      };

      const result = PropertyInteractionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate offer action', () => {
      const validInput = {
        propertyId: 'PROP-001',
        action: 'offer'
      };

      const result = PropertyInteractionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const invalidInput = {
        propertyId: 'PROP-001',
        action: 'invalid_action'
      };

      const result = PropertyInteractionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject missing propertyId', () => {
      const invalidInput = {
        action: 'view'
      };

      const result = PropertyInteractionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('MatchingCriteriaSchema', () => {
    it('should validate matching criteria with all fields', () => {
      const validInput = {
        areas: ['AREA-001', 'AREA-002'],
        minPrice: 300000,
        maxPrice: 500000,
        propertyTypes: ['single_family', 'condo'],
        minBedrooms: 3,
        maxBedrooms: 5,
        features: ['pool', 'garage'],
        limit: 20
      };

      const result = MatchingCriteriaSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate empty matching criteria', () => {
      const validInput = {};

      const result = MatchingCriteriaSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject limit greater than 100', () => {
      const invalidInput = {
        limit: 150
      };

      const result = MatchingCriteriaSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject limit less than 1', () => {
      const invalidInput = {
        limit: 0
      };

      const result = MatchingCriteriaSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
