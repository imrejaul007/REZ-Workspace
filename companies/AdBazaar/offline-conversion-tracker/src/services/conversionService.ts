import { v4 as uuidv4 } from 'uuid';
import { OfflineConversion, IOfflineConversion } from '../models';
import { CreateConversionInput, BatchConversionInput } from '../utils/validation';
import { logger, conversionsTotal, conversionsValue } from '../utils';
import { databaseOperationDuration } from '../utils/metrics';

export class ConversionService {
  /**
   * Create a new offline conversion
   */
  async createConversion(input: CreateConversionInput): Promise<IOfflineConversion> {
    const startTime = Date.now();

    try {
      const conversion = new OfflineConversion({
        campaignId: input.campaignId,
        userId: input.userId,
        type: input.type,
        value: input.value || 0,
        currency: input.currency || 'INR',
        date: input.date,
        source: input.source,
        medium: input.medium,
        device: input.device,
        location: input.location,
        metadata: input.metadata,
        status: 'pending'
      });

      await conversion.save();

      // Update metrics
      conversionsTotal.inc({ campaign_id: input.campaignId, type: input.type, status: 'created' });
      if (input.value) {
        conversionsValue.inc({ campaign_id: input.campaignId, currency: input.currency || 'INR' }, input.value);
      }

      logger.info('Conversion created', {
        conversionId: conversion._id,
        campaignId: input.campaignId,
        type: input.type
      });

      return conversion;
    } finally {
      databaseOperationDuration.observe({ operation: 'create', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get conversion by ID
   */
  async getConversion(id: string): Promise<IOfflineConversion | null> {
    const startTime = Date.now();

    try {
      const conversion = await OfflineConversion.findById(id);

      if (!conversion) {
        logger.warn('Conversion not found', { conversionId: id });
      }

      return conversion;
    } finally {
      databaseOperationDuration.observe({ operation: 'read', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Batch create conversions
   */
  async createBatch(input: BatchConversionInput): Promise<{
    successful: number;
    failed: number;
    conversions: IOfflineConversion[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const startTime = Date.now();

    const results = {
      successful: 0,
      failed: 0,
      conversions: [] as IOfflineConversion[],
      errors: [] as Array<{ index: number; error: string }>
    };

    try {
      const bulkOps = input.conversions.map(conv => ({
        insertOne: {
          document: {
            campaignId: input.campaignId,
            userId: conv.userId,
            type: conv.type,
            value: conv.value || 0,
            currency: conv.currency || 'INR',
            date: conv.date,
            source: conv.source,
            medium: conv.medium,
            device: conv.device,
            location: conv.location,
            metadata: conv.metadata,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }));

      const insertResult = await OfflineConversion.bulkWrite(bulkOps, { ordered: false });

      results.successful = insertResult.insertedCount;
      results.conversions = await OfflineConversion.find({
        campaignId: input.campaignId,
        createdAt: { $gte: new Date(Date.now() - 60000) }
      }).limit(input.conversions.length);

      // Update metrics
      conversionsTotal.inc({ campaign_id: input.campaignId, type: 'batch', status: 'created' }, results.successful);

      logger.info('Batch conversions created', {
        campaignId: input.campaignId,
        successful: results.successful,
        failed: results.failed
      });

      return results;
    } catch (error: any) {
      if (error.writeErrors) {
        results.failed = error.writeErrors.length;
        error.writeErrors.forEach((writeError: any, index: number) => {
          results.errors.push({
            index: writeError.index,
            error: writeError.errmsg
          });
        });
      }
      logger.error('Batch conversion error', { error: error.message });
      throw error;
    } finally {
      databaseOperationDuration.observe({ operation: 'batch_create', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get conversions by campaign
   */
  async getCampaignConversions(
    campaignId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    conversions: IOfflineConversion[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const startTime = Date.now();

    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const query: any = { campaignId };

      if (options.startDate || options.endDate) {
        query.date = {};
        if (options.startDate) query.date.$gte = options.startDate;
        if (options.endDate) query.date.$lte = options.endDate;
      }

      if (options.type) query.type = options.type;
      if (options.status) query.status = options.status;

      const [conversions, total] = await Promise.all([
        OfflineConversion.find(query).sort({ date: -1 }).skip(skip).limit(limit),
        OfflineConversion.countDocuments(query)
      ]);

      return {
        conversions,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'find', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Update conversion status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'matched' | 'confirmed' | 'rejected'
  ): Promise<IOfflineConversion | null> {
    const startTime = Date.now();

    try {
      const conversion = await OfflineConversion.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (conversion) {
        conversionsTotal.inc({ campaign_id: conversion.campaignId, type: conversion.type, status });
        logger.info('Conversion status updated', { conversionId: id, status });
      }

      return conversion;
    } finally {
      databaseOperationDuration.observe({ operation: 'update', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Delete conversion
   */
  async deleteConversion(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await OfflineConversion.findByIdAndDelete(id);

      if (result) {
        logger.info('Conversion deleted', { conversionId: id });
        return true;
      }

      return false;
    } finally {
      databaseOperationDuration.observe({ operation: 'delete', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get conversion statistics
   */
  async getStatistics(campaignId?: string): Promise<{
    total: number;
    totalValue: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    matchRate: number;
  }> {
    const startTime = Date.now();

    try {
      const matchStage: any = campaignId ? { $match: { campaignId } } : { $match: {} };

      const stats = await OfflineConversion.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalValue: { $sum: '$value' },
            byType: { $push: '$type' },
            byStatus: { $push: '$status' }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            totalValue: 1,
            byType: 1,
            byStatus: 1
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          totalValue: 0,
          byType: {},
          byStatus: {},
          matchRate: 0
        };
      }

      const result = stats[0];

      // Count by type
      const byType: Record<string, number> = {};
      result.byType.forEach((type: string) => {
        byType[type] = (byType[type] || 0) + 1;
      });

      // Count by status
      const byStatus: Record<string, number> = {};
      result.byStatus.forEach((status: string) => {
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      // Calculate match rate
      const matched = byStatus['matched'] || 0;
      const confirmed = byStatus['confirmed'] || 0;
      const matchRate = result.total > 0 ? ((matched + confirmed) / result.total) * 100 : 0;

      return {
        total: result.total,
        totalValue: result.totalValue,
        byType,
        byStatus,
        matchRate
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const conversionService = new ConversionService();