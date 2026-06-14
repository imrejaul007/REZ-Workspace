/**
 * Cache Service - Redis with Memory Fallback
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const TTL = {
  intent: 300,
  behavior: 600,
  segments: 1800,
  recommendations: 600,
  default: 300,
};

export class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private redisClient: unknown = null;
  private connected = false;

  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      // Redis connection would go here
      // For now, use memory cache
      this.connected = false;
      logger.info('[Cache] Using memory cache (Redis not connected)');
    } catch {
      this.connected = false;
      logger.info('[Cache] Redis unavailable, using memory cache');
    }
  }

  async disconnect(): Promise<void> {
    this.memoryCache.clear();
    this.connected = false;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl = TTL.default): Promise<void> {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup if too large
    if (this.memoryCache.size > 1000) {
      const entries = [...this.memoryCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      this.memoryCache = new Map(entries);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async getIntent(userId: string) {
    return this.get(`intent:${userId}`);
  }

  async setIntent(userId: string, data: unknown) {
    await this.set(`intent:${userId}`, data, TTL.intent);
  }

  async getBehavior(userId: string) {
    return this.get(`behavior:${userId}`);
  }

  async setBehavior(userId: string, data: unknown) {
    await this.set(`behavior:${userId}`, data, TTL.behavior);
  }

  async getSegments(key: string) {
    return this.get(`segments:${key}`);
  }

  async setSegments(key: string, data: unknown) {
    await this.set(`segments:${key}`, data, TTL.segments);
  }

  async getRecommendations(userId: string) {
    return this.get(`recs:${userId}`);
  }

  async setRecommendations(userId: string, data: unknown) {
    await this.set(`recs:${userId}`, data, TTL.recommendations);
  }

  getStats() {
    return {
      memorySize: this.memoryCache.size,
      redisConnected: this.connected,
    };
  }
}
