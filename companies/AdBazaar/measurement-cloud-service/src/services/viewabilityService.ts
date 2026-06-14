import { v4 as uuidv4 } from 'uuid';
import {
  Viewability,
  VideoViewability,
  IViewability,
  ViewabilityStandard,
  ViewabilityStatus
} from '../models/Viewability';
import { logViewabilityEvent } from '../utils/logger';
import {
  viewableImpressions,
  viewabilityRate,
  dbOperationDuration
} from '../utils/metrics';

export interface ViewabilityInput {
  campaignId: string;
  impressionId: string;
  timestamp?: Date;
  standard?: ViewabilityStandard;
  viewableTime: number; // milliseconds
  visibleArea: number; // percentage (0-100)
  inViewStart?: Date;
  inViewEnd?: Date;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'ctv';
  format?: 'display' | 'video' | 'native';
  placementType?: 'preRoll' | 'midRoll' | 'postRoll' | 'inFeed' | 'banner';
  playerState?: {
    paused: boolean;
    muted: boolean;
    fullscreen: boolean;
    autoplay: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ViewabilityCheckResult {
  impressionId: string;
  status: ViewabilityStatus;
  viewableTime: number;
  visibleArea: number;
  standard: ViewabilityStandard;
  timestamp: Date;
}

class ViewabilityService {
  /**
   * Track viewability for an impression
   */
  async trackViewability(input: ViewabilityInput): Promise<ViewabilityCheckResult> {
    const startTime = Date.now();

    try {
      const standard = input.standard || ViewabilityStandard.IAB_STANDARD;
      const timestamp = input.timestamp || new Date();

      // Determine viewability status based on standard
      const status = this.determineViewabilityStatus(
        standard,
        input.viewableTime,
        input.visibleArea
      );

      logViewabilityEvent('viewability_tracked', input.campaignId, {
        impressionId: input.impressionId,
        status,
        viewableTime: input.viewableTime,
        visibleArea: input.visibleArea
      });

      return {
        impressionId: input.impressionId,
        status,
        viewableTime: input.viewableTime,
        visibleArea: input.visibleArea,
        standard,
        timestamp
      };
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'insert', collection: 'viewability' },
        duration
      );
    }
  }

  /**
   * Determine viewability status based on standard
   */
  private determineViewabilityStatus(
    standard: ViewabilityStandard,
    viewableTime: number,
    visibleArea: number
  ): ViewabilityStatus {
    switch (standard) {
      case ViewabilityStandard.IAB_STANDARD:
        // IAB: 50% of pixels visible for 1 second (display) or 2 seconds (video)
        const minTime = 1000; // 1 second
        const minArea = 50;
        if (visibleArea >= minArea && viewableTime >= minTime) {
          return ViewabilityStatus.VIEWABLE;
        }
        return ViewabilityStatus.NOT_VIEWABLE;

      case ViewabilityStandard.MRC_STANDARD:
        // MRC:50% of pixels for 1+ second (display), 50% for 2+ seconds (video)
        const mrcMinTime = 2000; // 2 seconds
        const mrcMinArea = 50;
        if (visibleArea >= mrcMinArea && viewableTime >= mrcMinTime) {
          return ViewabilityStatus.VIEWABLE;
        }
        return ViewabilityStatus.NOT_VIEWABLE;

      case ViewabilityStandard.OMID_STANDARD:
        // OMID:50% visible area for at least 1 second
        if (visibleArea >= 50 && viewableTime >= 1000) {
          return ViewabilityStatus.VIEWABLE;
        }
        return ViewabilityStatus.NOT_VIEWABLE;

      case ViewabilityStandard.CUSTOM:
        // Custom: configurable thresholds (using IAB as default)
        if (visibleArea >= 50 && viewableTime >= 1000) {
          return ViewabilityStatus.VIEWABLE;
        }
        return ViewabilityStatus.NOT_VIEWABLE;

      default:
        return ViewabilityStatus.UNMEASURABLE;
    }
  }

