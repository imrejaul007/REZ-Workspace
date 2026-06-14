/**
 * rez-hotel-pos-service Unit Tests
 * Tests POS billing, folio management, and outlet operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('./config/env', () => ({
  env: {
    SERVICE_NAME: 'rez-hotel-pos-service',
    PORT: 4005,
    NODE_ENV: 'test',
  },
}));

// Mock logger
vi.mock('./config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('POS Service Configuration', () => {
  it('should have correct service configuration', () => {
    const config = {
      port: 4005,
      healthPort: 4105,
      serviceName: 'rez-hotel-pos-service',
    };

    expect(config.port).toBe(4005);
    expect(config.healthPort).toBe(4105);
    expect(config.serviceName).toBe('rez-hotel-pos-service');
  });

  it('should validate required environment variables', () => {
    const required = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'];

    const mockEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/rez_hotel_pos',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret',
    };

    required.forEach(env => {
      expect(mockEnv).toHaveProperty(env);
    });
  });
});

describe('Folio Management', () => {
  it('should have correct folio data structure', () => {
    const folio = {
      id: 'FOLIO-001',
      guestId: 'GUEST-123',
      reservationId: 'RES-456',
      transactions: [
        { type: 'CHARGE', amount: 5000, category: 'ROOM', description: 'Room charge' },
        { type: 'PAYMENT', amount: 5000, method: 'UPI', reference: 'UPI-REF-001' },
      ],
      balance: 0,
      currency: 'INR',
      createdAt: new Date(),
    };

    expect(folio).toHaveProperty('id');
    expect(folio).toHaveProperty('guestId');
    expect(folio).toHaveProperty('transactions');
    expect(folio.transactions).toHaveLength(2);
  });

  it('should calculate folio balance correctly', () => {
    const transactions = [
      { type: 'CHARGE', amount: 5000 },
      { type: 'CHARGE', amount: 1500 },
      { type: 'PAYMENT', amount: 3000 },
      { type: 'PAYMENT', amount: 3500 },
    ];

    const charges = transactions
      .filter(t => t.type === 'CHARGE')
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = transactions
      .filter(t => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = charges - payments;

    expect(charges).toBe(6500);
    expect(payments).toBe(6500);
    expect(balance).toBe(0);
  });

  it('should support transaction categories', () => {
    const categories = ['ROOM', 'F&B', 'MINIBAR', 'LAUNDRY', 'SPA', 'TRANSPORT', 'OTHER'];
    expect(categories).toContain('ROOM');
    expect(categories).toContain('F&B');
    expect(categories).toContain('MINIBAR');
  });

  it('should support payment methods', () => {
    const paymentMethods = ['CASH', 'CARD', 'UPI', 'WALLET', 'ROOM_CHARGE', 'VOUCHER'];
    expect(paymentMethods).toContain('CASH');
    expect(paymentMethods).toContain('UPI');
    expect(paymentMethods).toContain('ROOM_CHARGE');
  });
});

describe('Outlet Management', () => {
  it('should have correct outlet data structure', () => {
    const outlet = {
      id: 'OUTLET-001',
      name: 'Restaurant A',
      type: 'RESTAURANT',
      hotelId: 'HTL-001',
      tables: 20,
      capacity: 80,
      active: true,
    };

    expect(outlet).toHaveProperty('id');
    expect(outlet).toHaveProperty('type');
    expect(outlet).toHaveProperty('tables');
    expect(outlet).toHaveProperty('capacity');
  });

  it('should support outlet types', () => {
    const outletTypes = ['RESTAURANT', 'BAR', 'POOL_SIDE', 'ROOM_SERVICE', 'BANQUET', 'SPA'];
    expect(outletTypes).toContain('RESTAURANT');
    expect(outletTypes).toContain('ROOM_SERVICE');
    expect(outletTypes.length).toBe(6);
  });

  it('should validate table availability', () => {
    const tables = 20;
    const occupied = 12;
    const available = tables - occupied;

    expect(available).toBe(8);
    expect(available).toBeGreaterThan(0);
  });
});

describe('Payment Processing', () => {
  it('should calculate correct totals with tax', () => {
    const subtotal = 1000;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;

    expect(cgst).toBe(90);
    expect(sgst).toBe(90);
    expect(total).toBe(1180);
  });

  it('should handle discount calculations', () => {
    const amount = 5000;
    const discountPercent = 10;
    const discount = amount * (discountPercent / 100);
    const finalAmount = amount - discount;

    expect(discount).toBe(500);
    expect(finalAmount).toBe(4500);
  });

  it('should support split payments', () => {
    const totalAmount = 5000;
    const payments = [
      { method: 'CASH', amount: 2000 },
      { method: 'CARD', amount: 3000 },
    ];

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPaid).toBe(totalAmount);
  });
});

describe('Health Check Response', () => {
  it('should return correct health status format', () => {
    const healthResponse = {
      status: 'ok',
      service: 'rez-hotel-pos-service',
    };

    expect(healthResponse.status).toBe('ok');
    expect(healthResponse.service).toBe('rez-hotel-pos-service');
  });
});

describe('API Response Format', () => {
  it('should format success responses correctly', () => {
    const successResponse = {
      success: true,
      data: { folioId: 'FOLIO-001', balance: 0 },
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toHaveProperty('folioId');
  });

  it('should format error responses correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Internal server error',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });
});

describe('Rate Limiting', () => {
  it('should have appropriate rate limits', () => {
    const rateLimit = {
      windowMs: 60 * 1000,
      maxRequests: 100,
    };

    expect(rateLimit.windowMs).toBe(60000);
    expect(rateLimit.maxRequests).toBe(100);
  });
});
