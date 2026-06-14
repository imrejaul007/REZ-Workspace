/**
 * Validation schema tests
 */

import {
  createBookingSchema,
  getBookingSchema,
  getUserBookingsSchema,
  getAdBookingsSchema,
} from '../src/middleware/validation';

describe('Validation Schemas', () => {
  describe('createBookingSchema', () => {
    it('should validate correct booking data', () => {
      const validData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'restaurant',
        details: {
          date: '2024-12-25T19:00:00.000Z',
          time: '19:00',
          guests: 2,
          service: 'Dinner',
          notes: 'Window seat please',
        },
        paymentRequired: true,
        paymentAmount: 500,
      };

      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate booking without optional fields', () => {
      const validData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'salon',
        details: {},
      };

      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid booking type', () => {
      const invalidData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'invalid-type',
        details: {},
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        adId: 'ad-123',
        // missing advertiserId, userId, businessId
        type: 'restaurant',
        details: {},
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative payment amount', () => {
      const invalidData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'restaurant',
        details: {},
        paymentAmount: -100,
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject guests over 100', () => {
      const invalidData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'restaurant',
        details: {
          guests: 101,
        },
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject notes over 500 characters', () => {
      const invalidData = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'restaurant',
        details: {
          notes: 'a'.repeat(501),
        },
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate all booking types', () => {
      const types = ['restaurant', 'healthcare', 'salon', 'service', 'appointment'];

      types.forEach((type) => {
        const data = {
          adId: 'ad-123',
          advertiserId: 'adv-123',
          userId: 'user-123',
          businessId: 'biz-123',
          type,
          details: {},
        };

        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getBookingSchema', () => {
    it('should validate valid booking ID', () => {
      const result = getBookingSchema.safeParse({ id: 'bk-123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty booking ID', () => {
      const result = getBookingSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('getUserBookingsSchema', () => {
    it('should validate with default pagination', () => {
      const result = getUserBookingsSchema.safeParse({ userId: 'user-123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should validate custom pagination', () => {
      const result = getUserBookingsSchema.safeParse({
        userId: 'user-123',
        page: '2',
        limit: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject page less than 1', () => {
      const result = getUserBookingsSchema.safeParse({
        userId: 'user-123',
        page: '0',
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = getUserBookingsSchema.safeParse({
        userId: 'user-123',
        limit: '150',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getAdBookingsSchema', () => {
    it('should validate valid ad ID', () => {
      const result = getAdBookingsSchema.safeParse({
        adId: 'ad-123',
        page: '1',
        limit: '20',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty ad ID', () => {
      const result = getAdBookingsSchema.safeParse({ adId: '' });
      expect(result.success).toBe(false);
    });
  });
});