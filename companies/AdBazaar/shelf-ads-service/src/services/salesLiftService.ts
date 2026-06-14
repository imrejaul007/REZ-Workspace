import { SalesLift, ISalesLiftDocument } from '../models/SalesLift.js';
import { ShelfCampaign } from '../models/ShelfCampaign.js';
import { Store } from '../models/Store.js';
import { createChildLogger } from 'utils/logger.js';
import { salesLiftPercentage } from '../utils/metrics.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createChildLogger('salesLiftService');

// Validation schemas
export const CreateSalesLiftSchema = z.object({
  campaignId: z.string().min(1),
  storeId: z.string().min(1),
  shelfId: z.string().min(1),
  productSku: z.string().min(1),
  period: z.object({
    start: z.string().datetime().or(z.date()),
    end: z.string().datetime().or(z.date())
  }),
  baseline: z.object({
    sales: z.number().min(0),
    units: z.number().min(0),
    avgOrderValue: z.number().min(0),
    transactions: z.number().min(0)
  }),
  campaign: z.object({
    sales: z.number().min(0),
    units: z.number().min(0),
    avgOrderValue: z.number().min(0),
    transactions: z.number().min(0)
  }),
  attribution: z.object({
    model: z.enum(['last_touch', 'first_touch', 'linear', 'time_decay', 'data_driven']).optional().default('data_driven'),
    shelfContribution: z.number().min(0).max(100).optional().default(100),
    otherChannels: z.number().min(0).max(100).optional().default(0)
  }).optional()
});

export const UpdateSalesLiftSchema = CreateSalesLiftSchema.partial();

export const ListSalesLiftQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  campaignId: z.string().optional(),
  storeId: z.string().optional(),
  status: z.enum(['calculating', 'completed', 'insufficient_data']).optional(),
  minSalesLift: z.coerce.number().optional()
});

export type CreateSalesLiftInput = z.infer<typeof CreateSalesLiftSchema>;
export type UpdateSalesLiftInput = z.infer<typeof UpdateSalesLiftSchema>;
export type ListSalesLiftQuery = z.infer<typeof ListSalesLiftQuerySchema>;

export class SalesLiftService {
  /**
   * Create sales lift study
   */
  async createSalesLift(data: CreateSalesLiftInput): Promise<ISalesLiftDocument> {
    logger.info('Creating sales lift study', {
      campaignId: data.campaignId,
      storeId: data.storeId
    });

    const salesLift = new SalesLift({
      ...data,
      campaignId: new mongoose.Types.ObjectId(data.campaignId),
      storeId: new mongoose.Types.ObjectId(data.storeId),
      shelfId: new mongoose.Types.ObjectId(data.shelfId),
      status: 'calculating',
      confidence: {
        level: 'medium',
        score: 0,
        marginOfError: 0,
        sampleSize: 0
      },
      statisticalSignificance: {
        pValue: 1,
        tStatistic: 0,
        isSignificant: false
      }
    });

    await salesLift.save();
    logger.info('Sales lift study created', { salesLiftId: salesLift._id });

    // Calculate in background
    this.calculateSalesLift(salesLift._id.toString());

    return salesLift;
  }

  /**
   * Calculate sales lift and statistical significance
   */
  async calculateSalesLift(id: string): Promise<ISalesLiftDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const salesLift = await SalesLift.findById(id);
    if (!salesLift) {
      return null;
    }

    logger.info('Calculating sales lift', { salesLiftId: id });

    // Calculate lift percentages
    const salesLiftPercentage = salesLift.campaign.sales > 0
      ? ((salesLift.campaign.sales - salesLift.baseline.sales) / salesLift.baseline.sales) * 100
      : 0;

    const unitsLiftPercentage = salesLift.baseline.units > 0
      ? ((salesLift.campaign.units - salesLift.baseline.units) / salesLift.baseline.units) * 100
      : 0;

