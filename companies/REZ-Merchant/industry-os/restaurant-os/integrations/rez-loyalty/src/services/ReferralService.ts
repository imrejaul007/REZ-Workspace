import { v4 as uuidv4 } from 'uuid';
import {
  CustomerPoints,
} from '../models/CustomerPoints';
import { PointsTransaction } from '../models/PointsTransaction';
import { Referral, IReferral } from '../models/Referral';
import { LoyaltyProgram } from '../models/LoyaltyProgram';
import {
  TRANSACTION_TYPES,
  REFERRAL_MIN_SPEND,
  REDIS_KEYS,
  REDIS_TTL,
} from '../config/constants';
import type Redis from 'ioredis';

export interface ReferralResult {
  success: boolean;
  referralId: string;
  referrerBonusPoints: number;
  referredBonusPoints: number;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalReferrerEarnings: number;
  totalReferredEarnings: number;
}

export class ReferralService {
  constructor(private redis: Redis) {}

  /**
   * Create a referral relationship
   */
  async createReferral(
    referrerId: string,
    referredId: string,
    programId: string
  ): Promise<ReferralResult> {
    const program = await LoyaltyProgram.findOne({ programId });
    if (!program || !program.referralEnabled) {
      throw new Error('Referral program not enabled');
    }

    // Check if referral already exists
    const existingReferral = await Referral.findOne({
      referrerId,
      referredId,
      programId,
      status: 'ACTIVE',
    });

    if (existingReferral) {
      throw new Error('Referral already exists');
    }

    const referrerBonus = program.referrerBonusPoints;
    const referredBonus = program.referredUserBonusPoints;

    const session = await Referral.startSession();
    session.startTransaction();

    try {
      // Create referral record
      const referralId = uuidv4();
      const referral = await Referral.create(
        [
          {
            referralId,
            referrerId,
            referredId,
            programId,
            referrerBonusPoints: referrerBonus,
            referredBonusPoints: referredBonus,
            status: 'ACTIVE',
          },
        ],
        { session }
      );

      // Award referred user bonus immediately
      await this.awardReferredBonus(referredId, programId, referralId, referredBonus, session);

      await session.commitTransaction();

      return {
        success: true,
        referralId,
        referrerBonusPoints: referrerBonus,
        referredBonusPoints: referredBonus,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Award bonus to referred user
   */
  private async awardReferredBonus(
    customerId: string,
    programId: string,
    referralId: string,
    points: number,
    session: unknown
  ): Promise<void> {
    let customerPoints = await CustomerPoints.findOne({ customerId, programId }).session(session);

    if (!customerPoints) {
      customerPoints = new CustomerPoints({
        customerId,
        programId,
        currentPoints: 0,
        lifetimePoints: 0,
      });
    }

    customerPoints.currentPoints += points;
    customerPoints.lifetimePoints += points;
    await customerPoints.save({ session });

    // Update referral bonus claimed
    await Referral.findOneAndUpdate(
      { referralId },
      { referredBonusClaimed: true },
      { session }
    );

    // Create transaction
    await PointsTransaction.create(
      [
        {
          transactionId: uuidv4(),
          customerId,
          programId,
          type: TRANSACTION_TYPES.REFERRAL,
          points,
          balanceAfter: customerPoints.currentPoints,
          description: `Welcome bonus! You earned ${points} points for joining via referral`,
          status: 'ACTIVE',
          metadata: { referralId },
        },
      ],
      { session }
    );
  }

  /**
   * Check and award referrer bonus when referred user meets spend threshold
   */
  async checkAndAwardReferrerBonus(
    referredId: string,
    programId: string,
    totalSpendAmount: number
  ): Promise<{ awarded: boolean; pointsAwarded: number }> {
    const referral = await Referral.findOne({
      referredId,
      programId,
      status: 'ACTIVE',
      referredHasMetMinSpend: false,
    });

    if (!referral) {
      return { awarded: false, pointsAwarded: 0 };
    }

    // Update spend amount
    referral.referredSpendAmount += totalSpendAmount;

    if (referral.referredSpendAmount >= REFERRAL_MIN_SPEND) {
      referral.referredHasMetMinSpend = true;

      const session = await Referral.startSession();
      session.startTransaction();

      try {
        // Award referrer bonus
        await this.awardReferrerBonus(
          referral.referrerId,
          programId,
          referral.referralId,
          referral.referrerBonusPoints,
          session
        );

        await referral.save({ session });
        await session.commitTransaction();

        return {
          awarded: true,
          pointsAwarded: referral.referrerBonusPoints,
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    await referral.save();
    return { awarded: false, pointsAwarded: 0 };
  }

  /**
   * Award bonus to referrer
   */
  private async awardReferrerBonus(
    customerId: string,
    programId: string,
    referralId: string,
    points: number,
    session: unknown
  ): Promise<void> {
    let customerPoints = await CustomerPoints.findOne({ customerId, programId }).session(session);

    if (!customerPoints) {
      customerPoints = new CustomerPoints({
        customerId,
        programId,
        currentPoints: 0,
        lifetimePoints: 0,
      });
    }

    customerPoints.currentPoints += points;
    customerPoints.lifetimePoints += points;
    customerPoints.referralCount += 1;
    customerPoints.referralUserIds.push(referralId);
    await customerPoints.save({ session });

    // Update referral bonus claimed
    await Referral.findOneAndUpdate(
      { referralId },
      { referrerBonusClaimed: true },
      { session }
    );

    // Create transaction
    await PointsTransaction.create(
      [
        {
          transactionId: uuidv4(),
          customerId,
          programId,
          type: TRANSACTION_TYPES.REFERRAL,
          points,
          balanceAfter: customerPoints.currentPoints,
          description: `Referral bonus! Your friend completed their first ₹${REFERRAL_MIN_SPEND} order. You earned ${points} points!`,
          status: 'ACTIVE',
          metadata: { referralId },
        },
      ],
      { session }
    );
  }

  /**
   * Get referral statistics for a customer
   */
  async getReferralStats(referrerId: string, programId: string): Promise<ReferralStats> {
    const referrals = await Referral.find({
      referrerId,
      programId,
      status: 'ACTIVE',
    });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.referredHasMetMinSpend).length;
    const pendingReferrals = totalReferrals - successfulReferrals;
    const totalReferrerEarnings = referrals
      .filter((r) => r.referrerBonusClaimed)
      .reduce((sum, r) => sum + r.referrerBonusPoints, 0);
    const totalReferredEarnings = referrals
      .filter((r) => r.referredBonusClaimed)
      .reduce((sum, r) => sum + r.referredBonusPoints, 0);

    return {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalReferrerEarnings,
      totalReferredEarnings,
    };
  }

  /**
   * Get referral history
   */
  async getReferralHistory(
    customerId: string,
    programId: string,
    role: 'referrer' | 'referred' = 'referrer'
  ): Promise<IReferral[]> {
    const query: Record<string, unknown> = {
      programId,
      status: 'ACTIVE',
    };

    if (role === 'referrer') {
      query.referrerId = customerId;
    } else {
      query.referredId = customerId;
    }

    return Referral.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get referral link/code
   */
  generateReferralCode(customerId: string): string {
    // Generate a simple referral code from customer ID
    const prefix = 'REZ';
    const suffix = customerId.substring(0, 6).toUpperCase();
    return `${prefix}${suffix}`;
  }
}
