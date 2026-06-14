import { Keyword, IKeyword } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { keywordsMonitoredGauge } from '../utils/metrics';

const logger = createChildLogger('KeywordService');

export interface CreateKeywordInput {
  userId: string;
  keyword: string;
  type?: 'track' | 'search' | 'hashtag' | 'mention';
  platforms?: string[];
  filters?: {
    languages?: string[];
    locations?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    minFollowers?: number;
  };
  alertEnabled?: boolean;
  alertThreshold?: number;
}

export class KeywordService {
  async create(input: CreateKeywordInput): Promise<IKeyword> {
    logger.info('Creating keyword', { userId: input.userId, keyword: input.keyword });

    const keyword = new Keyword({
      userId: input.userId,
      keyword: input.keyword,
      type: input.type || 'track',
      platforms: input.platforms || ['all'],
      filters: input.filters || {},
      alertEnabled: input.alertEnabled || false,
      alertThreshold: input.alertThreshold,
      isActive: true
    });

    await keyword.save();
    keywordsMonitoredGauge.inc();

    logger.info('Keyword created', { keywordId: keyword._id });
    return keyword;
  }

  async findById(id: string): Promise<IKeyword | null> {
    return Keyword.findById(id);
  }

  async findByUser(userId: string, options?: { isActive?: boolean; type?: string }): Promise<IKeyword[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    }
    if (options?.type) {
      query.type = options.type;
    }

    return Keyword.find(query).sort({ createdAt: -1 });
  }

  async findByKeyword(keyword: string, userId: string): Promise<IKeyword | null> {
    return Keyword.findOne({ userId, keyword, isActive: true });
  }

  async update(id: string, input: Partial<CreateKeywordInput>): Promise<IKeyword | null> {
    return Keyword.findByIdAndUpdate(id, input, { new: true });
  }

  async toggleActive(id: string, isActive: boolean): Promise<IKeyword | null> {
    const keyword = await Keyword.findByIdAndUpdate(id, { isActive }, { new: true });
    if (keyword) {
      if (isActive) {
        keywordsMonitoredGauge.inc();
      } else {
        keywordsMonitoredGauge.dec();
      }
    }
    return keyword;
  }

  async delete(id: string): Promise<boolean> {
    const keyword = await Keyword.findById(id);
    if (keyword) {
      keywordsMonitoredGauge.dec();
    }
    const result = await Keyword.findByIdAndDelete(id);
    return !!result;
  }

  async incrementMatchCount(id: string): Promise<void> {
    await Keyword.findByIdAndUpdate(id, {
      matchCount: await Keyword.findById(id).then(k => (k?.matchCount || 0) + 1),
      lastMatchAt: new Date()
    });
  }

  async getActiveKeywords(userId: string): Promise<IKeyword[]> {
    return Keyword.find({ userId, isActive: true });
  }

  async getKeywordStats(userId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const keywords = await Keyword.find({ userId });
    return {
      total: keywords.length,
      active: keywords.filter(k => k.isActive).length,
      byType: keywords.reduce((acc, k) => {
        acc[k.type] = (acc[k.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const keywordService = new KeywordService();