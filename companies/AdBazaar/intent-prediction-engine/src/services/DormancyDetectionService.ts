import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import { DormantIntent, IDormantIntent } from '../models/DormantIntent.js';
import { cacheGet, cacheSet } from '../config/redis.js';

interface DormancyConfig {
  thresholdDays: number;
  minRevivalScore: number;
}

export class DormancyDetectionService {
  private config: DormancyConfig;

  constructor() {
    this.config = {
      thresholdDays: parseInt(process.env.DORMANCY_THRESHOLD_DAYS || '7', 10),
      minRevivalScore: 0.3,
    };
  }

  /**
   * Detect dormant intents based on configurable threshold
   */
  async detectDormantIntents(userId?: string, category?: string): Promise<IDormantIntent[]> {
    try {
      const query: Record<string, unknown> = {
        daysDormant: { $gte: this.config.thresholdDays },
      };

      if (userId) {
        query.userId = userId;
      }

      if (category) {
        query.category = category;
      }

      const dormantIntents = await DormantIntent.find(query)
        .sort({ revivalScore: -1, daysDormant: -1 })
        .limit(1000);

      logger.info('Dormant intents detected', {
        count: dormantIntents.length,
        thresholdDays: this.config.thresholdDays,
        userId,
        category,
      });

      return dormantIntents;
    } catch (error) {
      logger.error('Error detecting dormant intents', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find revival candidates - dormant intents with high revival potential
   */
  async findRevivalCandidates(options: {
    minScore?: number;
    maxDaysDormant?: number;
    category?: string;
    limit?: number;
  } = {}): Promise<IDormantIntent[]> {
    const { minScore = 0.5, maxDaysDormant = 90, category, limit = 100 } = options;

    try {
      const query: Record<string, unknown> = {
        revivalScore: { $gte: minScore },
        daysDormant: { $gte: this.config.thresholdDays, $lte: maxDaysDormant },
      };

      if (category) {
        query.category = category;
      }

      const candidates = await DormantIntent.find(query)
        .sort({ revivalScore: -1, daysDormant: -1 })
        .limit(limit);

      logger.info('Revival candidates found', {
        count: candidates.length,
        minScore,
        maxDaysDormant,
      });

      return candidates;
    } catch (error) {
      logger.error('Error finding revival candidates', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Calculate revival score for a dormant intent
   * Based on dormancy duration, historical engagement, and timing factors
   */
  async calculateRevivalScore(dormantIntent: IDormantIntent): Promise<number> {
    // Factors:
    // 1. Days dormant (optimal window is 7-30 days)
    // 2. Historical engagement before dormancy
    // 3. Recency of similar category activity
    // 4. Time since last similar intent revival attempt

    const { daysDormant } = dormantIntent;

    // Dormancy factor: score higher for7-30 days dormant, lower for > 30 days
    let dormancyFactor: number;
    if (daysDormant >= 7 && daysDormant <= 14) {
      dormancyFactor = 0.9;
    } else if (daysDormant > 14 && daysDormant <= 30) {
      dormancyFactor = 0.7;
    } else if (daysDormant > 30 && daysDormant <= 60) {
      dormancyFactor = 0.4;
    } else if (daysDormant > 60) {
      dormancyFactor = 0.2;
    } else {
      dormancyFactor = 0.1;
    }

    // Base score
    const baseScore = 0.3;

    // Calculate final score
    const revivalScore = Math.min(1, baseScore + dormancyFactor * 0.5);

    logger.debug('Revival score calculated', {
      dormantIntentId: dormantIntent.dormantIntentId,
      daysDormant,
      dormancyFactor,
      revivalScore,
    });

    return Math.round(revivalScore * 1000) / 1000;
  }

  /**
   * Create or update dormant intent record
   */
  async upsertDormantIntent(data: {
    userId: string;
    category: string;
    intentKey: string;
    lastSignalTimestamp: Date;
  }): Promise<IDormantIntent> {
    try {
      const { userId, category, intentKey, lastSignalTimestamp } = data;
      const daysDormant = Math.floor(
        (new Date().getTime() - lastSignalTimestamp.getTime()) / (1000 * 60 * 60 * 24)
      );

      const existing = await DormantIntent.findOne({ userId, category, intentKey });

      if (existing) {
        // Update existing record
        existing.lastSignalTimestamp = lastSignalTimestamp;
        existing.daysDormant = 0;
        existing.revivalScore = await this.calculateRevivalScore(existing);
        await existing.save();

        logger.debug('Dormant intent updated', { dormantIntentId: existing.dormantIntentId });
        return existing;
      }

      // Create new record
      const dormantIntent = new DormantIntent({
        dormantIntentId: uuidv4(),
        userId,
        category,
        intentKey,
        lastSignalTimestamp,
        daysDormant: 0,
        revivalScore: 0.9, // High initial score
      });

      await dormantIntent.save();

      logger.debug('Dormant intent created', { dormantIntentId: dormantIntent.dormantIntentId });
      return dormantIntent;
    } catch (error) {
      logger.error('Error upserting dormant intent', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Mark intent as dormant (no recent signals)
   */
  async markAsDormant(userId: string, category: string, intentKey: string): Promise<IDormantIntent | null> {
    try {
      const existing = await DormantIntent.findOne({ userId, category, intentKey });

      if (!existing) {
        // Create new dormant record
        const dormantIntent = new DormantIntent({
          dormantIntentId: uuidv4(),
          userId,
          category,
          intentKey,
          lastSignalTimestamp: new Date(),
          daysDormant: this.config.thresholdDays,
          revivalScore: await this.calculateRevivalScore({
            dormantIntentId: '',
            userId,
            category,
            intentKey,
            lastSignalTimestamp: new Date(),
            daysDormant: this.config.thresholdDays,
            revivalScore: 0,
          } as IDormantIntent),
 });

        await dormantIntent.save();
        return dormantIntent;
      }

      // Update existing
      const daysDormant = Math.floor(
        (new Date().getTime() - existing.lastSignalTimestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      existing.daysDormant = daysDormant;
      existing.revivalScore = await this.calculateRevivalScore(existing);
      await existing.save();

      return existing;
    } catch (error) {
      logger.error('Error marking intent as dormant', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get dormancy statistics
   */
  async getStatistics(): Promise<{
    totalDormant: number;
    byCategory: Record<string, { count: number; avgDaysDormant: number; avgRevivalScore: number }>;
    highPriorityCount: number;
  }> {
    try {
      const stats = await DormantIntent.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgDaysDormant: { $avg: '$daysDormant' },
            avgRevivalScore: { $avg: '$revivalScore' },
          },
        },
      ]);

      const totalDormant = await DormantIntent.countDocuments();
      const highPriorityCount = await DormantIntent.countDocuments({
        revivalScore: { $gte: 0.7 },
        daysDormant: { $gte: this.config.thresholdDays },
      });

      const byCategory: Record<string, { count: number; avgDaysDormant: number; avgRevivalScore: number }> = {};
      for (const stat of stats) {
        byCategory[stat._id] = {
          count: stat.count,
          avgDaysDormant: Math.round(stat.avgDaysDormant * 10) / 10,
          avgRevivalScore: Math.round(stat.avgRevivalScore * 1000) / 1000,
        };
      }

      return { totalDormant, byCategory, highPriorityCount };
    } catch (error) {
      logger.error('Error getting dormancy statistics', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update dormancy status for all records
   */
  async updateAllDormancyStatus(): Promise<number> {
    try {
      const now = new Date();
      const dormantIntents = await DormantIntent.find({});

      let updateCount = 0;
      const bulkOps = dormantIntents.map((intent) => {
        const daysDormant = Math.floor(
          (now.getTime() - intent.lastSignalTimestamp.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          updateOne: {
            filter: { _id: intent._id },
            update: {
              $set: {
                daysDormant,
                revivalScore: intent.revivalScore, // Keep existing score
              },
            },
          },
        };
      });

      if (bulkOps.length > 0) {
        const result = await DormantIntent.bulkWrite(bulkOps);
        updateCount = result.modifiedCount;
      }

      logger.info('Dormancy status updated', { updateCount, totalRecords: bulkOps.length });
      return updateCount;
    } catch (error) {
      logger.error('Error updating dormancy status', { error: (error as Error).message });
      throw error;
    }
  }
}

export const dormancyDetectionService = new DormancyDetectionService();