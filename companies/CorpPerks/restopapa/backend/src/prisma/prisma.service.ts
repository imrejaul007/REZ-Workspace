import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'https://rez-analytics-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    // Commented out due to TypeScript issues - will fix later
    // this.$on('beforeExit', async () => {
    //   await app.close();
    // });
  }

  // Helper methods for common queries
  async getUserById(id: string) {
    return this.user.findUnique({
      where: { id },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async getUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async getUserByRabtulId(rabtulUserId: string) {
    return this.user.findFirst({
      where: { rabtulUserId },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async getUserByPhoneOrRabtulId(phone: string, rabtulUserId?: string) {
    return this.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(rabtulUserId ? [{ rabtulUserId }] : []),
        ],
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async createNotification(userId: string, title: string, message: string, type: string, actionUrl?: string) {
    return this.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
      },
    });
  }

  async recordAnalyticsEvent(userId: string | null, eventType: string, eventData?: any, ipAddress?: string, userAgent?: string) {
    try {
      // Record to local database
      await this.analyticsEvent.create({
        data: {
          eventName: eventType,
          properties: eventData ? JSON.stringify(eventData) : undefined,
        },
      });

      // Send to centralized RABTUL Analytics Service
      if (ANALYTICS_SERVICE_URL && INTERNAL_SERVICE_TOKEN) {
        fetch(`${ANALYTICS_SERVICE_URL}/api/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
          body: JSON.stringify({
            event: eventType,
            userId,
            properties: eventData,
            service: 'restopapa',
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {/* Non-fatal - don't fail on analytics errors */});
      }
    } catch (error) {
      // Non-fatal - don't fail on analytics errors
      logger.error('Analytics event failed:', error);
    }
  }
}