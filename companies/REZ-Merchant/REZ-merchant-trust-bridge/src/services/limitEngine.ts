import { CreditLimit, LimitCalculationRule, TrustScore } from '../types';
import { CreditLimitModel, ITrustScoreDocument } from '../models';
import { TrustScoreModel } from '../models';
import { config } from '../config';
import { limitEngineLogger as logger } from '../utils/logger';
import { alertService, AlertType } from './alertService';

interface LimitCalculationInput {
  merchantId: string;
  trustScore: TrustScore;
  currentVolume?: number;
  businessAge?: number;
  requestedLimit?: number;
}

interface LimitCalculationResult {
  merchantId: string;
  calculatedLimit: number;
  previousLimit: number;
  change: number;
  changePercent: number;
  reason: string;
  rule: LimitCalculationRule;
  isBlocked: boolean;
  blockReason?: string;
}

interface MerchantLimitCheck {
  merchantId: string;
  requestedAmount: number;
  currentAvailable: number;
  canProceed: boolean;
  maxAllowed: number;
  utilizationPercent: number;
}

export class LimitEngineService {
  /**
   * Calculate credit limit based on trust score
   */
  async calculateLimit(input: LimitCalculationInput): Promise<LimitCalculationResult> {
    const { merchantId, trustScore, currentVolume = 0, businessAge = 0, requestedLimit } = input;

    // Find applicable rule
    const rule = this.findApplicableRule(trustScore.score, trustScore.riskLevel);

    if (!rule) {
      logger.error('No applicable limit rule found', {
        merchantId,
        score: trustScore.score,
        riskLevel: trustScore.riskLevel,
      });
      throw new Error('No applicable limit rule found');
    }

    // Calculate base limit
    let calculatedLimit = rule.baseLimit;

    // Apply volume multiplier
    if (currentVolume > 0) {
      const volumeMultiplier = Math.min(currentVolume / 1000000, 3); // Max 3x for 1 crore+
      calculatedLimit *= 1 + volumeMultiplier * 0.2;
    }

    // Apply business age bonus
    if (businessAge > 0) {
      const ageMultiplier = Math.min(businessAge / 5, 2); // Max 2x for 5+ years
      calculatedLimit *= 1 + ageMultiplier * 0.1;
    }

    // Apply limit multiplier from rule
    calculatedLimit *= rule.limitMultiplier;

    // Apply score-based adjustment
    const scoreInRange = (trustScore.score - rule.minScore) / (rule.maxScore - rule.minScore);
    calculatedLimit *= 0.5 + scoreInRange * 0.5; // 50% to 100% of calculated limit based on score position

    // Respect min/max limits
    calculatedLimit = Math.max(rule.minLimit, Math.min(rule.maxLimit, calculatedLimit));

    // Check if this is a requested limit
    if (requestedLimit && requestedLimit < calculatedLimit) {
      calculatedLimit = requestedLimit;
    }

    // Determine if merchant should be blocked
    const isBlocked = this.shouldBlockMerchant(trustScore);
    const blockReason = isBlocked ? this.getBlockReason(trustScore) : undefined;

    if (isBlocked) {
      calculatedLimit = 0;
    }

    // Get previous limit
    const previousRecord = await CreditLimitModel.findOne({ merchantId });
    const previousLimit = previousRecord?.currentLimit || 0;

    // Calculate change
    const change = calculatedLimit - previousLimit;
    const changePercent = previousLimit > 0 ? (change / previousLimit) * 100 : 100;

    // Save the new limit
    await this.saveLimit(merchantId, calculatedLimit, trustScore, rule, isBlocked, blockReason);

    // Generate reason message
    const reason = this.generateLimitReason(trustScore, rule, currentVolume, businessAge);

    logger.info(`Calculated credit limit for ${merchantId}`, {
      previousLimit,
      newLimit: calculatedLimit,
      changePercent: changePercent.toFixed(2),
      riskLevel: trustScore.riskLevel,
      isBlocked,
    });

    // Trigger alerts if needed
    if (Math.abs(changePercent) > 20) {
      await alertService.createAlert({
        merchantId,
        alertType: 'LIMIT_THRESHOLD',
        severity: change > 0 ? 'INFO' : 'WARNING',
        message: `Credit limit ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}%`,
        previousScore: previousLimit,
        currentScore: calculatedLimit,
      });
    }

    return {
      merchantId,
      calculatedLimit,
      previousLimit,
      change,
      changePercent,
      reason,
      rule,
      isBlocked,
      blockReason,
    };
  }

