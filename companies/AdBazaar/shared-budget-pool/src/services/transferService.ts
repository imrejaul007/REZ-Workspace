import { v4 as uuidv4 } from 'uuid';
import { BudgetPool, Transaction } from '../models';
import { poolService } from './poolService';
import { transactionService } from './transactionService';
import { logger } from '../utils/logger';

export interface TransferDto {
  fromPoolId: string;
  toPoolId: string;
  amount: number;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TransferResult {
  success: boolean;
  transferId: string;
  fromPoolId: string;
  toPoolId: string;
  amount: number;
  fromPoolBalance: number;
  toPoolBalance: number;
  fromTransactionId: string;
  toTransactionId: string;
}

export class TransferService {
  async transferBetweenPools(dto: TransferDto): Promise<TransferResult> {
    logger.info('Initiating pool transfer', {
      fromPoolId: dto.fromPoolId,
      toPoolId: dto.toPoolId,
      amount: dto.amount,
    });

    if (dto.fromPoolId === dto.toPoolId) {
      throw new Error('Cannot transfer to the same pool');
    }

    if (dto.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    const [fromPool, toPool] = await Promise.all([
      poolService.getPoolByIdOrThrow(dto.fromPoolId),
      poolService.getPoolByIdOrThrow(dto.toPoolId),
    ]);

    if (fromPool.status !== 'active') {
      throw new Error('Source pool is not active');
    }

    if (toPool.status !== 'active') {
      throw new Error('Destination pool is not active');
    }

    if (fromPool.currency !== toPool.currency) {
      throw new Error(`Currency mismatch. From: ${fromPool.currency}, To: ${toPool.currency}`);
    }

    const availableBalance = fromPool.currentBalance - fromPool.reservedAmount;
    if (availableBalance < dto.amount) {
      throw new Error(`Insufficient balance in source pool. Available: ${availableBalance}, Requested: ${dto.amount}`);
    }

    const transferId = `TRANSFER-${uuidv4().substring(0, 8).toUpperCase()}`;

    const [fromTransaction, toTransaction] = await Promise.all([
      transactionService.recordTransaction({
        poolId: fromPool._id.toString(),
        type: 'transfer_out',
        amount: dto.amount,
        reference: dto.reference || transferId,
        referenceType: 'pool',
        description: dto.description || `Transfer to pool ${toPool.name}`,
        metadata: {
          transferId,
          toPoolId: toPool._id.toString(),
          toPoolName: toPool.name,
          ...dto.metadata,
        },
      }),
      transactionService.recordTransaction({
        poolId: toPool._id.toString(),
        type: 'transfer_in',
        amount: dto.amount,
        reference: dto.reference || transferId,
        referenceType: 'pool',
        description: dto.description || `Transfer from pool ${fromPool.name}`,
        metadata: {
          transferId,
          fromPoolId: fromPool._id.toString(),
          fromPoolName: fromPool.name,
          ...dto.metadata,
        },
      }),
    ]);

    const updatedFromPool = await poolService.getPoolById(dto.fromPoolId);
    const updatedToPool = await poolService.getPoolById(dto.toPoolId);

    logger.info('Pool transfer completed successfully', {
      transferId,
      fromPoolId: dto.fromPoolId,
      toPoolId: dto.toPoolId,
      amount: dto.amount,
    });

    return {
      success: true,
      transferId,
      fromPoolId: dto.fromPoolId,
      toPoolId: dto.toPoolId,
      amount: dto.amount,
      fromPoolBalance: updatedFromPool?.currentBalance || 0,
      toPoolBalance: updatedToPool?.currentBalance || 0,
      fromTransactionId: fromTransaction._id.toString(),
      toTransactionId: toTransaction._id.toString(),
    };
  }

  async getTransferHistory(poolId: string, options: {
    limit?: number;
    skip?: number;
  } = {}): Promise<{
    transfers: Array<{
      transferId: string;
      direction: 'in' | 'out';
      amount: number;
      counterpartPoolId: string;
      counterpartPoolName: string;
      timestamp: Date;
      reference: string;
    }>;
    total: number;
  }> {
    const transactions = await Transaction.find({
      poolId: poolId,
      type: { $in: ['transfer_in', 'transfer_out'] },
    })
      .sort({ timestamp: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 50);

    const transfers = transactions.map((tx) => {
      const isOut = tx.type === 'transfer_out';
      return {
        transferId: tx.metadata?.transferId as string || tx._id.toString(),
        direction: isOut ? 'out' : 'in' as 'in' | 'out',
        amount: tx.amount,
        counterpartPoolId: isOut
          ? (tx.metadata?.toPoolId as string)
          : (tx.metadata?.fromPoolId as string),
        counterpartPoolName: isOut
          ? (tx.metadata?.toPoolName as string)
          : (tx.metadata?.fromPoolName as string),
        timestamp: tx.timestamp,
        reference: tx.reference,
      };
    });

    const total = await Transaction.countDocuments({
      poolId: poolId,
      type: { $in: ['transfer_in', 'transfer_out'] },
    });

    return { transfers, total };
  }

  async getTransferBetweenPools(fromPoolId: string, toPoolId: string): Promise<{
    totalTransferred: number;
    transferCount: number;
    lastTransfer: Date | null;
    transfers: Array<{
      transferId: string;
      amount: number;
      direction: 'out' | 'in';
      timestamp: Date;
    }>;
  }> {
    const transfers = await Transaction.find({
      $or: [
        {
          poolId: fromPoolId,
          type: 'transfer_out',
          'metadata.toPoolId': toPoolId,
        },
        {
          poolId: toPoolId,
          type: 'transfer_in',
          'metadata.fromPoolId': fromPoolId,
        },
      ],
    }).sort({ timestamp: -1 });

    let totalTransferred = 0;
    const details: Array<{
      transferId: string;
      amount: number;
      direction: 'out' | 'in';
      timestamp: Date;
    }> = [];

    for (const tx of transfers) {
      totalTransferred += tx.amount;
      details.push({
        transferId: tx.metadata?.transferId as string || tx._id.toString(),
        amount: tx.amount,
        direction: tx.poolId.toString() === fromPoolId ? 'out' : 'in',
        timestamp: tx.timestamp,
      });
    }

    return {
      totalTransferred,
      transferCount: transfers.length,
      lastTransfer: transfers.length > 0 ? transfers[0].timestamp : null,
      transfers: details,
    };
  }

  async validateTransfer(dto: TransferDto): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (dto.fromPoolId === dto.toPoolId) {
      errors.push('Cannot transfer to the same pool');
    }

    if (dto.amount <= 0) {
      errors.push('Transfer amount must be positive');
    }

    try {
      const [fromPool, toPool] = await Promise.all([
        poolService.getPoolById(dto.fromPoolId),
        poolService.getPoolById(dto.toPoolId),
      ]);

      if (!fromPool) {
        errors.push('Source pool not found');
      } else {
        if (fromPool.status !== 'active') {
          errors.push('Source pool is not active');
        }

        const availableBalance = fromPool.currentBalance - fromPool.reservedAmount;
        if (availableBalance < dto.amount) {
          errors.push(`Insufficient balance. Available: ${availableBalance}, Requested: ${dto.amount}`);
        }
      }

      if (!toPool) {
        errors.push('Destination pool not found');
      } else {
        if (toPool.status !== 'active') {
          errors.push('Destination pool is not active');
        }

        if (fromPool && fromPool.currency !== toPool.currency) {
          errors.push(`Currency mismatch. From: ${fromPool.currency}, To: ${toPool.currency}`);
        }
      }

      if (fromPool && dto.amount > fromPool.totalBudget * 0.5) {
        warnings.push('Transfer amount exceeds 50% of source pool budget');
      }
    } catch (error) {
      errors.push(`Validation error: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async cancelTransfer(transferId: string): Promise<{
    success: boolean;
    reversedTransactions: string[];
  }> {
    logger.info('Cancelling transfer', { transferId });

    const transactions = await Transaction.find({
      'metadata.transferId': transferId,
    });

    if (transactions.length === 0) {
      throw new Error(`Transfer not found: ${transferId}`);
    }

    const reversedTransactions: string[] = [];

    for (const tx of transactions) {
      const reverseType = tx.type === 'transfer_out' ? 'transfer_in' : 'transfer_out';

      await transactionService.recordTransaction({
        poolId: tx.poolId.toString(),
        type: 'reversal',
        amount: tx.amount,
        reference: `REVERSE-${transferId}`,
        referenceType: 'pool',
        description: `Reversal of transfer ${transferId}`,
        metadata: {
          originalTransferId: transferId,
          originalTransactionId: tx._id.toString(),
        },
        relatedTransactionId: tx._id.toString(),
      });

      reversedTransactions.push(tx._id.toString());
    }

    logger.info('Transfer cancelled successfully', { transferId, reversedTransactions });

    return {
      success: true,
      reversedTransactions,
    };
  }
}

export const transferService = new TransferService();