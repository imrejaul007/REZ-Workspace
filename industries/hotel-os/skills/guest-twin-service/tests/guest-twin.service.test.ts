import { GuestTwinService } from '../src/services/guest-twin.service';
import { GuestTwin } from '../src/models/guest-twin.model';
import { CreateGuestTwinRequest } from '../src/schemas/guest-twin.schema';

// Mock dependencies
jest.mock('../src/models/guest-twin.model');
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
jest.mock('../src/utils/guest-memory-client', () => ({
  guestMemoryClient: {
    syncGuest: jest.fn().mockResolvedValue(undefined),
    updatePreferences: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../src/utils/brand-pulse-client', () => ({
  brandPulseClient: {
    updateSentiment: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('GuestTwinService', () => {
  let service: GuestTwinService;

  beforeEach(() => {
    service = new GuestTwinService();
    jest.clearAllMocks();
  });

  describe('createGuestTwin', () => {
    const mockRequest: CreateGuestTwinRequest = {
      guestId: 'G-123456',
      profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        nationality: 'US',
        languagePreference: 'en'
      },
      propertyId: 'PROP-001'
    };

    it('should create a new guest twin successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockCreatedAt = new Date();

      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(null);
      (GuestTwin as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        createdAt: mockCreatedAt,
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456'
      }));

      const result = await service.createGuestTwin(mockRequest);

      expect(result).toHaveProperty('twinId');
      expect(result).toHaveProperty('guestId', 'G-123456');
      expect(result).toHaveProperty('twinOsEntityId');
      expect(result).toHaveProperty('createdAt');
    });

    it('should throw error if guest twin already exists', async () => {
      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue({
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456'
      });

      await expect(service.createGuestTwin(mockRequest)).rejects.toThrow(
        'Guest Twin already exists for guestId: G-123456'
      );
    });
  });

  describe('getGuestTwin', () => {
    it('should return guest twin when found', async () => {
      const mockGuestTwin = {
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456',
        profile: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890'
        },
        loyalty: {
          tier: 'gold',
          pointsBalance: 5000
        },
        preferences: {},
        toJSON: function() { return this; }
      };

      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.getGuestTwin('G-123456');

      expect(result).toHaveProperty('guestId', 'G-123456');
      expect(result).toHaveProperty('profile');
    });

    it('should throw error when guest twin not found', async () => {
      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(null);

      await expect(service.getGuestTwin('G-999999')).rejects.toThrow(
        'Guest Twin not found for guestId: G-999999'
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      const mockGuestTwin = {
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456',
        preferences: {
          room: {},
          dining: {},
          amenities: {},
          communication: { preferredChannel: 'email' }
        },
        save: jest.fn().mockResolvedValue(undefined),
        updatedAt: new Date()
      };

      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.updatePreferences('G-123456', {
        preferences: {
          room: { floorPreference: 'high', viewPreference: 'ocean' },
          dining: { allergies: ['peanuts'] }
        }
      });

      expect(result).toHaveProperty('twinId');
      expect(result).toHaveProperty('preferences');
      expect(mockGuestTwin.save).toHaveBeenCalled();
    });

    it('should throw error when guest twin not found', async () => {
      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updatePreferences('G-999999', {
          preferences: { room: { floorPreference: 'high' } }
        })
      ).rejects.toThrow('Guest Twin not found for guestId: G-999999');
    });
  });

  describe('getUpsellEligibility', () => {
    it('should return eligible for upgrade when criteria met', async () => {
      const mockGuestTwin = {
        guestId: 'G-123456',
        loyalty: {
          tier: 'bronze',
          totalStays: 5,
          totalSpend: 2000
        },
        lifetimeValue: {
          clv: 2000,
          churnRisk: 'low'
        }
      };

      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.getUpsellEligibility('G-123456');

      expect(result).toHaveProperty('eligible', true);
      expect(result).toHaveProperty('currentTier', 'bronze');
      expect(result).toHaveProperty('upgradeRecommendation', 'silver');
      expect(result).toHaveProperty('probability');
    });

    it('should return not eligible when criteria not met', async () => {
      const mockGuestTwin = {
        guestId: 'G-123456',
        loyalty: {
          tier: 'bronze',
          totalStays: 1,
          totalSpend: 200
        },
        lifetimeValue: {
          clv: 200,
          churnRisk: 'low'
        }
      };

      (GuestTwin.findByGuestId as jest.Mock).mockResolvedValue(mockGuestTwin);

      const result = await service.getUpsellEligibility('G-123456');

      expect(result).toHaveProperty('eligible', false);
      expect(result).toHaveProperty('currentTier', 'bronze');
    });
  });

  describe('deleteGuestTwin', () => {
    it('should delete guest twin successfully', async () => {
      (GuestTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(service.deleteGuestTwin('G-123456')).resolves.toBeUndefined();
      expect(GuestTwin.deleteOne).toHaveBeenCalledWith({ guestId: 'G-123456' });
    });

    it('should throw error when guest twin not found', async () => {
      (GuestTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteGuestTwin('G-999999')).rejects.toThrow(
        'Guest Twin not found for guestId: G-999999'
      );
    });
  });
});
