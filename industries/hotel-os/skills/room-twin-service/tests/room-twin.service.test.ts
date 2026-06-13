import { RoomTwinService } from '../src/services/room-twin.service';
import { RoomTwin } from '../src/models/room-twin.model';
import { CreateRoomTwinRequest } from '../src/schemas/room-twin.schema';

// Mock dependencies
jest.mock('../src/models/room-twin.model');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));
jest.mock('../src/utils/message-broker', () => ({
  messageBroker: {
    publish: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true)
  }
}));
jest.mock('../src/utils/predictive-hk-client', () => ({
  predictiveHKClient: {
    syncRoom: jest.fn().mockResolvedValue(undefined),
    updateRoomStatus: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('RoomTwinService', () => {
  let service: RoomTwinService;

  beforeEach(() => {
    service = new RoomTwinService();
    jest.clearAllMocks();
  });

  describe('createRoomTwin', () => {
    const mockRequest: CreateRoomTwinRequest = {
      roomId: 'ROOM-501',
      propertyId: 'PROP-001',
      roomNumber: '501',
      roomType: 'deluxe',
      floor: 5,
      view: 'ocean',
      capacity: {
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3
      },
      bedConfiguration: {
        bedCount: 1,
        bedType: 'king',
        rollawayAvailable: true
      },
      amenities: {
        smartTv: true,
        smartSpeaker: true,
        minibar: true,
        coffeeMachine: true,
        safe: true,
        balcony: true,
        jacuzzi: false
      }
    };

    it('should create a new room twin successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockCreatedAt = new Date();

      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(null);
      (RoomTwin as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        createdAt: mockCreatedAt,
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501'
      }));

      const result = await service.createRoomTwin(mockRequest);

      expect(result).toHaveProperty('twinId');
      expect(result).toHaveProperty('roomId', 'ROOM-501');
      expect(result).toHaveProperty('twinOsEntityId');
      expect(result).toHaveProperty('createdAt');
    });

    it('should throw error if room twin already exists', async () => {
      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue({
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501'
      });

      await expect(service.createRoomTwin(mockRequest)).rejects.toThrow(
        'Room Twin already exists for roomId: ROOM-501'
      );
    });
  });

  describe('getRoomStatus', () => {
    it('should return room status when found', async () => {
      const mockRoomTwin = {
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501',
        roomNumber: '501',
        status: {
          current: 'available',
          nextAvailable: '',
          maintenanceAlerts: []
        },
        iotState: {
          thermostat: { current: 72, target: 72, mode: 'auto' },
          lighting: { scene: 'default', brightness: 80 },
          blinds: 'closed',
          doorLock: 'locked',
          minibarDoor: 'closed',
          occupancySensor: false
        },
        housekeeping: {
          lastCleaned: '2024-01-15T10:00:00Z',
          nextScheduled: '2024-01-16T10:00:00Z',
          frequency: 'daily',
          supplyStatus: 'adequate'
        },
        updatedAt: new Date()
      };

      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.getRoomStatus('ROOM-501');

      expect(result).toHaveProperty('roomId', 'ROOM-501');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('iotState');
    });

    it('should throw error when room twin not found', async () => {
      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(null);

      await expect(service.getRoomStatus('ROOM-999')).rejects.toThrow(
        'Room Twin not found for roomId: ROOM-999'
      );
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status successfully', async () => {
      const mockRoomTwin = {
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501',
        status: {
          current: 'available',
          nextAvailable: '',
          maintenanceAlerts: []
        },
        currentGuestId: undefined,
        save: jest.fn().mockResolvedValue(undefined)
      };

      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.updateRoomStatus('ROOM-501', {
        status: 'cleaning'
      });

      expect(result).toHaveProperty('twinId');
      expect(mockRoomTwin.save).toHaveBeenCalled();
    });

    it('should throw error when room twin not found', async () => {
      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateRoomStatus('ROOM-999', { status: 'cleaning' })
      ).rejects.toThrow('Room Twin not found for roomId: ROOM-999');
    });
  });

  describe('assignGuest', () => {
    it('should assign guest to room successfully', async () => {
      const mockRoomTwin = {
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501',
        currentGuestId: undefined,
        status: {
          current: 'available',
          nextAvailable: '',
          maintenanceAlerts: []
        },
        save: jest.fn().mockResolvedValue(undefined)
      };

      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(mockRoomTwin);

      await service.assignGuest('ROOM-501', 'G-123456', '2024-01-18T11:00:00Z');

      expect(mockRoomTwin.currentGuestId).toBe('G-123456');
      expect(mockRoomTwin.status.current).toBe('occupied');
      expect(mockRoomTwin.save).toHaveBeenCalled();
    });
  });

  describe('vacateRoom', () => {
    it('should vacate room successfully', async () => {
      const mockRoomTwin = {
        twinId: 'twin.hotel.room.ROOM-501',
        roomId: 'ROOM-501',
        currentGuestId: 'G-123456',
        status: {
          current: 'occupied',
          nextAvailable: '',
          maintenanceAlerts: []
        },
        save: jest.fn().mockResolvedValue(undefined)
      };

      (RoomTwin.findByRoomId as jest.Mock).mockResolvedValue(mockRoomTwin);

      await service.vacateRoom('ROOM-501');

      expect(mockRoomTwin.currentGuestId).toBeUndefined();
      expect(mockRoomTwin.status.current).toBe('cleaning');
      expect(mockRoomTwin.save).toHaveBeenCalled();
    });
  });

  describe('deleteRoomTwin', () => {
    it('should delete room twin successfully', async () => {
      (RoomTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(service.deleteRoomTwin('ROOM-501')).resolves.toBeUndefined();
      expect(RoomTwin.deleteOne).toHaveBeenCalledWith({ roomId: 'ROOM-501' });
    });

    it('should throw error when room twin not found', async () => {
      (RoomTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteRoomTwin('ROOM-999')).rejects.toThrow(
        'Room Twin not found for roomId: ROOM-999'
      );
    });
  });
});
