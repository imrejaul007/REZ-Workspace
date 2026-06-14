import { v4 as uuidv4 } from 'uuid';
import { Transaction, ITransactionDocument } from '../models';
import { redisService } from './redis';
import { rabtulService } from './rabtul';
import config from '../config';
import { logger } from 'utils/logger.js';
import {
  transactionsTotal,
  transactionsAmount,
  activeTransactions,
  paymentProcessingDuration,
} from '../middleware/metrics';
import {
  IEcosystemTransaction,
  InitiateTransactionRequest,
  TransactionStatus,
  TransactionType,
} from '../types';

class TransactionService {
  private readonly CACHE_TTL = config.redis.ttl.transaction;

  async initiateTransaction(request: InitiateTransactionRequest): Promise<IEcosystemTransaction> {
    const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Validate amount
    if (request.amount < config.transaction.minAmount) {
      throw new Error(`Amount must be at least ${config.transaction.minAmount}`);
    }
    if (request.amount > config.transaction.maxAmount) {
      throw new Error(`Amount cannot exceed ${config.transaction.maxAmount}`);
    }

    // Validate currency
    const currency = request.currency || config.transaction.defaultCurrency;
    if (!config.transaction.currencies.includes(currency)) {
      throw new Error(`Currency ${currency} is not supported`);
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId,
      adId: request.adId,
      campaignId: request.campaignId,
      advertiserId: request.advertiserId,
      userId: request.userId,
      businessId: request.businessId,
      type: request.type,
      amount: request.amount,
      currency,
      status: 'initiated',
      paymentMethod: request.paymentMethod,
      metadata: request.metadata || {},
    });

    await transaction.save();

    // Cache the transaction
    await this.cacheTransaction(transaction);

    // Update metrics
    transactionsTotal.inc({ type: request.type, status: 'initiated' });
    transactionsAmount.observe({ type: request.type, currency }, request.amount);
    activeTransactions.inc({ status: 'initiated' });

    // Publish event
    await this.publishTransactionEvent('transaction.initiated', transaction);

    logger.info('Transaction initiated', {
      transactionId,
      adId: request.adId,
      userId: request.userId,
      amount: request.amount,
      type: request.type,
    });

