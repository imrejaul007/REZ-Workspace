import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RideWallet, RideWalletDocument } from '../models/wallet.model';
import {
  WalletTransaction,
  WalletTransactionDocument,
  TransactionType,
  TransactionStatus,
  TransactionSource,
} from '../models/wallet-transaction.model';

/**
 * Wallet Service - User/Driver balances with MongoDB persistence
 * Replaces in-memory Map with proper database-backed wallet
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger('WalletService');
  private readonly DEFAULT_INITIAL_BALANCE = 0;

  constructor(
    @InjectModel(RideWallet.name) private walletModel: Model<RideWalletDocument>,
    @InjectModel(WalletTransaction.name) private transactionModel: Model<WalletTransactionDocument>,
  ) {}

  /**
   * Get wallet for user, creating if doesn't exist
   */
  async getWallet(userId: string): Promise<RideWallet> {
    let wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      wallet = await this.walletModel.create({
        userId,
        balance: this.DEFAULT_INITIAL_BALANCE,
        totalEarned: 0,
        totalSpent: 0,
        pendingBalance: 0,
        isActive: true,
      });
    }
    return wallet;
  }

  /**
   * Get balance for user
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    return wallet.balance;
  }

  /**
   * Debit user wallet with idempotency and transaction support
   */
  async debit(
    userId: string,
    amount: number,
    source: TransactionSource,
    referenceId?: string,
    idempotencyKey?: string,
    session?: ClientSession,
  ): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Use provided idempotency key or generate one
    const key = idempotencyKey || `${source}:${userId}:${referenceId}:${Date.now()}`;

    // Check idempotency - prevent double debit
    const existingTx = await this.transactionModel.findOne({ idempotencyKey: key });
    if (existingTx) {
      this.logger.warn(`Duplicate debit attempt detected: ${key}`);
      return {
        success: existingTx.status === TransactionStatus.COMPLETED,
        transaction: existingTx,
        error: existingTx.status === TransactionStatus.COMPLETED ? undefined : 'Transaction already exists with different status',
      };
    }

    // Create transaction record first
    const transaction = await this.transactionModel.create(
      [{
        userId,
        type: TransactionType.DEBIT,
        amount,
        balanceBefore: 0, // Will be updated
        balanceAfter: 0, // Will be updated
        status: TransactionStatus.PENDING,
        source,
        referenceId,
        idempotencyKey: key,
        description: `Debit: ${source}`,
      }],
      { session }
    );

    try {
      // Atomic update with balance check
      const wallet = await this.walletModel.findOneAndUpdate(
        {
          userId,
          balance: { $gte: amount },
          isActive: true,
        },
        {
          $inc: {
            balance: -amount,
            totalSpent: amount,
          },
          $set: {
            lastTransactionAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!wallet) {
        // Rollback transaction
        await this.transactionModel.updateOne(
          { _id: transaction[0]._id },
          {
            status: TransactionStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'Insufficient balance or wallet inactive',
          },
          { session }
        );
        return { success: false, error: 'Insufficient balance or wallet inactive' };
      }

      // Update transaction with actual balances
      await this.transactionModel.updateOne(
        { _id: transaction[0]._id },
        {
          balanceBefore: wallet.balance + amount,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
        { session }
      );

      this.logger.log(`Debit successful: ${userId} -${amount} (${source})`);

      return {
        success: true,
        transaction: (await this.transactionModel.findById(transaction[0]._id).lean()) ?? undefined,
      };
    } catch (error) {
      // Mark transaction as failed
      await this.transactionModel.updateOne(
        { _id: transaction[0]._id },
        {
          status: TransactionStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
        { session }
      );
      throw error;
    }
  }

  /**
   * Credit user wallet with idempotency and transaction support
   */
  async credit(
    userId: string,
    amount: number,
    source: TransactionSource,
    referenceId?: string,
    idempotencyKey?: string,
    session?: ClientSession,
  ): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Use provided idempotency key or generate one
    const key = idempotencyKey || `${source}:${userId}:${referenceId}:${Date.now()}`;

    // Check idempotency - prevent double credit
    const existingTx = await this.transactionModel.findOne({ idempotencyKey: key });
    if (existingTx) {
      this.logger.warn(`Duplicate credit attempt detected: ${key}`);
      return {
        success: existingTx.status === TransactionStatus.COMPLETED,
        transaction: existingTx,
        error: existingTx.status === TransactionStatus.COMPLETED ? undefined : 'Transaction already exists with different status',
      };
    }

    // Get current wallet balance
    const currentWallet = await this.getWallet(userId);
    const balanceBefore = currentWallet.balance;

    // Create transaction record
    const transaction = await this.transactionModel.create(
      [{
        userId,
        type: TransactionType.CREDIT,
        amount,
        balanceBefore,
        balanceAfter: balanceBefore + amount,
        status: TransactionStatus.PENDING,
        source,
        referenceId,
        idempotencyKey: key,
        description: `Credit: ${source}`,
      }],
      { session }
    );

    try {
      // Update wallet balance
      const wallet = await this.walletModel.findOneAndUpdate(
        { userId, isActive: true },
        {
          $inc: {
            balance: amount,
            totalEarned: amount,
          },
          $set: {
            lastTransactionAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!wallet) {
        await this.transactionModel.updateOne(
          { _id: transaction[0]._id },
          {
            status: TransactionStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'Wallet not found or inactive',
          },
          { session }
        );
        return { success: false, error: 'Wallet not found or inactive' };
      }

      // Update transaction as completed
      await this.transactionModel.updateOne(
        { _id: transaction[0]._id },
        {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
        { session }
      );

      this.logger.log(`Credit successful: ${userId} +${amount} (${source})`);

      return {
        success: true,
        transaction: (await this.transactionModel.findById(transaction[0]._id).lean()) ?? undefined,
      };
    } catch (error) {
      await this.transactionModel.updateOne(
        { _id: transaction[0]._id },
        {
          status: TransactionStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
        { session }
      );
      throw error;
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactions(
    userId: string,
    options: { limit?: number; offset?: number; type?: TransactionType; status?: TransactionStatus } = {},
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const { limit = 20, offset = 0, type, status } = options;

    const query: any = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Verify wallet consistency: balance should equal sum of transactions
   */
  async verifyConsistency(userId: string): Promise<{
    isConsistent: boolean;
    storedBalance: number;
    calculatedBalance: number;
    discrepancy: number;
  }> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      return { isConsistent: true, storedBalance: 0, calculatedBalance: 0, discrepancy: 0 };
    }

    const aggregation = await this.transactionModel.aggregate([
      { $match: { userId, status: TransactionStatus.COMPLETED } },
      { $group: {
        _id: null,
        totalCredits: { $sum: { $cond: [{ $eq: ['$type', TransactionType.CREDIT] }, '$amount', 0] } },
        totalDebits: { $sum: { $cond: [{ $eq: ['$type', TransactionType.DEBIT] }, '$amount', 0] } },
      }},
    ]);

    const { totalCredits = 0, totalDebits = 0 } = aggregation[0] || {};
    const calculatedBalance = totalCredits - totalDebits;
    const discrepancy = Math.abs(wallet.balance - calculatedBalance);

    return {
      isConsistent: discrepancy < 0.01, // Allow for floating point
      storedBalance: wallet.balance,
      calculatedBalance,
      discrepancy,
    };
  }

  /**
   * Freeze/Unfreeze wallet
   */
  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.walletModel.updateOne({ userId }, { isActive });
    this.logger.log(`Wallet ${isActive ? 'activated' : 'frozen'}: ${userId}`);
  }

  /**
   * Debit ride payment from user wallet
   */
  async debitRidePayment(
    userId: string,
    amount: number,
    paymentMethod: 'wallet' | 'upi' | 'card' | 'cash',
    rideId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const idempotencyKey = `ride_payment:${rideId}`;
    const result = await this.debit(
      userId,
      amount,
      TransactionSource.RIDE_FARE,
      rideId,
      idempotencyKey
    );
    return { success: result.success, error: result.error };
  }

  /**
   * Credit driver earnings after ride completion
   */
  async creditDriverEarnings(
    driverId: string,
    amount: number,
    rideId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const idempotencyKey = `driver_earnings:${rideId}`;
    const result = await this.credit(
      driverId,
      amount,
      TransactionSource.COMMISSION,
      rideId,
      idempotencyKey
    );
    return { success: result.success, error: result.error };
  }

  /**
   * Credit cashback to user wallet
   */
  async creditCashback(
    userId: string,
    amount: number,
    rideId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const idempotencyKey = `cashback:${rideId}`;
    const result = await this.credit(
      userId,
      amount,
      TransactionSource.CASHBACK,
      rideId,
      idempotencyKey
    );
    return { success: result.success, error: result.error };
  }
}
