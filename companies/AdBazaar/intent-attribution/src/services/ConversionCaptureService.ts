import { v4 as uuidv4 } from 'uuid';
import { Conversion, IConversion } from '../models/Conversion.js';
import { AttributionRecord } from '../models/AttributionRecord.js';
import { ConversionType, AttributionModel, ConversionEventInput } from '../types.js';
import { setCache, invalidateCachePattern } from '../config/redis.js';
import logger from '../config/logger.js';

export interface ConversionCaptureOptions {
  signalIds?: string[];
  model?: AttributionModel;
  metadata?: Record<string, unknown>;
}

export class ConversionCaptureService {
  /**
   * Capture a conversion event and attribute it to intent signals
   */
  async captureConversion(input: ConversionEventInput, options: ConversionCaptureOptions = {}): Promise<IConversion> {
    const conversionId = `conv_${uuidv4()}`;
    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

    logger.info('Capturing conversion', {
      conversionId,
      userId: input.userId,
      conversionType: input.conversionType,
      conversionValue: input.conversionValue
    });

    // Get touchpoints for attribution
    const touchpoints = await this.getAttributionTouchpoints(
      input.userId,
      timestamp,
      input.signalIds || options.signalIds || []
    );

    // Calculate attribution
    const model = input.model || options.model || AttributionModel.TIME_DECAY;
    const attributedSignals = this.calculateAttribution(touchpoints, input.conversionValue, model);

    // Create conversion record
    const conversion = new Conversion({
      conversionId,
      userId: input.userId,
      conversionType: input.conversionType,
      conversionValue: input.conversionValue,
      currency: input.currency || 'INR',
      category: input.category,
      orderId: input.orderId,
      metadata: { ...input.metadata, ...options.metadata },
      timestamp,
      attributedSignals,
      model
    });

    await conversion.save();

    // Mark attribution records as attributed
    if (attributedSignals.length > 0) {
      const recordIds = attributedSignals.map(s => s.signalId);
      await AttributionRecord.updateMany(
        { signalId: { $in: recordIds } },
        { attributed: true, attributedTo: conversionId }
      );
    }

    // Invalidate cache
    await invalidateCachePattern(`attribution:*:${input.userId}`);
    await invalidateCachePattern('attribution:report:*');

    logger.info('Conversion captured successfully', {
      conversionId,
      attributedSignals: attributedSignals.length,
      totalAttributionValue: attributedSignals.reduce((sum, s) => sum + s.attributionValue, 0)
    });

    return conversion;
  }

