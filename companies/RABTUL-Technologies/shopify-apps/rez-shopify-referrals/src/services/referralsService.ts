import crypto from 'crypto';
import { ReferralProgram, Referral, ReferralShare, ReferralStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ReferralsService {
  private programs: Map<string, ReferralProgram> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private userReferrals: Map<string, Set<string>> = new Map();
  private referralCodes: Map<string, string> = new Map();
  private shares: Map<string, ReferralShare[]> = new Map();

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[crypto.randomInt(chars.length)];
    }
    return code;
  }

  createProgram(programData: Omit<ReferralProgram, 'id' | 'referralCode' | 'createdAt' | 'updatedAt'>): ReferralProgram {
    const id = crypto.randomUUID();
    let code = this.generateCode();
    while (this.referralCodes.has(code)) {
      code = this.generateCode();
    }

    const program: ReferralProgram = {
      ...programData,
      id,
      referralCode: code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.programs.set(id, program);
    logger.info(`Referral program created: ${id} with code ${code}`);
    return program;
  }

  getProgram(id: string): ReferralProgram | undefined {
    return this.programs.get(id);
  }

  getProgramByCode(code: string): ReferralProgram | undefined {
    const programId = this.referralCodes.get(code.toUpperCase());
    return programId ? this.programs.get(programId) : undefined;
  }

  getShopPrograms(shopId: string): ReferralProgram[] {
    return Array.from(this.programs.values()).filter(p => p.shopifyShopId === shopId && p.isActive);
  }

  updateProgram(id: string, updates: Partial<ReferralProgram>): ReferralProgram | undefined {
    const program = this.programs.get(id);
    if (!program) return undefined;

    const updated = { ...program, ...updates, id, updatedAt: new Date().toISOString() };
    this.programs.set(id, updated);
    return updated;
  }

  createReferral(programId: string, referrerId: string, refereeId?: string): Referral | null {
    const program = this.programs.get(programId);
    if (!program || !program.isActive) {
      logger.warn(`Cannot create referral: program not found or inactive`, { programId });
      return null;
    }

    if (program.endDate && new Date(program.endDate) < new Date()) {
      logger.warn(`Cannot create referral: program expired`, { programId });
      return null;
    }

    const existingReferrals = this.getUserReferrals(referrerId);
    if (program.maxRewardsPerUser && existingReferrals.length >= program.maxRewardsPerUser) {
      logger.warn(`Referrer exceeded max rewards`, { referrerId, programId });
      return null;
    }

    const id = crypto.randomUUID();
    const referral: Referral = {
      id,
      programId,
      referrerId,
      refereeId,
      referralCode: program.referralCode!,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    this.referrals.set(id, referral);
    if (!this.userReferrals.has(referrerId)) {
      this.userReferrals.set(referrerId, new Set());
    }
    this.userReferrals.get(referrerId)!.add(id);

    logger.info(`Referral created`, { referralId: id, referrerId, programId });
    return referral;
  }

  convertReferral(referralId: string, refereeId: string, orderAmount: number): Referral | undefined {
    const referral = this.referrals.get(referralId);
    if (!referral || referral.status !== 'pending') return undefined;

    const program = this.programs.get(referral.programId);
    if (!program) return undefined;

    if (orderAmount < program.minPurchaseAmount) {
      logger.warn(`Order below minimum`, { orderAmount, min: program.minPurchaseAmount });
      return undefined;
    }

    let rewardAmount = 0;
    switch (program.rewardType) {
      case 'fixed': rewardAmount = program.rewardValue; break;
      case 'percentage': rewardAmount = orderAmount * (program.rewardValue / 100); break;
      case 'points': rewardAmount = Math.floor(orderAmount); break;
      case 'free_shipping': rewardAmount = 0; break;
    }

    referral.refereeId = refereeId;
    referral.status = 'converted';
    referral.rewardAmount = rewardAmount;
    referral.rewardType = program.rewardType;
    referral.conversionDate = new Date().toISOString();
    referral.updatedAt = new Date().toISOString();

    this.referrals.set(referralId, referral);
    logger.info(`Referral converted`, { referralId, rewardAmount, rewardType: program.rewardType });
    return referral;
  }

  rewardReferral(referralId: string): Referral | undefined {
    const referral = this.referrals.get(referralId);
    if (!referral || referral.status !== 'converted') return undefined;

    referral.status = 'rewarded';
    referral.updatedAt = new Date().toISOString();
    this.referrals.set(referralId, referral);

    logger.info(`Referral rewarded`, { referralId, amount: referral.rewardAmount });
    return referral;
  }

  getReferral(id: string): Referral | undefined {
    return this.referrals.get(id);
  }

  getUserReferrals(userId: string): Referral[] {
    const referralIds = this.userReferrals.get(userId) || new Set();
    return Array.from(referralIds).map(id => this.referrals.get(id)).filter((r): r is Referral => !!r);
  }

  getReferralByCode(code: string): Referral | undefined {
    for (const referral of this.referrals.values()) {
      if (referral.referralCode === code.toUpperCase() && referral.status === 'pending') {
        return referral;
      }
    }
    return undefined;
  }

  recordShare(referralId: string, channel: ReferralShare['channel'], recipient?: string, message?: string): void {
    if (!this.shares.has(referralId)) {
      this.shares.set(referralId, []);
    }
    this.shares.get(referralId)!.push({
      referralId,
      channel,
      recipient,
      message,
      sharedAt: new Date().toISOString()
    });
    logger.debug(`Share recorded`, { referralId, channel });
  }

  getShares(referralId: string): ReferralShare[] {
    return this.shares.get(referralId) || [];
  }

  getStats(programId: string): ReferralStats {
    const program = this.programs.get(programId);
    const programReferrals = Array.from(this.referrals.values()).filter(r => r.programId === programId);

    const totalReferrals = programReferrals.length;
    const convertedReferrals = programReferrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length;
    const pendingReferrals = programReferrals.filter(r => r.status === 'pending').length;
    const totalRewards = programReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    const referrerStats = new Map<string, { count: number; rewards: number }>();
    for (const referral of programReferrals) {
      const stats = referrerStats.get(referral.referrerId) || { count: 0, rewards: 0 };
      stats.count++;
      stats.rewards += referral.rewardAmount || 0;
      referrerStats.set(referral.referrerId, stats);
    }

    const topReferrers = Array.from(referrerStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([referrerId, stats]) => ({
        referrerId,
        referralCount: stats.count,
        totalRewards: Math.round(stats.rewards * 100) / 100
      }));

    return {
      programId,
      totalReferrals,
      convertedReferrals,
      pendingReferrals,
      conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 10000) / 100 : 0,
      totalRewardsGiven: Math.round(totalRewards * 100) / 100,
      avgRewardValue: convertedReferrals > 0 ? Math.round((totalRewards / convertedReferrals) * 100) / 100 : 0,
      topReferrers
    };
  }
}

export const referralsService = new ReferralsService();
