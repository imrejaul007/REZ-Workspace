import { v4 as uuidv4 } from 'uuid';
import { Payout, IPayout, PayoutStatus, PayoutMethod } from '../models/Payout';
import { Commission } from '../models/affiliate-tracking-service/src/models/Commission';
import logger from 'utils/logger.js';

export interface CreatePayoutInput {
  affiliateId: string;
  commissionIds: string[];
  method: PayoutMethod;
  recipient: {
    name: string;
    email: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
  period: {
    start: Date;
    end: Date;
  };
}

class PayoutService {
  /**
   * Create a new payout
   */
  async createPayout(input: CreatePayoutInput): Promise<IPayout> {
    const payoutId = `payout-${uuidv4().slice(0, 12)}`;

    // Get commissions
    const commissions = await Commission.find({
      commissionId: { $in: input.commissionIds },
      affiliateId: input.affiliateId,
    });

    if (commissions.length === 0) {
      throw new Error('No commissions found');
    }

    // Calculate totals
    const totalAmount = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const fee = this.calculateFee(totalAmount, input.method);
    const netAmount = totalAmount - fee;

    const payout = new Payout({
      payoutId,
      affiliateId: input.affiliateId,
      commissionIds: input.commissionIds,
      amount: totalAmount,
      currency: 'INR',
      method: input.method,
      status: 'calculating',
      fee,
      netAmount,
      period: input.period,
      recipient: input.recipient,
      processing: {
        retryCount: 0,
      },
    });

    await payout.save();
    logger.info('Payout created', { payoutId, affiliateId: input.affiliateId, amount: netAmount });

    // Update status to ready
    payout.status = 'ready';
    await payout.save();

    return payout;
  }

  /**
   * Calculate processing fee
   */
  private calculateFee(amount: number, method: PayoutMethod): number {
    switch (method) {
      case 'bank_transfer':
        return Math.min(amount * 0.01, 50); // 1% or max 50
      case 'upi':
        return Math.min(amount * 0.005, 10); // 0.5% or max 10
      case 'paypal':
        return amount * 0.03; // 3%
      case 'razorpay':
        return Math.min(amount * 0.02, 100); // 2% or max 100
      default:
        return 0;
    }
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string): Promise<IPayout | null> {
    return Payout.findOne({ payoutId });
  }

  /**
   * Get payouts by affiliate
   */
  async getPayoutsByAffiliate(
    affiliateId: string,
    options: { page?: number; limit?: number; status?: PayoutStatus } = {}
  ): Promise<{ payouts: IPayout[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { affiliateId };
    if (status) query.status = status;

    const [payouts, total] = await Promise.all([
      Payout.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Payout.countDocuments(query),
    ]);

    return { payouts, total };
  }

  /**
   * Process payout
   */
  async processPayout(payoutId: string): Promise<IPayout | null> {
    const payout = await Payout.findOne({ payoutId, status: 'ready' });
    if (!payout) return null;

    try {
      payout.status = 'processing';
      payout.processing.initiatedAt = new Date();
      await payout.save();

      // Simulate payment gateway call
      const transactionId = await this.initiatePayment(payout);

      payout.status = 'completed';
      payout.processing.completedAt = new Date();
      payout.processing.transactionId = transactionId;
      await payout.save();

      logger.info('Payout processed', { payoutId, transactionId });

      return payout;
    } catch (error) {
      payout.status = 'failed';
      payout.processing.failureReason = (error as Error).message;
      payout.processing.lastRetryAt = new Date();
      await payout.save();

      logger.error('Payout failed', { payoutId, error: (error as Error).message });

      return payout;
    }
  }

  /**
   * Initiate payment via gateway
   */
  private async initiatePayment(payout: IPayout): Promise<string> {
    // In production, integrate with payment gateway (Razorpay, PayPal, etc.)
    return `txn_${uuidv4().slice(0, 16)}`;
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(affiliateId?: string): Promise<IPayout[]> {
    const query: Record<string, unknown> = { status: 'ready' };
    if (affiliateId) query.affiliateId = affiliateId;

    return Payout.find(query).sort({ amount: -1 });
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string): Promise<IPayout | null> {
    const payout = await Payout.findOne({ payoutId, status: 'failed' });
    if (!payout) return null;

    if (payout.processing.retryCount >= 3) {
      logger.warn('Max retry attempts reached', { payoutId });
      return null;
    }

    payout.status = 'ready';
    await payout.save();

    return this.processPayout(payoutId);
  }

  /**
   * Cancel payout
   */
  async cancelPayout(payoutId: string): Promise<IPayout | null> {
    const payout = await Payout.findOneAndUpdate(
      { payoutId, status: { $in: ['pending', 'ready', 'failed'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (payout) {
      logger.info('Payout cancelled', { payoutId });
    }

    return payout;
  }

  /**
   * Get payout analytics
   */
  async getPayoutAnalytics(affiliateId?: string): Promise<{
    totalPayouts: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    completedCount: number;
    completedAmount: number;
    failedCount: number;
    failedAmount: number;
  }> {
    const match: Record<string, unknown> = {};
    if (affiliateId) match.affiliateId = affiliateId;

    const stats = await Payout.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$netAmount' },
        },
      },
    ]);

    const result = {
      totalPayouts: 0,
      totalAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      completedCount: 0,
      completedAmount: 0,
      failedCount: 0,
      failedAmount: 0,
    };

    for (const s of stats) {
      result.totalPayouts += s.count;
      result.totalAmount += s.amount;

      if (s._id === 'pending' || s._id === 'ready' || s._id === 'calculating') {
        result.pendingCount += s.count;
        result.pendingAmount += s.amount;
      }
      if (s._id === 'completed') {
        result.completedCount += s.count;
        result.completedAmount += s.amount;
      }
      if (s._id === 'failed') {
        result.failedCount += s.count;
        result.failedAmount += s.amount;
      }
    }

    return result;
  }
}

export const payoutService = new PayoutService();
export default payoutService;