/**
 * Cross-Merchant Service
 */

import axios from 'axios';
import { UserProgress, IUserProgress } from '../models/UserProgress';
import { CrossMerchantBadge, BADGES } from '../models/Badge';

const WALLET_SERVICE = process.env.WALLET_SERVICE_URL || 'http://localhost:4014';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4032';

export class CrossMerchantService {

  async initialize(): Promise<void> {
    // Seed badges if not exists
    for (const badge of BADGES) {
      const exists = await CrossMerchantBadge.findOne({ badgeId: badge.badgeId });
      if (!exists) {
        await CrossMerchantBadge.create(badge);
      }
    }
    console.log('Cross-Merchant Service initialized');
  }

  async recordVisit(userId: string, merchantId: string, category: string, amount?: number): Promise<{
    progressUpdated: boolean;
    badgesEarned: string[];
  }> {
    // Get or create progress
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        categoriesVisited: {},
        totalMerchantsVisited: 0,
        totalSpend: 0,
        badgesEarned: [],
        badgeProgress: {},
      });
    }

    // Update progress
    const currentCount = progress.categoriesVisited[category] || 0;
    progress.categoriesVisited[category] = currentCount + 1;
    progress.totalMerchantsVisited += 1;
    if (amount) {
      progress.totalSpend += amount;
    }
    progress.lastActivity = new Date();
    await progress.save();

    // Check for badge eligibility
    const badgesEarned = await this.checkBadgeEligibility(userId, category);

    return {
      progressUpdated: true,
      badgesEarned,
    };
  }

  async checkBadgeEligibility(userId: string, category: string): Promise<string[]> {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) return [];

    const earnedBadges: string[] = [];
    const allBadges = await CrossMerchantBadge.find({ isActive: true });

    for (const badge of allBadges) {
      // Skip if already earned
      if (progress.badgesEarned.some(b => b.badgeId === badge.badgeId)) continue;

      let eligible = false;

      switch (badge.requirement.type) {
        case 'visits':
          if (badge.requirement.categories) {
            // Check total visits across categories
            let total = 0;
            for (const cat of badge.requirement.categories) {
              total += progress.categoriesVisited[cat] || 0;
            }
            eligible = total >= (badge.requirement.count || 0);
          } else {
            eligible = progress.totalMerchantsVisited >= (badge.requirement.count || 0);
          }
          break;

        case 'spending':
          eligible = progress.totalSpend >= (badge.requirement.amount || 0);
          break;

        case 'categories':
          if (badge.requirement.categories) {
            const visitedCategories = Object.keys(progress.categoriesVisited).filter(
              cat => progress.categoriesVisited[cat] > 0
            );
            eligible = badge.requirement.categories.every(cat => visitedCategories.includes(cat));
          }
          break;

        case 'merchants':
          eligible = progress.totalMerchantsVisited >= (badge.requirement.count || 0);
          break;
      }

      if (eligible) {
        // Award badge
        await this.awardBadge(userId, badge);
        earnedBadges.push(badge.badgeId);
      }
    }

    return earnedBadges;
  }

  async awardBadge(userId: string, badge: any): Promise<void> {
    // Add to earned badges
    await UserProgress.updateOne(
      { userId },
      { $push: { badgesEarned: { badgeId: badge.badgeId, earnedAt: new Date() } } }
    );

    // Credit wallet
    try {
      await axios.post(`${WALLET_SERVICE}/internal/credit`, {
        userId,
        amount: badge.reward.coins,
        coinType: 'badge_reward',
        source: `cross_merchant_${badge.badgeId}`,
        idempotencyKey: `badge_${userId}_${badge.badgeId}_${Date.now()}`,
      });
    } catch (error) {
      console.error('Failed to credit badge reward:', error);
    }

    // Send notification
    try {
      await axios.post(`${NOTIFICATION_SERVICE}/notifications`, {
        userId,
        type: 'badge_earned',
        title: `🎉 ${badge.name} Badge Earned!`,
        body: badge.description,
        data: { badgeId: badge.badgeId, name: badge.name },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async getProgress(userId: string): Promise<IUserProgress | null> {
    return UserProgress.findOne({ userId });
  }

  async getEarnedBadges(userId: string): Promise<any[]> {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) return [];

    const badges = await CrossMerchantBadge.find({
      badgeId: { $in: progress.badgesEarned.map(b => b.badgeId) }
    });

    return badges.map(badge => ({
      ...badge.toObject(),
      earnedAt: progress.badgesEarned.find(b => b.badgeId === badge.badgeId)?.earnedAt,
    }));
  }

  async getAvailableBadges(userId: string): Promise<any[]> {
    const progress = await UserProgress.findOne({ userId });
    const earnedIds = progress?.badgesEarned.map(b => b.badgeId) || [];

    const badges = await CrossMerchantBadge.find({
      isActive: true,
      badgeId: { $nin: earnedIds }
    });

    return badges.map(badge => ({
      ...badge.toObject(),
      progress: progress?.badgeProgress.get(badge.badgeId) || 0,
    }));
  }
}
