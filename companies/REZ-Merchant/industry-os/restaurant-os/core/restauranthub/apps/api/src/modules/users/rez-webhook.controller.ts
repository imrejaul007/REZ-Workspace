import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface IncomingRezMerchant {
  rezMerchantId: string;
  email: string;
  name: string;
  storeName: string;
  cuisineType?: string;
  city?: string;
  logo?: string;
  activeSince?: string;
}

@Controller('webhooks/rez')
export class RezWebhookController {
  private readonly logger = new Logger(RezWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private validateToken(token: string | undefined): void {
    const expected = this.configService.get<string>('REZ_INTERNAL_TOKEN');
    if (!expected || !token || token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
  }

  @Post('merchant-created')
  @HttpCode(HttpStatus.OK)
  async merchantCreated(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: IncomingRezMerchant,
  ): Promise<{ restopapaUserId: string; isNew: boolean }> {
    this.validateToken(token);

    const { rezMerchantId, email, name, storeName, cuisineType, city, logo } = body;

    const existing = await this.prisma.user.findFirst({
      where: { rezMerchantId },
    });

    if (existing) {
      this.logger.log(`REZ merchant ${rezMerchantId} already has account ${existing.id}`);
      return { restopapaUserId: existing.id, isNew: false };
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] ?? storeName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash: '',
        role: 'RESTAURANT',
        isActive: true,
        isVerified: true,
        rezMerchantId,
        rezVerified: true,
        consentTier: 0,
        appSource: 'rez_webhook',
        profile: {
          create: {
            firstName,
            lastName,
            avatar: logo ?? null,
            city: city ?? null,
          },
        },
        restaurant: {
          create: {
            name: storeName,
            cuisineType: cuisineType ? [cuisineType] : [],
            logo: logo ?? null,
          },
        },
      },
    });

    this.logger.log(`Created RestoPapa account ${created.id} for REZ merchant ${rezMerchantId}`);
    return { restopapaUserId: created.id, isNew: true };
  }

  @Post('merchant-updated')
  @HttpCode(HttpStatus.OK)
  async merchantUpdated(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: IncomingRezMerchant,
  ): Promise<{ restopapaUserId: string; updated: boolean }> {
    this.validateToken(token);

    const { rezMerchantId, name, storeName, cuisineType, city, logo } = body;

    const user = await this.prisma.user.findFirst({
      where: { rezMerchantId },
      include: { profile: true, restaurant: true },
    });

    if (!user) {
      this.logger.warn(`No account found for REZ merchant ${rezMerchantId} — skipping update`);
      return { restopapaUserId: '', updated: false };
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] ?? storeName;
    const lastName = nameParts.slice(1).join(' ') || '';

    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { userId: user.id },
        data: {
          firstName,
          lastName,
          avatar: logo ?? undefined,
          city: city ?? undefined,
        },
      }),
      this.prisma.restaurant.update({
        where: { userId: user.id },
        data: {
          name: storeName,
          cuisineType: cuisineType ? [cuisineType] : undefined,
          logo: logo ?? undefined,
        },
      }),
    ]);

    this.logger.log(`Synced REZ merchant ${rezMerchantId} → account ${user.id}`);
    return { restopapaUserId: user.id, updated: true };
  }
}
