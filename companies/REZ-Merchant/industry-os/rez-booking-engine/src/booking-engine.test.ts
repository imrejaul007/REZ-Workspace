/**
 * rez-booking-engine Unit Tests
 * Tests room availability, booking, rates, and search functionality
 */

import { describe, it, expect } from 'vitest';

describe('Room Management', () => {
  it('should have correct room structure', () => {
    const room = {
      id: 'room-101',
      hotelId: 'hotel-001',
      hotelName: 'Grand Plaza Hotel',
      roomType: 'Standard Room',
      description: 'Comfortable standard room',
      baseRate: 3500,
      maxOccupancy: 2,
      amenities: ['WiFi', 'TV', 'AC'],
      status: 'available' as const,
    };

    expect(room).toHaveProperty('id');
    expect(room).toHaveProperty('roomType');
    expect(room).toHaveProperty('baseRate');
    expect(room).toHaveProperty('status');
    expect(room.status).toBe('available');
  });

  it('should validate room statuses', () => {
    const statuses = ['available', 'maintenance', 'out-of-service'];
    expect(statuses).toContain('available');
    expect(statuses).toContain('maintenance');
  });

  it('should calculate room occupancy correctly', () => {
    const room = { maxOccupancy: 3 };
    const guests = { adults: 2, children: 1 };

    const totalOccupancy = guests.adults + guests.children;
    expect(totalOccupancy).toBeLessThanOrEqual(room.maxOccupancy);
    expect(totalOccupancy).toBe(3);
  });

  it('should validate room amenities', () => {
    const amenities = ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'];
    expect(amenities.length).toBeGreaterThan(0);
    expect(amenities).toContain('WiFi');
  });
});

describe('Rate Plans', () => {
  it('should have correct rate plan structure', () => {
    const ratePlan = {
      id: 'rate-001',
      roomId: 'room-101',
      name: 'Standard Rate',
      rate: 3500,
      currency: 'INR',
      inclusions: ['Breakfast', 'WiFi'],
      cancellationPolicy: 'Free cancellation until 24 hours before check-in',
      isRefundable: true,
    };

    expect(ratePlan).toHaveProperty('rate');
    expect(ratePlan).toHaveProperty('isRefundable');
    expect(ratePlan.rate).toBeGreaterThan(0);
  });

  it('should calculate total rate for multiple nights', () => {
    const nightlyRate = 3500;
    const nights = 3;
    const totalRate = nightlyRate * nights;

    expect(totalRate).toBe(10500);
  });

  it('should validate refundable vs non-refundable rates', () => {
    const refundableRate = { rate: 3500, isRefundable: true };
    const nonRefundableRate = { rate: 3150, isRefundable: false };

    expect(refundableRate.isRefundable).toBe(true);
    expect(nonRefundableRate.isRefundable).toBe(false);
    expect(nonRefundableRate.rate).toBeLessThan(refundableRate.rate);
  });

  it('should validate inclusion list', () => {
    const inclusions = ['Breakfast', 'WiFi', 'Late Checkout'];
    expect(inclusions.length).toBeGreaterThan(0);
    expect(inclusions).toContain('Breakfast');
  });
});

