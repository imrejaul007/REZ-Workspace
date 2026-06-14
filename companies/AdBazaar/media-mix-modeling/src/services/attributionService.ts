import { Channel, ModelResult, MMMModel } from '../models';
import { ChannelAttribution, AttributionModel } from '../types';
import { logger } from '../utils/logger';
import { attributionRequestsTotal } from '../utils/metrics';

/**
 * Attribution Service
 * Calculates channel attribution using various attribution models
 */
export class AttributionService {
  /**
   * Get channel attribution for a model
   */
  async getAttribution(modelId: string, attributionModel?: AttributionModel): Promise<ChannelAttribution[]> {
    attributionRequestsTotal.inc();

    try {
      logger.info('Calculating channel attribution', { modelId, attributionModel });

      // Get model and channels
      const model = await MMMModel.findById(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const channels = await Channel.find({ _id: { $in: model.channels } });

      // Get latest model results
      const modelResult = await ModelResult.findOne({ modelId: model._id })
        .sort({ trainedAt: -1 });

      // Use specified attribution model or model default
      const modelType = attributionModel || model.attributionModel;

      // Calculate attribution based on model type
      let attribution: ChannelAttribution[];

      switch (modelType) {
        case 'FIRST_TOUCH':
          attribution = this.firstTouchAttribution(channels);
          break;
        case 'LAST_TOUCH':
          attribution = this.lastTouchAttribution(channels);
          break;
        case 'LINEAR':
          attribution = this.linearAttribution(channels);
          break;
        case 'TIME_DECAY':
          attribution = this.timeDecayAttribution(channels);
          break;
        case 'POSITION_BASED':
          attribution = this.positionBasedAttribution(channels);
          break;
        case 'DATA_DRIVEN':
        default:
          attribution = await this.dataDrivenAttribution(channels, modelResult);
          break;
      }

      // Normalize to percentages
      const totalAttribution = attribution.reduce((sum, ch) => sum + ch.attribution, 0);
      attribution = attribution.map(ch => ({
        ...ch,
        percentage: totalAttribution > 0 ? (ch.attribution / totalAttribution) * 100 : 0
      }));

      logger.info('Attribution calculated', { modelId, channelCount: attribution.length });

      return attribution;
    } catch (error) {
      logger.error('Failed to calculate attribution', { modelId, error });
      throw error;
    }
  }

  /**
   * First-touch attribution:100% credit to first touchpoint
   */
  private firstTouchAttribution(channels: any[]): ChannelAttribution[] {
    // Sort by earliest date
    const sortedChannels = [...channels].sort((a, b) => {
      const aDate = a.dataPoints?.[0]?.date || new Date();
      const bDate = b.dataPoints?.[0]?.date || new Date();
      return aDate.getTime() - bDate.getTime();
    });

    if (sortedChannels.length === 0) return [];

    const firstChannel = sortedChannels[0];
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

    return channels.map(ch => ({
      channelId: ch.channelId,
      channelName: ch.name,
      channelType: ch.type,
      attribution: ch.channelId === firstChannel.channelId ? totalRevenue : 0,
      incrementalRevenue: ch.channelId === firstChannel.channelId ? ch.revenue || 0 : 0,
      spend: ch.spend || 0,
      efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
    }));
  }

  /**
   * Last-touch attribution: 100% credit to last touchpoint
   */
  private lastTouchAttribution(channels: any[]): ChannelAttribution[] {
    // Sort by latest date
    const sortedChannels = [...channels].sort((a, b) => {
      const aDate = a.dataPoints?.[a.dataPoints.length - 1]?.date || new Date();
      const bDate = b.dataPoints?.[b.dataPoints.length - 1]?.date || new Date();
      return bDate.getTime() - aDate.getTime();
    });

    if (sortedChannels.length === 0) return [];

    const lastChannel = sortedChannels[0];
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

    return channels.map(ch => ({
      channelId: ch.channelId,
      channelName: ch.name,
      channelType: ch.type,
      attribution: ch.channelId === lastChannel.channelId ? totalRevenue : 0,
      incrementalRevenue: ch.channelId === lastChannel.channelId ? ch.revenue || 0 : 0,
      spend: ch.spend || 0,
      efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
    }));
  }

  /**
   * Linear attribution: Equal credit to all touchpoints
   */
  private linearAttribution(channels: any[]): ChannelAttribution[] {
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);
    const numChannels = channels.length;
    const equalShare = totalRevenue / numChannels;

    return channels.map(ch => ({
      channelId: ch.channelId,
      channelName: ch.name,
      channelType: ch.type,
      attribution: equalShare,
      incrementalRevenue: ch.revenue || 0,
      spend: ch.spend || 0,
      efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
    }));
  }

