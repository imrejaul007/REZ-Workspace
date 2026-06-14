import { BrandCampaign, Keyword } from '../models';
import { logger } from '../utils';

export interface KeywordRecommendation {
  term: string;
  matchType: 'broad' | 'phrase' | 'exact';
  estimatedVolume: number;
  competition: 'low' | 'medium' | 'high';
  suggestedBid: number;
  reason: string;
}

export interface AudienceRecommendation {
  segment: string;
  estimatedReach: number;
  estimatedCTR: number;
  suggestedBid: number;
  reason: string;
}

export interface CreativeRecommendation {
  type: 'headline' | 'description' | 'image';
  content: string;
  reason: string;
  expectedCTR: number;
}

export interface BudgetRecommendation {
  dailyBudget: number;
  suggestedBid: number;
  estimatedImpressions: number;
  estimatedClicks: number;
  estimatedConversions: number;
  reason: string;
}

export interface CampaignOptimization {
  campaignId: string;
  currentIssues: string[];
  recommendations: string[];
  expectedImpact: {
    impressionsChange: number;
    ctrChange: number;
    roasChange: number;
  };
}

interface TrendData {
  keyword: string;
  trend: 'rising' | 'falling' | 'stable';
  volumeChange: number;
}

class RecommendationService {
  async getKeywordRecommendations(campaignId: string): Promise<KeywordRecommendation[]> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const existingKeywords = new Set(campaign.keywords.map(k => k.toLowerCase()));

      const baseKeywords = campaign.keywords.length > 0
        ? campaign.keywords
        : [campaign.brandName.toLowerCase().split(' ')[0]];

      const recommendations: KeywordRecommendation[] = [];

      for (const baseKeyword of baseKeywords) {
        const variations = [
          { term: `${baseKeyword} near me`, matchType: 'exact' as const },
          { term: `${baseKeyword} online`, matchType: 'phrase' as const },
          { term: `${baseKeyword} buy`, matchType: 'broad' as const },
          { term: `${baseKeyword} price`, matchType: 'phrase' as const },
          { term: `best ${baseKeyword}`, matchType: 'exact' as const },
          { term: `cheap ${baseKeyword}`, matchType: 'broad' as const },
          { term: `${baseKeyword} reviews`, matchType: 'phrase' as const },
          { term: `${baseKeyword} store`, matchType: 'exact' as const }
        ];

        for (const variation of variations) {
          if (!existingKeywords.has(variation.term.toLowerCase())) {
            const estimatedVolume = Math.floor(Math.random() * 5000) + 500;
            const competition = estimatedVolume > 3000 ? 'high'
              : estimatedVolume > 1500 ? 'medium'
              : 'low';

            const suggestedBid = competition === 'high' ? 1.50
              : competition === 'medium' ? 0.75
              : 0.40;

            recommendations.push({
              term: variation.term,
              matchType: variation.matchType,
              estimatedVolume,
              competition,
              suggestedBid: Math.round(suggestedBid * 100) / 100,
              reason: `Variation of "${baseKeyword}" targeting ${variation.matchType} match`
            });
          }
        }
      }

      logger.info('Keyword recommendations generated', {
        campaignId,
        count: recommendations.length
      });

