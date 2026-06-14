import {
  Attribution,
  BusinessOutcome,
  TouchpointEvent,
  IAttribution,
  AttributionModel
} from '../models/outcomeModels.js';
import logger from 'utils/logger.js';
import { startTimer, dbOperationDuration } from '../utils/metrics.js';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

export interface Touchpoint {
  touchpointId: string;
  channel: string;
  source: string;
  timestamp: Date;
  interactionType: 'impression' | 'click' | 'engagement';
  campaign?: string;
  adGroup?: string;
  keyword?: string;
  creative?: string;
  placement?: string;
}

export interface AttributionResult {
  attributionId: string;
  outcomeId: string;
  campaignId: string;
  touchpoints: Array<{
    channel: string;
    credit: number;
    weight: number;
    attributedRevenue: number;
  }>;
  totalCredit: number;
  attributedRevenue: number;
  model: AttributionModel;
}

export interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: number;
  credit: number;
  percentage: number;
}

/**
 * Attribution Service
 * Multi-touch attribution modeling for business outcomes
 */
export class AttributionService {
  /**
   * Track a touchpoint event
   */
  async trackTouchpoint(input: {
    customerId?: string;
    sessionId: string;
    channel: string;
    source: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    interactionType: 'impression' | 'click' | 'engagement' | 'conversion';
    device?: string;
    location?: string;
    referrer?: string;
    landingPage?: string;
    campaignId?: string;
    adId?: string;
    value?: number;
    timestamp?: Date;
  }): Promise<string> {
    const endTimer = startTimer();
    const touchpointId = generateId('tp');

    logger.info('Tracking touchpoint', {
      touchpointId,
      channel: input.channel,
      interactionType: input.interactionType
    });

    try {
      await TouchpointEvent.create({
        touchpointId,
        customerId: input.customerId,
        sessionId: input.sessionId,
        channel: input.channel,
        source: input.source,
        medium: input.medium,
        campaign: input.campaign,
        content: input.content,
        term: input.term,
        interactionType: input.interactionType,
        device: input.device,
        location: input.location,
        referrer: input.referrer,
        landingPage: input.landingPage,
        campaignId: input.campaignId,
        adId: input.adId,
        value: input.value,
        timestamp: input.timestamp || new Date(),
      });

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'touchpoint_events' }, duration);

