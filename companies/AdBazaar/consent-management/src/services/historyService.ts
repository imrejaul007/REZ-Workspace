import { ConsentHistory, IConsentHistory } from '../models/ConsentHistory';
import { ConsentType, ComplianceFramework } from '../models/Consent';
import { logger } from 'utils/logger.js';

interface HistoryQuery {
  userId: string;
  consentType?: ConsentType;
  framework?: ComplianceFramework;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  limit?: number;
  offset?: number;
}

class HistoryService {
  /**
   * Get consent history for a user
   */
  async getUserHistory(query: HistoryQuery): Promise<{ data: IConsentHistory[]; total: number }> {
    const { userId, consentType, framework, startDate, endDate, action, limit = 50, offset = 0 } = query;

    const filter: any = { userId };

    if (consentType) {
      filter.consentType = consentType;
    }

    if (framework) {
      filter.framework = framework;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = startDate;
      }
      if (endDate) {
        filter.timestamp.$lte = endDate;
      }
    }

    if (action) {
      filter.action = action;
    }

    logger.info('Fetching consent history', { userId, filter });

    const [data, total] = await Promise.all([
      ConsentHistory.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit),
      ConsentHistory.countDocuments(filter)
    ]);

    return { data, total };
  }

  /**
   * Get history for a specific consent type
   */
  async getConsentTypeHistory(
    userId: string,
    consentType: ConsentType,
    framework?: ComplianceFramework
  ): Promise<IConsentHistory[]> {
    const filter: any = { userId, consentType };
    if (framework) {
      filter.framework = framework;
    }

    return ConsentHistory.find(filter).sort({ timestamp: -1 });
  }

  /**
   * Get history changes for a specific period
   */
  async getHistoryChanges(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IConsentHistory[]> {
    return ConsentHistory.find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: -1 });
  }

  /**
   * Get audit trail for compliance reporting
   */
  async getAuditTrail(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IConsentHistory[]> {
    const filter: any = { userId };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = startDate;
      }
      if (endDate) {
        filter.timestamp.$lte = endDate;
      }
    }

    return ConsentHistory.find(filter)
      .select('userId consentType framework action changes timestamp source ip')
      .sort({ timestamp: -1 });
  }

  /**
   * Get statistics for consent history
   */
  async getHistoryStats(userId: string): Promise<any> {
    const stats = await ConsentHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          firstOccurrence: { $min: '$timestamp' },
          lastOccurrence: { $max: '$timestamp' }
        }
      }
    ]);

    const typeStats = await ConsentHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$consentType',
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      }
    ]);

    return {
      userId,
      actionStats: stats,
      typeStats,
      generatedAt: new Date()
    };
  }

  /**
   * Clean up old history entries
   */
  async cleanupOldHistory(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await ConsentHistory.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info('Cleaned up old consent history', {
      deletedCount: result.deletedCount,
      cutoffDate
    });

    return result.deletedCount;
  }
}

export const historyService = new HistoryService();