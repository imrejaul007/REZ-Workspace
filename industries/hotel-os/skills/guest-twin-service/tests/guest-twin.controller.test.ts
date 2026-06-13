import request from 'supertest';
import express from 'express';
import guestTwinRoutes from '../src/routes/guest-twin.routes';
import { GuestTwinService } from '../src/services/guest-twin.service';

// Mock the service
jest.mock('../src/services/guest-twin.service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('GuestTwinController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/twins/guest', guestTwinRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/twins/guest', () => {
    it('should create a guest twin successfully', async () => {
      const mockResponse = {
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456',
        twinOsEntityId: 'twin.hotel.guest.G-123456',
        createdAt: new Date().toISOString()
      };

      (GuestTwinService.prototype.createGuestTwin as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/twins/guest')
        .send({
          guestId: 'G-123456',
          profile: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('twinId');
      expect(response.body).toHaveProperty('guestId', 'G-123456');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/twins/guest')
        .send({
          guestId: 'G-123456'
          // Missing required profile
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 409 when guest twin already exists', async () => {
      (GuestTwinService.prototype.createGuestTwin as jest.Mock).mockRejectedValue(
        new Error('Guest Twin already exists for guestId: G-123456')
      );

      const response = await request(app)
        .post('/api/twins/guest')
        .send({
          guestId: 'G-123456',
          profile: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
          }
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Conflict');
    });
  });

  describe('GET /api/twins/guest/:id', () => {
    it('should return guest twin when found', async () => {
      const mockResponse = {
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
        preferences: {}
      };

      (GuestTwinService.prototype.getGuestTwin as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app).get('/api/twins/guest/G-123456');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('guestId', 'G-123456');
    });

    it('should return 404 when guest twin not found', async () => {
      (GuestTwinService.prototype.getGuestTwin as jest.Mock).mockRejectedValue(
        new Error('Guest Twin not found for guestId: G-999999')
      );

      const response = await request(app).get('/api/twins/guest/G-999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('PUT /api/twins/guest/:id/preferences', () => {
    it('should update preferences successfully', async () => {
      const mockResponse = {
        twinId: 'twin.hotel.guest.G-123456',
        guestId: 'G-123456',
        preferences: {
          room: { floorPreference: 'high' },
          dining: { allergies: ['peanuts'] }
        },
        updatedAt: new Date().toISOString()
      };

      (GuestTwinService.prototype.updatePreferences as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/api/twins/guest/G-123456/preferences')
        .send({
          preferences: {
            room: { floorPreference: 'high' },
            dining: { allergies: ['peanuts'] }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
    });

    it('should return 400 for invalid preferences', async () => {
      const response = await request(app)
        .put('/api/twins/guest/G-123456/preferences')
        .send({
          // Missing preferences object
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/twins/guest/:id/upsell-eligibility', () => {
    it('should return upsell eligibility', async () => {
      const mockResponse = {
        eligible: true,
        currentTier: 'bronze',
        upgradeRecommendation: 'silver',
        probability: 0.75
      };

      (GuestTwinService.prototype.getUpsellEligibility as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app).get('/api/twins/guest/G-123456/upsell-eligibility');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('eligible', true);
      expect(response.body).toHaveProperty('upgradeRecommendation', 'silver');
    });
  });

  describe('DELETE /api/twins/guest/:id', () => {
    it('should delete guest twin successfully', async () => {
      (GuestTwinService.prototype.deleteGuestTwin as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/twins/guest/G-123456');

      expect(response.status).toBe(204);
    });

    it('should return 404 when guest twin not found', async () => {
      (GuestTwinService.prototype.deleteGuestTwin as jest.Mock).mockRejectedValue(
        new Error('Guest Twin not found for guestId: G-999999')
      );

      const response = await request(app).delete('/api/twins/guest/G-999999');

      expect(response.status).toBe(404);
    });
  });
});
