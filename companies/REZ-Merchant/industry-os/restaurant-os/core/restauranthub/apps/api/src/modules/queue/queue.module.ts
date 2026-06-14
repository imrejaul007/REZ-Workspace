import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Queue Module
 *
 * Handles offline order queue management:
 * - Enqueue orders when network is offline
 * - Process pending orders when connectivity is restored
 * - Retry failed orders with exponential backoff
 * - Monitor queue health and statistics
 *
 * The queue uses database persistence to survive server restarts.
 * Orders are processed with exponential backoff retry logic.
 *
 * @example
 * // POS client detects offline:
 * const result = await fetch('/queue/enqueue', {
 *   method: 'POST',
 *   body: JSON.stringify(orderData)
 * });
 *
 * // When connection is restored:
 * await fetch('/queue/process', { method: 'POST' });
 */
@Module({
  imports: [PrismaModule],
  controllers: [QueueController],
  providers: [OfflineQueueService],
  exports: [OfflineQueueService],
})
export class QueueModule {}
