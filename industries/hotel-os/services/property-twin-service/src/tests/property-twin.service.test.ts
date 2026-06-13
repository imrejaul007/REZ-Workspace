import { PropertyTwinService, CreatePropertyTwinDTO } from '../services/property-twin.service';
import { PropertyTwin } from '../models';
import { jest } from '@jest/globals';

// Mock the PropertyTwin model
jest.mock('../models', () => ({
  PropertyTwin: {
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

describe('PropertyTwinService', () => {
  let service: PropertyTwinService;
  let mockPropertyTwin: any;

  beforeEach(() => {
    service = new PropertyTwinService();
    jest.clearAllMocks();

    mockPropertyTwin = {
      _id: 'test-id',
      propertyId: 'property-1',
      propertyName: 'Grand Hotel',
      brand: 'Luxury Hotels',
      chainCode: 'LH',
      location: {
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        timezone: 'America/New_York',
      },
      contact: {
        phone: '+1234567890',
        email: 'info@grandhotel.com',
        website: 'https://grandhotel.com',
      },
      venues: [
        {
          venueId: 'venue-1',
          name: 'Main Restaurant',
          type: 'restaurant',
          capacity: 100,
          status: 'open',
        },
      ],
      amenities: [
        {
          amenityId: 'amenity-1',
          name: 'Swimming Pool',
          category: 'pool',
          description: 'Outdoor heated pool',
          available: true,
        },
      ],
      policies: [
        {
          policyId: 'policy-1',
          name: 'Check-in Policy',
          category: 'checkin',
          description: 'Standard check-in at 3 PM',
          rules: ['Check-in time: 3 PM', 'Early check-in subject to availability'],
        },
      ],
      revenueCenters: [
        {
          centerId: 'rc-1',
          name: 'Rooms',
          type: 'rooms',
          revenueCode: 'ROOM001',
        },
      ],
      configuration: {
        totalRooms: 200,
        totalFloors: 15,
        roomTypes: [
          { type: 'standard', count: 100, baseRate: 150 },
          { type: 'deluxe', count: 50, baseRate: 250 },
          { type: 'suite', count: 50, baseRate: 400 },
        ],
        starRating: 5,
      },
      metrics: {
        occupancyRate: 75,
        averageDailyRate: 200,
        revenuePerAvailableRoom: 150,
        guestSatisfactionScore: 92,
        lastUpdated: new Date(),
      },
      integrations: [],
      tags: ['luxury', 'city-center'],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
      },
      status: 'active',
      save: jest.fn().mockResolvedValue(true),
      getActiveVenues: jest.fn().mockReturnValue([
        {
          venueId: 'venue-1',
          name: 'Main Restaurant',
          type: 'restaurant',
          capacity: 100,
          status: 'open',
        },
      ]),
      getAvailableAmenities: jest.fn().mockReturnValue([
        {
          amenityId: 'amenity-1',
          name: 'Swimming Pool',
          category: 'pool',
          description: 'Outdoor heated pool',
          available: true,
        },
      ]),
      getPoliciesByCategory: jest.fn().mockReturnValue([]),
      calculateRevPAR: jest.fn().mockReturnValue(150),
      getTotalVenueCapacity: jest.fn().mockReturnValue(200),
    };
  });

  describe('create', () => {
    it('should create a new property twin successfully', async () => {
      const createDTO: CreatePropertyTwinDTO = {
        propertyId: 'property-1',
        propertyName: 'Grand Hotel',
        brand: 'Luxury Hotels',
        location: {
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
          timezone: 'America/New_York',
        },
        contact: {
          phone: '+1234567890',
          email: 'info@grandhotel.com',
        },
        configuration: {
          totalRooms: 200,
          totalFloors: 15,
          roomTypes: [
            { type: 'standard', count: 100, baseRate: 150 },
          ],
        },
      };

      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.create(createDTO);

      expect(result).toBeDefined();
      expect(result.propertyId).toBe('property-1');
    });

    it('should throw error if property twin already exists', async () => {
      const createDTO: CreatePropertyTwinDTO = {
        propertyId: 'property-1',
        propertyName: 'Grand Hotel',
        brand: 'Luxury Hotels',
        location: {
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
          timezone: 'America/New_York',
        },
        contact: {
          phone: '+1234567890',
          email: 'info@grandhotel.com',
        },
        configuration: {
          totalRooms: 200,
          totalFloors: 15,
          roomTypes: [
            { type: 'standard', count: 100, baseRate: 150 },
          ],
        },
      };

      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      await expect(service.create(createDTO)).rejects.toThrow(
        'Property twin with propertyId property-1 already exists'
      );
    });
  });

  describe('getById', () => {
    it('should return property twin when found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getById('property-1');

      expect(result).toEqual(mockPropertyTwin);
    });

    it('should return null when property twin not found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMetrics', () => {
    it('should update metrics successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updateMetrics('property-1', {
        occupancyRate: 80,
        averageDailyRate: 220,
      });

      expect(result).toBeDefined();
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });

    it('should throw error if property twin not found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateMetrics('non-existent', { occupancyRate: 80 })
      ).rejects.toThrow('Property twin not found for propertyId: non-existent');
    });
  });

  describe('addVenue', () => {
    it('should add venue successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const newVenue = {
        venueId: 'venue-2',
        name: 'Spa',
        type: 'spa' as const,
        capacity: 20,
        status: 'open' as const,
      };

      const result = await service.addVenue('property-1', newVenue);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('addAmenity', () => {
    it('should add amenity successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const newAmenity = {
        amenityId: 'amenity-2',
        name: 'Gym',
        category: 'fitness' as const,
        description: '24/7 fitness center',
        available: true,
      };

      const result = await service.addAmenity('property-1', newAmenity);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('updateAmenityAvailability', () => {
    it('should update amenity availability', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updateAmenityAvailability('property-1', 'amenity-1', false);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.amenities[0].available).toBe(false);
    });

    it('should throw error if amenity not found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      await expect(
        service.updateAmenityAvailability('property-1', 'non-existent', false)
      ).rejects.toThrow('Amenity non-existent not found in property property-1');
    });
  });

  describe('query', () => {
    it('should return paginated property twins', async () => {
      (PropertyTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockPropertyTwin]),
      });
      (PropertyTwin.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.query({ limit: 20, offset: 0 });

      expect(result.properties).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      (PropertyTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      (PropertyTwin.countDocuments as jest.Mock).mockResolvedValue(0);

      await service.query({ city: 'New York', starRating: 5 });

      expect(PropertyTwin.find).toHaveBeenCalledWith({
        'location.address.city': 'New York',
        'configuration.starRating': 5,
      });
    });
  });

  describe('getActiveVenues', () => {
    it('should return active venues', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getActiveVenues('property-1');

      expect(result).toHaveLength(1);
      expect(mockPropertyTwin.getActiveVenues).toHaveBeenCalled();
    });
  });

  describe('calculateRevPAR', () => {
    it('should calculate RevPAR', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.calculateRevPAR('property-1');

      expect(result).toBe(150);
      expect(mockPropertyTwin.calculateRevPAR).toHaveBeenCalled();
    });
  });

  describe('getPortfolioStatistics', () => {
    it('should return portfolio statistics', async () => {
      (PropertyTwin.aggregate as jest.Mock).mockResolvedValue([
        {
          counts: [
            { totalProperties: 5 },
            { activeProperties: 4 },
          ],
          totals: [
            {
              totalRooms: 1000,
              avgOccupancy: 75,
              avgADR: 200,
              avgRevPAR: 150,
              avgSatisfaction: 90,
            },
          ],
        },
      ]);

      const result = await service.getPortfolioStatistics();

      expect(result.totalProperties).toBe(5);
      expect(result.activeProperties).toBe(4);
      expect(result.totalRooms).toBe(1000);
    });
  });

  describe('archive', () => {
    it('should archive property twin successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.archive('property-1');

      expect(mockPropertyTwin.status).toBe('inactive');
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });
});