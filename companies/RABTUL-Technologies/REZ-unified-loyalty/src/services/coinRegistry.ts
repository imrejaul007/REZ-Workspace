import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import {
  CoinType,
  CoinTypeSchema,
  TransactionType,
  CoinSource,
  TIER_BENEFITS,
  TierLevel
} from '../types/index.js';
import {
  UserWallet,
  Transaction,
  IUserWallet,
  ITransaction
} from '../models/index.js';
import { Errors } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Coin Registry Service
 * Manages unified coin/points registry across all apps
 */
export class CoinRegistryService {
  private coinTypes = Object.values(CoinType);

  /**
   * Initialize or get user wallet
   */
  async getOrCreateWallet(userId: string): Promise<IUserWallet> {
    let wallet = await UserWallet.findOne({ userId });

    if (!wallet) {
      wallet = await UserWallet.create({
        userId,
        balances: this.coinTypes.map(coinType => ({
          coinType,
          available: 0,
          locked: 0,
          expired: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          lastUpdated: new Date()
        })),
        totalValueUSD: 0,
        lastSyncedAt: new Date()
      });

      logger.info('Created new wallet', { userId });
    }

    return wallet;
  }

  /**
   * Get wallet balance for a user
   */
  async getBalance(
    userId: string,
    coinType?: CoinType
  ): Promise<{ balance: IUserWallet['balances'][0] | IUserWallet['balances']; totalValueUSD: number }> {
    const wallet = await this.getOrCreateWallet(userId);

    if (coinType) {
      const balance = wallet.balances.find(b => b.coinType === coinType);
      if (!balance) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }
      return { balance, totalValueUSD: wallet.totalValueUSD };
    }

