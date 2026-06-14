import logger from './utils/logger';

/**
 * Profile Service - Extended with REE Integration
 *
 * Profile service that connects to REE for:
 * - Feature flags
 * - Tier benefits
 * - Coin economics
 * - Karma scores
 */

import { reeClient } from './reeClient';
import { cache } from './cache';
import type { UserProfile, Preferences, Address, PaymentMethod } from '../types/profile';

// Re-export original types
export type { UserProfile, Preferences, Address, PaymentMethod } from '../types/profile';

// Extended profile with REE data
export interface ExtendedUserProfile extends UserProfile {
  // Lifetime spend (required for REE calculations)
  lifetimeSpend?: number;
  // REE Data (cached)
  reeTier?: string;
  reeFeatures?: {
    canEarnRez: boolean;
    canEarnBranded: boolean;
    canEarnPromo: boolean;
    canEarnPrive: boolean;
    hasPrioritySupport: boolean;
    hasEarlyAccess: boolean;
    hasExclusiveEvents: boolean;
    maxSocialSharesPerDay: number;
    maxCashbackPercent: number;
  };
  karmaScore?: number;
}

// In-memory storage
const profiles = new Map<string, ExtendedUserProfile>();
const preferences = new Map<string, Preferences>();
const addresses = new Map<string, Address[]>();
const paymentMethods = new Map<string, PaymentMethod[]>();

export class ProfileService {
  // ============================================
  // PROFILE CRUD
  // ============================================

  getProfile(userId: string): ExtendedUserProfile | null {
    return profiles.get(userId) || null;
  }

  async getProfileExtended(userId: string): Promise<ExtendedUserProfile | null> {
    let profile = profiles.get(userId);
    if (!profile) return null;

    // Enrich with REE data
    const lifetimeSpend = profile.lifetimeSpend || 0;
    const reeData = await this.getREEData(userId, lifetimeSpend);

    return {
      ...profile,
      reeTier: reeData.tier,
      reeFeatures: reeData.features,
      karmaScore: reeData.karmaScore,
    };
  }

