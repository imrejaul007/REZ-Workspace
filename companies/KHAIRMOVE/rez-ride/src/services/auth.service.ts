import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { randomInt, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { AppError, AuthenticationError } from '../common/exceptions';

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  role: 'user' | 'driver' | 'admin';
}

export interface OTPResult {
  success: boolean;
  expiresIn: number;
  message?: string;
}

export interface VerifyResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
}

// In-memory rate limiting for OTP requests (use Redis in production)
const otpRequestCounts = new Map<string, { count: number; windowStart: number }>();
const MAX_OTP_REQUESTS = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { hash: string; expires: number; attempts: number }>();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiting for failed attempts
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authServiceUrl: string;
  private readonly internalToken: string;
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly otpHmacKey: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = configService.get('REZ_AUTH_SERVICE_URL', 'http://localhost:4002');
    this.internalToken = configService.get('INTERNAL_SERVICE_TOKEN', '');

    // SECURITY: Fail if JWT secrets not configured
    const jwtSecret = configService.get('JWT_SECRET');
    const jwtRefreshSecret = configService.get('JWT_REFRESH_SECRET');

    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new AppError('JWT_SECRET environment variable is required in production', 'MISSING_JWT_SECRET');
    }

    if (!jwtRefreshSecret && process.env.NODE_ENV === 'production') {
      throw new AppError('JWT_REFRESH_SECRET environment variable is required in production', 'MISSING_JWT_REFRESH_SECRET');
    }

    this.jwtSecret = jwtSecret || 'dev-only-secret-do-not-use-in-production';
    this.jwtRefreshSecret = jwtRefreshSecret || `${this.jwtSecret}-refresh`;
    this.otpHmacKey = configService.get('OTP_HMAC_KEY', 'dev-otp-key-change-in-production');

    // Clean up expired OTPs periodically
    this.cleanupExpiredOtps();
  }

  /**
   * Cleanup expired OTPs to prevent memory leaks
   */
  private cleanupExpiredOtps(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of otpStore.entries()) {
        if (value.expires < now) {
          otpStore.delete(key);
        }
      }
      // Cleanup rate limit counters
      for (const [key, value] of otpRequestCounts.entries()) {
        if (value.windowStart + OTP_WINDOW_MS < now) {
          otpRequestCounts.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Check rate limit for OTP requests
   */
  private checkOtpRateLimit(phone: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = otpRequestCounts.get(phone);

    if (!record || record.windowStart + OTP_WINDOW_MS < now) {
      // Start new window
      otpRequestCounts.set(phone, { count: 1, windowStart: now });
      return { allowed: true };
    }

    if (record.count >= MAX_OTP_REQUESTS) {
      const retryAfter = Math.ceil((record.windowStart + OTP_WINDOW_MS - now) / 1000);
      return { allowed: false, retryAfter };
    }

    record.count++;
    return { allowed: true };
  }

  /**
   * Generate cryptographically secure 6-digit OTP
   */
  private generateOtp(): string {
    // Use crypto.randomInt for secure random number
    return randomInt(100000, 999999).toString();
  }

  /**
   * Hash OTP with HMAC for storage
   */
  private hashOtp(otp: string, phone: string): string {
    return createHmac('sha256', this.otpHmacKey)
      .update(`${phone}:${otp}`)
      .digest('hex');
  }

  /**
   * Request OTP for user login
   */
  async requestOTP(phone: string, type: 'login' | 'register' = 'login'): Promise<OTPResult> {
    // Validate phone number format
    if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return {
        success: false,
        expiresIn: 0,
        message: 'Invalid phone number format'
      };
    }

    // Check rate limit
    const rateCheck = this.checkOtpRateLimit(phone);
    if (!rateCheck.allowed) {
      this.logger.warn(`OTP rate limit exceeded for ${phone}`);
      return {
        success: false,
        expiresIn: 0,
        message: `Too many OTP requests. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
      };
    }

    try {
      // Generate 6-digit cryptographically secure OTP
      const otp = this.generateOtp();
      const expiresIn = Math.floor(OTP_TTL_MS / 1000);

      // Store hashed OTP (never store plaintext)
      const key = `${type}:${phone}`;
      const hash = this.hashOtp(otp, phone);

      otpStore.set(key, {
        hash,
        expires: Date.now() + OTP_TTL_MS,
        attempts: 0
      });

      // Send via Twilio SMS (or mock in development)
      await this.sendSMS(phone, `Your ReZ Ride OTP is: ${otp}. Valid for 5 minutes.`);

      this.logger.log(`OTP sent to ${phone} (hashed)`);

      return {
        success: true,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`);
      return {
        success: false,
        expiresIn: 0,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(phone: string, otp: string, type: 'login' | 'register' = 'login'): Promise<VerifyResult> {
    // Check for lockout
    const lockout = failedAttempts.get(phone);
    if (lockout && lockout.lockedUntil > Date.now()) {
      const retryAfter = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        message: `Account locked. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
      };
    }

    const key = `${type}:${phone}`;
    const stored = otpStore.get(key);

    // Check if OTP exists
    if (!stored) {
      return {
        success: false,
        message: 'OTP not requested. Please request OTP first.',
      };
    }

    // Check expiration
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return {
        success: false,
        message: 'OTP expired. Please request a new OTP.',
      };
    }

    // Increment attempts
    stored.attempts++;

    // Verify OTP using timing-safe comparison
    const hash = this.hashOtp(otp, phone);
    const hashBuffer = Buffer.from(hash);
    const storedBuffer = Buffer.from(stored.hash);

    let isValid = false;
    if (hashBuffer.length === storedBuffer.length) {
      isValid = timingSafeEqual(hashBuffer, storedBuffer);
    }

    if (!isValid) {
      // Clear OTP after max attempts
      if (stored.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(key);
        // Lockout the account
        failedAttempts.set(phone, {
          count: stored.attempts,
          lockedUntil: Date.now() + LOCKOUT_DURATION_MS
        });
        this.logger.warn(`OTP attempts exceeded for ${phone} - account locked`);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
      };
    }

    // Clear OTP on success
    otpStore.delete(key);
    // Clear failed attempts
    failedAttempts.delete(phone);

    // Create or get user from ReZ Auth service
    const user = await this.getOrCreateUser(phone, type === 'register' ? 'register' : 'login');

    // Generate tokens
    const { token, refreshToken } = this.generateTokenPair(user);

    return {
      success: true,
      token,
      refreshToken,
      user,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ token?: string; refreshToken?: string; user?: AuthUser }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as {
        sub: string;
        phone: string;
        role: string;
      };

      // Check token type
      const payload = jwt.decode(refreshToken) as { type?: string };
      if (payload.type !== 'refresh') {
        return { };
      }

      const user: AuthUser = {
        id: decoded.sub,
        phone: decoded.phone,
        role: decoded.role as 'user' | 'driver' | 'admin'
      };

      // Generate new token pair (rotation)
      const { token, refreshToken: newRefreshToken } = this.generateTokenPair(user);

      return { token, refreshToken: newRefreshToken, user };
    } catch {
      return { };
    }
  }

  /**
   * Generate access and refresh token pair
   */
  private generateTokenPair(user: AuthUser): { token: string; refreshToken: string } {
    const token = jwt.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        type: 'refresh'
      },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    return { token, refreshToken };
  }

  /**
   * Get or create user from ReZ Auth service
   */
  private async getOrCreateUser(phone: string, action: string): Promise<AuthUser> {
    try {
      // Try to get existing user
      const response = await axios.get(
        `${this.authServiceUrl}/api/auth/user/${phone}`,
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
          timeout: 5000,
        }
      );

      if (response.data.user) {
        return {
          id: response.data.user.id,
          phone: response.data.user.phone,
          name: response.data.user.name,
          role: 'user',
        };
      }
    } catch (error) {
      this.logger.warn(`Could not fetch user from auth service: ${error.message}`);
    }

    // Create new user
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/api/auth/register`,
        {
          phone,
          role: 'user',
          source: 'rez_ride',
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
          timeout: 5000,
        }
      );

      return {
        id: response.data.user.id,
        phone: response.data.user.phone,
        name: response.data.user.name,
        role: 'user',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create user: ${message}`);
      throw new AppError('Unable to create or retrieve user', 'USER_CREATION_FAILED');
    }
  }

  /**
   * Driver authentication
   */
  async authenticateDriver(phone: string, otp: string): Promise<VerifyResult> {
    const verifyResult = await this.verifyOTP(phone, otp, 'login');

    if (!verifyResult.success) {
      return verifyResult;
    }

    // Get or create driver
    try {
      const driver = await this.getOrCreateDriver(phone);

      const { token, refreshToken } = this.generateTokenPair({
        ...driver,
        role: 'driver'
      });

      return {
        success: true,
        token,
        refreshToken,
        user: { ...driver, role: 'driver' }
      };
    } catch (error) {
      this.logger.error(`Driver authentication failed: ${error.message}`);
      return {
        success: false,
        message: 'Driver authentication failed'
      };
    }
  }

  /**
   * Get or create driver
   */
  private async getOrCreateDriver(phone: string): Promise<{ id: string; phone: string }> {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/api/auth/register`,
        {
          phone,
          role: 'driver',
          source: 'rez_ride',
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
          timeout: 5000,
        }
      );

      return {
        id: response.data.user.id,
        phone: response.data.user.phone,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create driver: ${message}`);
      throw new AppError('Unable to create driver account', 'DRIVER_CREATION_FAILED');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        sub: string;
        phone: string;
        role: string;
        type: string;
      };

      // Verify token type
      if (decoded.type !== 'access') {
        return null;
      }

      return {
        id: decoded.sub,
        phone: decoded.phone,
        role: decoded.role as 'user' | 'driver' | 'admin',
      };
    } catch {
      return null;
    }
  }

  /**
   * Send SMS (mock in development)
   */
  private async sendSMS(phone: string, message: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production' || !this.configService.get('TWILIO_ACCOUNT_SID')) {
      this.logger.log(`[DEV] SMS to ${phone}: ${message}`);
      return;
    }

    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: fromNumber!,
          Body: message,
        }),
        {
          auth: {
            username: accountSid!,
            password: authToken,
          },
          timeout: 10000,
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send SMS: ${message}`);
      throw new AppError(`SMS send failed: ${message}`, 'SMS_SEND_FAILED');
    }
  }

  /**
   * Request OTP for driver
   */
  async requestDriverOTP(phone: string): Promise<OTPResult> {
    // Check rate limit
    const rateCheck = this.checkOtpRateLimit(phone);
    if (!rateCheck.allowed) {
      this.logger.warn(`OTP rate limit exceeded for ${phone}`);
      return {
        success: false,
        expiresIn: 0,
        message: `Too many OTP requests. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
      };
    }

    try {
      // Generate 6-digit cryptographically secure OTP
      const otp = this.generateOtp();
      const expiresIn = Math.floor(OTP_TTL_MS / 1000);

      // Store hashed OTP (never store plaintext)
      const key = `driver:${phone}`;
      const hash = this.hashOtp(otp, phone);

      otpStore.set(key, {
        hash,
        expires: Date.now() + OTP_TTL_MS,
        attempts: 0
      });

      // Send via SMS
      await this.sendSMS(phone, `Your ReZ Ride Driver OTP is: ${otp}. Valid for 5 minutes.`);

      this.logger.log(`Driver OTP sent to ${phone} (hashed)`);

      return {
        success: true,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to send driver OTP: ${error.message}`);
      return {
        success: false,
        expiresIn: 0,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Refresh token - wrapper for route compatibility
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const result = await this.refreshAccessToken(refreshToken);
    if (result.token) {
      return { success: true, token: result.token };
    }
    return { success: false, message: 'Failed to refresh token' };
  }

  /**
   * Logout user - invalidate tokens
   */
  async logout(userId: string): Promise<void> {
    // In a production system, we'd invalidate the token in Redis
    // For now, we just log the logout
    this.logger.log(`User ${userId} logged out`);
    // Invalidate any active sessions for this user
    // This would be implemented with a token blacklist in Redis
  }
}
