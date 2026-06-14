import { logger } from '../../shared/logger';
/**
 * Redis Socket Manager
 *
 * Replaces in-memory socket mappings with Redis Hash for persistence.
 * Ensures socket state survives server restarts.
 *
 * Key patterns:
 * - socket:driver:{driverId} -> socketId
 * - socket:user:{userId} -> socketId
 * - socket:reverse:{socketId} -> {type}:{id}
 */

import Redis from 'ioredis';

const SOCKET_PREFIX = 'socket';
const DRIVER_PREFIX = 'driver';
const USER_PREFIX = 'user';
const REVERSE_PREFIX = 'reverse';
const SOCKET_TTL = 86400; // 24 hours

export interface SocketEntry {
  type: 'driver' | 'user';
  id: string;
  socketId: string;
}

export class RedisSocketManager {
  private redis: Redis;
  private localCache: Map<string, SocketEntry> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Register a driver socket
   */
  async registerDriver(driverId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Get existing socket for this driver
    const existingSocketId = await this.redis.hget(
      `${SOCKET_PREFIX}:${DRIVER_PREFIX}`,
      driverId
    );

    // Remove reverse mapping for existing socket
    if (existingSocketId) {
      pipeline.hdel(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, existingSocketId);
    }

    // Set new mappings
    pipeline.hset(`${SOCKET_PREFIX}:${DRIVER_PREFIX}`, driverId, socketId);
    pipeline.hset(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, socketId, `driver:${driverId}`);
    pipeline.expire(`${SOCKET_PREFIX}:${DRIVER_PREFIX}`, SOCKET_TTL);
    pipeline.expire(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, SOCKET_TTL);

    await pipeline.exec();

    // Update local cache
    this.localCache.set(socketId, { type: 'driver', id: driverId, socketId });

    logger.info(`[SocketManager] Driver registered: ${driverId} -> ${socketId}`);
  }

  /**
   * Register a user socket
   */
  async registerUser(userId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Get existing socket for this user
    const existingSocketId = await this.redis.hget(
      `${SOCKET_PREFIX}:${USER_PREFIX}`,
      userId
    );

    // Remove reverse mapping for existing socket
    if (existingSocketId) {
      pipeline.hdel(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, existingSocketId);
    }

    // Set new mappings
    pipeline.hset(`${SOCKET_PREFIX}:${USER_PREFIX}`, userId, socketId);
    pipeline.hset(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, socketId, `user:${userId}`);
    pipeline.expire(`${SOCKET_PREFIX}:${USER_PREFIX}`, SOCKET_TTL);
    pipeline.expire(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, SOCKET_TTL);

    await pipeline.exec();

    // Update local cache
    this.localCache.set(socketId, { type: 'user', id: userId, socketId });

    logger.info(`[SocketManager] User registered: ${userId} -> ${socketId}`);
  }

  /**
   * Unregister a socket
   */
  async unregister(socketId: string): Promise<void> {
    // Get entry from local cache or reverse lookup
    let entry = this.localCache.get(socketId);

    if (!entry) {
      const reverse = await this.redis.hget(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, socketId);
      if (!reverse) return;

      const [type, id] = reverse.split(':');
      entry = { type: type as 'driver' | 'user', id, socketId };
    }

    const pipeline = this.redis.pipeline();

    // Remove from type hash
    const prefix = entry.type === 'driver' ? DRIVER_PREFIX : USER_PREFIX;
    pipeline.hdel(`${SOCKET_PREFIX}:${prefix}`, entry.id);

    // Remove reverse mapping
    pipeline.hdel(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, socketId);

    await pipeline.exec();

    // Update local cache
    this.localCache.delete(socketId);

    logger.info(`[SocketManager] Socket unregistered: ${socketId}`);
  }

  /**
   * Get socket ID for a driver
   */
  async getDriverSocket(driverId: string): Promise<string | null> {
    // Check local cache first
    for (const [socketId, entry] of this.localCache.entries()) {
      if (entry.type === 'driver' && entry.id === driverId) {
        return socketId;
      }
    }

    // Fallback to Redis
    return this.redis.hget(`${SOCKET_PREFIX}:${DRIVER_PREFIX}`, driverId);
  }

  /**
   * Get socket ID for a user
   */
  async getUserSocket(userId: string): Promise<string | null> {
    // Check local cache first
    for (const [socketId, entry] of this.localCache.entries()) {
      if (entry.type === 'user' && entry.id === userId) {
        return socketId;
      }
    }

    // Fallback to Redis
    return this.redis.hget(`${SOCKET_PREFIX}:${USER_PREFIX}`, userId);
  }

  /**
   * Get all online drivers
   */
  async getOnlineDrivers(): Promise<string[]> {
    const drivers = await this.redis.hgetall(`${SOCKET_PREFIX}:${DRIVER_PREFIX}`);
    return Object.keys(drivers);
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<string[]> {
    const users = await this.redis.hgetall(`${SOCKET_PREFIX}:${USER_PREFIX}`);
    return Object.keys(users);
  }

  /**
   * Get online count
   */
  async getOnlineCount(): Promise<{ drivers: number; users: number }> {
    const [drivers, users] = await Promise.all([
      this.redis.hlen(`${SOCKET_PREFIX}:${DRIVER_PREFIX}`),
      this.redis.hlen(`${SOCKET_PREFIX}:${USER_PREFIX}`),
    ]);

    return { drivers, users };
  }

  /**
   * Broadcast to all drivers
   */
  async broadcastToDrivers(event: string, data: any): Promise<number> {
    const drivers = await this.getOnlineDrivers();
    let count = 0;

    for (const driverId of drivers) {
      const socketId = await this.getDriverSocket(driverId);
      if (socketId) {
        // Emit via Socket.IO server (external)
        count++;
      }
    }

    return count;
  }

  /**
   * Heartbeat to keep socket alive
   */
  async heartbeat(socketId: string): Promise<void> {
    const entry = this.localCache.get(socketId);
    if (!entry) return;

    // Refresh TTL
    const prefix = entry.type === 'driver' ? DRIVER_PREFIX : USER_PREFIX;
    await Promise.all([
      this.redis.expire(`${SOCKET_PREFIX}:${prefix}`, SOCKET_TTL),
      this.redis.expire(`${SOCKET_PREFIX}:${REVERSE_PREFIX}`, SOCKET_TTL),
    ]);
  }

  /**
   * Cleanup stale entries (run periodically)
   */
  async cleanup(): Promise<{ drivers: number; users: number }> {
    const initialCount = await this.getOnlineCount();

    // This would typically check against an actual connected sockets list
    // For now, just return counts

    return initialCount;
  }
}
