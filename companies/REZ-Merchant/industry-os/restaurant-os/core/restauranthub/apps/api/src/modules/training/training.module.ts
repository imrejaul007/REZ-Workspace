import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { GapRecommendationEngine } from './gap-recommendation.engine';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

/**
 * TrainingModule
 *
 * Provides the personalized, gap-driven training academy.
 *
 * Cross-agent dependency:
 *   - Agent A6 (analytics module) must expose GET /api/analytics/gaps
 *   - This module calls that endpoint via HttpService (no direct import)
 *     to avoid circular dependencies.
 *
 * Required env vars:
 *   ANALYTICS_API_URL  — base URL for analytics service (defaults to localhost:3000/api)
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 5000 }),
    AuthModule,
  ],
  controllers: [TrainingController],
  providers: [TrainingService, GapRecommendationEngine],
  exports: [TrainingService],
})
export class TrainingModule {}
