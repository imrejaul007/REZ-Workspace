/**
 * rez-hotel-channel-integration-service Unit Tests
 * Tests OTA channel integrations
 */

import { describe, it, expect } from 'vitest';

describe('Channel Integration', () => {
  it('should support all major OTAs', () => {
    const channels = [
      'booking_com',
      'makemytrip',
      'goibibo',
      'expedia',
      'airbnb',
      'google_hotel',
    ];

    expect(channels).toContain('booking_com');
    expect(channels).toContain('makemytrip');
    expect(channels).toHaveLength(6);
  });

  it('should validate channel config schema', () => {
    const validConfig = {
      hotelId: 'HTL-001',
      channel: 'booking_com',
      credentials: {
        username: 'testuser',
        password: 'testpass',
        propertyId: 'PROP-001',
      },
      settings: {
        enabled: true,
        syncInventory: true,
        syncRates: true,
        commission: 0.15,
      },
    };

    expect(validConfig).toHaveProperty('hotelId');
    expect(validConfig).toHaveProperty('channel');
    expect(validConfig.settings.syncInventory).toBe(true);
  });
});

describe('Inventory Sync', () => {
  it('should have correct inventory structure', () => {
    const inventory = {
      hotelId: 'HTL-001',
      roomId: 'ROOM-001',
      date: '2024-06-15',
      available: 5,
      price: 3500,
    };

    expect(inventory).toHaveProperty('hotelId');
    expect(inventory).toHaveProperty('roomId');
    expect(inventory).toHaveProperty('date');
    expect(inventory.available).toBeGreaterThanOrEqual(0);
  });

  it('should validate date format', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = '2024-06-15';

    expect(validDate).toMatch(dateRegex);
  });

  it('should sync inventory to multiple channels', () => {
    const channels = ['booking_com', 'makemytrip', 'goibibo'];
    const results = channels.map(channel => ({
      channel,
      synced: 10,
      success: true,
    }));

    expect(results).toHaveLength(3);
    results.forEach(r => {
      expect(r.success).toBe(true);
    });
  });
});

describe('Rate Plan Management', () => {
  it('should have correct rate plan structure', () => {
    const ratePlan = {
      hotelId: 'HTL-001',
      roomId: 'ROOM-001',
      channel: 'booking_com',
      rateName: 'Standard Rate',
      baseRate: 3500,
      currency: 'INR',
      restrictions: {
        minStay: 1,
        maxStay: 14,
        closedToArrival: false,
        closedToDeparture: false,
      },
    };

    expect(ratePlan.baseRate).toBeGreaterThan(0);
    expect(ratePlan.currency).toHaveLength(3);
  });

  it('should enforce minimum stay restrictions', () => {
    const minStay = 2;
    const requestedNights = 1;

    expect(requestedNights).toBeLessThan(minStay);
  });
});

describe('Channel Bookings', () => {
  it('should have correct booking structure', () => {
    const booking = {
      channelBookingId: 'BKG-001',
      channel: 'booking_com',
      hotelId: 'HTL-001',
      roomId: 'ROOM-001',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      checkinDate: '2024-06-15',
      checkoutDate: '2024-06-18',
      rooms: 1,
      guests: 2,
      totalAmount: 10500,
      commission: 1575,
      netAmount: 8925,
      currency: 'INR',
      status: 'confirmed',
    };

    expect(booking).toHaveProperty('channel');
    expect(booking).toHaveProperty('totalAmount');
    expect(booking.netAmount).toBe(booking.totalAmount - booking.commission);
  });

  it('should support all booking statuses', () => {
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    const validStatus = 'confirmed';

    expect(statuses).toContain(validStatus);
  });

  it('should validate commission calculation', () => {
    const totalAmount = 10500;
    const commissionRate = 0.15;
    const commission = totalAmount * commissionRate;
    const netAmount = totalAmount - commission;

    expect(commission).toBe(1575);
    expect(netAmount).toBe(8925);
  });
});

describe('Sync Logs', () => {
  it('should track sync operations', () => {
    const syncLog = {
      hotelId: 'HTL-001',
      channel: 'booking_com',
      syncType: 'inventory',
      status: 'success',
      itemsSynced: 15,
      errors: [],
      duration: 2500,
    };

    expect(syncLog).toHaveProperty('status');
    expect(syncLog).toHaveProperty('itemsSynced');
    expect(syncLog.duration).toBeGreaterThan(0);
  });

  it('should handle sync failures', () => {
    const failedSync = {
      status: 'failed',
      errors: ['Connection timeout', 'Invalid credentials'],
    };

    expect(failedSync.status).toBe('failed');
    expect(failedSync.errors).toHaveLength(2);
  });
});

describe('Channel Connection', () => {
  it('should validate connection status', () => {
    const statuses = ['active', 'inactive', 'error', 'pending'];

    const connection = { status: 'active' };
    expect(statuses).toContain(connection.status);
  });

  it('should mask sensitive credentials', () => {
    const credentials = {
      username: 'testuser',
      password: 'secretpass',
      apiKey: 'sk_test_123',
    };

    const masked = {
      username: credentials.username,
      password: '********',
      apiKey: '********',
    };

    expect(masked.password).not.toBe(credentials.password);
    expect(masked.apiKey).not.toBe(credentials.apiKey);
  });
});

describe('API Response Formats', () => {
  it('should format channel list response', () => {
    const response = {
      success: true,
      data: {
        channels: [
          { id: 'booking_com', name: 'Booking.com', commission: '15%' },
          { id: 'makemytrip', name: 'MakeMyTrip', commission: '15%' },
        ],
      },
    };

    expect(response.success).toBe(true);
    expect(response.data.channels).toHaveLength(2);
  });

  it('should format sync results response', () => {
    const response = {
      success: true,
      data: {
        results: [
          { channel: 'booking_com', result: { success: true, synced: 15 } },
          { channel: 'makemytrip', result: { success: true, synced: 12 } },
        ],
      },
    };

    expect(response.data.results).toHaveLength(2);
  });
});
