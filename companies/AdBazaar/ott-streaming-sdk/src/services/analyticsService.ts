import { PlaybackEvent } from '../models/index.js';
import { getRedisClient } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import type { PlaybackEvent as IPlaybackEvent, AnalyticsEvent } from '../types/index.js';

interface AnalyticsMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgBitrate: number;
  bufferRate: number;
  completionRate: number;
  uniqueDevices: number;
  uniqueContent: number;
}

interface PlaybackSession {
  sessionId: string;
  deviceId: string;
  contentId: string;
  startTime: Date;
  lastActivity: Date;
  events: number;
  quality: string;
}

const sessionTTL = 3600; // 1 hour
const metricsWindow = 86400; // 24 hours

async function getRedis() {
  return getRedisClient();
}

export async function collectPlaybackEvents(
  events: AnalyticsEvent['events'],
  appId?: string
): Promise<{ collected: number; failed: number }> {
  let collected = 0;
  let failed = 0;

  for (const event of events) {
    try {
      // Create session if not exists
      const redis = await getRedis();
      const sessionKey = `session:${event.deviceId}:${event.contentId}`;

      const sessionExists = await redis.exists(sessionKey);
      if (!sessionExists) {
        const sessionId = uuidv4();
        const sessionData: PlaybackSession = {
          sessionId,
          deviceId: event.deviceId,
          contentId: event.contentId,
          startTime: new Date(),
          lastActivity: new Date(),
          events: 0,
          quality: event.metadata.quality,
        };
        await redis.setEx(
          sessionKey,
          sessionTTL,
          JSON.stringify(sessionData)
        );
      }

      // Update session activity
      const sessionData = await redis.get(sessionKey);
      if (sessionData) {
        const session: PlaybackSession = JSON.parse(sessionData);
        session.lastActivity = new Date();
        session.events += 1;
        await redis.setEx(sessionKey, sessionTTL, JSON.stringify(session));
      }

      // Store event in database
      await PlaybackEvent.create({
        eventId: event.eventId || uuidv4(),
        contentId: event.contentId,
        deviceId: event.deviceId,
        eventType: event.eventType,
        timestamp: new Date(event.timestamp),
        metadata: event.metadata,
        sessionId: `${event.deviceId}:${event.contentId}`,
      });

      // Track in Redis for real-time metrics
      const metricsKey = `metrics:${event.contentId}:${event.eventType}`;
      await redis.incr(metricsKey);
      await redis.expire(metricsKey, metricsWindow);

      collected++;
    } catch (error) {
      logger.error('Failed to collect event:', error);
      failed++;
    }
  }

  return { collected, failed };
}

export async function getPlaybackMetrics(
  contentId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsMetrics> {
  const query: Record<string, unknown> = {};

  if (contentId) {
    query.contentId = contentId;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      (query.timestamp as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (query.timestamp as Record<string, Date>).$lte = endDate;
    }
  }

  const events = await PlaybackEvent.find(query);

  const metrics: AnalyticsMetrics = {
    totalEvents: events.length,
    eventsByType: {},
    avgBitrate: 0,
    bufferRate: 0,
    completionRate: 0,
    uniqueDevices: new Set(events.map((e) => e.deviceId)).size,
    uniqueContent: new Set(events.map((e) => e.contentId)).size,
  };

  let totalBitrate = 0;
  let bufferCount = 0;
  let completeCount = 0;

  for (const event of events) {
    // Count by type
    metrics.eventsByType[event.eventType] =
      (metrics.eventsByType[event.eventType] || 0) + 1;

    // Calculate bitrate
    totalBitrate += event.metadata.bitrate;

    // Count buffers
    if (event.eventType === 'buffer') {
      bufferCount++;
    }

    // Count completions
    if (event.eventType === 'complete') {
      completeCount++;
    }
  }

  // Calculate averages
  if (events.length > 0) {
    metrics.avgBitrate = totalBitrate / events.length;
    metrics.bufferRate = bufferCount / events.length;
    metrics.completionRate = completeCount / metrics.uniqueContent;
  }

  return metrics;
}

export async function getActiveSessions(): Promise<PlaybackSession[]> {
  const redis = await getRedis();
  const keys = await redis.keys('session:*');

  const sessions: PlaybackSession[] = [];

  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      sessions.push(JSON.parse(data));
    }
  }

  return sessions;
}

export async function getDevicePlaybackHistory(
  deviceId: string,
  limit: number = 50
): Promise<IPlaybackEvent[]> {
  return PlaybackEvent.find({ deviceId })
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getContentAnalytics(
  contentId: string
): Promise<{
  totalPlays: number;
  uniqueViewers: number;
  avgWatchDuration: number;
  completionRate: number;
  qualityDistribution: Record<string, number>;
}> {
  const events = await PlaybackEvent.find({ contentId });

  const plays = events.filter((e) => e.eventType === 'play');
  const completes = events.filter((e) => e.eventType === 'complete');

  const qualityDistribution: Record<string, number> = {};
  let totalDuration = 0;

  for (const event of events) {
    qualityDistribution[event.metadata.quality] =
      (qualityDistribution[event.metadata.quality] || 0) + 1;

    if (event.eventType === 'complete') {
      totalDuration += event.metadata.position;
    }
  }

  return {
    totalPlays: plays.length,
    uniqueViewers: new Set(events.map((e) => e.deviceId)).size,
    avgWatchDuration:
      completes.length > 0 ? totalDuration / completes.length : 0,
    completionRate: plays.length > 0 ? completes.length / plays.length : 0,
    qualityDistribution,
  };
}