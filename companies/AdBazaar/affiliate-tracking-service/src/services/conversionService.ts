import { v4 as uuidv4 } from 'uuid';
import { Conversion, IConversion, ConversionStatus, ConversionType } from '../models/Conversion';
import { Affiliate } from '../models/Affiliate';
import logger from '../utils/logger';

export interface CreateConversionInput {
  affiliateId: string;
  campaignId: string;
  clickId: string;
  type: ConversionType;
  revenue: number;
  customerData?: {
    customerId?: string;
    email?: string;
    phone?: string;
  };
  conversionData?: {
    productId?: string;
    orderValue?: number;
    quantity?: number;
  };
  attribution?: {
    source: string;
    medium: string;
    campaign?: string;
    landingUrl?: string;
  };
  timestamps?: {
    click?: Date;
    conversion?: Date;
  };
}

class ConversionService {
  /**
   * Create a new conversion
   */
  async createConversion(input: CreateConversionInput): Promise<IConversion> {
    const conversionId = `conv-${uuidv4().slice(0, 12)}`;

    // Get affiliate for commission calculation
    const affiliate = await Affiliate.findOne({ affiliateId: input.affiliateId });
    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    // Calculate commission based on type
    let commission = 0;
    if (input.type === 'cpa') {
      commission = affiliate.commissionStructure.cpa;
    } else if (input.type === 'rev_share') {
      commission = (input.revenue * affiliate.commissionStructure.revShare) / 100;
    } else {
      // hybrid
      commission =
        affiliate.commissionStructure.cpa +
        (input.revenue * affiliate.commissionStructure.revShare) / 100;
    }

    const conversion = new Conversion({
      conversionId,
      affiliateId: input.affiliateId,
      campaignId: input.campaignId,
      clickId: input.clickId,
      type: input.type,
      status: 'pending',
      revenue: input.revenue,
      commission,
      currency: 'INR',
      customerData: input.customerData || {},
      conversionData: input.conversionData || {},
      attribution: input.attribution || {
        source: 'direct',
        medium: 'affiliate',
      },
      timestamps: {
        click: input.timestamps?.click || new Date(),
        conversion: input.timestamps?.conversion || new Date(),
        approval: null as unknown as Date,
      },
    });

    await conversion.save();

    // Update affiliate stats
    await Affiliate.findOneAndUpdate(
      { affiliateId: input.affiliateId },
      {
        $inc: {
          'stats.totalConversions': 1,
          'stats.pendingCommission': commission,
          'stats.totalCommission': commission,
        },
      }
    );

    logger.info('Conversion created', {
      conversionId,
      affiliateId: input.affiliateId,
      commission,
    });

    return conversion;
  }

  /**
   * Get conversion by ID
   */
  async getConversion(conversionId: string): Promise<IConversion | null> {
    return Conversion.findOne({ conversionId });
  }

  /**
   * Get conversions by affiliate
   */
  async getConversionsByAffiliate(
    affiliateId: string,
    options: {
      page?: number;
      limit?: number;
      status?: ConversionStatus;
    } = {}
  ): Promise<{ conversions: IConversion[]; total: number }> {
    const { page = 1, limit = 50, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { affiliateId };
    if (status) query.status = status;

    const [conversions, total] = await Promise.all([
      Conversion.find(query).skip(skip).limit(limit).sort({ 'timestamps.conversion': -1 }),
      Conversion.countDocuments(query),
    ]);

    return { conversions, total };
  }

  /**
   * Get conversions by campaign
   */
  async getConversionsByCampaign(
    campaignId: string,
    options: {
      page?: number;
      limit?: number;
      status?: ConversionStatus;
    } = {}
  ): Promise<{ conversions: IConversion[]; total: number }> {
    const { page = 1, limit = 50, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { campaignId };
    if (status) query.status = status;

    const [conversions, total] = await Promise.all([
      Conversion.find(query).skip(skip).limit(limit).sort({ 'timestamps.conversion': -1 }),
      Conversion.countDocuments(query),
    ]);

    return { conversions, total };
  }

  /**
   * Update conversion status
   */
  async updateConversionStatus(
    conversionId: string,
    status: ConversionStatus,
    notes?: string
  ): Promise<IConversion | null> {
    const conversion = await Conversion.findOneAndUpdate(
      { conversionId },
      {
        $set: {
          status,
          ...(notes ? { notes } : {}),
          ...(status === 'approved' ? { 'timestamps.approval': new Date() } : {}),
        },
      },
      { new: true }
    );

    if (conversion) {
      logger.info('Conversion status updated', { conversionId, status });

      // Update affiliate stats
      if (status === 'approved' || status === 'rejected') {
        const affiliate = await Affiliate.findOne({ affiliateId: conversion.affiliateId });
        if (affiliate) {
          const update: Record<string, number> = {};
          if (status === 'approved') {
            update['stats.pendingCommission'] = -conversion.commission;
          } else {
            update['stats.totalConversions'] = -1;
            update['stats.totalCommission'] = -conversion.commission;
            update['stats.pendingCommission'] = -conversion.commission;
          }
          await Affiliate.findOneAndUpdate(
            { affiliateId: conversion.affiliateId },
            { $inc: update }
          );
        }
      }
    }

    return conversion;
  }

  /**
   * Bulk approve conversions
   */
  async bulkApproveConversions(conversionIds: string[]): Promise<number> {
    const result = await Conversion.updateMany(
      { conversionId: { $in: conversionIds }, status: 'pending' },
      {
        $set: {
          status: 'approved',
          'timestamps.approval': new Date(),
        },
      }
    );

    logger.info('Bulk conversions approved', { count: result.modifiedCount });

    return result.modifiedCount;
  }

  /**
   * Get conversion statistics
   */
  async getConversionStats(affiliateId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    totalRevenue: number;
    totalCommission: number;
  }> {
    const match: Record<string, unknown> = {};
    if (affiliateId) match.affiliateId = affiliateId;

    const stats = await Conversion.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$revenue' },
          commission: { $sum: '$commission' },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };

    for (const s of stats) {
      result.total += s.count;
      result[s._id as keyof typeof result] = s.count;
      result.totalRevenue += s.revenue;
      result.totalCommission += s.commission;
    }

    return result;
  }
}

export const conversionService = new ConversionService();
export default conversionService;