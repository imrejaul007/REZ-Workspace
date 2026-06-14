import { v4 as uuidv4 } from 'uuid';
import { Keyword, IKeyword, BrandCampaign } from '../models';
import { logger, keywordCounter } from '../utils';
import { z } from 'zod';

export const AddKeywordSchema = z.object({
  term: z.string().min(1).max(100),
  matchType: z.enum(['broad', 'phrase', 'exact']).default('broad'),
  bid: z.number().min(0.01).optional().default(0.5)
});

export const UpdateKeywordSchema = z.object({
  term: z.string().min(1).max(100).optional(),
  matchType: z.enum(['broad', 'phrase', 'exact']).optional(),
  bid: z.number().min(0.01).optional(),
  status: z.enum(['active', 'paused', 'negative']).optional()
});

export interface KeywordFilters {
  campaignId?: string;
  matchType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class KeywordService {
  async addKeyword(campaignId: string, data: z.infer<typeof AddKeywordSchema>): Promise<IKeyword> {
    try {
      const keywordId = `kw_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const keyword = new Keyword({
        keywordId,
        campaignId,
        term: data.term.toLowerCase().trim(),
        matchType: data.matchType,
        bid: {
          current: data.bid || 0.5,
          suggested: data.bid || 0.5,
          lastUpdated: new Date()
        },
        performance: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          spend: 0,
          conversions: 0,
          cpc: 0,
          roas: 0
        },
        status: 'active',
        qualityScore: 5,
        competition: 'medium',
        searchVolume: Math.floor(Math.random() * 10000) + 100
      });

      await keyword.save();

      keywordCounter.inc({ campaign_id: campaignId, match_type: data.matchType, status: 'active' });
      logger.info('Keyword added', { keywordId, campaignId, term: data.term });

      await BrandCampaign.updateOne(
        { campaignId },
        { $addToSet: { keywords: data.term.toLowerCase().trim(), matchTypes: data.matchType } }
      );

      return keyword;
    } catch (error) {
      logger.error('Failed to add keyword', { error, campaignId });
      throw error;
    }
  }

  async bulkAddKeywords(campaignId: string, keywords: Array<{
    term: string;
    matchType?: 'broad' | 'phrase' | 'exact';
    bid?: number;
  }>): Promise<IKeyword[]> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const keywordDocs = keywords.map(kw => ({
        keywordId: `kw_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
        campaignId,
        term: kw.term.toLowerCase().trim(),
        matchType: kw.matchType || 'broad',
        bid: {
          current: kw.bid || 0.5,
          suggested: kw.bid || 0.5,
          lastUpdated: new Date()
        },
        performance: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          spend: 0,
          conversions: 0,
          cpc: 0,
          roas: 0
        },
        status: 'active',
        qualityScore: 5,
        competition: 'medium',
        searchVolume: Math.floor(Math.random() * 10000) + 100
      }));

      const insertedKeywords = await Keyword.insertMany(keywordDocs);

      await BrandCampaign.updateOne(
        { campaignId },
        {
          $addToSet: {
            keywords: { $each: keywords.map(kw => kw.term.toLowerCase().trim()) }
          }
        }
      );

      logger.info('Bulk keywords added', { campaignId, count: keywords.length });

      return insertedKeywords;
    } catch (error) {
      logger.error('Failed to bulk add keywords', { error, campaignId });
      throw error;
    }
  }

  async getById(keywordId: string): Promise<IKeyword | null> {
    try {
      return await Keyword.findOne({ keywordId });
    } catch (error) {
      logger.error('Failed to get keyword', { error, keywordId });
      throw error;
    }
  }

  async listByCampaign(campaignId: string, filters?: {
    status?: string;
    matchType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ keywords: IKeyword[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = { campaignId };
      if (filters?.status) query.status = filters.status;
      if (filters?.matchType) query.matchType = filters.matchType;

      const [keywords, total] = await Promise.all([
        Keyword.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Keyword.countDocuments(query)
      ]);

      return { keywords, total };
    } catch (error) {
      logger.error('Failed to list keywords', { error, campaignId });
      throw error;
    }
  }

  async update(keywordId: string, data: Partial<z.infer<typeof UpdateKeywordSchema>>): Promise<IKeyword | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.term) updateData.term = data.term.toLowerCase().trim();
      if (data.matchType) updateData.matchType = data.matchType;
      if (data.status) updateData.status = data.status;
      if (data.bid !== undefined) {
        updateData['bid.current'] = data.bid;
        updateData['bid.lastUpdated'] = new Date();
      }

      const keyword = await Keyword.findOneAndUpdate(
        { keywordId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (keyword) {
        logger.info('Keyword updated', { keywordId, updates: Object.keys(data) });
      }

      return keyword;
    } catch (error) {
      logger.error('Failed to update keyword', { error, keywordId });
      throw error;
    }
  }

  async updateBid(keywordId: string, newBid: number): Promise<IKeyword | null> {
    try {
      const keyword = await Keyword.findOneAndUpdate(
        { keywordId },
        {
          $set: {
            'bid.current': newBid,
            'bid.lastUpdated': new Date()
          }
        },
        { new: true }
      );

      if (keyword) {
        logger.info('Keyword bid updated', { keywordId, newBid });
      }

      return keyword;
    } catch (error) {
      logger.error('Failed to update keyword bid', { error, keywordId });
      throw error;
    }
  }

  async bulkUpdateBids(keywordIds: string[], newBids: number[]): Promise<IKeyword[]> {
    try {
      const updates = keywordIds.map((keywordId, index) => ({
        updateOne: {
          filter: { keywordId },
          update: {
            $set: {
              'bid.current': newBids[index],
              'bid.lastUpdated': new Date()
            }
          }
        }
      }));

      const result = await Keyword.bulkWrite(updates);

      logger.info('Bulk bid update completed', {
        updated: result.modifiedCount,
        keywordIds: keywordIds.length
      });

      return await Keyword.find({ keywordId: { $in: keywordIds } });
    } catch (error) {
      logger.error('Failed to bulk update bids', { error });
      throw error;
    }
  }

  async updatePerformance(keywordId: string, metrics: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    conversions?: number;
  }): Promise<IKeyword | null> {
    try {
      const keyword = await Keyword.findOne({ keywordId });
      if (!keyword) return null;

      const newImpressions = keyword.performance.impressions + (metrics.impressions || 0);
      const newClicks = keyword.performance.clicks + (metrics.clicks || 0);
      const newSpend = keyword.performance.spend + (metrics.spend || 0);
      const newConversions = keyword.performance.conversions + (metrics.conversions || 0);

      const newCTR = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0;
      const newCPC = newClicks > 0 ? (newSpend / newClicks) * 100 : 0;

      return await Keyword.findOneAndUpdate(
        { keywordId },
        {
          $inc: {
            'performance.impressions': metrics.impressions || 0,
            'performance.clicks': metrics.clicks || 0,
            'performance.spend': metrics.spend || 0,
            'performance.conversions': metrics.conversions || 0
          },
          $set: {
            'performance.ctr': newCTR,
            'performance.cpc': newCPC
          }
        },
        { new: true }
      );
    } catch (error) {
      logger.error('Failed to update keyword performance', { error, keywordId });
      throw error;
    }
  }

  async delete(keywordId: string): Promise<boolean> {
    try {
      const keyword = await Keyword.findOne({ keywordId });
      if (!keyword) return false;

      const result = await Keyword.deleteOne({ keywordId });
      if (result.deletedCount > 0) {
        logger.info('Keyword deleted', { keywordId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete keyword', { error, keywordId });
      throw error;
    }
  }

  async getTopPerformers(campaignId: string, limit: number = 10): Promise<IKeyword[]> {
    try {
      return await Keyword.find({ campaignId, status: 'active' })
        .sort({ 'performance.roas': -1, 'performance.ctr': -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Failed to get top performers', { error, campaignId });
      throw error;
    }
  }

  async getSearchVolume(keywordIds: string[]): Promise<Map<string, number>> {
    try {
      const keywords = await Keyword.find({ keywordId: { $in: keywordIds } });
      const volumeMap = new Map<string, number>();

      keywords.forEach(kw => {
        volumeMap.set(kw.keywordId, kw.searchVolume);
      });

      return volumeMap;
    } catch (error) {
      logger.error('Failed to get search volume', { error });
      throw error;
    }
  }
}

export const keywordService = new KeywordService();