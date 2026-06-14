import { Router, Request, Response, NextFunction } from 'express';
import { dlqService } from '../services/dlq.service';
import { replayService } from '../services/replay.service';
import { IDLQEntry } from '../models/dlq.model';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const router = Router();

// PERFORMANCE FIX: Add pagination defaults to prevent unbounded queries
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

// Validation helpers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== DLQ Management Routes ====================

/**
 * POST /api/dlq/events
 * Store a failed event in the DLQ
 */
router.post(
  '/events',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId, eventType, payload, error, metadata, tags } = req.body;

    if (!eventType || !payload || !error || !metadata?.source) {
      res.status(400).json({
        error: 'Missing required fields: eventType, payload, error, metadata.source',
      });
      return;
    }

    const entry = await dlqService.storeFailedEvent({
      eventId,
      eventType,
      payload,
      error,
      metadata,
      tags,
    });

    if (!entry) {
      res.status(409).json({ error: 'Duplicate event already exists' });
      return;
    }

    logger.info('Event stored via API', { eventId: entry.eventId });
    res.status(201).json({ success: true, event: entry });
  })
);

/**
 * POST /api/dlq/events/batch
 * Batch store failed events
 */
router.post(
  '/events/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Events array is required' });
      return;
    }

    const result = await dlqService.storeFailedEventsBatch(events);
    res.status(201).json({ success: true, ...result });
  })
);

/**
 * GET /api/dlq/events
 * List DLQ events with optional filters
 */
router.get(
  '/events',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      eventType,
      tags,
      startDate,
      endDate,
      limit: rawLimit,
      offset,
    } = req.query;

    // PERFORMANCE FIX: Enforce pagination defaults to prevent unbounded result sets
    const parsedLimit = rawLimit ? parseInt(rawLimit as string, 10) : DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT); // Clamp between 1 and MAX_LIMIT
    const offsetNum = offset ? parseInt(offset as string, 10) : 0;

    const result = await dlqService.queryEvents({
      status: status as IDLQEntry['status'],
      eventType: eventType as string,
      tags: tags ? (tags as string).split(',') : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit,
      offset: offsetNum,
    });

    res.json(result);
  })
);

/**
 * GET /api/dlq/events/:eventId
 * Get a single DLQ event
 */
router.get(
  '/events/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const event = await dlqService.getEvent(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, event });
  })
);

/**
 * PATCH /api/dlq/events/:eventId
 * Update event status or tags
 */
router.patch(
  '/events/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { status, tags, action } = req.body;

    const event = await dlqService.getEvent(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    let updatedEvent = event;

    if (status) {
      updatedEvent = (await dlqService.updateStatus(eventId, status))!;
    }

    if (tags && Array.isArray(tags)) {
      if (action === 'add') {
        updatedEvent = (await dlqService.addTags(eventId, tags))!;
      } else if (action === 'remove') {
        updatedEvent = (await dlqService.removeTags(eventId, tags))!;
      }
    }

    res.json({ success: true, event: updatedEvent });
  })
);

/**
 * DELETE /api/dlq/events/:eventId
 * Delete a single DLQ event
 */
router.delete(
  '/events/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const deleted = await dlqService.deleteEvent(eventId);

    if (!deleted) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    logger.info('Event deleted via API', { eventId });
    res.json({ success: true, message: 'Event deleted' });
  })
);

/**
 * DELETE /api/dlq/events
 * Purge events by filter
 */
router.delete(
  '/events',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, olderThan } = req.query;

    const result = await dlqService.purgeEvents(
      status as IDLQEntry['status'],
      olderThan ? new Date(olderThan as string) : undefined
    );

    logger.info('Events purged via API', { filter: req.query, ...result });
    res.json({ success: true, ...result });
  })
);

// ==================== Replay Routes ====================

/**
 * POST /api/dlq/replay/:eventId
 * Replay a single event
 */
router.post(
  '/replay/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { targetQueue } = req.body;

    const result = await replayService.replayEvent(eventId, targetQueue);

    logger.info('Event replayed via API', { eventId, success: result.success });
    res.json({ success: true, result });
  })
);

/**
 * POST /api/dlq/replay/batch
 * Replay multiple events by IDs
 */
router.post(
  '/replay/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventIds, targetQueue } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      res.status(400).json({ error: 'eventIds array is required' });
      return;
    }

    const progress = await replayService.replayEvents(eventIds, targetQueue);
    res.json({ success: true, progress });
  })
);

/**
 * POST /api/dlq/replay/pending
 * Replay all pending events
 */
router.post(
  '/replay/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const progress = await replayService.replayAllPending(
      limit ? parseInt(limit as string, 10) : undefined
    );

    logger.info('Pending events replay triggered via API', { progress });
    res.json({ success: true, progress });
  })
);

/**
 * POST /api/dlq/replay/filter
 * Replay events matching filter criteria
 */
router.post(
  '/replay/filter',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventType, tags, olderThan, targetQueue } = req.body;

    const progress = await replayService.replayByFilter(
      { eventType, tags, olderThan: olderThan ? new Date(olderThan) : undefined },
      targetQueue
    );

    res.json({ success: true, progress });
  })
);

/**
 * GET /api/dlq/replay/status
 * Get current replay status
 */
router.get('/replay/status', (req: Request, res: Response) => {
  const status = replayService.getStatus();
  res.json(status);
});

/**
 * POST /api/dlq/replay/:eventId/reset
 * Reset an event for replay
 */
router.post(
  '/replay/:eventId/reset',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const event = await replayService.resetForReplay(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, event });
  })
);

/**
 * POST /api/dlq/replay/:eventId/schedule
 * Schedule automatic replay
 */
router.post(
  '/replay/:eventId/schedule',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const event = await replayService.scheduleReplay(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, event });
  })
);

/**
 * DELETE /api/dlq/replay/:eventId/schedule
 * Cancel scheduled replay
 */
router.delete(
  '/replay/:eventId/schedule',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const event = await replayService.cancelScheduledReplay(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, event });
  })
);

// ==================== Statistics Route ====================

/**
 * GET /api/dlq/stats
 * Get DLQ statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await dlqService.getStatistics();
    res.json({ success: true, stats });
  })
);

export default router;
