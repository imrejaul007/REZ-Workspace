import { v4 as uuidv4 } from 'uuid';
import { Claim, IClaim, ClaimStatus } from '../models/Claim';
import { CoopFund } from '../models/CoopFund';
import logger from '../utils/logger';

export interface CreateClaimInput {
  fundId: string;
  advertiserId: string;
  partnerId: string;
  campaign: {
    campaignId: string;
    name: string;
    spend: number;
    startDate: Date;
    endDate: Date;
  };
  claimDetails: {
    invoices: Array<{
      invoiceId: string;
      amount: number;
      date: Date;
    }>;
    totalSpend: number;
    documentation?: string[];
  };
}

class ClaimService {
  /**
   * Create a new claim
   */
  async createClaim(input: CreateClaimInput): Promise<IClaim> {
    const claimId = `claim-${uuidv4().slice(0, 12)}`;

    // Get fund to calculate contribution
    const fund = await CoopFund.findOne({ fundId: input.fundId });
    if (!fund) {
      throw new Error('Fund not found');
    }

    // Calculate eligible spend
    const eligibleSpend = this.calculateEligibleSpend(input.claimDetails.totalSpend, fund);

    // Calculate contribution
    const contributionAmount = Math.min(
      (eligibleSpend * fund.rules.contributionPercent) / 100,
      fund.rules.maxContribution
    );

    const claim = new Claim({
      claimId,
      fundId: input.fundId,
      advertiserId: input.advertiserId,
      partnerId: input.partnerId,
      status: 'pending',
      claimAmount: contributionAmount,
      currency: 'INR',
      eligibleAmount: eligibleSpend,
      contributionAmount,
      campaign: input.campaign,
      claimDetails: {
        invoices: input.claimDetails.invoices,
        totalSpend: input.claimDetails.totalSpend,
        eligibleSpend,
        documentation: input.claimDetails.documentation || [],
      },
    });

    await claim.save();

    // Update fund tracking
    await CoopFund.findOneAndUpdate(
      { fundId: input.fundId },
      { $inc: { 'tracking.totalClaims': 1 } }
    );

    logger.info('Claim created', { claimId, fundId: input.fundId, contributionAmount });

    return claim;
  }

  /**
   * Calculate eligible spend based on fund rules
   */
  private calculateEligibleSpend(totalSpend: number, fund: any): number {
    if (totalSpend < fund.rules.minSpend) {
      return 0;
    }

    // In production, filter by eligible categories and excluded products
    return totalSpend;
  }

  /**
   * Get claim by ID
   */
  async getClaim(claimId: string): Promise<IClaim | null> {
    return Claim.findOne({ claimId });
  }

  /**
   * Get claims by fund
   */
  async getClaimsByFund(
    fundId: string,
    options: { status?: ClaimStatus; page?: number; limit?: number } = {}
  ): Promise<{ claims: IClaim[]; total: number }> {
    const { status, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { fundId };
    if (status) query.status = status;

    const [claims, total] = await Promise.all([
      Claim.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Claim.countDocuments(query),
    ]);

    return { claims, total };
  }

  /**
   * Get claims by partner
   */
  async getClaimsByPartner(
    partnerId: string,
    options: { status?: ClaimStatus; page?: number; limit?: number } = {}
  ): Promise<{ claims: IClaim[]; total: number }> {
    const { status, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { partnerId };
    if (status) query.status = status;

    const [claims, total] = await Promise.all([
      Claim.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Claim.countDocuments(query),
    ]);

    return { claims, total };
  }

  /**
   * Submit claim for review
   */
  async submitForReview(claimId: string): Promise<IClaim | null> {
    const claim = await Claim.findOneAndUpdate(
      { claimId, status: 'pending' },
      { $set: { status: 'under_review' } },
      { new: true }
    );

    if (claim) {
      logger.info('Claim submitted for review', { claimId });
    }

    return claim;
  }

  /**
   * Approve claim
   */
  async approveClaim(
    claimId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<IClaim | null> {
    const claim = await Claim.findOne({ claimId, status: 'under_review' });
    if (!claim) return null;

    // Check if fund has sufficient budget
    const fund = await CoopFund.findOne({ fundId: claim.fundId });
    if (!fund || fund.availableBudget < claim.contributionAmount) {
      throw new Error('Insufficient fund budget');
    }

    // Update claim
    claim.status = 'approved';
    claim.review.reviewedBy = reviewedBy;
    claim.review.reviewedAt = new Date();
    claim.review.notes = notes;
    await claim.save();

    // Update fund
    await CoopFund.findOneAndUpdate(
      { fundId: claim.fundId },
      {
        $inc: {
          spentBudget: claim.contributionAmount,
          availableBudget: -claim.contributionAmount,
          'tracking.approvedClaims': 1,
          'tracking.totalSpent': claim.contributionAmount,
        },
      }
    );

    logger.info('Claim approved', { claimId, contributionAmount: claim.contributionAmount });

    return claim;
  }

  /**
   * Reject claim
   */
  async rejectClaim(
    claimId: string,
    reviewedBy: string,
    rejectionReason: string
  ): Promise<IClaim | null> {
    const claim = await Claim.findOneAndUpdate(
      { claimId, status: 'under_review' },
      {
        $set: {
          status: 'rejected',
          'review.reviewedBy': reviewedBy,
          'review.reviewedAt': new Date(),
          'review.rejectionReason': rejectionReason,
        },
      },
      { new: true }
    );

    if (claim) {
      await CoopFund.findOneAndUpdate(
        { fundId: claim.fundId },
        { $inc: { 'tracking.rejectedClaims': 1 } }
      );
      logger.info('Claim rejected', { claimId, reason: rejectionReason });
    }

    return claim;
  }

  /**
   * Mark claim as paid
   */
  async markAsPaid(
    claimId: string,
    payoutId: string,
    paidAmount: number
  ): Promise<IClaim | null> {
    const claim = await Claim.findOneAndUpdate(
      { claimId, status: 'approved' },
      {
        $set: {
          status: 'paid',
          'payment.payoutId': payoutId,
          'payment.paidAt': new Date(),
          'payment.paidAmount': paidAmount,
        },
      },
      { new: true }
    );

    if (claim) {
      logger.info('Claim marked as paid', { claimId, payoutId });
    }

    return claim;
  }

  /**
   * Get claim summary
   */
  async getClaimSummary(fundId?: string): Promise<{
    totalClaims: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    paid: number;
    totalAmount: number;
    approvedAmount: number;
  }> {
    const match: Record<string, unknown> = {};
    if (fundId) match.fundId = fundId;

    const stats = await Claim.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$contributionAmount' },
        },
      },
    ]);

    const result = {
      totalClaims: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      totalAmount: 0,
      approvedAmount: 0,
    };

    for (const s of stats) {
      result.totalClaims += s.count;
      result.totalAmount += s.amount;

      const statusMap: Record<string, keyof typeof result> = {
        pending: 'pending',
        under_review: 'underReview',
        approved: 'approved',
        rejected: 'rejected',
        paid: 'paid',
      };

      const key = statusMap[s._id as string];
      if (key) {
        result[key] = s.count;
        if (s._id === 'approved' || s._id === 'paid') {
          result.approvedAmount += s.amount;
        }
      }
    }

    return result;
  }
}

export const claimService = new ClaimService();
export default claimService;