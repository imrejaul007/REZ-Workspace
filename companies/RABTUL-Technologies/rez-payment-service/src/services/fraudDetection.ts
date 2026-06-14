/**
 * Fraud Detection Service — velocity checks and fraud detection for payments.
 *
 * Provides:
 *   - Velocity checks: limits on transactions per hour and amount per hour
 *   - Amount limits: per-transaction maximums
 *   - Merchant risk monitoring: logs high-value transactions for review
 *
 * All checks run in parallel for performance.
 */

import { redis } from '../config/redis';
import { logger } from '../config/logger';

export interface FraudCheckResult {
  passed: boolean;
  reason?: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export class FraudDetectionService {
  private readonly VELOCITY_WINDOW_SECONDS = 3600; // 1 hour
  private readonly MAX_TRANSACTIONS_PER_HOUR = 10;
  private readonly MAX_AMOUNT_PER_HOUR = 50000; // INR
  private readonly MAX_AMOUNT_PER_TRANSACTION = 100000;

  /**
   * Runs all fraud checks in parallel and returns the highest-risk result.
   * @param userId - The user initiating the transaction
   * @param amount - Transaction amount in INR
   * @param merchantId - Optional merchant identifier for risk monitoring
   * @returns The fraud check result with highest risk level
   */
  async checkTransaction(userId: string, amount: number, merchantId?: string): Promise<FraudCheckResult> {
    const results = await Promise.all([
      this.checkVelocity(userId, amount),
      this.checkAmountLimits(amount),
      this.checkMerchantRisk(merchantId, amount),
    ]);

    // Return the highest risk level
    const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    const sortedResults = results.sort((a, b) =>
      riskOrder[b.risk] - riskOrder[a.risk]
    );

    return sortedResults[0];
  }

  /**
   * Checks transaction velocity: count per hour and total amount per hour.
   * Uses Redis INCR with expiry for atomic counting.
   */
  private async checkVelocity(userId: string, amount: number): Promise<FraudCheckResult> {
    const velocityKey = `fraud:velocity:${userId}`;
    const amountKey = `fraud:amount:${userId}`;

    // Increment both counter and amount atomically in parallel
    const [count, _] = await Promise.all([
      redis.incr(velocityKey),
      redis.incrbyfloat(amountKey, amount),
    ]);

    // Set expiry on first increment
    if (count === 1) {
      await Promise.all([
        redis.expire(velocityKey, this.VELOCITY_WINDOW_SECONDS),
        redis.expire(amountKey, this.VELOCITY_WINDOW_SECONDS),
      ]);
    }

    // Check transaction count limit
    if (count > this.MAX_TRANSACTIONS_PER_HOUR) {
      logger.warn('[FRAUD] Velocity limit exceeded: too many transactions per hour', {
        userId,
        count,
        limit: this.MAX_TRANSACTIONS_PER_HOUR,
      });
      return { passed: false, reason: 'Too many transactions per hour', risk: 'high' };
    }

    // Check amount limit per hour
    const totalAmountStr = await redis.get(amountKey);
    const totalAmount = parseFloat(totalAmountStr || '0');
    if (totalAmount > this.MAX_AMOUNT_PER_HOUR) {
      logger.warn('[FRAUD] Amount limit exceeded per hour', {
        userId,
        totalAmount,
        limit: this.MAX_AMOUNT_PER_HOUR,
      });
      return { passed: false, reason: 'Amount limit exceeded per hour', risk: 'critical' };
    }

    return { passed: true, risk: 'low' };
  }

  /**
   * Checks if single transaction amount exceeds limits.
   */
  private checkAmountLimits(amount: number): FraudCheckResult {
    if (amount > this.MAX_AMOUNT_PER_TRANSACTION) {
      logger.warn('[FRAUD] Single transaction exceeds limit', {
        amount,
        limit: this.MAX_AMOUNT_PER_TRANSACTION,
      });
      return { passed: false, reason: 'Single transaction exceeds limit', risk: 'high' };
    }
    return { passed: true, risk: 'low' };
  }

  /**
   * Monitors high-value transactions for merchant risk assessment.
   * Logs suspicious patterns for manual review.
   */
  private checkMerchantRisk(merchantId: string | undefined, amount: number): FraudCheckResult {
    // High-value merchants with low amounts could indicate fraud
    if (amount > 50000 && merchantId) {
      logger.warn('[FRAUD] High-value transaction detected', {
        merchantId,
        amount,
        threshold: 50000,
      });
    }
    return { passed: true, risk: 'low' };
  }

  /**
   * Resets velocity counters for a user (for testing or account recovery).
   */
  async resetUserVelocity(userId: string): Promise<void> {
    await Promise.all([
      redis.del(`fraud:velocity:${userId}`),
      redis.del(`fraud:amount:${userId}`),
    ]);
    logger.info('[FRAUD] User velocity counters reset', { userId });
  }

  /**
   * Gets current velocity stats for a user (for monitoring/debugging).
   */
  async getUserVelocityStats(userId: string): Promise<{
    transactionCount: number;
    totalAmount: number;
    ttlSeconds: number;
  }> {
    const [countStr, amountStr, ttl] = await Promise.all([
      redis.get(`fraud:velocity:${userId}`),
      redis.get(`fraud:amount:${userId}`),
      redis.ttl(`fraud:velocity:${userId}`),
    ]);

    return {
      transactionCount: parseInt(countStr || '0', 10),
      totalAmount: parseFloat(amountStr || '0'),
      ttlSeconds: ttl > 0 ? ttl : 0,
    };
  }
}

// Singleton instance for use across the service
export const fraudDetection = new FraudDetectionService();
