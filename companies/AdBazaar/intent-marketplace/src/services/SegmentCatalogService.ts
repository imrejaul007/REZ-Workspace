import { v4 as uuidv4 } from 'uuid';
import { SegmentListing, SegmentListingDocument } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../config/redis.js';
import { logger } from '../config/logger.js';
import type { SegmentFilterParams, ISegmentListing, SegmentType, SegmentStatus } from '../types.js';

const CACHE_TTL = 300; // 5 minutes

export class SegmentCatalogService {
  /**
   * List available audience segments with filtering and pagination
   */
  async listSegments(params: SegmentFilterParams): Promise<{
    segments: ISegmentListing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'qualityScore',
      sortOrder = 'desc',
      category,
      segmentType,
      status = 'active',
      minPrice,
      maxPrice,
      minUserCount,
      minQualityScore,
    } = params;

    // Build filter query
    const filter: Record<string, unknown> = { status };

    if (category) filter.category = category;
    if (segmentType) filter.segmentType = segmentType;
    if (minPrice !== undefined) filter.price = { ...((filter.price as object) || {}), $gte: minPrice };
    if (maxPrice !== undefined) filter.price = { ...((filter.price as object) || {}), $lte: maxPrice };
    if (minUserCount !== undefined) filter.userCount = { $gte: minUserCount };
    if (minQualityScore !== undefined) filter.qualityScore = { $gte: minQualityScore };

    // Build sort
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const skip = (page - 1) * limit;
    const [segments, total] = await Promise.all([
      SegmentListing.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      SegmentListing.countDocuments(filter),
    ]);

