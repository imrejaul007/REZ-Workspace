import { GuestTwinService, CreateGuestTwinDTO } from '../services/guest-twin.service';
import { GuestTwin } from '../models';
import { jest } from '@jest/globals';

// Mock the GuestTwin model
jest.mock('../models', () => ({
  GuestTwin: {
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

describe('GuestTwinService', () => {
  let service: GuestTwinService;
  let mockGuestTwin: any;

  beforeEach(() => {
    service = new GuestTwinService();
    jest.clearAllMocks();

    mockGuestTwin = {
      _id: 'test-id',
      guestId: 'guest-123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        vipStatus: false,
      },
      preferences: {
        roomTemperature: 22,
        bedType: 'king',
        pillowType: 'medium',
      },
      loyalty: {
        tier: 'bronze',
        points: 100,
        lifetimePoints: 500,
      },
      sentiment: {
        overallScore: 0.5,
        lastUpdated: new Date(),
        sources: [],
        positiveKeywords: [],
        negativeKeywords: [],
        recentMentions: [],
      },
      stayHistory: [],
      tags: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
      },
      status: 'active',
      save: jest.fn().mockResolvedValue(true),
    };
  });

  describe('create', () => {
    it('should create a new guest twin successfully', async () => {
      const createDTO: CreateGuestTwinDTO = {
        guestId: 'guest-123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
        },
      };

      (GuestTwin.findOne as jest.Mock).mockResolvedValue(null);
      (GuestTwin as unknown as { prototype: any }).prototype = mockGuestTwin;

      const result = await service.create(createDTO);

      expect(result).toBeDefined();
      expect(result.guestId).toBe('guest-123');
    });

    it('should throw error if guest twin already exists', async () => {
      const createDTO: CreateGuestTwinDTO = {
        guestId: 'guest-123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
        },
      };

      (GuestTwin.findOne as jest.Mock).mockResolvedValue(mockGuestTwin);

      await expect(service.create(createDTO)).rejects.toThrow(
        'Guest twin with guestId guest-123 already exists'
      );
    });
  });

  describe('getById', () => {
    it('should return guest twin when found', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.getById('guest-123');

      expect(result).toEqual(mockGuestTwin);
      expect(GuestTwin.findOne).toHaveBeenCalledWith({
        guestId: 'guest-123',
        status: { $ne: 'archived' },
      });
    });

    it('should return null when guest twin not found', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(mockGuestTwin);

      const preferences = {
        roomTemperature: 24,
        bedType: 'queen' as const,
      };

      const result = await service.updatePreferences('guest-123', preferences);

      expect(result).toBeDefined();
      expect(mockGuestTwin.save).toHaveBeenCalled();
    });

    it('should throw error if guest twin not found', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updatePreferences('non-existent', { roomTemperature: 24 })
      ).rejects.toThrow('Guest twin not found for guestId: non-existent');
    });
  });

  describe('query', () => {
    it('should return paginated guest twins', async () => {
      const mockGuests = [mockGuestTwin];
      (GuestTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockGuests),
      });
      (GuestTwin.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.query({ limit: 20, offset: 0 });

      expect(result.guests).toEqual(mockGuests);
      expect(result.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      (GuestTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      (GuestTwin.countDocuments as jest.Mock).mockResolvedValue(0);

      await service.query({ vipStatus: true, tier: 'gold' });

      expect(GuestTwin.find).toHaveBeenCalledWith({
        status: { $ne: 'archived' },
        'profile.vipStatus': true,
        'loyalty.tier': 'gold',
      });
    });
  });

  describe('archive', () => {
    it('should archive guest twin successfully', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.archive('guest-123');

      expect(mockGuestTwin.status).toBe('archived');
      expect(mockGuestTwin.save).toHaveBeenCalled();
    });
  });

  describe('addTags', () => {
    it('should add tags to guest twin', async () => {
      (GuestTwin.findOne as jest.Mock).mockResolvedValue(mockGuestTwin);

      await service.addTags('guest-123', ['vip', 'frequent']);

      expect(mockGuestTwin.tags).toContain('vip');
      expect(mockGuestTwin.tags).toContain('frequent');
      expect(mockGuestTwin.save).toHaveBeenCalled();
    });
  });
});