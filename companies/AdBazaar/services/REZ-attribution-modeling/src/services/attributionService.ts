import { v4 as uuidv4 } from 'uuid';
import {
  Touchpoint,
  Conversion,
  AttributionConfig,
  AttributionModel,
  AttributionResult,
  ChannelPerformance,
  TouchpointChannel,
  TouchpointStatus
} from '../types';
import logger from '../utils/logger';

class AttributionService {
  private touchpoints: Map<string, Touchpoint> = new Map();
  private conversions: Map<string, Conversion> = new Map();
  private configs: Map<string, AttributionConfig> = new Map();
  private userTouchpoints: Map<string, string[]> = new Map();
  private conversionTouchpoints: Map<string, string[]> = new Map();

  // Touchpoint Management
  addTouchpoint(input: Omit<Touchpoint, 'id'>): Touchpoint {
    const id = uuidv4();
    const touchpoint: Touchpoint = { ...input, id };

    this.touchpoints.set(id, touchpoint);

    const userKey = input.userId;
    const userTps = this.userTouchpoints.get(userKey) || [];
    userTps.push(id);
    this.userTouchpoints.set(userKey, userTps);

    logger.info(`Touchpoint added: ${id}, user: ${input.userId}, channel: ${input.channel}`);
    return touchpoint;
  }

