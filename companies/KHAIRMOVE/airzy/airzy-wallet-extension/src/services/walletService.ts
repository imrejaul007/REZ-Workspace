import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { WalletBalance, Transaction, LoyaltyPoints } from '../types';
import { logger } from '../utils/logger';

interface IWallet extends Document {
  userId: string;
  balance: number;
  currency: string;
  bonusBalance: number;
  lastUpdated: Date;
}

interface ITransaction extends Document {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  category: string;
  description: string;
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed';
  balanceAfter: number;
}

interface ILoyalty extends Document {
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  lifetimePoints: number;
  expiresAt?: Date;
}

const WalletSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  bonusBalance: { type: Number, default: 0 },
  lastUpdated: Date
}, { timestamps: true });

const TransactionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  category: { type: String, required: true },
  description: String,
  referenceId: String,
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  balanceAfter: Number
}, { timestamps: true });

const LoyaltySchema = new Schema({
  userId: { type: String, required: true, unique: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  points: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  expiresAt: Date
}, { timestamps: true });

export const WalletModel = model<IWallet>('Wallet', WalletSchema);
export const TransactionModel = model<ITransaction>('Transaction', TransactionSchema);
export const LoyaltyModel = model<ILoyalty>('Loyalty', LoyaltySchema);

export class WalletService {
  async getBalance(userId: string): Promise<WalletBalance> {
    let wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      wallet = new WalletModel({ userId });
      await wallet.save();
    }
    return {
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      bonusBalance: wallet.bonusBalance,
      lastUpdated: wallet.updatedAt
    };
  }

  async topup(userId: string, amount: number, category: string = 'topup'): Promise<Transaction> {
    // Atomic update with upsert
    const wallet = await WalletModel.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: amount },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );

    const tx = new TransactionModel({
      userId,
      type: 'credit',
      amount,
      currency: 'INR',
      category,
      description: `Wallet topup of ${amount}`,
      status: 'completed',
      balanceAfter: wallet.balance
    });
    await tx.save();

    return {
      id: tx._id.toString(),
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      description: tx.description,
      status: tx.status,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt
    };
  }

  /**
   * FIXED: Atomic payment operation - prevents TOCTOU race condition
   * Uses findOneAndUpdate with balance check in the query to ensure
   * no concurrent request can overdraw the wallet.
   */
  async pay(userId: string, amount: number, reference: string, description: string): Promise<Transaction> {
    // Atomic operation: only update if balance >= amount
    // This prevents race conditions where two concurrent requests
    // could both pass the balance check and overdraw the wallet
    const updated = await WalletModel.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      {
        $inc: { balance: -amount },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );

    if (!updated) {
      // Either wallet doesn't exist or insufficient balance
      const wallet = await WalletModel.findOne({ userId });
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      throw new Error('Insufficient balance or concurrent modification detected');
    }

    // Record the transaction
    const tx = new TransactionModel({
      userId,
      type: 'debit',
      amount,
      currency: 'INR',
      category: 'payment',
      description,
      referenceId: reference,
      status: 'completed',
      balanceAfter: updated.balance
    });
    await tx.save();

    return {
      id: tx._id.toString(),
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      description: tx.description,
      referenceId: tx.referenceId,
      status: tx.status,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt
    };
  }

  async getTransactions(
    userId: string,
    options: { page?: number; limit?: number; type?: string } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const query: Record<string, unknown> = { userId };

    if (options.type) {
      query.type = options.type;
    }

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TransactionModel.countDocuments(query)
    ]);

    return {
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        category: t.category,
        description: t.description,
        referenceId: t.referenceId,
        status: t.status,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt
      })),
      total
    };
  }

  async getLoyalty(userId: string): Promise<LoyaltyPoints> {
    let loyalty = await LoyaltyModel.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyModel({ userId });
      await loyalty.save();
    }
    const tierThresholds = { bronze: 0, silver: 10000, gold: 50000, platinum: 100000 };
    const nextTier = Object.entries(tierThresholds).find(([, threshold]) => loyalty!.lifetimePoints < threshold);
    return {
      userId: loyalty.userId,
      tier: loyalty.tier,
      points: loyalty.points,
      lifetimePoints: loyalty.lifetimePoints,
      pointsToNextTier: nextTier ? nextTier[1] - loyalty.lifetimePoints : 0,
      expiresAt: loyalty.expiresAt
    };
  }

  async addPoints(userId: string, points: number): Promise<LoyaltyPoints> {
    const loyalty = await LoyaltyModel.findOneAndUpdate(
      { userId },
      { $inc: { points, lifetimePoints: points } },
      { new: true, upsert: true }
    );

    const tierThresholds = { bronze: 0, silver: 10000, gold: 50000, platinum: 100000 };
    let newTier = 'bronze';
    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (loyalty!.lifetimePoints >= threshold) {
        newTier = tier;
      }
    }

    if (newTier !== loyalty!.tier) {
      loyalty!.tier = newTier as 'bronze' | 'silver' | 'gold' | 'platinum';
      await loyalty!.save();
    }

    return {
      userId: loyalty.userId,
      tier: loyalty.tier,
      points: loyalty.points,
      lifetimePoints: loyalty.lifetimePoints,
      pointsToNextTier: 0
    };
  }
}

export const walletService = new WalletService();
export default walletService;
