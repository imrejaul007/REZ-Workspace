import { Types } from 'mongoose';
import QRCode from 'qrcode';
import {
  CreatorProfile,
  CreatorCollection,
  ReferralCode,
  Referral,
} from '../models';
import { CreatorProfileDocument } from '../models/CreatorProfile';
import { CreatorCollectionDocument } from '../models/CreatorCollection';
import { CREATOR_COMMISSION_TIER, CREATOR_TIER } from '../types/referral';
import { logger } from '../utils/logger';

export interface CreateCreatorProfileOptions {
  userId: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  companyId?: string;
}

export interface CreateCollectionOptions {
  creatorId: string;
  name: string;
  description?: string;
  items?: Array<{
    type: 'product' | 'merchant' | 'service' | 'event' | 'guide';
    name: string;
    description?: string;
    imageUrl?: string;
    url?: string;
  }>;
}

export class CreatorEngine {
  /**
   * Create or get creator profile
   */
  async createProfile(options: CreateCreatorProfileOptions): Promise<CreatorProfileDocument> {
    const { userId, handle, displayName, bio, avatar, companyId = 'rez' } = options;

    // Check if profile exists
    const existing = await CreatorProfile.findOne({
      userId: new Types.ObjectId(userId),
      companyId,
    });

    if (existing) {
      // Update if needed
      if (displayName !== existing.displayName || bio !== existing.bio || avatar !== existing.avatar) {
        existing.displayName = displayName;
        existing.bio = bio;
        existing.avatar = avatar;
        await existing.save();
      }
      return existing;
    }

    // Generate unique handle
    const uniqueHandle = await CreatorProfile.generateHandle(handle, companyId);

    // Create referral code for this creator
    const referralCode = await ReferralCode.generateCode('creator');
    const referralCodeDoc = await ReferralCode.create({
      code: referralCode,
      type: 'creator',
      ownerId: new Types.ObjectId(userId),
      ownerType: 'creator',
      companyId,
      isActive: true,
      isPublic: true,
      totalReferrals: 0,
      qualifiedReferrals: 0,
      lifetimeEarnings: 0,
      trustScore: 100,
    });

    // Create profile
    const profile = await CreatorProfile.create({
      userId: new Types.ObjectId(userId),
      companyId,
      handle: uniqueHandle,
      displayName,
      bio,
      avatar,
      tier: 'starter',
      totalViews: 0,
      totalScans: 0,
      totalClicks: 0,
      totalInstalls: 0,
      totalRegistrations: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingEarnings: 0,
      approvedEarnings: 0,
      paidEarnings: 0,
      payoutEnabled: false,
      isActive: true,
    });

    logger.info('[CreatorEngine] Created creator profile:', {
      profileId: profile._id,
      handle: uniqueHandle,
    });

    return profile;
  }

  /**
   * Get creator profile by user ID
   */
  async getProfileByUser(userId: string, companyId = 'rez'): Promise<CreatorProfileDocument | null> {
    return CreatorProfile.findOne({
      userId: new Types.ObjectId(userId),
      companyId,
    });
  }

  /**
   * Get creator profile by handle
   */
  async getProfileByHandle(handle: string, companyId = 'rez'): Promise<CreatorProfileDocument | null> {
    return CreatorProfile.findOne({
      handle: handle.toLowerCase(),
      companyId,
    });
  }

