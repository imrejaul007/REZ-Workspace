/**
 * Room Twin Service Tests
 */

import { RoomTwinService } from '../src/services';

describe('RoomTwinService', () => {
  let service: RoomTwinService;

  beforeEach(() => {
    service = new RoomTwinService();
  });

  describe('createRoomTwin', () => {
    it('should create a new room twin with required fields', async () => {
      const input = {
        room_id: 'TEST-101',
        property_id: 'PROP-001',
        room_number: '101',
        room_type: 'standard' as const,
        floor: 1,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 1,
          max_occupancy: 3,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: true,
        },
      };

      const result = await service.createRoomTwin(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.twin_id).toBe('twin.hotel.room.TEST-101');
      expect(result.data?.room_id).toBe('TEST-101');
      expect(result.data?.room_type).toBe('standard');
      expect(result.data?.status.current).toBe('available');
      expect(result.data?.iot_state.door_lock).toBe('locked');
      expect(result.data?.version).toBe(1);
    });

    it('should create a room twin with all optional fields', async () => {
      const now = new Date().toISOString();
      const input = {
        room_id: 'TEST-102',
        property_id: 'PROP-001',
        room_number: '102',
        room_type: 'suite' as const,
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
          rollaway_available: false,
        },
        amenities: {
          smart_tv: true,
          smart_speaker: true,
          minibar: true,
          coffee_machine: true,
          safe: true,
          balcony: true,
          jacuzzi: true,
        },
        status: {
          current: 'occupied' as const,
          next_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          maintenance_alerts: [],
        },
        iot_state: {
          thermostat: { current: 72, target: 74, mode: 'cool' },
          lighting: { scene: 'evening', brightness: 60 },
          blinds: 'open' as const,
          door_lock: 'locked' as const,
          minibar_door: 'closed' as const,
          occupancy_sensor: true,
        },
        revenue: {
          base_rate: 350,
          rack_rate: 450,
          minibar_balance: 45.50,
          last_rate_update: now,
        },
      };

      const result = await service.createRoomTwin(input);

      expect(result.success).toBe(true);
      expect(result.data?.room_type).toBe('suite');
      expect(result.data?.view).toBe('ocean');
      expect(result.data?.amenities.jacuzzi).toBe(true);
      expect(result.data?.status.current).toBe('occupied');
      expect(result.data?.iot_state.thermostat.target).toBe(74);
      expect(result.data?.revenue.rack_rate).toBe(450);
    });

    it('should throw TwinAlreadyExistsError for duplicate room', async () => {
      const input = {
        room_id: 'TEST-103',
        property_id: 'PROP-001',
        room_number: '103',
        room_type: 'standard' as const,
        floor: 1,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'king' as const,
          rollaway_available: false,
        },
      };

      await service.createRoomTwin(input);

      await expect(service.createRoomTwin(input)).rejects.toThrow(
        'Room Twin already exists'
      );
    });
  });

  describe('getRoomTwin', () => {
    it('should retrieve an existing room twin', async () => {
      const createResult = await service.createRoomTwin({
        room_id: 'TEST-104',
        property_id: 'PROP-001',
        room_number: '104',
        room_type: 'deluxe' as const,
        floor: 2,
        view: 'pool' as const,
        capacity: {
          max_adults: 2,
          max_children: 1,
          max_occupancy: 3,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'king' as const,
          rollaway_available: true,
        },
      });

      const roomId = createResult.data?.room_id || 'TEST-104';
      const result = await service.getRoomTwin(roomId);

      expect(result.success).toBe(true);
      expect(result.data?.room_id).toBe(roomId);
      expect(result.data?.room_type).toBe('deluxe');
    });

    it('should throw TwinNotFoundError for non-existent room', async () => {
      await expect(service.getRoomTwin('NON-EXISTENT')).rejects.toThrow(
        'Room Twin not found'
      );
    });
  });

  describe('getRoomStatus', () => {
    it('should return room status and IoT state', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-105',
        property_id: 'PROP-001',
        room_number: '105',
        room_type: 'standard' as const,
        floor: 3,
        view: 'garden' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.getRoomStatus('TEST-105');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBeDefined();
      expect(result.data?.iot_state).toBeDefined();
      expect(result.data?.iot_state.door_lock).toBe('locked');
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-106',
        property_id: 'PROP-001',
        room_number: '106',
        room_type: 'standard' as const,
        floor: 4,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.updateRoomStatus('TEST-106', {
        current: 'cleaning',
      });

      expect(result.success).toBe(true);
      expect(result.data?.status.current).toBe('cleaning');
      expect(result.data?.version).toBe(2);
    });

    it('should update status with maintenance alerts', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-107',
        property_id: 'PROP-001',
        room_number: '107',
        room_type: 'standard' as const,
        floor: 5,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.updateRoomStatus('TEST-107', {
        current: 'out_of_order',
        maintenance_alerts: ['AC not working', 'Leaking faucet'],
      });

      expect(result.data?.status.current).toBe('out_of_order');
      expect(result.data?.status.maintenance_alerts).toContain('AC not working');
    });
  });

  describe('updateIoTState', () => {
    it('should update thermostat settings', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-108',
        property_id: 'PROP-001',
        room_number: '108',
        room_type: 'standard' as const,
        floor: 6,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.updateIoTState('TEST-108', {
        thermostat: {
          target: 68,
          mode: 'heat',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.iot_state.thermostat.target).toBe(68);
      expect(result.data?.iot_state.thermostat.mode).toBe('heat');
    });

    it('should update lighting scene', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-109',
        property_id: 'PROP-001',
        room_number: '109',
        room_type: 'standard' as const,
        floor: 7,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.updateIoTState('TEST-109', {
        lighting: {
          scene: 'movie',
          brightness: 20,
        },
      });

      expect(result.data?.iot_state.lighting.scene).toBe('movie');
      expect(result.data?.iot_state.lighting.brightness).toBe(20);
    });

    it('should update door lock status', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-110',
        property_id: 'PROP-001',
        room_number: '110',
        room_type: 'standard' as const,
        floor: 8,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.updateIoTState('TEST-110', {
        door_lock: 'unlocked',
      });

      expect(result.data?.iot_state.door_lock).toBe('unlocked');
    });
  });

  describe('updateHousekeeping', () => {
    it('should update housekeeping status', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-111',
        property_id: 'PROP-001',
        room_number: '111',
        room_type: 'standard' as const,
        floor: 9,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const now = new Date().toISOString();
      const result = await service.updateHousekeeping('TEST-111', {
        last_cleaned: now,
        frequency: 'on_departure',
        supply_status: 'low',
      });

      expect(result.data?.housekeeping.last_cleaned).toBe(now);
      expect(result.data?.housekeeping.frequency).toBe('on_departure');
      expect(result.data?.housekeeping.supply_status).toBe('low');
    });
  });

  describe('getRoomsByProperty', () => {
    it('should return rooms for a specific property', async () => {
      // Create rooms for a new property
      await service.createRoomTwin({
        room_id: 'PROP2-101',
        property_id: 'PROP-002',
        room_number: '101',
        room_type: 'standard' as const,
        floor: 1,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.getRoomsByProperty('PROP-002');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.every((r) => r.property_id === 'PROP-002')).toBe(true);
    });
  });

  describe('deleteRoomTwin', () => {
    it('should delete an existing room twin', async () => {
      await service.createRoomTwin({
        room_id: 'TEST-DELETE',
        property_id: 'PROP-001',
        room_number: '999',
        room_type: 'standard' as const,
        floor: 10,
        view: 'city' as const,
        capacity: {
          max_adults: 2,
          max_children: 0,
          max_occupancy: 2,
        },
        bed_configuration: {
          bed_count: 1,
          bed_type: 'queen' as const,
          rollaway_available: false,
        },
      });

      const result = await service.deleteRoomTwin('TEST-DELETE');

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);

      // Verify room is deleted
      await expect(service.getRoomTwin('TEST-DELETE')).rejects.toThrow('Room Twin not found');
    });
  });
});
