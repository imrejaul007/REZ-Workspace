/**
 * Gamification Worker — standalone BullMQ consumer for gamification-events queue.
 *
 * Phase C extraction. Processes gamification events: achievements, challenges,
 * streaks, leaderboard invalidation, mission progress, analytics.
 */

import { Worker, Job, Queue } from 'bullmq';
import mongoose from 'mongoose';
import { bullmqRedis } from './config/redis';
import { createServiceLogger } from './config/logger';
import { jobMetrics, recordJobProcessed, recordJobFailed } from './httpServer';
import { invalidateLeaderboardCache } from './services/leaderboardService';

const logger = createServiceLogger('gamification-worker');

export const QUEUE_NAME = 'gamification-events';

// H24: IST timezone helpers (UTC+5:30).
// Day boundaries must be evaluated in IST so users active between 00:00–05:30 IST
// (still "yesterday" in UTC) are not incorrectly penalised on streak checks.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const toISTDate = (d: Date): Date => new Date(d.getTime() + IST_OFFSET_MS);
const istDayStart = (d: Date): Date => {
  const ist = toISTDate(d);
  return new Date(ist.getFullYear(), ist.getMonth(), ist.getDate());
};
function getISTDateString(d: Date): string {
  return toISTDate(d).toISOString().split('T')[0]; // YYYY-MM-DD in IST
}

export interface ActivityEvent {
  eventId: string;
  type: string;
  userId: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

// Achievement metric mapping (mirrors monolith's achievementMetrics.ts)
//
// BUG FIX (P2-C6): `pos_bill_paid` was absent from every map below, so
// in-store POS customers were excluded from challenges, streaks, and
// savings metrics. They're now first-class citizens alongside the
// online `store_payment_confirmed` path.
const EVENT_TO_METRICS: Record<string, string[]> = {
  order_placed: ['orders_placed'],
  order_delivered: ['orders_completed'],
  review_submitted: ['reviews_written'],
  referral_completed: ['referrals_made'],
  login: ['login_count'],
  daily_checkin: ['checkin_count'],
  bill_uploaded: ['bills_uploaded'],
  social_share: ['shares_count'],
  offer_redeemed: ['offers_redeemed'],
  game_won: ['games_won'],
  store_payment_confirmed: ['payments_made'],
  pos_bill_paid: ['payments_made'],
};

// Challenge action mapping
const EVENT_TO_CHALLENGE: Record<string, string> = {
  order_placed: 'order_count',
  order_delivered: 'order_count',
  review_submitted: 'review_count',
  referral_completed: 'refer_friends',
  login: 'login_streak',
  daily_checkin: 'login_streak',
  bill_uploaded: 'upload_bills',
  social_share: 'share_deals',
  offer_redeemed: 'visit_stores',
  pos_bill_paid: 'visit_stores',
};

// Streak type mapping
const EVENT_TO_STREAK: Record<string, string> = {
  login: 'login',
  daily_checkin: 'login',
  order_placed: 'order',
  order_delivered: 'order',
  review_submitted: 'review',
  store_payment_confirmed: 'savings',
  pos_bill_paid: 'savings',
};

// Leaderboard-affecting events
const LEADERBOARD_EVENTS = new Set([
  'order_placed', 'order_delivered', 'review_submitted',
  'referral_completed', 'game_won', 'daily_checkin', 'bill_uploaded',
  'pos_bill_paid',
]);

// Events that award REZ coins — coin amounts come from event.data.coins (set by monolith)
// or fall back to these defaults so a notification is always sent.
const COIN_AWARD_DEFAULTS: Record<string, number> = {
  store_payment_confirmed: 50,
  visit_checked_in:        10,
  // pos_bill_paid uses the actual coinsEarned from the bill; no default
  // is set here because the fan-out helper in posBillingController has
  // already computed and credited the real amount via walletService.
};

let _notifQueue: Queue | null = null;
let _achievementQueue: Queue | null = null;

function getNotifQueue(): Queue {
  if (!_notifQueue) {
    _notifQueue = new Queue('notification-events', { connection: bullmqRedis });
  }
  return _notifQueue;
}

// CS-M3 fix: singleton so we don't create+destroy a Queue connection per job
function getAchievementQueue(): Queue {
  if (!_achievementQueue) {
    _achievementQueue = new Queue('achievement-events', { connection: bullmqRedis });
  }
  return _achievementQueue;
}

async function enqueueCoinEarnedNotification(
  userId: string,
  coins: number,
  source: string,
  jobId: string | undefined,
): Promise<void> {
  await getNotifQueue().add(
    'coin_earned',
    {
      // MA-L1 FIX: Use the event's own id for a stable deduplication key, not the BullMQ job.id
      // which changes on every retry. Falls back to Date.now() only if no event id is present.
      eventId: `coin-earned-${userId}-${source}-${jobId ?? Date.now()}`,
      eventType: 'coin_earned',
      userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'REZ Coins earned!',
        body: `+${coins} REZ coins landed in your wallet!`,
        channelId: 'rewards',
        priority: 'default',
        data: { coins, source },
      },
      category: 'behavioral',
      source: 'gamification-worker',
      createdAt: new Date().toISOString(),
    },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  );
}