  /**
   * Get attribution touchpoints for a user before a conversion
   */
  private async getAttributionTouchpoints(
    userId: string,
    beforeDate: Date,
    preferredSignalIds: string[]
  ): Promise<Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    timestamp: Date;
    windowType: 'view' | 'click';
  }>> {
    const clickWindowDays = parseInt(process.env.CLICK_THROUGH_WINDOW_DAYS || '30', 10);
    const viewWindowDays = parseInt(process.env.VIEW_THROUGH_WINDOW_DAYS || '7', 10);

    const clickCutoff = new Date(beforeDate);
    clickCutoff.setDate(clickCutoff.getDate() - clickWindowDays);

    const viewCutoff = new Date(beforeDate);
    viewCutoff.setDate(viewCutoff.getDate() - viewWindowDays);

    // Build query
    const query: Record<string, unknown> = {
      userId,
      timestamp: { $lte: beforeDate }
    };

    // If specific signal IDs provided, prioritize them
    if (preferredSignalIds.length > 0) {
      query.$or = [
        { signalId: { $in: preferredSignalIds } },
        {
          $and: [
            { windowType: 'click', timestamp: { $gte: clickCutoff } },
            { windowType: 'view', timestamp: { $gte: viewCutoff } }
          ]
        }
      ];
    } else {
      query.$or = [
        { windowType: 'click', timestamp: { $gte: clickCutoff } },
        { windowType: 'view', timestamp: { $gte: viewCutoff } }
      ];
    }

    const records = await AttributionRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return records.map(record => ({
      signalId: record.signalId,
      source: record.source,
      eventType: record.eventType,
      category: record.category,
      timestamp: record.timestamp,
      windowType: record.windowType as 'view' | 'click'
    }));
  }

  /**
   * Calculate attribution credits based on the model
   */
  private calculateAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    model: AttributionModel
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    if (touchpoints.length === 0) {
      return [];
    }

    const conversionTime = new Date();
    const attributedSignals: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      position: number;
      lagDays: number;
      attributionCredit: number;
      attributionValue: number;
    }> = [];

    switch (model) {
      case AttributionModel.FIRST_TOUCH:
        return this.firstTouchAttribution(touchpoints, conversionValue, conversionTime);

      case AttributionModel.LAST_TOUCH:
        return this.lastTouchAttribution(touchpoints, conversionValue, conversionTime);

      case AttributionModel.LINEAR:
        return this.linearAttribution(touchpoints, conversionValue, conversionTime);

      case AttributionModel.TIME_DECAY:
        return this.timeDecayAttribution(touchpoints, conversionValue, conversionTime);

      case AttributionModel.POSITION_BASED:
        return this.positionBasedAttribution(touchpoints, conversionValue, conversionTime);

      default:
        return this.timeDecayAttribution(touchpoints, conversionValue, conversionTime);
    }
  }

  private firstTouchAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    conversionTime: Date
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    const first = touchpoints[touchpoints.length - 1]; // Oldest
    const lagDays = this.calculateLagDays(first.timestamp, conversionTime);

    return [{
      signalId: first.signalId,
      source: first.source,
      eventType: first.eventType,
      category: first.category,
      position: 1,
      lagDays,
      attributionCredit: 1,
      attributionValue: conversionValue
    }];
  }

  private lastTouchAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    conversionTime: Date
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    const last = touchpoints[0]; // Most recent
    const lagDays = this.calculateLagDays(last.timestamp, conversionTime);

    return [{
      signalId: last.signalId,
      source: last.source,
      eventType: last.eventType,
      category: last.category,
      position: 1,
      lagDays,
      attributionCredit: 1,
      attributionValue: conversionValue
    }];
  }

  private linearAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    conversionTime: Date
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    const credit = 1 / touchpoints.length;
    const result: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      position: number;
      lagDays: number;
      attributionCredit: number;
      attributionValue: number;
    }> = [];

    // Reverse to get chronological order
    const chronological = [...touchpoints].reverse();

    chronological.forEach((tp, index) => {
      const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
      result.push({
        signalId: tp.signalId,
        source: tp.source,
        eventType: tp.eventType,
        category: tp.category,
        position: index + 1,
        lagDays,
        attributionCredit: credit,
        attributionValue: conversionValue * credit
      });
    });

    return result;
  }

  private timeDecayAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    conversionTime: Date
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    const halfLife = 7; // Default 7 days half-life
    let totalWeight = 0;
    const weights: number[] = [];

    // Calculate weights based on time decay
    touchpoints.forEach((tp) => {
      const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
      const weight = Math.pow(0.5, lagDays / halfLife);
      weights.push(weight);
      totalWeight += weight;
    });

    const result: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      position: number;
      lagDays: number;
      attributionCredit: number;
      attributionValue: number;
    }> = [];

    const chronological = [...touchpoints].reverse();

    chronological.forEach((tp, index) => {
      const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
      const weight = weights[touchpoints.length - 1 - index];
      const credit = totalWeight > 0 ? weight / totalWeight : 0;

      result.push({
        signalId: tp.signalId,
        source: tp.source,
        eventType: tp.eventType,
        category: tp.category,
        position: index + 1,
        lagDays,
        attributionCredit: credit,
        attributionValue: conversionValue * credit
      });
    });

    return result;
  }

  private positionBasedAttribution(
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      timestamp: Date;
      windowType: 'view' | 'click';
    }>,
    conversionValue: number,
    conversionTime: Date
  ): Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    position: number;
    lagDays: number;
    attributionCredit: number;
    attributionValue: number;
  }> {
    const firstWeight = 0.4;
    const lastWeight = 0.4;
    const middleWeight = 0.2;

    const result: Array<{
      signalId: string;
      source: string;
      eventType: string;
      category: string;
      position: number;
      lagDays: number;
      attributionCredit: number;
      attributionValue: number;
    }> = [];

    if (touchpoints.length === 1) {
      // Only one touchpoint, get all credit
      const tp = touchpoints[0];
      const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
      return [{
        signalId: tp.signalId,
        source: tp.source,
        eventType: tp.eventType,
        category: tp.category,
        position: 1,
        lagDays,
        attributionCredit: 1,
        attributionValue: conversionValue
      }];
    }

    if (touchpoints.length === 2) {
      // Two touchpoints, split evenly
      const chronological = [...touchpoints].reverse();
      chronological.forEach((tp, index) => {
        const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
        result.push({
          signalId: tp.signalId,
          source: tp.source,
          eventType: tp.eventType,
          category: tp.category,
          position: index + 1,
          lagDays,
          attributionCredit: 0.5,
          attributionValue: conversionValue * 0.5
        });
      });
      return result;
    }

    // Multiple touchpoints
    const chronological = [...touchpoints].reverse();
    const first = chronological[0];
    const last = chronological[chronological.length - 1];
    const middle = chronological.slice(1, -1);

    // First touchpoint
    const firstLagDays = this.calculateLagDays(first.timestamp, conversionTime);
    result.push({
      signalId: first.signalId,
      source: first.source,
      eventType: first.eventType,
      category: first.category,
      position: 1,
      lagDays: firstLagDays,
      attributionCredit: firstWeight,
      attributionValue: conversionValue * firstWeight
    });

    // Middle touchpoints
    if (middle.length > 0) {
      const middleCredit = middleWeight / middle.length;
      middle.forEach((tp, index) => {
        const lagDays = this.calculateLagDays(tp.timestamp, conversionTime);
        result.push({
          signalId: tp.signalId,
          source: tp.source,
          eventType: tp.eventType,
          category: tp.category,
          position: index + 2,
          lagDays,
          attributionCredit: middleCredit,
          attributionValue: conversionValue * middleCredit
        });
      });
    }

    // Last touchpoint
    const lastLagDays = this.calculateLagDays(last.timestamp, conversionTime);
    result.push({
      signalId: last.signalId,
      source: last.source,
      eventType: last.eventType,
      category: last.category,
      position: chronological.length,
      lagDays: lastLagDays,
      attributionCredit: lastWeight,
      attributionValue: conversionValue * lastWeight
    });

    return result;
  }

  private calculateLagDays(signalTime: Date, conversionTime: Date): number {
    const diffMs = conversionTime.getTime() - signalTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get conversion by ID
   */
  async getConversionById(conversionId: string): Promise<IConversion | null> {
    return Conversion.findOne({ conversionId }).lean();
  }

  /**
   * Get conversions by user ID
   */
  async getConversionsByUserId(userId: string, limit = 50, skip = 0): Promise<IConversion[]> {
    return Conversion.findByUserId(userId, limit, skip);
  }

  /**
   * Get conversions by date range
   */
  async getConversionsByDateRange(startDate: Date, endDate: Date): Promise<IConversion[]> {
    return Conversion.findByDateRange(startDate, endDate);
  }

  /**
   * Get conversions by category
   */
  async getConversionsByCategory(category: string, limit = 100): Promise<IConversion[]> {
    return Conversion.findByCategory(category, limit);
  }

  /**
   * Get conversion statistics
   */
  async getConversionStats(startDate?: Date, endDate?: Date): Promise<{
    totalConversions: number;
    totalValue: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    avgValue: number;
  }> {
    const matchStage: Record<string, unknown> = {};

    if (startDate && endDate) {
      matchStage.timestamp = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: 1 },
          totalValue: { $sum: '$conversionValue' },
          byType: { $push: '$conversionType' },
          byCategory: { $push: '$category' }
        }
      }
    ];

    const result = await Conversion.aggregate(pipeline);

    if (result.length === 0) {
      return {
        totalConversions: 0,
        totalValue: 0,
        byType: {},
        byCategory: {},
        avgValue: 0
      };
    }

    const data = result[0];

    // Count by type
    const byType: Record<string, number> = {};
    data.byType.forEach((type: string) => {
      byType[type] = (byType[type] || 0) + 1;
    });

    // Count by category
    const byCategory: Record<string, number> = {};
    data.byCategory.forEach((cat: string) => {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    return {
      totalConversions: data.totalConversions,
      totalValue: data.totalValue,
      byType,
      byCategory,
      avgValue: data.totalConversions > 0 ? data.totalValue / data.totalConversions : 0
    };
  }
}

export default new ConversionCaptureService();