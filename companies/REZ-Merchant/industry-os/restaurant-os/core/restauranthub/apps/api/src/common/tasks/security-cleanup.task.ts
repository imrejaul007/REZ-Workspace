import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenBlacklistService } from '../../modules/auth/services/token-blacklist.service';
import { SessionService } from '../services/session.service';
import { BruteForceGuard } from '../guards/brute-force.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityCleanupTask {
  private readonly logger = new Logger(SecurityCleanupTask.name);

  constructor(
    private tokenBlacklistService: TokenBlacklistService,
    private sessionService: SessionService,
    private bruteForceGuard: BruteForceGuard,
    private prisma: PrismaService,
  ) {}

  // Run every hour to clean up expired tokens
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    try {
      this.logger.log('Starting expired token cleanup...');
      await this.tokenBlacklistService.cleanupExpiredTokens();
      this.logger.log('Expired token cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  // Run every 30 minutes to clean up expired sessions
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredSessions() {
    try {
      this.logger.log('Starting expired session cleanup...');
      await this.sessionService.cleanupExpiredSessions();
      this.logger.log('Expired session cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  // Run every 6 hours to clean up brute force records
  @Cron('0 */6 * * *')
  async cleanupBruteForceRecords() {
    try {
      this.logger.log('Starting brute force record cleanup...');
      await this.bruteForceGuard.cleanupExpiredRecords();
      this.logger.log('Brute force record cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup brute force records:', error);
    }
  }

  // Run daily at 2 AM to clean up old audit logs
  @Cron('0 2 * * *')
  async cleanupOldAuditLogs() {
    try {
      this.logger.log('Starting audit log cleanup...');

      const retentionDays = 90; // Keep logs for 90 days
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Clean up old failed attempts (keep recent ones for analysis)
      const deletedAttempts = await this.prisma.failedAttempt.deleteMany({
        where: {
          attemptedAt: { lt: cutoffDate },
        },
      });

      // Clean up very old sessions (keep some for analysis)
      const deletedSessions = await this.prisma.session.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          expiresAt: { lt: new Date() }, // Only delete expired ones
        },
      });

      this.logger.log(`Audit log cleanup completed: ${deletedAttempts.count} attempts, ${deletedSessions.count} sessions removed`);
    } catch (error) {
      // P2021 = table does not exist — guard against un-migrated DB
      // P1001 = can't reach database — network issue, not a code bug
      const safeCodes = ['P2021', 'P1001'];
      if (safeCodes.includes(error?.code)) {
        this.logger.warn(`Audit cleanup skipped: table or DB unavailable (${error?.code})`);
        return;
      }
      this.logger.error('Failed to cleanup audit logs:', error);
    }
  }

  // Run weekly to generate security reports
  @Cron(CronExpression.EVERY_WEEK)
  async generateSecurityReport() {
    try {
      this.logger.log('Generating weekly security report...');

      const [
        sessionStats,
        bruteForceStats,
        suspiciousActivityCount
      ] = await Promise.all([
        this.sessionService.getSessionStats(),
        this.getBruteForceStats(),
        this.getSuspiciousActivityCount()
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        sessions: sessionStats,
        bruteForce: bruteForceStats,
        suspiciousActivity: suspiciousActivityCount,
      };

      this.logger.log('Weekly Security Report:', JSON.stringify(report, null, 2));

      // In production, you might want to send this to a monitoring service
      // or store it in a security dashboard

    } catch (error) {
      this.logger.error('Failed to generate security report:', error);
    }
  }

  private async getBruteForceStats() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalAttempts, blockedIPs, uniqueIPs] = await Promise.all([
        this.prisma.failedAttempt.count({
          where: { attemptedAt: { gte: oneWeekAgo } },
        }),
        this.prisma.blockedIp.count({
          where: { blockedAt: { gte: oneWeekAgo } },
        }),
        this.prisma.failedAttempt.findMany({
          where: { attemptedAt: { gte: oneWeekAgo } },
          select: { ipAddress: true },
          distinct: ['ipAddress'],
        }).then(results => results.length),
      ]);

      return {
        totalFailedAttempts: totalAttempts,
        blockedIPs,
        uniqueAttackingIPs: uniqueIPs,
      };
    } catch (error) {
      this.logger.error('Failed to get brute force stats:', error);
      return { totalFailedAttempts: 0, blockedIPs: 0, uniqueAttackingIPs: 0 };
    }
  }

  private async getSuspiciousActivityCount(): Promise<number> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Count sessions with multiple IP addresses for the same user in a short time
      const suspiciousUsers = await this.prisma.session.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneWeekAgo },
        },
        having: {
          ipAddress: {
            _count: {
              gt: 3, // More than 3 different IPs
            },
          },
        },
        _count: {
          ipAddress: true,
        },
      });

      return suspiciousUsers.length;
    } catch (error) {
      this.logger.error('Failed to get suspicious activity count:', error);
      return 0;
    }
  }
}