import { v4 as uuidv4 } from 'uuid';
import mongoose, { ClientSession } from 'mongoose';
import {
  Redemption,
  IRedemption,
  RedemptionStatus,
  RedemptionType,
} from '../models/Redemption';
import { Membership, MembershipStatus } from '../models/Membership';
import { Package, PackageStatus } from '../models/Package';
import { CreateRedemptionInput, UpdateRedemptionInput, RedemptionQueryInput } from '../schemas/redemption.schemas';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';

export class RedemptionService {
  private redis = getRedisClient();

  /**
   * Create a new redemption
   */
  async createRedemption(input: CreateRedemptionInput): Promise<IRedemption> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate membership if provided
      if (input.membershipId) {
        const membership = await Membership.findOne({
          membershipId: input.membershipId,
          status: MembershipStatus.ACTIVE,
          endDate: { $gt: new Date() },
        }).session(session);

        if (!membership) {
          throw new AppError('Invalid or expired membership', 400);
        }

        // Check visits remaining if applicable
        if (membership.visitsRemaining !== undefined && membership.visitsRemaining <= 0) {
          throw new AppError('No visits remaining on membership', 400);
        }

        // Decrement visits
        if (membership.visitsRemaining !== undefined) {
          await Membership.updateOne(
            { membershipId: input.membershipId },
            { $inc: { visitsRemaining: -1 } }
          ).session(session);
        }
      }

      // Validate package
      const pkg = await Package.findOne({
        packageId: input.packageId,
        status: PackageStatus.ACTIVE,
      }).session(session);

      if (!pkg) {
        throw new AppError('Invalid or inactive package', 400);
      }

      // Check max redemptions if applicable
      if (pkg.maxRedemptions) {
        const redemptionCount = await Redemption.countDocuments({
          packageId: input.packageId,
          userId: input.userId,
          status: { $ne: RedemptionStatus.CANCELLED },
        }).session(session);

        if (redemptionCount >= pkg.maxRedemptions) {
          throw new AppError('Maximum redemptions reached for this package', 400);
        }
      }

      const redemptionId = `RED-${uuidv4()}`;

      const redemption = new Redemption({
        ...input,
        redemptionId,
        status: RedemptionStatus.PENDING,
        redeemedAt: new Date(),
      });

      await redemption.save({ session });
      await session.commitTransaction();

      // Invalidate membership cache if applicable
      if (input.membershipId) {
        await this.redis.del(`membership:${input.membershipId}`);
      }

      logger.info('Redemption created', { redemptionId, userId: input.userId });

      return redemption;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Complete a redemption
   */
  async completeRedemption(redemptionId: string, stylistId?: string, notes?: string): Promise<IRedemption> {
    const redemption = await Redemption.findOneAndUpdate(
      { redemptionId, status: RedemptionStatus.PENDING },
      {
        $set: {
          status: RedemptionStatus.COMPLETED,
          stylistId,
          notes: notes || undefined,
        },
      },
      { new: true }
    );

    if (!redemption) {
      throw new AppError('Redemption not found or already processed', 404);
    }

    logger.info('Redemption completed', { redemptionId });
    return redemption;
  }

  /**
   * Cancel a redemption
   */
  async cancelRedemption(redemptionId: string, reason: string): Promise<IRedemption> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const redemption = await Redemption.findOne({
        redemptionId,
        status: { $in: [RedemptionStatus.PENDING, RedemptionStatus.COMPLETED] },
      }).session(session);

      if (!redemption) {
        throw new AppError('Redemption not found or already cancelled', 404);
      }

      // Restore membership visits if applicable
      if (redemption.membershipId && redemption.status === RedemptionStatus.COMPLETED) {
        await Membership.updateOne(
          { membershipId: redemption.membershipId },
          { $inc: { visitsRemaining: 1 } }
        ).session(session);

        await this.redis.del(`membership:${redemption.membershipId}`);
      }

      // Update redemption status
      redemption.status = RedemptionStatus.CANCELLED;
      redemption.cancelledAt = new Date();
      redemption.cancellationReason = reason;
      await redemption.save({ session });

      await session.commitTransaction();

