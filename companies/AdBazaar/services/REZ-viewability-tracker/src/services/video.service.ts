import { v4 as uuidv4 } from 'uuid';
import { VideoEvent, VideoMetrics, VideoEventType, VideoInfo } from '../types';
import { logger } from '../utils/logger';

const VIDEO_COMPLETION_THRESHOLD = 75; // 75% watched = completion

export class VideoService {
  private events: Map<string, VideoEvent[]>;
  private completionThreshold: number;

  constructor(completionThreshold: number = VIDEO_COMPLETION_THRESHOLD) {
    this.events = new Map();
    this.completionThreshold = completionThreshold;
  }

  recordEvent(data: {
    impressionId: string;
    adId: string;
    sessionId: string;
    eventType: VideoEventType;
    timestamp?: Date;
    videoInfo?: VideoInfo;
  }): VideoEvent {
    const event: VideoEvent = {
      id: uuidv4(),
      impressionId: data.impressionId,
      adId: data.adId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      timestamp: data.timestamp || new Date(),
      videoInfo: data.videoInfo,
    };

    const events = this.events.get(data.impressionId) || [];
    events.push(event);
    this.events.set(data.impressionId, events);

    logger.logVideoEvent(
      data.adId,
      data.eventType,
      data.videoInfo?.currentTime || 0,
      data.videoInfo?.duration || 0
    );

    return event;
  }

  getEvents(impressionId: string): VideoEvent[] {
    return this.events.get(impressionId) || [];
  }

  getEventsByAd(adId: string): VideoEvent[] {
    const allEvents: VideoEvent[] = [];
    for (const events of this.events.values()) {
      const adEvents = events.filter(e => e.adId === adId);
      allEvents.push(...adEvents);
    }
    return allEvents;
  }

  calculateVideoMetrics(adId: string): VideoMetrics {
    const adEvents = this.getEventsByAd(adId);

    // Group events by session/impression
    const sessions = new Map<string, VideoEvent[]>();
    for (const event of adEvents) {
      const key = `${event.sessionId}:${event.impressionId}`;
      const sessionEvents = sessions.get(key) || [];
      sessionEvents.push(event);
      sessions.set(key, sessionEvents);
    }

    let totalStarts = 0;
    let completions = 0;
    let firstQuartile = 0;
    let midpoint = 0;
    let thirdQuartile = 0;
    let totalWatchTime = 0;
    let totalCompletionPercentage = 0;
    let mutedCount = 0;
    let fullscreenCount = 0;
    let sessionCount = 0;

    for (const [, events] of sessions) {
      // Sort by timestamp
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const hasStart = events.some(e => e.eventType === 'start');
      const hasComplete = events.some(e => e.eventType === 'complete');

      if (hasStart) {
        totalStarts++;
        sessionCount++;
      }

      if (hasComplete) {
        completions++;
      }

      // Check quartile events
      if (events.some(e => e.eventType === 'firstQuartile')) firstQuartile++;
      if (events.some(e => e.eventType === 'midpoint')) midpoint++;
      if (events.some(e => e.eventType === 'thirdQuartile')) thirdQuartile++;

      // Calculate watch time and completion percentage
      const startEvent = events.find(e => e.eventType === 'start');
      const lastEvent = events[events.length - 1];

      if (startEvent?.videoInfo && lastEvent?.videoInfo) {
        const duration = lastEvent.videoInfo.duration;
        const watchTime = lastEvent.videoInfo.currentTime;
        totalWatchTime += watchTime;
        totalCompletionPercentage += duration > 0 ? (watchTime / duration) * 100 : 0;
      }

      // Check mute/fullscreen states
      if (events.some(e => e.eventType === 'mute')) mutedCount++;
      if (events.some(e => e.eventType === 'fullscreen')) fullscreenCount++;
    }

    return {
      adId,
      totalStarts,
      completions,
      completionRate: totalStarts > 0 ? (completions / totalStarts) * 100 : 0,
      quartileCompletion: {
        firstQuartile: totalStarts > 0 ? (firstQuartile / totalStarts) * 100 : 0,
        midpoint: totalStarts > 0 ? (midpoint / totalStarts) * 100 : 0,
        thirdQuartile: totalStarts > 0 ? (thirdQuartile / totalStarts) * 100 : 0,
      },
      averageWatchTime: sessionCount > 0 ? totalWatchTime / sessionCount : 0,
      averageCompletionPercentage: sessionCount > 0 ? totalCompletionPercentage / sessionCount : 0,
      muteRate: sessionCount > 0 ? (mutedCount / sessionCount) * 100 : 0,
      fullscreenRate: sessionCount > 0 ? (fullscreenCount / sessionCount) * 100 : 0,
    };
  }

  setCompletionThreshold(threshold: number): void {
    this.completionThreshold = threshold;
  }

  clearOldEvents(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;

    for (const [key, events] of this.events.entries()) {
      const filteredEvents = events.filter(e => e.timestamp.getTime() >= cutoff);
      if (filteredEvents.length === 0) {
        this.events.delete(key);
      } else {
        this.events.set(key, filteredEvents);
      }
    }
  }

  getStats(): { sessions: number; events: number } {
    let eventCount = 0;
    for (const events of this.events.values()) {
      eventCount += events.length;
    }

    return {
      sessions: this.events.size,
      events: eventCount,
    };
  }
}

export const videoService = new VideoService();