  /**
   * Find the applicable rule for a given score and risk level
   */
  private findApplicableRule(
    score: number,
    riskLevel: TrustScore['riskLevel']
  ): LimitCalculationRule | null {
    // First try to find exact risk level match
    let rule = config.limitRules.find(
      (r) => r.riskLevel === riskLevel && score >= r.minScore && score <= r.maxScore
    );

    // Fall back to any matching score range
    if (!rule) {
      rule = config.limitRules.find((r) => score >= r.minScore && score <= r.maxScore);
    }

    return rule || null;
  }

  /**
   * Check if merchant should be blocked
   */
  private shouldBlockMerchant(trustScore: TrustScore): boolean {
    // Block if score is critical
    if (trustScore.score < config.alertThresholds.criticalScore) {
      return true;
    }

    // Block if risk level is CRITICAL
    if (trustScore.riskLevel === 'CRITICAL') {
      return true;
    }

    // Block if compliance score is very low
    if (trustScore.factors.complianceScore < 30) {
      return true;
    }

    // Block if dispute rate is extremely high
    if (trustScore.factors.disputeRate > 80) {
      return true;
    }

    return false;
  }

  /**
   * Get block reason
   */
  private getBlockReason(trustScore: TrustScore): string {
    const reasons: string[] = [];

    if (trustScore.score < config.alertThresholds.criticalScore) {
      reasons.push(`Critical trust score (${trustScore.score})`);
    }

    if (trustScore.riskLevel === 'CRITICAL') {
      reasons.push('Critical risk level');
    }

    if (trustScore.factors.complianceScore < 30) {
      reasons.push(`Low compliance score (${trustScore.factors.complianceScore})`);
    }

    if (trustScore.factors.disputeRate > 80) {
      reasons.push(`High dispute rate (${trustScore.factors.disputeRate})`);
    }

    return reasons.join(', ');
  }

  /**
   * Generate human-readable limit calculation reason
   */
  private generateLimitReason(
    trustScore: TrustScore,
    rule: LimitCalculationRule,
    volume: number,
    businessAge: number
  ): string {
    const parts: string[] = [];

    parts.push(`Trust score ${trustScore.score} (${trustScore.riskLevel} risk)`);

    if (volume > 0) {
      parts.push(`volume adjustment ${(volume / 100000).toFixed(1)}L`);
    }

    if (businessAge > 0) {
      parts.push(`${businessAge} years in business`);
    }

    parts.push(`based on ${rule.minScore}-${rule.maxScore} score tier`);

    return parts.join(', ');
  }

  /**
   * Save calculated limit to database
   */
  private async saveLimit(
    merchantId: string,
    limit: number,
    trustScore: TrustScore,
    rule: LimitCalculationRule,
    isBlocked: boolean,
    blockReason?: string
  ): Promise<void> {
    const existingRecord = await CreditLimitModel.findOne({ merchantId });
    const previousLimit = existingRecord?.currentLimit || 0;
    const now = new Date();

    if (existingRecord) {
      existingRecord.currentLimit = limit;
      existingRecord.availableLimit = isBlocked ? 0 : limit - existingRecord.usedLimit;
      existingRecord.creditUtilization = limit > 0 ? (existingRecord.usedLimit / limit) * 100 : 100;
      existingRecord.lastCalculated = now;
      existingRecord.isBlocked = isBlocked;
      existingRecord.blockReason = blockReason;
      existingRecord.blockedAt = isBlocked ? now : undefined;

      if (previousLimit !== limit) {
        existingRecord.calculationHistory.push({
          timestamp: now,
          previousLimit,
          newLimit: limit,
          reason: `Trust score ${trustScore.score} (${trustScore.riskLevel})`,
          trustScore: trustScore.score,
        });

        // Keep only last 100 entries
        if (existingRecord.calculationHistory.length > 100) {
          existingRecord.calculationHistory = existingRecord.calculationHistory.slice(-100);
        }
      }

      await existingRecord.save();
    } else {
      const newRecord = new CreditLimitModel({
        merchantId,
        currentLimit: limit,
        availableLimit: isBlocked ? 0 : limit,
        usedLimit: 0,
        creditUtilization: 0,
        lastCalculated: now,
        isBlocked,
        blockReason,
        blockedAt: isBlocked ? now : undefined,
        calculationHistory: [
          {
            timestamp: now,
            previousLimit: 0,
            newLimit: limit,
            reason: `Initial limit based on trust score ${trustScore.score} (${trustScore.riskLevel})`,
            trustScore: trustScore.score,
          },
        ],
      });

      await newRecord.save();
    }
  }

