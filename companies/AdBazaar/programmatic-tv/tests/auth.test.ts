import { generateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index';

describe('Authentication', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        sub: 'user-123',
        type: 'user' as const,
        seatId: 'seat-456',
        advertiserId: 'adv-789',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token
      const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.type).toBe('user');
    });

    it('should include custom claims', () => {
      const payload = {
        sub: 'service-123',
        type: 'service' as const,
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;

      expect(decoded.iss).toBe(config.jwt.issuer);
    });
  });
});