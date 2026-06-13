import {
  CreateRoomTwinSchema,
  UpdateRoomTwinSchema,
  CreateGuestTwinSchema,
  UpdateGuestPreferencesSchema,
  CreatePropertyTwinSchema,
  IoTEventSchema,
  IoTCommandSchema
} from '../src/schemas';

describe('API Schemas', () => {
  describe('CreateRoomTwinSchema', () => {
    it('should validate a valid room twin input', () => {
      const input = {
        roomId: 'ROOM-101',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        category: 'standard',
        features: {
          bedType: 'queen',
          maxOccupancy: 2,
          size: 350,
          sizeUnit: 'sqft',
          floor: 1,
          amenities: ['wifi', 'tv']
        }
      };

      const result = CreateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid room ID', () => {
      const input = {
        roomId: '',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      const result = CreateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const input = {
        roomId: 'ROOM-101',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        category: 'invalid-category',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      const result = CreateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional devices array', () => {
      const input = {
        roomId: 'ROOM-101',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        },
        devices: [
          {
            deviceId: 'DEV-001',
            deviceType: 'thermostat',
            manufacturer: 'Nest',
            model: 'Learning Thermostat',
            firmwareVersion: '1.0'
          }
        ]
      };

      const result = CreateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateRoomTwinSchema', () => {
    it('should validate valid status update', () => {
      const input = { status: 'occupied' };
      const result = UpdateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate valid IoT state update', () => {
      const input = {
        iotState: {
          temperature: 24,
          targetTemperature: 24,
          lighting: {
            main: 80,
            ambient: 50,
            bathroom: 30
          }
        }
      };

      const result = UpdateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const input = { status: 'invalid-status' };
      const result = UpdateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate temperature range', () => {
      const input = {
        iotState: {
          temperature: 150 // too high
        }
      };

      const result = UpdateRoomTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateGuestTwinSchema', () => {
    it('should validate a valid guest twin input', () => {
      const input = {
        guestId: 'GUEST-001',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        loyalty: {
          tier: 'gold',
          points: 5000
        },
        preferences: {
          room: {
            temperature: 22,
            lighting: 50
          }
        }
      };

      const result = CreateGuestTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        guestId: 'GUEST-001',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          phone: '+1234567890'
        }
      };

      const result = CreateGuestTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid loyalty tier', () => {
      const input = {
        guestId: 'GUEST-001',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        loyalty: {
          tier: 'platinum-plus'
        }
      };

      const result = CreateGuestTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid notification preferences', () => {
      const input = {
        guestId: 'GUEST-001',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      };

      const result = CreateGuestTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateGuestPreferencesSchema', () => {
    it('should validate room temperature preference', () => {
      const input = {
        preferences: {
          room: {
            temperature: 25
          }
        }
      };

      const result = UpdateGuestPreferencesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject temperature below minimum', () => {
      const input = {
        preferences: {
          room: {
            temperature: 10
          }
        }
      };

      const result = UpdateGuestPreferencesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject temperature above maximum', () => {
      const input = {
        preferences: {
          room: {
            temperature: 35
          }
        }
      };

      const result = UpdateGuestPreferencesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate dietary preferences', () => {
      const input = {
        preferences: {
          dietary: ['vegetarian', 'gluten-free', 'vegan']
        }
      };

      const result = UpdateGuestPreferencesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('CreatePropertyTwinSchema', () => {
    it('should validate a valid property twin input', () => {
      const input = {
        propertyId: 'PROP-001',
        name: 'Grand Hotel',
        brand: 'Luxury Collection',
        type: 'hotel',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        },
        contact: {
          phone: '+1-212-555-0100',
          email: 'info@grandhotel.com',
          website: 'https://grandhotel.com'
        },
        venues: [
          {
            venueId: 'VEN-001',
            name: 'Restaurant',
            type: 'restaurant',
            capacity: 100
          }
        ],
        amenities: ['pool', 'spa', 'gym'],
        policies: {
          checkInTime: '15:00',
          checkOutTime: '11:00'
        }
      };

      const result = CreatePropertyTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        propertyId: 'PROP-001',
        name: 'Grand Hotel',
        brand: 'Luxury Collection',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        },
        contact: {
          phone: '+1-212-555-0100',
          email: 'invalid-email'
        }
      };

      const result = CreatePropertyTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate venue types', () => {
      const input = {
        propertyId: 'PROP-001',
        name: 'Grand Hotel',
        brand: 'Luxury Collection',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        },
        contact: {
          phone: '+1-212-555-0100',
          email: 'info@grandhotel.com'
        },
        venues: [
          {
            venueId: 'VEN-001',
            name: 'Rooftop Bar',
            type: 'bar'
          }
        ]
      };

      const result = CreatePropertyTwinSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid venue type', () => {
      const input = {
        propertyId: 'PROP-001',
        name: 'Grand Hotel',
        brand: 'Luxury Collection',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        },
        contact: {
          phone: '+1-212-555-0100',
          email: 'info@grandhotel.com'
        },
        venues: [
          {
            venueId: 'VEN-001',
            name: 'Unknown Venue',
            type: 'unknown-type'
          }
        ]
      };

      const result = CreatePropertyTwinSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('IoTEventSchema', () => {
    it('should validate a valid IoT event', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        eventType: 'state_change',
        payload: {
          temperature: 22,
          humidity: 50
        },
        timestamp: new Date()
      };

      const result = IoTEventSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        eventType: 'invalid_event',
        payload: {},
        timestamp: new Date()
      };

      const result = IoTEventSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate heartbeat event', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        eventType: 'heartbeat',
        payload: {
          batteryLevel: 85,
          signalStrength: -45
        },
        timestamp: new Date()
      };

      const result = IoTEventSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate alert event', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        eventType: 'alert',
        payload: {
          type: 'temperature_high',
          severity: 'high',
          message: 'Temperature exceeded 30°C'
        },
        timestamp: new Date()
      };

      const result = IoTEventSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('IoTCommandSchema', () => {
    it('should validate a valid IoT command', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        command: 'setTemperature',
        parameters: {
          temperature: 22
        }
      };

      const result = IoTCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept command without parameters', () => {
      const input = {
        deviceId: 'DEV-001',
        roomId: 'ROOM-101',
        command: 'reset'
      };

      const result = IoTCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate lighting command', () => {
      const input = {
        deviceId: 'DEV-002',
        roomId: 'ROOM-101',
        command: 'setBrightness',
        parameters: {
          brightness: 80,
          zone: 'main'
        }
      };

      const result = IoTCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate door lock command', () => {
      const input = {
        deviceId: 'DEV-003',
        roomId: 'ROOM-101',
        command: 'lock',
        parameters: {
          duration: 5000
        }
      };

      const result = IoTCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
