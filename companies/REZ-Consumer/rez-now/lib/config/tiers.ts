/**
 * Loyalty Tiers Configuration
 */

export interface Tier {
  name: string;
  minVisits: number;
  perks: string[];
  bonusMultiplier: number; // e.g., 1.5 = 50% bonus coins
}

export const TIERS: Record<string, Tier> = {
  bronze: {
    name: 'Bronze',
    minVisits: 0,
    perks: ['Basic rewards', 'Birthday bonus'],
    bonusMultiplier: 1.0,
  },
  silver: {
    name: 'Silver',
    minVisits: 10,
    perks: ['10% bonus coins', 'Priority support', 'Birthday bonus', 'Early access to deals'],
    bonusMultiplier: 1.1,
  },
  gold: {
    name: 'Gold',
    minVisits: 25,
    perks: ['25% bonus coins', 'Priority support', 'Birthday bonus', 'Early access to deals', 'Exclusive discounts'],
    bonusMultiplier: 1.25,
  },
  platinum: {
    name: 'Platinum',
    minVisits: 50,
    perks: ['50% bonus coins', 'Dedicated support', 'Birthday bonus', 'First access to deals', 'VIP events', 'Free delivery'],
    bonusMultiplier: 1.5,
  },
};

export function getTierFromVisits(visits: number): string {
  if (visits >= 50) return 'platinum';
  if (visits >= 25) return 'gold';
  if (visits >= 10) return 'silver';
  return 'bronze';
}

export function getTierProgress(visits: number): { currentTier: string; nextTier: string | null; progress: number } {
  const currentTier = getTierFromVisits(visits);

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) {
    return { currentTier, nextTier: null, progress: 100 };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const currentMin = TIERS[currentTier].minVisits;
  const nextMin = TIERS[nextTier].minVisits;
  const progress = Math.min(100, ((visits - currentMin) / (nextMin - currentMin)) * 100);

  return { currentTier, nextTier, progress };
}
