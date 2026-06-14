/**
 * Auth Middleware Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  optionalAuth,
  requireRole,
  generateToken,
} from '../../src/middleware/auth';

// Mock config
jest.mock('../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: '1h',
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'advertiser' as const,
        permissions: ['read', 'write'],
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token
      const decoded = jwt.verify(token, 'test-secret') as any;
      expect(decoded.userId).toBe('user-001');
      expect(decoded.advertiserId).toBe('advertiser-001');
      expect(decoded.role).toBe('advertiser');
    });
  });

  describe('authenticate', () => {
    it('should reject request without Authorization header', () => {
      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authorization header required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
      });
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
    });

    it('should authenticate valid token and set user on request', () => {
      const token = generateToken({
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'advertiser',
        permissions: ['read'],
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.userId).toBe('user-001');
      expect((mockRequest as any).advertiserId).toBe('advertiser-001');
    });

    it('should reject expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        {
          userId: 'user-001',
          advertiserId: 'advertiser-001',
          role: 'advertiser',
          permissions: [],
        },
        'test-secret',
        { expiresIn: '-1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
      });
    });
  });

  describe('optionalAuth', () => {
    it('should call next without token', () => {
      optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should set user when valid token provided', () => {
      const token = generateToken({
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'advertiser',
        permissions: ['read'],
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
    });

    it('should continue without user for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('should reject request without user', () => {
      const middleware = requireRole('advertiser');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should reject user with wrong role', () => {
      (mockRequest as any).user = {
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'viewer',
        permissions: [],
      };

      const middleware = requireRole('advertiser');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Required roles: advertiser',
      });
    });

    it('should allow user with correct role', () => {
      (mockRequest as any).user = {
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'advertiser',
        permissions: ['read'],
      };

      const middleware = requireRole('advertiser');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow user with one of multiple roles', () => {
      (mockRequest as any).user = {
        userId: 'user-001',
        advertiserId: 'advertiser-001',
        role: 'admin',
        permissions: ['read', 'write'],
      };

      const middleware = requireRole('advertiser', 'admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});