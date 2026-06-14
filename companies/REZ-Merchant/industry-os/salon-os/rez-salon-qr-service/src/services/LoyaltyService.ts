import { v4 as uuidv4 } from 'uuid';
import { LoyaltyPoints, ILoyaltyPoints } from '../models/LoyaltyPoints';
import { CustomerTier } from '../models/CheckIn';

// Tier thresholds based on lifetime visits
const TIER_THRESHOLDS = {
  [CustomerTier.SILVER]: 0,
  [CustomerTier.GOLD]: 10,
  [CustomerTier.PLATINUM]: 25,
};

// Points configuration
const POINTS_CONFIG = {
  basePointsPerVisit: 10,
  birthdayBonus: 50,
  referralBonus: 25,
  referralReward: 100,
  pointsPerDollar: 1,
  redemptionRate: 0.01, // 100 points = $1
  maxPointsPerRedemption: 10000,
};

interface PointsCalculation {
  pointsEarned: number;
  isBirthdayBonus: boolean;
  isFirstVisitToday: boolean;
  newTier: CustomerTier;
}

export class LoyaltyService {
  private generateReferralCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }

  /**
   * Create a new loyalty account
   */
  async createLoyaltyAccount(
    customerId: string,
    customerName: string,
    customerPhone: string,
    birthday?: Date,
    referredBy?: string
  ): Promise<ILoyaltyPoints> {
    let referralCode = this.generateReferralCode();

    // Ensure referral code is unique
    let existing = await LoyaltyPoints.findOne({ referralCode });
    while (existing) {
      referralCode = this.generateReferralCode();
      existing = await LoyaltyPoints.findOne({ referralCode });
    }

    const loyalty = new LoyaltyPoints({
      loyaltyId: uuidv4(),
      customerId,
      customerName,
      customerPhone,
      totalPoints: 0,
      availablePoints: 0,
      lifetimeVisits: 0,
      tier: CustomerTier.SILVER,
      birthday: birthday || null,
      referralCode,
      referredBy: referredBy || null,
      referralCount: 0,
      tierHistory: [{ tier: CustomerTier.SILVER, updatedAt: new Date() }],
    });

    await loyalty.save();

    // If referred, reward the referrer
    if (referredBy) {
      await this.processReferralReward(referredBy, referralCode);
    }

    return loyalty;
  }

  /**
   * Calculate points for a check-in
   */
  async calculateCheckInPoints(
    loyalty: ILoyaltyPoints,
    customerId: string
  ): Promise<PointsCalculation> {
    const now = new Date();
    let pointsEarned = POINTS_CONFIG.basePointsPerVisit;
    let isBirthdayBonus = false;
    let isFirstVisitToday = true;

    // Check if first visit today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayCheckIns = await LoyaltyPoints.findOne({
      customerId,
      lastCheckIn: { $gte: todayStart, $lt: todayEnd },
    });

    if (todayCheckIns) {
      isFirstVisitToday = false;
      pointsEarned = Math.floor(pointsEarned / 2); // Half points for repeat visits
    }

    // Check birthday bonus
    if (loyalty.birthday) {
      const birthday = new Date(loyalty.birthday);
      if (
        now.getMonth() === birthday.getMonth() &&
        now.getDate() === birthday.getDate()
      ) {
        pointsEarned += POINTS_CONFIG.birthdayBonus;
        isBirthdayBonus = true;
      }
    }

    // Tier multiplier
    const tierMultiplier = this.getTierMultiplier(loyalty.tier);
    pointsEarned = Math.floor(pointsEarned * tierMultiplier);

    // Calculate new tier
    const newTier = this.calculateTier(loyalty.lifetimeVisits + 1);

    return {
      pointsEarned,
      isBirthdayBonus,
      isFirstVisitToday,
      newTier,
    };
  }

  /**
   * Add points to a loyalty account
   */
  async addPoints(customerId: string, points: number, checkInId: string): Promise<ILoyaltyPoints | null> {
    const loyalty = await LoyaltyPoints.findOne({ customerId });
    if (!loyalty) return null;

    // Update points
    loyalty.totalPoints += points;
    loyalty.availablePoints += points;
    loyalty.lifetimeVisits += 1;
    loyalty.lastCheckIn = new Date();

    // Update tier if changed
    const newTier = this.calculateTier(loyalty.lifetimeVisits);
    if (newTier !== loyalty.tier) {
      loyalty.tier = newTier;
      loyalty.tierHistory.push({ tier: newTier, updatedAt: new Date() });
    }

    await loyalty.save();
    return loyalty;
  }

  /**
   * Redeem points for a discount
   */
  async redeemPoints(
    customerId: string,
    pointsToRedeem: number
  ): Promise<{ success: boolean; discountAmount: number; message: string }> {
    const loyalty = await LoyaltyPoints.findOne({ customerId });
    if (!loyalty) {
      return { success: false, discountAmount: 0, message: 'Loyalty account not found' };
    }

    if (pointsToRedeem > loyalty.availablePoints) {
      return {
        success: false,
        discountAmount: 0,
        message: `Insufficient points. You have ${loyalty.availablePoints} points available.`,
      };
    }

    if (pointsToRedeem > POINTS_CONFIG.maxPointsPerRedemption) {
      return {
        success: false,
        discountAmount: 0,
        message: `Maximum redemption is ${POINTS_CONFIG.maxPointsPerRedemption} points.`,
      };
    }

    const discountAmount = pointsToRedeem * POINTS_CONFIG.redemptionRate;

    loyalty.availablePoints -= pointsToRedeem;
    await loyalty.save();

    return {
      success: true,
      discountAmount,
      message: `Redeemed ${pointsToRedeem} points for $${discountAmount.toFixed(2)} discount!`,
    };
  }

  /**
   * Process referral bonus for referrer
   */
  private async processReferralReward(referrerCode: string, newCustomerCode: string): Promise<void> {
    const referrer = await LoyaltyPoints.findOne({ referralCode: referrerCode });
    if (!referrer) return;

    // Add referral bonus to referrer
    referrer.totalPoints += POINTS_CONFIG.referralReward;
    referrer.availablePoints += POINTS_CONFIG.referralReward;
    referrer.referralCount += 1;
    await referrer.save();

    // Update tier if changed due to referral count
    const newTier = this.calculateTier(referrer.lifetimeVisits);
    if (newTier !== referrer.tier) {
      referrer.tier = newTier;
      referrer.tierHistory.push({ tier: newTier, updatedAt: new Date() });
      await referrer.save();
    }
  }

  /**
   * Get customer loyalty details
   */
  async getLoyaltyDetails(customerId: string): Promise<ILoyaltyPoints | null> {
    return LoyaltyPoints.findOne({ customerId });
  }

  /**
   * Update birthday for a customer
   */
  async updateBirthday(customerId: string, birthday: Date): Promise<ILoyaltyPoints | null> {
    return LoyaltyPoints.findOneAndUpdate(
      { customerId },
      { birthday },
      { new: true }
    );
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier: CustomerTier): {
    pointsMultiplier: number;
    benefits: string[];
  } {
    switch (tier) {
      case CustomerTier.PLATINUM:
        return {
          pointsMultiplier: 2,
          benefits: [
            '2x points on every visit',
            'Priority booking',
            'Free birthday treatment',
            'Exclusive member events',
            '10% off all products',
          ],
        };
      case CustomerTier.GOLD:
        return {
          pointsMultiplier: 1.5,
          benefits: [
            '1.5x points on every visit',
            'Early access to promotions',
            'Birthday bonus points',
            'Free styling consultation',
          ],
        };
      case CustomerTier.SILVER:
      default:
        return {
          pointsMultiplier: 1,
          benefits: [
            'Earn points on every visit',
            'Birthday bonus points',
            'Referral rewards',
          ],
        };
    }
  }

  private calculateTier(lifetimeVisits: number): CustomerTier {
    if (lifetimeVisits >= TIER_THRESHOLDS[CustomerTier.PLATINUM]) {
      return CustomerTier.PLATINUM;
    }
    if (lifetimeVisits >= TIER_THRESHOLDS[CustomerTier.GOLD]) {
      return CustomerTier.GOLD;
    }
    return CustomerTier.SILVER;
  }

  private getTierMultiplier(tier: CustomerTier): number {
    return this.getTierBenefits(tier).pointsMultiplier;
  }

  /**
   * Get points value in dollars
   */
  getPointsValue(points: number): number {
    return points * POINTS_CONFIG.redemptionRate;
  }

  /**
   * Get visits needed for next tier
   */
  getVisitsToNextTier(lifetimeVisits: number): number {
    if (lifetimeVisits < TIER_THRESHOLDS[CustomerTier.GOLD]) {
      return TIER_THRESHOLDS[CustomerTier.GOLD] - lifetimeVisits;
    }
    if (lifetimeVisits < TIER_THRESHOLDS[CustomerTier.PLATINUM]) {
      return TIER_THRESHOLDS[CustomerTier.PLATINUM] - lifetimeVisits;
    }
    return 0; // Already at highest tier
  }
}

export const loyaltyService = new LoyaltyService();
