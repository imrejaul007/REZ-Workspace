import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

export interface RezJwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RezValidatedPrincipal {
  rezUserId: string;
  rezRole: string;
  rezMerchantId: string | null;
}

export const REZ_MERCHANT_STRATEGY = 'rez-merchant';

const ALLOWED_REZ_ROLES = new Set(['merchant', 'merchant_admin']);

@Injectable()
export class RezMerchantStrategy extends PassportStrategy(Strategy, REZ_MERCHANT_STRATEGY) {
  private readonly logger = new Logger(RezMerchantStrategy.name);
  private readonly rezBackendUrl: string;
  private readonly rezInternalToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('REZ_JWT_SECRET');
    if (!secret) {
      throw new Error('REZ_JWT_SECRET environment variable is required for the REZ auth bridge');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
    this.rezBackendUrl = configService.get<string>('REZ_BACKEND_URL', 'https://api.rezapp.com/api');
    this.rezInternalToken = configService.get<string>('REZ_INTERNAL_TOKEN', '');
  }

  async validate(payload: RezJwtPayload): Promise<RezValidatedPrincipal> {
    if (!ALLOWED_REZ_ROLES.has(payload.role)) {
      this.logger.warn(`RezBridge: rejected token for non-merchant role "${payload.role}" (userId=${payload.userId})`);
      throw new UnauthorizedException('Only REZ merchant accounts may use this bridge');
    }

    await this.checkBlacklist(payload.userId);

    // Resolve the merchant profile _id from the local DB (populated after SSO bridge)
    const rezMerchantId = await this.resolveRezMerchantId(payload.userId);

    return {
      rezUserId: payload.userId,
      rezRole: payload.role,
      rezMerchantId,
    };
  }

  /**
   * Look up the REZ merchant profile _id stored during the SSO bridge.
   * Checks Profile.rezUserId → Profile.rezMerchantId
   * Falls back to User.rezMerchantId (set by webhook-created accounts)
   */
  private async resolveRezMerchantId(rezUserId: string): Promise<string | null> {
    try {
      const profile = await this.prisma.profile.findFirst({
        where: { rezUserId },
        select: { rezMerchantId: true },
      });
      if (profile?.rezMerchantId) return profile.rezMerchantId;

      // Fallback: user created by webhook may have rezMerchantId on User directly
      const user = await this.prisma.user.findFirst({
        where: { rezMerchantId: rezUserId },
        select: { rezMerchantId: true },
      });
      return user?.rezMerchantId ?? null;
    } catch (err) {
      this.logger.warn(`Could not resolve rezMerchantId for ${rezUserId}: ${(err as unknown)?.message}`);
      return null;
    }
  }

  private async checkBlacklist(userId: string): Promise<void> {
    if (!this.rezInternalToken) {
      this.logger.debug('RezBridge: REZ_INTERNAL_TOKEN not set, skipping blacklist check');
      return;
    }
    try {
      await axios.get(`${this.rezBackendUrl}/internal/auth/token-status/${userId}`, {
        headers: { Authorization: `Bearer ${this.rezInternalToken}` },
        timeout: 2000,
      });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        this.logger.warn(`RezBridge: blacklist check rejected userId=${userId} (HTTP ${status})`);
        throw new UnauthorizedException('REZ token has been revoked');
      }
      this.logger.warn(`RezBridge: blacklist check unavailable for userId=${userId} — proceeding`);
    }
  }
}
