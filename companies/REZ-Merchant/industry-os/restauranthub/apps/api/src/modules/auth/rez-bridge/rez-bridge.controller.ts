/**
 * RezBridgeController — POST /auth/rez-bridge
 *
 * Allows a REZ merchant to exchange their REZ-issued JWT for a
 * RestoPapa-issued JWT without creating a separate account.
 *
 * Required ENV vars (configure in .env.local or deployment secrets):
 *   REZ_JWT_SECRET       — same value as rezbackend JWT_SECRET
 *   REZ_BACKEND_URL      — e.g. https://api.rezapp.com/api
 *   REZ_INTERNAL_TOKEN   — INTERNAL_SERVICE_TOKEN from rezbackend
 */

import {
  Controller,
  Post,
  Body,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../../prisma/prisma.service';
import { RezBridgeRequestDto, RezBridgeResponseDto } from './rez-bridge.dto';
import { RezMerchantIdentity } from './rez-merchant-identity.interface';
import { RezJwtPayload } from './rez-merchant.strategy';

/** Roles permitted to cross the bridge */
const ALLOWED_REZ_ROLES = new Set(['merchant', 'merchant_admin']);

/** Shape of the REZ /api/merchant/profile response we care about */
interface RezMerchantProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  storeId?: string;
}

