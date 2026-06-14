import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './notification.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Configure Bull queue for notifications
    BullModule.registerQueue({
      name: 'notifications',
      // Redis configuration - uses REDIS_URL env var or defaults
      // Default Redis URL: redis://localhost:6379
      // For production, set REDIS_URL environment variable
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    }),
  ],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService, BullModule],
})
export class NotificationsModule {}
