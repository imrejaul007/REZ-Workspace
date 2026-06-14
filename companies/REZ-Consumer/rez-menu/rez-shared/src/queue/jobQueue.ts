/**
 * Job Queue Service
 *
 * Async job processing with Bull (Redis-based).
 * Supports retries, concurrency, scheduling.
 *
 * Usage:
 * ```typescript
 * const emailQueue = new JobQueue('send-email', redis);
 * await emailQueue.add({ to: 'user@example.com', subject: '...' });
 * emailQueue.process(async (job) => { ... });
 * ```
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import type { Job } from 'bullmq';
import type Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface JobQueueOptions {
  concurrency?: number;
  maxRetries?: number;
  retryBackoff?: 'exponential' | 'fixed';
  defaultDelay?: number;
}

export interface AsyncJobData {
  type?: string;
  [key: string];
}

/**
 * Generic job queue wrapper
 */
export class JobQueue<T extends AsyncJobData = AsyncJobData> {
  private queue: Queue<unknown, unknown, string>;
  private worker?: Worker<unknown, unknown, string>;
  private queueEvents?: QueueEvents;
  private readonly redisConnection: object;

  constructor(
    name: string,
    redis: Redis,
    private options: JobQueueOptions = {}
  ) {
    this.redisConnection = (redis as unknown).options || { host: 'localhost', port: 6379 };

    // Create queue
    this.queue = new Queue(name, {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts: options.maxRetries || 3,
        backoff: options.retryBackoff === 'fixed'
          ? { type: 'fixed', delay: 5000 }
          : { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 3600 }, // Keep completed jobs for 1 hour
      },
    });

    // Monitor queue events
    this.queueEvents = new QueueEvents(name, {
      connection: this.redisConnection,
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[${name}] Job ${jobId} failed: ${failedReason}`);
    });

    this.queueEvents.on('completed', ({ jobId }) => {
      logger.info(`[${name}] Job ${jobId} completed`);
    });
  }

  /**
   * Add job to queue
   */
  async add(data: T, options?: { priority?: number; delay?: number }): Promise<Job<unknown, unknown, string>> {
    return this.queue.add(data.type || 'job', data as unknown, {
      priority: options?.priority || 0,
      delay: options?.delay ?? this.options.defaultDelay ?? 0,
    });
  }

  /**
   * Add job with unique key (deduplication)
   */
  async addUnique(
    uniqueKey: string,
    data: T,
    options?: { priority?: number }
  ): Promise<Job<unknown, unknown, string>> {
    return this.queue.add(data.type || 'job', data as unknown, {
      jobId: uniqueKey,
      priority: options?.priority || 0,
    });
  }

  /**
   * Add job to be processed at specific time
   */
  async schedule(
    data: T,
    scheduledTime: Date,
    options?: { priority?: number }
  ): Promise<Job<unknown, unknown, string>> {
    const delay = scheduledTime.getTime() - Date.now();
    return this.queue.add(data.type || 'job', data as unknown, {
      priority: options?.priority || 0,
      delay: Math.max(0, delay),
    });
  }

  /**
   * Set up job processor
   */
  process(
    handler: (job: Job<unknown, unknown, string>) => Promise<unknown>,
    concurrency: number = this.options.concurrency || 4
  ): void {
    this.worker = new Worker(this.queue.name, handler, {
      connection: this.redisConnection,
      concurrency,
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`[${this.queue.name}] Worker failed:`, err instanceof Error ? err.message : String(err));
    });

    this.worker.on('error', (err) => {
      logger.error(`[${this.queue.name}] Worker error:`, err instanceof Error ? err.message : String(err));
    });
  }

  /**
   * Get queue status
   */
  async getStatus() {
    const counts = await this.queue.getJobCounts();
    const jobs = await this.queue.getJobs(['active', 'waiting', 'failed']);

    return {
      ...counts,
      queueSize: jobs.length,
    };
  }

  /**
   * Pause queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Clean completed jobs
   */
  async clean(olderThan: number = 3600000): Promise<void> {
    await this.queue.clean(olderThan, 1000, 'completed');
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drain(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Close queue
   */
  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    if (this.queueEvents) await this.queueEvents.close();
    await this.queue.close();
  }
}

/**
 * Pre-configured job queues for common operations
 */
export class JobQueueService {
  private emailQueue: JobQueue;
  private smsQueue: JobQueue;
  private pushQueue: JobQueue;
  private webhookQueue: JobQueue;
  private orderQueue: JobQueue;

  constructor(redis: Redis) {
    this.emailQueue = new JobQueue('send-email', redis);
    this.smsQueue = new JobQueue('send-sms', redis);
    this.pushQueue = new JobQueue('send-push', redis);
    this.webhookQueue = new JobQueue('send-webhook', redis);
    this.orderQueue = new JobQueue('process-order', redis);
  }

  /**
   * Queue email to be sent
   */
  async sendEmail(to: string, subject: string, body: string, options?): Promise<void> {
    await this.emailQueue.addUnique(`email:${to}:${subject}`, {
      type: 'send-email',
      to,
      subject,
      body,
      ...options,
    });
  }

  /**
   * Queue SMS to be sent
   */
  async sendSms(phone: string, message: string, options?): Promise<void> {
    await this.smsQueue.add({
      type: 'send-sms',
      phone,
      message,
      ...options,
    });
  }

  /**
   * Queue push notification
   */
  async sendPush(userId: string, title: string, body: string, options?): Promise<void> {
    await this.pushQueue.add({
      type: 'send-push',
      userId,
      title,
      body,
      ...options,
    });
  }

  /**
   * Queue webhook call
   */
  async sendWebhook(url: string, event: string, payload, options?): Promise<void> {
    await this.webhookQueue.add({
      type: 'send-webhook',
      url,
      event,
      payload,
      ...options,
    }, {
      priority: 5, // Higher priority for webhooks
    });
  }

  /**
   * Queue order processing
   */
  async processOrder(orderId: string, data): Promise<void> {
    await this.orderQueue.add({
      type: 'process-order',
      orderId,
      ...data,
    });
  }

  /**
   * Setup all processors
   */
  setupProcessors(handlers: {
    email?: (job: Job) => Promise<unknown>;
    sms?: (job: Job) => Promise<unknown>;
    push?: (job: Job) => Promise<unknown>;
    webhook?: (job: Job) => Promise<unknown>;
    order?: (job: Job) => Promise<unknown>;
  }): void {
    if (handlers.email) this.emailQueue.process(handlers.email, 2); // 2 concurrent emails
    if (handlers.sms) this.smsQueue.process(handlers.sms, 5); // 5 concurrent SMS
    if (handlers.push) this.pushQueue.process(handlers.push, 10); // 10 concurrent push
    if (handlers.webhook) this.webhookQueue.process(handlers.webhook, 5);
    if (handlers.order) this.orderQueue.process(handlers.order, 2);
  }

  /**
   * Get all queue statuses
   */
  async getAllStatus() {
    return {
      email: await this.emailQueue.getStatus(),
      sms: await this.smsQueue.getStatus(),
      push: await this.pushQueue.getStatus(),
      webhook: await this.webhookQueue.getStatus(),
      order: await this.orderQueue.getStatus(),
    };
  }

  /**
   * Close all queues
   */
  async closeAll(): Promise<void> {
    await Promise.all([
      this.emailQueue.close(),
      this.smsQueue.close(),
      this.pushQueue.close(),
      this.webhookQueue.close(),
      this.orderQueue.close(),
    ]);
  }
}
