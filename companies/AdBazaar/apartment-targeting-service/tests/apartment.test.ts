import {
  CreateApartmentSchema,
  UpdateApartmentSchema,
  NearbyQuerySchema,
  ListApartmentsQuerySchema,
  CreateTargetingConfigSchema,
} from '../src/types/index.js';

describe('Zod Schemas', () => {
  describe('CreateApartmentSchema', () => {
    const validApartment = {
      name: 'Sunrise Heights',
      type: 'gated_community',
      address: {
        street: 'MG Road',
        area: 'Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        country: 'India',
      },
      location: {
        lat: 12.9352,
        lng: 77.6245,
      },
      demographics: {
        totalFlats: 500,
        occupiedFlats: 450,
        avgFamilySize: 4,
        estimatedResidents: 1800,
        incomeLevel: 'upper_middle',
      },
      amenities: ['gym', 'pool'],
      nearbyPOIs: ['Metro Station'],
    };

    it('should validate a valid apartment', () => {
      const result = CreateApartmentSchema.safeParse(validApartment);
      expect(result.success).toBe(true);
    });

    it('should reject invalid pincode', () => {
      const invalid = {
        ...validApartment,
        address: { ...validApartment.address, pincode: '12345' },
      };
      const result = CreateApartmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid latitude', () => {
      const invalid = {
        ...validApartment,
        location: { lat: 100, lng: 77.6245 },
      };
      const result = CreateApartmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid apartment type', () => {
      const invalid = { ...validApartment, type: 'invalid' };
      const result = CreateApartmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative totalFlats', () => {
      const invalid = {
        ...validApartment,
        demographics: { ...validApartment.demographics, totalFlats: -1 },
      };
      const result = CreateApartmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid income level', () => {
      const invalid = {
        ...validApartment,
        demographics: { ...validApartment.demographics, incomeLevel: 'rich' },
      };
      const result = CreateApartmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should set default country to India', () => {
      const withoutCountry = {
        ...validApartment,
        address: { ...validApartment.address, country: undefined },
      };
      const result = CreateApartmentSchema.safeParse(withoutCountry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.address.country).toBe('India');
      }
    });
  });

  describe('UpdateApartmentSchema', () => {
    it('should allow partial updates', () => {
      const result = UpdateApartmentSchema.safeParse({
        name: 'New Name',
      });
      expect(result.success).toBe(true);
    });

    it('should allow updating nested fields', () => {
      const result = UpdateApartmentSchema.safeParse({
        demographics: {
          totalFlats: 600,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = UpdateApartmentSchema.safeParse({
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('NearbyQuerySchema', () => {
    it('should validate valid nearby query', () => {
      const result = NearbyQuerySchema.safeParse({
        lat: 12.9352,
        lng: 77.6245,
        radius: 5000,
        limit: 20,
      });
      expect(result.success).toBe(true);
    });

    it('should set default radius', () => {
      const result = NearbyQuerySchema.safeParse({
        lat: 12.9352,
        lng: 77.6245,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBe(5000);
      }
    });

    it('should reject invalid latitude', () => {
      const result = NearbyQuerySchema.safeParse({
        lat: 100,
        lng: 77.6245,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative radius', () => {
      const result = NearbyQuerySchema.safeParse({
        lat: 12.9352,
        lng: 77.6245,
        radius: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ListApartmentsQuerySchema', () => {
    it('should validate valid list query', () => {
      const result = ListApartmentsQuerySchema.safeParse({
        page: 1,
        limit: 20,
        city: 'Bangalore',
        incomeLevel: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('should parse amenities from comma-separated string', () => {
      const result = ListApartmentsQuerySchema.safeParse({
        amenities: 'gym,pool,clubhouse',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amenities).toEqual(['gym', 'pool', 'clubhouse']);
      }
    });

    it('should set default pagination values', () => {
      const result = ListApartmentsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('CreateTargetingConfigSchema', () => {
    it('should validate valid targeting config', () => {
      const result = CreateTargetingConfigSchema.safeParse({
        enabled: true,
        minAge: 25,
        maxAge: 45,
        interests: ['tech', 'finance'],
        incomeBrackets: ['upper_middle', 'high'],
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty config with defaults', () => {
      const result = CreateTargetingConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it('should reject invalid age range', () => {
      const result = CreateTargetingConfigSchema.safeParse({
        minAge: 50,
        maxAge: 25,
      });
      expect(result.success).toBe(false);
    });
  });
});