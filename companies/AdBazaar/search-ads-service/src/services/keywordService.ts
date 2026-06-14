/**
 * Keyword Service - Business logic for keyword management
 */

import { SearchKeyword, SearchCampaign } from '../models';
import { AddKeywordRequest, ISearchKeyword, MatchType } from '../types';
import { logger } from 'utils/logger.js';
import { qualityScoreDistribution, bidAmounts } from '../utils/metrics';

export class KeywordService {
  /**
   * Add keyword to campaign
   */
  async addKeyword(campaignId: string, data: AddKeywordRequest): Promise<ISearchKeyword> {
    try {
      logger.info('Adding keyword to campaign', { campaignId, term: data.term });

      // Verify campaign exists
      const campaign = await SearchCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const keyword = new SearchKeyword({
        campaignId,
        term: data.term.toLowerCase(),
        matchType: data.matchType,
        bid: data.bid,
        qualityScore: 5, // Default quality score
        estimatedCpc: this.estimateCpc(data.bid, 5),
        status: campaign.status === 'active' ? 'active' : 'pending',
      });

      await keyword.save();

      // Record metrics
      qualityScoreDistribution.observe({ campaign_id: campaignId }, 5);
      bidAmounts.observe(data.bid);

      logger.info('Keyword added successfully', { keywordId: keyword._id, campaignId });
      return keyword;
    } catch (error) {
      logger.error('Failed to add keyword', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get keyword by ID
   */
  async getKeyword(keywordId: string): Promise<ISearchKeyword | null> {
    try {
      return await SearchKeyword.findById(keywordId);
    } catch (error) {
      logger.error('Failed to get keyword', { error, keywordId });
      throw error;
    }
  }

  /**
   * Get keywords by campaign
   */
  async getKeywordsByCampaign(campaignId: string): Promise<ISearchKeyword[]> {
    try {
      return await SearchKeyword.findByCampaign(campaignId);
    } catch (error) {
      logger.error('Failed to get keywords by campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Update keyword
   */
  async updateKeyword(
    keywordId: string,
    updates: { bid?: number; matchType?: MatchType; status?: string }
  ): Promise<ISearchKeyword | null> {
    try {
      logger.info('Updating keyword', { keywordId, updates });

      const updateData: any = {};
      if (updates.bid !== undefined) {
        updateData.bid = updates.bid;
        bidAmounts.observe(updates.bid);
      }
      if (updates.matchType) updateData.matchType = updates.matchType;
      if (updates.status) updateData.status = updates.status;

      const keyword = await SearchKeyword.findByIdAndUpdate(
        keywordId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (keyword) {
        logger.info('Keyword updated successfully', { keywordId });
      }

      return keyword;
    } catch (error) {
      logger.error('Failed to update keyword', { error, keywordId });
      throw error;
    }
  }

  /**
   * Pause keyword
   */
  async pauseKeyword(keywordId: string): Promise<ISearchKeyword | null> {
    try {
      const keyword = await SearchKeyword.findById(keywordId);
      if (keyword) {
        await keyword.pause();
        logger.info('Keyword paused', { keywordId });
        return keyword;
      }
      return null;
    } catch (error) {
      logger.error('Failed to pause keyword', { error, keywordId });
      throw error;
    }
  }

  /**
   * Resume keyword
   */
  async resumeKeyword(keywordId: string): Promise<ISearchKeyword | null> {
    try {
      const keyword = await SearchKeyword.findById(keywordId);
      if (keyword) {
        await keyword.resume();
        logger.info('Keyword resumed', { keywordId });
        return keyword;
      }
      return null;
    } catch (error) {
      logger.error('Failed to resume keyword', { error, keywordId });
      throw error;
    }
  }

  /**
   * Delete keyword
   */
  async deleteKeyword(keywordId: string): Promise<boolean> {
    try {
      const result = await SearchKeyword.findByIdAndDelete(keywordId);
      if (result) {
        logger.info('Keyword deleted', { keywordId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete keyword', { error, keywordId });
      throw error;
    }
  }

  /**
   * Get low quality keywords
   */
  async getLowQualityKeywords(campaignId: string, threshold: number = 5): Promise<ISearchKeyword[]> {
    try {
      return await SearchKeyword.findLowQuality(campaignId, threshold);
    } catch (error) {
      logger.error('Failed to get low quality keywords', { error, campaignId });
      throw error;
    }
  }

  /**
   * Bulk add keywords
   */
  async bulkAddKeywords(campaignId: string, keywords: AddKeywordRequest[]): Promise<ISearchKeyword[]> {
    try {
      logger.info('Bulk adding keywords', { campaignId, count: keywords.length });

      const campaign = await SearchCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const keywordDocs = keywords.map((kw) => ({
        campaignId,
        term: kw.term.toLowerCase(),
        matchType: kw.matchType,
        bid: kw.bid,
        qualityScore: 5,
        estimatedCpc: this.estimateCpc(kw.bid, 5),
        status: campaign.status === 'active' ? 'active' : 'pending',
      }));

      const createdKeywords = await SearchKeyword.insertMany(keywordDocs);
      logger.info('Bulk keywords added successfully', { campaignId, count: createdKeywords.length });

      // Record metrics for each keyword
      createdKeywords.forEach((kw) => {
        qualityScoreDistribution.observe({ campaign_id: campaignId }, 5);
        bidAmounts.observe(kw.bid);
      });

      return createdKeywords;
    } catch (error) {
      logger.error('Failed to bulk add keywords', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get average quality score for campaign
   */
  async getAverageQualityScore(campaignId: string): Promise<number> {
    try {
      const result = await SearchKeyword.calculateAverageQualityScore(campaignId);
      return result.length > 0 ? result[0].avgQualityScore : 5;
    } catch (error) {
      logger.error('Failed to get average quality score', { error, campaignId });
      return 5;
    }
  }

  /**
   * Estimate CPC based on bid and quality score
   */
  private estimateCpc(bid: number, qualityScore: number): number {
    // eCPC = bid * (qualityScore / 10)
    return bid * (qualityScore / 10);
  }

  /**
   * Match keyword to search query
   */
  matchKeyword(searchQuery: string, keyword: ISearchKeyword): boolean {
    const query = searchQuery.toLowerCase();
    const term = keyword.term.toLowerCase();

    switch (keyword.matchType) {
      case 'exact':
        return query === term;
      case 'phrase':
        return query.includes(term);
      case 'broad':
        const queryWords = query.split(' ');
        const termWords = term.split(' ');
        return termWords.every((word) => queryWords.includes(word));
      case 'modified_broad':
        const modifiedTerms = term.split(' ').filter((w) => w.startsWith('+'));
        return modifiedTerms.every((word) => query.includes(word.replace('+', '')));
      default:
        return false;
    }
  }

  /**
   * Get keyword suggestions
   */
  async getKeywordSuggestions(term: string): Promise<string[]> {
    // Simple keyword suggestion based on common patterns
    const suggestions: string[] = [];
    const words = term.split(' ');

    // Add plural forms
    if (!term.endsWith('s')) {
      suggestions.push(term + 's');
    }

    // Add common modifiers
    const modifiers = ['best', 'cheap', 'online', 'free', 'top', 'buy'];
    modifiers.forEach((mod) => {
      suggestions.push(`${mod} ${term}`);
      suggestions.push(`${term} ${mod}`);
    });

    // Add specific match variants
    suggestions.push(`"${term}"`); // Exact match
    suggestions.push(term.split(' ').map((w) => `+${w}`).join(' ')); // Modified broad

    return [...new Set(suggestions)];
  }
}

export const keywordService = new KeywordService();