import { RoomTwinService } from '../src/services/room-twin.service.js';
import { RoomTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('RoomTwinService', () => {
  let service: RoomTwinService;

  beforeEach(() => {
    service = new RoomTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await RoomTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new room twin', async () => {
      const data = {
        room_id: '501',
        room_number: '501',
        property_id: 'PROP-001',
        room_type: 'deluxe' as const,
        floor: 5,
        view: 'ocean' as const,
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
        amenities: {
          smart_tv: true,
          smart_speaker: true,
          minibar: true,
          coffee_machine: true,
          safe: true,
          balcony: true,
          jacuzzi: false,
        },
        revenue: {
          base_rate: 200,
          rack_rate: 250,
        },
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.room_id).toBe('501');
      expect(result.twin_id).toBe('twin.hotel.room.501');
      expect(result.room_type).toBe('deluxe');
      expect(result.status.current).toBe('available');
      expect(result.amenities.smart_tv).toBe(true);
      expect(result.revenue.base_rate).toBe(200);
    });

    it('should throw error if room already exists', async () => {
      const data = {
        room_id: '502',
        room_number: '502',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });
  });

  describe('getById', () => {
    it('should return room twin by room_id', async () => {
      const data = {
        room_id: '503',
        room_number: '503',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);
      const result = await service.getById('503');

      expect(result).toBeDefined();
      expect(result?.room_id).toBe('503');
    });

    it('should return null for non-existent room', async () => {
      const result = await service.getById('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return simplified room status', async () => {
      const data = {
        room_id: '504',
        room_number: '504',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);
      const result = await service.getStatus('504');

      expect(result).toBeDefined();
      expect(result?.room_id).toBe('504');
      expect(result?.status).toBe('available');
    });
  });

  describe('updateStatus', () => {
    it('should update room status', async () => {
      const data = {
        room_id: '505',
        room_number: '505',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.updateStatus('505', {
        status: 'occupied',
      });

      expect(result?.status.current).toBe('occupied');
    });

    it('should add maintenance alert', async () => {
      const data = {
        room_id: '506',
        room_number: '506',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.updateStatus('506', {
        status: 'out_of_order',
        maintenance_alerts: ['AC not working'],
      });

      expect(result?.status.current).toBe('out_of_order');
      expect(result?.status.maintenance_alerts).toContain('AC not working');
    });
  });

  describe('updateIoTState', () => {
    it('should update thermostat state', async () => {
      const data = {
        room_id: '507',
        room_number: '507',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.updateIoTState('507', {
        thermostat: {
          current: 72,
          target: 70,
          mode: 'cool',
        },
      });

      expect(result?.iot_state.thermostat?.current).toBe(72);
      expect(result?.iot_state.thermostat?.target).toBe(70);
      expect(result?.iot_state.thermostat?.mode).toBe('cool');
    });

    it('should update lighting state', async () => {
      const data = {
        room_id: '508',
        room_number: '508',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.updateIoTState('508', {
        lighting: {
          scene: 'evening',
          brightness: 50,
        },
      });

      expect(result?.iot_state.lighting?.scene).toBe('evening');
      expect(result?.iot_state.lighting?.brightness).toBe(50);
    });

    it('should update door lock state', async () => {
      const data = {
        room_id: '509',
        room_number: '509',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.updateIoTState('509', {
        door_lock: 'locked',
      });

      expect(result?.iot_state.door_lock).toBe('locked');
    });
  });

  describe('assignGuest', () => {
    it('should assign guest to room', async () => {
      const data = {
        room_id: '510',
        room_number: '510',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const result = await service.assignGuest('510', 'G-001');

      expect(result?.current_guest_id).toBe('G-001');
      expect(result?.status.current).toBe('occupied');
    });
  });

  describe('clearGuest', () => {
    it('should clear guest from room and set to cleaning', async () => {
      const data = {
        room_id: '511',
        room_number: '511',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);
      await service.assignGuest('511', 'G-001');

      const result = await service.clearGuest('511');

      expect(result?.current_guest_id).toBeNull();
      expect(result?.status.current).toBe('cleaning');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      const rooms = [
        { room_id: '512', room_number: '512', property_id: 'PROP-001', floor: 5, room_type: 'deluxe' as const },
        { room_id: '513', room_number: '513', property_id: 'PROP-001', floor: 5, room_type: 'standard' as const },
        { room_id: '514', room_number: '514', property_id: 'PROP-002', floor: 6, room_type: 'suite' as const },
      ];

      for (const room of rooms) {
        await service.create(room);
      }
    });

    it('should list all rooms', async () => {
      const result = await service.list({});

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(3);
    });

    it('should filter by property_id', async () => {
      const result = await service.list({ property_id: 'PROP-001' });

      expect(result.total).toBe(2);
      expect(result.twins.every(r => r.property_id === 'PROP-001')).toBe(true);
    });

    it('should filter by room_type', async () => {
      const result = await service.list({ room_type: 'deluxe' });

      expect(result.total).toBe(1);
      expect(result.twins[0].room_type).toBe('deluxe');
    });

    it('should filter by floor', async () => {
      const result = await service.list({ floor: 6 });

      expect(result.total).toBe(1);
      expect(result.twins[0].floor).toBe(6);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const rooms = [
        { room_id: '515', room_number: '515', property_id: 'PROP-001', floor: 5, room_type: 'deluxe' as const, revenue: { base_rate: 200, rack_rate: 250 } },
        { room_id: '516', room_number: '516', property_id: 'PROP-001', floor: 5, room_type: 'deluxe' as const, revenue: { base_rate: 200, rack_rate: 250 } },
        { room_id: '517', room_number: '517', property_id: 'PROP-001', floor: 5, room_type: 'standard' as const, revenue: { base_rate: 100, rack_rate: 150 } },
      ];

      for (const room of rooms) {
        await service.create(room);
      }

      // Update one to occupied
      await service.updateStatus('515', { status: 'occupied' });
    });

    it('should calculate room statistics', async () => {
      const result = await service.getStats();

      expect(result.total).toBe(3);
      expect(result.by_status.available).toBe(2);
      expect(result.by_status.occupied).toBe(1);
      expect(result.by_type.deluxe).toBe(2);
      expect(result.by_type.standard).toBe(1);
      expect(result.occupancy_rate).toBeCloseTo(33.33, 1);
      expect(result.avg_rate).toBeCloseTo(166.67, 1);
    });
  });

  describe('delete', () => {
    it('should delete room twin', async () => {
      const data = {
        room_id: '518',
        room_number: '518',
        property_id: 'PROP-001',
        floor: 5,
      };

      await service.create(data);

      const deleted = await service.delete('518');
      expect(deleted).toBe(true);

      const result = await service.getById('518');
      expect(result).toBeNull();
    });
  });
});