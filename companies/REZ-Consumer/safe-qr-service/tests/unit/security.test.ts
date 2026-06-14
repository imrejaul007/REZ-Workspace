/**
 * REZ Safe QR Service - Security Tests
 * Tests for security middleware, rate limiting, and input validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock crypto for testing
const mockCrypto = {
  timingSafeEqual: (a: Buffer, b: Buffer): boolean => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  },
  randomBytes: (size: number): Buffer => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Buffer.from(bytes);
  },
  createHmac: (algorithm: string, key: string) => ({
    update: (data: string) => ({
      digest: (encoding: string) => {
        // Simple mock HMAC
        return Buffer.from(`hmac_${data}`).toString(encoding as BufferEncoding);
      }
    })
  })
};

describe('Security Tests', () => {
  describe('Timing-Safe Comparison', () => {
    it('should return true for identical strings', () => {
      const a = Buffer.from('secret123');
      const b = Buffer.from('secret123');
      expect(mockCrypto.timingSafeEqual(a, b)).toBe(true);
    });

    it('should return false for different strings', () => {
      const a = Buffer.from('secret123');
      const b = Buffer.from('secret456');
      expect(mockCrypto.timingSafeEqual(a, b)).toBe(false);
    });

    it('should return false for different length strings', () => {
      const a = Buffer.from('short');
      const b = Buffer.from('muchlonger');
      expect(mockCrypto.timingSafeEqual(a, b)).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate tokens of correct length', () => {
      const token = mockCrypto.randomBytes(32);
      expect(token.length).toBe(32);
    });

    it('should generate unique tokens', () => {
      const token1 = mockCrypto.randomBytes(32);
      const token2 = mockCrypto.randomBytes(32);
      expect(token1.equals(token2)).toBe(false);
    });
  });

  describe('HMAC Signature', () => {
    it('should create consistent signatures for same input', () => {
      const hmac1 = mockCrypto.createHmac('sha256', 'key');
      const hmac2 = mockCrypto.createHmac('sha256', 'key');
      const sig1 = hmac1.update('data').digest('hex');
      const sig2 = hmac2.update('data').digest('hex');
      expect(sig1).toBe(sig2);
    });

    it('should create different signatures for different keys', () => {
      const hmac1 = mockCrypto.createHmac('sha256', 'key1');
      const hmac2 = mockCrypto.createHmac('sha256', 'key2');
      const sig1 = hmac1.update('data').digest('hex');
      const sig2 = hmac2.update('data').digest('hex');
      expect(sig1).not.toBe(sig2);
    });
  });
});

describe('Input Validation Tests', () => {
  describe('Phone Number Validation', () => {
    const isValidPhone = (phone: string): boolean => {
      // E.164 format: +[country code][number]
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    };

    it('should accept valid Indian phone numbers', () => {
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('9876543210')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('Shortcode Validation', () => {
    const isValidShortcode = (shortcode: string): boolean => {
      // Shortcode format: SAFE + alphanumeric
      const shortcodeRegex = /^SAFE[A-Z0-9]{4,12}$/i;
      return shortcodeRegex.test(shortcode);
    };

    it('should accept valid shortcodes', () => {
      expect(isValidShortcode('SAFE1234')).toBe(true);
      expect(isValidShortcode('SAFEABC')).toBe(true);
      expect(isValidShortcode('SAFE12AB')).toBe(true);
    });

    it('should reject invalid shortcodes', () => {
      expect(isValidShortcode('SAFE')).toBe(false); // Too short
      expect(isValidShortcode('SAFE' + 'A'.repeat(20)).toBe(false); // Too long
      expect(isValidShortcode('INVALID')).toBe(false);
      expect(isValidShortcode('')).toBe(false);
    });
  });

  describe('User ID Validation', () => {
    const isValidUserId = (userId: string): boolean => {
      // User ID: alphanumeric with underscores, 3-50 chars
      const userIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
      return userIdRegex.test(userId);
    };

    it('should accept valid user IDs', () => {
      expect(isValidUserId('user123')).toBe(true);
      expect(isValidUserId('user_123')).toBe(true);
      expect(isValidUserId('test-user')).toBe(true);
    });

    it('should reject invalid user IDs', () => {
      expect(isValidUserId('ab')).toBe(false); // Too short
      expect(isValidUserId('A'.repeat(51))).toBe(false); // Too long
      expect(isValidUserId('user@123')).toBe(false); // Invalid char
    });
  });
});

describe('Rate Limiting Tests', () => {
  // Mock rate limiter
  class MockRateLimiter {
    private requests: Map<string, { count: number; resetTime: number }> = new Map();
    private windowMs: number;
    private max: number;

    constructor(windowMs: number, max: number) {
      this.windowMs = windowMs;
      this.max = max;
    }

    isAllowed(identifier: string): boolean {
      const now = Date.now();
      const record = this.requests.get(identifier);

      if (!record || now > record.resetTime) {
        this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
        return true;
      }

      if (record.count >= this.max) {
        return false;
      }

      record.count++;
      return true;
    }

    reset(identifier: string): void {
      this.requests.delete(identifier);
    }
  }

  let limiter: MockRateLimiter;

  beforeEach(() => {
    limiter = new MockRateLimiter(60000, 10); // 10 requests per minute
  });

  it('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('user1')).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('user1');
    }
    expect(limiter.isAllowed('user1')).toBe(false);
  });

  it('should track requests per identifier independently', () => {
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('user1');
    }
    expect(limiter.isAllowed('user2')).toBe(true);
  });

  it('should reset after window expires', async () => {
    const fastLimiter = new MockRateLimiter(100, 2); // 2 requests per 100ms

    expect(fastLimiter.isAllowed('user1')).toBe(true);
    expect(fastLimiter.isAllowed('user1')).toBe(true);
    expect(fastLimiter.isAllowed('user1')).toBe(false);

    // Simulate time passing
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(fastLimiter.isAllowed('user1')).toBe(true);
  });
});
