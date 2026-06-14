import { Mention, IMention, Keyword } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { mentionsProcessedTotal } from '../utils/metrics';

const logger = createChildLogger('MentionService');

export interface CreateMentionInput {
  userId: string;
  keywordId: string;
  platform: string;
  externalId: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    followers?: number;
    verified?: boolean;
  };
  content: string;
  url: string;
  mediaUrls?: string[];
  publishedAt: Date;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
  };
  location?: {
    country?: string;
    city?: string;
  };
  language?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

export class MentionService {
  async create(input: CreateMentionInput): Promise<IMention> {
    logger.info('Creating mention', { userId: input.userId, platform: input.platform });

    const mention = new Mention({
      ...input,
      sentiment: input.sentiment || 'neutral',
      sentimentScore: input.sentimentScore || 0,
      isProcessed: false,
      isAlerted: false
    });

    await mention.save();
    mentionsProcessedTotal.inc({ platform: input.platform, sentiment: mention.sentiment });

    // Increment keyword match count
    await Keyword.findByIdAndUpdate(input.keywordId, {
      $inc: { matchCount: 1 },
      lastMatchAt: new Date()
    });

    logger.info('Mention created', { mentionId: mention._id });
    return mention;
  }

  async findById(id: string): Promise<IMention | null> {
    return Mention.findById(id).populate('keywordId');
  }

  async findByKeyword(
    keyword: string,
    userId: string,
    options?: { limit?: number; skip?: number; sentiment?: string; platform?: string }
  ): Promise<IMention[]> {
    const keywordDoc = await Keyword.findOne({ userId, keyword, isActive: true });
    if (!keywordDoc) return [];

    const query: Record<string, unknown> = { userId, keywordId: keywordDoc._id };
    if (options?.sentiment) query.sentiment = options.sentiment;
    if (options?.platform) query.platform = options.platform;

    return Mention.find(query)
      .sort({ publishedAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  async findMentions(
    userId: string,
    options?: {
      keywordId?: string;
      platform?: string;
      sentiment?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<IMention[]> {
    const query: Record<string, unknown> = { userId };

    if (options?.keywordId) query.keywordId = options.keywordId;
    if (options?.platform) query.platform = options.platform;
    if (options?.sentiment) query.sentiment = options.sentiment;
    if (options?.startDate || options?.endDate) {
      query.publishedAt = {};
      if (options.startDate) (query.publishedAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (query.publishedAt as Record<string, Date>).$lte = options.endDate;
    }

    return Mention.find(query)
      .sort({ publishedAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  async markAsProcessed(id: string): Promise<IMention | null> {
    return Mention.findByIdAndUpdate(id, { isProcessed: true }, { new: true });
  }

  async markAsAlerted(id: string): Promise<IMention | null> {
    return Mention.findByIdAndUpdate(id, { isAlerted: true }, { new: true });
  }

  async getMentionStats(userId: string, keywordId?: string): Promise<{
    total: number;
    byPlatform: Record<string, number>;
    bySentiment: Record<string, number>;
    totalEngagement: number;
  }> {
    const query: Record<string, unknown> = { userId };
    if (keywordId) query.keywordId = keywordId;

    const mentions = await Mention.find(query);

    const byPlatform: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    let totalEngagement = 0;

    mentions.forEach(m => {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
      bySentiment[m.sentiment] = (bySentiment[m.sentiment] || 0) + 1;
      totalEngagement += (m.engagement.likes || 0) + (m.engagement.comments || 0) + (m.engagement.shares || 0);
    });

    return {
      total: mentions.length,
      byPlatform,
      bySentiment,
      totalEngagement
    };
  }

  async getRecentMentions(userId: string, limit: number = 10): Promise<IMention[]> {
    return Mention.find({ userId })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('keywordId');
  }
}

export const mentionService = new MentionService();