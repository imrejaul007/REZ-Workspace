import request from 'supertest';
import express from 'express';
import { createApp, GuestMemoryService } from '../src/app';
import { TwinOSClient } from '../src/services/twinos-client';

// Mock TwinOS client
jest.mock('../src/services/twinos-client', () => ({
  TwinOSClient: jest.fn().mockImplementation(() => ({
    createTwin: jest.fn().mockResolvedValue({
      success: true,
      twinId: 'twin.hotel.guest.test',
      createdAt: new Date().toISOString(),
      version: 1,
    }),
    patchTwin: jest.fn().mockResolvedValue({
      twinId: 'twin.hotel.guest.test',
      twinType: 'HUMAN',
      industry: 'hotel',
      attributes: {},
      relationships: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }),
    healthCheck: jest.fn().mockResolvedValue(true),
    getBaseUrl: jest.fn().mockReturnValue('http://localhost:4143'),
  })),
}));

describe('API Routes', () => {
  let app: express.Application;
  let service: GuestMemoryService;
  const apiKey = 'test-api-key-123';

  beforeAll(() => {
    service = new GuestMemoryService();
    app = createApp(service);
  });

  describe('Health Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('guest-memory-twinos');
    });

    it('GET /ready should return ready status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .send({ profile: { name: 'Test', email: 'test@example.com' } });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid API key format', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', 'short')
        .send({ profile: { name: 'Test', email: 'test@example.com' } });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });
  });

  describe('Guest Twin Routes', () => {
    it('POST /api/twins/guest should create a guest twin', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', apiKey)
        .send({
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guest_id).toBeDefined();
      expect(response.body.data.guest_twin_id).toContain('twin.hotel.guest.');
    });

    it('POST /api/twins/guest should validate required fields', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', apiKey)
        .send({
          profile: {
            name: '',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/twins/guest should validate email format', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', apiKey)
        .send({
          profile: {
            name: 'Test User',
            email: 'invalid-email',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/twins/guest/:id should return guest twin', async () => {
      // Create a guest first
      const createResponse = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', apiKey)
        .send({
          profile: {
            name: 'Get Test',
            email: 'get@example.com',
          },
        });

      const guestId = createResponse.body.data.guest_id;

      const response = await request(app)
        .get(`/api/twins/guest/${guestId}`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guest_id).toBe(guestId);
    });

    it('GET /api/twins/guest/:id should return 404 for non-existent guest', async () => {
      const response = await request(app)
        .get('/api/twins/guest/non-existent-id')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('TWIN_NOT_FOUND');
    });

    it('PUT /api/twins/guest/:id/preferences should update preferences', async () => {
      // Create a guest first
      const createResponse = await request(app)
        .post('/api/twins/guest')
        .set('X-API-Key', apiKey)
        .send({
          profile: {
            name: 'Update Test',
            email: 'update@example.com',
          },
        });

      const guestId = createResponse.body.data.guest_id;

      const response = await request(app)
        .put(`/api/twins/guest/${guestId}/preferences`)
        .set('X-API-Key', apiKey)
        .send({
          preferences: {
            room: {
              floor_preference: 'high',
              view_preference: 'ocean',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.room.floor_preference).toBe('high');
    });

    it('GET /api/twins/guest should list all guest twins', async () => {
      const response = await request(app)
        .get('/api/twins/guest')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('Room Twin Routes', () => {
    it('POST /api/twins/room should create a room twin', async () => {
      const response = await request(app)
        .post('/api/twins/room')
        .set('X-API-Key', apiKey)
        .send({
          property_id: 'prop-001',
          room_number: '501',
          floor: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.room_id).toBeDefined();
      expect(response.body.data.room_twin_id).toContain('twin.hotel.room.');
    });

    it('POST /api/twins/room should validate required fields', async () => {
      const response = await request(app)
        .post('/api/twins/room')
        .set('X-API-Key', apiKey)
        .send({
          property_id: 'prop-001',
          // Missing room_number and floor
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/twins/room/:id/status should return room status', async () => {
      // Create a room first
      const createResponse = await request(app)
        .post('/api/twins/room')
        .set('X-API-Key', apiKey)
        .send({
          property_id: 'prop-001',
          room_number: '502',
          floor: 5,
        });

      const roomId = createResponse.body.data.room_id;

      const response = await request(app)
        .get(`/api/twins/room/${roomId}/status`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.room_id).toBe(roomId);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.iot_state).toBeDefined();
    });

    it('GET /api/twins/room/:id/status should return 404 for non-existent room', async () => {
      const response = await request(app)
        .get('/api/twins/room/non-existent/status')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(404);
    });
  });

  describe('Property Twin Routes', () => {
    it('POST /api/twins/property should create a property twin', async () => {
      const response = await request(app)
        .post('/api/twins/property')
        .set('X-API-Key', apiKey)
        .send({
          name: 'Grand Hotel',
          inventory: {
            total_rooms: 200,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property_id).toBeDefined();
      expect(response.body.data.property_twin_id).toContain('twin.hotel.property.');
    });

    it('POST /api/twins/property should create with venues', async () => {
      const response = await request(app)
        .post('/api/twins/property')
        .set('X-API-Key', apiKey)
        .send({
          name: 'Resort Hotel',
          inventory: {
            total_rooms: 100,
          },
          venues: [
            {
              name: 'Beach Restaurant',
              type: 'restaurant',
              capacity: 80,
            },
            {
              name: 'Pool Bar',
              type: 'bar',
              capacity: 40,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.synced_to_twinos).toBe(true);
    });

    it('GET /api/twins/property/:id should return property twin', async () => {
      // Create a property first
      const createResponse = await request(app)
        .post('/api/twins/property')
        .set('X-API-Key', apiKey)
        .send({
          name: 'Get Property Test',
          inventory: {
            total_rooms: 50,
          },
        });

      const propertyId = createResponse.body.data.property_id;

      const response = await request(app)
        .get(`/api/twins/property/${propertyId}`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property_id).toBe(propertyId);
    });
  });

  describe('Sync Status', () => {
    it('GET /api/twins/sync-status should return sync status', async () => {
      const response = await request(app)
        .get('/api/twins/sync-status')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('twinos_sync_enabled');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown/route')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