  /**
   * Get creator referral code
   */
  async getCreatorCode(creatorId: string): Promise<string | null> {
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(creatorId),
      type: 'creator',
    });

    return referralCode?.code || null;
  }

  /**
   * Generate QR code for creator or collection
   */
  async generateQRCode(data: {
    creatorId: string;
    collectionSlug?: string;
    baseUrl?: string;
  }): Promise<string> {
    const { creatorId, collectionSlug, baseUrl = 'https://rez.app' } = data;

    // Build QR URL
    let qrUrl = `${baseUrl}/c/${creatorId}`;
    if (collectionSlug) {
      qrUrl = `${baseUrl}/c/${creatorId}/${collectionSlug}`;
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrDataUrl;
  }

  /**
   * Create a collection
   */
  async createCollection(options: CreateCollectionOptions): Promise<CreatorCollectionDocument> {
    const { creatorId, name, description, items = [] } = options;

    // Generate unique slug
    const slug = await CreatorCollection.generateSlug(
      new Types.ObjectId(creatorId),
      name
    );

    // Get creator's referral code
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(creatorId),
      type: 'creator',
    });

    if (!referralCode) {
      throw new Error('Creator must have a referral code');
    }

    // Create collection
    const collection = await CreatorCollection.create({
      creatorId: new Types.ObjectId(creatorId),
      name,
      slug,
      description,
      items,
      referralCodeId: referralCode._id,
      totalScans: 0,
      totalConversions: 0,
    });

    logger.info('[CreatorEngine] Created collection:', {
      collectionId: collection._id,
      slug,
    });

    return collection;
  }

  /**
   * Get collections for a creator
   */
  async getCollections(creatorId: string): Promise<CreatorCollectionDocument[]> {
    return CreatorCollection.find({
      creatorId: new Types.ObjectId(creatorId),
    }).sort({ createdAt: -1 });
  }

  /**
   * Get collection by slug
   */
  async getCollectionBySlug(
    creatorId: string,
    slug: string
  ): Promise<CreatorCollectionDocument | null> {
    return CreatorCollection.findOne({
      creatorId: new Types.ObjectId(creatorId),
      slug,
    });
  }

  /**
   * Track a QR scan
   */
  async trackScan(data: {
    collectionId?: string;
    creatorId: string;
    userId?: string;
    ip?: string;
    deviceId?: string;
    location?: { lat: number; lng: number };
  }): Promise<void> {
    const { collectionId, creatorId, userId, ip, deviceId, location } = data;

    // Update creator stats
    const creator = await CreatorProfile.findById(creatorId);
    if (creator) {
      await creator.trackConversion('scan');
    }

    // Update collection stats if applicable
    if (collectionId) {
      const collection = await CreatorCollection.findById(collectionId);
      if (collection) {
        await collection.trackScan();
      }
    }

    logger.debug('[CreatorEngine] Tracked scan:', {
      creatorId,
      collectionId,
      userId,
    });
  }

  /**
   * Track a conversion
   */
  async trackConversion(
    creatorId: string,
    type: 'install' | 'registration' | 'order',
    value = 1,
    revenue?: number
  ): Promise<void> {
    const creator = await CreatorProfile.findById(creatorId);
    if (creator) {
      await creator.trackConversion(type, value, revenue);

      // Update collection conversion if applicable
      if (type === 'registration') {
        const collection = await CreatorCollection.findOne({
          creatorId: creator._id,
        });
        if (collection) {
          await collection.trackConversion();
        }
      }
    }
  }

  /**
   * Calculate creator commission
   */
  async calculateCommission(
    creatorId: string,
    orderAmount: number
  ): Promise<{ commission: number; percentage: number; tier: string }> {
    const creator = await CreatorProfile.findById(creatorId);
    if (!creator) {
      return { commission: 0, percentage: 0, tier: 'starter' };
    }

    const tier = creator.tier;
    const percentage = CREATOR_COMMISSION_TIER[tier] || CREATOR_COMMISSION_TIER.starter;
    const commission = Math.floor((orderAmount * percentage) / 100);

    return { commission, percentage, tier };
  }

  /**
   * Get creator earnings summary
   */
  async getEarningsSummary(creatorId: string): Promise<{
    pending: number;
    approved: number;
    paid: number;
    total: number;
  }> {
    const creator = await CreatorProfile.findById(creatorId);
    if (!creator) {
      return { pending: 0, approved: 0, paid: 0, total: 0 };
    }

    return {
      pending: creator.pendingEarnings,
      approved: creator.approvedEarnings,
      paid: creator.paidEarnings,
      total: creator.pendingEarnings + creator.approvedEarnings + creator.paidEarnings,
    };
  }

  /**
   * Get creator leaderboard
   */
  async getLeaderboard(
    companyId = 'rez',
    limit = 10
  ): Promise<CreatorProfileDocument[]> {
    return CreatorProfile.find({
      companyId,
      isActive: true,
    })
      .sort({ totalRevenue: -1, totalRegistrations: -1 })
      .limit(limit);
  }

  /**
   * Get creator referral attribution
   */
  async getReferrals(creatorId: string, options?: {
    limit?: number;
    skip?: number;
  }): Promise<unknown[]> {
    const creatorReferralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(creatorId),
      type: 'creator',
    });

    if (!creatorReferralCode) {
      return [];
    }

    return Referral.find({
      referralCodeId: creatorReferralCode._id,
    })
      .populate('refereeId')
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }
}

export const creatorEngine = new CreatorEngine();