  getTouchpoints(userId: string): Touchpoint[] {
    const touchpointIds = this.userTouchpoints.get(userId) || [];
    return touchpointIds
      .map(id => this.touchpoints.get(id))
      .filter((tp): tp is Touchpoint => tp !== undefined)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Conversion Management
  recordConversion(input: Omit<Conversion, 'id' | 'attributedChannels'>): Conversion {
    const id = uuidv4();
    const conversion: Conversion = {
      ...input,
      id,
      attributedChannels: {}
    };

    this.conversions.set(id, conversion);

    const touchpointIds = this.userTouchpoints.get(input.userId) || [];
    this.conversionTouchpoints.set(id, touchpointIds);

    logger.info(`Conversion recorded: ${id}, user: ${input.userId}, type: ${input.conversionType}`);
    return conversion;
  }

  getConversion(id: string): Conversion | undefined {
    return this.conversions.get(id);
  }

  getConversions(
    options?: {
      userId?: string;
      conversionType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): { conversions: Conversion[]; total: number } {
    let result: Conversion[] = [];
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    this.conversions.forEach((conversion) => {
      if (options?.userId && conversion.userId !== options.userId) return;
      if (options?.conversionType && conversion.conversionType !== options.conversionType) return;
      if (options?.startDate && conversion.timestamp < options.startDate) return;
      if (options?.endDate && conversion.timestamp > options.endDate) return;
      result.push(conversion);
    });

    const total = result.length;
    result = result
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice((page - 1) * limit, page * limit);

    return { conversions: result, total };
  }

  // Attribution Models
  calculateAttribution(
    conversionId: string,
    model: AttributionModel,
    config?: AttributionConfig
  ): AttributionResult | null {
    const conversion = this.conversions.get(conversionId);
    if (!conversion) {
      logger.warn(`Conversion not found: ${conversionId}`);
      return null;
    }

    const touchpointIds = this.conversionTouchpoints.get(conversionId) || [];
    const touchpoints = touchpointIds
      .map(id => this.touchpoints.get(id))
      .filter((tp): tp is Touchpoint => tp !== undefined && tp.status !== TouchpointStatus.EXCLUDED)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (touchpoints.length === 0) {
      logger.warn(`No touchpoints for conversion: ${conversionId}`);
      return null;
    }

    let channelAttributions: Record<string, number> = {};
    let touchpointAttributions: Array<{
      touchpointId: string;
      channel: TouchpointChannel;
      contribution: number;
      percentage: number;
    }> = [];

    switch (model) {
      case AttributionModel.FIRST_CLICK:
        ({ channelAttributions, touchpointAttributions } = this.firstClickAttribution(conversion, touchpoints));
        break;
      case AttributionModel.LAST_CLICK:
        ({ channelAttributions, touchpointAttributions } = this.lastClickAttribution(conversion, touchpoints));
        break;
      case AttributionModel.LINEAR:
        ({ channelAttributions, touchpointAttributions } = this.linearAttribution(conversion, touchpoints));
        break;
      case AttributionModel.TIME_DECAY:
        const halfLifeDays = config?.timeDecaySettings?.halfLifeDays ?? 7;
        ({ channelAttributions, touchpointAttributions } = this.timeDecayAttribution(conversion, touchpoints, halfLifeDays));
        break;
      case AttributionModel.POSITION_BASED:
        const settings = config?.positionBasedSettings ?? {
          firstTouchWeight: 0.4,
          lastTouchWeight: 0.4,
          middleWeight: 0.2
        };
        ({ channelAttributions, touchpointAttributions } = this.positionBasedAttribution(conversion, touchpoints, settings));
        break;
      case AttributionModel.DATA_DRIVEN:
        const ddConfig = config?.dataDrivenSettings ?? {
          minSampleSize: 1000,
          algorithm: 'markov'
        };
        ({ channelAttributions, touchpointAttributions } = this.dataDrivenAttribution(conversionId, touchpoints, ddConfig));
        break;
    }

    // Update conversion with attributed channels
    conversion.attributedChannels = channelAttributions;
    this.conversions.set(conversionId, conversion);

    return {
      conversionId,
      userId: conversion.userId,
      model,
      totalValue: conversion.value,
      channelAttributions,
      touchpointAttributions,
      timestamp: new Date()
    };
  }

  // First-Click Attribution: 100% credit to first touchpoint
  private firstClickAttribution(
    conversion: Conversion,
    touchpoints: Touchpoint[]
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const firstTouchpoint = touchpoints[0];
    const channel = firstTouchpoint.channel;
    const value = conversion.value || conversion.revenue || 1;

    return {
      channelAttributions: { [channel]: value },
      touchpointAttributions: touchpoints.map(tp => ({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution: tp.id === firstTouchpoint.id ? value : 0,
        percentage: tp.id === firstTouchpoint.id ? 100 : 0
      }))
    };
  }

  // Last-Click Attribution: 100% credit to last touchpoint
  private lastClickAttribution(
    conversion: Conversion,
    touchpoints: Touchpoint[]
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const lastTouchpoint = touchpoints[touchpoints.length - 1];
    const channel = lastTouchpoint.channel;
    const value = conversion.value || conversion.revenue || 1;

    return {
      channelAttributions: { [channel]: value },
      touchpointAttributions: touchpoints.map(tp => ({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution: tp.id === lastTouchpoint.id ? value : 0,
        percentage: tp.id === lastTouchpoint.id ? 100 : 0
      }))
    };
  }

  // Linear Attribution: Equal credit to all touchpoints
  private linearAttribution(
    conversion: Conversion,
    touchpoints: Touchpoint[]
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const value = conversion.value || conversion.revenue || 1;
    const contribution = value / touchpoints.length;
    const percentage = 100 / touchpoints.length;

    const channelAttributions: Record<string, number> = {};
    const touchpointAttributions: Array<{
      touchpointId: string;
      channel: TouchpointChannel;
      contribution: number;
      percentage: number;
    }> = [];

    touchpoints.forEach(tp => {
      touchpointAttributions.push({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution,
        percentage
      });
      channelAttributions[tp.channel] = (channelAttributions[tp.channel] || 0) + contribution;
    });

    return { channelAttributions, touchpointAttributions };
  }

  // Time-Decay Attribution: More credit to recent touchpoints
  private timeDecayAttribution(
    conversion: Conversion,
    touchpoints: Touchpoint[],
    halfLifeDays: number
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const value = conversion.value || conversion.revenue || 1;
    const conversionTime = conversion.timestamp.getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const halfLifeMs = halfLifeDays * msPerDay;

    const weights = touchpoints.map(tp => {
      const daysAgo = (conversionTime - tp.timestamp.getTime()) / msPerDay;
      return Math.pow(0.5, daysAgo / halfLifeDays);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const contributions = weights.map(w => (w / totalWeight) * value);
    const percentages = contributions.map(c => (c / value) * 100);

    const channelAttributions: Record<string, number> = {};
    const touchpointAttributions: Array<{
      touchpointId: string;
      channel: TouchpointChannel;
      contribution: number;
      percentage: number;
    }> = [];

    touchpoints.forEach((tp, i) => {
      touchpointAttributions.push({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution: contributions[i],
        percentage: percentages[i]
      });
      channelAttributions[tp.channel] = (channelAttributions[tp.channel] || 0) + contributions[i];
    });

    return { channelAttributions, touchpointAttributions };
  }

  // Position-Based Attribution: Custom weights for first, last, and middle touchpoints
  private positionBasedAttribution(
    conversion: Conversion,
    touchpoints: Touchpoint[],
    settings: { firstTouchWeight: number; lastTouchWeight: number; middleWeight: number }
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const value = conversion.value || conversion.revenue || 1;
    const { firstTouchWeight, lastTouchWeight, middleWeight } = settings;

    const channelAttributions: Record<string, number> = {};
    const touchpointAttributions: Array<{
      touchpointId: string;
      channel: TouchpointChannel;
      contribution: number;
      percentage: number;
    }> = [];

    if (touchpoints.length === 1) {
      // Single touchpoint: 100% credit
      const tp = touchpoints[0];
      touchpointAttributions.push({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution: value,
        percentage: 100
      });
      channelAttributions[tp.channel] = value;
    } else if (touchpoints.length === 2) {
      // Two touchpoints: split between first and last (50/50 each)
      const halfValue = value / 2;
      touchpoints.forEach((tp, i) => {
        const percentage = 50;
        touchpointAttributions.push({
          touchpointId: tp.id,
          channel: tp.channel,
          contribution: halfValue,
          percentage
        });
        channelAttributions[tp.channel] = (channelAttributions[tp.channel] || 0) + halfValue;
      });
    } else {
      // Multiple touchpoints
      const firstContrib = (firstTouchWeight / 2) * value;
      const lastContrib = (lastTouchWeight / 2) * value;
      const middleCount = touchpoints.length - 2;
      const middleContrib = middleCount > 0 ? (middleWeight * value) / middleCount : 0;

      touchpoints.forEach((tp, i) => {
        let contribution: number;
        let percentage: number;

        if (i === 0) {
          contribution = firstContrib;
          percentage = firstTouchWeight / 2 * 100;
        } else if (i === touchpoints.length - 1) {
          contribution = lastContrib;
          percentage = lastTouchWeight / 2 * 100;
        } else {
          contribution = middleContrib;
          percentage = (middleWeight / middleCount) * 100;
        }

        touchpointAttributions.push({
          touchpointId: tp.id,
          channel: tp.channel,
          contribution,
          percentage
        });
        channelAttributions[tp.channel] = (channelAttributions[tp.channel] || 0) + contribution;
      });
    }

    return { channelAttributions, touchpointAttributions };
  }

  // Data-Driven Attribution: Using Markov Chain model
  private dataDrivenAttribution(
    conversionId: string,
    touchpoints: Touchpoint[],
    config: { minSampleSize: number; algorithm: string }
  ): { channelAttributions: Record<string, number>; touchpointAttributions: Array<{ touchpointId: string; channel: TouchpointChannel; contribution: number; percentage: number }> } {
    const value = 1; // Normalized value for model
    const totalConversions = this.getConversionCount();

    // Simple Markov Chain removal effect
    const channelRemovalEffects: Record<string, number> = {};

    // Calculate channel contributions based on touchpoint order
    touchpoints.forEach(tp => {
      channelRemovalEffects[tp.channel] = (channelRemovalEffects[tp.channel] || 0) + 1;
    });

    // Normalize based on sample size (simplified)
    const totalTouchpoints = Object.values(channelRemovalEffects).reduce((a, b) => a + b, 0);
    const scaleFactor = Math.min(1, totalConversions / config.minSampleSize);

    const channelAttributions: Record<string, number> = {};
    const touchpointAttributions: Array<{
      touchpointId: string;
      channel: TouchpointChannel;
      contribution: number;
      percentage: number;
    }> = [];

    touchpoints.forEach(tp => {
      const baseContribution = (channelRemovalEffects[tp.channel] || 0) / totalTouchpoints;
      const contribution = baseContribution * value * scaleFactor;
      const percentage = baseContribution * 100;

      touchpointAttributions.push({
        touchpointId: tp.id,
        channel: tp.channel,
        contribution,
        percentage
      });
      channelAttributions[tp.channel] = (channelAttributions[tp.channel] || 0) + contribution;
    });

    // Normalize percentages to sum to 100
    const totalPercentage = touchpointAttributions.reduce((sum, ta) => sum + ta.percentage, 0);
    if (totalPercentage > 0) {
      touchpointAttributions.forEach(ta => {
        ta.percentage = (ta.percentage / totalPercentage) * 100;
        ta.contribution = (ta.percentage / 100) * value;
      });
    }

    return { channelAttributions, touchpointAttributions };
  }

  private getConversionCount(): number {
    return this.conversions.size;
  }

  // Config Management
  createConfig(input: Omit<AttributionConfig, 'id' | 'createdAt' | 'updatedAt'>): AttributionConfig {
    const id = uuidv4();
    const now = new Date();
    const config: AttributionConfig = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.configs.set(id, config);
    logger.info(`Attribution config created: ${id}, model: ${input.model}`);
    return config;
  }

  getConfig(id: string): AttributionConfig | undefined {
    return this.configs.get(id);
  }

  getConfigs(isActive?: boolean): AttributionConfig[] {
    const configs: AttributionConfig[] = [];
    this.configs.forEach(config => {
      if (isActive !== undefined && config.isActive !== isActive) return;
      configs.push(config);
    });
    return configs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateConfig(id: string, updates: Partial<AttributionConfig>): AttributionConfig | undefined {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updatedConfig: AttributionConfig = {
      ...config,
      ...updates,
      id: config.id,
      createdAt: config.createdAt,
      updatedAt: new Date()
    };

    this.configs.set(id, updatedConfig);
    logger.info(`Attribution config updated: ${id}`);
    return updatedConfig;
  }

  deleteConfig(id: string): boolean {
    return this.configs.delete(id);
  }

  // Analytics
  getChannelPerformance(
    startDate?: Date,
    endDate?: Date
  ): ChannelPerformance[] {
    const channelStats: Record<string, {
      conversions: number;
      totalValue: number;
      touchpoints: number;
    }> = {};

    this.conversions.forEach(conversion => {
      if (startDate && conversion.timestamp < startDate) return;
      if (endDate && conversion.timestamp > endDate) return;

      const touchpointIds = this.conversionTouchpoints.get(conversion.id) || [];
      const touchpoints = touchpointIds
        .map(id => this.touchpoints.get(id))
        .filter((tp): tp is Touchpoint => tp !== undefined);

      const value = conversion.value || conversion.revenue || 0;

      // Use last-click attribution for reporting
      if (touchpoints.length > 0) {
        const lastChannel = touchpoints[touchpoints.length - 1].channel;
        if (!channelStats[lastChannel]) {
          channelStats[lastChannel] = { conversions: 0, totalValue: 0, touchpoints: 0 };
        }
        channelStats[lastChannel].conversions++;
        channelStats[lastChannel].totalValue += value;
        channelStats[lastChannel].touchpoints += touchpoints.length;
      }
    });

    const totalValue = Object.values(channelStats).reduce((sum, s) => sum + s.totalValue, 0);

    return Object.entries(channelStats)
      .map(([channel, stats]) => ({
        channel: channel as TouchpointChannel,
        conversions: stats.conversions,
        totalValue: stats.totalValue,
        attributionPercentage: totalValue > 0 ? (stats.totalValue / totalValue) * 100 : 0,
        touchpoints: stats.touchpoints,
        avgTouchpointsPerConversion: stats.conversions > 0 ? stats.touchpoints / stats.conversions : 0
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }

  // Bulk Attribution
  bulkCalculateAttribution(
    conversionIds: string[],
    model: AttributionModel,
    configId?: string
  ): AttributionResult[] {
    const config = configId ? this.configs.get(configId) : undefined;
    const results: AttributionResult[] = [];

    conversionIds.forEach(id => {
      const result = this.calculateAttribution(id, model, config);
      if (result) results.push(result);
    });

    logger.info(`Bulk attribution calculated: ${results.length} conversions using ${model} model`);
    return results;
  }

  // Model Comparison
  compareModels(conversionId: string): Record<AttributionModel, AttributionResult | null> {
    const results: Record<AttributionModel, AttributionResult | null> = {} as Record<AttributionModel, AttributionResult | null>;

    Object.values(AttributionModel).forEach(model => {
      results[model] = this.calculateAttribution(conversionId, model);
    });

    return results;
  }
}

export default new AttributionService();
