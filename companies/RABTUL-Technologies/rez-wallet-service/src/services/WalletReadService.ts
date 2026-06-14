import { WalletReadModel, IWalletReadModel } from '../models/WalletReadModel';
import { Wallet } from '../models/Wallet';
import { logger } from '../config/logger';

/**
 * Wallet Read Service
 *
 * Optimized read operations using the CQRS read model.
 * Falls back to the write model if read model is stale.
 */

export class WalletReadService {

  /**
   * Get wallet balance using optimized read model
   * Response time target: <10ms
   */
  async getBalance(userId: string): Promise<{
    total: number;
    available: number;
    pending: number;
    cashback: number;
  } | null> {
    // Try read model first (fast path)
    const readModel = await WalletReadModel.findOne({ userId })
      .select('balance version lastUpdated')
      .lean();

    if (readModel && this.isReadModelFresh(readModel)) {
      logger.debug('[ReadService] Using read model', { userId });
      return readModel.balance;
    }

    // Fallback to write model (slower but accurate)
    logger.debug('[ReadService] Falling back to write model', { userId });
    const wallet = await Wallet.findOne({ user: userId })
      .select('balance')
      .lean();

    return wallet?.balance ?? null;
  }

  /**
   * Get wallet statistics using optimized read model
   */
  async getStatistics(userId: string): Promise<{
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    transactionCount: number;
  } | null> {
    const readModel = await WalletReadModel.findOne({ userId })
      .select('statistics version lastUpdated')
      .lean();

    if (readModel && this.isReadModelFresh(readModel)) {
      return readModel.statistics;
    }

    const wallet = await Wallet.findOne({ user: userId })
      .select('statistics')
      .lean();

    return wallet?.statistics ?? null;
  }

  /**
   * Check if read model is fresh (updated within last 5 seconds)
   */
  private isReadModelFresh(readModel: IWalletReadModel | Record<string, unknown>): boolean {
    const lastUpdated = readModel.lastUpdated as Date | undefined;
    if (!lastUpdated) return false;
    const fiveSecondsAgo = Date.now() - 5000;
    return lastUpdated.getTime() > fiveSecondsAgo;
  }

  /**
   * Get top wallets by balance (leaderboard)
   * Uses read model's optimized index
   */
  async getTopWallets(limit: number = 10): Promise<Array<{ userId: string; balance: { total: number; available: number; pending: number; cashback: number } }>> {
    return WalletReadModel.find()
      .sort({ 'balance.total': -1 })
      .limit(limit)
      .select('userId balance')
      .lean();
  }
}

export const walletReadService = new WalletReadService();
