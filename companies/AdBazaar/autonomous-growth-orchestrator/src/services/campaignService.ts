import { v4 as uuidv4 } from 'uuid';
import { AutonomousCampaign, IAutonomousCampaign } from '../models';
import { campaignMetrics } from '../utils/metrics';
import logger from '../utils/logger';
import { z } from 'zod';

export const CreateCampaignSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  objectives: z.array(z.object({
    type: z.enum(['conversions', 'clicks', 'impressions', 'reach', 'engagement', 'roas']),
    target: z.number().positive(),
    minTarget: z.number().positive().optional()
  })).min(1).max(5),
  constraints: z.object({
    minBid: z.number().positive().optional(),
    maxBid: z.number().positive().optional(),
    minBudget: z.number().positive().optional(),
    maxBudget: z.number().positive().optional(),
    excludedAudiences: z.array(z.string()).optional(),
    excludedPlacements: z.array(z.string()).optional(),
    allowedAdFormats: z.array(z.enum(['display', 'video', 'native', 'search'])).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    customConstraints: z.record(z.any()).optional()
  }).optional(),
  budget: z.object({
    total: z.number().positive(),
    daily: z.number().positive().optional(),
    currency: z.string().default('INR')
  }),
  autonomousMode: z.boolean().default(false)
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export class CampaignService {
  /**
   * Create a new autonomous campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<IAutonomousCampaign> {
    logger.info('Creating new autonomous campaign', { advertiserId: input.advertiserId, name: input.name });

    const campaign = new AutonomousCampaign({
      advertiserId: input.advertiserId,
      name: input.name,
      description: input.description,
      objectives: input.objectives,
      constraints: input.constraints || {},
      budget: {
        ...input.budget,
        spent: 0
      },
      status: 'draft',
      autonomousMode: input.autonomousMode
    });

    await campaign.save();

    campaignMetrics.totalCampaigns.inc({ status: 'draft' });
    campaignMetrics.budgetAllocated.inc(campaign.budget.total);

    logger.info('Campaign created successfully', { campaignId: campaign._id });
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<IAutonomousCampaign | null> {
    return AutonomousCampaign.findById(campaignId);
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(filters: {
    advertiserId?: string;
    status?: string;
    autonomousMode?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ campaigns: IAutonomousCampaign[]; total: number }> {
    const query: Record<string, any> = {};

    if (filters.advertiserId) query.advertiserId = filters.advertiserId;
    if (filters.status) query.status = filters.status;
    if (filters.autonomousMode !== undefined) query.autonomousMode = filters.autonomousMode;

    const [campaigns, total] = await Promise.all([
      AutonomousCampaign.find(query)
        .sort({ createdAt: -1 })
        .skip(filters.offset || 0)
        .limit(filters.limit || 20),
      AutonomousCampaign.countDocuments(query)
    ]);

    return { campaigns, total };
  }

  /**
   * Start autonomous mode for a campaign
   */
  async startAutonomousMode(campaignId: string): Promise<IAutonomousCampaign | null> {
    logger.info('Starting autonomous mode', { campaignId });

    const campaign = await AutonomousCampaign.findByIdAndUpdate(
      campaignId,
      {
        autonomousMode: true,
        status: 'active',
        nextOptimization: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
 },
      { new: true }
    );

    if (campaign) {
      campaignMetrics.activeCampaigns.inc();
      logger.info('Autonomous mode started', { campaignId });
    }

    return campaign;
  }

  /**
   * Pause autonomous mode for a campaign
   */
  async pauseAutonomousMode(campaignId: string): Promise<IAutonomousCampaign | null> {
    logger.info('Pausing autonomous mode', { campaignId });

    const campaign = await AutonomousCampaign.findByIdAndUpdate(
      campaignId,
      {
        autonomousMode: false,
        status: 'paused'
      },
      { new: true }
    );

    if (campaign) {
      campaignMetrics.activeCampaigns.dec();
      logger.info('Autonomous mode paused', { campaignId });
    }

    return campaign;
  }

  /**
   * Update campaign performance metrics
   */
  async updatePerformance(
    campaignId: string,
    metrics: Partial<IAutonomousCampaign['performance']>
  ): Promise<IAutonomousCampaign | null> {
    return AutonomousCampaign.findByIdAndUpdate(
      campaignId,
      { performance: metrics },
      { new: true }
    );
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<{
    total: number;
    active: number;
    totalBudget: number;
    averageROAS: number;
  }> {
    const [stats] = await AutonomousCampaign.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalBudget: { $sum: '$budget.total' },
          avgROAS: { $avg: '$performance.roas' }
        }
      }
    ]);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      totalBudget: stats?.totalBudget || 0,
      averageROAS: stats?.avgROAS || 0
    };
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await AutonomousCampaign.findByIdAndDelete(campaignId);
    if (result) {
      campaignMetrics.totalCampaigns.dec({ status: result.status });
      campaignMetrics.budgetAllocated.dec(result.budget.total);
      return true;
    }
    return false;
  }
}

export const campaignService = new CampaignService();
export default campaignService;