  createProfile(userId: string, data: Partial<UserProfile>): ExtendedUserProfile {
    const profile: ExtendedUserProfile = {
      id: userId,
      role: 'user',
      segment: 'normal',
      isVerified: false,
      isOnboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    profiles.set(userId, profile);
    return profile;
  }

  updateProfile(userId: string, data: Partial<UserProfile>): ExtendedUserProfile | null {
    const profile = profiles.get(userId);
    if (!profile) return null;

    const updated = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    profiles.set(userId, updated);
    return updated;
  }

  // ============================================
  // REE DATA
  // ============================================

  private async getREEData(
    userId: string,
    lifetimeSpend: number
  ): Promise<{
    tier: string;
    features: ExtendedUserProfile['reeFeatures'];
    karmaScore: number;
  }> {
    const cacheKey = `ree:${userId}`;
    const cached = await cache.get<{ tier: string; features: ExtendedUserProfile['reeFeatures']; karmaScore: number }>(cacheKey);
    if (cached) return cached;

    try {
      // Get features from REE
      const features = await reeClient.getUserFeatures(lifetimeSpend);

      // Get karma from REE
      const karma = await reeClient.getKarmaInfo(userId);

      const result = {
        tier: features?.currentTier || 'starter',
        features: features ? {
          canEarnRez: features.canEarnRez,
          canEarnBranded: features.canEarnBranded,
          canEarnPromo: features.canEarnPromo,
          canEarnPrive: features.canEarnPrive,
          hasPrioritySupport: features.hasPrioritySupport,
          hasEarlyAccess: features.hasEarlyAccess,
          hasExclusiveEvents: features.hasExclusiveEvents,
          maxSocialSharesPerDay: features.maxSocialSharesPerDay,
          maxCashbackPercent: features.maxCashbackPercent,
        } : undefined,
        karmaScore: karma?.karmaScore || 300,
      };

      // Cache for 5 minutes
      cache.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      console.error('[ProfileService] REE error:', error);
      return {
        tier: 'starter',
        features: {
          canEarnRez: true,
          canEarnBranded: true,
          canEarnPromo: true,
          canEarnPrive: false,
          hasPrioritySupport: false,
          hasEarlyAccess: false,
          hasExclusiveEvents: false,
          maxSocialSharesPerDay: 3,
          maxCashbackPercent: 5,
        },
        karmaScore: 300,
      };
    }
  }

  // ============================================
  // CASHBACK & COINS
  // ============================================

  /**
   * Preview cashback for transaction
   */
  async previewCashback(
    userId: string,
    amount: number
  ): Promise<{
    cashbackAmount: number;
    socialAmount: number;
    totalEarnings: number;
    coinType: string;
    tier: string;
    cashbackPercent: number;
  } | null> {
    const profile = profiles.get(userId);
    if (!profile) return null;

    const lifetimeSpend = profile.lifetimeSpend || 0;
    const result = await reeClient.previewCashback(lifetimeSpend, amount);

    if (!result) return null;

    return {
      cashbackAmount: result.cashbackAmount,
      socialAmount: result.socialAmount,
      totalEarnings: result.totalEarnings,
      coinType: result.coinType,
      tier: result.tier,
      cashbackPercent: result.cashbackPercent,
    };
  }

  /**
   * Record transaction and get rewards
   */
  async recordTransaction(
    userId: string,
    amount: number,
    merchantId: string
  ): Promise<{
    cashbackEarned: number;
    socialEarned: number;
    karmaEarned: number;
    newKarmaScore: number;
  } | null> {
    const profile = profiles.get(userId);
    if (!profile) return null;

    // Get rewards from REE
    const cashback = await this.previewCashback(userId, amount);
    const karma = await reeClient.getKarmaInfo(userId);

    if (!cashback || !karma) return null;

    // Record karma event
    await reeClient.recordKarmaEvent(userId, 'transaction.completed', {
      amount,
      merchantId,
      cashback: cashback.cashbackAmount,
    });

    // Update lifetime spend
    profile.lifetimeSpend = (profile.lifetimeSpend || 0) + amount;
    profiles.set(userId, profile);

    // Invalidate REE cache
    await cache.delete(`ree:${userId}`);

    return {
      cashbackEarned: cashback.cashbackAmount,
      socialEarned: cashback.socialAmount,
      karmaEarned: karma.karmaEarned || 0,
      newKarmaScore: karma.karmaScore || 300,
    };
  }

  // ============================================
  // SOCIAL SHARING
  // ============================================

  /**
   * Check if user can share on social media
   */
  async canSocialShare(
    userId: string,
    platform: string
  ): Promise<{
    canShare: boolean;
    reason?: string;
    remainingToday: number;
  }> {
    const profile = profiles.get(userId);
    if (!profile) {
      return { canShare: false, reason: 'Profile not found', remainingToday: 0 };
    }

    const lifetimeSpend = profile.lifetimeSpend || 0;
    return reeClient.canSocialShare(lifetimeSpend, platform);
  }

  /**
   * Record social share
   */
  async recordSocialShare(
    userId: string,
    platform: string,
    postId: string
  ): Promise<{
    success: boolean;
    socialEarned: number;
    newTier: string;
  }> {
    // Check if can share
    const canShare = await this.canSocialShare(userId, platform);
    if (!canShare.canShare) {
      return {
        success: false,
        socialEarned: 0,
        newTier: 'starter',
      };
    }

    const profile = profiles.get(userId);
    if (!profile) {
      return { success: false, socialEarned: 0, newTier: 'starter' };
    }

    // Record to REE
    await reeClient.recordKarmaEvent(userId, 'social.shared', {
      platform,
      postId,
    });

    // Invalidate cache
    await cache.delete(`ree:${userId}`);

    const newREEData = await this.getREEData(userId, profile.lifetimeSpend || 0);

    return {
      success: true,
      socialEarned: 5, // Default from REE
      newTier: newREEData.tier,
    };
  }

  // ============================================
  // PREFERENCES
  // ============================================

  getPreferences(userId: string): Preferences {
    return preferences.get(userId) || {
      language: 'en',
      currency: 'INR',
      theme: 'light',
      notifications: { push: true, sms: true, email: true, whatsapp: false },
    };
  }

  updatePreferences(userId: string, data: Partial<Preferences>): Preferences {
    const current = this.getPreferences(userId);
    const updated = { ...current, ...data };
    preferences.set(userId, updated);
    return updated;
  }

  // ============================================
  // ADDRESSES
  // ============================================

  getAddresses(userId: string): Address[] {
    return addresses.get(userId) || [];
  }

  addAddress(userId: string, address: Omit<Address, 'id'>): Address {
    const userAddresses = addresses.get(userId) || [];
    const newAddress: Address = {
      ...address,
      id: `addr_${Date.now()}`,
    };
    userAddresses.push(newAddress);
    addresses.set(userId, userAddresses);
    return newAddress;
  }

  updateAddress(userId: string, addressId: string, data: Partial<Address>): Address | null {
    const userAddresses = addresses.get(userId) || [];
    const index = userAddresses.findIndex(a => a.id === addressId);
    if (index === -1) return null;

    userAddresses[index] = { ...userAddresses[index], ...data };
    addresses.set(userId, userAddresses);
    return userAddresses[index];
  }

  removeAddress(userId: string, addressId: string): boolean {
    const userAddresses = addresses.get(userId) || [];
    const index = userAddresses.findIndex(a => a.id === addressId);
    if (index === -1) return false;

    userAddresses.splice(index, 1);
    addresses.set(userId, userAddresses);
    return true;
  }

  // ============================================
  // PAYMENT METHODS
  // ============================================

  getPaymentMethods(userId: string): PaymentMethod[] {
    return paymentMethods.get(userId) || [];
  }

  addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const userMethods = paymentMethods.get(userId) || [];
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm_${Date.now()}`,
    };
    userMethods.push(newMethod);
    paymentMethods.set(userId, userMethods);
    return newMethod;
  }

  removePaymentMethod(userId: string, methodId: string): boolean {
    const userMethods = paymentMethods.get(userId) || [];
    const index = userMethods.findIndex(m => m.id === methodId);
    if (index === -1) return false;

    userMethods.splice(index, 1);
    paymentMethods.set(userId, userMethods);
    return true;
  }

  // ============================================
  // LIFETIME SPEND & TIER
  // ============================================

  /**
   * Get user's current tier based on lifetime spend
   */
  async getUserTier(userId: string): Promise<string> {
    const profile = profiles.get(userId);
    if (!profile) return 'starter';

    const lifetimeSpend = profile.lifetimeSpend || 0;
    const tier = await reeClient.getUserTier(lifetimeSpend);
    return tier?.name || 'starter';
  }

  /**
   * Update lifetime spend (called after transaction)
   */
  async updateLifetimeSpend(userId: string, amount: number): Promise<void> {
    const profile = profiles.get(userId);
    if (!profile) return;

    const oldSpend = profile.lifetimeSpend || 0;
    const newSpend = oldSpend + amount;

    profile.lifetimeSpend = newSpend;
    profiles.set(userId, profile);

    // Check if tier upgraded
    const oldTier = await this.getUserTier(userId);
    const newTier = await reeClient.getUserTier(newSpend);

    if (newTier?.name && newTier.name !== oldTier) {
      // Tier upgraded! Emit event or notification
      logger.info(`[Profile] User ${userId} tier upgraded: ${oldTier} -> ${newTier.name}`);

      // Emit tier upgrade event
      try {
        const { EventEmitter } = await import('events');
        const profileEmitter = new EventEmitter();

        // Define event structure for tier upgrade
        interface TierUpgradeEvent {
          userId: string;
          oldTier: string;
          newTier: string;
          lifetimeSpend: number;
          timestamp: string;
        }

        const tierUpgradeEvent: TierUpgradeEvent = {
          userId,
          oldTier,
          newTier: newTier.name,
          lifetimeSpend: newSpend,
          timestamp: new Date().toISOString(),
        };

        // Emit the tier upgrade event
        profileEmitter.emit('tier.upgraded', tierUpgradeEvent);

        // Log event emission success
        logger.info('[Profile] Tier upgrade event emitted successfully', {
          userId,
          oldTier,
          newTier: newTier.name,
          eventType: 'tier.upgraded',
        });

        // Log to external event system if configured
        if (process.env.EVENT_WEBHOOK_URL) {
          try {
            const response = await fetch(process.env.EVENT_WEBHOOK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Event-Type': 'tier.upgrade',
              },
              body: JSON.stringify(tierUpgradeEvent),
            });
            if (!response.ok) {
              logger.warn('[Profile] Failed to send tier upgrade event to webhook', {
                userId,
                status: response.status,
              });
            }
          } catch (webhookError) {
            logger.error('[Profile] Error sending tier upgrade webhook', {
              userId,
              error: webhookError instanceof Error ? webhookError.message : String(webhookError),
            });
          }
        }
      } catch (error) {
        // Non-fatal: log error but don't fail the tier update
        logger.error('[Profile] Failed to emit tier upgrade event', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Invalidate REE cache
    await cache.delete(`ree:${userId}`);
  }
}

// Singleton
export const profileService = new ProfileService();
export default profileService;
