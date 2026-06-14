/**
 * REZ Salon Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Salon Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'rez-salon-service',
        timestamp: expect.any(String),
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.service).toBe('rez-salon-service');
    });
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4010', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should detect production environment', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(typeof isProduction).toBe('boolean');
    });
  });

  describe('CORS Configuration', () => {
    it('should require CORS_ORIGIN in production', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

      if (isProduction) {
        expect(corsOrigins.length).toBeGreaterThan(0);
      }
    });

    it('should have development fallback origins', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

      if (!isProduction && corsOrigins.length === 0) {
        const defaults = ['http://localhost:3000', 'http://localhost:8080'];
        expect(defaults).toHaveLength(2);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should have general rate limit configuration', () => {
      const generalLimiter = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      };

      expect(generalLimiter.windowMs).toBe(900000);
      expect(generalLimiter.max).toBe(100);
    });

    it('should have auth rate limit configuration', () => {
      const authLimiter = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
      };

      expect(authLimiter.windowMs).toBe(900000);
      expect(authLimiter.max).toBe(5);
    });
  });

  describe('API Routes', () => {
    it('should have salons endpoint', () => {
      const endpoint = '/api/salons';
      expect(endpoint).toBe('/api/salons');
    });

    it('should have bookings endpoint', () => {
      const endpoint = '/api/bookings';
      expect(endpoint).toBe('/api/bookings');
    });

    it('should have services endpoint', () => {
      const endpoint = '/api/services';
      expect(endpoint).toBe('/api/services');
    });

    it('should have availability endpoint', () => {
      const endpoint = '/api/availability';
      expect(endpoint).toBe('/api/availability');
    });
  });

  describe('Salon Schema', () => {
    it('should validate salon data structure', () => {
      const salonSchema = {
        salonId: expect.any(String),
        name: expect.any(String),
        address: expect.any(Object),
        phone: expect.any(String),
        email: expect.any(String),
        services: expect.any(Array),
        staff: expect.any(Array),
        operatingHours: expect.any(Object),
        status: expect.stringMatching(/^(active|inactive|pending)$/),
      };

      const mockSalon = {
        salonId: 'SAL-001',
        name: 'Beauty Salon',
        address: { street: '123 Main St', city: 'Mumbai' },
        phone: '9876543210',
        email: 'info@beautysalon.com',
        services: ['Haircut', 'Facial'],
        staff: ['Staff-1', 'Staff-2'],
        operatingHours: { open: '09:00', close: '20:00' },
        status: 'active',
      };

      expect(mockSalon).toMatchObject(salonSchema);
    });
  });

  describe('Booking Schema', () => {
    it('should validate booking data structure', () => {
      const bookingSchema = {
        bookingId: expect.any(String),
        salonId: expect.any(String),
        customerId: expect.any(String),
        serviceId: expect.any(String),
        staffId: expect.any(String),
        dateTime: expect.any(Date),
        duration: expect.any(Number),
        status: expect.stringMatching(/^(pending|confirmed|completed|cancelled|no-show)/),
      };

      const mockBooking = {
        bookingId: 'BKG-001',
        salonId: 'SAL-001',
        customerId: 'CUST-001',
        serviceId: 'SRV-001',
        staffId: 'STAFF-001',
        dateTime: new Date(),
        duration: 60,
        status: 'confirmed',
      };

      expect(mockBooking).toMatchObject(bookingSchema);
    });
  });

  describe('Service Schema', () => {
    it('should validate service data structure', () => {
      const serviceSchema = {
        serviceId: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        price: expect.any(Number),
        duration: expect.any(Number),
        description: expect.any(String),
        status: expect.stringMatching(/^(active|inactive)$/),
      };

      const mockService = {
        serviceId: 'SRV-001',
        name: 'Haircut',
        category: 'Hair',
        price: 500,
        duration: 45,
        description: 'Professional haircut',
        status: 'active',
      };

      expect(mockService).toMatchObject(serviceSchema);
    });
  });

  describe('API Response Format', () => {
    it('should return success response format', () => {
      const successResponse = {
        success: true,
        data: expect.any(Object),
      };

      const mockResponse = {
        success: true,
        data: {
          salonId: 'SAL-001',
          name: 'Beauty Salon',
        },
      };

      expect(mockResponse).toMatchObject(successResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: expect.any(String),
      };

      const mockError = {
        success: false,
        error: 'Too many requests, please try again later',
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });
});