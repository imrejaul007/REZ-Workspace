/**
 * Wallet Credit Worker — listens on 'wallet-credit-events' queue for async wallet credits.
 *
 * Processes wallet credit requests from various gamification events including:
 * - Challenge completions (visit, spend, review, referral milestones)
 * - Daily check-ins
 * - Weekly streaks
 * - Weekend specials
 * - Category challenges
 *
 * Credits are processed asynchronously via BullMQ to prevent blocking the main event flow.
 */

import { Worker, Job, Queue } from 'bullmq';
import mongoose from 'mongoose';
import { bullmqRedis } from '../config/redis';
import { createServiceLogger } from '../config/logger';
import { creditWalletSync, WALLET_CREDIT_QUEUE, WalletCreditRequest } from '../services/walletIntegration.service';
import { recordJobProcessed, recordJobFailed } from '../httpServer';

const logger = createServiceLogger('wallet-credit-worker');

// ── Worker Lifecycle ──────────────────────────────────────────────────────────

let _worker: Worker | null = null;
let _notifQueue: Queue | null = null;

function getNotifQueue(): Queue {
  if (!_notifQueue) {
    _notifQueue = new Queue('notification-events', { connection: bullmqRedis });
  }
  return _notifQueue;
}

/**
 * Starts the BullMQ wallet credit worker on the 'wallet-credit-events' queue.
 * @returns The BullMQ worker instance (singleton)
 */
export function startWalletCreditWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker<WalletCreditRequest>(
    WALLET_CREDIT_QUEUE,
    async (job: Job<WalletCreditRequest>) => {
      const jobStartMs = Date.now();
      const request = job.data;

      logger.debug('[WalletCreditWorker] Processing wallet credit job', {
        jobId: job.id,
        userId: request.userId,
        amount: request.amount,
        source: request.source,
      });

      try {
        // Credit wallet synchronously
        const result = await creditWalletSync(request);

        if (!result.success) {
          throw new Error(result.error || 'Wallet credit failed');
        }

        // Enqueue notification for successful credit
        await enqueueCreditNotification(request, result);

        recordJobProcessed('wallet_credit', Date.now() - jobStartMs);

        logger.info('[WalletCreditWorker] Wallet credit job completed', {
          jobId: job.id,
          userId: request.userId,
          amount: request.amount,
          xpAwarded: result.xpAwarded,
          source: request.source,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[WalletCreditWorker] Wallet credit job failed', {
          jobId: job.id,
          userId: request.userId,
          amount: request.amount,
          source: request.source,
          error: errorMessage,
          attempts: job.attemptsMade,
        });

        recordJobFailed('wallet_credit');
        throw error;
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 10,
      limiter: { max: 50, duration: 1000 },
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  );

  _worker.on('failed', async (job, err) => {
    logger.error('[WalletCreditWorker] Job failed', {
      jobId: job?.id,
      userId: (job?.data as WalletCreditRequest)?.userId,
      error: err instanceof Error ? err.message : String(err),
      attempts: job?.attemptsMade,
    });

    // Move to dead-letter queue on final failure
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
      await moveToDeadLetterQueue(job);
    }
  });

  _worker.on('error', (err) => {
    logger.error('[WalletCreditWorker] Worker error: ' + err.message);
  });

  _worker.on('completed', (job) => {
    logger.debug('[WalletCreditWorker] Job completed', { jobId: job.id });
  });

  logger.info('[WalletCreditWorker] Started — queue: ' + WALLET_CREDIT_QUEUE);
  return _worker;
}

/**
 * Moves a failed job to the dead-letter queue for inspection.
 */
async function moveToDeadLetterQueue(job: Job): Promise<void> {
  try {
    const dlqKey = `dlq:${WALLET_CREDIT_QUEUE}`;
    const entry = JSON.stringify({
      jobId: job.id,
      data: job.data,
      error: job.failedReason,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade,
    });
    await bullmqRedis.lpush(dlqKey, entry);
    await bullmqRedis.ltrim(dlqKey, 0, 999);
    logger.info(`[DLQ] Wallet credit job moved to dead-letter queue`, {
      queue: WALLET_CREDIT_QUEUE,
      jobId: job.id,
    });
  } catch (dlqErr) {
    logger.error('[DLQ] Failed to write wallet credit job to dead-letter queue', {
      queue: WALLET_CREDIT_QUEUE,
      jobId: job.id,
      dlqError: dlqErr instanceof Error ? dlqErr.message : String(dlqErr),
    });
  }
}

/**
 * Enqueues a notification for successful wallet credit.
 */
async function enqueueCreditNotification(
  request: WalletCreditRequest,
  result: { success: boolean; credited: boolean; amount: number; xpAwarded: number },
): Promise<void> {
  const { getNotificationQueue } = await import('../services/notificationService');
  const notifQueue = getNotificationQueue();

  try {
    await notifQueue.add(
      'reward_credited',
      {
        eventId: `reward-credited-${request.userId}-${request.source}-${Date.now()}`,
        eventType: 'gamification.reward_credited',
        userId: request.userId,
        channels: ['push', 'in_app'],
        payload: {
          title: 'Coins Earned!',
          body: `+${result.amount} REZ coins from ${formatSourceName(request.source)}!`,
          channelId: 'gamification',
          priority: 'default',
          data: {
            coins: result.amount,
            xp: result.xpAwarded,
            source: request.source,
            description: request.description,
          },
        },
        category: 'gamification',
        source: 'wallet-credit-worker',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  } catch (error) {
    logger.error('[WalletCreditWorker] Failed to enqueue credit notification', {
      userId: request.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Formats the reward source name for display in notifications.
 */
function formatSourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    visit_milestone: 'Visit Milestone',
    spend_milestone: 'Spend Milestone',
    review_milestone: 'Review Milestone',
    referral_milestone: 'Referral Milestone',
    daily_checkin: 'Daily Check-in',
    weekly_streak: 'Weekly Streak',
    weekend_special: 'Weekend Special',
    category_challenge: 'Category Challenge',
    achievement: 'Achievement',
    challenge_completion: 'Challenge',
  };
  return sourceNames[source] || source;
}

/**
 * Stops the wallet credit worker.
 */
export async function stopWalletCreditWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
  if (_notifQueue) {
    await _notifQueue.close();
    _notifQueue = null;
  }
  logger.info('[WalletCreditWorker] Stopped');
}

// ── Event Types for Incoming Jobs ─────────────────────────────────────────────

export interface VisitMilestoneCreditRequest extends WalletCreditRequest {
  source: 'visit_milestone';
  milestoneVisits: number;
}

export interface SpendMilestoneCreditRequest extends WalletCreditRequest {
  source: 'spend_milestone';
  milestoneAmount: number;
}

export interface ReviewMilestoneCreditRequest extends WalletCreditRequest {
  source: 'review_milestone';
  milestoneCount: number;
}

export interface ReferralMilestoneCreditRequest extends WalletCreditRequest {
  source: 'referral_milestone';
  milestoneCount: number;
}

export interface DailyCheckinCreditRequest extends WalletCreditRequest {
  source: 'daily_checkin';
}

export interface WeeklyStreakCreditRequest extends WalletCreditRequest {
  source: 'weekly_streak';
  streakDays: number;
}

export interface WeekendSpecialCreditRequest extends WalletCreditRequest {
  source: 'weekend_special';
}

export interface CategoryChallengeCreditRequest extends WalletCreditRequest {
  source: 'category_challenge';
  categories: string[];
}