  /**
   * Time-decay attribution: More credit to recent touchpoints
   */
  private timeDecayAttribution(channels: any[]): ChannelAttribution[] {
    // Weight by recency of touchpoints
    const now = Date.now();
    const decayHalfLife = 7 * 24 * 60 * 60 * 1000; // 7 days

    const weights = channels.map(ch => {
      const lastDate = ch.dataPoints?.[ch.dataPoints.length - 1]?.date || new Date();
      const daysAgo = (now - lastDate.getTime()) / (24 * 60 * 60 * 1000);
      return Math.pow(0.5, daysAgo / 7); // Half-life of 7 days
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

    return channels.map((ch, idx) => ({
      channelId: ch.channelId,
      channelName: ch.name,
      channelType: ch.type,
      attribution: totalRevenue * (weights[idx] / totalWeight),
      incrementalRevenue: ch.revenue || 0,
      spend: ch.spend || 0,
      efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
    }));
  }

  /**
   * Position-based attribution:40% first, 40% last, 20% distributed
   */
  private positionBasedAttribution(channels: any[]): ChannelAttribution[] {
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);
    const numChannels = channels.length;

    if (numChannels === 0) return [];
    if (numChannels === 1) {
      return channels.map(ch => ({
        channelId: ch.channelId,
        channelName: ch.name,
        channelType: ch.type,
        attribution: totalRevenue,
        incrementalRevenue: ch.revenue || 0,
        spend: ch.spend || 0,
        efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
      }));
    }

    const firstLastWeight = 0.4;
    const middleWeight = 0.2 / (numChannels - 2);

    return channels.map((ch, idx) => {
      let weight: number;
      if (idx === 0) {
        weight = firstLastWeight;
      } else if (idx === numChannels - 1) {
        weight = firstLastWeight;
      } else {
        weight = middleWeight;
      }

      return {
        channelId: ch.channelId,
        channelName: ch.name,
        channelType: ch.type,
        attribution: totalRevenue * weight,
        incrementalRevenue: ch.revenue || 0,
        spend: ch.spend || 0,
        efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
      };
    });
  }

  /**
   * Data-driven attribution: Based on model results
   */
  private async dataDrivenAttribution(channels: any[], modelResult: any): Promise<ChannelAttribution[]> {
    const contribution = modelResult?.contribution || new Map();
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

    return channels.map(ch => {
      const channelContribution = contribution.get?.(ch.channelId) ||
        (1 / channels.length);
      const attribution = totalRevenue * channelContribution;

      return {
        channelId: ch.channelId,
        channelName: ch.name,
        channelType: ch.type,
        attribution,
        incrementalRevenue: ch.revenue || 0,
        spend: ch.spend || 0,
        efficiency: ch.spend > 0 ? (ch.revenue || 0) / ch.spend : 0
      };
    });
  }

  /**
   * Get attribution summary for a model
   */
  async getAttributionSummary(modelId: string): Promise<any> {
    const attribution = await this.getAttribution(modelId);

    const totalSpend = attribution.reduce((sum, ch) => sum + ch.spend, 0);
    const totalRevenue = attribution.reduce((sum, ch) => sum + ch.incrementalRevenue, 0);
    const totalAttribution = attribution.reduce((sum, ch) => sum + ch.attribution, 0);

    // Group by channel type
    const byType: Record<string, any> = {};
    attribution.forEach(ch => {
      if (!byType[ch.channelType]) {
        byType[ch.channelType] = {
          channels: [],
          totalSpend: 0,
          totalRevenue: 0,
          totalAttribution: 0
        };
      }
      byType[ch.channelType].channels.push(ch);
      byType[ch.channelType].totalSpend += ch.spend;
      byType[ch.channelType].totalRevenue += ch.incrementalRevenue;
      byType[ch.channelType].totalAttribution += ch.attribution;
    });

    return {
      modelId,
      totalSpend,
      totalRevenue,
      totalAttribution,
      overallRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      byChannel: attribution,
      byType: Object.entries(byType).map(([type, data]: [string, any]) => ({
        type,
        ...data,
        roas: data.totalSpend > 0 ? data.totalRevenue / data.totalSpend : 0,
        percentage: totalAttribution > 0 ? (data.totalAttribution / totalAttribution) * 100 : 0
      }))
    };
  }
}

export const attributionService = new AttributionService();