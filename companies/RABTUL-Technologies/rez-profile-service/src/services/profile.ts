// Profile Service - MongoDB-backed Profile Operations
// SECURITY FIX: Replaced in-memory storage with MongoDB for production readiness

import crypto from 'crypto';
import {
  UserProfile,
  UserPreferences,
  Address,
  PaymentMethod,
  UserHiddenKB,
  IUserProfile,
  IUserPreferences,
  IAddress,
  IPaymentMethod,
  IUserHiddenKB,
} from '../models';
import { cache } from './cache';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('profile');

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Generate a secure random ID for sub-documents (addresses, payment methods).
 * SECURITY FIX: Replaced Date.now() with crypto.randomUUID() to prevent race conditions.
 */
function generateSecureId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// ─── Profile Service Class ─────────────────────────────────────────────────────

export class ProfileService {
  // ─── Profile CRUD ─────────────────────────────────────────────────────────

  /**
   * Get user profile by userId.
   * @param userId - The user ID
   * @returns User profile or null if not found
   */
  async getProfile(userId: string): Promise<IUserProfile | null> {
    try {
      // PERFORMANCE FIX: Check cache first
      const cached = await cache.get<IUserProfile>(`profile:${userId}`);
      if (cached) return cached;

      // PERFORMANCE FIX: Add projection to only return needed fields (no sensitive data)
      const profile = await UserProfile.findOne({ userId })
        .select('userId role segment firstName lastName email phone profilePicture isVerified isOnboarded preferences createdAt updatedAt')
        .lean();

      if (profile) {
        await cache.set(`profile:${userId}`, profile as IUserProfile, 300); // 5 min cache
      }
      return profile as IUserProfile | null;
    } catch (error) {
      logger.error('Failed to get profile', { userId, error });
      throw error;
    }
  }

  /**
   * Create a new user profile.
   * @param userId - The user ID
   * @param data - Initial profile data
   * @returns Created profile
   */
  async createProfile(userId: string, data: Partial<IUserProfile>): Promise<IUserProfile> {
    try {
      const profile = new UserProfile({
        userId,
        role: 'user',
        segment: 'normal',
        isVerified: false,
        isOnboarded: false,
        ...data,
      });
      await profile.save();
      logger.info('Profile created', { userId });
      return profile;
    } catch (error) {
      logger.error('Failed to create profile', { userId, error });
      throw error;
    }
  }

