import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IntegrationModule } from './integrations/integration.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { EmployeesModule } from './employees/employees.module';
import { JobsModule } from './jobs/jobs.module';
import { VendorsModule } from './vendors/vendors.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Bull queue configuration for Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        // Default settings for all queues
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // Feature modules - ALL ENABLED
    NotificationsModule,
    IntegrationModule,
    AuthModule,
    RestaurantsModule,
    EmployeesModule,
    JobsModule,
    VendorsModule,
    DiscussionsModule,
    PaymentsModule,
    UploadsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
