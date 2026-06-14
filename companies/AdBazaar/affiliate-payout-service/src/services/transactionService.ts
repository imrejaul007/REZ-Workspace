import { v4 as uuidv4 } from 'uuid';
import { Transaction, ITransaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { Payout } from '../models/Payout';
import logger from 'utils/logger.js';

export interface CreateTransactionInput {
  payoutId: string;
  affiliateId: string;
  type: TransactionType;
  amount: number;
  description: string;
  gateway: {
    name: string;
    transactionRef?: string;
    responseCode?: string;
    responseMessage?: string;
  };
}

class TransactionService {
  /**
   * Create a new transaction
   */
  async createTransaction(input: CreateTransactionInput): Promise<ITransaction> {
    const transactionId = `txn-${uuidv4().slice(0, 16)}`;

    // Get current balance
    const lastTransaction = await Transaction.findOne({ affiliateId: input.affiliateId })
      .sort({ 'timestamps.initiated': -1 });

    const balance = (lastTransaction?.balance || 0) + input.amount;

    const transaction = new Transaction({
      transactionId,
      payoutId: input.payoutId,
      affiliateId: input.affiliateId,
      type: input.type,
      status: 'pending',
      amount: input.amount,
      currency: 'INR',
      balance,
      description: input.description,
      gateway: input.gateway,
      timestamps: {
        initiated: new Date(),
      },
    });

    await transaction.save();
    logger.info('Transaction created', { transactionId, type: input.type, amount: input.amount });

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ITransaction | null> {
    return Transaction.findOne({ transactionId });
  }

  /**
   * Get transactions by payout
   */
  async getTransactionsByPayout(payoutId: string): Promise<ITransaction[]> {
    return Transaction.find({ payoutId }).sort({ 'timestamps.initiated': -1 });
  }

  /**
   * Get transactions by affiliate
   */
  async getTransactionsByAffiliate(
    affiliateId: string,
    options: {
      page?: number;
      limit?: number;
      type?: TransactionType;
      status?: TransactionStatus;
    } = {}
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const { page = 1, limit = 50, type, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { affiliateId };
    if (type) query.type = type;
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).skip(skip).limit(limit).sort({ 'timestamps.initiated': -1 }),
      Transaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    details?: { responseCode?: string; responseMessage?: string }
  ): Promise<ITransaction | null> {
    const update: Record<string, unknown> = { status };

    if (status === 'success') {
      update['timestamps.processed'] = new Date();
    }

    if (details) {
      update['gateway.responseCode'] = details.responseCode;
      update['gateway.responseMessage'] = details.responseMessage;
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionId },
      { $set: update },
      { new: true }
    );

    if (transaction) {
      logger.info('Transaction status updated', { transactionId, status });
    }

    return transaction;
  }

  /**
   * Settle transaction
   */
  async settleTransaction(transactionId: string): Promise<ITransaction | null> {
    const transaction = await Transaction.findOneAndUpdate(
      { transactionId, status: 'success' },
      { $set: { status: 'success', 'timestamps.settled': new Date() } },
      { new: true }
    );

    if (transaction) {
      logger.info('Transaction settled', { transactionId });
    }

    return transaction;
  }

  /**
   * Reverse transaction (for refunds)
   */
  async reverseTransaction(
    transactionId: string,
    reason: string
  ): Promise<ITransaction | null> {
    const original = await Transaction.findOne({ transactionId });
    if (!original) return null;

    // Create reversal transaction
    const reversal = await this.createTransaction({
      payoutId: original.payoutId,
      affiliateId: original.affiliateId,
      type: 'refund',
      amount: -original.amount,
      description: `Reversal: ${reason}`,
      gateway: { name: original.gateway.name },
    });

    reversal.status = 'success';
    reversal.timestamps.processed = new Date();
    reversal.timestamps.settled = new Date();
    await reversal.save();

    // Mark original as reversed
    await Transaction.findOneAndUpdate(
      { transactionId },
      { $set: { status: 'reversed' } }
    );

    logger.info('Transaction reversed', { originalTransactionId: transactionId, reversalId: reversal.transactionId });

    return reversal;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    affiliateId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<ITransaction[]> {
    const query: Record<string, unknown> = { affiliateId };

    if (options.startDate || options.endDate) {
      query['timestamps.initiated'] = {};
      if (options.startDate) {
        (query['timestamps.initiated'] as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query['timestamps.initiated'] as Record<string, Date>).$lte = options.endDate;
      }
    }

    return Transaction.find(query).sort({ 'timestamps.initiated': -1 });
  }

  /**
   * Get affiliate balance
   */
  async getAffiliateBalance(affiliateId: string): Promise<number> {
    const lastTransaction = await Transaction.findOne({ affiliateId })
      .sort({ 'timestamps.initiated': -1 });

    return lastTransaction?.balance || 0;
  }
}

export const transactionService = new TransactionService();
export default transactionService;