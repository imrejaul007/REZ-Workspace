import { ViewabilityMetrics, VideoMetrics, ViewabilityReport, AdFormat } from '../types';
import { viewabilityService } from './viewability.service';
import { videoService } from './video.service';
import { logger } from '../utils/logger';

export class AnalyticsService {
  private aggregationInterval: number; // minutes
  private retentionDays: number;

  constructor(
    aggregationInterval: number = 60,
    retentionDays: number = 90
  ) {
    this.aggregationInterval = aggregationInterval;
    this.retentionDays = retentionDays;
  }

  getViewabilityReport(options: {
    date: string;
    adId?: string;
    campaignId?: string;
    placementId?: string;
  }): ViewabilityReport {
    const viewabilityMetrics = options.adId
      ? viewabilityService.calculateViewabilityMetrics(options.adId)
      : this.aggregateAllViewabilityMetrics();

    // Calculate video metrics if applicable
    let videoMetrics: VideoMetrics | undefined;
    if (options.adId) {
      videoMetrics = videoService.calculateVideoMetrics(options.adId);
    }

    const report: ViewabilityReport = {
      date: options.date,
      adId: options.adId,
      campaignId: options.campaignId,
      placementId: options.placementId,
      viewabilityMetrics,
      videoMetrics,
      breakdown: {
        byFormat: this.breakdownByFormat(),
        byPosition: this.breakdownByPosition(),
      },
    };

    logger.logViewabilityRate(
      options.adId || 'all',
      viewabilityMetrics.viewableImpressionRate,
      viewabilityMetrics.totalImpressions
    );

    return report;
  }

  private aggregateAllViewabilityMetrics(): ViewabilityMetrics {
    const allMetrics: ViewabilityMetrics[] = [];

    // This is simplified - in production, aggregate from stored metrics
    return {
      adId: 'aggregated',
      totalImpressions: 0,
      measurableImpressions: 0,
      viewableImpressions: 0,
      viewabilityRate: 0,
      measurableRate: 0,
      averageTimeInView: 0,
      averagePercentVisible: 0,
      viewableImpressionRate: 0,
    };
  }

  private breakdownByFormat(): Record<AdFormat, ViewabilityMetrics> {
    const formats: AdFormat[] = ['display', 'video', 'native', 'rich_media'];
    const breakdown: Record<string, ViewabilityMetrics> = {};

    for (const format of formats) {
      breakdown[format] = {
        adId: `format:${format}`,
        totalImpressions: 0,
        measurableImpressions: 0,
        viewableImpressions: 0,
        viewabilityRate: 0,
        measurableRate: 0,
        averageTimeInView: 0,
        averagePercentVisible: 0,
        viewableImpressionRate: 0,
      };
    }

    return breakdown as Record<AdFormat, ViewabilityMetrics>;
  }

  private breakdownByPosition(): Record<string, ViewabilityMetrics> {
    const positions = ['above', 'below', 'unknown'];
    const breakdown: Record<string, ViewabilityMetrics> = {};

    for (const position of positions) {
      breakdown[position] = {
        adId: `position:${position}`,
        totalImpressions: 0,
        measurableImpressions: 0,
        viewableImpressions: 0,
        viewabilityRate: 0,
        measurableRate: 0,
        averageTimeInView: 0,
        averagePercentVisible: 0,
        viewableImpressionRate: 0,
      };
    }

    return breakdown;
  }

  getHistoricalViewability(
    adId: string,
    days: number = 7
  ): { date: string; metrics: ViewabilityMetrics }[] {
    const history: { date: string; metrics: ViewabilityMetrics }[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const metrics = viewabilityService.calculateViewabilityMetrics(adId);
      history.push({ date: dateStr, metrics });
    }

    return history.reverse();
  }

  compareViewability(
    adIds: string[]
  ): { adId: string; metrics: ViewabilityMetrics }[] {
    return adIds.map(adId => ({
      adId,
      metrics: viewabilityService.calculateViewabilityMetrics(adId),
    }));
  }

  setAggregationInterval(minutes: number): void {
    this.aggregationInterval = minutes;
  }

  setRetentionDays(days: number): void {
    this.retentionDays = days;
  }

  cleanupOldData(): void {
    const maxAge = this.retentionDays * 24 * 60 * 60 * 1000;
    viewabilityService.clearOldImpressions(maxAge);
    videoService.clearOldEvents(maxAge);
  }
}

export const analyticsService = new AnalyticsService();
