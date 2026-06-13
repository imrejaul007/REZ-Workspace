import { twinService } from '../src/services';
import { GuestTwinModel, RoomTwinModel, PropertyTwinModel } from '../src/models';

describe('TwinService', () => {
  describe('Guest Twin Operations', () => {
    const validGuestInput = {
      property_id: 'prop-001',
      profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        nationality: 'US',
        language_preference: 'en',
        accessibility_needs: [],
      },
      loyalty: {
        tier: 'gold' as const,
        points_balance: 5000,
        total_stays: 10,
        total_spend: 5000,
      },
      price_sensitivity: 30,
    };

    it('should create a guest twin successfully', async () => {
      const guestTwin = await twinService.createGuestTwin(validGuestInput);

      expect(guestTwin).toBeDefined();
      expect(guestTwin.guest_id).toBeDefined();
      expect(guestTwin.property_id).toBe('prop-001');
      expect(guestTwin.profile.name).toBe('John Doe');
      expect(guestTwin.profile.email).toBe('john.doe@example.com');
      expect(guestTwin.loyalty.tier).toBe('gold');
      expect(guestTwin.loyalty.points_balance).toBe(5000);
      expect(guestTwin.price_sensitivity).toBe(30);
    });

    it('should create guest twin with provided guest_id', async () => {
      const inputWithId = {
        ...validGuestInput,
        guest_id: 'custom-guest-id-123',
      };

      const guestTwin = await twinService.createGuestTwin(inputWithId);

      expect(guestTwin.guest_id).toBe('custom-guest-id-123');
    });

    it('should throw error for duplicate guest_id', async () => {
      await twinService.createGuestTwin(validGuestInput);

      await expect(twinService.createGuestTwin(validGuestInput)).rejects.toThrow(
        'Guest twin already exists'
      );
    });

    it('should get guest twin by ID', async () => {
      const created = await twinService.createGuestTwin(validGuestInput);
      const retrieved = await twinService.getGuestTwin(created.guest_id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.guest_id).toBe(created.guest_id);
      expect(retrieved?.profile.name).toBe('John Doe');
    });

    it('should return null for non-existent guest', async () => {
      const result = await twinService.getGuestTwin('non-existent-id');
      expect(result).toBeNull();
    });

    it('should update guest preferences', async () => {
      const created = await twinService.createGuestTwin(validGuestInput);

      const updated = await twinService.updateGuestPreferences(created.guest_id, {
        room: {
          floor_preference: 'high',
          view_preference: 'ocean',
          noise_tolerance: 8,
        } as any,
      });

      expect(updated).toBeDefined();
      expect(updated?.preferences.room.floor_preference).toBe('high');
      expect(updated?.preferences.room.view_preference).toBe('ocean');
    });

    it('should return null when updating non-existent guest', async () => {
      const result = await twinService.updateGuestPreferences('non-existent-id', {
        room: { floor_preference: 'high' } as any,
      });
      expect(result).toBeNull();
    });
  });

  describe('Room Twin Operations', () => {
    const validRoomInput = {
      property_id: 'prop-001',
      room_number: '101',
      room_type: 'standard' as const,
      floor: 1,
      view: 'city' as const,
      revenue: {
        base_rate: 100,
        rack_rate: 150,
      },
    };

    it('should create a room twin successfully', async () => {
      const roomTwin = await twinService.createRoomTwin(validRoomInput);

      expect(roomTwin).toBeDefined();
      expect(roomTwin.room_id).toBeDefined();
      expect(roomTwin.room_number).toBe('101');
      expect(roomTwin.room_type).toBe('standard');
      expect(roomTwin.floor).toBe(1);
      expect(roomTwin.revenue.base_rate).toBe(100);
      expect(roomTwin.revenue.rack_rate).toBe(150);
      expect(roomTwin.status.current).toBe('available');
    });

    it('should get room status', async () => {
      const created = await twinService.createRoomTwin(validRoomInput);
      const status = await twinService.getRoomStatus(created.room_id);

      expect(status).toBeDefined();
      expect(status?.current).toBe('available');
    });

    it('should update room status', async () => {
      const created = await twinService.createRoomTwin(validRoomInput);

      const updated = await twinService.updateRoomStatus(created.room_id, {
        current: 'occupied',
      });

      expect(updated).toBeDefined();
      expect(updated?.status.current).toBe('occupied');
    });

    it('should return null for non-existent room status', async () => {
      const result = await twinService.getRoomStatus('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Property Twin Operations', () => {
    const validPropertyInput = {
      brand: 'TestBrand',
      name: 'Test Hotel',
      location: {
        address: '123 Test St',
        city: 'TestCity',
        country: 'US',
        coordinates: { lat: 40.7128, lng: -74.006 },
        timezone: 'America/New_York',
      },
      inventory: {
        total_rooms: 100,
        by_type: { standard: 50, deluxe: 30, suite: 20 },
        available_today: 70,
        available_tomorrow: 65,
      },
    };

    it('should create a property twin successfully', async () => {
      const propertyTwin = await twinService.createPropertyTwin(validPropertyInput);

      expect(propertyTwin).toBeDefined();
      expect(propertyTwin.property_id).toBeDefined();
      expect(propertyTwin.brand).toBe('TestBrand');
      expect(propertyTwin.name).toBe('Test Hotel');
      expect(propertyTwin.inventory.total_rooms).toBe(100);
      expect(propertyTwin.settings.pricing_rules.dynamic_pricing_enabled).toBe(true);
    });

    it('should get property twin by ID', async () => {
      const created = await twinService.createPropertyTwin(validPropertyInput);
      const retrieved = await twinService.getPropertyTwin(created.property_id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.property_id).toBe(created.property_id);
      expect(retrieved?.name).toBe('Test Hotel');
    });

    it('should return null for non-existent property', async () => {
      const result = await twinService.getPropertyTwin('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
