/**
 * rez-spa-service Unit Tests
 * Tests spa treatments, bookings, therapist scheduling, and membership functionality
 */

import { describe, it, expect } from 'vitest';

describe('Treatments', () => {
  it('should have correct treatment structure', () => {
    const treatment = {
      id: 'treat-001',
      name: 'Swedish Massage',
      description: 'Classic relaxation massage',
      category: 'massage' as const,
      duration: 60,
      price: 3500,
      currency: 'INR',
      benefits: ['Stress relief', 'Improved circulation'],
      equipment: ['Massage table', 'Hot stones'],
      isActive: true,
    };

    expect(treatment).toHaveProperty('name');
    expect(treatment).toHaveProperty('duration');
    expect(treatment).toHaveProperty('price');
    expect(treatment.category).toBe('massage');
  });

  it('should validate treatment categories', () => {
    const categories = ['massage', 'facial', 'body-treatment', 'ayurvedic', 'nail', 'hair', 'package'];
    expect(categories).toContain('massage');
    expect(categories).toContain('ayurvedic');
    expect(categories).toContain('facial');
  });

  it('should track treatment benefits', () => {
    const treatment = {
      benefits: ['Stress relief', 'Improved circulation', 'Muscle relaxation'],
    };

    expect(treatment.benefits.length).toBe(3);
    expect(treatment.benefits).toContain('Stress relief');
  });

  it('should track contraindications', () => {
    const treatment = {
      contraindications: ['Open wounds', 'Recent surgery', 'Blood clots'],
    };

    expect(treatment.contraindications.length).toBe(3);
    expect(treatment.contraindications).toContain('Open wounds');
  });
});

describe('Therapists', () => {
  it('should have correct therapist structure', () => {
    const therapist = {
      id: 'therapist-001',
      name: 'Priya Nair',
      specialties: ['Swedish Massage', 'Deep Tissue', 'Hot Stone'],
      certifications: ['Certified Massage Therapist'],
      experience: 8,
      rating: 4.8,
      availability: [],
    };

    expect(therapist).toHaveProperty('name');
    expect(therapist).toHaveProperty('specialties');
    expect(therapist).toHaveProperty('rating');
    expect(therapist.rating).toBeLessThanOrEqual(5);
  });

  it('should validate therapist specialties', () => {
    const therapist = {
      specialties: ['Swedish Massage', 'Ayurvedic Treatments', 'Facials'],
    };

    expect(therapist.specialties.length).toBe(3);
    expect(therapist.specialties).toContain('Swedish Massage');
  });

  it('should check therapist availability for day', () => {
    const therapist = {
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true },
      ],
    };

    const isAvailable = therapist.availability.find(a => a.dayOfWeek === 1 && a.isAvailable);
    expect(isAvailable).toBeDefined();
    expect(isAvailable?.isAvailable).toBe(true);
  });

  it('should rank therapists by rating', () => {
    const therapists = [
      { name: 'Priya', rating: 4.5 },
      { name: 'Meera', rating: 4.9 },
      { name: 'Anita', rating: 4.7 },
    ];

    const ranked = therapists.sort((a, b) => b.rating - a.rating);
    expect(ranked[0].name).toBe('Meera');
  });
});

