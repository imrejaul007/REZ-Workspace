/**
 * Batch Processing Service for REZ Referral OS
 * Handles bulk referral operations efficiently
 */

import { Types } from 'mongoose';
import { Referral, ReferralReward } from '../models';
import { rewardEngine } from './rewardEngine';
import { eventPublisher } from './eventPublisher';
import { logger } from '../utils/logger';

interface BatchItem {
  referrerId: string;
  refereeId: string;
  referralCode: string;
  type: 'consumer' | 'merchant' | 'creator';
  companyId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

interface BatchResult {
  success: number;
  failed: number;
  errors: Array<{ item: BatchItem; error: string }>;
}

export class BatchProcessor {
  private readonly BATCH_SIZE = 100;
  private readonly CONCURRENCY = 5;

  /**
   * Process batch referrals
   */
  async processBatch(items: BatchItem[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process in chunks
    for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
      const chunk = items.slice(i, i + this.BATCH_SIZE);
      const chunkResults = await this.processChunk(chunk);

      result.success += chunkResults.success;
      result.failed += chunkResults.failed;
      result.errors.push(...chunkResults.errors);
    }

    logger.info('[BatchProcessor] Batch complete:', {
      total: items.length,
      success: result.success,
      failed: result.failed,
    });

    return result;
  }

  /**
   * Process chunk with concurrency limit
   */
  private async processChunk(items: BatchItem[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process with limited concurrency
    for (let i = 0; i < items.length; i += this.CONCURRENCY) {
      const batch = items.slice(i, i + this.CONCURRENCY);
      const promises = batch.map((item) => this.processItem(item));

      const results = await Promise.allSettled(promises);

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            item: items[i + idx],
            error: res.reason?.message || 'Unknown error',
          });
        }
      });
    }

    return result;
  }

  /**
   * Process single referral
   */
  private async processItem(item: BatchItem): Promise<void> {
    // Check if already exists
    const existing = await Referral.findOne({
      refereeId: item.refereeId,
      referralCode: item.referralCode,
    });

    if (existing) {
      logger.debug('[BatchProcessor] Skipping duplicate:', item.refereeId);
      return;
    }

    // Create referral
    const referral = new Referral({
      referrerId: new Types.ObjectId(item.referrerId),
      refereeId: new Types.ObjectId(item.refereeId),
      referralCode: item.referralCode,
      type: item.type,
      status: 'registered',
      companyId: item.companyId || 'rez',
      campaignId: item.campaignId ? new Types.ObjectId(item.campaignId) : undefined,
      touchpoints: [{
        channel: 'batch_import',
        timestamp: new Date(),
      }],
      metadata: item.metadata,
    });

    await referral.save();

    // Publish event (simple publish, no type field in data)
    await eventPublisher.publish({
      type: 'referral.registered',
      data: {
        referralId: referral._id.toString(),
        referrerId: item.referrerId,
        refereeId: item.refereeId,
        referralCode: item.referralCode,
        companyId: item.companyId || 'rez',
      },
    });

    logger.debug('[BatchProcessor] Processed referral:', referral._id);
  }

  /**
   * Qualify batch referrals
   */
  async qualifyBatch(referralIds: string[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of referralIds) {
      try {
        const referral = await Referral.findById(id);
        if (!referral) {
          result.failed++;
          result.errors.push({
            item: { referrerId: id, refereeId: id, referralCode: '', type: 'consumer' },
            error: 'Referral not found',
          });
          continue;
        }

        if (referral.status !== 'registered') {
          result.failed++;
          result.errors.push({
            item: { referrerId: id, refereeId: id, referralCode: '', type: 'consumer' },
            error: `Cannot qualify status: ${referral.status}`,
          });
          continue;
        }

        // Update status
        referral.status = 'qualified';
        referral.qualifiedAt = new Date();
        await referral.save();

        // Issue reward
        await rewardEngine.issueReward({
          referralId: referral._id.toString(),
          referrerId: referral.referrerId.toString(),
          refereeId: referral.refereeId.toString(),
          type: 'coins',
          source: 'referral',
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          item: { referrerId: id, refereeId: id, referralCode: '', type: 'consumer' },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Cleanup expired referrals
   */
  async cleanupExpired(daysOld = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await Referral.deleteMany({
      status: 'pending',
      createdAt: { $lt: cutoff },
    });

    logger.info('[BatchProcessor] Cleaned up expired referrals:', result.deletedCount);
    return result.deletedCount;
  }
}

export const batchProcessor = new BatchProcessor();
