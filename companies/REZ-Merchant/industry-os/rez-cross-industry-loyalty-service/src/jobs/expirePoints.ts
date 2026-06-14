import { LoyaltyTransactionModel, UnifiedAccount } from '../models';
import { logger } from '../utils/logger';
import { sendLoyaltyNotification } from '../integrations/rabtul';

let cronJobRunning = false;

/**
 * Expire points that have passed their expiration date
 * This job should run daily at midnight
 */
export async function expirePoints(): Promise<{
  processed: number;
  expired: number;
  errors: number;
}> {
  if (cronJobRunning) {
    logger.warn('Points expiration job already running, skipping...');
    return { processed: 0, expired: 0, errors: 0 };
  }

  cronJobRunning = true;
  let processed = 0;
  let expired = 0;
  let errors = 0;

  logger.info('Starting points expiration job');

  try {
    const now = new Date();

    // Find all earn transactions that have expired
    // We use a cursor to process in batches for memory efficiency
    const cursor = LoyaltyTransactionModel.find({
      type: 'earn',
      expiresAt: { $lte: now }
    }).cursor({ batchSize: 100 });

    for await (const txn of cursor) {
      processed++;

      try {
        // Check if this expiration was already processed
        const existingExpire = await LoyaltyTransactionModel.findOne({
          type: 'expire',
          sourceId: txn.transactionId
        });

        if (existingExpire) {
          continue;
        }

        // Create expiration transaction
        const expireTxnId = `txn_exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const expireTransaction = new LoyaltyTransactionModel({
          transactionId: expireTxnId,
          accountId: txn.accountId,
          userId: txn.userId,
          merchantId: txn.merchantId,
          vertical: txn.vertical,
          type: 'expire',
          points: -Math.abs(txn.points),
          source: 'expiration_cron',
          sourceId: txn.transactionId,
          description: `Points expired from transaction ${txn.transactionId}`,
          createdAt: new Date()
        });

        await expireTransaction.save();

        // Update account - deduct the expired points from vertical
        const account = await UnifiedAccount.findOne({ accountId: txn.accountId });
        if (account) {
          // Find and update the vertical
          const verticalIndex = account.verticals.findIndex(
            v => v.vertical === txn.vertical
          );

          if (verticalIndex >= 0) {
            account.verticals[verticalIndex].points -= txn.points;
            account.verticals[verticalIndex].lastActivity = new Date();

            // Recalculate total points
            account.totalPoints = account.verticals.reduce(
              (sum, v) => sum + v.points,
              0
            );

            await account.save();

            // Send expiration notification
            await sendLoyaltyNotification({
              type: 'expiration',
              accountId: account.accountId,
              userId: account.userId,
              points: txn.points,
              vertical: txn.vertical,
              metadata: {
                originalTransactionId: txn.transactionId,
                verticals: account.verticals.map(v => v.vertical)
              }
            });
          }
        }

        expired++;

        if (expired % 100 === 0) {
          logger.info(`Expiration progress: ${expired} transactions expired`);
        }
      } catch (error) {
        logger.error(`Error processing expiration for txn ${txn.transactionId}:`, error);
        errors++;
      }
    }

    logger.info(
      `Points expiration job completed: ${processed} processed, ${expired} expired, ${errors} errors`
    );

    return { processed, expired, errors };
  } catch (error) {
    logger.error('Points expiration job failed:', error);
    throw error;
  } finally {
    cronJobRunning = false;
  }
}

/**
 * Preview pending expirations without actually expiring them
 */
export async function previewExpirations(
  daysAhead: number = 7
): Promise<{
  totalPoints: number;
  transactionCount: number;
  accounts: Array<{
    accountId: string;
    points: number;
    verticals: string[];
  }>;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  const pendingExpirations = await LoyaltyTransactionModel.aggregate([
    {
      $match: {
        type: 'earn',
        expiresAt: {
          $lte: cutoffDate,
          $gt: new Date()
        }
      }
    },
    {
      $group: {
        _id: '$accountId',
        totalExpiring: { $sum: '$points' },
        verticals: { $addToSet: '$vertical' },
        transactions: { $push: '$transactionId' }
      }
    },
    { $sort: { totalExpiring: -1 } }
  ]);

  return {
    totalPoints: pendingExpirations.reduce((sum, p) => sum + p.totalExpiring, 0),
    transactionCount: pendingExpirations.reduce((sum, p) => sum + p.transactions.length, 0),
    accounts: pendingExpirations.map(p => ({
      accountId: p._id,
      points: p.totalExpiring,
      verticals: p.verticals
    }))
  };
}

/**
 * Start the expiration cron job
 * Runs daily at midnight
 */
export function startExpirePointsJob(): void {
  // Calculate time until next midnight
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  // Schedule first run at midnight
  setTimeout(() => {
    // Run immediately at midnight
    expirePoints()
      .catch(error => logger.error('Scheduled expiration failed:', error))
      .finally(() => {
        // Then run every 24 hours
        setInterval(() => {
          expirePoints()
            .catch(error => logger.error('Scheduled expiration failed:', error));
        }, 24 * 60 * 60 * 1000);
      });
  }, msUntilMidnight);

  logger.info(
    `Points expiration job scheduled. Next run at ${nextMidnight.toISOString()}`
  );
}

/**
 * Manual trigger for expiration (for testing/admin)
 */
export async function triggerExpirePoints(): Promise<void> {
  await expirePoints();
}

export default {
  expirePoints,
  previewExpirations,
  startExpirePointsJob,
  triggerExpirePoints
};