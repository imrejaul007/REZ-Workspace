import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/utils/database';

const app = createApp();
const TEST_PROPERTY_ID = 'test-prop-integration';
const TEST_TWIN_ID = 'twin.realestate.property.test-integration';

describe('Property Twin Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI?.replace(/\/\w+$/, '/property-twin-service-test') ||
      'mongodb://localhost:27017/property-twin-service-test';
    process.env.MONGODB_URI = testDbUri;
    await connectDatabase();
  });

  afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.collection('propertytwins').deleteMany({
        propertyId: TEST_PROPERTY_ID,
      });
    }
    await disconnectDatabase();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('property-twin-service');
    });
  });

  describe('Property Twin CRUD', () => {
    const validPropertyData = {
      propertyId: TEST_PROPERTY_ID,
      listing: {
        listingPrice: 450000,
        status: 'active',
      },
      location: {
        address: {
          street: '123 Integration Test St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
        coordinates: {
          lat: 30.2672,
          lng: -97.7431,
        },
        areaId: 'area-integration-test',
        neighborhood: 'Downtown',
      },
      physical: {
        propertyType: 'single_family',
        yearBuilt: 2020,
        lotSizeSqft: 5000,
        interiorSqft: 2000,
        bedrooms: 3,
        bathrooms: 2,
        garage: 2,
        stories: 2,
      },
      features: {
        interior: ['Hardwood Floors'],
        exterior: ['Pool'],
        energy: ['Solar Panels'],
        smartHome: ['Smart Thermostat'],
        accessibility: [],
      },
      condition: {
        overall: 'excellent',
        roofAge: 2,
        hvacAge: 1,
      },
      financial: {
        currentValue: 475000,
        propflowEstimate: 480000,
        propertyTax: 12000,
      },
      market: {
        compPricePerSqft: 225,
        avgDaysOnMarket: 30,
        priceTrend: 'increasing',
        marketTemperature: 'hot',
        competitionIndex: 75,
      },
      ownership: {
        ownerType: 'individual',
        ownerName: 'Test Owner',
      },
      agent: {
        listingAgentId: 'agent-integration-test',
        brokerageId: 'brokerage-integration-test',
      },
      tags: ['integration-test', 'luxury'],
    };

    it('should create a property twin', async () => {
      const response = await request(app)
        .post('/api/twins/property')
        .send(validPropertyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.propertyId).toBe(TEST_PROPERTY_ID);
      expect(response.body.data.listing.listingPrice).toBe(450000);
    });

    it('should get a property twin by id', async () => {
      const response = await request(app).get(`/api/twins/property/${TEST_PROPERTY_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.propertyId).toBe(TEST_PROPERTY_ID);
    });

    it('should update a property twin', async () => {
      const response = await request(app)
        .put(`/api/twins/property/${TEST_PROPERTY_ID}`)
        .send({
          tags: ['updated', 'premium'],
          listing: {
            askingPrice: 460000,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update listing status', async () => {
      const response = await request(app)
        .patch(`/api/twins/property/${TEST_PROPERTY_ID}/status`)
        .send({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update property price', async () => {
      const response = await request(app)
        .patch(`/api/twins/property/${TEST_PROPERTY_ID}/price`)
        .send({ price: 470000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should add media to property', async () => {
      const response = await request(app)
        .post(`/api/twins/property/${TEST_PROPERTY_ID}/media`)
        .send({
          type: 'photos',
          urls: ['https://example.com/integration-test-photo.jpg'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should add 3D tour', async () => {
      const response = await request(app)
        .post(`/api/twins/property/${TEST_PROPERTY_ID}/tour`)
        .send({ tourUrl: 'https://example.com/3d-tour' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should query property twins with filters', async () => {
      const response = await request(app)
        .get('/api/twins/property')
        .query({
          city: 'Austin',
          propertyType: 'single_family',
          minPrice: 400000,
          maxPrice: 500000,
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get market statistics', async () => {
      const response = await request(app)
        .get('/api/twins/property/stats/market')
        .query({ city: 'Austin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalListings');
      expect(response.body.data).toHaveProperty('avgPrice');
    });

    it('should get PropFlow insights', async () => {
      const response = await request(app).get(`/api/twins/property/${TEST_PROPERTY_ID}/propflow`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('investmentScore');
      expect(response.body.data).toHaveProperty('grade');
    });

    it('should archive property twin', async () => {
      const response = await request(app).delete(`/api/twins/property/${TEST_PROPERTY_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should permanently delete property twin', async () => {
      // First create a new one to delete
      await request(app)
        .post('/api/twins/property')
        .send({
          ...validPropertyData,
          propertyId: `${TEST_PROPERTY_ID}-delete`,
        });

      const response = await request(app)
        .delete(`/api/twins/property/${TEST_PROPERTY_ID}-delete/permanent`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent property', async () => {
      const response = await request(app).get('/api/twins/property/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid create data', async () => {
      const response = await request(app)
        .post('/api/twins/property')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/twins/property/invalid/status')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });
  });
});
