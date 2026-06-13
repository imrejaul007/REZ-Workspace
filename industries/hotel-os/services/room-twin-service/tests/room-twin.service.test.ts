import { RoomTwinService } from '../src/services/room-twin.service';
import { RoomTwin } from '../src/models/types';
import mongoose from 'mongoose';

describe('RoomTwinService', () => {
  let service: RoomTwinService;

  beforeEach(() => {
    service = new RoomTwinService();
  });

  afterEach(async () => {
    await RoomTwin.deleteMany({});
  });

  describe('createRoomTwin', () => {
    it('should create a new room twin', async () => {
      const input = {
        roomId: 'ROOM-101',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        category: 'standard' as const,
        features: {
          bedType: 'queen',
          maxOccupancy: 2,
          size: 350,
          floor: 1,
          amenities: ['wifi', 'tv', 'minibar']
        }
      };

      const result = await service.createRoomTwin(input);

      expect(result).toBeDefined();
      expect(result.roomId).toBe('ROOM-101');
      expect(result.propertyId).toBe('PROP-001');
      expect(result.status).toBe('available');
      expect(result.occupancy).toBe('vacant');
      expect(result.iot.state.temperature).toBe(22);
      expect(result.features.bedType).toBe('queen');
    });

    it('should throw error if room already exists', async () => {
      const input = {
        roomId: 'ROOM-101',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '101',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);

      await expect(service.createRoomTwin(input)).rejects.toThrow('already exists');
    });

    it('should set default IoT state', async () => {
      const input = {
        roomId: 'ROOM-102',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '102',
        features: {
          bedType: 'king',
          size: 450,
          floor: 1
        }
      };

      const result = await service.createRoomTwin(input);

      expect(result.iot.state.doorLock).toBe(true);
      expect(result.iot.state.tv.power).toBe(false);
      expect(result.iot.state.blinds.mode).toBe('closed');
      expect(result.iot.state.climate.mode).toBe('auto');
    });
  });

  describe('getRoomTwin', () => {
    it('should retrieve a room twin by ID', async () => {
      const input = {
        roomId: 'ROOM-103',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '103',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      const result = await service.getRoomTwin('ROOM-103');

      expect(result).toBeDefined();
      expect(result?.roomId).toBe('ROOM-103');
    });

    it('should return null for non-existent room', async () => {
      const result = await service.getRoomTwin('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('updateRoomTwin', () => {
    it('should update room status', async () => {
      const input = {
        roomId: 'ROOM-104',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '104',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      const result = await service.updateRoomTwin('ROOM-104', { status: 'occupied' });

      expect(result).toBeDefined();
      expect(result?.status).toBe('occupied');
    });

    it('should update IoT state', async () => {
      const input = {
        roomId: 'ROOM-105',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '105',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      const result = await service.updateRoomTwin('ROOM-105', {
        iotState: {
          temperature: 24,
          targetTemperature: 24
        }
      });

      expect(result).toBeDefined();
      expect(result?.iot.state.temperature).toBe(24);
      expect(result?.iot.state.targetTemperature).toBe(24);
    });
  });

  describe('checkInGuest', () => {
    it('should check in a guest to room', async () => {
      const input = {
        roomId: 'ROOM-106',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '106',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      const result = await service.checkInGuest('ROOM-106', 'GUEST-001', 'RES-001');

      expect(result).toBeDefined();
      expect(result?.status).toBe('occupied');
      expect(result?.occupancy).toBe('occupied');
      expect(result?.currentGuestId).toBe('GUEST-001');
      expect(result?.currentReservationId).toBe('RES-001');
      expect(result?.iot.state.occupancy.guestPresent).toBe(true);
    });
  });

  describe('checkOutGuest', () => {
    it('should check out a guest from room', async () => {
      const input = {
        roomId: 'ROOM-107',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '107',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      await service.checkInGuest('ROOM-107', 'GUEST-001', 'RES-001');
      const result = await service.checkOutGuest('ROOM-107');

      expect(result).toBeDefined();
      expect(result?.status).toBe('cleaning');
      expect(result?.occupancy).toBe('checked-out');
      expect(result?.currentGuestId).toBeNull();
      expect(result?.iot.state.occupancy.guestPresent).toBe(false);
    });
  });

  describe('getRoomStatus', () => {
    it('should return room status with IoT state', async () => {
      const input = {
        roomId: 'ROOM-108',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '108',
        features: {
          bedType: 'queen',
          size: 350,
          floor: 1
        }
      };

      await service.createRoomTwin(input);
      await service.checkInGuest('ROOM-108', 'GUEST-001', 'RES-001');

      const status = await service.getRoomStatus('ROOM-108');

      expect(status).toBeDefined();
      expect(status?.roomId).toBe('ROOM-108');
      expect(status?.status).toBe('occupied');
      expect(status?.iotState).toBeDefined();
      expect(status?.currentGuestId).toBe('GUEST-001');
    });
  });

  describe('getAvailableRooms', () => {
    it('should return only available rooms', async () => {
      // Create multiple rooms
      await service.createRoomTwin({
        roomId: 'ROOM-109',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '109',
        features: { bedType: 'queen', size: 350, floor: 1 }
      });

      await service.createRoomTwin({
        roomId: 'ROOM-110',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '110',
        features: { bedType: 'king', size: 450, floor: 1 }
      });

      await service.checkInGuest('ROOM-109', 'GUEST-001', 'RES-001');

      const availableRooms = await service.getAvailableRooms('PROP-001');

      expect(availableRooms).toHaveLength(1);
      expect(availableRooms[0].roomId).toBe('ROOM-110');
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics for a property', async () => {
      await service.createRoomTwin({
        roomId: 'ROOM-111',
        propertyId: 'PROP-002',
        floor: 1,
        roomNumber: '111',
        features: { bedType: 'queen', size: 350, floor: 1 }
      });

      await service.createRoomTwin({
        roomId: 'ROOM-112',
        propertyId: 'PROP-002',
        floor: 1,
        roomNumber: '112',
        features: { bedType: 'king', size: 450, floor: 1 }
      });

      await service.checkInGuest('ROOM-111', 'GUEST-001', 'RES-001');

      const stats = await service.getRoomStats('PROP-002');

      expect(stats.total).toBe(2);
      expect(stats.occupied).toBe(1);
      expect(stats.available).toBe(1);
      expect(stats.occupancyRate).toBe(50);
    });
  });

  describe('addMaintenanceIssue', () => {
    it('should add a maintenance issue to room', async () => {
      await service.createRoomTwin({
        roomId: 'ROOM-113',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '113',
        features: { bedType: 'queen', size: 350, floor: 1 }
      });

      const result = await service.addMaintenanceIssue('ROOM-113', 'AC not working', 'high');

      expect(result).toBeDefined();
      expect(result?.maintenance.issues).toHaveLength(1);
      expect(result?.maintenance.issues[0].description).toBe('AC not working');
      expect(result?.maintenance.issues[0].severity).toBe('high');
      expect(result?.status).toBe('maintenance');
    });

    it('should set room to out-of-order for critical issues', async () => {
      await service.createRoomTwin({
        roomId: 'ROOM-114',
        propertyId: 'PROP-001',
        floor: 1,
        roomNumber: '114',
        features: { bedType: 'queen', size: 350, floor: 1 }
      });

      const result = await service.addMaintenanceIssue('ROOM-114', 'Water leak', 'critical');

      expect(result?.status).toBe('out-of-order');
    });
  });
});
