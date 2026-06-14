import { v4 as uuidv4 } from 'uuid';
import { Impression, ViewEvent, ViewportInfo, ViewabilityMetrics } from '../types';
import { logger } from '../utils/logger';

// IAB Standards
const IAB_VIEWABLE_THRESHOLD = 50; // 50% of ad must be in view
const IAB_TIME_IN_VIEW_MS = 1000; // 1 second minimum

export class ViewabilityService {
  private impressions: Map<string, Impression>;
  private viewEvents: Map<string, ViewEvent[]>;
  private iabThreshold: number;
  private minTimeInView: number;

  constructor(
    iabThreshold: number = IAB_VIEWABLE_THRESHOLD,
    minTimeInView: number = IAB_TIME_IN_VIEW_MS
  ) {
    this.impressions = new Map();
    this.viewEvents = new Map();
    this.iabThreshold = iabThreshold;
    this.minTimeInView = minTimeInView;
  }

  createImpression(data: {
    adId: string;
    placementId?: string;
    campaignId?: string;
    sessionId: string;
    userId?: string;
    timestamp?: Date;
    metadata?: {
      width: number;
      height: number;
      position?: 'above' | 'below' | 'unknown';
      format?: 'display' | 'video' | 'native' | 'rich_media';
    };
  }): Impression {
    const impression: Impression = {
      id: uuidv4(),
      adId: data.adId,
      placementId: data.placementId,
      campaignId: data.campaignId,
      sessionId: data.sessionId,
      userId: data.userId,
      timestamp: data.timestamp || new Date(),
      measurable: false,
      metadata: {
        width: data.metadata?.width || 0,
        height: data.metadata?.height || 0,
        position: data.metadata?.position,
        format: data.metadata?.format,
      },
    };

    this.impressions.set(impression.id, impression);
    this.viewEvents.set(impression.id, []);

    logger.logImpression(data.adId, impression.id, false);

    return impression;
  }

  recordViewEvent(data: {
    impressionId: string;
    adId: string;
    sessionId: string;
    eventType: string;
    timestamp?: Date;
    viewportInfo?: ViewportInfo;
  }): ViewEvent | undefined {
    const impression = this.impressions.get(data.impressionId);
    if (!impression) return undefined;

    const event: ViewEvent = {
      id: uuidv4(),
      impressionId: data.impressionId,
      adId: data.adId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      timestamp: data.timestamp || new Date(),
      viewportInfo: data.viewportInfo,
    };

    const events = this.viewEvents.get(data.impressionId) || [];
    events.push(event);
    this.viewEvents.set(data.impressionId, events);

    // Update impression based on event
    this.processViewEvent(impression, event);

    if (data.viewportInfo) {
      logger.logViewEvent(
        data.adId,
        data.eventType,
        data.viewportInfo.percentVisible,
        data.viewportInfo.timeInView
      );
    }

    return event;
  }

  private processViewEvent(impression: Impression, event: ViewEvent): void {
    if (!impression.measurable && event.viewportInfo) {
      // Mark as measurable once we have viewport info
      impression.measurable = true;
      impression.measurableAt = event.timestamp;
    }

    if (
      !impression.viewableAt &&
      event.viewportInfo &&
      event.viewportInfo.percentVisible >= this.iabThreshold &&
      event.viewportInfo.timeInView >= this.minTimeInView
    ) {
      // Mark as viewable when criteria are met
      impression.viewableAt = event.timestamp;
    }

    if (event.eventType === 'exit_viewport' || event.eventType === 'background') {
      impression.exitTime = event.timestamp;
    }
  }

  getImpression(impressionId: string): Impression | undefined {
    return this.impressions.get(impressionId);
  }

  getImpressionsByAd(adId: string): Impression[] {
    return Array.from(this.impressions.values()).filter(i => i.adId === adId);
  }

  getViewEvents(impressionId: string): ViewEvent[] {
    return this.viewEvents.get(impressionId) || [];
  }

  calculateViewabilityMetrics(adId: string): ViewabilityMetrics {
    const impressions = this.getImpressionsByAd(adId);

    const totalImpressions = impressions.length;
    const measurableImpressions = impressions.filter(i => i.measurable).length;
    const viewableImpressions = impressions.filter(i => i.viewableAt).length;

    // Calculate averages
    let totalTimeInView = 0;
    let totalPercentVisible = 0;
    let viewEventsCount = 0;

    for (const impression of impressions) {
      const events = this.viewEvents.get(impression.id) || [];
      for (const event of events) {
        if (event.viewportInfo) {
          totalTimeInView += event.viewportInfo.timeInView;
          totalPercentVisible += event.viewportInfo.percentVisible;
          viewEventsCount++;
        }
      }
    }

    return {
      adId,
      totalImpressions,
      measurableImpressions,
      viewableImpressions,
      viewabilityRate: measurableImpressions > 0
        ? (viewableImpressions / measurableImpressions) * 100
        : 0,
      measurableRate: totalImpressions > 0
        ? (measurableImpressions / totalImpressions) * 100
        : 0,
      averageTimeInView: viewEventsCount > 0 ? totalTimeInView / viewEventsCount : 0,
      averagePercentVisible: viewEventsCount > 0 ? totalPercentVisible / viewEventsCount : 0,
      viewableImpressionRate: totalImpressions > 0
        ? (viewableImpressions / totalImpressions) * 100
        : 0,
    };
  }

  isViewable(impressionId: string): boolean {
    const impression = this.impressions.get(impressionId);
    return !!impression?.viewableAt;
  }

  setIABThreshold(threshold: number): void {
    this.iabThreshold = threshold;
  }

  setMinTimeInView(ms: number): void {
    this.minTimeInView = ms;
  }

  clearOldImpressions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;

    for (const [id, impression] of this.impressions.entries()) {
      if (impression.timestamp.getTime() < cutoff) {
        this.impressions.delete(id);
        this.viewEvents.delete(id);
      }
    }
  }

  getStats(): { impressions: number; viewEvents: number } {
    let eventCount = 0;
    for (const events of this.viewEvents.values()) {
      eventCount += events.length;
    }

    return {
      impressions: this.impressions.size,
      viewEvents: eventCount,
    };
  }
}

export const viewabilityService = new ViewabilityService();
