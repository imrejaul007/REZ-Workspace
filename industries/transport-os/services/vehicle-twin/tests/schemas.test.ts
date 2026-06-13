import {
  CreateVehicleSchema,
  UpdateVehicleStatusSchema,
  VehicleQuerySchema,
  TelemetryUpdateSchema
} from '../src/schemas/vehicle.schemas';

describe('Vehicle Schemas', () => {
  describe('CreateVehicleSchema', () => {
    it('should validate valid vehicle data', () => {
      const validData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001',
          fleetId: 'FLEET-001'
        }
      };

      const result = CreateVehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        profile: {
          vin: '1HGBH41JXMN109186'
          // Missing other required fields
        }
      };

      const result = CreateVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalidData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'invalid_category',
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        }
      };

      const result = CreateVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid year', () => {
      const invalidData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 1800, // Too old
          color: 'Silver',
          category: 'sedan',
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        }
      };

      const result = CreateVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid ownership type', () => {
      const invalidData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'invalid_type',
          ownerId: 'OWNER-001'
        }
      };

      const result = CreateVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateVehicleStatusSchema', () => {
    it('should validate valid status update', () => {
      const validData = {
        status: 'available',
        location: {
          lat: 25.2048,
          lng: 55.2708
        },
        heading: 90,
        speed: 50
      };

      const result = UpdateVehicleStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status'
      };

      const result = UpdateVehicleStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid latitude', () => {
      const invalidData = {
        status: 'available',
        location: {
          lat: 100, // Invalid: must be -90 to 90
          lng: 55.2708
        }
      };

      const result = UpdateVehicleStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const invalidData = {
        status: 'available',
        location: {
          lat: 25.2048,
          lng: 200 // Invalid: must be -180 to 180
        }
      };

      const result = UpdateVehicleStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative speed', () => {
      const invalidData = {
        status: 'available',
        speed: -10
      };

      const result = UpdateVehicleStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('VehicleQuerySchema', () => {
    it('should validate valid query params', () => {
      const validQuery = {
        status: 'available',
        category: 'sedan',
        fleetId: 'FLEET-001',
        limit: 50,
        skip: 0
      };

      const result = VehicleQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const emptyQuery = {};

      const result = VehicleQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.skip).toBe(0);
      }
    });

    it('should reject limit over 100', () => {
      const invalidQuery = {
        limit: 200
      };

      const result = VehicleQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject negative skip', () => {
      const invalidQuery = {
        skip: -10
      };

      const result = VehicleQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('TelemetryUpdateSchema', () => {
    it('should validate valid telemetry update', () => {
      const validData = {
        fuelLevel: 75,
        batteryLevel: 80,
        odometer: 50000,
        engineHours: 1200,
        tirePressure: [32, 32, 31, 33],
        oilLevel: 85,
        coolantTemp: 90
      };

      const result = TelemetryUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject fuel level over 100', () => {
      const invalidData = {
        fuelLevel: 150
      };

      const result = TelemetryUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative odometer', () => {
      const invalidData = {
        odometer: -1000
      };

      const result = TelemetryUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null fuel level (for electric vehicles)', () => {
      const validData = {
        fuelLevel: null,
        batteryLevel: 80
      };

      const result = TelemetryUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial updates', () => {
      const partialData = {
        fuelLevel: 50
      };

      const result = TelemetryUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});