    return { balance: wallet.balances, totalValueUSD: wallet.totalValueUSD };
  }

  /**
   * Earn coins for a user
   */
  async earnCoins(params: {
    userId: string;
    amount: number;
    coinType: CoinType;
    source: CoinSource;
    description: string;
    referenceId?: string;
    sourceAppUserId?: string;
    metadata?: Record<string, unknown>;
    expiresInDays?: number;
    applyTierMultiplier?: boolean;
    userTier?: TierLevel;
  }): Promise<{ transaction: ITransaction; newBalance: number }> {
    const {
      userId,
      amount,
      coinType,
      source,
      description,
      referenceId,
      sourceAppUserId,
      metadata,
      expiresInDays = 365,
      applyTierMultiplier = true,
      userTier = TierLevel.BRONZE
    } = params;

    // Check for duplicate transaction
    if (referenceId) {
      const existing = await Transaction.findOne({ referenceId });
      if (existing) {
        throw Errors.duplicateTransaction(referenceId);
      }
    }

    // Calculate tier multiplier
    let finalAmount = amount;
    if (applyTierMultiplier) {
      const tierMultiplier = TIER_BENEFITS[userTier].earningMultiplier;
      finalAmount = Math.floor(amount * tierMultiplier);
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create transaction record
    const transactionId = uuidv4();
    const transaction = await Transaction.create({
      id: transactionId,
      userId,
      coinType,
      amount: finalAmount,
      type: TransactionType.EARN,
      source,
      sourceAppUserId,
      description,
      referenceId,
      expiresAt,
      tierAtTransaction: userTier,
      metadata,
      createdAt: new Date()
    });

    // Update wallet balance
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await UserWallet.findOne({ userId }).session(session);

      if (!wallet) {
        throw Errors.notFound('User wallet');
      }

      const balanceIndex = wallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (balanceIndex === -1) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }

      const balance = wallet.balances[balanceIndex];
      balance.available += finalAmount;
      balance.lifetimeEarned += finalAmount;
      balance.lastUpdated = new Date();

      await wallet.save({ session });
      await session.commitTransaction();

      logger.info('Coins earned', {
        userId,
        coinType,
        amount,
        finalAmount,
        source,
        transactionId
      });

      return {
        transaction: transaction.toObject() as ITransaction,
        newBalance: balance.available
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Redeem coins from a user
   */
  async redeemCoins(params: {
    userId: string;
    amount: number;
    coinType: CoinType;
    description: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ transaction: ITransaction; newBalance: number }> {
    const {
      userId,
      amount,
      coinType,
      description,
      referenceId,
      metadata
    } = params;

    // Check for duplicate transaction
    if (referenceId) {
      const existing = await Transaction.findOne({ referenceId });
      if (existing) {
        throw Errors.duplicateTransaction(referenceId);
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await UserWallet.findOne({ userId }).session(session);

      if (!wallet) {
        throw Errors.notFound('User wallet');
      }

      const balanceIndex = wallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (balanceIndex === -1) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }

      const balance = wallet.balances[balanceIndex];

      // Check sufficient balance
      if (balance.available < amount) {
        throw Errors.insufficientCoins(balance.available, amount);
      }

      // Deduct coins
      balance.available -= amount;
      balance.lifetimeRedeemed += amount;
      balance.lastUpdated = new Date();

      // Create transaction record
      const transactionId = uuidv4();
      const transaction = await Transaction.create([{
        id: transactionId,
        userId,
        coinType,
        amount: -amount,
        type: TransactionType.REDEEM,
        source: CoinSource.MANUAL,
        description,
        referenceId,
        tierAtTransaction: await this.getUserTier(userId),
        metadata,
        createdAt: new Date()
      }], { session });

      await wallet.save({ session });
      await session.commitTransaction();

      logger.info('Coins redeemed', {
        userId,
        coinType,
        amount,
        transactionId
      });

      return {
        transaction: transaction[0].toObject() as ITransaction,
        newBalance: balance.available
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Lock coins for pending operations
   */
  async lockCoins(
    userId: string,
    coinType: CoinType,
    amount: number,
    referenceId: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await UserWallet.findOne({ userId }).session(session);

      if (!wallet) {
        throw Errors.notFound('User wallet');
      }

      const balanceIndex = wallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (balanceIndex === -1) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }

      const balance = wallet.balances[balanceIndex];

      if (balance.available < amount) {
        throw Errors.insufficientCoins(balance.available, amount);
      }

      balance.available -= amount;
      balance.locked += amount;
      balance.lastUpdated = new Date();

      await wallet.save({ session });
      await session.commitTransaction();

      logger.info('Coins locked', { userId, coinType, amount, referenceId });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Unlock previously locked coins
   */
  async unlockCoins(
    userId: string,
    coinType: CoinType,
    amount: number
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await UserWallet.findOne({ userId }).session(session);

      if (!wallet) {
        throw Errors.notFound('User wallet');
      }

      const balanceIndex = wallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (balanceIndex === -1) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }

      const balance = wallet.balances[balanceIndex];

      if (balance.locked < amount) {
        throw new Error(`Cannot unlock ${amount} coins, only ${balance.locked} locked`);
      }

      balance.locked -= amount;
      balance.available += amount;
      balance.lastUpdated = new Date();

      await wallet.save({ session });
      await session.commitTransaction();

      logger.info('Coins unlocked', { userId, coinType, amount });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Expire coins that have passed their expiration date
   */
  async expireCoins(): Promise<{ expiredCount: number; expiredAmount: number }> {
    const now = new Date();

    // Find all transactions that have expired but haven't been processed
    const expiredTransactions = await Transaction.find({
      type: TransactionType.EARN,
      expiresAt: { $lte: now },
      coinType: { $ne: CoinType.PROMO } // PROMO coins don't expire
    }).limit(1000);

    let expiredCount = 0;
    let expiredAmount = 0;

    for (const tx of expiredTransactions) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const wallet = await UserWallet.findOne({ userId: tx.userId }).session(session);

        if (!wallet) {
          await session.abortTransaction();
          continue;
        }

        const balanceIndex = wallet.balances.findIndex(
          b => b.coinType === tx.coinType
        );

        if (balanceIndex === -1) {
          await session.abortTransaction();
          continue;
        }

        const balance = wallet.balances[balanceIndex];

        if (balance.available < tx.amount) {
          // Create expiration record for partial amount
          const expiredAmt = balance.available;
          balance.expired += expiredAmt;
          balance.available = 0;

          await Transaction.create([{
            id: uuidv4(),
            userId: tx.userId,
            coinType: tx.coinType,
            amount: -expiredAmt,
            type: TransactionType.EXPIRE,
            source: CoinSource.SYSTEM,
            description: `Expired ${expiredAmt} ${tx.coinType} coins`,
            relatedTransactionId: tx.id,
            tierAtTransaction: TierLevel.BRONZE,
            createdAt: new Date()
          }], { session });

          expiredAmount += expiredAmt;
          expiredCount++;
        } else {
          // Full expiration
          balance.expired += tx.amount;
          balance.available -= tx.amount;

          await Transaction.create([{
            id: uuidv4(),
            userId: tx.userId,
            coinType: tx.coinType,
            amount: -tx.amount,
            type: TransactionType.EXPIRE,
            source: CoinSource.SYSTEM,
            description: `Expired ${tx.amount} ${tx.coinType} coins`,
            relatedTransactionId: tx.id,
            tierAtTransaction: TierLevel.BRONZE,
            createdAt: new Date()
          }], { session });

          expiredAmount += tx.amount;
          expiredCount++;
        }

        balance.lastUpdated = new Date();
        await wallet.save({ session });
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        logger.error('Error expiring coins', { error, transactionId: tx.id });
      } finally {
        session.endSession();
      }
    }

    if (expiredCount > 0) {
      logger.info('Expired coins processed', { expiredCount, expiredAmount });
    }

    return { expiredCount, expiredAmount };
  }

  /**
   * Get user's current tier from user profile
   */
  private async getUserTier(userId: string): Promise<TierLevel> {
    // Try to get tier from user profile/service
    try {
      const { UserProfile } = await import('../models/index.js');
      const profile = await UserProfile.findOne({ userId }).lean();
      return (profile?.loyaltyTier as TierLevel) || TierLevel.BRONZE;
    } catch {
      // Fallback to bronze if profile lookup fails
      return TierLevel.BRONZE;
    }
  }

  /**
   * Transfer coins between users
   */
  async transferCoins(params: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    coinType: CoinType;
    description: string;
  }): Promise<{ debitTransaction: ITransaction; creditTransaction: ITransaction }> {
    const { fromUserId, toUserId, amount, coinType, description } = params;

    if (fromUserId === toUserId) {
      throw Errors.badRequest('Cannot transfer to same user');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get both wallets
      const [fromWallet, toWallet] = await Promise.all([
        UserWallet.findOne({ userId: fromUserId }).session(session),
        UserWallet.findOne({ userId: toUserId }).session(session)
      ]);

      if (!fromWallet) {
        throw Errors.notFound('Sender wallet');
      }

      if (!toWallet) {
        throw Errors.notFound('Recipient wallet');
      }

      // Check sender balance
      const fromBalanceIndex = fromWallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (fromBalanceIndex === -1) {
        throw Errors.notFound(`Sender balance for ${coinType}`);
      }

      const fromBalance = fromWallet.balances[fromBalanceIndex];

      if (fromBalance.available < amount) {
        throw Errors.insufficientCoins(fromBalance.available, amount);
      }

      // Get or create recipient balance
      let toBalanceIndex = toWallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (toBalanceIndex === -1) {
        toWallet.balances.push({
          coinType,
          available: 0,
          locked: 0,
          expired: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          lastUpdated: new Date()
        });
        toBalanceIndex = toWallet.balances.length - 1;
      }

      const toBalance = toWallet.balances[toBalanceIndex];

      // Perform transfer
      fromBalance.available -= amount;
      fromBalance.lifetimeRedeemed += amount;
      fromBalance.lastUpdated = new Date();

      toBalance.available += amount;
      toBalance.lifetimeEarned += amount;
      toBalance.lastUpdated = new Date();

      // Create transactions
      const transferId = uuidv4();
      const [debitTx, creditTx] = await Transaction.create([
        {
          id: uuidv4(),
          userId: fromUserId,
          coinType,
          amount: -amount,
          type: TransactionType.TRANSFER_OUT,
          source: CoinSource.MANUAL,
          description: `Transfer to ${toUserId}: ${description}`,
          relatedTransactionId: transferId,
          tierAtTransaction: TierLevel.BRONZE,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          userId: toUserId,
          coinType,
          amount: amount,
          type: TransactionType.TRANSFER_IN,
          source: CoinSource.MANUAL,
          description: `Transfer from ${fromUserId}: ${description}`,
          relatedTransactionId: transferId,
          tierAtTransaction: TierLevel.BRONZE,
          createdAt: new Date()
        }
      ], { session });

      await fromWallet.save({ session });
      await toWallet.save({ session });
      await session.commitTransaction();

      logger.info('Coins transferred', {
        fromUserId,
        toUserId,
        amount,
        coinType
      });

      return {
        debitTransaction: debitTx.toObject() as ITransaction,
        creditTransaction: creditTx.toObject() as ITransaction
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    options: {
      coinType?: CoinType;
      type?: TransactionType;
      source?: CoinSource;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const {
      coinType,
      type,
      source,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = options;

    const query: Record<string, unknown> = { userId };

    if (coinType) {
      query.coinType = coinType;
    }

    if (type) {
      query.type = type;
    }

    if (source) {
      query.source = source;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        (query.createdAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.createdAt as Record<string, Date>).$lte = endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    return { transactions: transactions as ITransaction[], total };
  }

  /**
   * Adjust coin balance (admin operation)
   */
  async adjustBalance(params: {
    userId: string;
    amount: number;
    coinType: CoinType;
    reason: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ transaction: ITransaction; newBalance: number }> {
    const { userId, amount, coinType, reason, referenceId, metadata } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await UserWallet.findOne({ userId }).session(session);

      if (!wallet) {
        throw Errors.notFound('User wallet');
      }

      const balanceIndex = wallet.balances.findIndex(
        b => b.coinType === coinType
      );

      if (balanceIndex === -1) {
        throw Errors.notFound(`Balance for ${coinType}`);
      }

      const balance = wallet.balances[balanceIndex];

      if (amount > 0) {
        balance.available += amount;
        balance.lifetimeEarned += amount;
      } else {
        const absAmount = Math.abs(amount);
        if (balance.available < absAmount) {
          throw Errors.insufficientCoins(balance.available, absAmount);
        }
        balance.available -= absAmount;
        balance.lifetimeRedeemed += absAmount;
      }

      balance.lastUpdated = new Date();

      // Create adjustment transaction
      const transaction = await Transaction.create([{
        id: uuidv4(),
        userId,
        coinType,
        amount,
        type: TransactionType.ADJUST,
        source: CoinSource.MANUAL,
        description: reason,
        referenceId,
        tierAtTransaction: TierLevel.BRONZE,
        metadata,
        createdAt: new Date()
      }], { session });

      await wallet.save({ session });
      await session.commitTransaction();

      logger.info('Balance adjusted', {
        userId,
        coinType,
        amount,
        reason
      });

      return {
        transaction: transaction[0].toObject() as ITransaction,
        newBalance: balance.available
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// Export singleton instance
export const coinRegistry = new CoinRegistryService();
