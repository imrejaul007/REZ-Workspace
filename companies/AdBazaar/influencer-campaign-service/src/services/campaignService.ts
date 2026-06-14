import { Campaign, ICampaign } from '../models/Campaign';
import { CampaignInfluencer } from '../models/Influencer';
import { Brief, IBrief } from '../models/Brief';
import { Deliverable, IDeliverable } from '../models/Deliverable';
import { logger } from 'utils/logger.js';
import { campaignsCreated, campaignInfluencersAssigned } from '../utils/metrics';

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(data: Partial<ICampaign>): Promise<ICampaign> {
    try {
      const campaign = new Campaign(data);
      await campaign.save();
      campaignsCreated.inc();
      logger.info('Campaign created', { campaignId: campaign._id });
      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign', { error, data });
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<ICampaign | null> {
    return Campaign.findById(id).exec();
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: Partial<ICampaign>): Promise<ICampaign | null> {
    return Campaign.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  /**
   * Get all campaigns with filters
   */
  async getAllCampaigns(filters: {
    brandId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: ICampaign[]; total: number }> {
    const { brandId, status, page = 1, limit = 20 } = filters;
    const query: any = {};

    if (brandId) query.brandId = brandId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Campaign.countDocuments(query).exec()
    ]);

    return { campaigns, total };
  }

  /**
   * Add influencer to campaign
   */
  async addInfluencerToCampaign(campaignId: string, influencerData: {
    influencerId?: string;
    name: string;
    email: string;
    phone?: string;
    platform: string;
    handle: string;
    followers: number;
    agreedRate?: number;
    deliverables?: any[];
  }): Promise<any> {
    try {
      const campaign = await Campaign.findById(campaignId).exec();
      if (!campaign) throw new Error('Campaign not found');

      const campaignInfluencer = new CampaignInfluencer({
        ...influencerData,
        campaignId,
        status: 'invited',
        invitedAt: new Date()
      });
      await campaignInfluencer.save();
      campaignInfluencersAssigned.inc();

      // Create deliverables if specified
      if (influencerData.deliverables?.length) {
        await Promise.all(influencerData.deliverables.map((d: any) =>
          Deliverable.create({
            campaignId,
            influencerId: campaignInfluencer._id,
            type: d.type,
            platform: d.platform || influencerData.platform,
            description: d.description,
            scheduledDate: d.scheduledDate,
            status: 'pending',
            payment: {
              amount: influencerData.agreedRate || 0,
              status: 'pending'
            }
          })
        ));
      }

      logger.info('Influencer added to campaign', {
        campaignId,
        influencerId: campaignInfluencer._id
      });

      return campaignInfluencer;
    } catch (error) {
      logger.error('Failed to add influencer to campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get campaign influencers
   */
  async getCampaignInfluencers(campaignId: string): Promise<any[]> {
    return CampaignInfluencer.find({ campaignId })
      .sort({ status: 1, invitedAt: -1 })
      .exec();
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const campaign = await Campaign.findById(campaignId).exec();
    if (!campaign) throw new Error('Campaign not found');

    const [influencers, deliverables] = await Promise.all([
      CampaignInfluencer.find({ campaignId }).exec(),
      Deliverable.find({ campaignId }).exec()
    ]);

    const completedDeliverables = deliverables.filter(d =>
      ['approved', 'published'].includes(d.status)
    );

    const totalViews = completedDeliverables.reduce((sum, d) =>
      sum + (d.performance?.views || 0), 0
    );
    const totalEngagement = completedDeliverables.reduce((sum, d) =>
      sum + (d.performance?.likes || 0) +
      (d.performance?.comments || 0) +
      (d.performance?.shares || 0), 0
    );

    return {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget
      },
      summary: {
        totalInfluencers: influencers.length,
        confirmedInfluencers: influencers.filter(i =>
          ['confirmed', 'working', 'submitted', 'approved', 'completed'].includes(i.status)
        ).length,
        totalDeliverables: deliverables.length,
        completedDeliverables: completedDeliverables.length,
        pendingDeliverables: deliverables.filter(d => d.status === 'pending').length,
        totalViews,
        totalEngagement,
        avgEngagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0
      },
      byStatus: {
        invited: influencers.filter(i => i.status === 'invited').length,
        negotiating: influencers.filter(i => i.status === 'negotiating').length,
        confirmed: influencers.filter(i => i.status === 'confirmed').length,
        working: influencers.filter(i => i.status === 'working').length,
        completed: influencers.filter(i => i.status === 'completed').length
      },
      deliverables: deliverables.map(d => ({
        id: d._id,
        influencerId: d.influencerId,
        type: d.type,
        platform: d.platform,
        status: d.status,
        performance: d.performance
      }))
    };
  }

  /**
   * Update influencer status in campaign
   */
  async updateInfluencerStatus(
    campaignId: string,
    influencerId: string,
    status: string
  ): Promise<any> {
    const updateData: any = { status };
    if (status === 'confirmed') updateData.confirmedAt = new Date();

    return CampaignInfluencer.findOneAndUpdate(
      { campaignId, _id: influencerId },
      updateData,
      { new: true }
    ).exec();
  }

  /**
   * Create brief for campaign
   */
  async createBrief(campaignId: string, data: Partial<IBrief>): Promise<IBrief> {
    const existingBriefs = await Brief.find({ campaignId }).exec();
    const version = existingBriefs.length + 1;

    const brief = new Brief({
      ...data,
      campaignId,
      version
    });
    await brief.save();

    logger.info('Brief created for campaign', { campaignId, version });
    return brief;
  }

  /**
   * Get campaign briefs
   */
  async getCampaignBriefs(campaignId: string): Promise<IBrief[]> {
    return Brief.find({ campaignId })
      .sort({ version: -1 })
      .exec();
  }

  /**
   * Update deliverable
   */
  async updateDeliverable(
    deliverableId: string,
    data: Partial<IDeliverable>
  ): Promise<IDeliverable | null> {
    return Deliverable.findByIdAndUpdate(deliverableId, data, { new: true }).exec();
  }

  /**
   * Submit deliverable content
   */
  async submitDeliverable(
    deliverableId: string,
    content: string,
    contentUrl?: string
  ): Promise<IDeliverable | null> {
    return Deliverable.findByIdAndUpdate(
      deliverableId,
      {
        content,
        contentUrl,
        submittedDate: new Date(),
        status: 'submitted'
      },
      { new: true }
    ).exec();
  }

  /**
   * Approve deliverable
   */
  async approveDeliverable(deliverableId: string): Promise<IDeliverable | null> {
    return Deliverable.findByIdAndUpdate(
      deliverableId,
      {
        approvedDate: new Date(),
        status: 'approved'
      },
      { new: true }
    ).exec();
  }

  /**
   * Request revision
   */
  async requestRevision(
    deliverableId: string,
    notes: string,
    requestedBy: string
  ): Promise<IDeliverable | null> {
    return Deliverable.findByIdAndUpdate(
      deliverableId,
      {
        status: 'revision_requested',
        $push: {
          revisionNotes: {
            note: notes,
            requestedAt: new Date(),
            requestedBy
          }
        }
      },
      { new: true }
    ).exec();
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<boolean> {
    const result = await Campaign.findByIdAndDelete(id).exec();
    if (result) {
      await Promise.all([
        CampaignInfluencer.deleteMany({ campaignId: id }).exec(),
        Brief.deleteMany({ campaignId: id }).exec(),
        Deliverable.deleteMany({ campaignId: id }).exec()
      ]);
    }
    return !!result;
  }
}

export const campaignService = new CampaignService();
