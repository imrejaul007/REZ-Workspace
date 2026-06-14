import { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Payout, Creator } from '../models';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import config from '../config';
import {
  IPayout,
  IPayoutDocument,
  CreatePayoutDTO,
  UpdatePayoutDTO,
  PaginatedResponse,
  PayoutStatus,
  PayoutMethod,
} from '../types';

class PayoutService {
  /**
   * Request a payout
   */
  async request(creatorId: string, data: CreatePayoutDTO): Promise<IPayoutDocument> {
    // Validate creator exists
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Check minimum payout amount
    if (data.amount < config.business.minPayoutAmount) {
      throw new Error(`Minimum payout amount is ${config.business.minPayoutAmount}`);
    }

    // Check creator has sufficient pending earnings
    if (creator.pendingPayout < data.amount) {
      throw new Error(`Insufficient pending payout. Available: ${creator.pendingPayout}`);
    }

    // Check for existing pending payout
    const existingPending = await Payout.findOne({
      creatorId,
      status: { $in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
    });

    if (existingPending) {
      throw new Error('A payout request is already pending or processing');
    }

    // Create payout request
    const payout = new Payout({
      creatorId,
      amount: data.amount,
      status: PayoutStatus.PENDING,
      method: data.method || PayoutMethod.BANK_TRANSFER,
      notes: data.notes || '',
      requestedAt: new Date(),
    });

    await payout.save();

    // Deduct from creator's pending payout
    await Creator.findByIdAndUpdate(creatorId, {
      $inc: { pendingPayout: -data.amount },
    });

    // Invalidate caches
    await Promise.all([
      cacheService.invalidateCreatorCache(creatorId),
      cacheService.del(cacheService.keys.creatorPayouts(creatorId)),
    ]);

    logger.info(`Payout requested: ${payout._id} for creator: ${creatorId}, amount: ${data.amount}`);

    return payout;
  }

  /**
   * Get payout by ID
   */
  async getById(id: string): Promise<IPayoutDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return Payout.findById(id);
  }

