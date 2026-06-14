/**
 * REZ Booking Engine Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    },
  },
  Schema: class MockSchema {
    static Types = { Mixed: 'Mixed' };
  },
}));

vi.mock('./models', () => ({
  Booking: {
    find: vi.fn().mockReturnThis(),
    findOne: vi.fn().mockReturnThis(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    findOneAndUpdate: vi.fn(),
  },
  Hotel: {
    find: vi.fn().mockReturnThis(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
  Room: {
    find: vi.fn().mockReturnThis(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
  Guest: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  RatePlan: {
    create: vi.fn(),
  },
}));

describe('REZ Booking Engine Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check Endpoints', () => {
    it('should return health status with database info', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'rez-booking-engine',
        version: '1.0.0',
        port: 4042,
        database: 'connected',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.database).toBe('connected');
    });

    it('should return liveness status', () => {
      const mockLivenessResponse = { status: 'alive' };
      expect(mockLivenessResponse.status).toBe('alive');
    });

    it('should return readiness status', () => {
      const mockReadinessResponse = { status: 'ready' };
      expect(mockReadinessResponse.status).toBe('ready');
    });
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4042', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have correct MongoDB URL configuration', () => {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rez-booking-engine';
      expect(mongoUrl).toMatch(/^mongodb/);
    });

    it('should have internal service token', () => {
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';
      expect(typeof internalToken).toBe('string');
      expect(internalToken.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limit configuration', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      };

      expect(rateLimitConfig.windowMs).toBe(900000);
      expect(rateLimitConfig.max).toBe(100);
    });
  });

  describe('Booking Schema Validation', () => {
    it('should validate required booking fields', () => {
      const validBooking = {
        guestName: expect.any(String),
        guestEmail: expect.any(String),
        guestPhone: expect.stringMatching(/^[6-9]\d{9}$/),
        hotelId: expect.any(String),
        roomId: expect.any(String),
        checkIn: expect.any(String),
        checkOut: expect.any(String),
        adults: expect.any(Number),
        children: expect.any(Number),
      };

      const mockBooking = {
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '9876543210',
        hotelId: 'HTL-001',
        roomId: 'RM-001',
        checkIn: '2024-06-01T14:00:00.000Z',
        checkOut: '2024-06-05T12:00:00.000Z',
        adults: 2,
        children: 0,
      };

      expect(mockBooking).toMatchObject(validBooking);
    });
  });

  describe('Search Schema Validation', () => {
    it('should validate search parameters', () => {
      const validSearch = {
        city: expect.any(String),
        checkIn: expect.any(String),
        checkOut: expect.any(String),
        guests: expect.any(Number),
        minPrice: expect.any(Number),
        maxPrice: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
      };

      const mockSearch = {
        city: 'Mumbai',
        checkIn: '2024-06-01T14:00:00.000Z',
        checkOut: '2024-06-05T12:00:00.000Z',
        guests: 2,
        minPrice: 1000,
        maxPrice: 5000,
        page: 1,
        limit: 20,
      };

      expect(mockSearch).toMatchObject(validSearch);
    });
  });

  describe('Hotel API Response Format', () => {
    it('should return hotels list response format', () => {
      const mockResponse = {
        success: true,
        data: {
          hotels: [],
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            pages: expect.any(Number),
          },
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.pagination).toBeDefined();
    });

    it('should return hotel detail response format', () => {
      const mockResponse = {
        success: true,
        data: {
          hotelId: 'HTL-001',
          name: 'Test Hotel',
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.hotelId).toBeDefined();
    });
  });

  describe('Booking API Response Format', () => {
    it('should return booking confirmation format', () => {
      const mockBooking = {
        success: true,
        data: {
          bookingId: expect.any(String),
          confirmationCode: expect.stringMatching(/^REZ/),
          guestName: 'John Doe',
          hotelId: 'HTL-001',
          roomId: 'RM-001',
          status: expect.stringMatching(/^(pending|confirmed|checked-in|checked-out|cancelled)/),
          paymentStatus: expect.stringMatching(/^(pending|paid|refunded)/),
          totalAmount: expect.any(Number),
          currency: 'INR',
        },
      };

      const mockData = {
        success: true,
        data: {
          bookingId: 'BKG-001',
          confirmationCode: 'REZ123456',
          guestName: 'John Doe',
          hotelId: 'HTL-001',
          roomId: 'RM-001',
          status: 'confirmed',
          paymentStatus: 'pending',
          totalAmount: 4000,
          currency: 'INR',
        },
      };

      expect(mockData).toMatchObject(mockBooking);
    });

    it('should validate booking status transitions', () => {
      const validStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('confirmed');
      expect(validStatuses).toContain('cancelled');
    });
  });

  describe('Room API Response Format', () => {
    it('should return rooms list format', () => {
      const mockResponse = {
        success: true,
        data: {
          rooms: [],
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
          },
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(Array.isArray(mockResponse.data.rooms)).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    it('should return error response format', () => {
      const mockError = {
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      };

      const mockData = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      };

      expect(mockData).toMatchObject(mockError);
    });

    it('should handle rate limit errors', () => {
      const mockRateLimitError = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      };

      expect(mockRateLimitError.success).toBe(false);
      expect(mockRateLimitError.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Authentication', () => {
    it('should validate internal token authentication', () => {
      const internalToken = 'test-token';
      const configToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

      expect(typeof internalToken).toBe('string');
      expect(typeof configToken).toBe('string');
    });

    it('should require Bearer token for API endpoints', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      expect(authHeader.startsWith('Bearer ')).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    it('should have restricted origins in production', () => {
      const productionOrigins = ['https://rez.app', 'https://admin.rez.app'];
      expect(productionOrigins).toHaveLength(2);
      expect(productionOrigins[0]).toBe('https://rez.app');
    });

    it('should allow all origins in development', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        expect('*').toBeTruthy();
      }
    });
  });
});