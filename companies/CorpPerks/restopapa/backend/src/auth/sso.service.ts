import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

export interface ReZUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  businessName?: string;
  ownerName?: string;
}

export interface ReZTokenValidation {
  valid: boolean;
  user?: ReZUser;
  error?: string;
}

@Injectable()
export class SSOService {
  private readonly logger = new Logger(SSOService.name);
  private readonly rezApiUrl: string;
  private readonly rezApiKey: string;
  private readonly ssoEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private config: ConfigService,
  ) {
    this.rezApiUrl = this.config.get<string>('REZ_API_URL', 'https://api.rez.money');
    this.rezApiKey = this.config.get<string>('REZ_API_KEY', '');
    this.ssoEnabled = this.config.get<string>('SSO_ENABLED', 'false') === 'true';
  }

  /**
   * Validate a ReZ Merchant token by calling their API
   */
  async validateReZToken(token: string): Promise<ReZUser> {
    if (!this.ssoEnabled) {
      throw new UnauthorizedException('SSO is not enabled');
    }

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const response = await fetch(`${this.rezApiUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': this.rezApiKey,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.warn(`ReZ token validation failed: ${response.status} - ${errorBody}`);
        throw new UnauthorizedException('Invalid ReZ token');
      }

      const result = await response.json() as { user?: ReZUser; valid?: boolean; error?: string };

      if (!result.valid || !result.user) {
        throw new UnauthorizedException('Token validation failed');
      }

      return result.user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`ReZ token validation error: ${error}`);
      throw new UnauthorizedException('Failed to validate ReZ token');
    }
  }

  /**
   * Get or create a user from ReZ Merchant data
   */
  async getOrCreateUser(rezUser: ReZUser) {
    // First try to find by external ID (most reliable for SSO)
    let user = await this.prisma.user.findFirst({
      where: {
        externalId: rezUser.id,
        source: 'rez_merchant',
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    // Fallback: find by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: rezUser.email },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });

      // If found by email but not SSO user, update it to be an SSO user
      if (user && !user.source) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            source: 'rez_merchant',
            externalId: rezUser.id,
            isEmailVerified: true, // Already verified by ReZ
          },
          include: {
            restaurant: true,
            employee: true,
            vendor: true,
          },
        });
      }
    }

    // Create new user if not found
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: rezUser.email,
          phone: rezUser.phone,
          role: 'restaurant',
          source: 'rez_merchant',
          externalId: rezUser.id,
          isEmailVerified: true, // Already verified by ReZ
          passwordHash: '', // No password for SSO users
        },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });

      // Create restaurant profile if business info provided
      if (rezUser.businessName || rezUser.ownerName) {
        await this.prisma.restaurant.create({
          data: {
            userId: user.id,
            businessName: rezUser.businessName || rezUser.name || 'ReZ Restaurant',
            ownerName: rezUser.ownerName || rezUser.name || '',
            category: 'casual_dining',
          },
        });

        // Refresh user with restaurant data
        user = await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            restaurant: true,
            employee: true,
            vendor: true,
          },
        });
      }

      // Record analytics event
      await this.prisma.recordAnalyticsEvent(
        user!.id,
        'user_sso_registered',
        { source: 'rez_merchant' },
      );
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user!.id },
      data: { lastLogin: new Date() },
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      user!.id,
      'user_sso_login',
      { source: 'rez_merchant' },
    );

    return user;
  }

  /**
   * Check if SSO is enabled
   */
  isEnabled(): boolean {
    return this.ssoEnabled;
  }

  /**
   * Find user by external ID
   */
  async findByExternalId(externalId: string) {
    return this.prisma.user.findFirst({
      where: {
        externalId,
        source: 'rez_merchant',
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  /**
   * Link an existing account to ReZ Merchant SSO
   */
  async linkAccount(userId: string, rezUser: ReZUser) {
    // Check if this external ID is already linked
    const existingUser = await this.findByExternalId(rezUser.id);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('This ReZ account is already linked to another user');
    }

    // Update the user
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        source: 'rez_merchant',
        externalId: rezUser.id,
        isEmailVerified: true,
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }
}
