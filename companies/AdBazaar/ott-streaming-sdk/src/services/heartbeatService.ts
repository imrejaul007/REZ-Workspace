import { Heartbeat } from '../models/index.js';
import { getRedisClient } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import type { Heartbeat as IHeartbeat, Heartbeat as HeartbeatInput } from '../types/index.js';

interface PlayerSession {
  sessionId: string;
  deviceId: string;
  contentId: string;
  startedAt: Date;
  lastHeartbeat: Date;
  position: number;
  quality: string;
  isActive: boolean;
}

const heartbeatTTL = 120; // 2 minutes - if no heartbeat, session is stale
const maxHeartbeatInterval = 60000; // 1 minute max between heartbeats

async function getRedis() {
  return getRedisClient();
}

export async function recordHeartbeat(
  heartbeat: HeartbeatInput
): Promise<{ recorded: boolean; sessionId?: string; error?: string }> {
  const { deviceId, contentId, position, quality, timestamp } = heartbeat;

  try {
    const redis = await getRedis();
    const sessionKey = `player:${deviceId}:${contentId}`;

    // Get or create session
    let session: PlayerSession;
    const existingSession = await redis.get(sessionKey);

    if (existingSession) {
      session = JSON.parse(existingSession);

      // Check if session is stale
      const lastHeartbeatTime = new Date(session.lastHeartbeat).getTime();
      const currentTime = new Date(timestamp).getTime();

      if (currentTime - lastHeartbeatTime > maxHeartbeatInterval) {
        // Session is stale, start new one
        session = {
          sessionId: uuidv4(),
          deviceId,
          contentId,
          startedAt: new Date(timestamp),
          lastHeartbeat: new Date(timestamp),
          position,
          quality,
          isActive: true,
        };
      } else {
        // Update existing session
        session.lastHeartbeat = new Date(timestamp);
        session.position = position;
        session.quality = quality;
      }
    } else {
      // Create new session
      session = {
        sessionId: uuidv4(),
        deviceId,
        contentId,
        startedAt: new Date(timestamp),
        lastHeartbeat: new Date(timestamp),
        position,
        quality,
        isActive: true,
      };
    }

    // Store session in Redis
    await redis.setEx(sessionKey, heartbeatTTL, JSON.stringify(session));

    // Store in MongoDB for persistence
    await Heartbeat.create({
      deviceId,
      contentId,
      position,
      quality,
      timestamp: new Date(timestamp),
      sessionId: session.sessionId,
    });

    // Track active players
    const activeKey = `active_players:${contentId}`;
    await redis.sAdd(activeKey, `${deviceId}:${session.sessionId}`);
    await redis.expire(activeKey, heartbeatTTL);

    return { recorded: true, sessionId: session.sessionId };
  } catch (error) {
    logger.error('Failed to record heartbeat:', error);
    return {
      recorded: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getActivePlayerSessions(
  contentId?: string
): Promise<PlayerSession[]> {
  const redis = await getRedis();

  if (contentId) {
    const activeKey = `active_players:${contentId}`;
    const members = await redis.sMembers(activeKey);

    const sessions: PlayerSession[] = [];
    for (const member of members) {
      const [deviceId, sessionId] = member.split(':');
      const sessionKey = `player:${deviceId}:${contentId}`;
      const data = await redis.get(sessionKey);
      if (data) {
        sessions.push(JSON.parse(data));
      }
    }
    return sessions;
  }

  // Get all active sessions
  const keys = await redis.keys('player:*');
  const sessions: PlayerSession[] = [];

  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      sessions.push(JSON.parse(data));
    }
  }

  return sessions;
}

export async function getPlayerSession(
  deviceId: string,
  contentId: string
): Promise<PlayerSession | null> {
  const redis = await getRedis();
  const sessionKey = `player:${deviceId}:${contentId}`;
  const data = await redis.get(sessionKey);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export async function endPlayerSession(
  deviceId: string,
  contentId: string
): Promise<{ ended: boolean; totalDuration: number }> {
  const redis = await getRedis();
  const sessionKey = `player:${deviceId}:${contentId}`;
  const activeKey = `active_players:${contentId}`;

  const data = await redis.get(sessionKey);
  if (!data) {
    return { ended: false, totalDuration: 0 };
  }

  const session: PlayerSession = JSON.parse(data);
  const totalDuration =
    new Date().getTime() - new Date(session.startedAt).getTime();

  // Remove from Redis
  await redis.del(sessionKey);
  await redis.sRem(activeKey, `${deviceId}:${session.sessionId}`);

  return { ended: true, totalDuration };
}

export async function getHeartbeatHistory(
  deviceId: string,
  contentId: string,
  limit: number = 100
): Promise<IHeartbeat[]> {
  return Heartbeat.find({ deviceId, contentId })
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getContentViewerCount(contentId: string): Promise<number> {
  const redis = await getRedis();
  const activeKey = `active_players:${contentId}`;
  return redis.sCard(activeKey);
}

export async function getTotalActiveViewers(): Promise<number> {
  const redis = await getRedis();
  const keys = await redis.keys('active_players:*');
  let total = 0;

  for (const key of keys) {
    total += await redis.sCard(key);
  }

  return total;
}