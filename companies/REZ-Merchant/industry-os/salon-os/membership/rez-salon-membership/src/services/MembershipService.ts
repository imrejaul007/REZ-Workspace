import { v4 as uuidv4 } from 'uuid';
import mongoose, { ClientSession } from 'mongoose';
import {
  Membership,
  IMembership,
  MembershipStatus,
  MembershipType,
  MembershipTier,
  RenewalType,
  IFamilyMember,
} from '../models/Membership';
import {
  CreateMembershipInput,
  UpdateMembershipInput,
  MembershipQueryInput,
  AddFamilyMemberInput,
} from '../schemas/membership.schemas';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';
import { MembershipTierBenefits } from '../config/membershipBenefits';

export class MembershipService {
  private redis = getRedisClient();

  /**
   * Create a new membership
   */
  async createMembership(input: CreateMembershipInput): Promise<IMembership> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const membershipId = `MEM-${uuidv4()}`;

      // Calculate benefits based on tier
      const tier = input.tier || MembershipTier.BASIC;
      const benefits = input.benefits || MembershipTierBenefits[tier];

      const membership = new Membership({
        ...input,
        membershipId,
        tier,
        benefits,
        status: MembershipStatus.ACTIVE,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      await membership.save({ session });
      await session.commitTransaction();

      // Cache membership for quick lookups
      await this.cacheMembership(membership);

      logger.info('Membership created', { membershipId, userId: input.userId });

      return membership;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get membership by ID
   */
  async getMembershipById(membershipId: string): Promise<IMembership> {
    // Try cache first
    const cached = await this.redis.get(`membership:${membershipId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const membership = await Membership.findOne({ membershipId });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    // Cache for quick lookups
    await this.cacheMembership(membership);

    return membership;
  }

  /**
   * Get active membership for user
   */
  async getActiveMembershipForUser(userId: string, salonId: string): Promise<IMembership | null> {
    return Membership.findOne({
      userId,
      salonId,
      status: MembershipStatus.ACTIVE,
      endDate: { $gt: new Date() },
    });
  }

  /**
   * Update membership
   */
  async updateMembership(membershipId: string, input: UpdateMembershipInput): Promise<IMembership> {
    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    // Invalidate cache
    await this.invalidateMembershipCache(membershipId);

    logger.info('Membership updated', { membershipId });
    return membership;
  }

  /**
   * Cancel membership
   */
  async cancelMembership(membershipId: string, reason?: string): Promise<IMembership> {
    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      {
        $set: {
          status: MembershipStatus.CANCELLED,
          autoRenewal: false,
          metadata: { cancellationReason: reason, cancelledAt: new Date() },
        },
      },
      { new: true }
    );

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    await this.invalidateMembershipCache(membershipId);
    logger.info('Membership cancelled', { membershipId, reason });

    return membership;
  }

  /**
   * Renew membership
   */
  async renewMembership(
    membershipId: string,
    paymentId?: string,
    renewalType?: RenewalType
  ): Promise<IMembership> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await Membership.findOne({ membershipId }).session(session);

      if (!existing) {
        throw new AppError('Membership not found', 404);
      }

      // Calculate new end date based on membership type
      const startDate = new Date();
      const endDate = this.calculateEndDate(startDate, existing.type);

      const updated = await Membership.findOneAndUpdate(
        { membershipId },
        {
          $set: {
            status: MembershipStatus.ACTIVE,
            startDate,
            endDate,
            autoRenewal: renewalType === RenewalType.AUTO ? true : existing.autoRenewal,
            renewalType: renewalType || existing.renewalType,
            paymentId: paymentId || existing.paymentId,
            'metadata.renewedAt': new Date(),
            'metadata.previousEndDate': existing.endDate,
          },
        },
        { new: true, session }
      );

      await session.commitTransaction();

      await this.invalidateMembershipCache(membershipId);
      logger.info('Membership renewed', { membershipId, newEndDate: endDate });

      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Enable/disable auto-renewal
   */
  async setAutoRenewal(membershipId: string, enabled: boolean): Promise<IMembership> {
    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      {
        $set: {
          autoRenewal: enabled,
          renewalType: enabled ? RenewalType.AUTO : RenewalType.MANUAL,
        },
      },
      { new: true }
    );

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    await this.invalidateMembershipCache(membershipId);
    logger.info('Auto-renewal updated', { membershipId, enabled });

    return membership;
  }

  /**
   * Add family member to membership
   */
  async addFamilyMember(membershipId: string, member: AddFamilyMemberInput): Promise<IMembership> {
    const membership = await Membership.findOne({ membershipId });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (!membership.familyMembers) {
      membership.familyMembers = [];
    }

    const maxMembers = membership.maxFamilyMembers || 4;
    if (membership.familyMembers.length >= maxMembers) {
      throw new AppError(`Maximum family members (${maxMembers}) reached`, 400);
    }

    membership.familyMembers.push(member as IFamilyMember);
    await membership.save();

    await this.invalidateMembershipCache(membershipId);
    logger.info('Family member added', { membershipId, memberName: member.name });

    return membership;
  }

  /**
   * Remove family member
   */
  async removeFamilyMember(membershipId: string, memberName: string): Promise<IMembership> {
    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      { $pull: { familyMembers: { name: memberName } } },
      { new: true }
    );

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    await this.invalidateMembershipCache(membershipId);
    logger.info('Family member removed', { membershipId, memberName });

    return membership;
  }

  /**
   * List memberships with filtering
   */
  async listMemberships(
    query: MembershipQueryInput
  ): Promise<{ memberships: IMembership[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {};

    if (query.userId) filter.userId = query.userId;
    if (query.packageId) filter.packageId = query.packageId;
    if (query.type) filter.type = query.type;
    if (query.tier) filter.tier = query.tier;
    if (query.status) filter.status = query.status;
    if (query.autoRenewal !== undefined) filter.autoRenewal = query.autoRenewal;
    if (query.corporateCode) filter.corporateCode = query.corporateCode;
    if (query.salonId) filter.salonId = query.salonId;
    if (query.branchId) filter.branchId = query.branchId;

    // Expiring within X days
    if (query.expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + query.expiringWithinDays);
      filter.endDate = {
        $gt: new Date(),
        $lte: futureDate,
      };
      filter.status = MembershipStatus.ACTIVE;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
      Membership.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Membership.countDocuments(filter),
    ]);

    return { memberships, total, page, limit };
  }

  /**
   * Get memberships expiring soon (for notifications)
   */
  async getExpiringMemberships(daysBeforeExpiry: number = 7): Promise<IMembership[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    return Membership.find({
      status: MembershipStatus.ACTIVE,
      endDate: {
        $gt: new Date(),
        $lte: futureDate,
      },
    }).sort({ endDate: 1 });
  }

  /**
   * Get memberships with auto-renewal enabled
   */
  async getAutoRenewingMemberships(): Promise<IMembership[]> {
    return Membership.find({
      status: MembershipStatus.ACTIVE,
      autoRenewal: true,
      endDate: { $gt: new Date() },
    });
  }

  /**
   * Update membership visits
   */
  async updateVisits(membershipId: string, increment: boolean = true): Promise<IMembership> {
    const update = increment
      ? { $inc: { visitsRemaining: -1 } }
      : { $inc: { visitsRemaining: 1 } };

    const membership = await Membership.findOneAndUpdate(
      { membershipId, visitsRemaining: { $gt: 0 } },
      update,
      { new: true }
    );

    if (!membership) {
      throw new AppError('Membership not found or no visits remaining', 404);
    }

    await this.invalidateMembershipCache(membershipId);
    return membership;
  }

  /**
   * Calculate membership end date based on type
   */
  private calculateEndDate(startDate: Date, type: MembershipType): Date {
    const endDate = new Date(startDate);

    switch (type) {
      case MembershipType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case MembershipType.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case MembershipType.HALF_YEARLY:
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case MembershipType.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case MembershipType.LIFETIME:
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
    }

    return endDate;
  }

  /**
   * Cache membership for quick lookups
   */
  private async cacheMembership(membership: IMembership): Promise<void> {
    await this.redis.setex(
      `membership:${membership.membershipId}`,
      3600, // 1 hour cache
      JSON.stringify(membership)
    );
  }

  /**
   * Invalidate membership cache
   */
  private async invalidateMembershipCache(membershipId: string): Promise<void> {
    await this.redis.del(`membership:${membershipId}`);
  }
}

export const membershipService = new MembershipService();
