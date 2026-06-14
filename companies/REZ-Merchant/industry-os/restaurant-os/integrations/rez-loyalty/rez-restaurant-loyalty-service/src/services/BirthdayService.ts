import { v4 as uuidv4 } from 'uuid';
import {
  CustomerPoints,
} from '../models/CustomerPoints';
import { PointsTransaction } from '../models/PointsTransaction';
import { LoyaltyProgram } from '../models/LoyaltyProgram';
import {
  TRANSACTION_TYPES,
  BIRTHDAY_BONUS_POINTS,
  BIRTHDAY_BONUS_WINDOW_DAYS,
  REDIS_KEYS,
  REDIS_TTL,
} from '../config/constants';
import type Redis from 'ioredis';

export interface BirthdayBonusResult {
  success: boolean;
  pointsAwarded: number;
  message: string;
}

export class BirthdayService {
  constructor(private redis: Redis) {}

  /**
   * Check if birthday bonus is available and claim it
   */
  async checkAndClaimBirthdayBonus(
    customerId: string,
    programId: string,
    birthday: Date
  ): Promise<BirthdayBonusResult> {
    const currentYear = new Date().getFullYear();

    // Check if already claimed this year
    const claimedKey = REDIS_KEYS.BIRTHDAY_CLAIMED(customerId, currentYear);
    const alreadyClaimed = await this.redis.get(claimedKey);

    if (alreadyClaimed === 'claimed') {
      return {
        success: false,
        pointsAwarded: 0,
        message: 'Birthday bonus already claimed for this year',
      };
    }

    // Check if birthday is within bonus window
    const birthdayThisYear = new Date(birthday);
    birthdayThisYear.setFullYear(currentYear);

    const today = new Date();
    const daysDiff = Math.abs(
      Math.floor((today.getTime() - birthdayThisYear.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (daysDiff > BIRTHDAY_BONUS_WINDOW_DAYS) {
      return {
        success: false,
        pointsAwarded: 0,
        message: `Birthday bonus is available ${BIRTHDAY_BONUS_WINDOW_DAYS} days before and after your birthday`,
      };
    }

    // Get program and customer
    const program = await LoyaltyProgram.findOne({ programId });
    if (!program || !program.birthdayBonusEnabled) {
      return {
        success: false,
        pointsAwarded: 0,
        message: 'Birthday bonus not available in this program',
      };
    }

    let customerPoints = await CustomerPoints.findOne({ customerId, programId });
    const bonusPoints = program.birthdayBonusPoints || BIRTHDAY_BONUS_POINTS;

    const session = await CustomerPoints.startSession();
    session.startTransaction();

    try {
      if (!customerPoints) {
        customerPoints = new CustomerPoints({
          customerId,
          programId,
          currentPoints: 0,
          lifetimePoints: 0,
        });
      }

      // Award bonus points
      customerPoints.currentPoints += bonusPoints;
      customerPoints.lifetimePoints += bonusPoints;
      customerPoints.birthdayBonusClaimed = true;
      customerPoints.birthdayBonusYear = currentYear;
      customerPoints.lastActivityDate = new Date();

      await customerPoints.save({ session });

      // Create transaction
      const transactionId = uuidv4();
      await PointsTransaction.create(
        [
          {
            transactionId,
            customerId,
            programId,
            type: TRANSACTION_TYPES.BIRTHDAY,
            points: bonusPoints,
            balanceAfter: customerPoints.currentPoints,
            description: `Happy Birthday! You received ${bonusPoints} bonus points`,
            status: 'ACTIVE',
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Mark as claimed in Redis
      await this.redis.setex(claimedKey, 365 * 24 * 60 * 60, 'claimed'); // Valid for a year
      await this.redis.setex(
        REDIS_KEYS.POINTS_BALANCE(customerId),
        REDIS_TTL.POINTS_CACHE,
        customerPoints.currentPoints.toString()
      );

      return {
        success: true,
        pointsAwarded: bonusPoints,
        message: `Happy Birthday! You received ${bonusPoints} bonus points!`,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if birthday bonus is available (without claiming)
   */
  async isBirthdayBonusAvailable(
    customerId: string,
    birthday: Date
  ): Promise<{ available: boolean; message: string; daysRemaining: number }> {
    const currentYear = new Date().getFullYear();

    // Check if already claimed
    const claimedKey = REDIS_KEYS.BIRTHDAY_CLAIMED(customerId, currentYear);
    const alreadyClaimed = await this.redis.get(claimedKey);

    if (alreadyClaimed === 'claimed') {
      return {
        available: false,
        message: 'Birthday bonus already claimed for this year',
        daysRemaining: 0,
      };
    }

    // Calculate days until/since birthday
    const birthdayThisYear = new Date(birthday);
    birthdayThisYear.setFullYear(currentYear);

    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - birthdayThisYear.getTime()) / (1000 * 60 * 60 * 24));

    if (Math.abs(daysDiff) <= BIRTHDAY_BONUS_WINDOW_DAYS) {
      return {
        available: true,
        message: 'Birthday bonus is available now!',
        daysRemaining: BIRTHDAY_BONUS_WINDOW_DAYS - Math.abs(daysDiff),
      };
    }

    // Calculate days until bonus window opens
    const daysUntil = BIRTHDAY_BONUS_WINDOW_DAYS - daysDiff;
    return {
      available: false,
      message: `Birthday bonus available in ${daysUntil} days`,
      daysRemaining: daysUntil,
    };
  }
}
