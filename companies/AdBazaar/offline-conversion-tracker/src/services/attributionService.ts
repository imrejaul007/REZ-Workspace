import { OfflineConversion, ConversionMatch } from '../models';
import { AttributionQueryInput } from '../utils/validation';
import { logger } from '../utils';
import { analyticsQueries, databaseOperationDuration } from '../utils/metrics';

export type AttributionModel = 'first_click' | 'last_click' | 'linear' | 'time_decay' | 'position_based';

export interface AttributionResult {
  campaignId: string;
  totalConversions: number;
  totalValue: number;
  attribution: {
    direct: number;
    assisted: number;
    crossDevice: number;
  };
  byChannel: Record<string, {
    conversions: number;
    value: number;
    credit: number;
  }>;
  byModel: Record<AttributionModel, {
    conversions: number;
    value: number;
  }>;
}

export class AttributionService {
  /**
   * Get attribution report
   */
  async getAttributionReport(input: AttributionQueryInput): Promise<AttributionResult> {
    const startTime = Date.now();

    try {
      analyticsQueries.inc({ type: 'attribution' });

      const matchStage: any = { $match: {} };
      if (input.campaignId) matchStage.$match.campaignId = input.campaignId;
      if (input.startDate || input.endDate) {
        matchStage.$match.date = {};
        if (input.startDate) matchStage.$match.date.$gte = input.startDate;
        if (input.endDate) matchStage.$match.date.$lte = input.endDate;
      }

      const conversions = await OfflineConversion.find(matchStage.$match);

      // Calculate attribution for each model
      const models: AttributionModel[] = [
        'first_click', 'last_click', 'linear', 'time_decay', 'position_based'
      ];

      const byModel: Record<AttributionModel, { conversions: number; value: number }> = {
        first_click: { conversions: 0, value: 0 },
        last_click: { conversions: 0, value: 0 },
        linear: { conversions: 0, value: 0 },
        time_decay: { conversions: 0, value: 0 },
        position_based: { conversions: 0, value: 0 }
      };

      const byChannel: Record<string, { conversions: number; value: number; credit: number }> = {};

      for (const conversion of conversions) {
        const source = conversion.source || 'unknown';
        const medium = conversion.medium || 'unknown';
        const channel = `${source}:${medium}`;

        // Initialize channel if not exists
        if (!byChannel[channel]) {
          byChannel[channel] = { conversions: 0, value: 0, credit: 0 };
        }

        // Count for last_click model (default)
        byModel.last_click.conversions++;
        byModel.last_click.value += conversion.value || 0;

        byChannel[channel].conversions++;
        byChannel[channel].value += conversion.value || 0;
      }

      // Calculate cross-device attribution
      const crossDeviceMatches = await ConversionMatch.countDocuments({
        offlineId: { $in: conversions.map(c => c._id.toString()) },
        matchType: { $in: ['device_id', 'fingerprint'] }
      });

      const direct = conversions.length - crossDeviceMatches;
      const assisted = Math.floor(crossDeviceMatches * 0.5);
      const crossDevice = crossDeviceMatches;

      // Calculate ROAS for each model
      const result: AttributionResult = {
        campaignId: input.campaignId || 'all',
        totalConversions: conversions.length,
        totalValue: conversions.reduce((sum, c) => sum + (c.value || 0), 0),
        attribution: {
          direct,
          assisted,
          crossDevice
        },
        byChannel,
        byModel
      };

      logger.info('Attribution report generated', {
        campaignId: input.campaignId,
        totalConversions: conversions.length
      });

      return result;
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Calculate attribution credit
   */
  calculateAttributionCredit(
    model: AttributionModel,
    touches: Array<{
      channel: string;
      timestamp: Date;
      position: number;
      totalTouches: number;
    }>
  ): Record<string, number> {
    const credits: Record<string, number> = {};

    switch (model) {
      case 'first_click':
        // All credit to first touch
        if (touches.length > 0) {
          const firstTouch = touches[0];
          credits[firstTouch.channel] = (credits[firstTouch.channel] || 0) + 1;
        }
        break;

      case 'last_click':
        // All credit to last touch
        if (touches.length > 0) {
          const lastTouch = touches[touches.length - 1];
          credits[lastTouch.channel] = (credits[lastTouch.channel] || 0) + 1;
        }
        break;

      case 'linear':
        // Equal credit to all touches
        const creditPerTouch = 1 / touches.length;
        touches.forEach(touch => {
          credits[touch.channel] = (credits[touch.channel] || 0) + creditPerTouch;
        });
        break;

      case 'time_decay':
        // More credit to recent touches (exponential decay)
        const maxAge = Date.now() - touches[0].timestamp.getTime();
        touches.forEach((touch, index) => {
          const age = Date.now() - touch.timestamp.getTime();
          const weight = Math.exp(-age / (maxAge / 2));
          credits[touch.channel] = (credits[touch.channel] || 0) + weight;
        });
        break;

      case 'position_based':
        // 40% first, 40% last, 20% distributed among middle
        if (touches.length === 1) {
          credits[touches[0].channel] = 1;
        } else if (touches.length === 2) {
          credits[touches[0].channel] = 0.5;
          credits[touches[1].channel] = 0.5;
        } else {
          const firstAndLast = 0.4;
          const middle = 0.2 / (touches.length - 2);
          credits[touches[0].channel] = (credits[touches[0].channel] || 0) + firstAndLast;
          credits[touches[touches.length - 1].channel] = (credits[touches[touches.length - 1].channel] || 0) + firstAndLast;
          for (let i = 1; i < touches.length - 1; i++) {
            credits[touches[i].channel] = (credits[touches[i].channel] || 0) + middle;
          }
        }
        break;
    }

    return credits;
  }

  /**
   * Get multi-touch attribution
   */
  async getMultiTouchAttribution(
    conversionId: string,
    attributionWindow: number = 30
  ): Promise<{
    conversionId: string;
    model: AttributionModel;
    credits: Record<string, number>;
    totalCredit: number;
  }> {
    const startTime = Date.now();

    try {
      const conversion = await OfflineConversion.findById(conversionId);

      if (!conversion) {
        throw new Error('Conversion not found');
      }

      // Get all touches within the attribution window
      const windowStart = new Date(conversion.date);
      windowStart.setDate(windowStart.getDate() - attributionWindow);

      // Mock touch points (in real implementation, this would come from ad tracking)
      const touches = [
        { channel: 'google', timestamp: new Date(windowStart.getTime()), position: 1, totalTouches: 3 },
        { channel: 'facebook', timestamp: new Date(windowStart.getTime() + 86400000), position: 2, totalTouches: 3 },
        { channel: 'direct', timestamp: conversion.date, position: 3, totalTouches: 3 }
      ];

      const credits = this.calculateAttributionCredit('linear', touches);
      const totalCredit = Object.values(credits).reduce((sum, val) => sum + val, 0);

      return {
        conversionId,
        model: 'linear',
        credits,
        totalCredit
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'read', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get campaign attribution summary
   */
  async getCampaignAttribution(campaignId: string): Promise<{
    campaignId: string;
    totalConversions: number;
    attributedByModel: Record<AttributionModel, number>;
    topChannels: Array<{ channel: string; credit: number; conversions: number }>;
    averageTouches: number;
    pathAnalysis: Array<{
      path: string;
      count: number;
      conversions: number;
      value: number;
    }>;
  }> {
    const startTime = Date.now();

    try {
      const conversions = await OfflineConversion.find({ campaignId });
      const matches = await ConversionMatch.find({
        offlineId: { $in: conversions.map(c => c._id.toString()) }
      });

      // Calculate attributed conversions by model
      const attributedByModel: Record<AttributionModel, number> = {
        first_click: conversions.length,
        last_click: conversions.length,
        linear: conversions.length,
        time_decay: conversions.length,
        position_based: conversions.length
      };

      // Analyze top channels
      const channelCredits: Record<string, { credit: number; conversions: number }> = {};

      conversions.forEach(conv => {
        const source = conv.source || 'unknown';
        const medium = conv.medium || 'direct';
        const channel = `${source}:${medium}`;

        if (!channelCredits[channel]) {
          channelCredits[channel] = { credit: 0, conversions: 0 };
        }

        channelCredits[channel].conversions++;
        channelCredits[channel].credit += 1;
      });

      const topChannels = Object.entries(channelCredits)
        .map(([channel, data]) => ({
          channel,
          credit: data.credit,
          conversions: data.conversions
        }))
        .sort((a, b) => b.credit - a.credit)
        .slice(0, 10);

      // Mock path analysis
      const pathAnalysis = [
        { path: 'google → direct', count: 45, conversions: 30, value: 15000 },
        { path: 'facebook → google → direct', count: 30, conversions: 20, value: 12000 },
        { path: 'direct', count: 25, conversions: 18, value: 9000 }
      ];

      return {
        campaignId,
        totalConversions: conversions.length,
        attributedByModel,
        topChannels,
        averageTouches: matches.length / conversions.length || 0,
        pathAnalysis
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Compare attribution models
   */
  async compareAttributionModels(campaignId: string): Promise<{
    campaignId: string;
    models: Array<{
      model: AttributionModel;
      conversions: number;
      value: number;
      topChannel: string;
      channelDistribution: Record<string, number>;
    }>;
    variance: {
      conversionsVariance: number;
      valueVariance: number;
    };
  }> {
    const startTime = Date.now();

    try {
      const models: AttributionModel[] = ['first_click', 'last_click', 'linear', 'time_decay', 'position_based'];
      const results = [];

      for (const model of models) {
        const report = await this.getAttributionReport({
          campaignId,
          attributionModel: model
        });

        const topChannel = Object.entries(report.byChannel)
          .sort(([, a], [, b]) => b.credit - a.credit)[0]?.[0] || 'unknown';

        results.push({
          model,
          conversions: report.totalConversions,
          value: report.totalValue,
          topChannel,
          channelDistribution: Object.fromEntries(
            Object.entries(report.byChannel)
              .map(([ch, data]) => [ch, Math.round((data.credit / report.totalConversions) * 100)])
          )
        });
      }

      // Calculate variance
      const conversionsValues = results.map(r => r.conversions);
      const valueValues = results.map(r => r.value);
      const avgConversions = conversionsValues.reduce((a, b) => a + b, 0) / conversionsValues.length;
      const avgValue = valueValues.reduce((a, b) => a + b, 0) / valueValues.length;

      const conversionsVariance = Math.sqrt(
        conversionsValues.reduce((sum, val) => sum + Math.pow(val - avgConversions, 2), 0) / conversionsValues.length
      );
      const valueVariance = Math.sqrt(
        valueValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / valueValues.length
      );

      return {
        campaignId,
        models: results,
        variance: {
          conversionsVariance: Math.round(conversionsVariance * 100) / 100,
          valueVariance: Math.round(valueVariance * 100) / 100
        }
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const attributionService = new AttributionService();