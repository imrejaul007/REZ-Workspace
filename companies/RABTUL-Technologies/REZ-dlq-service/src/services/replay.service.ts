import { DLQEntry, IDLQEntry } from '../models/dlq.model';
import { dlqService } from './dlq.service';
import winston from 'winston';
import { EventEmitter } from 'events';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../../../shared/rez-errors/src';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export interface ReplayConfig {
  maxRetries?: number;
  maxConcurrent?: number;
  replayDelayMs?: number;
  retryDelays?: number[];
  targetQueue?: string;
  onEventReplayed?: (event: IDLQEntry, result: ReplayResult) => void;
  onEventFailed?: (event: IDLQEntry, error: Error) => void;
}

export interface ReplayResult {
  success: boolean;
  eventId: string;
  replayedAt: Date;
  durationMs: number;
  error?: {
    message: string;
    code?: string;
  };
}

export interface ReplayProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  results: ReplayResult[];
}

export class ReplayService extends EventEmitter {
  private config: Required<ReplayConfig>;
  private isRunning: boolean = false;
  private currentProgress: ReplayProgress | null = null;

  constructor(config: ReplayConfig = {}) {
    super();
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      maxConcurrent: config.maxConcurrent ?? 10,
      replayDelayMs: config.replayDelayMs ?? 1000,
      retryDelays: config.retryDelays ?? [60000, 300000, 900000, 3600000, 86400000],
      targetQueue: config.targetQueue ?? '',
      onEventReplayed: config.onEventReplayed ?? (() => {}),
      onEventFailed: config.onEventFailed ?? (() => {}),
    };
  }

  /**
   * Update replay configuration
   */
  updateConfig(config: Partial<ReplayConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current replay status
   */
  getStatus(): { isRunning: boolean; progress: ReplayProgress | null } {
    return {
      isRunning: this.isRunning,
      progress: this.currentProgress,
    };
  }

  /**
   * Replay a single event
   */
  async replayEvent(
    eventId: string,
    targetQueue?: string
  ): Promise<ReplayResult> {
    const startTime = Date.now();
    const entry = await DLQEntry.findOne({ eventId }).exec();

    if (!entry) {
      throw new NotFoundError('Event', eventId);
    }

    if (!entry.canRetry(this.config.maxRetries)) {
      throw new BusinessRuleError(`Event exceeded max retries: ${eventId}`, 'MAX_RETRIES_EXCEEDED');
    }

    // Mark as replaying
    entry.markAsReplaying();
    await entry.save();

    try {
      const result = await this.executeReplay(entry, targetQueue);

      if (result.success) {
        entry.markAsReplayed();
        entry.status = 'replayed';
        this.config.onEventReplayed(entry, result);
        this.emit('event:replayed', entry, result);
      } else {
        entry.markAsFailed(result.error?.message || 'Unknown error');
        this.config.onEventFailed(entry, new Error(result.error?.message));
        this.emit('event:failed', entry, result);
      }

      await entry.save();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: ReplayResult = {
        success: false,
        eventId,
        replayedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: { message: errorMessage },
      };

      entry.markAsFailed(errorMessage);
      await entry.save();

      this.config.onEventFailed(entry, error instanceof Error ? error : new Error(errorMessage));
      this.emit('event:failed', entry, result);

      return result;
    }
  }

  /**
   * Execute the actual replay logic with retry logic and proper status updates
   *
   * FIX: Added 3-attempt retry loop with exponential backoff, status updates via dlqService,
   * and proper error handling for permanent failures.
   */
  protected async executeReplay(
    entry: IDLQEntry,
    targetQueue?: string
  ): Promise<ReplayResult> {
    const startTime = Date.now();
    const queue = targetQueue || entry.metadata.originalQueue || this.config.targetQueue;

    if (!queue) {
      throw new ValidationError(`No target queue specified for replay: ${entry.eventId}`);
    }

    logger.info('Executing replay', {
      eventId: entry.eventId,
      eventType: entry.eventType,
      queue,
    });

    const maxRetries = 3;
    let lastError: Error = new Error('Unknown error');

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Dynamically import to avoid circular dependencies
        const { QueueService } = await import('../queue.service');
        const connection = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        };

        const queueService = new QueueService(connection);

        await queueService.addJob(queue, `replay-${entry.eventId}`, {
          eventId: entry.eventId,
          eventType: entry.eventType,
          payload: entry.payload,
          originalQueue: entry.metadata.originalQueue,
          replayedAt: new Date().toISOString(),
          headers: entry.metadata.headers,
        }, {
          attempts: 1, // Don't retry within the job - we handle retries here
          backoff: {
            type: 'exponential',
            delay: Math.pow(2, attempt) * 1000, // 1s, 2s, 4s
          },
          jobId: `replay-${entry.eventId}-${Date.now()}`,
        });

        // Update DLQ status to 'replayed' via dlqService
        await dlqService.updateStatus(entry.eventId, 'replayed', {
          replayedAt: new Date(),
          targetQueue: queue,
        });

        logger.info('Event replayed successfully', {
          eventId: entry.eventId,
          targetQueue: queue,
          attempt: attempt + 1,
        });

        return {
          success: true,
          eventId: entry.eventId,
          replayedAt: new Date(),
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn('Replay attempt failed', {
          eventId: entry.eventId,
          attempt: attempt + 1,
          error: lastError.message,
        });

        // Wait before next retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.delay(delay);
        }
      }
    }

    // All retries exhausted - mark as failed
    await dlqService.updateStatus(entry.eventId, 'failed', {
      failedAt: new Date(),
      lastError: lastError?.message || 'Unknown error after all retries',
    });

    logger.error('Event replay permanently failed after all retries', {
      eventId: entry.eventId,
      totalAttempts: maxRetries,
      lastError: lastError?.message,
    });

    return {
      success: false,
      eventId: entry.eventId,
      replayedAt: new Date(),
      durationMs: Date.now() - startTime,
      error: { message: lastError?.message || 'Unknown error after all retries' },
    };
  }

  /**
   * Replay multiple events with concurrency control
   */
  async replayEvents(
    eventIds: string[],
    targetQueue?: string
  ): Promise<ReplayProgress> {
    if (this.isRunning) {
      throw new ConflictError('Replay already in progress', 'REPLAY_IN_PROGRESS');
    }

    this.isRunning = true;
    const progress: ReplayProgress = {
      total: eventIds.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      results: [],
    };
    this.currentProgress = progress;

    this.emit('replay:started', progress);

    const chunks = this.chunkArray(eventIds, this.config.maxConcurrent);

    for (const chunk of chunks) {
      const promises = chunk.map(async (eventId) => {
        progress.inProgress++;
        this.emit('replay:progress', progress);

        try {
          const result = await this.replayEvent(eventId, targetQueue);
          progress.results.push(result);

          if (result.success) {
            progress.completed++;
          } else {
            progress.failed++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          progress.results.push({
            success: false,
            eventId,
            replayedAt: new Date(),
            durationMs: 0,
            error: { message: errorMessage },
          });
          progress.failed++;
        }

        progress.inProgress--;
        this.emit('replay:progress', progress);

        // Rate limiting delay
        await this.delay(this.config.replayDelayMs);
      });

      await Promise.all(promises);
    }

    this.isRunning = false;
    this.emit('replay:completed', progress);

    logger.info('Batch replay completed', {
      total: progress.total,
      completed: progress.completed,
      failed: progress.failed,
    });

    return progress;
  }

  /**
   * Replay all pending events
   */
  async replayAllPending(limit?: number): Promise<ReplayProgress> {
    const pendingEvents = await DLQEntry.findPending(limit);
    const eventIds = pendingEvents.map((e: IDLQEntry) => e.eventId);

    logger.info('Starting replay of all pending events', { count: eventIds.length });

    return this.replayEvents(eventIds);
  }

  /**
   * Replay events by filter
   */
  async replayByFilter(
    filter: {
      eventType?: string;
      tags?: string[];
      olderThan?: Date;
    },
    targetQueue?: string
  ): Promise<ReplayProgress> {
    const query: Parameters<typeof dlqService.queryEvents>[0] = {
      status: 'pending',
      eventType: filter.eventType,
      tags: filter.tags,
    };

    if (filter.olderThan) {
      query.endDate = filter.olderThan;
    }

    const { events } = await dlqService.queryEvents({ ...query, limit: 1000 });
    const eventIds = events.map((e) => e.eventId);

    logger.info('Starting replay by filter', {
      filter,
      count: eventIds.length,
    });

    return this.replayEvents(eventIds, targetQueue);
  }

  /**
   * Schedule automatic replay for failed events
   */
  async scheduleReplay(eventId: string): Promise<IDLQEntry | null> {
    const entry = await DLQEntry.findOne({ eventId }).exec();

    if (!entry) {
      return null;
    }

    const delayIndex = Math.min(entry.replayAttempts, this.config.retryDelays.length - 1);
    const delay = this.config.retryDelays[delayIndex];

    entry.nextReplayAt = new Date(Date.now() + delay);
    await entry.save();

    logger.info('Replay scheduled', { eventId, nextReplayAt: entry.nextReplayAt });

    return entry;
  }

  /**
   * Cancel scheduled replay
   */
  async cancelScheduledReplay(eventId: string): Promise<IDLQEntry | null> {
    return DLQEntry.findOneAndUpdate(
      { eventId },
      { $unset: { nextReplayAt: 1 }, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * Get events scheduled for replay
   */
  async getScheduledReplays(): Promise<IDLQEntry[]> {
    const now = new Date();
    return DLQEntry.find({
      status: 'pending',
      nextReplayAt: { $lte: now },
    })
      .sort({ nextReplayAt: 1 })
      .limit(100)
      .exec();
  }

  /**
   * Reset an event for replay (clear previous attempts)
   */
  async resetForReplay(eventId: string): Promise<IDLQEntry | null> {
    return DLQEntry.findOneAndUpdate(
      { eventId },
      {
        status: 'pending',
        replayAttempts: 0,
        $unset: { nextReplayAt: 1 },
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Stop current replay operation
   */
  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.emit('replay:stopped');
      logger.info('Replay stopped by user');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const replayService = new ReplayService();
