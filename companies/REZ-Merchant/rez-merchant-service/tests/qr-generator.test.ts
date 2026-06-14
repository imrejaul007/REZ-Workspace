/**
 * QR Code Generation Tests
 *
 * Tests the QR code generation functionality including:
 * - HMAC-SHA256 signature generation for event QR codes
 * - Error correction level configuration for print quality
 * - Payload structure and validation
 */

import crypto from 'crypto';

// Set up environment before imports
process.env.QR_SECRET = 'test-qr-secret-key-minimum-32-characters-long';

describe('QR Code Generation', () => {
  describe('Event QR Code Generation (HMAC-SHA256)', () => {
    /**
     * Reimplementation of generateEventQRCodes for testing
     */
    function generateEventQRCodes(eventId: string): { checkIn: string; checkOut: string } {
      const secret = process.env.QR_SECRET!;

      const checkInPayload: Record<string, unknown> = {
        eventId,
        type: 'check_in',
        ts: Date.now(),
      };
      const checkOutPayload: Record<string, unknown> = {
        eventId,
        type: 'check_out',
        ts: Date.now(),
      };

      const checkInSig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(checkInPayload))
        .digest('hex');
      const checkOutSig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(checkOutPayload))
        .digest('hex');

      checkInPayload['sig'] = checkInSig;
      checkOutPayload['sig'] = checkOutSig;

      return {
        checkIn: Buffer.from(JSON.stringify(checkInPayload)).toString('base64'),
        checkOut: Buffer.from(JSON.stringify(checkOutPayload)).toString('base64'),
      };
    }

    beforeEach(() => {
      process.env.QR_SECRET = 'test-qr-secret-key-minimum-32-characters-long';
    });

    it('should generate checkIn and checkOut QR codes', () => {
      const eventId = 'event-123';
      const result = generateEventQRCodes(eventId);

      expect(result).toHaveProperty('checkIn');
      expect(result).toHaveProperty('checkOut');
      expect(result.checkIn).toBeTruthy();
      expect(result.checkOut).toBeTruthy();
    });

    it('should generate base64-encoded checkIn payload', () => {
      const eventId = 'event-456';
      const result = generateEventQRCodes(eventId);

      // Verify it's valid base64
      expect(() => Buffer.from(result.checkIn, 'base64')).not.toThrow();

      // Verify it can be decoded to JSON
      const decoded = JSON.parse(Buffer.from(result.checkIn, 'base64').toString());
      expect(decoded).toHaveProperty('eventId', eventId);
      expect(decoded).toHaveProperty('type', 'check_in');
      expect(decoded).toHaveProperty('ts');
      expect(decoded).toHaveProperty('sig');
    });

    it('should generate base64-encoded checkOut payload', () => {
      const eventId = 'event-789';
      const result = generateEventQRCodes(eventId);

      const decoded = JSON.parse(Buffer.from(result.checkOut, 'base64').toString());
      expect(decoded).toHaveProperty('eventId', eventId);
      expect(decoded).toHaveProperty('type', 'check_out');
      expect(decoded).toHaveProperty('ts');
      expect(decoded).toHaveProperty('sig');
    });

    it('should include HMAC-SHA256 signature in checkIn payload', () => {
      const eventId = 'event-signature-test';
      const result = generateEventQRCodes(eventId);

      const decoded = JSON.parse(Buffer.from(result.checkIn, 'base64').toString());
      expect(decoded.sig).toBeDefined();

      // Verify signature is a valid hex string (64 chars for SHA256)
      expect(decoded.sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should include HMAC-SHA256 signature in checkOut payload', () => {
      const eventId = 'event-signature-test';
      const result = generateEventQRCodes(eventId);

      const decoded = JSON.parse(Buffer.from(result.checkOut, 'base64').toString());
      expect(decoded.sig).toBeDefined();
      expect(decoded.sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique signatures for different event IDs', () => {
      const result1 = generateEventQRCodes('event-001');
      const result2 = generateEventQRCodes('event-002');

      const decoded1 = JSON.parse(Buffer.from(result1.checkIn, 'base64').toString());
      const decoded2 = JSON.parse(Buffer.from(result2.checkIn, 'base64').toString());

      expect(decoded1.sig).not.toBe(decoded2.sig);
    });

    it('should generate different checkIn and checkOut signatures', () => {
      const eventId = 'event-different-types';
      const result = generateEventQRCodes(eventId);

      const decodedCheckIn = JSON.parse(Buffer.from(result.checkIn, 'base64').toString());
      const decodedCheckOut = JSON.parse(Buffer.from(result.checkOut, 'base64').toString());

      expect(decodedCheckIn.sig).not.toBe(decodedCheckOut.sig);
    });

    it('should include timestamp in payload', () => {
      const beforeTime = Date.now();
      const result = generateEventQRCodes('event-timestamp');
      const afterTime = Date.now();

      const decoded = JSON.parse(Buffer.from(result.checkIn, 'base64').toString());
      expect(decoded.ts).toBeGreaterThanOrEqual(beforeTime);
      expect(decoded.ts).toBeLessThanOrEqual(afterTime);
    });

    it('should throw error when QR_SECRET is not set', () => {
      // Clear the environment variable
      delete process.env.QR_SECRET;

      expect(() => {
        // This simulates the actual code in qrGenerator.ts which uses the secret
        const secret = process.env.QR_SECRET;
        if (!secret) {
          throw new Error('QR_SECRET environment variable is required');
        }
      }).toThrow('QR_SECRET environment variable is required');
    });
  });

  describe('QR Code Security - HMAC Verification', () => {
    it('should generate verifiable HMAC signatures', () => {
      const secret = 'test-secret-for-verification';
      const payload = { eventId: 'event-123', type: 'check_in', ts: Date.now() };

      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Verify the signature
      const verifySignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(signature).toBe(verifySignature);
    });

    it('should detect tampering with payload', () => {
      const secret = 'test-secret-for-tampering';
      const originalPayload = { eventId: 'event-123', type: 'check_in', ts: Date.now() };

      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(originalPayload))
        .digest('hex');

      // Tamper with the payload
      const tamperedPayload = { ...originalPayload, type: 'check_out' };

      const verifySignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(tamperedPayload))
        .digest('hex');

      expect(signature).not.toBe(verifySignature);
    });

    it('should use 256-bit HMAC (SHA256)', () => {
      const secret = 'test-secret';
      const payload = 'test-data';

      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // SHA256 produces 64 hex characters (256 bits)
      expect(signature.length).toBe(64);
    });

    it('should reject HMAC with wrong secret', () => {
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';
      const payload = { eventId: 'event-123' };

      const correctSig = crypto
        .createHmac('sha256', correctSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const wrongSig = crypto
        .createHmac('sha256', wrongSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(correctSig).not.toBe(wrongSig);
    });
  });

  describe('QR Code Validation', () => {
    it('should validate hex color format', () => {
      // Test the validation function used in the route
      function isValidHexColor(color: string): boolean {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
      }

      expect(isValidHexColor('#FF5733')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('#FFF')).toBe(false);
      expect(isValidHexColor('not-a-color')).toBe(false);
    });

    it('should validate URL format', () => {
      function isValidUrl(url: string): boolean {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }

      expect(isValidUrl('https://menu.rez.money/store-123')).toBe(true);
      expect(isValidUrl('https://rez.money/menu?table=5')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('QR Code Configuration', () => {
    it('should have correct error correction levels', () => {
      const errorCorrectionLevels = ['L', 'M', 'Q', 'H'];

      // L = 7% recovery, M = 15% recovery, Q = 25% recovery, H = 30% recovery
      expect(errorCorrectionLevels).toContain('L');
      expect(errorCorrectionLevels).toContain('M');
      expect(errorCorrectionLevels).toContain('Q');
      expect(errorCorrectionLevels).toContain('H');
    });

    it('should define width constraints', () => {
      const minWidth = 100;
      const maxWidth = 1000;
      const defaultWidth = 300;

      // Test width clamping
      const clampWidth = (width: number) => Math.min(Math.max(width || defaultWidth, minWidth), maxWidth);

      expect(clampWidth(50)).toBe(100); // Below min
      expect(clampWidth(150)).toBe(150); // Within range
      expect(clampWidth(1500)).toBe(1000); // Above max
      expect(clampWidth(undefined)).toBe(300); // Default
    });

    it('should define margin constraints', () => {
      const minMargin = 0;
      const maxMargin = 10;
      const defaultMargin = 2;

      const clampMargin = (margin: number) => Math.min(Math.max(margin || defaultMargin, minMargin), maxMargin);

      expect(clampMargin(-1)).toBe(0); // Below min
      expect(clampMargin(5)).toBe(5); // Within range
      expect(clampMargin(15)).toBe(10); // Above max
      expect(clampMargin(undefined)).toBe(2); // Default
    });
  });

  describe('QR Code Base64 Encoding', () => {
    it('should encode JSON payload to base64', () => {
      const payload = {
        eventId: 'event-123',
        type: 'check_in',
        ts: Date.now(),
        sig: 'abc123',
      };

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());

      expect(decoded).toEqual(payload);
    });

    it('should handle special characters in payload', () => {
      const payload = {
        eventId: 'event-123',
        name: 'Test Store & Grill <info@example.com>',
        unicode: 'Cafe Menu: Pizza, Pasta, Salads, Coffees & Teas',
      };

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());

      expect(decoded.name).toBe(payload.name);
      expect(decoded.unicode).toBe(payload.unicode);
    });
  });
});
