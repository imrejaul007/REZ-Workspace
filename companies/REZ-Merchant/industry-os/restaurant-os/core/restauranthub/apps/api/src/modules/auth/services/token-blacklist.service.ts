import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async blacklistToken(token: string, userId: string, reason: string = 'logout'): Promise<void> {
    try {
      // Hash the token for secure storage (field is named `token` in schema)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      await this.prisma.blacklistedToken.create({
        data: {
          token: hashedToken,
          userId,
          reason,
          expiresAt: new Date(Date.now() + this.getTokenExpirationMs()),
        },
      });

      this.logger.log(`Token blacklisted for user ${userId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error('Failed to blacklist token:', error);
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const blacklistedToken = await this.prisma.blacklistedToken.findFirst({
        where: {
          token: hashedToken,
          expiresAt: { gt: new Date() },
        },
      });

      return !!blacklistedToken;
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  async blacklistAllUserTokens(userId: string, reason: string = 'security'): Promise<void> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
      });

      for (const session of sessions) {
        await this.blacklistToken(session.token, userId, reason);
      }

      await this.prisma.session.deleteMany({ where: { userId } });
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      this.logger.log(`All tokens blacklisted for user ${userId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error('Failed to blacklist all user tokens:', error);
      throw error;
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.log(`Cleaned up ${result.count} expired blacklisted tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  private getTokenExpirationMs(): number {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');
    if (expiresIn.endsWith('m')) return parseInt(expiresIn) * 60 * 1000;
    if (expiresIn.endsWith('h')) return parseInt(expiresIn) * 60 * 60 * 1000;
    if (expiresIn.endsWith('d')) return parseInt(expiresIn) * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
  }
}
