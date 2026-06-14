/**
 * Contract Service - Business logic for contract operations
 */

import { v4 as uuidv4 } from 'uuid';
import { PartnershipContract, IPartnershipContract, PartnershipProposal, PartnershipCampaign } from '../models';
import logger from 'utils/logger.js';

export interface CreateContractInput {
  proposalId: string;
  terms: string;
  deliverables: Array<{
    type: string;
    description: string;
    deadline?: string;
  }>;
  paymentSchedule: Array<{
    milestone: string;
    amount: number;
    dueDate?: string;
  }>;
  startDate: string;
  endDate: string;
}

export class ContractService {
  /**
   * Create a new contract
   */
  async createContract(input: CreateContractInput): Promise<IPartnershipContract> {
    // Verify proposal exists
    const proposal = await PartnershipProposal.findOne({ proposalId: input.proposalId });
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const contractId = `contract-${uuidv4().slice(0, 8)}`;

    const contract = new PartnershipContract({
      contractId,
      proposalId: input.proposalId,
      campaignId: proposal.campaignId,
      influencerId: proposal.influencerId,
      brandId: proposal.brandId,
      terms: input.terms,
      deliverables: input.deliverables.map(d => ({
        ...d,
        deadline: d.deadline ? new Date(d.deadline) : undefined,
        completed: false
      })),
      paymentSchedule: input.paymentSchedule.map(p => ({
        ...p,
        dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
        paid: false
      })),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: 'draft',
      createdAt: new Date()
    });

    await contract.save();

    logger.info(`Contract created: ${contractId}`, {
      proposalId: input.proposalId,
      campaignId: proposal.campaignId
    });

    return contract;
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string): Promise<IPartnershipContract | null> {
    return PartnershipContract.findOne({ contractId });
  }

  /**
   * Get contracts by proposal ID
   */
  async getContractsByProposalId(proposalId: string): Promise<IPartnershipContract[]> {
    return PartnershipContract.find({ proposalId }).sort({ createdAt: -1 });
  }

  /**
   * Get contracts by campaign ID
   */
  async getContractsByCampaignId(campaignId: string): Promise<IPartnershipContract[]> {
    return PartnershipContract.find({ campaignId }).sort({ createdAt: -1 });
  }

  /**
   * Get contracts by influencer ID
   */
  async getContractsByInfluencerId(influencerId: string): Promise<IPartnershipContract[]> {
    return PartnershipContract.find({ influencerId }).sort({ createdAt: -1 });
  }

  /**
   * Get contracts by brand ID
   */
  async getContractsByBrandId(brandId: string): Promise<IPartnershipContract[]> {
    return PartnershipContract.find({ brandId }).sort({ createdAt: -1 });
  }

  /**
   * Sign contract
   */
  async signContract(contractId: string, signedBy: 'brand' | 'influencer'): Promise<IPartnershipContract | null> {
    const contract = await PartnershipContract.findOne({ contractId });
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'draft') {
      throw new Error('Contract cannot be signed in current status');
    }

    // Mark as signed and activate
    contract.signedAt = new Date();
    contract.status = 'active';
    await contract.save();

    // Update campaign stats
    await PartnershipCampaign.findOneAndUpdate(
      { campaignId: contract.campaignId },
      { $inc: { totalSpend: contract.paymentSchedule.reduce((sum, p) => sum + p.amount, 0) } }
    );

    logger.info(`Contract signed: ${contractId}`, { signedBy });

    return contract;
  }

  /**
   * Complete contract
   */
  async completeContract(contractId: string): Promise<IPartnershipContract | null> {
    const contract = await PartnershipContract.findOneAndUpdate(
      { contractId },
      { $set: { status: 'completed' } },
      { new: true }
    );

    if (contract) {
      logger.info(`Contract completed: ${contractId}`);
    }

    return contract;
  }

  /**
   * Cancel contract
   */
  async cancelContract(contractId: string, reason?: string): Promise<IPartnershipContract | null> {
    const contract = await PartnershipContract.findOneAndUpdate(
      { contractId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (contract) {
      logger.info(`Contract cancelled: ${contractId}`, { reason });
    }

    return contract;
  }

  /**
   * Mark deliverable as completed
   */
  async completeDeliverable(
    contractId: string,
    deliverableIndex: number
  ): Promise<IPartnershipContract | null> {
    const contract = await PartnershipContract.findOne({ contractId });
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (deliverableIndex < 0 || deliverableIndex >= contract.deliverables.length) {
      throw new Error('Invalid deliverable index');
    }

    contract.deliverables[deliverableIndex].completed = true;
    contract.deliverables[deliverableIndex].completedAt = new Date();
    await contract.save();

    logger.info(`Deliverable completed: ${contractId}`, { deliverableIndex });

    return contract;
  }

  /**
   * Mark payment as completed
   */
  async completePayment(
    contractId: string,
    paymentIndex: number
  ): Promise<IPartnershipContract | null> {
    const contract = await PartnershipContract.findOne({ contractId });
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (paymentIndex < 0 || paymentIndex >= contract.paymentSchedule.length) {
      throw new Error('Invalid payment index');
    }

    contract.paymentSchedule[paymentIndex].paid = true;
    contract.paymentSchedule[paymentIndex].paidAt = new Date();
    await contract.save();

    logger.info(`Payment completed: ${contractId}`, { paymentIndex });

    return contract;
  }

  /**
   * List contracts with filters
   */
  async listContracts(options: {
    page?: number;
    limit?: number;
    campaignId?: string;
    influencerId?: string;
    brandId?: string;
    status?: string;
  }): Promise<{ contracts: IPartnershipContract[]; total: number; page: number; limit: number; pages: number }> {
    const { page = 1, limit = 20, campaignId, influencerId, brandId, status } = options;
    const query: Record<string, any> = {};

    if (campaignId) query.campaignId = campaignId;
    if (influencerId) query.influencerId = influencerId;
    if (brandId) query.brandId = brandId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      PartnershipContract.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PartnershipContract.countDocuments(query)
    ]);

    return {
      contracts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete contract
   */
  async deleteContract(contractId: string): Promise<boolean> {
    const result = await PartnershipContract.deleteOne({ contractId });
    if (result.deletedCount > 0) {
      logger.info(`Contract deleted: ${contractId}`);
      return true;
    }
    return false;
  }
}

export const contractService = new ContractService();