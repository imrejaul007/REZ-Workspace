import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SecureTokenService {
  private readonly logger = new Logger(SecureTokenService.name);

  constructor(private prisma: PrismaService) {}

  async storePasswordResetToken(userId: string, token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store reset token: ${(error as unknown).message}`);
    }
  }

  async validatePasswordResetToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { resetTokenHash: true, resetTokenExpiresAt: true },
      });

      if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
        return false;
      }

      const isExpired = user.resetTokenExpiresAt < new Date();
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const isValid = crypto.timingSafeEqual(
        Buffer.from(user.resetTokenHash, 'hex'),
        Buffer.from(tokenHash, 'hex'),
      );

      return isValid && !isExpired;
    } catch (error) {
      this.logger.error(`Failed to validate reset token: ${(error as unknown).message}`);
      return false;
    }
  }

  async deletePasswordResetToken(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { resetTokenHash: null, resetTokenExpiresAt: null },
      });
    } catch (error) {
      this.logger.error(`Failed to delete reset token: ${(error as unknown).message}`);
    }
  }
}
