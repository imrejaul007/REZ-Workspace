import { describe, it, expect, beforeEach } from 'vitest';
import { AvailabilityService } from './services/availability.service';

describe('Booking Engine - Availability Service', () => {
  let service: AvailabilityService;

  beforeEach(() => {
    service = new AvailabilityService();
  });

  describe('checkAvailability', () => {
    it('should check availability for a hotel', async () => {
      const result = await service.checkAvailability(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        'std',
        2,
        1
      );

      expect(result.available).toBe(true);
      expect(result.nights).toBe(3);
      expect(result.pricing.currency).toBe('INR');
    });

    it('should return available false when no rooms match', async () => {
      const result = await service.checkAvailability(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        'nonexistent',
        2,
        1
      );

      expect(result.available).toBe(false);
      expect(result.availableRooms).toBe(0);
    });

    it('should filter by guest capacity', async () => {
      const result = await service.checkAvailability(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        undefined,
        5,
        1
      );

      // Only suites have capacity 4, no rooms for 5 guests
      expect(result.availableRooms).toBe(0);
    });

    it('should calculate correct number of nights', async () => {
      const result = await service.checkAvailability(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-20'),
        'std',
        2,
        1
      );

      expect(result.nights).toBe(5);
    });

    it('should return available rooms in result', async () => {
      const result = await service.checkAvailability(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        'std',
        2,
        2
      );

      expect(result.rooms.length).toBe(2);
      expect(result.rooms[0].roomNumber).toBeDefined();
    });
  });

  describe('searchRooms', () => {
    it('should return available rooms for hotel', async () => {
      const rooms = await service.searchRooms(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        2
      );

      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms[0].roomId).toBeDefined();
      expect(rooms[0].pricing).toBeDefined();
    });

    it('should filter by guest count', async () => {
      const rooms = await service.searchRooms(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        3
      );

      // Deluxe (capacity 3) and Suite (capacity 4) should appear
      expect(rooms.length).toBe(3);
    });

    it('should sort by price ascending', async () => {
      const rooms = await service.searchRooms(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        2
      );

      for (let i = 1; i < rooms.length; i++) {
        expect(rooms[i].pricing.finalPrice).toBeGreaterThanOrEqual(rooms[i - 1].pricing.finalPrice);
      }
    });

    it('should include price per night', async () => {
      const rooms = await service.searchRooms(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        2
      );

      expect(rooms[0].pricing.pricePerNight).toBeDefined();
    });

    it('should return rooms with amenities', async () => {
      const rooms = await service.searchRooms(
        'h1',
        new Date('2026-06-15'),
        new Date('2026-06-18'),
        2
      );

      expect(rooms[0].amenities).toBeDefined();
      expect(Array.isArray(rooms[0].amenities)).toBe(true);
    });
  });
});
