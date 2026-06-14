/**
 * Quality Score Service - Calculate and manage quality scores for keywords
 */

import { SearchKeyword, SearchAd, SearchPerformance } from '../models';
import { ISearchKeyword, QualityScoreResponse } from '../types';
import { logger } from 'utils/logger.js';
import { config } from '../config';
import { qualityScoreDistribution } from '../utils/metrics';

interface QualityScoreFactors {
  landingPageExperience: number;
  adRelevance: number;
  expectedCtr: number;
}

export class QualityScoreService {
  /**
   * Calculate quality score for a keyword
   */
  async calculateQualityScore(keywordId: string): Promise<QualityScoreResponse> {
    try {
      const keyword = await SearchKeyword.findById(keywordId);
      if (!keyword) {
        throw new Error('Keyword not found');
      }

      const factors = await this.calculateFactors(keyword);
      const qualityScore = this.computeScore(factors);

      // Update keyword with new quality score
      keyword.qualityScore = qualityScore;
      keyword.estimatedCpc = keyword.bid * (qualityScore / 10);
      await keyword.save();

      // Record metric
      qualityScoreDistribution.observe({ campaign_id: keyword.campaignId.toString() }, qualityScore);

      logger.info('Quality score calculated', { keywordId, qualityScore });

      return {
        keywordId: keyword._id.toString(),
        term: keyword.term,
        qualityScore,
        factors,
        estimatedCpc: keyword.estimatedCpc,
        suggestions: this.generateSuggestions(factors, qualityScore),
      };
    } catch (error) {
      logger.error('Failed to calculate quality score', { error, keywordId });
      throw error;
    }
  }

  /**
   * Calculate all quality scores for a campaign
   */
  async calculateCampaignQualityScores(campaignId: string): Promise<QualityScoreResponse[]> {
    try {
      const keywords = await SearchKeyword.findByCampaign(campaignId);
      const results: QualityScoreResponse[] = [];

      for (const keyword of keywords) {
        const result = await this.calculateQualityScore(keyword._id.toString());
        results.push(result);
      }

      logger.info('Campaign quality scores calculated', { campaignId, count: results.length });
      return results;
    } catch (error) {
      logger.error('Failed to calculate campaign quality scores', { error, campaignId });
      throw error;
    }
  }

  /**
   * Calculate quality score factors
   */
  private async calculateFactors(keyword: ISearchKeyword): Promise<QualityScoreFactors> {
    // Get historical performance data
    const performance = await SearchPerformance.find({
      campaignId: keyword.campaignId,
    })
      .sort({ date: -1 })
      .limit(30);

    // Calculate expected CTR based on historical data
    const avgCtr = performance.length > 0
      ? performance.reduce((sum, p) => sum + p.ctr, 0) / performance.length
      : 2.0; // Default CTR

    // Expected CTR score (0-10 scale)
    const expectedCtr = this.scoreCtr(avgCtr);

    // Ad relevance score based on keyword-ad matching
    const ads = await SearchAd.findByCampaign(keyword.campaignId.toString());
    const adRelevance = this.calculateAdRelevance(keyword, ads);

    // Landing page experience (simplified - would need actual page analysis)
    const landingPage = await this.calculateLandingPageScore(keyword);

    return {
      expectedCtr,
      adRelevance,
      landingPageExperience: landingPage,
    };
  }

  /**
   * Score CTR on0-10 scale
   */
  private scoreCtr(ctr: number): number {
    // Typical CTR ranges from 1% to 10%
    // Map to0-10 scale
    if (ctr >= 10) return 10;
    if (ctr <= 0) return 1;
    return Math.max(1, Math.min(10, Math.round(ctr)));
  }

