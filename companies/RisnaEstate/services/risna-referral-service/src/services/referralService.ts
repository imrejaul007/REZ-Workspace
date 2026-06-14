import axios from 'axios';
import { Referral, IReferral, ReferralStatus, ReferralProgram, IReferralProgram, ReferralEarning, IReferralEarning } from '../models/Referral';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReferralInput {
  code: string;
  referrerId: string;
  referrerPhone?: string;
  refereePhone?: string;
  source?: 'whatsapp' | 'sms' | 'email' | 'social' | 'qr' | 'link' | 'agent';
  propertyId?: string;
  programId?: string;
  utmSource?: string;
  brokerId?: string;
}

export class ReferralService {
  private walletUrl = process.env.REZ_WALLET_SERVICE_URL || 'http://localhost:4004';

  /**
   * Create a new referral
   */
  async create(input: CreateReferralInput): Promise<IReferral> {
    // Generate short code if not exists
    const shortCode = this.generateShortCode();

    const referral = new Referral({
      ...input,
      shortCode,
      status: ReferralStatus.PENDING,
      registeredAt: new Date()
    });

    await referral.save();
    logger.info('Referral created', { referralId: referral._id, code: referral.code });

    return referral;
  }

  /**
   * Validate referral code
   */
  async validateCode(code: string): Promise<IReferral | null> {
    const referral = await Referral.findOne({
      $or: [{ code }, { shortCode: code }],
      status: { $nin: [ReferralStatus.EXPIRED, ReferralStatus.CANCELLED] },
      deletedAt: null
    });
    return referral;
  }

  /**
   * Get referral by ID
   */
  async getById(id: string): Promise<IReferral | null> {
    return Referral.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Get referrals by referrer
   */
  async getByReferrer(referrerId: string, page = 1, limit = 20): Promise<{ referrals: IReferral[]; total: number }> {
    const skip = (page - 1) * limit;
    const [referrals, total] = await Promise.all([
      Referral.find({ referrerId, deletedAt: null }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Referral.countDocuments({ referrerId, deletedAt: null })
    ]);
    return { referrals: referrals as IReferral[], total };
  }

  /**
   * Get my referrals (logged in user)
   */
  async getMyReferrals(userId: string, page = 1, limit = 20): Promise<{ referrals: IReferral[]; total: number }> {
    return this.getByReferrer(userId, page, limit);
  }

  /**
   * Register referral (referee signs up)
   */
  async register(id: string, refereeId: string, refereeName?: string): Promise<IReferral | null> {
    const referral = await Referral.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          refereeId,
          refereeName,
          status: ReferralStatus.REGISTERED
        }
      },
      { new: true }
    );

    if (referral) {
      logger.info('Referral registered', { referralId: id, refereeId });
      await this.createEarning(referral, 'referral_signup');
    }

