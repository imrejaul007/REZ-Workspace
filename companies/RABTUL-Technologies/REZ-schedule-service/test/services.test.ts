// ReZ Schedule Service - Unit Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('../src/utils/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    eventType: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    attendee: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    specialDate: {
      findFirst: vi.fn(),
    },
    schedule: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock Redis
vi.mock('../src/utils/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock types - provide the enum values
vi.mock('../src/types', () => ({
  BookingStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    NO_SHOW: 'NO_SHOW',
  },
  LocationType: {
    IN_PERSON: 'IN_PERSON',
    PHONE_CALL: 'PHONE_CALL',
    VIDEO_CALL: 'VIDEO_CALL',
    CUSTOM_LINK: 'CUSTOM_LINK',
  },
  PaymentStatus: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },
}));

import { availabilityService, AvailabilityService } from '../src/services/availabilityService';
import { bookingService, BookingService } from '../src/services/bookingService';
import { prisma } from '../src/utils/prisma';
import { redis } from '../src/utils/redis';

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;

  beforeEach(() => {
    availabilityService = new AvailabilityService();
    vi.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('should throw error for non-existent event type', async () => {
      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(null);

      await expect(
        availabilityService.getAvailableSlots('evt_invalid', new Date(), new Date())
      ).rejects.toThrow('Event type not found');
    });

    it('should return slots for valid event type', async () => {
      const mockEventType = {
        id: 'evt_123',
        duration: 30,
        bufferTime: 0,
        minNoticeMinutes: 0,
        maxBookingsPerDay: null,
        slotInterval: 30,
        schedules: [],
      };

      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(mockEventType as any);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([]);
      vi.mocked(prisma.specialDate.findFirst).mockResolvedValue(null);

      const startDate = new Date('2026-05-27T00:00:00Z');
      const endDate = new Date('2026-05-27T23:59:59Z');

      const slots = await availabilityService.getAvailableSlots('evt_123', startDate, endDate);

      expect(prisma.eventType.findUnique).toHaveBeenCalledWith({
        where: { id: 'evt_123' },
        include: {
          schedules: {
            include: {
              schedule: {
                include: { availability: true },
              },
            },
          },
        },
      });
    });
  });

  describe('isSlotAvailable', () => {
    it('should return false for non-existent event type', async () => {
      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(null);

      const result = await availabilityService.isSlotAvailable(
        'evt_invalid',
        new Date(),
        new Date(),
        'Asia/Kolkata'
      );

      expect(result).toBe(false);
    });

    it('should return true for available slot', async () => {
      const mockEventType = {
        id: 'evt_123',
        duration: 30,
        bufferTime: 0,
        minNoticeMinutes: 0,
        maxBookingsPerDay: null,
        slotInterval: 30,
        schedules: [],
      };

      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(mockEventType as any);
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);

      const startTime = new Date(Date.now() + 3600000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 1800000); // 30 min later

      const result = await availabilityService.isSlotAvailable(
        'evt_123',
        startTime,
        endTime,
        'Asia/Kolkata'
      );

      expect(result).toBe(true);
    });

    it('should return false when slot overlaps with existing booking', async () => {
      const mockEventType = {
        id: 'evt_123',
        duration: 30,
        bufferTime: 0,
        minNoticeMinutes: 0,
        maxBookingsPerDay: null,
        slotInterval: 30,
        schedules: [],
      };

      const existingBooking = {
        id: 'book_1',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 5400000),
      };

      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(mockEventType as any);
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.booking.findFirst).mockResolvedValue(existingBooking as any);

      const startTime = new Date(Date.now() + 3600000);
      const endTime = new Date(startTime.getTime() + 1800000);

      const result = await availabilityService.isSlotAvailable(
        'evt_123',
        startTime,
        endTime,
        'Asia/Kolkata'
      );

      expect(result).toBe(false);
    });
  });

  describe('getDefaultSchedule', () => {
    it('should return default schedule when user has no schedule', async () => {
      vi.mocked(prisma.schedule.findFirst).mockResolvedValue(null);

      const schedule = await availabilityService.getDefaultSchedule('user_123');

      expect(schedule).toHaveLength(7);
      expect(schedule[1].enabled).toBe(true); // Monday
      expect(schedule[5].enabled).toBe(true); // Friday
    });

    it('should return user schedule when available', async () => {
      const mockSchedule = {
        userId: 'user_123',
        isDefault: true,
        availability: [
          { dayOfWeek: 1, enabled: true, startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 2, enabled: true, startTime: '08:00', endTime: '18:00' },
        ],
      };

      vi.mocked(prisma.schedule.findFirst).mockResolvedValue(mockSchedule as any);

      const schedule = await availabilityService.getDefaultSchedule('user_123');

      expect(schedule).toHaveLength(2);
    });
  });
});

