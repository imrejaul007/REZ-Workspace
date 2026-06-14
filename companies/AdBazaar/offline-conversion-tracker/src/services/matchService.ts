import { v4 as uuidv4 } from 'uuid';
import { ConversionMatch, OfflineConversion, IConversionMatch } from '../models';
import { MatchConversionInput } from '../utils/validation';
import { logger, conversionMatchRate } from '../utils';
import { databaseOperationDuration } from '../utils/metrics';

export class MatchService {
  /**
   * Match offline conversion to online
   */
  async matchConversion(input: MatchConversionInput): Promise<IConversionMatch> {
    const startTime = Date.now();

    try {
      // Check if match already exists
      const existingMatch = await ConversionMatch.findOne({ offlineId: input.offlineId });
      if (existingMatch) {
        logger.warn('Conversion already matched', {
          offlineId: input.offlineId,
          existingOnlineId: existingMatch.onlineId
        });
        return existingMatch;
      }

      // Calculate confidence based on match type
      const confidence = this.calculateConfidence(input.matchType, input.matchData);

      // Create match record
      const match = new ConversionMatch({
        offlineId: input.offlineId,
        onlineId: input.matchData?.onlineId || uuidv4(),
        matchType: input.matchType,
        confidence,
        matchData: input.matchData,
        attributionWindow: input.attributionWindow,
        matchedAt: new Date(),
        status: 'pending'
      });

      await match.save();

      // Update offline conversion
      await OfflineConversion.findByIdAndUpdate(input.offlineId, {
        matchedOnlineId: match.onlineId,
        matchConfidence: confidence,
        status: 'matched'
      });

      // Update metrics
      const offlineConversion = await OfflineConversion.findById(input.offlineId);
      if (offlineConversion) {
        conversionMatchRate.set({ campaign_id: offlineConversion.campaignId }, confidence / 100);
      }

      logger.info('Conversion matched', {
        offlineId: input.offlineId,
        onlineId: match.onlineId,
        matchType: input.matchType,
        confidence
      });

      return match;
    } finally {
      databaseOperationDuration.observe({ operation: 'create', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Calculate match confidence
   */
  private calculateConfidence(
    matchType: string,
    matchData?: Record<string, any>
  ): number {
    switch (matchType) {
      case 'email':
        return 95;
      case 'phone':
        return 85;
      case 'device_id':
        return 75;
      case 'fingerprint':
        return 60;
      case 'probability':
        return matchData?.probability || 50;
      default:
        return 50;
    }
  }

  /**
   * Get match by ID
   */
  async getMatch(id: string): Promise<IConversionMatch | null> {
    const startTime = Date.now();

    try {
      return await ConversionMatch.findById(id);
    } finally {
      databaseOperationDuration.observe({ operation: 'read', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get match by offline and online IDs
   */
  async getMatchByIds(offlineId: string, onlineId: string): Promise<IConversionMatch | null> {
    const startTime = Date.now();

    try {
      return await ConversionMatch.findOne({ offlineId, onlineId });
    } finally {
      databaseOperationDuration.observe({ operation: 'read', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Confirm match
   */
  async confirmMatch(id: string, confirmedBy?: string): Promise<IConversionMatch | null> {
    const startTime = Date.now();

    try {
      const match = await ConversionMatch.findByIdAndUpdate(
        id,
        {
          status: 'confirmed',
          confirmedAt: new Date(),
          confirmedBy
        },
        { new: true }
      );

      if (match) {
        // Update offline conversion status
        await OfflineConversion.findByIdAndUpdate(match.offlineId, {
          status: 'confirmed'
        });

        logger.info('Match confirmed', {
          matchId: id,
          offlineId: match.offlineId,
          confirmedBy
        });
      }

      return match;
    } finally {
      databaseOperationDuration.observe({ operation: 'update', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Reject match
   */
  async rejectMatch(id: string, reason?: string): Promise<IConversionMatch | null> {
    const startTime = Date.now();

    try {
      const match = await ConversionMatch.findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          matchData: { ...(match?.matchData || {}), rejectionReason: reason }
        },
        { new: true }
      );

      if (match) {
        // Update offline conversion status
        await OfflineConversion.findByIdAndUpdate(match.offlineId, {
          status: 'rejected',
          matchedOnlineId: undefined,
          matchConfidence: undefined
        });

        logger.info('Match rejected', { matchId: id, reason });
      }

      return match;
    } finally {
      databaseOperationDuration.observe({ operation: 'update', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get matches for offline conversion
   */
  async getMatchesForOffline(offlineId: string): Promise<IConversionMatch[]> {
    const startTime = Date.now();

    try {
      return await ConversionMatch.find({ offlineId }).sort({ confidence: -1 });
    } finally {
      databaseOperationDuration.observe({ operation: 'find', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get matches for online conversion
   */
  async getMatchesForOnline(onlineId: string): Promise<IConversionMatch[]> {
    const startTime = Date.now();

    try {
      return await ConversionMatch.find({ onlineId }).sort({ confidence: -1 });
    } finally {
      databaseOperationDuration.observe({ operation: 'find', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Batch match conversions
   */
  async batchMatch(
    matches: Array<{
      offlineId: string;
      onlineId: string;
      matchType: string;
      confidence?: number;
      matchData?: Record<string, any>;
    }>
  ): Promise<{
    successful: number;
    failed: number;
    matches: IConversionMatch[];
    errors: Array<{ offlineId: string; error: string }>;
  }> {
    const startTime = Date.now();

    const results = {
      successful: 0,
      failed: 0,
      matches: [] as IConversionMatch[],
      errors: [] as Array<{ offlineId: string; error: string }>
    };

    try {
      for (const matchInput of matches) {
        try {
          const confidence = matchInput.confidence ||
            this.calculateConfidence(matchInput.matchType, matchInput.matchData);

          const match = new ConversionMatch({
            offlineId: matchInput.offlineId,
            onlineId: matchInput.onlineId,
            matchType: matchInput.matchType as any,
            confidence,
            matchData: matchInput.matchData,
            attributionWindow: 30,
            matchedAt: new Date(),
            status: 'pending'
          });

          await match.save();

          // Update offline conversion
          await OfflineConversion.findByIdAndUpdate(matchInput.offlineId, {
            matchedOnlineId: matchInput.onlineId,
            matchConfidence: confidence,
            status: 'matched'
          });

          results.matches.push(match);
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            offlineId: matchInput.offlineId,
            error: error.message
          });
        }
      }

      logger.info('Batch match completed', {
        successful: results.successful,
        failed: results.failed
      });

      return results;
    } finally {
      databaseOperationDuration.observe({ operation: 'batch_create', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get match statistics
   */
  async getMatchStatistics(campaignId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageConfidence: number;
  }> {
    const startTime = Date.now();

    try {
      const matchStage: any = campaignId
        ? {
            $lookup: {
              from: 'offlineconversions',
              localField: 'offlineId',
              foreignField: '_id',
              as: 'conversion'
            }
          }
        : { $match: {} };

      const stats = await ConversionMatch.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: { $push: '$matchType' },
            byStatus: { $push: '$status' },
            avgConfidence: { $avg: '$confidence' }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            byType: 1,
            byStatus: 1,
            averageConfidence: { $round: ['$avgConfidence', 2] }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          byType: {},
          byStatus: {},
          averageConfidence: 0
        };
      }

      const result = stats[0];

      // Count by type
      const byType: Record<string, number> = {};
      result.byType.forEach((type: string) => {
        byType[type] = (byType[type] || 0) + 1;
      });

      // Count by status
      const byStatus: Record<string, number> = {};
      result.byStatus.forEach((status: string) => {
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      return {
        total: result.total,
        byType,
        byStatus,
        averageConfidence: result.averageConfidence
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'matches' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const matchService = new MatchService();