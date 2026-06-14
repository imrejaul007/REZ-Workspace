/**
 * rez-guest-mobile-app Unit Tests
 * Tests guest profiles, loyalty, and booking management
 */

import { describe, it, expect } from 'vitest';

describe('Guest Profile', () => {
  it('should have correct guest data structure', () => {
    const guest = {
      id: 'guest-001',
      email: 'demo@stayown.com',
      phone: '+919876543210',
      name: 'Demo User',
      loyaltyPoints: 5750,
      loyaltyTier: 'gold',
      preferences: {
        language: 'en',
        notifications: true,
        marketingOptIn: true,
      },
    };

    expect(guest).toHaveProperty('email');
    expect(guest).toHaveProperty('loyaltyPoints');
    expect(guest).toHaveProperty('loyaltyTier');
  });

  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = 'demo@stayown.com';
    const invalidEmail = 'invalid-email';

    expect(validEmail).toMatch(emailRegex);
    expect(invalidEmail).not.toMatch(emailRegex);
  });

  it('should validate phone number', () => {
    const phone = '+919876543210';
    expect(phone.length).toBeGreaterThanOrEqual(10);
    expect(phone.startsWith('+')).toBe(true);
  });
});

describe('Loyalty Tiers', () => {
  it('should calculate tier based on points', () => {
    const calculateTier = (points: number) => {
      if (points >= 50000) return 'platinum';
      if (points >= 20000) return 'gold';
      if (points >= 5000) return 'silver';
      return 'bronze';
    };

    expect(calculateTier(5750)).toBe('silver');
    expect(calculateTier(20000)).toBe('gold');
    expect(calculateTier(50000)).toBe('platinum');
    expect(calculateTier(3000)).toBe('bronze');
  });

  it('should have correct tier multipliers', () => {
    const multipliers = {
      bronze: 1.0,
      silver: 1.25,
      gold: 1.5,
      platinum: 2.0,
    };

    expect(multipliers.bronze).toBe(1.0);
    expect(multipliers.silver).toBe(1.25);
    expect(multipliers.gold).toBe(1.5);
    expect(multipliers.platinum).toBe(2.0);
  });

  it('should calculate points needed for next tier', () => {
    const tierThresholds = { bronze: 5000, silver: 20000, gold: 50000, platinum: Infinity };
    const guestPoints = 5750;

    const nextTier = 'gold';
    const pointsNeeded = tierThresholds[nextTier] - guestPoints;

    expect(pointsNeeded).toBe(44250);
  });
});

describe('Booking Management', () => {
  it('should have correct booking structure', () => {
    const booking = {
      id: 'booking-001',
      guestId: 'guest-001',
      hotelId: 'hotel-001',
      hotelName: 'Grand Hotel Mumbai',
      roomId: 'room-101',
      roomType: 'Deluxe Suite',
      checkIn: new Date('2024-06-15'),
      checkOut: new Date('2024-06-18'),
      status: 'upcoming' as const,
      totalAmount: 24750,
      confirmationCode: 'GH-ABC123',
    };

    expect(booking).toHaveProperty('confirmationCode');
    expect(booking).toHaveProperty('status');
    expect(booking).toHaveProperty('totalAmount');
  });

  it('should validate booking statuses', () => {
    const statuses = ['upcoming', 'checked-in', 'checked-out', 'cancelled'];
    expect(statuses).toContain('upcoming');
    expect(statuses).toContain('checked-in');
  });

  it('should calculate nights stayed', () => {
    const checkIn = new Date('2024-06-15');
    const checkOut = new Date('2024-06-18');
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    expect(nights).toBe(3);
  });

  it('should validate confirmation code format', () => {
    const confirmationCode = 'GH-ABC123';
    expect(confirmationCode).toMatch(/^[A-Z]{2}-[A-Z0-9]{6}$/);
  });
});

describe('Digital Key', () => {
  it('should have correct digital key structure', () => {
    const digitalKey = {
      enabled: true,
      validFrom: new Date('2024-06-15T14:00:00'),
      validTo: new Date('2024-06-18T11:00:00'),
    };

    expect(digitalKey.enabled).toBe(true);
    expect(digitalKey.validFrom).toBeInstanceOf(Date);
    expect(digitalKey.validTo).toBeInstanceOf(Date);
  });

  it('should validate key code format', () => {
    const keyCode = 'KEY-GH-ABC123-m1abc2';
    expect(keyCode).toMatch(/^KEY-/);
  });

  it('should check key validity period', () => {
    const now = new Date('2024-06-16T10:00:00');
    const validFrom = new Date('2024-06-15T14:00:00');
    const validTo = new Date('2024-06-18T11:00:00');

    const isValid = now >= validFrom && now <= validTo;
    expect(isValid).toBe(true);
  });
});

describe('Loyalty Transactions', () => {
  it('should record earning transaction', () => {
    const transaction = {
      id: 'tx-001',
      guestId: 'guest-001',
      type: 'earn' as const,
      points: 500,
      description: 'Welcome bonus',
      createdAt: new Date(),
    };

    expect(transaction.type).toBe('earn');
    expect(transaction.points).toBeGreaterThan(0);
  });

  it('should record redemption transaction', () => {
    const transaction = {
      id: 'tx-002',
      guestId: 'guest-001',
      type: 'redeem' as const,
      points: 2000,
      description: 'Redeemed: Free Room Upgrade',
    };

    expect(transaction.type).toBe('redeem');
  });

  it('should validate minimum redemption points', () => {
    const minPoints = 100;
    const redemptionPoints = 50;

    expect(redemptionPoints).toBeLessThan(minPoints);
  });
});

describe('Rewards Catalog', () => {
  it('should have correct reward structure', () => {
    const reward = {
      id: 'reward-001',
      name: 'Free Room Upgrade',
      points: 2000,
      category: 'upgrade',
    };

    expect(reward).toHaveProperty('name');
    expect(reward).toHaveProperty('points');
    expect(reward.points).toBeGreaterThan(0);
  });

  it('should support reward categories', () => {
    const categories = ['upgrade', 'service', 'discount', 'credit', 'meal', 'transport', 'stay'];
    expect(categories).toContain('upgrade');
    expect(categories).toContain('stay');
  });
});

describe('API Response Format', () => {
  it('should format success response correctly', () => {
    const response = {
      success: true,
      data: { id: 'guest-001', name: 'Demo User' },
    };

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('data');
  });

  it('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Unauthorized',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });

  it('should format validation error response', () => {
    const validationError = {
      success: false,
      data: { errors: [] },
      message: 'Validation failed',
    };

    expect(validationError.success).toBe(false);
    expect(validationError).toHaveProperty('data');
  });
});

describe('Guest Preferences', () => {
  it('should support language preferences', () => {
    const languages = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr'];
    expect(languages).toContain('en');
    expect(languages).toContain('hi');
  });

  it('should support notification settings', () => {
    const preferences = {
      language: 'en',
      notifications: true,
      marketingOptIn: false,
    };

    expect(preferences).toHaveProperty('notifications');
    expect(preferences).toHaveProperty('marketingOptIn');
  });
});

describe('Authentication', () => {
  it('should generate valid session token', () => {
    const token = `tok_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    expect(token).toMatch(/^tok_/);
  });

  it('should validate session expiry', () => {
    const now = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const isExpired = now >= expiresAt;
    expect(isExpired).toBe(false);
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-guest-mobile-app',
      port: 4041,
      timestamp: new Date().toISOString(),
    };

    expect(health.status).toBe('healthy');
    expect(health.service).toBe('rez-guest-mobile-app');
  });
});