    const aovChange = salesLift.baseline.avgOrderValue > 0
      ? ((salesLift.campaign.avgOrderValue - salesLift.baseline.avgOrderValue) / salesLift.baseline.avgOrderValue) * 100
      : 0;

    const transactionsLiftPercentage = salesLift.baseline.transactions > 0
      ? ((salesLift.campaign.transactions - salesLift.baseline.transactions) / salesLift.baseline.transactions) * 100
      : 0;

    // Calculate sample size and confidence
    const sampleSize = salesLift.baseline.transactions + salesLift.campaign.transactions;

    // Simple statistical significance calculation (simplified version)
    // In production, use proper statistical methods
    const baselineVariance = salesLift.baseline.sales / Math.max(salesLift.baseline.transactions, 1);
    const campaignVariance = salesLift.campaign.sales / Math.max(salesLift.campaign.transactions, 1);
    const pooledVariance = (baselineVariance + campaignVariance) / 2;
    const standardError = Math.sqrt(pooledVariance / sampleSize);

    let tStatistic = 0;
    let pValue = 1;
    let isSignificant = false;

    if (standardError > 0) {
      tStatistic = Math.abs(salesLift.campaign.sales - salesLift.baseline.sales) / standardError;
      // Approximate p-value (simplified)
      pValue = tStatistic > 1.96 ? 0.05 : tStatistic > 2.58 ? 0.01 : 1;
      isSignificant = pValue < 0.05;
    }

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    let confidenceScore = 0;
    let marginOfError = 0;

    if (sampleSize >= 1000) {
      confidenceLevel = 'high';
      confidenceScore = 95;
      marginOfError = 5;
    } else if (sampleSize >= 100) {
      confidenceLevel = 'medium';
      confidenceScore = 80;
      marginOfError = 15;
    } else {
      confidenceLevel = 'low';
      confidenceScore = 50;
      marginOfError = 30;
    }

    // Update sales lift document
    const updated = await SalesLift.findByIdAndUpdate(
      id,
      {
        $set: {
          'lift.salesPercentage': salesLiftPercentage,
          'lift.unitsPercentage': unitsLiftPercentage,
          'lift.aovChange': aovChange,
          'lift.transactionsPercentage': transactionsLiftPercentage,
          'confidence.level': confidenceLevel,
          'confidence.score': confidenceScore,
          'confidence.marginOfError': marginOfError,
          'confidence.sampleSize': sampleSize,
          'statisticalSignificance.pValue': pValue,
          'statisticalSignificance.tStatistic': tStatistic,
          'statisticalSignificance.isSignificant': isSignificant,
          status: sampleSize >= 30 ? 'completed' : 'insufficient_data'
        }
      },
      { new: true }
    );

    if (updated) {
      logger.info('Sales lift calculated', {
        salesLiftId: id,
        salesLiftPercentage,
        confidenceLevel,
        isSignificant
      });
    }

