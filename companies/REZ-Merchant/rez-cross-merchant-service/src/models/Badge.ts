/**
 * Cross-Merchant Badge Schema
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICrossMerchantBadge extends Document {
  badgeId: string;
  name: string;
  category: string;
  description: string;
  requirement: {
    type: 'visits' | 'spending' | 'categories' | 'merchants';
    count?: number;
    amount?: number;
    categories?: string[];
  };
  reward: {
    coins: number;
    xp?: number;
    discount?: number;
  };
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
}

const CrossMerchantBadgeSchema = new Schema<ICrossMerchantBadge>({
  badgeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  requirement: {
    type: { type: String, enum: ['visits', 'spending', 'categories', 'merchants'], required: true },
    count: Number,
    amount: Number,
    categories: [String],
  },
  reward: {
    coins: { type: Number, required: true },
    xp: Number,
    discount: Number,
  },
  icon: { type: String, default: 'badge' },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isActive: { type: Boolean, default: true },
});

// Badge definitions
export const BADGES: Partial<ICrossMerchantBadge>[] = [
  // Cafe Badges
  {
    badgeId: 'cafe_explorer',
    name: 'Cafe Explorer',
    category: 'cafe',
    description: 'Visit 5 different cafes',
    requirement: { type: 'visits', count: 5, categories: ['cafe'] },
    reward: { coins: 100, xp: 50, discount: 5 },
    icon: 'cafe',
    rarity: 'common',
  },
  {
    badgeId: 'coffee_connoisseur',
    name: 'Coffee Connoisseur',
    category: 'cafe',
    description: 'Visit 10 different cafes',
    requirement: { type: 'visits', count: 10, categories: ['cafe'] },
    reward: { coins: 250, xp: 100, discount: 10 },
    icon: 'coffee',
    rarity: 'rare',
  },

  // Food Badges
  {
    badgeId: 'foodie_elite',
    name: 'Foodie Elite',
    category: 'restaurant',
    description: 'Order from 5 different restaurants',
    requirement: { type: 'visits', count: 5, categories: ['restaurant', 'food'] },
    reward: { coins: 150, xp: 75 },
    icon: 'restaurant',
    rarity: 'common',
  },
  {
    badgeId: 'gourmet_master',
    name: 'Gourmet Master',
    category: 'restaurant',
    description: 'Order from 15 different restaurants',
    requirement: { type: 'visits', count: 15, categories: ['restaurant', 'food'] },
    reward: { coins: 500, xp: 200, discount: 15 },
    icon: 'award',
    rarity: 'epic',
  },

  // Salon Badges
  {
    badgeId: 'glow_member',
    name: 'Glow Member',
    category: 'salon',
    description: 'Visit 3 different salons',
    requirement: { type: 'visits', count: 3, categories: ['salon', 'beauty'] },
    reward: { coins: 100, xp: 50 },
    icon: 'sparkles',
    rarity: 'common',
  },

  // City-Wide Badges
  {
    badgeId: 'rez_citizen',
    name: 'ReZ Citizen',
    category: 'city',
    description: 'Visit 10 different merchants',
    requirement: { type: 'merchants', count: 10 },
    reward: { coins: 500, xp: 250, discount: 10 },
    icon: 'building',
    rarity: 'rare',
  },
  {
    badgeId: 'city_explorer',
    name: 'City Explorer',
    category: 'city',
    description: 'Visit merchants in all categories',
    requirement: { type: 'categories', categories: ['cafe', 'restaurant', 'salon', 'fitness', 'grocery'] },
    reward: { coins: 1000, xp: 500, discount: 20 },
    icon: 'map',
    rarity: 'epic',
  },
  {
    badgeId: 'loyal_local',
    name: 'Loyal Local',
    category: 'city',
    description: '30-day active across 5 merchants',
    requirement: { type: 'visits', count: 30 },
    reward: { coins: 2000, xp: 1000, discount: 25 },
    icon: 'heart',
    rarity: 'legendary',
  },
];

export const CrossMerchantBadge = mongoose.model<ICrossMerchantBadge>('CrossMerchantBadge', CrossMerchantBadgeSchema);