let _worker: Worker | null = null;

export function startGamificationWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<ActivityEvent>) => {
      const event = job.data;
      const jobStartMs = Date.now();

      logger.debug('[Worker] Processing gamification event', {
        type: event.type,
        userId: event.userId,
        eventId: event.eventId,
        attempt: job.attemptsMade,
      });

      const errors: string[] = [];

      // FIX 3: Track completed handlers in job progress to prevent double-increment on retry.
      // GAM-MED-03 FIX: Validate job.progress at runtime before accessing completedHandlers.
      // If the cast produces the wrong shape, accessing progress.completedHandlers would return
      // undefined and the guard would fail silently, causing duplicate coin awards.
      // Guard: ensure progress is a plain object with an optional string[] field.
      const rawProgress = job.progress;
      const progress =
        rawProgress !== null && typeof rawProgress === 'object' && !Array.isArray(rawProgress)
          ? (rawProgress as Record<string, unknown>)
          : {};
      const completedHandlers: string[] = Array.isArray(progress.completedHandlers)
        ? (progress.completedHandlers as string[])
        : [];

      const markHandlerDone = async (handlerName: string) => {
        completedHandlers.push(handlerName);
        await job.updateProgress({ completedHandlers });
      };

      // 1. Achievement progress — update metric counters
      if (!completedHandlers.includes('achievement')) {
        try {
          const affectedMetrics = EVENT_TO_METRICS[event.type];
          if (affectedMetrics && affectedMetrics.length > 0) {
            const UserAchievementProgress = mongoose.connection.collection('userachievementprogresses');
            for (const metric of affectedMetrics) {
              await UserAchievementProgress.updateMany(
                { userId: event.userId, [`metrics.${metric}`]: { $exists: true } },
                { $inc: { [`metrics.${metric}.current`]: 1 } },
              );
            }
          }
          await markHandlerDone('achievement');
        } catch (err) {
          errors.push(`achievement:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 2. Challenge progress
      if (!completedHandlers.includes('challenge')) {
        try {
          const action = EVENT_TO_CHALLENGE[event.type];
          if (action) {
            const UserChallengeProgress = mongoose.connection.collection('userchallengeprogresses');
            await UserChallengeProgress.updateMany(
              {
                userId: event.userId,
                status: 'active',
                [`actions.${action}.target`]: { $exists: true },
              },
              { $inc: { [`actions.${action}.current`]: 1 } },
            );
          }
          await markHandlerDone('challenge');
        } catch (err) {
          errors.push(`challenge:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 3. Streak update
      // Uses day-aware logic: only increment if the last activity was yesterday.
      // If it was today, treat as idempotent. If it was further back, reset to 1.
      if (!completedHandlers.includes('streak')) try {
        const streakType = EVENT_TO_STREAK[event.type];
        if (streakType) {
          const UserStreak = mongoose.connection.collection('userstreaks');
          // H24: use IST date strings so day boundaries are evaluated at midnight IST
          // (UTC+5:30) rather than midnight UTC, preventing incorrect streak resets for
          // users active between 00:00–05:30 IST (which is still "yesterday" in UTC).
          const nowIst = new Date();
          const today = getISTDateString(nowIst);
          const yesterday = getISTDateString(new Date(Date.now() - 86_400_000));

          // Atomic upsert — eliminates TOCTOU race where two concurrent workers
          // both read null and both call insertOne, creating duplicate streak docs.
          // returnDocument:'before' returns null if the doc was just inserted (new user).
          const preExisting = await UserStreak.findOneAndUpdate(
            { userId: event.userId, type: streakType },
            {
              $setOnInsert: {
                userId: event.userId,
                type: streakType,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { upsert: true, returnDocument: 'before' },
          );

          if (preExisting) {
            const lastDate: string = preExisting.lastActivityDate as string;

            if (lastDate === today) {
              // Already recorded today — idempotent, no change needed
            } else if (lastDate === yesterday) {
              // Consecutive day — increment
              const newStreak = ((preExisting.currentStreak as number) ?? 0) + 1;
              const newLongest = Math.max(newStreak, (preExisting.longestStreak as number) ?? 1);
              await UserStreak.updateOne(
                { _id: preExisting._id },
                {
                  $set: {
                    currentStreak: newStreak,
                    longestStreak: newLongest,
                    lastActivityDate: today,
                    updatedAt: new Date(),
                  },
                },
              );
            } else {
              // Gap > 1 day — reset streak
              await UserStreak.updateOne(
                { _id: preExisting._id },
                {
                  $set: {
                    currentStreak: 1,
                    lastActivityDate: today,
                    updatedAt: new Date(),
                  },
                },
              );
            }
          }
        }
        await markHandlerDone('streak');
      } catch (err) {
        errors.push(`streak:${err instanceof Error ? err.message : String(err)}`);
      }

      // 4. Leaderboard cache invalidation — clear both Redis keys and the in-process
      // HTTP server cache (they are separate; Redis del alone had no effect on served data)
      if (!completedHandlers.includes('leaderboard')) {
        try {
          if (LEADERBOARD_EVENTS.has(event.type)) {
            await bullmqRedis.del('leaderboard:weekly');
            await bullmqRedis.del('leaderboard:monthly');
            invalidateLeaderboardCache(); // clears httpServer.ts in-memory cache
          }
          await markHandlerDone('leaderboard');
        } catch (err) {
          errors.push(`leaderboard:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 5. Mission progress
      if (!completedHandlers.includes('mission')) {
        try {
          const UserMission = mongoose.connection.collection('usermissions');
          await UserMission.updateMany(
            {
              userId: event.userId,
              status: 'active',
              [`tasks.eventType`]: event.type,
            },
            { $inc: { [`tasks.$.current`]: 1 } },
          );
          await markHandlerDone('mission');
        } catch (err) {
          errors.push(`mission:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 6. Coin earned notification for payment + check-in events
      if (!completedHandlers.includes('coin_earned_notif')) {
        try {
          const defaultCoins = COIN_AWARD_DEFAULTS[event.type];
          if (defaultCoins !== undefined) {
            const coins: number = (event.data?.coins as number) || defaultCoins;
            await enqueueCoinEarnedNotification(event.userId, coins, event.type, job.id);
          }
          await markHandlerDone('coin_earned_notif');
        } catch (err) {
          errors.push(`coin_earned_notif:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 7. Forward visit_checked_in to achievement-events queue for milestone processing.
      // achievementWorker runs on its own queue so both workers process every checkin
      // without competing for the same job (was: both on 'gamification-events' → ~50% loss).
      if (event.type === 'visit_checked_in' && !completedHandlers.includes('achievement_forward')) {
        try {
          // CS-M3 fix: use singleton achievementQueue (defined at module level) instead
          // of creating and immediately closing a new Queue instance per job —
          // creating/destroying per job exhausts the Redis connection pool under load.
          await getAchievementQueue().add('visit_checked_in', event, {
            removeOnComplete: { age: 3600, count: 10000 },
            removeOnFail: { age: 86400, count: 5000 },
          });
          await markHandlerDone('achievement_forward');
        } catch (err) {
          errors.push(`achievement_forward:${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (errors.length > 0) {
        logger.warn('[Worker] Some handlers failed', { eventId: event.eventId, errors });
        // Re-throw so BullMQ marks the job as failed and triggers retry/backoff.
        // Without this, partial failures are silently swallowed and never retried.
        throw new Error(`Partial failure: ${errors.join('; ')}`);
      }

      recordJobProcessed(event.type, Date.now() - jobStartMs);
    },
    {
      connection: bullmqRedis,
      concurrency: 5,
      limiter: { max: 100, duration: 1000 },
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  );

  jobMetrics.activeWorkers++;

  _worker.on('failed', async (job, err) => {
    if (job) recordJobFailed(job.data?.type ?? 'unknown');
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      type: job?.name,
      userId: (job?.data as ActivityEvent)?.userId,
      error: err instanceof Error ? err.message : String(err),
      attempts: job?.attemptsMade,
    });
    // GAM-HIGH-01 FIX: Dead-letter queue writes must be awaited so errors propagate
    // rather than being silently swallowed. Previously lpush/ltrim were fire-and-forget
    // in the on('failed') async handler — an unhandled rejection there would crash the process.
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
      try {
        const dlqKey = `dlq:${QUEUE_NAME}`;
        const entry = JSON.stringify({
          jobId: job.id,
          data: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade,
        });
        await bullmqRedis.lpush(dlqKey, entry);
        await bullmqRedis.ltrim(dlqKey, 0, 999);
        logger.info(`[DLQ] Job moved to dead-letter queue`, { queue: QUEUE_NAME, jobId: job.id });
      } catch (dlqErr) {
        // Log at error level since DLQ write failure means the job is lost for admin inspection.
        // This must not throw — throwing from an event handler crashes the Node process.
        logger.error('[DLQ] Failed to write to dead-letter queue', { queue: QUEUE_NAME, jobId: job?.id, dlqError: dlqErr instanceof Error ? dlqErr.message : String(dlqErr) });
      }
    }
  });

  _worker.on('error', (err) => {
    logger.error('[Worker] Error: ' + err.message);
  });

  logger.info('[Worker] Started — queue: ' + QUEUE_NAME);
  return _worker;
}

export async function stopWorker(): Promise<void> {
  if (_worker) {
    jobMetrics.activeWorkers = Math.max(0, jobMetrics.activeWorkers - 1);
    await _worker.close();
    _worker = null;
  }
  if (_notifQueue) {
    await _notifQueue.close();
    _notifQueue = null;
  }
}
