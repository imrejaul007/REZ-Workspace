import { v4 as uuidv4 } from 'uuid';
import { Allocation, BudgetPool, Transaction, IAllocation } from '../models';
import { poolService } from './poolService';
import { allocationService } from './allocationService';
import { transactionService } from './transactionService';
import { logger } from '../utils/logger';

export interface SpendDto {
  poolId: string;
  campaignId: string;
  amount: number;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SpendResult {
  success: boolean;
  transactionId: string;
  allocationId: string;
  amount: number;
  remainingAllocation: number;
  poolBalance: number;
}

export class SpendService {
  async recordSpend(dto: SpendDto): Promise<SpendResult> {
    logger.info('Recording spend', {
      poolId: dto.poolId,
      campaignId: dto.campaignId,
      amount: dto.amount,
    });

    const pool = await poolService.getPoolByIdOrThrow(dto.poolId);

    if (pool.status !== 'active') {
      throw new Error('Cannot spend from inactive or frozen pool');
    }

    const allocation = await Allocation.findOne({
      poolId: pool._id,
      campaignId: dto.campaignId,
      status: 'active',
    });

    if (!allocation) {
      throw new Error(`No active allocation found for campaign ${dto.campaignId} in pool ${dto.poolId}`);
    }

    const availableInAllocation = allocation.amount - allocation.spentAmount - allocation.reservedAmount;
    if (availableInAllocation < dto.amount) {
      throw new Error(`Insufficient allocation. Available: ${availableInAllocation}, Requested: ${dto.amount}`);
    }

    const availableInPool = pool.currentBalance - pool.reservedAmount;
    if (availableInPool < dto.amount) {
      throw new Error(`Insufficient pool balance. Available: ${availableInPool}, Requested: ${dto.amount}`);
    }

    allocation.spentAmount += dto.amount;
    pool.reservedAmount -= dto.amount;

    if (allocation.spentAmount >= allocation.amount) {
      allocation.status = 'exhausted';
      allocation.reservedAmount = 0;
    }

    await Promise.all([allocation.save(), pool.save()]);

    const transaction = await transactionService.recordTransaction({
      poolId: pool._id.toString(),
      type: 'spend',
      amount: dto.amount,
      reference: dto.reference,
      referenceType: 'campaign',
      description: dto.description || `Spend for campaign ${dto.campaignId}`,
      metadata: {
        campaignId: dto.campaignId,
        allocationId: allocation._id.toString(),
        ...dto.metadata,
      },
    });

    logger.info('Spend recorded successfully', {
      transactionId: transaction._id,
      allocationId: allocation._id,
      amount: dto.amount,
    });

    return {
      success: true,
      transactionId: transaction._id.toString(),
      allocationId: allocation._id.toString(),
      amount: dto.amount,
      remainingAllocation: allocation.amount - allocation.spentAmount,
      poolBalance: pool.currentBalance,
    };
  }

  async recordBulkSpend(spends: SpendDto[]): Promise<{
    results: SpendResult[];
    totalAmount: number;
    failedCount: number;
 }> {
    logger.info('Recording bulk spend', { count: spends.length });

    const results: SpendResult[] = [];
    let totalAmount = 0;
    let failedCount = 0;

    for (const spend of spends) {
      try {
        const result = await this.recordSpend(spend);
        results.push(result);
        totalAmount += result.amount;
      } catch (error) {
        logger.error('Bulk spend error', { spend, error });
        failedCount++;
      }
    }

    return { results, totalAmount, failedCount };
  }