  /**
   * Get payouts by creator
   */
  async getByCreator(
    creatorId: string,
    params: {
      page?: number;
      limit?: number;
      status?: PayoutStatus;
    } = {}
  ): Promise<PaginatedResponse<IPayoutDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit, status } = params;

    const query: Record<string, unknown> = { creatorId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Payout.countDocuments(query),
    ]);

    return {
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get creator payout summary
   */
  async getCreatorPayoutSummary(creatorId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalPaidOut: number;
    availableForPayout: number;
  }> {
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    const stats = await Payout.getCreatorPayoutStats(creatorId);

    return {
      pending: stats.pending.amount,
      processing: stats.processing.amount,
      completed: stats.completed.amount,
      failed: stats.failed.amount,
      totalPaidOut: stats.totalPaidOut,
      availableForPayout: creator.pendingPayout,
    };
  }

  /**
   * Get pending payouts for admin processing
   */
  async getPendingPayouts(
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<IPayoutDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit } = params;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      Payout.findPending()
        .populate('creatorId')
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Payout.countDocuments({ status: PayoutStatus.PENDING }),
    ]);

    return {
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Process payout (admin action)
   */
  async processPayout(id: string, transactionId?: string): Promise<IPayoutDocument | null> {
    const payout = await Payout.findById(id);
    if (!payout) {
      return null;
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Only pending payouts can be processed');
    }

    payout.status = PayoutStatus.PROCESSING;
    if (transactionId) {
      payout.transactionId = transactionId;
    }
    await payout.save();

    logger.info(`Payout processing: ${id}`);

    return payout;
  }

  /**
   * Complete payout (admin action)
   */
  async completePayout(id: string, bankReference?: string): Promise<IPayoutDocument | null> {
    const payout = await Payout.findById(id);
    if (!payout) {
      return null;
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new Error('Only processing payouts can be completed');
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.processedAt = new Date();
    if (bankReference) {
      payout.bankReference = bankReference;
    }
    await payout.save();

    logger.info(`Payout completed: ${id}`);

    return payout;
  }

  /**
   * Fail payout (admin action)
   */
  async failPayout(id: string, reason: string): Promise<IPayoutDocument | null> {
    const payout = await Payout.findById(id);
    if (!payout) {
      return null;
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new Error('Only processing payouts can be failed');
    }

    payout.status = PayoutStatus.FAILED;
    payout.failureReason = reason;
    payout.processedAt = new Date();

    // Refund to creator's pending payout
    await Creator.findByIdAndUpdate(payout.creatorId, {
      $inc: { pendingPayout: payout.amount },
    });

    await payout.save();

    logger.info(`Payout failed: ${id}, reason: ${reason}`);

    return payout;
  }

  /**
   * Cancel payout request (creator action)
   */
  async cancelPayout(id: string, creatorId: string): Promise<IPayoutDocument | null> {
    const payout = await Payout.findById(id);
    if (!payout) {
      return null;
    }

    if (payout.creatorId.toString() !== creatorId) {
      throw new Error('Unauthorized');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Only pending payouts can be cancelled');
    }

    // Refund to creator's pending payout
    await Creator.findByIdAndUpdate(creatorId, {
      $inc: { pendingPayout: payout.amount },
    });

    payout.status = PayoutStatus.FAILED;
    payout.failureReason = 'Cancelled by creator';
    payout.processedAt = new Date();
    await payout.save();

    // Invalidate caches
    await Promise.all([
      cacheService.invalidateCreatorCache(creatorId),
      cacheService.del(cacheService.keys.creatorPayouts(creatorId)),
    ]);

    logger.info(`Payout cancelled by creator: ${id}`);

    return payout;
  }

  /**
   * Update payout details
   */
  async update(id: string, data: UpdatePayoutDTO): Promise<IPayoutDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const payout = await Payout.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    return payout;
  }

  /**
   * Get platform payout stats
   */
  async getPlatformStats(): Promise<{
    pending: { count: number; amount: number };
    processing: { count: number; amount: number };
    completed: { count: number; amount: number };
    failed: { count: number; amount: number };
    totalPaidOut: number;
  }> {
    return Payout.getPlatformPayoutStats();
  }

  /**
   * Auto-process payouts (scheduled job)
   */
  async autoProcessPendingPayouts(): Promise<{
    processed: number;
    failed: number;
  }> {
    const pendingPayouts = await Payout.findPending();
    let processed = 0;
    let failed = 0;

    for (const payout of pendingPayouts) {
      try {
        // Simulate payment processing
        const transactionId = `TXN-${Date.now()}-${payout._id.toString().slice(-6)}`;

        // Process -> Complete in one go for auto-processing
        payout.status = PayoutStatus.PROCESSING;
        payout.transactionId = transactionId;
        await payout.save();

        // Simulate slight delay for payment gateway
        await new Promise((resolve) => setTimeout(resolve, 100));

        payout.status = PayoutStatus.COMPLETED;
        payout.processedAt = new Date();
        payout.bankReference = `REF-${Date.now()}`;
        await payout.save();

        processed++;
        logger.info(`Auto-processed payout: ${payout._id}`);
      } catch (error) {
        failed++;
        logger.error(`Auto-process failed for payout ${payout._id}:`, error);

        // Mark as failed
        await payout.fail(`Auto-processing failed: ${(error as Error).message}`);
      }
    }

    return { processed, failed };
  }

  /**
   * Calculate payout eligibility
   */
  async getPayoutEligibility(creatorId: string): Promise<{
    eligible: boolean;
    availableAmount: number;
    pendingPayouts: number;
    minAmount: number;
    message?: string;
  }> {
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      return {
        eligible: false,
        availableAmount: 0,
        pendingPayouts: 0,
        minAmount: config.business.minPayoutAmount,
        message: 'Creator not found',
      };
    }

    // Check for existing pending payouts
    const pendingCount = await Payout.countDocuments({
      creatorId,
      status: { $in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
    });

    const eligible = creator.pendingPayout >= config.business.minPayoutAmount && pendingCount === 0;

    return {
      eligible,
      availableAmount: creator.pendingPayout,
      pendingPayouts: pendingCount,
      minAmount: config.business.minPayoutAmount,
      message: eligible
        ? undefined
        : pendingCount > 0
        ? 'A payout request is already pending'
        : `Minimum payout amount is ${config.business.minPayoutAmount}. Available: ${creator.pendingPayout}`,
    };
  }
}

export const payoutService = new PayoutService();
export default payoutService;