      logger.info('Redemption cancelled', { redemptionId, reason });
      return redemption;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund a redemption
   */
  async refundRedemption(redemptionId: string, reason: string): Promise<IRedemption> {
    const redemption = await Redemption.findOneAndUpdate(
      { redemptionId, status: RedemptionStatus.COMPLETED },
      {
        $set: {
          status: RedemptionStatus.REFUNDED,
          notes: `Refund: ${reason}`,
        },
      },
      { new: true }
    );

    if (!redemption) {
      throw new AppError('Redemption not found or cannot be refunded', 404);
    }

    logger.info('Redemption refunded', { redemptionId, reason });
    return redemption;
  }

  /**
   * Get redemption by ID
   */
  async getRedemptionById(redemptionId: string): Promise<IRedemption> {
    const redemption = await Redemption.findOne({ redemptionId });

    if (!redemption) {
      throw new AppError('Redemption not found', 404);
    }

    return redemption;
  }

  /**
   * Get redemption by appointment ID
   */
  async getRedemptionByAppointment(appointmentId: string): Promise<IRedemption | null> {
    return Redemption.findOne({ appointmentId });
  }

  /**
   * Update redemption
   */
  async updateRedemption(redemptionId: string, input: UpdateRedemptionInput): Promise<IRedemption> {
    const updateData: Record<string, unknown> = { ...input };

    if (input.status === RedemptionStatus.CANCELLED && input.cancellationReason) {
      updateData.cancelledAt = new Date();
    }

    const redemption = await Redemption.findOneAndUpdate(
      { redemptionId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!redemption) {
      throw new AppError('Redemption not found', 404);
    }

    logger.info('Redemption updated', { redemptionId });
    return redemption;
  }

  /**
   * List redemptions with filtering
   */
  async listRedemptions(
    query: RedemptionQueryInput
  ): Promise<{ redemptions: IRedemption[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {};

    if (query.membershipId) filter.membershipId = query.membershipId;
    if (query.packageId) filter.packageId = query.packageId;
    if (query.userId) filter.userId = query.userId;
    if (query.salonId) filter.salonId = query.salonId;
    if (query.branchId) filter.branchId = query.branchId;
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.appointmentId) filter.appointmentId = query.appointmentId;

    if (query.fromDate || query.toDate) {
      filter.redeemedAt = {};
      if (query.fromDate) filter.redeemedAt.$gte = new Date(query.fromDate);
      if (query.toDate) filter.redeemedAt.$lte = new Date(query.toDate);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [redemptions, total] = await Promise.all([
      Redemption.find(filter).skip(skip).limit(limit).sort({ redeemedAt: -1 }),
      Redemption.countDocuments(filter),
    ]);

    return { redemptions, total, page, limit };
  }

  /**
   * Get user redemption history
   */
  async getUserRedemptionHistory(
    userId: string,
    limit: number = 10
  ): Promise<IRedemption[]> {
    return Redemption.find({
      userId,
      status: { $ne: RedemptionStatus.CANCELLED },
    })
      .sort({ redeemedAt: -1 })
      .limit(limit);
  }

  /**
   * Get salon redemption stats
   */
  async getSalonRedemptionStats(salonId: string, fromDate?: Date, toDate?: Date): Promise<{
    totalRedemptions: number;
    totalValue: number;
    completedCount: number;
    pendingCount: number;
    cancelledCount: number;
  }> {
    const match: Record<string, unknown> = { salonId };

    if (fromDate || toDate) {
      match.redeemedAt = {};
      if (fromDate) match.redeemedAt.$gte = fromDate;
      if (toDate) match.redeemedAt.$lte = toDate;
    }

    const result = await Redemption.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', RedemptionStatus.COMPLETED] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', RedemptionStatus.PENDING] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', RedemptionStatus.CANCELLED] }, 1, 0] },
          },
        },
      },
    ]);

    return result[0] || {
      totalRedemptions: 0,
      totalValue: 0,
      completedCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };
  }

  /**
   * Check if service can be redeemed (within validity period and not expired)
   */
  async canRedeem(membershipId: string): Promise<{ canRedeem: boolean; reason?: string }> {
    const membership = await Membership.findOne({ membershipId });

    if (!membership) {
      return { canRedeem: false, reason: 'Membership not found' };
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      return { canRedeem: false, reason: 'Membership is not active' };
    }

    if (new Date() > membership.endDate) {
      return { canRedeem: false, reason: 'Membership has expired' };
    }

    if (membership.visitsRemaining !== undefined && membership.visitsRemaining <= 0) {
      return { canRedeem: false, reason: 'No visits remaining' };
    }

    return { canRedeem: true };
  }
}

export const redemptionService = new RedemptionService();
