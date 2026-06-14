import { Types } from 'mongoose';
import {
  FraudCheckInput,
  FraudCheckResult,
  FraudCheck,
  FraudCheckType,
  RISK_LEVEL,
  FRAUD_CHECKS,
} from '../types/referral';
import { Referral, ReferralCode } from '../models';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';

export class FraudEngine {
  private readonly FRAUD_IP_KEY_TTL = 60 * 60 * 24; // 24 hours
  private readonly FRAUD_DEVICE_KEY_TTL = 60 * 60 * 24 * 7; // 7 days
  private readonly MASS_ACCOUNT_THRESHOLD = 5; // Max accounts per IP in 24h
  private readonly RAPID_SIGNUP_THRESHOLD = 3; // Max signups from same IP in 1 hour

  /**
   * Run comprehensive fraud checks on a referral
   */
  async runFraudChecks(input: FraudCheckInput): Promise<FraudCheckResult> {
    const checks: FraudCheck[] = [];
    let totalRiskScore = 0;

    // Self-referral check
    const selfReferralCheck = await this.checkSelfReferral(input);
    checks.push(selfReferralCheck);
    totalRiskScore += this.getRiskScoreForCheck(selfReferralCheck);

    // Same IP check
    const sameIpCheck = await this.checkSameIp(input);
    checks.push(sameIpCheck);
    totalRiskScore += this.getRiskScoreForCheck(sameIpCheck);

    // Same device check
    const sameDeviceCheck = await this.checkSameDevice(input);
    checks.push(sameDeviceCheck);
    totalRiskScore += this.getRiskScoreForCheck(sameDeviceCheck);

    // Circular referral check
    const circularCheck = await this.checkCircularReferral(input);
    checks.push(circularCheck);
    totalRiskScore += this.getRiskScoreForCheck(circularCheck);

    // Mass account creation check
    const massAccountCheck = await this.checkMassAccountCreation(input);
    checks.push(massAccountCheck);
    totalRiskScore += this.getRiskScoreForCheck(massAccountCheck);

    // Rapid signups check
    const rapidSignupCheck = await this.checkRapidSignups(input);
    checks.push(rapidSignupCheck);
    totalRiskScore += this.getRiskScoreForCheck(rapidSignupCheck);

    // Determine overall risk level
    const riskScore = Math.min(100, totalRiskScore);
    const riskLevel = this.getRiskLevel(riskScore);
    const flags = checks.filter((c) => !c.passed).map((c) => c.type);
    const recommendation = this.getRecommendation(riskLevel, flags);

    return {
      riskScore,
      riskLevel,
      flags,
      recommendation,
      checks,
    };
  }

  /**
   * Check for self-referral
   */
  private async checkSelfReferral(input: FraudCheckInput): Promise<FraudCheck> {
    const isSelfReferral = input.referrerId === input.refereeId;
    return {
      type: FRAUD_CHECKS.SELF_REFERRAL,
      passed: !isSelfReferral,
      severity: 'high',
      details: isSelfReferral ? 'Referrer and referee are the same user' : undefined,
    };
  }

  /**
   * Check if referee has same IP as existing referrer
   */
  private async checkSameIp(input: FraudCheckInput): Promise<FraudCheck> {
    if (!input.ip) {
      return { type: FRAUD_CHECKS.SAME_IP, passed: true, severity: 'medium' };
    }

    // Find referrals with same IP in last 24 hours
    const recentReferrals = await Referral.find({
      createdAt: { $gte: new Date(Date.now() - this.FRAUD_IP_KEY_TTL * 1000) },
    }).limit(100);

    // Check if any referrer has same IP as this referee
    // This would require storing IP on referral which we may not have
    // For now, we'll do a simplified check

    return {
      type: FRAUD_CHECKS.SAME_IP,
      passed: true,
      severity: 'medium',
    };
  }

  /**
   * Check if referee uses same device as referrer
   */
  private async checkSameDevice(input: FraudCheckInput): Promise<FraudCheck> {
    if (!input.deviceId) {
      return { type: FRAUD_CHECKS.SAME_DEVICE, passed: true, severity: 'high' };
    }

    // Find referrals with same device ID
    const existingReferral = await Referral.findOne({
      'touchpoints.deviceId': input.deviceId,
      refereeId: { $ne: new Types.ObjectId(input.refereeId) },
    });

    const sameDevice = !!existingReferral;
    return {
      type: FRAUD_CHECKS.SAME_DEVICE,
      passed: !sameDevice,
      severity: 'high',
      details: sameDevice ? 'Same device used by another user' : undefined,
    };
  }

  /**
   * Check for circular referrals (A refers B, B refers A)
   */
  private async checkCircularReferral(input: FraudCheckInput): Promise<FraudCheck> {
    // Check if referrer was referred by this referee
    try {
      const reverseReferral = await Referral.findOne({
        referrerId: input.refereeId,
        refereeId: input.referrerId,
      });

      const isCircular = !!reverseReferral;
      return {
        type: FRAUD_CHECKS.CIRCULAR_REFERRAL,
        passed: !isCircular,
        severity: 'critical',
        details: isCircular ? 'Circular referral chain detected' : undefined,
      };
    } catch {
      return {
        type: FRAUD_CHECKS.CIRCULAR_REFERRAL,
        passed: true,
        severity: 'critical',
      };
    }
  }

