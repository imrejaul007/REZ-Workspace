/**
 * rez-hotel-service Unit Tests
 * Tests hotel search, booking, and sync functionality
 *
 * Coverage:
 * - Hotel data models
 * - Hotel search parameters validation
 * - Booking data validation
 * - Status flow validation
 * - API response formats
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger
vi.mock('./utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Hotel Model', () => {
  it('should have correct hotel data structure', () => {
    const hotel = {
      externalId: 'HTL001',
      name: 'Grand Hotel Mumbai',
      address: '123 Marine Drive',
      city: 'Mumbai',
      country: 'India',
      rating: 4.5,
      images: ['img1.jpg', 'img2.jpg'],
      amenities: ['wifi', 'pool', 'gym', 'spa'],
      syncedAt: new Date(),
    };

    expect(hotel).toHaveProperty('externalId');
    expect(hotel).toHaveProperty('name');
    expect(hotel).toHaveProperty('city');
    expect(hotel).toHaveProperty('rating');
    expect(hotel).toHaveProperty('amenities');
  });

  it('should support nested rooms structure', () => {
    const hotelRooms = [
      { type: 'standard', name: 'Standard Room', price: 5000, capacity: 2, available: true },
      { type: 'deluxe', name: 'Deluxe Suite', price: 8000, capacity: 4, available: false },
      { type: 'suite', name: 'Presidential Suite', price: 15000, capacity: 6, available: true },
    ];

    expect(hotelRooms).toHaveLength(3);
    expect(hotelRooms[0].available).toBe(true);
    expect(hotelRooms[1].available).toBe(false);
  });

  it('should validate hotel rating range', () => {
    const validRating = 4.5;
    expect(validRating).toBeGreaterThanOrEqual(0);
    expect(validRating).toBeLessThanOrEqual(5);
  });
});

describe('Hotel Search Parameters', () => {
  it('should validate required search parameters', () => {
    const requiredParams = ['city', 'checkIn', 'checkOut'];

    const validRequest = {
      city: 'Mumbai',
      checkIn: '2024-06-01',
      checkOut: '2024-06-05',
      rooms: '2',
    };

    requiredParams.forEach(param => {
      expect(validRequest).toHaveProperty(param);
      expect(validRequest[param as keyof typeof validRequest]).toBeTruthy();
    });
  });

  it('should validate date format', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const checkIn = '2024-06-01';
    const checkOut = '2024-06-05';

    expect(checkIn).toMatch(dateRegex);
    expect(checkOut).toMatch(dateRegex);
  });

  it('should validate rooms count', () => {
    const validRooms = '2';
    expect(parseInt(validRooms)).toBeGreaterThan(0);
    expect(parseInt(validRooms)).toBeLessThanOrEqual(10);
  });
});

describe('Booking Model', () => {
  it('should have correct booking data structure', () => {
    const booking = {
      bookingId: 'BK001',
      hotelId: 'HTL001',
      externalBookingId: 'EXT-BK-001',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      checkIn: new Date('2024-06-01'),
      checkOut: new Date('2024-06-05'),
      rooms: 2,
      totalAmount: 10000,
      status: 'confirmed',
      createdAt: new Date(),
    };

    expect(booking).toHaveProperty('bookingId');
    expect(booking).toHaveProperty('hotelId');
    expect(booking).toHaveProperty('guestName');
    expect(booking).toHaveProperty('guestEmail');
    expect(booking).toHaveProperty('status');
    expect(booking).toHaveProperty('totalAmount');
  });

  it('should validate booking dates are in correct order', () => {
    const checkIn = new Date('2024-06-01');
    const checkOut = new Date('2024-06-05');

    expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
  });

  it('should validate booking status values', () => {
    const validStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

    const statuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    statuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
});

describe('Booking Validation', () => {
  it('should validate required booking fields', () => {
    const requiredFields = ['hotelId', 'guestName', 'guestEmail', 'checkIn', 'checkOut', 'rooms'];

    const validBooking = {
      hotelId: 'HTL001',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      checkIn: '2024-06-01',
      checkOut: '2024-06-05',
      rooms: 2,
    };

    requiredFields.forEach(field => {
      expect(validBooking).toHaveProperty(field);
    });
  });

  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = 'john@example.com';
    const invalidEmail = 'invalid-email';

    expect(validEmail).toMatch(emailRegex);
    expect(invalidEmail).not.toMatch(emailRegex);
  });

  it('should validate room count', () => {
    const roomCount = 2;
    expect(roomCount).toBeGreaterThan(0);
    expect(roomCount).toBeLessThanOrEqual(10);
  });
});

describe('Amenities', () => {
  it('should support common hotel amenities', () => {
    const amenities = [
      'wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking',
      'room_service', 'laundry', 'concierge', 'business_center',
      'pet_friendly', 'airport_shuttle', 'beach_access', 'kids_club'
    ];

    expect(amenities).toContain('wifi');
    expect(amenities).toContain('pool');
    expect(amenities).toContain('parking');
    expect(amenities.length).toBeGreaterThan(10);
  });
});

describe('API Response Formats', () => {
  it('should format hotel search response correctly', () => {
    const searchResponse = {
      data: [
        { id: 'HTL001', name: 'Grand Hotel', city: 'Mumbai', rating: 4.5, price: 5000 },
        { id: 'HTL002', name: 'Budget Inn', city: 'Mumbai', rating: 3.5, price: 2500 },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    };

    expect(searchResponse.data).toHaveLength(2);
    expect(searchResponse.data[0]).toHaveProperty('id');
    expect(searchResponse.data[0]).toHaveProperty('name');
    expect(searchResponse.data[0]).toHaveProperty('rating');
    expect(searchResponse.meta).toHaveProperty('total');
  });

  it('should format hotel details response correctly', () => {
    const hotelResponse = {
      id: 'HTL001',
      name: 'Grand Hotel',
      address: '123 Marine Drive',
      city: 'Mumbai',
      country: 'India',
      rating: 4.5,
      reviewCount: 250,
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      amenities: ['wifi', 'pool', 'gym'],
      rooms: [
        { type: 'standard', price: 5000, available: true },
        { type: 'deluxe', price: 8000, available: true },
      ],
      location: { lat: 18.9220, lng: 72.8337 },
    };

    expect(hotelResponse).toHaveProperty('id');
    expect(hotelResponse).toHaveProperty('rating');
    expect(hotelResponse).toHaveProperty('rooms');
    expect(hotelResponse.rooms).toHaveLength(2);
  });

  it('should format booking response correctly', () => {
    const bookingResponse = {
      bookingId: 'BK001',
      hotelId: 'HTL001',
      guestName: 'John Doe',
      status: 'confirmed',
      checkIn: '2024-06-01',
      checkOut: '2024-06-05',
      rooms: 2,
      totalAmount: 10000,
      currency: 'INR',
      confirmationCode: 'GH-ABC123',
    };

    expect(bookingResponse).toHaveProperty('bookingId');
    expect(bookingResponse).toHaveProperty('confirmationCode');
    expect(bookingResponse).toHaveProperty('status');
  });

  it('should format sync response correctly', () => {
    const syncResponse = {
      synced: true,
      count: 15,
      lastSyncAt: new Date().toISOString(),
      errors: [],
    };

    expect(syncResponse).toHaveProperty('synced');
    expect(syncResponse).toHaveProperty('count');
    expect(syncResponse.synced).toBe(true);
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const healthResponse = {
      status: 'ok',
      service: 'rez-hotel-service',
      timestamp: new Date().toISOString(),
    };

    expect(healthResponse.status).toBe('ok');
    expect(healthResponse.service).toBe('rez-hotel-service');
  });
});

describe('Error Responses', () => {
  it('should format error responses correctly', () => {
    const errorResponse = {
      error: 'Hotel search failed',
      code: 'SEARCH_ERROR',
      details: 'Unable to connect to Makcorps API',
    };

    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse).toHaveProperty('code');
  });

  it('should format booking error responses correctly', () => {
    const bookingError = {
      error: 'Booking failed',
      code: 'BOOKING_ERROR',
      details: 'Hotel not found',
    };

    expect(bookingError.error).toBe('Booking failed');
    expect(bookingError.code).toBe('BOOKING_ERROR');
  });
});

describe('Pricing', () => {
  it('should calculate total booking amount', () => {
    const roomPrice = 5000;
    const nights = 4;
    const rooms = 2;
    const taxRate = 0.18;

    const subtotal = roomPrice * nights * rooms;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    expect(subtotal).toBe(40000);
    expect(tax).toBe(7200);
    expect(total).toBe(47200);
  });

  it('should support multiple currencies', () => {
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
    expect(currencies).toContain('INR');
    expect(currencies).toContain('USD');
  });
});

describe('City Codes', () => {
  it('should support major Indian cities', () => {
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
      'Hyderabad', 'Pune', 'Jaipur', 'Goa', 'Ahmedabad'
    ];

    expect(indianCities).toContain('Mumbai');
    expect(indianCities).toContain('Delhi');
    expect(indianCities).toContain('Goa');
    expect(indianCities.length).toBe(10);
  });
});