  /**
   * Calculate ad relevance score
   */
  private calculateAdRelevance(keyword: ISearchKeyword, ads: any[]): number {
    if (ads.length === 0) return 5; // Default

    let maxRelevance = 0;

    for (const ad of ads) {
      const headlineWords = ad.headline.toLowerCase().split(' ');
      const descWords = ad.description.toLowerCase().split(' ');
      const keywordWords = keyword.term.toLowerCase().split(' ');

      // Count matching words
      let matches = 0;
      keywordWords.forEach((kw) => {
        if (headlineWords.includes(kw) || descWords.includes(kw)) {
          matches++;
        }
      });

      const relevance = matches / keywordWords.length;
      maxRelevance = Math.max(maxRelevance, relevance);
    }

    return Math.round(maxRelevance * 10);
  }

  /**
   * Calculate landing page score (simplified)
   */
  private async calculateLandingPageScore(keyword: ISearchKeyword): Promise<number> {
    // In production, this would analyze the actual landing page
    // For now, return a score based on keyword presence in URL
    const ads = await SearchAd.findByCampaign(keyword.campaignId.toString());
    if (ads.length === 0) return 5;

    const ad = ads[0];
    const url = ad.url.toLowerCase();
    const keyword = keyword.term.toLowerCase();

    // Check if keyword appears in URL
    if (url.includes(keyword)) {
      return 10;
    }

    // Check partial match
    const keywordWords = keyword.split(' ');
    const matches = keywordWords.filter((w) => url.includes(w)).length;
    if (matches > 0) {
      return Math.round((matches / keywordWords.length) * 10);
    }

    return 5; // Default
  }

  /**
   * Compute overall quality score from factors
   */
  private computeScore(factors: QualityScoreFactors): number {
    const weights = config.qualityScoreFactors;

    const score =
      factors.expectedCtr * weights.ctr +
      factors.adRelevance * weights.relevance +
      factors.landingPageExperience * weights.landingPage;

    return Math.max(1, Math.min(10, Math.round(score)));
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(factors: QualityScoreFactors, score: number): string[] {
    const suggestions: string[] = [];

    if (factors.expectedCtr < 7) {
      suggestions.push('Improve ad copy to increase click-through rate');
      suggestions.push('Use more compelling headlines with call-to-action');
    }

    if (factors.adRelevance < 7) {
      suggestions.push('Ensure ad text directly relates to keyword');
      suggestions.push('Include target keywords in headlines and descriptions');
    }

    if (factors.landingPageExperience < 7) {
      suggestions.push('Improve landing page load speed');
      suggestions.push('Ensure landing page content matches ad messaging');
      suggestions.push('Add relevant keywords to landing page content');
    }

    if (score < 5) {
      suggestions.push('Consider pausing low-performing keywords');
      suggestions.push('Review competitor ads for inspiration');
    }

    if (suggestions.length === 0) {
      suggestions.push('Quality score is optimal. Continue monitoring performance.');
    }

    return suggestions;
  }

  /**
   * Get quality score for all keywords in campaign
   */
  async getCampaignQualityScores(campaignId: string): Promise<QualityScoreResponse[]> {
    try {
      const keywords = await SearchKeyword.findByCampaign(campaignId);
      const results: QualityScoreResponse[] = [];

      for (const keyword of keywords) {
        const factors = await this.calculateFactors(keyword);
        const score = this.computeScore(factors);

        results.push({
          keywordId: keyword._id.toString(),
          term: keyword.term,
          qualityScore: score,
          factors,
          estimatedCpc: keyword.bid * (score / 10),
          suggestions: this.generateSuggestions(factors, score),
        });
      }

      return results;
    } catch (error) {
      logger.error('Failed to get campaign quality scores', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get average quality score for campaign
   */
  async getAverageQualityScore(campaignId: string): Promise<number> {
    try {
      const scores = await this.getCampaignQualityScores(campaignId);
      if (scores.length === 0) return 5;

      const sum = scores.reduce((acc, s) => acc + s.qualityScore, 0);
      return Math.round((sum / scores.length) * 10) / 10;
    } catch (error) {
      logger.error('Failed to get average quality score', { error, campaignId });
      return 5;
    }
  }
}

export const qualityScoreService = new QualityScoreService();