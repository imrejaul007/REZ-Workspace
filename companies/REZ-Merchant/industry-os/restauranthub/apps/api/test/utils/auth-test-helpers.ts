import { JwtService } from '@nestjs/jwt';
import { TestFactories } from './test-factories';
import * as bcrypt from 'bcrypt';

/**
 * Authentication test helpers
 */
export class AuthTestHelpers {
  private static jwtService: JwtService;

  static setJwtService(jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  /**
   * Generate a valid JWT token for testing
   */
  static generateJwtToken(payload, secret?: string) {
    if (!this.jwtService) {
      // Fallback JWT creation
      const jwt = require('jsonwebtoken');
      return jwt.sign(payload, secret || process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '1h',
      });
    }
    return this.jwtService.sign(payload);
  }

  /**
   * Generate expired JWT token for testing
   */
  static generateExpiredJwtToken(payload, secret?: string) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
      secret || process.env.JWT_SECRET || 'test-secret'
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload, secret?: string) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret || process.env.JWT_REFRESH_SECRET || 'test-refresh-secret', {
      expiresIn: '7d',
    });
  }

  /**
   * Create authentication headers
   */
  static createAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Create complete test user with token
   */
  static async createAuthenticatedTestUser(role: string = 'CUSTOMER') {
    const user = TestFactories.createUser({ role });
    const jwtPayload = TestFactories.createJwtPayload(user.id, {
      email: user.email,
      role: user.role,
    });
    const accessToken = this.generateJwtToken(jwtPayload);
    const refreshToken = this.generateRefreshToken(jwtPayload);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
      headers: this.createAuthHeaders(accessToken),
    };
  }

  /**
   * Hash password for testing
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password for testing
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create invalid JWT token
   */
  static createInvalidJwtToken() {
    return 'invalid.jwt.token';
  }

  /**
   * Create malformed JWT token
   */
  static createMalformedJwtToken() {
    return 'malformed-token-without-dots';
  }

  /**
   * Mock JWT verification
   */
  static mockJwtVerification(payload) {
    return {
      verify: jest.fn().mockResolvedValue(payload),
      sign: jest.fn().mockReturnValue('mocked-token'),
    };
  }

  /**
   * Create test login request
   */
  static createLoginRequest(email?: string, password?: string) {
    return {
      email: email || 'test@example.com',
      password: password || 'password123',
    };
  }

  /**
   * Create test registration request
   */
  static createRegistrationRequest(overrides: unknown = {}) {
    return TestFactories.createRegistrationData(overrides);
  }

  /**
   * Mock successful login response
   */
  static mockLoginResponse(user) {
    const jwtPayload = TestFactories.createJwtPayload(user.id, {
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          profile: user.profile,
        },
        tokens: {
          accessToken: this.generateJwtToken(jwtPayload),
          refreshToken: this.generateRefreshToken(jwtPayload),
          expiresIn: 3600,
        },
      },
      message: 'Login successful',
    };
  }

  /**
   * Create test session data
   */
  static createTestSession(userId: string, overrides: unknown = {}) {
    return TestFactories.createSession(userId, overrides);
  }

  /**
   * Mock failed login response
   */
  static mockFailedLoginResponse(message: string = 'Invalid credentials') {
    return {
      success: false,
      error: {
        message,
        code: 401,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create test password reset request
   */
  static createPasswordResetRequest(email: string) {
    return {
      email,
    };
  }

  /**
   * Create test password reset token
   */
  static createPasswordResetToken(userId: string) {
    const payload = {
      sub: userId,
      type: 'password-reset',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
    return this.generateJwtToken(payload, 'password-reset-secret');
  }

  /**
   * Create test email verification token
   */
  static createEmailVerificationToken(userId: string) {
    const payload = {
      sub: userId,
      type: 'email-verification',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    };
    return this.generateJwtToken(payload, 'email-verification-secret');
  }

  /**
   * Mock rate limit headers
   */
  static createRateLimitHeaders(remaining: number = 5, reset: number = 60) {
    return {
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': (Date.now() + reset * 1000).toString(),
    };
  }

  /**
   * Mock brute force protection response
   */
  static mockBruteForceResponse() {
    return {
      success: false,
      error: {
        message: 'Too many failed attempts. Please try again later.',
        code: 429,
        retryAfter: 300, // 5 minutes
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create 2FA test data
   */
  static create2FATestData(userId: string) {
    return {
      userId,
      secret: 'JBSWY3DPEHPK3PXP',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADI...',
      backupCodes: [
        'ABC12345',
        'DEF67890',
        'GHI24680',
        'JKL13579',
        'MNO97531',
      ],
    };
  }

  /**
   * Mock 2FA token verification
   */
  static mock2FAVerification(isValid: boolean = true) {
    return {
      isValid,
      message: isValid ? '2FA token is valid' : 'Invalid 2FA token',
    };
  }
}