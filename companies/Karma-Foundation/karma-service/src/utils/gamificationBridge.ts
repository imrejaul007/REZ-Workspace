/**
 * Karma → Gamification Bridge
 *
 * Emits karma award events to the gamification service via BullMQ queue.
 * The gamification service can then check for karma-based achievements,
 * badges, and other engagement rewards.
 *
 * Queue: 'gamification-events'
 * Event: 'karma.awarded'
 *
 * This is a fire-and-forget pattern — callers should catch and log errors
 * rather than letting them propagate. Karma operations must not fail
 * because the gamification bridge is unavailable.
 */
import { Queue } from 'bullmq';
import { createServiceLogger } from '../config/logger.js';
import { redisUrl } from '../config/index.js';

const log = createServiceLogger('gamificationBridge');

// ── Queue configuration ──────────────────────────────────────────────────────

const GAMIFICATION_QUEUE_NAME = 'gamification-events';

let gamificationQueue: Queue | null = null;

function getGamificationQueue(): Queue {
  if (!gamificationQueue) {
    gamificationQueue = new Queue(GAMIFICATION_QUEUE_NAME, {
      connection: {
        url: redisUrl,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    gamificationQueue.on('error', (err: Error) => {
      log.error('[GamificationBridge] Queue error (non-fatal)', {
        queue: GAMIFICATION_QUEUE_NAME,
        error: err.message,
      });
    });
    log.info('[GamificationBridge] Queue initialized', { queue: GAMIFICATION_QUEUE_NAME });
  }
  return gamificationQueue;
}

// ── Event types ─────────────────────────────────────────────────────────────

export interface KarmaAwardedEvent {
  userId: string;
  karmaAmount: number;
  eventId?: string;
  reason: string;
  eventType?: string;
  timestamp: Date;
  newActiveKarma?: number;
  newLevel?: string;
  source?: string;
  level?: string;
}

export interface KarmaLevelUpEvent {
  userId: string;
  oldLevel: string;
  newLevel: string;
  timestamp: Date;
}

// ── Fire-and-forget emitters ─────────────────────────────────────────────────

/**
 * Emit a karma.awarded event to the gamification queue.
 * This is async and will not throw — errors are logged only.
 */
export async function emitKarmaAwardedEvent(event: KarmaAwardedEvent): Promise<void> {
  try {
    const queue = getGamificationQueue();
    await queue.add('karma.awarded', event, {
      jobId: `karma-${event.userId}-${Date.now()}`,
    });
    log.debug('[GamificationBridge] karma.awarded emitted', { userId: event.userId });
  } catch (err) {
    log.error('[GamificationBridge] Failed to emit karma.awarded (non-fatal)', {
      userId: event.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Emit a karma.levelup event to the gamification queue.
 * This is async and will not throw — errors are logged only.
 */
export async function emitKarmaLevelUpEvent(event: KarmaLevelUpEvent): Promise<void> {
  try {
    const queue = getGamificationQueue();
    await queue.add('karma.levelup', event, {
      jobId: `levelup-${event.userId}-${Date.now()}`,
    });
    log.debug('[GamificationBridge] karma.levelup emitted', { userId: event.userId });
  } catch (err) {
    log.error('[GamificationBridge] Failed to emit karma.levelup (non-fatal)', {
      userId: event.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Close the gamification queue connection.
 * Call this during graceful shutdown.
 */
export async function closeGamificationBridge(): Promise<void> {
  if (gamificationQueue) {
    await gamificationQueue.close();
    gamificationQueue = null;
    log.info('[GamificationBridge] Queue closed');
  }
}
