/**
 * RABTUL Auth Service Integration
 * Replaces local Passport/JWT with RABTUL Auth Service
 *
 * Uses RABTUL for:
 * - OTP-based authentication (SMS/WhatsApp)
 * - OAuth providers (Google, etc.)
 * - Token verification
 * - User identity management
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export interface RABTULUser {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export interface AuthResult {
  user: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
    name?: string;
    restaurantId?: string;
    employeeId?: string;
    vendorId?: string;
  };
  token: string;
  refreshToken?: string;
}

@Injectable()
export class RABTULAuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Make authenticated request to RABTUL Auth Service
   */
  private async rabtulRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${AUTH_SERVICE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new BadRequestException(error.message || `RABTUL Auth error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('RABTUL Auth Service unavailable');
    }
  }

  /**
   * Send OTP to phone number via RABTUL
   */
  async sendOTP(phone: string): Promise<{ message: string; expiresIn: number }> {
    // Validate phone format (Indian phone numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!phoneRegex.test(normalizedPhone)) {
      throw new BadRequestException('Invalid phone number format');
    }

    const result = await this.rabtulRequest('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: normalizedPhone }),
    });

    return {
      message: result.message || 'OTP sent successfully',
      expiresIn: result.expiresIn || 300, // 5 minutes default
    };
  }

  /**
   * Verify OTP and authenticate via RABTUL
   */
  async verifyOTP(phone: string, otp: string, role: string = 'restaurant'): Promise<AuthResult> {
    const normalizedPhone = phone.replace(/\D/g, '');

    // Verify OTP with RABTUL
    const result = await this.rabtulRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: normalizedPhone, otp }),
    });

    if (!result.success || !result.token) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Find or create local user linked to RABTUL
    const user = await this.findOrCreateLocalUser(result.user, role);

    // Generate local session token (for backward compatibility)
    const localToken = this.generateLocalToken(user);

    return {
      user: this.sanitizeUser(user),
      token: localToken,
      refreshToken: result.token,
    };
  }

  /**
   * Register with email/password via RABTUL (OAuth flow)
   */
  async registerWithOAuth(provider: 'google' | 'email', providerToken?: string, email?: string, password?: string): Promise<AuthResult> {
    let result: any;

    if (provider === 'google') {
      result = await this.rabtulRequest('/api/auth/oauth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ token: providerToken }),
      });
    } else if (provider === 'email') {
      result = await this.rabtulRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } else {
      throw new BadRequestException('Unsupported provider');
    }

    if (!result.success || !result.token) {
      throw new BadRequestException('Registration failed');
    }

    // Find or create local user linked to RABTUL
    const user = await this.findOrCreateLocalUser(result.user, 'restaurant');

    const localToken = this.generateLocalToken(user);

    return {
      user: this.sanitizeUser(user),
      token: localToken,
      refreshToken: result.token,
    };
  }

  /**
   * Verify token with RABTUL and get user info
   */
  async verifyToken(token: string): Promise<RABTULUser | null> {
    try {
      const result = await this.rabtulRequest('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      return result.user || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate internal service token
   */
  async validateInternalToken(): Promise<boolean> {
    try {
      const result = await this.rabtulRequest('/api/auth/internal/validate', {
        headers: { 'X-Internal-Token': INTERNAL_SERVICE_TOKEN },
      });
      return result.valid ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Link existing local user to RABTUL account
   */
  async linkToRABTUL(userId: string, rabtulUserId: string, phone?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rabtulUserId,
        isPhoneVerified: phone ? true : undefined,
      },
    });
  }

  /**
   * Unlink RABTUL account from local user
   */
  async unlinkFromRABTUL(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rabtulUserId: null,
        isPhoneVerified: false,
      },
    });
  }

  /**
   * Find or create local user linked to RABTUL user
   */
  private async findOrCreateLocalUser(rabtulUser: RABTULUser, role: string): Promise<any> {
    // Try to find existing user by RABTUL ID or phone
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { rabtulUserId: rabtulUser.id },
          ...(rabtulUser.phone ? [{ phone: rabtulUser.phone }] : []),
        ],
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    if (!user) {
      // Generate a random password hash for RABTUL users (they use OTP, not password)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const saltRounds = 1; // Fast since it's not used for login
      const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

      // Create new local user linked to RABTUL
      user = await this.prisma.user.create({
        data: {
          email: rabtulUser.email || `${rabtulUser.id}@restopapa.local`,
          phone: rabtulUser.phone,
          passwordHash,
          rabtulUserId: rabtulUser.id,
          isPhoneVerified: !!rabtulUser.phone,
          isActive: true,
          role: role as any,
        },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });

      // Record analytics
      await this.prisma.recordAnalyticsEvent(user.id, 'user_registered_via_rabtul', { role });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Record analytics
    await this.prisma.recordAnalyticsEvent(user.id, 'user_login_via_rabtul', { role: user.role });

    return user;
  }

  /**
   * Generate local JWT token for backward compatibility
   */
  private generateLocalToken(user: any): string {
    // In production, this should use a shared secret with RABTUL
    // For now, we'll use a simple implementation
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      rabtulUserId: user.rabtulUserId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    // Simple base64 encoding for development
    // In production, use proper JWT signing
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from(`restopapa-${user.id}`).toString('base64url');

    return `${base64Payload}.${signature}`;
  }

  /**
   * Sanitize user object (remove sensitive fields)
   */
  sanitizeUser(user: any) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Get profile for authenticated user
   */
  async getProfile(userId: string) {
    const user = await this.prisma.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update allowed fields
    const updateFields: any = {};

    if (updateData.phone && updateData.phone !== user.phone) {
      updateFields.phone = updateData.phone;
      updateFields.isPhoneVerified = false;
    }

    if (updateData.name) {
      updateFields.name = updateData.name;
    }

    if (Object.keys(updateFields).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateFields,
      });
    }

    // Update role-specific profile
    await this.updateRoleSpecificProfile(userId, user.role, updateData);

    return this.getProfile(userId);
  }

  private async updateRoleSpecificProfile(userId: string, role: string, updateData: any) {
    switch (role) {
      case 'restaurant':
        if (updateData.restaurant) {
          await this.prisma.restaurant.update({
            where: { userId },
            data: updateData.restaurant,
          });
        }
        break;

      case 'employee':
        if (updateData.employee) {
          await this.prisma.employee.update({
            where: { userId },
            data: updateData.employee,
          });
        }
        break;

      case 'vendor':
        if (updateData.vendor) {
          await this.prisma.vendor.update({
            where: { userId },
            data: updateData.vendor,
          });
        }
        break;
    }
  }
}
