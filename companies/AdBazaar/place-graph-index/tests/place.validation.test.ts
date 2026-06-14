import { describe, it, expect } from '@jest/globals';
import {
  CreatePlaceSchema,
  UpdatePlaceSchema,
  AddressSchema,
  GeoLocationSchema,
} from '../src/types/index.js';

describe('Place Validation Schemas', () => {
  describe('AddressSchema', () => {
    it('should validate a valid address', () => {
      const validAddress = {
        street: '142, Outer Ring Road',
        area: 'Marathahalli',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560037',
        country: 'India',
      };

      const result = AddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject address with missing required fields', () => {
      const invalidAddress = {
        street: '142, Outer Ring Road',
        city: 'Bangalore',
      };

      const result = AddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('should reject address with empty street', () => {
      const invalidAddress = {
        street: '',
        area: 'Marathahalli',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560037',
        country: 'India',
      };

      const result = AddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('GeoLocationSchema', () => {
    it('should validate valid coordinates', () => {
      const validLocation = {
        lat: 12.9352,
        lng: 77.7015,
      };

      const result = GeoLocationSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it('should reject latitude out of range', () => {
      const invalidLocation = {
        lat: 100,
        lng: 77.7015,
      };

      const result = GeoLocationSchema.safeParse(invalidLocation);
      expect(result.success).toBe(false);
    });

    it('should reject longitude out of range', () => {
      const invalidLocation = {
        lat: 12.9352,
        lng: -200,
      };

      const result = GeoLocationSchema.safeParse(invalidLocation);
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePlaceSchema', () => {
    const validPlace = {
      name: 'Phoenix Mall',
      type: 'mall' as const,
      category: 'Shopping Center',
      address: {
        street: '142, Outer Ring Road',
        area: 'Marathahalli',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560037',
        country: 'India',
      },
      location: {
        lat: 12.9352,
        lng: 77.7015,
      },
    };

    it('should validate a valid place', () => {
      const result = CreatePlaceSchema.safeParse(validPlace);
      expect(result.success).toBe(true);
    });

    it('should reject place with invalid type', () => {
      const invalidPlace = {
        ...validPlace,
        type: 'invalid_type' as unknown as 'mall',
      };

      const result = CreatePlaceSchema.safeParse(invalidPlace);
      expect(result.success).toBe(false);
    });

    it('should reject place with missing name', () => {
      const invalidPlace = {
        ...validPlace,
        name: '',
      };

      const result = CreatePlaceSchema.safeParse(invalidPlace);
      expect(result.success).toBe(false);
    });

    it('should accept place with optional attributes', () => {
      const placeWithAttributes = {
        ...validPlace,
        attributes: {
          size: 'large',
          ratings: 4.5,
          visitorCount: 15000,
        },
      };

      const result = CreatePlaceSchema.safeParse(placeWithAttributes);
      expect(result.success).toBe(true);
    });

    it('should reject ratings out of range', () => {
      const placeWithInvalidRating = {
        ...validPlace,
        attributes: {
          ratings: 6,
        },
      };

      const result = CreatePlaceSchema.safeParse(placeWithInvalidRating);
      expect(result.success).toBe(false);
    });

    it('should validate all place types', () => {
      const placeTypes = [
        'mall',
        'airport',
        'hospital',
        'hotel',
        'school',
        'office',
        'restaurant',
        'retail',
        'event_venue',
        'transit',
      ] as const;

      for (const type of placeTypes) {
        const place = { ...validPlace, type };
        const result = CreatePlaceSchema.safeParse(place);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('UpdatePlaceSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Mall Name',
      };

      const result = UpdatePlaceSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty updates', () => {
      const emptyUpdate = {};

      const result = UpdatePlaceSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate nested updates', () => {
      const nestedUpdate = {
        attributes: {
          ratings: 4.8,
        },
      };

      const result = UpdatePlaceSchema.safeParse(nestedUpdate);
      expect(result.success).toBe(true);
    });
  });
});

describe('Type Exports', () => {
  it('should export all required types', async () => {
    const types = await import('../src/types/index.js');

    expect(types.PlaceType).toBeDefined();
    expect(types.PlaceStatus).toBeDefined();
    expect(types.PlaceFilters).toBeDefined();
    expect(types.NearbyQuery).toBeDefined();
    expect(types.SearchQuery).toBeDefined();
    expect(types.AudienceEstimate).toBeDefined();
    expect(types.ApiResponse).toBeDefined();
    expect(types.PaginatedResponse).toBeDefined();
  });
});