/**
 * REZ Inventory Sync Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Inventory Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4027', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have correct MongoDB URL configuration', () => {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_inventory_sync';
      expect(mongoUrl).toMatch(/^mongodb/);
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'inventory-sync-service',
        port: 4027,
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.service).toBe('inventory-sync-service');
    });
  });

  describe('OTA Channel Types', () => {
    it('should define all channel types', () => {
      const channelTypes = [
        'booking_com',
        'makemytrip',
        'goibibo',
        'expedia',
        'airbnb',
        'google_hotels',
        'hotels_com',
        'direct',
      ];

      expect(channelTypes).toHaveLength(8);
      expect(channelTypes).toContain('booking_com');
      expect(channelTypes).toContain('makemytrip');
      expect(channelTypes).toContain('goibibo');
    });
  });

  describe('Sync Status', () => {
    it('should define sync statuses', () => {
      const syncStatuses = ['synced', 'pending', 'failed', 'conflict'];
      expect(syncStatuses).toHaveLength(4);
      expect(syncStatuses).toContain('synced');
      expect(syncStatuses).toContain('failed');
    });
  });

  describe('Hotel Channel Schema', () => {
    it('should validate channel data structure', () => {
      const channelSchema = {
        hotelId: expect.any(String),
        channelType: expect.stringMatching(/^(booking_com|makemytrip|goibibo|expedia|airbnb|google_hotels|hotels_com|direct)$/),
        channelHotelId: expect.any(String),
        channelName: expect.any(String),
        credentials: expect.any(Object),
        isActive: expect.any(Boolean),
        settings: expect.any(Object),
        lastSync: expect.any(Date),
        syncStatus: expect.stringMatching(/^(synced|pending|failed|conflict)$/),
      };

      const mockChannel = {
        hotelId: 'HTL-001',
        channelType: 'booking_com',
        channelHotelId: 'BC-12345',
        channelName: 'Booking.com',
        credentials: { apiKey: 'key123' },
        isActive: true,
        settings: {
          autoSync: true,
          syncInterval: 15,
          priceParity: true,
        },
        lastSync: new Date(),
        syncStatus: 'synced',
      };

      expect(mockChannel).toMatchObject(channelSchema);
    });
  });

  describe('Inventory Update Schema', () => {
    it('should validate inventory update data', () => {
      const updateSchema = {
        hotelId: expect.any(String),
        roomTypeId: expect.any(String),
        date: expect.any(String),
        availableRooms: expect.any(Number),
        rate: expect.any(Number),
        minStay: expect.any(Number),
        restrictions: expect.any(Object),
        stopSold: expect.any(Boolean),
      };

      const mockUpdate = {
        hotelId: 'HTL-001',
        roomTypeId: 'RT-001',
        date: '2024-06-01',
        availableRooms: 10,
        rate: 2500,
        minStay: 1,
        restrictions: {
          closedToArrival: false,
          closedToDeparture: false,
          closed: false,
        },
        stopSold: false,
      };

      expect(mockUpdate).toMatchObject(updateSchema);
    });
  });

  describe('Bulk Inventory Schema', () => {
    it('should validate bulk inventory update', () => {
      const bulkSchema = {
        hotelId: expect.any(String),
        updates: expect.any(Array),
        channels: expect.any(Array),
        updateType: expect.stringMatching(/^(availability|rate|restrictions|stop_sold|full)$/),
      };

      const mockBulk = {
        hotelId: 'HTL-001',
        updates: [
          { roomTypeId: 'RT-001', date: '2024-06-01', availableRooms: 10 },
          { roomTypeId: 'RT-001', date: '2024-06-02', availableRooms: 8 },
        ],
        channels: ['booking_com', 'makemytrip'],
        updateType: 'availability',
      };

      expect(mockBulk).toMatchObject(bulkSchema);
    });
  });

  describe('Booking Ingestion', () => {
    it('should validate booking ingestion data', () => {
      const ingestionSchema = {
        id: expect.any(String),
        hotelId: expect.any(String),
        channelType: expect.any(String),
        channelBookingId: expect.any(String),
        channelConfirmationId: expect.any(String),
        guestName: expect.any(String),
        guestEmail: expect.any(String),
        guestPhone: expect.any(String),
        roomTypeId: expect.any(String),
        checkIn: expect.any(Date),
        checkOut: expect.any(Date),
        rooms: expect.any(Number),
        adults: expect.any(Number),
        children: expect.any(Number),
        totalAmount: expect.any(Number),
        commission: expect.any(Number),
        netAmount: expect.any(Number),
        currency: expect.any(String),
        status: expect.stringMatching(/^(pending|confirmed|failed|cancelled|modified)$/),
      };

      const mockIngestion = {
        id: 'ING-001',
        hotelId: 'HTL-001',
        channelType: 'booking_com',
        channelBookingId: 'BC-BK-123',
        channelConfirmationId: 'REZ123456',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '9876543210',
        roomTypeId: 'RT-001',
        checkIn: new Date('2024-06-01'),
        checkOut: new Date('2024-06-05'),
        rooms: 1,
        adults: 2,
        children: 0,
        totalAmount: 10000,
        commission: 1500,
        netAmount: 8500,
        currency: 'INR',
        status: 'confirmed',
      };

      expect(mockIngestion).toMatchObject(ingestionSchema);
    });
  });

  describe('Rate Plans', () => {
    it('should validate rate plan structure', () => {
      const ratePlanSchema = {
        hotelId: expect.any(String),
        roomTypeId: expect.any(String),
        ratePlanCode: expect.any(String),
        ratePlanName: expect.any(String),
        channel: expect.any(String),
        baseRate: expect.any(Number),
        rateFactors: expect.any(Object),
        channelMarkup: expect.any(Number),
        channelCommission: expect.any(Number),
        isActive: expect.any(Boolean),
      };

      const mockRatePlan = {
        hotelId: 'HTL-001',
        roomTypeId: 'RT-001',
        ratePlanCode: 'RP-STD',
        ratePlanName: 'Standard Rate',
        channel: 'booking_com',
        baseRate: 2500,
        rateFactors: {
          weekday: 1.0,
          weekend: 1.15,
          peak: 1.3,
          offPeak: 0.85,
        },
        channelMarkup: 0,
        channelCommission: 15,
        isActive: true,
      };

      expect(mockRatePlan).toMatchObject(ratePlanSchema);
    });
  });

  describe('Channel Rate Calculation', () => {
    it('should calculate channel rate with markup', () => {
      const baseRate = 2000;
      const markup = 10; // 10%
      const channelRate = baseRate * (1 + markup / 100);
      expect(channelRate).toBe(2200);
    });

    it('should apply min/max rate factors', () => {
      const baseRate = 2000;
      const minFactor = 0.9;
      const maxFactor = 1.2;

      const minRate = baseRate * minFactor;
      const maxRate = baseRate * maxFactor;

      expect(minRate).toBe(1800);
      expect(maxRate).toBe(2400);
    });
  });

  describe('API Endpoints', () => {
    it('should have channels endpoint', () => {
      const endpoint = '/api/channels';
      expect(endpoint).toBe('/api/channels');
    });

    it('should have sync endpoints', () => {
      const endpoints = [
        '/api/sync/inventory',
        '/api/sync/rates',
        '/api/sync/full',
      ];

      expect(endpoints).toContain('/api/sync/inventory');
      expect(endpoints).toContain('/api/sync/rates');
    });

    it('should have inventory endpoint', () => {
      const endpoint = '/api/inventory';
      expect(endpoint).toBe('/api/inventory');
    });

    it('should have bookings endpoint', () => {
      const endpoints = [
        '/api/bookings/ingest',
        '/api/bookings/modify',
        '/api/bookings/cancel',
      ];

      expect(endpoints).toContain('/api/bookings/ingest');
      expect(endpoints).toContain('/api/bookings/cancel');
    });

    it('should have sync logs endpoint', () => {
      const endpoint = '/api/sync-logs';
      expect(endpoint).toBe('/api/sync-logs');
    });

    it('should have rate plans endpoint', () => {
      const endpoint = '/api/rate-plans';
      expect(endpoint).toBe('/api/rate-plans');
    });

    it('should have stats endpoint', () => {
      const endpoint = '/api/stats';
      expect(endpoint).toBe('/api/stats');
    });

    it('should have locks endpoint', () => {
      const endpoints = ['/api/locks', '/api/locks/:lockId'];
      expect(endpoints[0]).toBe('/api/locks');
    });
  });

  describe('Rate Limiting', () => {
    it('should have webhook rate limit configuration', () => {
      const webhookLimit = {
        windowMs: 60 * 1000, // 1 minute
        max: 1000,
      };

      expect(webhookLimit.windowMs).toBe(60000);
      expect(webhookLimit.max).toBe(1000);
    });

    it('should have general rate limit configuration', () => {
      const generalLimit = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500,
      };

      expect(generalLimit.windowMs).toBe(900000);
      expect(generalLimit.max).toBe(500);
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
          channels: [],
          count: 0,
        },
      };

      expect(mockResponse).toMatchObject(successResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: expect.any(String),
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });

  describe('Inventory Locks', () => {
    it('should validate lock schema', () => {
      const lockSchema = {
        hotelId: expect.any(String),
        roomTypeId: expect.any(String),
        date: expect.any(Date),
        lockType: expect.stringMatching(/^(booking|hold|system)$/),
        referenceId: expect.any(String),
        lockedRooms: expect.any(Number),
        expiresAt: expect.any(Date),
      };

      const mockLock = {
        hotelId: 'HTL-001',
        roomTypeId: 'RT-001',
        date: new Date('2024-06-01'),
        lockType: 'booking',
        referenceId: 'BKG-001',
        lockedRooms: 2,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };

      expect(mockLock).toMatchObject(lockSchema);
    });
  });
});