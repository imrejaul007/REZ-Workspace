import { v4 as uuidv4 } from 'uuid';
import { Referral, IReferral, Credit, ICredit, Reward, IReward } from '../models';
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('ReferralService');

export class ReferralService {
  async createReferral(data: {
    referrerId: string;
    referrerUserId: string;
    refereeId: string;
    refereeUserId: string;
    companyId: string;
    referralCode: string;
    campaignId?: string;
    source: 'link' | 'code' | 'qr' | 'email' | 'social';
    referralTier?: string;
  }): Promise<IReferral> {
    const referralId = `ref_${uuidv4()}`;
    const referral = new Referral({ ...data, referralId });
    await referral.save();
    logger.info('Referral created', { referralId, referrerId: data.referrerId, refereeId: data.refereeId });
    return referral;
  }

  async getReferralById(referralId: string): Promise<IReferral | null> {
    return Referral.findOne({ referralId });
  }

  async getReferralsByReferrer(referrerId: string, companyId?: string): Promise<IReferral[]> {
    const query: Record<string, unknown> = { referrerId };
    if (companyId) {
      query['companyId'] = companyId;
    }
    return Referral.find(query).sort({ referredAt: -1 });
  }

  async getReferralsByReferee(refereeId: string): Promise<IReferral[]> {
    return Referral.find({ refereeId }).sort({ referredAt: -1 });
  }

  async getReferralByCode(referralCode: string): Promise<IReferral | null> {
    return Referral.findOne({ referralCode });
  }

  async convertReferral(referralId: string, conversionType: string): Promise<IReferral | null> {
    const referral = await Referral.findOne({ referralId });
    if (!referral) return null;

    referral.status = 'completed';
    referral.conversionType = conversionType;
    referral.convertedAt = new Date();
    await referral.save();

    logger.info('Referral converted', { referralId, conversionType });
    return referral;
  }

  async creditReferrer(referralId: string, data: {
    amount: number;
    type: 'points' | 'cash' | 'credit' | 'discount';
    triggeredBy: 'signup' | 'first_purchase' | 'subscription' | 'milestone';
  }): Promise<ICredit> {
    const referral = await this.getReferralById(referralId);
    if (!referral) throw new Error('Referral not found');

    const creditId = `cred_${uuidv4()}`;
    const credit = new Credit({
      creditId,
      referralId,
      referrerId: referral.referrerId,
      companyId: referral.companyId,
      amount: data.amount,
      type: data.type,
      triggeredBy: data.triggeredBy,
      status: 'completed',
      processedAt: new Date()
    });

    await credit.save();

    // Update referral status to rewarded
    referral.status = 'rewarded';
    referral.rewardAmount = data.amount;
    referral.rewardType = data.type;
    referral.rewardCreditedAt = new Date();
    await referral.save();

    logger.info('Referral credit issued', { creditId, referralId, amount: data.amount });
    return credit;
  }

  async getCreditsByReferrer(referrerId: string, companyId?: string): Promise<ICredit[]> {
    const query: Record<string, unknown> = { referrerId };
    if (companyId) {
      query['companyId'] = companyId;
    }
    return Credit.find(query).sort({ createdAt: -1 });
  }

  async createReward(referralId: string, data: Partial<IReward>): Promise<IReward> {
    const referral = await this.getReferralById(referralId);
    if (!referral) throw new Error('Referral not found');

    const rewardId = `rew_${uuidv4()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validUntil ? 0 : 30));

    const reward = new Reward({
      ...data,
      rewardId,
      referralId,
      referrerId: referral.referrerId,
      companyId: referral.companyId,
      status: 'issued',
      issuedAt: new Date(),
      validUntil: data.validUntil || validUntil
    });

    await reward.save();
    logger.info('Reward created', { rewardId, referralId });
    return reward;
  }

  async getRewardsByReferrer(referrerId: string): Promise<IReward[]> {
    return Reward.find({ referrerId }).sort({ issuedAt: -1 });
  }

  async claimReward(rewardId: string): Promise<IReward | null> {
    const reward = await Reward.findOne({ rewardId });
    if (!reward) return null;

    if (new Date() > reward.validUntil) {
      reward.status = 'expired';
      await reward.save();
      return reward;
    }

    reward.status = 'claimed';
    reward.claimedAt = new Date();
    await reward.save();

    logger.info('Reward claimed', { rewardId });
    return reward;
  }

  async getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    rewardedReferrals: number;
    totalEarnings: number;
    pendingCredits: number;
  }> {
    const referrals = await Referral.find({ referrerId });
    const credits = await this.getCreditsByReferrer(referrerId);

    return {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
      rewardedReferrals: referrals.filter(r => r.status === 'rewarded').length,
      totalEarnings: credits.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0),
      pendingCredits: credits.filter(c => c.status === 'pending').length
    };
  }

  async getTopReferrers(companyId: string, limit: number = 10): Promise<Array<{
    referrerId: string;
    totalReferrals: number;
    completedReferrals: number;
    totalEarnings: number;
  }>> {
    const referrals = await Referral.find({ companyId, status: { $in: ['completed', 'rewarded'] } });
    const credits = await Credit.find({ companyId, status: 'completed' });

    const referrerMap: Record<string, { total: number; completed: number; earnings: number }> = {};

    for (const referral of referrals) {
      if (!referrerMap[referral.referrerId]) {
        referrerMap[referral.referrerId] = { total: 0, completed: 0, earnings: 0 };
      }
      referrerMap[referral.referrerId].total++;
      if (referral.status === 'rewarded') {
        referrerMap[referral.referrerId].completed++;
      }
    }

    for (const credit of credits) {
      if (referrerMap[credit.referrerId]) {
        referrerMap[credit.referrerId].earnings += credit.amount;
      }
    }

    return Object.entries(referrerMap)
      .map(([referrerId, stats]) => ({ referrerId, ...stats }))
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);
  }
}

export const referralService = new ReferralService();