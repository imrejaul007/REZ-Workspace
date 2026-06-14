import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, generateToken, verifyToken } from '../src/middleware/auth.middleware';

// Mock config
jest.mock('../src/config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '24h',
    },
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should reject request without authorization header', () => {
      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'No authorization header provided',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockReq.headers = { authorization: 'InvalidToken' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid JWT', () => {
      mockReq.headers = { authorization: 'Bearer invalid.jwt.token' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept request with valid JWT', () => {
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, 'test-secret');
      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as Request & { user: unknown }).user).toBeDefined();
    });

    it('should reject expired token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '-1s' });
      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
        })
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'user' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token')).toThrow();
    });
  });
});