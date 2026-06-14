import { describe, it, expect, beforeEach } from 'vitest';
import { OTASyncService } from './ota-sync.service';

describe('OTASyncService', () => {
  let service: OTASyncService;

  beforeEach(() => {
    service = new OTASyncService();
  });

  describe('initializeChannels', () => {
    it('should initialize with 5 OTA channels', () => {
      const channels = service.getAllChannels();
      expect(channels.length).toBe(5);
    });

    it('should have booking_com channel', () => {
      const channel = service.getChannel('booking_com');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('booking_com');
    });

    it('should have mMT channel', () => {
      const channel = service.getChannel('mMT');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('mMT');
    });
  });

  describe('connectChannel', () => {
    it('should throw error for invalid credentials', async () => {
      await expect(
        service.connectChannel('hotel-1', 'booking_com', {})
      ).rejects.toThrow('Invalid channel credentials');
    });

    it('should connect with valid credentials', async () => {
      const channel = await service.connectChannel('hotel-1', 'booking_com', {
        hotel_id: '12345',
        api_key: 'key123',
      });

      expect(channel.status).toBe('connected');
      expect(channel.credentials.hotel_id).toBe('12345');
    });
  });

  describe('disconnectChannel', () => {
    it('should disconnect a connected channel', async () => {
      await service.connectChannel('hotel-1', 'booking_com', {
        hotel_id: '12345',
        api_key: 'key123',
      });

      await service.disconnectChannel('booking_com');
      const channel = service.getChannel('booking_com');

      expect(channel?.status).toBe('disconnected');
    });
  });

  describe('pushInventory', () => {
    it('should push inventory to connected channels', async () => {
      await service.connectChannel('hotel-1', 'booking_com', {
        hotel_id: '12345',
        api_key: 'key123',
      });

      const updates = [
        {
          roomTypeId: 'standard',
          date: new Date(),
          available: 10,
          price: 3000,
          restrictions: {},
        },
      ];

      const results = await service.pushInventory('hotel-1', updates);
      expect(results['booking_com']).toBeDefined();
    });

    it('should skip disconnected channels', async () => {
      const updates = [
        {
          roomTypeId: 'standard',
          date: new Date(),
          available: 10,
          price: 3000,
          restrictions: {},
        },
      ];

      const results = await service.pushInventory('hotel-1', updates);
      // Disconnected channels should not be in results
      expect(results['booking_com']).toBeUndefined();
    });
  });

  describe('pullReservations', () => {
    it('should throw error for disconnected channel', async () => {
      await expect(service.pullReservations('hotel-1', 'booking_com')).rejects.toThrow('Channel not connected');
    });

    it('should pull reservations from connected channel', async () => {
      await service.connectChannel('hotel-1', 'booking_com', {
        hotel_id: '12345',
        api_key: 'key123',
      });

      const reservations = await service.pullReservations('hotel-1', 'booking_com');
      expect(Array.isArray(reservations)).toBe(true);
    });
  });

  describe('syncAllChannels', () => {
    it('should sync all connected channels', async () => {
      await service.connectChannel('hotel-1', 'booking_com', {
        hotel_id: '12345',
        api_key: 'key123',
      });

      const results = await service.syncAllChannels('hotel-1', []);
      expect(results.channels['booking_com']).toBeDefined();
      expect(results.syncDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getChannelStats', () => {
    it('should return stats for all channels', () => {
      const stats = service.getChannelStats();
      expect(stats['booking_com']).toBeDefined();
      expect(stats['booking_com'].totalBookings).toBeDefined();
      expect(stats['booking_com'].successRate).toBeDefined();
    });
  });
});
