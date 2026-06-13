import {
  CreateGuestTwinRequestSchema,
  UpdatePreferencesRequestSchema,
  CreateRoomTwinRequestSchema,
  CreatePropertyTwinRequestSchema,
} from '../src/validators';

describe('Validators', () => {
  describe('CreateGuestTwinRequestSchema', () => {
    it('should validate a valid guest twin request', () => {
      const validRequest = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidRequest = {
        profile: {
          name: '',
          email: 'john@example.com',
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        profile: {
          name: 'John Doe',
          email: 'not-an-email',
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate loyalty tier enum', () => {
      const validRequest = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        loyalty: {
          tier: 'platinum',
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid loyalty tier', () => {
      const invalidRequest = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        loyalty: {
          tier: 'diamond', // Invalid tier
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate preferences structure', () => {
      const validRequest = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        preferences: {
          room: {
            floor_preference: 'high',
            view_preference: 'ocean',
          },
          dining: {
            dietary_restrictions: ['vegetarian'],
            allergies: ['peanuts', 'shellfish'],
          },
          amenities: {
            fitness_habits: true,
            pool_usage: true,
          },
          communication: {
            preferred_channel: 'app_push',
            opt_ins: ['promotions', 'updates'],
          },
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should set default values for optional fields', () => {
      const minimalRequest = {
        profile: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      };

      const result = CreateGuestTwinRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.language_preference).toBe('en');
        expect(result.data.profile.accessibility_needs).toEqual([]);
        expect(result.data.sync_to_twinos).toBe(true);
      }
    });
  });

  describe('UpdatePreferencesRequestSchema', () => {
    it('should validate a valid preferences update', () => {
      const validRequest = {
        preferences: {
          room: {
            floor_preference: 'high',
          },
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate temperature setting bounds', () => {
      const validRequest = {
        preferences: {
          room: {
            temperature_setting: {
              default: 72,
            },
          },
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject temperature below minimum', () => {
      const invalidRequest = {
        preferences: {
          room: {
            temperature_setting: {
              default: 10, // Too low (min is 16)
            },
          },
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject temperature above maximum', () => {
      const invalidRequest = {
        preferences: {
          room: {
            temperature_setting: {
              default: 35, // Too high (max is 30)
            },
          },
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateRoomTwinRequestSchema', () => {
    it('should validate a valid room twin request', () => {
      const validRequest = {
        property_id: 'prop-001',
        room_number: '501',
        floor: 5,
      };

      const result = CreateRoomTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing property_id', () => {
      const invalidRequest = {
        room_number: '501',
        floor: 5,
      };

      const result = CreateRoomTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject negative floor', () => {
      const invalidRequest = {
        property_id: 'prop-001',
        room_number: '501',
        floor: -1,
      };

      const result = CreateRoomTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate room type enum', () => {
      const validRequest = {
        property_id: 'prop-001',
        room_number: '501',
        floor: 5,
        room_type: 'penthouse',
      };

      const result = CreateRoomTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate IoT state', () => {
      const validRequest = {
        property_id: 'prop-001',
        room_number: '501',
        floor: 5,
        iot_state: {
          thermostat: {
            current: 72,
            target: 72,
            mode: 'auto',
          },
          lighting: {
            scene: 'evening',
            brightness: 50,
          },
          blinds: 'open',
          door_lock: 'locked',
          occupancy_sensor: true,
        },
      };

      const result = CreateRoomTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should set default values', () => {
      const minimalRequest = {
        property_id: 'prop-001',
        room_number: '501',
        floor: 5,
      };

      const result = CreateRoomTwinRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.room_type).toBe('standard');
        expect(result.data.view).toBe('city');
        expect(result.data.sync_to_twinos).toBe(true);
      }
    });
  });

  describe('CreatePropertyTwinRequestSchema', () => {
    it('should validate a valid property twin request', () => {
      const validRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const invalidRequest = {
        inventory: {
          total_rooms: 200,
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject zero total rooms', () => {
      const invalidRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 0,
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate venues array', () => {
      const validRequest = {
        name: 'Resort Hotel',
        inventory: {
          total_rooms: 100,
        },
        venues: [
          {
            name: 'Main Restaurant',
            type: 'restaurant',
            capacity: 100,
          },
          {
            name: 'Spa',
            type: 'spa',
            capacity: 20,
          },
        ],
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid venue type', () => {
      const invalidRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
        },
        venues: [
          {
            name: 'Store',
            type: 'shop', // Invalid venue type
            capacity: 50,
          },
        ],
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate coordinates', () => {
      const validRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
        },
        location: {
          coordinates: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate revenue metrics', () => {
      const validRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
        },
        revenue: {
          today_revenue: 50000,
          mtd_revenue: 1500000,
          ytd_revenue: 18000000,
          revpar: 250,
          adr: 350,
          occupancy_rate: 75,
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject occupancy rate above 100', () => {
      const invalidRequest = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
        },
        revenue: {
          occupancy_rate: 150, // Invalid: max is 100
        },
      };

      const result = CreatePropertyTwinRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
