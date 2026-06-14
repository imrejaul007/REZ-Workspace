/**
 * Monitoring Service - Business logic for monitoring keywords
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MonitoringKeyword,
  IMonitoringKeyword,
  KeywordType,
  KeywordSentiment,
  AlertChannel,
} from '../models';
import { crisisMetrics } from '../utils/metrics';
import logger from '../utils/logger';

export interface CreateKeywordInput {
  keyword: string;
  type: KeywordType;
  sentiment: KeywordSentiment;
  threshold: number;
  alertChannels: AlertChannel[];
  enabled?: boolean;
}

export interface UpdateKeywordInput {
  keyword?: string;
  type?: KeywordType;
  sentiment?: KeywordSentiment;
  threshold?: number;
  alertChannels?: AlertChannel[];
  enabled?: boolean;
}

export class MonitoringService {
  /**
   * Create a new monitoring keyword
   */
  static async createKeyword(input: CreateKeywordInput, userId: string): Promise<IMonitoringKeyword> {
    const keyword = new MonitoringKeyword({
      keywordId: `KW-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...input,
      enabled: input.enabled !== undefined ? input.enabled : true,
      createdBy: userId,
    });

    await keyword.save();

    // Update metrics
    await this.updateKeywordMetrics();

    logger.info('Monitoring keyword created', {
      keywordId: keyword.keywordId,
      keyword: keyword.keyword,
      type: keyword.type,
    });

    return keyword;
  }

  /**
   * Get keyword by ID
   */
  static async getKeywordById(keywordId: string): Promise<IMonitoringKeyword | null> {
    return MonitoringKeyword.findOne({ keywordId });
  }

  /**
   * List all monitoring keywords with filters
   */
  static async listKeywords(filters: {
    type?: KeywordType;
    sentiment?: KeywordSentiment;
    enabled?: boolean;
  } = {}): Promise<IMonitoringKeyword[]> {
    const query: Record<string, unknown> = {};

    if (filters.type) query.type = filters.type;
    if (filters.sentiment) query.sentiment = filters.sentiment;
    if (filters.enabled !== undefined) query.enabled = filters.enabled;

    return MonitoringKeyword.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update a monitoring keyword
   */
  static async updateKeyword(
    keywordId: string,
    input: UpdateKeywordInput
  ): Promise<IMonitoringKeyword | null> {
    const keyword = await MonitoringKeyword.findOneAndUpdate(
      { keywordId },
      { $set: input },
      { new: true }
    );

    if (keyword) {
      await this.updateKeywordMetrics();
      logger.info('Monitoring keyword updated', { keywordId });
    }

    return keyword;
  }

  /**
   * Delete a monitoring keyword
   */
  static async deleteKeyword(keywordId: string): Promise<boolean> {
    const result = await MonitoringKeyword.deleteOne({ keywordId });

    if (result.deletedCount > 0) {
      await this.updateKeywordMetrics();
      logger.info('Monitoring keyword deleted', { keywordId });
      return true;
    }

    return false;
  }

  /**
   * Toggle keyword enabled status
   */
  static async toggleKeyword(keywordId: string): Promise<IMonitoringKeyword | null> {
    const keyword = await MonitoringKeyword.findOne({ keywordId });

    if (!keyword) return null;

    keyword.enabled = !keyword.enabled;
    await keyword.save();

    await this.updateKeywordMetrics();

    logger.info('Monitoring keyword toggled', {
      keywordId,
      enabled: keyword.enabled,
    });

    return keyword;
  }

  /**
   * Get monitoring statistics
   */
  static async getStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
    bySentiment: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const keywords = await MonitoringKeyword.find({});

    const byType: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    const byChannel: Record<string, number> = {};

    keywords.forEach((kw) => {
      byType[kw.type] = (byType[kw.type] || 0) + 1;
      bySentiment[kw.sentiment] = (bySentiment[kw.sentiment] || 0) + 1;
      kw.alertChannels.forEach((channel) => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
    });

    return {
      total: keywords.length,
      enabled: keywords.filter((kw) => kw.enabled).length,
      disabled: keywords.filter((kw) => !kw.enabled).length,
      byType,
      bySentiment,
      byChannel,
    };
  }

  /**
   * Search keywords
   */
  static async searchKeywords(query: string): Promise<IMonitoringKeyword[]> {
    return MonitoringKeyword.find({
      keyword: { $regex: query, $options: 'i' },
    }).limit(20);
  }

  /**
   * Bulk enable/disable keywords
   */
  static async bulkUpdateStatus(keywordIds: string[], enabled: boolean): Promise<number> {
    const result = await MonitoringKeyword.updateMany(
      { keywordId: { $in: keywordIds } },
      { $set: { enabled } }
    );

    await this.updateKeywordMetrics();

    logger.info('Bulk keyword status update', {
      count: result.modifiedCount,
      enabled,
    });

    return result.modifiedCount;
  }

  /**
   * Get enabled keywords for real-time monitoring
   */
  static async getActiveKeywords(): Promise<IMonitoringKeyword[]> {
    return MonitoringKeyword.find({ enabled: true });
  }

  /**
   * Update keyword metrics
   */
  private static async updateKeywordMetrics(): Promise<void> {
    const keywords = await MonitoringKeyword.find({});

    const byType: Record<string, number> = {};
    keywords.forEach((kw) => {
      if (kw.enabled) {
        byType[kw.type] = (byType[kw.type] || 0) + 1;
      }
    });

    Object.entries(byType).forEach(([type, count]) => {
      crisisMetrics.setMonitoringKeywords(type, count);
    });
  }
}
