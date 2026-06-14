import { ShelfAd, IShelfAdDocument } from '../models/ShelfAd.js';
import { Shelf } from '../models/Shelf.js';
import { createChildLogger } from 'utils/logger.js';
import { adImpressionsTotal, adClicksTotal } from '../utils/metrics.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createChildLogger('adService');

// Validation schemas
export const CreateShelfAdSchema = z.object({
  shelfId: z.string().min(1),
  advertiserId: z.string().min(1),
  campaignId: z.string().min(1),
  product: z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    brand: z.string().min(1),
    category: z.string().min(1),
    imageUrl: z.string().url().optional(),
    landingUrl: z.string().url().optional()
  }),
  creative: z.object({
    type: z.enum(['image', 'video', 'digital']).optional().default('image'),
    url: z.string().url(),
    dimensions: z.object({
      width: z.number().min(1).optional().default(300),
      height: z.number().min(1).optional().default(200)
    }).optional(),
    copy: z.string().optional()
  }),
  bid: z.object({
    amount: z.number().min(0),
    currency: z.string().optional().default('INR'),
    bidType: z.enum(['cpm', 'cpc', 'fixed']).optional().default('cpm')
  }),
  targeting: z.object({
    demographics: z.object({
      ageRange: z.string().optional(),
      gender: z.string().optional(),
      income: z.string().optional()
    }).optional(),
    timeSlots: z.array(z.string()).optional(),
    days: z.array(z.string()).optional()
  }).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date())
});

export const UpdateShelfAdSchema = CreateShelfAdSchema.partial();

export const ListShelfAdsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'active', 'paused', 'completed', 'rejected']).optional(),
  shelfId: z.string().optional(),
  campaignId: z.string().optional(),
  advertiserId: z.string().optional(),
  category: z.string().optional()
});

export const RecordImpressionSchema = z.object({
  impressions: z.number().min(1).optional().default(1),
  timestamp: z.string().datetime().optional()
});

export const RecordClickSchema = z.object({
  clickType: z.enum(['view', 'interaction', 'conversion']).optional().default('view'),
  timestamp: z.string().datetime().optional()
});

export type CreateShelfAdInput = z.infer<typeof CreateShelfAdSchema>;
export type UpdateShelfAdInput = z.infer<typeof UpdateShelfAdSchema>;
export type ListShelfAdsQuery = z.infer<typeof ListShelfAdsQuerySchema>;

export class AdService {
  /**
   * Add ad to shelf
   */
  async addAdToShelf(data: CreateShelfAdInput): Promise<IShelfAdDocument | null> {
    const { shelfId, ...rest } = data;

    if (!mongoose.Types.ObjectId.isValid(shelfId)) {
      return null;
    }

    // Verify shelf exists and has capacity
    const shelf = await Shelf.findById(shelfId);
    if (!shelf) {
      logger.warn('Shelf not found', { shelfId });
      return null;
    }

    // Check capacity
    const currentAds = await ShelfAd.countDocuments({
      shelfId,
      status: { $in: ['active', 'pending'] }
    });

    if (currentAds >= shelf.capacity) {
      logger.warn('Shelf at capacity', { shelfId, capacity: shelf.capacity });
      return null;
    }

    logger.info('Adding ad to shelf', { shelfId, advertiserId: data.advertiserId });

    const ad = new ShelfAd({
      ...rest,
      shelfId: new mongoose.Types.ObjectId(shelfId),
      campaignId: new mongoose.Types.ObjectId(data.campaignId),
      status: 'pending',
      impressions: { total: 0, daily: new Map(), lastUpdated: new Date() },
      clicks: { total: 0, daily: new Map() },
      spend: { total: 0, daily: new Map() }
    });

    await ad.save();

    // Update shelf
    await Shelf.findByIdAndUpdate(shelfId, {
      $push: { ads: ad._id }
    });

    // Update shelf status if needed
    if (shelf.status === 'available') {
      await Shelf.findByIdAndUpdate(shelfId, { status: 'occupied' });
    }

    logger.info('Ad added successfully', { adId: ad._id, shelfId });

    return ad;
  }

