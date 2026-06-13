import { PropertyTwinService, CreatePropertyTwinDTO } from '../services/property-twin.service';
import { PropertyTwin } from '../models';
import mongoose from 'mongoose';

// Mock the PropertyTwin model
jest.mock('../models', () => ({
  PropertyTwin: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findActive: jest.fn(),
    findByCity: jest.fn(),
    findByPriceRange: jest.fn(),
    findByPropertyType: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

// Mock the logger
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
      _id: new mongoose.Types.ObjectId(),
      twinId: 'twin.realestate.property.test-123',
      propertyId: 'PROP-123',
      listing: {
        listingId: 'listing-123',
        status: 'active',
        listingDate: new Date(),
        listingPrice: 450000,
        askingPrice: 450000,
        priceHistory: [],
        daysOnMarket: 0,
      },
      location: {
        address: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
        coordinates: {
          lat: 30.2672,
          lng: -97.7431,
        },
        areaId: 'area-123',
        neighborhood: 'Downtown',
      },
      physical: {
        propertyType: 'single_family',
        yearBuilt: 2015,
        lotSizeSqft: 5000,
        interiorSqft: 2000,
        bedrooms: 3,
        bathrooms: 2,
        garage: 2,
        stories: 2,
        parkingSpaces: 4,
      },
      features: {
        interior: ['Hardwood Floors', 'Granite Counters'],
        exterior: ['Pool', 'Patio'],
        energy: ['Solar Panels'],
        smartHome: ['Smart Thermostat'],
        accessibility: [],
      },
      condition: {
        overall: 'excellent',
        roofAge: 5,
        hvacAge: 3,
      },
      financial: {
        currentValue: 475000,
        propflowEstimate: 480000,
        propertyTax: 12000,
        insuranceEstimate: 2400,
      },
      market: {
        compPricePerSqft: 225,
        avgDaysOnMarket: 30,
        priceTrend: 'increasing',
        marketTemperature: 'hot',
        competitionIndex: 75,
      },
      media: {
        photos: ['https://example.com/photo1.jpg'],
        videos: [],
        threeDTourUrl: null,
        floorPlanUrl: null,
        documents: [],
      },
      ownership: {
        ownerType: 'individual',
        ownerName: 'John Doe',
        lastSaleDate: new Date('2020-01-15'),
        lastSalePrice: 400000,
      },
      agent: {
        listingAgentId: 'agent-123',
        brokerageId: 'brokerage-123',
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
        twinType: 'property',
        source: 'api',
      },
      status: 'active',
      tags: ['luxury', 'waterfront'],
      pricePerSqft: 225,
      save: jest.fn().mockResolvedValue(true),
      getDaysOnMarket: jest.fn().mockReturnValue(15),
      getPricePerSqft: jest.fn().mockReturnValue(225),
      isActive: jest.fn().mockReturnValue(true),
      needsMaintenance: jest.fn().mockReturnValue(false),
    };
  });

  describe('create', () => {
    it('should create a new property twin successfully', async () => {
      const createDTO: CreatePropertyTwinDTO = {
        propertyId: 'PROP-123',
        listing: {
          listingPrice: 450000,
          status: 'active',
        },
        location: {
          address: {
            street: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
          },
          coordinates: {
            lat: 30.2672,
            lng: -97.7431,
          },
        },
        physical: {
          propertyType: 'single_family',
          bedrooms: 3,
          bathrooms: 2,
        },
      };

      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.create(createDTO);

      expect(result).toBeDefined();
      expect(result.propertyId).toBe('PROP-123');
      expect(result.listing.listingPrice).toBe(450000);
    });

    it('should throw error if property twin already exists', async () => {
      const createDTO: CreatePropertyTwinDTO = {
        propertyId: 'PROP-123',
        listing: {
          listingPrice: 450000,
        },
        location: {
          address: {
            street: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
          },
          coordinates: {
            lat: 30.2672,
            lng: -97.7431,
          },
        },
        physical: {
          propertyType: 'single_family',
          bedrooms: 3,
          bathrooms: 2,
        },
      };

      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      await expect(service.create(createDTO)).rejects.toThrow(
        'Property twin with propertyId PROP-123 already exists'
      );
    });
  });

  describe('getById', () => {
    it('should return property twin when found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getById('PROP-123');

      expect(result).toEqual(mockPropertyTwin);
      expect(PropertyTwin.findOne).toHaveBeenCalledWith({ propertyId: 'PROP-123' });
    });

    it('should return null when property twin not found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByTwinId', () => {
    it('should return property twin by twinId', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getByTwinId('twin.realestate.property.test-123');

      expect(result).toEqual(mockPropertyTwin);
      expect(PropertyTwin.findOne).toHaveBeenCalledWith({ twinId: 'twin.realestate.property.test-123' });
    });
  });

  describe('update', () => {
    it('should update property twin successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.update('PROP-123', {
        listing: { status: 'pending' },
        tags: ['updated', 'premium'],
      });

      expect(result).toBeDefined();
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });

    it('should throw error if property twin not found', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { tags: ['updated'] })
      ).rejects.toThrow('Property twin not found for propertyId: non-existent');
    });
  });

  describe('updateListingStatus', () => {
    it('should update listing status successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updateListingStatus('PROP-123', 'under_contract');

      expect(result).toBeDefined();
      expect(mockPropertyTwin.listing.status).toBe('under_contract');
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('updatePrice', () => {
    it('should update price and add to price history', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updatePrice('PROP-123', 460000);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.listing.askingPrice).toBe(460000);
      expect(mockPropertyTwin.listing.priceHistory.length).toBe(1);
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('addMedia', () => {
    it('should add photos to property', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.addMedia('PROP-123', 'photos', [
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg',
      ]);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.media.photos.length).toBe(3);
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });

    it('should add videos to property', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.addMedia('PROP-123', 'videos', [
        'https://example.com/video1.mp4',
      ]);

      expect(result).toBeDefined();
      expect(mockPropertyTwin.media.videos.length).toBe(1);
    });
  });

  describe('updateAgent', () => {
    it('should update agent assignment', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.updateAgent('PROP-123', {
        listingAgentId: 'agent-456',
        coAgentId: 'agent-789',
      });

      expect(result).toBeDefined();
      expect(mockPropertyTwin.agent.listingAgentId).toBe('agent-456');
      expect(mockPropertyTwin.agent.coAgentId).toBe('agent-789');
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

      await service.query({
        city: 'Austin',
        propertyType: 'single_family',
        minPrice: 400000,
        maxPrice: 500000,
      });

      expect(PropertyTwin.find).toHaveBeenCalledWith({
        'location.address.city': 'Austin',
        'physical.propertyType': 'single_family',
        'listing.listingPrice': { $gte: 400000, $lte: 500000 },
      });
    });
  });

  describe('getActiveListings', () => {
    it('should return active listings', async () => {
      (PropertyTwin.findActive as jest.Mock).mockResolvedValue([mockPropertyTwin]);

      const result = await service.getActiveListings();

      expect(result).toHaveLength(1);
      expect(PropertyTwin.findActive).toHaveBeenCalled();
    });
  });

  describe('getByArea', () => {
    it('should return properties by area', async () => {
      (PropertyTwin.find as jest.Mock).mockResolvedValue([mockPropertyTwin]);

      const result = await service.getByArea('area-123');

      expect(result).toHaveLength(1);
      expect(PropertyTwin.find).toHaveBeenCalledWith({
        'location.areaId': 'area-123',
        'listing.status': 'active',
      });
    });
  });

  describe('getByAgent', () => {
    it('should return properties by agent', async () => {
      (PropertyTwin.find as jest.Mock).mockResolvedValue([mockPropertyTwin]);

      const result = await service.getByAgent('agent-123');

      expect(result).toHaveLength(1);
      expect(PropertyTwin.find).toHaveBeenCalled();
    });
  });

  describe('getMarketStats', () => {
    it('should return market statistics', async () => {
      (PropertyTwin.aggregate as jest.Mock).mockResolvedValue([
        {
          overview: [
            {
              totalListings: 100,
              avgPrice: 450000,
              avgDaysOnMarket: 30,
            },
          ],
          byPropertyType: [
            { _id: 'single_family', count: 60 },
            { _id: 'condo', count: 40 },
          ],
          byStatus: [
            { _id: 'active', count: 70 },
            { _id: 'pending', count: 30 },
          ],
        },
      ]);

      const result = await service.getMarketStats('Austin');

      expect(result.totalListings).toBe(100);
      expect(result.avgPrice).toBe(450000);
      expect(result.byPropertyType.single_family).toBe(60);
      expect(result.byStatus.active).toBe(70);
    });
  });

  describe('getPropflowInsights', () => {
    it('should return PropFlow insights for property', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.getPropflowInsights('PROP-123');

      expect(result).toBeDefined();
      expect(result?.investmentScore).toBeGreaterThan(0);
      expect(result?.grade).toBeDefined();
      expect(result?.factors).toBeInstanceOf(Array);
    });

    it('should return null for non-existent property', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getPropflowInsights('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('archive', () => {
    it('should archive property twin successfully', async () => {
      (PropertyTwin.findOne as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const result = await service.archive('PROP-123');

      expect(mockPropertyTwin.status).toBe('archived');
      expect(mockPropertyTwin.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete property twin successfully', async () => {
      (PropertyTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await service.delete('PROP-123');

      expect(result).toBe(true);
      expect(PropertyTwin.deleteOne).toHaveBeenCalledWith({ propertyId: 'PROP-123' });
    });

    it('should throw error if property twin not found', async () => {
      (PropertyTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.delete('non-existent')).rejects.toThrow(
        'Property twin not found for propertyId: non-existent'
      );
    });
  });
});
