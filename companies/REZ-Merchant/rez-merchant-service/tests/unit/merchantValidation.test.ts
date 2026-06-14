import { z } from 'zod';

// Example validation schemas from merchant service
describe('Merchant Service Validation', () => {
  // Common validation schemas
  const emailSchema = z.string().email();
  const phoneSchema = z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number');
  const objectIdSchema = z.string().refine(
    (val) => /^[a-fA-F0-9]{24}$/.test(val),
    'Invalid ObjectId'
  );

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.in',
        'user+tag@gmail.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user@.com',
        '',
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Phone Validation', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+919876543210',
        '+1234567890',
        '9876543210',
        '12345678',
      ];

      validPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '12345', // too short
        'abcdefgh', // letters
        '+0123456789', // starts with 0
      ];

      invalidPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ObjectId Validation', () => {
    it('should accept valid MongoDB ObjectIds', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '000000000000000000000000',
        'ffffffffffffffffffffffff',
        'ABCDEFabcdef123456789ABC',
      ];

      validIds.forEach(id => {
        const result = objectIdSchema.safeParse(id);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid ObjectIds', () => {
      const invalidIds = [
        '123', // too short
        'gggggggggggggggggggggggg', // invalid chars
        '',
        '507f1f77bcf86cd79943901', // 23 chars
        '507f1f77bcf86cd7994390111', // 25 chars
      ];

      invalidIds.forEach(id => {
        const result = objectIdSchema.safeParse(id);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('Trust Proxy Validation', () => {
  function validateTrustProxyHops(raw: string | undefined): number {
    const rawTrustHops = Number.parseInt(raw || '1', 10);
    const TRUST_PROXY_HOPS = Number.isFinite(rawTrustHops)
      ? Math.max(1, Math.min(3, rawTrustHops))
      : 1;
    return TRUST_PROXY_HOPS;
  }

  it('should return default value for undefined', () => {
    expect(validateTrustProxyHops(undefined)).toBe(1);
  });

  it('should parse valid numbers', () => {
    expect(validateTrustProxyHops('1')).toBe(1);
    expect(validateTrustProxyHops('2')).toBe(2);
    expect(validateTrustProxyHops('3')).toBe(3);
  });

  it('should cap at maximum of 3', () => {
    expect(validateTrustProxyHops('10')).toBe(3);
    expect(validateTrustProxyHops('999')).toBe(3);
  });

  it('should cap at minimum of 1', () => {
    expect(validateTrustProxyHops('0')).toBe(1);
    expect(validateTrustProxyHops('-1')).toBe(1);
  });

  it('should handle invalid strings', () => {
    expect(validateTrustProxyHops('abc')).toBe(1);
    expect(validateTrustProxyHops('')).toBe(1);
  });
});

describe('CORS Origin Validation', () => {
  const REZ_ORIGIN_RE = /^https:\/\/(merchant\.rez\.money|admin\.rez\.money|menu\.rez\.money|rez\.money|www\.rez\.money|rez-app-merchant\.com)$/;

  function isAllowedOrigin(origin: string): boolean {
    return REZ_ORIGIN_RE.test(origin);
  }

  it('should allow known Rez domains', () => {
    const allowedOrigins = [
      'https://merchant.rez.money',
      'https://admin.rez.money',
      'https://menu.rez.money',
      'https://rez.money',
      'https://www.rez.money',
      'https://rez-app-merchant.com',
    ];

    allowedOrigins.forEach(origin => {
      expect(isAllowedOrigin(origin)).toBe(true);
    });
  });

  it('should reject unknown origins', () => {
    const rejectedOrigins = [
      'https://evil.com',
      'https://merchant.evil.com',
      'https://rez.money.evil.com',
      'http://merchant.rez.money', // HTTP not allowed
      'https://merchant.rez.money.com',
    ];

    rejectedOrigins.forEach(origin => {
      expect(isAllowedOrigin(origin)).toBe(false);
    });
  });

  it('should handle localhost in development', () => {
    const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
    expect(localhostPattern.test('http://localhost')).toBe(true);
    expect(localhostPattern.test('https://localhost:3000')).toBe(true);
    expect(localhostPattern.test('http://localhost:8080')).toBe(true);
  });
});

describe('Encryption Key Validation', () => {
  function validateEncryptionKey(key: string | undefined): boolean {
    if (!key) return false;
    // Encryption key should be at least 32 bytes (256 bits) for AES-256
    if (key.length < 32) return false;
    // Key should be hex-encoded (64 hex chars = 32 bytes)
    if (!/^[a-fA-F0-9]+$/.test(key)) return false;
    return true;
  }

  it('should accept valid encryption keys', () => {
    const validKey = 'a'.repeat(64); // 64 hex chars = 32 bytes
    expect(validateEncryptionKey(validKey)).toBe(true);
  });

  it('should reject missing key', () => {
    expect(validateEncryptionKey(undefined)).toBe(false);
  });

  it('should reject short keys', () => {
    expect(validateEncryptionKey('abc123')).toBe(false);
  });

  it('should reject non-hex keys', () => {
    expect(validateEncryptionKey('g'.repeat(64))).toBe(false); // 'g' not in hex
  });
});
