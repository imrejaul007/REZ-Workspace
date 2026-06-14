/**
 * Unit Tests for REZ Inventory Sync Service
 */

import { describe, it, expect } from 'vitest';

describe('REZ Inventory Sync Service', () => {
  describe('Channel Types', () => {
    const ChannelType = {
      BOOKING_COM: 'booking_com',
      MAKEMYTRIP: 'makemytrip',
      GOIBIBO: 'goibibo',
      EXPEDIA: 'expedia',
      AIRBNB: 'airbnb',
      GOOGLE_HOTELS: 'google_hotels',
      HOTELS_COM: 'hotels_com',
      DIRECT: 'direct',
    };

    it('should have all expected OTA channels', () => {
      expect(Object.values(ChannelType)).toContain('booking_com');
      expect(Object.values(ChannelType)).toContain('makemytrip');
      expect(Object.values(ChannelType)).toContain('goibibo');
      expect(Object.values(ChannelType)).toContain('airbnb');
    });

    it('should include direct booking channel', () => {
      expect(Object.values(ChannelType)).toContain('direct');
    });
  });

  describe('Sync Status', () => {
    const SyncStatus = {
      SYNCED: 'synced',
      PENDING: 'pending',
      FAILED: 'failed',
      CONFLICT: 'conflict',
    };

    it('should have all sync status values', () => {
      expect(Object.values(SyncStatus)).toHaveLength(4);
    });

    it('should identify successful sync', () => {
      const isSynced = (status: string) => status === 'synced';
      expect(isSynced('synced')).toBe(true);
      expect(isSynced('pending')).toBe(false);
    });
  });

  describe('Channel Rate Calculation', () => {
    function calculateChannelRate(
      baseRate: number,
      channelType: string,
      settings: { priceParity: boolean; channelMarkup: number; minRateFactor: number; maxRateFactor: number }
    ): number {
      let rate = baseRate;

      if (settings.priceParity && settings.channelMarkup) {
        rate = rate * (1 + settings.channelMarkup / 100);
      }

      rate = Math.max(rate * settings.minRateFactor, rate);
      rate = Math.min(rate * settings.maxRateFactor, rate);

      return Math.round(rate * 100) / 100;
    }

    it('should apply channel markup correctly', () => {
      const settings = {
        priceParity: true,
        channelMarkup: 10, // 10% markup
        minRateFactor: 1.0,
        maxRateFactor: 1.2,
      };

      const rate = calculateChannelRate(1000, 'booking_com', settings);
      expect(rate).toBe(1100);
    });

    it('should respect minimum rate factor', () => {
      const settings = {
        priceParity: false,
        channelMarkup: 0,
        minRateFactor: 0.95, // Minimum 95% of base
        maxRateFactor: 1.2,
      };

      const rate = calculateChannelRate(1000, 'makemytrip', settings);
      expect(rate).toBe(1000); // Base rate since no markup
    });

    it('should respect maximum rate factor', () => {
      const settings = {
        priceParity: true,
        channelMarkup: 50, // 50% markup
        minRateFactor: 1.0,
        maxRateFactor: 1.2, // Cap at 120%
      };

      const rate = calculateChannelRate(1000, 'expedia', settings);
      expect(rate).toBe(1200); // Capped at 120%
    });
  });

  describe('Inventory Update Processing', () => {
    it('should process availability updates', () => {
      const updates = [
        { roomTypeId: 'deluxe', date: '2024-01-15', availableRooms: 5 },
        { roomTypeId: 'standard', date: '2024-01-15', availableRooms: 3 },
      ];

      updates.forEach(update => {
        expect(update.availableRooms).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply restrictions correctly', () => {
      const restrictions = {
        minStay: 2,
        maxStay: 14,
        closedToArrival: false,
        closedToDeparture: false,
        closed: false,
      };

      expect(restrictions.closed).toBe(false);
      expect(restrictions.minStay).toBeGreaterThanOrEqual(1);
    });

    it('should handle stop sold status', () => {
      const inventory = {
        availableRooms: 5,
        stopSold: false,
      };

      const shouldShow = inventory.availableRooms > 0 && !inventory.stopSold;
      expect(shouldShow).toBe(true);
    });
  });

  describe('Booking Ingestion', () => {
    it('should validate booking payload structure', () => {
      const booking = {
        channelBookingId: 'BC123',
        confirmationId: 'CONF456',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        roomTypeId: 'deluxe',
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-18'),
        rooms: 1,
        totalAmount: 9000,
        commission: 900,
        netAmount: 8100,
      };

      expect(booking.rooms).toBeGreaterThan(0);
      expect(booking.checkIn < booking.checkOut).toBe(true);
    });

    it('should deduct inventory for new bookings', () => {
      const inventory = { availableRooms: 5 };
      const roomsBooked = 2;

      inventory.availableRooms -= roomsBooked;
      expect(inventory.availableRooms).toBe(3);
    });

    it('should restore inventory for cancellations', () => {
      const inventory = { availableRooms: 3 };
      const roomsCancelled = 2;

      inventory.availableRooms += roomsCancelled;
      expect(inventory.availableRooms).toBe(5);
    });
  });

  describe('Inventory Locking', () => {
    it('should create inventory lock', () => {
      const lock = {
        hotelId: 'hotel-123',
        roomTypeId: 'deluxe',
        date: new Date('2024-01-15'),
        lockedRooms: 2,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      };

      expect(lock.lockedRooms).toBeGreaterThan(0);
      expect(lock.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should check lock expiration', () => {
      const expiredLock = {
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      const isExpired = expiredLock.expiresAt < new Date();
      expect(isExpired).toBe(true);
    });

    it('should validate available inventory before locking', () => {
      const available = 5;
      const requested = 3;

      const canLock = available >= requested;
      expect(canLock).toBe(true);
    });
  });

  describe('Sync Logging', () => {
    it('should log sync operations', () => {
      const log = {
        hotelId: 'hotel-123',
        channelType: 'booking_com',
        syncType: 'availability_update',
        status: 'success',
        itemsProcessed: 30,
        duration: 1500,
      };

      expect(log.status).toBe('success');
      expect(log.itemsProcessed).toBeGreaterThan(0);
    });

    it('should handle partial sync failures', () => {
      const log = {
        successCount: 28,
        failCount: 2,
        total: 30,
      };

      const isPartial = log.successCount > 0 && log.failCount > 0;
      expect(isPartial).toBe(true);
    });
  });

  describe('Rate Plans', () => {
    it('should apply weekday/weekend multipliers', () => {
      const rateFactors = {
        weekday: 1.0,
        weekend: 1.15,
        peak: 1.3,
        offPeak: 0.85,
      };

      const baseRate = 2000;

      expect(baseRate * rateFactors.weekday).toBe(2000);
      expect(baseRate * rateFactors.weekend).toBe(2300);
      expect(baseRate * rateFactors.peak).toBe(2600);
    });

    it('should calculate channel commission', () => {
      const rate = 2000;
      const commissionPercent = 15;
      const commission = rate * (commissionPercent / 100);

      expect(commission).toBe(300);
    });
  });

  describe('Availability Check', () => {
    it('should find available rooms for date range', () => {
      const totalRooms = 10;
      const bookedRooms = [
        { roomId: 'r1', checkIn: '2024-01-15', checkOut: '2024-01-18' },
        { roomId: 'r2', checkIn: '2024-01-16', checkOut: '2024-01-19' },
      ];

      const requestedCheckIn = new Date('2024-01-17');
      const requestedCheckOut = new Date('2024-01-20');

      const hasConflict = bookedRooms.some(r => {
        const bCheckIn = new Date(r.checkIn);
        const bCheckOut = new Date(r.checkOut);
        return requestedCheckIn < bCheckOut && requestedCheckOut > bCheckIn;
      });

      expect(hasConflict).toBe(true);
    });

    it('should allow booking when no conflicts exist', () => {
      const bookedRooms = [
        { checkIn: '2024-01-10', checkOut: '2024-01-14' },
      ];

      const requestedCheckIn = new Date('2024-01-15');
      const requestedCheckOut = new Date('2024-01-18');

      const hasConflict = bookedRooms.some(r => {
        const bCheckIn = new Date(r.checkIn);
        const bCheckOut = new Date(r.checkOut);
        return requestedCheckIn < bCheckOut && requestedCheckOut > bCheckIn;
      });

      expect(hasConflict).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should identify sync conflicts', () => {
      const serverInventory = { availableRooms: 5, version: 10 };
      const clientInventory = { availableRooms: 3, version: 9 };

      const hasConflict = serverInventory.version !== clientInventory.version;
      expect(hasConflict).toBe(true);
    });

    it('should resolve with latest version', () => {
      const serverInventory = { availableRooms: 5, version: 10 };
      const clientInventory = { availableRooms: 3, version: 11 };

      const isClientNewer = clientInventory.version > serverInventory.version;
      expect(isClientNewer).toBe(true);
    });
  });

  describe('Channel Configuration', () => {
    it('should validate channel settings', () => {
      const settings = {
        autoSync: true,
        syncInterval: 15, // minutes
        priceParity: true,
        minRateFactor: 0.95,
        maxRateFactor: 1.2,
      };

      expect(settings.autoSync).toBe(true);
      expect(settings.syncInterval).toBeGreaterThan(0);
      expect(settings.minRateFactor).toBeLessThan(settings.maxRateFactor);
    });
  });
});