  /**
   * Check if a transaction can proceed within limit
   */
  async checkLimit(merchantId: string, amount: number): Promise<MerchantLimitCheck> {
    const limitRecord = await CreditLimitModel.findOne({ merchantId });

    if (!limitRecord) {
      // No limit record exists, allow based on trust score
      const trustRecord = await TrustScoreModel.findOne({ merchantId });

      if (!trustRecord) {
        return {
          merchantId,
          requestedAmount: amount,
          currentAvailable: 0,
          canProceed: false,
          maxAllowed: 0,
          utilizationPercent: 100,
        };
      }

      // Calculate a temporary limit
      const result = await this.calculateLimit({
        merchantId,
        trustScore: {
          merchantId: trustRecord.merchantId,
          score: trustRecord.score,
          riskLevel: trustRecord.riskLevel as TrustScore['riskLevel'],
          factors: trustRecord.factors as TrustScore['factors'],
          lastUpdated: trustRecord.lastUpdated.toISOString(),
          source: trustRecord.source,
        },
      });

      return {
        merchantId,
        requestedAmount: amount,
        currentAvailable: result.calculatedLimit,
        canProceed: result.calculatedLimit >= amount && !result.isBlocked,
        maxAllowed: result.calculatedLimit,
        utilizationPercent: result.calculatedLimit > 0 ? 0 : 100,
      };
    }

    if (limitRecord.isBlocked) {
      return {
        merchantId,
        requestedAmount: amount,
        currentAvailable: 0,
        canProceed: false,
        maxAllowed: 0,
        utilizationPercent: 100,
      };
    }

    const canProceed =
      amount <= limitRecord.availableLimit &&
      limitRecord.availableLimit > 0;

    return {
      merchantId,
      requestedAmount: amount,
      currentAvailable: limitRecord.availableLimit,
      canProceed,
      maxAllowed: limitRecord.currentLimit,
      utilizationPercent: limitRecord.creditUtilization,
    };
  }

  /**
   * Update used limit (for transactions)
   */
  async updateUsedLimit(
    merchantId: string,
    amount: number,
    operation: 'ADD' | 'SUBTRACT'
  ): Promise<CreditLimit | null> {
    const record = await CreditLimitModel.findOne({ merchantId });

    if (!record) {
      logger.warn(`No credit limit record found for ${merchantId}`);
      return null;
    }

    if (operation === 'ADD') {
      record.usedLimit += amount;
      record.availableLimit = Math.max(0, record.currentLimit - record.usedLimit);
    } else {
      record.usedLimit = Math.max(0, record.usedLimit - amount);
      record.availableLimit = record.currentLimit - record.usedLimit;
    }

    record.creditUtilization =
      record.currentLimit > 0 ? (record.usedLimit / record.currentLimit) * 100 : 0;

    await record.save();

    logger.info(`Updated used limit for ${merchantId}`, {
      operation,
      amount,
      newUsedLimit: record.usedLimit,
      availableLimit: record.availableLimit,
      utilization: record.creditUtilization.toFixed(2),
    });

    // Check for high utilization alert
    if (record.creditUtilization > 80) {
      await alertService.createAlert({
        merchantId,
        alertType: 'LIMIT_THRESHOLD',
        severity: record.creditUtilization > 95 ? 'CRITICAL' : 'WARNING',
        message: `Credit utilization at ${record.creditUtilization.toFixed(1)}%`,
        currentScore: record.availableLimit,
      });
    }

    return {
      merchantId: record.merchantId,
      currentLimit: record.currentLimit,
      availableLimit: record.availableLimit,
      usedLimit: record.usedLimit,
      creditUtilization: record.creditUtilization,
      lastCalculated: record.lastCalculated.toISOString(),
      expiresAt: record.expiresAt?.toISOString(),
    };
  }

