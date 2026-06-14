import { Deal, DealDocument, Client } from '../models/index.js';
import { ActivityModel } from '../models/Activity.js';
import { Activity } from '../types/index.js';
import { generateId } from '../utils/index.js';
import {
  createDealSchema,
  updateDealSchema,
  moveStageSchema,
  addActivitySchema,
  dealFiltersSchema,
} from '../utils/validators.js';
import { clientService } from './clientService.js';
import { config } from '../config/index.js';

export class DealService {
  /**
   * Create a new deal
   */
  async create(data: unknown, tenantId: string): Promise<DealDocument> {
    const validated = createDealSchema.parse(data);

    const stageProbabilities: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      won: 100,
      lost: 0,
    };

    const deal = new Deal({
      ...validated,
      tenantId,
      dealId: `DEAL-${Date.now()}`,
      stage: validated.stage || 'lead',
      probability: validated.probability || stageProbabilities[validated.stage || 'lead'],
      activities: [],
    });

    await deal.save();

    // Update client deal value
    await clientService.updateDealValue(tenantId, validated.clientId);

    // Log activity
    await this.logActivity(tenantId, 'created', 'deal', deal._id.toString(), validated.owner, {
      title: deal.title,
      value: deal.value,
    });

    return deal;
  }

  /**
   * Get all deals with filters and pagination
   */
  async findAll(
    tenantId: string,
    filters: Record<string, unknown>
  ): Promise<{ deals: DealDocument[]; total: number; page: number; limit: number }> {
    const parsed = dealFiltersSchema.parse(filters);
    const { page, limit, ...query } = parsed;

    const where: Record<string, unknown> = { tenantId };

    if (query.stage) where.stage = query.stage;
    if (query.owner) where.owner = query.owner;
    if (query.clientId) where.clientId = query.clientId;

    if (query.minValue !== undefined || query.maxValue !== undefined) {
      where.value = {};
      if (query.minValue !== undefined) (where.value as Record<string, number>).$gte = query.minValue;
      if (query.maxValue !== undefined) (where.value as Record<string, number>).$lte = query.maxValue;
    }

    if (query.expectedCloseFrom || query.expectedCloseTo) {
      where.expectedClose = {};
      if (query.expectedCloseFrom) (where.expectedClose as Record<string, Date>).$gte = query.expectedCloseFrom;
      if (query.expectedCloseTo) (where.expectedClose as Record<string, Date>).$lte = query.expectedCloseTo;
    }

    if (query.search) {
      where.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { dealId: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [deals, total] = await Promise.all([
      Deal.find(where)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as DealDocument[],
      Deal.countDocuments(where),
    ]);

    return { deals, total, page, limit };
  }

  /**
   * Get a single deal by ID
   */
  async findById(tenantId: string, dealId: string): Promise<DealDocument | null> {
    return Deal.findOne({ tenantId, _id: dealId }).lean() as Promise<DealDocument | null>;
  }

  /**
   * Get a deal by dealId
   */
  async findByDealId(tenantId: string, dealId: string): Promise<DealDocument | null> {
    return Deal.findOne({ tenantId, dealId }).lean() as Promise<DealDocument | null>;
  }

  /**
   * Update a deal
   */
  async update(tenantId: string, dealId: string, data: unknown): Promise<DealDocument | null> {
    const validated = updateDealSchema.parse(data);

    const deal = await Deal.findOneAndUpdate(
      { tenantId, _id: dealId },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean() as DealDocument | null;

    if (deal) {
      await this.logActivity(tenantId, 'updated', 'deal', dealId, deal.owner, {
        updatedFields: Object.keys(validated),
      });

      // Update client deal value if value changed
      if (validated.value !== undefined) {
        await clientService.updateDealValue(tenantId, deal.clientId);
      }
    }

    return deal;
  }

  /**
   * Move deal to a new stage
   */
  async moveStage(
    tenantId: string,
    dealId: string,
    data: unknown,
    performedBy: string
  ): Promise<DealDocument | null> {
    const validated = moveStageSchema.parse(data);

    const stageProbabilities: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      won: 100,
      lost: 0,
    };

    const updateData: Record<string, unknown> = {
      stage: validated.stage,
      probability: stageProbabilities[validated.stage],
    };

    if (validated.stage === 'won' || validated.stage === 'lost') {
      updateData.actualClose = new Date();
    }

    if (validated.stage === 'lost' && validated.lossReason) {
      updateData.lossReason = validated.lossReason;
    }

    const deal = await Deal.findOneAndUpdate(
      { tenantId, _id: dealId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean() as DealDocument | null;

    if (deal) {
      // Log stage change activity
      const activity: Activity = {
        activityId: `ACT-${generateId().substring(0, 8).toUpperCase()}`,
        type: 'stage_change',
        title: `Moved to ${validated.stage}`,
        description: validated.lossReason || undefined,
        date: new Date(),
        performedBy,
        metadata: { newStage: validated.stage },
      };

      await Deal.updateOne({ _id: dealId }, { $push: { activities: activity } });

      await this.logActivity(tenantId, 'stage_change', 'deal', dealId, performedBy, {
        newStage: validated.stage,
        lossReason: validated.lossReason,
      });

      // Update client deal value
      await clientService.updateDealValue(tenantId, deal.clientId);

      // Trigger external integrations
      if (validated.stage === 'won') {
        await this.handleDealWon(tenantId, deal);
      }
    }

    return deal;
  }

  /**
   * Add an activity to a deal
   */
  async addActivity(
    tenantId: string,
    dealId: string,
    data: unknown,
    performedBy: string
  ): Promise<DealDocument | null> {
    const validated = addActivitySchema.parse(data);

    const activity: Activity = {
      activityId: `ACT-${generateId().substring(0, 8).toUpperCase()}`,
      ...validated,
      performedBy,
    };

    const deal = await Deal.findOneAndUpdate(
      { tenantId, _id: dealId },
      { $push: { activities: activity } },
      { new: true, runValidators: true }
    ).lean() as DealDocument | null;

    if (deal) {
      await this.logActivity(tenantId, validated.type, 'deal', dealId, performedBy, {
        title: validated.title,
      });
    }

    return deal;
  }

  /**
   * Get pipeline view
   */
  async getPipeline(tenantId: string): Promise<Record<string, unknown>[]> {
    const aggregatePipeline = [
      { $match: { tenantId, stage: { $nin: ['won', 'lost'] } } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          deals: { $push: { dealId: '$dealId', title: '$title', value: '$value', probability: '$probability' } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const stages = await Deal.aggregate(aggregatePipeline as Parameters<typeof Deal.aggregate>[0]) as Array<{
      _id: string;
      count: number;
      totalValue: number;
      deals: { dealId: string; title: string; value: number; probability: number }[];
    }>;

    // Ensure all stages are represented
    const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation'];
    const pipelineStages = stageOrder.map((stage) => {
      const existing = stages.find((s) => s._id === stage);
      return {
        stage,
        count: existing?.count || 0,
        totalValue: existing?.totalValue || 0,
        deals: existing?.deals || [],
        weightedValue: existing ? existing.totalValue * (existing.count > 0 ? existing.totalValue / existing.count / 100 : 0) : 0,
      };
    });

    return pipelineStages;
  }

  /**
   * Get deal predictions from CorpIntel
   */
  async getPredictions(tenantId: string, dealId: string): Promise<unknown> {
    try {
      const response = await fetch(`${config.services.corpIntel}/api/predict/deal-outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.services.internalToken,
        },
        body: JSON.stringify({ tenantId, dealId }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      logger.error('Failed to get deal predictions:', error);
    }

    return null;
  }

  /**
   * Handle deal won - trigger project creation
   */
  private async handleDealWon(tenantId: string, deal: DealDocument): Promise<void> {
    try {
      // Notify ProjectOS to create a project
      await fetch(`${config.services.projectOS}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.services.internalToken,
        },
        body: JSON.stringify({
          tenantId,
          name: deal.title,
          clientId: deal.clientId,
          budget: deal.value,
          source: 'crm_deal',
          sourceId: deal.dealId,
        }),
      });
    } catch (error) {
      logger.error('Failed to create project from deal:', error);
    }
  }

  /**
   * Log an activity
   */
  private async logActivity(
    tenantId: string,
    type: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await ActivityModel.create({
      activityId: `ACT-${generateId().substring(0, 8).toUpperCase()}`,
      tenantId,
      type: type as Activity['type'],
      title: `${type.replace('_', ' ')} ${entityType}`,
      description: `${type} ${entityType} at ${new Date().toISOString()}`,
      date: new Date(),
      performedBy,
      entityType: entityType as 'client' | 'deal' | 'proposal' | 'invoice',
      entityId,
      metadata,
    });
  }
}

export const dealService = new DealService();
