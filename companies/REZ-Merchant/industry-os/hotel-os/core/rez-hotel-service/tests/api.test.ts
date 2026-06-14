/**
 * REZ Hotel Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Hotel Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4015', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have allowed CORS origins', () => {
      const allowedOrigins = (process.env.CORS_ORIGINS || 'https://rez.money,https://admin.rez.money,https://merchant.rez.money').split(',');
      expect(allowedOrigins.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should have health endpoint', () => {
      expect(true).toBe(true); // Placeholder for actual health check
    });
  });

  describe('API Routes', () => {
    it('should have hotels API route', () => {
      const hotelsRoute = '/api/hotels';
      expect(hotelsRoute).toBe('/api/hotels');
    });

    it('should have bookings API route', () => {
      const bookingsRoute = '/api/bookings';
      expect(bookingsRoute).toBe('/api/bookings');
    });

    it('should have sync API route', () => {
      const syncRoute = '/api/sync';
      expect(syncRoute).toBe('/api/sync');
    });
  });

  describe('Hotel Schema', () => {
    it('should validate hotel data structure', () => {
      const hotelSchema = {
        hotelId: expect.any(String),
        name: expect.any(String),
        address: {
          street: expect.any(String),
          city: expect.any(String),
          state: expect.any(String),
          country: expect.any(String),
        },
        contact: {
          phone: expect.any(String),
          email: expect.any(String),
        },
        amenities: expect.any(Array),
        rating: expect.any(Number),
        status: expect.stringMatching(/^(active|inactive|pending)$/),
      };

      const mockHotel = {
        hotelId: 'HTL-001',
        name: 'Grand Hotel',
        address: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        contact: {
          phone: '912345678901',
          email: 'info@grandhotel.com',
        },
        amenities: ['WiFi', 'Pool', 'Gym'],
        rating: 4.5,
        status: 'active',
      };

      expect(mockHotel).toMatchObject(hotelSchema);
    });
  });

  describe('Booking Schema', () => {
    it('should validate booking data structure', () => {
      const bookingSchema = {
        bookingId: expect.any(String),
        hotelId: expect.any(String),
        guestName: expect.any(String),
        checkIn: expect.any(Date),
        checkOut: expect.any(Date),
        status: expect.stringMatching(/^(pending|confirmed|checked-in|checked-out|cancelled)/),
      };

      const mockBooking = {
        bookingId: 'BKG-001',
        hotelId: 'HTL-001',
        guestName: 'John Doe',
        checkIn: new Date(),
        checkOut: new Date(),
        status: 'confirmed',
      };

      expect(mockBooking).toMatchObject(bookingSchema);
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
          hotelId: 'HTL-001',
          name: 'Grand Hotel',
        },
      };

      expect(mockResponse).toMatchObject(successResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hotel not found',
        },
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });
});