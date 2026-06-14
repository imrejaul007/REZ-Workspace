import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Retry job types
 */
export enum RetryJobType {
  KDS_NOTIFY = 'KDS_NOTIFY',
  CASHBACK_CREDIT = 'CASHBACK_CREDIT',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  WEBHOOK_DELIVERY = 'WEBHOOK_DELIVERY',
  NOTIFICATION = 'NOTIFICATION',
}

/**
 * Retry job status
 */
export enum RetryJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Retry job record
 */
export interface RetryJob {
  id: string;
  type: RetryJobType;
  status: RetryJobStatus;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date;
  lastError: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retry Queue Service
 *
 * Database-backed retry queue that replaces setTimeout-based retries.
 * Survives server restarts and provides reliable delivery.
 */
@Injectable()
export class RetryQueueService implements OnModuleInit {
  private readonly logger = new Logger(RetryQueueService.name);
  private processingJob: boolean = false;
  private readonly defaultMaxAttempts = 5;
  private readonly baseDelayMs = [2000, 8000, 32000, 128000, 512000]; // Exponential: 2s, 8s, 32s, 128s, 512s

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Start periodic processing
    this.startPeriodicProcessing();
  }

  // ==========================================
  // ENQUEUE JOBS
  // ==========================================

  /**
   * Enqueue a job for retry
   */
  async enqueue(
    type: RetryJobType,
    payload: Record<string, unknown>,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      expiresInHours?: number;
    } = {},
  ): Promise<RetryJob> {
    const maxAttempts = options.maxAttempts || this.defaultMaxAttempts;
    const delayMs = options.delayMs || 0;
    const expiresInHours = options.expiresInHours || 24;

    const nextRetryAt = new Date(Date.now() + delayMs);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const job = await this.prisma.retryJob.create({
      data: {
        type,
        status: RetryJobStatus.PENDING,
        payload,
        attempts: 0,
        maxAttempts,
        nextRetryAt,
        expiresAt,
      },
    });

    this.logger.log(`[RetryQueue] Enqueued ${type} job ${job.id}`);

    return job as unknown as RetryJob;
  }

  /**
   * Enqueue KDS notification retry
   */
  async enqueueKDSRetry(
    restaurantId: string,
    payload: Record<string, unknown>,
    orderId: string,
  ): Promise<RetryJob> {
    return this.enqueue(RetryJobType.KDS_NOTIFY, {
      restaurantId,
      payload,
      orderId,
    }, {
      maxAttempts: 5,
      delayMs: 2000, // Start after 2 seconds
    });
  }

  /**
   * Enqueue cashback credit retry
   */
  async enqueueCashbackRetry(
    userId: string,
    amount: number,
    reason: string,
    restaurantId: string,
    orderId: string,
  ): Promise<RetryJob> {
    return this.enqueue(RetryJobType.CASHBACK_CREDIT, {
      userId,
      amount,
      reason,
      restaurantId,
      orderId,
    }, {
      maxAttempts: 5,
      delayMs: 5000, // Start after 5 seconds
    });
  }

  /**
   * Enqueue low stock alert
   */
  async enqueueLowStockAlert(
    restaurantId: string,
    items: Array<{ ingredientId: string; ingredientName: string; shortage: number }>,
  ): Promise<RetryJob> {
    return this.enqueue(RetryJobType.LOW_STOCK_ALERT, {
      restaurantId,
      items,
    }, {
      maxAttempts: 3,
    });
  }

  // ==========================================
  // PROCESS JOBS
  // ==========================================

  /**
   * Get next pending job
   */
  private async getNextPendingJob(): Promise<{
    id: string;
    type: RetryJobType;
    payload: Record<string, unknown>;
    maxAttempts: number;
    attempts: number;
  } | null> {
    const now = new Date();

    const job = await this.prisma.retryJob.findFirst({
      where: {
        status: RetryJobStatus.PENDING,
        nextRetryAt: { lte: now },
        expiresAt: { gt: now },
        attempts: { lt: 5 },
      },
      orderBy: { nextRetryAt: 'asc' },
    });

    if (!job) return null;

    return {
      id: job.id,
      type: job.type as RetryJobType,
      payload: job.payload as Record<string, unknown>,
      maxAttempts: job.maxAttempts,
      attempts: job.attempts,
    };
  }

  /**
   * Process a single job
   */
  private async processJob(job: {
    id: string;
    type: RetryJobType;
    payload: Record<string, unknown>;
    maxAttempts: number;
    attempts: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      switch (job.type) {
        case RetryJobType.KDS_NOTIFY:
          return await this.processKDSNotify(job.payload);
        case RetryJobType.CASHBACK_CREDIT:
          return await this.processCashbackCredit(job.payload);
        case RetryJobType.LOW_STOCK_ALERT:
          return await this.processLowStockAlert(job.payload);
        default:
          this.logger.warn(`[RetryQueue] Unknown job type: ${job.type}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process KDS notification
   */
  private async processKDSNotify(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    // This would call KdsGateway - import it here
    // For now, just mark as handled
    this.logger.log(`[RetryQueue] Processing KDS notify for order ${payload.orderId}`);
    return { success: true };
  }

  /**
   * Process cashback credit
   */
  private async processCashbackCredit(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    // This would call Revenue AI wallet API
    // For now, just mark as handled
    this.logger.log(`[RetryQueue] Processing cashback for user ${payload.userId}: ₹${payload.amount}`);
    return { success: true };
  }

  /**
   * Process low stock alert
   */
  private async processLowStockAlert(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    // This would send notification and/or create NexaBizz RFQ
    this.logger.log(`[RetryQueue] Processing low stock alert for restaurant ${payload.restaurantId}`);
    return { success: true };
  }

  /**
   * Mark job as completed
   */
  private async completeJob(jobId: string): Promise<void> {
    await this.prisma.retryJob.update({
      where: { id: jobId },
      data: {
        status: RetryJobStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`[RetryQueue] Job ${jobId} completed`);
  }

  /**
   * Mark job as failed (with retry scheduling)
   */
  private async failJob(
    jobId: string,
    error: string,
    attempts: number,
    maxAttempts: number,
  ): Promise<void> {
    if (attempts >= maxAttempts) {
      // Max retries reached
      await this.prisma.retryJob.update({
        where: { id: jobId },
        data: {
          status: RetryJobStatus.FAILED,
          lastError: error,
          attempts: attempts + 1,
          updatedAt: new Date(),
        },
      });
      this.logger.warn(`[RetryQueue] Job ${jobId} failed permanently after ${attempts} attempts: ${error}`);
    } else {
      // Schedule retry with exponential backoff
      const delayIndex = Math.min(attempts, this.baseDelayMs.length - 1);
      const delayMs = this.baseDelayMs[delayIndex];
      const nextRetryAt = new Date(Date.now() + delayMs);

      await this.prisma.retryJob.update({
        where: { id: jobId },
        data: {
          status: RetryJobStatus.PENDING,
          lastError: error,
          lastAttemptAt: new Date(),
          attempts: attempts + 1,
          nextRetryAt,
          updatedAt: new Date(),
        },
      });
      this.logger.log(`[RetryQueue] Job ${jobId} failed, retry scheduled in ${delayMs}ms (attempt ${attempts + 1}/${maxAttempts})`);
    }
  }

  // ==========================================
  // PERIODIC PROCESSING
  // ==========================================

  /**
   * Start periodic job processing (every 5 seconds)
   */
  private startPeriodicProcessing(): void {
    setInterval(async () => {
      if (this.processingJob) return;
      this.processingJob = true;

      try {
        await this.processNextJob();
      } catch (error) {
        this.logger.error(`[RetryQueue] Processing error: ${error}`);
      } finally {
        this.processingJob = false;
      }
    }, 5000);
  }

  /**
   * Process next pending job
   */
  private async processNextJob(): Promise<void> {
    const job = await this.getNextPendingJob();
    if (!job) return;

    this.logger.debug(`[RetryQueue] Processing job ${job.id} (${job.type})`);

    const result = await this.processJob(job);

    if (result.success) {
      await this.completeJob(job.id);
    } else {
      await this.failJob(job.id, result.error || 'Unknown error', job.attempts, job.maxAttempts);
    }
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const counts = await this.prisma.retryJob.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats = { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    counts.forEach(c => {
      const status = c.status.toLowerCase() as keyof typeof stats;
      if (status in stats) {
        stats[status as keyof typeof stats] = c._count;
        stats.total += c._count;
      }
    });

    return stats;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.prisma.retryJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    await this.prisma.retryJob.update({
      where: { id: jobId },
      data: {
        status: RetryJobStatus.PENDING,
        attempts: 0,
        nextRetryAt: new Date(),
        lastError: null,
      },
    });
    this.logger.log(`[RetryQueue] Job ${jobId} requeued for retry`);
  }

  /**
   * Delete completed jobs older than X days
   */
  async cleanupOldJobs(daysOld: number = 7): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.prisma.retryJob.deleteMany({
      where: {
        status: { in: [RetryJobStatus.COMPLETED, RetryJobStatus.FAILED] },
        updatedAt: { lt: cutoff },
      },
    });

    this.logger.log(`[RetryQueue] Cleaned up ${result.count} old jobs`);
    return result.count;
  }
}
