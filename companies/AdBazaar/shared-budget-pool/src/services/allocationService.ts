import { v4 as uuidv4 } from 'uuid';
import { Allocation, BudgetPool, Transaction, IAllocation } from '../models';
import { poolService } from './poolService';
import { transactionService } from './transactionService';
import { logger } from '../utils/logger';

export interface CreateAllocationDto {
  poolId: string;
  campaignId: string;
  campaignName?: string;
  amount: number;
  startDate?: Date;
  endDate?: Date;
  priority?: number;
  settings?: {
    dailyLimit?: number;
    pacingStrategy?: 'even' | 'frontload' | 'backload';
    autoPauseThreshold?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface UpdateAllocationDto {
  amount?: number;
  endDate?: Date;
  priority?: number;
  status?: 'pending' | 'active' | 'paused' | 'exhausted' | 'cancelled';
  settings?: {
    dailyLimit?: number;
    pacingStrategy?: 'even' | 'frontload' | 'backload';
    autoPauseThreshold?: number;
  };
}

export class AllocationService {
  async createAllocation(dto: CreateAllocationDto): Promise<IAllocation> {
    logger.info('Creating new allocation', {
      poolId: dto.poolId,
      campaignId: dto.campaignId,
      amount: dto.amount,
    });

    const pool = await poolService.getPoolByIdOrThrow(dto.poolId);

    if (pool.status !== 'active') {
      throw new Error('Cannot allocate to inactive or frozen pool');
    }

    const availableBalance = pool.currentBalance - pool.reservedAmount;
    if (availableBalance < dto.amount) {
      throw new Error(`Insufficient balance. Available: ${availableBalance}, Requested: ${dto.amount}`);
    }

    const maxAllocation = (pool.totalBudget * pool.settings.maxAllocationPercent) / 100;
    if (dto.amount > maxAllocation) {
      throw new Error(`Allocation exceeds maximum allowed (${pool.settings.maxAllocationPercent}% of total budget)`);
    }

    const allocation = new Allocation({
      poolId: pool._id,
      campaignId: dto.campaignId,
      campaignName: dto.campaignName,
      amount: dto.amount,
      reservedAmount: dto.amount,
      spentAmount: 0,
      status: 'pending',
      startDate: dto.startDate || new Date(),
      endDate: dto.endDate,
      priority: dto.priority || 1,
      settings: {
        dailyLimit: dto.settings?.dailyLimit,
        pacingStrategy: dto.settings?.pacingStrategy || 'even',
        autoPauseThreshold: dto.settings?.autoPauseThreshold,
      },
      metadata: dto.metadata || {},
    });

    await allocation.save();

    pool.reservedAmount += dto.amount;
    await pool.save();

    await transactionService.recordTransaction({
      poolId: pool._id.toString(),
      type: 'allocation',
      amount: dto.amount,
      reference: `ALLOC-${allocation._id}`,
      referenceType: 'campaign',
      description: `Budget allocated to campaign ${dto.campaignId}`,
      metadata: { allocationId: allocation._id.toString() },
    });

    logger.info('Allocation created successfully', { allocationId: allocation._id });
    return allocation;
  }

  async getAllocationById(allocationId: string): Promise<IAllocation | null> {
    return Allocation.findById(allocationId);
  }

  async getAllocationByIdOrThrow(allocationId: string): Promise<IAllocation> {
    const allocation = await this.getAllocationById(allocationId);
    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }
    return allocation;
  }

  async listAllocations(options: {
    poolId?: string;
    campaignId?: string;
    status?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ allocations: IAllocation[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (options.poolId) {
      query.poolId = options.poolId;
    }

    if (options.campaignId) {
      query.campaignId = options.campaignId;
    }

    if (options.status) {
      query.status = options.status;
    }

    const [allocations, total] = await Promise.all([
      Allocation.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50),
      Allocation.countDocuments(query),
    ]);

    return { allocations, total };
  }

  async updateAllocation(allocationId: string, dto: UpdateAllocationDto): Promise<IAllocation> {
    logger.info('Updating allocation', { allocationId });

    const allocation = await this.getAllocationByIdOrThrow(allocationId);
    const pool = await poolService.getPoolByIdOrThrow(allocation.poolId.toString());

    if (dto.amount !== undefined && dto.amount !== allocation.amount) {
      const diff = dto.amount - allocation.amount;

      if (diff > 0) {
        const availableBalance = pool.currentBalance - pool.reservedAmount;
        if (availableBalance < diff) {
          throw new Error(`Insufficient balance for increase. Available: ${availableBalance}`);
        }
 }

      allocation.reservedAmount += diff;
      pool.reservedAmount += diff;
      allocation.amount = dto.amount;
    }

    if (dto.status) {
      allocation.status = dto.status;

      if (dto.status === 'cancelled' || dto.status === 'exhausted') {
        pool.reservedAmount -= allocation.reservedAmount;
        allocation.reservedAmount = 0;
      }
    }

    if (dto.endDate) {
      allocation.endDate = dto.endDate;
    }

    if (dto.priority !== undefined) {
      allocation.priority = dto.priority;
    }

    if (dto.settings) {
      allocation.settings = { ...allocation.settings, ...dto.settings };
    }

    await Promise.all([allocation.save(), pool.save()]);
    logger.info('Allocation updated successfully', { allocationId });

    return allocation;
  }

  async activateAllocation(allocationId: string): Promise<IAllocation> {
    logger.info('Activating allocation', { allocationId });

    const allocation = await this.getAllocationByIdOrThrow(allocationId);

    if (allocation.status !== 'pending' && allocation.status !== 'paused') {
      throw new Error(`Cannot activate allocation with status: ${allocation.status}`);
    }

    allocation.status = 'active';
    await allocation.save();

    return allocation;
  }

  async pauseAllocation(allocationId: string): Promise<IAllocation> {
    logger.info('Pausing allocation', { allocationId });

    const allocation = await this.getAllocationByIdOrThrow(allocationId);

    if (allocation.status !== 'active') {
      throw new Error(`Cannot pause allocation with status: ${allocation.status}`);
    }

    allocation.status = 'paused';
    await allocation.save();

    return allocation;
  }

  async cancelAllocation(allocationId: string): Promise<IAllocation> {
    logger.info('Cancelling allocation', { allocationId });

    const allocation = await this.getAllocationByIdOrThrow(allocationId);
    const pool = await poolService.getPoolByIdOrThrow(allocation.poolId.toString());

    pool.reservedAmount -= allocation.reservedAmount;
    allocation.reservedAmount = 0;
    allocation.status = 'cancelled';

    await Promise.all([allocation.save(), pool.save()]);

    await transactionService.recordTransaction({
      poolId: pool._id.toString(),
      type: 'reversal',
      amount: allocation.amount,
      reference: `CANCEL-${allocation._id}`,
      referenceType: 'campaign',
      description: `Allocation cancelled for campaign ${allocation.campaignId}`,
      metadata: { allocationId: allocation._id.toString() },
    });

    return allocation;
  }

  async getPoolAllocations(poolId: string, options: {
    status?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ allocations: IAllocation[]; total: number }> {
    return this.listAllocations({ poolId, ...options });
  }

  async getCampaignAllocations(campaignId: string): Promise<IAllocation[]> {
    return Allocation.find({ campaignId }).sort({ createdAt: -1 });
  }

  async getActiveAllocations(poolId: string): Promise<IAllocation[]> {
    return Allocation.find({
      poolId,
      status: 'active',
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } },
      ],
    }).sort({ priority: -1, createdAt: 1 });
  }

  async markExhausted(allocationId: string): Promise<IAllocation> {
    logger.info('Marking allocation as exhausted', { allocationId });

    const allocation = await this.getAllocationByIdOrThrow(allocationId);
    allocation.status = 'exhausted';
    allocation.reservedAmount = 0;
    await allocation.save();

    return allocation;
  }
}

export const allocationService = new AllocationService();