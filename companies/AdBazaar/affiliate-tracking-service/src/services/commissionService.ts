import { v4 as uuidv4 } from 'uuid';
import { Commission, ICommission, CommissionStatus } from '../models/Commission';
import { Conversion } from '../models/Conversion';
import { Affiliate } from '../models/Affiliate';
import logger from '../utils/logger';

export interface CreateCommissionInput {
  affiliateId: string;
  conversionIds: string[];
  period: {
    start: Date;
    end: Date;
  };
}

class CommissionService {
  /**
   * Create commission from conversions
   */
  async createCommission(input: CreateCommissionInput): Promise<ICommission> {
    const commissionId = `comm-${uuidv4().slice(0, 12)}`;

    // Get conversions
    const conversions = await Conversion.find({
      conversionId: { $in: input.conversionIds },
      affiliateId: input.affiliateId,
      status: 'approved',
    });

    if (conversions.length === 0) {
      throw new Error('No approved conversions found');
    }

    // Calculate totals
    const totalRevenue = conversions.reduce((sum, c) => sum + c.revenue, 0);
    const commissionAmount = conversions.reduce((sum, c) => sum + c.commission, 0);

    // Get affiliate for calculation details
    const affiliate = await Affiliate.findOne({ affiliateId: input.affiliateId });
    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const cpaConversions = conversions.filter((c) => c.type === 'cpa');
    const revShareConversions = conversions.filter((c) => c.type === 'rev_share' || c.type === 'hybrid');

    const commission = new Commission({
      commissionId,
      affiliateId: input.affiliateId,
      conversionIds: input.conversionIds,
      totalRevenue,
      commissionAmount,
      currency: 'INR',
      status: 'pending',
      calculationDetails: {
        cpaCount: cpaConversions.length,
        cpaRate: affiliate.commissionStructure.cpa,
        revShareAmount: revShareConversions.reduce((sum, c) => sum + c.commission, 0),
        revSharePercent: affiliate.commissionStructure.revShare,
      },
      period: input.period,
    });

    await commission.save();

    // Update conversions to mark as paid
    await Conversion.updateMany(
      { conversionId: { $in: input.conversionIds } },
      { $set: { status: 'paid' } }
    );

    // Update affiliate stats
    await Affiliate.findOneAndUpdate(
      { affiliateId: input.affiliateId },
      {
        $inc: {
          'stats.pendingCommission': -commissionAmount,
          'stats.paidCommission': commissionAmount,
        },
      }
    );

    logger.info('Commission created', {
      commissionId,
      affiliateId: input.affiliateId,
      amount: commissionAmount,
    });

    return commission;
  }

  /**
   * Get commission by ID
   */
  async getCommission(commissionId: string): Promise<ICommission | null> {
    return Commission.findOne({ commissionId });
  }

  /**
   * Get commissions by affiliate
   */
  async getCommissionsByAffiliate(
    affiliateId: string,
    options: {
      page?: number;
      limit?: number;
      status?: CommissionStatus;
    } = {}
  ): Promise<{ commissions: ICommission[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { affiliateId };
    if (status) query.status = status;

    const [commissions, total] = await Promise.all([
      Commission.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Commission.countDocuments(query),
    ]);

    return { commissions, total };
  }

  /**
   * Update commission status
   */
  async updateCommissionStatus(
    commissionId: string,
    status: CommissionStatus,
    transactionId?: string
  ): Promise<ICommission | null> {
    const update: Record<string, unknown> = { status };

    if (status === 'paid' && transactionId) {
      update.paidAt = new Date();
      update.paidTransactionId = transactionId;
    }

    const commission = await Commission.findOneAndUpdate(
      { commissionId },
      { $set: update },
      { new: true }
    );

    if (commission) {
      logger.info('Commission status updated', { commissionId, status });
    }

    return commission;
  }

  /**
   * Get pending commissions for payout
   */
  async getPendingCommissions(affiliateId?: string): Promise<ICommission[]> {
    const query: Record<string, unknown> = { status: 'pending' };
    if (affiliateId) query.affiliateId = affiliateId;

    return Commission.find(query).sort({ commissionAmount: -1 });
  }

  /**
   * Auto-generate commissions for an affiliate
   */
  async autoGenerateCommission(
    affiliateId: string,
    period: { start: Date; end: Date }
  ): Promise<ICommission | null> {
    // Get approved conversions in period
    const conversions = await Conversion.find({
      affiliateId,
      status: 'approved',
      'timestamps.conversion': {
        $gte: period.start,
        $lte: period.end,
      },
    });

    if (conversions.length === 0) {
      return null;
    }

    return this.createCommission({
      affiliateId,
      conversionIds: conversions.map((c) => c.conversionId),
      period,
    });
  }

  /**
   * Get commission summary
   */
  async getCommissionSummary(affiliateId: string): Promise<{
    totalCommissions: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
    totalRevenue: number;
  }> {
    const stats = await Commission.aggregate([
      { $match: { affiliateId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$commissionAmount' },
          revenue: { $sum: '$totalRevenue' },
        },
      },
    ]);

    const result = {
      totalCommissions: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      totalRevenue: 0,
    };

    for (const s of stats) {
      result.totalCommissions += s.count;
      if (s._id === 'pending') result.pendingAmount = s.amount;
      if (s._id === 'approved') result.approvedAmount = s.amount;
      if (s._id === 'paid') result.paidAmount = s.amount;
      result.totalRevenue += s.revenue;
    }

    return result;
  }
}

export const commissionService = new CommissionService();
export default commissionService;