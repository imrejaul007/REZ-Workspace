/**
 * Loyalty Milestones Configuration
 */

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target: number; // Number of visits to unlock
  reward: {
    type: 'coins' | 'badge' | 'discount';
    value: number | string;
  };
  icon: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const MILESTONES: Milestone[] = [
  {
    id: 'first_order',
    name: 'First Steps',
    description: 'Complete your first order',
    target: 1,
    reward: { type: 'coins', value: 10 },
    icon: '🎉',
  },
  {
    id: 'five_visits',
    name: 'Getting Started',
    description: 'Visit 5 times',
    target: 5,
    reward: { type: 'coins', value: 50 },
    icon: '🌟',
  },
  {
    id: 'ten_visits',
    name: 'Regular Customer',
    description: 'Visit 10 times',
    target: 10,
    reward: { type: 'discount', value: '10% off' },
    icon: '⭐',
  },
  {
    id: 'twenty_visits',
    name: 'Loyal Patron',
    description: 'Visit 20 times',
    target: 20,
    reward: { type: 'coins', value: 200 },
    icon: '🏆',
  },
  {
    id: 'fifty_visits',
    name: 'VIP Customer',
    description: 'Visit 50 times',
    target: 50,
    reward: { type: 'discount', value: '20% off' },
    icon: '💎',
  },
  {
    id: 'hundred_visits',
    name: 'Legend',
    description: 'Visit 100 times',
    target: 100,
    reward: { type: 'coins', value: 1000 },
    icon: '👑',
  },
];

export const BADGES: Badge[] = [
  {
    id: 'first_order',
    name: 'First Order',
    icon: '🎉',
    description: 'Completed your first order',
    tier: 'bronze',
  },
  {
    id: 'five_visits',
    name: 'Regular',
    icon: '⭐',
    description: 'Visited 5 times',
    tier: 'bronze',
  },
  {
    id: 'ten_visits',
    name: 'Loyal',
    icon: '🏅',
    description: 'Visited 10 times',
    tier: 'silver',
  },
  {
    id: 'fifty_visits',
    name: 'VIP',
    icon: '💎',
    description: 'Visited 50 times',
    tier: 'gold',
  },
  {
    id: 'hundred_visits',
    name: 'Legend',
    icon: '👑',
    description: 'Visited 100 times',
    tier: 'platinum',
  },
];
