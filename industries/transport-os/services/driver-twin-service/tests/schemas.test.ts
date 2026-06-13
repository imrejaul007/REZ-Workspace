import {
  DriverTwinSchema,
  DriverStatusSchema,
  CreateDriverTwinRequestSchema,
  UpdateStatusRequestSchema,
  RatingRequestSchema,
} from '../src/schemas/driver-twin.schema.js';

// Set up test environment
process.env.NODE_ENV = 'test';

// Increase test timeout
jest.setTimeout(5000);

describe('Driver Twin Schemas', () => {
  describe('DriverStatusSchema', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['online', 'busy', 'offline', 'break', 'suspended'];
      validStatuses.forEach(status => {
        const result = DriverStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status values', () => {
      const result = DriverStatusSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('CreateDriverTwinRequestSchema', () => {
    it('should validate a valid create request', () => {
      const validData = {
        driver_id: 'DRV-001',
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@example.com',
          phone: '+1234567890',
        },
        licensing: {
          license_number: 'DL-123456',
          license_expiry: '2027-12-31',
        },
      };

      const result = CreateDriverTwinRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject request without driver_id', () => {
      const invalidData = {
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      const result = CreateDriverTwinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        driver_id: 'DRV-002',
        profile: {
          name: { first: 'Jane', last: 'Doe' },
          email: 'not-an-email',
          phone: '+1234567890',
        },
        licensing: {
          license_number: 'DL-123456',
          license_expiry: '2027-12-31',
        },
      };

      const result = CreateDriverTwinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format for license_expiry', () => {
      const invalidData = {
        driver_id: 'DRV-003',
        profile: {
          name: { first: 'Bob', last: 'Smith' },
          email: 'bob@example.com',
          phone: '+1234567890',
        },
        licensing: {
          license_number: 'DL-123456',
          license_expiry: '31-12-2027', // Wrong format
        },
      };

      const result = CreateDriverTwinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalData = {
        driver_id: 'DRV-004',
        profile: {
          name: { first: 'Alice', last: 'Wonder' },
          email: 'alice@example.com',
          phone: '+1234567890',
        },
        licensing: {
          license_number: 'DL-123456',
          license_expiry: '2027-12-31',
        },
      };

      const result = CreateDriverTwinRequestSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.language).toBe('en');
        expect(result.data.licensing.license_type).toBe('standard');
      }
    });
  });

  describe('UpdateStatusRequestSchema', () => {
    it('should validate status update with location', () => {
      const validData = {
        current: 'online',
        location: {
          lat: 25.2048,
          lng: 55.2708,
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      const result = UpdateStatusRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const invalidData = {
        current: 'online',
        location: {
          lat: 100, // Invalid: > 90
          lng: 55.2708,
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      const result = UpdateStatusRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const invalidData = {
        current: 'online',
        location: {
          lat: 25.2048,
          lng: 200, // Invalid: > 180
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      const result = UpdateStatusRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RatingRequestSchema', () => {
    it('should validate valid rating', () => {
      const validData = {
        rating: 5,
        trip_id: 'TRIP-001',
      };

      const result = RatingRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const invalidData = {
        rating: 0,
      };

      const result = RatingRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        rating: 6,
      };

      const result = RatingRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept rating of 1', () => {
      const validData = {
        rating: 1,
      };

      const result = RatingRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('DriverTwinSchema', () => {
    it('should validate complete driver twin', () => {
      const validTwin = {
        driver_id: 'DRV-001',
        twin_id: 'twin.transport.driver.DRV-001',
        profile: {
          name: { first: 'Complete', last: 'Twin' },
          email: 'complete@example.com',
          phone: '+1234567890',
          language: 'en',
        },
        licensing: {
          license_number: 'DL-123456',
          license_type: 'commercial',
          license_expiry: '2027-12-31',
          license_images: ['https://example.com/image.jpg'],
          background_check: {
            status: 'clear',
            completed_at: '2024-01-15T10:30:00.000Z',
          },
        },
        status: {
          current: 'online',
          location: {
            lat: 25.2048,
            lng: 55.2708,
            updated_at: '2024-01-15T10:30:00.000Z',
          },
          vehicle_id: 'VEH-001',
        },
        performance: {
          total_trips: 100,
          total_distance_km: 500,
          total_earnings: 2500,
          avg_rating: 4.5,
          rating_count: 50,
          acceptance_rate: 95,
          cancellation_rate: 5,
          on_time_rate: 98,
        },
        earnings: {
          today_earnings: 150,
          week_earnings: 800,
          month_earnings: 3200,
          pending_payout: 800,
          last_payout: {
            amount: 2500,
            date: '2024-01-01',
          },
        },
        schedule: {
          today_hours: 6,
          week_hours: 30,
          regulatory_hours_remaining: 6,
          shift_start: '2024-01-15T08:00:00.000Z',
        },
        vehicle_id: 'VEH-001',
        fleet_id: 'FLEET-001',
        version: 1,
      };

      const result = DriverTwinSchema.safeParse(validTwin);
      expect(result.success).toBe(true);
    });
  });
});
