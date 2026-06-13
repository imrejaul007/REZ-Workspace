/**
 * Schema Validation Tests
 */

import {
  CreateGuestTwinSchema,
  CreateRoomTwinSchema,
  CreatePropertyTwinSchema,
  UpdateGuestPreferencesSchema,
  UpdateRoomStatusSchema,
  UpdateIoTStateSchema,
} from '../src/schemas';

describe('Schema Validation', () => {
  describe('CreateGuestTwinSchema', () => {
    it('should validate a valid guest twin input', () => {
      const validInput = {
        guest_id: 'G-001',
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          language_preference: 'en',
          accessibility_needs: [],
        },
      };

      const result = CreateGuestTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        guest_id: 'G-002',
        profile: {
          name: 'Jane Doe',
          email: 'invalid-email',
          phone: '+1234567890',
          language_preference: 'en',
          accessibility_needs: [],
        },
      };

      const result = CreateGuestTwinSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it('should apply default values for optional fields', () => {
      const minimalInput = {
        guest_id: 'G-003',
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
        },
      };

      const result = CreateGuestTwinSchema.safeParse(minimalInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.language_preference).toBe('en');
        expect(result.data.profile.accessibility_needs).toEqual([]);
      }
    });

    it('should validate loyalty tier enum', () => {
      const validInput = {
        guest_id: 'G-004',
        profile: {
          name: 'Gold Member',
          email: 'gold@example.com',
          phone: '+1234567890',
          language_preference: 'en',
          accessibility_needs: [],
        },
        loyalty: {
          tier: 'platinum',
          points_balance: 50000,
          member_since: '2020-01-15T10:00:00Z',
          total_stays: 50,
          total_spend: 50000,
        },
      };

      const result = CreateGuestTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loyalty?.tier).toBe('platinum');
      }
    });

    it('should reject invalid loyalty tier', () => {
      const invalidInput = {
        guest_id: 'G-005',
        profile: {
          name: 'Invalid Tier',
          email: 'invalid@example.com',
          phone: '+1234567890',
          language_preference: 'en',
          accessibility_needs: [],
        },
        loyalty: {
          tier: 'diamond',
          points_balance: 0,
          member_since: '2024-01-01T00:00:00Z',
          total_stays: 0,
          total_spend: 0,
        },
      };

      const result = CreateGuestTwinSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('CreateRoomTwinSchema', () => {
    it('should validate a valid room twin input', () => {
      const validInput = {
        room_id: 'R-101',
        property_id: 'P-001',
        room_number: '101',
        room_type: 'standard',
        floor: 1,
        view: 'city',
        capacity: {
          max_adults: 2,
          max_children: 1,
          max_occupancy: 3,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen',
          rollaway_available: true,
        },
      };

      const result = CreateRoomTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject room type not in enum', () => {
      const invalidInput = {
        room_id: 'R-102',
        property_id: 'P-001',
        room_number: '102',
        room_type: 'luxury',
        floor: 2,
        view: 'ocean',
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'king',
          rollaway_available: false,
        },
      };

      const result = CreateRoomTwinSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it('should validate view enum values', () => {
      const validInput = {
        room_id: 'R-103',
        property_id: 'P-001',
        room_number: '103',
        room_type: 'suite',
        floor: 5,
        view: 'pool',
        capacity: {
          max_adults: 4,
          max_children: 2,
          max_occupancy: 6,
        },
        bed_configuration: {
          bed_count: 2,
          bed_type: 'king',
          rollaway_available: false,
        },
      };

      const result = CreateRoomTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject invalid bed type', () => {
      const invalidInput = {
        room_id: 'R-104',
        property_id: 'P-001',
        room_number: '104',
        room_type: 'standard',
        floor: 1,
        view: 'garden',
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'super_king',
          rollaway_available: false,
        },
      };

      const result = CreateRoomTwinSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('CreatePropertyTwinSchema', () => {
    it('should validate a valid property twin input', () => {
      const validInput = {
        property_id: 'P-001',
        brand: 'Grand Hotels',
        name: 'Grand Plaza Hotel',
        location: {
          address: '123 Main Street',
          city: 'New York',
          country: 'USA',
          coordinates: { lat: 40.7128, lng: -74.006 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 200,
          available_today: 45,
          available_tomorrow: 52,
        },
      };

      const result = CreatePropertyTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should validate venue type enum', () => {
      const validInput = {
        property_id: 'P-002',
        brand: 'Test Brand',
        name: 'Test Hotel',
        location: {
          address: '456 Test Ave',
          city: 'Los Angeles',
          country: 'USA',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          timezone: 'America/Los_Angeles',
        },
        inventory: {
          total_rooms: 100,
          available_today: 20,
          available_tomorrow: 25,
        },
        venues: [
          {
            venue_id: 'V-001',
            name: 'Restaurant',
            type: 'restaurant',
            capacity: 80,
            hours: {
              monday: { open: '07:00', close: '23:00' },
            },
          },
        ],
      };

      const result = CreatePropertyTwinSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject invalid venue type', () => {
      const invalidInput = {
        property_id: 'P-003',
        brand: 'Test Brand',
        name: 'Test Hotel',
        location: {
          address: '789 Invalid Blvd',
          city: 'Chicago',
          country: 'USA',
          coordinates: { lat: 41.8781, lng: -87.6298 },
          timezone: 'America/Chicago',
        },
        inventory: {
          total_rooms: 50,
          available_today: 10,
          available_tomorrow: 12,
        },
        venues: [
          {
            venue_id: 'V-002',
            name: 'Casino',
            type: 'casino',
            capacity: 200,
            hours: {},
          },
        ],
      };

      const result = CreatePropertyTwinSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateGuestPreferencesSchema', () => {
    it('should validate partial preferences update', () => {
      const validInput = {
        room: {
          floor_preference: 'high',
        },
      };

      const result = UpdateGuestPreferencesSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should validate communication preferences', () => {
      const validInput = {
        communication: {
          preferred_channel: 'whatsapp',
          opt_ins: ['promotions', 'events'],
        },
      };

      const result = UpdateGuestPreferencesSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject invalid communication channel', () => {
      const invalidInput = {
        communication: {
          preferred_channel: 'telegram',
        },
      };

      const result = UpdateGuestPreferencesSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateRoomStatusSchema', () => {
    it('should validate room status update', () => {
      const validInput = {
        current: 'cleaning',
      };

      const result = UpdateRoomStatusSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should validate all status enum values', () => {
      const statuses = ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'];

      for (const status of statuses) {
        const result = UpdateRoomStatusSchema.safeParse({ current: status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const invalidInput = {
        current: 'maintenance',
      };

      const result = UpdateRoomStatusSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateIoTStateSchema', () => {
    it('should validate thermostat update', () => {
      const validInput = {
        thermostat: {
          target: 72,
          mode: 'cool',
        },
      };

      const result = UpdateIoTStateSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should validate lighting update', () => {
      const validInput = {
        lighting: {
          scene: 'evening',
          brightness: 50,
        },
      };

      const result = UpdateIoTStateSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('should reject brightness out of range', () => {
      const invalidInput = {
        lighting: {
          brightness: 150,
        },
      };

      const result = UpdateIoTStateSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it('should validate door lock states', () => {
      const lockedResult = UpdateIoTStateSchema.safeParse({
        door_lock: 'locked',
      });
      const unlockedResult = UpdateIoTStateSchema.safeParse({
        door_lock: 'unlocked',
      });

      expect(lockedResult.success).toBe(true);
      expect(unlockedResult.success).toBe(true);
    });

    it('should reject invalid door lock state', () => {
      const invalidInput = {
        door_lock: 'ajar',
      };

      const result = UpdateIoTStateSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});
