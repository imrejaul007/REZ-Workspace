import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export interface QueueConnection {
  host: string;
  port: number;
  password?: string;
}

export interface JobData {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  originalQueue?: string;
  replayedAt?: string;
  headers?: Record<string, string>;
}

export interface JobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  jobId?: string;
  timeout?: number;
}

export class QueueService {
  private connection: Redis;
  private queues: Map<string, Queue<JobData>>;

  constructor(connection: QueueConnection) {
    this.queues = new Map();

    const redisConfig: Record<string, unknown> = {
      host: connection.host,
      port: connection.port,
      maxRetriesPerRequest: null,
    };

    if (connection.password) {
      redisConfig.password = connection.password;
    }

    this.connection = new Redis(redisConfig);

    this.connection.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    this.connection.on('connect', () => {
      logger.info('Redis connected', { host: connection.host, port: connection.port });
    });
  }

  /**
   * Add a job to a queue
   */
  async addJob(
    queueName: string,
    jobName: string,
    data: JobData,
    options: JobOptions = {}
  ): Promise<string> {
    const queue = this.getOrCreateQueue(queueName);

    const job = await queue.add(jobName, data, {
      attempts: options.attempts ?? 3,
      backoff: options.backoff ?? {
        type: 'exponential',
        delay: 1000,
      },
      jobId: options.jobId,
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep up to 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
        count: 5000, // Keep up to 5000 failed jobs
      },
    });

    logger.info('Job added to queue', {
      queue: queueName,
      jobId: job.id,
      jobName,
      eventId: data.eventId,
    });

    return job.id as string;
  }

  /**
   * Get or create a queue
   */
  private getOrCreateQueue(queueName: string): Queue<JobData> {
    let queue = this.queues.get(queueName);

    if (!queue) {
      queue = new Queue<JobData>(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      this.queues.set(queueName, queue);

      queue.on('error', (err) => {
        logger.error('Queue error', { queue: queueName, error: err.message });
      });
    }

    return queue;
  }

  /**
   * Get queue counts
   */
  async getQueueCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getOrCreateQueue(queueName);
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  /**
   * Get a job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job<JobData> | undefined> {
    const queue = this.getOrCreateQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.pause();
    logger.info('Queue paused', { queue: queueName });
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.resume();
    logger.info('Queue resumed', { queue: queueName });
  }

  /**
   * Drain a queue (remove all waiting jobs)
   */
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.drain();
    logger.info('Queue drained', { queue: queueName });
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    const job = await queue.getJob(jobId);

    if (job) {
      await job.remove();
      logger.info('Job removed', { queue: queueName, jobId });
    }
  }

  /**
   * Close all queue connections
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connection.quit();
    logger.info('Redis connections closed');
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connection.status === 'ready';
  }
}
