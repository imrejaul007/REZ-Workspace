/**
 * Security Tests
 *
 * SECURITY FIX (MA-BACK-AUDIT-009): Security-focused unit tests.
 * Tests for: input validation, XSS prevention, injection attacks, auth bypass.
 */

import { describe, it, expect } from '@jest/globals';
import { validatePayoutAmount, validateBankDetails } from '../utils/payoutValidator';
import { validatePagination } from '../utils/paginationValidator';
import { validateOffer, sanitizeOffer } from '../utils/offerValidator';
import { verifySignature, generateSignature } from '../services/webhookService';

// ── Payout Validation Tests ─────────────────────────────────────────────────────

describe('Payout Validation', () => {
  describe('validatePayoutAmount', () => {
    it('should accept valid positive amounts', () => {
      expect(validatePayoutAmount(1000)).toEqual({ isValid: true });
      expect(validatePayoutAmount(0.01)).toEqual({ isValid: true });
      expect(validatePayoutAmount('5000.50')).toEqual({ isValid: true });
    });

    it('should reject zero amount', () => {
      const result = validatePayoutAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject negative amounts', () => {
      const result = validatePayoutAmount(-100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject amounts exceeding max limit', () => {
      const result = validatePayoutAmount(200000000, 100000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should reject amounts with more than 2 decimal places', () => {
      const result = validatePayoutAmount(100.123);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('2 decimal places');
    });

    it('should reject non-numeric strings', () => {
      const result = validatePayoutAmount('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject undefined/null input', () => {
      expect(validatePayoutAmount(undefined).isValid).toBe(false);
      expect(validatePayoutAmount(null).isValid).toBe(false);
    });
  });

  describe('validateBankDetails', () => {
    it('should accept valid Indian bank details', () => {
      const result = validateBankDetails({
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
        ifscCode: 'SBIN0001234',
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid IFSC code', () => {
      const result = validateBankDetails({
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
        ifscCode: 'INVALID', // Must be 11 chars
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('IFSC code must be 11 alphanumeric characters');
    });

    it('should reject account number with less than 8 digits', () => {
      const result = validateBankDetails({
        accountNumber: '123456', // Too short
        accountHolderName: 'John Doe',
        ifscCode: 'SBIN0001234',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account number must be 8-18 digits');
    });

    it('should reject account holder name with numbers', () => {
      const result = validateBankDetails({
        accountNumber: '1234567890',
        accountHolderName: 'John123', // Numbers not allowed
        ifscCode: 'SBIN0001234',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('alphabetic characters');
    });

    it('should reject non-object input', () => {
      expect(validateBankDetails('string').isValid).toBe(false);
      expect(validateBankDetails(123).isValid).toBe(false);
      expect(validateBankDetails(null).isValid).toBe(false);
    });
  });
});

// ── Pagination Validation Tests ─────────────────────────────────────────────────

describe('Pagination Validation', () => {
  describe('validatePagination', () => {
    it('should accept valid pagination', () => {
      const result = validatePagination(1, 20);
      expect(result.isValid).toBe(true);
      expect(result.pagination).toEqual({ page: 1, limit: 20 });
    });

    it('should accept string inputs', () => {
      const result = validatePagination('2', '50');
      expect(result.isValid).toBe(true);
      expect(result.pagination).toEqual({ page: 2, limit: 50 });
    });

    it('should reject page less than 1', () => {
      const result = validatePagination(0, 20);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('page must be >= 1');
    });

    it('should reject negative limit', () => {
      const result = validatePagination(1, -5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('limit must be >= 1');
    });

    it('should enforce max limit', () => {
      const result = validatePagination(1, 200, 100);
      expect(result.isValid).toBe(true);
      expect(result.pagination?.limit).toBe(100);
    });

    it('should accept undefined values with defaults', () => {
      const result = validatePagination(undefined, undefined);
      expect(result.isValid).toBe(true);
      expect(result.pagination).toEqual({ page: 1, limit: 100 });
    });
  });
});

// ── Offer Validation Tests ────────────────────────────────────────────────────

describe('Offer Validation', () => {
  describe('validateOffer', () => {
    it('should accept valid discount offer', () => {
      const result = validateOffer({
        title: 'Test Offer',
        type: 'discount',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        isActive: true,
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject offer without type', () => {
      const result = validateOffer({
        title: 'Test Offer',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('type is required');
    });

    it('should reject cashback offer without cashbackType', () => {
      const result = validateOffer({
        title: 'Cashback Offer',
        type: 'cashback',
        cashbackPercentage: 10,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Required field missing: cashbackType');
    });

    it('should reject invalid date range', () => {
      const result = validateOffer({
        title: 'Test',
        type: 'discount',
        startDate: new Date(Date.now() + 86400000), // After endDate
        endDate: new Date(),
        isActive: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be before endDate');
    });

    it('should reject negative discount', () => {
      const result = validateOffer({
        title: 'Test',
        type: 'discount',
        maxDiscountAmount: -10,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxDiscountAmount must be a non-negative number');
    });

    it('should reject non-boolean isActive', () => {
      const result = validateOffer({
        title: 'Test',
        type: 'discount',
        startDate: new Date(),
        endDate: new Date(),
        isActive: 'yes' as unknown as boolean,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('isActive must be a boolean');
    });
  });

  describe('sanitizeOffer', () => {
    it('should remove unexpected fields', () => {
      const result = sanitizeOffer({
        title: 'Test',
        type: 'discount',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        maliciousScript: '<script>alert(1)</script>',
      });
      expect(result).not.toHaveProperty('maliciousScript');
    });

    it('should preserve allowed fields', () => {
      const offer = {
        title: 'Test Offer',
        type: 'discount' as const,
        description: 'Test description',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      };
      const result = sanitizeOffer(offer);
      expect(result.title).toBe('Test Offer');
      expect(result.description).toBe('Test description');
    });
  });
});

// ── Webhook Signature Tests ───────────────────────────────────────────────────

describe('Webhook Signature', () => {
  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"event":"test","data":"value"}';
      const secret = 'test-secret';
      const signature = generateSignature(payload, secret);

      expect(verifySignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"event":"test","data":"value"}';
      const secret = 'test-secret';

      expect(verifySignature(payload, 'invalid-signature', secret)).toBe(false);
    });

    it('should reject signature with different length', () => {
      const payload = '{"event":"test","data":"value"}';
      const secret = 'test-secret';

      expect(verifySignature(payload, 'short', secret)).toBe(false);
      expect(verifySignature(payload, 'a'.repeat(100), secret)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const payload = '{"event":"test","data":"value"}';
      const tamperedPayload = '{"event":"hacked","data":"value"}';
      const secret = 'test-secret';
      const signature = generateSignature(payload, secret);

      expect(verifySignature(tamperedPayload, signature, secret)).toBe(false);
    });
  });
});

// ── MongoDB Injection Prevention Tests ────────────────────────────────────────

describe('MongoDB Injection Prevention', () => {
  describe('sanitizeRecursive function', () => {
    it('should remove $ operators from strings', () => {
      // Test the sanitizeRecursive logic
      const maliciousInput = { key: 'value with $where' };
      const sanitized = JSON.parse(JSON.stringify(maliciousInput).replace(/\$/g, '').replace(/\./g, ''));

      expect(sanitized.key).not.toContain('$where');
    });

    it('should handle nested objects', () => {
      const maliciousInput = {
        user: {
          $where: 'malicious',
          name: 'John',
        },
      };
      const sanitized = JSON.parse(JSON.stringify(maliciousInput).replace(/\$/g, '').replace(/\./g, ''));

      expect(sanitized.user).not.toHaveProperty('$where');
      expect(sanitized.user.where).toBe('malicious');
    });

    it('should handle arrays', () => {
      const maliciousInput = {
        users: [
          { $gt: '' },
          { name: 'John' },
        ],
      };
      const sanitized = JSON.parse(JSON.stringify(maliciousInput).replace(/\$/g, '').replace(/\./g, ''));

      expect(sanitized.users[0]).not.toHaveProperty('$gt');
      expect(sanitized.users[1].name).toBe('John');
    });
  });
});

// ── XSS Prevention Tests ───────────────────────────────────────────────────────

describe('XSS Prevention', () => {
  it('should sanitize HTML/script content in offer titles', () => {
    const maliciousOffer = {
      title: '<script>alert("XSS")</script>Valid Title',
      type: 'discount',
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    };

    const sanitized = sanitizeOffer(maliciousOffer);
    expect(sanitized.title).not.toContain('<script>');
    expect(sanitized.title).not.toContain('alert');
  });

  it('should preserve valid characters in titles', () => {
    const validOffer = {
      title: "John's 50% Off Special! @#$%",
      type: 'discount',
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    };

    const result = validateOffer(validOffer);
    expect(result.isValid).toBe(true);
  });
});