  async refundSpend(transactionId: string, amount?: number): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
  }> {
    logger.info('Processing refund', { transactionId, amount });

    const originalTransaction = await transactionService.getTransactionByIdOrThrow(transactionId);

    if (originalTransaction.type !== 'spend') {
      throw new Error('Can only refund spend transactions');
    }

    const refundAmount = amount || originalTransaction.amount;

    if (refundAmount > originalTransaction.amount) {
      throw new Error(`Refund amount cannot exceed original spend. Original: ${originalTransaction.amount}, Refund: ${refundAmount}`);
    }

    const pool = await poolService.getPoolByIdOrThrow(originalTransaction.poolId.toString());

    const allocationId = originalTransaction.metadata?.allocationId as string;
    if (allocationId) {
      const allocation = await allocationService.getAllocationByIdOrThrow(allocationId);
      allocation.spentAmount = Math.max(0, allocation.spentAmount - refundAmount);

      if (allocation.status === 'exhausted') {
        allocation.status = 'active';
        allocation.reservedAmount = allocation.amount - allocation.spentAmount;
        pool.reservedAmount += allocation.reservedAmount;
      }

      await allocation.save();
    }

    const refundTransaction = await transactionService.recordTransaction({
      poolId: pool._id.toString(),
      type: 'refund',
      amount: refundAmount,
      reference: `REFUND-${originalTransaction._id}`,
      referenceType: 'refund',
      description: `Refund for transaction ${originalTransaction._id}`,
      metadata: {
        originalTransactionId: originalTransaction._id.toString(),
        originalAmount: originalTransaction.amount,
      },
      relatedTransactionId: originalTransaction._id.toString(),
    });

    logger.info('Refund processed successfully', {
      refundTransactionId: refundTransaction._id,
      amount: refundAmount,
    });

    return {
      success: true,
      transactionId: refundTransaction._id.toString(),
      amount: refundAmount,
    };
  }

  async getCampaignSpend(campaignId: string): Promise<{
    totalSpent: number;
    allocationCount: number;
    transactions: number;
    allocations: IAllocation[];
  }> {
    const allocations = await Allocation.find({ campaignId });

    let totalSpent = 0;
    for (const allocation of allocations) {
      totalSpent += allocation.spentAmount;
    }

    const transactionCount = await Transaction.countDocuments({
      'metadata.campaignId': campaignId,
      type: 'spend',
    });

    return {
      totalSpent,
      allocationCount: allocations.length,
      transactions: transactionCount,
      allocations,
    };
  }

  async getSpendAnalytics(poolId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSpend: number;
    spendCount: number;
    averageSpend: number;
    byCampaign: Record<string, { amount: number; count: number }>;
    byDay: Record<string, number>;
  }> {
    const query: Record<string, unknown> = {
      poolId: poolId,
      type: 'spend',
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const transactions = await Transaction.find(query);

    let totalSpend = 0;
    const byCampaign: Record<string, { amount: number; count: number }> = {};
    const byDay: Record<string, number> = {};

    for (const tx of transactions) {
      totalSpend += tx.amount;

      const campaignId = tx.metadata?.campaignId as string || 'unknown';
      if (!byCampaign[campaignId]) {
        byCampaign[campaignId] = { amount: 0, count: 0 };
      }
      byCampaign[campaignId].amount += tx.amount;
      byCampaign[campaignId].count++;

      const day = tx.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + tx.amount;
    }

    return {
      totalSpend,
      spendCount: transactions.length,
      averageSpend: transactions.length > 0 ? totalSpend / transactions.length : 0,
      byCampaign,
      byDay,
    };
  }

  async checkAllocationHealth(poolId: string): Promise<{
    healthy: boolean;
    warnings: string[];
    critical: string[];
  }> {
    const warnings: string[] = [];
    const critical: string[] = [];

    const pool = await poolService.getPoolByIdOrThrow(poolId);
    const allocations = await allocationService.getActiveAllocations(poolId);

    const availableBalance = pool.currentBalance - pool.reservedAmount;
    if (availableBalance < pool.settings.minBalance) {
      critical.push(`Pool balance below minimum threshold: ${availableBalance} < ${pool.settings.minBalance}`);
    }

    for (const allocation of allocations) {
      const remaining = allocation.amount - allocation.spentAmount;
      const percentUsed = (allocation.spentAmount / allocation.amount) * 100;

      if (percentUsed >= 90) {
        critical.push(`Campaign ${allocation.campaignId} allocation nearly exhausted: ${percentUsed.toFixed(1)}% used`);
      } else if (percentUsed >= 75) {
        warnings.push(`Campaign ${allocation.campaignId} allocation at ${percentUsed.toFixed(1)}%`);
      }

      if (allocation.endDate) {
        const daysUntilEnd = Math.ceil((allocation.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilEnd <= 0) {
          critical.push(`Campaign ${allocation.campaignId} allocation has expired`);
        } else if (daysUntilEnd <= 3) {
          warnings.push(`Campaign ${allocation.campaignId} allocation expires in ${daysUntilEnd} days`);
        }
      }
    }

    return {
      healthy: critical.length === 0,
      warnings,
      critical,
    };
  }
}

export const spendService = new SpendService();