import { Wallet, IWallet } from '../models/Wallet';
import { WalletReadModel } from '../models/WalletReadModel';
import { logger } from '../config/logger';

/**
 * Wallet Projection Service
 *
 * Updates the read model from write model changes.
 * This runs asynchronously after each write operation.
 */

export class WalletProjectionService {

  /**
   * Project wallet changes to the read model
   * Called after every wallet mutation
   */
  async projectWallet(userId: string): Promise<void> {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        logger.warn('[Projection] Wallet not found for projection', { userId });
        return;
      }

      await this.updateReadModel(wallet);
    } catch (error) {
      logger.error('[Projection] Failed to project wallet', { userId, error });
      // Don't throw - projection failures shouldn't break the main flow
    }
  }

  /**
   * Update or create the read model for a wallet
   */
  async updateReadModel(wallet: IWallet): Promise<void> {
    const update = {
      userId: wallet.user.toString(),
      balance: {
        total: wallet.balance.total,
        available: wallet.balance.available,
        pending: wallet.balance.pending,
        cashback: wallet.balance.cashback,
      },
      statistics: {
        totalEarned: wallet.statistics.totalEarned,
        totalSpent: wallet.statistics.totalSpent,
        totalCashback: wallet.statistics.totalCashback,
        transactionCount: wallet.statistics.transactionCount,
      },
      lastUpdated: new Date(),
    };

    await WalletReadModel.findOneAndUpdate(
      { userId: update.userId },
      { $set: update, $inc: { version: 1 } },
      { upsert: true, new: true }
    );
  }

  /**
   * Batch projection - for initial migration or replay
   */
  async projectAllWallets(batchSize: number = 100): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    const cursor = Wallet.find().cursor({ batchSize });

    for await (const wallet of cursor) {
      try {
        await this.updateReadModel(wallet);
        processed++;

        if (processed % batchSize === 0) {
          logger.info('[Projection] Batch progress', { processed, errors });
        }
      } catch (error) {
        errors++;
        logger.error('[Projection] Error in batch', { userId: wallet.user, error });
      }
    }

    logger.info('[Projection] Batch complete', { processed, errors });
    return { processed, errors };
  }
}

export const walletProjectionService = new WalletProjectionService();
