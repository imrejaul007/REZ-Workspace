import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CacheConfigModule } from './cache/cache.module';
import { SecurityModule } from './common/modules/security.module';
import { RezBridgeModule } from './modules/auth/rez-bridge/rez-bridge.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { TrainingModule } from './modules/training/training.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FintechModule } from './modules/fintech/fintech.module';
import { HealthModule } from './health/health.module';
import { KeepAliveService } from './common/keep-alive.service';
import { MenuModule } from './modules/menu/menu.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { StaffModule } from './modules/staff/staff.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunityModule } from './modules/community/community.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { VendorProductsModule } from './modules/vendor-products/vendor-products.module';
import { MessagesModule } from './modules/messages/messages.module';
import { KdsModule } from './modules/kds/kds.module';
import { QueueModule } from './modules/queue/queue.module';

// NEW RESTAURANT VERTICAL MODULES
import { CrmModule } from './modules/crm/crm.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { RecipeModule } from './modules/recipe/recipe.module';
import { MerchantLoansModule } from './modules/merchant-loans/merchant-loans.module';
import { RestaurantWhatsAppModule } from './modules/restaurant-whatsapp/restaurant-whatsapp.module';
import { RetryQueueModule } from './modules/retry-queue/retry-queue.module';
import { ProcurementModule } from './modules/procurement/procurement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config) => {
        SecurityModule.validateEnvironmentVariables();
        return config;
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get('RATE_LIMIT_WINDOW_MS', 60000),
        limit: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
      }]),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CacheConfigModule.forRoot(),
    SecurityModule,
    RezBridgeModule,
    UsersModule,
    OrdersModule,
    JobsModule,
    MarketplaceModule,
    TrainingModule,
    AnalyticsModule,
    FintechModule,
    HealthModule,
    MenuModule,
    ReservationsModule,
    StaffModule,
    InventoryModule,
    AdminModule,
    NotificationsModule,
    CommunityModule,
    ReviewsModule,
    VendorProductsModule,
    MessagesModule,
    KdsModule,
    QueueModule,
    // NEW RESTAURANT VERTICAL MODULES
    CrmModule,
    ReputationModule,
    RecipeModule,
    MerchantLoansModule,
    RestaurantWhatsAppModule,
    RetryQueueModule,
    ProcurementModule,
  ],
  controllers: [AppController],
  providers: [KeepAliveService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const environment = this.configService.get('NODE_ENV', 'development');
    this.logger.log('🔐 Security Module Initialized');
    this.logger.log(`🌍 Environment: ${environment}`);
    if (environment === 'production') {
      this.logger.log('🔒 Production security features enabled');
    } else {
      this.logger.warn('⚠️  Development mode - some security features relaxed');
    }
  }
}