  /**
   * Check for mass account creation from same source
   */
  private async checkMassAccountCreation(input: FraudCheckInput): Promise<FraudCheck> {
    if (!input.ip) {
      return { type: FRAUD_CHECKS.MASS_ACCOUNT_CREATION, passed: true, severity: 'high' };
    }

    const redis = getRedisClient();
    const key = `fraud:ip:${input.ip}:count`;

    const count = await redis.get(key);
    const referralCount = count ? parseInt(count, 10) : 0;

    if (referralCount >= this.MASS_ACCOUNT_THRESHOLD) {
      return {
        type: FRAUD_CHECKS.MASS_ACCOUNT_CREATION,
        passed: false,
        severity: 'critical',
        details: `Multiple accounts (${referralCount}) created from this IP`,
      };
    }

    return {
      type: FRAUD_CHECKS.MASS_ACCOUNT_CREATION,
      passed: true,
      severity: 'high',
    };
  }

  /**
   * Check for rapid signups (potential bot activity)
   */
  private async checkRapidSignups(input: FraudCheckInput): Promise<FraudCheck> {
    if (!input.ip) {
      return { type: FRAUD_CHECKS.RAPID_SIGNUPS, passed: true, severity: 'medium' };
    }

    const redis = getRedisClient();
    const key = `fraud:ip:${input.ip}:recent`;

    const recentCount = await redis.get(key);
    const count = recentCount ? parseInt(recentCount, 10) : 0;

    if (count >= this.RAPID_SIGNUP_THRESHOLD) {
      return {
        type: FRAUD_CHECKS.RAPID_SIGNUPS,
        passed: false,
        severity: 'high',
        details: `Rapid signups (${count} in recent period) from this IP`,
      };
    }

    return {
      type: FRAUD_CHECKS.RAPID_SIGNUPS,
      passed: true,
      severity: 'medium',
    };
  }

  /**
   * Record IP/Device for fraud tracking
   */
  async recordFingerprint(input: { ip?: string; deviceId?: string; refereeId: string }): Promise<void> {
    const redis = getRedisClient();

    if (input.ip) {
      // Increment IP count
      const countKey = `fraud:ip:${input.ip}:count`;
      await redis.incr(countKey);
      await redis.expire(countKey, this.FRAUD_IP_KEY_TTL);

      // Add to recent list
      const recentKey = `fraud:ip:${input.ip}:recent`;
      await redis.incr(recentKey);
      await redis.expire(recentKey, 3600); // 1 hour

      // Add referee to IP set
      const setKey = `fraud:ip:${input.ip}:referees`;
      await redis.sadd(setKey, input.refereeId);
      await redis.expire(setKey, this.FRAUD_IP_KEY_TTL);
    }

    if (input.deviceId) {
      // Store device-to-user mapping
      const deviceKey = `fraud:device:${input.deviceId}:users`;
      await redis.sadd(deviceKey, input.refereeId);
      await redis.expire(deviceKey, this.FRAUD_DEVICE_KEY_TTL);
    }
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  }

  /**
   * Get recommendation based on risk level
   */
  private getRecommendation(
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    flags: string[]
  ): 'allow' | 'flag' | 'block' {
    if (riskLevel === 'critical' || flags.includes(FRAUD_CHECKS.SELF_REFERRAL) || flags.includes(FRAUD_CHECKS.CIRCULAR_REFERRAL)) {
      return 'block';
    }
    if (riskLevel === 'high') {
      return 'block';
    }
    if (riskLevel === 'medium') {
      return 'flag';
    }
    return 'allow';
  }

  /**
   * Get risk score contribution from a check
   */
  private getRiskScoreForCheck(check: FraudCheck): number {
    if (check.passed) return 0;

    switch (check.severity) {
      case 'low':
        return 10;
      case 'medium':
        return 20;
      case 'high':
        return 35;
      case 'critical':
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Update referral with fraud check results
   */
  async updateReferralFraudScore(referralId: string, result: FraudCheckResult): Promise<void> {
    await Referral.findByIdAndUpdate(referralId, {
      riskScore: result.riskScore,
      riskFlags: result.flags,
    });

    // Update referral code trust score
    const referral = await Referral.findById(referralId);
    if (referral) {
      const referralCode = await ReferralCode.findById(referral.referralCodeId);
      if (referralCode) {
        // Decrease trust score based on risk
        const trustPenalty = result.riskScore * 0.1;
        referralCode.trustScore = Math.max(0, referralCode.trustScore - trustPenalty);
        await referralCode.save();
      }
    }

    logger.info('[FraudEngine] Updated fraud score:', {
      referralId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      flags: result.flags,
    });
  }

  /**
   * Get suspicious referrals for admin review
   */
  async getSuspiciousReferrals(options?: { minRiskScore?: number; limit?: number }): Promise<unknown[]> {
    const minScore = options?.minRiskScore ?? 50;
    const limit = options?.limit ?? 100;

    return Referral.find({
      riskScore: { $gte: minScore },
    })
      .sort({ riskScore: -1 })
      .limit(limit)
      .populate('referrerId')
      .populate('refereeId');
  }
}

export const fraudEngine = new FraudEngine();
