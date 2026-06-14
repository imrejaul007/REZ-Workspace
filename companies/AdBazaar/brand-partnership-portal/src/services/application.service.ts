/**
 * Application Service - Business logic for influencer applications
 */

import { v4 as uuidv4 } from 'uuid';
import { InfluencerApplication, IInfluencerApplication, PartnershipCampaign } from '../models';
import logger from 'utils/logger.js';

export interface CreateApplicationInput {
  campaignId: string;
  influencerId: string;
  message?: string;
  proposedRate: number;
}

export class ApplicationService {
  /**
   * Create a new application
   */
  async createApplication(input: CreateApplicationInput): Promise<IInfluencerApplication> {
    // Check if already applied
    const existing = await InfluencerApplication.findOne({
      campaignId: input.campaignId,
      influencerId: input.influencerId
    });

    if (existing) {
      throw new Error('Already applied to this campaign');
    }

    const applicationId = `app-${uuidv4().slice(0, 8)}`;

    const application = new InfluencerApplication({
      applicationId,
      ...input,
      appliedAt: new Date()
    });

    await application.save();

    logger.info(`Application created: ${applicationId}`, {
      campaignId: input.campaignId,
      influencerId: input.influencerId
    });

    return application;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string): Promise<IInfluencerApplication | null> {
    return InfluencerApplication.findOne({ applicationId });
  }

  /**
   * Get applications by campaign ID
   */
  async getApplicationsByCampaignId(campaignId: string): Promise<IInfluencerApplication[]> {
    return InfluencerApplication.find({ campaignId }).sort({ appliedAt: -1 });
  }

  /**
   * Get applications by influencer ID
   */
  async getApplicationsByInfluencerId(influencerId: string): Promise<IInfluencerApplication[]> {
    return InfluencerApplication.find({ influencerId }).sort({ appliedAt: -1 });
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted',
    notes?: string
  ): Promise<IInfluencerApplication | null> {
    const application = await InfluencerApplication.findOneAndUpdate(
      { applicationId },
      {
        $set: {
          status,
          reviewNotes: notes,
          reviewedAt: new Date()
        }
      },
      { new: true }
    );

    if (application) {
      logger.info(`Application status updated: ${applicationId}`, { status });
    }

    return application;
  }

  /**
   * List applications with filters
   */
  async listApplications(options: {
    page?: number;
    limit?: number;
    campaignId?: string;
    influencerId?: string;
    status?: string;
  }): Promise<{ applications: IInfluencerApplication[]; total: number; page: number; limit: number; pages: number }> {
    const { page = 1, limit = 20, campaignId, influencerId, status } = options;
    const query: Record<string, any> = {};

    if (campaignId) query.campaignId = campaignId;
    if (influencerId) query.influencerId = influencerId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      InfluencerApplication.find(query).sort({ appliedAt: -1 }).skip(skip).limit(limit),
      InfluencerApplication.countDocuments(query)
    ]);

    return {
      applications,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete application
   */
  async deleteApplication(applicationId: string): Promise<boolean> {
    const result = await InfluencerApplication.deleteOne({ applicationId });
    if (result.deletedCount > 0) {
      logger.info(`Application deleted: ${applicationId}`);
      return true;
    }
    return false;
  }
}

export const applicationService = new ApplicationService();