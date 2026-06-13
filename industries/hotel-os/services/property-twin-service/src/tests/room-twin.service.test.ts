import { RoomTwinService, CreateRoomTwinDTO } from '../services/room-twin.service';
import { RoomTwin } from '../models';
import { jest } from '@jest/globals';

// Mock the RoomTwin model
jest.mock('../models', () => ({
  RoomTwin: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RoomTwinService', () => {
  let service: RoomTwinService;
  let mockRoomTwin: any;

  beforeEach(() => {
    service = new RoomTwinService();
    jest.clearAllMocks();

    mockRoomTwin = {
      _id: 'test-id',
      roomId: 'room-101',
      propertyId: 'property-1',
      roomNumber: '101',
      floor: 1,
      roomType: 'standard',
      status: 'available',
      occupancy: {
        isOccupied: false,
        lastUpdated: new Date(),
      },
      iotState: [],
      features: {
        bedType: 'queen',
        bedCount: 1,
        maxOccupancy: 2,
        roomSize: 25,
        floor: 1,
        view: 'city',
        balcony: false,
        bathtub: false,
        showerType: 'standup',
        amenities: ['wifi', 'tv'],
        accessibility: false,
        smoking: false,
      },
      currentCondition: {
        cleanlinessScore: 100,
        maintenanceIssues: [],
        lastInspected: new Date(),
      },
      pricing: {
        baseRate: 150,
        currency: 'USD',
      },
      tags: [],
      statusHistory: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
      },
      save: jest.fn().mockResolvedValue(true),
      getReadinessScore: jest.fn().mockReturnValue(100),
      needsMaintenance: jest.fn().mockReturnValue(false),
    };
  });

  describe('create', () => {
    it('should create a new room twin successfully', async () => {
      const createDTO: CreateRoomTwinDTO = {
        roomId: 'room-101',
        propertyId: 'property-1',
        roomNumber: '101',
        floor: 1,
        roomType: 'standard',
        features: {
          bedType: 'queen',
          bedCount: 1,
          maxOccupancy: 2,
          roomSize: 25,
          floor: 1,
        },
        pricing: {
          baseRate: 150,
        },
      };

      (RoomTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.create(createDTO);

      expect(result).toBeDefined();
      expect(result.roomId).toBe('room-101');
    });

    it('should throw error if room twin already exists', async () => {
      const createDTO: CreateRoomTwinDTO = {
        roomId: 'room-101',
        propertyId: 'property-1',
        roomNumber: '101',
        floor: 1,
        roomType: 'standard',
        features: {
          bedType: 'queen',
          bedCount: 1,
          maxOccupancy: 2,
          roomSize: 25,
          floor: 1,
        },
        pricing: {
          baseRate: 150,
        },
      };

      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      await expect(service.create(createDTO)).rejects.toThrow(
        'Room twin with roomId room-101 already exists'
      );
    });
  });

  describe('getById', () => {
    it('should return room twin when found', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.getById('room-101');

      expect(result).toEqual(mockRoomTwin);
    });

    it('should return null when room twin not found', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return room status', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.getStatus('room-101');

      expect(result).toBeDefined();
      expect(result?.roomId).toBe('room-101');
      expect(result?.status).toBe('available');
    });
  });

  describe('updateStatus', () => {
    it('should update room status successfully', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.updateStatus('room-101', 'maintenance', 'admin', 'Repair needed');

      expect(result).toBeDefined();
      expect(mockRoomTwin.save).toHaveBeenCalled();
      expect(mockRoomTwin.statusHistory.length).toBeGreaterThan(0);
    });

    it('should throw error if room twin not found', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', 'maintenance')).rejects.toThrow(
        'Room twin not found for roomId: non-existent'
      );
    });
  });

  describe('checkIn', () => {
    it('should check in guest successfully', async () => {
      mockRoomTwin.status = 'available';
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const checkIn = new Date();
      const checkOut = new Date(checkIn.getTime() + 86400000);

      const result = await service.checkIn('room-101', 'guest-123', checkIn, checkOut);

      expect(result).toBeDefined();
      expect(mockRoomTwin.occupancy.isOccupied).toBe(true);
      expect(mockRoomTwin.occupancy.currentGuestId).toBe('guest-123');
    });

    it('should throw error if room not available', async () => {
      mockRoomTwin.status = 'occupied';
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const checkIn = new Date();
      const checkOut = new Date(checkIn.getTime() + 86400000);

      await expect(service.checkIn('room-101', 'guest-123', checkIn, checkOut)).rejects.toThrow(
        'Room room-101 is not available for check-in'
      );
    });
  });

  describe('checkOut', () => {
    it('should check out guest successfully', async () => {
      mockRoomTwin.status = 'occupied';
      mockRoomTwin.occupancy.isOccupied = true;
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.checkOut('room-101');

      expect(result).toBeDefined();
      expect(mockRoomTwin.occupancy.isOccupied).toBe(false);
    });
  });

  describe('updateCondition', () => {
    it('should update room condition successfully', async () => {
      (RoomTwin.findOne as jest.Mock).mockResolvedValue(mockRoomTwin);

      const result = await service.updateCondition('room-101', {
        cleanlinessScore: 85,
        maintenanceIssues: ['Broken lamp'],
      });

      expect(result).toBeDefined();
      expect(mockRoomTwin.currentCondition.cleanlinessScore).toBe(85);
      expect(mockRoomTwin.currentCondition.maintenanceIssues).toContain('Broken lamp');
    });
  });

  describe('findAvailable', () => {
    it('should find available rooms', async () => {
      const mockFind = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockRoomTwin]),
      });
      (RoomTwin.find as jest.Mock).mockImplementation(mockFind);

      const result = await service.findAvailable({
        propertyId: 'property-1',
        guestCount: 2,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('query', () => {
    it('should return paginated room twins', async () => {
      (RoomTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockRoomTwin]),
      });
      (RoomTwin.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.query({ limit: 20, offset: 0 });

      expect(result.rooms).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});