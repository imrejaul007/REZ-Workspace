/**
 * RABTUL Auth Guard
 * Replaces Passport JWT Guard with RABTUL Auth Service verification
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

@Injectable()
export class RABTULAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with RABTUL Auth Service
      const user = await this.verifyToken(token);

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Get local user by RABTUL user ID
      const localUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { rabtulUserId: user.id },
            { phone: user.phone },
            { email: user.email },
          ],
        },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });

      if (!localUser) {
        throw new UnauthorizedException('User not found in system');
      }

      if (!localUser.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user to request
      request.user = {
        id: localUser.id,
        email: localUser.email,
        phone: localUser.phone,
        role: localUser.role,
        rabtulUserId: user.id,
        restaurant: localUser.restaurant,
        employee: localUser.employee,
        vendor: localUser.vendor,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.user || null;
    } catch {
      return null;
    }
  }
}