    return referral;
  }

  /**
   * Mark referral as interested
   */
  async markInterested(id: string): Promise<IReferral | null> {
    const referral = await Referral.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: ReferralStatus.INTERESTED,
          firstInterestAt: new Date()
        }
      },
      { new: true }
    );

    if (referral) {
      logger.info('Referral marked interested', { referralId: id });
    }

    return referral;
  }

  /**
   * Mark referral as visited
   */
  async markVisited(id: string): Promise<IReferral | null> {
    const referral = await Referral.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: ReferralStatus.VISITED,
          firstVisitAt: new Date()
        }
      },
      { new: true }
    );

    if (referral) {
      logger.info('Referral marked visited', { referralId: id });
      await this.createEarning(referral, 'referral_visit');
    }

    return referral;
  }

  /**
   * Mark referral as qualified
   */
  async markQualified(id: string): Promise<IReferral | null> {
    const referral = await Referral.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: ReferralStatus.QUALIFIED,
          qualifiedAt: new Date()
        }
      },
      { new: true }
    );

    if (referral) {
      logger.info('Referral marked qualified', { referralId: id });
    }

    return referral;
  }

  /**
   * Mark referral as converted
   */
  async markConverted(id: string, dealValue: number, propertyId?: string): Promise<IReferral | null> {
    const referral = await Referral.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: ReferralStatus.CONVERTED,
          convertedAt: new Date(),
          'conversion.converted': true,
          'conversion.convertedAt': new Date(),
          'conversion.dealValue': dealValue,
          'conversion.propertyId': propertyId
        }
      },
      { new: true }
    );

    if (referral) {
      logger.info('Referral converted', { referralId: id, dealValue });
      await this.createEarning(referral, 'referral_conversion');
      await this.processPayout(referral);
    }

    return referral;
  }

  /**
   * Get referral earnings
   */
  async getEarnings(userId: string, page = 1, limit = 20): Promise<{ earnings: IReferralEarning[]; total: number; pending: number; paid: number }> {
    const skip = (page - 1) * limit;
    const query = { userId, deletedAt: null };

    const [earnings, allEarnings] = await Promise.all([
      ReferralEarning.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReferralEarning.find(query).lean()
    ]);

    const pending = allEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    const paid = allEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

    return {
      earnings: earnings as IReferralEarning[],
      total: allEarnings.length,
      pending,
      paid
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10): Promise<Array<{ userId: string; name: string; referrals: number; earnings: number }>> {
    const stats = await Referral.aggregate([
      { $match: { deletedAt: null, status: ReferralStatus.CONVERTED } },
      {
        $group: {
          _id: '$referrerId',
          name: { $first: '$referrerName' },
          referrals: { $sum: 1 },
          earnings: { $sum: '$conversion.commissionEarned' }
        }
      },
      { $sort: { earnings: -1 } },
      { $limit: limit }
    ]);

    return stats.map(s => ({
      userId: s._id,
      name: s.name || 'Anonymous',
      referrals: s.referrals,
      earnings: s.earnings || 0
    }));
  }

  /**
   * Create referral program
   */
  async createProgram(input: Partial<IReferralProgram>): Promise<IReferralProgram> {
    const program = new ReferralProgram({
      ...input,
      active: true,
      totalReferrals: 0,
      totalPayout: 0
    });
    await program.save();
    return program;
  }

  /**
   * Get active programs
   */
  async getPrograms(): Promise<IReferralProgram[]> {
    return ReferralProgram.find({
      active: true,
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: null }
      ],
      deletedAt: null
    });
  }

  /**
   * Get stats
   */
  async getStats(userId?: string): Promise<{
    totalReferrals: number;
    conversions: number;
    pendingEarnings: number;
    paidEarnings: number;
    conversionRate: number;
  }> {
    const match = { deletedAt: null };
    if (userId) (match as any).referrerId = userId;

    const stats = await Referral.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          conversions: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
        }
      }
    ]);

    const earnings = userId ? await ReferralEarning.aggregate([
      { $match: { userId, deletedAt: null } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' }
        }
      }
    ]) : [];

    const pendingEarnings = earnings.find(e => e._id === 'pending')?.total || 0;
    const paidEarnings = earnings.find(e => e._id === 'paid')?.total || 0;

    const total = stats[0]?.total || 0;
    const conversions = stats[0]?.conversions || 0;

    return {
      totalReferrals: total,
      conversions,
      pendingEarnings,
      paidEarnings,
      conversionRate: total > 0 ? Math.round((conversions / total) * 100) : 0
    };
  }

  // Private methods

  private async createEarning(referral: IReferral, source: string): Promise<void> {
    const program = referral.programId ? await ReferralProgram.findById(referral.programId) : null;
    if (!program) return;

    const levelConfig = program.levels.find(l => l.level === (referral.level || 1));
    if (!levelConfig) return;

    const earning = new ReferralEarning({
      referralId: referral._id.toString(),
      userId: referral.referrerId,
      level: referral.level || 1,
      amount: levelConfig.rewardValue,
      currency: levelConfig.currency,
      source: source as any,
      status: 'pending'
    });

    await earning.save();
    logger.info('Referral earning created', { referralId: referral._id, amount: levelConfig.rewardValue });
  }

  private async processPayout(referral: IReferral): Promise<void> {
    try {
      const earning = await ReferralEarning.findOne({
        referralId: referral._id.toString(),
        status: 'pending'
      });

      if (!earning) return;

      // Call RABTUL Wallet to add coins/balance
      await axios.post(`${this.walletUrl}/api/wallet/add`, {
        userId: referral.referrerId,
        amount: earning.amount,
        currency: earning.currency,
        reason: `Referral commission for ${referral.conversion?.propertyId || 'property booking'}`,
        reference: referral._id.toString()
      }, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      earning.status = 'paid';
      earning.paidAt = new Date();
      earning.transactionId = `REF-${Date.now()}`;
      await earning.save();

      // Update referral reward status
      referral.rewards = referral.rewards || {};
      referral.rewards.referrerEarned = {
        ...(referral.rewards.referrerEarned || {}),
        paid: true,
        paidAt: new Date(),
        transactionId: earning.transactionId
      };
      await referral.save();

      logger.info('Referral payout processed', { referralId: referral._id, amount: earning.amount });
    } catch (err) {
      logger.error('Failed to process payout', { referralId: referral._id, error: err });
    }
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const referralService = new ReferralService();
