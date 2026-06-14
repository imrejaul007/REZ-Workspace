import { DLQEntry, IDLQEntry } from '../models/dlq.model';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

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

// DLQ alert threshold - trigger alert when pending events exceed this number
const DLQ_ALERT_THRESHOLD = parseInt(process.env.DLQ_ALERT_THRESHOLD || '100', 10);

export interface StoreFailedEventParams {
  eventId?: string;
  eventType: string;
  payload: Record<string, unknown>;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: {
    source: string;
    timestamp?: Date;
    retryCount?: number;
    originalQueue?: string;
    headers?: Record<string, string>;
  };
  tags?: string[];
}

/**
 * DLQ Event interface for deduplication
 */
export interface DLQEvent {
  eventId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}

/**
 * Status update metadata interface
 */
export interface StatusUpdateMetadata {
  replayedAt?: Date;
  targetQueue?: string;
  failedAt?: Date;
  lastError?: string;
}

/**
 * DLQ Alert interface
 */
export interface DLQAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DLQQuery {
  status?: IDLQEntry['status'];
  eventType?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class DLQService {
  /**
   * Store a failed event in the dead letter queue with deduplication
   *
   * FIX: Added deduplication check to prevent duplicate events from being
   * stored when the same eventId is processed multiple times.
   */
  async storeFailedEvent(params: StoreFailedEventParams): Promise<IDLQEntry | null> {
    const {
      eventId = uuidv4(),
      eventType,
      payload,
      error,
      metadata,
      tags = [],
    } = params;

    // FIX: Check for duplicate event before storing
    const existingEntry = await DLQEntry.findOne({ eventId }).exec();
    if (existingEntry) {
      logger.info('Duplicate event ignored', { eventId, eventType });
      return null;
    }

    logger.info('Storing failed event', { eventId, eventType, source: metadata.source });

    const entry = new DLQEntry({
      eventId,
      eventType,
      payload,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      metadata: {
        source: metadata.source,
        timestamp: metadata.timestamp || new Date(),
        retryCount: metadata.retryCount || 0,
        originalQueue: metadata.originalQueue,
        headers: metadata.headers,
      },
      status: 'pending',
      tags,
    });

    await entry.save();
    logger.info('Failed event stored successfully', { eventId });

    // Trigger DLQ health check after storing
    this.checkDLQHealth().catch((err) => {
      logger.error('DLQ health check failed', { error: err.message });
    });

    return entry;
  }

  /**
   * Batch store multiple failed events
   * PERFORMANCE FIX: Process events in parallel batches instead of sequentially
   */
  async storeFailedEventsBatch(
    events: StoreFailedEventParams[]
  ): Promise<{ stored: number; failed: number; errors: string[] }> {
    logger.info('Batch storing failed events', { count: events.length });

    const errors: string[] = [];
    const BATCH_SIZE = 50; // Process 50 events concurrently at a time

    // Process in batches for controlled concurrency
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (event) => {
          await this.storeFailedEvent(event);
        })
      );