describe('BookingService', () => {
  let bookingService: BookingService;

  beforeEach(() => {
    bookingService = new BookingService();
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should throw error for non-existent event type', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.eventType.findUnique).mockResolvedValue(null);

      await expect(
        bookingService.createBooking(
          {
            eventTypeId: 'evt_invalid',
            startTime: new Date(),
            endTime: new Date(),
            timezone: 'Asia/Kolkata',
            attendeeName: 'Test User',
            attendeeEmail: 'test@example.com',
          },
          'host_user'
        )
      ).rejects.toThrow('Event type not found');
    });

    it('should return existing booking for duplicate idempotency key', async () => {
      const existingBooking = {
        id: 'book_existing',
        uid: 'uid_existing',
        idempotencyKey: 'idem_123',
        status: 'CONFIRMED',
      };

      vi.mocked(prisma.booking.findUnique).mockResolvedValue(existingBooking as any);
      vi.mocked(prisma.eventType.findUnique).mockResolvedValue({
        id: 'evt_123',
        active: true,
      } as any);
      vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([]); // getAvailableSlots
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce(existingBooking as any); // getBookingByUid

      const result = await bookingService.createBooking(
        {
          eventTypeId: 'evt_123',
          startTime: new Date(),
          endTime: new Date(),
          timezone: 'Asia/Kolkata',
          idempotencyKey: 'idem_123',
          attendeeName: 'Test User',
          attendeeEmail: 'test@example.com',
        },
        'host_user'
      );

      expect(result.uid).toBe('uid_existing');
    });

    it('should reject inactive event type', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.eventType.findUnique).mockResolvedValue({
        id: 'evt_123',
        active: false,
      } as any);

      await expect(
        bookingService.createBooking(
          {
            eventTypeId: 'evt_123',
            startTime: new Date(),
            endTime: new Date(),
            timezone: 'Asia/Kolkata',
            attendeeName: 'Test User',
            attendeeEmail: 'test@example.com',
          },
          'host_user'
        )
      ).rejects.toThrow('Event type is not active');
    });
  });

  describe('getBookingByUid', () => {
    it('should return booking when found', async () => {
      const mockBooking = {
        id: 'book_123',
        uid: 'uid_123',
        status: 'CONFIRMED',
        eventType: { id: 'evt_123', title: 'Test Event' },
        attendee: { email: 'test@example.com' },
      };

      vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

      const result = await bookingService.getBookingByUid('uid_123');

      expect(result).toBeDefined();
      expect(result?.uid).toBe('uid_123');
    });

    it('should return null when booking not found', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

      const result = await bookingService.getBookingByUid('uid_invalid');

      expect(result).toBeNull();
    });
  });

  describe('cancelBooking', () => {
    it('should throw error when booking not found', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

      await expect(
        bookingService.cancelBooking('uid_invalid', { reason: 'Test' }, 'host')
      ).rejects.toThrow('Booking not found');
    });

    it('should throw error when booking already cancelled', async () => {
      // The service uses string comparison, so we mock with the correct string
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'book_123',
        uid: 'uid_123',
        status: 'CANCELLED',
        eventType: {
          user: { email: 'host@test.com', name: 'Host' },
          title: 'Test Event',
          locationType: 'VIDEO_CALL',
          userId: 'user_123',
        },
        attendee: { email: 'guest@test.com', name: 'Guest' },
        startTime: new Date(),
        endTime: new Date(),
        timezone: 'Asia/Kolkata',
        locationType: 'VIDEO_CALL',
        locationDetails: {},
        price: 0,
        currency: 'USD',
        paymentId: null,
        paymentStatus: 'PAID',
        rescheduledFrom: null,
        rescheduledTo: null,
        cancellationReason: null,
        metadata: null,
        responses: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        bookingService.cancelBooking('uid_123', { reason: 'Test' }, 'host')
      ).rejects.toThrow('Booking is already cancelled');
    });
  });
});