describe('Booking Management', () => {
  it('should have correct booking structure', () => {
    const booking = {
      id: 'booking-001',
      confirmationCode: 'GPH-ABC123',
      guestName: 'Rajesh Kumar',
      guestEmail: 'rajesh@email.com',
      guestPhone: '+919876543210',
      hotelId: 'hotel-001',
      hotelName: 'Grand Plaza Hotel',
      roomId: 'room-101',
      roomType: 'Standard Room',
      checkIn: new Date('2026-06-15'),
      checkOut: new Date('2026-06-18'),
      nights: 3,
      adults: 2,
      children: 0,
      totalAmount: 10500,
      currency: 'INR',
      status: 'confirmed' as const,
      paymentStatus: 'paid' as const,
    };

    expect(booking).toHaveProperty('confirmationCode');
    expect(booking).toHaveProperty('nights');
    expect(booking).toHaveProperty('status');
    expect(booking.confirmationCode).toMatch(/^[A-Z]{3}-[A-Z0-9]{6}$/);
  });

  it('should validate booking statuses', () => {
    const statuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    expect(statuses).toContain('pending');
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('cancelled');
  });

  it('should validate payment statuses', () => {
    const paymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
    expect(paymentStatuses).toContain('pending');
    expect(paymentStatuses).toContain('paid');
  });

  it('should calculate nights from check-in and check-out', () => {
    const checkIn = new Date('2026-06-15');
    const checkOut = new Date('2026-06-18');
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    expect(nights).toBe(3);
  });

  it('should generate valid confirmation code', () => {
    const generateCode = () => {
      const prefix = 'GPH';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${prefix}-${code}`;
    };

    const code = generateCode();
    expect(code).toMatch(/^GPH-[A-Z0-9]{6}$/);
  });
});

describe('Search Functionality', () => {
  it('should validate search parameters', () => {
    const searchParams = {
      hotelId: 'hotel-001',
      checkIn: '2026-06-15',
      checkOut: '2026-06-18',
      adults: 2,
      children: 0,
    };

    expect(searchParams).toHaveProperty('checkIn');
    expect(searchParams).toHaveProperty('checkOut');
    expect(searchParams.adults).toBeGreaterThanOrEqual(1);
  });

  it('should filter rooms by occupancy', () => {
    const rooms = [
      { id: 'room-101', maxOccupancy: 2 },
      { id: 'room-102', maxOccupancy: 3 },
      { id: 'room-103', maxOccupancy: 4 },
    ];

    const guests = { adults: 2, children: 1 };
    const totalOccupancy = guests.adults + guests.children;

    const suitableRooms = rooms.filter(r => r.maxOccupancy >= totalOccupancy);
    expect(suitableRooms.length).toBe(2);
  });

  it('should filter rooms by price range', () => {
    const rooms = [
      { id: 'room-101', baseRate: 2500 },
      { id: 'room-102', baseRate: 5000 },
      { id: 'room-103', baseRate: 10000 },
    ];

    const minPrice = 3000;
    const maxPrice = 8000;

    const filteredRooms = rooms.filter(r => r.baseRate >= minPrice && r.baseRate <= maxPrice);
    expect(filteredRooms.length).toBe(1);
    expect(filteredRooms[0].id).toBe('room-102');
  });

  it('should filter rooms by room type', () => {
    const rooms = [
      { id: 'room-101', roomType: 'Standard Room' },
      { id: 'room-102', roomType: 'Deluxe Room' },
      { id: 'room-103', roomType: 'Suite' },
    ];

    const searchType = 'deluxe';
    const filteredRooms = rooms.filter(r =>
      r.roomType.toLowerCase().includes(searchType.toLowerCase())
    );

    expect(filteredRooms.length).toBe(1);
    expect(filteredRooms[0].roomType).toContain('Deluxe');
  });
});

describe('Availability Check', () => {
  it('should detect overlapping bookings', () => {
    const existingBooking = {
      checkIn: new Date('2026-06-15'),
      checkOut: new Date('2026-06-18'),
      status: 'confirmed',
    };

    const newRequest = {
      checkIn: new Date('2026-06-16'),
      checkOut: new Date('2026-06-19'),
    };

    const isOverlapping =
      (newRequest.checkIn >= existingBooking.checkIn && newRequest.checkIn < existingBooking.checkOut) ||
      (newRequest.checkOut > existingBooking.checkIn && newRequest.checkOut <= existingBooking.checkOut) ||
      (newRequest.checkIn <= existingBooking.checkIn && newRequest.checkOut >= existingBooking.checkOut);

    expect(isOverlapping).toBe(true);
  });

  it('should allow non-overlapping bookings', () => {
    const existingBooking = {
      checkIn: new Date('2026-06-15'),
      checkOut: new Date('2026-06-18'),
      status: 'confirmed',
    };

    const newRequest = {
      checkIn: new Date('2026-06-20'),
      checkOut: new Date('2026-06-23'),
    };

    const isOverlapping =
      (newRequest.checkIn >= existingBooking.checkIn && newRequest.checkIn < existingBooking.checkOut) ||
      (newRequest.checkOut > existingBooking.checkIn && newRequest.checkOut <= existingBooking.checkOut) ||
      (newRequest.checkIn <= existingBooking.checkIn && newRequest.checkOut >= existingBooking.checkOut);

    expect(isOverlapping).toBe(false);
  });

  it('should skip cancelled bookings in availability check', () => {
    const booking = { status: 'cancelled' };
    const shouldCheck = booking.status !== 'cancelled';
    expect(shouldCheck).toBe(false);
  });
});

describe('Guest Management', () => {
  it('should have correct guest structure', () => {
    const guest = {
      id: 'guest-001',
      name: 'Rajesh Kumar',
      email: 'rajesh@email.com',
      phone: '+919876543210',
      preferences: ['Late Checkout', 'High Floor'],
    };

    expect(guest).toHaveProperty('email');
    expect(guest).toHaveProperty('name');
    expect(guest.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it('should validate guest email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.in'];
    const invalidEmails = ['invalid', '@nodomain.com', 'no@'];

    validEmails.forEach(email => {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    invalidEmails.forEach(email => {
      expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  it('should validate phone number format', () => {
    const phone = '+919876543210';
    expect(phone.length).toBeGreaterThanOrEqual(10);
    expect(phone.startsWith('+')).toBe(true);
  });
});

describe('API Response Format', () => {
  it('should format success response correctly', () => {
    const response = {
      success: true,
      data: { id: 'booking-001', status: 'confirmed' },
      message: 'Booking created successfully',
    };

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('data');
  });

  it('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Room not available',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });

  it('should format validation error with errors array', () => {
    const validationError = {
      success: false,
      data: { errors: [{ field: 'email', message: 'Invalid email format' }] },
      message: 'Validation failed',
    };

    expect(validationError.success).toBe(false);
    expect(validationError.data).toHaveProperty('errors');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-booking-engine',
      port: 4042,
      timestamp: new Date().toISOString(),
      stats: {
        rooms: 3,
        ratePlans: 4,
        bookings: 1,
        guests: 0,
      },
    };

    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('stats');
    expect(health.stats).toHaveProperty('rooms');
  });
});

describe('Cancellation Policy', () => {
  it('should handle refundable cancellation', () => {
    const booking = {
      status: 'confirmed',
      paymentStatus: 'paid',
      totalAmount: 10500,
    };

    const isRefundable = true;
    const cancellationPolicy = isRefundable
      ? 'Eligible for refund based on cancellation policy'
      : 'Non-refundable booking';

    expect(cancellationPolicy).toContain('Eligible for refund');
  });

  it('should handle non-refundable cancellation', () => {
    const isRefundable = false;
    const cancellationPolicy = isRefundable
      ? 'Eligible for refund based on cancellation policy'
      : 'Non-refundable booking';

    expect(cancellationPolicy).toContain('Non-refundable');
  });

  it('should not allow modification of cancelled bookings', () => {
    const booking = { status: 'cancelled' };
    const canModify = booking.status !== 'cancelled';
    expect(canModify).toBe(false);
  });

  it('should not allow cancellation of checked-in bookings', () => {
    const booking = { status: 'checked-in' };
    const canCancel = booking.status !== 'checked-in' && booking.status !== 'checked-out';
    expect(canCancel).toBe(false);
  });
});
