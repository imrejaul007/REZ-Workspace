import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

// Base URL for Hotel OS API
const BASE_URL = process.env.HOTEL_OS_URL || 'http://localhost:4200';

describe('Hotel OS Integration Tests', () => {
  let authToken: string;
  let guestTwinId: string;
  let roomTwinId: string;
  let propertyTwinId: string;

  // Test data
  const testGuest = {
    profile: {
      name: 'Test Guest',
      email: 'test@example.com',
      phone: '+1234567890',
      nationality: 'US',
      languagePreference: 'en'
    },
    loyalty: {
      tier: 'silver',
      pointsBalance: 1000
    },
    preferences: {
      room: {
        floorPreference: 'high',
        viewPreference: 'ocean'
      }
    }
  };

  const testRoom = {
    roomNumber: 'TEST101',
    floor: 1,
    type: 'deluxe',
    features: ['ocean_view', 'balcony'],
    maxOccupancy: 2
  };

  const testProperty = {
    name: 'Test Hotel',
    brand: 'StayOwn',
    location: {
      address: '123 Test Street',
      city: 'Dubai',
      country: 'UAE'
    },
    inventory: {
      totalRooms: 50,
      availableRooms: 50
    }
  };

  beforeAll(async () => {
    // Login and get auth token
    const loginRes = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@rez.io', password: 'test123' });

    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (guestTwinId) {
      await request(BASE_URL)
        .delete(`/api/twins/guest/${guestTwinId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Guest Twin', () => {
    test('POST /api/twins/guest - Create guest twin', async () => {
      const res = await request(BASE_URL)
        .post('/api/twins/guest')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testGuest)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('twinId');
      expect(res.body.data.profile.name).toBe(testGuest.profile.name);

      guestTwinId = res.body.data.twinId;
    });

    test('GET /api/twins/guest/:id - Get guest twin', async () => {
      const res = await request(BASE_URL)
        .get(`/api/twins/guest/${guestTwinId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.twinId).toBe(guestTwinId);
    });

    test('PUT /api/twins/guest/:id/preferences - Update preferences', async () => {
      const res = await request(BASE_URL)
        .put(`/api/twins/guest/${guestTwinId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room: {
            floorPreference: 'low',
            viewPreference: 'garden'
          }
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.room.floorPreference).toBe('low');
    });

    test('POST /api/twins/guest/:id/checkin - Process check-in', async () => {
      const res = await request(BASE_URL)
        .post(`/api/twins/guest/${guestTwinId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: roomTwinId,
          propertyId: propertyTwinId
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStay).toBeDefined();
    });
  });

  describe('Room Twin', () => {
    test('POST /api/twins/room - Create room twin', async () => {
      const res = await request(BASE_URL)
        .post('/api/twins/room')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRoom)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('twinId');

      roomTwinId = res.body.data.twinId;
    });

    test('GET /api/twins/room/:id/status - Get room status', async () => {
      const res = await request(BASE_URL)
        .get(`/api/twins/room/${roomTwinId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
    });

    test('PUT /api/twins/room/:id/iot - Update IoT state', async () => {
      const res = await request(BASE_URL)
        .put(`/api/twins/room/${roomTwinId}/iot`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          temperature: 22,
          acOn: true,
          minibar: ['coke', 'water']
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.iot.temperature).toBe(22);
    });
  });

  describe('Property Twin', () => {
    test('POST /api/twins/property - Create property twin', async () => {
      const res = await request(BASE_URL)
        .post('/api/twins/property')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('twinId');

      propertyTwinId = res.body.data.twinId;
    });

    test('GET /api/twins/property/:id - Get property twin', async () => {
      const res = await request(BASE_URL)
        .get(`/api/twins/property/${propertyTwinId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testProperty.name);
    });

    test('PUT /api/twins/property/:id/revenue - Update revenue', async () => {
      const res = await request(BASE_URL)
        .put(`/api/twins/property/${propertyTwinId}/revenue`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          today: 50000,
          occupancyRate: 85
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.revenue.today).toBe(50000);
    });
  });

  describe('Cross-Twin Relationships', () => {
    test('Guest Twin links to Room Twin on check-in', async () => {
      const res = await request(BASE_URL)
        .get(`/api/twins/guest/${guestTwinId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.currentStay).toBeDefined();
      expect(res.body.data.currentStay.roomId).toBe(roomTwinId);
    });

    test('Room Twin links to Guest Twin on check-in', async () => {
      const res = await request(BASE_URL)
        .get(`/api/twins/room/${roomTwinId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.currentGuest).toBe(guestTwinId);
    });
  });

  describe('Error Handling', () => {
    test('Returns 404 for non-existent twin', async () => {
      await request(BASE_URL)
        .get('/api/twins/guest/non_existent_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('Returns 401 without auth token', async () => {
      await request(BASE_URL)
        .get('/api/twins/guest')
        .expect(401);
    });

    test('Returns 400 for invalid request body', async () => {
      await request(BASE_URL)
        .post('/api/twins/guest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid: 'data' })
        .expect(400);
    });
  });
});