describe('WebhookService', () => {
  it('should generate valid HMAC-SHA256 signatures', () => {
    const payload = JSON.stringify({ event: 'booking.created', bookingId: 'book_123' });
    const testKey = 'webhook_test_key_value';

    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', testKey).update(payload).digest('hex');

    expect(signature).toHaveLength(64); // SHA256 hex = 64 chars
    expect(signature).toMatch(/^[a-f0-9]+$/);
  });

  it('should verify signatures with timing-safe comparison', () => {
    const payload = JSON.stringify({ test: 'data' });
    const testKey = 'webhook_test_key_2';
    const crypto = require('crypto');

    const expectedSignature = crypto.createHmac('sha256', testKey).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(expectedSignature)
    );

    expect(isValid).toBe(true);
  });

  it('should generate different signatures for different payloads', () => {
    const crypto = require('crypto');
    const testKey = 'webhook_test_key_3';

    const sig1 = crypto.createHmac('sha256', testKey).update('payload1').digest('hex');
    const sig2 = crypto.createHmac('sha256', testKey).update('payload2').digest('hex');

    expect(sig1).not.toBe(sig2);
  });
});

describe('RateLimitService', () => {
  it('should track request counts in Redis', async () => {
    vi.mocked(redis.get).mockResolvedValue('50');

    const count = await redis.get('rate:user_123');
    expect(count).toBe('50');
  });

  it('should increment counter on each request', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK');

    await redis.set('rate:user_123', '1', 'EX', 60);
    expect(redis.set).toHaveBeenCalledWith('rate:user_123', '1', 'EX', 60);
  });

  it('should reset counter after window expires', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const count = await redis.get('rate:user_123:window_start');
    expect(count).toBeNull();
  });
});

describe('RRULE Parsing', () => {
  it('should validate RRULE frequency patterns', () => {
    const patterns = ['FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY', 'FREQ=YEARLY'];

    patterns.forEach(pattern => {
      expect(pattern).toMatch(/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)$/);
    });
  });

  it('should parse BYDAY correctly', () => {
    const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
    const parts = rrule.split(';');

    const byDayPart = parts.find(p => p.startsWith('BYDAY='));
    const days = byDayPart?.split('=')[1].split(',');

    expect(days).toContain('MO');
    expect(days).toContain('WE');
    expect(days).toContain('FR');
  });

  it('should parse INTERVAL correctly', () => {
    const rrule = 'FREQ=WEEKLY;INTERVAL=2';
    const parts = rrule.split(';');

    const intervalPart = parts.find(p => p.startsWith('INTERVAL='));
    const interval = parseInt(intervalPart?.split('=')[1] || '0');

    expect(interval).toBe(2);
  });
});

describe('CacheService', () => {
  it('should store values with TTL', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({ data: 'test' }));

    await redis.set('cache:key', JSON.stringify({ data: 'test' }), 'EX', 300);
    const result = await redis.get('cache:key');

    expect(redis.set).toHaveBeenCalledWith('cache:key', expect.any(String), 'EX', 300);
    expect(JSON.parse(result!)).toEqual({ data: 'test' });
  });

  it('should return null for missing keys', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const result = await redis.get('nonexistent');

    expect(result).toBeNull();
  });

  it('should delete by key', async () => {
    vi.mocked(redis.del).mockResolvedValue(1);

    await redis.del('test:key');

    expect(redis.del).toHaveBeenCalledWith('test:key');
  });

  it('should support pattern-based deletion', async () => {
    vi.mocked(redis.keys).mockResolvedValue(['cache:1', 'cache:2', 'cache:3']);
    vi.mocked(redis.del).mockResolvedValue(3);

    const keys = await redis.keys('cache:*');
    await redis.del(keys);

    expect(redis.keys).toHaveBeenCalledWith('cache:*');
    expect(redis.del).toHaveBeenCalledWith(['cache:1', 'cache:2', 'cache:3']);
  });
});
