import { Module } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Reputation Module
 *
 * Handles restaurant reputation management:
 * - Collect and store reviews
 * - Calculate rating summaries
 * - Track sentiment analysis
 * - Manage review responses
 * - Provide analytics and insights
 */
@Module({
  imports: [PrismaModule],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
