import { v4 as uuidv4 } from 'uuid';
import { BudgetPool, IBudgetPool } from '../models';
import { logger } from '../utils/logger';

export interface CreatePoolDto {
  name: string;
  organizationId: string;
  totalBudget: number;
  currency?: string;
  description?: string;
  settings?: {
    minBalance?: number;
    autoReplenish?: boolean;
    replenishThreshold?: number;
    maxAllocationPercent?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface UpdatePoolDto {
  name?: string;
  description?: string;
  settings?: {
    minBalance?: number;
    autoReplenish?: boolean;
    replenishThreshold?: number;
    maxAllocationPercent?: number;
  };
  status?: 'active' | 'inactive' | 'frozen';
}

export class PoolService {
  async createPool(dto: CreatePoolDto): Promise<IBudgetPool> {
    logger.info('Creating new budget pool', { name: dto.name, organizationId: dto.organizationId });

    const pool = new BudgetPool({
      name: dto.name,
      organizationId: dto.organizationId,
      totalBudget: dto.totalBudget,
      currentBalance: dto.totalBudget,
      currency: dto.currency || 'INR',
      description: dto.description,
      settings: {
        minBalance: dto.settings?.minBalance || 0,
        autoReplenish: dto.settings?.autoReplenish || false,
        replenishThreshold: dto.settings?.replenishThreshold || 0,
        maxAllocationPercent: dto.settings?.maxAllocationPercent || 100,
      },
      metadata: dto.metadata || {},
      status: 'active',
    });

    await pool.save();
    logger.info('Budget pool created successfully', { poolId: pool._id });

    return pool;
  }

  async getPoolById(poolId: string): Promise<IBudgetPool | null> {
    return BudgetPool.findById(poolId);
  }

  async getPoolByIdOrThrow(poolId: string): Promise<IBudgetPool> {
    const pool = await this.getPoolById(poolId);
    if (!pool) {
      throw new Error(`Budget pool not found: ${poolId}`);
    }
    return pool;
  }

  async listPools(options: {
    organizationId?: string;
    status?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ pools: IBudgetPool[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (options.organizationId) {
      query.organizationId = options.organizationId;
    }

    if (options.status) {
      query.status = options.status;
    }

    const [pools, total] = await Promise.all([
      BudgetPool.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50),
      BudgetPool.countDocuments(query),
    ]);

    return { pools, total };
  }

  async updatePool(poolId: string, dto: UpdatePoolDto): Promise<IBudgetPool> {
    logger.info('Updating budget pool', { poolId });

    const pool = await this.getPoolByIdOrThrow(poolId);

    if (dto.name) pool.name = dto.name;
    if (dto.description !== undefined) pool.description = dto.description;
    if (dto.status) pool.status = dto.status;

    if (dto.settings) {
      pool.settings = {
        ...pool.settings,
        ...dto.settings,
      };
    }

    await pool.save();
    logger.info('Budget pool updated successfully', { poolId });

    return pool;
  }

  async deletePool(poolId: string): Promise<void> {
    logger.info('Deleting budget pool', { poolId });

    const pool = await this.getPoolByIdOrThrow(poolId);

    if (pool.currentBalance > 0) {
      throw new Error('Cannot delete pool with remaining balance');
    }

    await BudgetPool.findByIdAndDelete(poolId);
    logger.info('Budget pool deleted successfully', { poolId });
  }

  async updateBalance(poolId: string, amount: number, operation: 'add' | 'subtract'): Promise<IBudgetPool> {
    const pool = await this.getPoolByIdOrThrow(poolId);

    if (operation === 'add') {
      pool.currentBalance += amount;
      pool.totalBudget += amount;
    } else {
      if (pool.currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      pool.currentBalance -= amount;
    }

    await pool.save();
    return pool;
  }

  async freezePool(poolId: string): Promise<IBudgetPool> {
    logger.info('Freezing budget pool', { poolId });

    const pool = await this.getPoolByIdOrThrow(poolId);
    pool.status = 'frozen';
    await pool.save();

    return pool;
  }

  async unfreezePool(poolId: string): Promise<IBudgetPool> {
    logger.info('Unfreezing budget pool', { poolId });

    const pool = await this.getPoolByIdOrThrow(poolId);
    if (pool.status !== 'frozen') {
      throw new Error('Pool is not frozen');
    }
    pool.status = 'active';
    await pool.save();

    return pool;
  }

  async getPoolAnalytics(poolId: string): Promise<{
    totalBudget: number;
    currentBalance: number;
    reservedAmount: number;
    availableBalance: number;
    utilizationPercent: number;
    reservedPercent: number;
    allocationCount: number;
    transactionCount: number;
  }> {
    const pool = await this.getPoolByIdOrThrow(poolId);
    const { Allocation, Transaction } = await import('../models');

    const [allocationCount, transactionCount] = await Promise.all([
      Allocation.countDocuments({ poolId: pool._id, status: { $in: ['active', 'pending'] } }),
      Transaction.countDocuments({ poolId: pool._id }),
    ]);

    const utilized = pool.totalBudget - pool.currentBalance;
    const utilizationPercent = pool.totalBudget > 0 ? (utilized / pool.totalBudget) * 100 : 0;
    const availableBalance = pool.currentBalance - pool.reservedAmount;

    return {
      totalBudget: pool.totalBudget,
      currentBalance: pool.currentBalance,
      reservedAmount: pool.reservedAmount,
      availableBalance: Math.max(0, availableBalance),
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      reservedPercent: Math.round(pool.reservedPercent() * 100) / 100,
      allocationCount,
      transactionCount,
    };
  }

  async getOrganizationPools(organizationId: string): Promise<{
    pools: IBudgetPool[];
    totalBudget: number;
    totalBalance: number;
  }> {
    const pools = await BudgetPool.find({ organizationId, status: 'active' });

    const totals = pools.reduce(
      (acc, pool) => {
        acc.totalBudget += pool.totalBudget;
        acc.totalBalance += pool.currentBalance;
        return acc;
      },
      { totalBudget: 0, totalBalance: 0 }
    );

    return { pools, ...totals };
  }
}

export const poolService = new PoolService();