  /**
   * Update user profile.
   * @param userId - The user ID
   * @param data - Fields to update
   * @returns Updated profile or null if not found
   */
  async updateProfile(userId: string, data: Partial<IUserProfile>): Promise<IUserProfile | null> {
    try {
      const updateData = { ...data };
      delete (updateData as Partial<IUserProfile>)._id;
      delete (updateData as Partial<IUserProfile>).userId;
      delete (updateData as Partial<IUserProfile>).createdAt;

      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      ).lean();

      if (profile) {
        // PERFORMANCE FIX: Invalidate cache after profile update
        await cache.delete(`profile:${userId}`);
        logger.info('Profile updated', { userId, fields: Object.keys(data) });
      }
      return profile as IUserProfile | null;
    } catch (error) {
      logger.error('Failed to update profile', { userId, error });
      throw error;
    }
  }

  /**
   * Get or create a profile for a user.
   * @param userId - The user ID
   * @param data - Initial profile data (only used if creating)
   * @returns Existing or new profile
   */
  async getOrCreateProfile(userId: string, data?: Partial<IUserProfile>): Promise<IUserProfile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      return existing;
    }
    return this.createProfile(userId, data ?? {});
  }

  // ─── Preferences ─────────────────────────────────────────────────────────

  /**
   * Get user preferences.
   * @param userId - The user ID
   * @returns User preferences (creates default if not exists)
   */
  async getPreferences(userId: string): Promise<IUserPreferences> {
    try {
      let prefs = await UserPreferences.findOne({ userId }).lean();

      if (!prefs) {
        // Create default preferences
        prefs = await UserPreferences.create({
          userId,
          language: 'en',
          currency: 'INR',
          theme: 'light',
          notifications: { push: true, sms: true, email: true, whatsapp: false },
        });
        logger.info('Default preferences created', { userId });
      }

      return prefs as IUserPreferences;
    } catch (error) {
      logger.error('Failed to get preferences', { userId, error });
      throw error;
    }
  }

  /**
   * Update user preferences.
   * @param userId - The user ID
   * @param data - Fields to update
   * @returns Updated preferences
   */
  async updatePreferences(userId: string, data: Partial<IUserPreferences>): Promise<IUserPreferences> {
    try {
      const updateData = { ...data };
      delete (updateData as Partial<IUserPreferences>)._id;
      delete (updateData as Partial<IUserPreferences>).userId;

      const prefs = await UserPreferences.findOneAndUpdate(
        { userId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true, upsert: true },
      ).lean();

      logger.info('Preferences updated', { userId, fields: Object.keys(data) });
      // PERFORMANCE FIX: Invalidate profile cache when preferences change
      await cache.delete(`profile:${userId}`);
      return prefs as IUserPreferences;
    } catch (error) {
      logger.error('Failed to update preferences', { userId, error });
      throw error;
    }
  }

  // ─── Addresses ─────────────────────────────────────────────────────────

  /**
   * Get all addresses for a user.
   * @param userId - The user ID
   * @returns Array of addresses
   */
  async getAddresses(userId: string): Promise<IAddress[]> {
    try {
      const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
      return addresses as IAddress[];
    } catch (error) {
      logger.error('Failed to get addresses', { userId, error });
      throw error;
    }
  }

  /**
   * Add a new address for a user.
   * SECURITY FIX: Uses crypto.randomUUID() for addressId.
   * @param userId - The user ID
   * @param addressData - Address data
   * @returns Created address
   */
  async addAddress(userId: string, addressData: Omit<IAddress, '_id' | 'userId' | 'addressId' | 'createdAt' | 'updatedAt'>): Promise<IAddress> {
    try {
      // If this is set as default, unset other defaults
      if (addressData.isDefault) {
        await Address.updateMany({ userId }, { $set: { isDefault: false } });
      }

      const address = new Address({
        userId,
        addressId: generateSecureId('addr'),
        ...addressData,
      });
      await address.save();

      // PERFORMANCE FIX: Invalidate profile cache when address is added
      await cache.delete(`profile:${userId}`);
      logger.info('Address added', { userId, addressId: address.addressId });
      return address;
    } catch (error) {
      logger.error('Failed to add address', { userId, error });
      throw error;
    }
  }

  /**
   * Remove an address.
   * @param userId - The user ID
   * @param addressId - The address ID
   * @returns true if removed, false if not found
   */
  async removeAddress(userId: string, addressId: string): Promise<boolean> {
    try {
      const result = await Address.deleteOne({ userId, addressId });
      const removed = result.deletedCount > 0;

      if (removed) {
        // PERFORMANCE FIX: Invalidate profile cache when address is removed
        await cache.delete(`profile:${userId}`);
        logger.info('Address removed', { userId, addressId });
      }
      return removed;
    } catch (error) {
      logger.error('Failed to remove address', { userId, addressId, error });
      throw error;
    }
  }

  /**
   * Update an existing address.
   * @param userId - The user ID
   * @param addressId - The address ID
   * @param data - Fields to update
   * @returns Updated address or null if not found
   */
  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<IAddress>,
  ): Promise<IAddress | null> {
    try {
      // If setting as default, unset others first
      if (data.isDefault) {
        await Address.updateMany({ userId }, { $set: { isDefault: false } });
      }

      const updateData = { ...data };
      delete (updateData as Partial<IAddress>)._id;
      delete (updateData as Partial<IAddress>).userId;
      delete (updateData as Partial<IAddress>).addressId;

      const address = await Address.findOneAndUpdate(
        { userId, addressId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      ).lean();

      return address as IAddress | null;
    } catch (error) {
      logger.error('Failed to update address', { userId, addressId, error });
      throw error;
    }
  }

  // ─── Payment Methods ─────────────────────────────────────────────────────

  /**
   * Get all payment methods for a user.
   * @param userId - The user ID
   * @returns Array of payment methods
   */
  async getPaymentMethods(userId: string): Promise<IPaymentMethod[]> {
    try {
      const methods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
      return methods as IPaymentMethod[];
    } catch (error) {
      logger.error('Failed to get payment methods', { userId, error });
      throw error;
    }
  }

  /**
   * Add a new payment method.
   * SECURITY FIX: Uses crypto.randomUUID() for methodId.
   * @param userId - The user ID
   * @param methodData - Payment method data
   * @returns Created payment method
   */
  async addPaymentMethod(
    userId: string,
    methodData: Omit<IPaymentMethod, '_id' | 'userId' | 'methodId' | 'createdAt' | 'updatedAt'>,
  ): Promise<IPaymentMethod> {
    try {
      // If this is set as default, unset other defaults
      if (methodData.isDefault) {
        await PaymentMethod.updateMany({ userId }, { $set: { isDefault: false } });
      }

      const method = new PaymentMethod({
        userId,
        methodId: generateSecureId('pay'),
        ...methodData,
      });
      await method.save();

      // PERFORMANCE FIX: Invalidate profile cache when payment method is added
      await cache.delete(`profile:${userId}`);
      logger.info('Payment method added', { userId, methodId: method.methodId });
      return method;
    } catch (error) {
      logger.error('Failed to add payment method', { userId, error });
      throw error;
    }
  }

  /**
   * Remove a payment method.
   * @param userId - The user ID
   * @param methodId - The payment method ID
   * @returns true if removed, false if not found
   */
  async removePaymentMethod(userId: string, methodId: string): Promise<boolean> {
    try {
      const result = await PaymentMethod.deleteOne({ userId, methodId });
      const removed = result.deletedCount > 0;

      if (removed) {
        // PERFORMANCE FIX: Invalidate profile cache when payment method is removed
        await cache.delete(`profile:${userId}`);
        logger.info('Payment method removed', { userId, methodId });
      }
      return removed;
    } catch (error) {
      logger.error('Failed to remove payment method', { userId, methodId, error });
      throw error;
    }
  }

  // ─── Hidden KB (Internal AI data) ───────────────────────────────────────

  /**
   * Get user hidden KB data.
   * SECURITY NOTE: This data is for internal ML/AI use only.
   * @param userId - The user ID
   * @returns Hidden KB data or null if not found
   */
  async getHiddenKB(userId: string): Promise<IUserHiddenKB | null> {
    try {
      const hiddenKb = await UserHiddenKB.findOne({ userId }).lean();
      return hiddenKb as IUserHiddenKB | null;
    } catch (error) {
      logger.error('Failed to get hidden KB', { userId, error });
      throw error;
    }
  }

  /**
   * Update user hidden KB data.
   * SECURITY NOTE: This is internal ML data - should not be exposed to clients.
   * @param userId - The user ID
   * @param data - Fields to update
   * @returns Updated hidden KB
   */
  async updateHiddenKB(userId: string, data: Partial<IUserHiddenKB>): Promise<IUserHiddenKB> {
    try {
      const updateData = { ...data };
      delete (updateData as Partial<IUserHiddenKB>)._id;
      delete (updateData as Partial<IUserHiddenKB>).userId;

      const hiddenKb = await UserHiddenKB.findOneAndUpdate(
        { userId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true, upsert: true },
      ).lean();

      logger.info('Hidden KB updated', { userId, fields: Object.keys(data) });
      // PERFORMANCE FIX: Invalidate profile cache when hidden KB is updated
      await cache.delete(`profile:${userId}`);
      return hiddenKb as IUserHiddenKB;
    } catch (error) {
      logger.error('Failed to update hidden KB', { userId, error });
      throw error;
    }
  }

  // ─── Cached Tier ────────────────────────────────────────────────────────

  /**
   * Get cached subscription/karma tier.
   * @param userId - The user ID
   * @returns Cached tier data or null if not cached
   */
  async getCachedTier(userId: string): Promise<{ subscriptionTier: string; karmaTier: string; cachedAt: string; expiresAt: string } | null> {
    return cache.get<{ subscriptionTier: string; karmaTier: string; cachedAt: string; expiresAt: string }>(`tier:${userId}`);
  }

  /**
   * Set cached subscription/karma tier.
   * @param userId - The user ID
   * @param data - Tier data to cache
   */
  async setCachedTier(userId: string, data: { subscriptionTier: string; karmaTier: string }): Promise<void> {
    await cache.set(`tier:${userId}`, {
      ...data,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min TTL
    }, 300);
  }
}

export const profileService = new ProfileService();
export default profileService;
