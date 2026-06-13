import { GuestMemoryService } from '../src/services/guest-memory.service';
import { TwinOSClient } from '../src/services/twinos-client';

describe('GuestMemoryService', () => {
  let service: GuestMemoryService;
  let mockTwinOSClient: jest.Mocked<TwinOSClient>;

  beforeEach(() => {
    // Create mock TwinOS client
    mockTwinOSClient = {
      createTwin: jest.fn().mockResolvedValue({
        success: true,
        twinId: 'twin.hotel.guest.test-id',
        createdAt: new Date().toISOString(),
        version: 1,
      }),
      getTwin: jest.fn(),
      updateTwin: jest.fn(),
      patchTwin: jest.fn().mockResolvedValue({
        twinId: 'twin.hotel.guest.test-id',
        twinType: 'HUMAN',
        industry: 'hotel',
        attributes: {},
        relationships: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }),
      deleteTwin: jest.fn(),
      listTwins: jest.fn(),
      addRelationship: jest.fn(),
      getRelationships: jest.fn(),
      removeRelationship: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
      getBaseUrl: jest.fn().mockReturnValue('http://localhost:4143'),
    } as unknown as jest.Mocked<TwinOSClient>;

    service = new GuestMemoryService(mockTwinOSClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuestTwin', () => {
    it('should create a guest twin with required fields', async () => {
      const input = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const result = await service.createGuestTwin(input);

      expect(result.guest_id).toBeDefined();
      expect(result.guest_twin_id).toBe('twin.hotel.guest.' + result.guest_id);
      expect(result.created_at).toBeDefined();
      expect(result.synced_to_twinos).toBe(true);
    });

    it('should create a guest twin with all optional fields', async () => {
      const input = {
        guest_id: 'custom-guest-id',
        profile: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1234567890',
          nationality: 'US',
          language_preference: 'en',
          accessibility_needs: ['wheelchair'],
        },
        loyalty: {
          tier: 'gold',
          points_balance: 5000,
          total_stays: 10,
          total_spend: 5000,
        },
        preferences: {
          room: {
            floor_preference: 'high',
            view_preference: 'ocean' as const,
            temperature_setting: {
              default: 72,
              range: { min: 68, max: 76 },
            },
          },
          dining: {
            dietary_restrictions: ['vegetarian'],
            allergies: ['peanuts'],
          },
        },
        sync_to_twinos: true,
      };

      const result = await service.createGuestTwin(input);

      expect(result.guest_id).toBe('custom-guest-id');
      expect(result.synced_to_twinos).toBe(true);
      expect(mockTwinOSClient.createTwin).toHaveBeenCalled();
    });

    it('should create guest twin without syncing to TwinOS', async () => {
      const input = {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
        },
        sync_to_twinos: false,
      };

      const result = await service.createGuestTwin(input);

      expect(result.synced_to_twinos).toBe(false);
      expect(mockTwinOSClient.createTwin).not.toHaveBeenCalled();
    });

    it('should sync to TwinOS when client is available', async () => {
      const input = {
        profile: {
          name: 'Sync Test',
          email: 'sync@example.com',
        },
        sync_to_twinos: true,
      };

      await service.createGuestTwin(input);

      expect(mockTwinOSClient.createTwin).toHaveBeenCalledWith(
        expect.objectContaining({
          twinType: 'HUMAN',
          industry: 'hotel',
          metadata: expect.objectContaining({
            source: 'guest_memory',
            createdBy: 'guest-memory-twinos',
          }),
        })
      );
    });
  });

  describe('getGuestTwin', () => {
    it('should return null for non-existent guest', async () => {
      const result = await service.getGuestTwin('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return guest twin after creation', async () => {
      const input = {
        profile: {
          name: 'Get Test',
          email: 'get@example.com',
        },
      };

      const created = await service.createGuestTwin(input);
      const result = await service.getGuestTwin(created.guest_id);

      expect(result).not.toBeNull();
      expect(result?.guest_id).toBe(created.guest_id);
      expect(result?.profile.name).toBe('Get Test');
    });
  });

  describe('updatePreferences', () => {
    it('should throw error for non-existent guest', async () => {
      await expect(
        service.updatePreferences({
          guest_id: 'non-existent',
          preferences: {
            room: { floor_preference: 'high' },
          },
        })
      ).rejects.toThrow('Guest Twin not found');
    });

    it('should update preferences successfully', async () => {
      const input = {
        profile: {
          name: 'Update Test',
          email: 'update@example.com',
        },
      };

      const created = await service.createGuestTwin(input);
      const result = await service.updatePreferences({
        guest_id: created.guest_id,
        preferences: {
          room: {
            floor_preference: 'high',
            view_preference: 'ocean' as const,
          },
          dining: {
            dietary_restrictions: ['vegan'],
          },
        },
        sync_to_twinos: true,
      });

      expect(result.guest_id).toBe(created.guest_id);
      expect(result.preferences.room.floor_preference).toBe('high');
      expect(result.preferences.dining.dietary_restrictions).toContain('vegan');
      expect(result.synced_to_twinos).toBe(true);
    });

    it('should merge preferences with existing ones', async () => {
      const input = {
        profile: {
          name: 'Merge Test',
          email: 'merge@example.com',
        },
        preferences: {
          room: {
            floor_preference: 'low',
          },
        },
      };

      const created = await service.createGuestTwin(input);
      const result = await service.updatePreferences({
        guest_id: created.guest_id,
        preferences: {
          room: {
            view_preference: 'pool' as const,
          },
        },
      });

      // Should have both original and new preferences
      expect(result.preferences.room.floor_preference).toBe('low');
      expect(result.preferences.room.view_preference).toBe('pool');
    });
  });

  describe('createRoomTwin', () => {
    it('should create a room twin', async () => {
      const input = {
        property_id: 'prop-001',
        room_number: '501',
        floor: 5,
      };

      const result = await service.createRoomTwin(input);

      expect(result.room_id).toBeDefined();
      expect(result.room_twin_id).toBe('twin.hotel.room.' + result.room_id);
      expect(result.synced_to_twinos).toBe(true);
    });

    it('should create room twin with all features', async () => {
      const input = {
        room_id: 'room-501',
        property_id: 'prop-001',
        room_number: '501',
        room_type: 'deluxe' as const,
        floor: 5,
        view: 'ocean' as const,
        capacity: {
          max_adults: 4,
          max_children: 2,
          max_occupancy: 6,
        },
        bed_configuration: {
          bed_count: 2,
          bed_type: 'king' as const,
          rollaway_available: true,
        },
        amenities: {
          smart_tv: true,
          smart_speaker: true,
          minibar: true,
          jacuzzi: true,
        },
        status: {
          current: 'available' as const,
        },
        iot_state: {
          thermostat: { current: 72, target: 72, mode: 'auto' },
          door_lock: 'locked' as const,
        },
        sync_to_twinos: true,
      };

      const result = await service.createRoomTwin(input);

      expect(result.room_id).toBe('room-501');
      expect(mockTwinOSClient.createTwin).toHaveBeenCalled();
    });
  });

  describe('getRoomStatus', () => {
    it('should return null for non-existent room', async () => {
      const result = await service.getRoomStatus('non-existent');
      expect(result).toBeNull();
    });

    it('should return room status with occupancy info', async () => {
      // Create a room first
      const roomResult = await service.createRoomTwin({
        property_id: 'prop-001',
        room_number: '502',
        floor: 5,
      });

      // Create a guest with this room
      await service.createGuestTwin({
        profile: {
          name: 'Occupied Guest',
          email: 'occupied@example.com',
        },
        current_stay: {
          room_id: roomResult.room_id,
          check_in: '2026-06-12T14:00:00Z',
          check_out: '2026-06-15T11:00:00Z',
        },
      });

      const result = await service.getRoomStatus(roomResult.room_id);

      expect(result).not.toBeNull();
      expect(result?.room_id).toBe(roomResult.room_id);
      expect(result?.occupancy?.occupied_by).toBeDefined();
    });
  });

  describe('createPropertyTwin', () => {
    it('should create a property twin', async () => {
      const input = {
        name: 'Grand Hotel',
        inventory: {
          total_rooms: 200,
          available_today: 150,
        },
      };

      const result = await service.createPropertyTwin(input);

      expect(result.property_id).toBeDefined();
      expect(result.property_twin_id).toBe('twin.hotel.property.' + result.property_id);
      expect(result.synced_to_twinos).toBe(true);
    });

    it('should create property twin with venues', async () => {
      const input = {
        property_id: 'prop-grand',
        name: 'Grand Hotel',
        brand: 'Luxury Collection',
        location: {
          address: '123 Main Street',
          city: 'New York',
          country: 'USA',
          coordinates: { lat: 40.7128, lng: -74.006 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 200,
          by_type: {
            standard: 100,
            deluxe: 50,
            suite: 40,
            penthouse: 10,
          },
          available_today: 150,
          available_tomorrow: 140,
        },
        venues: [
          {
            name: 'Main Restaurant',
            type: 'restaurant' as const,
            capacity: 100,
            hours: { open: '06:00', close: '23:00' },
          },
          {
            name: 'Rooftop Bar',
            type: 'bar' as const,
            capacity: 50,
            hours: { open: '17:00', close: '02:00' },
          },
          {
            name: 'Wellness Spa',
            type: 'spa' as const,
            capacity: 20,
          },
        ],
        staff: {
          total_count: 150,
          by_department: {
            front_desk: 20,
            housekeeping: 40,
            f_and_b: 50,
          },
          on_duty_now: 75,
        },
        services: {
          check_in_24h: true,
          concierge_available: true,
          room_service_hours: { open: '06:00', close: '23:00' },
        },
        revenue: {
          today_revenue: 50000,
          mtd_revenue: 1500000,
          ytd_revenue: 18000000,
          revpar: 250,
          adr: 350,
          occupancy_rate: 75,
        },
        sync_to_twinos: true,
      };

      const result = await service.createPropertyTwin(input);

      expect(result.property_id).toBe('prop-grand');
      expect(mockTwinOSClient.createTwin).toHaveBeenCalledWith(
        expect.objectContaining({
          twinType: 'ORGANIZATION',
          industry: 'hotel',
        })
      );
    });
  });

  describe('getAllGuestTwins', () => {
    it('should return empty array initially', () => {
      const result = service.getAllGuestTwins();
      expect(result).toEqual([]);
    });

    it('should return all created guest twins', async () => {
      await service.createGuestTwin({
        profile: { name: 'Guest 1', email: 'guest1@example.com' },
      });
      await service.createGuestTwin({
        profile: { name: 'Guest 2', email: 'guest2@example.com' },
      });

      const result = service.getAllGuestTwins();
      expect(result.length).toBe(2);
    });
  });

  describe('isTwinOSEnabledCheck', () => {
    it('should return true when TwinOS client is provided', () => {
      expect(service.isTwinOSEnabledCheck()).toBe(true);
    });

    it('should return false when no TwinOS client is provided', () => {
      const serviceWithoutClient = new GuestMemoryService();
      expect(serviceWithoutClient.isTwinOSEnabledCheck()).toBe(false);
    });
  });
});
