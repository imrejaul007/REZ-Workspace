import { Transaction, ITransaction, TransactionType } from '../models';
import { poolService } from './poolService';
import { logger } from '../utils/logger';

export interface RecordTransactionDto {
  poolId: string;
  type: TransactionType;
  amount: number;
  reference: string;
  referenceType?: 'campaign' | 'pool' | 'refund' | 'adjustment' | 'manual' | 'system';
  description?: string;
  metadata?: Record<string, unknown>;
  relatedTransactionId?: string;
}

export class TransactionService {
  async recordTransaction(dto: RecordTransactionDto): Promise<ITransaction> {
    logger.debug('Recording transaction', {
      poolId: dto.poolId,
      type: dto.type,
      amount: dto.amount,
    });

    const pool = await poolService.getPoolByIdOrThrow(dto.poolId);
    const balanceBefore = pool.currentBalance;

    let balanceAfter: number;
    switch (dto.type) {
      case 'allocation':
      case 'contribution':
      case 'refund':
      case 'transfer_in':
        balanceAfter = balanceBefore + dto.amount;
        break;
      case 'spend':
      case 'transfer_out':
      case 'adjustment':
        balanceAfter = balanceBefore - dto.amount;
        if (balanceAfter < 0) {
          throw new Error(`Insufficient balance for ${dto.type}. Balance: ${balanceBefore}, Amount: ${dto.amount}`);
        }
        break;
      case 'reversal':
        balanceAfter = balanceBefore + dto.amount;
        break;
      default:
        throw new Error(`Unknown transaction type: ${dto.type}`);
    }

    await poolService.updateBalance(dto.poolId, dto.amount, dto.type === 'spend' || dto.type === 'transfer_out' || dto.type === 'adjustment' ? 'subtract' : 'add');

    const transaction = new Transaction({
      poolId: pool._id,
      type: dto.type,
      amount: dto.amount,
      balanceBefore,
      balanceAfter,
      reference: dto.reference,
      referenceType: dto.referenceType || 'manual',
      description: dto.description,
      metadata: dto.metadata || {},
      relatedTransactionId: dto.relatedTransactionId,
      timestamp: new Date(),
    });

    await transaction.save();
    logger.debug('Transaction recorded successfully', { transactionId: transaction._id });

    return transaction;
  }

  async getTransactionById(transactionId: string): Promise<ITransaction | null> {
    return Transaction.findById(transactionId);
  }

  async getTransactionByIdOrThrow(transactionId: string): Promise<ITransaction> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    return transaction;
  }

  async getPoolTransactions(poolId: string, options: {
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ transactions: ITransaction[]; total: number }> {
    const query: Record<string, unknown> = { poolId: poolId };

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    if (options.type) {
      query.type = options.type;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50),
      Transaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  async getTransactionSummary(poolId: string, startDate?: Date, endDate?: Date): Promise<{
    totalIn: number;
    totalOut: number;
    netChange: number;
    transactionCount: number;
    byType: Record<string, { count: number; amount: number }>;
  }> {
    const query: Record<string, unknown> = { poolId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const transactions = await Transaction.find(query);

    let totalIn = 0;
    let totalOut = 0;
    const byType: Record<string, { count: number; amount: number }> = {};

    for (const tx of transactions) {
      if (!byType[tx.type]) {
        byType[tx.type] = { count: 0, amount: 0 };
      }
      byType[tx.type].count++;
      byType[tx.type].amount += tx.amount;

      const effect = tx.getNetEffect();
      if (effect >= 0) {
        totalIn += effect;
      } else {
        totalOut += Math.abs(effect);
      }
    }

    return {
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      transactionCount: transactions.length,
      byType,
    };
  }

  async getRecentTransactions(poolId: string, limit: number = 10): Promise<ITransaction[]> {
    return Transaction.find({ poolId: poolId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getTransactionCountByType(poolId: string): Promise<Record<TransactionType, number>> {
    const result = await Transaction.aggregate([
      { $match: { poolId: poolId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const item of result) {
      counts[item._id] = item.count;
    }

    return counts as Record<TransactionType, number>;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    logger.info('Deleting transaction', { transactionId });

    const transaction = await this.getTransactionByIdOrThrow(transactionId);

    if (transaction.type === 'spend' || transaction.type === 'transfer_out' || transaction.type === 'adjustment') {
      await poolService.updateBalance(transaction.poolId.toString(), transaction.amount, 'add');
    } else {
      await poolService.updateBalance(transaction.poolId.toString(), transaction.amount, 'subtract');
    }

    await Transaction.findByIdAndDelete(transactionId);
    logger.info('Transaction deleted successfully', { transactionId });
  }

  async getTransactionsByReference(reference: string): Promise<ITransaction[]> {
    return Transaction.find({ reference }).sort({ timestamp: -1 });
  }

  async getRelatedTransactions(transactionId: string): Promise<ITransaction[]> {
    const transaction = await this.getTransactionByIdOrThrow(transactionId);
    return Transaction.find({
      $or: [
        { _id: transaction.relatedTransactionId },
        { relatedTransactionId: transaction._id },
        { reference: transaction.reference },
      ],
    }).sort({ timestamp: 1 });
  }
}

export const transactionService = new TransactionService();