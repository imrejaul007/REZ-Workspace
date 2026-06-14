import { v4 as uuidv4 } from 'uuid';
import { Measurement, IMeasurement, MeasurementType } from '../models/Measurement';
import { logMeasurementEvent } from '../utils/logger';
import {
  measurementsRecorded,
  measurementProcessingDuration,
  dbOperationDuration
} from '../utils/metrics';

export interface CampaignMeasurementInput {
  campaignId: string;
  type: MeasurementType;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    impressions: number;
    uniqueImpressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
  };
  demographics?: {
    ageGroups?: Record<string, number>;
    gender?: Record<string, number>;
    income?: Record<string, number>;
  };
  geoDistribution?: {
    country: string;
    state?: string;
    city?: string;
    impressions: number;
  }[];
  deviceBreakdown?: Record<string, number>;
  channelBreakdown?: Record<string, number>;
  brandLift?: {
    awareness?: number;
    consideration?: number;
    preference?: number;
    purchaseIntent?: number;
  };
  incrementality?: {
    testGroup: number;
    controlGroup: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ImpressionInput {
  campaignId: string;
  impressionId?: string;
  timestamp?: Date;
  deviceType?: string;
  placementType?: string;
  userId?: string;
  publisherId?: string;
  placementId?: string;
  creativeId?: string;
  viewerInfo?: {
    country: string;
    state?: string;
    city?: string;
    deviceType: string;
    browser?: string;
    os?: string;
  };
  viewabilityData?: {
    visibleArea: number;
    viewableTime: number;
    inViewStart?: Date;
    inViewEnd?: Date;
  };
  metadata?: Record<string, unknown>;
}

class MeasurementService {
  /**
   * Record a campaign measurement
   */
  async recordCampaignMeasurement(input: CampaignMeasurementInput): Promise<IMeasurement> {
    const startTime = Date.now();

    try {
      // Calculate derived metrics
      const cpm = input.metrics.spend
        ? (input.metrics.spend / input.metrics.impressions) * 1000
        : 0;
      const ctr = input.metrics.impressions
        ? (input.metrics.clicks || 0) / input.metrics.impressions
        : 0;
      const conversionRate = input.metrics.clicks
        ? (input.metrics.conversions || 0) / input.metrics.clicks
        : 0;

      const measurement = new Measurement({
        campaignId: input.campaignId,
        type: input.type,
        timestamp: input.timestamp || new Date(),
        period: input.period,
        metrics: {
          impressions: input.metrics.impressions,
          uniqueImpressions: input.metrics.uniqueImpressions || input.metrics.impressions,
          clicks: input.metrics.clicks || 0,
          conversions: input.metrics.conversions || 0,
          spend: input.metrics.spend || 0,
          cpm,
          ctr,
          conversionRate,
          roas: 0
        },
        demographics: input.demographics
          ? {
              ageGroups: input.demographics.ageGroups || {},
              gender: input.demographics.gender || {},
              income: input.demographics.income || {}
            }
          : undefined,
        geoDistribution: input.geoDistribution?.map((geo) => ({
          ...geo,
          percentage: geo.impressions / input.metrics.impressions
        })),
        deviceBreakdown: input.deviceBreakdown,
        channelBreakdown: input.channelBreakdown,
        brandLift: input.brandLift,
        incrementality: input.incrementality
          ? {
              ...input.incrementality,
              lift: input.incrementality.controlGroup
                ? (input.incrementality.testGroup - input.incrementality.controlGroup) /
                  input.incrementality.controlGroup
                : 0,
              confidence: 0.95
            }
          : undefined,
        metadata: input.metadata
      });

      await measurement.save();

      // Record metrics
      measurementsRecorded.inc({ type: input.type, campaign_id: input.campaignId });
      logMeasurementEvent('campaign_measurement_recorded', input.campaignId, {
        type: input.type,
        impressions: input.metrics.impressions,
        conversions: input.metrics.conversions || 0
      });

      return measurement;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      measurementProcessingDuration.observe({ type: 'campaign' }, duration);
    }
  }

  /**
   * Get campaign measurement by ID
   */
  async getCampaignMeasurement(
    campaignId: string,
    options?: {
      type?: MeasurementType;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IMeasurement[]> {
    const startTime = Date.now();

    try {
      const query: Record<string, unknown> = { campaignId };

      if (options?.type) {
        query.type = options.type;
      }

      if (options?.startDate || options?.endDate) {
        query.timestamp = {};
        if (options.startDate) {
          (query.timestamp as Record<string, Date>).$gte = options.startDate;
        }
        if (options.endDate) {
          (query.timestamp as Record<string, Date>).$lte = options.endDate;
        }
      }

      const measurements = await Measurement.find(query)
        .sort({ timestamp: -1 })
        .lean();

      dbOperationDuration.observe(
        { operation: 'find', collection: 'measurements' },
        (Date.now() - startTime) / 1000
      );

      return measurements as IMeasurement[];
    } catch (error) {
      logMeasurementEvent('get_measurement_error', campaignId, { error: String(error) });
      throw error;
    }
  }

  /**
   * Record an impression event
   */
  async recordImpression(input: ImpressionInput): Promise<{
    impressionId: string;
    recorded: boolean;
    timestamp: Date;
  }> {
    const startTime = Date.now();

    try {
      const impressionId = input.impressionId || uuidv4();
      const timestamp = input.timestamp || new Date();

      // Create a measurement record for the impression
      const measurement = new Measurement({
        campaignId: input.campaignId,
        type: MeasurementType.IMPRESSION,
        timestamp,
        period: {
          start: timestamp,
          end: timestamp
        },
        metrics: {
          impressions: 1,
          uniqueImpressions: 1,
          clicks: 0,
          conversions: 0,
          spend: 0,
          cpm: 0,
          ctr: 0,
          conversionRate: 0,
          roas: 0
        },
        metadata: {
          impressionId,
          deviceType: input.deviceType,
          placementType: input.placementType,
          userId: input.userId,
          publisherId: input.publisherId,
          placementId: input.placementId,
          creativeId: input.creativeId,
          viewerInfo: input.viewerInfo,
          viewabilityData: input.viewabilityData,
          ...input.metadata
        }
      });

      await measurement.save();

      // Record metrics
      impressionsRecorded.inc({
        campaign_id: input.campaignId,
        device_type: input.deviceType || 'unknown',
        placement_type: input.placementType || 'unknown'
      });

      logMeasurementEvent('impression_recorded', input.campaignId, {
        impressionId,
        deviceType: input.deviceType,
        placementType: input.placementType
      });

      return {
        impressionId,
        recorded: true,
        timestamp
      };
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      measurementProcessingDuration.observe({ type: 'impression' }, duration);
    }
  }

  /**
   * Get aggregated metrics for a campaign
   */
  async getCampaignAnalytics(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalSpend: number;
    avgCpm: number;
    avgCtr: number;
    conversionRate: number;
    deviceBreakdown: Record<string, number>;
    channelBreakdown: Record<string, number>;
    geoDistribution: { country: string; impressions: number; percentage: number }[];
    timeSeries: { date: string; impressions: number; conversions: number }[];
  }> {
    const matchStage: Record<string, unknown> = { campaignId };

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        (matchStage.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            deviceType: '$metadata.deviceType'
          },
          impressions: { $sum: '$metrics.impressions' },
          clicks: { $sum: '$metrics.clicks' },
          conversions: { $sum: '$metrics.conversions' },
          spend: { $sum: '$metrics.spend' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalConversions: { $sum: '$conversions' },
          totalSpend: { $sum: '$spend' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const results = await Measurement.aggregate(pipeline);

    const timeSeries = results.map((r) => ({
      date: r._id,
      impressions: r.totalImpressions,
      conversions: r.totalConversions
    }));

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.totalImpressions,
        clicks: acc.clicks + r.totalClicks,
        conversions: acc.conversions + r.totalConversions,
        spend: acc.spend + r.totalSpend
      }),
      { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
    );

    // Get device and channel breakdown
    const breakdownPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$metadata.deviceType',
          count: { $sum: '$metrics.impressions' }
        }
      }
    ];

    const deviceBreakdown = await Measurement.aggregate(breakdownPipeline);

    return {
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalSpend: totals.spend,
      avgCpm: totals.spend && totals.impressions ? (totals.spend / totals.impressions) * 1000 : 0,
      avgCtr: totals.impressions ? totals.clicks / totals.impressions : 0,
      conversionRate: totals.clicks ? totals.conversions / totals.clicks : 0,
      deviceBreakdown: deviceBreakdown.reduce(
        (acc, d) => ({ ...acc, [d._id || 'unknown']: d.count }),
        {}
      ),
      channelBreakdown: {},
      geoDistribution: [],
      timeSeries
    };
  }
}

export const measurementService = new MeasurementService();
export default measurementService;