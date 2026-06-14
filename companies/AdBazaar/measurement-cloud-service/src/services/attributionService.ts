import { v4 as uuidv4 } from 'uuid';
import { Attribution, CampaignAttributionSummary, IAttribution, AttributionModel, ITouchpoint, ICreditAllocation } from '../models/Attribution';
import { logAttributionEvent } from '../utils/logger';
import { attributionConversions, attributionTouchpoints, dbOperationDuration } from '../utils/metrics';

export interface TouchpointInput {
  type: string;
  channel: string;
  timestamp: Date;
  campaignId?: string;
  placementId?: string;
  creativeId?: string;
  score?: number;
}

export interface AttributionInput {
  campaignId: string;
  model: AttributionModel;
  conversionId: string;
  customerId?: string;
  conversionValue: number;
  conversionTimestamp: Date;
  touchpoints: TouchpointInput[];
  windowDays?: number; // Default attribution window
}

class AttributionService {
  /**
   * Record attribution for a conversion
   */
  async recordAttribution(input: AttributionInput): Promise<IAttribution> {
    const startTime = Date.now();

    try {
      // Sort touchpoints by timestamp
      const sortedTouchpoints = [...input.touchpoints].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Calculate credit allocation based on model
      const creditAllocation = this.calculateCreditAllocation(
        input.model,
        sortedTouchpoints,
        input.conversionValue
      );

      const attribution = new Attribution({
        campaignId: input.campaignId,
        model: input.model,
        conversionId: input.conversionId,
        customerId: input.customerId,
        conversionValue: input.conversionValue,
        conversionTimestamp: input.conversionTimestamp,
        touchpoints: sortedTouchpoints.map((tp) => ({
          touchpointId: uuidv4(),
          ...tp
        })),
        creditAllocation,
        windowStart: new Date(
          input.conversionTimestamp.getTime() - (input.windowDays || 30) * 24 * 60 * 60 * 1000
        ),
        windowEnd: input.conversionTimestamp
      });

      await attribution.save();

      // Record metrics
      attributionConversions.inc({
        campaign_id: input.campaignId,
        model_type: input.model
      });

      attributionTouchpoints.set(
        { campaign_id: input.campaignId },
        sortedTouchpoints.length
      );

      logAttributionEvent(
        'attribution_recorded',
        input.campaignId,
        sortedTouchpoints.map((tp) => tp.channel),
        {
          model: input.model,
          conversionValue: input.conversionValue,
          touchpointCount: sortedTouchpoints.length
        }
      );

      return attribution;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'insert', collection: 'attributions' },
        duration
      );
    }
  }

  /**
   * Calculate credit allocation based on attribution model
   */
  private calculateCreditAllocation(
    model: AttributionModel,
    touchpoints: TouchpointInput[],
    totalValue: number
  ): ICreditAllocation[] {
    switch (model) {
      case AttributionModel.FIRST_TOUCH:
        return this.firstTouchAllocation(touchpoints, totalValue);

      case AttributionModel.LAST_TOUCH:
        return this.lastTouchAllocation(touchpoints, totalValue);

      case AttributionModel.LINEAR:
        return this.linearAllocation(touchpoints, totalValue);

      case AttributionModel.TIME_DECAY:
        return this.timeDecayAllocation(touchpoints, totalValue);

      case AttributionModel.POSITION_BASED:
        return this.positionBasedAllocation(touchpoints, totalValue);

      case AttributionModel.DATA_DRIVEN:
        return this.dataDrivenAllocation(touchpoints, totalValue);

      default:
        return this.linearAllocation(touchpoints, totalValue);
    }
  }

  /**
   * First-touch: 100% credit to first touchpoint
   */
  private firstTouchAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    if (touchpoints.length === 0) return [];

    const firstChannel = touchpoints[0].channel;
    return [
      {
        channel: firstChannel,
        credit: totalValue,
        percentage: 100,
        conversions: 1
      }
    ];
  }

  /**
   * Last-touch: 100% credit to last touchpoint
   */
  private lastTouchAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    if (touchpoints.length === 0) return [];

    const lastChannel = touchpoints[touchpoints.length - 1].channel;
    return [
      {
        channel: lastChannel,
        credit: totalValue,
        percentage: 100,
        conversions: 1
      }
    ];
  }

  /**
   * Linear: Equal credit to all touchpoints
   */
  private linearAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    if (touchpoints.length === 0) return [];

    const channels = [...new Set(touchpoints.map((tp) => tp.channel))];
    const creditPerChannel = totalValue / channels.length;
    const percentagePerChannel = 100 / channels.length;

    return channels.map((channel) => ({
      channel,
      credit: creditPerChannel,
      percentage: percentagePerChannel,
      conversions: touchpoints.filter((tp) => tp.channel === channel).length
    }));
  }

  /**
   * Time-decay: More credit to recent touchpoints (half-life of 7 days)
   */
  private timeDecayAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    if (touchpoints.length === 0) return [];

    const halfLifeDays = 7;
    const now = new Date();
    const decayFactor = Math.log(2) / halfLifeDays;

    // Calculate weights for each touchpoint
    const weights = touchpoints.map((tp) => {
      const daysAgo = (now.getTime() - new Date(tp.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      return Math.exp(-decayFactor * daysAgo);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Group by channel
    const channelWeights: Record<string, number> = {};
    touchpoints.forEach((tp, i) => {
      if (!channelWeights[tp.channel]) {
        channelWeights[tp.channel] = 0;
      }
      channelWeights[tp.channel] += weights[i];
    });

    return Object.entries(channelWeights).map(([channel, weight]) => {
      const percentage = (weight / totalWeight) * 100;
      return {
        channel,
        credit: (weight / totalWeight) * totalValue,
        percentage,
        conversions: touchpoints.filter((tp) => tp.channel === channel).length
      };
    });
  }

  /**
   * Position-based: 40% first, 40% last, 20% distributed among middle
   */
  private positionBasedAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    if (touchpoints.length === 0) return [];
    if (touchpoints.length === 1) {
      return [
        {
          channel: touchpoints[0].channel,
          credit: totalValue,
          percentage: 100,
          conversions: 1
        }
      ];
    }

    const firstChannel = touchpoints[0].channel;
    const lastChannel = touchpoints[touchpoints.length - 1].channel;
    const middleTouchpoints = touchpoints.slice(1, -1);

    const firstCredit = totalValue * 0.4;
    const lastCredit = totalValue * 0.4;
    const middleCredit = totalValue * 0.2;

    const result: ICreditAllocation[] = [];

    // First touchpoint
    const existingFirst = result.find((a) => a.channel === firstChannel);
    if (existingFirst) {
      existingFirst.credit += firstCredit;
      existingFirst.percentage = (existingFirst.credit / totalValue) * 100;
    } else {
      result.push({
        channel: firstChannel,
        credit: firstCredit,
        percentage: 40,
        conversions: 1
      });
    }

    // Last touchpoint (if different from first)
    if (lastChannel !== firstChannel) {
      const existingLast = result.find((a) => a.channel === lastChannel);
      if (existingLast) {
        existingLast.credit += lastCredit;
        existingLast.percentage = (existingLast.credit / totalValue) * 100;
      } else {
        result.push({
          channel: lastChannel,
          credit: lastCredit,
          percentage: 40,
          conversions: 1
        });
      }
    }

    // Middle touchpoints
    if (middleTouchpoints.length > 0) {
      const middleChannels = [...new Set(middleTouchpoints.map((tp) => tp.channel))];
      const creditPerMiddleChannel = middleCredit / middleChannels.length;

      middleChannels.forEach((channel) => {
        const existing = result.find((a) => a.channel === channel);
        if (existing) {
          existing.credit += creditPerMiddleChannel;
          existing.percentage = (existing.credit / totalValue) * 100;
        } else {
          result.push({
            channel,
            credit: creditPerMiddleChannel,
            percentage: (creditPerMiddleChannel / totalValue) * 100,
            conversions: middleTouchpoints.filter((tp) => tp.channel === channel).length
          });
        }
      });
    }

    return result;
  }

  /**
   * Data-driven: Uses ML to determine credit based on touchpoint performance
   */
  private dataDrivenAllocation(touchpoints: TouchpointInput[], totalValue: number): ICreditAllocation[] {
    // In a real implementation, this would use ML model
    // For now, fall back to linear allocation
    return this.linearAllocation(touchpoints, totalValue);
  }

  /**
   * Get attribution data for a campaign
   */
  async getAttributionData(
    campaignId: string,
    options?: {
      model?: AttributionModel;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    summary: {
      totalConversions: number;
      totalValue: number;
      avgTouchpoints: number;
    };
    byModel: {
      model: AttributionModel;
      conversions: number;
      value: number;
      channelBreakdown: { channel: string; percentage: number }[];
    }[];
    touchpointAnalysis: {
      avgDaysToConvert: number;
      channelDistribution: { channel: string; count: number }[];
    };
  }> {
    const startTime = Date.now();

    try {
      const matchQuery: Record<string, unknown> = { campaignId };
      if (options?.model) {
        matchQuery.model = options.model;
      }
      if (options?.startDate || options?.endDate) {
        matchQuery.conversionTimestamp = {};
        if (options.startDate) {
          (matchQuery.conversionTimestamp as Record<string, Date>).$gte = options.startDate;
        }
        if (options.endDate) {
          (matchQuery.conversionTimestamp as Record<string, Date>).$lte = options.endDate;
        }
      }

      const aggregations = await Attribution.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$model',
            totalConversions: { $sum: 1 },
            totalValue: { $sum: '$conversionValue' },
            touchpointCounts: { $push: { $size: '$touchpoints' } }
          }
        },
        {
          $project: {
            model: '$_id',
            totalConversions: 1,
            totalValue: 1,
            avgTouchpoints: {
              $avg: '$touchpointCounts'
            }
          }
        }
      ]);

      const summary = aggregations.reduce(
        (acc, agg) => ({
          totalConversions: acc.totalConversions + agg.totalConversions,
          totalValue: acc.totalValue + agg.totalValue,
          avgTouchpoints: (acc.avgTouchpoints * acc.totalConversions + agg.avgTouchpoints * agg.totalConversions) /
            (acc.totalConversions + agg.totalConversions)
        }),
        { totalConversions: 0, totalValue: 0, avgTouchpoints: 0 }
      );

      const byModel = aggregations.map((agg) => ({
        model: agg.model,
        conversions: agg.totalConversions,
        value: agg.totalValue,
        channelBreakdown: [] // Would be populated with actual aggregation
      }));

      // Get touchpoint analysis
      const touchpointAnalysis = await Attribution.aggregate([
        { $match: matchQuery },
        {
          $project: {
            daysToConvert: {
              $divide: [
                { $subtract: ['$conversionTimestamp', { $min: '$touchpoints.timestamp' }] },
                24 * 60 * 60 * 1000
              ]
            },
            channels: '$touchpoints.channel'
          }
        },
        {
          $group: {
            _id: null,
            avgDaysToConvert: { $avg: '$daysToConvert' },
            allChannels: { $push: '$channels' }
          }
        }
      ]);

      return {
        summary,
        byModel,
        touchpointAnalysis: {
          avgDaysToConvert: touchpointAnalysis[0]?.avgDaysToConvert || 0,
          channelDistribution: []
        }
      };
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'aggregate', collection: 'attributions' },
        duration
      );
    }
  }
}

export const attributionService = new AttributionService();
export default attributionService;