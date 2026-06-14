import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createSession(userId: string, token: string, deviceInfo?): Promise<string> {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + this.getSessionDuration());

      await this.prisma.session.create({
        data: {
          id: sessionId,
          userId,
          token: crypto.createHash('sha256').update(token).digest('hex'), // Hash for security
          expiresAt,
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
          ipAddress: deviceInfo?.ip || null,
          userAgent: deviceInfo?.userAgent || null,
        },
      });

      this.logger.log(`Session created for user ${userId}`);
      return sessionId;
    } catch (error) {
      this.logger.error('Failed to create session:', error);
      throw error;
    }
  }

  async validateSession(sessionId: string, token: string): Promise<boolean> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session) {
        return false;
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.invalidateSession(sessionId);
        return false;
      }

      // Check if token matches
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      if (session.token !== hashedToken) {
        return false;
      }

      // Check if user is still active
      if (!session.user.isActive) {
        await this.invalidateSession(sessionId);
        return false;
      }

      // Update last accessed time
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { lastAccessedAt: new Date() },
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to validate session:', error);
      return false;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });

      this.logger.log(`Session ${sessionId} invalidated`);
    } catch (error) {
      this.logger.error('Failed to invalidate session:', error);
    }
  }

  async invalidateAllUserSessions(userId: string, reason: string = 'user_action'): Promise<void> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: { userId },
      });

      this.logger.log(`Invalidated ${result.count} sessions for user ${userId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error('Failed to invalidate user sessions:', error);
      throw error;
    }
  }

  async getUserActiveSessions(userId: string): Promise<unknown[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          createdAt: true,
          lastAccessedAt: true,
          ipAddress: true,
          userAgent: true,
          deviceInfo: true,
        },
        orderBy: { lastAccessedAt: 'desc' },
      });

      return sessions.map(session => ({
        ...session,
        deviceInfo: session.deviceInfo ? JSON.parse(session.deviceInfo) : null,
      }));
    } catch (error) {
      this.logger.error('Failed to get user active sessions:', error);
      return [];
    }
  }

  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      const suspiciousThreshold = this.configService.get('SESSION_SUSPICIOUS_THRESHOLD', 5);
      const timeWindow = 60 * 60 * 1000; // 1 hour

      // Check for multiple sessions from different locations/devices
      const recentSessions = await this.prisma.session.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - timeWindow) },
        },
        select: { ipAddress: true, userAgent: true },
      });

      // Count unique IP addresses
      const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress).filter(Boolean));

      if (uniqueIPs.size >= suspiciousThreshold) {
        this.logger.warn(`Suspicious activity detected for user ${userId}`, {
          userId,
          uniqueIPs: uniqueIPs.size,
          threshold: suspiciousThreshold,
          severity: 'HIGH'
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  async getSessionStats(): Promise<unknown> {
    try {
      const [totalSessions, activeSessions, expiredSessions] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.session.count({
          where: { expiresAt: { gt: new Date() } },
        }),
        this.prisma.session.count({
          where: { expiresAt: { lt: new Date() } },
        }),
      ]);

      return {
        total: totalSessions,
        active: activeSessions,
        expired: expiredSessions,
      };
    } catch (error) {
      this.logger.error('Failed to get session stats:', error);
      return { total: 0, active: 0, expired: 0 };
    }
  }

  private getSessionDuration(): number {
    const duration = this.configService.get('SESSION_DURATION_MS', 24 * 60 * 60 * 1000); // 24 hours default
    return parseInt(duration.toString());
  }

  // Security feature: Force logout user from all devices
  async forceLogoutUser(userId: string, reason: string = 'admin_action'): Promise<void> {
    try {
      // Invalidate all sessions
      await this.invalidateAllUserSessions(userId, reason);

      // Clear refresh tokens
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      this.logger.warn(`Force logout executed for user ${userId}`, {
        userId,
        reason,
        severity: 'HIGH'
      });
    } catch (error) {
      this.logger.error('Failed to force logout user:', error);
      throw error;
    }
  }
}