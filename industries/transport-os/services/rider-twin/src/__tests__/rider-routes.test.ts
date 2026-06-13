/**
 * Rider Routes Integration Tests
 */

import express, { Application } from 'express';
import request from 'supertest';
import { riderRoutes } from '../api/routes/rider.routes';
import { paymentRoutes } from '../api/routes/payment.routes';
import { addressRoutes } from '../api/routes/address.routes';
import { loyaltyRoutes } from '../api/routes/loyalty.routes';
import { asyncHandler } from '../utils/error-handler';

// Create test app
function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/riders', riderRoutes);
  app.use('/api/v1/riders', paymentRoutes);
  app.use('/api/v1/riders', addressRoutes);
  app.use('/api/v1/riders', loyaltyRoutes);
  return app;
}

describe('Rider Routes', () => {
  let app: Application;
  let testRiderId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/riders', () => {
    it('should create a new rider', async () => {
      const response = await request(app)
        .post('/api/v1/riders')
        .send({
          profile: {
            first: 'Test',
            last: 'User',
            email: 'test@example.com',
            phone: '+1234567890',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.rider).toBeDefined();
      expect(response.body.rider.rider_id).toMatch(/^RID-/);
      expect(response.body.twin_id).toMatch(/^twin\.transport\.rider\./);
      testRiderId = response.body.rider.rider_id;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/riders')
        .send({
          profile: {
            first: 'Test',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/riders/:riderId', () => {
    it('should get rider by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}`);

      expect(response.status).toBe(200);
      expect(response.body.rider.rider_id).toBe(testRiderId);
    });

    it('should return 404 for non-existent rider', async () => {
      const response = await request(app)
        .get('/api/v1/riders/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/riders/:riderId', () => {
    it('should update rider profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/riders/${testRiderId}`)
        .send({
          profile: {
            first: 'Updated',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.rider.profile.first).toBe('Updated');
    });
  });

  describe('GET /api/v1/riders/:riderId/twin', () => {
    it('should return TwinOS entity info', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/twin`);

      expect(response.status).toBe(200);
      expect(response.body.twin_id).toMatch(/^twin\.transport\.rider\./);
      expect(response.body.managed_by).toBe('agent.rider_intelligence');
    });
  });

  describe('GET /api/v1/riders/:riderId/analytics', () => {
    it('should return rider analytics', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/analytics`);

      expect(response.status).toBe(200);
      expect(response.body.rider_id).toBe(testRiderId);
      expect(response.body.activity_summary).toBeDefined();
      expect(response.body.loyalty_summary).toBeDefined();
    });
  });
});

describe('Payment Routes', () => {
  let app: Application;
  let testRiderId: string;

  beforeAll(async () => {
    app = createTestApp();

    // Create a test rider
    const response = await request(app)
      .post('/api/v1/riders')
      .send({
        profile: {
          first: 'Payment',
          last: 'Test',
          email: 'payment@example.com',
          phone: '+1234567891',
        },
      });
    testRiderId = response.body.rider.rider_id;
  });

  describe('POST /api/v1/riders/:riderId/payment', () => {
    it('should add a payment method', async () => {
      const response = await request(app)
        .post(`/api/v1/riders/${testRiderId}/payment`)
        .send({
          card_id: 'card_123',
          last_four: '4242',
          brand: 'Visa',
          set_as_default: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.saved_cards.length).toBe(1);
      expect(response.body.default_payment_method).toBe('card_123');
    });
  });

  describe('GET /api/v1/riders/:riderId/payment', () => {
    it('should get payment methods', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/payment`);

      expect(response.status).toBe(200);
      expect(response.body.saved_cards).toBeDefined();
      expect(response.body.cash_enabled).toBe(true);
    });
  });

  describe('DELETE /api/v1/riders/:riderId/payment/:cardId', () => {
    it('should remove a payment method', async () => {
      const response = await request(app)
        .delete(`/api/v1/riders/${testRiderId}/payment/card_123`);

      expect(response.status).toBe(200);
      expect(response.body.saved_cards.length).toBe(0);
    });
  });
});

describe('Address Routes', () => {
  let app: Application;
  let testRiderId: string;

  beforeAll(async () => {
    app = createTestApp();

    const response = await request(app)
      .post('/api/v1/riders')
      .send({
        profile: {
          first: 'Address',
          last: 'Test',
          email: 'address@example.com',
          phone: '+1234567892',
        },
      });
    testRiderId = response.body.rider.rider_id;
  });

  describe('POST /api/v1/riders/:riderId/addresses', () => {
    it('should add home address', async () => {
      const response = await request(app)
        .post(`/api/v1/riders/${testRiderId}/addresses`)
        .send({
          type: 'home',
          label: 'Home',
          address: '123 Main Street',
          lat: 25.2048,
          lng: 55.2708,
        });

      expect(response.status).toBe(201);
      expect(response.body.addresses.home).toBeDefined();
    });

    it('should add favorite address', async () => {
      const response = await request(app)
        .post(`/api/v1/riders/${testRiderId}/addresses`)
        .send({
          type: 'favorite',
          label: 'Gym',
          address: '456 Fitness Ave',
          lat: 25.2100,
          lng: 55.2800,
        });

      expect(response.status).toBe(201);
      expect(response.body.addresses.favorites.length).toBe(1);
    });
  });

  describe('GET /api/v1/riders/:riderId/addresses', () => {
    it('should get all addresses', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/addresses`);

      expect(response.status).toBe(200);
      expect(response.body.home).toBeDefined();
      expect(response.body.favorites).toBeDefined();
    });
  });
});

describe('Loyalty Routes', () => {
  let app: Application;
  let testRiderId: string;

  beforeAll(async () => {
    app = createTestApp();

    const response = await request(app)
      .post('/api/v1/riders')
      .send({
        profile: {
          first: 'Loyalty',
          last: 'Test',
          email: 'loyalty@example.com',
          phone: '+1234567893',
        },
      });
    testRiderId = response.body.rider.rider_id;
  });

  describe('GET /api/v1/riders/:riderId/loyalty', () => {
    it('should get loyalty status', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/loyalty`);

      expect(response.status).toBe(200);
      expect(response.body.tier).toBe('basic');
      expect(response.body.points_balance).toBe(0);
    });
  });

  describe('POST /api/v1/riders/:riderId/loyalty/points', () => {
    it('should add loyalty points', async () => {
      const response = await request(app)
        .post(`/api/v1/riders/${testRiderId}/loyalty/points`)
        .send({
          points: 500,
          reason: 'Welcome bonus',
        });

      expect(response.status).toBe(200);
      expect(response.body.points_added).toBe(500);
      expect(response.body.new_balance).toBe(500);
    });
  });

  describe('POST /api/v1/riders/:riderId/loyalty/redeem', () => {
    it('should redeem loyalty points', async () => {
      const response = await request(app)
        .post(`/api/v1/riders/${testRiderId}/loyalty/redeem`)
        .send({
          points: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.points_redeemed).toBe(200);
      expect(response.body.new_balance).toBe(300);
    });
  });
});

describe('Preferences Routes', () => {
  let app: Application;
  let testRiderId: string;

  beforeAll(async () => {
    app = createTestApp();

    const response = await request(app)
      .post('/api/v1/riders')
      .send({
        profile: {
          first: 'Prefs',
          last: 'Test',
          email: 'prefs@example.com',
          phone: '+1234567894',
        },
      });
    testRiderId = response.body.rider.rider_id;
  });

  describe('GET /api/v1/riders/:riderId/preferences', () => {
    it('should get preferences', async () => {
      const response = await request(app)
        .get(`/api/v1/riders/${testRiderId}/preferences`);

      expect(response.status).toBe(200);
      expect(response.body.preferred_vehicle_type).toBe('economy');
    });
  });

  describe('PATCH /api/v1/riders/:riderId/preferences', () => {
    it('should update preferences', async () => {
      const response = await request(app)
        .patch(`/api/v1/riders/${testRiderId}/preferences`)
        .send({
          preferred_vehicle_type: 'comfort',
          smoking_policy: 'no_smoking',
        });

      expect(response.status).toBe(200);
      expect(response.body.preferences.preferred_vehicle_type).toBe('comfort');
      expect(response.body.preferences.smoking_policy).toBe('no_smoking');
    });
  });
});
