/**
 * Loyalty AI Agent for Retail
 * Part of SHOPFLOW - Retail AI Operating System
 */

export interface LoyaltyMember {
  id: string;
  phone: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
}

export interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  category: string;
}

export class LoyaltyAI {
  private readonly tiers = {
    bronze: { min: 0, max: 1000, discount: 1 },
    silver: { min: 1000, max: 5000, discount: 2 },
    gold: { min: 5000, max: 20000, discount: 3 },
    platinum: { min: 20000, max: Infinity, discount: 5 }
  };

  /**
   * Calculate points for purchase
   */
  async calculatePoints(amount: number, member?: LoyaltyMember): Promise<{
    points: number;
    pointsValue: number;
    tierBonus: number;
  }> {
    const basePoints = Math.floor(amount);
    const tierBonus = member ? this.tiers[member.tier].discount : 1;
    const totalPoints = basePoints * tierBonus;

    return {
      points: totalPoints,
      pointsValue: totalPoints / 100, // ₹1 per 100 points
      tierBonus
    };
  }

  /**
   * Get tier upgrade recommendations
   */
  async getTierUpgradePath(member: LoyaltyMember): Promise<{
    nextTier: string;
    pointsNeeded: number;
    estimatedPurchases: number;
  }> {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const currentIndex = tiers.indexOf(member.tier);

    if (currentIndex === tiers.length - 1) {
      return { nextTier: 'platinum', pointsNeeded: 0, estimatedPurchases: 0 };
    }

    const nextTier = tiers[currentIndex + 1];
    const pointsNeeded = this.tiers[nextTier].min - member.points;
    const avgPurchase = member.totalSpent / Math.max(1, member.points / 100);

    return {
      nextTier,
      pointsNeeded,
      estimatedPurchases: Math.ceil(pointsNeeded / (avgPurchase || 100))
    };
  }

  /**
   * Get personalized offers
   */
  async getPersonalizedOffers(member: LoyaltyMember): Promise<{
    offer: string;
    discount: number;
    expiresIn: number;
  }[]> {
    const offers = [];

    // Tier-based offers
    if (member.tier === 'bronze') {
      offers.push({ offer: 'Double points on next purchase!', discount: 5, expiresIn: 7 });
    }

    // Points expiry warning
    if (member.points > 5000) {
      offers.push({ offer: 'Use your points before they expire!', discount: 10, expiresIn: 14 });
    }

    // Personalized based on purchase history
    offers.push({ offer: 'Extra 10% off on electronics', discount: 10, expiresIn: 10 });

    return offers;
  }
}

export default LoyaltyAI;