    return updated;
  }

  /**
   * Get sales lift by ID
   */
  async getSalesLiftById(id: string): Promise<ISalesLiftDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return SalesLift.findById(id)
      .populate('campaignId', 'name status')
      .populate('storeId', 'name location')
      .populate('shelfId', 'name position');
  }

  /**
   * Update sales lift
   */
  async updateSalesLift(id: string, data: UpdateSalesLiftInput): Promise<ISalesLiftDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.campaignId) {
      updateData.campaignId = new mongoose.Types.ObjectId(data.campaignId);
    }
    if (data.storeId) {
      updateData.storeId = new mongoose.Types.ObjectId(data.storeId);
    }
    if (data.shelfId) {
      updateData.shelfId = new mongoose.Types.ObjectId(data.shelfId);
    }

    const salesLift = await SalesLift.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (salesLift) {
      logger.info('Sales lift updated', { salesLiftId: id });
    }

    return salesLift;
  }

  /**
   * List sales lifts
   */
  async listSalesLifts(query: ListSalesLiftQuery): Promise<{
    salesLifts: ISalesLiftDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, campaignId, storeId, status, minSalesLift } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      filter.campaignId = new mongoose.Types.ObjectId(campaignId);
    }
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      filter.storeId = new mongoose.Types.ObjectId(storeId);
    }
    if (status) filter.status = status;
    if (minSalesLift) {
      filter['lift.salesPercentage'] = { $gte: minSalesLift };
    }

    const [salesLifts, total] = await Promise.all([
      SalesLift.find(filter)
        .populate('campaignId', 'name status')
        .populate('storeId', 'name location')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      SalesLift.countDocuments(filter)
    ]);

    return {
      salesLifts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get sales lifts by campaign
   */
  async getSalesLiftsByCampaign(campaignId: string): Promise<ISalesLiftDocument[]> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return [];
    }

    return SalesLift.find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
      .populate('storeId', 'name location')
      .populate('shelfId', 'name position');
  }

  /**
   * Get aggregated sales lift for campaign
   */
  async getAggregatedSalesLift(campaignId: string): Promise<{
    totalStudies: number;
    avgSalesLift: number;
    avgUnitsLift: number;
    avgConfidence: number;
    significantStudies: number;
    stores: Array<{
      storeId: string;
      storeName: string;
      salesLift: number;
      confidence: number;
    }>;
  } | null> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return null;
    }

    const salesLifts = await SalesLift.find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      status: 'completed'
    }).populate('storeId', 'name');

    if (salesLifts.length === 0) {
      return null;
    }

    const totalStudies = salesLifts.length;
    const significantStudies = salesLifts.filter(s => s.statisticalSignificance.isSignificant).length;

    const avgSalesLift = salesLifts.reduce((sum, s) => sum + s.lift.salesPercentage, 0) / totalStudies;
    const avgUnitsLift = salesLifts.reduce((sum, s) => sum + s.lift.unitsPercentage, 0) / totalStudies;
    const avgConfidence = salesLifts.reduce((sum, s) => sum + s.confidence.score, 0) / totalStudies;

    // Update metrics
    salesLiftPercentage.set({ campaign_id: campaignId }, avgSalesLift);

    const stores = salesLifts.map(s => ({
      storeId: s.storeId._id.toString(),
      storeName: (s.storeId as unknown as { name: string }).name,
      salesLift: s.lift.salesPercentage,
      confidence: s.confidence.score
    }));

    return {
      totalStudies,
      avgSalesLift,
      avgUnitsLift,
      avgConfidence,
      significantStudies,
      stores
    };
  }

  /**
   * Get sales lift statistics
   */
  async getSalesLiftStats(): Promise<{
    total: number;
    completed: number;
    calculating: number;
    insufficientData: number;
    avgSalesLift: number;
    avgConfidence: number;
    avgSampleSize: number;
    byConfidenceLevel: Record<string, number>;
  }> {
    const [total, completed, calculating, insufficientData] = await Promise.all([
      SalesLift.countDocuments(),
      SalesLift.countDocuments({ status: 'completed' }),
      SalesLift.countDocuments({ status: 'calculating' }),
      SalesLift.countDocuments({ status: 'insufficient_data' })
    ]);

    const stats = await SalesLift.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgSalesLift: { $avg: '$lift.salesPercentage' },
          avgConfidence: { $avg: '$confidence.score' },
          avgSampleSize: { $avg: '$confidence.sampleSize' }
        }
      }
    ]);

    const byConfidenceLevel = await SalesLift.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$confidence.level', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    return {
      total,
      completed,
      calculating,
      insufficientData,
      avgSalesLift: stats[0]?.avgSalesLift || 0,
      avgConfidence: stats[0]?.avgConfidence || 0,
      avgSampleSize: stats[0]?.avgSampleSize || 0,
      byConfidenceLevel
    };
  }
}

export const salesLiftService = new SalesLiftService();
export default salesLiftService;