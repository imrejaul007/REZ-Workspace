import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import crypto from 'crypto';
import { RedisService } from '../redis/redis.service';

export interface JobData {
  id: string;
  type: string;
  payload;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface JobProcessor {
  type: string;
  processor: (job: JobData) => Promise<unknown>;
  concurrency?: number;
}

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private processors = new Map<string, JobProcessor>();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly queueKey = 'job_queue';
  private readonly processingKey = 'job_processing';
  private readonly completedKey = 'job_completed';
  private readonly failedKey = 'job_failed';
  private readonly lockKeyPrefix = 'job_lock:';
  private readonly lockTtlSeconds = 60;

  constructor(private readonly redis: RedisService) {}

  async onModuleInit() {
    this.logger.log('JobQueueService initialized');
    await this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('JobQueueService shutting down');
    await this.stopProcessing();
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    type: string,
    payload,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      backoff?: { type: 'fixed' | 'exponential'; delay: number };
    } = {}
  ): Promise<string> {
    const jobId = `${type}_${Date.now()}_${crypto.randomInt(100000000, 999999999)}`;

    const job: JobData = {
      id: jobId,
      type,
      payload,
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      backoff: options.backoff || { type: 'exponential', delay: 1000 },
      createdAt: new Date(),
    };

    const score = Date.now() + (options.delay || 0);
    await this.redis.getClient().zadd(this.queueKey, score, JSON.stringify(job));

    this.logger.debug(`Job ${jobId} added to queue with type ${type}`);
    return jobId;
  }

  /**
   * Register a job processor
   */
  registerProcessor(processor: JobProcessor) {
    this.processors.set(processor.type, processor);
    this.logger.log(`Registered processor for job type: ${processor.type}`);
  }

  /**
   * Start processing jobs
   */
  private async startProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.logger.log('Starting job processing');

    this.processingInterval = setInterval(async () => {
      try {
        await this.processNextJob();
      } catch (error) {
        this.logger.error('Error processing jobs:', error);
      }
    }, 1000); // Process jobs every second
  }

  /**
   * Stop processing jobs
   */
  private async stopProcessing() {
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.logger.log('Job processing stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob() {
    const client = this.redis.getClient();
    const now = Date.now();

    // Get jobs that are ready to be processed (not delayed)
    const jobs = await client.zrangebyscore(this.queueKey, 0, now, 'LIMIT', 0, 1);

    if (jobs.length === 0) return;

    const jobString = jobs[0];
    let job: JobData;

    try {
      job = JSON.parse(jobString);
    } catch (error) {
      this.logger.error('Failed to parse job data:', error);
      await client.zrem(this.queueKey, jobString);
      return;
    }

    // Acquire distributed lock to prevent duplicate processing across instances
    const lockKey = `${this.lockKeyPrefix}${job.id}`;
    const lockAcquired = await client.set(lockKey, '1', 'EX', this.lockTtlSeconds, 'NX');

    if (!lockAcquired) {
      // Another instance is processing this job, skip
      this.logger.debug(`Job ${job.id} already being processed by another instance`);
      return;
    }

    // Check if we have a processor for this job type
    const processor = this.processors.get(job.type);
    if (!processor) {
      this.logger.warn(`No processor found for job type: ${job.type}`);
      await client.del(lockKey);
      await this.moveJobToFailed(job, 'No processor found');
      return;
    }

    // Move job to processing
    await client.zrem(this.queueKey, jobString);
    job.processedAt = new Date();
    await client.hset(this.processingKey, job.id, JSON.stringify(job));

    this.logger.debug(`Processing job ${job.id} of type ${job.type}`);

    try {
      // Execute the job processor
      const result = await processor.processor(job);

      // Job completed successfully
      job.completedAt = new Date();
      await client.hdel(this.processingKey, job.id);
      await client.hset(this.completedKey, job.id, JSON.stringify({ ...job, result }));

      this.logger.debug(`Job ${job.id} completed successfully`);

      // Clean up old completed jobs (keep last 1000)
      await this.cleanupCompletedJobs();

    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);

      job.attempts = (job.attempts || 0) + 1;
      job.error = error instanceof Error ? error.message : String(error);

      // Check if we should retry
      if ((job.attempts || 0) < (job.maxAttempts || 3)) {
        // Calculate backoff delay
        let backoffDelay = 0;
        if (job.backoff) {
          if (job.backoff.type === 'exponential') {
            backoffDelay = job.backoff.delay * Math.pow(2, (job.attempts || 1) - 1);
          } else {
            backoffDelay = job.backoff.delay;
          }
        }

        // Re-queue the job with backoff delay
        const retryScore = Date.now() + backoffDelay;
        await client.hdel(this.processingKey, job.id);
        await client.zadd(this.queueKey, retryScore, JSON.stringify(job));

        this.logger.debug(`Job ${job.id} scheduled for retry ${job.attempts}/${job.maxAttempts} in ${backoffDelay}ms`);
      } else {
        // Job failed permanently
        await this.moveJobToFailed(job, job.error);
      }
    } finally {
      // Always release the lock
      await client.del(lockKey);
    }
  }

  /**
   * Move a job to the failed queue
   */
  private async moveJobToFailed(job: JobData, error: string) {
    job.failedAt = new Date();
    job.error = error;

    const client = this.redis.getClient();
    await client.hdel(this.processingKey, job.id);
    await client.hset(this.failedKey, job.id, JSON.stringify(job));

    this.logger.warn(`Job ${job.id} moved to failed queue: ${error}`);

    // Clean up old failed jobs (keep last 500)
    await this.cleanupFailedJobs();
  }

  /**
   * Clean up old completed jobs
   */
  private async cleanupCompletedJobs() {
    try {
      const client = this.redis.getClient();
      const allCompleted = await client.hgetall(this.completedKey);
      const jobs = Object.entries(allCompleted).map(([id, data]) => ({
        id,
        data: JSON.parse(data),
      }));

      if (jobs.length > 1000) {
        // Sort by completion time and remove oldest
        jobs.sort((a, b) =>
          new Date(a.data.completedAt).getTime() - new Date(b.data.completedAt).getTime()
        );

        const toRemove = jobs.slice(0, jobs.length - 1000);
        for (const job of toRemove) {
          await client.hdel(this.completedKey, job.id);
        }

        this.logger.debug(`Cleaned up ${toRemove.length} old completed jobs`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up completed jobs:', error);
    }
  }

  /**
   * Clean up old failed jobs
   */
  private async cleanupFailedJobs() {
    try {
      const client = this.redis.getClient();
      const allFailed = await client.hgetall(this.failedKey);
      const jobs = Object.entries(allFailed).map(([id, data]) => ({
        id,
        data: JSON.parse(data),
      }));

      if (jobs.length > 500) {
        // Sort by failure time and remove oldest
        jobs.sort((a, b) =>
          new Date(a.data.failedAt).getTime() - new Date(b.data.failedAt).getTime()
        );

        const toRemove = jobs.slice(0, jobs.length - 500);
        for (const job of toRemove) {
          await client.hdel(this.failedKey, job.id);
        }

        this.logger.debug(`Cleaned up ${toRemove.length} old failed jobs`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up failed jobs:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const client = this.redis.getClient();

      const [queuedCount, processingCount, completedCount, failedCount] = await Promise.all([
        client.zcard(this.queueKey),
        client.hlen(this.processingKey),
        client.hlen(this.completedKey),
        client.hlen(this.failedKey),
      ]);

      return {
        queued: queuedCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
        processors: Array.from(this.processors.keys()),
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        processors: [],
      };
    }
  }

  /**
   * Get failed jobs for manual inspection/retry
   */
  async getFailedJobs(limit: number = 50) {
    try {
      const client = this.redis.getClient();
      const allFailed = await client.hgetall(this.failedKey);

      return Object.entries(allFailed)
        .map(([id, data]) => JSON.parse(data))
        .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting failed jobs:', error);
      return [];
    }
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    try {
      const client = this.redis.getClient();
      const jobData = await client.hget(this.failedKey, jobId);

      if (!jobData) {
        this.logger.warn(`Failed job ${jobId} not found`);
        return false;
      }

      const job: JobData = JSON.parse(jobData);

      // Reset job for retry
      job.attempts = 0;
      job.error = undefined;
      job.failedAt = undefined;
      job.processedAt = undefined;
      job.completedAt = undefined;

      // Move back to queue
      await client.hdel(this.failedKey, jobId);
      await client.zadd(this.queueKey, Date.now(), JSON.stringify(job));

      this.logger.log(`Failed job ${jobId} queued for retry`);
      return true;
    } catch (error) {
      this.logger.error(`Error retrying failed job ${jobId}:`, error);
      return false;
    }
  }
}