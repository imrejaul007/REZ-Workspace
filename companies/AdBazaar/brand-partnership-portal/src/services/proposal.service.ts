/**
 * Proposal Service - Business logic for proposal operations
 */

import { v4 as uuidv4 } from 'uuid';
import { PartnershipProposal, IPartnershipProposal, PartnershipCampaign, PartnershipContract } from '../models';
import logger from 'utils/logger.js';

export interface CreateProposalInput {
  campaignId: string;
  influencerId: string;
  brandId: string;
  proposedRate: number;
  message?: string;
}

export interface UpdateProposalInput {
  proposedRate?: number;
  message?: string;
  status?: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'withdrawn';
}

export class ProposalService {
  /**
   * Create a new proposal
   */
  async createProposal(input: CreateProposalInput): Promise<IPartnershipProposal> {
    const proposalId = `prop-${uuidv4().slice(0, 8)}`;

    const proposal = new PartnershipProposal({
      proposalId,
      ...input,
      createdAt: new Date()
    });

    await proposal.save();

    // Update campaign proposal count
    await PartnershipCampaign.findOneAndUpdate(
      { campaignId: input.campaignId },
      { $inc: { totalProposals: 1 } }
    );

    logger.info(`Proposal created: ${proposalId}`, {
      campaignId: input.campaignId,
      influencerId: input.influencerId
    });

    return proposal;
  }

  /**
   * Get proposal by ID
   */
  async getProposalById(proposalId: string): Promise<IPartnershipProposal | null> {
    return PartnershipProposal.findOne({ proposalId });
  }

  /**
   * Get proposals by campaign ID
   */
  async getProposalsByCampaignId(campaignId: string): Promise<IPartnershipProposal[]> {
    return PartnershipProposal.find({ campaignId }).sort({ createdAt: -1 });
  }

  /**
   * Get proposals by influencer ID
   */
  async getProposalsByInfluencerId(influencerId: string): Promise<IPartnershipProposal[]> {
    return PartnershipProposal.find({ influencerId }).sort({ createdAt: -1 });
  }

  /**
   * Get proposals by brand ID
   */
  async getProposalsByBrandId(brandId: string): Promise<IPartnershipProposal[]> {
    return PartnershipProposal.find({ brandId }).sort({ createdAt: -1 });
  }

  /**
   * Update proposal
   */
  async updateProposal(proposalId: string, input: UpdateProposalInput): Promise<IPartnershipProposal | null> {
    const proposal = await PartnershipProposal.findOneAndUpdate(
      { proposalId },
      { $set: input },
      { new: true }
    );

    if (proposal) {
      logger.info(`Proposal updated: ${proposalId}`, input);
    }

    return proposal;
  }

  /**
   * Accept proposal and create contract
   */
  async acceptProposal(proposalId: string, contractTerms?: {
    terms: string;
    deliverables: Array<{ type: string; description: string; deadline?: string }>;
    paymentSchedule: Array<{ milestone: string; amount: number; dueDate?: string }>;
    startDate: string;
    endDate: string;
  }): Promise<{ proposal: IPartnershipProposal; contractId: string }> {
    const proposal = await PartnershipProposal.findOne({ proposalId });
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Update proposal status
    proposal.status = 'accepted';
    proposal.respondedAt = new Date();
    await proposal.save();

    // Update campaign accepted count
    await PartnershipCampaign.findOneAndUpdate(
      { campaignId: proposal.campaignId },
      { $inc: { acceptedProposals: 1 } }
    );

    // Create contract if terms provided
    let contractId: string | null = null;
    if (contractTerms) {
      const contract = new PartnershipContract({
        contractId: `contract-${uuidv4().slice(0, 8)}`,
        proposalId,
        campaignId: proposal.campaignId,
        influencerId: proposal.influencerId,
        brandId: proposal.brandId,
        terms: contractTerms.terms,
        deliverables: contractTerms.deliverables.map(d => ({
          ...d,
          completed: false
        })),
        paymentSchedule: contractTerms.paymentSchedule.map(p => ({
          ...p,
          paid: false
        })),
        startDate: new Date(contractTerms.startDate),
        endDate: new Date(contractTerms.endDate),
        status: 'draft'
      });
      await contract.save();
      contractId = contract.contractId;
    }

    logger.info(`Proposal accepted: ${proposalId}`, { contractId });

    return { proposal, contractId: contractId || '' };
  }

  /**
   * Reject proposal
   */
  async rejectProposal(proposalId: string, reason?: string): Promise<IPartnershipProposal | null> {
    const proposal = await PartnershipProposal.findOneAndUpdate(
      { proposalId },
      {
        $set: {
          status: 'rejected',
          respondedAt: new Date(),
          responseReason: reason
        }
      },
      { new: true }
    );

    if (proposal) {
      logger.info(`Proposal rejected: ${proposalId}`, { reason });
    }

    return proposal;
  }

  /**
   * Withdraw proposal
   */
  async withdrawProposal(proposalId: string): Promise<IPartnershipProposal | null> {
    const proposal = await PartnershipProposal.findOneAndUpdate(
      { proposalId },
      { $set: { status: 'withdrawn' } },
      { new: true }
    );

    if (proposal) {
      logger.info(`Proposal withdrawn: ${proposalId}`);
    }

    return proposal;
  }

  /**
   * List proposals with filters
   */
  async listProposals(options: {
    page?: number;
    limit?: number;
    campaignId?: string;
    influencerId?: string;
    brandId?: string;
    status?: string;
  }): Promise<{ proposals: IPartnershipProposal[]; total: number; page: number; limit: number; pages: number }> {
    const { page = 1, limit = 20, campaignId, influencerId, brandId, status } = options;
    const query: Record<string, any> = {};

    if (campaignId) query.campaignId = campaignId;
    if (influencerId) query.influencerId = influencerId;
    if (brandId) query.brandId = brandId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      PartnershipProposal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PartnershipProposal.countDocuments(query)
    ]);

    return {
      proposals,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete proposal
   */
  async deleteProposal(proposalId: string): Promise<boolean> {
    const result = await PartnershipProposal.deleteOne({ proposalId });
    if (result.deletedCount > 0) {
      logger.info(`Proposal deleted: ${proposalId}`);
      return true;
    }
    return false;
  }
}

export const proposalService = new ProposalService();