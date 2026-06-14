import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RezClientModule } from '@restopapa/rez-client';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    ConfigModule,
    RezClientModule,
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
