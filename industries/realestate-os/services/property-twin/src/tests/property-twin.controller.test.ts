import request from 'supertest';
import { createApp } from '../app';

// Mock the service
jest.mock('../services', () => ({
  propertyTwinService: {
    create: jest.fn(),
    getById: jest.fn(),
    getByTwinId: jest.fn(),
    update: jest.fn(),
    updateListingStatus: jest.fn(),
    updatePrice: jest.fn(),
    addMedia: jest.fn(),
    addThreeDTour: jest.fn(),
    addFloorPlan: jest.fn(),
    updateAgent: jest.fn(),
    query: jest.fn(),
    search: jest.fn(),
    getActiveListings: jest.fn(),
    getByArea: jest.fn(),
    getByAgent: jest.fn(),
    getRecentListings: jest.fn(),
    getMarketStats: jest.fn(),
    getPricePerSqftStats: jest.fn(),
    getPropflowInsights: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
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

import { propertyTwinService } from '../services';

describe('PropertyTwinController', () => {
  let app: ReturnType<typeof createApp>;
  let mockPropertyTwin: any;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPropertyTwin = {
      twinId: 'twin.realestate.property.test-123',
      propertyId: 'PROP-123',
      listing: {
        status: 'active',
        listingPrice: 450000,
        priceHistory: [],
      },
      location: {
        address: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
        coordinates: { lat: 30.2672, lng: -97.7431 },
      },
      physical: {
        propertyType: 'single_family',
        bedrooms: 3,
        bathrooms: 2,
      },
      features: { interior: [], exterior: [], energy: [], smartHome: [], accessibility: [] },
      condition: { overall: 'good' },
      financial: {},
      market: { priceTrend: 'stable', marketTemperature: 'warm' },
      media: { photos: [], videos: [], documents: [] },
      ownership: { ownerType: 'individual' },
      agent: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
        twinType: 'property',
        source: 'api',
      },
      status: 'active',
      tags: [],
    };
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('property-twin-service');
    });
  });

  describe('POST /api/twins/property', () => {
    it('should create a property twin', async () => {
      (propertyTwinService.create as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const createData = {
        propertyId: 'PROP-123',
        listing: { listingPrice: 450000 },
        location: {
          address: { street: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701' },
          coordinates: { lat: 30.2672, lng: -97.7431 },
        },
        physical: { propertyType: 'single_family', bedrooms: 3, bathrooms: 2 },
      };

      const response = await request(app)
        .post('/api/twins/property')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.propertyId).toBe('PROP-123');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/twins/property')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/twins/property/:id', () => {
    it('should get a property twin by id', async () => {
      (propertyTwinService.getById as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app).get('/api/twins/property/PROP-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.propertyId).toBe('PROP-123');
    });

    it('should return 404 for non-existent property', async () => {
      (propertyTwinService.getById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/twins/property/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/twins/property/:id', () => {
    it('should update a property twin', async () => {
      (propertyTwinService.update as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app)
        .put('/api/twins/property/PROP-123')
        .send({ tags: ['updated'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/twins/property/:id/status', () => {
    it('should update listing status', async () => {
      (propertyTwinService.updateListingStatus as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app)
        .patch('/api/twins/property/PROP-123/status')
        .send({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/twins/property/PROP-123/status')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/twins/property/:id/price', () => {
    it('should update property price', async () => {
      (propertyTwinService.updatePrice as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app)
        .patch('/api/twins/property/PROP-123/price')
        .send({ price: 460000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid price', async () => {
      const response = await request(app)
        .patch('/api/twins/property/PROP-123/price')
        .send({ price: -100 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/twins/property/:id/media', () => {
    it('should add media to property', async () => {
      (propertyTwinService.addMedia as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app)
        .post('/api/twins/property/PROP-123/media')
        .send({ type: 'photos', urls: ['https://example.com/photo.jpg'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/twins/property', () => {
    it('should query property twins', async () => {
      (propertyTwinService.query as jest.Mock).mockResolvedValue({
        properties: [mockPropertyTwin],
        total: 1,
      });

      const response = await request(app)
        .get('/api/twins/property')
        .query({ city: 'Austin', limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/twins/property/search', () => {
    it('should search property twins', async () => {
      (propertyTwinService.search as jest.Mock).mockResolvedValue([mockPropertyTwin]);

      const response = await request(app)
        .get('/api/twins/property/search')
        .query({ q: 'Austin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 400 without search query', async () => {
      const response = await request(app).get('/api/twins/property/search');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/twins/property/stats/market', () => {
    it('should return market statistics', async () => {
      (propertyTwinService.getMarketStats as jest.Mock).mockResolvedValue({
        totalListings: 100,
        avgPrice: 450000,
        avgDaysOnMarket: 30,
        byPropertyType: { single_family: 60 },
        byStatus: { active: 70 },
      });

      const response = await request(app)
        .get('/api/twins/property/stats/market')
        .query({ city: 'Austin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalListings).toBe(100);
    });
  });

  describe('GET /api/twins/property/:id/propflow', () => {
    it('should return PropFlow insights', async () => {
      (propertyTwinService.getPropflowInsights as jest.Mock).mockResolvedValue({
        investmentScore: 85,
        grade: 'A',
        priceEstimate: 480000,
        confidenceScore: 0.85,
        factors: [],
      });

      const response = await request(app).get('/api/twins/property/PROP-123/propflow');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investmentScore).toBe(85);
    });

    it('should return 404 for non-existent property', async () => {
      (propertyTwinService.getPropflowInsights as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/twins/property/non-existent/propflow');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/twins/property/:id', () => {
    it('should archive property twin', async () => {
      (propertyTwinService.archive as jest.Mock).mockResolvedValue(mockPropertyTwin);

      const response = await request(app).delete('/api/twins/property/PROP-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/twins/property/:id/permanent', () => {
    it('should permanently delete property twin', async () => {
      (propertyTwinService.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/twins/property/PROP-123/permanent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/twins/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });
});
