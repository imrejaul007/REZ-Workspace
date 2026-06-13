import { v4 as uuidv4 } from 'uuid';
import { ShopperProfile, ShopperPreferences, PurchaseSummary, BehaviorMetrics } from '../schemas/shopper.schema';

export class ShopperModel {
  static createProfile(data: Partial<ShopperProfile> & { email: string; firstName: string; lastName: string }): ShopperProfile {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      loyaltyTier: data.loyaltyTier || 'bronze',
      loyaltyPoints: data.loyaltyPoints || 0,
      preferences: data.preferences || this.createDefaultPreferences(),
      address: data.address,
      purchaseHistory: data.purchaseHistory || this.createDefaultPurchaseSummary(),
      behaviorMetrics: data.behaviorMetrics || this.createDefaultBehaviorMetrics(),
      createdAt: now,
      updatedAt: now,
    };
  }

  static createDefaultPreferences(): ShopperPreferences {
    return {
      categories: [],
      brands: [],
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
      },
      communicationStyle: 'standard',
    };
  }

  static createDefaultPurchaseSummary(): PurchaseSummary {
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      favoriteCategories: [],
    };
  }

  static createDefaultBehaviorMetrics(): BehaviorMetrics {
    return {
      sessionsCount: 0,
      averageSessionDuration: 0,
      conversionRate: 0,
      abandonedBaskets: 0,
      wishlistItems: 0,
      referralCount: 0,
    };
  }

  static updateProfile(profile: ShopperProfile, updates: Partial<ShopperProfile>): ShopperProfile {
    return {
      ...profile,
      ...updates,
      id: profile.id,
      email: updates.email || profile.email,
      updatedAt: new Date().toISOString(),
    };
  }

  static calculateLoyaltyTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 1000) return 'silver';
    return 'bronze';
  }

  static addLoyaltyPoints(profile: ShopperProfile, points: number): ShopperProfile {
    const newPoints = profile.loyaltyPoints + points;
    return {
      ...profile,
      loyaltyPoints: newPoints,
      loyaltyTier: this.calculateLoyaltyTier(newPoints),
      updatedAt: new Date().toISOString(),
    };
  }

  static recordPurchase(profile: ShopperProfile, orderTotal: number, categories: string[]): ShopperProfile {
    const newTotalOrders = profile.purchaseHistory.totalOrders + 1;
    const newTotalSpent = profile.purchaseHistory.totalSpent + orderTotal;
    const categoryCounts = new Map<string, number>();

    profile.purchaseHistory.favoriteCategories.forEach(cat => {
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    categories.forEach(cat => {
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });

    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    return {
      ...profile,
      purchaseHistory: {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        averageOrderValue: newTotalSpent / newTotalOrders,
        lastOrderDate: new Date().toISOString(),
        favoriteCategories,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static recordSession(profile: ShopperProfile, durationMinutes: number): ShopperProfile {
    const { sessionsCount, averageSessionDuration } = profile.behaviorMetrics;
    const newSessionsCount = sessionsCount + 1;
    const newAverageDuration = ((averageSessionDuration * sessionsCount) + durationMinutes) / newSessionsCount;

    return {
      ...profile,
      behaviorMetrics: {
        ...profile.behaviorMetrics,
        sessionsCount: newSessionsCount,
        averageSessionDuration: newAverageDuration,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static recordBasketAbandonment(profile: ShopperProfile): ShopperProfile {
    return {
      ...profile,
      behaviorMetrics: {
        ...profile.behaviorMetrics,
        abandonedBaskets: profile.behaviorMetrics.abandonedBaskets + 1,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}