  /**
   * Record viewability metrics for a campaign
   */
  async recordViewabilityMetrics(
    campaignId: string,
    period: { start: Date; end: Date },
    measurements: ViewabilityInput[],
    standard: ViewabilityStandard = ViewabilityStandard.IAB_STANDARD
  ): Promise<IViewability> {
    const startTime = Date.now();

    try {
      // Calculate metrics
      const totalImpressions = measurements.length;
      const viewableCount = measurements.filter((m) => {
        const status = this.determineViewabilityStatus(
          standard,
          m.viewableTime,
          m.visibleArea
        );
        return status === ViewabilityStatus.VIEWABLE;
      }).length;

      const viewabilityRateValue = totalImpressions > 0
        ? (viewableCount / totalImpressions) * 100
        : 0;

      // Calculate breakdown by device, format, and placement
      const deviceBreakdown = {
        desktop: measurements.filter((m) => m.deviceType === 'desktop').length,
        mobile: measurements.filter((m) => m.deviceType === 'mobile').length,
        tablet: measurements.filter((m) => m.deviceType === 'tablet').length,
        ctv: measurements.filter((m) => m.deviceType === 'ctv').length
      };

      const formatBreakdown = {
        display: measurements.filter((m) => m.format === 'display').length,
        video: measurements.filter((m) => m.format === 'video').length,
        native: measurements.filter((m) => m.format === 'native').length
      };

      const placementBreakdown = {
        preRoll: measurements.filter((m) => m.placementType === 'preRoll').length,
        midRoll: measurements.filter((m) => m.placementType === 'midRoll').length,
        postRoll: measurements.filter((m) => m.placementType === 'postRoll').length,
        inFeed: measurements.filter((m) => m.placementType === 'inFeed').length,
        banner: measurements.filter((m) => m.placementType === 'banner').length
      };

      // Calculate viewable time metrics
      const viewableTimes = measurements.map((m) => m.viewableTime);
      const avgViewableTime = viewableTimes.length > 0
        ? viewableTimes.reduce((a, b) => a + b, 0) / viewableTimes.length
        : 0;

      // Calculate visible area percentiles
      const visibleAreas = measurements.map((m) => m.visibleArea);
      const pct50OnScreen = (visibleAreas.filter((a) => a >= 50).length / visibleAreas.length) * 100 || 0;
      const pct100OnScreen = (visibleAreas.filter((a) => a >= 100).length / visibleAreas.length) * 100 || 0;

      const viewability = new Viewability({
        campaignId,
        timestamp: new Date(),
        period,
        viewableImpressions: viewableCount,
        totalImpressions,
        viewabilityRate: viewabilityRateValue,
        measurableRate: 100, // Would be calculated based on measurable impressions
        standard,
        metrics: {
          avgViewableTime,
          medianViewableTime: this.calculateMedian(viewableTimes),
          pctFullyOnScreen: pct100OnScreen,
          pct50OnScreen,
          pct100OnScreen
        },
        breakdown: {
          device: deviceBreakdown,
          format: formatBreakdown,
          placement: placementBreakdown
        },
        measurements: measurements.map((m) => ({
          impressionId: m.impressionId,
          timestamp: m.timestamp || new Date(),
          standard,
          status: this.determineViewabilityStatus(standard, m.viewableTime, m.visibleArea),
          viewableTime: m.viewableTime,
          visibleArea: m.visibleArea,
          inViewStart: m.inViewStart,
          inViewEnd: m.inViewEnd,
          playerState: m.playerState
        }))
      });

      await viewability.save();

      // Record metrics
      viewableImpressions.inc({
        campaign_id: campaignId,
        standard
      });

      viewabilityRate.set(
        { campaign_id: campaignId, standard },
        viewabilityRateValue
      );

      logViewabilityEvent('viewability_metrics_recorded', campaignId, {
        totalImpressions,
        viewableImpressions: viewableCount,
        viewabilityRate: viewabilityRateValue,
        standard
      });

      return viewability;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'insert', collection: 'viewability' },
        duration
      );
    }
  }

  /**
   * Get viewability metrics for a campaign
   */
  async getViewabilityMetrics(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      standard?: ViewabilityStandard;
    }
  ): Promise<{
    viewabilityRate: number;
    avgViewableTime: number;
    totalImpressions: number;
    viewableImpressions: number;
    breakdown: {
      device: Record<string, number>;
      format: Record<string, number>;
      placement: Record<string, number>;
    };
    timeSeries: { date: string; rate: number }[];
  }> {
    const startTime = Date.now();

    try {
      const matchQuery: Record<string, unknown> = { campaignId };

      if (options?.startDate || options?.endDate) {
        matchQuery.period = {};
        if (options.startDate) {
          (matchQuery.period as Record<string, Date>).start = { $gte: options.startDate };
        }
        if (options.endDate) {
          (matchQuery.period as Record<string, Date>).end = { $lte: options.endDate };
        }
      }

      if (options?.standard) {
        matchQuery.standard = options.standard;
      }

      const aggregations = await Viewability.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            avgViewabilityRate: { $avg: '$viewabilityRate' },
            totalImpressions: { $sum: '$totalImpressions' },
            viewableImpressions: { $sum: '$viewableImpressions' },
            avgViewableTime: { $avg: '$metrics.avgViewableTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const totals = aggregations.reduce(
        (acc, agg) => ({
          totalImpressions: acc.totalImpressions + agg.totalImpressions,
          viewableImpressions: acc.viewableImpressions + agg.viewableImpressions,
          avgViewableTime: (acc.avgViewableTime * acc.count + agg.avgViewableTime) / (acc.count + 1),
          count: acc.count + 1
        }),
        { totalImpressions: 0, viewableImpressions: 0, avgViewableTime: 0, count: 0 }
      );

      return {
        viewabilityRate: totals.totalImpressions > 0
          ? (totals.viewableImpressions / totals.totalImpressions) * 100
          : 0,
        avgViewableTime: totals.avgViewableTime,
        totalImpressions: totals.totalImpressions,
        viewableImpressions: totals.viewableImpressions,
        breakdown: {
          device: {},
          format: {},
          placement: {}
        },
        timeSeries: aggregations.map((agg) => ({
          date: agg._id.date,
          rate: agg.avgViewabilityRate
        }))
      };
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'aggregate', collection: 'viewability' },
        duration
      );
    }
  }

  /**
   * Track video viewability for CTV/streaming
   */
  async trackVideoViewability(input: {
    campaignId: string;
    videoId: string;
    sessionId: string;
    playerInfo: {
      playerType: string;
      playerVersion: string;
      sdkVersion: string;
    };
    videoInfo: {
      duration: number;
      currentPosition: number;
      isMidroll: boolean;
    };
    viewability: {
      visibleArea: number;
      audibleInView: boolean;
      fullyOnScreen: boolean;
      inViewStartTime: Date;
      inViewEndTime?: Date;
      totalViewableTime: number;
    };
    completionRate: number;
    metadata?: Record<string, unknown>;
  }): Promise<VideoViewability> {
    const status = this.determineViewabilityStatus(
      ViewabilityStandard.OMID_STANDARD,
      input.viewability.totalViewableTime,
      input.viewability.visibleArea
    );

    const videoViewability = new VideoViewability({
      ...input,
      timestamp: new Date(),
      viewability: {
        ...input.viewability,
        status
      }
    });

    await videoViewability.save();

    return videoViewability;
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }
}

export const viewabilityService = new ViewabilityService();
export default viewabilityService;