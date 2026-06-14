import { CampaignPacing, ICampaignPacingDocument } from '../models';
import { PacingStrategy, IPaginationParams } from '../types';
import { pacingLogger } from '../utils/logger';
import { pacingCampaignsTotal, pacingCampaignsActive, pacingBudgetTotal } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePacingInput {
  campaignId: string;
  strategy: PacingStrategy;
  totalBudget: number;
  dailyBudget: number;
  hourlyBudget?: number;
  startDate: Date;
  endDate: Date;
  targetImpressions?: number;
  targetClicks?: number;
  targetConversions?: number;
  customSchedule?: Record<string, number>;
}

export interface UpdatePacingInput {
  strategy?: PacingStrategy;
  totalBudget?: number;
  dailyBudget?: number;
  hourlyBudget?: number;
  startDate?: Date;
  endDate?: Date;
  targetImpressions?: number;
  targetClicks?: number;
  targetConversions?: number;
  isActive?: boolean;
  customSchedule?: Record<string, number>;
}

export interface PacingListResult {
  items: ICampaignPacingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PacingService {
  /**
   * Create a new campaign pacing configuration
   */
  async createPacing(input: CreatePacingInput): Promise<ICampaignPacingDocument> {
    pacingLogger.info('Creating campaign pacing', { campaignId: input.campaignId });

    // Check if pacing already exists
    const existing = await CampaignPacing.findOne({ campaignId: input.campaignId });
    if (existing) {
      pacingLogger.warn('Pacing already exists for campaign', { campaignId: input.campaignId });
      throw new Error(`Pacing configuration already exists for campaign ${input.campaignId}`);
    }

    // Validate dates
    if (input.startDate >= input.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate budget
    if (input.dailyBudget > input.totalBudget) {
      throw new Error('Daily budget cannot exceed total budget');
    }

    const pacing = new CampaignPacing({
      ...input,
      isActive: true
    });

    await pacing.save();

    // Update metrics
    pacingCampaignsTotal.inc({ pacing_strategy: input.strategy });
    pacingCampaignsActive.inc({ pacing_strategy: input.strategy });
    pacingBudgetTotal.add(input.totalBudget);

    pacingLogger.info('Campaign pacing created successfully', {
      campaignId: input.campaignId,
      strategy: input.strategy,
      totalBudget: input.totalBudget
    });

    return pacing;
  }

  /**
   * Get pacing configuration by campaign ID
   */
  async getPacingByCampaignId(campaignId: string): Promise<ICampaignPacingDocument | null> {
    pacingLogger.debug('Fetching pacing for campaign', { campaignId });

    const pacing = await CampaignPacing.findOne({ campaignId });

    if (!pacing) {
      pacingLogger.debug('No pacing found for campaign', { campaignId });
    }

    return pacing;
  }

  /**
   * Get all pacing configurations with pagination
   */
  async listPacing(params: IPaginationParams): Promise<PacingListResult> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CampaignPacing.find()
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampaignPacing.countDocuments()
    ]);

