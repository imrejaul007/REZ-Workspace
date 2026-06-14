/**
 * Milestones Configuration for ReZ Loyalty Program
 *
 * Defines achievement milestones that customers can unlock
 * based on their loyalty activity.
 */

export interface MilestoneReward {
  coins: number;
  discount?: string;
  badge?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'visits' | 'spending' | 'streak' | 'referrals';
  target: number;
  reward: MilestoneReward;
  tier?: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const MILESTONES: Milestone[] = [
  // Visit Milestones
  {
    id: 'first_visit',
    name: 'First Steps',
    description: 'Complete your first visit',
    icon: '👣',
    category: 'visits',
    target: 1,
    reward: { coins: 10 },
  },
  {
    id: 'five_visits',
    name: 'Regular Customer',
    description: 'Complete 5 visits',
    icon: '🔄',
    category: 'visits',
    target: 5,
    reward: { coins: 50 },
  },
  {
    id: 'ten_visits',
    name: 'Loyal Patron',
    description: 'Complete 10 visits',
    icon: '🌟',
    category: 'visits',
    target: 10,
    reward: { coins: 150, badge: 'loyal' },
  },
  {
    id: 'twenty_five_visits',
    name: 'Dedicated',
    description: 'Complete 25 visits',
    icon: '💎',
    category: 'visits',
    target: 25,
    reward: { coins: 500, discount: '5% OFF' },
  },
  {
    id: 'fifty_visits',
    name: 'Super Fan',
    description: 'Complete 50 visits',
    icon: '🏆',
    category: 'visits',
    target: 50,
    reward: { coins: 1000, discount: '10% OFF', badge: 'super_fan' },
  },
  {
    id: 'hundred_visits',
    name: 'Legend',
    description: 'Complete 100 visits',
    icon: '👑',
    category: 'visits',
    target: 100,
    reward: { coins: 2500, discount: '15% OFF', badge: 'legend' },
  },

  // Spending Milestones
  {
    id: 'spent_500',
    name: 'Getting Started',
    description: 'Spend ₹500 total',
    icon: '💰',
    category: 'spending',
    target: 500,
    reward: { coins: 25 },
  },
  {
    id: 'spent_2000',
    name: 'Regular Spender',
    description: 'Spend ₹2,000 total',
    icon: '💵',
    category: 'spending',
    target: 2000,
    reward: { coins: 100 },
  },
  {
    id: 'spent_5000',
    name: 'Big Spender',
    description: 'Spend ₹5,000 total',
    icon: '💸',
    category: 'spending',
    target: 5000,
    reward: { coins: 300, discount: '5% OFF' },
  },
  {
    id: 'spent_10000',
    name: 'VIP',
    description: 'Spend ₹10,000 total',
    icon: '⭐',
    category: 'spending',
    target: 10000,
    reward: { coins: 750, discount: '10% OFF', badge: 'vip' },
  },
  {
    id: 'spent_25000',
    name: 'Elite',
    description: 'Spend ₹25,000 total',
    icon: '💎',
    category: 'spending',
    target: 25000,
    reward: { coins: 2000, discount: '15% OFF', badge: 'elite' },
  },
  {
    id: 'spent_50000',
    name: 'Platinum Member',
    description: 'Spend ₹50,000 total',
    icon: '🔱',
    category: 'spending',
    target: 50000,
    reward: { coins: 5000, discount: '20% OFF', badge: 'platinum' },
  },

  // Streak Milestones
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day visit streak',
    icon: '🔥',
    category: 'streak',
    target: 7,
    reward: { coins: 75 },
  },
  {
    id: 'streak_14',
    name: 'Fortnight Focus',
    description: '14-day visit streak',
    icon: '⚡',
    category: 'streak',
    target: 14,
    reward: { coins: 200 },
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day visit streak',
    icon: '🌙',
    category: 'streak',
    target: 30,
    reward: { coins: 500, badge: 'monthly_master' },
  },
  {
    id: 'streak_60',
    name: 'Unstoppable',
    description: '60-day visit streak',
    icon: '🚀',
    category: 'streak',
    target: 60,
    reward: { coins: 1500, discount: '10% OFF', badge: 'unstoppable' },
  },
  {
    id: 'streak_90',
    name: 'Legendary',
    description: '90-day visit streak',
    icon: '👑',
    category: 'streak',
    target: 90,
    reward: { coins: 3000, discount: '15% OFF', badge: 'legendary' },
  },

  // Referral Milestones
  {
    id: 'referral_1',
    name: 'Word Spreader',
    description: 'Refer your first friend',
    icon: '👋',
    category: 'referrals',
    target: 1,
    reward: { coins: 100 },
  },
  {
    id: 'referral_5',
    name: 'Influencer',
    description: 'Refer 5 friends',
    icon: '🎤',
    category: 'referrals',
    target: 5,
    reward: { coins: 500, badge: 'influencer' },
  },
  {
    id: 'referral_10',
    name: 'Ambassador',
    description: 'Refer 10 friends',
    icon: '🎖️',
    category: 'referrals',
    target: 10,
    reward: { coins: 1500, discount: '10% OFF' },
  },
  {
    id: 'referral_25',
    name: 'Champion',
    description: 'Refer 25 friends',
    icon: '🏅',
    category: 'referrals',
    target: 25,
    reward: { coins: 5000, discount: '15% OFF', badge: 'champion' },
  },
];

// Badges that can be earned
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Badge[] = [
  { id: 'new_member', name: 'Welcome', icon: '🎉', description: 'Joined the loyalty program', rarity: 'common' },
  { id: 'first_purchase', name: 'First Purchase', icon: '🛍️', description: 'Made first purchase', rarity: 'common' },
  { id: 'loyal', name: 'Loyal', icon: '🌟', description: 'Completed 10 visits', rarity: 'common' },
  { id: 'super_fan', name: 'Super Fan', icon: '🏆', description: 'Completed 50 visits', rarity: 'rare' },
  { id: 'legend', name: 'Legend', icon: '👑', description: 'Completed 100 visits', rarity: 'legendary' },
  { id: 'vip', name: 'VIP', icon: '⭐', description: 'Spent ₹10,000', rarity: 'rare' },
  { id: 'elite', name: 'Elite', icon: '💎', description: 'Spent ₹25,000', rarity: 'epic' },
  { id: 'platinum', name: 'Platinum', icon: '🔱', description: 'Spent ₹50,000', rarity: 'legendary' },
  { id: 'monthly_master', name: 'Monthly Master', icon: '🌙', description: '30-day streak', rarity: 'rare' },
  { id: 'unstoppable', name: 'Unstoppable', icon: '🚀', description: '60-day streak', rarity: 'epic' },
  { id: 'legendary', name: 'Legendary', icon: '👑', description: '90-day streak', rarity: 'legendary' },
  { id: 'influencer', name: 'Influencer', icon: '🎤', description: 'Referred 5 friends', rarity: 'rare' },
  { id: 'champion', name: 'Champion', icon: '🏅', description: 'Referred 25 friends', rarity: 'epic' },
];

export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find(m => m.id === id);
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getMilestonesByCategory(category: Milestone['category']): Milestone[] {
  return MILESTONES.filter(m => m.category === category);
}

export function getMilestonesByTier(tier?: Milestone['tier']): Milestone[] {
  if (!tier || tier === 'all') return MILESTONES;
  return MILESTONES.filter(m => !m.tier || m.tier === 'all' || m.tier === tier);
}
