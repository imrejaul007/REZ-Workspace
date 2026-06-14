import { Injectable, CanActivate, ExecutionContext, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const endpoint = request.path;

    // Check if IP is blocked
    if (await this.isIpBlocked(ip)) {
      this.logger.warn(`Blocked request from banned IP: ${ip}`, {
        ip,
        userAgent,
        endpoint,
        severity: 'HIGH'
      });
      throw new HttpException('IP address is temporarily blocked due to suspicious activity', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Check attempt count for this IP
    const attemptCount = await this.getAttemptCount(ip, endpoint);
    const maxAttempts = this.getMaxAttemptsForEndpoint(endpoint);

    if (attemptCount >= maxAttempts) {
      await this.blockIp(ip, 'Too many failed attempts');
      this.logger.error(`IP blocked due to excessive attempts: ${ip}`, {
        ip,
        userAgent,
        endpoint,
        attemptCount,
        maxAttempts,
        severity: 'CRITICAL'
      });
      throw new HttpException('Too many attempts. IP address has been temporarily blocked.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  async recordFailedAttempt(ip: string, endpoint: string, email?: string): Promise<void> {
    try {
      await this.prisma.failedAttempt.create({
        data: {
          ipAddress: ip,
          endpoint,
          email: email || null,
          attemptedAt: new Date(),
        },
      });

      this.logger.warn(`Failed attempt recorded`, {
        ip,
        endpoint,
        email: email ? '[EMAIL_PROVIDED]' : null,
      });
    } catch (error) {
      this.logger.error('Failed to record failed attempt:', error);
    }
  }

  async recordSuccessfulAttempt(ip: string, endpoint: string, email?: string): Promise<void> {
    try {
      // Clear failed attempts for this IP and endpoint on successful login
      await this.prisma.failedAttempt.deleteMany({
        where: {
          ipAddress: ip,
          endpoint,
          email: email || undefined,
          attemptedAt: {
            gte: new Date(Date.now() - this.getWindowMs()),
          },
        },
      });

      this.logger.log(`Successful attempt - cleared failed attempts for IP: ${ip}`);
    } catch (error) {
      this.logger.error('Failed to clear failed attempts:', error);
    }
  }

  private async isIpBlocked(ip: string): Promise<boolean> {
    try {
      const blockedIp = await this.prisma.blockedIp.findFirst({
        where: {
          ipAddress: ip,
          blockedUntil: {
            gt: new Date(),
          },
        },
      });

      return !!blockedIp;
    } catch (error) {
      this.logger.error('Failed to check IP block status:', error);
      return false;
    }
  }

  private async getAttemptCount(ip: string, endpoint: string): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - this.getWindowMs());

      const count = await this.prisma.failedAttempt.count({
        where: {
          ipAddress: ip,
          endpoint,
          attemptedAt: {
            gte: windowStart,
          },
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get attempt count:', error);
      return 0;
    }
  }

  private async blockIp(ip: string, reason: string): Promise<void> {
    try {
      const blockDuration = this.getBlockDuration();

      await this.prisma.blockedIp.upsert({
        where: { ipAddress: ip },
        update: {
          reason,
          blockedAt: new Date(),
          blockedUntil: new Date(Date.now() + blockDuration),
          blockCount: { increment: 1 },
        },
        create: {
          ipAddress: ip,
          reason,
          blockedAt: new Date(),
          blockedUntil: new Date(Date.now() + blockDuration),
          blockCount: 1,
        },
      });

      this.logger.error(`IP blocked: ${ip} for ${blockDuration}ms. Reason: ${reason}`, {
        ip,
        reason,
        duration: blockDuration,
        severity: 'CRITICAL'
      });
    } catch (error) {
      this.logger.error('Failed to block IP:', error);
    }
  }

  private getMaxAttemptsForEndpoint(endpoint: string): number {
    if (endpoint.includes('/auth/login')) {
      return this.configService.get('BRUTE_FORCE_LOGIN_MAX_ATTEMPTS', 5);
    } else if (endpoint.includes('/auth/forgot-password')) {
      return this.configService.get('BRUTE_FORCE_PASSWORD_RESET_MAX_ATTEMPTS', 3);
    } else if (endpoint.includes('/auth/')) {
      return this.configService.get('BRUTE_FORCE_AUTH_MAX_ATTEMPTS', 10);
    }

    return this.configService.get('BRUTE_FORCE_DEFAULT_MAX_ATTEMPTS', 20);
  }

  private getWindowMs(): number {
    return this.configService.get('BRUTE_FORCE_WINDOW_MS', 15 * 60 * 1000); // 15 minutes
  }

  private getBlockDuration(): number {
    return this.configService.get('BRUTE_FORCE_BLOCK_DURATION_MS', 60 * 60 * 1000); // 1 hour
  }

  // Cleanup expired records
  async cleanupExpiredRecords(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

      const [deletedAttempts, deletedBlocks] = await Promise.all([
        this.prisma.failedAttempt.deleteMany({
          where: {
            attemptedAt: { lt: cutoffDate },
          },
        }),
        this.prisma.blockedIp.deleteMany({
          where: {
            blockedUntil: { lt: new Date() },
          },
        }),
      ]);

      this.logger.log(`Cleanup completed: ${deletedAttempts.count} attempts, ${deletedBlocks.count} blocks removed`);
    } catch (error) {
      // P2021 = table does not exist — guard against un-migrated DB in dev/staging
      // P1001 = can't reach database — network issue, not a code bug
      const safeCodes = ['P2021', 'P1001'];
      if (safeCodes.includes(error?.code)) {
        this.logger.warn(`Brute-force cleanup skipped: table or DB unavailable (${error?.code})`);
        return;
      }
      this.logger.error('Failed to cleanup expired records:', error);
    }
  }
}