    return {
      items: items as ICampaignPacingDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update pacing configuration
   */
  async updatePacing(campaignId: string, input: UpdatePacingInput): Promise<ICampaignPacingDocument | null> {
    pacingLogger.info('Updating campaign pacing', { campaignId, updates: input });

    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      pacingLogger.warn('Pacing not found for update', { campaignId });
      return null;
    }

    // Validate dates if provided
    if (input.startDate && input.endDate && input.startDate >= input.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate budget if provided
    if (input.dailyBudget && input.totalBudget && input.dailyBudget > input.totalBudget) {
      throw new Error('Daily budget cannot exceed total budget');
    }

    // Update fields
    Object.keys(input).forEach((key) => {
      const k = key as keyof UpdatePacingInput;
      if (input[k] !== undefined) {
        (pacing as any)[k] = input[k];
      }
    });

    await pacing.save();

    pacingLogger.info('Campaign pacing updated successfully', { campaignId });

    return pacing;
  }

  /**
   * Delete pacing configuration
   */
  async deletePacing(campaignId: string): Promise<boolean> {
    pacingLogger.info('Deleting campaign pacing', { campaignId });

    const result = await CampaignPacing.deleteOne({ campaignId });

    if (result.deletedCount > 0) {
      pacingCampaignsActive.dec();
      pacingLogger.info('Campaign pacing deleted successfully', { campaignId });
      return true;
    }

    pacingLogger.warn('No pacing found to delete', { campaignId });
    return false;
  }

  /**
   * Get active campaigns with pacing
   */
  async getActiveCampaigns(): Promise<ICampaignPacingDocument[]> {
    return CampaignPacing.findActiveCampaigns();
  }

  /**
   * Pause pacing for a campaign
   */
  async pausePacing(campaignId: string): Promise<ICampaignPacingDocument | null> {
    pacingLogger.info('Pausing campaign pacing', { campaignId });

    const pacing = await CampaignPacing.findOneAndUpdate(
      { campaignId },
      { isActive: false },
      { new: true }
    );

    if (pacing) {
      pacingCampaignsActive.dec();
      pacingLogger.info('Campaign pacing paused', { campaignId });
    }

    return pacing;
  }

  /**
   * Resume pacing for a campaign
   */
  async resumePacing(campaignId: string): Promise<ICampaignPacingDocument | null> {
    pacingLogger.info('Resuming campaign pacing', { campaignId });

    const pacing = await CampaignPacing.findOneAndUpdate(
      { campaignId },
      { isActive: true },
      { new: true }
    );

    if (pacing) {
      pacingCampaignsActive.inc();
      pacingLogger.info('Campaign pacing resumed', { campaignId });
    }

    return pacing;
  }

  /**
   * Get pacing statistics
   */
  async getPacingStats(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    byStrategy: Record<string, number>;
  }> {
    const [totalCampaigns, activeCampaigns, stats] = await Promise.all([
      CampaignPacing.countDocuments(),
      CampaignPacing.findActiveCampaigns().then((docs) => docs.length),
      CampaignPacing.aggregate([
        {
          $group: {
            _id: '$strategy',
            count: { $sum: 1 },
            totalBudget: { $sum: '$totalBudget' }
          }
        }
      ])
    ]);

    const totalBudget = stats.reduce((sum, s) => sum + s.totalBudget, 0);
    const byStrategy: Record<string, number> = {};
    stats.forEach((s) => {
      byStrategy[s._id] = s.count;
    });

    return {
      totalCampaigns,
      activeCampaigns,
      totalBudget,
      byStrategy
    };
  }

  /**
   * Get pacing by strategy type
   */
  async getPacingByStrategy(strategy: PacingStrategy): Promise<ICampaignPacingDocument[]> {
    return CampaignPacing.find({ strategy, isActive: true });
  }

  /**
   * Bulk create pacing configurations
   */
  async bulkCreatePacing(inputs: CreatePacingInput[]): Promise<{
    created: number;
    failed: number;
    errors: Array<{ campaignId: string; error: string }>;
  }> {
    pacingLogger.info('Bulk creating pacing configurations', { count: inputs.length });

    const errors: Array<{ campaignId: string; error: string }> = [];
    const validInputs: CreatePacingInput[] = [];

    // Validate inputs
    for (const input of inputs) {
      if (input.startDate >= input.endDate) {
        errors.push({ campaignId: input.campaignId, error: 'Invalid date range' });
        continue;
      }
      if (input.dailyBudget > input.totalBudget) {
        errors.push({ campaignId: input.campaignId, error: 'Daily budget exceeds total' });
        continue;
      }
      validInputs.push(input);
    }

    // Check for existing
    const existingIds = (
      await CampaignPacing.find({
        campaignId: { $in: validInputs.map((i) => i.campaignId) }
      }).select('campaignId')
    ).map((d) => d.campaignId);

    const newInputs = validInputs.filter((i) => !existingIds.includes(i.campaignId));

    // Insert in batches
    const batchSize = 100;
    let created = 0;

    for (let i = 0; i < newInputs.length; i += batchSize) {
      const batch = newInputs.slice(i, i + batchSize);
      const pacings = batch.map((input) => new CampaignPacing({ ...input, isActive: true }));

      try {
        await CampaignPacing.insertMany(pacings, { ordered: false });
        created += batch.length;
      } catch (error: any) {
        pacingLogger.error('Batch insert error', { error: error.message });
        created += batch.length - (error.writeErrors?.length || 0);
      }
    }

    pacingLogger.info('Bulk create completed', { created, failed: inputs.length - created });

    return {
      created,
      failed: inputs.length - created + errors.length,
      errors
    };
  }
}

export const pacingService = new PacingService();