// @ts-nocheck
/**
 * Coin Sync Service
 *
 * SINGLE SOURCE OF TRUTH: Wallet API
 *
 * This service ensures that all coin balances across the app are synchronized
 * with the Wallet API. Gamification system only manages achievements and challenges,
 * while ALL coin balances come from the wallet.
 *
 * Architecture:
 * - Wallet API (/wallet/balance) is the ONLY source for coin balances
 * - Points API (/points/*) is used for earning/spending operations
 * - Gamification API (/gamification/*) is used ONLY for achievements, challenges, games
 * - When gamification rewards coins, they are immediately synced to wallet
 *
 * Flow:
 * 1. User earns coins from gamification (games, challenges, achievements)
 * 2. Coins are awarded via Points API (/points/earn)
 * 3. Points API automatically updates Wallet balance
 * 4. Frontend fetches latest balance from Wallet API
 * 5. All UI displays wallet balance (single source of truth)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import walletApi from './walletApi';
import pointsApi, { PointsBalance } from './pointsApi';
import gamificationAPI from './gamificationApi';
import apiClient, { ApiResponse } from './apiClient';
import { logger } from '@/utils/logger';

export interface CoinSyncResult {
  success: boolean;
  walletBalance: number;
  pointsBalance: number;
  synced: boolean;
  difference?: number;
  error?: string;
}

export interface CoinRewardSyncResult {
  success: boolean;
  coinsAdded: number;
  newWalletBalance: number;
  source: string;
  error?: string;
}

class CoinSyncService {
  private readonly SYNC_KEY = 'coin_sync_last_sync';
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private syncInProgress = false;

  /**
   * Get current coin balance from WALLET API (single source of truth)
   */
  async getWalletBalance(): Promise<number> {
    try {
      logger.info('🔄 [COIN SYNC] Fetching wallet balance (source of truth)...');

      const response = await walletApi.getBalance();

      if (response.success && response.data) {
        // CA-GAM-019 FIX: Defensive checks for multiple possible wallet response structures
        // Wallet balance structure variations:
        // - { balance: { total, available, pending, cashback } }
        // - { coins: { available, ... } }
        // - { balance: [...], coins: [...] }
        let balance = response.data.balance?.available;
        if (balance === undefined) {
          // coins is an array of BackendCoinBalance ({ type, amount, ... }).
          // Use the 'rez' (universal) coin's amount as the available balance.
          // REGRESSION FIX: Only assign when a 'rez' entry is found; otherwise
          // leave `balance` undefined so the next fallback (array-shaped balance)
          // is still evaluated. Previously `?? 0` locked balance to 0 and short-
          // circuited the fallback chain.
          const rezCoin = response.data.coins?.find(c => c.type === 'rez');
          if (rezCoin?.amount !== undefined) {
            balance = rezCoin.amount;
          }
        }
        if (balance === undefined && Array.isArray(response.data.balance)) {
          balance = response.data.balance[0]?.available;
        }
        balance = balance || 0;

        // Validate it's a safe number
        if (typeof balance !== 'number' || isNaN(balance)) {
          logger.warn('⚠️ [COIN SYNC] Wallet balance is NaN, using 0');
          balance = 0;
        }

        logger.info(`✅ [COIN SYNC] Wallet balance: ${balance}`);
        return balance;
      }

      throw new Error(response.error || 'Failed to fetch wallet balance');
    } catch (error) {
      logger.error('❌ [COIN SYNC] Error fetching wallet balance:', error as Error);
      throw error;
    }
  }

  /**
   * Get points balance (used for cross-checking only)
   */
  async getPointsBalance(): Promise<PointsBalance | null> {
    try {
      logger.info('🔄 [COIN SYNC] Fetching points balance for verification...');

      const response = await pointsApi.getBalance();

      if (response.success && response.data) {
        logger.info(`✅ [COIN SYNC] Points balance: ${response.data.total}`);
        return response.data;
      }

      return null;
    } catch (error) {
      logger.warn('⚠️ [COIN SYNC] Could not fetch points balance:', error);
      return null;
    }
  }

  /**
   * Sync gamification rewards to wallet
   * When user earns coins from games/challenges, credit them to wallet
   *
   * CA-GAM-001 FIX: Idempotency guard via AsyncStorage + idempotency key in API metadata.
   * On retry (network drop, crash, double-tap), the same idempotency key is used so the
   * backend can deduplicate. Frontend also checks AsyncStorage before calling to prevent
   * the API call from firing twice in the same session.
   */
  async syncGamificationReward(
    amount: number,
    source: 'spin_wheel' | 'scratch_card' | 'quiz' | 'challenge' | 'achievement' | 'daily_login' | 'bonus',
    metadata?: unknown
  ): Promise<CoinRewardSyncResult> {
    try {
      logger.info(`🎮 [COIN SYNC] Syncing gamification reward: ${amount} coins from ${source}`);

      // CA-GAM-054 FIX: Validate award amount has max bound to prevent exploitation
      const MAX_AWARD_PER_EVENT = 10000;
      if (amount <= 0 || amount > MAX_AWARD_PER_EVENT) {
        throw new Error(`Reward amount must be > 0 and <= ${MAX_AWARD_PER_EVENT}`);
      }

      // CA-GAM-001 FIX: Generate idempotency key for this specific reward event.
      // Format: reward_sync:${source}:${amount}:${rounded_timestamp}
      // The rounded timestamp (to 5-second windows) groups rapid taps as the same intent.
      const timestampBucket = Math.floor(Date.now() / 5000);
      const idempotencyKey = `reward_sync:${source}:${amount}:${timestampBucket}`;

      // Frontend guard: check AsyncStorage before making the API call.
      // This prevents double calls even when the API call itself is not retryable.
      const rewardStorageKey = `${this.SYNC_KEY}:${idempotencyKey}`;
      const existingReward = await AsyncStorage.getItem(rewardStorageKey).catch(() => null);
      if (existingReward) {
        logger.info(`🎮 [COIN SYNC] Reward already processed (idempotency key: ${idempotencyKey}), skipping.`);
        const cached = JSON.parse(existingReward) as CoinRewardSyncResult;
        return cached;
      }

      // Step 1: Award points via Points API with idempotency key in metadata
      const earnResponse = await pointsApi.earnPoints({
        amount,
        source,
        description: `Earned ${amount} coins from ${source.replace(/_/g, ' ')}`,
        metadata: {
          syncedToWallet: true,
          timestamp: new Date().toISOString(),
          idempotencyKey, // CA-GAM-001 FIX: pass idempotency key for backend deduplication
          ...metadata,
        },
      });

      if (!earnResponse.success || !earnResponse.data) {
        throw new Error(earnResponse.error || 'Failed to earn points');
      }

      logger.info(`✅ [COIN SYNC] Points awarded: ${amount}`);

      // Step 2: Verify wallet balance was updated
      const newWalletBalance = await this.getWalletBalance();

      logger.info(`✅ [COIN SYNC] Reward synced successfully. New wallet balance: ${newWalletBalance}`);

      // CA-GAM-001 FIX: Persist successful award to AsyncStorage after balance is confirmed.
      // On next attempt with the same idempotency key, return the cached result instead of
      // calling the API again. 5-minute TTL prevents indefinite storage.
      const finalResult: CoinRewardSyncResult = {
        success: true,
        coinsAdded: amount,
        newWalletBalance,
        source,
      };
      try {
        await AsyncStorage.setItem(rewardStorageKey, JSON.stringify(finalResult)).catch(() => {});
        // Auto-expire after 5 minutes to keep storage lean
        setTimeout(() => {
          AsyncStorage.removeItem(rewardStorageKey).catch(() => {});
        }, 5 * 60 * 1000);
      } catch (_cacheErr) {
        // Non-critical — don't fail the reward for cache errors
      }

      return finalResult;
    } catch (error) {
      logger.error('❌ [COIN SYNC] Error syncing gamification reward:', error as Error);
      return {
        success: false,
        coinsAdded: 0,
        newWalletBalance: 0,
        source,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Spend coins from wallet
   */
  async spendCoins(
    amount: number,
    purpose: string,
    metadata?: unknown
  ): Promise<CoinRewardSyncResult> {
    try {
      logger.info(`💸 [COIN SYNC] Spending ${amount} coins for: ${purpose}`);

      if (amount <= 0) {
        throw new Error('Spend amount must be greater than 0');
      }

      // Step 1: Spend points via Points API
      const spendResponse = await pointsApi.spendPoints({
        amount,
        purpose,
        description: purpose,
        metadata: {
          syncedToWallet: true,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });

      if (!spendResponse.success || !spendResponse.data) {
        throw new Error(spendResponse.error || 'Failed to spend points');
      }

      logger.info(`✅ [COIN SYNC] Points spent: ${amount}`);

      // Step 2: Verify wallet balance was updated
      const newWalletBalance = await this.getWalletBalance();

      logger.info(`✅ [COIN SYNC] Coins spent successfully. New wallet balance: ${newWalletBalance}`);

      return {
        success: true,
        coinsAdded: -amount,
        newWalletBalance,
        source: 'spending',
      };
    } catch (error) {
      logger.error('❌ [COIN SYNC] Error spending coins:', error as Error);
      return {
        success: false,
        coinsAdded: 0,
        newWalletBalance: 0,
        source: 'spending',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if wallet and points are in sync
   */
  async checkSync(): Promise<CoinSyncResult> {
    try {
      logger.info('🔍 [COIN SYNC] Checking wallet and points sync status...');

      const [walletBalance, pointsBalance] = await Promise.all([
        this.getWalletBalance(),
        this.getPointsBalance(),
      ]);

      if (!pointsBalance) {
        // If points balance is unavailable, wallet is still source of truth
        return {
          success: true,
          walletBalance,
          pointsBalance: walletBalance,
          synced: true,
        };
      }

      const difference = Math.abs(walletBalance - pointsBalance.total);
      const synced = difference < 1; // Allow 1 coin tolerance for rounding

      if (synced) {
        logger.info(`✅ [COIN SYNC] Wallet and points are in sync: ${walletBalance}`);
      } else {
        logger.warn(
          `⚠️ [COIN SYNC] Sync mismatch detected!\n` +
          `  Wallet: ${walletBalance}\n` +
          `  Points: ${pointsBalance.total}\n` +
          `  Difference: ${difference}`
        );
      }

      return {
        success: true,
        walletBalance,
        pointsBalance: pointsBalance.total,
        synced,
        difference: synced ? 0 : difference,
      };
    } catch (error) {
      logger.error('❌ [COIN SYNC] Error checking sync:', error as Error);
      return {
        success: false,
        walletBalance: 0,
        pointsBalance: 0,
        synced: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Force sync points to wallet (admin/recovery function)
   * This should rarely be needed as Points API auto-syncs to wallet
   */
  async forceSyncPointsToWallet(): Promise<CoinSyncResult> {
    if (this.syncInProgress) {
      logger.warn('⚠️ [COIN SYNC] Sync already in progress, skipping...');
      return {
        success: false,
        walletBalance: 0,
        pointsBalance: 0,
        synced: false,
        error: 'Sync already in progress',
      };
    }

    try {
      this.syncInProgress = true;
      logger.info('🔄 [COIN SYNC] Force syncing points to wallet...');

      const syncStatus = await this.checkSync();

      if (syncStatus.synced) {
        logger.info('✅ [COIN SYNC] Already in sync, no action needed');
        return syncStatus;
      }

      if (!syncStatus.success || syncStatus.difference === undefined) {
        throw new Error('Could not determine sync status');
      }

      // Wallet is always source of truth - we don't modify it
      // This function is mainly for verification
      logger.warn(
        `⚠️ [COIN SYNC] Sync mismatch detected but wallet is source of truth.\n` +
        `  Using wallet balance: ${syncStatus.walletBalance}`
      );

      return {
        success: true,
        walletBalance: syncStatus.walletBalance,
        pointsBalance: syncStatus.walletBalance,
        synced: true,
      };
    } catch (error) {
      logger.error('❌ [COIN SYNC] Error force syncing:', error as Error);
      return {
        success: false,
        walletBalance: 0,
        pointsBalance: 0,
        synced: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle coin rewards from mini-games
   */
  async handleGameReward(
    gameType: 'spin_wheel' | 'scratch_card' | 'quiz',
    coinsWon: number,
    gameData?: unknown
  ): Promise<CoinRewardSyncResult> {
    logger.info(`🎮 [COIN SYNC] Handling ${gameType} reward: ${coinsWon} coins`);

    return this.syncGamificationReward(coinsWon, gameType, {
      gameType,
      gameData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle challenge completion rewards
   */
  async handleChallengeReward(
    challengeId: string,
    challengeName: string,
    coinsReward: number
  ): Promise<CoinRewardSyncResult> {
    logger.info(`🏆 [COIN SYNC] Handling challenge reward: ${coinsReward} coins for ${challengeName}`);

    return this.syncGamificationReward(coinsReward, 'challenge', {
      challengeId,
      challengeName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle achievement unlock rewards
   */
  async handleAchievementReward(
    achievementId: string,
    achievementName: string,
    coinsReward: number
  ): Promise<CoinRewardSyncResult> {
    logger.info(`🎖️ [COIN SYNC] Handling achievement reward: ${coinsReward} coins for ${achievementName}`);

    return this.syncGamificationReward(coinsReward, 'achievement', {
      achievementId,
      achievementName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle daily login streak rewards
   */
  async handleDailyLoginReward(
    streak: number,
    coinsReward: number
  ): Promise<CoinRewardSyncResult> {
    logger.info(`📅 [COIN SYNC] Handling daily login reward: ${coinsReward} coins (streak: ${streak})`);

    return this.syncGamificationReward(coinsReward, 'daily_login', {
      streak,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): Date | null {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        const lastSync = localStorage.getItem(this.SYNC_KEY);
        return lastSync ? new Date(lastSync) : null;
      }
      // For native platforms, use cached value (async version below)
      return this._cachedLastSyncTime || null;
    } catch {
      return null;
    }
  }

  // Cached value for native platforms
  private _cachedLastSyncTime: Date | null = null;

  /**
   * Get last sync timestamp (async version for native)
   */
  async getLastSyncTimeAsync(): Promise<Date | null> {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        const lastSync = localStorage.getItem(this.SYNC_KEY);
        return lastSync ? new Date(lastSync) : null;
      }
      // Native platforms use AsyncStorage
      const lastSync = await AsyncStorage.getItem(this.SYNC_KEY);
      this._cachedLastSyncTime = lastSync ? new Date(lastSync) : null;
      return this._cachedLastSyncTime;
    } catch {
      return null;
    }
  }

  /**
   * Check if sync is needed (based on interval)
   */
  shouldSync(): boolean {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;

    const timeSinceSync = Date.now() - lastSync.getTime();
    return timeSinceSync > this.SYNC_INTERVAL;
  }

  /**
   * Update last sync timestamp
   */
  private updateLastSyncTime(): void {
    const timestamp = new Date().toISOString();
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.SYNC_KEY, timestamp);
      } else {
        // CA-GAM-022 FIX: Update cached value IMMEDIATELY before async write
        // This prevents shouldSync() from checking stale timestamp if app crashes
        this._cachedLastSyncTime = new Date(timestamp);
        // Then persist to AsyncStorage asynchronously
        AsyncStorage.setItem(this.SYNC_KEY, timestamp).catch((error) => {
          logger.warn('⚠️ [COIN SYNC] Could not update last sync time in AsyncStorage:', error);
        });
      }
    } catch (error) {
      logger.warn('⚠️ [COIN SYNC] Could not update last sync time:', error);
    }
  }
}

// Export singleton instance
const coinSyncService = new CoinSyncService();
export default coinSyncService;

// Export convenience functions
export const {
  getWalletBalance,
  syncGamificationReward,
  spendCoins,
  checkSync,
  handleGameReward,
  handleChallengeReward,
  handleAchievementReward,
  handleDailyLoginReward,
} = coinSyncService;
