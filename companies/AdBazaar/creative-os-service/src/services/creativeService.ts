import { Creative, ICreative } from '../models/Creative';
import { CreativeVariation } from '../models/CreativeVariation';
import { v4 as uuidv4 } from 'uuid';
import { logger } from 'utils/logger.js';

export interface CreateCreativeDto {
  name: string;
  type: ICreative['type'];
  content: ICreative['content'];
  campaignId: string;
  advertiserId: string;
  dimensions?: { width: number; height: number };
  targetAudience?: ICreative['targetAudience'];
  tags?: string[];
  createdBy: string;
  expiresAt?: Date;
}

export interface UpdateCreativeDto {
  name?: string;
  content?: ICreative['content'];
  status?: ICreative['status'];
  dimensions?: { width: number; height: number };
  targetAudience?: ICreative['targetAudience'];
  tags?: string[];
  updatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  reviewNotes?: string;
  expiresAt?: Date;
}

export interface ListCreativesOptions {
  campaignId?: string;
  advertiserId?: string;
  status?: ICreative['status'];
  type?: ICreative['type'];
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CreativeService {
  async create(dto: CreateCreativeDto): Promise<ICreative> {
    try {
      const creative = new Creative({
        ...dto,
        status: 'draft'
      });
      await creative.save();
      logger.info(`Creative created: ${creative._id}`);
      return creative;
    } catch (error) {
      logger.error('Failed to create creative:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<ICreative | null> {
    return Creative.findById(id).exec();
  }

  async findByIdWithVariations(id: string): Promise<{ creative: ICreative | null; variations: any[] }> {
    const creative = await Creative.findById(id).exec();
    const variations = await CreativeVariation.find({ creativeId: id, status: 'running' }).exec();
    return { creative, variations };
  }

  async list(options: ListCreativesOptions): Promise<{ creatives: ICreative[]; total: number; page: number; totalPages: number }> {
    const {
      campaignId,
      advertiserId,
      status,
      type,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query: Record<string, any> = {};
    if (campaignId) query.campaignId = campaignId;
    if (advertiserId) query.advertiserId = advertiserId;
    if (status) query.status = status;
    if (type) query.type = type;
    if (tags && tags.length > 0) query.tags = { $in: tags };

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [creatives, total] = await Promise.all([
      Creative.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Creative.countDocuments(query)
    ]);

    return {
      creatives,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async update(id: string, dto: UpdateCreativeDto): Promise<ICreative | null> {
    try {
      const creative = await Creative.findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, runValidators: true }
      ).exec();
      if (creative) {
        logger.info(`Creative updated: ${creative._id}`);
      }
      return creative;
    } catch (error) {
      logger.error('Failed to update creative:', error);
      throw error;
    }
  }

  async updateMetrics(id: string, metrics: Partial<ICreative['metrics']>): Promise<ICreative | null> {
    try {
      const updateObj: Record<string, any> = {};
      if (metrics.impressions !== undefined) updateObj['metrics.impressions'] = metrics.impressions;
      if (metrics.clicks !== undefined) updateObj['metrics.clicks'] = metrics.clicks;
      if (metrics.conversions !== undefined) updateObj['metrics.conversions'] = metrics.conversions;
      if (metrics.spend !== undefined) updateObj['metrics.spend'] = metrics.spend;

      // Calculate CTR and CVR
      const creative = await Creative.findById(id).exec();
      if (creative) {
        if (metrics.impressions !== undefined || metrics.clicks !== undefined) {
          const impressions = metrics.impressions ?? creative.metrics?.impressions ?? 0;
          const clicks = metrics.clicks ?? creative.metrics?.clicks ?? 0;
          updateObj['metrics.ctr'] = impressions > 0 ? (clicks / impressions) * 100 : 0;
        }
        if (metrics.conversions !== undefined || metrics.clicks !== undefined) {
          const clicks = metrics.clicks ?? creative.metrics?.clicks ?? 0;
          const conversions = metrics.conversions ?? creative.metrics?.conversions ?? 0;
          updateObj['metrics.cvr'] = clicks > 0 ? (conversions / clicks) * 100 : 0;
        }
      }

      return Creative.findByIdAndUpdate(
        id,
        { $set: updateObj },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to update metrics:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Creative.findByIdAndDelete(id).exec();
      if (result) {
        // Also delete related variations
        await CreativeVariation.deleteMany({ creativeId: id }).exec();
        logger.info(`Creative deleted: ${id}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete creative:', error);
      throw error;
    }
  }

  async submitForReview(id: string, submittedBy: string): Promise<ICreative | null> {
    return this.update(id, {
      status: 'pending_review',
      updatedBy: submittedBy
    });
  }

  async approve(id: string, approvedBy: string, notes?: string): Promise<ICreative | null> {
    return this.update(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      reviewNotes: notes,
      updatedBy: approvedBy
    });
  }

  async reject(id: string, rejectedBy: string, notes: string): Promise<ICreative | null> {
    return this.update(id, {
      status: 'rejected',
      approvedBy: rejectedBy,
      reviewNotes: notes,
      updatedBy: rejectedBy
    });
  }

  async activate(id: string): Promise<ICreative | null> {
    return this.update(id, { status: 'active', updatedBy: 'system' });
  }

  async pause(id: string): Promise<ICreative | null> {
    return this.update(id, { status: 'paused', updatedBy: 'system' });
  }

  async archive(id: string): Promise<ICreative | null> {
    return this.update(id, { status: 'archived', updatedBy: 'system' });
  }

  async duplicate(id: string, newName: string, createdBy: string): Promise<ICreative | null> {
    const original = await this.findById(id);
    if (!original) return null;

    const dto: CreateCreativeDto = {
      name: newName,
      type: original.type,
      content: original.content,
      campaignId: original.campaignId,
      advertiserId: original.advertiserId,
      dimensions: original.dimensions,
      targetAudience: original.targetAudience,
      tags: original.tags,
      createdBy
    };

    return this.create(dto);
  }

  async getTopPerformers(advertiserId: string, limit: number = 10): Promise<ICreative[]> {
    return Creative.find({
      advertiserId,
      status: 'active',
      'metrics.impressions': { $gt: 1000 }
    })
      .sort({ 'metrics.ctr': -1 })
      .limit(limit)
      .exec();
  }

  async getAnalytics(id: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const creative = await this.findById(id);
    if (!creative) return null;

    return {
      creativeId: id,
      name: creative.name,
      status: creative.status,
      type: creative.type,
      metrics: {
        impressions: creative.metrics?.impressions || 0,
        clicks: creative.metrics?.clicks || 0,
        conversions: creative.metrics?.conversions || 0,
        ctr: creative.metrics?.ctr || 0,
        cvr: creative.metrics?.cvr || 0,
        spend: creative.metrics?.spend || 0
      },
      calculatedMetrics: {
        calculatedCTR: creative.metrics?.impressions && creative.metrics?.clicks
          ? (creative.metrics.clicks / creative.metrics.impressions) * 100
          : 0,
        calculatedCVR: creative.metrics?.clicks && creative.metrics?.conversions
          ? (creative.metrics.conversions / creative.metrics.clicks) * 100
          : 0,
        cpm: creative.metrics?.spend && creative.metrics?.impressions
          ? (creative.metrics.spend / creative.metrics.impressions) * 1000
          : 0,
        cpc: creative.metrics?.spend && creative.metrics?.clicks
          ? creative.metrics.spend / creative.metrics.clicks
          : 0,
        cpa: creative.metrics?.spend && creative.metrics?.conversions
          ? creative.metrics.spend / creative.metrics.conversions
          : 0
      },
      dateRange,
      updatedAt: creative.updatedAt
    };
  }
}

export const creativeService = new CreativeService();