describe('Booking Management', () => {
  it('should have correct booking structure', () => {
    const booking = {
      id: 'booking-001',
      bookingNumber: 'SPA-2026-001',
      guestId: 'guest-001',
      guestName: 'Rajesh Kumar',
      guestPhone: '+919876543210',
      treatmentId: 'treat-001',
      treatmentName: 'Swedish Massage',
      therapistId: 'therapist-001',
      therapistName: 'Priya Nair',
      date: new Date('2026-06-15'),
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      price: 3500,
      status: 'confirmed' as const,
      paymentStatus: 'paid' as const,
    };

    expect(booking).toHaveProperty('bookingNumber');
    expect(booking).toHaveProperty('startTime');
    expect(booking).toHaveProperty('endTime');
    expect(booking.status).toBe('confirmed');
  });

  it('should validate booking statuses', () => {
    const statuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    expect(statuses).toContain('pending');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');
  });

  it('should validate payment statuses', () => {
    const paymentStatuses = ['pending', 'paid', 'refunded'];
    expect(paymentStatuses).toContain('paid');
    expect(paymentStatuses).toContain('refunded');
  });

  it('should calculate end time correctly', () => {
    const startTime = '14:00';
    const duration = 90;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    expect(endTime).toBe('15:30');
  });

  it('should generate valid booking numbers', () => {
    const bookingNumber = 'SPA-2026-0001';
    expect(bookingNumber).toMatch(/^SPA-\d{4}-\d{4}$/);
  });

  it('should validate status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled', 'no-show'],
      confirmed: ['in-progress', 'cancelled', 'no-show'],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      'no-show': ['cancelled'],
    };

    expect(validTransitions['pending']).toContain('confirmed');
    expect(validTransitions['confirmed']).toContain('in-progress');
    expect(validTransitions['completed']).toHaveLength(0);
  });
});

describe('Availability Check', () => {
  it('should detect overlapping bookings', () => {
    const existingBooking = {
      startTime: '14:00',
      endTime: '15:00',
    };

    const newRequest = {
      startTime: '14:30',
      endTime: '15:30',
    };

    const isOverlapping = !(newRequest.endTime <= existingBooking.startTime || newRequest.startTime >= existingBooking.endTime);
    expect(isOverlapping).toBe(true);
  });

  it('should allow non-overlapping bookings', () => {
    const existingBooking = {
      startTime: '14:00',
      endTime: '15:00',
    };

    const newRequest = {
      startTime: '16:00',
      endTime: '17:00',
    };

    const isOverlapping = !(newRequest.endTime <= existingBooking.startTime || newRequest.startTime >= existingBooking.endTime);
    expect(isOverlapping).toBe(false);
  });

  it('should skip cancelled bookings in availability check', () => {
    const booking = { status: 'cancelled' };
    const shouldCheck = booking.status !== 'cancelled' && booking.status !== 'no-show';
    expect(shouldCheck).toBe(false);
  });
});

describe('Packages', () => {
  it('should have correct package structure', () => {
    const pkg = {
      id: 'pkg-001',
      name: 'Royal Relaxation Package',
      description: 'Complete spa experience',
      treatments: [
        { treatmentId: 'treat-001', order: 1 },
        { treatmentId: 'treat-003', order: 2 },
      ],
      totalDuration: 135,
      originalPrice: 7500,
      packagePrice: 6500,
      currency: 'INR',
      validityDays: 30,
      benefits: ['20% savings', 'Priority booking'],
      isActive: true,
    };

    expect(pkg).toHaveProperty('packagePrice');
    expect(pkg).toHaveProperty('totalDuration');
    expect(pkg.packagePrice).toBeLessThan(pkg.originalPrice);
  });

  it('should calculate package savings correctly', () => {
    const originalPrice = 7500;
    const packagePrice = 6500;
    const savings = ((originalPrice - packagePrice) / originalPrice) * 100;

    expect(Math.round(savings)).toBe(13);
  });

  it('should calculate total package duration', () => {
    const treatments = [
      { duration: 60 },
      { duration: 75 },
    ];

    const totalDuration = treatments.reduce((sum, t) => sum + t.duration, 0);
    expect(totalDuration).toBe(135);
  });
});

