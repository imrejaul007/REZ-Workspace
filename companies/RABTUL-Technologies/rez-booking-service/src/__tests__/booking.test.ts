/**
 * Booking Service Tests
 * Tests for reservation management, availability, and scheduling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guests?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerHour: number;
  availability: AvailabilitySlot[];
}

interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

interface TimeSlot {
  start: Date;
  end: Date;
}

// Booking validation
function validateBooking(booking: Partial<Booking>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!booking.resourceId) {
    errors.push('resourceId is required');
  }

  if (!booking.userId) {
    errors.push('userId is required');
  }

  if (!booking.startTime) {
    errors.push('startTime is required');
  }

  if (!booking.endTime) {
    errors.push('endTime is required');
  }

  if (booking.startTime && booking.endTime) {
    if (booking.startTime >= booking.endTime) {
      errors.push('endTime must be after startTime');
    }

    const duration = booking.endTime.getTime() - booking.startTime.getTime();
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (duration > maxDuration) {
      errors.push('booking duration cannot exceed 24 hours');
    }
  }

  if (booking.guests !== undefined && booking.guests < 1) {
    errors.push('guests must be at least 1');
  }

  return { valid: errors.length === 0, errors };
}

// Status transitions
const VALID_TRANSITIONS: Record<Booking['status'], Booking['status'][]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [],
  completed: []
};

function canTransition(from: Booking['status'], to: Booking['status']): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Conflict detection
function hasConflict(existing: Booking[], newBooking: Partial<Booking>): Booking | null {
  for (const booking of existing) {
    if (booking.resourceId !== newBooking.resourceId) continue;
    if (booking.status === 'cancelled') continue;

    if (
      newBooking.startTime! < booking.endTime &&
      newBooking.endTime! > booking.startTime
    ) {
      return booking;
    }
  }
  return null;
}

// Availability check
function isWithinAvailability(
  startTime: Date,
  endTime: Date,
  availability: AvailabilitySlot[]
): boolean {
  const dayOfWeek = startTime.getDay();
  const slot = availability.find(s => s.dayOfWeek === dayOfWeek);

  if (!slot) return false;

  const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
  const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

  return startTimeStr >= slot.startTime && endTimeStr <= slot.endTime;
}

// Duration calculation
function getDuration(booking: Booking): number {
  return booking.endTime.getTime() - booking.startTime.getTime();
}

function getDurationHours(booking: Booking): number {
  return getDuration(booking) / (1000 * 60 * 60);
}

// Price calculation
function calculatePrice(booking: Booking, resource: Resource): number {
  const hours = getDurationHours(booking);
  return hours * resource.pricePerHour;
}

describe('Booking Validation', () => {
  it('should validate complete booking', () => {
    const booking = {
      resourceId: 'res-1',
      userId: 'user-1',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T12:00:00'),
      guests: 2
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing resourceId', () => {
    const booking = {
      userId: 'user-1',
      startTime: new Date(),
      endTime: new Date()
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('resourceId is required');
  });

  it('should reject missing userId', () => {
    const booking = {
      resourceId: 'res-1',
      startTime: new Date(),
      endTime: new Date()
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('userId is required');
  });

  it('should reject end time before start time', () => {
    const booking = {
      resourceId: 'res-1',
      userId: 'user-1',
      startTime: new Date('2024-01-15T14:00:00'),
      endTime: new Date('2024-01-15T12:00:00')
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('endTime must be after startTime');
  });

  it('should reject booking exceeding 24 hours', () => {
    const booking = {
      resourceId: 'res-1',
      userId: 'user-1',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-16T12:00:00') // 26 hours later
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('booking duration cannot exceed 24 hours');
  });

  it('should reject zero guests', () => {
    const booking = {
      resourceId: 'res-1',
      userId: 'user-1',
      startTime: new Date(),
      endTime: new Date(),
      guests: 0
    };

    const result = validateBooking(booking);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('guests must be at least 1');
  });
});

describe('Status Transitions', () => {
  it('should allow pending to confirmed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });

  it('should allow pending to cancelled', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  it('should allow confirmed to completed', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true);
  });

  it('should allow confirmed to cancelled', () => {
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('should not allow pending to completed', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
  });

  it('should not allow transitions from cancelled', () => {
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('should not allow transitions from completed', () => {
    expect(canTransition('completed', 'pending')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
  });
});

describe('Conflict Detection', () => {
  const existingBookings: Booking[] = [
    createMockBooking({ id: '1', startTime: new Date('2024-01-15T10:00:00'), endTime: new Date('2024-01-15T12:00:00') }),
    createMockBooking({ id: '2', startTime: new Date('2024-01-15T14:00:00'), endTime: new Date('2024-01-15T16:00:00') }),
  ];

  it('should detect overlapping booking', () => {
    const newBooking = {
      resourceId: 'res-1',
      startTime: new Date('2024-01-15T11:00:00'),
      endTime: new Date('2024-01-15T13:00:00')
    };

    const conflict = hasConflict(existingBookings, newBooking);
    expect(conflict).not.toBeNull();
    expect(conflict?.id).toBe('1');
  });

  it('should allow non-overlapping booking', () => {
    const newBooking = {
      resourceId: 'res-1',
      startTime: new Date('2024-01-15T12:00:00'),
      endTime: new Date('2024-01-15T14:00:00')
    };

    const conflict = hasConflict(existingBookings, newBooking);
    expect(conflict).toBeNull();
  });

  it('should ignore cancelled bookings', () => {
    const bookingsWithCancelled: Booking[] = [
      createMockBooking({ id: '1', status: 'cancelled' }),
      createMockBooking({ id: '2', startTime: new Date('2024-01-15T10:00:00'), endTime: new Date('2024-01-15T12:00:00') }),
    ];

    const newBooking = {
      resourceId: 'res-1',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T12:00:00')
    };

    const conflict = hasConflict(bookingsWithCancelled, newBooking);
    expect(conflict).toBeNull();
  });

  it('should check resourceId', () => {
    const newBooking = {
      resourceId: 'res-2', // Different resource
      startTime: new Date('2024-01-15T11:00:00'),
      endTime: new Date('2024-01-15T13:00:00')
    };

    const conflict = hasConflict(existingBookings, newBooking);
    expect(conflict).toBeNull();
  });
});

describe('Availability Check', () => {
  const availability: AvailabilitySlot[] = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' }, // Friday
  ];

  it('should allow booking within hours', () => {
    const startTime = new Date('2024-01-15T10:00:00'); // Monday
    const endTime = new Date('2024-01-15T12:00:00');

    expect(isWithinAvailability(startTime, endTime, availability)).toBe(true);
  });

  it('should reject booking outside hours', () => {
    const startTime = new Date('2024-01-15T07:00:00'); // Monday 7 AM
    const endTime = new Date('2024-01-15T09:00:00');

    expect(isWithinAvailability(startTime, endTime, availability)).toBe(false);
  });

  it('should reject booking on unavailable day', () => {
    const startTime = new Date('2024-01-14T10:00:00'); // Sunday
    const endTime = new Date('2024-01-14T12:00:00');

    expect(isWithinAvailability(startTime, endTime, availability)).toBe(false);
  });

  it('should handle weekend-only resources', () => {
    const weekendOnly: AvailabilitySlot[] = [
      { dayOfWeek: 0, startTime: '10:00', endTime: '20:00' }, // Sunday
      { dayOfWeek: 6, startTime: '10:00', endTime: '20:00' }, // Saturday
    ];

    const startTime = new Date('2024-01-13T12:00:00'); // Saturday
    const endTime = new Date('2024-01-13T14:00:00');

    expect(isWithinAvailability(startTime, endTime, weekendOnly)).toBe(true);
  });
});

describe('Duration Calculation', () => {
  it('should calculate duration in milliseconds', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T14:00:00')
    });

    expect(getDuration(booking)).toBe(4 * 60 * 60 * 1000); // 4 hours
  });

  it('should calculate duration in hours', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T14:30:00')
    });

    expect(getDurationHours(booking)).toBe(4.5);
  });

  it('should handle 30-minute slots', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T10:30:00')
    });

    expect(getDurationHours(booking)).toBe(0.5);
  });
});

describe('Price Calculation', () => {
  const resource: Resource = {
    id: 'res-1',
    name: 'Conference Room A',
    type: 'meeting_room',
    capacity: 10,
    pricePerHour: 500, // ₹500/hour
    availability: []
  };

  it('should calculate price for 1 hour', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T11:00:00')
    });

    expect(calculatePrice(booking, resource)).toBe(500);
  });

  it('should calculate price for 2 hours', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T12:00:00')
    });

    expect(calculatePrice(booking, resource)).toBe(1000);
  });

  it('should calculate price for partial hours', () => {
    const booking = createMockBooking({
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T11:30:00')
    });

    expect(calculatePrice(booking, resource)).toBe(750);
  });
});

// Helper
function createMockBooking(overrides: Partial<Booking>): Booking {
  return {
    id: overrides.id || 'booking-1',
    resourceId: overrides.resourceId || 'res-1',
    userId: overrides.userId || 'user-1',
    startTime: overrides.startTime || new Date(),
    endTime: overrides.endTime || new Date(),
    status: overrides.status || 'pending',
    guests: overrides.guests,
    notes: overrides.notes,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
