import { v4 as uuidv4 } from 'uuid';
import { Tier, ITier, Benefit, IBenefit, Member, IMember, Upgrade, IUpgrade } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('TierService');

export class TierService {
  async createTier(data: Partial<ITier>): Promise<ITier> {
    const tierId = `tier_${uuidv4()}`;
    const tier = new Tier({ ...data, tierId });
    await tier.save();
    logger.info('Tier created', { tierId, name: data.name });
    return tier;
  }

  async getTierById(tierId: string): Promise<ITier | null> {
    return Tier.findOne({ tierId, isActive: true });
  }

  async getTierByLevel(level: number): Promise<ITier | null> {
    return Tier.findOne({ level, isActive: true });
  }

  async updateTier(tierId: string, data: Partial<ITier>): Promise<ITier | null> {
    const tier = await Tier.findOneAndUpdate({ tierId }, data, { new: true });
    if (tier) {
      logger.info('Tier updated', { tierId });
    }
    return tier;
  }

  async getAllTiers(companyId?: string): Promise<ITier[]> {
    const query: Record<string, unknown> = { isActive: true };
    if (companyId) {
      query['companyId'] = companyId;
    }
    return Tier.find(query).sort({ level: 1 });
  }

  async getTierBenefits(tierId: string): Promise<IBenefit[]> {
    return Benefit.find({ tierId, isActive: true });
  }

  async createBenefit(tierId: string, data: Partial<IBenefit>): Promise<IBenefit> {
    const benefitId = `ben_${uuidv4()}`;
    const benefit = new Benefit({ ...data, tierId, benefitId });
    await benefit.save();
    logger.info('Benefit created', { benefitId, tierId });
    return benefit;
  }

  async getMemberById(memberId: string): Promise<IMember | null> {
    return Member.findOne({ memberId });
  }

  async getMemberByUserId(userId: string, companyId: string): Promise<IMember | null> {
    return Member.findOne({ userId, companyId });
  }

  async createMember(userId: string, companyId: string, tierId: string): Promise<IMember> {
    const memberId = `mem_${uuidv4()}`;
    const defaultTier = await this.getTierById(tierId);
    const member = new Member({
      memberId,
      userId,
      companyId,
      currentTierId: tierId,
      totalPoints: 0,
      lifetimePoints: 0,
      pointsToNextTier: defaultTier?.minPoints || 0
    });
    await member.save();
    logger.info('Member created', { memberId, userId, tierId });
    return member;
  }

  async updateMemberPoints(memberId: string, pointsDelta: number): Promise<IMember | null> {
    const member = await Member.findOne({ memberId });
    if (!member) return null;

    member.totalPoints = Math.max(0, member.totalPoints + pointsDelta);
    member.lifetimePoints += pointsDelta > 0 ? pointsDelta : 0;
    member.lastActivity = new Date();

    // Check for tier upgrade
    const nextTier = await this.getNextTier(member.currentTierId);
    if (nextTier && member.totalPoints >= nextTier.minPoints) {
      await this.upgradeMember(memberId, nextTier.tierId, 'points');
    }

    await member.save();
    return member;
  }

  async upgradeMember(memberId: string, toTierId: string, triggeredBy: 'points' | 'manual' | 'campaign' | 'system', approvedBy?: string): Promise<IUpgrade | null> {
    const member = await Member.findOne({ memberId });
    if (!member) return null;

    const fromTier = await this.getTierById(member.currentTierId);
    const toTier = await this.getTierById(toTierId);
    if (!fromTier || !toTier) return null;

    const upgrade = new Upgrade({
      upgradeId: `upg_${uuidv4()}`,
      memberId,
      userId: member.userId,
      fromTierId: member.currentTierId,
      toTierId,
      fromTierName: fromTier.name,
      toTierName: toTier.name,
      pointsAtUpgrade: member.totalPoints,
      reason: `Upgrade from ${fromTier.name} to ${toTier.name}`,
      triggeredBy,
      approvedBy
    });
    await upgrade.save();

    member.currentTierId = toTierId;
    member.upgradeCount++;
    member.pointsToNextTier = 0;
    await member.save();

    logger.info('Member upgraded', { memberId, from: fromTier.name, to: toTier.name, triggeredBy });
    return upgrade;
  }

  async getNextTier(currentTierId: string): Promise<ITier | null> {
    const currentTier = await this.getTierById(currentTierId);
    if (!currentTier) return null;
    return Tier.findOne({ level: currentTier.level + 1, isActive: true });
  }

  async getUpgradeHistory(memberId: string): Promise<IUpgrade[]> {
    return Upgrade.find({ memberId }).sort({ createdAt: -1 });
  }

  async getMemberStats(companyId?: string): Promise<{
    totalMembers: number;
    byTier: Record<string, number>;
    averagePoints: number;
    topMembers: IMember[];
  }> {
    const query: Record<string, unknown> = { status: 'active' };
    if (companyId) {
      query['companyId'] = companyId;
    }

    const members = await Member.find(query);
    const tiers = await this.getAllTiers(companyId);

    const byTier: Record<string, number> = {};
    for (const tier of tiers) {
      byTier[tier.name] = members.filter(m => m.currentTierId === tier.tierId).length;
    }

    const totalPoints = members.reduce((sum, m) => sum + m.totalPoints, 0);

    return {
      totalMembers: members.length,
      byTier,
      averagePoints: members.length > 0 ? totalPoints / members.length : 0,
      topMembers: members.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10)
    };
  }
}

export const tierService = new TierService();