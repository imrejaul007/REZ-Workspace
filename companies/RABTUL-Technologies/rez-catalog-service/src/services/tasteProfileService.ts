/**
 * Taste Profile Service
 * Business logic for managing user taste profiles and learning from orders
 */

import { TasteProfile, ITasteProfile } from '../models/TasteProfile';
import mongoose from 'mongoose';

export interface UpdateTasteProfileInput {
  spiceTolerance?: number;
  preferredCuisines?: string[];
  preferredPortionSize?: 'small' | 'medium' | 'large' | 'sharing';
  tipPercentage?: number;
  dietaryRestrictions?: string[];
}

export interface OrderFeedback {
  userId: string;
  items: Array<{
    itemId: string;
    name: string;
    category: string;
    price: number;
  }>;
  total: number;
  tip?: number;
}

export class TasteProfileService {
  /**
   * Get taste profile for a user
   */
  async getByUserId(userId: string): Promise<ITasteProfile | null> {
    return TasteProfile.findOne({ userId }).lean() as Promise<ITasteProfile | null>;
  }

  /**
   * Get or create taste profile for a user
   */
  async getOrCreate(userId: string): Promise<ITasteProfile> {
    let profile = await TasteProfile.findOne({ userId });
    if (!profile) {
      profile = await TasteProfile.create({ userId });
    }
    return profile;
  }

  /**
   * Update taste profile for a user
   */
  async update(userId: string, input: UpdateTasteProfileInput): Promise<ITasteProfile | null> {
    const updateData: Record<string, unknown> = {};

    if (input.spiceTolerance !== undefined) {
      updateData.spiceTolerance = Math.max(1, Math.min(5, input.spiceTolerance));
    }

    if (input.preferredCuisines !== undefined) {
      updateData.preferredCuisines = input.preferredCuisines;
    }

    if (input.preferredPortionSize !== undefined) {
      updateData.preferredPortionSize = input.preferredPortionSize;
    }

    if (input.tipPercentage !== undefined) {
      updateData.tipPercentage = Math.max(0, Math.min(100, input.tipPercentage));
    }

    if (input.dietaryRestrictions !== undefined) {
      updateData.dietaryRestrictions = input.dietaryRestrictions;
    }

    const profile = await TasteProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return profile;
  }

  /**
   * Learn from order feedback to improve taste profile
   */
  async learnFromOrder(feedback: OrderFeedback): Promise<ITasteProfile | null> {
    const { userId, items, total, tip } = feedback;

    const profile = await this.getOrCreate(userId);

    // Update order statistics
    const newTotalOrders = profile.totalOrders + 1;
    const newTotalSpent = profile.totalSpent + total;
    const newAvgOrderValue = Math.round(newTotalSpent / newTotalOrders);

    // Update ordering frequency based on order history
    let orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional' = 'occasional';
    if (profile.createdAt) {
      const daysSinceCreation = (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const ordersPerDay = newTotalOrders / Math.max(1, daysSinceCreation);
      if (ordersPerDay >= 1) orderingFrequency = 'daily';
      else if (ordersPerDay >= 0.14) orderingFrequency = 'weekly'; // ~1 per week
      else if (ordersPerDay >= 0.033) orderingFrequency = 'monthly'; // ~1 per month
    }

    // Update favorite categories based on most ordered
    const categoryCounts = new Map<string, number>();
    items.forEach((item) => {
      if (item.category) {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
      }
    });
    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    // Update favorite items (most ordered)
    const itemCounts = new Map<string, number>();
    items.forEach((item) => {
      itemCounts.set(item.itemId, (itemCounts.get(item.itemId) || 0) + 1);
    });
    const currentFavorites = new Set(profile.favoriteItems);
    items.forEach((item) => {
      if (itemCounts.get(item.itemId)! >= 2) {
        currentFavorites.add(item.itemId);
      }
    });
    const favoriteItems = Array.from(currentFavorites).slice(0, 20);

    // Update tip percentage if provided
    let tipPercentage = profile.tipPercentage;
    if (tip !== undefined && total > 0) {
      const orderTipPercent = Math.round((tip / total) * 100);
      // Weighted average: give more weight to recent orders
      tipPercentage = Math.round((profile.tipPercentage * 0.7) + (orderTipPercent * 0.3));
    }

    // Determine portion size based on total
    let preferredPortionSize = profile.preferredPortionSize;
    if (total > 0) {
      if (total < 20000) preferredPortionSize = 'small';
      else if (total < 50000) preferredPortionSize = 'medium';
      else if (total < 100000) preferredPortionSize = 'large';
      else preferredPortionSize = 'sharing';
    }

    // Infer cuisines from categories (simplified)
    const cuisineMap: Record<string, string> = {
      'biryani': 'Indian',
      'pizza': 'Italian',
      'burger': 'American',
      'sushi': 'Japanese',
      'tacos': 'Mexican',
      'pasta': 'Italian',
      'curry': 'Indian',
      'thali': 'Indian',
      'breads': 'Indian',
      'desserts': 'Desserts',
      'beverages': 'Beverages',
      'starters': 'Appetizers',
      'main course': 'Main Course',
    };

    const inferredCuisines = new Set(profile.preferredCuisines);
    favoriteCategories.forEach((cat) => {
      const cuisine = cuisineMap[cat.toLowerCase()];
      if (cuisine) inferredCuisines.add(cuisine);
    });

    const updated = await TasteProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          avgOrderValue: newAvgOrderValue,
          totalOrders: newTotalOrders,
          totalSpent: newTotalSpent,
          orderingFrequency,
          favoriteCategories,
          favoriteItems,
          tipPercentage,
          preferredPortionSize,
          preferredCuisines: Array.from(inferredCuisines),
          lastUpdated: new Date(),
        },
      },
      { new: true }
    );

    return updated;
  }

  /**
   * Get recommendations based on taste profile
   */
  async getRecommendations(
    userId: string,
    options: {
      limit?: number;
      excludeItems?: string[];
      dietaryFilters?: string[];
    } = {}
  ): Promise<{
    preferredCuisines: string[];
    preferredPortionSize: string;
    spiceTolerance: number;
    avgOrderValue: number;
    orderingFrequency: string;
  }> {
    const profile = await this.getOrCreate(userId);

    return {
      preferredCuisines: profile.preferredCuisines,
      preferredPortionSize: profile.preferredPortionSize,
      spiceTolerance: profile.spiceTolerance,
      avgOrderValue: profile.avgOrderValue,
      orderingFrequency: profile.orderingFrequency,
    };
  }
}

export const tasteProfileService = new TasteProfileService();
