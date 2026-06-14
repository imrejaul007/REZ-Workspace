import { Types } from 'mongoose';
import { Referral, ReferralCode, ReferralReward } from '../models';
import { TEAM_REFERRAL_DEPTH } from '../types/referral';
import { logger } from '../utils/logger';

export interface TeamMember {
  referrerId: string;
  level: number;
  reward: number;
  percentage: number;
  timestamp: Date;
}

export interface TeamReferralResult {
  hasTeam: boolean;
  depth: number;
  members: TeamMember[];
  totalRewards: number;
}

export class TeamEngine {
  /**
   * Build referral team chain for a user
   */
  async buildTeamChain(userId: string, maxDepth = 3): Promise<TeamMember[]> {
    const chain: TeamMember[] = [];
    let currentUserId = userId;
    let currentLevel = 1;

    while (currentLevel <= maxDepth) {
      const referral = await Referral.findOne({
        refereeId: new Types.ObjectId(currentUserId),
      });

      if (!referral) break;

      const referrerCode = await ReferralCode.findById(referral.referralCodeId);

      // Calculate reward percentage based on level
      let percentage = 0;
      switch (currentLevel) {
        case 1:
          percentage = TEAM_REFERRAL_DEPTH.level1 * 100;
          break;
        case 2:
          percentage = TEAM_REFERRAL_DEPTH.level2 * 100;
          break;
        case 3:
          percentage = TEAM_REFERRAL_DEPTH.level3 * 100;
          break;
      }

      chain.push({
        referrerId: referral.referrerId.toString(),
        level: currentLevel,
        reward: 0, // To be calculated
        percentage,
        timestamp: referral.createdAt,
      });

      currentUserId = referral.referrerId.toString();
      currentLevel++;
    }

    return chain;
  }

  /**
   * Get full team referral result
   */
  async getTeamReferralResult(userId: string): Promise<TeamReferralResult> {
    const chain = await this.buildTeamChain(userId, 3);

    return {
      hasTeam: chain.length > 0,
      depth: chain.length,
      members: chain,
      totalRewards: 0, // Calculated when base reward is known
    };
  }

  /**
   * Calculate team rewards for a conversion
   */
  async calculateTeamRewards(
    baseReward: number,
    refereeId: string
  ): Promise<TeamMember[]> {
    const chain = await this.buildTeamChain(refereeId, 3);

    return chain.map((member) => ({
      ...member,
      reward: Math.floor(baseReward * member.percentage / 100),
    }));
  }

  /**
   * Distribute team rewards
   */
  async distributeTeamRewards(
    baseReward: number,
    refereeId: string,
    options?: {
      referralId?: string;
      campaignId?: string;
      companyId?: string;
    }
  ): Promise<Array<{
    referrerId: string;
    level: number;
    reward: number;
    success: boolean;
  }>> {
    const rewards = await this.calculateTeamRewards(baseReward, refereeId);
    const results: Array<{
      referrerId: string;
      level: number;
      reward: number;
      success: boolean;
    }> = [];

    for (const teamMember of rewards) {
      if (teamMember.reward <= 0) continue;

      try {
        // Create reward record for each team member
        await ReferralReward.create({
          referralId: options?.referralId
            ? new Types.ObjectId(options.referralId)
            : undefined,
          referrerId: new Types.ObjectId(teamMember.referrerId),
          refereeId: new Types.ObjectId(refereeId),
          type: 'coins',
          amount: teamMember.reward,
          coinType: 'referral',
          status: 'pending',
          source: 'team_bonus',
          campaignId: options?.campaignId
            ? new Types.ObjectId(options.campaignId)
            : undefined,
          companyId: options?.companyId || 'rez',
        });

        // Update referral code earnings
        const referralCode = await ReferralCode.findOne({
          ownerId: new Types.ObjectId(teamMember.referrerId),
        });
        if (referralCode) {
          await referralCode.addEarnings(teamMember.reward);
        }

        results.push({
          referrerId: teamMember.referrerId,
          level: teamMember.level,
          reward: teamMember.reward,
          success: true,
        });

        logger.info('[TeamEngine] Distributed team reward:', {
          referrerId: teamMember.referrerId,
          level: teamMember.level,
          reward: teamMember.reward,
        });
      } catch (error) {
        logger.error('[TeamEngine] Failed to distribute team reward:', {
          referrerId: teamMember.referrerId,
          error: (error as Error).message,
        });
        results.push({
          referrerId: teamMember.referrerId,
          level: teamMember.level,
          reward: 0,
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Get team stats for a user
   */
  async getTeamStats(userId: string): Promise<{
    directReferrals: number;
    level2Referrals: number;
    level3Referrals: number;
    totalTeamSize: number;
    teamEarnings: number;
  }> {
    // Count direct referrals
    const directReferrals = await Referral.countDocuments({
      referrerId: new Types.ObjectId(userId),
    });

    // Get direct referral IDs
    const directReferralsList = await Referral.find({
      referrerId: new Types.ObjectId(userId),
    }).select('_id refereeId');

    // Count level 2 (referrals of direct referrals)
    let level2Referrals = 0;
    const level2ReferrerIds = directReferralsList.map((r) => r.refereeId.toString());

    for (const refId of level2ReferrerIds) {
      const count = await Referral.countDocuments({
        referrerId: new Types.ObjectId(refId),
      });
      level2Referrals += count;
    }

    // For level 3, we'd need to go deeper (omitted for performance)
    const totalTeamSize = directReferrals + level2Referrals;

    // Get team earnings
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(userId),
    });
    const teamEarnings = referralCode?.lifetimeEarnings || 0;

    return {
      directReferrals,
      level2Referrals,
      level3Referrals: 0, // Placeholder
      totalTeamSize,
      teamEarnings,
    };
  }
}

export const teamEngine = new TeamEngine();
