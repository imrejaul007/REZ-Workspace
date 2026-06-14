/**
 * Wallet Consumer - Handles wallet service events
 * Updates local state when wallet events are received
 */

import { CoinSyncEvent } from '../types/index.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { BalanceAggregator } from '../services/BalanceAggregator.js';
import { TierManager } from '../services/TierManager.js';

export class WalletConsumer {
  private balanceAggregator: BalanceAggregator;
  private tierManager: TierManager;

  constructor(balanceAggregator: BalanceAggregator, tierManager: TierManager) {
    this.balanceAggregator = balanceAggregator;
    this.tierManager = tierManager;
  }

  /**
   * Handle wallet credited event
   */
  async handleCoinEarned(event: CoinSyncEvent): Promise<void> {
    logger.info('[WalletConsumer] Processing coin earned event', {
      userId: event.userId,
      amount: event.amount,
      coinType: event.coinType,
    });

    // Invalidate user's balance cache to force refresh
    await this.balanceAggregator.invalidateCache(event.userId);

    // Update sync status
    await redis.setex(
      `loyalty:sync:last:${event.userId}`,
      CACHE_TTL.SYNC_STATUS,
      new Date().toISOString()
    );

    logger.info('[WalletConsumer] Cache invalidated for user', { userId: event.userId });
  }

  /**
   * Handle wallet debited event
   */
  async handleCoinRedeemed(event: CoinSyncEvent): Promise<void> {
    logger.info('[WalletConsumer] Processing coin redeemed event', {
      userId: event.userId,
      amount: event.amount,
      coinType: event.coinType,
    });

    // Invalidate user's balance cache
    await this.balanceAggregator.invalidateCache(event.userId);

    // Update sync status
    await redis.setex(
      `loyalty:sync:last:${event.userId}`,
      CACHE_TTL.SYNC_STATUS,
      new Date().toISOString()
    );

    logger.info('[WalletConsumer] Cache invalidated for user', { userId: event.userId });
  }

  /**
   * Handle coin expired event
   */
  async handleCoinExpired(event: CoinSyncEvent): Promise<void> {
    logger.info('[WalletConsumer] Processing coin expired event', {
      userId: event.userId,
      amount: event.amount,
      coinType: event.coinType,
    });

    // Invalidate cache
    await this.balanceAggregator.invalidateCache(event.userId);

    logger.info('[WalletConsumer] Coin expired, cache invalidated', { userId: event.userId });
  }

  /**
   * Handle sync request event
   */
  async handleSyncRequest(event: CoinSyncEvent): Promise<void> {
    logger.info('[WalletConsumer] Processing sync request', {
      userId: event.userId,
    });

    // Force refresh from all services
    await this.balanceAggregator.getUnifiedBalance(event.userId, true);
    await this.tierManager.getHybridTierInfo(event.userId, true);

    logger.info('[WalletConsumer] Sync completed for user', { userId: event.userId });
  }
}