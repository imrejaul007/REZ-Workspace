import { Proposal, ProposalDocument } from '../models/index.js';
import { ActivityModel } from '../models/Activity.js';
import { generateId } from '../utils/index.js';
import { createProposalSchema, updateProposalSchema, signProposalSchema } from '../utils/validators.js';
import { Activity } from '../types/index.js';

export class ProposalService {
  /**
   * Create a new proposal
   */
  async create(data: unknown, tenantId: string, createdBy: string): Promise<ProposalDocument> {
    const validated = createProposalSchema.parse(data);

    const proposal = new Proposal({
      ...validated,
      tenantId,
      proposalId: `PROP-${Date.now()}`,
      status: 'draft',
      createdBy,
    });

    await proposal.save();

    await this.logActivity(tenantId, 'created', 'proposal', proposal._id.toString(), createdBy, {
      title: proposal.title,
      total: proposal.total,
    });

    return proposal;
  }

  /**
   * Get all proposals with filters
   */
  async findAll(
    tenantId: string,
    filters: Record<string, unknown> = {}
  ): Promise<{ proposals: ProposalDocument[]; total: number; page: number; limit: number }> {
    const page = parseInt(String(filters.page || '1'), 10);
    const limit = parseInt(String(filters.limit || '20'), 10);
    const where: Record<string, unknown> = { tenantId };

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.dealId) where.dealId = filters.dealId;
    if (filters.status) where.status = filters.status;

    const [proposals, total] = await Promise.all([
      Proposal.find(where)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as ProposalDocument[],
      Proposal.countDocuments(where),
    ]);

    return { proposals, total, page, limit };
  }

  /**
   * Get a single proposal by ID
   */
  async findById(tenantId: string, proposalId: string): Promise<ProposalDocument | null> {
    return Proposal.findOne({ tenantId, _id: proposalId }).lean() as Promise<ProposalDocument | null>;
  }

  /**
   * Get a proposal by proposalId
   */
  async findByProposalId(tenantId: string, proposalId: string): Promise<ProposalDocument | null> {
    return Proposal.findOne({ tenantId, proposalId }).lean() as Promise<ProposalDocument | null>;
  }

  /**
   * Update a proposal
   */
  async update(
    tenantId: string,
    proposalId: string,
    data: unknown,
    updatedBy: string
  ): Promise<ProposalDocument | null> {
    const validated = updateProposalSchema.parse(data);

    const proposal = await Proposal.findOneAndUpdate(
      { tenantId, _id: proposalId },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean() as ProposalDocument | null;

    if (proposal) {
      await this.logActivity(tenantId, 'updated', 'proposal', proposalId, updatedBy, {
        updatedFields: Object.keys(validated),
      });
    }

    return proposal;
  }

  /**
   * Send a proposal to client
   */
  async send(tenantId: string, proposalId: string, sentBy: string): Promise<ProposalDocument | null> {
    const proposal = await Proposal.findOneAndUpdate(
      { tenantId, _id: proposalId },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).lean() as ProposalDocument | null;

    if (proposal) {
      await this.logActivity(tenantId, 'sent', 'proposal', proposalId, sentBy, {
        sentTo: proposal.clientId,
      });
    }

    return proposal;
  }

  /**
   * Mark proposal as viewed
   */
  async markViewed(tenantId: string, proposalId: string): Promise<ProposalDocument | null> {
    return Proposal.findOneAndUpdate(
      { tenantId, _id: proposalId, status: 'sent' },
      {
        $set: {
          status: 'viewed',
          viewedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).lean() as Promise<ProposalDocument | null>;
  }

  /**
   * Accept a proposal
   */
  async accept(
    tenantId: string,
    proposalId: string,
    signatureData: string,
    acceptedBy: string
  ): Promise<ProposalDocument | null> {
    const proposal = await Proposal.findOneAndUpdate(
      { tenantId, _id: proposalId },
      {
        $set: {
          status: 'accepted',
          signedAt: new Date(),
          signatureData,
        },
      },
      { new: true, runValidators: true }
    ).lean() as ProposalDocument | null;

    if (proposal) {
      await this.logActivity(tenantId, 'accepted', 'proposal', proposalId, acceptedBy);
    }

    return proposal;
  }

  /**
   * Reject a proposal
   */
  async reject(tenantId: string, proposalId: string, rejectedBy: string): Promise<ProposalDocument | null> {
    const proposal = await Proposal.findOneAndUpdate(
      { tenantId, _id: proposalId },
      { $set: { status: 'rejected' } },
      { new: true, runValidators: true }
    ).lean() as ProposalDocument | null;

    if (proposal) {
      await this.logActivity(tenantId, 'rejected', 'proposal', proposalId, rejectedBy);
    }

    return proposal;
  }

  /**
   * Get proposal with signature data
   */
  async getForSignature(tenantId: string, proposalId: string): Promise<ProposalDocument | null> {
    return Proposal.findOne({ tenantId, proposalId })
      .select('proposalId title content items subtotal tax total currency validUntil clientId')
      .lean() as Promise<ProposalDocument | null>;
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
      title: `${type} proposal`,
      description: `${type} proposal at ${new Date().toISOString()}`,
      date: new Date(),
      performedBy,
      entityType: entityType as 'client' | 'deal' | 'proposal' | 'invoice',
      entityId,
      metadata,
    });
  }
}

export const proposalService = new ProposalService();
