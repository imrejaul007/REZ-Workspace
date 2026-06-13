import { PropertyTwinService } from '../src/services/property-twin.service';
import { PropertyTwin } from '../src/models/property-twin.model';
import { CreatePropertyTwinRequest } from '../src/schemas/property-twin.schema';

// Mock dependencies
jest.mock('../src/models/property-twin.model');
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
jest.mock('../src/utils/rez-pos-client', () => ({
  rezPOSClient: {
    syncVenue: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../src/utils/upsell-engine-client', () => ({
  upsellEngineClient: {
    updatePropertyConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('PropertyTwinService', () => {
  let service: PropertyTwinService;

  beforeEach(() => {
    service = new PropertyTwinService();
    jest.clearAllMocks();
  });

  describe('createPropertyTwin', () => {
    const mockRequest: CreatePropertyTwinRequest = {
      propertyId: 'PROP-001',
      brand: 'Luxury Hotels',
      name: 'Grand Plaza Hotel',
      location: {
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        timezone: 'America/New_York'
      },
      inventory: {
        totalRooms: 500,
        byType: {
          standard: 200,
          deluxe: 150,
          suite: 100,
          penthouse: 50
        },
        availableToday: 350,
        availableTomorrow: 320
      },
      venues: [
        {
          venueId: 'VENUE-001',
          name: 'Ocean View Restaurant',
          type: 'restaurant',
          capacity: 200,
          hours: {},
          posRevenueCenterId: 'RC-001',
          isActive: true
        }
      ]
    };

    it('should create a new property twin successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockCreatedAt = new Date();

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(null);
      (PropertyTwin as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        createdAt: mockCreatedAt,
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001'
      }));

      const result = await service.createPropertyTwin(mockRequest);

      expect(result).toHaveProperty('twinId');
      expect(result).toHaveProperty('propertyId', 'PROP-001');
      expect(result).toHaveProperty('twinOsEntityId');
      expect(result).toHaveProperty('createdAt');
    });

    it('should throw error if property twin already exists', async () => {
      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue({
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001'
      });

      await expect(service.createPropertyTwin(mockRequest)).rejects.toThrow(
        'Property Twin already exists for propertyId: PROP-001'
      );
    });
  });

  describe('getPropertyTwin', () => {
    it('should return property twin when found', async () => {
      const mockPropertyTwin = {
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001',
        brand: 'Luxury Hotels',
        name: 'Grand Plaza Hotel',
        location: {
          city: 'New York',
          country: 'USA'
        },
        inventory: {
          totalRooms: 500,
          byType: {},
          availableToday: 350,
          availableTomorrow: 320
        },
        venues: [],
        staff: {
          totalCount: 200,
          byDepartment: {},
          onDutyNow: 150
        },
        services: {
          checkIn24h: true,
          conciergeAvailable: true
        },
        revenue: {
          todayRevenue: 150000,
          mtdRevenue: 4500000,
          ytdRevenue: 54000000,
          revpar: 300,
          adr: 400,
          occupancyRate: 75
        },
        settings: {},
        toJSON: function() { return this; }
      };

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getPropertyTwin('PROP-001');

      expect(result).toHaveProperty('propertyId', 'PROP-001');
      expect(result).toHaveProperty('brand', 'Luxury Hotels');
    });

    it('should throw error when property twin not found', async () => {
      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(null);

      await expect(service.getPropertyTwin('PROP-999')).rejects.toThrow(
        'Property Twin not found for propertyId: PROP-999'
      );
    });
  });

  describe('updateVenue', () => {
    it('should update venue successfully', async () => {
      const mockPropertyTwin = {
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001',
        venues: [
          {
            venueId: 'VENUE-001',
            name: 'Ocean View Restaurant',
            type: 'restaurant',
            capacity: 200
          }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updateVenue('PROP-001', {
        venueId: 'VENUE-001',
        venue: { name: 'Skyline Restaurant', capacity: 250 }
      });

      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });

    it('should throw error when venue not found', async () => {
      const mockPropertyTwin = {
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001',
        venues: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(mockPropertyTwin);

      await expect(
        service.updateVenue('PROP-001', {
          venueId: 'VENUE-999',
          venue: { name: 'Test' }
        })
      ).rejects.toThrow('Venue not found: VENUE-999');
    });
  });

  describe('updateRevenue', () => {
    it('should update revenue successfully', async () => {
      const mockPropertyTwin = {
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001',
        revenue: {
          todayRevenue: 100000,
          mtdRevenue: 3000000,
          ytdRevenue: 36000000,
          revpar: 200,
          adr: 300,
          occupancyRate: 66
        },
        save: jest.fn().mockResolvedValue(undefined)
      };

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(mockPropertyTwin);

      await service.updateRevenue('PROP-001', {
        revenue: { todayRevenue: 150000, occupancyRate: 75 }
      });

      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary', async () => {
      const mockPropertyTwin = {
        twinId: 'twin.hotel.property.PROP-001',
        propertyId: 'PROP-001',
        revenue: {
          todayRevenue: 150000,
          mtdRevenue: 4500000,
          ytdRevenue: 54000000,
          revpar: 300,
          adr: 400,
          occupancyRate: 75
        },
        inventory: {
          availableToday: 350,
          availableTomorrow: 320
        },
        venues: [
          { isActive: true },
          { isActive: true },
          { isActive: false }
        ]
      };

      (PropertyTwin.findByPropertyId as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getPerformanceSummary('PROP-001');

      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('occupancy');
      expect(result).toHaveProperty('venues');
      expect(result.venues.total).toBe(3);
      expect(result.venues.active).toBe(2);
    });
  });

  describe('deletePropertyTwin', () => {
    it('should delete property twin successfully', async () => {
      (PropertyTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(service.deletePropertyTwin('PROP-001')).resolves.toBeUndefined();
      expect(PropertyTwin.deleteOne).toHaveBeenCalledWith({ propertyId: 'PROP-001' });
    });

    it('should throw error when property twin not found', async () => {
      (PropertyTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.deletePropertyTwin('PROP-999')).rejects.toThrow(
        'Property Twin not found for propertyId: PROP-999'
      );
    });
  });
});