  /**
   * Get ad by ID
   */
  async getAdById(id: string): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return ShelfAd.findById(id)
      .populate('shelfId', 'name position storeId')
      .populate('campaignId', 'name status');
  }

  /**
   * Update ad
   */
  async updateAd(id: string, data: UpdateShelfAdInput): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.campaignId) {
      updateData.campaignId = new mongoose.Types.ObjectId(data.campaignId);
    }

    const ad = await ShelfAd.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('shelfId');

    if (ad) {
      logger.info('Ad updated', { adId: id });
    }

    return ad;
  }

  /**
   * Delete ad
   */
  async deleteAd(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const ad = await ShelfAd.findById(id);
    if (!ad) {
      return false;
    }

    // Remove from shelf
    await Shelf.findByIdAndUpdate(ad.shelfId, {
      $pull: { ads: id }
    });

    await ShelfAd.findByIdAndDelete(id);
    logger.info('Ad deleted', { adId: id });

    return true;
  }

  /**
   * List ads for a shelf
   */
  async listShelfAds(shelfId: string, query: ListShelfAdsQuery): Promise<{
    ads: IShelfAdDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(shelfId)) {
      return { ads: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const { page, limit, status, campaignId, advertiserId, category } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { shelfId };

    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;
    if (advertiserId) filter.advertiserId = advertiserId;
    if (category) filter['product.category'] = category;

    const [ads, total] = await Promise.all([
      ShelfAd.find(filter)
        .populate('campaignId', 'name status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ShelfAd.countDocuments(filter)
    ]);

    return {
      ads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update ad status
   */
  async updateAdStatus(id: string, status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected'): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const ad = await ShelfAd.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (ad) {
      logger.info('Ad status updated', { adId: id, status });
    }

    return ad;
  }

  /**
   * Record impression
   */
  async recordImpression(id: string, count: number = 1): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];

    const ad = await ShelfAd.findByIdAndUpdate(
      id,
      {
        $inc: { 'impressions.total': count },
        $set: { 'impressions.lastUpdated': new Date() }
      },
      { new: true }
    );

    if (ad) {
      // Update daily impressions
      const dailyMap = ad.impressions.daily as Map<string, number>;
      dailyMap.set(today, (dailyMap.get(today) || 0) + count);

      ad.markModified('impressions.daily');
      await ad.save();

      // Update metrics
      adImpressionsTotal.inc({ campaign_id: ad.campaignId.toString(), shelf_id: ad.shelfId.toString() }, count);
    }

    return ad;
  }

  /**
   * Record click
   */
  async recordClick(id: string): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];

    const ad = await ShelfAd.findByIdAndUpdate(
      id,
      { $inc: { 'clicks.total': 1 } },
      { new: true }
    );

    if (ad) {
      // Update daily clicks
      const dailyMap = ad.clicks.daily as Map<string, number>;
      dailyMap.set(today, (dailyMap.get(today) || 0) + 1);

      ad.markModified('clicks.daily');
      await ad.save();

      // Update metrics
      adClicksTotal.inc({ campaign_id: ad.campaignId.toString(), shelf_id: ad.shelfId.toString() });
    }

    return ad;
  }

  /**
   * Record spend
   */
  async recordSpend(id: string, amount: number): Promise<IShelfAdDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];

    const ad = await ShelfAd.findByIdAndUpdate(
      id,
      { $inc: { 'spend.total': amount } },
      { new: true }
    );

    if (ad) {
      // Update daily spend
      const dailyMap = ad.spend.daily as Map<string, number>;
      dailyMap.set(today, (dailyMap.get(today) || 0) + amount);

      ad.markModified('spend.daily');
      await ad.save();
    }

    return ad;
  }

  /**
   * Get ads by advertiser
   */
  async getAdsByAdvertiser(advertiserId: string, query: ListShelfAdsQuery): Promise<{
    ads: IShelfAdDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, shelfId, campaignId, category } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { advertiserId };

    if (status) filter.status = status;
    if (shelfId) filter.shelfId = shelfId;
    if (campaignId) filter.campaignId = campaignId;
    if (category) filter['product.category'] = category;

    const [ads, total] = await Promise.all([
      ShelfAd.find(filter)
        .populate('shelfId', 'name position storeId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ShelfAd.countDocuments(filter)
    ]);

    return {
      ads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get ads by campaign
   */
  async getAdsByCampaign(campaignId: string): Promise<IShelfAdDocument[]> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return [];
    }

    return ShelfAd.find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
      .populate('shelfId', 'name position storeId');
  }
}

export const adService = new AdService();
export default adService;