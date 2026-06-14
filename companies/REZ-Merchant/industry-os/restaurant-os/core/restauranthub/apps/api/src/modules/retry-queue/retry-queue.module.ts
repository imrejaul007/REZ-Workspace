import { Module } from '@nestjs/common';
import { RetryQueueService } from './retry-queue.service';
import { RetryQueueController } from './retry-queue.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Retry Queue Module
 *
 * Database-backed retry queue that provides reliable delivery for:
 * - KDS notifications
 * - Cashback credits
 * - Low stock alerts
 * - Webhook deliveries
 *
 * Features:
 * - Exponential backoff (2s, 8s, 32s, 128s, 512s)
 * - Survives server restarts
 * - Manual retry capability
 * - Automatic cleanup of old jobs
 */
@Module({
  imports: [PrismaModule],
  controllers: [RetryQueueController],
  providers: [RetryQueueService],
  exports: [RetryQueueService],
})
export class RetryQueueModule {}