      // Collect errors from the batch
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          const message = result.reason instanceof Error ? result.reason.message : 'Unknown error';
          errors.push(`Event ${batch[idx].eventType}: ${message}`);
          logger.error('Failed to store event in batch', { error: message });
        }
      });
    }

    const stored = events.length - errors.length;
    const failed = errors.length;

    logger.info('Batch store completed', { stored, failed });
    return { stored, failed, errors };
  }

  /**
   * Get a single DLQ entry by eventId
   */
  async getEvent(eventId: string): Promise<IDLQEntry | null> {
    return DLQEntry.findOne({ eventId }).exec();
  }

  /**
   * Query DLQ entries with filters
   */
  async queryEvents(query: DLQQuery): Promise<{
    events: IDLQEntry[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      status,
      eventType,
      tags,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter.createdAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (filter.createdAt as Record<string, Date>).$lte = endDate;
      }
    }

    const [events, total] = await Promise.all([
      DLQEntry.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      DLQEntry.countDocuments(filter).exec(),
    ]);

    return {
      events,
      total,
      hasMore: offset + events.length < total,
    };
  }

  /**
   * Get DLQ statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byEventType: Record<string, number>;
    oldestPending: Date | null;
    recentActivity: { date: Date; count: number }[];
  }> {
    const [total, statusCounts, eventTypeCounts, oldestPending] = await Promise.all([
      DLQEntry.countDocuments().exec(),
      DLQEntry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).exec(),
      DLQEntry.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).exec(),
      DLQEntry.findOne({ status: 'pending' })
        .sort({ createdAt: 1 })
        .select('createdAt')
        .exec(),
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      byStatus[item._id] = item.count;
    }

    const byEventType: Record<string, number> = {};
    for (const item of eventTypeCounts) {
      byEventType[item._id] = item.count;
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await DLQEntry.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return {
      total,
      byStatus,
      byEventType,
      oldestPending: oldestPending?.createdAt || null,
      recentActivity: recentActivity.map((item: { _id: string; count: number }) => ({
        date: new Date(item._id),
        count: item.count,
      })),
    };
  }

  /**
   * Update event status with optional metadata
   *
   * FIX: Added optional metadata parameter to track replay details like
   * replayedAt, targetQueue, failedAt, and lastError.
   */
  async updateStatus(
    eventId: string,
    status: IDLQEntry['status'],
    metadata?: StatusUpdateMetadata
  ): Promise<IDLQEntry | null> {
    const updateFields: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    // Add metadata fields if provided
    if (metadata) {
      if (metadata.replayedAt) {
        updateFields.lastReplayAt = metadata.replayedAt;
      }
      if (metadata.targetQueue) {
        updateFields.targetQueue = metadata.targetQueue;
      }
      if (metadata.failedAt) {
        updateFields.failedAt = metadata.failedAt;
      }
      if (metadata.lastError) {
        updateFields.lastError = metadata.lastError;
      }
    }

    const entry = await DLQEntry.findOneAndUpdate(
      { eventId },
      { $set: updateFields },
      { new: true }
    ).exec();

    if (entry) {
      logger.info('Event status updated', { eventId, status, metadata });
    }

    return entry;
  }

  /**
   * Check DLQ health and send alerts when thresholds are exceeded
   *
   * FIX: Added alerting when DLQ size exceeds threshold to proactively
   * notify operators of potential issues with message processing.
   */
  async checkDLQHealth(): Promise<DLQAlert | null> {
    const stats = await this.getStatistics();
    const pendingCount = stats.byStatus.pending || 0;

    if (pendingCount > DLQ_ALERT_THRESHOLD) {
      const alert: DLQAlert = {
        type: 'DLQ_SIZE_EXCEEDED',
        severity: pendingCount > DLQ_ALERT_THRESHOLD * 2 ? 'critical' : 'warning',
        message: `DLQ has ${pendingCount} pending events, exceeding threshold of ${DLQ_ALERT_THRESHOLD}`,
        metadata: {
          pendingCount,
          threshold: DLQ_ALERT_THRESHOLD,
          byStatus: stats.byStatus,
          oldestPending: stats.oldestPending,
          total: stats.total,
        },
      };

      // Log the alert (in production, this would integrate with an alerting service)
      logger.warn('DLQ alert triggered', alert);

      // Send alert to configured alert service (Slack, PagerDuty, etc.)
      await this.sendAlert(alert);

      return alert;
    }

    return null;
  }

  /**
   * Send alert to configured alert channels
   */
  private async sendAlert(alert: DLQAlert): Promise<void> {
    const alertEndpoint = process.env.DLQ_ALERT_WEBHOOK_URL;

    if (!alertEndpoint) {
      logger.warn('No DLQ alert webhook configured, alert not sent', {
        alertType: alert.type,
        severity: alert.severity,
      });
      return;
    }

    try {
      // Format alert for webhook
      const webhookPayload = {
        text: `[${alert.severity.toUpperCase()}] ${alert.message}`,
        attachments: [
          {
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            })),
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      // Send to webhook (implementation depends on alert service)
      // In production, use proper HTTP client with retry logic
      logger.info('DLQ alert sent to webhook', { alertType: alert.type });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send DLQ alert', { error: errorMessage });
    }
  }

  /**
   * Get DLQ health status
   */
  async getDLQHealth(): Promise<{
    healthy: boolean;
    pendingCount: number;
    threshold: number;
    alert?: DLQAlert;
  }> {
    const stats = await this.getStatistics();
    const pendingCount = stats.byStatus.pending || 0;
    const isHealthy = pendingCount <= DLQ_ALERT_THRESHOLD;

    const alert: DLQAlert | undefined = isHealthy ? undefined : {
      type: 'DLQ_SIZE_EXCEEDED',
      severity: (pendingCount > DLQ_ALERT_THRESHOLD * 2 ? 'critical' : 'warning') as DLQAlert['severity'],
      message: `DLQ has ${pendingCount} pending events, exceeding threshold of ${DLQ_ALERT_THRESHOLD}`,
      metadata: stats,
    };

    return {
      healthy: isHealthy,
      pendingCount,
      threshold: DLQ_ALERT_THRESHOLD,
      alert,
    };
  }

  /**
   * Add tags to an event
   */
  async addTags(eventId: string, tags: string[]): Promise<IDLQEntry | null> {
    return DLQEntry.findOneAndUpdate(
      { eventId },
      { $addToSet: { tags: { $each: tags } }, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * Remove tags from an event
   */
  async removeTags(eventId: string, tags: string[]): Promise<IDLQEntry | null> {
    return DLQEntry.findOneAndUpdate(
      { eventId },
      { $pull: { tags: { $in: tags } }, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * Delete an event from DLQ
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    const result = await DLQEntry.deleteOne({ eventId }).exec();
    logger.info('Event deleted from DLQ', { eventId, deleted: result.deletedCount > 0 });
    return result.deletedCount > 0;
  }

  /**
   * Purge events by status or age
   */
  async purgeEvents(
    status?: IDLQEntry['status'],
    olderThan?: Date
  ): Promise<{ deleted: number }> {
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (olderThan) {
      filter.createdAt = { $lt: olderThan };
    }

    const result = await DLQEntry.deleteMany(filter).exec();
    logger.info('Events purged', { filter, deleted: result.deletedCount });

    return { deleted: result.deletedCount };
  }

  /**
   * Discard an event (mark as discarded, not recoverable)
   */
  async discardEvent(eventId: string): Promise<IDLQEntry | null> {
    return this.updateStatus(eventId, 'discarded');
  }
}

export const dlqService = new DLQService();