      return recommendations.slice(0, 20);
    } catch (error) {
      logger.error('Failed to generate keyword recommendations', { error, campaignId });
      throw error;
    }
  }

  async getAudienceRecommendations(campaignId: string): Promise<AudienceRecommendation[]> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const baseSegments = [
        { segment: 'shoppers_25_34', estimatedReach: 15000, estimatedCTR: 2.5 },
        { segment: 'shoppers_35_44', estimatedReach: 12000, estimatedCTR: 2.1 },
        { segment: 'frequent_buyers', estimatedReach: 8000, estimatedCTR: 3.2 },
        { segment: 'deal_seekers', estimatedReach: 20000, estimatedCTR: 1.8 },
        { segment: 'brand_loyalists', estimatedReach: 5000, estimatedCTR: 4.5 }
      ];

      const recommendations: AudienceRecommendation[] = baseSegments
        .filter(seg => !campaign.targeting.audiences.includes(seg.segment))
        .map(seg => ({
          segment: seg.segment,
          estimatedReach: seg.estimatedReach,
          estimatedCTR: seg.estimatedCTR,
          suggestedBid: seg.estimatedCTR > 3 ? 0.6 : 0.4,
          reason: `High potential audience with estimated CTR of ${seg.estimatedCTR}%`
        }));

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate audience recommendations', { error, campaignId });
      throw error;
    }
  }

  async getCreativeRecommendations(campaignId: string): Promise<CreativeRecommendation[]> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const recommendations: CreativeRecommendation[] = [];

      if (campaign.creativeAssets.headlines.length < 3) {
        recommendations.push({
          type: 'headline',
          content: `Discover ${campaign.brandName} - Premium Quality`,
          reason: 'Adding branded headline improves brand recall by 23%',
          expectedCTR: 2.8
        });
        recommendations.push({
          type: 'headline',
          content: `${campaign.brandName} - Up to 40% Off Today`,
          reason: 'Promotional headline drives urgency and conversions',
          expectedCTR: 3.5
        });
      }

      if (campaign.creativeAssets.descriptions.length < 2) {
        recommendations.push({
          type: 'description',
          content: `Explore our wide range of ${campaign.brandName} products. Free shipping on orders over $50.`,
          reason: 'Product-focused description improves relevance score',
          expectedCTR: 2.2
        });
      }

      if (!campaign.creativeAssets.logoUrl) {
        recommendations.push({
          type: 'image',
          content: 'brand_logo',
          reason: 'Adding brand logo increases trust and CTR by 15%',
          expectedCTR: 1.5
        });
      }

      logger.info('Creative recommendations generated', {
        campaignId,
        count: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate creative recommendations', { error, campaignId });
      throw error;
    }
  }

  async getBudgetRecommendations(campaignId: string): Promise<BudgetRecommendation> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const currentPerformance = campaign.performance;
      const keywords = await Keyword.find({ campaignId, status: 'active' });

      let suggestedDailyBudget = campaign.budget.daily || 50;

      if (keywords.length > 0) {
        const avgSearchVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0) / keywords.length;
        const estimatedImpressions = avgSearchVolume * 0.1;
        const estimatedClicks = estimatedImpressions * 0.02;
        const avgCPC = keywords.reduce((sum, k) => sum + k.bid.current, 0) / keywords.length;

        const targetConversions = currentPerformance.conversions > 0
          ? currentPerformance.conversions * 1.3
          : 10;

        const targetCPC = avgCPC * 0.9;
        suggestedDailyBudget = targetConversions * targetCPC * 1.2;
      }

      if (currentPerformance.impressions > 10000 && currentPerformance.ctr < 0.5) {
        suggestedDailyBudget = Math.min(suggestedDailyBudget * 0.8, campaign.budget.lifetime * 0.1);
      }

      const avgBid = keywords.length > 0
        ? keywords.reduce((sum, k) => sum + k.bid.current, 0) / keywords.length
        : 0.5;

      return {
        dailyBudget: Math.round(suggestedDailyBudget * 100) / 100,
        suggestedBid: Math.round(avgBid * 100) / 100,
        estimatedImpressions: Math.floor(suggestedDailyBudget / avgBid * 50),
        estimatedClicks: Math.floor(suggestedDailyBudget / avgBid * 1),
        estimatedConversions: Math.floor(suggestedDailyBudget / avgBid * 0.05),
        reason: suggestedDailyBudget > campaign.budget.daily
          ? 'Increase budget to capture additional high-performing impressions'
          : 'Optimize budget allocation for better efficiency'
      };
    } catch (error) {
      logger.error('Failed to generate budget recommendations', { error, campaignId });
      throw error;
    }
  }

  async getCampaignOptimization(campaignId: string): Promise<CampaignOptimization> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (campaign.performance.ctr < 0.5 && campaign.performance.impressions > 1000) {
        issues.push('Low CTR indicates keyword targeting may need refinement');
        recommendations.push('Review and add more specific match type keywords');
        recommendations.push('Consider negative keywords to improve relevance');
      }

      if (campaign.performance.roas < 2 && campaign.budget.spent > 100) {
        issues.push('ROAS below target threshold');
        recommendations.push('Lower bids on underperforming keywords');
        recommendations.push('Focus budget on top 20% performing keywords');
      }

      if (campaign.keywords.length < 5) {
        issues.push('Limited keyword coverage may restrict reach');
        recommendations.push('Add keyword variations and long-tail keywords');
      }

      if (campaign.creativeAssets.headlines.length < 3) {
        issues.push('Limited creative assets may impact CTR');
        recommendations.push('Add 3-5 headline variations for A/B testing');
      }

      const keywords = await Keyword.find({ campaignId, status: 'active' });
      const lowPerformers = keywords.filter(k => k.performance.ctr < 0.3 && k.performance.impressions > 100);

      if (lowPerformers.length > keywords.length * 0.3) {
        issues.push('More than 30% of keywords have low performance');
        recommendations.push('Pause underperforming keywords and reallocate budget');
      }

      const expectedImpact = {
        impressionsChange: issues.length > 3 ? 15 : 5,
        ctrChange: recommendations.length > 2 ? 0.5 : 0.2,
        roasChange: recommendations.length > 2 ? 0.8 : 0.3
      };

      return {
        campaignId,
        currentIssues: issues,
        recommendations,
        expectedImpact
      };
    } catch (error) {
      logger.error('Failed to generate campaign optimization', { error, campaignId });
      throw error;
    }
  }

  async getTrendingKeywords(category: string): Promise<TrendData[]> {
    try {
      const trendMap: Record<string, number> = {
        'electronics': 12,
        'fashion': 8,
        'home': 15,
        'beauty': 20,
        'sports': 10,
        'default': 5
      };

      const baseTrend = trendMap[category] || trendMap.default;

      const trending: TrendData[] = [
        { keyword: `${category} deals`, trend: 'rising', volumeChange: baseTrend },
        { keyword: `${category} sale`, trend: 'rising', volumeChange: baseTrend * 0.8 },
        { keyword: `buy ${category} online`, trend: 'stable', volumeChange: 0 },
        { keyword: `${category} near me`, trend: 'rising', volumeChange: baseTrend * 1.2 },
        { keyword: `${category} coupon`, trend: 'falling', volumeChange: -5 }
      ];

      return trending;
    } catch (error) {
      logger.error('Failed to get trending keywords', { error, category });
      throw error;
    }
  }

  async getBidRecommendations(campaignId: string): Promise<Array<{
    keywordId: string;
    currentBid: number;
    suggestedBid: number;
    reason: string;
    confidence: number;
  }>> {
    try {
      const keywords = await Keyword.find({ campaignId, status: 'active' });

      const recommendations = keywords.map(keyword => {
        let suggestedBid = keyword.bid.current;
        let reason = 'Maintain current bid';
        let confidence = 0.5;

        const perf = keyword.performance;

        if (perf.impressions > 0 && perf.clicks > 0) {
          const ctr = (perf.clicks / perf.impressions) * 100;

          if (ctr > 3 && perf.conversions > 5) {
            suggestedBid = keyword.bid.current * 1.25;
            reason = 'Strong performance - increase bid to scale';
            confidence = 0.85;
          } else if (ctr < 0.5 && perf.impressions > 1000) {
            suggestedBid = keyword.bid.current * 0.85;
            reason = 'Low CTR - reduce bid to improve efficiency';
            confidence = 0.75;
          }

          if (perf.roas > 3) {
            suggestedBid = keyword.bid.current * 1.15;
            reason = 'High ROAS - opportunity to increase volume';
            confidence = 0.8;
          }
        }

        if (keyword.qualityScore < 4) {
          suggestedBid = Math.max(suggestedBid * 0.9, 0.2);
          reason += ' | Consider improving Quality Score';
        }

        return {
          keywordId: keyword.keywordId,
          currentBid: keyword.bid.current,
          suggestedBid: Math.round(Math.min(suggestedBid, keyword.bid.current * 2) * 100) / 100,
          reason,
          confidence: Math.round(confidence * 100) / 100
        };
      });

      return recommendations.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Failed to generate bid recommendations', { error, campaignId });
      throw error;
    }
  }

  async getTimeOfDayRecommendations(campaignId: string): Promise<Array<{
    hour: number;
    suggestedBidMultiplier: number;
    reason: string;
  }>> {
    try {
      const recommendations = [];

      for (let hour = 0; hour < 24; hour++) {
        let multiplier = 1.0;
        let reason = 'Standard bid';

        if (hour >= 9 && hour <= 11) {
          multiplier = 1.3;
          reason = 'High conversion period - morning shoppers';
        } else if (hour >= 19 && hour <= 21) {
          multiplier = 1.4;
          reason = 'Peak evening shopping hours';
        } else if (hour >= 12 && hour <= 14) {
          multiplier = 1.1;
          reason = 'Lunch break shopping';
        } else if (hour >= 22 || hour <= 5) {
          multiplier = 0.7;
          reason = 'Low activity period';
        }

        recommendations.push({
          hour,
          suggestedBidMultiplier: Math.round(multiplier * 100) / 100,
          reason
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to get time of day recommendations', { error, campaignId });
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();