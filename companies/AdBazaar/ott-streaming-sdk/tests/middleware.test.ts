import { generateToken, verifyToken } from '../src/middleware/auth.js';

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        appId: 'test-app-123',
        deviceId: 'device-456',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { appId: 'app-1' };
      const payload2 = { appId: 'app-2' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        appId: 'test-app-123',
        deviceId: 'device-456',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.appId).toBe('test-app-123');
      expect(decoded?.deviceId).toBe('device-456');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'abc123';

      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });
  });
});