      return touchpointId;
    } catch (error) {
      logger.error('Failed to track touchpoint', error);
      throw error;
    }
  }

  /**
   * Record a business outcome and calculate attribution
   */
  async recordOutcome(input: {
    campaignId: string;
    advertiserId: string;
    type: 'conversion' | 'purchase' | 'signup' | 'lead' | 'engagement' | 'impression' | 'click';
    value: number;
    currency?: string;
    customerId?: string;
    sessionId?: string;
    device?: string;
    location?: string;
    conversionData: {
      channel: string;
      source?: string;
      medium?: string;
      campaign?: string;
      keyword?: string;
      adId?: string;
      creativeId?: string;
    };
    timestamp?: Date;
  }): Promise<string> {
    const endTimer = startTimer();
    const outcomeId = generateId('out');

    logger.info('Recording business outcome', { outcomeId, campaignId: input.campaignId, value });

    try {
      // Create the outcome record
      await BusinessOutcome.create({
        outcomeId,
        campaignId: input.campaignId,
        advertiserId: input.advertiserId,
        type: input.type,
        value: input.value,
        currency: input.currency || 'INR',
        customerId: input.customerId,
        sessionId: input.sessionId,
        device: input.device,
        location: input.location,
        conversionData: input.conversionData,
        timestamp: input.timestamp || new Date(),
      });

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'business_outcomes' }, duration);

      return outcomeId;
    } catch (error) {
      logger.error('Failed to record outcome', error);
      throw error;
    }
  }

  /**
   * Calculate attribution for an outcome
   */
  async calculateAttribution(
    outcomeId: string,
    model: AttributionModel = AttributionModel.LINEAR,
    lookbackWindow: number = 30
  ): Promise<AttributionResult | null> {
    const endTimer = startTimer();

    try {
      // Get the outcome
      const outcome = await BusinessOutcome.findOne({ outcomeId }).lean();
      if (!outcome) {
        logger.warn('Outcome not found for attribution', { outcomeId });
        return null;
      }

      // Get touchpoints for this customer/session
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackWindow);

      const query: Record<string, any> = {
        timestamp: { $gte: lookbackDate },
 };

      if (outcome.customerId) {
        query.customerId = outcome.customerId;
      } else if (outcome.sessionId) {
        query.sessionId = outcome.sessionId;
      } else {
        return null;
      }

      const touchpoints = await TouchpointEvent.find(query)
        .sort({ timestamp: 1 })
        .lean();

      if (touchpoints.length === 0) {
        return null;
      }

      // Calculate credit based on attribution model
      const creditedTouchpoints = this.applyAttributionModel(touchpoints, model, outcome.value);

      // Create attribution record
      const attributionId = generateId('attr');
      const attribution = await Attribution.create({
        attributionId,
        outcomeId,
        campaignId: outcome.campaignId,
        touchpoints: creditedTouchpoints.map((tp, index) => ({
          touchpointId: tp.touchpointId,
          channel: tp.channel,
          source: tp.source,
          timestamp: tp.timestamp,
          interactionType: tp.interactionType,
          credit: tp.credit,
          weight: tp.weight,
          position: index + 1,
          campaign: tp.campaign,
          adGroup: tp.adGroup,
          keyword: tp.keyword,
          creative: tp.creative,
          placement: tp.placement,
        })),
        attributionModel: model,
        totalCredit: creditedTouchpoints.reduce((sum, tp) => sum + tp.credit, 0),
        attributedRevenue: outcome.value,
        attributedConversions: 1,
      });

      // Update outcome with attribution
      await BusinessOutcome.findOneAndUpdate(
        { outcomeId },
        {
          attributedRevenue: outcome.value,
          attributionConfidence: creditedTouchpoints.reduce((sum, tp) => sum + tp.credit, 0),
        }
      );

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'attributions' }, duration);

      logger.info('Attribution calculated', {
        attributionId,
        outcomeId,
        model,
        touchpointCount: touchpoints.length,
        duration
      });

      return {
        attributionId,
        outcomeId,
        campaignId: outcome.campaignId,
        touchpoints: creditedTouchpoints.map(tp => ({
          channel: tp.channel,
          credit: tp.credit,
          weight: tp.weight,
          attributedRevenue: tp.credit * outcome.value,
        })),
        totalCredit: creditedTouchpoints.reduce((sum, tp) => sum + tp.credit, 0),
        attributedRevenue: outcome.value,
        model,
      };
    } catch (error) {
      logger.error('Failed to calculate attribution', error);
      throw error;
    }
  }

  /**
   * Apply attribution model to touchpoints
   */
  private applyAttributionModel(
    touchpoints: any[],
    model: AttributionModel,
    totalValue: number
  ): Array<any& { credit: number; weight: number }> {
    const n = touchpoints.length;

    switch (model) {
      case AttributionModel.FIRST_TOUCH:
        //100% credit to first touchpoint
        return touchpoints.map((tp, i) => ({
          ...tp,
          credit: i === 0 ? 1 : 0,
          weight: i === 0 ? 1 : 0,
        }));

      case AttributionModel.LAST_TOUCH:
        // 100% credit to last touchpoint
        return touchpoints.map((tp, i) => ({
          ...tp,
          credit: i === n - 1 ? 1 : 0,
          weight: i === n - 1 ? 1 : 0,
        }));

      case AttributionModel.LINEAR:
        // Equal credit to all touchpoints
        const linearCredit = 1 / n;
        return touchpoints.map(tp => ({
          ...tp,
          credit: linearCredit,
          weight: linearCredit,
        }));

      case AttributionModel.TIME_DECAY:
        // More credit to recent touchpoints (exponential decay)
        const decayFactor = 0.5;
        const timeDecayWeights = touchpoints.map((_, i) =>
          Math.pow(decayFactor, n - i - 1)
        );
        const timeDecaySum = timeDecayWeights.reduce((a, b) => a + b, 0);
        return touchpoints.map((tp, i) => ({
          ...tp,
          credit: timeDecayWeights[i] / timeDecaySum,
          weight: timeDecayWeights[i] / timeDecaySum,
        }));

      case AttributionModel.POSITION_BASED:
        //40% to first, 40% to last, 20% distributed among middle
        const firstCredit = 0.4;
        const lastCredit = 0.4;
        const middleCredit = (1 - firstCredit - lastCredit) / Math.max(1, n - 2);

        return touchpoints.map((tp, i) => {
          let credit: number;
          if (n === 1) {
            credit = 1;
          } else if (i === 0) {
            credit = firstCredit;
          } else if (i === n - 1) {
            credit = lastCredit;
          } else {
            credit = middleCredit;
          }
          return { ...tp, credit, weight: credit };
        });

      case AttributionModel.DATA_DRIVEN:
        // Simplified data-driven: weight by interaction type
        const interactionWeights: Record<string, number> = {
          click: 0.5,
          engagement: 0.3,
          impression: 0.2,
        };
        const interactionSum = touchpoints.reduce(
          (sum, tp) => sum + (interactionWeights[tp.interactionType] || 0.2),
          0
        );
        return touchpoints.map(tp => ({
          ...tp,
          credit: (interactionWeights[tp.interactionType] || 0.2) / interactionSum,
          weight: (interactionWeights[tp.interactionType] || 0.2) / interactionSum,
        }));

      default:
        // Default to linear
        const defaultCredit = 1 / n;
        return touchpoints.map(tp => ({
          ...tp,
          credit: defaultCredit,
          weight: defaultCredit,
        }));
    }
  }

  /**
   * Get attribution report for a campaign
   */
  async getAttributionReport(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      model?: AttributionModel;
    }
  ): Promise<{
    totalConversions: number;
    totalRevenue: number;
    byChannel: ChannelAttribution[];
    byTouchpoint: Array<{
      position: number;
      conversions: number;
      credit: number;
    }>;
    model: AttributionModel;
  }> {
    const query: Record<string, any> = { campaignId };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    // Get all outcomes for the campaign
    const outcomes = await BusinessOutcome.find(query).lean();

    // Get all attributions
    const attributions = await Attribution.find({ campaignId }).lean();

    // Calculate channel attribution
    const channelData: Record<string, { conversions: number; revenue: number; credit: number }> = {};
    const positionData: Record<number, { conversions: number; credit: number }> = {};

    for (const attr of attributions) {
      for (const tp of attr.touchpoints) {
        if (!channelData[tp.channel]) {
          channelData[tp.channel] = { conversions: 0, revenue: 0, credit: 0 };
        }
        channelData[tp.channel].conversions++;
        channelData[tp.channel].credit += tp.credit;
        channelData[tp.channel].revenue += tp.credit * attr.attributedRevenue;

        if (!positionData[tp.position]) {
          positionData[tp.position] = { conversions: 0, credit: 0 };
        }
        positionData[tp.position].conversions++;
        positionData[tp.position].credit += tp.credit;
      }
    }

    const totalCredit = Object.values(channelData).reduce((sum, c) => sum + c.credit, 0);

    const byChannel: ChannelAttribution[] = Object.entries(channelData).map(([channel, data]) => ({
      channel,
      conversions: data.conversions,
      revenue: data.revenue,
      credit: data.credit,
      percentage: totalCredit > 0 ? (data.credit / totalCredit) * 100 : 0,
    }));

    const byTouchpoint = Object.entries(positionData)
      .map(([position, data]) => ({
        position: parseInt(position),
        conversions: data.conversions,
        credit: data.credit,
      }))
      .sort((a, b) => a.position - b.position);

    return {
      totalConversions: outcomes.length,
      totalRevenue: outcomes.reduce((sum, o) => sum + o.value, 0),
      byChannel,
      byTouchpoint,
      model: options?.model || AttributionModel.LINEAR,
    };
  }

  /**
   * Compare attribution models
   */
  async compareAttributionModels(
    campaignId: string
  ): Promise<Record<AttributionModel, ChannelAttribution[]>> {
    const models = Object.values(AttributionModel);
    const results: Record<AttributionModel, ChannelAttribution[]> = {} as any;

    for (const model of models) {
      const report = await this.getAttributionReport(campaignId, { model });
      results[model] = report.byChannel;
    }

    return results;
  }
}

// Export singleton instance
export const attributionService = new AttributionService();
export default attributionService;