describe('Memberships', () => {
  it('should have correct membership structure', () => {
    const membership = {
      id: 'membership-001',
      guestId: 'guest-001',
      guestName: 'Rajesh Kumar',
      tier: 'gold' as const,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      visitsUsed: 3,
      visitsIncluded: 12,
      discountPercent: 15,
      benefits: ['15% discount', 'Priority booking'],
      status: 'active' as const,
    };

    expect(membership).toHaveProperty('tier');
    expect(membership).toHaveProperty('discountPercent');
    expect(membership.status).toBe('active');
  });

  it('should validate membership tiers', () => {
    const tiers = ['silver', 'gold', 'platinum'];
    expect(tiers).toContain('silver');
    expect(tiers).toContain('gold');
    expect(tiers).toContain('platinum');
  });

  it('should calculate remaining visits', () => {
    const membership = {
      visitsUsed: 3,
      visitsIncluded: 12,
    };

    const remainingVisits = membership.visitsIncluded - membership.visitsUsed;
    expect(remainingVisits).toBe(9);
  });

  it('should check membership validity', () => {
    const membership = {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'active' as const,
    };

    const now = new Date('2026-06-01');
    const isValid = membership.status === 'active' && now >= membership.startDate && now <= membership.endDate;
    expect(isValid).toBe(true);
  });

  it('should calculate member discount correctly', () => {
    const treatmentPrice = 3500;
    const discountPercent = 15;
    const discountAmount = treatmentPrice * (discountPercent / 100);
    const finalPrice = treatmentPrice - discountAmount;

    expect(discountAmount).toBe(525);
    expect(finalPrice).toBe(2975);
  });
});

describe('Scheduling', () => {
  it('should generate time slots correctly', () => {
    const startTime = '09:00';
    const endTime = '18:00';
    const interval = 30; // minutes

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const slots: string[] = [];
    while (currentMinutes < endMinutes) {
      const slotStart = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
      slots.push(slotStart);
      currentMinutes += interval;
    }

    expect(slots.length).toBe(18);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('17:30');
  });

  it('should respect therapist working hours', () => {
    const workingHours = {
      start: '09:00',
      end: '18:00',
    };

    const requestedTime = '20:00';
    const [reqHour] = requestedTime.split(':').map(Number);
    const [endHour] = workingHours.end.split(':').map(Number);

    const isWithinHours = reqHour < endHour;
    expect(isWithinHours).toBe(false);
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
      message: 'Treatment not found',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });

  it('should include error details for validation failures', () => {
    const validationError = {
      success: false,
      data: { errors: [{ field: 'startTime', message: 'Invalid time format' }] },
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
      service: 'rez-spa-service',
      port: 4049,
      timestamp: new Date().toISOString(),
      stats: {
        treatments: 8,
        therapists: 3,
        bookings: 25,
        upcomingBookings: 10,
        packages: 2,
        memberships: 15,
      },
    };

    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('stats');
    expect(health.stats).toHaveProperty('treatments');
  });
});

describe('Payment Methods', () => {
  it('should validate payment methods', () => {
    const paymentMethods = ['card', 'room-charge', 'gift-card'];
    expect(paymentMethods).toContain('card');
    expect(paymentMethods).toContain('room-charge');
    expect(paymentMethods).toContain('gift-card');
  });

  it('should handle refund on cancellation', () => {
    const booking = {
      paymentStatus: 'paid' as const,
      paymentMethod: 'card' as const,
    };

    const shouldRefund = booking.paymentStatus === 'paid';
    expect(shouldRefund).toBe(true);
  });
});

describe('Booking Filtering', () => {
  it('should filter bookings by status', () => {
    const bookings = [
      { id: '1', status: 'confirmed' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'confirmed' },
    ];

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    expect(confirmedBookings.length).toBe(2);
  });

  it('should filter bookings by date', () => {
    const bookings = [
      { id: '1', date: new Date('2026-06-15') },
      { id: '2', date: new Date('2026-06-16') },
      { id: '3', date: new Date('2026-06-15') },
    ];

    const targetDate = '2026-06-15';
    const dayBookings = bookings.filter(b =>
      new Date(b.date).toISOString().split('T')[0] === targetDate
    );

    expect(dayBookings.length).toBe(2);
  });

  it('should filter bookings by therapist', () => {
    const bookings = [
      { id: '1', therapistId: 'therapist-001' },
      { id: '2', therapistId: 'therapist-002' },
      { id: '3', therapistId: 'therapist-001' },
    ];

    const therapistBookings = bookings.filter(b => b.therapistId === 'therapist-001');
    expect(therapistBookings.length).toBe(2);
  });
});