    return {
      segments: segments as ISegmentListing[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get segment by ID
   */
  async getSegmentById(segmentId: string): Promise<ISegmentListing | null> {
    // Try cache first
    const cacheKey = `segment:${segmentId}`;
    const cached = await cacheGet<ISegmentListing>(cacheKey);
    if (cached) {
      logger.debug('Segment cache hit', { segmentId });
      return cached;
    }

    const segment = await SegmentListing.findOne({ segmentId }).lean();
    if (segment) {
      await cacheSet(cacheKey, segment, CACHE_TTL);
    }

    return segment as ISegmentListing | null;
  }

  /**
   * Get segment preview (limited info for browsing)
   */
  async getSegmentPreview(segmentId: string): Promise<{
    name: string;
    description: string;
    category: string;
    segmentType: SegmentType;
    userCount: number;
    qualityScore: number;
    avgConversionRate: number;
    attributes: string[];
    demographics?: ISegmentListing['demographics'];
  } | null> {
    const segment = await SegmentListing.findOne(
      { segmentId, status: 'active' },
      {
        name: 1,
        description: 1,
        category: 1,
        segmentType: 1,
        userCount: 1,
        qualityScore: 1,
        avgConversionRate: 1,
        attributes: 1,
        demographics: 1,
      }
    ).lean();

    return segment as {
      name: string;
      description: string;
      category: string;
      segmentType: SegmentType;
      userCount: number;
      qualityScore: number;
      avgConversionRate: number;
      attributes: string[];
      demographics?: ISegmentListing['demographics'];
    } | null;
  }

  /**
   * Create a new segment listing
   */
  async createSegment(data: Omit<ISegmentListing, 'segmentId' | 'createdAt' | 'updatedAt'>): Promise<ISegmentListing> {
    const segmentId = uuidv4();

    const segment = new SegmentListing({
      ...data,
      segmentId,
    });

    await segment.save();
    logger.info('Segment created', { segmentId, name: data.name });

    return segment.toObject();
  }

  /**
   * Update segment
   */
  async updateSegment(segmentId: string, updates: Partial<ISegmentListing>): Promise<ISegmentListing | null> {
    const segment = await SegmentListing.findOneAndUpdate(
      { segmentId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (segment) {
      await cacheDelete(`segment:${segmentId}`);
      logger.info('Segment updated', { segmentId });
    }

    return segment as ISegmentListing | null;
  }

  /**
   * Get segment insights (historical performance)
   */
  async getSegmentInsights(segmentId: string): Promise<{
    segmentId: string;
    qualityScore: number;
    avgConversionRate: number;
    historicalPerformance: {
      totalPurchases: number;
      avgDelivery: number;
      avgRoi: number;
    };
 pricing: {
      currentPrice: number;
      pricingModel: string;
      priceHistory: Array<{ date: Date; price: number }>;
    };
  } | null> {
    const segment = await SegmentListing.findOne({ segmentId }).lean();
    if (!segment) return null;

    // In production, this would aggregate purchase data
    return {
      segmentId,
      qualityScore: segment.qualityScore,
      avgConversionRate: segment.avgConversionRate,
      historicalPerformance: {
        totalPurchases: Math.floor(Math.random() * 1000) + 100,
        avgDelivery: 85 + Math.random() * 10,
        avgRoi: 2.5 + Math.random() * 2,
      },
      pricing: {
        currentPrice: segment.price,
        pricingModel: segment.pricingModel,
        priceHistory: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: segment.price * 0.95 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), price: segment.price * 0.98 },
          { date: new Date(), price: segment.price },
        ],
      },
    };
  }

  /**
   * Get categories with segment counts
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const categories = await SegmentListing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return categories;
  }

  /**
   * Search segments by text
   */
  async searchSegments(query: string, limit = 20): Promise<ISegmentListing[]> {
    const segments = await SegmentListing.find(
      {
        $text: { $search: query },
        status: 'active',
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    return segments as ISegmentListing[];
  }

  /**
   * Seed default segments
   */
  async seedDefaultSegments(): Promise<void> {
    const count = await SegmentListing.countDocuments();
    if (count > 0) {
      logger.info('Segments already exist, skipping seed');
      return;
    }

    const defaultSegments = [
      {
        segmentId: uuidv4(),
        name: 'Active Buyers',
        description: 'Users actively searching and comparing products with high purchase intent',
        category: 'E-Commerce',
        segmentType: 'active_buyers',
        userCount: 2500000,
        price: 2.50,
        pricingModel: 'rtb',
        qualityScore: 95,
        avgConversionRate: 8.5,
        attributes: ['high_intent', 'purchase_ready', 'price_comparison'],
        status: 'active',
        demographics: {
          ageRanges: ['25-34', '35-44'],
          locations: ['India'],
          interests: ['Shopping', 'Technology', 'Fashion'],
        },
      },
      {
        segmentId: uuidv4(),
        name: 'Dormant Interest',
        description: 'Users who showed past interest and are likely to return with the right nudge',
        category: 'Re-Engagement',
        segmentType: 'dormant_interest',
        userCount: 5000000,
        price: 0.75,
        pricingModel: 'cpm',
        qualityScore: 72,
        avgConversionRate: 3.2,
        attributes: ['past_interest', 'churn_risk', 'loyalty'],
        status: 'active',
        demographics: {
          ageRanges: ['18-24', '25-34', '35-44'],
          locations: ['India'],
          interests: ['Entertainment', 'Travel'],
        },
      },
      {
        segmentId: uuidv4(),
        name: 'Deep Researchers',
        description: 'Users engaging deeply with content, reading reviews, and comparing options',
        category: 'Research Phase',
        segmentType: 'researchers',
        userCount: 1800000,
        price: 1.25,
        pricingModel: 'cpc',
        qualityScore: 88,
        avgConversionRate: 5.8,
        attributes: ['research_behavior', 'review_readers', 'comparison_shoppers'],
        status: 'active',
        demographics: {
          ageRanges: ['25-34', '35-44', '45-54'],
          locations: ['India'],
          interests: ['Technology', 'Automotive', 'Home'],
        },
      },
      {
        segmentId: uuidv4(),
        name: 'Near Purchase',
        description: 'High-intent users who have started checkout but not completed purchase',
        category: 'Conversion',
        segmentType: 'near_purchase',
        userCount: 850000,
        price: 4.00,
        pricingModel: 'rtb',
        qualityScore: 98,
        avgConversionRate: 15.2,
        attributes: ['checkout_started', 'cart_abandoners', 'high_intent'],
        status: 'active',
        demographics: {
          ageRanges: ['25-34', '35-44'],
          locations: ['India'],
          interests: ['Shopping', 'Electronics'],
        },
      },
    ];

    await SegmentListing.insertMany(defaultSegments);
    logger.info('Default segments seeded', { count: defaultSegments.length });
  }
}

export const segmentCatalogService = new SegmentCatalogService();
