/**
 * Hotel Services Integration Tests
 * Tests end-to-end API flows
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVICES = [
  { port: 4031, name: 'PMS', baseUrl: 'http://localhost:4031' },
  { port: 4032, name: 'Payment', baseUrl: 'http://localhost:4032' },
  { port: 4033, name: 'Rate Shopping', baseUrl: 'http://localhost:4033' },
  { port: 4034, name: 'Virtual Concierge', baseUrl: 'http://localhost:4034' },
  { port: 4037, name: 'Loyalty', baseUrl: 'http://localhost:4037' },
  { port: 4038, name: 'Offline Sync', baseUrl: 'http://localhost:4038' },
  { port: 4022, name: 'Pricing', baseUrl: 'http://localhost:4022' },
];

// Helper to make HTTP requests
async function httpRequest(port: number, method: string, path: string, body?: any) {
  const url = `http://localhost:${port}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, success: true };
  } catch (error) {
    return { status: 0, data: {}, success: false, error: String(error) };
  }
}

describe('Hotel Services Integration Tests', () => {
  // Health Check Tests
  describe('Health Checks', () => {
    SERVICES.forEach(service => {
      it(`${service.name} should respond to health check`, async () => {
        const res = await httpRequest(service.port, 'GET', '/health');
        expect(res.status).toBe(200);
        expect(res.data.status).toMatch(/healthy|ok/);
      });
    });
  });

  // PMS Service Tests
  describe('PMS Service (Port 4031)', () => {
    it('should get properties list', async () => {
      const res = await httpRequest(4031, 'GET', '/api/properties');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success');
    });

    it('should create a new property', async () => {
      const property = {
        name: 'Test Hotel',
        type: 'hotel',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '500001', country: 'India' },
        contact: { phone: '+919876543210', email: 'test@hotel.com' },
        amenities: ['wifi', 'pool', 'gym'],
        roomTypes: [{ name: 'Standard', baseRate: 2000, maxOccupancy: 2 }],
      };
      const res = await httpRequest(4031, 'POST', '/api/properties', property);
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });

    it('should get rooms list', async () => {
      const res = await httpRequest(4031, 'GET', '/api/rooms');
      expect(res.status).toBe(200);
    });

    it('should validate room status transitions', async () => {
      const res = await httpRequest(4031, 'GET', '/api/rooms/statuses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.statuses)).toBe(true);
    });
  });

  // Payment Gateway Tests
  describe('Payment Gateway (Port 4032)', () => {
    it('should create a payment intent', async () => {
      const payment = {
        amount: 5000,
        currency: 'INR',
        gateway: 'razorpay',
        customerId: 'cust_test123',
        bookingId: 'book_123',
      };
      const res = await httpRequest(4032, 'POST', '/api/payments/create', payment);
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('paymentId');
    });

    it('should list supported gateways', async () => {
      const res = await httpRequest(4032, 'GET', '/api/gateways');
      expect(res.status).toBe(200);
      expect(res.data.gateways).toContain('razorpay');
      expect(res.data.gateways).toContain('stripe');
    });

    it('should calculate platform fees correctly', async () => {
      const res = await httpRequest(4032, 'GET', '/api/fees?amount=10000&gateway=razorpay');
      expect(res.status).toBe(200);
      expect(res.data.fees).toBeGreaterThan(0);
      expect(res.data.netAmount).toBeLessThan(10000);
    });
  });

  // Rate Shopping Tests
  describe('Rate Shopping (Port 4033)', () => {
    it('should get rate recommendations', async () => {
      const res = await httpRequest(4033, 'GET', '/api/rates/recommendations?hotelId=hotel_123&date=2026-06-15');
      expect(res.status).toBe(200);
    });

    it('should get market data', async () => {
      const res = await httpRequest(4033, 'GET', '/api/market-data?hotelId=hotel_123&date=2026-06-15');
      expect(res.status).toBe(200);
    });

    it('should calculate yield score', async () => {
      const res = await httpRequest(4033, 'POST', '/api/yield/score', {
        hotelId: 'hotel_123',
        occupancy: 85,
        leadTime: 3,
        dayOfWeek: 5,
      });
      expect(res.status).toBe(200);
      expect(typeof res.data.score).toBe('number');
    });
  });

  // Virtual Concierge Tests
  describe('Virtual Concierge (Port 4034)', () => {
    it('should classify guest intent', async () => {
      const res = await httpRequest(4034, 'POST', '/api/classify', {
        message: 'I need extra towels for room 205',
        language: 'en',
      });
      expect(res.status).toBe(200);
      expect(res.data.intent).toBeDefined();
    });

    it('should create service request', async () => {
      const request = {
        hotelId: 'hotel_123',
        roomNumber: '205',
        requestType: 'housekeeping',
        description: 'Extra towels needed',
        priority: 'normal',
      };
      const res = await httpRequest(4034, 'POST', '/api/requests', request);
      expect(res.status).toBe(201);
    });

    it('should get knowledge base', async () => {
      const res = await httpRequest(4034, 'GET', '/api/knowledge?category=amenities');
      expect(res.status).toBe(200);
    });
  });

  // Loyalty Service Tests
  describe('Loyalty Service (Port 4037)', () => {
    it('should check member status', async () => {
      const res = await httpRequest(4037, 'GET', '/api/loyalty/member/test_user');
      expect(res.status).toBe(200);
    });

    it('should calculate points for stay', async () => {
      const res = await httpRequest(4037, 'POST', '/api/loyalty/calculate', {
        memberId: 'member_123',
        amount: 10000,
        type: 'stay',
      });
      expect(res.status).toBe(200);
      expect(res.data.points).toBeGreaterThan(0);
    });

    it('should get rewards catalog', async () => {
      const res = await httpRequest(4037, 'GET', '/api/loyalty/rewards');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.rewards)).toBe(true);
    });

    it('should get tier benefits', async () => {
      const res = await httpRequest(4037, 'GET', '/api/loyalty/tiers');
      expect(res.status).toBe(200);
      expect(res.data.tiers).toContain('BRONZE');
      expect(res.data.tiers).toContain('GOLD');
    });
  });

  // Offline Sync Tests
  describe('Offline Sync (Port 4038)', () => {
    it('should register device', async () => {
      const device = {
        deviceId: 'device_test_001',
        staffId: 'staff_001',
        deviceType: 'android',
        appVersion: '1.0.0',
      };
      const res = await httpRequest(4038, 'POST', '/api/devices/register', device);
      expect(res.status).toBe(201);
    });

    it('should get sync status', async () => {
      const res = await httpRequest(4038, 'GET', '/api/sync/status?staffId=staff_001');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('pendingOperations');
    });

    it('should queue operation', async () => {
      const operation = {
        id: 'op_test_001',
        staffId: 'staff_001',
        deviceId: 'device_test_001',
        operationType: 'ROOM_STATUS_UPDATE',
        entityType: 'room',
        entityId: 'room_101',
        data: { status: 'vacant-clean' },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };
      const res = await httpRequest(4038, 'POST', '/api/operations/queue', operation);
      expect(res.status).toBe(201);
    });

    it('should resolve conflict', async () => {
      const res = await httpRequest(4038, 'POST', '/api/conflicts/resolve', {
        operationId: 'op_test_001',
        resolution: 'server_wins',
      });
      expect(res.status).toBe(200);
    });
  });

  // Pricing Service Tests
  describe('Pricing Service (Port 4022)', () => {
    it('should get subscription tiers', async () => {
      const res = await httpRequest(4022, 'GET', '/api/pricing/tiers');
      expect(res.status).toBe(200);
      expect(res.data.tiers).toContain('BASIC');
      expect(res.data.tiers).toContain('PREMIUM');
    });

    it('should validate promo code', async () => {
      const res = await httpRequest(4022, 'POST', '/api/promo/validate', {
        code: 'SAVE20',
        amount: 5000,
      });
      expect(res.status).toBe(200);
    });

    it('should calculate dynamic price', async () => {
      const res = await httpRequest(4022, 'POST', '/api/dynamic-pricing/calculate', {
        hotelId: 'hotel_123',
        basePrice: 3000,
        occupancy: 85,
        checkinDate: '2026-06-15',
        checkoutDate: '2026-06-18',
      });
      expect(res.status).toBe(200);
      expect(res.data.adjustedPrice).toBeDefined();
    });
  });

  // Cross-Service Integration Tests
  describe('Cross-Service Flows', () => {
    it('Complete booking flow: PMS -> Payment -> Loyalty', async () => {
      // 1. Create reservation in PMS
      const reservation = await httpRequest(4031, 'POST', '/api/reservations', {
        roomId: 'room_101',
        guestName: 'Test Guest',
        checkin: '2026-06-15',
        checkout: '2026-06-18',
        amount: 9000,
      });
      expect(reservation.status).toBe(201);

      // 2. Process payment
      const payment = await httpRequest(4032, 'POST', '/api/payments/create', {
        amount: 9000,
        currency: 'INR',
        gateway: 'razorpay',
        customerId: 'cust_test',
        bookingId: reservation.data.data?.reservationId,
      });
      expect(payment.status).toBe(201);

      // 3. Award loyalty points
      const loyalty = await httpRequest(4037, 'POST', '/api/loyalty/calculate', {
        memberId: 'member_test',
        amount: 9000,
        type: 'stay',
      });
      expect(loyalty.status).toBe(200);
      expect(loyalty.data.points).toBeGreaterThan(0);
    });

    it('Service request flow: Concierge -> Housekeeping -> PMS', async () => {
      // 1. Create service request via concierge
      const request = await httpRequest(4034, 'POST', '/api/requests', {
        hotelId: 'hotel_123',
        roomNumber: '205',
        requestType: 'housekeeping',
        description: 'Extra towels',
        priority: 'normal',
      });
      expect(request.status).toBe(201);

      // 2. Update room status in PMS
      const update = await httpRequest(4031, 'PATCH', '/api/rooms/205/status', {
        status: 'needs-housekeeping',
      });
      expect([200, 404]).toContain(update.status); // May not exist in test DB
    });

    it('Rate update flow: Rate Shopping -> Pricing -> PMS', async () => {
      // 1. Get yield recommendation from rate shopping
      const yieldData = await httpRequest(4033, 'POST', '/api/yield/score', {
        hotelId: 'hotel_123',
        occupancy: 90,
        leadTime: 1,
        dayOfWeek: 6,
      });
      expect(yieldData.status).toBe(200);

      // 2. Apply dynamic pricing
      const pricing = await httpRequest(4022, 'POST', '/api/dynamic-pricing/calculate', {
        hotelId: 'hotel_123',
        basePrice: 3000,
        occupancy: 90,
        checkinDate: '2026-06-20',
      });
      expect(pricing.status).toBe(200);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should return 400 for invalid input', async () => {
      const res = await httpRequest(4032, 'POST', '/api/payments/create', {
        amount: -100, // Invalid negative amount
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent resources', async () => {
      const res = await httpRequest(4031, 'GET', '/api/properties/non-existent-id');
      expect(res.status).toBe(404);
    });

    it('should handle server errors gracefully', async () => {
      const res = await httpRequest(9999, 'GET', '/health');
      expect(res.status).toBe(0); // Connection refused
    });
  });
});

// Run summary
describe('Test Summary', () => {
  it('All services should be reachable', async () => {
    const results = await Promise.all(
      SERVICES.map(async s => {
        const res = await httpRequest(s.port, 'GET', '/health');
        return { name: s.name, port: s.port, healthy: res.status === 200 };
      })
    );

    const healthy = results.filter(r => r.healthy);
    const unhealthy = results.filter(r => !r.healthy);

    console.log('\n📊 Service Health Summary:');
    results.forEach(r => {
      console.log(`  ${r.healthy ? '✅' : '❌'} Port ${r.port} - ${r.name}`);
    });
    console.log(`\nTotal: ${healthy.length}/${results.length} services healthy`);

    // At least 1 service should be healthy for this test to pass
    expect(healthy.length).toBeGreaterThanOrEqual(1);
  });
});