@Controller('auth')
export class RezBridgeController {
  private readonly logger = new Logger(RezBridgeController.name);
  private readonly rezBackendUrl: string;
  private readonly rezInternalToken: string;
  private readonly rezJwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = this.configService.get<string>('REZ_JWT_SECRET');
    if (!secret) {
      throw new Error('REZ_JWT_SECRET is required for the REZ auth bridge');
    }
    this.rezJwtSecret = secret;
    this.rezBackendUrl = this.configService.get<string>('REZ_BACKEND_URL', 'https://api.rezapp.com/api');
    this.rezInternalToken = this.configService.get<string>('REZ_INTERNAL_TOKEN', '');
  }

  /**
   * POST /auth/rez-bridge
   *
   * Flow:
   *   1. Verify the REZ JWT locally (no network call needed for signature check).
   *   2. Fetch the merchant profile from REZ backend to get merchantId + email.
   *   3. Upsert a RestoPapa user linked to this REZ merchant.
   *   4. Issue a RestoPapa JWT.
   *   5. Return token + identity + isNewProfile flag.
   */
  @Post('rez-bridge')
  @HttpCode(HttpStatus.OK)
  async exchangeToken(@Body() dto: RezBridgeRequestDto): Promise<RezBridgeResponseDto> {
    // Step 1 — Verify the REZ JWT signature and basic claims
    const rezPayload = this.verifyRezToken(dto.rezToken);

    // Step 2 — Fetch merchant profile from REZ (circuit-breaks if unreachable)
    const merchantProfile = await this.fetchRezMerchantProfile(dto.rezToken, rezPayload.userId);

    // Step 3 — Upsert the RestoPapa user record
    const { user, isNewProfile } = await this.upsertUser(rezPayload, merchantProfile);

    // Step 4 — Issue a RestoPapa JWT
    const accessToken = this.issueRestoPapaToken(user.id, user.email, user.role);

    // Step 5 — Build and return the response
    const identity: RezMerchantIdentity = {
      rezUserId: rezPayload.userId,
      rezMerchantId: merchantProfile._id,
      rezStoreId: merchantProfile.storeId,
      email: merchantProfile.email,
      name: merchantProfile.name,
      role: rezPayload.role as 'merchant' | 'merchant_admin',
      restopapaUserId: user.id,
      rezVerified: true,
    };

    this.logger.log(
      `RezBridge: merchant ${merchantProfile._id} authenticated — RestoPapa userId=${user.id}, isNew=${isNewProfile}`,
    );

    return { accessToken, user: identity, isNewProfile };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Verifies the REZ JWT using the shared secret.
   * Throws UnauthorizedException on unknown validation failure.
   */
  private verifyRezToken(token: string): RezJwtPayload {
    let payload: RezJwtPayload;

    try {
      payload = jwt.verify(token, this.rezJwtSecret, { algorithms: ['HS256'] }) as RezJwtPayload;
    } catch (err: unknown) {
      this.logger.warn(`RezBridge: invalid REZ token — ${err instanceof Error ? err.message : String(err)}`);
      throw new UnauthorizedException('Invalid or expired REZ token');
    }

    if (!ALLOWED_REZ_ROLES.has(payload.role)) {
      this.logger.warn(`RezBridge: role "${payload.role}" not permitted (userId=${payload.userId})`);
      throw new UnauthorizedException('Only REZ merchant accounts may use this bridge');
    }

    return payload;
  }

  /**
   * Fetches the merchant profile from the REZ backend.
   *
   * Circuit-break behaviour:
   *   - If REZ backend is unreachable (network error / timeout) → throw ServiceUnavailableException.
   *   - If REZ returns 401/403 → throw UnauthorizedException (token revoked or insufficient perms).
   *   - Other 4xx/5xx → throw ServiceUnavailableException.
   */
  private async fetchRezMerchantProfile(token: string, userId: string): Promise<RezMerchantProfile> {
    try {
      // NOTE: Uses /internal/restopapa/merchant-profile (not /merchant/profile) so the request
      // bypasses nginx's /api/merchant/* → merchant-service routing and hits the monolith directly.
      const response = await axios.get<{ success: boolean; data: RezMerchantProfile }>(
        `${this.rezBackendUrl}/internal/restopapa/merchant-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-internal-token': this.rezInternalToken,
          },
          timeout: 5000,
        },
      );

      const profile = response.data?.data;
      if (!profile?._id) {
        throw new ServiceUnavailableException('REZ backend returned an invalid merchant profile');
      }

      return profile;
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnauthorizedException) {
        throw error;
      }

      const axiosErr = error as AxiosError;
      const status = axiosErr?.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(`RezBridge: profile fetch rejected (HTTP ${status}) for userId=${userId}`);
        throw new UnauthorizedException('REZ token was rejected by the REZ backend');
      }

      // Network errors, timeouts, 5xx — circuit break gracefully
      this.logger.error(
        `RezBridge: REZ backend unreachable for userId=${userId} — ${axiosErr?.message ?? 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        'REZ backend is temporarily unavailable. Please try again shortly.',
      );
    }
  }

  /**
   * Upserts a RestoPapa user record for the given REZ merchant.
   *
   * Lookup key: profile.rezMerchantId field (added via migration).
   * Falls back to email match for safety, then creates a new record.
   *
   * Sets rezVerified=true and keeps email/name in sync with REZ profile.
   */
  private async upsertUser(
    payload: RezJwtPayload,
    profile: RezMerchantProfile,
  ): Promise<{ user; isNewProfile: boolean }> {
    // Try 1: find user via Profile.rezMerchantId (set by SSO bridge)
    let existingUser = await this.prisma.user.findFirst({
      where: { profile: { rezMerchantId: profile._id } },
      include: { profile: true },
    });

    // Try 2: find user via User.rezMerchantId (webhook-created accounts store it here)
    if (!existingUser) {
      existingUser = await this.prisma.user.findFirst({
        where: { rezMerchantId: profile._id },
        include: { profile: true },
      });
    }

    // Try 3: match by email as last resort
    if (!existingUser) {
      existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
        include: { profile: true },
      });
    }

    if (existingUser) {
      // Update the REZ fields to keep them in sync
      await Promise.all([
        this.prisma.profile.update({
          where: { userId: existingUser.id },
          data: {
            rezMerchantId: profile._id,
            rezUserId: payload.userId,
            rezStoreId: profile.storeId ?? null,
            rezVerified: true,
            firstName: (profile.name ?? '').split(' ')[0] || existingUser.profile?.firstName,
            lastName: (profile.name ?? '').split(' ').slice(1).join(' ') || existingUser.profile?.lastName,
          },
        }),
        this.prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginApp: 'rez_bridge', lastLoginAt: new Date() },
        }),
      ]);

      return { user: { ...existingUser, email: profile.email }, isNewProfile: false };
    }

    // Create a new RestoPapa user for this REZ merchant
    const newUser = await this.prisma.user.create({
      data: {
        email: profile.email,
        // Merchants authenticated via REZ bridge have no local password.
        // A placeholder hash is stored; local password login is blocked for these accounts.
        passwordHash: `rez_bridge_no_local_password:${payload.userId}`,
        role: 'RESTAURANT',
        isActive: true,
        isVerified: true,
        appSource: 'rez_bridge',
        lastLoginApp: 'rez_bridge',
        profile: {
          create: {
            firstName: (profile.name ?? 'Merchant').split(' ')[0],
            lastName: (profile.name ?? '').split(' ').slice(1).join(' '),
            rezMerchantId: profile._id,
            rezUserId: payload.userId,
            rezStoreId: profile.storeId ?? null,
            rezVerified: true,
          },
        },
      },
      include: { profile: true },
    });

    return { user: newUser, isNewProfile: true };
  }

  /**
   * Issues a RestoPapa-scoped JWT.
   * Uses the same JWT_SECRET / JWT_EXPIRES_IN config as the main AuthModule.
   */
  private issueRestoPapaToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      },
    );
  }
}