    return transaction.toJSON() as IEcosystemTransaction;
  }

  async getTransaction(transactionId: string): Promise<IEcosystemTransaction | null> {
    // Try cache first
    const cached = await redisService.get<IEcosystemTransaction>(`txn:${transactionId}`);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const transaction = await Transaction.findByTransactionId(transactionId);
    if (transaction) {
      await this.cacheTransaction(transaction);
      return transaction.toJSON() as IEcosystemTransaction;
    }

    return null;
  }

  async confirmTransaction(
    transactionId: string,
    paymentReference: string,
    paymentMethod?: string
  ): Promise<IEcosystemTransaction> {
    const transaction = await Transaction.findByTransactionId(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate status transition
    const validStatuses = config.transaction.statusFlow[transaction.status] || [];
    if (!validStatuses.includes('completed')) {
      throw new Error(`Cannot confirm transaction with status: ${transaction.status}`);
    }

    const startTime = Date.now();

    // Process payment based on method
    if (transaction.paymentMethod === 'wallet' || paymentMethod === 'wallet') {
      const result = await rabtulService.deductFromWallet({
        userId: transaction.userId,
        amount: transaction.amount,
        reference: transactionId,
        description: `Ad transaction: ${transaction.adId}`,
      });

      if (!result.success) {
        transaction.status = 'failed';
        transaction.paymentReference = paymentReference;
        await transaction.save();
        await this.invalidateCache(transactionId);
        transactionsTotal.inc({ type: transaction.type, status: 'failed' });
        throw new Error(result.error || 'Payment processing failed');
      }
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.paymentReference = paymentReference;
    if (paymentMethod) {
      transaction.paymentMethod = paymentMethod as typeof transaction.paymentMethod;
    }
    transaction.completedAt = new Date();

    await transaction.save();

    // Update cache
    await this.cacheTransaction(transaction);

    // Update metrics
    transactionsTotal.inc({ type: transaction.type, status: 'completed' });
    activeTransactions.dec({ status: transaction.status });
    activeTransactions.inc({ status: 'completed' });
    paymentProcessingDuration.observe(
      { payment_method: transaction.paymentMethod || 'unknown', status: 'success' },
      (Date.now() - startTime) / 1000
    );

    // Publish event
    await this.publishTransactionEvent('transaction.completed', transaction);

    logger.info('Transaction confirmed', {
      transactionId,
      paymentReference,
      amount: transaction.amount,
    });

    return transaction.toJSON() as IEcosystemTransaction;
  }

  async cancelTransaction(transactionId: string, reason?: string): Promise<IEcosystemTransaction> {
    const transaction = await Transaction.findByTransactionId(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate status transition
    const validStatuses = config.transaction.statusFlow[transaction.status] || [];
    if (!validStatuses.includes('cancelled')) {
      throw new Error(`Cannot cancel transaction with status: ${transaction.status}`);
    }

    // If wallet was already charged, refund
    if (transaction.status === 'completed' && transaction.paymentMethod === 'wallet') {
      await rabtulService.refundToWallet(
        transaction.userId,
        transaction.amount,
        transactionId
      );
    }

    transaction.status = 'cancelled';
    if (reason) {
      transaction.metadata = { ...transaction.metadata, cancellationReason: reason };
    }

    await transaction.save();

    // Update cache
    await this.cacheTransaction(transaction);

    // Update metrics
    transactionsTotal.inc({ type: transaction.type, status: 'cancelled' });
    activeTransactions.dec({ status: transaction.status });
    activeTransactions.inc({ status: 'cancelled' });

    // Publish event
    await this.publishTransactionEvent('transaction.cancelled', transaction);

    logger.info('Transaction cancelled', { transactionId, reason });

    return transaction.toJSON() as IEcosystemTransaction;
  }

  async refundTransaction(
    transactionId: string,
    reason?: string,
    refundAmount?: number
  ): Promise<IEcosystemTransaction> {
    const transaction = await Transaction.findByTransactionId(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Can only refund completed transactions
    if (transaction.status !== 'completed') {
      throw new Error(`Cannot refund transaction with status: ${transaction.status}`);
    }

    const actualRefundAmount = refundAmount || transaction.amount;

    // Process refund based on payment method
    if (transaction.paymentMethod === 'wallet') {
      const result = await rabtulService.refundToWallet(
        transaction.userId,
        actualRefundAmount,
        transactionId
      );

      if (!result.success) {
        throw new Error(result.error || 'Refund processing failed');
      }
    }

    transaction.status = 'refunded';
    transaction.metadata = {
      ...transaction.metadata,
      refundReason: reason,
      refundAmount: actualRefundAmount,
      refundedAt: new Date().toISOString(),
    };

    await transaction.save();

    // Update cache
    await this.cacheTransaction(transaction);

    // Update metrics
    transactionsTotal.inc({ type: transaction.type, status: 'refunded' });
    activeTransactions.dec({ status: 'completed' });
    activeTransactions.inc({ status: 'refunded' });

    // Publish event
    await this.publishTransactionEvent('transaction.refunded', transaction);

    logger.info('Transaction refunded', {
      transactionId,
      amount: actualRefundAmount,
      reason,
    });

    return transaction.toJSON() as IEcosystemTransaction;
  }

  async getUserTransactions(
    userId: string,
    options?: { page?: number; limit?: number; status?: TransactionStatus; type?: TransactionType }
  ): Promise<{ transactions: IEcosystemTransaction[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;
    if (options?.type) query.type = options.type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions: transactions.map((t) => t.toJSON() as IEcosystemTransaction),
      total,
      page,
      limit,
    };
  }

  async getAdTransactions(
    adId: string,
    options?: { page?: number; limit?: number; status?: TransactionStatus }
  ): Promise<{ transactions: IEcosystemTransaction[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { adId };
    if (options?.status) query.status = options.status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions: transactions.map((t) => t.toJSON() as IEcosystemTransaction),
      total,
      page,
      limit,
    };
  }

  async getAnalytics(
    advertiserId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, unknown>> {
    const matchStage: Record<string, unknown> = { advertiserId };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) (matchStage.createdAt as Record<string, Date>).$gte = startDate;
      if (endDate) (matchStage.createdAt as Record<string, Date>).$lte = endDate;
    }

    const aggregation = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_payment'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          refundedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
        },
      },
    ]);

    const typeAggregation = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const result = aggregation[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      refundedCount: 0,
    };

    return {
      ...result,
      averageAmount: result.totalTransactions > 0 ? result.totalAmount / result.totalTransactions : 0,
      byType: typeAggregation.reduce((acc, item) => {
        const type = item._id.type;
        if (!acc[type]) acc[type] = { count: 0, amount: 0 };
        acc[type].count += item.count;
        acc[type].amount += item.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
    };
  }

  private async cacheTransaction(transaction: ITransactionDocument): Promise<void> {
    await redisService.set(
      `txn:${transaction.transactionId}`,
      transaction.toJSON(),
      this.CACHE_TTL
    );
  }

  private async invalidateCache(transactionId: string): Promise<void> {
    await redisService.del(`txn:${transactionId}`);
  }

  private async publishTransactionEvent(
    type: string,
    transaction: ITransactionDocument
  ): Promise<void> {
    await redisService.publish('transaction-events', {
      type,
      transactionId: transaction.transactionId,
      adId: transaction.adId,
      userId: transaction.userId,
      advertiserId: transaction.advertiserId,
      amount: transaction.amount,
      status: transaction.status,
      timestamp: new Date().toISOString(),
    });
  }
}

export const transactionService = new TransactionService();
export default transactionService;