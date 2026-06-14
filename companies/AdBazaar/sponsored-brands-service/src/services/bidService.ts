import { Keyword, BrandCampaign, IKeyword } from '../models';
import { logger, bidGauge } from '../utils';
import { z } from 'zod';

export const SetBidSchema = z.object({
  bid: z.number().min(0.01).max(100),
  keywordIds: z.array(z.string()).optional()
});

export interface BidStrategy {
  type: 'manual' | 'auto' | 'enhanced';
  defaultBid: number;
  maxBid: number;
  targetRoas?: number;
  targetCpa?: number;
}

interface BidRecommendation {
  keywordId: string;
  currentBid: number;
  suggestedBid: number;
  reason: string;
  confidence: number;
}

class BidService {
  async setKeywordBid(campaignId: string, keywordId: string, bid: number): Promise<IKeyword | null> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (bid > campaign.bidStrategy.maxBid) {
        throw new Error(`Bid exceeds maximum bid of ${campaign.bidStrategy.maxBid}`);
      }

      const keyword = await Keyword.findOneAndUpdate(
        { keywordId, campaignId },
        {
          $set: {
            'bid.current': bid,
            'bid.lastUpdated': new Date()
          }
        },
        { new: true }
      );

      if (keyword) {
        bidGauge.set({ campaign_id: campaignId, keyword_id: keywordId }, bid);
        logger.info('Keyword bid set', { campaignId, keywordId, bid });
      }

      return keyword;
    } catch (error) {
      logger.error('Failed to set keyword bid', { error, campaignId, keywordId });
      throw error;
    }
  }

  async setBulkBids(campaignId: string, bids: Array<{ keywordId: string; bid: number }>): Promise<IKeyword[]> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const updates = bids.map(b => ({
        updateOne: {
          filter: { keywordId: b.keywordId, campaignId },
          update: {
            $set: {
              'bid.current': Math.min(b.bid, campaign.bidStrategy.maxBid),
              'bid.lastUpdated': new Date()
            }
          }
        }
      }));

      await Keyword.bulkWrite(updates);

      logger.info('Bulk bids set', { campaignId, count: bids.length });

      return await Keyword.find({ campaignId, keywordId: { $in: bids.map(b => b.keywordId) } });
    } catch (error) {
      logger.error('Failed to set bulk bids', { error, campaignId });
      throw error;
    }
  }

  async setCampaignDefaultBid(campaignId: string, bid: number): Promise<void> {
    try {
      await BrandCampaign.findOneAndUpdate(
        { campaignId },
        { $set: { 'bidStrategy.defaultBid': bid } }
      );

      await Keyword.updateMany(
        { campaignId, status: 'active' },
        { $set: { 'bid.current': bid, 'bid.lastUpdated': new Date() } }
      );

      logger.info('Campaign default bid updated', { campaignId, bid });
    } catch (error) {
      logger.error('Failed to set campaign default bid', { error, campaignId });
      throw error;
    }
  }

  async getRecommendations(campaignId: string): Promise<BidRecommendation[]> {
    try {
      const keywords = await Keyword.find({ campaignId, status: 'active' });

      const recommendations: BidRecommendation[] = keywords.map(keyword => {
        const perf = keyword.performance;
        let suggestedBid = keyword.bid.current;
        let reason = '';
        let confidence = 0.5;

        if (perf.impressions > 0 && perf.clicks > 0) {
          const ctr = (perf.clicks / perf.impressions) * 100;
          const cpc = perf.cpc;

          if (ctr < 0.5 && perf.impressions > 1000) {
            suggestedBid = keyword.bid.current * 0.9;
            reason = 'Low CTR - consider lowering bid';
            confidence = 0.7;
          } else if (ctr > 3 && perf.clicks > 50) {
            suggestedBid = keyword.bid.current * 1.2;
            reason = 'High CTR - consider increasing bid to capture more volume';
            confidence = 0.8;
          }

          if (cpc > 0 && perf.roas > 0) {
            const targetCpc = cpc * 0.9;
            if (suggestedBid > targetCpc) {
              suggestedBid = targetCpc;
              reason += ' | Optimizing for better efficiency';
            }
          }

          if (perf.conversions > 5 && perf.roas > 2) {
            suggestedBid = keyword.bid.current * 1.15;
            reason = 'Strong conversions - increase bid to scale';
            confidence = 0.85;
          }
        }

        suggestedBid = Math.max(0.1, Math.min(suggestedBid, keyword.bid.current * 2));

        return {
          keywordId: keyword.keywordId,
          currentBid: keyword.bid.current,
          suggestedBid: Math.round(suggestedBid * 100) / 100,
          reason: reason || 'No specific recommendation - maintain current bid',
          confidence: Math.round(confidence * 100) / 100
        };
      });

      logger.info('Bid recommendations generated', { campaignId, count: recommendations.length });
      return recommendations;
    } catch (error) {
      logger.error('Failed to generate bid recommendations', { error, campaignId });
      throw error;
    }
  }

  async applyAutoBid(campaignId: string): Promise<void> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.bidStrategy.type === 'auto') {
        const recommendations = await this.getRecommendations(campaignId);

        for (const rec of recommendations) {
          await Keyword.findOneAndUpdate(
            { keywordId: rec.keywordId },
            {
              $set: {
                'bid.current': rec.suggestedBid,
                'bid.suggested': rec.suggestedBid,
                'bid.lastUpdated': new Date()
              }
            }
          );
        }

        logger.info('Auto bid applied', { campaignId, updates: recommendations.length });
      }
    } catch (error) {
      logger.error('Failed to apply auto bid', { error, campaignId });
      throw error;
    }
  }

  async calculateOptimalBid(campaignId: string, keywordId: string): Promise<number> {
    try {
      const keyword = await Keyword.findOne({ keywordId, campaignId });
      if (!keyword) {
        throw new Error('Keyword not found');
      }

      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      let optimalBid = keyword.bid.current;

      if (keyword.performance.impressions > 0 && keyword.performance.clicks > 0) {
        const targetCTR = 2.0;
        const currentCTR = keyword.performance.ctr;

        if (currentCTR < targetCTR) {
          const ctrRatio = currentCTR / targetCTR;
          optimalBid = keyword.bid.current * Math.min(1.5, Math.max(0.8, ctrRatio));
        }

        if (keyword.performance.conversions > 0) {
          const avgCpa = keyword.performance.spend / keyword.performance.conversions;
          const targetCpa = avgCpa * 0.9;

          if (keyword.performance.cpc > targetCpa) {
            optimalBid = targetCpa;
          }
        }

        if (keyword.qualityScore < 5) {
          optimalBid = optimalBid * (keyword.qualityScore / 5);
        }
      }

      return Math.max(0.1, Math.min(optimalBid, campaign.bidStrategy.maxBid));
    } catch (error) {
      logger.error('Failed to calculate optimal bid', { error, campaignId, keywordId });
      throw error;
    }
  }

  async getBidHistory(campaignId: string, keywordId?: string): Promise<Array<{
    keywordId: string;
    bids: Array<{ bid: number; timestamp: Date }>;
  }>> {
    try {
      const query: Record<string, unknown> = { campaignId };
      if (keywordId) query.keywordId = keywordId;

      const keywords = await Keyword.find(query);

      return keywords.map(kw => ({
        keywordId: kw.keywordId,
        bids: [{
          bid: kw.bid.current,
          timestamp: kw.bid.lastUpdated
        }]
      }));
    } catch (error) {
      logger.error('Failed to get bid history', { error, campaignId });
      throw error;
    }
  }
}

export const bidService = new BidService();