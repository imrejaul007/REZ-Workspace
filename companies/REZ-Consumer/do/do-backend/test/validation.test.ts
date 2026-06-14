/**
 * Do Backend - Unit Tests
 *
 * Run: node --test test/*.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ============ VALIDATION TESTS ============

describe('Input Validation', () => {
  describe('Phone Validation', () => {
    const phoneRegex = /^[6-9]\d{9}$/;

    it('accepts valid Indian mobile numbers', () => {
      const validPhones = ['9876543210', '9876543211', '9876543212', '9876543213'];
      validPhones.forEach(phone => {
        assert.strictEqual(phoneRegex.test(phone), true, `${phone} should be valid`);
      });
    });

    it('rejects invalid phone formats', () => {
      const invalidPhones = ['1234567890', '0123456789', 'abcdefghij', '12345', ''];
      invalidPhones.forEach(phone => {
        assert.strictEqual(phoneRegex.test(phone), false, `${phone} should be invalid`);
      });
    });

    it('rejects short/long numbers', () => {
      assert.strictEqual(phoneRegex.test('98765'), false);
      assert.strictEqual(phoneRegex.test('98765432101234'), false);
    });
  });

  describe('OTP Validation', () => {
    const isValidOtp = (otp) => /^\d{4}$/.test(otp);

    it('accepts 4-digit OTPs', () => {
      assert.strictEqual(isValidOtp('1234'), true);
      assert.strictEqual(isValidOtp('0000'), true);
      assert.strictEqual(isValidOtp('9999'), true);
    });

    it('rejects non-4-digit inputs', () => {
      assert.strictEqual(isValidOtp('123'), false);
      assert.strictEqual(isValidOtp('12345'), false);
      assert.strictEqual(isValidOtp('12ab'), false);
      assert.strictEqual(isValidOtp(''), false);
    });
  });

  describe('Amount Validation', () => {
    const validateAmount = (amount) => {
      if (typeof amount !== 'number') return false;
      if (amount <= 0) return false;
      if (amount > 1000000) return false;
      return true;
    };

    it('accepts valid amounts', () => {
      assert.strictEqual(validateAmount(100), true);
      assert.strictEqual(validateAmount(0.01), true);
      assert.strictEqual(validateAmount(1000000), true);
    });

    it('rejects invalid amounts', () => {
      assert.strictEqual(validateAmount(0), false);
      assert.strictEqual(validateAmount(-100), false);
      assert.strictEqual(validateAmount(1000001), false);
      assert.strictEqual(validateAmount('100'), false);
    });
  });

  describe('Idempotency Key Validation', () => {
    const validateKey = (key) => {
      if (typeof key !== 'string') return false;
      return key.length >= 16 && key.length <= 64;
    };

    it('accepts valid keys', () => {
      assert.strictEqual(validateKey('abcd'.repeat(4)), true); // 16 chars
      assert.strictEqual(validateKey('a'.repeat(64)), true); // 64 chars
    });

    it('rejects short/long keys', () => {
      assert.strictEqual(validateKey('short'), false);
      assert.strictEqual(validateKey('a'.repeat(65)), false);
    });
  });
});

// ============ SECURITY TESTS ============

describe('Security', () => {
  describe('Secret Validation', () => {
    const isValidSecret = (secret) => {
      return typeof secret === 'string' && secret.length >= 32;
    };

    it('rejects secrets shorter than 32 chars', () => {
      assert.strictEqual(isValidSecret('short'), false);
      assert.strictEqual(isValidSecret('exactly32chars12345678901234567'), true);
      assert.strictEqual(isValidSecret('a'.repeat(32)), true);
    });
  });

  describe('CORS Origin Validation', () => {
    const isValidOrigin = (origin) => {
      if (origin === '*') return false; // Wildcard not allowed
      if (!origin) return false;
      try {
        new URL(origin);
        return true;
      } catch {
        return false;
      }
    };

    it('rejects wildcard origin', () => {
      assert.strictEqual(isValidOrigin('*'), false);
    });

    it('accepts valid URLs', () => {
      assert.strictEqual(isValidOrigin('https://example.com'), true);
      assert.strictEqual(isValidOrigin('https://do-app.vercel.app'), true);
    });
  });
});

// ============ UTILITY TESTS ============

describe('Utilities', () => {
  describe('JSON Parsing', () => {
    const safeJsonParse = (json, fallback) => {
      if (!json) return fallback;
      try {
        return JSON.parse(json);
      } catch {
        return fallback;
      }
    };

    it('parses valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', null);
      assert.deepStrictEqual(result, { key: 'value' });
    });

    it('returns fallback for invalid JSON', () => {
      assert.strictEqual(safeJsonParse('invalid', null), null);
      assert.strictEqual(safeJsonParse(null, 'fallback'), 'fallback');
      assert.strictEqual(safeJsonParse(undefined, []), []);
    });
  });

  describe('Timestamp Generation', () => {
    it('generates valid ISO timestamps', () => {
      const ts = new Date().toISOString();
      assert.strictEqual(typeof ts, 'string');
      assert.ok(ts.includes('T'));
      assert.ok(ts.endsWith('Z') || /\+\d{2}:\d{2}$/.test(ts));
    });
  });
});

console.log('Tests defined. Run with: node --test test/*.test.ts');
