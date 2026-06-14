import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tokenBlacklist: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    // Check token blacklist — rejects tokens invalidated by logout
    const authHeader: string = req.headers?.authorization ?? '';
    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (rawToken && await this.tokenBlacklist.isTokenBlacklisted(rawToken)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        restaurant: { select: { id: true } },
        employee: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      restaurantId: user.restaurant?.id ?? null,
      employeeId: user.employee?.id ?? null,
    };
  }
}