  /**
   * Recalculate limits for all merchants with trust scores
   */
  async recalculateAllLimits(): Promise<{
    processed: number;
    updated: number;
    blocked: number;
    errors: number;
  }> {
    const trustRecords = await TrustScoreModel.find({});
    let processed = 0;
    let updated = 0;
    let blocked = 0;
    let errors = 0;

    logger.info(`Starting bulk limit recalculation for ${trustRecords.length} merchants`);

    for (const record of trustRecords) {
      try {
        const result = await this.calculateLimit({
          merchantId: record.merchantId,
          trustScore: {
            merchantId: record.merchantId,
            score: record.score,
            riskLevel: record.riskLevel as TrustScore['riskLevel'],
            factors: record.factors as TrustScore['factors'],
            lastUpdated: record.lastUpdated.toISOString(),
            source: record.source,
          },
        });

        processed++;

        if (result.change !== 0) {
          updated++;
        }

        if (result.isBlocked) {
          blocked++;
        }
      } catch (err) {
        errors++;
        logger.error(`Failed to calculate limit for ${record.merchantId}`, {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    logger.info(`Bulk limit recalculation completed`, { processed, updated, blocked, errors });

    return { processed, updated, blocked, errors };
  }

  /**
   * Get current credit limit for a merchant
   */
  async getCreditLimit(merchantId: string): Promise<CreditLimit | null> {
    const record = await CreditLimitModel.findOne({ merchantId });

    if (!record) {
      return null;
    }

    return {
      merchantId: record.merchantId,
      currentLimit: record.currentLimit,
      availableLimit: record.availableLimit,
      usedLimit: record.usedLimit,
      creditUtilization: record.creditUtilization,
      lastCalculated: record.lastCalculated.toISOString(),
      expiresAt: record.expiresAt?.toISOString(),
    };
  }

  /**
   * Get limit calculation history
   */
  async getLimitHistory(
    merchantId: string,
    limit = 30
  ): Promise<Array<{
    timestamp: string;
    previousLimit: number;
    newLimit: number;
    reason: string;
    trustScore: number;
  }>> {
    const record = await CreditLimitModel.findOne({ merchantId });

    if (!record) {
      return [];
    }

    return record.calculationHistory.slice(-limit).map((entry) => ({
      timestamp: entry.timestamp.toISOString(),
      previousLimit: entry.previousLimit,
      newLimit: entry.newLimit,
      reason: entry.reason,
      trustScore: entry.trustScore,
    }));
  }

  /**
   * Unblock a merchant
   */
  async unblockMerchant(merchantId: string, reason: string): Promise<boolean> {
    const record = await CreditLimitModel.findOne({ merchantId });

    if (!record) {
      logger.warn(`No credit limit record found for ${merchantId}`);
      return false;
    }

    if (!record.isBlocked) {
      logger.info(`Merchant ${merchantId} is not blocked`);
      return true;
    }

    // Recalculate limit
    const trustRecord = await TrustScoreModel.findOne({ merchantId });

    if (trustRecord) {
      const result = await this.calculateLimit({
        merchantId,
        trustScore: {
          merchantId: trustRecord.merchantId,
          score: trustRecord.score,
          riskLevel: trustRecord.riskLevel as TrustScore['riskLevel'],
          factors: trustRecord.factors as TrustScore['factors'],
          lastUpdated: trustRecord.lastUpdated.toISOString(),
          source: trustRecord.source,
        },
      });

      await alertService.createAlert({
        merchantId,
        alertType: 'BLOCK_TRIGGERED',
        severity: 'INFO',
        message: `Merchant unblocked: ${reason}`,
        currentScore: result.calculatedLimit,
      });

      return !result.isBlocked;
    }

    return false;
  }
}

// Export singleton instance
export const limitEngineService = new LimitEngineService();
export default limitEngineService;
