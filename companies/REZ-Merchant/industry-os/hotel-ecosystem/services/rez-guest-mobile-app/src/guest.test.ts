import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGuest,
  getGuestById,
  updateGuest,
  getLoyaltyStatus,
  addPoints,
  redeemPoints,
  addStay,
  getStayHistory,
  sendNotification,
  getNotifications,
  markNotificationRead,
  getAllGuests,
} from './services/guest.service.js';

describe('Guest Mobile App Service', () => {
  const testGuest = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    preferences: {
      roomType: 'deluxe',
      floor: 5,
      smoking: false,
    },
  };

  describe('createGuest', () => {
    it('should create a new guest profile', () => {
      const guest = createGuest(testGuest);
      expect(guest.id).toBeDefined();
      expect(guest.firstName).toBe('John');
      expect(guest.lastName).toBe('Doe');
      expect(guest.email).toBe('john.doe@example.com');
      expect(guest.createdAt).toBeDefined();
      expect(guest.updatedAt).toBeDefined();
    });

    it('should initialize loyalty status with bronze tier', () => {
      const guest = createGuest(testGuest);
      const loyalty = getLoyaltyStatus(guest.id);
      expect(loyalty).toBeDefined();
      expect(loyalty?.tier).toBe('bronze');
      expect(loyalty?.points).toBe(0);
    });
  });

  describe('getGuestById', () => {
    it('should return guest by id', () => {
      const guest = createGuest(testGuest);
      const found = getGuestById(guest.id);
      expect(found).toBeDefined();
      expect(found?.email).toBe('john.doe@example.com');
    });

    it('should return undefined for non-existent guest', () => {
      const found = getGuestById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('updateGuest', () => {
    it('should update guest information', () => {
      const guest = createGuest(testGuest);
      const updated = updateGuest(guest.id, { firstName: 'Jane' });
      expect(updated?.firstName).toBe('Jane');
      expect(updated?.lastName).toBe('Doe'); // unchanged
    });

    it('should return undefined for non-existent guest', () => {
      const updated = updateGuest('non-existent-id', { firstName: 'Jane' });
      expect(updated).toBeUndefined();
    });
  });

  describe('addPoints', () => {
    it('should add points to guest loyalty', () => {
      const guest = createGuest(testGuest);
      const loyalty = addPoints(guest.id, 5000);
      expect(loyalty?.points).toBe(5000);
      expect(loyalty?.lifetimePoints).toBe(5000);
    });

    it('should upgrade tier when threshold reached', () => {
      const guest = createGuest(testGuest);
      addPoints(guest.id, 10000);
      const loyalty = getLoyaltyStatus(guest.id);
      expect(loyalty?.tier).toBe('silver');
    });

    it('should calculate points to next tier', () => {
      const guest = createGuest(testGuest);
      addPoints(guest.id, 15000);
      const loyalty = getLoyaltyStatus(guest.id);
      expect(loyalty?.pointsToNextTier).toBe(10000); // 25000 - 15000
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points successfully', () => {
      const guest = createGuest(testGuest);
      addPoints(guest.id, 5000);
      const success = redeemPoints(guest.id, 2000);
      expect(success).toBe(true);
      const loyalty = getLoyaltyStatus(guest.id);
      expect(loyalty?.points).toBe(3000);
    });

    it('should fail when insufficient points', () => {
      const guest = createGuest(testGuest);
      addPoints(guest.id, 1000);
      const success = redeemPoints(guest.id, 5000);
      expect(success).toBe(false);
    });
  });

  describe('addStay', () => {
    it('should add stay and auto-calculate points', () => {
      const guest = createGuest(testGuest);
      const stay = addStay(guest.id, {
        hotelId: 'hotel-1',
        checkIn: '2026-06-15',
        checkOut: '2026-06-18',
        roomType: 'deluxe',
        totalSpent: 15000,
      });

      expect(stay.id).toBeDefined();
      expect(stay.pointsEarned).toBe(150); // 15000/100

      const loyalty = getLoyaltyStatus(guest.id);
      expect(loyalty?.lifetimePoints).toBe(150);
    });
  });

  describe('getStayHistory', () => {
    it('should return all stays for guest', () => {
      const guest = createGuest(testGuest);
      addStay(guest.id, {
        hotelId: 'hotel-1',
        checkIn: '2026-06-15',
        checkOut: '2026-06-18',
        roomType: 'deluxe',
        totalSpent: 15000,
      });
      addStay(guest.id, {
        hotelId: 'hotel-2',
        checkIn: '2026-07-01',
        checkOut: '2026-07-03',
        roomType: 'suite',
        totalSpent: 12000,
      });

      const history = getStayHistory(guest.id);
      expect(history).toHaveLength(2);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to guest', () => {
      const guest = createGuest(testGuest);
      const notification = sendNotification({
        guestId: guest.id,
        type: 'checkin',
        title: 'Welcome!',
        message: 'Check-in successful',
      });

      expect(notification.id).toBeDefined();
      expect(notification.read).toBe(false);

      const notifications = getNotifications(guest.id);
      expect(notifications).toHaveLength(1);
    });
  });

  describe('getNotifications', () => {
    it('should filter unread notifications', () => {
      const guest = createGuest(testGuest);
      sendNotification({
        guestId: guest.id,
        type: 'promotion',
        title: 'Special Offer',
        message: 'Get 20% off!',
      });
      sendNotification({
        guestId: guest.id,
        type: 'service',
        title: 'Room Service',
        message: 'Your order is ready',
      });

      const all = getNotifications(guest.id);
      expect(all).toHaveLength(2);

      const unread = getNotifications(guest.id, true);
      expect(unread).toHaveLength(2);

      markNotificationRead(guest.id, all[0].id);
      const stillUnread = getNotifications(guest.id, true);
      expect(stillUnread).toHaveLength(1);
    });
  });

  describe('getAllGuests', () => {
    it('should return all guests', () => {
      createGuest({ ...testGuest, email: 'guest1@example.com' });
      createGuest({ ...testGuest, email: 'guest2@example.com' });

      const guests = getAllGuests();
      expect(guests.length).toBeGreaterThanOrEqual(2);
    });
  });
});
